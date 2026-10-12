import type { ImageMetadata } from 'astro';

// Story images live in src/assets so the build can resize them and re-encode them as AVIF and WebP.
// The site's own photographs are not here: they come from Cloudflare R2 by name (src/lib/media.ts, <Media>).
type Module = { default: ImageMetadata };
const fileName = (path: string) => path.split('/').pop()!.replace(/\.[a-z]+$/, '');
const index = (modules: Record<string, Module>) => new Map(Object.entries(modules).map(([path, m]) => [fileName(path), m.default]));

/** Story photos fetched from Wikimedia Commons by scripts/fetch-story-images.py, keyed by story slug. */
const stories = index(import.meta.glob<Module>('../assets/stories/*.{jpg,png,webp,gif}', { eager: true }));

export const storyImage = (slug: string): ImageMetadata | undefined => stories.get(slug);
