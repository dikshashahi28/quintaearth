import manifest from '../data/media.json';

// Site photographs live in Cloudflare R2 and are served by src/pages/media/[...key].ts.
// scripts/media/build-media.mjs makes the sizes, uploads them and writes src/data/media.json.
export type MediaName = keyof typeof manifest;
type Entry = { width: number; height: number; alt: string; focal: string; files: Record<string, string>; share: string; credit: unknown };

export function media(name: string): Entry {
  const m = (manifest as Record<string, Entry>)[name];
  if (!m) throw new Error(`No photo "${name}" in src/data/media.json (scripts/media/sources.json)`);
  return m;
}

const url = (file: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/media/${file}`;

/** the URL of the smallest size at least `width` wide (or the largest there is) */
export function mediaUrl(name: string, width = 1600): string {
  const files = media(name).files;
  const ws = Object.keys(files).map(Number).sort((a, b) => a - b);
  return url(files[ws.find((w) => w >= width) ?? ws.at(-1)!]);
}

export function mediaSrcset(name: string): string {
  return Object.entries(media(name).files).map(([w, f]) => `${url(f)} ${w}w`).join(', ');
}

/** a 1200x630 JPEG for link previews (og:image) */
export const mediaShareUrl = (name: string): string => url(media(name).share);
