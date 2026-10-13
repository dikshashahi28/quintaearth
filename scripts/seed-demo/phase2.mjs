// Demo values for the Phase 2 fields (Diksha's answers, 12 Oct 2026): people's role, company, languages, "open to",
// services, self-declared UN goals and LinkedIn; companies' legal name, countries operated in, research section,
// case studies, social links and certifications (one expired); listings' pricing model, lead time, specs, tags and
// linked certifications; evidence made public or kept private; one listing waiting in the wording-review queue;
// one enquiry written to a person. Keyed by the ids in data.mjs. Deterministic: no clocks, no randomness.
import { daysAgo } from './data.mjs';

const day = (y, m, d) => Date.UTC(y, m - 1, d, 23, 59, 59);

// ---------------------------------------------------------------- people
// company: a demo company id (linked: the person is on its team) or companyName: plain text (no page on the site)
export const personExtras = {
  'asha-rao': { role: 'Co-founder', company: 'sunward-grid-collective', languages: ['English', 'Hindi', 'Marathi'], open: ['partnerships', 'advisory'],
    services: ['Solar design reviews', 'Net metering paperwork'], sdgs: ['7', '13', '4'], linkedin: true },
  'rohan-mehta': { role: 'Field lead', company: 'sunward-grid-collective', languages: ['English', 'Marathi'], open: ['work'], sdgs: ['7'] },
  'priya-nair': { role: 'Finance and impact reporting', company: 'sunward-grid-collective', languages: ['English', 'Malayalam', 'Hindi'], open: ['hiring'], sdgs: ['7', '5'] },
  'femke-de-vries': { role: 'Founder', company: 'delta-weave-textiles', languages: ['Dutch', 'English', 'German'], open: ['partnerships'],
    services: ['Fibre recovery audits'], sdgs: ['12', '9'], linkedin: true },
  'wanjiru-kamau': { role: 'Director', company: 'mangrove-works-kenya', languages: ['English', 'Swahili'], open: ['partnerships', 'volunteer'], sdgs: ['14', '15'] },
  'daniel-odhiambo': { role: 'Nursery and monitoring lead', company: 'mangrove-works-kenya', languages: ['Swahili', 'English'], sdgs: ['14'] },
  'ama-boateng': { role: 'Collector network manager', company: 'accra-plastics-loop', languages: ['English', 'Twi'], sdgs: ['12', '14'] },
  'elena-marchetti': { role: 'Sustainability reporting consultant', companyName: 'Marchetti Advisory', languages: ['Italian', 'English', 'French'],
    open: ['advisory', 'partnerships'], services: ['CSRD readiness reviews', 'Supplier data collection'], sdgs: ['12', '13'], linkedin: true },
  'samuel-oyelaran': { role: 'Off-grid energy engineer', companyName: 'Independent', languages: ['English', 'Yoruba'], open: ['work', 'advisory'],
    services: ['Mini-grid feasibility studies'], sdgs: ['7', '8'] },
  'hanna-keller': { role: 'Researcher', companyName: 'Berlin circular design lab', languages: ['German', 'English'], open: ['advisory', 'volunteer'], sdgs: ['12'] },
  'arjun-iyer': { role: 'Climate data scientist', languages: ['English', 'Tamil', 'Kannada'], open: ['work', 'volunteer'], services: ['Satellite crop monitoring'], sdgs: ['13', '2', '15'] },
};

