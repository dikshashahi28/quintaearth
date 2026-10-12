// Checks every tag and country in data.mjs against the site's own lists; exits 1 on an unknown value.
import { industries, allSubs } from '../../src/data/industries.ts';
import { countries } from '../../src/data/countries.ts';
import { goals } from '../../src/data/sdgs.ts';
import { people, companies, enquiries, checks } from './data.mjs';
const ind = new Set(industries.map((i) => i.slug)), sub = new Set(allSubs.map((s) => s.slug));
const sdg = new Set(goals.map((g) => String(g.n))), iso = new Set(countries.map((c) => c.iso));
const bad = [];
const want = (set, vals, where) => { for (const v of vals ?? []) if (!set.has(v)) bad.push(`${where}: ${v}`); };
for (const p of people) { want(ind, p.industries, p.id); want(sub, p.subs, p.id); want(iso, [p.country], p.id); if (p.headline?.length > 120) bad.push(`${p.id}: headline`); if (p.bio?.length > 1200) bad.push(`${p.id}: bio`); }
const pid = new Set(people.map((p) => p.id)); const lid = new Set();
for (const c of companies) {
  want(ind, c.industries, c.id); want(sub, c.subs, c.id); want(sdg, c.sdgs, c.id); want(iso, [c.country], c.id);
  if (c.description.length > 1500) bad.push(`${c.id}: description`);
  for (const m of c.team) if (!pid.has(m)) bad.push(`${c.id}: team ${m}`);
  for (const l of c.listings) { want(sub, l.subs, l.id); want(iso, l.serves, l.id); if (l.description.length > 2000) bad.push(`${l.id}: description`); if (lid.has(l.id)) bad.push(`dup listing ${l.id}`); lid.add(l.id); }
}
const cid = new Set(companies.map((c) => c.id));
for (const e of enquiries) { if (!cid.has(e.to)) bad.push(`${e.id}: to`); if (e.listing && !lid.has(e.listing)) bad.push(`${e.id}: listing`); if (typeof e.from === 'string' && !pid.has(e.from)) bad.push(`${e.id}: from`); if (e.subject.length > 140) bad.push(`${e.id}: subject`); }
for (const k of Object.keys(checks)) if (!cid.has(k)) bad.push(`check ${k}`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('data ok');
