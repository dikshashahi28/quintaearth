// Buyer-to-company messages. Senders must be signed in, so every enquiry comes from a confirmed email address.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, gt } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { noticeMail, sendMail } from '../lib/email';
import { isMember, requireMember, requireUser } from '../lib/guards';
import { optText, reqText } from '../lib/validate';

const PER_DAY = 10;

async function teamEmails(organizationId: string) {
  return (await db.select({ email: schema.user.email }).from(schema.members)
    .innerJoin(schema.user, eq(schema.user.id, schema.members.userId))
    .where(eq(schema.members.organizationId, organizationId))).map((r) => r.email);
}

/** mail failures must not lose the message that was already saved */
async function notify(to: string[], subject: string, lines: string[], url: string) {
  const results = await Promise.allSettled(to.map((t) => sendMail(noticeMail(t, subject, lines, { label: 'Open the enquiry', url }))));
  for (const r of results) if (r.status === 'rejected') console.error('enquiry mail failed', r.reason);
}

export const enquiries = {
  send: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: z.uuid(),
      listingId: z.uuid().or(z.literal('')).nullish().transform((v) => v || null),
      fromCompany: optText(120),
      subject: reqText(3, 140, 'Add a subject.'),
      message: reqText(20, 4000, 'Write at least a couple of sentences.'),
      // filled only by bots: the form hides it from people
      website: z.string().max(0).nullish(),
    }),
    handler: async (input, ctx) => {
      const user = requireUser(ctx);
      const org = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, input.organizationId), columns: { id: true, name: true, published: true } });
      if (!org?.published) throw new ActionError({ code: 'NOT_FOUND', message: 'Company not found.' });
      if (await isMember(user.id, org.id)) throw new ActionError({ code: 'BAD_REQUEST', message: 'You are on this company’s team.' });
      if (input.listingId) {
        const l = await db.query.listings.findFirst({ where: and(eq(schema.listings.id, input.listingId), eq(schema.listings.organizationId, org.id)), columns: { id: true } });
        if (!l) throw new ActionError({ code: 'NOT_FOUND', message: 'Listing not found.' });
      }
      const recent = await db.$count(schema.enquiries, and(eq(schema.enquiries.fromUserId, user.id), gt(schema.enquiries.createdAt, new Date(Date.now() - 864e5))));
      if (recent >= PER_DAY) throw new ActionError({ code: 'TOO_MANY_REQUESTS', message: 'You have sent a lot of enquiries today. Try again tomorrow.' });

      const id = crypto.randomUUID();
      // the session copy of the user can be minutes old; the enquiry keeps the current name for good
      const sender = (await db.query.user.findFirst({ where: eq(schema.user.id, user.id), columns: { name: true, email: true } }))!;
      await db.batch([
        db.insert(schema.enquiries).values({
          id, organizationId: org.id, listingId: input.listingId, fromUserId: user.id,
          fromName: sender.name, fromEmail: sender.email, fromCompany: input.fromCompany, subject: input.subject,
        }),
        db.insert(schema.enquiryMessages).values({ id: crypto.randomUUID(), enquiryId: id, authorUserId: user.id, side: 'buyer', body: input.message }),
      ]);
      await notify(await teamEmails(org.id), `New enquiry for ${org.name}: ${input.subject}`,
        [`${sender.name}${input.fromCompany ? ` (${input.fromCompany})` : ''} sent ${org.name} an enquiry on QuintaEarth.`],
        `${env.SITE_URL}/dashboard/enquiries/${id}`);
      return { id };
    },
  }),

  /** the buyer or anyone on the company's team can reply */
  reply: defineAction({
    accept: 'form',
    input: z.object({ enquiryId: z.uuid(), body: reqText(1, 4000, 'Write a reply.') }),
    handler: async ({ enquiryId, body }, ctx) => {
      const user = requireUser(ctx);
      const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, enquiryId) });
      const onTeam = !!e && (await isMember(user.id, e.organizationId));
      const isBuyer = !!e && e.fromUserId === user.id;
      if (!e || (!onTeam && !isBuyer)) throw new ActionError({ code: 'NOT_FOUND', message: 'Enquiry not found.' });
      if (e.status === 'closed') throw new ActionError({ code: 'BAD_REQUEST', message: 'This enquiry is closed.' });

      const side = onTeam ? 'company' : 'buyer';
      await db.batch([
        db.insert(schema.enquiryMessages).values({ id: crypto.randomUUID(), enquiryId, authorUserId: user.id, side, body }),
        // the other side has something new to read; the replier has read the thread
        db.update(schema.enquiries).set({
          status: 'open', updatedAt: new Date(),
          ...(side === 'company' ? { buyerUnread: true, companyUnread: false } : { companyUnread: true, buyerUnread: false }),
        }).where(eq(schema.enquiries.id, enquiryId)),
      ]);
      const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, e.organizationId), columns: { name: true } }))!;
      if (side === 'company') {
        await notify([e.fromEmail], `${org.name} replied: ${e.subject}`, [`${org.name} replied to your enquiry on QuintaEarth.`], `${env.SITE_URL}/dashboard/messages/${enquiryId}`);
      } else {
        await notify((await teamEmails(e.organizationId)), `New reply: ${e.subject}`, [`${e.fromName} replied to an enquiry for ${org.name}.`], `${env.SITE_URL}/dashboard/enquiries/${enquiryId}`);
      }
      return { side };
    },
  }),

  setStatus: defineAction({
    accept: 'form',
    input: z.object({ enquiryId: z.uuid(), status: z.enum(['open', 'closed']) }),
    handler: async ({ enquiryId, status }, ctx) => {
      const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, enquiryId), columns: { organizationId: true } });
      if (!e) throw new ActionError({ code: 'NOT_FOUND', message: 'Enquiry not found.' });
      await requireMember(ctx, e.organizationId);
      await db.update(schema.enquiries).set({ status, updatedAt: new Date() }).where(eq(schema.enquiries.id, enquiryId));
      return { status };
    },
  }),
};
