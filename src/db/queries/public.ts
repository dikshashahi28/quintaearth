// Data for the public pages. Only published people, companies and listings are ever returned.
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../client';
import { inChunks } from '../chunks';
import { tagsOf } from '../../lib/tags';

export async function getPublicPerson(handle: string) {
  const p = await db.query.profiles.findFirst({ where: and(eq(schema.profiles.handle, handle), eq(schema.profiles.published, true)) });
  if (!p) return null;
  const u = (await db.query.user.findFirst({ where: eq(schema.user.id, p.userId), columns: { name: true } }))!;
  const companies = await db.select({ name: schema.organizations.name, slug: schema.organizations.slug, role: schema.members.role })
    .from(schema.members)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.members.organizationId))
    .where(and(eq(schema.members.userId, p.userId), eq(schema.organizations.published, true)));
  const { userId: _hidden, ...profile } = p;
  return { ...profile, name: u.name, tags: await tagsOf('profile', p.id), companies };
}

export async function getPublicCompany(slug: string) {
  const org = await db.query.organizations.findFirst({ where: and(eq(schema.organizations.slug, slug), eq(schema.organizations.published, true)) });
  if (!org) return null;
  const listings = await db.select().from(schema.listings)
    .where(and(eq(schema.listings.organizationId, org.id), eq(schema.listings.status, 'published')))
    .orderBy(desc(schema.listings.updatedAt));
  const ids = listings.map((l) => l.id);
  const evidence = await inChunks(ids, (slice) => db.select({ key: schema.files.key, name: schema.files.name, contentType: schema.files.contentType, size: schema.files.size, listingId: schema.files.listingId })
    .from(schema.files).where(and(inArray(schema.files.listingId, slice), eq(schema.files.purpose, 'evidence'), eq(schema.files.public, true))));
  const listingTags = await Promise.all(ids.map((id) => tagsOf('listing', id)));
  // only teammates who chose to publish their own page are named
  const team = await db.select({ name: schema.user.name, handle: schema.profiles.handle, headline: schema.profiles.headline, photoKey: schema.profiles.photoKey })
    .from(schema.members)
    .innerJoin(schema.user, eq(schema.user.id, schema.members.userId))
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.members.userId))
    .where(and(eq(schema.members.organizationId, org.id), eq(schema.profiles.published, true)))
    .orderBy(asc(schema.user.name));
  return {
    ...org,
    identityChecked: !!org.identityCheckedAt,
    tags: await tagsOf('organization', org.id),
    listings: listings.map((l, i) => ({ ...l, tags: listingTags[i], evidence: evidence.filter((e) => e.listingId === l.id) })),
    team,
  };
}
