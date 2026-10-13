// "Identity checked": what it means, how long it lasts, and the fixed checklist an admin works from.
// It says who a company is (registration number, business email domain, website ownership). It is not an
// endorsement or a sustainability claim. A check lasts a year; a new name, legal name or website domain withdraws
// it at once (company.update), and the dashboard then asks for a re-check.
import { sql, type SQLWrapper } from 'drizzle-orm';

export const CHECK_VALID_DAYS = 365;
const DAY = 86_400_000;

/** the words for the public tooltip on the badge */
export const IDENTITY_TOOLTIP = 'We checked the registration number, the business email domain and website ownership. Not an endorsement or a sustainability claim.';

export type IdentityState = 'checked' | 'recheck' | 'none';

/** checked within the last year: shown publicly. Older, or withdrawn by a change: "re-check needed" (not public). */
export function identityState(org: { identityCheckedAt: Date | null; identityLapsed?: string | null }, now = Date.now()): IdentityState {
  if (org.identityCheckedAt && now - org.identityCheckedAt.getTime() < CHECK_VALID_DAYS * DAY) return 'checked';
  if (org.identityCheckedAt || org.identityLapsed) return 'recheck';
  return 'none';
}

export const isIdentityChecked = (org: { identityCheckedAt: Date | null }, now = Date.now()) => identityState(org, now) === 'checked';

/** SQL: the company row `alias` is "Identity checked" right now (the clock is read per request, never at module load) */
export const identityCheckedSql = (column: SQLWrapper = sql.raw('o.identity_checked_at')) =>
  sql`(${column} IS NOT NULL AND ${column} > ${Date.now() - CHECK_VALID_DAYS * DAY})`;

/** when a checked company's mark lapses */
export const recheckDue = (checkedAt: Date) => new Date(checkedAt.getTime() + CHECK_VALID_DAYS * DAY);

/** "example.com" for a website or an email address: lower case, no "www." */
export function domainOf(urlOrEmail: string | null | undefined): string | null {
  if (!urlOrEmail) return null;
  try {
    const host = urlOrEmail.includes('@') && !urlOrEmail.includes('://') ? urlOrEmail.split('@').pop()! : new URL(urlOrEmail).hostname;
    return host.toLowerCase().replace(/^www\./, '').replace(/\.$/, '') || null;
  } catch {
    return null;
  }
}

/** an address on the website's own domain (or a subdomain of it) */
export function emailOnDomain(email: string | null | undefined, website: string | null | undefined): boolean {
  const mail = domainOf(email), site = domainOf(website);
  return !!mail && !!site && (mail === site || mail.endsWith(`.${site}`));
}

/** webmail domains: an address there says nothing about the company, so the admin needs the short call instead */
const FREE_MAIL = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'gmx.de', 'web.de', 'mail.com', 'zoho.com', 'yandex.com', 'rediffmail.com', 'qq.com', '163.com']);
export const isFreeMail = (email: string | null | undefined) => FREE_MAIL.has(domainOf(email) ?? '');

export interface CheckRow {
  workEmail: string;
  registrationCheckedAt: Date | null;
  callDoneAt: Date | null;
  emailVerifiedAt: Date | null;
  emailDomain: string | null;
  siteVerifiedAt: Date | null;
  siteMethod: 'dns' | 'meta' | null;
  siteDomain: string | null;
}

/** whether a domain proved earlier still is the website's (an email domain may be a subdomain of it) */
const sameSite = (proved: string | null, website: string | null, sub = false) => {
  const site = domainOf(website);
  return !!proved && !!site && (proved === site || (sub && proved.endsWith(`.${site}`)));
};

export interface ChecklistItem { key: 'registration' | 'email' | 'website' | 'call'; label: string; done: boolean; by: 'admin' | 'company'; note: string }

/**
 * The fixed checklist. Registration (matched by an admin against the national registry), the business email (a code
 * sent to an address on the website's domain) and website ownership (DNS TXT or meta tag) are the three checks. The
 * short call is only for edge cases (no public registry, a free email domain) and stands in for what is missing.
 */
