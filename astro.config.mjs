// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import { readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { redirects } from './src/data/redirects.mjs';

// The site is served from quintaearth.com (base "/") once the domain is connected,
// and from dikshashahi28.github.io/quintaearth (base "/quintaearth/") until then.
// CI sets SITE_URL and BASE_PATH; local builds default to the custom domain.
const site = process.env.SITE_URL ?? 'https://quintaearth.com';
const base = process.env.BASE_PATH ?? '/';

// Astro does not prefix redirect destinations with `base`, so a stub built for /quintaearth/ would
// send visitors to the domain root. Prefix them here.
const withBase = (/** @type {string} */ path) => `${base.replace(/\/$/, '')}${path}`;
const baseRedirects = Object.fromEntries(Object.entries(redirects).map(([from, to]) => [from, withBase(to)]));

export default defineConfig({
  site,
  base,
  // Pages stay prerendered by default; account pages opt out with `export const prerender = false`
  // and run on the Worker. Images are still optimised with sharp at build time, in Node.
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node' }),
  // login uses its own cookie; Astro sessions (and the KV namespace they need) stay off
  session: false,
  // uploads go through actions; the largest allowed file is 10 MB (evidence), plus room for the other form fields
  security: { actionBodySizeLimit: 11 * 1024 * 1024 },
  // "file" keeps every URL the old site published: /about.html, /energy-solar.html, ...
  build: { format: 'file', inlineStylesheets: 'auto' },
  trailingSlash: 'never',
  redirects: baseRedirects,
  // sitemap.xml and robots.txt are endpoints in src/pages, so their URLs match the .html canonicals
  integrations: [
    {
      // Cloudflare (Workers or Pages) reads dist/_redirects and answer old URLs with a real 301;
      // GitHub Pages ignores the file and the HTML forwarding pages do the job there.
      name: 'quintaearth-redirects-file',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          const lines = Object.entries(baseRedirects).flatMap(([from, to]) => [`${withBase(from)}.html ${to} 301`, `${withBase(from)} ${to} 301`]);
          // Cloudflare answers /about.html with a temporary redirect to /about; make every pre-revamp .html URL permanent
          const retired = new Set(Object.keys(redirects).map((from) => `${from.slice(1)}.html`));
          const pages = (await readdir(fileURLToPath(dir), { recursive: true }))
            .filter((f) => f.endsWith('.html') && f !== '404.html' && !retired.has(f));
          for (const f of pages.sort()) {
            const clean = f === 'index.html' ? '' : f.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
            lines.push(`${withBase(`/${f}`)} ${withBase(`/${clean}`)} 301`);
          }
          await writeFile(new URL('_redirects', dir), `${lines.join('\n')}\n`);
        },
      },
    },
  ],
  devToolbar: { enabled: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
