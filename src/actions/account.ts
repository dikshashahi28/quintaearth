// Server code behind the sign-in and account forms. Forms post here without client JavaScript.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, gt, isNull, like, lt, ne, or } from 'drizzle-orm';
import { newPassword, optText, reqText } from '../lib/validate';
import { safeNext } from '../lib/next';
import type { BatchItem } from 'drizzle-orm/batch';


// password guessing, counted three ways over 15 minutes: one email from one network address (8: the usual lock),
// one network address across emails (30: spraying many accounts) and one email from anywhere (50: a spread-out
// attack). The first lock binds only the attacker's own address, so a stranger cannot lock a member out by
// guessing from elsewhere. Network addresses come from Cloudflare's cf-connecting-ip, which its edge sets.
const WINDOW = 15 * 60_000;
const failureKeys = (email: string, ip: string | null) => [
  { key: `pair:${email}|${ip ?? '-'}`, limit: 8 },
  ...(ip ? [{ key: `ip:${ip}`, limit: 30 }] : []),
  { key: `email:${email}`, limit: 50 },
];

/** a member's password row: one per member, with a fixed id so repeated or racing writes land on the same row */
const credentialId = (userId: string) => `credential-${userId}`;
async function savePassword(userId: string, password: string) {
  const { db, schema } = await import('../db/client');
  const { hashPassword } = await import('../lib/password');
  const hash = await hashPassword(password);
  const now = new Date();
  await db.insert(schema.account).values({ id: credentialId(userId), userId, accountId: userId, providerId: 'credential', password: hash, createdAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: schema.account.id, set: { password: hash, updatedAt: now } });
}

