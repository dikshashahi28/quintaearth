// "Identity checked": owners ask for it, admins decide. The mark says who a company is, not that it is green.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, sql } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { noticeMail, sendMail } from '../lib/email';
import { requireAdmin, requireMember } from '../lib/guards';
import { deleteFile, putFile } from '../lib/storage';
import { optText, reqText } from '../lib/validate';
import { countryCodes } from '../lib/taxonomy';

export const identity = {
  request: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: z.uuid(),
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
      if (org.identityCheckedAt) throw new ActionError({ code: 'CONFLICT', message: 'This company is already identity checked.' });

      const id = crypto.randomUUID();
      // the registration document is private: only this company's team and admins can open it
      const documentKey = input.document && input.document.size > 0
        ? await putFile(input.document, 'identity', { userId: user.id, organizationId: input.organizationId })
        : null;
      // the check above is only a friendly early answer: two requests sent at the same moment both pass it, and the
      // unique index on pending rows (migration 0004) lets only one of them in
      try {
        await db.insert(schema.identityChecks).values({
          id, organizationId: input.organizationId, requestedBy: user.id, registrationNumber: input.registrationNumber,
          registrationCountry: input.registrationCountry, workEmail: input.workEmail, note: input.note, documentKey,
        });
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

  review: defineAction({
    accept: 'form',
    input: z.object({
      checkId: z.uuid(),
      decision: z.enum(['approved', 'rejected']),
      reason: optText(500),
    }).refine((v) => v.decision === 'approved' || !!v.reason, { path: ['reason'], error: 'Say what is missing, so the company can fix it.' }),
    handler: async ({ checkId, decision, reason }, ctx) => {
      const admin = requireAdmin(ctx);
      const check = await db.query.identityChecks.findFirst({ where: eq(schema.identityChecks.id, checkId) });
      if (!check) throw new ActionError({ code: 'NOT_FOUND', message: 'Request not found.' });
      if (check.status !== 'pending') throw new ActionError({ code: 'CONFLICT', message: 'This request was already decided.' });
      const now = new Date();
      // two admins deciding at the same moment both pass the check above; in this batch the company changes only
      // while the request is still pending, and the request is then decided only if it still is, so one decision wins
      const stillPending = sql`EXISTS (SELECT 1 FROM identity_checks WHERE id = ${checkId} AND status = 'pending')`;
      const [, decided] = await db.batch([
        db.update(schema.organizations).set({ identityCheckedAt: decision === 'approved' ? now : null, updatedAt: now })
          .where(and(eq(schema.organizations.id, check.organizationId), stillPending)),
        db.update(schema.identityChecks).set({ status: decision, reason, reviewedBy: admin.id, reviewedAt: now, updatedAt: now })
          .where(and(eq(schema.identityChecks.id, checkId), eq(schema.identityChecks.status, 'pending'))).returning({ id: schema.identityChecks.id }),
      ]);
      if (!decided.length) throw new ActionError({ code: 'CONFLICT', message: 'This request was already decided.' });
      const owner = check.requestedBy ? await db.query.user.findFirst({ where: eq(schema.user.id, check.requestedBy), columns: { email: true } }) : null;
      if (owner) {
        const lines = decision === 'approved'
          ? ['Your company page now shows "Identity checked".']
          : ['We could not complete the identity check.', `What is missing: ${reason}`];
        await sendMail(noticeMail(owner.email, decision === 'approved' ? 'Identity checked' : 'Identity check: more information needed', lines, { label: 'Open your dashboard', url: `${env.SITE_URL}/dashboard` }))
          .catch((e) => console.error('identity mail failed', e));
      }
      return { decision };
    },
  }),
};
