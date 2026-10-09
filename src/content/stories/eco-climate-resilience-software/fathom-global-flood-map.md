---
title: 'Fathom Global Flood Map: the Bristol flood model that maps river, rain and coastal flooding for every place on Earth'
dek:
- Floods cause more damage than almost any other natural hazard, yet for much of the world nobody can say which streets, farms or factories will go under in a 1 in 100 year storm, let alone in a warmer climate.
- Fathom, a flood science company from Bristol, sells a Global Flood Map that models every river, rainfall flood and coastline on Earth at 30 metre resolution, under any climate scenario to 2100.
sub: eco-climate-resilience-software
company: Fathom (Bristol, UK; founded in 2013 by flood scientists including co-founder Dr Andrew Smith; CEO Stuart Whitfield; owned by Swiss Re since December 2023 and run under its own brand)
product: Fathom Global Flood Map (Fathom-Global 3.0), a 30 m resolution global flood hazard dataset covering fluvial, pluvial and coastal flooding for return periods from 1 in 5 to 1 in 1,000 years and any climate scenario to 2100, delivered through the Fathom API, Fathom Portal, GeoTIFF files and partner platforms
country: United Kingdom
launchDate: 2013 (Fathom founded); 2015 (first global flood hazard dataset); 2019 (Fathom-Global 2.0); 27 Oct 2022 (Fathom-Global 3.0 launched); 14 Dec 2023 (acquired by Swiss Re); 14 Feb 2024 (free data for 16 countries via the World Bank); 21 Aug 2024 (validation paper published); 23 Jan 2026 (FathomDEM+ terrain dataset)
sdgs:
- 1
- 9
- 11
- 13
tags:
- greentech
- climate-resilience
- flood-risk
- flood-maps
- climate-adaptation
- insurance
- fathom
- swiss-re
- uk
- india
sources:
- https://www.fathom.global/newsroom/fathom-launches-global-flood-map/
- https://www.fathom.global/product/global-flood-map/
- https://doi.org/10.1029/2023WR036460
- https://www.swissre.com/press-release/Swiss-Re-acquires-Fathom-a-leader-in-water-risk-intelligence/4af5e0d7-e065-404a-b80d-6f32955f0fbe
- https://www.fathom.global/newsroom/world-bank-collaboration/
- https://www.reinsurancene.ws/fathom-launches-new-terrain-dataset-to-enhance-risk-analysis/
- https://www.eea.europa.eu/en/newsroom/news/europe-is-not-prepared-for
- https://www.niti.gov.in/sites/default/files/2021-03/Flood-Report.pdf
glance:
- label: Company
  text: Fathom, Bristol, UK, founded in 2013; part of Swiss Re since December 2023
- label: Product
  text: Fathom Global Flood Map (Fathom-Global 3.0), flood depths and risk scores for river, rainfall and coastal flooding worldwide
- label: Key fact
  text: in a peer-reviewed validation, the map matched observed flood extents with a critical success index of about 0.75 and water levels within about 0.6 m on average
- label: Scale
  text: global coverage at about 30 m, sharpened to 10 m where regional data allows
- label: Caveat
  text: a global model cannot replace detailed local studies, and future flood projections carry wide uncertainty ranges
image:
  src: https://upload.wikimedia.org/wikipedia/commons/e/eb/Gloucester_Road_Tewkesbury%2C_during_the_flood_of_July_2007_-_geograph.org.uk_-_2205066.jpg
  alt: Flood water covering a road and the fronts of houses in Tewkesbury, England, during the July 2007 floods.
  width: 1280
  height: 990
  caption: 'Illustrative: Gloucester Road in Tewkesbury, England, during the July 2007 floods. This is not a Fathom product image. Photo: Helen Iwanczuk, <a href="https://creativecommons.org/licenses/by-sa/2.0" target="_blank" rel="noopener">CC BY-SA 2.0</a>, via <a href="https://commons.wikimedia.org/wiki/File:Gloucester_Road_Tewkesbury,_during_the_flood_of_July_2007_-_geograph.org.uk_-_2205066.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>.'
links:
- label: Fathom
  href: https://www.fathom.global/
- label: Global Flood Map
  href: https://www.fathom.global/product/global-flood-map/
- label: Fathom on LinkedIn
  href: https://www.linkedin.com/company/fathom-global
---

## The problem

