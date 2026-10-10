// The allowed values for tags and country fields, from the site's own data files.
import { countries } from '../data/countries';
import { industries } from '../data/industries';
import { goals } from '../data/sdgs';

export const industrySlugs = new Set(industries.map((i) => i.slug));
export const subSlugs = new Set(industries.flatMap((i) => i.subs.map((s) => s.slug)));
export const sdgNumbers = new Set(goals.map((g) => String(g.n)));
export const countryCodes = new Set(countries.map((c) => c.iso));
