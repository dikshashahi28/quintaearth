import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { allSubs } from './data/industries';

const subSlugs = allSubs.map((s) => s.slug) as [string, ...string[]];
const sdg = z.number().int().min(1).max(17);
const link = z.object({ label: z.string(), href: z.url() });

/** Insights essays and Press desk notes share one shape. */
const article = ({ image }: SchemaContext) => z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  /** "Greentech", "Cleantech", "Sustainable development" or "Press" */
  topic: z.string(),
  sdgs: z.array(sdg).default([]),
  image: image(),
  imageAlt: z.string(),
  imageCredit: z.object({ label: z.string(), href: z.url().nullable() }).optional(),
  /** sub-categories this piece is filed under */
  subs: z.array(z.enum(subSlugs)).default([]),
  /** filed across all industries: EU green-claims rules (EmpCo, CSRD, ...) */
  euRules: z.boolean().default(false),
  /** the company project this piece belongs to, shown on Our Work */
  project: z.string().optional(),
  sources: z.array(z.url()).default([]),
  note: z.string().optional(),
});

const insights = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/insights' }),
  schema: article,
});

const press = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/press' }),
  schema: article,
});

/** Diksha's story library: 5 evidence-linked stories per sub-category, from the Drive vault. */
const stories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stories' }),
  schema: z.object({
    title: z.string(),
    /** one or two sentences under the headline */
    dek: z.array(z.string()).default([]),
    /** "Technology / Agriculture. Maassluis, Netherlands. Presented 6 October 2020; ..." */
    dateline: z.string().optional(),
    sub: z.enum(subSlugs),
    company: z.string(),
    product: z.string(),
    country: z.string(),
    launchDate: z.string().optional(),
    sdgs: z.array(sdg).default([]),
    tags: z.array(z.string()).default([]),
    sources: z.array(z.url()).default([]),
    glance: z.array(z.object({ label: z.string(), text: z.string() })).default([]),
    image: z.object({
      src: z.url(),
      alt: z.string(),
      /** HTML: plain text plus links to the photographer and licence */
      caption: z.string().optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    }).optional(),
    links: z.array(link).default([]),
  }),
});

export const collections = { insights, press, stories };
