// Messages to a company or to a person. Senders must be signed in, so every enquiry comes from a confirmed email
// address; nobody's address is ever shown to the other side's public page: contact goes through here.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { noticeMail, sendMail } from '../lib/email';
import { isMember, requireUser } from '../lib/guards';
import { DAY, spend } from '../lib/throttle';
import { optText, reqText, entityId } from '../lib/validate';
import { isPublicListing, isPublicOrg } from '../lib/visibility';

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

type Enquiry = typeof schema.enquiries.$inferSelect;

/** is the user on the receiving side: the company's team, or the person written to */
export async function receives(userId: string, e: Pick<Enquiry, 'organizationId' | 'toUserId'>): Promise<boolean> {
  if (e.toUserId) return e.toUserId === userId;
  return !!e.organizationId && (await isMember(userId, e.organizationId));
}

/** who receives the enquiry: a company's name and team, or a person's name and address */
async function recipient(e: Pick<Enquiry, 'organizationId' | 'toUserId'>) {
  if (e.toUserId) {
    const u = (await db.query.user.findFirst({ where: eq(schema.user.id, e.toUserId), columns: { name: true, email: true } }))!;
    return { name: u.name, emails: [u.email] };
  }
  const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, e.organizationId!), columns: { name: true } }))!;
  return { name: org.name, emails: await teamEmails(e.organizationId!) };
}

