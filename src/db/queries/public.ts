// Data for the public pages. Only what the public may see is returned (src/lib/visibility.ts), except an owner's
// preview (`hidden`). Never an email address or a phone number: contact goes through enquiries.
import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { db, schema } from '../client';
import { inChunks } from '../chunks';
import { emptyTags, tagsOf } from '../../lib/tags';
import { isExpired } from '../../lib/certifications';
import { isIdentityChecked } from '../../lib/identity';
import { personChecked } from '../../lib/person-identity';
import { isPublicOrg, publicCaseStudies, publicDescription, publicResearch } from '../../lib/visibility';
import { scrub } from '../../lib/contact';

const HELD = ['pending', 'rejected'] as const;

/** `hidden`: also an unpublished profile, for its owner's preview (the caller checks who is looking) */
export async function getPublicPerson(handle: string, { hidden = false } = {}) {
  const p = await db.query.profiles.findFirst({ where: and(eq(schema.profiles.handle, handle), hidden ? undefined : eq(schema.profiles.published, true)) });
  if (!p) return null;
  const u = (await db.query.user.findFirst({ where: eq(schema.user.id, p.userId), columns: { name: true, createdAt: true } }))!;
  // companies the person is on (they accepted the invitation: team opt-in) and that the public can see
  const companies = (await db.select({ id: schema.organizations.id, name: schema.organizations.name, slug: schema.organizations.slug, role: schema.members.role,
    published: schema.organizations.published, greenReview: schema.organizations.greenReview })
    .from(schema.members)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.members.organizationId))
    .where(and(eq(schema.members.userId, p.userId), eq(schema.organizations.published, true))))
    .filter(isPublicOrg);
  // the current role's company links to its page only while that page is public and the person is still on its team
  const roleCompany = p.companyOrgId ? companies.find((c) => c.id === p.companyOrgId) ?? null : null;
  const { userId, companyOrgId: _org, ...profile } = p;
  return {
    ...profile,
    // member text is shown publicly: no email address or phone number, even if saved before that rule
    headline: scrub(profile.headline), bio: scrub(profile.bio), roleTitle: scrub(profile.roleTitle), companyName: scrub(profile.companyName),
    name: scrub(u.name),
    /** member since: when the account was made */
    memberSince: u.createdAt,
    identityChecked: await personChecked(userId),
    tags: await tagsOf('profile', p.id),
    companies: companies.map(({ name, slug, role }) => ({ name: scrub(name), slug, role })),
    companyLink: roleCompany ? { name: scrub(roleCompany.name), slug: roleCompany.slug } : null,
  };
}

/** `hidden`: also an unpublished (or held for review) company, for its team's preview (the caller checks who is
 * looking); its listings, evidence and team are still only what the public would see once it is public */
export async function getPublicCompany(slug: string, { hidden = false } = {}) {
  const org = await db.query.organizations.findFirst({ where: eq(schema.organizations.slug, slug) });
  if (!org || (!hidden && !isPublicOrg(org))) return null;
  const listings = await db.select().from(schema.listings)
    .where(and(eq(schema.listings.organizationId, org.id), eq(schema.listings.status, 'published'), notInArray(schema.listings.greenReview, [...HELD])))
    .orderBy(desc(schema.listings.updatedAt));
  const ids = listings.map((l) => l.id);
  // only evidence the owner made public
  const evidence = await inChunks(ids, (slice) => db.select({ key: schema.files.key, name: schema.files.name, contentType: schema.files.contentType, size: schema.files.size, listingId: schema.files.listingId })
    .from(schema.files).where(and(inArray(schema.files.listingId, slice), eq(schema.files.purpose, 'evidence'), eq(schema.files.public, true))));
  // every listing's tags in one IN query (in slices for D1's bind limit), not one query per listing
  const tagRows = await inChunks(ids, (slice) => db.select({ id: schema.tags.entityId, kind: schema.tags.kind, value: schema.tags.value })
    .from(schema.tags).where(and(eq(schema.tags.entityType, 'listing'), inArray(schema.tags.entityId, slice))));
  const listingTags = ids.map((id) => {
    const out = emptyTags();
    for (const t of tagRows) if (t.id === id) out[t.kind].push(t.value);
    return out;
  });
  // certifications: one list for the company; listings point into it. Expired ones say so (decided now).
  const certRows = await db.select({ cert: schema.certifications, fileKey: schema.files.key, fileName: schema.files.name, filePublic: schema.files.public })
    .from(schema.certifications).leftJoin(schema.files, eq(schema.files.key, schema.certifications.evidenceKey))
    .where(eq(schema.certifications.organizationId, org.id)).orderBy(asc(schema.certifications.name));
  const certifications = certRows.map((r) => ({
    id: r.cert.id, name: scrub(r.cert.name), issuer: scrub(r.cert.issuer), registryUrl: r.cert.registryUrl, issuedOn: r.cert.issuedOn, expiresOn: r.cert.expiresOn,
    expired: isExpired(r.cert),
    // the certificate file only when its owner made it public and the certification has not expired
    file: r.fileKey && r.filePublic && !isExpired(r.cert) ? { key: r.fileKey, name: r.fileName! } : null,
  }));
  const links = await inChunks(ids, (slice) => db.select().from(schema.listingCertifications).where(inArray(schema.listingCertifications.listingId, slice)));
  const gallery = await db.select({ key: schema.files.key, caption: schema.files.caption, listingId: schema.files.listingId }).from(schema.files)
    .where(and(eq(schema.files.organizationId, org.id), eq(schema.files.purpose, 'gallery'))).orderBy(asc(schema.files.createdAt));
  const listed = new Set(ids);
  // only teammates who accepted the invitation (members) and chose to publish their own page are named
  const team = (await db.select({ name: schema.user.name, handle: schema.profiles.handle, headline: schema.profiles.headline, photoKey: schema.profiles.photoKey })
    .from(schema.members)
    .innerJoin(schema.user, eq(schema.user.id, schema.members.userId))
    .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.members.userId))
    .where(and(eq(schema.members.organizationId, org.id), eq(schema.profiles.published, true)))
    .orderBy(asc(schema.user.name))).map((t) => ({ ...t, name: scrub(t.name), headline: scrub(t.headline) }));
  const {
    greenHash: _h, greenTerms: _t, greenReason: _r, identityLapsed: _l, ...pub
  } = org;
  return {
    ...pub,
    // names are public text too: no email address or phone number, even if saved before that rule
    name: scrub(pub.name), legalName: scrub(pub.legalName),
    // a description (with its research and case studies) held for the wording review is not public; the page is (owner decision, 12 Oct)
    description: scrub(publicDescription(pub)), research: scrub(publicResearch(pub)),
    caseStudies: publicCaseStudies(pub)?.map((c) => ({ title: scrub(c.title), client: scrub(c.client), summary: scrub(c.summary) })) ?? null,
    identityChecked: isIdentityChecked(org),
    tags: await tagsOf('organization', org.id),
    certifications,
    // pictures of a listing the public cannot see stay out
    gallery: gallery.filter((g) => !g.listingId || listed.has(g.listingId)).map((g) => ({ ...g, caption: scrub(g.caption) })),
    listings: listings.map((l, i) => ({
      ...l, name: scrub(l.name), description: scrub(l.description), specs: scrub(l.specs), leadTime: scrub(l.leadTime), tags: listingTags[i]!, evidence: evidence.filter((e) => e.listingId === l.id),
      certifications: certifications.filter((c) => links.some((k) => k.listingId === l.id && k.certificationId === c.id)),
    })),
    team,
  };
}
