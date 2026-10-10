// Most pages are prerendered, so the header cannot ask the server who is signed in. The login cookies are
// HttpOnly, so the page cannot read them either. This small readable cookie carries only the member's initials:
// the header shows the profile icon when it is present and "Sign in" when it is not. It grants nothing; the
// dashboard still checks the real session and clears this cookie when there is none.
export const HINT = 'qe.me';
const MAX_AGE = 60 * 60 * 24 * 30; // the session's own lifetime

/** up to two initials, letters and digits only, so the value is safe to print in HTML and CSS */
export function initialsOf(name: string | null | undefined): string {
  const out = (name ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => [...w][0]!.toUpperCase()).join('');
  return /^[\p{L}\p{N}]{1,2}$/u.test(out) ? out : 'Me';
}

export function hintCookie(initials: string | null, secure: boolean): string {
  const attrs = `Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
  return initials === null
    ? `${HINT}=; Max-Age=0; ${attrs}`
    : `${HINT}=${encodeURIComponent(initials)}; Max-Age=${MAX_AGE}; ${attrs}`;
}
