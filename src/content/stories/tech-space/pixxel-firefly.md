---
title: 'Pixxel Firefly: India''s hyperspectral satellites that read the chemistry of crops, soil and water from orbit'
dek:
- An ordinary satellite camera sees a field in three colours, or perhaps a dozen. A hyperspectral camera sees it in more than a hundred.
- Pixxel's Firefly satellites split sunlight into 135 narrow bands at 5 m resolution, enough to tell a stressed crop from a healthy one before the farmer can.
sub: tech-space
company: Pixxel Space Technologies (Bengaluru, India, and Los Angeles, USA)
product: Firefly hyperspectral imaging satellites (135 spectral bands, 5 m resolution) and Pixxel's data analysis platform
country: India
launchDate: 14 January 2025 (first three Fireflies, SpaceX Transporter-12); August 2025 (three more, completing the first six)
sdgs:
- 2
- 6
- 13
- 15
tags:
- greentech
- space
- hyperspectral
- earth-observation
- agriculture
- india
- newspace
sources:
- https://www.pixxel.space/news/pixxel-launches-worlds-highest-resolution-hyperspectral-satellites-kickstarts-firefly-constellation-for-climate-action
- https://techcrunch.com/2025/01/14/google-backed-pixxel-launches-indias-first-private-satellite-constellation/
- https://support.pixxel.space/hc/en-us/articles/18372887952668-Firefly-Constellation-470-900-nm-with-5m-Resolution
- https://www.pixxel.space/news/pixxel-launches-three-more-fireflies-with-spacex-paving-the-way-for-planetary-scale-hyperspectral-imaging
- https://cio.economictimes.indiatimes.com/news/investments/100-million-investment-to-expand-satellite-fleet-boost-planetary-intelligence/133859712
- https://www.thehindubusinessline.com/companies/pixxel-plans-at-least-four-satellite-launches-in-2028-under-1200-crore-eo-programme/article71504888.ece
- https://keeptrack.space/satellite/62697
- https://space.oscar.wmo.int/satellites/view/lstm_a
glance:
- label: Company
  text: Pixxel, a space company headquartered in Bengaluru with offices in Los Angeles, more than 300 employees
- label: Product
  text: Firefly hyperspectral satellites, about 60 kg each, plus software for analysing the data
- label: Launches
  text: three Fireflies on 14 January 2025 (SpaceX Transporter-12), three more in August 2025, giving six operational satellites and daily revisit
- label: Sensor
  text: 135 spectral bands from 470 to 900 nm, 5 m ground resolution, 40 km swath
- label: Funding
  text: US$100 million Series C in September 2026, total raised about US$195 million
- label: India
  text: building the satellites for the ₹1,200 crore national Earth observation constellation planned under IN-SPACe
image:
  src: https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Agriculture_in_West_Bengal%2C_India_%2850304489911%29.png/1280px-Agriculture_in_West_Bengal%2C_India_%2850304489911%29.png
  alt: False-colour Sentinel-2 satellite image of a patchwork of farm fields and rivers in West Bengal, India, with vegetation shown in red.
  width: 1280
  height: 778
  caption: 'Farmland in West Bengal seen by Copernicus Sentinel-2 in an enhanced false-colour composite built from a few of its 13 bands. Hyperspectral satellites such as Firefly record 135 bands over scenes like this, separating crop types, stress and soil properties far more precisely. Image: Sentinel Hub (Monja Šebela), contains modified Copernicus Sentinel data (2020), <a href="https://creativecommons.org/licenses/by/2.0" target="_blank" rel="noopener">CC BY 2.0</a>, via <a href="https://commons.wikimedia.org/wiki/File:Agriculture_in_West_Bengal,_India_(50304489911" target="_blank" rel="noopener">Wikimedia Commons</a>.png).'
links:
- label: Pixxel
  href: https://www.pixxel.space/
- label: Firefly specifications
  href: https://support.pixxel.space/hc/en-us/articles/18372887952668-Firefly-Constellation-470-900-nm-with-5m-Resolution
- label: LinkedIn
  href: https://www.linkedin.com/company/pixxel-space/
---

## The problem

Most Earth observation satellites are multispectral. They measure light in a handful of broad bands, which is enough to see that vegetation is present but not enough to see precisely what is happening inside it. Many of the most important questions for climate and food security are chemical. Is this crop short of nitrogen or water? Is a fungal disease spreading? Is a lake turning toxic with algae? Is a mine leaking acid into a river?

