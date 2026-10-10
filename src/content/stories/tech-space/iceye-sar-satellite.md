---
title: 'ICEYE SAR satellite: the Finnish radar microsatellite that sees floods through cloud and darkness'
dek:
- When a river bursts its banks, the sky above is usually full of cloud, and the worst flooding often peaks at night.
- ICEYE shrank imaging radar from a bus-sized spacecraft to a suitcase-sized one, then launched enough of them to watch a flood unfold every few hours.
sub: tech-space
company: ICEYE Oy (Helsinki, Finland)
product: ICEYE X-band synthetic aperture radar (SAR) microsatellite and constellation, with Flood Rapid Impact and Flood Insights services
country: Finland
launchDate: 12 January 2018 (ICEYE-X1, world's first SAR satellite under 100 kg); commercial imaging from February 2019
sdgs:
- 9
- 11
- 13
tags:
- greentech
- space
- earth-observation
- sar
- flood-monitoring
- disaster-response
- copernicus
sources:
- https://www.iceye.com/newsroom/press-releases/iceye-successfully-launches-worlds-first-sar-microsatellite-and-establishes-finlands-first-commercial-satellite
- https://www.iceye.com/newsroom/press-releases/first-iceye-x1-radar-image-from-space-published
- https://directory.eoportal.org/satellite-missions/iceye-x1
- https://arxiv.org/pdf/2102.04545
- https://www.iceye.com/newsroom/press-releases/iceye-announces-agreement-with-esa-to-support-cems-with-flood-insights
- https://www.iceye.com/newsroom/press-releases/norwegian-water-and-energy-authority-selects-iceye-to-deliver-nationwide-satellite-monitoring
- https://www.iceye.com/newsroom/press-releases/iceye-launches-four-new-satellites-aboard-transporter-17
- https://space.skyrocket.de/doc_sdat/iceye-x1.htm
glance:
- label: Company
  text: ICEYE, founded and headquartered in Finland, now with more than 1,000 employees in Poland, Spain, the UK, Australia, Japan, the UAE, Greece and the US
- label: Product
  text: X-band synthetic aperture radar (SAR) microsatellites, sold as data, as flood analytics, or as complete national constellations
- label: First launch
  text: 'ICEYE-X1, 12 January 2018, on India''s PSLV-C40 from Sriharikota: the world''s first SAR satellite under 100 kg and Finland''s first commercial satellite'
- label: Scale
  text: 76 satellites launched by July 2026; production targeted to rise from 50 to 100 satellites a year by 2027
- label: Resolution
  text: 10 m on the first demonstrator; up to 16 cm on the fourth-generation (Gen4) satellites
- label: Europe
  text: Copernicus Contributing Mission since October 2021; flood services for ESA's Copernicus Emergency Management Service and for Norway's water and energy authority
image:
  src: https://upload.wikimedia.org/wikipedia/commons/a/a5/ICEYE_SAR_satellite_Netherlands_2.jpg
  alt: An ICEYE synthetic aperture radar satellite, photographed by the Dutch Ministry of Defence.
  width: 1280
  height: 703
  caption: 'An ICEYE SAR satellite, photographed by the Netherlands Ministry of Defence. Its radar antenna sends its own microwave pulses to the ground, so it can image at night and through cloud. Photo: Defensie Nederland, <a href="https://creativecommons.org/licenses/by-sa/4.0" target="_blank" rel="noopener">CC BY-SA 4.0</a>, via <a href="https://commons.wikimedia.org/wiki/File:ICEYE_SAR_satellite_Netherlands_2.jpg" target="_blank" rel="noopener">Wikimedia Commons</a>.'
links:
- label: ICEYE
  href: https://www.iceye.com/
- label: Copernicus Emergency Management Service
  href: https://emergency.copernicus.eu/
- label: LinkedIn
  href: https://www.linkedin.com/company/iceye/
---

## The problem

Floods are among Europe's most costly natural hazards and among the hardest to watch from space. Optical satellites such as Sentinel-2 take beautiful pictures, but they need daylight and clear skies, and storms bring neither. Norway's water and energy directorate NVE puts the problem plainly: persistent cloud, complex terrain and seasonal darkness limit traditional optical monitoring for much of the year ([ICEYE, 18 June 2026](https://www.iceye.com/newsroom/press-releases/norwegian-water-and-energy-authority-selects-iceye-to-deliver-nationwide-satellite-monitoring)).

Radar solves the weather problem, but for decades it came at a price. Conventional SAR satellites weighed a tonne or more and cost hundreds of millions of euros, so governments flew only a handful. With few satellites, a given spot might be imaged once every few days, far too slowly for a flood that rises and falls within 48 hours.

## The product

ICEYE's answer was to build SAR small enough to mass-produce. Its proof-of-concept satellite, ICEYE-X1, launched on 12 January 2018 as a secondary payload on ISRO's PSLV-C40 rocket from the Satish Dhawan Space Centre in India. The company announced it as the world's first microsatellite carrying SAR and Finland's first commercial satellite, and noted that the mission had received EU Horizon 2020 funding through the SME Instrument ([ICEYE, 12 January 2018](https://www.iceye.com/newsroom/press-releases/iceye-successfully-launches-worlds-first-sar-microsatellite-and-establishes-finlands-first-commercial-satellite)).

ICEYE-X1 weighed about 70 kg, with a 70 x 60 cm body and a deployable antenna 3.25 m long ([Gunter's Space Page](https://space.skyrocket.de/doc_sdat/iceye-x1.htm)). Its radar worked at 9.65 GHz in the X-band, with a resolution of 10 x 10 m, and it flew in a sun-synchronous orbit at about 500 km ([eoPortal](https://directory.eoportal.org/satellite-missions/iceye-x1)). Three days after launch it imaged Noatak National Preserve in Alaska: a 1.2 GB raw scene covering roughly 80 x 40 km, captured in ten seconds ([ICEYE, 17 January 2018](https://www.iceye.com/newsroom/press-releases/first-iceye-x1-radar-image-from-space-published)).

## How it works

A SAR satellite carries its own illumination. It fires microwave pulses at the ground and records the echoes. Because the satellite moves, the radar can combine echoes from many positions along its path, which makes a small physical antenna behave like a much longer "synthetic" one and sharpens the image. X-band microwaves, about 3 cm long, pass through cloud and need no sunlight.

Floods stand out clearly. Calm open water acts like a mirror, reflecting the radar pulse away from the satellite, so flooded land appears dark against the brighter, rougher ground around it. ICEYE combines these images with terrain models, hydrological data and ground information to estimate both the extent and the depth of flooding, down to individual buildings ([ICEYE, 23 May 2022](https://www.iceye.com/newsroom/press-releases/iceye-announces-agreement-with-esa-to-support-cems-with-flood-insights)).

The first demonstrator used 60 MHz of pulse bandwidth. Later instruments moved to 300 MHz, and more bandwidth means finer detail, which is how resolution improved from metres towards sub-metre imagery. ICEYE-X2 followed in December 2018, and commercial deliveries began in February 2019 ([Ignatenko et al., arXiv 2021](https://arxiv.org/pdf/2102.04545)).

## Timeline

| Date | Milestone |
|---|---|
| 12 Jan 2018 | ICEYE-X1 launched on PSLV-C40 from India |
| 15 Jan 2018 | First radar image, Noatak National Preserve, Alaska |
| Dec 2018 | ICEYE-X2 launched with a 300 MHz instrument |
| Feb 2019 | Commercial image deliveries begin |
| Oct 2021 | ICEYE becomes a Copernicus Contributing Mission |
| May 2022 | Flood insights pilot with ESA for Copernicus Emergency Management Service |
| Feb 2026 | Nationwide flood monitoring for Norway's NVE begins |
| 7 Jul 2026 | Four satellites on Transporter-17 bring the total launched to 76 |

## Impact and numbers

- **Constellation size:** 76 satellites launched by 7 July 2026, including fourth-generation satellites with up to 16 cm resolution and a 400 km high-resolution field of regard ([ICEYE, 7 July 2026](https://www.iceye.com/newsroom/press-releases/iceye-launches-four-new-satellites-aboard-transporter-17)).
- **Revisit:** a global average of 12 revisits per day, higher over Norway, according to the NVE announcement.
- **Flood services:** Flood Rapid Impact gives automated flood-extent updates as often as every six hours during an event. Flood Insights adds water depth and impact assessments every 24 hours.
- **Norway contract:** awarded by competitive tender, started in February 2026 for one year with an option for two more, covering mainland Norway and Svalbard. NVE will use the data to calibrate hydraulic models, improve flood hazard maps and test forecasts.
- **Europe:** Copernicus users have had access to ICEYE imagery since October 2021, and the 2022 ESA pilot was the company's third and largest with the agency, after earlier pilots on volcanic eruptions and sea ice.

**Honest caveats.** ICEYE is increasingly a defence company. Its 2026 releases describe it as "the world leader in sovereign intelligence from space", and seven European governments have bought national ICEYE systems, including the Polish Armed Forces. The same satellites serve flood response and military surveillance, which buyers with strict ethical screens will want to weigh. Radar flood maps also have blind spots: water under dense forest canopy or between tall buildings can be hard to detect, so analytics still rely on models and ground data. Most performance figures come from the company.

## What's next

ICEYE plans to double production to 100 satellites a year by 2027, with a launch cadence to match. It now also sells complete national constellations; Poland's system was delivered within 12 months. For climate adaptation, the more interesting trend is public agencies such as NVE buying flood intelligence as a routine service rather than calling on satellites only after disaster strikes.

## Why it matters for Europe / green buyers

The Copernicus Sentinel-1 radar satellites remain the free backbone of European flood mapping, but a few large satellites cannot revisit a valley several times a day. A European-built commercial constellation fills that gap and keeps critical data under European control. For insurers, utilities, river authorities and civil protection agencies, ICEYE is a tangible example of the EU's adaptation goals turning into a service: flood maps every six hours, through cloud, day and night. Buyers should ask for validation against ground observations and be clear about how their data use relates to the company's defence work.

There is also an India link worth noting. ICEYE's first satellite reached orbit on an Indian PSLV rocket, and India's own commercial Earth observation sector, led by companies such as Pixxel, now competes for the same climate, insurance and government customers. European buyers increasingly have a choice of radar, thermal and hyperspectral suppliers, and the strongest flood programmes will combine several.

## Sources & image credits

1. ICEYE, "ICEYE Successfully Launches World's First SAR Microsatellite and Establishes Finland's First Commercial Satellite", 12 January 2018: https://www.iceye.com/newsroom/press-releases/iceye-successfully-launches-worlds-first-sar-microsatellite-and-establishes-finlands-first-commercial-satellite
2. ICEYE, "First ICEYE-X1 Radar Image from Space Published", 17 January 2018: https://www.iceye.com/newsroom/press-releases/first-iceye-x1-radar-image-from-space-published
3. eoPortal, "ICEYE-X1 (SAR Microsatellite-X1)": https://directory.eoportal.org/satellite-missions/iceye-x1
4. Gunter's Space Page, "ICEYE X1": https://space.skyrocket.de/doc_sdat/iceye-x1.htm
5. Ignatenko et al., "ICEYE Microsatellite SAR Constellation Status Update: Evaluation of First Commercial Imaging Modes", arXiv, 2021: https://arxiv.org/pdf/2102.04545
6. ICEYE, "ICEYE Announces Agreement with European Space Agency to Support Copernicus Emergency Services with Flood Insights", 23 May 2022: https://www.iceye.com/newsroom/press-releases/iceye-announces-agreement-with-esa-to-support-cems-with-flood-insights
7. ICEYE, "Norwegian Water and Energy Authority selects ICEYE to deliver nationwide satellite monitoring capability", 18 June 2026: https://www.iceye.com/newsroom/press-releases/norwegian-water-and-energy-authority-selects-iceye-to-deliver-nationwide-satellite-monitoring
8. ICEYE, "ICEYE launches four new satellites aboard Transporter-17", 7 July 2026: https://www.iceye.com/newsroom/press-releases/iceye-launches-four-new-satellites-aboard-transporter-17

**Images:**
- "ICEYE SAR satellite Netherlands 2" by Defensie Nederland, licensed CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:ICEYE_SAR_satellite_Netherlands_2.jpg
