// The "check your email" note after a sign-in link is sent (join, sign in by link). What was posted rides in a
// short-lived cookie, never the URL: the page after the redirect can name the address, and "Send it again" can
// post the same link (with the name and type the sign-up form gave) without the member typing anything twice.
import type { AstroCookies } from 'astro';

const SENT = 'qe.sent';
/** as long as the link itself lives */
const TEN_MINUTES = 600;

export interface Sent { email: string; name: string; type: string }

export function rememberSent(cookies: AstroCookies, sent: Sent, secure: boolean) {
  cookies.set(SENT, JSON.stringify(sent), { path: '/', maxAge: TEN_MINUTES, httpOnly: true, sameSite: 'lax', secure });
}

/** what was sent, or null once the cookie has timed out */
export function readSent(cookies: AstroCookies): Sent | null {
  const raw = cookies.get(SENT)?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v && typeof v.email === 'string' && v.email) return { email: v.email, name: String(v.name ?? ''), type: String(v.type ?? '') };
  } catch { /* not ours */ }
  return null;
}
