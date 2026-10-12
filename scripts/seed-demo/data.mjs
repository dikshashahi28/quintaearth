// The demo community for the dev site: made-up companies, people, listings and enquiries that make the member
// pages feel lived in. Every id starts with "demo-" and every email ends in @example.com, so the seed can remove
// exactly what it added. Tag values must exist in src/data (industries, sub-categories, SDG numbers, ISO countries).

// one fixed clock, so the local and dev databases get the same rows: 12 Oct 2026, 06:00 UTC
export const NOW = Date.UTC(2026, 9, 12, 6, 0, 0);
const DAY = 86_400_000, HOUR = 3_600_000;
export const daysAgo = (d, h = 0) => NOW - d * DAY - h * HOUR;

export const PASSWORD_FILE = '.credentials.txt';

// ---------------------------------------------------------------- people
// photo: null for everyone; people show the initials stone (see media.mjs for why)
export const people = [
  // the demo owner: signs in and runs Sunward Grid Collective
  { id: 'asha-rao', name: 'Asha Rao', handle: 'asha-rao', type: 'company', city: 'Pune', country: 'IN', photo: null,
    headline: 'Co-founder, Sunward Grid Collective. Solar for schools and farms.',
    bio: 'Electrical engineer by training, grid-tied solar by accident: a school in Satara needed power for its computer lab in 2018 and nobody would quote under 50 kW. We did 8 kW with a battery and have not stopped since. I look after design, procurement and the paperwork that comes with net metering in Maharashtra.\n\nHappy to compare notes on agri-solar pumps, school rooftops and what actually survives a monsoon.',
    industries: ['energy'], subs: ['energy-solar', 'energy-storage'], skills: ['Solar PV design', 'Net metering', 'Battery storage', 'Agri-solar', 'Procurement'],
    linkedin: 'https://www.linkedin.com/in/asha-rao-demo', website: 'https://sunwardgrid.example.com', created: daysAgo(58) },
  { id: 'rohan-mehta', name: 'Rohan Mehta', handle: 'rohan-mehta', type: 'individual', city: 'Pune', country: 'IN', photo: null,
    headline: 'Field lead at Sunward Grid Collective. Installs, commissioning, training.',
    bio: 'I run the install crews. Twelve people, four vans, about 1.2 MW on roofs so far. The part I care most about is handing a system over to a school caretaker who can read the inverter display without calling us.',
    industries: ['energy'], subs: ['energy-solar'], skills: ['Installation', 'Commissioning', 'Safety training', 'Team leadership'], created: daysAgo(55) },
  { id: 'priya-nair', name: 'Priya Nair', handle: 'priya-nair', type: 'individual', city: 'Mumbai', country: 'IN', photo: null,
    headline: 'Finance and impact reporting, Sunward Grid Collective.',
    bio: 'Chartered accountant who moved from audit to a solar co-op. I build the payback models our school and farmer customers see, and the impact numbers our lenders ask for. Interested in blended finance for small energy projects.',
    industries: ['energy'], subs: ['energy-solar'], skills: ['Impact reporting', 'Project finance', 'Blended finance', 'Payback modelling'], created: daysAgo(52) },

  { id: 'femke-de-vries', name: 'Femke de Vries', handle: 'femke-de-vries', type: 'company', city: 'Tilburg', country: 'NL', photo: null,
    headline: 'Founder, Delta Weave Textiles. Recycled yarn from post-consumer denim.',
    bio: 'Third generation in a Tilburg textile family, first to run the mill on recycled fibre only. We sort, shred and respin denim and workwear into yarn that European weavers buy by the tonne. Ask me about fibre length, blend ratios and why "recycled" on a label means so little without a batch number behind it.',
    industries: ['materials'], subs: ['materials-sustainable-textiles', 'materials-circular-materials'], skills: ['Mechanical recycling', 'Yarn spinning', 'Textile sourcing', 'EU textile regulation'],
    linkedin: 'https://www.linkedin.com/in/femke-de-vries-demo', website: 'https://deltaweave.example.com', created: daysAgo(61) },

  { id: 'wanjiru-kamau', name: 'Wanjiru Kamau', handle: 'wanjiru-kamau', type: 'company', city: 'Mombasa', country: 'KE', photo: null,
    headline: 'Director, Mangrove Works Kenya. Restoration with the villages that own the shore.',
    bio: 'Marine ecologist. We have planted and, more importantly, kept alive about 340 hectares of mangrove along the Kenyan coast since 2017, working through community forest associations. Blue carbon buyers: come with patience and a survey budget, and we will show you survival counts, not just planting photos.',
    industries: ['eco-restoration'], subs: ['eco-sustainable-forestry'], skills: ['Mangrove ecology', 'Blue carbon', 'Community forestry', 'Field surveys', 'Grant writing'],
    linkedin: 'https://www.linkedin.com/in/wanjiru-kamau-demo', created: daysAgo(49) },
  { id: 'daniel-odhiambo', name: 'Daniel Odhiambo', handle: 'daniel-odhiambo', type: 'individual', city: 'Kilifi', country: 'KE', photo: null,
    headline: 'Nursery and monitoring lead, Mangrove Works Kenya.',
    bio: 'I grew up in Kilifi and now run our three nurseries and the drone survey work. If you want to know how many seedlings survive year two in a given creek, I have the numbers.',
    industries: ['eco-restoration'], subs: ['eco-sustainable-forestry'], skills: ['Nursery management', 'Drone mapping', 'Monitoring'], created: daysAgo(44) },

  { id: 'lukas-brandt', name: 'Lukas Brandt', handle: 'lukas-brandt', type: 'company', city: 'Freiburg', country: 'DE', photo: null,
    headline: 'Managing partner, Kalksteen Bau. Timber, hemp and lime instead of concrete.',
    bio: 'Civil engineer. Kalksteen builds and retrofits with bio-based materials: timber frames, hempcrete infill, lime renders. Sixty-odd buildings so far, mostly schools and housing cooperatives in Baden-Württemberg. I spend most of my week on building passports and getting insurers comfortable with materials their grandparents used.',
    industries: ['green-architecture', 'materials'], subs: ['arch-green-buildings', 'arch-resource-lifecycle', 'materials-low-carbon-industry'], skills: ['Structural engineering', 'Hempcrete', 'Timber construction', 'Building passports', 'Life-cycle assessment'],
    linkedin: 'https://www.linkedin.com/in/lukas-brandt-demo', website: 'https://kalksteen.example.com', created: daysAgo(66) },

  { id: 'mariana-costa', name: 'Mariana Costa', handle: 'mariana-costa', type: 'company', city: 'Curitiba', country: 'BR', photo: null,
    headline: 'CEO, Rio Verde Logística. Electric last-mile delivery in southern Brazil.',
    bio: 'We run 180 electric vans and cargo bikes for retailers and pharmacies in Curitiba, Porto Alegre and Florianópolis. Before this I spent ten years in diesel fleet operations, which is exactly why I know where the savings are. Looking for depot charging partners and software people who have met a real dispatcher.',
    industries: ['transportation'], subs: ['transport-evs', 'transport-clean-mobility', 'transport-logistics-software'], skills: ['Fleet operations', 'EV charging', 'Route planning', 'Last-mile logistics'],
    linkedin: 'https://www.linkedin.com/in/mariana-costa-demo', website: 'https://rioverde.example.com', created: daysAgo(40) },

  { id: 'linh-tran', name: 'Linh Tran', handle: 'linh-tran', type: 'company', city: 'Ho Chi Minh City', country: 'VN', photo: null,
    headline: 'Founder, Saigon Circular Foods. Animal feed from cassava and brewery waste.',
    bio: 'Food technologist. Our plant in Củ Chi turns cassava peel and spent brewery grain into pelleted feed for fish and poultry farms in the Mekong Delta. Nine hundred tonnes a month and a cold-chain audit service that pays for itself in the first season.',
    industries: ['technology'], subs: ['tech-food', 'tech-agriculture'], skills: ['Food processing', 'Feed formulation', 'Cold chain', 'By-product sourcing'],
    website: 'https://saigoncircular.example.com', created: daysAgo(21) },

  { id: 'tom-whitaker', name: 'Tom Whitaker', handle: 'tom-whitaker', type: 'company', city: 'Leeds', country: 'GB', photo: null,
    headline: 'Founder, Northbeck Thermal. Heat from flooded coal mines.',
    bio: 'Mechanical engineer, ex-district heating. Northbeck designs mine-water heat networks for towns built on top of old coalfields: the water down there is 15 to 20 degrees all year and nobody is using it. Two schemes running in Yorkshire, three in design.',
    industries: ['energy'], subs: ['energy-geothermal', 'energy-decarbonization'], skills: ['District heating', 'Heat pumps', 'Hydrogeology', 'Feasibility studies'],
    linkedin: 'https://www.linkedin.com/in/tom-whitaker-demo', website: 'https://northbeck.example.com', created: daysAgo(33) },

  { id: 'maya-lindqvist', name: 'Maya Lindqvist', handle: 'maya-lindqvist', type: 'company', city: 'Portland', country: 'US', photo: null,
    headline: 'Founder, Cascadia Flood Labs. Flood risk at the level of a single parcel.',
    bio: 'Hydrologist and former county planner. Cascadia builds flood maps that a town clerk can actually use: one parcel, one risk band, one plain-language note. Four people, mostly remote, all of us have waded through a flooded basement at least once.',
    industries: ['eco-restoration', 'technology'], subs: ['eco-climate-resilience-software', 'tech-water'], skills: ['Hydrology', 'GIS', 'Climate risk modelling', 'Municipal planning'],
    linkedin: 'https://www.linkedin.com/in/maya-lindqvist-demo', website: 'https://cascadiaflood.example.com', created: daysAgo(27) },

  { id: 'kofi-mensah', name: 'Kofi Mensah', handle: 'kofi-mensah', type: 'company', city: 'Accra', country: 'GH', photo: null,
    headline: 'Managing director, Accra Plastics Loop. Collectors, flakes, lumber.',
    bio: 'We buy plastic from 1,400 registered collectors in Greater Accra, wash and flake it, and sell food-grade rPET to bottlers and recycled lumber to councils. The collectors are paid weekly by mobile money and that, not the machinery, is the business.',
    industries: ['materials'], subs: ['materials-waste-management', 'materials-recyclable-products', 'materials-circular-economy'], skills: ['Waste collection networks', 'rPET processing', 'Mobile payments', 'Operations'],
    linkedin: 'https://www.linkedin.com/in/kofi-mensah-demo', website: 'https://accraplastics.example.com', created: daysAgo(70) },
  { id: 'ama-boateng', name: 'Ama Boateng', handle: 'ama-boateng', type: 'individual', city: 'Accra', country: 'GH', photo: null,
    headline: 'Collector network manager, Accra Plastics Loop.',
    bio: 'I onboard and pay our collectors, and settle the arguments about scale weights. Interested in how other networks handle insurance and health cover for informal workers.',
    industries: ['materials'], subs: ['materials-waste-management'], skills: ['Community organising', 'Payments', 'Training'], created: daysAgo(63) },

  { id: 'ines-carvalho', name: 'Inês Carvalho', handle: 'ines-carvalho', type: 'company', city: 'Lisbon', country: 'PT', photo: null,
    headline: 'Owner, Lisboa Wind Craft. Small turbines and blade repair.',
    bio: 'Aerospace engineer who prefers wind. We build 5 kW turbines for farms and island grids and refurbish blades for larger machines, which keeps a lot of fibreglass out of landfill.',
    industries: ['energy'], subs: ['energy-wind'], skills: ['Turbine design', 'Composite repair', 'Off-grid systems'], website: 'https://lisboawind.example.com', created: daysAgo(18) },

  { id: 'nimal-perera', name: 'Nimal Perera', handle: 'nimal-perera', type: 'company', city: 'Kandy', country: 'LK', photo: null,
    headline: 'Estate director, Ceylon Tea Regen. Regenerative tea from the hill country.',
    bio: 'Our estates near Kandy went regenerative in 2015: shade trees back in, synthetic fertiliser out, pickers on year-round contracts. Yields dipped for three seasons and then came back with better leaf. We sell bulk to blenders who want the story and the soil data to back it.',
    industries: ['technology', 'eco-restoration'], subs: ['tech-agriculture', 'eco-sustainable-forestry'], skills: ['Regenerative agriculture', 'Tea processing', 'Agroforestry', 'Export logistics'],
    linkedin: 'https://www.linkedin.com/in/nimal-perera-demo', website: 'https://ceylontearegen.example.com', created: daysAgo(75) },

  { id: 'dewi-santoso', name: 'Dewi Santoso', handle: 'dewi-santoso', type: 'company', city: 'Bandung', country: 'ID', photo: null,
    headline: 'Architect, Bandung Bamboo Studio. Engineered bamboo for public buildings.',
    bio: 'We design and build with treated, laminated bamboo: schools, markets, a small clinic. Bamboo grows back in five years; the buildings are designed to last fifty.',
    industries: ['green-architecture', 'materials'], subs: ['arch-green-buildings', 'materials-circular-materials'], skills: ['Architecture', 'Bamboo engineering', 'Community buildings'], created: daysAgo(9) },

  // independent members: no company
  { id: 'elena-marchetti', name: 'Elena Marchetti', handle: 'elena-marchetti', type: 'individual', city: 'Milan', country: 'IT', photo: null,
    headline: 'Sustainability reporting consultant. CSRD, supplier data, no greenwash.',
    bio: 'Fifteen years in textile and food supply chains, now helping mid-sized European companies get their CSRD reporting done with numbers they can defend. I also source for two client brands, which is why I am here: I want to meet makers, not marketing teams.',
    industries: ['materials', 'technology'], subs: ['materials-sustainable-textiles', 'tech-food'], skills: ['CSRD reporting', 'Supplier audits', 'Supply chain traceability', 'Sourcing'],
    linkedin: 'https://www.linkedin.com/in/elena-marchetti-demo', created: daysAgo(36) },
  { id: 'samuel-oyelaran', name: 'Samuel Oyelaran', handle: 'samuel-oyelaran', type: 'individual', city: 'Lagos', country: 'NG', photo: null,
    headline: 'Off-grid energy engineer. Mini-grids for markets and clinics.',
    bio: 'I have commissioned 23 solar mini-grids across Nigeria and Ghana for developers and NGOs. Available for design reviews, commissioning and training local operators. Strong views on battery chemistry in 40-degree heat.',
    industries: ['energy'], subs: ['energy-solar', 'energy-storage'], skills: ['Mini-grid design', 'Commissioning', 'Battery systems', 'Operator training'],
    linkedin: 'https://www.linkedin.com/in/samuel-oyelaran-demo', created: daysAgo(30) },
  { id: 'hanna-keller', name: 'Hanna Keller', handle: 'hanna-keller', type: 'individual', city: 'Berlin', country: 'DE', photo: null,
    headline: 'Circular design researcher. Repair, disassembly, material passports.',
    bio: 'Industrial designer turned researcher. I work with manufacturers on products that can be taken apart and with policy teams on what a digital product passport should actually contain. Open to collaborations on furniture, appliances and workwear.',
    industries: ['materials'], subs: ['materials-circular-economy', 'materials-reusable-products'], skills: ['Design for disassembly', 'Material passports', 'Repairability', 'Research'],
    website: 'https://hannakeller.example.com', created: daysAgo(14) },
  { id: 'arjun-iyer', name: 'Arjun Iyer', handle: 'arjun-iyer', type: 'individual', city: 'Bengaluru', country: 'IN', photo: null,
    headline: 'Climate data scientist. Satellite imagery for crops, forests and floods.',
    bio: 'I turn satellite data into things field teams can use: crop stress maps, canopy change alerts, flood extents the morning after. Previously at a space-tech start-up, now independent and working with restoration and agriculture projects in South Asia and East Africa.',
    industries: ['technology', 'eco-restoration'], subs: ['tech-space', 'tech-agriculture', 'eco-climate-resilience-software'], skills: ['Remote sensing', 'Machine learning', 'Python', 'GIS'],
    linkedin: 'https://www.linkedin.com/in/arjun-iyer-demo', created: daysAgo(6) },
];

