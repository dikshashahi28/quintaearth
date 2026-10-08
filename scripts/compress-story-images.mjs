// Store each story photo as a 1200px-wide WebP so the repository stays small. The build still makes the
// AVIF/WebP sizes the pages use; this only shrinks the source copy. Run after fetch-story-images.py.
//   node scripts/compress-story-images.mjs
import { readdir, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const dir = new URL('../src/assets/stories/', import.meta.url).pathname;
let before = 0, after = 0;
for (const name of await readdir(dir)) {
  if (!/\.(jpe?g|png|gif)$/i.test(name)) continue;
  const src = join(dir, name);
  const out = join(dir, name.replace(/\.[a-z]+$/i, '.webp'));
  before += (await stat(src)).size;
  await sharp(src, { animated: false }).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  after += (await stat(out)).size;
  await rm(src);
}
console.log(`${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
