// Serves uploaded files. Public files to anyone; identity documents only to their company's members and admins.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { db, schema } from '../../db/client';
import { isMember } from '../../lib/guards';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key ?? '';
  const row = await db.query.files.findFirst({ where: eq(schema.files.key, key) });
  if (!row) return new Response('Not found', { status: 404 });
  if (!row.public) {
    const user = locals.user;
    const allowed = !!user && (user.role === 'admin' || (!!row.organizationId && (await isMember(user.id, row.organizationId))));
    if (!allowed) return new Response('Not found', { status: 404 });
  }
  const obj = await env.FILES.get(key);
  if (!obj) return new Response('Not found', { status: 404 });
  const disposition = row.contentType === 'application/pdf'
    ? `inline; filename*=UTF-8''${encodeURIComponent(row.name)}`
    : 'inline';
  return new Response(obj.body as unknown as ReadableStream, {
    headers: {
      'Content-Type': row.contentType,
      'Content-Length': String(row.size),
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      // keys are random and never reused, so public files can be cached for a long time
      'Cache-Control': row.public ? 'public, max-age=31536000, immutable' : 'private, no-store',
    },
  });
};