// the reviewer of identity checks; no public profile
export const admin = { id: 'admin', name: 'Quinta Admin', email: 'admin@example.com', created: daysAgo(90) };

// ---------------------------------------------------------------- companies
// team: [ownerId, ...memberIds]; check: 'approved' | 'pending' | 'rejected' | null
export const companies = [
  { id: 'sunward-grid-collective', slug: 'sunward-grid-collective', name: 'Sunward Grid Collective', city: 'Pune', country: 'IN', size: '11-50', founded: 2019,
    website: 'https://sunwardgrid.example.com', linkedin: 'https://www.linkedin.com/company/sunward-grid-demo', logo: { icon: 'hi-sun', bg: '#b7791f', fg: '#fff8e7', ring: true },
    description: 'A worker-owned solar co-operative in Maharashtra. We design, install and look after rooftop PV for schools and clinics, and agri-solar pump systems for smallholder groups. 1.2 MW installed, 46 schools, every system on a maintenance contract that the customer can actually afford.',
    industries: ['energy'], subs: ['energy-solar', 'energy-storage'], sdgs: ['7', '13', '4'], team: ['asha-rao', 'rohan-mehta', 'priya-nair'], check: 'approved', created: daysAgo(58),
    listings: [
      { id: 'rooftop-pv-schools', slug: 'rooftop-pv-for-schools', name: 'Rooftop PV for schools', kind: 'service', photo: 'solar-school-roof', serves: ['IN'], subs: ['energy-solar'],
        description: 'A 5 to 50 kW grid-tied rooftop system sized to a school\'s daytime load, with net metering paperwork handled by us. Includes a one-day training for the caretaker and a five-year maintenance plan. Typical payback for a Maharashtra government school is under four years; we will show you the model for your bill before you sign anything.',
        evidence: [{ title: 'MNRE empanelment certificate', kind: 'certificate' }, { title: 'Performance report, 46 school systems, 2025', kind: 'report' }], created: daysAgo(50) },
      { id: 'agri-solar-pump-kit', slug: 'agri-solar-pump-kit', name: 'Agri-solar pump kit', kind: 'product', photo: 'solar-pump-field', serves: ['IN', 'BD', 'LK'], subs: ['energy-solar'],
        description: '3 HP and 5 HP solar pump kits for shared farm wells: panels, mounting, controller, submersible pump and a lockable switchbox. Delivered as a kit a local electrician can fit in a day, with a video guide in Marathi and Hindi. Two-year warranty on the controller, ten on the panels.',
        evidence: [{ title: 'BIS test report, 5 HP controller', kind: 'report' }], created: daysAgo(47) },
      { id: 'battery-retrofit-microgrid', slug: 'battery-retrofit-for-village-microgrids', name: 'Battery retrofit for village microgrids', kind: 'product', photo: 'battery-rack', serves: ['IN'], subs: ['energy-storage'],
        description: 'LFP battery cabinets, 10 to 60 kWh, that replace lead-acid banks on existing village microgrids without changing the inverter. We have done nine retrofits so far; the first one is three years in with 94% capacity remaining.',
        evidence: [{ title: 'Cell supplier UN38.3 certificate', kind: 'certificate' }, { title: 'Three-year capacity log, Wadgaon microgrid', kind: 'report' }], created: daysAgo(31) },
      { id: 'om-plan', slug: 'operations-and-maintenance-plan', name: 'Operations and maintenance plan', kind: 'service', photo: 'solar-maintenance', serves: ['IN'], subs: ['energy-solar'], status: 'draft',
        description: 'Draft: a stand-alone maintenance contract for systems we did not install. Quarterly cleaning, annual thermal inspection, remote monitoring. Pricing still being worked out.', evidence: [], created: daysAgo(2) },
    ] },

  { id: 'delta-weave-textiles', slug: 'delta-weave-textiles', name: 'Delta Weave Textiles', city: 'Tilburg', country: 'NL', size: '51-200', founded: 2014,
    website: 'https://deltaweave.example.com', linkedin: 'https://www.linkedin.com/company/delta-weave-demo', logo: { icon: 'weave', bg: '#1f3a5f', fg: '#e8eef7' },
    description: 'A spinning mill that runs on post-consumer textiles only. We take sorted denim and workwear from collectors across the Benelux and Germany, shred it mechanically and respin it into yarn for weavers and knitters. Every lot ships with its input batch numbers, so a brand can trace a pair of jeans back to the bales it came from.',
    industries: ['materials'], subs: ['materials-sustainable-textiles', 'materials-circular-materials'], sdgs: ['12', '9', '13'], team: ['femke-de-vries'], check: 'approved', created: daysAgo(61),
    listings: [
      { id: 'recycled-denim-yarn', slug: 'recycled-denim-yarn', name: 'Recycled denim yarn', kind: 'product', photo: 'denim-yarn', serves: ['NL', 'DE', 'PT', 'IT', 'GB'], subs: ['materials-sustainable-textiles'],
        description: 'Ne 6 to Ne 20 open-end yarn, 70% post-consumer denim and 30% recycled polyester or organic cotton for strength. Minimum order 500 kg per shade. Indigo, mid-blue and grey from the input stream; no new dye. Batch traceability sheet with every pallet.',
        evidence: [{ title: 'GRS scope certificate', kind: 'certificate' }, { title: 'Batch traceability sheet, example lot', kind: 'report' }], created: daysAgo(55) },
      { id: 'workwear-take-back', slug: 'take-back-programme-for-workwear', name: 'Take-back programme for workwear', kind: 'service', photo: 'workwear-sorting', serves: ['NL', 'DE'], subs: ['materials-circular-materials'],
        description: 'For companies with uniformed staff: we collect worn-out workwear, strip badges and hardware, and feed the fibre back into our mill. You get a weight certificate per collection and, if you want it, yarn made from your own old uniforms.',
        evidence: [{ title: 'Weight and fibre recovery certificate, example', kind: 'certificate' }], created: daysAgo(40) },
      { id: 'hemp-cotton-fabric', slug: 'hemp-cotton-blend-fabric', name: 'Hemp-cotton blend fabric', kind: 'product', photo: 'hemp-fabric', serves: ['NL', 'DE', 'PT'], subs: ['materials-sustainable-textiles'],
        description: 'A woven 55/45 hemp and recycled cotton fabric, 280 gsm, for jackets and bags. European hemp, our own recycled cotton, woven by a partner mill in Portugal. Available in natural and two low-impact dyed shades.', evidence: [], created: daysAgo(12) },
    ] },

  { id: 'mangrove-works-kenya', slug: 'mangrove-works-kenya', name: 'Mangrove Works Kenya', city: 'Mombasa', country: 'KE', size: '11-50', founded: 2017,
    website: 'https://mangroveworks.example.com', logo: { icon: 'hi-sprout', bg: '#0f6e56', fg: '#e6f4ef', ground: true },
    description: 'Mangrove restoration on the Kenyan coast, done with the community forest associations that hold the rights to the shore. We run nurseries, plant, and then do the unglamorous part: monitoring survival for five years and paying the villages for the trees that are still standing.',
    industries: ['eco-restoration'], subs: ['eco-sustainable-forestry'], sdgs: ['14', '15', '13', '1'], team: ['wanjiru-kamau', 'daniel-odhiambo'], check: 'approved', created: daysAgo(49),
    listings: [
      { id: 'mangrove-restoration', slug: 'mangrove-restoration-per-hectare', name: 'Mangrove restoration, per hectare', kind: 'service', photo: 'mangrove-planting', serves: ['KE'], subs: ['eco-sustainable-forestry'],
        description: 'Site assessment, species selection, planting and five years of monitoring, priced per hectare. Payment is split: 40% at planting, the rest against yearly survival counts. Our average year-three survival across 340 hectares is 71%.',
        evidence: [{ title: 'Survival monitoring summary 2020 to 2025', kind: 'report' }, { title: 'Kenya Forest Service partnership letter', kind: 'certificate' }], created: daysAgo(45) },
      { id: 'blue-carbon-survey', slug: 'blue-carbon-baseline-survey', name: 'Blue carbon baseline survey', kind: 'service', photo: 'mangrove-survey', serves: ['KE'], subs: ['eco-sustainable-forestry'],
        description: 'Soil cores, biomass plots and drone mapping to establish a carbon baseline for a mangrove site before any credit methodology is applied. Delivered as a report plus the raw data, so a verifier can check our work.',
        evidence: [{ title: 'Sample baseline report, Mida Creek', kind: 'report' }], created: daysAgo(38) },
      { id: 'nursery-seedlings', slug: 'community-nursery-seedlings', name: 'Community nursery seedlings', kind: 'product', photo: 'mangrove-nursery', serves: ['KE'], subs: ['eco-sustainable-forestry'],
        description: 'Rhizophora, Avicennia and Ceriops seedlings from our three village nurseries, for other restoration projects on the coast. Sold in lots of 1,000 with a planting guide.', evidence: [], created: daysAgo(20) },
    ] },

  { id: 'kalksteen-bau', slug: 'kalksteen-bau', name: 'Kalksteen Bau', city: 'Freiburg', country: 'DE', size: '51-200', founded: 2008,
    website: 'https://kalksteen.example.com', linkedin: 'https://www.linkedin.com/company/kalksteen-demo', logo: { icon: 'hi-arch', bg: '#9a4b2f', fg: '#f7ebe3' },
    description: 'A construction company that builds with timber, hemp and lime. New schools and housing for cooperatives, deep retrofits of post-war blocks, all with a material passport so the next owner knows what is in the walls. Sixty-four buildings since 2008.',
    industries: ['green-architecture', 'materials'], subs: ['arch-green-buildings', 'arch-resource-lifecycle', 'materials-low-carbon-industry'], sdgs: ['11', '9', '13', '12'], team: ['lukas-brandt'], check: 'approved', created: daysAgo(66),
    listings: [
      { id: 'hempcrete-blocks', slug: 'hempcrete-block-system', name: 'Hempcrete block system', kind: 'product', photo: 'hempcrete-wall', serves: ['DE', 'NL'], subs: ['materials-low-carbon-industry'],
        description: 'Prefabricated hempcrete blocks for infill walls, 30 and 36 cm, with a lime render system. Carbon-negative at the factory gate, vapour-open, fire class B. We supply, or supply and build.',
        evidence: [{ title: 'EPD, hempcrete block 36 cm', kind: 'certificate' }, { title: 'Fire test report, B-s1,d0', kind: 'report' }], created: daysAgo(60) },
      { id: 'timber-retrofit-design', slug: 'timber-frame-retrofit-design', name: 'Timber-frame retrofit design', kind: 'service', photo: 'timber-frame', serves: ['DE'], subs: ['arch-green-buildings'],
        description: 'Design and engineering for wrapping an existing building in a prefabricated timber facade with insulation and new windows, done while the residents stay in. We have done eleven blocks this way.',
        evidence: [{ title: 'Case study, Weingarten retrofit', kind: 'report' }], created: daysAgo(52) },
      { id: 'building-passport-audit', slug: 'building-passport-audit', name: 'Building passport audit', kind: 'service', photo: 'building-audit', serves: ['DE', 'NL'], subs: ['arch-resource-lifecycle'],
        description: 'An inventory of what a building is made of and what can be recovered from it, in a format compatible with Madaster. For owners planning a renovation or demolition.', evidence: [], created: daysAgo(30) },
    ] },

  { id: 'rio-verde-logistica', slug: 'rio-verde-logistica', name: 'Rio Verde Logística', city: 'Curitiba', country: 'BR', size: '201-1000', founded: 2016,
    website: 'https://rioverde.example.com', linkedin: 'https://www.linkedin.com/company/rio-verde-demo', logo: { icon: 'hi-transport', bg: '#2e7d32', fg: '#eaf5ea', ring: true },
    description: 'Electric last-mile delivery in southern Brazil. 180 electric vans and cargo bikes, three depots with our own solar and storage, 2.1 million parcels a year for retailers, pharmacies and food brands. Diesel-free since 2023.',
    industries: ['transportation'], subs: ['transport-evs', 'transport-clean-mobility', 'transport-logistics-software'], sdgs: ['11', '13', '8'], team: ['mariana-costa'], check: 'approved', created: daysAgo(40),
    listings: [
      { id: 'electric-last-mile', slug: 'electric-last-mile-fleet', name: 'Electric last-mile fleet', kind: 'service', photo: 'electric-van', serves: ['BR'], subs: ['transport-evs', 'transport-clean-mobility'],
        description: 'Next-day and same-day delivery with electric vans and cargo bikes in Curitiba, Porto Alegre and Florianópolis. Per-parcel pricing with an emissions statement on every monthly invoice.',
        evidence: [{ title: 'Fleet emissions statement 2025', kind: 'report' }], created: daysAgo(36) },
      { id: 'route-planner', slug: 'route-planner-for-mixed-fleets', name: 'Route planner for mixed fleets', kind: 'product', photo: 'route-planning', serves: ['BR', 'CO'], subs: ['transport-logistics-software'],
        description: 'The dispatch software we built for ourselves, now licensed to other operators: plans routes for vans, bikes and walkers together, with charging stops and real battery curves. Portuguese and Spanish.',
        evidence: [], created: daysAgo(15) },
    ] },

  { id: 'saigon-circular-foods', slug: 'saigon-circular-foods', name: 'Saigon Circular Foods', city: 'Ho Chi Minh City', country: 'VN', size: '11-50', founded: 2020,
    website: 'https://saigoncircular.example.com', logo: { icon: 'hi-sprig', bg: '#6b8e23', fg: '#f4f8e8' },
    description: 'We turn cassava peel, spent brewery grain and fruit pulp into pelleted feed for fish and poultry farms in the Mekong Delta, and audit cold chains for food companies that are losing more product than they think.',
    industries: ['technology'], subs: ['tech-food', 'tech-agriculture'], sdgs: ['2', '12'], team: ['linh-tran'], check: 'pending', created: daysAgo(21),
    listings: [
      { id: 'cassava-feed-pellets', slug: 'cassava-peel-feed-pellets', name: 'Cassava-peel feed pellets', kind: 'product', photo: 'feed-pellets', serves: ['VN', 'TH'], subs: ['tech-food', 'tech-agriculture'],
        description: 'Pelleted feed, 22% protein, made from cassava peel and spent grain that would otherwise be dumped. Sold by the tonne to fish and poultry farms; feed conversion data from four partner farms available on request.',
        evidence: [{ title: 'Feed analysis certificate, lot 2026-09', kind: 'certificate' }], created: daysAgo(18) },
      { id: 'cold-chain-audit', slug: 'cold-chain-loss-audit', name: 'Cold-chain loss audit', kind: 'service', photo: 'cold-storage', serves: ['VN'], subs: ['tech-food'],
        description: 'Two weeks of temperature logging across your chain from farm to shelf, then a report on where product is being lost and what it costs. Most clients find 6 to 12% loss they had not accounted for.', evidence: [], created: daysAgo(10) },
    ] },

  { id: 'northbeck-thermal', slug: 'northbeck-thermal', name: 'Northbeck Thermal', city: 'Leeds', country: 'GB', size: '11-50', founded: 2018,
    website: 'https://northbeck.example.com', linkedin: 'https://www.linkedin.com/company/northbeck-demo', logo: { icon: 'hi-drop', bg: '#8b1e3f', fg: '#fbe9ee' },
    description: 'Heat networks fed by the water in abandoned coal mines. Towns across northern England sit on flooded workings holding water at a steady 15 to 20 degrees; we design the boreholes, heat pumps and pipework to bring it into homes and public buildings.',
    industries: ['energy'], subs: ['energy-geothermal', 'energy-decarbonization'], sdgs: ['7', '13', '11'], team: ['tom-whitaker'], check: 'rejected', created: daysAgo(33),
    listings: [
      { id: 'mine-water-heat-design', slug: 'mine-water-heat-network-design', name: 'Mine-water heat network design', kind: 'service', photo: 'heat-network-pipes', serves: ['GB'], subs: ['energy-geothermal'],
        description: 'Feasibility through detailed design for a mine-water heat scheme: coal authority liaison, borehole siting, heat pump plant and network routing. Two schemes running, three in design.',
        evidence: [{ title: 'Feasibility summary, Gateshead scheme', kind: 'report' }], created: daysAgo(28) },
      { id: 'heat-pump-sizing', slug: 'heat-pump-sizing-tool', name: 'Heat pump sizing tool', kind: 'product', photo: 'heat-pump-unit', serves: ['GB', 'IE'], subs: ['energy-decarbonization'],
        description: 'A browser tool for housing associations to size heat pumps across a stock of similar homes from EPC data and smart-meter readings, instead of one survey per house.', evidence: [], created: daysAgo(8) },
    ] },

  { id: 'cascadia-flood-labs', slug: 'cascadia-flood-labs', name: 'Cascadia Flood Labs', city: 'Portland', country: 'US', size: '1-10', founded: 2021,
    website: 'https://cascadiaflood.example.com', logo: { icon: 'hi-ripple', bg: '#1b6ca8', fg: '#e7f1fa', ground: true },
    description: 'Flood risk maps at the level of a single property, written for town clerks and homeowners rather than insurers. We cover the Pacific Northwest today and are expanding along the US and Canadian coast.',
    industries: ['eco-restoration', 'technology'], subs: ['eco-climate-resilience-software', 'tech-water'], sdgs: ['11', '13'], team: ['maya-lindqvist'], check: 'approved', created: daysAgo(27),
    listings: [
      { id: 'parcel-flood-map', slug: 'parcel-level-flood-risk-map', name: 'Parcel-level flood risk map', kind: 'product', photo: 'flood-map', serves: ['US'], subs: ['eco-climate-resilience-software'],
        description: 'For a county or town: every parcel scored for river, coastal and rainfall flooding under today\'s climate and 2050, with a plain-language note per property. Delivered as a web map and a GIS layer.',
        evidence: [{ title: 'Method note and validation against 2024 floods', kind: 'report' }], created: daysAgo(24) },
      { id: 'resilience-plan', slug: 'resilience-plan-for-small-towns', name: 'Resilience plan for small towns', kind: 'service', photo: 'town-river', serves: ['US'], subs: ['eco-climate-resilience-software'],
        description: 'A twelve-week engagement that turns the map into a plan: which culverts first, which streets to raise, what to tell residents. Priced for towns under 20,000 people.', evidence: [], created: daysAgo(11) },
    ] },

  { id: 'accra-plastics-loop', slug: 'accra-plastics-loop', name: 'Accra Plastics Loop', city: 'Accra', country: 'GH', size: '51-200', founded: 2015,
    website: 'https://accraplastics.example.com', linkedin: 'https://www.linkedin.com/company/accra-plastics-demo', logo: { icon: 'hi-materials', bg: '#5b3a8e', fg: '#efe9f7', ring: true },
    description: 'Plastic collection and recycling in Greater Accra. 1,400 registered collectors paid weekly by mobile money, a wash-and-flake plant in Tema, food-grade rPET for bottlers and recycled lumber for councils and schools.',
    industries: ['materials'], subs: ['materials-waste-management', 'materials-recyclable-products', 'materials-circular-economy'], sdgs: ['12', '14', '8', '1'], team: ['kofi-mensah', 'ama-boateng'], check: 'approved', created: daysAgo(70),
    listings: [
      { id: 'rpet-flakes', slug: 'rpet-flakes-food-grade', name: 'rPET flakes, food grade', kind: 'product', photo: 'plastic-flakes', serves: ['GH', 'NG'], subs: ['materials-recyclable-products'],
        description: 'Hot-washed clear and light-blue PET flakes, under 50 ppm PVC, in 1-tonne bags. 400 tonnes a month capacity. Collector payment records available to buyers who need to show where their recycled content came from.',
        evidence: [{ title: 'Flake quality certificate, lot 2026-08', kind: 'certificate' }, { title: 'Collector payment audit 2025', kind: 'report' }], created: daysAgo(64) },
      { id: 'collector-onboarding', slug: 'collector-network-onboarding', name: 'Collector network onboarding', kind: 'service', photo: 'collectors-sorting', serves: ['GH', 'NG', 'KE'], subs: ['materials-waste-management'],
        description: 'We help other recyclers set up a registered, paid collector network: registration, scales, weekly mobile-money payments, basic safety kit. Done in three cities so far.',
        evidence: [], created: daysAgo(44) },
      { id: 'recycled-benches', slug: 'recycled-lumber-benches', name: 'Recycled lumber benches', kind: 'product', photo: 'recycled-bench', serves: ['GH'], subs: ['materials-recyclable-products'],
        description: 'Benches, fence posts and pallets made from mixed plastic that cannot go back into bottles. Each bench holds about 40 kg of plastic. Popular with schools and market councils.',
        evidence: [{ title: 'Load test report, 3-seat bench', kind: 'report' }], created: daysAgo(26) },
    ] },

  { id: 'lisboa-wind-craft', slug: 'lisboa-wind-craft', name: 'Lisboa Wind Craft', city: 'Lisbon', country: 'PT', size: '11-50', founded: 2012,
    website: 'https://lisboawind.example.com', logo: { icon: 'hi-wind', bg: '#0e7c86', fg: '#e5f4f5' },
    description: 'Small wind turbines for farms and island grids, built in Lisbon, and a blade refurbishment workshop that keeps fibreglass blades from larger turbines in service for another decade.',
    industries: ['energy'], subs: ['energy-wind'], sdgs: ['7', '9', '12'], team: ['ines-carvalho'], check: null, created: daysAgo(18),
    listings: [
      { id: 'small-turbine-5kw', slug: 'small-wind-turbine-5-kw', name: 'Small wind turbine, 5 kW', kind: 'product', photo: 'small-wind-turbine', serves: ['PT', 'ES' ], subs: ['energy-wind'],
        description: 'A 5 kW horizontal-axis turbine on a 12 m tilt-up mast, designed for farms and off-grid sites with average winds above 5 m/s. Pairs with any standard hybrid inverter.',
        evidence: [{ title: 'IEC 61400-2 test summary', kind: 'report' }], created: daysAgo(16) },
      { id: 'blade-refurbishment', slug: 'blade-refurbishment', name: 'Blade refurbishment', kind: 'service', photo: 'wind-blade-repair', serves: ['PT'], subs: ['energy-wind'],
        description: 'Leading-edge repair, structural patching and recoating of blades up to 45 m, in our workshop or on site. About a third of the cost of a new blade.', evidence: [], created: daysAgo(7) },
    ] },

  { id: 'ceylon-tea-regen', slug: 'ceylon-tea-regen', name: 'Ceylon Tea Regen', city: 'Kandy', country: 'LK', size: '201-1000', founded: 2005,
    website: 'https://ceylontearegen.example.com', linkedin: 'https://www.linkedin.com/company/ceylon-tea-regen-demo', logo: { icon: 'hi-leaf', bg: '#4f6b1f', fg: '#f1f6e4', ring: true },
    description: 'Three tea estates near Kandy farmed regeneratively since 2015: shade trees, compost, no synthetic fertiliser, pickers on year-round contracts. We sell bulk black and green tea to blenders who want the soil data as well as the leaf.',
    industries: ['technology', 'eco-restoration'], subs: ['tech-agriculture', 'eco-sustainable-forestry'], sdgs: ['2', '15', '8', '13'], team: ['nimal-perera'], check: 'approved', created: daysAgo(75),
    listings: [
      { id: 'regen-tea-bulk', slug: 'regenerative-tea-bulk', name: 'Regenerative tea, bulk', kind: 'product', photo: 'tea-harvest', serves: ['LK', 'GB', 'DE', 'NL', 'US'], subs: ['tech-agriculture'],
        description: 'Orthodox black and green teas from our three estates, in 20 kg sacks. Each lot comes with the estate, the field, the picking week and the latest soil organic matter reading for that field.',
        evidence: [{ title: 'Rainforest Alliance certificate', kind: 'certificate' }, { title: 'Soil organic matter trend 2015 to 2026', kind: 'report' }], created: daysAgo(70) },
      { id: 'shade-tree-programme', slug: 'shade-tree-planting-programme', name: 'Shade-tree planting programme', kind: 'service', photo: 'tea-shade-trees', serves: ['LK', 'IN'], subs: ['eco-sustainable-forestry'],
        description: 'We help other estates plan and plant shade trees: species mix, spacing, the first three years of care. We have planted 41,000 trees on our own land and know which ones the pickers hate.',
        evidence: [], created: daysAgo(35) },
    ] },

  { id: 'bandung-bamboo-studio', slug: 'bandung-bamboo-studio', name: 'Bandung Bamboo Studio', city: 'Bandung', country: 'ID', size: '1-10', founded: 2019,
    logo: { icon: 'hi-reed', bg: '#2f6f3e', fg: '#e9f3eb', ground: true },
    description: 'An architecture studio that designs and builds public buildings in treated, laminated bamboo: schools, markets, a clinic. Bamboo grows back in five years. The buildings are designed to last fifty.',
    industries: ['green-architecture', 'materials'], subs: ['arch-green-buildings', 'materials-circular-materials'], sdgs: ['11', '12', '4'], team: ['dewi-santoso'], check: null, created: daysAgo(9),
    listings: [
      { id: 'bamboo-school', slug: 'bamboo-school-building', name: 'Bamboo school building', kind: 'service', photo: 'bamboo-building', serves: ['ID'], subs: ['arch-green-buildings'],
        description: 'Design and construction of two- to six-classroom school buildings in laminated bamboo, with local crews trained on the job. Four built so far in West Java.',
        evidence: [{ title: 'Structural test report, laminated bamboo beam', kind: 'report' }], created: daysAgo(8) },
      { id: 'laminated-bamboo-beams', slug: 'laminated-bamboo-beams', name: 'Laminated bamboo beams', kind: 'product', photo: 'bamboo-beams', serves: ['ID'], subs: ['materials-circular-materials'],
        description: 'Borax-treated, laminated bamboo beams and columns for other builders, cut to length. Strength data per batch.', evidence: [], created: daysAgo(4) },
    ] },
];

