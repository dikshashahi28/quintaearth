// The green-wording review queue (/admin/review): listings and company descriptions with words like "eco" or
// "carbon neutral" wait here, hidden from the public, until an admin approves or refuses that exact text.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { refuseOwnCompany, requireAdmin } from '../lib/guards';
import { optText } from '../lib/validate';
import { auditRow } from '../lib/audit';
import { companyListingRows, listingDoc, organizationDoc, searchRows } from '../lib/search';
import { tagsOf } from '../lib/tags';
import { noticeMail, sendMail } from '../lib/email';

export const moderation = {
  review: defineAction({
    accept: 'form',
    input: z.object({
      type: z.enum(['listing', 'organization']),
      id: z.string().min(1).max(60),
      /** the text the admin read: a decision on text that has changed since is refused */
      hash: z.string().min(1).max(64),
      decision: z.enum(['approved', 'rejected']),
      reason: optText(500),
    }).refine((v) => v.decision === 'approved' || !!v.reason, { path: ['reason'], error: 'Say what to change, so the company can fix it.' }),
    handler: async ({ type, id, hash, decision, reason }, ctx) => {
      const admin = requireAdmin(ctx);
      const now = new Date();
      const changed = () => new ActionError({ code: 'CONFLICT', message: 'The text changed or was already decided. Open the queue again.' });
      let orgId: string, name: string;
      if (type === 'listing') {
        const l = await db.query.listings.findFirst({ where: eq(schema.listings.id, id) });
        if (!l) throw new ActionError({ code: 'NOT_FOUND', message: 'Listing not found.' });
        await refuseOwnCompany(admin.id, l.organizationId);
        if (l.greenReview !== 'pending' || l.greenHash !== hash) throw changed();
        const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, l.organizationId), columns: { name: true, published: true, greenReview: true } }))!;
        const t = await tagsOf('listing', id);
        const res = await db.batch([
          db.update(schema.listings).set({ greenReview: decision, greenReason: decision === 'rejected' ? reason : null })
            .where(and(eq(schema.listings.id, id), eq(schema.listings.greenReview, 'pending'), eq(schema.listings.greenHash, hash))).returning({ id: schema.listings.id }),
          ...searchRows('listing', id, listingDoc({ ...l, greenReview: decision }, org, t)),
          auditRow({ organizationId: l.organizationId, subjectType: 'listing', subjectId: id, actorUserId: admin.id, action: `green-${decision}`, result: decision === 'approved' ? 'pass' : 'fail',
            detail: [l.greenTerms, reason].filter(Boolean).join(' | ') }),
        ]);
        if (!res[0].length) throw changed();
        orgId = l.organizationId; name = l.name;
      } else {
        const o = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, id) });
        if (!o) throw new ActionError({ code: 'NOT_FOUND', message: 'Company not found.' });
        await refuseOwnCompany(admin.id, id);
        if (o.greenReview !== 'pending' || o.greenHash !== hash) throw changed();
        const t = await tagsOf('organization', id);
        const visible = { ...o, greenReview: decision };
        const res = await db.batch([
          db.update(schema.organizations).set({ greenReview: decision, greenReason: decision === 'rejected' ? reason : null })
            .where(and(eq(schema.organizations.id, id), eq(schema.organizations.greenReview, 'pending'), eq(schema.organizations.greenHash, hash))).returning({ id: schema.organizations.id }),
          ...searchRows('organization', id, organizationDoc(visible, t)),
          ...(await companyListingRows(id, visible)),
          auditRow({ organizationId: id, subjectType: 'organization', subjectId: id, actorUserId: admin.id, action: `green-${decision}`, result: decision === 'approved' ? 'pass' : 'fail',
            detail: [o.greenTerms, reason].filter(Boolean).join(' | ') }),
        ]);
        if (!res[0].length) throw changed();
        orgId = id; name = o.name;
      }
      // tell the company's owners
      const owners = await db.select({ email: schema.user.email }).from(schema.members).innerJoin(schema.user, eq(schema.user.id, schema.members.userId))
        .where(and(eq(schema.members.organizationId, orgId), eq(schema.members.role, 'owner')));
      const lines = decision === 'approved'
        ? [`"${name}" passed the wording review and is now public (if it is published).`]
        : [`"${name}" is not public yet: the wording review asks for a change.`, `What to change: ${reason}`];
      await Promise.allSettled(owners.map((o) => sendMail(noticeMail(o.email, decision === 'approved' ? 'Wording review passed' : 'Wording review: a change is needed', lines,
        { label: 'Open your dashboard', url: `${env.SITE_URL}/dashboard` }))));
      return { decision, type, id, at: now.getTime() };
    },
  }),
};
