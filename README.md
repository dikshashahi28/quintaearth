# QuintaEarth

The QuintaEarth website: one hub for everyone who works in, studies or cares about sustainability,
green tech and clean tech. Built with [Astro](https://astro.build) as a static site and published on
Cloudflare. The design system is in [DESIGN.md](DESIGN.md) ("Riverline"); the product brief is in
[PRODUCT.md](PRODUCT.md).

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm test         # type check, build, then check every internal link and every pre-revamp URL
```

Node 22.12 or newer. `pnpm build` writes the site to `dist/`.

## Where things live

| Path | What |
|---|---|
| `src/pages/` | One file per page. `[slug].astro` serves the 46 sub-category pages and the insight and press articles at the root, so their old URLs (`energy-solar.html`, `insight-*.html`) still work. |
| `src/content/stories/<sub-category>/` | Diksha's story library, one Markdown file per story. |
| `src/content/insights/`, `src/content/press/` | Insights essays and press desk notes. |
| `src/data/industries.ts` | The 8 industries and 46 sub-categories. Slugs are published URLs: do not rename them. |
| `src/data/redirects.mjs` | Old URLs that now forward to another page. |
| `src/data/site.ts` | Email, WhatsApp, socials, and the Google Apps Script form endpoints. |
| `src/styles/` | Tokens (`tokens.css`), base, header, footer, home and inner-page styles. |
| `src/scripts/` | Client-side behaviour: header menu, river, hero, industries carousel, meadow, forms. |
| `scripts/` | Link checker, list of pre-revamp URLs, story import tools. |

## Add content

- **Insight or press note:** add a Markdown file to `src/content/insights/` or `src/content/press/`. The file
  name becomes the URL. Front-matter fields are listed in `src/content.config.ts`; the build fails if one is
  missing or wrong.
- **Stories:** export the Drive "Showcase" folders, then run
  `python3 scripts/import-stories.py <export dir> . [image-sizes.json]` (needs PyYAML). Story images
  come from Wikimedia Commons: `scripts/story-image-sizes.py` finds a 1280px rendition of each,
  `scripts/fetch-story-images.py` downloads them to `src/assets/stories/`, and
  `scripts/compress-story-images.mjs` stores them as 1200px WebP. The build then makes the AVIF and WebP
  sizes each page uses.

## Deploy (Cloudflare)

The site runs as a Cloudflare Worker that only serves static files (`wrangler.jsonc`).

1. Cloudflare dashboard: Workers & Pages > the `quintaearth` app > Settings > Build: connect this repository.
2. Build command `pnpm build`, deploy command `npx wrangler deploy`, production branch `main`.
   Node comes from `.node-version` (22) and pnpm from `package.json`.
3. Settings > Domains & Routes: add `quintaearth.com` and `www.quintaearth.com`. The domain's DNS must be on
   Cloudflare first (move the nameservers at Spaceship).

What Cloudflare does with the build:
- Pages are served at clean URLs (`/about`).
- `dist/_redirects` (written by the build) sends every old `.html` URL to its clean URL and every retired page
  (`src/data/redirects.mjs`) to its new home, all with a 301.
- `public/_headers` caches hashed images and scripts for a year.
- To try the Cloudflare behaviour locally: `pnpm build && npx wrangler dev`.

`.github/workflows/check.yml` type-checks, builds and link-checks every push and pull request.

## Redirects

Retired URLs are listed once, in `src/data/redirects.mjs`. On Cloudflare they are real 301s through
`_redirects`; on GitHub Pages the build's forwarding pages (instant redirect, `noindex`, canonical to the
new page) do the job. `node scripts/export-redirects.mjs > redirects.csv` prints the same list for
Cloudflare Bulk Redirects, only needed if GitHub Pages keeps hosting behind Cloudflare.

## Forms

The partner, volunteer and review forms post JSON to Google Apps Script web apps that write to Google
Sheets (`src/data/site.ts`). Review sign-in needs `PUBLIC_GOOGLE_CLIENT_ID` set at build time; without it
the review form is hidden.
