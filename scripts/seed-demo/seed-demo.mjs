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

  // users, passwords, profiles
  for (const p of [...people, { ...admin, handle: 'admin', type: 'individual', role: 'admin' }]) {
    const id = uid(p.id), mail = p.email ?? email(p);
    sql.push(insert('user', { id, name: p.name, email: mail, email_verified: 1, account_type: p.type, role: p.role ?? 'member', created_at: p.created, updated_at: p.created }));
    sql.push(insert('account', { id: `credential-${id}`, user_id: id, account_id: id, provider_id: 'credential', password: await passwordHash(mail, pw), created_at: p.created, updated_at: p.created }));
    if (!p.handle || p.id === 'admin') continue;
    const hasPhoto = p.photo && existsSync(media(p.photo));
    sql.push(insert('profiles', { id: profileId(p.id), user_id: id, handle: p.handle, headline: p.headline, bio: p.bio, city: p.city, country: p.country,
      photo_key: hasPhoto ? photoKey(p, media(p.photo)) : null, linkedin: p.linkedin ?? null, website: p.website ?? null, published: 1, created_at: p.created, updated_at: p.created + DAY }));
    if (hasPhoto) sql.push(fileRow(photoKey(p, media(p.photo)), media(p.photo), 'image/webp', { name: `${p.handle}.webp`, owner: id, created: p.created }));
    for (const [kind, vals] of [['industry', p.industries], ['sub', p.subs], ['skill', p.skills]]) for (const v of vals ?? []) sql.push(insert('tags', { entity_type: 'profile', entity_id: profileId(p.id), kind, value: v }));
  }

  // companies, teams, listings, evidence
  for (const c of companies) {
    const id = orgId(c.id), owner = uid(c.team[0]), check = checks[c.id], logoPath = await logoPng(c);
    sql.push(insert('organizations', { id, slug: c.slug, name: c.name, description: c.description, city: c.city, country: c.country, size: c.size, founded_year: c.founded,
      website: c.website ?? null, linkedin: c.linkedin ?? null, logo_key: logoKey(c, logoPath), published: 1, identity_checked_at: c.check === 'approved' ? check.reviewed : null, created_at: c.created, updated_at: c.created + DAY }));
    sql.push(fileRow(logoKey(c, logoPath), logoPath, 'image/png', { name: `${c.slug}-logo.png`, owner, org: id, created: c.created }));
    c.team.forEach((m, i) => sql.push(insert('members', { organization_id: id, user_id: uid(m), role: i === 0 ? 'owner' : 'member', created_at: c.created + i * DAY })));
    for (const [kind, vals] of [['industry', c.industries], ['sub', c.subs], ['sdg', c.sdgs]]) for (const v of vals) sql.push(insert('tags', { entity_type: 'organization', entity_id: id, kind, value: v }));
    for (const l of c.listings) {
      const lid = listingId(l.id), hasPhoto = existsSync(media(l.photo));
      sql.push(insert('listings', { id: lid, organization_id: id, slug: l.slug, name: l.name, kind: l.kind, description: l.description, link: null,
        photo_key: hasPhoto ? listingPhotoKey(l, media(l.photo)) : null, status: l.status ?? 'published', created_at: l.created, updated_at: l.created }));
      if (hasPhoto) sql.push(fileRow(listingPhotoKey(l, media(l.photo)), media(l.photo), 'image/webp', { name: `${l.slug}.webp`, owner, org: id, listing: lid, created: l.created }));
      l.evidence.forEach((e, i) => { const path = evidencePdf(c, l, e, i); sql.push(fileRow(evidenceKey(l, i, path), path, 'application/pdf', { name: `${e.title}.pdf`, owner, org: id, listing: lid, created: l.created + (i + 1) * 3_600_000 })); });
      for (const [kind, vals] of [['sub', l.subs], ['serves', l.serves]]) for (const v of vals) sql.push(insert('tags', { entity_type: 'listing', entity_id: lid, kind, value: v }));
    }
    if (check) {
      const status = c.check, docPath = check.document ? identityPdf(c, check) : null, docKey = docPath ? identityKey(c.id, docPath) : null;
      if (docKey) sql.push(fileRow(docKey, docPath, 'application/pdf', { name: 'registration-certificate.pdf', owner, org: id, public: false, created: check.requested }));
      sql.push(insert('identity_checks', { id: `demo-check-${c.id}`, organization_id: id, requested_by: owner, registration_number: check.number, registration_country: check.country,
        work_email: check.email, note: check.note ?? null, document_key: docKey, status, reviewed_by: status === 'pending' ? null : uid(admin.id), reviewed_at: status === 'pending' ? null : check.reviewed,
        reason: check.reason ?? null, created_at: check.requested, updated_at: status === 'pending' ? check.requested : check.reviewed }));
    }
  }

  for (const inv of invites) {
    sql.push(insert('invites', { id: uid(inv.id), organization_id: orgId(inv.company), email: inv.email, role: inv.role, token_hash: sha256(`demo-invite:${inv.id}`).toString('hex'),
      invited_by: uid(inv.by), expires_at: inv.created + 14 * DAY, accepted_at: null, created_at: inv.created }));
  }

  for (const e of enquiries) {
    const member = typeof e.from === 'string' ? peopleById.get(e.from) : null;
    const to = companies.find((c) => c.id === e.to);
    const last = e.created + Math.max(...e.messages.map((m) => m[1])) * 3_600_000;
    sql.push(insert('enquiries', { id: uid(e.id), organization_id: orgId(e.to), listing_id: e.listing ? listingId(e.listing) : null, from_user_id: member ? uid(member.id) : null,
      from_name: member ? member.name : e.from.name, from_email: member ? email(member) : e.from.email, from_company: e.fromCompany ?? null, subject: e.subject, status: e.status,
      company_unread: e.status === 'new' ? 1 : (e.companyUnread ? 1 : 0), buyer_unread: e.buyerUnread ? 1 : 0, created_at: e.created, updated_at: last }));
    e.messages.forEach(([side, hours, body], i) => sql.push(insert('enquiry_messages', { id: `${uid(e.id)}-m${i + 1}`, enquiry_id: uid(e.id),
      author_user_id: side === 'buyer' ? (member ? uid(member.id) : null) : uid(to.team[0]), side, body, created_at: e.created + hours * 3_600_000 })));
  }
  return { sql, uploads, pw };
}

const WIPE = `
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
