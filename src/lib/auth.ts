// Login: email and password, with one-time email links to confirm a new address or reset a password.
// Sessions live in D1. Server-only.
// The library's endpoints are served at /api/auth/* by src/pages/api/auth/[...all].ts.
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins/magic-link';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { sendMail, signInLinkMail } from './email';
import { hashPassword, verifyPassword } from './password';

/** whether the Google button is offered: both halves of the Google client must be configured */
export const googleSignIn = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
/** whether "Continue with LinkedIn" is offered: both halves of the LinkedIn client must be configured */
export const linkedinSignIn = !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET);

export const auth = betterAuth({
  appName: 'QuintaEarth',
  baseURL: env.SITE_URL,
  basePath: '/api/auth',
  secret: env.AUTH_SECRET,
  // D1 has no interactive transactions
  database: drizzleAdapter(db, { provider: 'sqlite', schema, transaction: false }),
  user: {
    additionalFields: {
      accountType: { type: 'string', required: false, input: false },
      role: { type: 'string', required: false, input: false, defaultValue: 'member' },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    // a signed copy of the session in a cookie spares a database read on most requests
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  // a password is set only after the email link has proved the address (welcome page or /dashboard/password),
  // so the library's own sign-up is off and every password account is already verified
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    password: { hash: hashPassword, verify: verifyPassword },
  },
  // "Continue with Google": on only where both secrets are set (wrangler secret put GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
  // Google's redirect URI for the client is `${SITE_URL}/api/auth/callback/google`. A Google account whose address
  // matches an existing member is linked to that member (Google vouches for the address, and ours was proved by link).
  // "Continue with LinkedIn" the same way (LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET; redirect URI
  // `${SITE_URL}/api/auth/callback/linkedin`). A member with a LinkedIn account linked earns the person
  // "Identity checked" badge (src/lib/person-identity.ts); a signed-in member links one from the profile editor.
  socialProviders: {
    ...(googleSignIn ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: 'select_account' as const } } : {}),
    ...(linkedinSignIn ? { linkedin: { clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET } } : {}),
  },
  // a signed-in member may link a LinkedIn account whose email differs from theirs (LinkedIn vouches for the person).
  // Only Google is trusted to vouch for an address: a trusted provider's login is linked to the member with the same
  // email even when the provider says that email is unverified. LinkedIn is not trusted, so a LinkedIn login links to
  // an existing member (and a signed-in member links LinkedIn) only when LinkedIn reports the email as verified;
  // otherwise anyone could add a member's address to a LinkedIn account and sign in as that member.
  account: { accountLinking: { enabled: true, trustedProviders: ['google'], allowDifferentEmails: true } },
  advanced: { cookiePrefix: 'qe' },
  telemetry: { enabled: false },
  plugins: [
    magicLink({
      expiresIn: 10 * 60,
      // only a hash of each link is stored, so a database copy cannot be used to sign in
      storeToken: 'hashed',
      // the email points at our own page (src/pages/signin/link.astro), which spends the token only when the person
      // presses Continue; the library's verify address would spend it on any GET, such as a mail scanner's prefetch
      sendMagicLink: async ({ email, url }) => {
        const link = new URL('/signin/link', env.SITE_URL);
        link.search = new URL(url).search;
        link.searchParams.delete('errorCallbackURL');
        await sendMail(signInLinkMail(email, link.toString()));
      },
    }),
  ],
});

export type SessionUser = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;

/**
 * Drops the signed cookie copy of the session so the next request reads the user from the database.
 * The deleting cookie must carry the same attributes (Secure, the __Secure- prefix in production) or browsers ignore it.
 */
export async function dropSessionCache(cookies: import('astro').AstroCookies): Promise<void> {
  const { name, attributes } = (await auth.$context).authCookies.sessionData;
  const { secure, sameSite, path, httpOnly, domain } = attributes as { secure?: boolean; sameSite?: 'lax' | 'strict' | 'none'; path?: string; httpOnly?: boolean; domain?: string };
  cookies.delete(name, { secure, sameSite, path: path ?? '/', httpOnly, domain });
}

/** copies the library's Set-Cookie headers onto the page's response (sign-in runs inside an action, not its own route) */
export function applyAuthCookies(cookies: import('astro').AstroCookies, headers: Headers): void {
  for (const line of headers.getSetCookie()) {
    const [pair, ...parts] = line.split(';').map((p) => p.trim());
    const at = pair!.indexOf('=');
    const name = pair!.slice(0, at);
    const value = decodeURIComponent(pair!.slice(at + 1));
    const opts: import('astro').AstroCookieSetOptions = { encode: encodeURIComponent };
    for (const part of parts) {
      const [k, v] = part.split('=');
      const key = k!.toLowerCase();
      if (key === 'max-age') opts.maxAge = Number(v);
      else if (key === 'path') opts.path = v;
      else if (key === 'domain') opts.domain = v;
      else if (key === 'httponly') opts.httpOnly = true;
      else if (key === 'secure') opts.secure = true;
      else if (key === 'samesite') opts.sameSite = v!.toLowerCase() as 'lax' | 'strict' | 'none';
      else if (key === 'expires') opts.expires = new Date(v!);
    }
    cookies.set(name, value, opts);
  }
}