export function checklist(check: CheckRow, website: string | null): { items: ChecklistItem[]; complete: boolean } {
  const onDomain = emailOnDomain(check.workEmail, website);
  // each company tick is bound to the domain it proved: a website moved to another domain since does not inherit it
  const emailDone = !!check.emailVerifiedAt && onDomain && sameSite(check.emailDomain, website, true);
  const siteDone = !!check.siteVerifiedAt && sameSite(check.siteDomain, website);
  const items: ChecklistItem[] = [
    { key: 'registration', label: 'Registration number matched in the national registry', done: !!check.registrationCheckedAt, by: 'admin', note: check.registrationCheckedAt ? 'Ticked by an admin' : 'Our reviewer checks this' },
    { key: 'email', label: 'Business email on the website’s domain', done: emailDone, by: 'company',
      note: !onDomain ? `${domainOf(check.workEmail) ?? 'The address'} is not the website’s domain` : emailDone ? 'Code confirmed' : 'Code not confirmed yet' },
    { key: 'website', label: 'Website ownership', done: siteDone, by: 'company',
      note: siteDone ? (check.siteMethod === 'dns' ? `DNS TXT record found on ${check.siteDomain}` : `Meta tag found on ${check.siteDomain}`)
        : check.siteVerifiedAt ? `Proved for ${check.siteDomain ?? 'another domain'}, not the current website` : 'Not proved yet' },
    { key: 'call', label: 'Short call (edge cases only: no public registry, free email domain)', done: !!check.callDoneAt, by: 'admin', note: check.callDoneAt ? 'Ticked by an admin' : 'Only when a check above cannot be done' },
  ];
  const call = !!check.callDoneAt;
  const complete = items.filter((i) => i.key !== 'call').every((i) => i.done || call) && (call ? items.some((i) => i.key !== 'call' && i.done) : true);
  return { items, complete };
}

/** the TXT record / meta tag value a company publishes to prove it controls its website */
export const siteProof = (token: string) => `quintaearth-verify=${token}`;
export const newSiteToken = () => [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, '0')).join('');

/** TXT records of a domain over DNS-over-HTTPS (Cloudflare's JSON API); empty on any failure */
export async function txtRecords(domain: string, fetcher: typeof fetch = fetch): Promise<string[]> {
  try {
    const res = await fetcher(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=TXT`, {
      headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const body = await res.json() as { Answer?: { type: number; data: string }[] };
    // a TXT record's data comes quoted, long ones in several quoted pieces: join them
    return (body.Answer ?? []).filter((a) => a.type === 16).map((a) => a.data.replace(/^"|"$/g, '').replace(/"\s*"/g, ''));
  } catch {
    return [];
  }
}

/** whether the website's home page carries <meta name="quintaearth-verify" content="<token>"> (first 512 KB only) */
export async function hasMetaTag(website: string, token: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const u = new URL(website);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    const res = await fetcher(u.origin + '/', { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { accept: 'text/html' } });
    if (!res.ok || !res.body) return false;
    const reader = res.body.getReader();
    let html = '', bytes = 0;
    const dec = new TextDecoder();
    while (bytes < 512 * 1024) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += dec.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    await reader.cancel().catch(() => {});
    return metaMatches(html, token);
  } catch {
    return false;
  }
}

/** the meta tag in either attribute order, with the bare token or the full "quintaearth-verify=<token>" */
export function metaMatches(html: string, token: string): boolean {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0];
    const name = tag.match(/\bname\s*=\s*["']?([^"'\s>]+)/i)?.[1]?.toLowerCase();
    const content = tag.match(/\bcontent\s*=\s*["']?([^"'>]+)/i)?.[1]?.trim();
    if (name === 'quintaearth-verify' && (content === token || content === siteProof(token))) return true;
  }
  return false;
}
