// What the public may see, in one place. A company is public when it is published; while its description (with its
// research section and case studies) is held for the wording review (owner decision, 12 Oct) the page stays public
// and only those texts are held back, from
// the page, the directory card and the search index, until an admin approves it. A listing is public when it is
// published, its own wording is not held, and its company is public.
// Every public read (pages, directory, search index, files, enquiries) goes through these.
import { sql, type SQL } from 'drizzle-orm';
import { greenHeld } from './green-words';

interface OrgLike { published: boolean; greenReview?: string | null }
interface ListingLike { status: string; greenReview?: string | null }

export const isPublicOrg = (o: OrgLike) => o.published;
export const isPublicListing = (l: ListingLike, o: OrgLike) => l.status === 'published' && !greenHeld(l.greenReview) && isPublicOrg(o);
/** the company description the public may read: none while it is held for the wording review */
export const publicDescription = (o: { description: string | null; greenReview?: string | null }) => (greenHeld(o.greenReview) ? null : o.description);
/** the research section and case studies: held back with the description (the review reads them together) */
export const publicResearch = (o: { research?: string | null; greenReview?: string | null }) => (greenHeld(o.greenReview) ? null : o.research ?? null);
export const publicCaseStudies = <T>(o: { caseStudies?: T[] | null; greenReview?: string | null }): T[] | null => (greenHeld(o.greenReview) ? null : o.caseStudies ?? null);

const held = (col: string) => sql.raw(`${col} NOT IN ('pending', 'rejected')`);

/** SQL for raw queries: the company row aliased `o` is public */
export const publicOrgSql = (o = 'o'): SQL => sql.raw(`${o}.published = 1`);
/** SQL: the public description of the company aliased `o` (NULL while held for review) */
export const publicDescriptionSql = (o = 'o'): SQL => sql`CASE WHEN ${held(`${o}.green_review`)} THEN ${sql.raw(`${o}.description`)} END`;
/** SQL: the listing aliased `l` is public (the company aliased `o` must be joined too) */
export const publicListingSql = (l = 'l', o = 'o'): SQL => sql`${sql.raw(`${l}.status = 'published'`)} AND ${held(`${l}.green_review`)} AND ${publicOrgSql(o)}`;
