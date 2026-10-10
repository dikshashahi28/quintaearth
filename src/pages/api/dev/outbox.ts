// Dev server only: the latest mail sent to ?to=, so local tests can follow sign-in and invitation links.
// import.meta.env.DEV is false in production builds, where this answers 404.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV) return new Response('Not found', { status: 404 });
  const { devOutbox } = await import('../../../lib/email');
  const to = url.searchParams.get('to');
  const mail = devOutbox.filter((m) => m.to === to).at(-1);
  return mail ? Response.json(mail) : new Response('Not found', { status: 404 });
};
