// Serves uploaded files. A file is public only while the page that shows it is public: a profile photo while its
// profile is published, a logo, gallery picture or public certificate while its company is, listing photos and
// public evidence while the listing AND its company are (published and not held for wording review). Evidence and
// certificates are private until their owner makes them public; an expired certification's file is never public. Otherwise only the people who can edit that page
// (and admins) get a file; everyone else gets the same 404 as a missing key. Identity documents are never public.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { and, eq, type SQL } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { isMember } from '../../lib/guards';
import { isPublicListing, isPublicOrg } from '../../lib/visibility';
import { isExpired } from '../../lib/certifications';

export const prerender = false;

type FileRow = typeof schema.files.$inferSelect;

/** is the page that shows this file public right now? (published, and its wording not held for review) */
async function onPublicPage(row: FileRow): Promise<boolean> {
  if (!row.public || row.purpose === 'identity') return false;
  if (row.purpose === 'photo') {
    return !!(await db.query.profiles.findFirst({ where: and(eq(schema.profiles.photoKey, row.key), eq(schema.profiles.published, true)), columns: { id: true } }));
  }
  const orgPublic = async (where: SQL | undefined) => {
    const o = await db.query.organizations.findFirst({ where, columns: { published: true, greenReview: true } });
    return !!o && isPublicOrg(o);
  };
  if (row.purpose === 'logo') return orgPublic(eq(schema.organizations.logoKey, row.key));
  // a certificate file: while its company is public, the certification still points at it and has not expired
  // (an expired certificate stays with the team and admins)
  if (row.purpose === 'certificate') {
    const c = await db.query.certifications.findFirst({ where: eq(schema.certifications.evidenceKey, row.key), columns: { organizationId: true, expiresOn: true } });
    return !!c && c.organizationId === row.organizationId && !isExpired(c) && (await orgPublic(eq(schema.organizations.id, c.organizationId)));
  }
  // a gallery picture of the company itself: while the company is public; of a listing: while the listing is
  if (row.purpose === 'gallery' && !row.listingId) return !!row.organizationId && orgPublic(eq(schema.organizations.id, row.organizationId));
  if (!row.listingId) return false;
  const l = (await db.select({ status: schema.listings.status, greenReview: schema.listings.greenReview, published: schema.organizations.published, orgReview: schema.organizations.greenReview })
    .from(schema.listings)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.listings.organizationId))
    .where(eq(schema.listings.id, row.listingId)).limit(1))[0];
  return !!l && isPublicListing(l, { published: l.published, greenReview: l.orgReview });
}

/** can this signed-in member edit the page the file belongs to? */
async function canEdit(user: NonNullable<App.Locals['user']>, row: FileRow): Promise<boolean> {
  if (user.role === 'admin') return true;
  if (row.purpose === 'photo') return row.ownerUserId === user.id;
  return !!row.organizationId && (await isMember(user.id, row.organizationId));
}

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key ?? '';
  const row = await db.query.files.findFirst({ where: eq(schema.files.key, key) });
  if (!row) return new Response('Not found', { status: 404 });
  const open = await onPublicPage(row);
  if (!open && !(locals.user && (await canEdit(locals.user, row)))) return new Response('Not found', { status: 404 });
  const obj = await env.FILES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const disposition = row.contentType === 'application/pdf'
    ? `inline; filename*=UTF-8''${encodeURIComponent(row.name)}`
    : 'inline';
  // keys are random and never reused, so a public photo or logo can be cached for a long time. A listing's files
  // stop being public the moment the listing or its company is unpublished, so shared caches keep them 5 minutes.
  // A file served only to its editors stays in their browser for a minute; identity documents are never stored.
  const cache = open
    ? row.purpose === 'photo' || row.purpose === 'logo' ? 'public, max-age=31536000, immutable' : 'public, max-age=300'
    : row.public ? 'private, max-age=60' : 'private, no-store';
  return new Response(obj.body as unknown as ReadableStream, {
    headers: {
      'Content-Type': row.contentType,
      'Content-Length': String(row.size),
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Cache-Control': cache,
    },
  });
};
