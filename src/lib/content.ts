import type { ImageMetadata } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { getSub, industries } from '../data/industries';
import { storyImage } from './images';
import { page } from './url';

export type Article = CollectionEntry<'insights'> | CollectionEntry<'press'>;
export type Story = CollectionEntry<'stories'>;

const newestFirst = (a: Article, b: Article) => b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id);

export async function getEssays(): Promise<CollectionEntry<'insights'>[]> {
  return (await getCollection('insights')).sort(newestFirst);
}

export async function getPress(): Promise<CollectionEntry<'press'>[]> {
  return (await getCollection('press')).sort(newestFirst);
}

/** Essays and press together, newest first. */
export async function getArticles(): Promise<Article[]> {
  return [...(await getEssays()), ...(await getPress())].sort(newestFirst);
}

export async function getStories(): Promise<Story[]> {
  return (await getCollection('stories')).sort((a, b) => a.data.title.localeCompare(b.data.title));
}

/** "Siemens Gamesa Renewable Energy (part of Siemens Energy AG), Bilbao" -> "Siemens Gamesa Renewable Energy" */
export const shortCompany = (company: string): string => company.replace(/\s*\([^)]*\)/g, '').split(',')[0]!.trim();

/** Story slug used in URLs: the file name, without folders. */
export const storySlug = (s: Story): string => s.id.split('/').pop()!;

/** Minutes to read a Markdown body at 220 words a minute, never less than 1. */
export function readMinutes(markdown = ''): number {
  const words = markdown.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`|-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/**
 * One item in the Insights stream. Diksha's stories and the dated essays are the same thing to a
 * reader ("Insights"); press desk notes have the same shape and their own label.
 */
export interface Insight {
  id: string;
  kind: 'story' | 'essay' | 'press';
  label: 'Insight' | 'Press';
  title: string;
  dek: string;
  href: string;
  sdgs: number[];
  /** sub-category slugs; empty for pieces filed across all industries */
  subs: string[];
  /** "Energy · Solar energy", or the essay's thread when it has no sub-category */
  where: string;
  date?: Date;
  minutes: number;
  image?: { src: ImageMetadata; alt: string };
}

const whereOf = (subs: string[], fallback: string) => {
  const first = subs[0];
  if (!first) return fallback;
  const s = getSub(first);
  return `${s.industry.name} · ${s.name}`;
};

export function storyToInsight(s: Story): Insight {
  const img = storyImage(storySlug(s));
  return {
    id: s.id, kind: 'story', label: 'Insight',
    title: s.data.title, dek: s.data.dek[0] ?? '', href: page(`stories/${storySlug(s)}`),
    sdgs: s.data.sdgs, subs: [s.data.sub], where: whereOf([s.data.sub], ''),
    minutes: readMinutes(s.body),
    image: img && s.data.image ? { src: img, alt: s.data.image.alt } : undefined,
  };
}

export function articleToInsight(a: Article): Insight {
  const essay = a.collection === 'insights';
  return {
    id: a.id, kind: essay ? 'essay' : 'press', label: essay ? 'Insight' : 'Press',
    title: a.data.title, dek: a.data.description, href: page(a.id),
    sdgs: a.data.sdgs, subs: a.data.subs,
    where: whereOf(a.data.subs, a.data.euRules ? 'EU green-claims rules' : a.data.topic),
    date: a.data.date, minutes: readMinutes(a.body),
    image: { src: a.data.image, alt: a.data.imageAlt },
  };
}

/**
 * The Insights stream: dated essays (and press notes when asked) newest first, then the stories in
 * taxonomy order so each industry's work sits together.
 */
export async function getStream({ press = false } = {}): Promise<Insight[]> {
  const [stories, essays, notes] = await Promise.all([getStories(), getEssays(), press ? getPress() : Promise.resolve([])]);
  const dated = [...essays, ...notes].sort(newestFirst).map(articleToInsight);
  const order = new Map(industries.flatMap((i) => i.subs).map((s, n) => [s.slug, n]));
  const rank = (i: Insight) => order.get(i.subs[0] ?? '') ?? 0;
  const undated = stories.map(storyToInsight).sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
  return [...dated, ...undated];
}

/** Everything filed under each sub-category (press included): dated pieces first, then stories. */
export async function streamBySub(): Promise<Map<string, Insight[]>> {
  const map = new Map<string, Insight[]>();
  for (const item of await getStream({ press: true })) {
    for (const sub of item.subs) map.set(sub, [...(map.get(sub) ?? []), item]);
  }
  return map;
}

/** Every UN goal any story, essay or press note is tagged with. */
export async function goalsCovered(): Promise<Set<number>> {
  return new Set((await getStream({ press: true })).flatMap((i) => i.sdgs));
}

// "23 Sep 2026" (Intl's en-GB gives "Sept")
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const formatDate = (d: Date): string => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
