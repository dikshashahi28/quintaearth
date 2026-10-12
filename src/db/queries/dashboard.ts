// Data for the signed-in member's own pages. Callers pass the session user; nothing here is public.
import { and, asc, desc, eq, gt, inArray, isNull, ne, sql } from 'drizzle-orm';
import { db, schema } from '../client';
import { inChunks } from '../chunks';
import { tagsOf } from '../../lib/tags';

export async function myProfile(userId: string) {
  const p = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, userId) });
  return p ? { ...p, tags: await tagsOf('profile', p.id) } : null;
}

export async function myCompanies(userId: string) {
  return db.select({ id: schema.organizations.id, name: schema.organizations.name, slug: schema.organizations.slug, role: schema.members.role,
    published: schema.organizations.published, identityCheckedAt: schema.organizations.identityCheckedAt })
    .from(schema.members).innerJoin(schema.organizations, eq(schema.organizations.id, schema.members.organizationId))
    .where(eq(schema.members.userId, userId)).orderBy(asc(schema.organizations.name));
}

/** a company the user is on, with everything its editor needs; null when they are not on it */
export async function companyForEditor(userId: string, organizationId: string) {
  const m = await db.query.members.findFirst({ where: and(eq(schema.members.organizationId, organizationId), eq(schema.members.userId, userId)) });
  if (!m) return null;
  const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId) }))!;
  const team = await db.select({ userId: schema.user.id, name: schema.user.name, email: schema.user.email, role: schema.members.role })
    .from(schema.members).innerJoin(schema.user, eq(schema.user.id, schema.members.userId))
    .where(eq(schema.members.organizationId, organizationId)).orderBy(asc(schema.user.name));
  const invites = m.role === 'owner'
    ? await db.select({ email: schema.invites.email, role: schema.invites.role, expiresAt: schema.invites.expiresAt }).from(schema.invites)
      .where(and(eq(schema.invites.organizationId, organizationId), isNull(schema.invites.acceptedAt)))
    : [];
  const listings = await db.select().from(schema.listings).where(eq(schema.listings.organizationId, organizationId)).orderBy(desc(schema.listings.updatedAt));
  const files = await inChunks(listings.map((l) => l.id), (slice) => db.select().from(schema.files).where(inArray(schema.files.listingId, slice)));
  const checks = await db.select().from(schema.identityChecks).where(eq(schema.identityChecks.organizationId, organizationId)).orderBy(desc(schema.identityChecks.createdAt));
  return { org, role: m.role, tags: await tagsOf('organization', organizationId), team, invites, listings, files, checks };
}

/** the listings index: the company's listings with their evidence counts, without the editor's team, invites or checks */
export async function companyListings(userId: string, organizationId: string) {
  const m = await db.query.members.findFirst({ where: and(eq(schema.members.organizationId, organizationId), eq(schema.members.userId, userId)), columns: { role: true } });
  if (!m) return null;
  const listings = await db.select({ id: schema.listings.id, name: schema.listings.name, kind: schema.listings.kind, status: schema.listings.status, photoKey: schema.listings.photoKey })
    .from(schema.listings).where(eq(schema.listings.organizationId, organizationId)).orderBy(desc(schema.listings.updatedAt));
  const docs = await db.select({ listingId: schema.files.listingId, n: sql<number>`count(*)` }).from(schema.files)
    .where(and(eq(schema.files.organizationId, organizationId), eq(schema.files.purpose, 'evidence'))).groupBy(schema.files.listingId);
  const docCount = new Map(docs.map((d) => [d.listingId, d.n]));
  return listings.map((l) => ({ ...l, docs: docCount.get(l.id) ?? 0 }));
}

/** the identity page: the company and its identity checks, newest first; null when the user is not on it */
export async function companyChecks(userId: string, organizationId: string) {
  const m = await db.query.members.findFirst({ where: and(eq(schema.members.organizationId, organizationId), eq(schema.members.userId, userId)), columns: { role: true } });
  if (!m) return null;
  const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId),
    columns: { id: true, name: true, country: true, identityCheckedAt: true } }))!;
  const checks = await db.select().from(schema.identityChecks).where(eq(schema.identityChecks.organizationId, organizationId)).orderBy(desc(schema.identityChecks.createdAt));
  return { org, role: m.role, checks };
}

