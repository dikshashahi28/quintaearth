import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';

export const prerender = false;

// Only the routes the site uses are reachable over HTTP. Everything else (sign-in requests, account setup)
// goes through our own actions, which validate input and keep the search index in step. The library's other
// endpoints, such as update-user, would let a member change their name and skip both.
const allowed = new Set(['GET /api/auth/magic-link/verify', 'GET /api/auth/get-session', 'POST /api/auth/sign-out']);

export const ALL: APIRoute = ({ request }) => {
  const { pathname } = new URL(request.url);
  if (!allowed.has(`${request.method} ${pathname.replace(/\/+$/, '')}`)) return new Response('Not found', { status: 404 });
  return auth.handler(request);
};