export const account = {
  /**
   * Emails a one-time link. A new address gets an account and goes on to /welcome (or first to the invitation it
   * came from), where it chooses a password; a known address goes to /dashboard/password to choose a new one.
   */
  sendSignInLink: defineAction({
    accept: 'form',
    input: z.object({
      email: z.email({ error: 'Enter a valid email address.' }).max(100),
      next: z.string().max(200).nullish(),
    }),
    handler: async ({ email, next }, ctx) => {
      const { auth } = await import('../lib/auth');
      const target = safeNext(next);
      const callbackURL = `/dashboard/password?next=${encodeURIComponent(target)}`;
      await auth.api.signInMagicLink({
        body: { email: email.toLowerCase(), callbackURL, newUserCallbackURL: target.startsWith('/invite?') ? target : '/welcome', errorCallbackURL: '/signin?error=link' },
        headers: ctx.request.headers,
      });
      return { email };
    },
  }),

  /** email and password; a wrong address and a wrong password get the same answer */
  signIn: defineAction({
    accept: 'form',
    input: z.object({
      email: z.email({ error: 'Enter a valid email address.' }).max(100),
      password: z.preprocess((v) => v ?? '', z.string().min(1, 'Enter your password.').max(128, 'Email or password is wrong.')),
      next: z.string().max(200).nullish(),
    }),
    handler: async ({ email, password, next }, ctx) => {
      const { db, schema } = await import('../db/client');
      const { auth, applyAuthCookies } = await import('../lib/auth');
      const address = email.toLowerCase();
      const ip = ctx.request.headers.get('cf-connecting-ip');
      const keys = failureKeys(address, ip);
      const since = new Date(Date.now() - WINDOW);
      const counts = await Promise.all(keys.map(async ({ key, limit }) => (await db.select({ id: schema.signInFailures.id }).from(schema.signInFailures)
        .where(and(eq(schema.signInFailures.key, key), gt(schema.signInFailures.at, since))).limit(limit)).length));
      if (keys.some(({ limit }, i) => counts[i]! >= limit)) {
        throw new ActionError({ code: 'TOO_MANY_REQUESTS', message: 'Too many tries. Wait 15 minutes, or sign in with an email link.' });
      }
      try {
        const { headers } = await auth.api.signInEmail({ body: { email: address, password }, headers: ctx.request.headers, returnHeaders: true });
        applyAuthCookies(ctx.cookies, headers);
        // the header's signed-in hint, set now so a prerendered page after sign-in already shows the profile icon
        const { HINT, initialsOf } = await import('../lib/member-hint');
        const who = await db.query.user.findFirst({ where: eq(schema.user.email, address), columns: { name: true } });
        ctx.cookies.set(HINT, initialsOf(who?.name), { path: '/', sameSite: 'lax', secure: ctx.url.protocol === 'https:', maxAge: 60 * 60 * 24 * 30 });
      } catch (e) {
        const now = new Date();
        await db.batch([
          db.insert(schema.signInFailures).values(keys.map(({ key }) => ({ key, at: now }))),
          db.delete(schema.signInFailures).where(lt(schema.signInFailures.at, new Date(now.getTime() - 24 * 60 * 60_000))),
        ]);
        if ((e as { statusCode?: number }).statusCode === 401 || (e as { status?: string }).status === 'UNAUTHORIZED') {
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Email or password is wrong.' });
        }
        throw e;
      }
      await db.delete(schema.signInFailures).where(eq(schema.signInFailures.key, keys[0]!.key));
      return { next: safeNext(next) };
    },
  }),

  /**
   * Sets or changes the password. Someone who signed in within the last 15 minutes (with an email link, after a
   * forgotten password, or with the password itself) needs no current password; later, they must give it.
   * Every other session of the member ends, so a stolen session does not outlive a password change.
   */
  setPassword: defineAction({
    accept: 'form',
    input: z.object({
      password: newPassword,
      current: z.string().max(128).nullish(),
    }),
    handler: async ({ password, current }, ctx) => {
      const me = ctx.locals.user;
      const session = ctx.locals.session;
      if (!me || !session) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { db, schema } = await import('../db/client');
      const existing = await db.query.account.findFirst({
        where: and(eq(schema.account.userId, me.id), eq(schema.account.providerId, 'credential')), columns: { password: true },
      });
      // read the session's age from the database: the signed cookie copy may be a few minutes old
      const row = await db.query.session.findFirst({ where: eq(schema.session.id, session.id), columns: { createdAt: true } });
      if (!row) throw new ActionError({ code: 'UNAUTHORIZED' });
      const fresh = Date.now() - row.createdAt.getTime() < 15 * 60_000;
      if (existing?.password && !fresh) {
        const { verifyPassword } = await import('../lib/password');
        if (!current) throw new ActionError({ code: 'BAD_REQUEST', message: 'Enter your current password.' });
        if (!(await verifyPassword({ hash: existing.password, password: current }))) {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Your current password is wrong.' });
        }
      }
      await savePassword(me.id, password);
      await db.batch([
        db.delete(schema.session).where(and(eq(schema.session.userId, me.id), ne(schema.session.id, session.id))),
        db.delete(schema.signInFailures).where(or(eq(schema.signInFailures.key, `email:${me.email.toLowerCase()}`), like(schema.signInFailures.key, `pair:${me.email.toLowerCase()}|%`))),
      ]);
      return { changed: !!existing?.password };
    },
  }),

  /**
   * First visit: a name and an account type. An individual gets a person profile; a company also gets a company
   * page with the member as owner. Someone who already joined a team by invitation only gives their name.
   */
  chooseAccountType: defineAction({
    accept: 'form',
    input: z.object({
      name: reqText(2, 80, 'Enter your name.'),
      type: z.enum(['individual', 'company']).nullish(),
      company: optText(120),
      password: newPassword,
    }),
    handler: async ({ name, type, company, password }, ctx) => {
      const me = ctx.locals.user;
      if (!me) throw new ActionError({ code: 'UNAUTHORIZED' });
      const { db, schema } = await import('../db/client');
      // read from the database, not the session cookie, which caches the user for a few minutes
      const fresh = await db.query.user.findFirst({ where: eq(schema.user.id, me.id), columns: { accountType: true } });
      if (fresh?.accountType) return { type: fresh.accountType };

      let joined = !!(await db.query.members.findFirst({ where: eq(schema.members.userId, me.id), columns: { role: true } }));
      // invited but never opened the invitation page: the email link proved this address, so join those teams now
      if (!joined) {
        const { pendingInvites } = await import('../db/queries/dashboard');
        const invites = await pendingInvites(me.email);
        if (invites.length) {
          const ops: BatchItem<'sqlite'>[] = invites.flatMap((inv) => [
            db.insert(schema.members).values({ organizationId: inv.organizationId, userId: me.id, role: inv.role }).onConflictDoNothing(),
            db.update(schema.invites).set({ acceptedAt: new Date() }).where(eq(schema.invites.id, inv.id)),
          ]);
          await db.batch(ops as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
          joined = true;
        }
      }
      const accountType = joined ? 'company' : type;
      if (!accountType) throw new ActionError({ code: 'BAD_REQUEST', message: 'Choose individual or company.' });
      const newCompany = !joined && accountType === 'company';
      if (newCompany && (company?.length ?? 0) < 2) throw new ActionError({ code: 'BAD_REQUEST', message: 'Enter the company name.' });

      const { freeHandle } = await import('../lib/handles');
      const now = new Date();
      const handle = await freeHandle(name, async (h) => !!(await db.query.profiles.findFirst({ where: eq(schema.profiles.handle, h), columns: { id: true } })));
      // only the first answer counts, even if two submissions race
      const setUser = db.update(schema.user).set({ name, accountType, updatedAt: now }).where(and(eq(schema.user.id, me.id), isNull(schema.user.accountType)));
      const addProfile = db.insert(schema.profiles).values({ id: crypto.randomUUID(), userId: me.id, handle }).onConflictDoNothing({ target: schema.profiles.userId });
      // one D1 batch: all rows are written or none. A parallel submission of the same form can win the race and
      // take the handle or slug first; then setup is already done and this one reports success.
      try {
        if (newCompany) {
          const orgId = crypto.randomUUID();
          const slug = await freeHandle(company!, async (s) => !!(await db.query.organizations.findFirst({ where: eq(schema.organizations.slug, s), columns: { id: true } })));
          const setUp = (s: string) => db.batch([
            setUser,
            addProfile,
            db.insert(schema.organizations).values({ id: orgId, slug: s, name: company! }),
            db.insert(schema.members).values({ organizationId: orgId, userId: me.id, role: 'owner' }),
          ]);
          // someone else may take the same company slug at the same moment; then this one gets a suffix
          await setUp(slug).catch(async (e) => {
            const done = await db.query.user.findFirst({ where: eq(schema.user.id, me.id), columns: { accountType: true } });
            if (done?.accountType) throw e;
            await setUp(`${slug}-${crypto.randomUUID().slice(0, 6)}`);
          });
        } else {
          await db.batch([setUser, addProfile]);
        }
      } catch (e) {
        const done = await db.query.user.findFirst({ where: eq(schema.user.id, me.id), columns: { accountType: true } });
        if (!done?.accountType) throw e;
      }
      // the email link has proved the address; from now on the member signs in with this password
      await savePassword(me.id, password);
      // drop the cached session copy so the next request sees the account type
      const { dropSessionCache } = await import('../lib/auth');
      await dropSessionCache(ctx.cookies);
      return { type: accountType };
    },
  }),
};
