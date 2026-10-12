// Renders the default share image (1200x630): the hero's valley illustration (src/components/home/HeroScene.astro:
// sky, sun, clouds, birds, hills, turbines, river, reeds) with the wordmark (public/assets/logo.png) on the sky.
// Writes scripts/media/og-share.png, which sources.json lists as the "og-share" photo; then run build-media.mjs.
//
//   node scripts/media/render-og-share.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const W = 1200, H = 630;
const hero = readFileSync(join(root, 'src/components/home/HeroScene.astro'), 'utf8');

// the land: everything inside the "land" SVG, minus the phone-only turbine (the desktop drawing has three)
const land = hero.slice(hero.indexOf('<svg class="land"'), hero.lastIndexOf('</svg>'))
  .replace(/^<svg[^>]*>/, '')
  .replace(/<g class="phone-only"[\s\S]*?<\/g><\/g><circle[^>]*\/><\/g>/, '');
if (!land.includes('riverClip') || land.includes('phone-only')) throw new Error('HeroScene.astro changed shape: update render-og-share.mjs');

// the drawing is 1440x860 with the land pinned to the bottom; 1200x630 shows the middle band of it. The clouds
// and the sun move by CSS on the page, so they are placed here by hand (the desktop sun sits right of the headline).
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 104 1440 756">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7faf2"/><stop offset="1" stop-color="#e3eedd"/></linearGradient>
    <radialGradient id="halo"><stop offset="0" stop-color="#d9b85a" stop-opacity=".5"/><stop offset="1" stop-color="#d9b85a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1440" height="860" fill="url(#sky)"/>
  <circle cx="1150" cy="300" r="160" fill="url(#halo)"/><circle cx="1150" cy="300" r="46" fill="#d9b85a"/>
  <g fill="#fff" opacity=".85" transform="translate(330 60)"><ellipse cx="0" cy="190" rx="92" ry="20"/><ellipse cx="38" cy="176" rx="52" ry="26"/><ellipse cx="-34" cy="180" rx="40" ry="20"/></g>
  <g fill="#fff" opacity=".7" transform="translate(760 140)"><ellipse cx="0" cy="120" rx="70" ry="15"/><ellipse cx="26" cy="108" rx="40" ry="20"/></g>
  <g fill="#fff" opacity=".6" transform="translate(1320 110)"><ellipse cx="0" cy="300" rx="60" ry="12"/><ellipse cx="18" cy="292" rx="30" ry="14"/></g>
  <g fill="none" stroke="#4d6e3d" stroke-width="2" stroke-linecap="round" transform="translate(-120 150)"><path d="M1140 100 q7 -7 14 0 q7 -7 14 0"/><path d="M1174 114 q6 -6 12 0 q6 -6 12 0"/><path d="M1152 128 q5 -5 10 0 q5 -5 10 0"/></g>
  ${land}
</svg>`;

const logo = await sharp(join(root, 'public/assets/logo.png')).resize({ width: 470 }).png().toBuffer();
const { height: logoH } = await sharp(logo).metadata();
const out = join(root, 'scripts/media/og-share.png');
await sharp(Buffer.from(svg)).png()
  .composite([{ input: logo, left: 88, top: Math.round(236 - (logoH ?? 100) / 2) }])
  .png({ compressionLevel: 9 })
  .toFile(out);
writeFileSync(join(root, '.media-cache', 'og-share.svg'), svg);
console.log(`wrote ${out} (${W}x${H})`);
