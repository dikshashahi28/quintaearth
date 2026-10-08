---
title: 'Chelonia F-POD: the Cornish click logger that counts porpoises and dolphins by their sonar'
dek:
- Harbour porpoises are small, shy and almost impossible to count from a boat, especially at night or in rough seas. Yet European law requires countries to know where they are and protect them.
- Chelonia, a small firm in the Cornish fishing village of Mousehole, makes the F-POD, an underwater logger that listens for the sonar clicks of porpoises and dolphins for months at a time and has become a standard tool for marine surveys.
sub: eco-acoustics
company: Chelonia Limited (Mousehole, Cornwall, United Kingdom; owned by marine scientist Nick Tregenza; making PODs since 2006)
product: F-POD (Full waveform capture POD), a fully automated underwater passive acoustic logger that detects the echolocation click trains of porpoises, dolphins and other toothed whales, with the free FPOD app and KERNO-F v1.0 classifier; successor to the C-POD; sister product BatBug bat logger
country: United Kingdom
launchDate: 2006 (first PODs); May 2011 to Apr 2013 (304 C-PODs deployed in the EU LIFE SAMBAH Baltic survey); 2020 (F-PODs deployed in the Black Sea BlackCeTrends project); 2023 (independent F-POD vs C-POD comparison and F-POD validation papers); 6 Mar 2026 (current FPOD app release)
sdgs:
- 9
- 14
- 17
tags:
- greentech
- eco-acoustics
- bioacoustics
- passive-acoustic-monitoring
- marine-mammals
- porpoise
- dolphins
- natura-2000
- chelonia
- uk
- india
sources:
- https://www.chelonia.co.uk/
- https://www.chelonia.co.uk/f-pod/f-pod-specification/
- https://www.chelonia.co.uk/f-pod/existing-user-resources/
- https://webgate.ec.europa.eu/life/publicWebsite/project/LIFE08-NAT-S-000261/static-acoustic-monitoring-of-the-baltic-sea-harbour-porpoise
- https://www.sambah.org/Non-technical-report-v.-1.8.1.pdf
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10256617/
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10656029/
- https://www.falmouthmarineconservation.co.uk/dolphinacoustics
- https://pmc.ncbi.nlm.nih.gov/articles/PMC6817857/
- https://www.nature.com/articles/s41598-025-98691-9
glance:
- label: Company
  text: Chelonia Limited, Mousehole, Cornwall, UK, making PODs since 2006
- label: Product
  text: F-POD, an automated underwater click logger, plus the free FPOD app and KERNO-F classifier
- label: Key fact
  text: samples at 1 million samples per second, upsampled to 4 million, and compresses data more than 1,000 times by storing only click features
- label: Scale
  text: its predecessor, the C-POD, was used at 304 stations across the Baltic Sea in the EU SAMBAH survey
- label: Caveat
  text: the main F-POD validation paper was co-written by Chelonia's owner, and the F-POD detects far more than the C-POD, which complicates long-term trend series
image:
  src: https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Marsvin_%28Phocoena_phocoena%29.jpg/1280px-Marsvin_%28Phocoena_phocoena%29.jpg
  alt: A harbour porpoise surfacing in a research facility pool in Kerteminde, Denmark.
  width: 1280
  height: 1920
  caption: 'Illustrative: a harbour porpoise at Fjord- og Bæltcentret in Kerteminde, Denmark, the species the F-POD was first designed to detect. This is not a Chelonia product image. Photo: Malene Thyssen, <a href="http://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a>, via <a href="https://commons.wikimedia.org/wiki/File:Marsvin_(Phocoena_phocoena" target="_blank" rel="noopener">Wikimedia Commons</a>.jpg).'
links:
- label: Chelonia
  href: https://www.chelonia.co.uk/
- label: Chelonia F-POD user resources and updates
  href: https://www.chelonia.co.uk/f-pod/existing-user-resources/
---

## The problem

