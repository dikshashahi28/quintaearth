// Site photographs from R2 (uploaded by scripts/media/build-media.mjs under "site/"). File names carry a hash of the
// bytes and are never reused, so every answer is cached for a year, at the edge too.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const NAME = /^[a-z0-9-]+-[0-9a-f]{8}-(\d+\.webp|share\.jpg)$/;

export const GET: APIRoute = async ({ params, request }) => {
  const file = params.key ?? '';
  if (!NAME.test(file)) return new Response('Not found', { status: 404 });
  const edge = (globalThis as { caches?: CacheStorage & { default?: Cache } }).caches?.default;
  const hit = edge && (await edge.match(request));
  if (hit) return hit;
  const obj = await env.FILES.get(`site/${file}`);
  if (!obj) return new Response('Not found', { status: 404 });
  const res = new Response(obj.body as unknown as ReadableStream, {
    headers: {
      'Content-Type': file.endsWith('.jpg') ? 'image/jpeg' : 'image/webp',
      'Content-Length': String(obj.size),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
  if (edge && request.method === 'GET') await edge.put(request, res.clone());
  return res;
};
