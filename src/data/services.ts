// The paid offers on /services, from the vault ("Green claims money agenda") and the Vision plan (Oct 2026).
// No prices: each offer ends in "Ask for a proposal", which opens the contact form with the offer named.
// The directory listing is free and ends in the sign-up instead.
export interface Service {
  slug: string;
  name: string;
  line: string;
  /** a site photograph by name (src/data/media.json); its alt comes with it */
  photo: string;
  /** "proposal" opens the contact form with this offer named; "join" opens the free sign-up */
  action: 'proposal' | 'join';
}

export const services: Service[] = [
  {
    slug: 'stories',
    name: 'Impact stories and press releases',
    line: 'A story about what you made, with every claim linked to the evidence behind it, written for the press and for your own channels.',
    photo: 'offer-stories',
    action: 'proposal',
  },
  {
    slug: 'proof-audit',
    name: 'Green-claims proof audit',
    line: 'We read every sustainability claim you make, check what stands behind it, and tell you what to keep, prove or drop. EmpCo has applied since 27 September 2026.',
    photo: 'offer-audit',
    action: 'proposal',
  },
  {
    slug: 'cbam',
    name: 'CBAM readiness and emissions-data pack',
    line: 'For Indian exporters to the EU: the emissions data your buyers need, in the shape the definitive regime has asked for since 1 January 2026. The first declaration is due 30 September 2027.',
    photo: 'offer-cbam',
    action: 'proposal',
  },
  {
    slug: 'csr-retainer',
    name: 'CSR and ESG narrative retainer',
    line: 'Need any help with CSR? We will help. A monthly rhythm of stories, reports and press notes, each one evidence-linked.',
    photo: 'offer-csr',
    action: 'proposal',
  },
  {
    slug: 'sponsored-insight',
    name: 'Sponsored Insight',
    line: 'An Insight about your work in our stream, researched and written by us, always labelled as sponsored.',
    photo: 'offer-sponsored',
    action: 'proposal',
  },
  {
    slug: 'listing',
    name: 'Evidence-linked solutions listing',
    line: 'A page in the directory for your products and services, with the evidence beside each one. Joining is totally free.',
    photo: 'offer-listing',
    action: 'join',
  },
];

export const serviceOf = (slug: string | null | undefined): Service | undefined => services.find((s) => s.slug === slug);

/** the names by slug, for the contact form's script (kept small: no photos or lines) */
export const serviceNames: Record<string, string> = Object.fromEntries(services.map((s) => [s.slug, s.name]));
