// "Identity checked": owners ask for it, prove their business email and website, admins tick the rest of the fixed
// checklist and decide. The mark says who a company is, not that it is green. Every step goes to the audit log.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, sql } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { noticeMail, sendMail } from '../lib/email';
import { refuseOwnCompany, requireAdmin, requireMember } from '../lib/guards';
import { deleteFile, putFile } from '../lib/storage';
import { checkbox, optText, reqText, entityId } from '../lib/validate';
import { countryCodes } from '../lib/taxonomy';
import { audit, auditRow } from '../lib/audit';
import { checklist, domainOf, emailOnDomain, hasMetaTag, isIdentityChecked, newSiteToken, siteProof, txtRecords } from '../lib/identity';
import { hashToken } from '../lib/tokens';
import { DAY, spend } from '../lib/throttle';

const CODE_MINUTES = 15;
const CODE_TRIES = 5;

/** the company's latest request still waiting for review, for one of its owners */
async function pendingFor(ctx: Parameters<typeof requireMember>[0], organizationId: string) {
  const { user } = await requireMember(ctx, organizationId, { owner: true });
  const check = await db.query.identityChecks.findFirst({
    where: and(eq(schema.identityChecks.organizationId, organizationId), eq(schema.identityChecks.status, 'pending')),
  });
  if (!check) throw new ActionError({ code: 'NOT_FOUND', message: 'There is no request waiting for review.' });
  const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId), columns: { name: true, website: true } }))!;
  return { user, check, org };
}

const codeHash = (checkId: string, code: string) => hashToken(`${checkId}:${code}`);

