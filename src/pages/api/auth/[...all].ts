import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';

export const prerender = false;

// Only the routes the site uses are reachable over HTTP. Everything else (sign-in requests, account setup)
// goes through our own actions, which validate input and keep the search index in step. The library's other
// endpoints, such as update-user, would let a member change their name and skip both.
// Google sends the member back to the callback after they choose an account (sign-in with Google starts in an action).
// Email links are spent by /signin/link after a click, never by a GET here (mail scanners prefetch links).
const allowed = new Set(['GET /api/auth/callback/google', 'GET /api/auth/get-session', 'POST /api/auth/sign-out']);

export const ALL: APIRoute = async ({ request, redirect }) => {
  const { pathname } = new URL(request.url);
  // a Google answer that cannot be matched to a sign-in (expired or missing state) lands on the library's own
  // error page; send the member back to sign in with our message instead
  if (request.method === 'GET' && pathname.replace(/\/+$/, '') === '/api/auth/error') return redirect('/signin?error=google', 302);
  if (!allowed.has(`${request.method} ${pathname.replace(/\/+$/, '')}`)) {
    // discard any unread body first: answering a POST without reading it can drop the connection
    await request.body?.cancel().catch(() => {});
    return new Response('Not found', { status: 404 });
  }
  return auth.handler(request);
};
