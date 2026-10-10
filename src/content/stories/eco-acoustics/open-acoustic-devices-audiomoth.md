---
title: 'Open Acoustic Devices AudioMoth: the open-source recorder that made listening to nature affordable'
dek:
- For years, ecologists who wanted to record bats, birds or frogs in the field needed recorders costing around a thousand dollars each, which limited most studies to a handful of sites.
- AudioMoth, a credit-card-sized circuit board designed by a small team at the University of Southampton, sells for a fraction of that price and has become one of the most widely used wildlife recorders in the world.
sub: eco-acoustics
company: Open Acoustic Devices (UK; AudioMoth team formed in 2014 at the University of Southampton by Patrick Doncaster, Jake Snaddon and Alex Rogers, with engineers Andrew Hill and Peter Prince; devices sold through group purchases on GroupGets)
product: AudioMoth, a low-cost, open-source, full-spectrum acoustic logger (8 to 384 kHz, uncompressed WAV to microSD), with variants HydroMoth (underwater), AudioMoth Dev, MicroMoth, USB Microphone, IPX7 case and GPS synchronisation firmware
country: United Kingdom
launchDate: 2014 (team formed); Oct 2017 (first group purchase campaign); 15 Jan 2018 (Methods in Ecology and Evolution evaluation paper); 27 Jun 2019 (Conservation Letters paper on the open-source model); 31 Dec 2020 (13,894 units funded); 1 Jun 2023 (independent performance evaluation in Sensors)
sdgs:
- 9
- 14
- 15
- 17
tags:
- greentech
- eco-acoustics
- bioacoustics
- open-source-hardware
- biodiversity-monitoring
- bats
- audiomoth
- uk
- india
sources:
- https://www.openacousticdevices.info/audiomoth
- https://www.openacousticdevices.info/application-notes
- https://results2021.ref.ac.uk/impact/602221dc-0923-4165-a03f-c41b71337495
- https://doi.org/10.1111/2041-210X.12955
- https://doi.org/10.1111/conl.12661
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10256106/
- https://doi.org/10.1016/j.biocon.2023.110071
- https://environment.ec.europa.eu/news/nature-restoration-law-enters-force-2024-08-15_en
glance:
- label: Company
  text: Open Acoustic Devices, UK, the team behind AudioMoth, which grew out of the University of Southampton
- label: Product
  text: AudioMoth, an open-source acoustic logger recording from 8 to 384 kHz, plus HydroMoth, MicroMoth and AudioMoth Dev variants
- label: Key fact
  text: first sold at USD 49.99 in group purchases, against about USD 1,000 for commercial recorders in 2017
- label: Scale
  text: 13,894 units funded by the end of 2020 and over 30,000 units produced and sold in the first four years
- label: Caveat
  text: an independent test found the microphone hears less from behind, especially when strapped to a tree, and alkaline batteries last about 189 hours at 32 kHz
image:
  src: https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/Autonomous_recording_unit%2C_used_to_capture_wolf_howls_throughout_the_park_%2854268946043%29.jpg/1280px-Autonomous_recording_unit%2C_used_to_capture_wolf_howls_throughout_the_park_%2854268946043%29.jpg
  alt: An autonomous acoustic recording unit fixed to a tree in snow in Yellowstone National Park.
  width: 1280
  height: 854
  caption: 'Illustrative: an autonomous recording unit used to capture wolf howls in Yellowstone National Park. This is not an AudioMoth. Photo: NPS / Jacob W. Frank (YellowstoneNPS), public domain, via <a href="https://commons.wikimedia.org/wiki/File:Autonomous_recording_unit,_used_to_capture_wolf_howls_throughout_the_park_(54268946043" target="_blank" rel="noopener">Wikimedia Commons</a>.jpg).'
links:
- label: Open Acoustic Devices
  href: https://www.openacousticdevices.info/
- label: Open Acoustic Devices application notes and updates
  href: https://www.openacousticdevices.info/application-notes
---

## The problem

