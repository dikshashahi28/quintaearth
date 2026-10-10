// Zod pieces shared by the actions. Form fields arrive as strings, a missing field as null; empty means "not set".
// Astro reads a field as a list only when z.array (or .default/.optional around it) is the outer type, so list
// checks sit on the items and duplicates are dropped with uniq() in the handlers.
import { z } from 'astro/zod';
import { countryCodes, industrySlugs, sdgNumbers, subSlugs } from './taxonomy';

// invisible format characters (zero-width spaces and joiners, direction marks, BOM) at either end, plus any
// value made only of them, would pass as "filled in" while showing nothing; they are cut before trimming.
// Inside text they stay, since scripts such as Hindi and Arabic need joiners between letters.
const INVISIBLE_EDGES = /^[\s\p{Cf}]+|[\s\p{Cf}]+$/gu;
const unpad = (v: unknown) => (typeof v === 'string' ? v.replace(INVISIBLE_EDGES, '') : v);

/** trimmed text, max length; "" becomes null so optional columns are cleared */
export const optText = (max: number) =>
  z.preprocess(unpad, z.string().max(max).nullish()).transform((v) => (v ? v : null));

/** required text: a missing field (null) gets the same friendly message as an empty one */
export const reqText = (min: number, max: number, error: string) =>
  z.preprocess((v) => unpad(v ?? ''), z.string({ error }).min(min, error).max(max));

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

/** "solar pv, Hydrogen , solar PV" -> ["solar pv", "hydrogen"] */
export const skillsField = z.string().max(400).nullish().transform((v) =>
  [...new Set((v ?? '').split(',').map((s) => s.trim().toLowerCase().replace(/\s+/g, ' ')).filter((s) => s.length >= 2 && s.length <= 40))].slice(0, 15));

/** an unchecked checkbox sends nothing */
export const checkbox = z.preprocess((v) => v === 'on' || v === 'true' || v === true, z.boolean());

/** a new password: 10 to 128 characters (long enough to resist guessing, short enough to hash quickly) */
export const newPassword = z.preprocess((v) => v ?? '', z.string()
  .min(10, 'Use at least 10 characters.').max(128, 'Use at most 128 characters.'));
