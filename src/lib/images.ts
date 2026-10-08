import type { ImageMetadata } from 'astro';

// Images live in src/assets so the build can resize them and re-encode them as AVIF and WebP.
type Module = { default: ImageMetadata };
const fileName = (path: string) => path.split('/').pop()!.replace(/\.[a-z]+$/, '');
const index = (modules: Record<string, Module>) => new Map(Object.entries(modules).map(([path, m]) => [fileName(path), m.default]));

/** Story photos fetched from Wikimedia Commons by scripts/fetch-story-images.py, keyed by story slug. */
const stories = index(import.meta.glob<Module>('../assets/stories/*.{jpg,png,webp,gif}', { eager: true }));
/** The Riverline photographs: valley, stones, industries, pond. */
const photos = index(import.meta.glob<Module>('../assets/photos/*.jpg', { eager: true }));

export const storyImage = (slug: string): ImageMetadata | undefined => stories.get(slug);

export function photo(name: string): ImageMetadata {
  const img = photos.get(name);
  if (!img) throw new Error(`No photo "${name}" in src/assets/photos`);
  return img;
}