export const enquiries = {
  /** to a company (organizationId) or to a person (toHandle: their public page's handle) */
  send: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: entityId().or(z.literal('')).nullish().transform((v) => v || null),
      toHandle: z.string().max(80).nullish().transform((v) => v || null),
      listingId: entityId().or(z.literal('')).nullish().transform((v) => v || null),
      fromCompany: optText(120),
      subject: reqText(3, 140, 'Add a subject.'),
      message: reqText(20, 4000, 'Write at least a couple of sentences.'),
      // filled only by bots: the form hides it from people
      website: z.string().max(0).nullish(),
    }).refine((v) => !!v.organizationId !== !!v.toHandle, { path: ['organizationId'], error: 'Choose who to write to.' }),
    handler: async (input, ctx) => {
      const user = requireUser(ctx);
      let to: { organizationId: string | null; toUserId: string | null; name: string; emails: string[]; link: string };
      if (input.organizationId) {
        const org = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, input.organizationId), columns: { id: true, name: true, published: true, greenReview: true } });
        if (!org || !isPublicOrg(org)) throw new ActionError({ code: 'NOT_FOUND', message: 'Company not found.' });
        if (await isMember(user.id, org.id)) throw new ActionError({ code: 'BAD_REQUEST', message: 'You are on this company’s team.' });
        if (input.listingId) {
          // only a listing the public can see: a draft's id must not attach (or confirm that the draft exists)
          const l = await db.query.listings.findFirst({ where: and(eq(schema.listings.id, input.listingId), eq(schema.listings.organizationId, org.id)), columns: { status: true, greenReview: true } });
          if (!l || !isPublicListing(l, org)) throw new ActionError({ code: 'NOT_FOUND', message: 'Listing not found.' });
        }
        to = { organizationId: org.id, toUserId: null, name: org.name, emails: await teamEmails(org.id), link: '/dashboard/enquiries/' };
      } else {
        // a person with a public page; never one's own
        const p = await db.select({ userId: schema.profiles.userId, name: schema.user.name, email: schema.user.email }).from(schema.profiles)
          .innerJoin(schema.user, eq(schema.user.id, schema.profiles.userId))
          .where(and(eq(schema.profiles.handle, input.toHandle!), eq(schema.profiles.published, true))).limit(1);
        if (!p[0]) throw new ActionError({ code: 'NOT_FOUND', message: 'Person not found.' });
        if (p[0].userId === user.id) throw new ActionError({ code: 'BAD_REQUEST', message: 'This is your own page.' });
        if (input.listingId) throw new ActionError({ code: 'BAD_REQUEST', message: 'Listings belong to companies.' });
        to = { organizationId: null, toUserId: p[0].userId, name: p[0].name, emails: [p[0].email], link: '/dashboard/enquiries/' };
      }
      // the shared throttle counts and records in one statement, so parallel sends cannot pass the cap
      await spend([{ key: `enquiry:${user.id}`, limit: PER_DAY, windowMs: DAY }], 'You have sent a lot of enquiries today. Try again tomorrow.');

      const id = crypto.randomUUID();
      // the session copy of the user can be minutes old; the enquiry keeps the current name for good
      const sender = (await db.query.user.findFirst({ where: eq(schema.user.id, user.id), columns: { name: true, email: true } }))!;
      await db.batch([
        db.insert(schema.enquiries).values({
          id, organizationId: to.organizationId, toUserId: to.toUserId, listingId: input.listingId, fromUserId: user.id,
          fromName: sender.name, fromEmail: sender.email, fromCompany: input.fromCompany, subject: input.subject,
        }),
        db.insert(schema.enquiryMessages).values({ id: crypto.randomUUID(), enquiryId: id, authorUserId: user.id, side: 'buyer', body: input.message }),
      ]);
      await notify(to.emails, to.organizationId ? `New enquiry for ${to.name}: ${input.subject}` : `New message on QuintaEarth: ${input.subject}`,
        [`${sender.name}${input.fromCompany ? ` (${input.fromCompany})` : ''} sent ${to.organizationId ? to.name : 'you'} an enquiry on QuintaEarth.`],
        `${env.SITE_URL}${to.link}${id}`);
      return { id };
    },
  }),

  /** the buyer or anyone on the receiving side can reply */
  reply: defineAction({
    accept: 'form',
    input: z.object({ enquiryId: entityId(), body: reqText(1, 4000, 'Write a reply.') }),
    handler: async ({ enquiryId, body }, ctx) => {
      const user = requireUser(ctx);
      const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, enquiryId) });
      const onTeam = !!e && (await receives(user.id, e));
      const isBuyer = !!e && e.fromUserId === user.id;
      if (!e || (!onTeam && !isBuyer)) throw new ActionError({ code: 'NOT_FOUND', message: 'Enquiry not found.' });
      if (e.status === 'closed') throw new ActionError({ code: 'BAD_REQUEST', message: 'This enquiry is closed.' });
      // every reply emails the other side: a generous daily allowance per member
      await spend([{ key: `reply:${user.id}`, limit: 40, windowMs: DAY }], 'Too many replies today. Try again tomorrow.');

      const side = onTeam ? 'company' : 'buyer';
      await db.batch([
        db.insert(schema.enquiryMessages).values({ id: crypto.randomUUID(), enquiryId, authorUserId: user.id, side, body }),
        // the other side has something new to read; the replier has read the thread
        db.update(schema.enquiries).set({
          status: 'open', updatedAt: new Date(),
          ...(side === 'company' ? { buyerUnread: true, companyUnread: false } : { companyUnread: true, buyerUnread: false }),
        }).where(eq(schema.enquiries.id, enquiryId)),
      ]);
      const to = await recipient(e);
      if (side === 'company') {
        await notify([e.fromEmail], `${to.name} replied: ${e.subject}`, [`${to.name} replied to your enquiry on QuintaEarth.`], `${env.SITE_URL}/dashboard/messages/${enquiryId}`);
      } else {
        await notify(to.emails, `New reply: ${e.subject}`, [`${e.fromName} replied to an enquiry${e.organizationId ? ` for ${to.name}` : ''}.`], `${env.SITE_URL}/dashboard/enquiries/${enquiryId}`);
      }
      return { side };
    },
  }),

  setStatus: defineAction({
    accept: 'form',
    input: z.object({ enquiryId: entityId(), status: z.enum(['open', 'closed']) }),
    handler: async ({ enquiryId, status }, ctx) => {
      const user = requireUser(ctx);
      const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, enquiryId), columns: { organizationId: true, toUserId: true } });
      // "missing" and "not on its receiving side" are one answer, so ids cannot be probed
      if (!e || !(await receives(user.id, e))) throw new ActionError({ code: 'NOT_FOUND', message: 'Enquiry not found.' });
      await db.update(schema.enquiries).set({ status, updatedAt: new Date() }).where(eq(schema.enquiries.id, enquiryId));
      return { status };
    },
  }),

  /**
   * The viewer has read the thread. Opening a thread is a GET and changes nothing (mail scanners prefetch the links
   * in enquiry emails); the thread page posts here once it is shown. Without JavaScript, replying marks it read.
   */
  markRead: defineAction({
    accept: 'form',
    input: z.object({ enquiryId: entityId() }),
    handler: async ({ enquiryId }, ctx) => {
      const user = requireUser(ctx);
      const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, enquiryId), columns: { organizationId: true, toUserId: true, fromUserId: true } });
      const onTeam = !!e && (await receives(user.id, e));
      if (!e || (!onTeam && e.fromUserId !== user.id)) throw new ActionError({ code: 'NOT_FOUND', message: 'Enquiry not found.' });
      const t = schema.enquiries;
      // the team's first read moves a new enquiry to open; the conditions keep a repeat post from writing anything
      if (onTeam) {
        await db.batch([
          db.update(t).set({ companyUnread: false }).where(and(eq(t.id, enquiryId), eq(t.companyUnread, true))),
          db.update(t).set({ status: 'open' }).where(and(eq(t.id, enquiryId), eq(t.status, 'new'))),
        ]);
      } else {
        await db.update(t).set({ buyerUnread: false }).where(and(eq(t.id, enquiryId), eq(t.buyerUnread, true)));
      }
      return { read: true };
    },
  }),
};
