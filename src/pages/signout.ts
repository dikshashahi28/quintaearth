// POST from the dashboard's sign-out button: ends the session, clears the cookies, goes home.
import type { APIRoute } from 'astro';
import { auth } from '../lib/auth';
import { hintCookie } from '../lib/member-hint';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const res = await auth.api.signOut({ headers: request.headers, asResponse: true });
  const out = new Response(null, { status: 303, headers: { Location: '/' } });
  for (const cookie of res.headers.getSetCookie()) out.headers.append('Set-Cookie', cookie);
  out.headers.append('Set-Cookie', hintCookie(null, new URL(request.url).protocol === 'https:'));
  return out;
};

// a typed or bookmarked /signout lands somewhere useful; signing out itself stays a POST
export const GET: APIRoute = ({ redirect }) => redirect('/dashboard', 303);
