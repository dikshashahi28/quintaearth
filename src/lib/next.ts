// Where to send someone after signing in or saving: only a path on this site. Browsers drop tabs and newlines
// from URLs ("/\t/evil.com" becomes "//evil.com"), so any control character, a backslash or a second leading
// slash disqualifies the value outright.
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || next.length > 200 || !next.startsWith('/') || /[\u0000-\u001f\u007f\\]/.test(next) || next.startsWith('//')) return fallback;
  try {
    const base = 'https://quintaearth.invalid';
    const u = new URL(next, base);
    return u.origin === base ? `${u.pathname}${u.search}${u.hash}` : fallback;
  } catch {
    return fallback;
  }
}
