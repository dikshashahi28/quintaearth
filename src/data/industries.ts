// The taxonomy: 8 industries, 46 sub-categories. Every slug is a URL the old site already published
// (industries-<slug>.html and <sub.slug>.html), so they must not change.

export type IconName =
  | 'tech' | 'sun' | 'materials' | 'arch' | 'transport' | 'sprout' | 'planet' | 'atom';

export interface SubCategory {
  /** page slug, e.g. "energy-solar" -> /energy-solar.html */
  slug: string;
  /** display name, sentence case */
  name: string;
}

export interface Industry {
  slug: string;
  name: string;
  icon: IconName;
  /** hover motion class for the icon (see styles/icons.css) */
  motion: string;
  image: string;
  imageAlt: string;
  subs: SubCategory[];
}

const sub = (slug: string, name: string): SubCategory => ({ slug, name });

export const industries: Industry[] = [
  {
    slug: 'technology', name: 'Technology', icon: 'tech', motion: 'm-pulse',
    image: 'mangrove-river', imageAlt: 'A river winding through mangrove forest, seen from above',
    subs: [
      sub('tech-agriculture', 'Agriculture'), sub('tech-biology', 'Biology'), sub('tech-finance', 'Finance'),
      sub('tech-food', 'Food'), sub('tech-nuclear', 'Nuclear'), sub('tech-ocean', 'Ocean'),
      sub('tech-space', 'Space'), sub('tech-water', 'Water'),
    ],
  },
  {
    slug: 'energy', name: 'Energy', icon: 'sun', motion: 'm-spin',
    image: 'solar-field', imageAlt: 'Rows of solar panels across an open field',
    subs: [
      sub('energy-cleantech', 'CleanTech'), sub('energy-decarbonization', 'Decarbonization'),
      sub('energy-storage', 'Energy storage'), sub('energy-geothermal', 'Geothermal energy'),
      sub('energy-nuclear', 'Nuclear energy'), sub('energy-solar', 'Solar energy'), sub('energy-wind', 'Wind energy'),
    ],
  },
  {
    slug: 'materials', name: 'Materials science', icon: 'materials', motion: 'm-turn',
    image: 'weaver-woman', imageAlt: 'A weaver working at a carpet loom',
    subs: [
      sub('materials-circular-economy', 'Circular economy'), sub('materials-circular-materials', 'Circular materials'),
      sub('materials-low-carbon-industry', 'Low carbon industry'), sub('materials-recyclable-products', 'Recyclable products'),
      sub('materials-reusable-products', 'Reusable products'), sub('materials-sustainable-textiles', 'Sustainable textiles'),
      sub('materials-waste-management', 'Waste management'),
    ],
  },
  {
    slug: 'green-architecture', name: 'Green architecture', icon: 'arch', motion: 'm-rise',
    image: 'hill-village', imageAlt: 'A hillside village among green trees, seen from above',
    subs: [
      sub('arch-green-buildings', 'Green buildings'), sub('arch-micro-climate-systems', 'Micro climate systems'),
      sub('arch-resource-lifecycle', 'Resource lifecycle'), sub('arch-sustainable-site-planning', 'Sustainable site planning'),
      sub('arch-urban-eco-innovation', 'Urban eco innovation'),
    ],
  },
  {
    slug: 'transportation', name: 'Transportation and logistics', icon: 'transport', motion: 'm-drive',
    image: 'cargo-ship', imageAlt: 'A cargo ship loaded with containers at sea',
    subs: [
      sub('transport-biofuels', 'Biofuels'), sub('transport-clean-mobility', 'Clean mobility'), sub('transport-evs', 'EVs'),
      sub('transport-hydrogen-aviation', 'Hydrogen aviation'), sub('transport-logistics-software', 'Logistics software'),
      sub('transport-supply-chain', 'Supply chain'),
    ],
  },
  {
    slug: 'eco-restoration', name: 'Eco-restoration', icon: 'sprout', motion: 'm-grow',
    image: 'mangrove-aerial', imageAlt: 'Dense mangrove forest beside open water, seen from above',
    subs: [
      sub('eco-cleantech', 'CleanTech'), sub('eco-climate-resilience-software', 'Climate resilience software'),
      sub('eco-acoustics', 'Eco-acoustics'), sub('eco-robotics', 'Robotics'), sub('eco-sustainable-forestry', 'Sustainable forestry'),
    ],
  },
  {
    slug: 'planetary', name: 'Planetary engineering', icon: 'planet', motion: 'm-orbit',
    image: 'lone-mountain', imageAlt: 'A lone mountain rising over green plains in haze',
    subs: [
      sub('planetary-atmospheric-frontiers', 'Atmospheric frontiers'), sub('planetary-geological-interventions', 'Geological interventions'),
      sub('planetary-solar-radiation-management', 'Solar radiation management'), sub('planetary-space-frontiers', 'Space frontiers'),
    ],
  },
  {
    slug: 'advanced-technology', name: 'Advanced technology', icon: 'atom', motion: 'm-orbit',
    image: 'forest-mist', imageAlt: 'Mist rolling over a dark conifer forest',
    subs: [
      sub('advanced-deep-space-exploration', 'Deep space exploration'),
      sub('advanced-extreme-environment-engineering', 'Extreme environment engineering'),
      sub('advanced-nanotech', 'NanoTech'), sub('advanced-neural-interfaces', 'Neural interfaces'),
    ],
  },
];

export interface SubRef extends SubCategory { industry: Industry }

export const allSubs: SubRef[] = industries.flatMap((industry) => industry.subs.map((s) => ({ ...s, industry })));

const bySub = new Map(allSubs.map((s) => [s.slug, s]));
const byIndustry = new Map(industries.map((i) => [i.slug, i]));

export function getSub(slug: string): SubRef {
  const s = bySub.get(slug);
  if (!s) throw new Error(`Unknown sub-category "${slug}"`);
  return s;
}

export function getIndustry(slug: string): Industry {
  const i = byIndustry.get(slug);
  if (!i) throw new Error(`Unknown industry "${slug}"`);
  return i;
}