Nature restoration needs evidence that wildlife is actually coming back. Traditional surveys rely on experts walking transects at dawn or dusk, which is slow, costly and hard to repeat. Passive acoustic monitoring, leaving a recorder out in the field to capture calls and song, can cover far more ground, but for a long time the commercial units cost about USD 1,000 each. That put large deployments out of reach for most conservation groups and almost all citizen scientists ([REF impact case study](https://results2021.ref.ac.uk/impact/602221dc-0923-4165-a03f-c41b71337495)).

Bats, many insects and some frogs are a particular challenge. Their calls are ultrasonic, so a recorder needs a high sample rate and plenty of storage and battery life to catch them over weeks.

## The product

**AudioMoth** is a small, low-cost, full-spectrum acoustic logger built around a Silicon Labs Gecko processor. It records uncompressed WAV audio to a microSD card at 8,000 to 384,000 samples per second, so it can capture everything from birdsong to bat echolocation. It has an analogue pre-amplifier with adjustable gain and a real-time clock set to UTC, and from version 1.2.0 it has a 3.5 mm jack for external microphones. It can also be turned into a full-spectrum USB microphone ([Open Acoustic Devices](https://www.openacousticdevices.info/audiomoth)).

The family now includes:

- **HydroMoth:** a variant for an underwater case, with a magnetic switch so recordings can be started and stopped without opening the case.
- **AudioMoth Dev:** a development board with all inputs and outputs broken out for people building their own products.
- **MicroMoth:** a micro-size version for tight spaces and animal tags.
- **Accessories and firmware:** an IPX7 case, a GPS board and GPS synchronisation firmware for locating calling animals.

The board measures 58 × 48 × 4 mm and weighs about 10 g. The Southampton team says that made it 20 times smaller and cheaper than commercial equivalents when it launched ([REF impact case study](https://results2021.ref.ac.uk/impact/602221dc-0923-4165-a03f-c41b71337495)).

## How it works

1. **Configure:** the user sets sample rate, gain and a recording schedule with a free desktop app, then seals the board in a bag or case.
2. **Deploy:** the unit is strapped to a tree or post and left to record on its schedule, waking only when needed to save power.
3. **Detect on board:** optional firmware can run detection algorithms on the device itself, recording only when it hears a target sound such as a bat call or a gunshot. This cuts storage and review time ([Hill et al., 2018](https://doi.org/10.1111/2041-210X.12955)).
4. **Synchronise:** GPS firmware can align recordings across several units to better than one microsecond, enough to work out where a sound came from ([Open Acoustic Devices](https://www.openacousticdevices.info/application-notes)).
5. **Analyse:** the cards are collected and the audio is run through classifiers or listened to by experts.

The business model matters as much as the circuit. AudioMoth is open source and sold through group purchase campaigns: production starts only once enough backers have signed up, which keeps the price low ([Hill et al., 2019](https://doi.org/10.1111/conl.12661)).

## Timeline

| Date | Milestone |
|---|---|
| 2014 | Team forms at the University of Southampton |
| Oct 2017 | First group purchase campaign |
| 15 Jan 2018 | Evaluation paper published in *Methods in Ecology and Evolution* |
| 27 Jun 2019 | *Conservation Letters* paper on the open-source purchasing model |
| 2019 | British Bat Survey pilot identifies over 2 million bat calls |
| Jul 2020 | 11th campaign; 13,894 units funded by 31 Dec 2020 |
| 1 Jun 2023 | Independent performance tests published in *Sensors* |

## Impact and numbers

- **Sales:** within 18 months of its first announcement, 5,242 units had been sold in six group purchases at USD 49.99. Revenue of USD 262,048 covered development, manufacturing and distribution costs and left a pool of about USD 58,000, managed by the non-profit Arribada Initiative for further development. By 31 December 2020 the total had reached 13,894 units for 1,611 backers ([REF impact case study](https://results2021.ref.ac.uk/impact/602221dc-0923-4165-a03f-c41b71337495)). Independent researchers later put the figure at over 30,000 units in the first four years ([Sensors, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10256106/)).
- **Reach:** buyers were mostly in Europe (63%) and North America (23%), but the devices often travel. Africa was the purchase location for only two sales but the deployment location for 23% of purchases.
- **Bats:** the British Trust for Ornithology says AudioMoth is crucial to the British Bat Survey run with the Bat Conservation Trust, in which volunteers deploy units with an on-board bat detector. The 2019 pilot identified over 2 million bat calls.
- **New species:** Brazilian researchers used AudioMoths to describe three katydid species new to science in Iguaçu National Park.
- **Large surveys:** a deployment across 360 tropical forest sites in Costa Rica is helping plan conservation for the endangered spider monkey, with a device failure rate below 5% ([REF impact case study](https://results2021.ref.ac.uk/impact/602221dc-0923-4165-a03f-c41b71337495)).

**Honest caveats.** Most of the impact figures come from the Southampton team's own REF impact case study, which is written to show research impact. The independent evaluation from 2023 found little variation between devices and a mostly flat response, but it also found weaker pickup from behind the recorder, an effect that gets worse when the unit is mounted on a tree. Standard alkaline batteries lasted an average of 189 hours at room temperature at a 32 kHz sample rate, so long ultrasonic deployments need bigger battery packs or lithium cells ([Sensors, 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10256106/)). Group purchases also mean buyers can wait months for a campaign to fill and ship. Cheap hardware does not solve analysis: thousands of hours of audio still need good classifiers and expert checks.

## What's next

The team keeps extending the platform through firmware updates and application notes, recently adding lower-energy support for larger SD cards, external electret microphones, hydrophones and contact microphones, and an injection-moulded case for AudioMoth Dev ([Open Acoustic Devices](https://www.openacousticdevices.info/application-notes)). Because the design is open, others build on it too. The Zoological Society of London and the Arribada Initiative adapted it into a 5 g version for fitting to birds in flight.

## Why it matters for Europe / green buyers

The EU Nature Restoration Law entered into force in August 2024. It requires member states to put restoration measures in place on at least 20% of EU land and sea areas by 2030, to take measures to increase farmland bird populations and to help reverse the decline of pollinators ([European Commission](https://environment.ec.europa.eu/news/nature-restoration-law-enters-force-2024-08-15_en)). Showing those trends needs repeatable monitoring on thousands of sites. Low-cost, open recorders like AudioMoth let councils, farmers and NGOs collect that evidence themselves rather than relying on scarce survey contracts.

In India, AudioMoth-type recorders are already being used to judge restoration. A 2023 study in *Biological Conservation* placed acoustic recorders in actively restored, naturally regenerating and mature rainforest in the Western Ghats. Rainforest birds made up 97% of detections in mature forest, 81% in actively restored sites and 71% in naturally regenerating sites, and restored sites were short of insect sounds above 12 kHz ([Ramesh et al., 2023](https://doi.org/10.1016/j.biocon.2023.110071)). The authors conclude that passive acoustic monitoring now makes multi-taxon checks of tropical restoration possible.

## Sources & image credits

1. Open Acoustic Devices, AudioMoth product page: https://www.openacousticdevices.info/audiomoth
2. Open Acoustic Devices, application notes: https://www.openacousticdevices.info/application-notes
3. REF 2021, University of Southampton impact case study, "AudioMoth: the first open-source, low-cost, small, power-efficient and smart acoustic sensor for environmental monitoring" (2021): https://results2021.ref.ac.uk/impact/602221dc-0923-4165-a03f-c41b71337495
4. Hill et al., "AudioMoth: Evaluation of a smart open acoustic device for monitoring biodiversity and the environment", *Methods in Ecology and Evolution* (15 Jan 2018): https://doi.org/10.1111/2041-210X.12955
5. Hill et al., "Leveraging conservation action with open-source hardware", *Conservation Letters* (27 Jun 2019): https://doi.org/10.1111/conl.12661
6. "A Quantitative Evaluation of the Performance of the Low-Cost AudioMoth Acoustic Recording Unit", *Sensors* (1 Jun 2023), via PubMed Central: https://pmc.ncbi.nlm.nih.gov/articles/PMC10256106/
7. Ramesh et al., "Using passive acoustic monitoring to examine the impacts of ecological restoration on faunal biodiversity in the Western Ghats", *Biological Conservation* (Jun 2023): https://doi.org/10.1016/j.biocon.2023.110071
8. European Commission, "Nature Restoration Law enters into force" (15 Aug 2024): https://environment.ec.europa.eu/news/nature-restoration-law-enters-force-2024-08-15_en

**Images:**
- "Autonomous recording unit, used to capture wolf howls throughout the park" by NPS / Jacob W. Frank (YellowstoneNPS), public domain, via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Autonomous_recording_unit,_used_to_capture_wolf_howls_throughout_the_park_(54268946043).jpg
