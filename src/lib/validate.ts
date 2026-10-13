// Zod pieces shared by the actions. Form fields arrive as strings, a missing field as null; empty means "not set".
// Astro reads a field as a list only when z.array (or .default/.optional around it) is the outer type, so list
// checks sit on the items and duplicates are dropped with uniq() in the handlers.
import { z } from 'astro/zod';
import { countryCodes, industrySlugs, sdgNumbers, subSlugs } from './taxonomy';
import { contactIn } from './contact';

// invisible format characters (zero-width spaces and joiners, direction marks, BOM) at either end, plus any
// value made only of them, would pass as "filled in" while showing nothing; they are cut before trimming.
// Inside text they stay, since scripts such as Hindi and Arabic need joiners between letters.
const INVISIBLE_EDGES = /^[\s\p{Cf}]+|[\s\p{Cf}]+$/gu;
const unpad = (v: unknown) => (typeof v === 'string' ? v.replace(INVISIBLE_EDGES, '') : v);

/** trimmed text, max length; "" becomes null so optional columns are cleared */
export const optText = (max: number) =>
  z.preprocess(unpad, z.string().max(max).nullish()).transform((v) => (v ? v : null));

// phone numbers and email addresses are never public (src/lib/contact.ts)
export { contactIn };
export const NO_CONTACT = 'Leave out phone numbers and email addresses: people contact you through enquiries.';
/** optional text shown publicly: no phone numbers or email addresses */
export const publicText = (max: number) => optText(max).refine((v) => !v || !contactIn(v), NO_CONTACT);

/** required text: a missing field (null) gets the same friendly message as an empty one */
export const reqText = (min: number, max: number, error: string) =>
  z.preprocess((v) => unpad(v ?? ''), z.string({ error }).min(min, error).max(max));

/** a required name shown publicly (a person's, a company's, a listing's): no phone numbers or email addresses */
export const publicName = (min: number, max: number, error: string) => reqText(min, max, error).refine((v) => !contactIn(v), NO_CONTACT);

/** an http(s) URL, or null */
export const optUrl = z.string().trim().max(300).nullish().transform((v, ctx) => {
  if (!v) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v) && !/^https?:\/\//i.test(v)) {
    ctx.addIssue({ code: 'custom', message: 'Enter a web address like example.com.' });
    return z.NEVER;
  }
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error();
    return u.href;
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Enter a web address like example.com.' });
    return z.NEVER;
  }
});

/** a LinkedIn address (linkedin.com or a subdomain such as in.linkedin.com), or null: the pages label it LinkedIn */
export const optLinkedIn = (example: string) => optUrl.transform((v, ctx) => {
  if (!v) return null;
  const host = new URL(v).hostname.toLowerCase();
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return v;
  ctx.addIssue({ code: 'custom', message: `Enter a LinkedIn address, like ${example}.` });
  return z.NEVER;
});

/** a profile address on one of `hosts` (or a subdomain), or null */
export const optSocial = (hosts: string[], label: string, example: string) => optUrl.transform((v, ctx) => {
  if (!v) return null;
  const host = new URL(v).hostname.toLowerCase();
  if (hosts.some((h) => host === h || host.endsWith(`.${h}`))) return v;
  ctx.addIssue({ code: 'custom', message: `Enter a ${label} address, like ${example}.` });
  return z.NEVER;
});

/**
 * A row id: a UUID, or a demo row's readable id ("demo-org-sunward-grid-collective", scripts/seed-demo), so the
 * seeded demo community can be edited like real data. Anything else is an input error.
 */
export const entityId = () => z.uuid().or(z.string().regex(/^demo-[a-z0-9-]{1,100}$/));
/** an id as a page route parameter or query value: same rule as entityId */
export const isEntityId = (v: string | null | undefined) => !!v && (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) || /^demo-[a-z0-9-]{1,100}$/.test(v));

export const optCountry = z.string().nullish().transform((v) => v || null)
  .refine((v) => v === null || countryCodes.has(v), 'Choose a country from the list.');

/** a multi-select: unknown values are rejected */
const multi = (allowed: Set<string>, max: number, label: string) =>
  z.array(z.string().refine((v) => allowed.has(v), `Unknown ${label}.`)).max(max, `Choose up to ${max}.`).default([]);

export const uniq = (vs: string[]) => [...new Set(vs)];

export const industriesField = multi(industrySlugs, 8, 'industry');
export const subsField = multi(subSlugs, 12, 'sub-category');
export const sdgsField = multi(sdgNumbers, 17, 'goal');
export const countriesField = multi(countryCodes, 60, 'country');

/** "PV design, ESG , pv  design" -> ["PV design", "ESG"]: the member's capitals kept, repeats dropped whatever their case */
const commaList = (maxChars: number, maxItems: number) => z.string().max(maxChars).nullish().transform((v) => {
  const seen = new Map<string, string>();
  for (const s of (v ?? '').split(',').map((x) => x.trim().replace(/\s+/g, ' '))) {
    if (s.length >= 2 && s.length <= 40 && !seen.has(s.toLowerCase())) seen.set(s.toLowerCase(), s);
  }
  return [...seen.values()].slice(0, maxItems);
}).refine((vs) => vs.every((x) => !contactIn(x)), NO_CONTACT);
export const skillsField = commaList(400, 15);
/** a person's languages, typed: "English, Hindi, Marathi" */
export const languagesField = commaList(300, 10);
/** what a person offers ("Energy audits, Grant writing") */
export const servicesField = commaList(400, 15);
/** a listing's free tags, searchable */
export const listingTagsField = commaList(400, 20);

/** what a person is open to (fixed choices) */
export const OPEN_TO = ['partnerships', 'advisory', 'hiring', 'work', 'volunteer'] as const;
export const openToField = multi(new Set(OPEN_TO), OPEN_TO.length, 'choice');

/** an unchecked checkbox sends nothing */
export const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());

/** a new password: 10 to 128 characters (long enough to resist guessing, short enough to hash quickly) */
export const newPassword = z.preprocess((v) => v ?? '', z.string()
  .min(10, 'Use at least 10 characters.').max(128, 'Use at most 128 characters.'));
/** the same rules when a password may be left out (a member who signs in with Google) */
export const optionalNewPassword = z.preprocess((v) => v || null, z.string()
  .min(10, 'Use at least 10 characters.').max(128, 'Use at most 128 characters.').nullable());
