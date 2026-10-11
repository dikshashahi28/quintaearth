// Serves uploaded files. A file is public only while the page that shows it is public: a profile photo while its
// profile is published, a logo while its company is, listing photos and evidence while the listing AND its company
// are. Otherwise only the people who can edit that page (and admins) get it; everyone else gets the same 404 as a
// missing key. Identity documents are never public: their company's team and admins only.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { isMember } from '../../lib/guards';

export const prerender = false;

type FileRow = typeof schema.files.$inferSelect;

/** is the page that shows this file public right now? */
async function onPublicPage(row: FileRow): Promise<boolean> {
  if (!row.public) return false;
  if (row.purpose === 'photo') {
    return !!(await db.query.profiles.findFirst({ where: and(eq(schema.profiles.photoKey, row.key), eq(schema.profiles.published, true)), columns: { id: true } }));
  }
  if (row.purpose === 'logo') {
    return !!(await db.query.organizations.findFirst({ where: and(eq(schema.organizations.logoKey, row.key), eq(schema.organizations.published, true)), columns: { id: true } }));
  }
  if (!row.listingId) return false;
  const l = (await db.select({ status: schema.listings.status, published: schema.organizations.published }).from(schema.listings)
    .innerJoin(schema.organizations, eq(schema.organizations.id, schema.listings.organizationId))
    .where(eq(schema.listings.id, row.listingId)).limit(1))[0];
  return !!l && l.status === 'published' && l.published;
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
