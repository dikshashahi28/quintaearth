// Checks every tag and country in data.mjs against the site's own lists; exits 1 on an unknown value.
import { industries, allSubs } from '../../src/data/industries.ts';
import { countries } from '../../src/data/countries.ts';
import { goals } from '../../src/data/sdgs.ts';
import { people, companies, enquiries, checks } from './data.mjs';
import { personExtras, companyExtras, listingExtras, extraListings, publicEvidence, personEnquiries } from './phase2.mjs';
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
// Phase 2 values
const open = new Set(['partnerships', 'advisory', 'hiring', 'work', 'volunteer']);
for (const [id, x] of Object.entries(personExtras)) {
  if (!pid.has(id)) bad.push(`personExtras ${id}`);
  want(sdg, x.sdgs, `${id} sdgs`); want(open, x.open, `${id} open`);
  if (x.company && !companies.find((c) => c.id === x.company)?.team.includes(id)) bad.push(`${id}: not on the team of ${x.company}`);
}
const sizes = new Set(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']);
for (const c of companies) if (!sizes.has(c.size)) bad.push(`${c.id}: size ${c.size}`);
for (const [id, x] of Object.entries(companyExtras)) { if (!cid.has(id)) bad.push(`companyExtras ${id}`); want(iso, x.operates, `${id} operates`);
  for (const ce of x.certs ?? []) { if (!ce.expires) bad.push(`${id} ${ce.id}: expiry`); if (!ce.file && !ce.registry) bad.push(`${id} ${ce.id}: evidence`); } }
for (const [id, ls] of Object.entries(extraListings)) { if (!cid.has(id)) bad.push(`extraListings ${id}`); for (const l of ls) { want(sub, l.subs, l.id); want(iso, l.serves, l.id); lid.add(l.id); } }
const ownerOf = new Map(companies.flatMap((c) => [...c.listings, ...(extraListings[c.id] ?? [])].map((l) => [l.id, c.id])));
for (const [id, x] of Object.entries(listingExtras)) {
  if (!lid.has(id)) bad.push(`listingExtras ${id}`);
  const certs = new Set((companyExtras[ownerOf.get(id)]?.certs ?? []).map((c) => c.id));
  for (const ce of x.certs ?? []) if (!certs.has(ce)) bad.push(`${id}: cert ${ce} is not its company's`);
}
for (const id of Object.keys(publicEvidence)) if (!lid.has(id)) bad.push(`publicEvidence ${id}`);
for (const e of personEnquiries) { if (!pid.has(e.toPerson)) bad.push(`${e.id}: toPerson`); if (!pid.has(e.from)) bad.push(`${e.id}: from`); }
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
console.log('data ok');
