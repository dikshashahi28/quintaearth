// Green wording. Words like these in a listing (name, description, specs, lead time, tags) or a company's description,
// research or case studies (listingGreenTexts / companyGreenTexts below) do not block a
// save: the text is held from the public until an admin approves it (OVERRIDE of 12 Oct: flag, don't block).
// Attaching evidence helps the admin approve. This list is the only place the words live: edit it here.
//
// "Carbon neutral" (and the like) on the strength of offsetting is banned in the EU under the Empowering Consumers
// Directive (EmpCo, Directive (EU) 2024/825), so those phrases also carry a warning the owner sees in the editor.

/** each entry matches as whole words, any case; a hyphen or several spaces count as one space ("eco-friendly") */
export const GREEN_WORDS = [
  'eco',
  'eco friendly',
  'green',
  'carbon neutral',
  'carbon negative',
  'carbon positive',
  'climate friendly',
  'climate neutral',
  'climate positive',
  'co2 neutral',
  'net zero',
  'zero carbon',
  'sustainable',
  'sustainably',
  'environmentally friendly',
  'planet friendly',
  'biodegradable',
] as const;

/** neutrality claims: under EmpCo these may not rest on offsetting */
const NEUTRAL_CLAIMS = ['carbon neutral', 'climate neutral', 'co2 neutral', 'net zero', 'carbon negative', 'carbon positive', 'climate positive', 'zero carbon'];

const normalise = (text: string) => ` ${text.normalize('NFKC').toLowerCase().replace(/[‐-―-]/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
const has = (norm: string, phrase: string) => norm.includes(` ${phrase} `);

/** the green words found in the given texts, in list order, each once ("eco friendly" also counts as "eco") */
export function findGreenTerms(...texts: (string | null | undefined)[]): string[] {
  const norm = normalise(texts.filter(Boolean).join(' \n '));
  return GREEN_WORDS.filter((w) => has(norm, w));
}

export interface GreenWarning { term: string; message: string }

/** what the owner is told in the editor besides "held for review" */
export function greenWarnings(...texts: (string | null | undefined)[]): GreenWarning[] {
  const norm = normalise(texts.filter(Boolean).join(' \n '));
  const offset = /\boffset/.test(norm);
  return NEUTRAL_CLAIMS.filter((w) => has(norm, w)).map((term) => ({
    term,
    message: offset
      ? `"${term}" based on offsetting is banned in the EU (Empowering Consumers Directive). Remove the claim or describe the actual reductions.`
      : `"${term}" may not rest on offsetting (EU Empowering Consumers Directive). Say how it is achieved and attach evidence.`,
  }));
}

/** a short, stable hash of the reviewed text: an approval holds only while the text is exactly this */
export async function greenHash(...texts: (string | null | undefined)[]): Promise<string> {
  const data = new TextEncoder().encode(texts.map((t) => t ?? '').join('\u0000'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type GreenState = 'none' | 'pending' | 'approved' | 'rejected';

/**
 * The review state for text about to be saved. No green words: "none". Otherwise an approval (or a rejection) of
 * exactly this text stands; any change to it goes back to the queue as "pending".
 */
export async function nextGreenState(prev: { greenReview: GreenState; greenHash: string | null } | null, ...texts: (string | null | undefined)[]) {
  const terms = findGreenTerms(...texts);
  if (!terms.length) return { greenReview: 'none' as GreenState, greenTerms: null, greenHash: null, greenReason: null };
  const hash = await greenHash(...texts);
  const same = !!prev && prev.greenHash === hash && (prev.greenReview === 'approved' || prev.greenReview === 'rejected');
  return { greenReview: (same ? prev!.greenReview : 'pending') as GreenState, greenTerms: terms.join(', '), greenHash: hash, ...(same ? {} : { greenReason: null }) };
}

/**
 * Every public text of a listing the wording review reads, in a fixed order (the hash covers exactly these): the name,
 * description, specs, lead time and tags. A held listing is off the public page altogether.
 */
export const listingGreenTexts = (l: { name: string; description?: string | null; specs?: string | null; leadTime?: string | null; tags?: readonly string[] | string | null }) =>
  [l.name, l.description, l.specs, l.leadTime, Array.isArray(l.tags) ? l.tags.join(', ') : (l.tags as string | null | undefined) ?? null];

/**
 * Every free text of a company page the wording review reads: the description, the research section and the case
 * studies. While held, all of these are left off the public page, the directory and search; the page stays public.
 */
export const companyGreenTexts = (o: { description: string | null; research?: string | null; caseStudies?: readonly { title: string; client: string | null; summary: string | null }[] | null }) =>
  [o.description, o.research ?? null, ...(o.caseStudies ?? []).flatMap((c) => [c.title, c.client, c.summary])];

/** held from the public: waiting for review, or refused */
export const greenHeld = (state: string | null | undefined) => state === 'pending' || state === 'rejected';
