// The directory: published people and companies, filtered by tags and country, optionally matched by text.
import { sql, type SQL } from 'drizzle-orm';
import { db } from '../client';
import { ftsQuery } from '../../lib/search';

export interface DirectoryFilters {
  q?: string;
  type?: 'person' | 'company';
  industry?: string;
  sub?: string;
  sdg?: string;
  country?: string;
  /** companies with "Identity checked" only */
  checked?: boolean;
  page?: number;
}

export interface DirectoryRow {
  type: 'person' | 'company';
  id: string;
  name: string;
  slug: string;
  line: string | null;
  city: string | null;
  country: string | null;
  imageKey: string | null;
  identityChecked: number;
}

export const PAGE_SIZE = 24;

export async function searchDirectory(f: DirectoryFilters): Promise<{ rows: DirectoryRow[]; more: boolean; total: number }> {
  const match = f.q ? ftsQuery(f.q) : null;
  // a search with no letters or digits (only punctuation or emoji) matches nothing, rather than everyone
  if (f.q && !match) return { rows: [], more: false, total: 0 };
  const page = Math.max(1, Math.min(f.page ?? 1, 100));

  const tagFilter = (entity: 'profile' | 'organization', idCol: SQL) => {
    const parts: SQL[] = [];
    for (const [kind, value] of [['industry', f.industry], ['sub', f.sub], ['sdg', f.sdg]] as const) {
      if (value) parts.push(sql`EXISTS (SELECT 1 FROM tags t WHERE t.entity_type = ${entity} AND t.entity_id = ${idCol} AND t.kind = ${kind} AND t.value = ${value})`);
    }
    return parts;
  };
  const and = (parts: SQL[]) => (parts.length ? sql.join(parts, sql` AND `) : sql`1 = 1`);

  const people: SQL[] = [sql`p.published = 1`, ...tagFilter('profile', sql`p.id`)];
  const companies: SQL[] = [sql`o.published = 1`, ...tagFilter('organization', sql`o.id`)];
  if (f.country) { people.push(sql`p.country = ${f.country}`); companies.push(sql`o.country = ${f.country}`); }
  if (f.checked) companies.push(sql`o.identity_checked_at IS NOT NULL`);
  if (match) {
    people.push(sql`p.id IN (SELECT entity_id FROM search WHERE search MATCH ${match} AND entity_type = 'profile')`);
    // a company matches by its own text or by one of its published listings
    companies.push(sql`(o.id IN (SELECT entity_id FROM search WHERE search MATCH ${match} AND entity_type = 'organization')
      OR o.id IN (SELECT l.organization_id FROM search s JOIN listings l ON l.id = s.entity_id WHERE search MATCH ${match} AND s.entity_type = 'listing'))`);
  }

  const parts: SQL[] = [];
  if (f.type !== 'company' && !f.checked) {
    parts.push(sql`SELECT 'person' AS type, p.id, u.name, p.handle AS slug, p.headline AS line, p.city, p.country, p.photo_key AS imageKey,
      0 AS identityChecked, p.updated_at AS updatedAt FROM profiles p JOIN user u ON u.id = p.user_id WHERE ${and(people)}`);
  }
  if (f.type !== 'person') {
    parts.push(sql`SELECT 'company' AS type, o.id, o.name, o.slug, o.description AS line, o.city, o.country, o.logo_key AS imageKey,
      (o.identity_checked_at IS NOT NULL) AS identityChecked, o.updated_at AS updatedAt FROM organizations o WHERE ${and(companies)}`);
  }
  if (!parts.length) return { rows: [], more: false, total: 0 };

  const rows = await db.all<DirectoryRow & { updatedAt: number }>(sql`${sql.join(parts, sql` UNION ALL `)}
    ORDER BY identityChecked DESC, updatedAt DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${(page - 1) * PAGE_SIZE}`);
  // the total is only worth a second query when there is more than one page
  const total = rows.length > PAGE_SIZE || page > 1
    ? (await db.all<{ n: number }>(sql`SELECT count(*) AS n FROM (${sql.join(parts, sql` UNION ALL `)})`))[0]?.n ?? 0
    : rows.length;
  return { rows: rows.slice(0, PAGE_SIZE).map(({ updatedAt: _u, ...r }) => r), more: rows.length > PAGE_SIZE, total };
}
