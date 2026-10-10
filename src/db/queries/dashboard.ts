// Data for the signed-in member's own pages. Callers pass the session user; nothing here is public.
import { and, asc, desc, eq, gt, inArray, isNull } from 'drizzle-orm';
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

/** enquiries a company received, newest first */
export async function inbox(organizationId: string) {
  return db.select().from(schema.enquiries).where(eq(schema.enquiries.organizationId, organizationId)).orderBy(desc(schema.enquiries.updatedAt));
}

/** enquiries the user sent */
export async function sent(userId: string) {
  return db.select({ enquiry: schema.enquiries, company: schema.organizations.name }).from(schema.enquiries)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.enquiries.organizationId))
    .where(eq(schema.enquiries.fromUserId, userId)).orderBy(desc(schema.enquiries.updatedAt));
}

/** one thread, if the user is its buyer or on the receiving team; opening it as the team marks it read */
export async function thread(userId: string, enquiryId: string) {
  const e = await db.query.enquiries.findFirst({ where: eq(schema.enquiries.id, enquiryId) });
  if (!e) return null;
  const onTeam = !!(await db.query.members.findFirst({ where: and(eq(schema.members.organizationId, e.organizationId), eq(schema.members.userId, userId)), columns: { role: true } }));
  if (!onTeam && e.fromUserId !== userId) return null;
  // opening the thread reads it, for whichever side opened it
  if (onTeam && (e.status === 'new' || e.companyUnread)) {
    await db.update(schema.enquiries).set({ companyUnread: false, ...(e.status === 'new' ? { status: 'open' as const } : {}) }).where(eq(schema.enquiries.id, enquiryId));
  } else if (!onTeam && e.buyerUnread) {
    await db.update(schema.enquiries).set({ buyerUnread: false }).where(eq(schema.enquiries.id, enquiryId));
  }
  const messages = await db.select().from(schema.enquiryMessages).where(eq(schema.enquiryMessages.enquiryId, enquiryId)).orderBy(asc(schema.enquiryMessages.createdAt));
  return { enquiry: e, messages, side: onTeam ? 'company' as const : 'buyer' as const };
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
