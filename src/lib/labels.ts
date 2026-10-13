// Display names and links for stored codes: industries, sub-categories, countries, UN goals, company size.
// Unknown values (old data, removed taxonomy) return null so pages can skip them instead of crashing.
import { allSubs, industries } from '../data/industries';
import { countries } from '../data/countries';
import { goalByNumber } from '../data/sdgs';
import { page } from './url';

const industryBySlug = new Map(industries.map((i) => [i.slug, i]));
const subBySlug = new Map(allSubs.map((s) => [s.slug, s]));
const countryByIso = new Map(countries.map((c) => [c.iso, c.name]));

export interface TagLink { label: string; href: string }

export const countryName = (iso: string | null | undefined) => (iso ? countryByIso.get(iso) ?? null : null);

/** "Pune, India" from a city and a country code; null when both are empty. */
export function place(city: string | null | undefined, country: string | null | undefined) {
  return [city?.trim(), countryName(country)].filter(Boolean).join(', ') || null;
}

export function industryLinks(slugs: string[]): TagLink[] {
  return slugs.flatMap((s) => {
    const i = industryBySlug.get(s);
    return i ? [{ label: i.name, href: page(`industries-${i.slug}`) }] : [];
  });
}

export function subLinks(slugs: string[]): TagLink[] {
  return slugs.flatMap((s) => {
    const sub = subBySlug.get(s);
    return sub ? [{ label: sub.name, href: page(sub.slug) }] : [];
  });
}

export const subName = (slug: string) => subBySlug.get(slug)?.name ?? null;
export const industryName = (slug: string) => industryBySlug.get(slug)?.name ?? null;

export interface GoalLink { n: number; title: string; href: string }

export function goalLinks(values: string[]): GoalLink[] {
  return values
    .map(Number)
    .sort((a, b) => a - b)
    .flatMap((n) => {
      const g = goalByNumber.get(n);
      return g ? [{ n, title: g.title, href: page(`sdgs/goal-${n}`) }] : [];
    });
}

export const goalTitle = (n: string) => goalByNumber.get(Number(n))?.title ?? null;

// company size as ranges (12 Oct): stored values in src/db/schema/accounts.ts COMPANY_SIZES
export const SIZE_OPTIONS = [
  { value: '1-10', label: '1–10' }, { value: '11-50', label: '11–50' }, { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' }, { value: '501-1000', label: '501–1,000' }, { value: '1000+', label: '1,000+' },
] as const;
export const sizeLabel = (size: string | null | undefined) => {
  const o = SIZE_OPTIONS.find((x) => x.value === size);
  return o ? `${o.label} people` : null;
};

/** how a listing is priced (prices themselves are never shown) */
export const PRICING_OPTIONS = [
  { value: 'quote', label: 'On quote' }, { value: 'fixed', label: 'Fixed price' }, { value: 'subscription', label: 'Subscription' },
] as const;
export const pricingLabel = (v: string | null | undefined) => PRICING_OPTIONS.find((o) => o.value === v)?.label ?? null;

/** what a person is open to */
export const OPEN_TO_LABELS: Record<string, string> = {
  partnerships: 'Partnerships', advisory: 'Advisory', hiring: 'Hiring', work: 'Work', volunteer: 'Volunteering',
};
export const openToLabel = (v: string) => OPEN_TO_LABELS[v] ?? null;

/** the heading for UN goals on people and companies: self-declared, never a badge */
export const GOALS_HEADING = 'Works on (self-declared)';

/** "example.com" for showing a URL. */
export function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/** JSON-LD body that is safe inside a <script> element (no "</script>" breakouts from member text). */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