Hyperspectral imaging answers those questions by recording a continuous spectrum for every pixel, a fingerprint that reveals materials and conditions. Until recently, though, hyperspectral data from space came mainly from government research missions with coarse pixels, typically around 30 m, and infrequent revisits. Europe's own operational hyperspectral mission, Copernicus CHIME, is not expected before 2029 ([WMO OSCAR](https://space.oscar.wmo.int/satellites/view/lstm_a)).

## The product

Pixxel's Firefly satellites are designed to make hyperspectral data routine. The first three launched on 14 January 2025 on SpaceX's Transporter-12 rideshare, with launch integration by Exolaunch. Pixxel called them the world's highest-resolution commercial hyperspectral satellites, with pixels six times sharper than the 30 m standard of earlier hyperspectral missions ([Pixxel, January 2025](https://www.pixxel.space/news/pixxel-launches-worlds-highest-resolution-hyperspectral-satellites-kickstarts-firefly-constellation-for-climate-action)). TechCrunch described the trio as India's first private satellite constellation ([TechCrunch, 14 January 2025](https://techcrunch.com/2025/01/14/google-backed-pixxel-launches-indias-first-private-satellite-constellation/)).

Each Firefly records 135 bands across the visible and near-infrared range from 470 to 900 nm, with up to 45 bands selectable for a single acquisition, at a ground sampling distance of about 5 m over a 40 km swath and with 10-bit radiometric depth ([Pixxel support documentation](https://support.pixxel.space/hc/en-us/articles/18372887952668-Firefly-Constellation-470-900-nm-with-5m-Resolution)). The satellites fly in sun-synchronous orbit at roughly 590 km ([KeepTrack](https://keeptrack.space/satellite/62697)) and carry propulsion that extends their design life to as long as seven years.

Three more Fireflies launched in August 2025, bringing the operational fleet to six and enabling daily revisit over any point on Earth ([Pixxel, August 2025](https://www.pixxel.space/news/pixxel-launches-three-more-fireflies-with-spacex-paving-the-way-for-planetary-scale-hyperspectral-imaging)).

## How it works

Sunlight reflected from the ground passes through Firefly's telescope into a spectrometer that spreads it into narrow bands, like a prism making a rainbow. For each 5 m pixel the satellite records how much light comes back in each of those bands.

Different materials leave different spectral fingerprints. Chlorophyll absorbs strongly in red and reflects in the near-infrared, and the exact position and shape of the "red edge" between them shifts when a plant is stressed or diseased. Algal pigments, sediments, minerals and some pollutants each have their own signatures. Pixxel's analysis platform applies algorithms and machine learning to turn these spectra into maps of crop health, soil condition, water quality or land cover change.

The Indian context explains why this matters. India opened its space sector to private companies in 2020 and created IN-SPACe to authorise and support them. Before then, building and operating satellites was effectively the preserve of ISRO. Pixxel is one of the first companies to take advantage, designing its satellites in Bengaluru, launching on commercial rockets, and selling data to customers on several continents. Indian agriculture is a natural first market. The country farms on a vast scale, much of it in small plots under rain-fed or groundwater irrigation, where early warnings of pest attack, nutrient shortage or water stress can protect both yields and aquifers. Five metre pixels are fine enough to resolve many of those smallholdings, which coarser hyperspectral missions could not.

## Timeline

| Date | Milestone |
|---|---|
| 14 Jan 2025 | First three Fireflies launched on Transporter-12 |
| Aug 2025 | Three more Fireflies launched, six now operational with daily revisit |
| By 2026 | Contracts with NASA and the US National Reconnaissance Office; 200 kg platform for the Indian Air Force |
| Sep 2026 | US$100 million Series C co-led by Temasek and Seraphim |
| Early 2028 (planned) | First launches for India's national Earth observation constellation |
| 2030 (planned) | All 12 national constellation satellites in orbit |

## Impact and numbers

- **Resolution:** 5 m hyperspectral pixels, about six times sharper than the 30 m typical of earlier hyperspectral missions.
- **Revisit:** daily global revisit with six satellites.
- **Manufacturing:** Pixxel's Megapixel facility can build 25 satellites in parallel, about 100 a year, and a planned Gigapixel facility is designed for up to 400 a year ([ETCIO, September 2026](https://cio.economictimes.indiatimes.com/news/investments/100-million-investment-to-expand-satellite-fleet-boost-planetary-intelligence/133859712)).
- **Funding:** the Series C brings total funding to about US$195 million, with reported valuations of US$400 million to US$500 million.
- **National programme:** Pixxel is building the satellites for India's ₹1,200 crore programme to build 12 Earth observation satellites, with first launches early in 2028 and the full constellation by 2030 ([BusinessLine](https://www.thehindubusinessline.com/companies/pixxel-plans-at-least-four-satellite-launches-in-2028-under-1200-crore-eo-programme/article71504888.ece)).
- **Customers:** 35 to 40 customers, with government agencies providing about 75% of revenue; the company expects profitability in 2027.

**Honest caveats.** Pixxel's business leans heavily on government and defence buyers, including the US National Reconnaissance Office and the Indian Air Force, so its climate positioning sits beside a security business. Fireflies cover only the visible and near-infrared. Many mineral, soil and greenhouse gas signals sit in the shortwave infrared, which Pixxel plans to add with its next Honeybee satellites. Hyperspectral data are large and complex, and turning spectra into reliable farm advice needs local ground truth, crop calibration and trained users. Claims about yield or water savings depend on how the data are used, not on the satellite alone.

## What's next

The Honeybee generation will extend coverage into the shortwave infrared, opening up applications such as mineral mapping and methane detection. The Series C funds faster manufacturing and more satellites, and the national constellation will give Indian ministries a sovereign hyperspectral capability by 2030.

## Why it matters for Europe / green buyers

Europe is building its own hyperspectral future through CHIME, but that mission is several years away. In the meantime, commercial providers such as Pixxel offer 5 m hyperspectral data today, useful for agrifood companies tracking regenerative practices in supply chains, mining firms monitoring tailings, and water utilities watching reservoirs for algal blooms. For India, Pixxel is proof that a private company can build world-leading satellites at home and sell them globally. Green buyers should test the data against field measurements in their own use case and check how the company separates civil and defence work.

## Sources & image credits

1. Pixxel, "Pixxel Launches World's Highest-Resolution Hyperspectral Satellites, Kickstarts Firefly Constellation for Climate Action", January 2025: https://www.pixxel.space/news/pixxel-launches-worlds-highest-resolution-hyperspectral-satellites-kickstarts-firefly-constellation-for-climate-action
2. TechCrunch, "Google-backed Pixxel launches India's first private satellite constellation", 14 January 2025: https://techcrunch.com/2025/01/14/google-backed-pixxel-launches-indias-first-private-satellite-constellation/
3. Pixxel Support, "Firefly Constellation (470 to 900 nm with 5m Resolution)": https://support.pixxel.space/hc/en-us/articles/18372887952668-Firefly-Constellation-470-900-nm-with-5m-Resolution
4. Pixxel, "Pixxel Launches Three More Fireflies with SpaceX, Paving the Way for Planetary-Scale Hyperspectral Imaging", August 2025: https://www.pixxel.space/news/pixxel-launches-three-more-fireflies-with-spacex-paving-the-way-for-planetary-scale-hyperspectral-imaging
5. ETCIO (The Economic Times), "$100 million investment to expand satellite fleet, boost planetary intelligence", September 2026: https://cio.economictimes.indiatimes.com/news/investments/100-million-investment-to-expand-satellite-fleet-boost-planetary-intelligence/133859712
6. The Hindu BusinessLine, "Pixxel plans at least four satellite launches in 2028 under ₹1,200 crore EO programme": https://www.thehindubusinessline.com/companies/pixxel-plans-at-least-four-satellite-launches-in-2028-under-1200-crore-eo-programme/article71504888.ece
7. KeepTrack, Firefly satellite orbital data (NORAD 62697): https://keeptrack.space/satellite/62697
8. WMO OSCAR, Copernicus Sentinel Expansion Missions listing (CHIME-A, 2029): https://space.oscar.wmo.int/satellites/view/lstm_a

**Images:**
- "Agriculture in West Bengal, India" by Sentinel Hub (Monja Šebela), contains modified Copernicus Sentinel data (2020), licensed CC BY 2.0 (https://creativecommons.org/licenses/by/2.0), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Agriculture_in_West_Bengal,_India_(50304489911).png