// ---------------------------------------------------------------- identity checks
// the request each company sent; approved ones also stamp identity_checked_at on the company
export const checks = {
  'sunward-grid-collective': { number: 'U40106PN2019PTC183345', country: 'IN', email: 'asha@sunwardgrid.example.com', requested: daysAgo(54), reviewed: daysAgo(52) },
  'delta-weave-textiles': { number: 'KvK 61288304', country: 'NL', email: 'femke@deltaweave.example.com', requested: daysAgo(58), reviewed: daysAgo(57) },
  'mangrove-works-kenya': { number: 'PVT-9XULQ2A', country: 'KE', email: 'wanjiru@mangroveworks.example.com', requested: daysAgo(46), reviewed: daysAgo(43) },
  'kalksteen-bau': { number: 'HRB 702145', country: 'DE', email: 'brandt@kalksteen.example.com', requested: daysAgo(63), reviewed: daysAgo(62) },
  'rio-verde-logistica': { number: '24.883.112/0001-07', country: 'BR', email: 'mariana@rioverde.example.com', requested: daysAgo(37), reviewed: daysAgo(35) },
  'saigon-circular-foods': { number: '0316559274', country: 'VN', email: 'linh@saigoncircular.example.com', requested: daysAgo(1, 3), document: true,
    note: 'Registration certificate from the Ho Chi Minh City Department of Planning and Investment attached. Our website is new; the domain was registered in March.' },
  'northbeck-thermal': { number: '11482077', country: 'GB', email: 'tom@northbeck-mail.example.com', requested: daysAgo(12), reviewed: daysAgo(10),
    reason: 'The work email is on northbeck-mail.example.com but the website is northbeck.example.com. Send the request again from an address on the website\'s own domain.' },
  'cascadia-flood-labs': { number: '2021-001884392', country: 'US', email: 'maya@cascadiaflood.example.com', requested: daysAgo(25), reviewed: daysAgo(22) },
  'accra-plastics-loop': { number: 'CS123456789', country: 'GH', email: 'kofi@accraplastics.example.com', requested: daysAgo(67), reviewed: daysAgo(65) },
  'ceylon-tea-regen': { number: 'PV 00218833', country: 'LK', email: 'nimal@ceylontearegen.example.com', requested: daysAgo(72), reviewed: daysAgo(69) },
};

