// The directory: public people and companies, filtered by tags, country, certification, size, countries served,
// product or service, identity and how recently they joined, optionally matched by text. `directoryFacets` returns,
// for each filter, only the options that would still give results with the other filters as they are, so the page
// can hide the empty ones.
import { sql, type SQL } from 'drizzle-orm';
import { db } from '../client';
import { ftsQuery } from '../../lib/search';
import { identityCheckedSql } from '../../lib/identity';
import { personCheckedSql } from '../../lib/person-identity';
import { publicDescriptionSql, publicListingSql, publicOrgSql } from '../../lib/visibility';
import { scrub } from '../../lib/contact';

export interface DirectoryFilters {
  q?: string;
  type?: 'person' | 'company';
  industry?: string;
  sub?: string;
  sdg?: string;
  country?: string;
  /** "Identity checked" only: companies checked within the year, people with LinkedIn linked */
  checked?: boolean;
  /** a current (unexpired) certification, by name, any case */
  cert?: string;
  /** company size range */
  size?: string;
  /** a country the company serves (a listing's countries) or operates in, apart from its head office */
  serves?: string;
  /** companies with a public product, or a public service */
  offer?: 'product' | 'service';
  /** joined in the last 30 days */
  recent?: boolean;
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
export const RECENT_DAYS = 30;
/** filters that only companies have: with one of them set, people are left out */
const COMPANY_ONLY = ['cert', 'size', 'serves', 'offer'] as const;

/** how many of the matches are companies and how many are people (all pages) */
export interface DirectoryCounts { company: number; person: number }

const all = (parts: SQL[]) => (parts.length ? sql.join(parts, sql` AND `) : sql`1 = 1`);

/** the WHERE parts for people and companies under these filters; null when that side cannot match at all */
function conditions(f: DirectoryFilters, match: string | null) {
  const now = Date.now();
  const tagFilter = (entity: 'profile' | 'organization', idCol: SQL) => {
    const parts: SQL[] = [];
    for (const [kind, value] of [['industry', f.industry], ['sub', f.sub], ['sdg', f.sdg]] as const) {
      if (value) parts.push(sql`EXISTS (SELECT 1 FROM tags t WHERE t.entity_type = ${entity} AND t.entity_id = ${idCol} AND t.kind = ${kind} AND t.value = ${value})`);
    }
    return parts;
  };
  const people: SQL[] = [sql`p.published = 1`, ...tagFilter('profile', sql`p.id`)];
  const companies: SQL[] = [publicOrgSql('o'), ...tagFilter('organization', sql`o.id`)];
  if (f.country) { people.push(sql`p.country = ${f.country}`); companies.push(sql`o.country = ${f.country}`); }
  if (f.checked) { people.push(personCheckedSql('p')); companies.push(identityCheckedSql()); }
  if (f.recent) { const since = now - RECENT_DAYS * 86_400_000; people.push(sql`p.created_at > ${since}`); companies.push(sql`o.created_at > ${since}`); }
  if (f.cert) companies.push(sql`EXISTS (SELECT 1 FROM certifications c WHERE c.organization_id = o.id AND lower(c.name) = ${f.cert.toLowerCase()} AND c.expires_on > ${now})`);
  if (f.size) companies.push(sql`o.size = ${f.size}`);
  if (f.serves) {
    companies.push(sql`(EXISTS (SELECT 1 FROM tags t WHERE t.entity_type = 'organization' AND t.entity_id = o.id AND t.kind = 'operates' AND t.value = ${f.serves})
      OR EXISTS (SELECT 1 FROM listings l JOIN tags t ON t.entity_type = 'listing' AND t.entity_id = l.id AND t.kind = 'serves' AND t.value = ${f.serves}
        WHERE l.organization_id = o.id AND ${publicListingSql('l', 'o')}))`);
  }
  if (f.offer) companies.push(sql`EXISTS (SELECT 1 FROM listings l WHERE l.organization_id = o.id AND l.kind = ${f.offer} AND ${publicListingSql('l', 'o')})`);
  if (match) {
    people.push(sql`p.id IN (SELECT entity_id FROM search WHERE search MATCH ${match} AND entity_type = 'profile')`);
    // a company matches by its own text or by one of its public listings
    companies.push(sql`(o.id IN (SELECT entity_id FROM search WHERE search MATCH ${match} AND entity_type = 'organization')
      OR o.id IN (SELECT l.organization_id FROM search s JOIN listings l ON l.id = s.entity_id WHERE search MATCH ${match} AND s.entity_type = 'listing'))`);
  }
  const peopleOn = f.type !== 'company' && !COMPANY_ONLY.some((k) => f[k]);
  const companiesOn = f.type !== 'person';
  return { people: peopleOn ? people : null, companies: companiesOn ? companies : null };
}

export async function searchDirectory(f: DirectoryFilters): Promise<{ rows: DirectoryRow[]; more: boolean; total: number; counts: DirectoryCounts }> {
  const match = f.q ? ftsQuery(f.q) : null;
  // a search with no letters or digits (only punctuation or emoji) matches nothing, rather than everyone
  if (f.q && !match) return { rows: [], more: false, total: 0, counts: { company: 0, person: 0 } };
  const page = Math.max(1, Math.min(f.page ?? 1, 100));
  const { people, companies } = conditions(f, match);

  const parts: SQL[] = [];
  if (people) {
    parts.push(sql`SELECT 'person' AS type, p.id, u.name, p.handle AS slug, p.headline AS line, p.city, p.country, p.photo_key AS imageKey,
      (${personCheckedSql('p')}) AS identityChecked, p.updated_at AS updatedAt FROM profiles p JOIN user u ON u.id = p.user_id WHERE ${all(people)}`);
  }
  if (companies) {
    parts.push(sql`SELECT 'company' AS type, o.id, o.name, o.slug, ${publicDescriptionSql('o')} AS line, o.city, o.country, o.logo_key AS imageKey,
      (${identityCheckedSql()}) AS identityChecked, o.updated_at AS updatedAt FROM organizations o WHERE ${all(companies)}`);
  }
  if (!parts.length) return { rows: [], more: false, total: 0, counts: { company: 0, person: 0 } };

  const rows = await db.all<DirectoryRow & { updatedAt: number }>(sql`${sql.join(parts, sql` UNION ALL `)}
    ORDER BY identityChecked DESC, updatedAt DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${(page - 1) * PAGE_SIZE}`);
  // the totals are only worth a second query when there is more than one page; on a single page the rows are all of them
  const counts: DirectoryCounts = { company: 0, person: 0 };
  if (rows.length > PAGE_SIZE || page > 1) {
    const byType = await db.all<{ type: 'person' | 'company'; n: number }>(sql`SELECT type, count(*) AS n FROM (${sql.join(parts, sql` UNION ALL `)}) GROUP BY type`);
    for (const r of byType) counts[r.type] = r.n;
  } else {
    for (const r of rows) counts[r.type]++;
  }
  const total = counts.company + counts.person;
  // the line under each name is member text: no email address or phone number
  return { rows: rows.slice(0, PAGE_SIZE).map(({ updatedAt: _u, ...r }) => ({ ...r, name: scrub(r.name), line: scrub(r.line) })), more: rows.length > PAGE_SIZE, total, counts };
}

export interface DirectoryFacets {
  industry: Set<string>; sub: Set<string>; sdg: Set<string>; country: Set<string>; cert: string[]; size: Set<string>; serves: Set<string>;
  offer: Set<string>; checked: boolean; recent: boolean; type: Set<string>;
}

/**
 * For each filter, the options that still give at least one result when every OTHER filter (and the search text)
 * stays as it is. One query: a UNION of small DISTINCT lookups, each over its own matching set.
 */
export async function directoryFacets(f: DirectoryFilters): Promise<DirectoryFacets> {
  const match = f.q ? ftsQuery(f.q) : null;
  const out: DirectoryFacets = { industry: new Set(), sub: new Set(), sdg: new Set(), country: new Set(), cert: [], size: new Set(), serves: new Set(), offer: new Set(), checked: false, recent: false, type: new Set() };
  if (f.q && !match) return out;
  const now = Date.now();
  const ids = (g: DirectoryFilters) => {
    const { people, companies } = conditions(g, match);
    return {
      people: people ? sql`SELECT p.id FROM profiles p WHERE ${all(people)}` : sql`SELECT NULL WHERE 0`,
      companies: companies ? sql`SELECT o.id FROM organizations o WHERE ${all(companies)}` : sql`SELECT NULL WHERE 0`,
    };
  };
  const without = (...keys: (keyof DirectoryFilters)[]) => ids(Object.fromEntries(Object.entries(f).filter(([k]) => !keys.includes(k as keyof DirectoryFilters))) as DirectoryFilters);
  const tagFacet = (name: string, kind: string, s: ReturnType<typeof ids>) =>
    sql`SELECT ${name} AS facet, t.value AS value FROM tags t WHERE t.kind = ${kind} AND ((t.entity_type = 'profile' AND t.entity_id IN (${s.people})) OR (t.entity_type = 'organization' AND t.entity_id IN (${s.companies})))`;
  const ind = without('industry', 'sub'), sdg = without('sdg'), cty = without('country'), cert = without('cert'), size = without('size'), srv = without('serves'),
    off = without('offer'), chk = without('checked'), rec = without('recent'), typ = without('type');
  const parts = [
    tagFacet('industry', 'industry', ind),
    tagFacet('sub', 'sub', ind),
    tagFacet('sdg', 'sdg', sdg),
    sql`SELECT 'country', p.country FROM profiles p WHERE p.country IS NOT NULL AND p.id IN (${cty.people}) UNION SELECT 'country', o.country FROM organizations o WHERE o.country IS NOT NULL AND o.id IN (${cty.companies})`,
    sql`SELECT 'cert', c.name FROM certifications c WHERE c.expires_on > ${now} AND c.organization_id IN (${cert.companies})`,
    sql`SELECT 'size', o.size FROM organizations o WHERE o.size IS NOT NULL AND o.id IN (${size.companies})`,
    sql`SELECT 'serves', t.value FROM tags t WHERE t.kind = 'operates' AND t.entity_type = 'organization' AND t.entity_id IN (${srv.companies})
      UNION SELECT 'serves', t.value FROM tags t JOIN listings l ON t.entity_type = 'listing' AND t.entity_id = l.id JOIN organizations o ON o.id = l.organization_id
        WHERE t.kind = 'serves' AND ${publicListingSql('l', 'o')} AND l.organization_id IN (${srv.companies})`,
    sql`SELECT 'offer', l.kind FROM listings l JOIN organizations o ON o.id = l.organization_id WHERE ${publicListingSql('l', 'o')} AND l.organization_id IN (${off.companies})`,
    sql`SELECT 'checked', '1' FROM profiles p WHERE p.id IN (${chk.people}) AND ${personCheckedSql('p')} UNION SELECT 'checked', '1' FROM organizations o WHERE o.id IN (${chk.companies}) AND ${identityCheckedSql()}`,
    sql`SELECT 'recent', '1' FROM profiles p WHERE p.id IN (${rec.people}) AND p.created_at > ${now - RECENT_DAYS * 86_400_000}
      UNION SELECT 'recent', '1' FROM organizations o WHERE o.id IN (${rec.companies}) AND o.created_at > ${now - RECENT_DAYS * 86_400_000}`,
    sql`SELECT 'type', 'person' FROM profiles p WHERE p.id IN (${typ.people}) UNION SELECT 'type', 'company' FROM organizations o WHERE o.id IN (${typ.companies})`,
  ];
  // one statement per filter, run side by side: D1 binds at most 100 values per statement, and with every filter
  // set the whole union would pass that
  const rows = (await Promise.all(parts.map((p) => db.all<{ facet: string; value: string }>(sql`SELECT DISTINCT * FROM (${p})`)))).flat()
    .map((r) => { const [facet, value] = Object.values(r) as [string, string]; return { facet, value }; });
  const certs = new Map<string, string>();
  for (const { facet, value } of rows) {
    if (value == null) continue;
    if (facet === 'checked') out.checked = true;
    else if (facet === 'recent') out.recent = true;
    else if (facet === 'cert') { if (!certs.has(value.toLowerCase())) certs.set(value.toLowerCase(), value); }
    else (out[facet as 'industry'] as Set<string>).add(value);
  }
  out.cert = [...certs.values()].sort((a, b) => a.localeCompare(b));
  return out;
}
