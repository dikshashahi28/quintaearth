// Shared bits for the enquiry pages (company inbox, buyer's sent enquiries, the send form).
import { asc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../../../db/client';
import { inChunks } from '../../../db/chunks';

export type Show = 'open' | 'closed';
type Status = 'new' | 'open' | 'closed';

/** the Open tab holds new and open enquiries; Closed holds the rest */
export const inTab = (status: Status, show: Show) => (show === 'closed' ? status === 'closed' : status !== 'closed');
export const showOf = (url: URL): Show => (url.searchParams.get('show') === 'closed' ? 'closed' : 'open');

const day = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const short = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

/** list dates: Today, Yesterday, else "3 Oct" */
export function listDate(d: Date, now = new Date()) {
  const diff = Math.round((day(now) - day(d)) / 864e5);
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : short.format(d);
}
/** message dates: "10 Oct, 09:12" (UTC) */
export const msgDate = (d: Date) => `${short.format(d)}, ${clock.format(d)}`;

/** a message body as paragraphs: blank lines split paragraphs */
export const paragraphs = (body: string) => body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

/** messages of a thread, oldest first, read without changing its status */
export function messagesOf(enquiryId: string) {
  return db.select().from(schema.enquiryMessages).where(eq(schema.enquiryMessages.enquiryId, enquiryId)).orderBy(asc(schema.enquiryMessages.createdAt));
}

export async function listingName(listingId: string | null) {
  if (!listingId) return null;
  const l = await db.query.listings.findFirst({ where: eq(schema.listings.id, listingId), columns: { name: true } });
  return l?.name ?? null;
}

/** display names of the people who wrote messages, by user id */
export async function authorNames(ids: (string | null)[]) {
  const uniq = [...new Set(ids.filter((x): x is string => !!x))];
  if (!uniq.length) return new Map<string, string>();
  const rows = await inChunks(uniq, (slice) => db.select({ id: schema.user.id, name: schema.user.name }).from(schema.user).where(inArray(schema.user.id, slice)));
  return new Map(rows.map((r) => [r.id, r.name]));
}

export async function companyName(organizationId: string) {
  const o = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId), columns: { name: true } });
  return o?.name ?? 'The company';
}

/** path plus the query params that are set */
export function withQuery(path: string, params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1])).toString();
  return q ? `${path}?${q}` : path;
}

/** which side wrote each enquiry's latest message */
export async function lastSides(enquiryIds: string[]) {
  if (!enquiryIds.length) return new Map<string, 'buyer' | 'company'>();
  // in slices of at most 90 ids; each slice is oldest first, so the last write per enquiry is its latest message
  const rows = await inChunks(enquiryIds, (slice) => db.select({ enquiryId: schema.enquiryMessages.enquiryId, side: schema.enquiryMessages.side })
    .from(schema.enquiryMessages).where(inArray(schema.enquiryMessages.enquiryId, slice)).orderBy(asc(schema.enquiryMessages.createdAt)));
  return new Map(rows.map((r) => [r.enquiryId, r.side]));
}

/** field errors as text; an empty field reaches the action as null, so its generic type error gets the field's own message */
export function fieldError(msgs: string[] | undefined, empty: string) {
  if (!msgs?.length) return undefined;
  return msgs.map((m) => (/expected string, received (null|undefined)/.test(m) ? empty : m)).join(' ');
}
