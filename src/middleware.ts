// Reads the login session for on-demand pages and guards the member area.
// Prerendered pages skip this entirely (no session at build time).
import { defineMiddleware } from 'astro:middleware';
import { HINT, hintCookie, initialsOf } from './lib/member-hint';

// the router also answers /dashboard.html, /dashboard/index.html and /welcome.html, so match on the clean path
const cleanPath = (path: string) => path.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
const isMemberArea = (path: string) => {
  const p = cleanPath(path);
  return p === '/dashboard' || p.startsWith('/dashboard/') || p === '/welcome' || p === '/admin' || p.startsWith('/admin/');
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.user = null;
  ctx.locals.session = null;
  if (ctx.isPrerendered || ctx.url.pathname.startsWith('/api/')) return next();

  // imported here so the build-time prerender never loads Worker-only modules
  const { auth } = await import('./lib/auth');
  // returnHeaders: the library may refresh the session cookies, and those must reach the browser
  // the member area and every write (form posts, actions) read the session from the database, so a revoked session,
  // a removed admin role or a stale name never acts; plain public page views use the signed cookie copy and skip that read
  const writes = ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD';
  const { headers: authHeaders, response: found } = await auth.api.getSession({
    headers: ctx.request.headers,
    query: { disableCookieCache: writes || isMemberArea(ctx.url.pathname) || ctx.url.pathname.startsWith('/_actions/') },
    returnHeaders: true,
  });
  ctx.locals.user = found?.user ?? null;
  ctx.locals.session = found?.session ?? null;

  const path = ctx.url.pathname;
  let res: Response;
  if (isMemberArea(path) && !found) res = ctx.redirect(`/signin?next=${encodeURIComponent(path + ctx.url.search)}`);
  else if (isMemberArea(path) && !found!.user.accountType && cleanPath(path) !== '/welcome') res = ctx.redirect('/welcome');
  // admin pages answer 404 to everyone else, so their existence is not advertised
  else if (cleanPath(path).startsWith('/admin') && found!.user.role !== 'admin') res = new Response(null, { status: 404 });
  else res = await next();

  // the page may have set or cleared a login cookie itself (e.g. dropping the cached session after setup);
  // the copy read at the start of the request is older, so it must not win
  const setByPage = new Set(res.headers.getSetCookie().map((c) => c.split('=')[0]));
  for (const cookie of authHeaders.getSetCookie()) if (!setByPage.has(cookie.split('=')[0])) res.headers.append('Set-Cookie', cookie);
  // keep the header's signed-in hint in step with the real session (see lib/member-hint)
  const hinted = ctx.cookies.get(HINT)?.value ?? null;
  const want = ctx.locals.user ? initialsOf(ctx.locals.user.name) : null;
  // the member area also renews it, so it lasts as long as an active session does
  if (!setByPage.has(HINT) && (hinted !== want || (want !== null && isMemberArea(path)))) {
    res.headers.append('Set-Cookie', hintCookie(want, ctx.url.protocol === 'https:'));
  }
  // member pages are personal, and any page rendered for a signed-in member carries their initials: never cache them
  if (isMemberArea(path) || cleanPath(path) === '/signin' || ctx.locals.user) res.headers.set('Cache-Control', 'private, no-store');
  return res;
});
