// Fails the build when any page links to something that does not exist.
//   node scripts/check-links.mjs <dist dir> [--base /quintaearth/]
// Checks every internal href/src (including #fragments) in every built HTML file, and that every URL the
// pre-revamp site published (scripts/legacy-urls.txt) still resolves to a page or a redirect stub, and that
// every sitemap URL is a real page and every structured-data block is valid JSON.
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, dirname, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const dist = resolve(args[0] ?? 'dist');
const baseArg = args.indexOf('--base');
const base = baseArg >= 0 ? args[baseArg + 1] : '/';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const exists = async (p) => stat(p).then((s) => s.isFile(), () => false);
const files = await walk(dist);
const pages = files.filter((f) => f.endsWith('.html'));
const idsCache = new Map();
async function idsOf(file) {
  if (!idsCache.has(file)) {
    const html = await readFile(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}

/** map a URL path to a file in dist, or null when it points outside the site */
function toFile(pathname, fromFile) {
  let p = decodeURIComponent(pathname);
  if (p.startsWith('/')) {
    if (!p.startsWith(base)) return null;
    p = join(dist, p.slice(base.length));
  } else {
    p = join(dirname(fromFile), p);
  }
  if (p.endsWith('/') || p === dist) return join(p, 'index.html');
  // clean URLs: /about is served from about.html
  if (!/\.[a-z0-9]+$/i.test(p)) return `${p}.html`;
  return p;
}

const problems = [];
let checked = 0;
let ldBlocks = 0;
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const page = relative(dist, file);
  // structured data must parse, or search engines drop it silently
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(json); ldBlocks++; } catch { problems.push(`${page}: structured data is not valid JSON`); }
  }
  // skip inline scripts and JSON so template strings are not read as links
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  for (const m of markup.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const raw = m[1].replace(/&amp;/g, '&');
    if (!raw || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(raw) || raw.startsWith('//')) continue;
    checked++;
    const [pathPart, frag] = raw.split('#');
    const target = pathPart ? toFile(pathPart.split('?')[0], file) : file;
    if (!target) { problems.push(`${page}: ${raw} -> outside base ${base}`); continue; }
    if (!(await exists(target))) { problems.push(`${page}: ${raw} -> missing ${relative(dist, target)}`); continue; }
    if (frag && target.endsWith('.html') && !(await idsOf(target)).has(frag)) problems.push(`${page}: ${raw} -> no id="${frag}"`);
  }
}

// every sitemap entry must be a real page, not a redirect stub
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8').catch(() => '');
if (!sitemap) problems.push('sitemap.xml missing');
for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const target = toFile(new URL(loc).pathname, dist);
  if (!target || !(await exists(target))) { problems.push(`sitemap: ${loc} -> no page`); continue; }
  if ((await readFile(target, 'utf8')).includes('http-equiv="refresh"')) problems.push(`sitemap: ${loc} is a redirect stub`);
}

const legacy = (await readFile(new URL('./legacy-urls.txt', import.meta.url), 'utf8')).split('\n').filter(Boolean);
for (const url of legacy) if (!(await exists(join(dist, url)))) problems.push(`legacy URL gone: ${url}`);

console.log(`${pages.length} pages, ${checked} internal links, ${[...sitemap.matchAll(/<loc>/g)].length} sitemap URLs, ${ldBlocks} structured-data blocks, ${legacy.length} legacy URLs checked (base ${base})`);
if (problems.length) {
  console.error(`${problems.length} broken:\n${problems.slice(0, 200).join('\n')}`);
  process.exit(1);
}
console.log('0 broken links');
