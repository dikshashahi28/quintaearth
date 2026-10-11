// Keeps the `search` full-text table in step with published people, companies and listings.
// A save builds the new document from what it is about to write and puts the row's delete and insert in the SAME
// db.batch as the save (D1 has no interactive transactions; a batch is the atomic unit), so a failure cannot leave
// a live page out of search and two overlapping saves cannot leave two rows.
import { and, eq, inArray } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { db, schema } from '../db/client';
import { inChunks } from '../db/chunks';
import { countryName, industryName, subName } from './labels';

type EntityType = 'profile' | 'organization' | 'listing';
export type SearchDoc = { name: string; body: string } | null;

// what a search can find besides the free text: the display names of the tags (industries, sub-categories,
// served countries) and of the country, so "solar", "energy" or "Kenya" match what the page shows.
// scripts/reindex-search.mjs builds the same documents for rows saved before this; keep the two in step.
const names = (slugs: string[], name: (s: string) => string | null) => slugs.map(name).filter((n): n is string => !!n);
const body = (parts: (string | null | undefined)[]) => parts.filter(Boolean).join('\n');

export function profileDoc(p: { published: boolean; name: string; headline: string | null; bio: string | null; city: string | null; country: string | null },
  t: { skill: string[]; industry: string[]; sub: string[] }): SearchDoc {
  if (!p.published) return null;
  return { name: p.name, body: body([p.headline, p.bio, p.city, countryName(p.country), ...t.skill, ...names(t.industry, industryName), ...names(t.sub, subName)]) };
}

export function organizationDoc(o: { published: boolean; name: string; description: string | null; city: string | null; country: string | null },
  t: { industry: string[]; sub: string[] }): SearchDoc {
  if (!o.published) return null;
  return { name: o.name, body: body([o.description, o.city, countryName(o.country), ...names(t.industry, industryName), ...names(t.sub, subName)]) };
}

// a company is found through its published listings' rows too (src/db/queries/directory.ts), so a listing's
// name, sub-categories and served countries live here, where they leave the index with the listing
export function listingDoc(l: { status: 'draft' | 'published'; name: string; description: string | null }, org: { name: string; published: boolean },
  t: { sub: string[]; serves: string[] }): SearchDoc {
  if (l.status !== 'published' || !org.published) return null;
  return { name: l.name, body: body([l.description, org.name, ...names(t.sub, subName), ...names(t.serves, countryName)]) };
}

// the FTS5 table (migrations/0001_search.sql), described here only so its writes are query-builder statements:
// drizzle's D1 batch cannot run a raw db.run(sql`...`) that has parameters. It stays out of src/db/schema, so
// drizzle-kit never tries to create it as a plain table.
const search = sqliteTable('search', { entityType: text('entity_type').notNull(), entityId: text('entity_id').notNull(), name: text('name').notNull(), body: text('body').notNull() });

/** statements that rewrite one entity's search row (removed when `doc` is null); put them in the save's db.batch */
export function searchRows(type: EntityType, id: string, doc: SearchDoc) {
  const del = db.delete(search).where(and(eq(search.entityType, type), eq(search.entityId, id)));
  return doc ? [del, db.insert(search).values({ entityType: type, entityId: id, name: doc.name, body: doc.body })] : [del];
}

/**
 * Search rows for every listing of a company, as they will read once the company is saved as `org`: a company's
 * name and visibility are part of its listings' documents. Two reads (listings, then their tags in one IN query).
 */
export async function companyListingRows(organizationId: string, org: { name: string; published: boolean }) {
  const ls = await db.select({ id: schema.listings.id, name: schema.listings.name, description: schema.listings.description, status: schema.listings.status })
    .from(schema.listings).where(eq(schema.listings.organizationId, organizationId));
  const tagRows = await inChunks(ls.map((l) => l.id), (slice) => db.select({ id: schema.tags.entityId, kind: schema.tags.kind, value: schema.tags.value })
    .from(schema.tags).where(and(eq(schema.tags.entityType, 'listing'), inArray(schema.tags.entityId, slice))));
  return ls.flatMap((l) => {
    const mine = tagRows.filter((t) => t.id === l.id);
    const of = (kind: string) => mine.filter((t) => t.kind === kind).map((t) => t.value);
    return searchRows('listing', l.id, listingDoc(l, org, { sub: of('sub'), serves: of('serves') }));
  });
}

/** user text -> a safe FTS5 query: each word quoted, prefix-matched, all required */
export function ftsQuery(input: string): string | null {
  const words = input.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, 8) ?? [];
  return words.length ? words.map((w) => `"${w}"*`).join(' ') : null;
}
