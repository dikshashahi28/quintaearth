// Builds the site's photographs and puts them in Cloudflare R2, where the app serves them from /media/<file>.
//
//   node scripts/media/build-media.mjs                 make the sizes and write src/data/media.json (no upload)
//   node scripts/media/build-media.mjs --local         ...and upload to the dev server's bucket (.wrangler/state)
//   node scripts/media/build-media.mjs --remote --env dev   ...and to dev.quintaearth.com's bucket
//   node scripts/media/build-media.mjs --remote        ...and to quintaearth.com's bucket
//
// Each photo in scripts/media/sources.json comes from a file in the repo ("file") or from Unsplash ("unsplash", an
// id; downloaded once into .media-cache/). It is cut to WebP widths up to its own width. File names carry a hash of
// the bytes, so a changed photo gets a new URL and the year-long browser cache never shows a stale one.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const local = args.includes('--local'), remote = args.includes('--remote');
const envName = args.includes('--env') ? args[args.indexOf('--env') + 1] : null;
const bucket = remote && envName === 'dev' ? 'quintaearth-files-dev' : 'quintaearth-files';
const WIDTHS = [480, 800, 1200, 1600, 2000, 2600];
const cacheDir = join(root, '.media-cache');
mkdirSync(join(cacheDir, 'out'), { recursive: true });

const sources = JSON.parse(readFileSync(join(root, 'scripts/media/sources.json'), 'utf8'));
const names = new Set();
const manifest = {};
const uploads = [];

async function original(src) {
  if (src.file) return readFileSync(join(root, src.file));
  const path = join(cacheDir, `${src.unsplash}.jpg`);
  if (!existsSync(path)) {
    // the official download endpoint: it redirects to the full-size file and counts the download for the photographer
    const res = await fetch(`https://unsplash.com/photos/${src.unsplash}/download?force=true`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`Unsplash ${src.unsplash}: ${res.status}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  return readFileSync(path);
}

for (const src of sources) {
  if (names.has(src.name)) throw new Error(`"${src.name}" is listed twice in sources.json`);
  names.add(src.name);
  const bytes = await original(src);
  const hash = createHash('sha256').update(bytes).update(JSON.stringify(src.crop ?? null)).digest('hex').slice(0, 8);
  let img = sharp(bytes).rotate();
  if (src.crop) img = img.extract(src.crop); // { left, top, width, height } in original pixels, when a slot needs it
  const { width, height } = await img.clone().toBuffer({ resolveWithObject: true }).then((r) => r.info);
  const widths = WIDTHS.filter((w) => w < width).concat(Math.min(width, WIDTHS.at(-1)));
  const set = {};
  for (const w of [...new Set(widths)]) {
    const file = `${src.name}-${hash}-${w}.webp`;
    const out = join(cacheDir, 'out', file);
    if (!existsSync(out)) await img.clone().resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(out);
    set[w] = file;
    uploads.push({ key: `site/${file}`, path: out });
  }
  // a 1200px JPEG for link previews: LinkedIn and WhatsApp do not reliably show WebP share images
  const share = `${src.name}-${hash}-share.jpg`;
  const shareOut = join(cacheDir, 'out', share);
  if (!existsSync(shareOut)) await img.clone().resize({ width: 1200, height: 630, fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(shareOut);
  uploads.push({ key: `site/${share}`, path: shareOut, type: 'image/jpeg' });
  manifest[src.name] = { width, height, alt: src.alt ?? '', focal: src.focal ?? '50% 50%', files: set, share, credit: src.credit ?? null };
}

writeFileSync(join(root, 'src/data/media.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`${Object.keys(manifest).length} photos, ${uploads.length} files -> src/data/media.json`);

if (local || remote) {
  const target = local ? ['--local'] : ['--remote'];
  for (const u of uploads) {
    execFileSync('pnpm', ['-s', 'wrangler', 'r2', 'object', 'put', `${bucket}/${u.key}`, '--file', u.path,
      '--content-type', u.type ?? 'image/webp', '--cache-control', 'public, max-age=31536000, immutable', ...target,
      ...(envName ? ['--env', envName] : [])], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
  }
  console.log(`uploaded ${uploads.length} files to ${bucket} (${local ? 'local' : 'remote'})`);
}