/** enquiry lists are read a page at a time */
export const INBOX_PAGE = 50;
type Show = 'open' | 'closed';
const inTab = (show: Show) => (show === 'closed' ? eq(schema.enquiries.status, 'closed') : ne(schema.enquiries.status, 'closed'));
const pageOf = (page: number) => Math.max(1, Math.min(Math.floor(page) || 1, 1000));

/** how many enquiries match `where`, split into the Open tab (new and open) and Closed */
async function tabCounts(where: ReturnType<typeof eq>) {
  const rows = await db.select({ closed: sql<number>`${schema.enquiries.status} = 'closed'`, n: sql<number>`count(*)` })
    .from(schema.enquiries).where(where).groupBy(sql`1`);
  const counts = { open: 0, closed: 0 };
  for (const r of rows) counts[r.closed ? 'closed' : 'open'] = r.n;
  return counts;
}

/** one page of the enquiries a company received in one tab, newest first, and both tabs' counts */
export async function inbox(organizationId: string, show: Show, page = 1) {
  const p = pageOf(page);
  const mine = eq(schema.enquiries.organizationId, organizationId);
  const rows = await db.select().from(schema.enquiries).where(and(mine, inTab(show)))
    .orderBy(desc(schema.enquiries.updatedAt)).limit(INBOX_PAGE + 1).offset((p - 1) * INBOX_PAGE);
  return { rows: rows.slice(0, INBOX_PAGE), more: rows.length > INBOX_PAGE, page: p, counts: await tabCounts(mine) };
}

/** one page of the enquiries the user sent in one tab, newest first, and both tabs' counts */
export async function sent(userId: string, show: Show, page = 1) {
  const p = pageOf(page);
  const mine = eq(schema.enquiries.fromUserId, userId);
  const rows = await db.select({ enquiry: schema.enquiries, company: schema.organizations.name }).from(schema.enquiries)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.enquiries.organizationId))
    .where(and(mine, inTab(show))).orderBy(desc(schema.enquiries.updatedAt)).limit(INBOX_PAGE + 1).offset((p - 1) * INBOX_PAGE);
  return { rows: rows.slice(0, INBOX_PAGE), more: rows.length > INBOX_PAGE, page: p, counts: await tabCounts(mine) };
}

/**
 * One thread, if the user is its buyer or on the receiving team. Read-only: a GET of the thread page (which mail
 * scanners prefetch) must not mark it read; the page posts enquiries.markRead once it is shown.
 */
export async function thread(userId: string, enquiryId: string) {
  const row = (await db.select({ enquiry: schema.enquiries, company: schema.organizations.name }).from(schema.enquiries)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.enquiries.organizationId))
    .where(eq(schema.enquiries.id, enquiryId)).limit(1))[0];
  if (!row) return null;
  const e = row.enquiry;
  const onTeam = !!(await db.query.members.findFirst({ where: and(eq(schema.members.organizationId, e.organizationId), eq(schema.members.userId, userId)), columns: { role: true } }));
  if (!onTeam && e.fromUserId !== userId) return null;
  const messages = await db.select().from(schema.enquiryMessages).where(eq(schema.enquiryMessages.enquiryId, enquiryId)).orderBy(asc(schema.enquiryMessages.createdAt));
  const side = onTeam ? 'company' as const : 'buyer' as const;
  // what the viewer has not read yet; the page marks it read after it is shown
  const unread = side === 'company' ? e.companyUnread || e.status === 'new' : e.buyerUnread;
  return { enquiry: e, company: row.company, messages, side, unread };
}

/** admin queue: oldest pending first */
export async function pendingChecks() {
  return db.select({ check: schema.identityChecks, company: schema.organizations.name, slug: schema.organizations.slug, website: schema.organizations.website })
    .from(schema.identityChecks).innerJoin(schema.organizations, eq(schema.organizations.id, schema.identityChecks.organizationId))
    .where(eq(schema.identityChecks.status, 'pending')).orderBy(asc(schema.identityChecks.createdAt));
}

/**
 * Unanswered, unexpired invitations for this address, newest first, with the company name. The address is proved
 * (an email link signed the member in), so setup can accept them even if the member never opened /invite.
 */
export async function pendingInvites(email: string) {
  return db.select({ id: schema.invites.id, organizationId: schema.invites.organizationId, role: schema.invites.role, name: schema.organizations.name })
    .from(schema.invites).innerJoin(schema.organizations, eq(schema.organizations.id, schema.invites.organizationId))
    .where(and(eq(schema.invites.email, email.toLowerCase()), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())))
    .orderBy(desc(schema.invites.createdAt));
}
