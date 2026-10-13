// Uploaded files live in the FILES bucket; a row in `files` records who owns each one and whether it may be
// public. A `public` file is served to everyone only while the page showing it is public (src/pages/files).
// Evidence and certificate files start private; their owner can make each public (listings.setEvidencePublic).
// The type is decided from the file's first bytes, not from what the browser claims.
import { ActionError } from 'astro:actions';
import { eq, sql } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import type { FILE_PURPOSES } from '../db/schema/trade';

type Purpose = (typeof FILE_PURPOSES)[number];

const IMAGE = ['image/jpeg', 'image/png', 'image/webp'] as const;
const rules: Record<Purpose, { types: readonly string[]; maxBytes: number; public: boolean }> = {
  photo: { types: IMAGE, maxBytes: 5 * 1024 * 1024, public: true },
  logo: { types: IMAGE, maxBytes: 2 * 1024 * 1024, public: true },
  'listing-photo': { types: IMAGE, maxBytes: 5 * 1024 * 1024, public: true },
  // evidence and certificates start private (12 Oct): visible to the team and admins until the owner makes one public
  evidence: { types: [...IMAGE, 'application/pdf'], maxBytes: 10 * 1024 * 1024, public: false },
  certificate: { types: [...IMAGE, 'application/pdf'], maxBytes: 10 * 1024 * 1024, public: false },
  gallery: { types: IMAGE, maxBytes: 5 * 1024 * 1024, public: true },
  identity: { types: [...IMAGE, 'application/pdf'], maxBytes: 10 * 1024 * 1024, public: false },
};
const ext: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

/** jpeg, png, webp or pdf by signature; null for anything else (svg and html included) */
export function sniff(bytes: Uint8Array): string | null {
  const at = (i: number, ...b: number[]) => b.every((v, k) => bytes[i + k] === v);
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return 'image/png';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp';
  if (at(0, 0x25, 0x50, 0x44, 0x46, 0x2d)) return 'application/pdf';
  return null;
}

interface Owner { userId: string; organizationId?: string | null; listingId?: string | null }
/** `per`: count against the listing (default) or the whole company */
interface Limit { max: number; message: string; per?: 'listing' | 'organization' }

/**
 * Checks and stores one upload; returns its key. Throws a form error on a bad file.
 * With `limit`, at most `limit.max` files of this purpose may belong to the listing (or company); the count and the
 * insert are one statement, so parallel uploads cannot pass the limit.
 */
export async function putFile(file: File, purpose: Purpose, owner: Owner, limit?: Limit, extra: { caption?: string | null } = {}): Promise<string> {
  const rule = rules[purpose];
  if (!file || file.size === 0) throw new ActionError({ code: 'BAD_REQUEST', message: 'Choose a file.' });
  if (file.size > rule.maxBytes) throw new ActionError({ code: 'BAD_REQUEST', message: `Files can be up to ${rule.maxBytes / 1024 / 1024} MB.` });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type || !rule.types.includes(type)) {
    throw new ActionError({ code: 'BAD_REQUEST', message: rule.types.includes('application/pdf') ? 'Use a JPG, PNG, WebP or PDF file.' : 'Use a JPG, PNG or WebP image.' });
  }
  const key = `${purpose}/${crypto.randomUUID()}.${ext[type]}`;
  const name = (file.name || `file.${ext[type]}`).replace(/[^\p{L}\p{N} ._()-]/gu, '_').slice(0, 120);
  await env.FILES.put(key, bytes, { httpMetadata: { contentType: type } });
  let stored = false;
  try {
    const scope = limit?.per === 'organization' ? owner.organizationId : owner.listingId;
    if (limit && scope) {
      const counted = limit.per === 'organization' ? sql`organization_id = ${scope}` : sql`listing_id = ${scope}`;
      const res = await db.run(sql`INSERT INTO files (key, purpose, name, content_type, size, public, owner_user_id, organization_id, listing_id, caption)
        SELECT ${key}, ${purpose}, ${name}, ${type}, ${bytes.byteLength}, ${rule.public ? 1 : 0}, ${owner.userId}, ${owner.organizationId ?? null}, ${owner.listingId ?? null}, ${extra.caption ?? null}
        WHERE (SELECT count(*) FROM files WHERE ${counted} AND purpose = ${purpose}) < ${limit.max}`);
      stored = (res.meta?.changes ?? 0) > 0;
      if (!stored) throw new ActionError({ code: 'BAD_REQUEST', message: limit.message });
    } else {
      await db.insert(schema.files).values({
        key, purpose, name, contentType: type, size: bytes.byteLength, public: rule.public,
        ownerUserId: owner.userId, organizationId: owner.organizationId ?? null, listingId: owner.listingId ?? null, caption: extra.caption ?? null,
      });
      stored = true;
    }
  } finally {
    if (!stored) await env.FILES.delete(key);
  }
  return key;
}

export async function deleteFile(key: string | null | undefined): Promise<void> {
  if (!key) return;
  await db.delete(schema.files).where(eq(schema.files.key, key));
  await env.FILES.delete(key);
}

export { fileUrl } from './storage-url';
