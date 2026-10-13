// Fills a QuintaEarth database and file bucket with the demo community in data.mjs, so the member pages look
// lived in while there are few real members. Local first, then the dev site; never production.
//
//   node scripts/seed-demo/seed-demo.mjs --local              the dev server's D1 and bucket (.wrangler/state)
//   node scripts/seed-demo/seed-demo.mjs --remote --env dev   dev.quintaearth.com
//   add --wipe to remove the demo rows and files and stop there; --dry-run writes the SQL to build/ and stops
//   add --verify to print a fingerprint of the demo rows (run it for both targets and compare)
//
// Re-running replaces the demo rows (same ids, same timestamps), so two targets seeded from the same checkout hold
// the same data. Every demo member shares one password, kept in scripts/seed-demo/.credentials.txt (git-ignored).
import { execFile, execFileSync } from 'node:child_process';
import { createHash, webcrypto } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { NOW, PASSWORD_FILE, admin, checks, companies, enquiries, invites, people } from './data.mjs';
import { companyExtras, extraListings, listingExtras, personEnquiries, personExtras, publicEvidence } from './phase2.mjs';
import { companyGreenTexts, findGreenTerms, greenHash, listingGreenTexts } from '../../src/lib/green-words.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const args = process.argv.slice(2);
const remote = args.includes('--remote'), local = args.includes('--local');
const env = args.includes('--env') ? args[args.indexOf('--env') + 1] : '';
const wipeOnly = args.includes('--wipe'), dry = args.includes('--dry-run'), verifyOnly = args.includes('--verify');
if (remote === local) fail('say --local or --remote --env dev');
if (remote && env !== 'dev') fail('the demo data goes on the dev site only: --remote --env dev');
const database = remote ? 'quintaearth-dev' : 'quintaearth';
const bucket = remote ? 'quintaearth-files-dev' : 'quintaearth-files';
const target = [remote ? '--remote' : '--local', ...(remote ? ['--env', env] : [])];

function fail(msg) { console.error(msg); process.exit(2); }
const execFileP = promisify(execFile);
const wrangler = (...a) => execFileSync('pnpm', ['-s', 'wrangler', ...a], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
const wranglerP = (...a) => execFileP('pnpm', ['-s', 'wrangler', ...a], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const d1 = (...a) => wrangler('d1', 'execute', database, ...target, ...a);
const rows = (sql) => JSON.parse(d1('--json', '--command', sql))[0].results;

// ---------------------------------------------------------------- ids and keys
const uid = (p) => `demo-${p}`;
const profileId = (p) => `demo-profile-${p}`;
const orgId = (c) => `demo-org-${c}`;
const listingId = (l) => `demo-listing-${l}`;
const email = (p) => `${p.handle}@example.com`;
// file keys carry a hash of the file's bytes: public files are cached for a long time (browser and edge), so a
// regenerated logo or photo must get a new address, as a member's replacement upload does in the app
const stamp = (path) => sha256(readFileSync(path)).toString('hex').slice(0, 8);
const photoKey = (p, path) => `photo/demo-${p.id}-${stamp(path)}.webp`;
const logoKey = (c, path) => `logo/demo-${c.id}-${stamp(path)}.png`;
const listingPhotoKey = (l, path) => `listing-photo/demo-${l.id}-${stamp(path)}.webp`;
const evidenceKey = (l, i, path) => `evidence/demo-${l.id}-${i + 1}-${stamp(path)}.pdf`;
const identityKey = (c, path) => `identity/demo-${c}-${stamp(path)}.pdf`;
const certKey = (c, cert, path) => `certificate/demo-${c}-${cert}-${stamp(path)}.pdf`;
const certId = (c, cert) => `demo-cert-${c}-${cert}`;
const DAY = 86_400_000;
const sha256 = (v) => createHash('sha256').update(v).digest();

// ---------------------------------------------------------------- SQL helpers
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : typeof v === 'boolean' ? (v ? '1' : '0') : `'${String(v).replace(/'/g, "''")}'`);
const insert = (table, row) => `INSERT INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(q).join(', ')});`;

/** the app's own format: pbkdf2-sha256$100000$salt$hash, with a salt derived from the email so re-runs produce the same row */
async function passwordHash(mail, password) {
  const salt = sha256(`quintaearth-demo:${mail}:${password}`).subarray(0, 16);
  const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(await webcrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 }, key, 256));
  return `pbkdf2-sha256$100000$${Buffer.from(salt).toString('base64')}$${Buffer.from(bits).toString('base64')}`;
}