Europe is the fastest warming continent, and the European Environment Agency's first European Climate Risk Assessment, published in March 2024, found that its policies and adaptation are not keeping pace with the risks. Of 36 major climate risks, eight were judged particularly urgent, including protecting people and infrastructure from floods and wildfires. Rising sea levels threaten low-lying coastal cities, and the EEA warned that costly floods and fires already threaten the viability of the EU Solidarity Fund and could widen private insurance gaps ([EEA](https://www.eea.europa.eu/en/newsroom/news/europe-is-not-prepared-for)).

To plan defences, price insurance or choose where to build, people need to know where water will go. Many countries have detailed national flood maps, but they use different methods, cover different perils and often ignore future climate. In much of Africa, Asia and South America there is little reliable mapping at all. Fathom says risk professionals have long struggled to obtain complete and consistent flood data across all the countries in which they work ([Fathom](https://www.fathom.global/newsroom/fathom-launches-global-flood-map/)).

## The product

The **Fathom Global Flood Map** is a dataset and software service rather than a physical device. Its third version, Fathom-Global 3.0, was launched on 27 October 2022. Key features:

- **All three main flood types:** fluvial (river), pluvial (surface water from heavy rain) and coastal flooding, with defended and undefended views.
- **Return periods:** flood depths for events from 1 in 5 years to 1 in 1,000 years, plus Relative Risk and Risk Category scores.
- **Any climate future:** a Climate Dynamics framework lets users pick any combination of future year and climate scenario or warming level up to 2100.
- **Resolution:** about 30 m globally, downscaled to 10 m where regional data allows, with over 99% LiDAR coverage for England and Wales.
- **Delivery:** the Fathom API, the Fathom Portal, GeoTIFF files hosted by the customer, or partner platforms including Swiss Re's ([Fathom](https://www.fathom.global/product/global-flood-map/)).

Customers include insurers, banks, engineers, companies and governments. Microsoft, quoted on Fathom's product page, says the data is critical to assessing risks to its cloud infrastructure.

## How it works

1. **Terrain:** the model starts from FABDEM, a global "bare earth" elevation map with forests and buildings removed, enriched with local LiDAR where available.
2. **Rivers:** it estimates the location, width and depth of every river channel in the world, so that 100% of rivers are modelled.
3. **Hydraulics:** physics-based hydraulic models simulate how water from rivers, rainfall and the sea spreads over that terrain for each return period.
4. **Climate:** the results are conditioned on climate projections, so users can see how hazard changes by year and emissions scenario.
5. **Output:** flood depths, water surface elevations and risk scores are delivered by API or file, and can be licensed for the whole planet or a single polygon ([Fathom](https://www.fathom.global/product/global-flood-map/)).

## Timeline

| Date | Milestone |
|---|---|
| 2013 | Fathom founded in Bristol to provide science-driven, transparent flood modelling |
| 2015 | First global flood hazard dataset |
| 2019 | Fathom-Global 2.0 with better river channels and event footprints |
| 27 Oct 2022 | Fathom-Global 3.0 launched with coastal flooding, Climate Dynamics and an API |
| 14 Dec 2023 | Swiss Re acquires Fathom, which keeps its brand |
| 14 Feb 2024 | Free non-commercial data for 16 climate-vulnerable countries via the World Bank |
| 21 Aug 2024 | Peer-reviewed validation published in *Water Resources Research* |
| 23 Jan 2026 | FathomDEM+ terrain dataset launched to underpin the next flood map |

## Impact and numbers

- **Accuracy:** in a 2024 paper in *Water Resources Research*, Oliver Wing, Paul Bates, Andrew Smith and colleagues tested the map against benchmark cases from local water level records to national engineering flood maps. It achieved a critical success index of about 0.75 for flood extent and deviated from observed water levels by about 0.6 m on average, which the authors call unprecedented for a global model ([Water Resources Research](https://doi.org/10.1029/2023WR036460)).
- **Climate signal:** the same paper found that under an optimistic warming scenario (SSP1-2.6), end-of-century global flood hazard rises by about 9%, within today's uncertainty. Under a pessimistic scenario (SSP5-8.5), the change emerges in the 2040s and reaches about 49% by 2100, with a likely range of 7% to 109%.
- **Data for poorer countries:** under a World Bank licence funded mainly by the Global Facility for Disaster Reduction and Recovery and the Global Shield Financing Facility, Fathom offers its data free for non-commercial use to 16 climate-vulnerable countries, including Pakistan, Somalia and Yemen, with scenarios for 2030, 2050 and 2080 ([Fathom](https://www.fathom.global/newsroom/world-bank-collaboration/)).
- **Reinsurance:** Swiss Re bought Fathom to strengthen its flood models and close the protection gap for natural catastrophes ([Swiss Re](https://www.swissre.com/press-release/Swiss-Re-acquires-Fathom-a-leader-in-water-risk-intelligence/4af5e0d7-e065-404a-b80d-6f32955f0fbe)).

**Honest caveats.** A 30 m global map is a screening tool. It can miss small drains, culverts and local defences, and Fathom itself adds metadata to show where its results are less certain. The validation statistics are averages across test cases and will be worse in some places. The climate projections show a very wide range, and the authors note that under low warming the change is hidden within today's uncertainty. Most of the validation was led by Fathom's own scientists, although it passed peer review. Since 2023 Fathom has been owned by Swiss Re, one of the world's largest reinsurers, so its data now also serves a company that profits from pricing flood risk. The full dataset is a commercial licence; only the World Bank countries get it free.

## What's next

In January 2026 Fathom launched FathomDEM+, a global terrain dataset built from more than 10 million km2 of curated LiDAR and other high-resolution data plus machine learning. It is designed to underpin the next generation of Fathom's flood maps, starting with an updated Global Flood Map, and is also sold on its own. Chief Scientist and Product Officer Oliver Wing said terrain errors "show up directly in flood models", which is why the company is fixing the base layer first ([Reinsurance News](https://www.reinsurancene.ws/fathom-launches-new-terrain-dataset-to-enhance-risk-analysis/)). Swiss Re has also integrated Fathom's flood and terrain data into its internal catastrophe model.

## Why it matters for Europe / green buyers

The EEA says many climate resilience measures take a long time, so action is needed even on risks that are not yet critical. Consistent, climate-conditioned flood maps let a pension fund, a city or a utility compare a site in Germany with one in Portugal or Bangladesh using the same method, and see how the picture changes by 2050.

India's Rashtriya Barh Ayog put the area of India liable to floods at 40 million hectares. NITI Aayog's 2021 flood report says floods affect about 7.17 million hectares a year, claim 1,654 lives on average and cause average annual losses of about Rs 5,649 crore, and that urban flooding in cities such as Delhi, Mumbai and Kolkata is now a major problem ([NITI Aayog](https://www.niti.gov.in/sites/default/files/2021-03/Flood-Report.pdf)). Global maps like Fathom's can help Indian insurers, lenders and planners screen assets where detailed local maps do not yet exist.

## Sources & image credits

1. Fathom, "Fathom launches new Global Flood Map: Fathom-Global 3.0" (27 Oct 2022): https://www.fathom.global/newsroom/fathom-launches-global-flood-map/
2. Fathom, "Global Flood Map" product page: https://www.fathom.global/product/global-flood-map/
3. Wing, O. E. J. et al., "A 30 m Global Flood Inundation Model for Any Climate Scenario", Water Resources Research 60(8), e2023WR036460 (2024): https://doi.org/10.1029/2023WR036460
4. Swiss Re, "Swiss Re acquires Fathom, a leader in water risk intelligence" (14 Dec 2023): https://www.swissre.com/press-release/Swiss-Re-acquires-Fathom-a-leader-in-water-risk-intelligence/4af5e0d7-e065-404a-b80d-6f32955f0fbe
5. Fathom, "World Bank collaboration: Fathom offers flood data for free" (14 Feb 2024): https://www.fathom.global/newsroom/world-bank-collaboration/
6. Reinsurance News, "Fathom launches new terrain dataset to enhance risk analysis" (23 Jan 2026): https://www.reinsurancene.ws/fathom-launches-new-terrain-dataset-to-enhance-risk-analysis/
7. European Environment Agency, "Europe is not prepared for rapidly growing climate risks" (Mar 2024): https://www.eea.europa.eu/en/newsroom/news/europe-is-not-prepared-for
8. NITI Aayog, "Report of the Committee Constituted for Formulation of Strategy for Flood Management Works in Entire Country and River Management Activities and Works Related to Border Areas (2021-26)" (Mar 2021): https://www.niti.gov.in/sites/default/files/2021-03/Flood-Report.pdf

**Images:**
- "Gloucester Road Tewkesbury, during the flood of July 2007" by Helen Iwanczuk, CC BY-SA 2.0 (https://creativecommons.org/licenses/by-sa/2.0), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Gloucester_Road_Tewkesbury,_during_the_flood_of_July_2007_-_geograph.org.uk_-_2205066.jpg
