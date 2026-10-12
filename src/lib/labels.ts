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

const sizes: Record<string, string> = {
  '1-10': '1–10 people', '11-50': '11–50 people', '51-200': '51–200 people', '201-1000': '201–1,000 people', '1000+': '1,000+ people',
};
export const sizeLabel = (size: string | null | undefined) => (size ? sizes[size] ?? null : null);

/** "example.com" for showing a URL. */
export function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

/** JSON-LD body that is safe inside a <script> element (no "</script>" breakouts from member text). */
export const ldJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