// one invitation the demo owner has sent and nobody has accepted yet
export const invites = [
  { id: 'invite-sunward-1', company: 'sunward-grid-collective', email: 'kavita.joshi@example.com', role: 'member', by: 'asha-rao', created: daysAgo(3) },
];

// ---------------------------------------------------------------- enquiries
// from: a member id, or { name, email, company } for a visitor. messages: [side, hoursAgoFromCreated, body]
// status new = the company has not opened it; open = conversation; closed = done.
export const enquiries = [
  // received by Sunward Grid Collective (the demo owner's inbox)
  { id: 'enq-01', to: 'sunward-grid-collective', listing: 'agri-solar-pump-kit', from: 'elena-marchetti', fromCompany: 'Marchetti Advisory', status: 'new', created: daysAgo(0, 5),
    subject: 'Pricing for 40 pump kits, Maharashtra cooperative',
    messages: [['buyer', 0, 'Hello Asha, I am advising a farmer cooperative near Nashik that wants to replace diesel pumps on 40 shared wells. Could you send pricing for the 5 HP kit at that volume, delivery time, and whether your team can train two local electricians to do the installs? They have a grant deadline at the end of November.']] },
  { id: 'enq-02', to: 'sunward-grid-collective', listing: 'rooftop-pv-schools', from: { name: 'Jonas Weber', email: 'jonas.weber@example.com', company: 'Weber Schulbau GmbH' }, status: 'new', created: daysAgo(0, 19),
    subject: 'School rooftop systems, partnership for a German NGO programme',
    messages: [['buyer', 0, 'We build and renovate schools in Germany and run a small programme with an NGO that funds solar on partner schools in India. Twelve schools in Pune district next year. Would you be open to a call about doing the installs and the five-year maintenance? Happy to share the school list.']] },
  { id: 'enq-03', to: 'sunward-grid-collective', listing: 'battery-retrofit-microgrid', from: 'lukas-brandt', fromCompany: 'Kalksteen Bau', status: 'open', companyUnread: true, created: daysAgo(4, 2),
    subject: 'LFP cabinets for a housing cooperative microgrid',
    messages: [
      ['buyer', 0, 'Hi Asha. We are building a 40-home cooperative outside Freiburg with its own PV and a small grid. The battery quotes we have are all German brands at German prices. Would you ship a 60 kWh cabinet to Europe, and does it carry CE marking? Realistic answer appreciated, I know import duties may make this pointless.'],
      ['company', 20, 'Hello Lukas, honest answer: the cabinets are CE marked because our cell supplier is, but we have never shipped outside South Asia and I would want to price the freight and duty properly before saying yes. Give me a week. Could you tell me the inverter you are planning so I can check compatibility?'],
      ['buyer', 70, 'Thanks, that is fair. SMA Sunny Island 8.0H, three of them. No rush beyond the end of the month.'],
    ] },
  { id: 'enq-04', to: 'sunward-grid-collective', listing: 'agri-solar-pump-kit', from: { name: 'Grace Mwangi', email: 'grace.mwangi@example.com', company: 'Kisumu Water Trust' }, status: 'open', companyUnread: false, buyerUnread: true, created: daysAgo(6, 7),
    subject: 'Do the kits work for 60 m boreholes?',
    messages: [
      ['buyer', 0, 'We manage 30 community boreholes around Kisumu, most around 60 m deep. Your kit page mentions farm wells. Would the 5 HP kit lift from 60 m at a useful flow, and have you shipped to Kenya before?'],
      ['company', 30, 'Hello Grace. At 60 m the 5 HP kit gives about 4 to 5 cubic metres an hour, which is fine for a community point but not for irrigation. We have not shipped to Kenya; we would need a local partner for installation and warranty. If you have an electrician you trust, I can send the technical sheet and a sample price landed in Mombasa.'],
    ] },
  { id: 'enq-05', to: 'sunward-grid-collective', listing: null, from: { name: 'Hiroshi Tanaka', email: 'h.tanaka@example.com', company: 'Osaka Impact Fund' }, status: 'open', companyUnread: false, created: daysAgo(9, 1),
    subject: 'Working capital for your school pipeline',
    messages: [
      ['buyer', 0, 'We are a small impact fund that lends working capital to energy cooperatives in South and Southeast Asia, typically USD 100k to 500k at 6 to 8 percent. Your school programme looks like a fit. Would you be open to sharing the 2025 performance report and your order book?'],
      ['company', 26, 'Thank you, Hiroshi. Yes, with pleasure. Priya from our team handles finance and will send the report and the pipeline. One question: do you lend in rupees or dollars? Currency risk has made us cautious before.'],
      ['buyer', 50, 'Dollars, but we have hedged for two Indian borrowers before and can discuss sharing that cost. Looking forward to the documents.'],
      ['company', 96, 'Sent by email from Priya this morning. Let us know a good time for a call next week.'],
    ] },
  { id: 'enq-06', to: 'sunward-grid-collective', listing: 'rooftop-pv-schools', from: 'femke-de-vries', fromCompany: 'Delta Weave Textiles', status: 'closed', companyUnread: false, created: daysAgo(16, 4),
    subject: 'A question about your maintenance contracts',
    messages: [
      ['buyer', 0, 'Not a purchase, more a peer question. We are putting solar on our mill in Tilburg and the installers all want to sell a maintenance contract that costs a third of the system over ten years. How do you price yours so schools can afford it?'],
      ['company', 10, 'Happy to share. We price cleaning and inspection at cost plus a small margin and make our money on the install. The honest trick is batching: our crews do six schools in a district in one week. If your installer has other roofs nearby, ask them to price it that way.'],
      ['buyer', 40, 'That is useful, thank you. I will push back on the quote. Closing this, and good luck with the monsoon season.'],
    ] },
  { id: 'enq-07', to: 'sunward-grid-collective', listing: 'battery-retrofit-microgrid', from: { name: 'Sarah O\'Neill', email: 'sarah.oneill@example.com', company: 'Cork Rural Energy' }, status: 'closed', companyUnread: false, created: daysAgo(22, 9),
    subject: 'Capacity log for the Wadgaon retrofit',
    messages: [
      ['buyer', 0, 'Could I see the full three-year capacity log for the Wadgaon system, not just the summary? We are choosing a chemistry for a community battery in West Cork and real data from a hot climate would help.'],
      ['company', 14, 'Of course. The full monthly log is attached to the listing now as a PDF, and I have added the ambient temperature column you will probably want. Let me know if the format is awkward.'],
    ] },
  { id: 'enq-08', to: 'sunward-grid-collective', listing: 'agri-solar-pump-kit', from: { name: 'Ravi Shankar', email: 'ravi.shankar@example.com', company: 'Shankar Farms' }, status: 'new', created: daysAgo(0, 2),
    subject: 'Single 3 HP kit for a mango orchard near Ratnagiri',
    messages: [['buyer', 0, 'Namaste. I have a 4 acre mango orchard with a 30 m open well and a diesel pump that costs me about 9,000 rupees a month in the dry season. Is the 3 HP kit enough, what would it cost delivered to Ratnagiri, and is there any subsidy you help with?']] },

  // sent by the demo owner to other companies
  { id: 'enq-09', to: 'delta-weave-textiles', listing: 'recycled-denim-yarn', from: 'asha-rao', fromCompany: 'Sunward Grid Collective', status: 'open', companyUnread: false, buyerUnread: true, created: daysAgo(3, 6),
    subject: 'Yarn for our crew uniforms',
    messages: [
      ['buyer', 0, 'Hello Femke, this is a small one. We want to make uniforms for our 12-person install crew from recycled fabric and would rather buy from a member. Do you sell woven fabric in quantities as small as 100 metres, or only yarn by the 500 kg?'],
      ['company', 28, 'Hello Asha! Yarn is 500 kg minimum, but our partner mill in Portugal keeps a stock fabric from our yarn and sells from 50 metres. I will introduce you by email. Do you want the denim or the hemp-cotton? The hemp-cotton breathes better in heat.'],
    ] },
  { id: 'enq-10', to: 'mangrove-works-kenya', listing: 'blue-carbon-survey', from: 'asha-rao', fromCompany: 'Sunward Grid Collective', status: 'new', created: daysAgo(1, 8),
    subject: 'How do you structure survival-based payments?',
    messages: [['buyer', 0, 'Wanjiru, a peer question rather than a purchase. We want to tie part of our school maintenance payments to measured performance, the way you tie restoration payments to survival counts. How do you write that into a contract so both sides trust the count?']] },
  { id: 'enq-11', to: 'accra-plastics-loop', listing: 'collector-onboarding', from: 'asha-rao', fromCompany: 'Sunward Grid Collective', status: 'closed', companyUnread: false, created: daysAgo(30, 2),
    subject: 'Mobile money payments for field workers',
    messages: [
      ['buyer', 0, 'Kofi, we pay our install crews by bank transfer and it is slow and awkward for the ones without accounts. How did you set up weekly mobile money payments for 1,400 collectors? Any provider you would recommend in India, or lessons that carry over?'],
      ['company', 9, 'Asha, the provider matters less than the process: one person owns the list, payments go out the same weekday, and every collector gets an SMS receipt. In India I would look at UPI bulk payouts through your bank. Happy to walk Priya through our spreadsheet on a call.'],
      ['buyer', 60, 'That call happened and it was gold. Thank you, closing this one.'],
    ] },
];
