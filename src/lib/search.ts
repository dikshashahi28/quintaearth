// Keeps the `search` full-text table in step with published people, companies and listings.
import { eq, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { tagsOf } from './tags';
import { countryName, industryName, subName } from './labels';

type EntityType = 'profile' | 'organization' | 'listing';

// what a search can find besides the free text: the display names of the tags (industries, sub-categories,
// served countries) and of the country, so "solar", "energy" or "Kenya" match what the page shows.
// scripts/reindex-search.mjs builds the same documents for rows saved before this; keep the two in step.
const names = (slugs: string[], name: (s: string) => string | null) => slugs.map(name).filter((n): n is string => !!n);

async function document(type: EntityType, id: string): Promise<{ name: string; body: string } | null> {
  if (type === 'profile') {
    const p = await db.query.profiles.findFirst({ where: eq(schema.profiles.id, id) });
    if (!p?.published) return null;
    const u = await db.query.user.findFirst({ where: eq(schema.user.id, p.userId), columns: { name: true } });
    const t = await tagsOf('profile', id);
    return {
      name: u?.name ?? '',
      body: [p.headline, p.bio, p.city, countryName(p.country), ...t.skill, ...names(t.industry, industryName), ...names(t.sub, subName)].filter(Boolean).join('\n'),
    };
  }
  if (type === 'organization') {
    const o = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, id) });
    if (!o?.published) return null;
    const t = await tagsOf('organization', id);
    return {
      name: o.name,
      body: [o.description, o.city, countryName(o.country), ...names(t.industry, industryName), ...names(t.sub, subName)].filter(Boolean).join('\n'),
    };
  }
  const l = await db.query.listings.findFirst({ where: eq(schema.listings.id, id) });
  if (!l || l.status !== 'published') return null;
  const o = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, l.organizationId), columns: { name: true, published: true } });
  if (!o?.published) return null;
  // a company is found through its published listings' rows too (src/db/queries/directory.ts), so a listing's
  // name, sub-categories and served countries live here, where they leave the index with the listing
  const t = await tagsOf('listing', id);
  return { name: l.name, body: [l.description, o.name, ...names(t.sub, subName), ...names(t.serves, countryName)].filter(Boolean).join('\n') };
}

/** rewrite the search row for one entity: removed when it is not (or no longer) public */
export async function reindex(type: EntityType, id: string): Promise<void> {
  const doc = await document(type, id);
  await db.run(sql`DELETE FROM search WHERE entity_type = ${type} AND entity_id = ${id}`);
  if (doc) await db.run(sql`INSERT INTO search (entity_type, entity_id, name, body) VALUES (${type}, ${id}, ${doc.name}, ${doc.body})`);
}

/** a company's visibility changes what its listings show too */
export async function reindexCompany(organizationId: string): Promise<void> {
  await reindex('organization', organizationId);
  const ls = await db.select({ id: schema.listings.id }).from(schema.listings).where(eq(schema.listings.organizationId, organizationId));
  for (const l of ls) await reindex('listing', l.id);
}

export async function unindex(type: EntityType, ids: string[]): Promise<void> {
  for (const id of ids) await db.run(sql`DELETE FROM search WHERE entity_type = ${type} AND entity_id = ${id}`);
}

/** user text -> a safe FTS5 query: each word quoted, prefix-matched, all required */
export function ftsQuery(input: string): string | null {
  const words = input.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, 8) ?? [];
  return words.length ? words.map((w) => `"${w}"*`).join(' ') : null;
}

