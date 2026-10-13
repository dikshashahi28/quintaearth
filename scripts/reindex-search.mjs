// One-off: rebuild the `search` full-text rows for every published person, company and listing, so rows saved
// before the documents gained tag and country names (11 Oct 2026) match the same words a fresh save would.
// Builds the same documents as src/lib/search.ts (keep the two in step) and replaces the whole table in one file.
//
//   local:  node scripts/reindex-search.mjs --local
//   dev:    node scripts/reindex-search.mjs --remote --env dev
//   prod:   node scripts/reindex-search.mjs --remote
//
// Add --dry-run to print the SQL instead of running it. Safe to run more than once.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { industries, allSubs } from '../src/data/industries.ts';
import { countries } from '../src/data/countries.ts';

const args = process.argv.slice(2);
const remote = args.includes('--remote');
const local = args.includes('--local');
const dry = args.includes('--dry-run');
const envIdx = args.indexOf('--env');
const env = envIdx >= 0 ? args[envIdx + 1] : '';
if (remote === local) { console.error('say --local or --remote (with --env dev for dev.quintaearth.com)'); process.exit(2); }
const database = env === 'dev' ? 'quintaearth-dev' : 'quintaearth';
const target = [remote ? '--remote' : '--local', ...(env ? ['--env', env] : [])];

const wrangler = (extra) => execFileSync('pnpm', ['-s', 'wrangler', 'd1', 'execute', database, ...target, ...extra], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
const rows = (query) => JSON.parse(wrangler(['--json', '--command', query]))[0].results;

const industryName = new Map(industries.map((i) => [i.slug, i.name]));
const subName = new Map(allSubs.map((s) => [s.slug, s.name]));
const countryName = new Map(countries.map((c) => [c.iso, c.name]));
const names = (slugs, map) => slugs.map((s) => map.get(s)).filter(Boolean);

const empty = () => ({ industry: [], sub: [], sdg: [], skill: [], serves: [], operates: [], language: [], open: [], service: [], tag: [] });
const tags = new Map();
for (const t of rows('SELECT entity_type, entity_id, kind, value FROM tags')) {
  const key = `${t.entity_type}:${t.entity_id}`;
  if (!tags.has(key)) tags.set(key, empty());
  tags.get(key)[t.kind]?.push(t.value);
}
const tagsOf = (type, id) => tags.get(`${type}:${id}`) ?? empty();
// never an email address or phone number in the index (the same rule as src/lib/contact.ts scrub; keep in step)
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const PHONE_RUN = /(?<![\p{L}\p{N}.,/])\+?\d[\d ().\-\u00a0]{6,}\d(?![\p{L}\p{N}])/gu;
const isPhone = (run) => { const d = run.replace(/\D/g, '').length; return d <= 15 && (d >= 10 || (run.startsWith('+') && d >= 8)); };
const scrub = (t) => t.replace(EMAIL, '[contact hidden]').replace(PHONE_RUN, (m) => (isPhone(m) ? '[contact hidden]' : m));
const body = (parts) => scrub(parts.filter(Boolean).join('\n'));

const docs = [];
// what is public: src/lib/visibility.ts (published, and wording not held for review)
for (const p of rows('SELECT p.id, u.name, p.headline, p.role_title, p.company_name, p.bio, p.city, p.country FROM profiles p JOIN user u ON u.id = p.user_id WHERE p.published = 1')) {
  const t = tagsOf('profile', p.id);
  docs.push(['profile', p.id, p.name ?? '', body([p.headline, p.role_title, p.company_name, p.bio, p.city, countryName.get(p.country), ...t.skill, ...t.service, ...t.language,
    ...names(t.industry, industryName), ...names(t.sub, subName)])]);
}
for (const o of rows("SELECT id, name, legal_name, CASE WHEN green_review NOT IN ('pending', 'rejected') THEN description END AS description, CASE WHEN green_review NOT IN ('pending', 'rejected') THEN research END AS research, city, country, CASE WHEN green_review NOT IN ('pending', 'rejected') THEN case_studies END AS case_studies FROM organizations WHERE published = 1")) {
  const t = tagsOf('organization', o.id);
  const cases = o.case_studies ? JSON.parse(o.case_studies) : [];
  docs.push(['organization', o.id, o.name, body([o.legal_name, o.description, o.research, o.city, countryName.get(o.country), ...names(t.operates, countryName),
    ...names(t.industry, industryName), ...names(t.sub, subName), ...cases.flatMap((c) => [c.title, c.client, c.summary])])]);
}
for (const l of rows("SELECT l.id, l.name, l.description, l.specs, o.name AS org FROM listings l JOIN organizations o ON o.id = l.organization_id WHERE l.status = 'published' AND l.green_review NOT IN ('pending', 'rejected') AND o.published = 1")) {
  const t = tagsOf('listing', l.id);
  docs.push(['listing', l.id, l.name, body([l.description, l.specs, ...t.tag, l.org, ...names(t.sub, subName), ...names(t.serves, countryName)])]);
}

const q = (v) => `'${String(v).replaceAll("'", "''")}'`;
const sqlText = ['DELETE FROM search;', ...docs.map(([type, id, name, text]) => `INSERT INTO search (entity_type, entity_id, name, body) VALUES (${[type, id, scrub(name), text].map(q).join(', ')});`)].join('\n');
if (dry) { console.log(sqlText); process.exit(0); }

const dir = mkdtempSync(join(tmpdir(), 'qe-reindex-'));
try {
  const file = join(dir, 'reindex.sql');
  writeFileSync(file, sqlText);
  wrangler(['--file', file, ...(remote ? ['--yes'] : [])]);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
const n = (type) => docs.filter((d) => d[0] === type).length;
console.log(`search rebuilt (${database}${remote ? ', remote' : ', local'}): ${n('profile')} people, ${n('organization')} companies, ${n('listing')} listings`);