Visual surveys of whales and dolphins are expensive, need calm weather and daylight, and give only a snapshot. For small, elusive species like the harbour porpoise, they miss most animals. That matters because the harbour porpoise is listed in Annexes II and IV of the EU Habitats Directive, which oblige member states to designate protected sites for it and protect it across its range, including from fishing bycatch ([European Commission LIFE](https://webgate.ec.europa.eu/life/publicWebsite/project/LIFE08-NAT-S-000261/static-acoustic-monitoring-of-the-baltic-sea-harbour-porpoise)).

Toothed whales, however, are noisy in one useful way. They find food and navigate using trains of echolocation clicks, and those clicks can be logged by a machine left on the seabed.

## The product

The **F-POD** (Full waveform capture POD) is Chelonia's current logger, the successor to the widely used C-POD. Since 2006, Chelonia's PODs have been used to monitor wild dolphins and smaller whales by recognising their click trains. They detect porpoises, dolphins and other toothed whales except sperm whales ([Chelonia](https://www.chelonia.co.uk/)).

Key specifications from Chelonia ([F-POD specification](https://www.chelonia.co.uk/f-pod/f-pod-specification/)):

- **Sampling:** 1 million samples per second, upsampled in real time to 4 million, the highest rate of any commercial logger according to Chelonia.
- **Range:** detects clicks from 20 to 220 kHz; maximum detection range is about 400 m for porpoises and more than 1 km for dolphins.
- **Endurance:** over 8.5 months on 25 rechargeable 21700 lithium cells, and intermittent logging can stretch deployments past a year. Data volumes are typically 2 GB every four months on a microSD card.
- **Build:** a polypropylene housing rated to at least 100 m, with standardised hydrophone sensitivity so different units give comparable results.

The **FPOD app** is free, with free upgrades, and the data structure is open. The current version, dated 6 March 2026, adds a trend estimation method and an export tool for people building their own AI classifiers ([Chelonia](https://www.chelonia.co.uk/f-pod/existing-user-resources/)).

## How it works

1. **Listen:** the F-POD is moored on the seabed and analyses sound in the time domain using parallel processing, rather than storing raw audio.
2. **Select:** it identifies possible cetacean or boat sonar clicks and stores only their key features, achieving more than 1,000 times data compression with little loss of useful data.
3. **Filter:** two independent detectors spot and log boat sonars in real time, and a dynamic threshold adapts to noisy periods.
4. **Classify:** after recovery, the KERNO-F classifier in the FPOD app finds "coherent" click trains and assigns them to porpoises, dolphins or other sources.
5. **Report:** users export detection-positive minutes, hours or days per site and track how they change over seasons and years.

## Timeline

| Date | Milestone |
|---|---|
| 2006 | Chelonia's first PODs start monitoring wild dolphins and porpoises |
| May 2011 to Apr 2013 | 304 C-PODs deployed across the Baltic in the EU LIFE SAMBAH project |
| 2020 | Twenty F-PODs deployed in the Black Sea BlackCeTrends project |
| 2023 | Independent F-POD vs C-POD comparison published in *Ecology and Evolution* |
| 2023 | F-POD validation study published in *PLOS ONE* |
| 6 Mar 2026 | Current FPOD app release with KERNO-F v1.0 |

## Impact and numbers

- **Baltic porpoise:** the SAMBAH project put C-PODs at 304 stations from 5 to 80 m deep for two years, collecting 398 logging years of data. It found two separate summer populations and estimated only about 500 animals (95% CI 80 to 1,091) in the critically endangered Baltic Proper group, mostly on offshore banks south-west of Gotland ([SAMBAH](https://www.sambah.org/Non-technical-report-v.-1.8.1.pdf)). Using these hotspots, Sweden designated a Natura 2000 site of more than one million hectares, the largest marine area it had ever proposed ([European Commission LIFE](https://webgate.ec.europa.eu/life/publicWebsite/project/LIFE08-NAT-S-000261/static-acoustic-monitoring-of-the-baltic-sea-harbour-porpoise)).
- **Black Sea:** teams from Bulgaria, Georgia, Romania, Türkiye and Ukraine have run 20 F-PODs since 2020. The validation study checked 9 billion raw clicks and found error rates below 0.1% for porpoise minutes and 0.97% for dolphin minutes ([PLOS ONE, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10656029/)).
- **More sensitive than its predecessor:** in a 15-month side-by-side test in Roaringwater Bay, Ireland, the C-POD detected only 58% of the detection-positive minutes recorded by the F-POD. Foraging buzzes made up about 26% of F-POD clicks against 8% for the C-POD, and false positives were lower ([Ecology and Evolution, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10256617/)).
- **Community science:** the Cetacean Acoustic Trend Tracking project has placed a network of donated F-PODs along the south coast of England from Sussex to the Isles of Scilly, linked to local marine groups such as Falmouth Marine Conservation ([Falmouth Marine Conservation](https://www.falmouthmarineconservation.co.uk/dolphinacoustics)).

**Honest caveats.** The headline validation paper was co-authored by Nick Tregenza, Chelonia's owner, and Chelonia supplied the 20 F-PODs in kind, a conflict of interest the authors declare. The independent Irish comparison found that differences between C-POD and F-POD detection rates were not consistent over time, making it hard to apply a simple correction factor ([Ecology and Evolution, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10256617/)). That is a real problem for long monitoring programmes built on C-POD data, which is being phased out. PODs record click features, not full audio, so they cannot identify every species and do not hear baleen whales or sperm whales. At sea, loggers get lost: SAMBAH lost many units to trawling and ice in the eastern Baltic ([SAMBAH](https://www.sambah.org/Non-technical-report-v.-1.8.1.pdf)).

## What's next

Chelonia is applying the same ultra-fast sampling to land. Its **BatBug** logger uses the F-POD's 4 MHz processing to pick out bat calls and store only their details, so 32 GB can hold a year of data from solar-powered units in remote places ([Chelonia](https://www.chelonia.co.uk/)). On the software side, the open export tool lets researchers train machine learning classifiers on F-POD data.

## Why it matters for Europe / green buyers

Europe's seas are filling with offshore wind farms, cables and shipping lanes, and developers must show they are not harming protected porpoise and dolphin populations under the Habitats Directive and the Marine Strategy Framework Directive. SAMBAH showed that a network of automated loggers can deliver population estimates and drive real protection, at far lower manpower than visual surveys. Standardised, low-maintenance loggers make that kind of before-and-after evidence affordable for regulators, developers and local groups.

India has its own acoustically studied cetaceans. Researchers used C-PODs in the Ganga in Bihar to show that vessel noise strongly masks the clicks of endangered Ganges river dolphins and more than doubles their metabolic stress, as the river is turned into a major waterway ([Scientific Reports, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6817857/)). Off Sindhudurg in Maharashtra, an acoustic survey with towed hydrophones found finless porpoises at four times the visual encounter rate ([Scientific Reports, 2025](https://www.nature.com/articles/s41598-025-98691-9)). Both suggest static click loggers could help India plan waterways and coastal projects around its dolphins.

## Sources & image credits

1. Chelonia Limited, company website: https://www.chelonia.co.uk/
2. Chelonia, "F-POD specification": https://www.chelonia.co.uk/f-pod/f-pod-specification/
3. Chelonia, "Software & user guides" (FPOD app dated 6 Mar 2026): https://www.chelonia.co.uk/f-pod/existing-user-resources/
4. European Commission LIFE programme, "Static Acoustic Monitoring of the Baltic Sea Harbour porpoise (SAMBAH)", LIFE08 NAT/S/000261: https://webgate.ec.europa.eu/life/publicWebsite/project/LIFE08-NAT-S-000261/static-acoustic-monitoring-of-the-baltic-sea-harbour-porpoise
5. SAMBAH, non-technical report (v1.8.1): https://www.sambah.org/Non-technical-report-v.-1.8.1.pdf
6. "What the F-POD? Comparing the F-POD and C-POD for monitoring of harbor porpoise (Phocoena phocoena)", *Ecology and Evolution* (2023), via PubMed Central: https://pmc.ncbi.nlm.nih.gov/articles/PMC10256617/
7. "Validation of the F-POD: a fully automated cetacean monitoring system", *PLOS ONE* (2023), via PubMed Central: https://pmc.ncbi.nlm.nih.gov/articles/PMC10656029/
8. Falmouth Marine Conservation, "Dolphin acoustics" (Cetacean Acoustic Trend Tracking project): https://www.falmouthmarineconservation.co.uk/dolphinacoustics
9. "Interacting effects of vessel noise and shallow river depth elevate metabolic stress in Ganges river dolphins", *Scientific Reports* (2019), via PubMed Central: https://pmc.ncbi.nlm.nih.gov/articles/PMC6817857/
10. "Comparing visual and acoustic detectability of two coastal cetacean species off Sindhudurg, India, to better inform integrated survey protocol", *Scientific Reports* (2025): https://www.nature.com/articles/s41598-025-98691-9

**Images:**
- "Marsvin (Phocoena phocoena)" by Malene Thyssen, CC BY-SA 3.0 (http://creativecommons.org/licenses/by-sa/3.0/), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Marsvin_(Phocoena_phocoena).jpg
