// Company certifications: whether one is current is decided when a page is read, from its expiry date, so an
// expired certificate is never shown as current (it shows as "Expired") and nothing has to run when it lapses.
export interface CertLike { expiresOn: Date; issuedOn?: Date | null }

export const isExpired = (c: CertLike, now = Date.now()) => c.expiresOn.getTime() < now;

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "Valid until 31 Dec 2027" or "Expired 3 Mar 2025" */
export function certStatus(c: CertLike, now = Date.now()) {
  return isExpired(c, now)
    ? { expired: true, label: 'Expired', text: `Expired ${fmt(c.expiresOn)}` }
    : { expired: false, label: 'Current', text: `Valid until ${fmt(c.expiresOn)}` };
}

/** a date as posted by <input type="date"> ("2027-12-31"), at the end of that UTC day; null when empty, "bad" when not a date */
export function parseDay(v: string | null | undefined): Date | null | 'bad' {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return 'bad';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59));
  return Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[3]) ? 'bad' : d;
}

/** the value for <input type="date"> */
export const dayValue = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '');