function password() {
  const f = join(here, PASSWORD_FILE);
  if (existsSync(f)) return readFileSync(f, 'utf8').match(/^password: (.+)$/m)[1];
  const words = ['river', 'stone', 'moss', 'cedar', 'heron', 'reed', 'spring', 'valley', 'fern', 'tide'];
  const pick = () => words[webcrypto.getRandomValues(new Uint32Array(1))[0] % words.length];
  const pw = `${pick()}-${pick()}-${pick()}-${webcrypto.getRandomValues(new Uint32Array(1))[0] % 900 + 100}`;
  writeFileSync(f, `# Demo accounts on the local and dev databases (seed-demo.mjs). Every demo member shares this password.\npassword: ${pw}\nowner (Sunward Grid Collective): asha-rao@example.com\nadmin (identity queue): admin@example.com\nother members: <handle>@example.com, see data.mjs\n`);
  return pw;
}

// ---------------------------------------------------------------- generated files: logos and PDFs
const build = join(here, 'build');
mkdirSync(build, { recursive: true });
const media = (slot) => join(here, 'media', `${slot}.webp`);

// company marks: an icon from the site's own sprite on a brand colour; a few get a thin ring or a ground line
const sprite = readFileSync(join(root, 'src', 'components', 'IconSprite.astro'), 'utf8');
const icons = {
  // Delta Weave: a plain over-under weave, drawn here
  weave: { viewBox: '0 0 100 100', body: ['<g stroke="currentColor" stroke-width="5" stroke-linecap="round" fill="none">',
    // four squares of three stripes, orientation alternating: a basket weave
    '<path d="M20 24h24M20 34h24M20 44h24"/><path d="M58 22v24M68 22v24M78 22v24"/>',
    '<path d="M22 56v24M32 56v24M42 56v24"/><path d="M56 58h24M56 68h24M56 78h24"/>', '</g>'].join('') },
};
function icon(name) {
  if (icons[name]) return icons[name];
  const m = sprite.match(new RegExp(`<symbol id="${name}"[^>]*viewBox="([^"]+)"[^>]*>([\\s\\S]*?)</symbol>`));
  if (!m) throw new Error(`no icon ${name} in IconSprite.astro`);
  return { viewBox: m[1], body: m[2] };
}
async function logoPng(c) {
  const dest = join(build, `logo-${c.id}.png`);
  if (existsSync(dest)) return dest;
  const { icon: name, bg, fg, ring, ground } = c.logo;
  const ic = icon(name);
  const size = ring ? 232 : 268, off = (512 - size) / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${bg}"/>
    ${ring ? `<circle cx="256" cy="256" r="196" fill="none" stroke="${fg}" stroke-width="8" opacity=".55"/>` : ''}
    ${ground ? `<path d="M96 392h320" stroke="${fg}" stroke-width="10" stroke-linecap="round" opacity=".55"/>` : ''}
    <svg x="${off}" y="${ground ? off - 22 : off}" width="${size}" height="${size}" viewBox="${ic.viewBox}" fill="${fg}" color="${fg}">${ic.body}</svg></svg>`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(dest);
  return dest;
}

const ascii = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '').replace(/[\\()]/g, (c) => `\\${c}`);
/** a one-page PDF with a title and a few lines, byte-identical for the same input */
function pdf(title, lines) {
  const content = [`BT /F1 20 Tf 60 760 Td (${ascii(title)}) Tj ET`, `BT /F2 11 Tf 60 730 Td 16 TL`, ...lines.map((l) => `(${ascii(l)}) Tj T*`), 'ET',
    'BT /F2 9 Tf 60 60 Td (Sample document on the QuintaEarth demo site. Not a real certificate or report.) Tj ET'].join('\n');
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`];
  let out = '%PDF-1.4\n'; const offsets = [];
  objs.forEach((o, i) => { offsets.push(Buffer.byteLength(out)); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}
function evidencePdf(c, l, e, i) {
  const dest = join(build, `evidence-${l.id}-${i + 1}.pdf`);
  if (existsSync(dest)) return dest;
  const lines = e.kind === 'certificate'
    ? [`Issued to: ${c.name}, ${c.city}`, `Scope: ${l.name}`, 'Certificate number: QE-DEMO-' + String(1000 + i + l.id.length * 7), 'Valid: 1 January 2026 to 31 December 2027', '', 'This sample stands in for the certificate a member would upload as proof.']
    : [`Prepared for: ${c.name}`, `Subject: ${l.name}`, 'Period: 2025', '', 'Summary', 'Figures in this document are placeholders for the report a member would attach as evidence.', 'Method, data tables and findings would follow here.'];
  writeFileSync(dest, pdf(e.title, lines));
  return dest;
}
function certificatePdf(c, cert) {
  const dest = join(build, `certificate-${c.id}-${cert.id}.pdf`);
  if (existsSync(dest)) return dest;
  const d = (ms) => new Date(ms).toISOString().slice(0, 10);
  writeFileSync(dest, pdf(cert.name, [`Issued to: ${c.name}, ${c.city}`, `Issued by: ${cert.issuer}`, `Valid: ${cert.issued ? d(cert.issued) : 'n/a'} to ${d(cert.expires)}`, '', 'This sample stands in for the certificate a company would upload.']));
  return dest;
}
function identityPdf(c, check) {
  const dest = join(build, `identity-${c.id}.pdf`);
  if (existsSync(dest)) return dest;
  writeFileSync(dest, pdf('Certificate of business registration', [`Company: ${c.name}`, `Registration number: ${check.number}`, `Country: ${check.country}`, `Registered office: ${c.city}`, '', 'Private document sent with an identity check request.']));
  return dest;
}

// ---------------------------------------------------------------- the rows
async function buildSeed() {
  const pw = password();
  const sql = [];
  const uploads = []; // { key, path, contentType }
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const fileRow = (key, path, contentType, extra) => {
    uploads.push({ key, path, contentType });
    return insert('files', { key, purpose: key.split('/')[0], name: extra.name, content_type: contentType, size: statSync(path).size, public: extra.public ?? true,
      owner_user_id: extra.owner, organization_id: extra.org ?? null, listing_id: extra.listing ?? null, created_at: extra.created });
  };

  const links = [];
  // users, passwords, profiles
  for (const p of [...people, { ...admin, handle: 'admin', type: 'individual', role: 'admin' }]) {
    const id = uid(p.id), mail = p.email ?? email(p);
    sql.push(insert('user', { id, name: p.name, email: mail, email_verified: 1, account_type: p.type, role: p.role ?? 'member', created_at: p.created, updated_at: p.created }));
    sql.push(insert('account', { id: `credential-${id}`, user_id: id, account_id: id, provider_id: 'credential', password: await passwordHash(mail, pw), created_at: p.created, updated_at: p.created }));
    if (!p.handle || p.id === 'admin') continue;
    const hasPhoto = p.photo && existsSync(media(p.photo));
    // Phase 2: role and company (linked when the person is on that demo company's team), languages, open to, services, goals
    const x = personExtras[p.id] ?? {};
    const co = x.company ? companies.find((c) => c.id === x.company) : null;
    sql.push(insert('profiles', { id: profileId(p.id), user_id: id, handle: p.handle, headline: p.headline, bio: p.bio, city: p.city, country: p.country,
      photo_key: hasPhoto ? photoKey(p, media(p.photo)) : null, linkedin: p.linkedin ?? null, website: p.website ?? null,
      role_title: x.role ?? null, company_name: co ? co.name : x.companyName ?? null, published: 1, created_at: p.created, updated_at: p.created + DAY }));
    for (const [kind, vals] of [['language', x.languages], ['open', x.open], ['service', x.services], ['sdg', x.sdgs]]) for (const v of vals ?? []) sql.push(insert('tags', { entity_type: 'profile', entity_id: profileId(p.id), kind, value: v }));
    // the company link is set once the companies exist (below): the column references them
    if (co) links.push(`UPDATE profiles SET company_org_id = ${q(orgId(co.id))} WHERE id = ${q(profileId(p.id))};`);
    // a linked LinkedIn account earns the person "Identity checked" badge
    if (x.linkedin) sql.push(insert('account', { id: `demo-linkedin-${p.id}`, user_id: id, account_id: `demo-linkedin-${p.id}`, provider_id: 'linkedin', created_at: p.created + DAY, updated_at: p.created + DAY }));
    if (hasPhoto) sql.push(fileRow(photoKey(p, media(p.photo)), media(p.photo), 'image/webp', { name: `${p.handle}.webp`, owner: id, created: p.created }));
    for (const [kind, vals] of [['industry', p.industries], ['sub', p.subs], ['skill', p.skills]]) for (const v of vals ?? []) sql.push(insert('tags', { entity_type: 'profile', entity_id: profileId(p.id), kind, value: v }));
  }

  // companies, teams, listings, evidence
  // green wording (src/lib/green-words.ts): demo text that uses those words was approved by the admin, except listings
  // marked review: 'pending', which wait in the queue (and are not public)
  const audits = [];
  const green = async (key, review, ...texts) => {
    const terms = findGreenTerms(...texts);
    if (!terms.length) return { green_review: 'none', green_terms: null, green_hash: null };
    return { green_review: review ?? 'approved', green_terms: terms.join(', '), green_hash: await greenHash(...texts) };
  };
  for (const c of companies) {
    const id = orgId(c.id), owner = uid(c.team[0]), check = checks[c.id], logoPath = await logoPng(c), x = companyExtras[c.id] ?? {};
    const og = await green(c.id, null, ...companyGreenTexts({ description: c.description, research: x.research ?? null, caseStudies: x.cases ?? null }));
    sql.push(insert('organizations', { id, slug: c.slug, name: c.name, legal_name: x.legalName ?? null, description: c.description, research: x.research ?? null,
      case_studies: x.cases ? JSON.stringify(x.cases) : null, city: c.city, country: c.country, size: c.size, founded_year: c.founded,
      website: c.website ?? null, linkedin: c.linkedin ?? null, youtube: x.youtube ?? null, x_url: x.x ?? null, instagram: x.instagram ?? null, facebook: x.facebook ?? null,
      logo_key: logoKey(c, logoPath), published: 1, identity_checked_at: c.check === 'approved' ? check.reviewed : null, ...og, created_at: c.created, updated_at: c.created + DAY }));
    if (og.green_review === 'approved') audits.push({ org: id, type: 'organization', subject: id, actor: uid(admin.id), action: 'green-approved', result: 'pass', detail: og.green_terms, at: c.created + DAY });
    for (const v of x.operates ?? []) sql.push(insert('tags', { entity_type: 'organization', entity_id: id, kind: 'operates', value: v }));
    for (const cert of x.certs ?? []) {
      const path = cert.file ? certificatePdf(c, cert) : null, key = path ? certKey(c.id, cert.id, path) : null;
      if (key) sql.push(fileRow(key, path, 'application/pdf', { name: `${cert.name}.pdf`, owner, org: id, public: !!cert.public, created: c.created }));
      sql.push(insert('certifications', { id: certId(c.id, cert.id), organization_id: id, name: cert.name, issuer: cert.issuer, evidence_key: key, registry_url: cert.registry ?? null,
        issued_on: cert.issued ?? null, expires_on: cert.expires, created_at: c.created, updated_at: c.created }));
    }
    sql.push(fileRow(logoKey(c, logoPath), logoPath, 'image/png', { name: `${c.slug}-logo.png`, owner, org: id, created: c.created }));
    c.team.forEach((m, i) => sql.push(insert('members', { organization_id: id, user_id: uid(m), role: i === 0 ? 'owner' : 'member', created_at: c.created + i * DAY })));
    for (const [kind, vals] of [['industry', c.industries], ['sub', c.subs], ['sdg', c.sdgs]]) for (const v of vals) sql.push(insert('tags', { entity_type: 'organization', entity_id: id, kind, value: v }));
    for (const base of [...c.listings, ...(extraListings[c.id] ?? [])]) {
      const l = { ...base, ...(listingExtras[base.id] ?? {}) };
      const lid = listingId(l.id), hasPhoto = !!l.photo && existsSync(media(l.photo));
      const lg = await green(l.id, l.review, ...listingGreenTexts({ name: l.name, description: l.description, specs: l.specs ?? null, leadTime: l.lead ?? null, tags: l.tags ?? [] }));
      sql.push(insert('listings', { id: lid, organization_id: id, slug: l.slug, name: l.name, kind: l.kind, description: l.description, link: null,
        photo_key: hasPhoto ? listingPhotoKey(l, media(l.photo)) : null, pricing_model: l.pricing ?? null, lead_time: l.lead ?? null, specs: l.specs ?? null,
        status: l.status ?? 'published', ...lg, created_at: l.created, updated_at: l.created }));
      if (lg.green_review === 'approved') audits.push({ org: id, type: 'listing', subject: lid, actor: uid(admin.id), action: 'green-approved', result: 'pass', detail: lg.green_terms, at: l.created + DAY });
      if (lg.green_review === 'pending') audits.push({ org: id, type: 'listing', subject: lid, actor: owner, action: 'green-flagged', result: 'info', detail: lg.green_terms, at: l.created });
      if (hasPhoto) sql.push(fileRow(listingPhotoKey(l, media(l.photo)), media(l.photo), 'image/webp', { name: `${l.slug}.webp`, owner, org: id, listing: lid, created: l.created }));
      // evidence is private unless the owner made it public (publicEvidence in phase2.mjs)
      l.evidence.forEach((e, i) => { const path = evidencePdf(c, l, e, i); sql.push(fileRow(evidenceKey(l, i, path), path, 'application/pdf', { name: `${e.title}.pdf`, owner, org: id, listing: lid,
        public: (publicEvidence[l.id] ?? []).includes(i), created: l.created + (i + 1) * 3_600_000 })); });
      for (const [kind, vals] of [['sub', l.subs], ['serves', l.serves], ['tag', l.tags]]) for (const v of vals ?? []) sql.push(insert('tags', { entity_type: 'listing', entity_id: lid, kind, value: v }));
      for (const cert of l.certs ?? []) sql.push(insert('listing_certifications', { listing_id: lid, certification_id: certId(c.id, cert) }));
    }
    if (check) {
      const status = c.check, docPath = check.document ? identityPdf(c, check) : null, docKey = docPath ? identityKey(c.id, docPath) : null;
      if (docKey) sql.push(fileRow(docKey, docPath, 'application/pdf', { name: 'registration-certificate.pdf', owner, org: id, public: false, created: check.requested }));
      // the checklist: approved requests have every item; the pending one has its email confirmed only; the rejected one none
      const cid = `demo-check-${c.id}`, H = 3_600_000, approved = status === 'approved';
      const list = {
        registration_checked_at: approved ? check.reviewed - H : null, registration_checked_by: approved ? uid(admin.id) : null,
        email_verified_at: approved || status === 'pending' ? check.requested + H : null, site_verified_at: approved ? check.requested + 2 * H : null,
        // each proof is bound to the domain it was made on (src/lib/identity.ts checklist)
        email_domain: approved || status === 'pending' ? check.email.split('@')[1].toLowerCase() : null,
        site_domain: approved && c.website ? new URL(c.website).hostname.toLowerCase().replace(/^www\./, '') : null,
        site_method: approved ? 'dns' : null, site_token: sha256(`demo-site:${c.id}`).toString('hex').slice(0, 24),
      };
      sql.push(insert('identity_checks', { id: cid, organization_id: id, requested_by: owner, registration_number: check.number, registration_country: check.country,
        work_email: check.email, note: check.note ?? null, document_key: docKey, status, reviewed_by: status === 'pending' ? null : uid(admin.id), reviewed_at: status === 'pending' ? null : check.reviewed,
        reason: check.reason ?? null, ...list, created_at: check.requested, updated_at: status === 'pending' ? check.requested : check.reviewed }));
      const log = (action, result, at, actor, detail) => audits.push({ org: id, type: 'identity_check', subject: cid, actor, action, result, detail, at });
      log('requested', 'info', check.requested, owner, `Registration ${check.number} (${check.country}), work email ${check.email}`);
      if (list.email_verified_at) log('email', 'pass', list.email_verified_at, owner, `Code confirmed for ${check.email}`);
      if (list.site_verified_at) log('website', 'pass', list.site_verified_at, owner, `TXT record found on ${new URL(c.website).hostname}`);
      if (list.registration_checked_at) log('registration', 'pass', list.registration_checked_at, uid(admin.id), 'Matched in the national registry');
      if (status !== 'pending') log(status, approved ? 'pass' : 'fail', check.reviewed, uid(admin.id), check.reason ?? null);
    }
  }

  sql.push(...links);
  audits.sort((a, b) => a.at - b.at || a.subject.localeCompare(b.subject));
  audits.forEach((a, i) => sql.push(insert('audit_log', { id: `demo-audit-${String(i + 1).padStart(3, '0')}`, organization_id: a.org, subject_type: a.type, subject_id: a.subject,
    actor_user_id: a.actor, action: a.action, result: a.result, detail: a.detail ?? null, created_at: a.at })));

  for (const inv of invites) {
    sql.push(insert('invites', { id: uid(inv.id), organization_id: orgId(inv.company), email: inv.email, role: inv.role, token_hash: sha256(`demo-invite:${inv.id}`).toString('hex'),
      invited_by: uid(inv.by), expires_at: inv.created + 14 * DAY, accepted_at: null, created_at: inv.created }));
  }

  for (const e of [...enquiries, ...personEnquiries]) {
    const member = typeof e.from === 'string' ? peopleById.get(e.from) : null;
    // an enquiry goes to a company, or (Phase 2) to a person: then that person answers it
    const to = e.toPerson ? { team: [e.toPerson] } : companies.find((c) => c.id === e.to);
    const last = e.created + Math.max(...e.messages.map((m) => m[1])) * 3_600_000;
    sql.push(insert('enquiries', { id: uid(e.id), organization_id: e.toPerson ? null : orgId(e.to), to_user_id: e.toPerson ? uid(e.toPerson) : null, listing_id: e.listing ? listingId(e.listing) : null, from_user_id: member ? uid(member.id) : null,
      from_name: member ? member.name : e.from.name, from_email: member ? email(member) : e.from.email, from_company: e.fromCompany ?? null, subject: e.subject, status: e.status,
      company_unread: e.status === 'new' ? 1 : (e.companyUnread ? 1 : 0), buyer_unread: e.buyerUnread ? 1 : 0, created_at: e.created, updated_at: last }));
    e.messages.forEach(([side, hours, body], i) => sql.push(insert('enquiry_messages', { id: `${uid(e.id)}-m${i + 1}`, enquiry_id: uid(e.id),
      author_user_id: side === 'buyer' ? (member ? uid(member.id) : null) : uid(to.team[0]), side, body, created_at: e.created + hours * 3_600_000 })));
  }
  return { sql, uploads, pw };
}

const WIPE = `
DELETE FROM audit_log WHERE id LIKE 'demo-%';
DELETE FROM listing_certifications WHERE listing_id LIKE 'demo-%';
DELETE FROM certifications WHERE id LIKE 'demo-%';
DELETE FROM enquiry_messages WHERE id LIKE 'demo-%';
DELETE FROM enquiries WHERE id LIKE 'demo-%';
DELETE FROM identity_checks WHERE id LIKE 'demo-%';
DELETE FROM invites WHERE id LIKE 'demo-%';
DELETE FROM files WHERE key LIKE '%/demo-%';
DELETE FROM tags WHERE entity_id LIKE 'demo-%';
DELETE FROM listings WHERE id LIKE 'demo-%';
DELETE FROM members WHERE organization_id LIKE 'demo-%' OR user_id LIKE 'demo-%';
DELETE FROM organizations WHERE id LIKE 'demo-%';
DELETE FROM profiles WHERE id LIKE 'demo-%';
DELETE FROM session WHERE user_id LIKE 'demo-%';
DELETE FROM account WHERE user_id LIKE 'demo-%';
DELETE FROM user WHERE id LIKE 'demo-%';
`;

async function upload(uploads) {
  let n = 0; const queue = [...uploads];
  const worker = async () => {
    for (let u = queue.shift(); u; u = queue.shift()) {
      await wranglerP('r2', 'object', 'put', `${bucket}/${u.key}`, '--file', u.path, '--content-type', u.contentType, remote ? '--remote' : '--local');
      process.stdout.write(`\r  files ${++n}/${uploads.length}`);
    }
  };
  await Promise.all(Array.from({ length: remote ? 4 : 1 }, worker));
  console.log();
}

function verify() {
  const fp = rows(`SELECT
    (SELECT count(*) || ':' || sum(created_at) FROM user WHERE id LIKE 'demo-%') AS users,
    (SELECT count(*) || ':' || sum(length(bio)) FROM profiles WHERE id LIKE 'demo-%') AS profiles,
    (SELECT count(*) || ':' || sum(length(description)) || ':' || count(identity_checked_at) FROM organizations WHERE id LIKE 'demo-%') AS organizations,
    (SELECT count(*) || ':' || sum(length(description)) FROM listings WHERE id LIKE 'demo-%') AS listings,
    (SELECT count(*) || ':' || sum(size) FROM files WHERE key LIKE '%/demo-%') AS files,
    (SELECT count(*) FROM tags WHERE entity_id LIKE 'demo-%') AS tags,
    (SELECT count(*) || ':' || sum(updated_at) FROM enquiries WHERE id LIKE 'demo-%') AS enquiries,
    (SELECT count(*) || ':' || sum(length(body)) FROM enquiry_messages WHERE id LIKE 'demo-%') AS messages,
    (SELECT count(*) || ':' || group_concat(status) FROM (SELECT status FROM identity_checks WHERE id LIKE 'demo-%' ORDER BY id)) AS checks,
    (SELECT count(*) FROM invites WHERE id LIKE 'demo-%') AS invites,
    (SELECT count(*) || ':' || sum(expires_on < ${NOW}) FROM certifications WHERE id LIKE 'demo-%') AS certifications,
    (SELECT count(*) FROM listing_certifications WHERE listing_id LIKE 'demo-%') AS cert_links,
    (SELECT count(*) || ':' || sum(public) FROM files WHERE key LIKE 'evidence/demo-%') AS evidence,
    (SELECT group_concat(g) FROM (SELECT green_review || '=' || count(*) AS g FROM listings WHERE id LIKE 'demo-%' GROUP BY green_review ORDER BY green_review)) AS green,
    (SELECT count(*) FROM audit_log WHERE id LIKE 'demo-%') AS audit,
    (SELECT count(*) FROM account WHERE user_id LIKE 'demo-%' AND provider_id = 'linkedin') AS linkedin,
    (SELECT count(*) FROM enquiries WHERE id LIKE 'demo-%' AND to_user_id IS NOT NULL) AS to_people,
    (SELECT count(*) FROM search WHERE entity_id LIKE 'demo-%') AS search`)[0];
  console.log(`${remote ? 'dev' : 'local'} fingerprint`);
  for (const [k, v] of Object.entries(fp)) console.log(`  ${k.padEnd(14)} ${v}`);
  return fp;
}

// ---------------------------------------------------------------- run
if (verifyOnly) { verify(); process.exit(0); }
if (local && !dry) { console.log('applying migrations to the local database'); wrangler('d1', 'migrations', 'apply', database, '--local'); }
const { sql, uploads, pw } = await buildSeed();
const script = `${WIPE}\n${wipeOnly ? '' : sql.join('\n')}\n`;
const sqlFile = join(build, wipeOnly ? 'wipe.sql' : 'seed.sql');
writeFileSync(sqlFile, script);
console.log(`${sql.length} statements, ${uploads.length} files -> ${remote ? 'dev.quintaearth.com' : 'local'}${dry ? ' (dry run, nothing sent)' : ''}`);
if (dry) process.exit(0);

d1('--file', sqlFile);
console.log(wipeOnly ? 'demo rows removed' : 'rows written');
if (wipeOnly) {
  for (const u of uploads) { try { wrangler('r2', 'object', 'delete', `${bucket}/${u.key}`, remote ? '--remote' : '--local'); } catch { /* already gone */ } }
  console.log('demo files removed');
} else {
  await upload(uploads);
}
console.log('rebuilding the search index');
execFileSync('node', [join(root, 'scripts', 'reindex-search.mjs'), ...(remote ? ['--remote', '--env', 'dev'] : ['--local'])], { cwd: root, stdio: 'inherit' });
verify();
if (!wipeOnly) console.log(`\nSign in as asha-rao@example.com (owner) or admin@example.com (admin); the password is in scripts/seed-demo/${PASSWORD_FILE}`);
