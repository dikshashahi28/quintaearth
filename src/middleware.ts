// Reads the login session for on-demand pages and guards the member area.
// Prerendered pages skip this entirely (no session at build time).
import { defineMiddleware } from 'astro:middleware';
import { HINT, hintCookie, initialsOf } from './lib/member-hint';

// the router also answers /dashboard.html, /dashboard/index.html and /welcome.html, so match on the clean path
const cleanPath = (path: string) => path.replace(/\/index\.html$/, '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';
const isMemberArea = (path: string) => {
  const p = cleanPath(path);
  return p === '/dashboard' || p.startsWith('/dashboard/') || p === '/welcome';
};
// admin pages are not advertised: anyone who is not an admin, signed out included, gets the site's normal 404
const isAdminArea = (path: string) => {
  const p = cleanPath(path);
  return p === '/admin' || p.startsWith('/admin/');
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.user = null;
  ctx.locals.session = null;
  if (ctx.isPrerendered || ctx.url.pathname.startsWith('/api/')) {
    const res = await next();
    // a prerendered page (the 404 page, when a member page returns 404) rendered inside a signed-in request still
    // carries the member's initials in its header, so it must not be cached; the cookie's presence is enough to know
    if (ctx.isPrerendered && (ctx.cookies.has('qe.session_token') || ctx.cookies.has('__Secure-qe.session_token'))) {
      res.headers.set('Cache-Control', 'private, no-store');
    }
    return res;
  }

  // Signed-out visitors get identical HTML for the public directory and profile/company pages (the header initials
  // are filled in the browser from a cookie, not baked into the HTML), so serve those from the edge cache. `caches`
  // is a Worker global; guard it so `astro dev` (no Cache API) simply skips caching.
  const noSession = !(ctx.cookies.has('qe.session_token') || ctx.cookies.has('__Secure-qe.session_token'));
  const cachePath = cleanPath(ctx.url.pathname);
  const edgeCacheable = noSession && ctx.request.method === 'GET'
    && (cachePath === '/directory' || /^\/people\/[^/]+$/.test(cachePath) || /^\/companies\/[^/]+$/.test(cachePath));
  // only in the built Worker: `astro dev` must not cache, or the harness could read a stale public page
  const edgeCache = edgeCacheable && !import.meta.env.DEV && typeof caches !== 'undefined' ? await caches.open('qe:public') : null;
  const cacheKey = edgeCache ? new Request(ctx.url.toString(), { method: 'GET' }) : null;
  if (edgeCache && cacheKey) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) return hit;
  }

  // imported here so the build-time prerender never loads Worker-only modules
  const { auth } = await import('./lib/auth');
  // returnHeaders: the library may refresh the session cookies, and those must reach the browser
  // the member area, admin pages, uploaded files and every write (form posts, actions) read the session from the
  // database, so a revoked session (signed out elsewhere, or ended by a password change), a removed admin role or a
  // stale name never acts or opens a private file; plain public page views use the signed cookie copy and skip that read
  const path = ctx.url.pathname;
  const writes = ctx.request.method !== 'GET' && ctx.request.method !== 'HEAD';
  const { headers: authHeaders, response: found } = await auth.api.getSession({
    headers: ctx.request.headers,
    query: { disableCookieCache: writes || isMemberArea(path) || isAdminArea(path) || path.startsWith('/files/') || path.startsWith('/_actions/') },
    returnHeaders: true,
  });
  ctx.locals.user = found?.user ?? null;
  ctx.locals.session = found?.session ?? null;

  let res: Response;
  if (isMemberArea(path) && !found) res = ctx.redirect(`/signin?next=${encodeURIComponent(path + ctx.url.search)}`);
  else if (isMemberArea(path) && !found!.user.accountType && cleanPath(path) !== '/welcome') res = ctx.redirect('/welcome');
  // a bodyless 404 is answered with the site's 404 page
  else if (isAdminArea(path) && found?.user.role !== 'admin') res = new Response(null, { status: 404 });
  else if (isAdminArea(path) && !found!.user.accountType) res = ctx.redirect('/welcome');
  else res = await next();
  // some responses come back with immutable headers (the dev server's /_image, fetched assets): copy them first
  res = withMutableHeaders(res);

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
  // /files and /media set their own cache header per asset (immutable for public, no-store for private); the
  // signed-in override below must not stomp it, or members re-download every image on each view.
  const routeManagesCache = path.startsWith('/files/') || path.startsWith('/media/');
  // member pages are personal, and any page rendered for a signed-in member carries their initials: never cache them
  if (!routeManagesCache && (isMemberArea(path) || isAdminArea(path) || cleanPath(path) === '/signin' || cleanPath(path).startsWith('/signin/') || ctx.locals.user)) {
    res.headers.set('Cache-Control', 'private, no-store');
  }
  // store a signed-out 200 for the public pages identified above (no Set-Cookie, so nothing personal leaks)
  if (edgeCache && cacheKey && !ctx.locals.user && res.status === 200 && res.headers.getSetCookie().length === 0) {
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    await edgeCache.put(cacheKey, res.clone());
  }
  return res;
});

function withMutableHeaders(res: Response): Response {
  try {
    res.headers.set('X-Qe-Probe', '1');
    res.headers.delete('X-Qe-Probe');
    return res;
  } catch {
    return new Response(res.body, res);
  }
}