// ---------------------------------------------------------------- companies
// certs: file = a sample PDF is uploaded (public: anyone may open it; else team and admins only); registry = a link
export const companyExtras = {
  'sunward-grid-collective': {
    legalName: 'Sunward Grid Collective Private Limited', operates: ['IN', 'LK'],
    research: 'Every system logs generation and battery state every 15 minutes. We publish anonymised yield data for the 46 school systems each year so other installers can size against real monsoon losses, not brochure numbers.',
    cases: [
      { title: '46 school rooftops in Satara district', client: 'Zilla Parishad Satara', summary: 'Grid-tied rooftop systems for 46 government schools, maintained by us since 2019. Named with the client’s permission.' },
      { title: 'Shared agri-solar pumps for a farmer group', client: null, summary: 'Twelve 5 HP pumps shared by 140 smallholders on four wells, replacing diesel sets.' },
    ],
    youtube: 'https://www.youtube.com/@sunward-grid-demo',
    certs: [
      { id: 'mnre', name: 'MNRE channel partner empanelment', issuer: 'Ministry of New and Renewable Energy', registry: 'https://mnre.example.gov.in/empanelment/sunward-demo',
        issued: day(2025, 4, 1), expires: day(2027, 3, 31), file: true, public: true },
      // the one expired certification: it shows as "Expired", never as current
      { id: 'iso9001', name: 'ISO 9001', issuer: 'Demo Certification Body', issued: day(2023, 2, 1), expires: day(2026, 1, 31), file: true, public: false },
    ],
  },
  'delta-weave-textiles': {
    legalName: 'Delta Weave Textiles B.V.', operates: ['NL', 'DE', 'BE'], x: 'https://x.com/deltaweave_demo', instagram: 'https://www.instagram.com/deltaweave_demo',
    research: 'Fibre length after shredding decides what a recycled yarn can do. We measure it on every incoming bale and blend lots to a target length, which is why our yarn spins at Ne 20 without virgin fibre above 30%.',
    certs: [{ id: 'grs', name: 'Global Recycled Standard (GRS)', issuer: 'Control Union (demo)', registry: 'https://textileexchange.example.org/grs/delta-weave-demo',
      issued: day(2025, 7, 1), expires: day(2027, 6, 30), file: true, public: true }],
  },
  'mangrove-works-kenya': {
    operates: ['KE', 'TZ'],
    certs: [{ id: 'planvivo', name: 'Plan Vivo project registration', issuer: 'Plan Vivo Foundation (demo)', registry: 'https://planvivo.example.org/projects/mangrove-works-demo',
      issued: day(2024, 11, 1), expires: day(2028, 12, 31), file: false }],
  },
  'kalksteen-bau': {
    legalName: 'Kalksteen Bau GmbH', operates: ['DE', 'AT', 'CH'],
    research: 'We test every new hempcrete mix in our own small lab for density, compressive strength and moisture buffering before it goes on site, and share the numbers with the architects we work with.',
    certs: [{ id: 'epd', name: 'EPD, hempcrete block 36 cm', issuer: 'Institut Bauen und Umwelt (demo)', issued: day(2025, 6, 1), expires: day(2030, 5, 31), file: true, public: false }],
  },
  'rio-verde-logistica': { legalName: 'Rio Verde Logística Ltda.', operates: ['BR', 'AR'] },
  'accra-plastics-loop': {
    operates: ['GH', 'TG', 'CI'], facebook: 'https://www.facebook.com/accraplasticsloop.demo',
    cases: [{ title: 'Collector payments audit', client: null, summary: 'An outside audit of 2025 collector payments: every collector paid within seven days of delivery.' }],
    certs: [{ id: 'obp', name: 'Ocean Bound Plastic certification', issuer: 'Zero Plastic Oceans (demo)', registry: 'https://zpo.example.org/obp/accra-plastics-demo',
      issued: day(2025, 3, 1), expires: day(2027, 2, 28), file: false }],
  },
  'ceylon-tea-regen': {
    legalName: 'Ceylon Tea Regen (Private) Limited', operates: ['LK'],
    certs: [{ id: 'ra', name: 'Rainforest Alliance certificate', issuer: 'Rainforest Alliance (demo)', issued: day(2024, 10, 1), expires: day(2027, 9, 30), file: true, public: true }],
  },
  'bandung-bamboo-studio': { operates: ['ID'] },
};