export const identity = {
  request: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: entityId(),
      registrationNumber: reqText(3, 60, 'Enter the registration number.'),
      registrationCountry: z.string({ error: 'Choose a country from the list.' }).refine((v) => countryCodes.has(v), 'Choose a country from the list.'),
      workEmail: z.email({ error: 'Enter a valid email address.' }).max(100).transform((e) => e.toLowerCase()),
      note: optText(1000),
      document: z.instanceof(File).nullish(),
    }),
    handler: async (input, ctx) => {
      const { user } = await requireMember(ctx, input.organizationId, { owner: true });
      const pending = await db.query.identityChecks.findFirst({
        where: and(eq(schema.identityChecks.organizationId, input.organizationId), eq(schema.identityChecks.status, 'pending')), columns: { id: true },
      });
      if (pending) throw new ActionError({ code: 'CONFLICT', message: 'A request is already waiting for review.' });
      const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, input.organizationId), columns: { identityCheckedAt: true } }))!;
      // a check older than a year needs doing again (the yearly re-check)
      if (isIdentityChecked(org)) throw new ActionError({ code: 'CONFLICT', message: 'This company is already identity checked.' });

      const id = crypto.randomUUID();
      // the registration document is private: only this company's team and admins can open it
      const documentKey = input.document && input.document.size > 0
        ? await putFile(input.document, 'identity', { userId: user.id, organizationId: input.organizationId })
        : null;
      // the check above is only a friendly early answer: two requests sent at the same moment both pass it, and the
      // unique index on pending rows (migration 0004) lets only one of them in
      try {
        await db.batch([
          db.insert(schema.identityChecks).values({
            id, organizationId: input.organizationId, requestedBy: user.id, registrationNumber: input.registrationNumber,
            registrationCountry: input.registrationCountry, workEmail: input.workEmail, note: input.note, documentKey, siteToken: newSiteToken(),
          }),
          auditRow({ organizationId: input.organizationId, subjectType: 'identity_check', subjectId: id, actorUserId: user.id, action: 'requested', result: 'info',
            detail: `Registration ${input.registrationNumber} (${input.registrationCountry}), work email ${input.workEmail}` }),
        ]);
      } catch (e) {
        await deleteFile(documentKey);
        if (/UNIQUE constraint failed/i.test(String((e as { cause?: unknown }).cause ?? '') + String(e))) {
          throw new ActionError({ code: 'CONFLICT', message: 'A request is already waiting for review.' });
        }
        throw e;
      }
      return { id };
    },
  }),

  /** emails a 6-digit code to the request's work email; typing it back proves the company reads that inbox */
  sendEmailCode: defineAction({
    accept: 'form',
    input: z.object({ organizationId: entityId() }),
    handler: async ({ organizationId }, ctx) => {
      const { user, check, org } = await pendingFor(ctx, organizationId);
      if (check.emailVerifiedAt) return { sent: false, verified: true };
      if (!emailOnDomain(check.workEmail, org.website)) {
        throw new ActionError({ code: 'BAD_REQUEST', message: `The work email must be on your website’s domain (${domainOf(org.website) ?? 'add a website first'}). Send a new request with that address.` });
      }
      await spend([{ key: `idcode:${organizationId}`, limit: 5, windowMs: DAY }], 'Too many codes today. Try again tomorrow.');
      const code = String(crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000).padStart(6, '0');
      await db.batch([
        db.update(schema.identityChecks).set({ emailCodeHash: await codeHash(check.id, code), emailCodeExpiresAt: new Date(Date.now() + CODE_MINUTES * 60_000), emailCodeTries: 0, updatedAt: new Date() })
          .where(eq(schema.identityChecks.id, check.id)),
        auditRow({ organizationId, subjectType: 'identity_check', subjectId: check.id, actorUserId: user.id, action: 'email-code-sent', result: 'info', detail: check.workEmail }),
      ]);
      await sendMail(noticeMail(check.workEmail, `Your QuintaEarth code: ${code}`,
        [`Enter this code on the identity check page for ${org.name}: ${code}`, `It works for ${CODE_MINUTES} minutes. If you did not ask for it, ignore this email.`]));
      return { sent: true, verified: false };
    },
  }),

  verifyEmailCode: defineAction({
    accept: 'form',
    input: z.object({ organizationId: entityId(), code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code.') }),
    handler: async ({ organizationId, code }, ctx) => {
      const { user, check } = await pendingFor(ctx, organizationId);
      if (check.emailVerifiedAt) return { verified: true };
      const live = !!check.emailCodeHash && !!check.emailCodeExpiresAt && check.emailCodeExpiresAt.getTime() > Date.now() && check.emailCodeTries < CODE_TRIES;
      const ok = live && (await codeHash(check.id, code)) === check.emailCodeHash;
      const now = new Date();
      // a wrong try counts in the same statement as the check of the count, so parallel guesses cannot pass the limit
      const res = await db.batch([
        ok
          ? db.update(schema.identityChecks).set({ emailVerifiedAt: now, emailDomain: domainOf(check.workEmail), emailCodeHash: null, emailCodeExpiresAt: null, updatedAt: now })
            .where(and(eq(schema.identityChecks.id, check.id), sql`email_code_tries < ${CODE_TRIES}`)).returning({ id: schema.identityChecks.id })
          : db.update(schema.identityChecks).set({ emailCodeTries: sql`email_code_tries + 1` }).where(eq(schema.identityChecks.id, check.id)).returning({ id: schema.identityChecks.id }),
        auditRow({ organizationId, subjectType: 'identity_check', subjectId: check.id, actorUserId: user.id, action: 'email', result: ok ? 'pass' : 'fail',
          detail: ok ? `Code confirmed for ${check.workEmail}` : live ? 'Wrong code' : 'No live code (expired, used up or never sent)' }),
      ]);
      if (!ok || !res[0].length) throw new ActionError({ code: 'BAD_REQUEST', message: live ? 'That code is not right.' : 'The code has expired. Send a new one.' });
      return { verified: true };
    },
  }),

  /** looks for the TXT record (DNS over HTTPS) or the meta tag on the home page, and records what it found */
  checkWebsite: defineAction({
    accept: 'form',
    input: z.object({ organizationId: entityId() }),
    handler: async ({ organizationId }, ctx) => {
      const { user, check, org } = await pendingFor(ctx, organizationId);
      if (check.siteVerifiedAt) return { verified: true, method: check.siteMethod };
      const domain = domainOf(org.website);
      if (!domain || !org.website || !check.siteToken) throw new ActionError({ code: 'BAD_REQUEST', message: 'Add your website to the company page first.' });
      await spend([{ key: `idsite:${organizationId}`, limit: 30, windowMs: DAY }], 'Too many checks today. Try again tomorrow.');
      const proof = siteProof(check.siteToken);
      const txt = await txtRecords(domain);
      const method = txt.some((t) => t.trim() === proof) ? 'dns' as const : (await hasMetaTag(org.website, check.siteToken)) ? 'meta' as const : null;
      const now = new Date();
      const logged = auditRow({ organizationId, subjectType: 'identity_check', subjectId: check.id, actorUserId: user.id, action: 'website', result: method ? 'pass' : 'fail',
        detail: method ? `${method === 'dns' ? 'TXT record' : 'Meta tag'} found on ${domain}` : `No TXT record or meta tag with the code on ${domain}` });
      if (method) {
        await db.batch([db.update(schema.identityChecks).set({ siteVerifiedAt: now, siteMethod: method, siteDomain: domain, updatedAt: now }).where(eq(schema.identityChecks.id, check.id)), logged]);
      } else {
        await logged;
      }
      if (!method) throw new ActionError({ code: 'BAD_REQUEST', message: `We could not find the code on ${domain} yet. DNS changes can take an hour to show.` });
      return { verified: true, method };
    },
  }),

  /** admins tick (or untick) the checklist items only they can check: the registry match and the short call */
  tick: defineAction({
    accept: 'form',
    input: z.object({ checkId: entityId(), item: z.enum(['registration', 'call']), done: checkbox, note: optText(300) }),
    handler: async ({ checkId, item, done, note }, ctx) => {
      const admin = requireAdmin(ctx);
      const check = await db.query.identityChecks.findFirst({ where: eq(schema.identityChecks.id, checkId), columns: { id: true, organizationId: true, status: true } });
      if (!check) throw new ActionError({ code: 'NOT_FOUND', message: 'Request not found.' });
      await refuseOwnCompany(admin.id, check.organizationId);
      if (check.status !== 'pending') throw new ActionError({ code: 'CONFLICT', message: 'This request was already decided.' });
      const now = new Date();
      const set = item === 'registration'
        ? { registrationCheckedAt: done ? now : null, registrationCheckedBy: done ? admin.id : null }
        : { callDoneAt: done ? now : null, callDoneBy: done ? admin.id : null };
      await db.batch([
        db.update(schema.identityChecks).set({ ...set, updatedAt: now }).where(eq(schema.identityChecks.id, checkId)),
        auditRow({ organizationId: check.organizationId, subjectType: 'identity_check', subjectId: checkId, actorUserId: admin.id, action: item,
          result: done ? 'pass' : 'info', detail: note ?? (done ? 'Ticked' : 'Unticked') }),
      ]);
      return { item, done };
    },
  }),

  review: defineAction({
    accept: 'form',
    input: z.object({
      checkId: entityId(),
      decision: z.enum(['approved', 'rejected']),
      reason: optText(500),
      // the review form carries the admin's own checklist ticks, recorded before the decision
      registration: checkbox,
      call: checkbox,
    }).refine((v) => v.decision === 'approved' || !!v.reason, { path: ['reason'], error: 'Say what is missing, so the company can fix it.' }),
    handler: async ({ checkId, decision, reason, registration, call }, ctx) => {
      const admin = requireAdmin(ctx);
      let check = await db.query.identityChecks.findFirst({ where: eq(schema.identityChecks.id, checkId) });
      if (!check) throw new ActionError({ code: 'NOT_FOUND', message: 'Request not found.' });
      await refuseOwnCompany(admin.id, check.organizationId);
      if (check.status !== 'pending') throw new ActionError({ code: 'CONFLICT', message: 'This request was already decided.' });
      const now = new Date();
      const ticks = [
        ...(registration && !check.registrationCheckedAt ? [{ set: { registrationCheckedAt: now, registrationCheckedBy: admin.id }, action: 'registration' }] : []),
        ...(call && !check.callDoneAt ? [{ set: { callDoneAt: now, callDoneBy: admin.id }, action: 'call' }] : []),
      ];
      if (ticks.length) {
        await db.batch(ticks.flatMap((t) => [
          db.update(schema.identityChecks).set(t.set).where(and(eq(schema.identityChecks.id, checkId), eq(schema.identityChecks.status, 'pending'))),
          auditRow({ organizationId: check!.organizationId, subjectType: 'identity_check', subjectId: checkId, actorUserId: admin.id, action: t.action, result: 'pass', detail: 'Ticked' }),
        ]) as [ReturnType<typeof auditRow>, ...ReturnType<typeof auditRow>[]]);
        check = { ...check, ...Object.assign({}, ...ticks.map((t) => t.set)) };
      }
      const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, check!.organizationId), columns: { website: true } }))!;
      if (decision === 'approved' && !checklist(check!, org.website).complete) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'Finish the checklist first: registration, business email and website, or a short call for what is missing.' });
      }
      // two admins deciding at the same moment both pass the check above; in this batch the company changes only
      // while the request is still pending, and the request is then decided only if it still is, so one decision wins
      const stillPending = sql`EXISTS (SELECT 1 FROM identity_checks WHERE id = ${checkId} AND status = 'pending')`;
      const [, decided] = await db.batch([
        db.update(schema.organizations).set({ identityCheckedAt: decision === 'approved' ? now : null, ...(decision === 'approved' ? { identityLapsed: null } : {}), updatedAt: now })
          .where(and(eq(schema.organizations.id, check!.organizationId), stillPending)),
        db.update(schema.identityChecks).set({ status: decision, reason, reviewedBy: admin.id, reviewedAt: now, updatedAt: now })
          .where(and(eq(schema.identityChecks.id, checkId), eq(schema.identityChecks.status, 'pending'))).returning({ id: schema.identityChecks.id }),
      ]);
      if (!decided.length) throw new ActionError({ code: 'CONFLICT', message: 'This request was already decided.' });
      await audit({ organizationId: check!.organizationId, subjectType: 'identity_check', subjectId: checkId, actorUserId: admin.id, action: decision,
        result: decision === 'approved' ? 'pass' : 'fail', detail: reason });
      const owner = check!.requestedBy ? await db.query.user.findFirst({ where: eq(schema.user.id, check!.requestedBy), columns: { email: true } }) : null;
      if (owner) {
        const lines = decision === 'approved'
          ? ['Your company page now shows "Identity checked".', 'It lasts a year; we will ask you to check again then.']
          : ['We could not complete the identity check.', `What is missing: ${reason}`];
        await sendMail(noticeMail(owner.email, decision === 'approved' ? 'Identity checked' : 'Identity check: more information needed', lines, { label: 'Open your dashboard', url: `${env.SITE_URL}/dashboard` }))
          .catch((e) => console.error('identity mail failed', e));
      }
      return { decision };
    },
  }),
};
