// Where to send someone after signing in or saving: only a path on this site. Browsers drop tabs and newlines
// from URLs ("/\t/evil.com" becomes "//evil.com"), so any control character, a backslash or a second leading
// slash disqualifies the value outright. Dot segments can also collapse into a second slash ("/.//evil.com" and
// "/a/..//evil.com" both normalise to "//evil.com"), so the normalised result is checked again before it is used.
const BASE = 'https://quintaearth.invalid';
const offSite = (path: string) => !path.startsWith('/') || path.startsWith('//') || /[\u0000-\u001f\u007f\\]/.test(path);

export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || next.length > 200 || offSite(next)) return fallback;
  try {
    const u = new URL(next, BASE);
    if (u.origin !== BASE) return fallback;
    const out = `${u.pathname}${u.search}${u.hash}`;
    return !offSite(out) && new URL(out, BASE).origin === BASE ? out : fallback;
  } catch {
    return fallback;
  }
}