// ---------------------------------------------------------------- listings
// certs: ids from companyExtras of the same company
export const listingExtras = {
  'rooftop-pv-schools': { pricing: 'quote', lead: '6 to 10 weeks', specs: '5 to 50 kWp. Mono PERC modules, string inverters, remote monitoring, net metering application included.',
    tags: ['School solar', 'Net metering'], certs: ['mnre'] },
  'agri-solar-pump-kit': { pricing: 'fixed', lead: 'In stock, ships in 2 weeks', specs: '3 HP or 5 HP submersible pump; 3.2 or 4.8 kWp array; IP65 controller; head up to 70 m.',
    tags: ['Solar pump', 'Irrigation', 'Off-grid'], certs: ['mnre', 'iso9001'] },
  'battery-retrofit-microgrid': { pricing: 'quote', lead: '8 weeks', specs: 'LFP cabinets, 10 to 60 kWh, 48 V. Rated 6,000 cycles at 80% depth of discharge.', tags: ['LFP', 'Battery', 'Microgrid'] },
  'recycled-denim-yarn': { pricing: 'fixed', lead: '3 weeks from order', specs: 'Ne 6 to Ne 20 open-end. 70% post-consumer denim, 30% recycled polyester or organic cotton.',
    tags: ['Recycled yarn', 'Denim'], certs: ['grs'] },
  'workwear-take-back': { pricing: 'subscription', lead: 'Monthly or quarterly collections', tags: ['Take-back', 'Workwear'], certs: ['grs'] },
  'mangrove-restoration': { pricing: 'quote', tags: ['Blue carbon', 'Restoration'], certs: ['planvivo'] },
  'hempcrete-blocks': { pricing: 'quote', lead: '4 to 6 weeks', specs: '36 cm block, 330 kg/m3, lambda 0.07 W/mK, fire class B-s1,d0.', tags: ['Hempcrete', 'Insulation'], certs: ['epd'] },
  'rpet-flakes': { pricing: 'fixed', lead: 'Monthly lots', specs: 'Food-grade rPET flakes, under 50 ppm PVC, IV 0.72 to 0.80.', tags: ['rPET', 'Flakes'], certs: ['obp'] },
  'regen-tea-bulk': { pricing: 'quote', lead: 'From the next flush', tags: ['Tea', 'Regenerative'], certs: ['ra'] },
  'parcel-flood-map': { pricing: 'subscription', tags: ['Flood risk', 'GIS'] },
};

// listings added for Phase 2. "Eco bamboo decking" uses green wording ("eco", "carbon neutral", "sustainable"):
// saved and published by its owner, but it waits in the admin wording-review queue and is not public.
export const extraListings = {
  'bandung-bamboo-studio': [
    { id: 'eco-bamboo-decking', slug: 'eco-bamboo-decking', name: 'Eco bamboo decking', kind: 'product', serves: ['ID', 'SG', 'MY'], subs: ['materials-circular-materials'],
      description: 'Strand-woven bamboo decking boards for terraces and walkways. Carbon neutral and sustainable: the bamboo regrows in four years. Boards are 20 mm thick, 140 mm wide, up to 1.85 m long.',
      pricing: 'fixed', lead: '5 weeks', specs: 'Strand-woven bamboo, 1,150 kg/m3, class 1 durability (EN 350), 20 x 140 x 1850 mm.', tags: ['Decking', 'Bamboo'],
      evidence: [{ title: 'Durability test report, strand-woven bamboo', kind: 'report' }], review: 'pending', created: daysAgo(1, 6) },
  ],
};

// which evidence files the owners made public (by listing id and evidence index); every other one stays private
export const publicEvidence = {
  'rooftop-pv-schools': [0], 'agri-solar-pump-kit': [0], 'recycled-denim-yarn': [0, 1], 'workwear-take-back': [0], 'mangrove-restoration': [1],
  'hempcrete-blocks': [0], 'rpet-flakes': [0], 'regen-tea-bulk': [0], 'parcel-flood-map': [0],
};

// ---------------------------------------------------------------- an enquiry written to a person (people take enquiries too)
export const personEnquiries = [
  { id: 'enq-p1', toPerson: 'asha-rao', from: 'hanna-keller', status: 'new', created: daysAgo(0, 9),
    subject: 'Disassembly of school rooftop systems at end of life',
    messages: [['buyer', 0, 'Hello Asha, I am researching how rooftop PV on public buildings is taken apart at end of life. Would you have half an hour to talk about how your systems are mounted and what you plan for the panels after 25 years?']] },
];
