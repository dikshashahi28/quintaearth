---
title: 'Kinéis: the French nanosatellite constellation that tracks wildlife, fishing boats and forest fires from orbit'
dek:
- Only a small share of the planet has mobile coverage. Kinéis, based in Toulouse, put 25 nanosatellites into orbit in less than a year to collect tiny data messages from sensors anywhere on Earth. Its users include wildlife researchers, small-scale fisheries and firefighters watching remote forests.
dateline: Planetary Engineering / Space Frontiers. Toulouse, France. First launch 20 June 2024; services live since summer 2025.
sub: planetary-space-frontiers
company: Kinéis
product: Kinéis constellation of 25 IoT and AIS nanosatellites, carrying next-generation Argos receivers
country: France
launchDate: 20 Jun 2024
sdgs:
- 9
- 13
- 14
- 15
tags:
- satellite IoT
- nanosatellites
- Argos
- wildlife tracking
- small-scale fisheries
- wildfire detection
- AIS
- France
sources:
- https://kineis.com/en/technology/
- https://kineis.com/en/kineis-reaches-break-even-as-early-as-2026-one-year-after-launching-its-services/
- https://kineis.com/en/wildfires-2026-race-against-the-flames-kineis-dryad/
- https://wildlifecomputers.com/blog/kineis-updates-what-you-need-to-know/
- https://wildlifecomputers.com/data/technologies/argos/
- https://rocketlabcorp.com/updates/rocket-lab-launches-next-batch-of-satellites-for-kineis-constellation/
- https://rocketlabcorp.com/updates/successful-rocket-lab-launch-completes-deployment-of-full-kineis-constellation-in-less-than-a-year/
- https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026
- https://commons.wikimedia.org/wiki/File:Kineis_satellite_model.jpg
glance:
- label: Company
  text: Kinéis, a Toulouse satellite IoT operator created in 2018
- label: Product
  text: a constellation of 25 nanosatellites in low Earth orbit carrying IoT receivers, some with ship tracking (AIS) payloads
- label: Key fact
  text: Wildlife Computers reports 3 to 4 times more data throughput for animal tags than the older Argos satellites
- label: Scale
  text: nearly 50,000 connected objects targeted by end of 2026, with expected revenue of €18 million
- label: Caveat
  text: 25 more satellites in a crowded orbit, plus a growing defence and security business
image:
  src: https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6d/Kineis_satellite_model.jpg/1280px-Kineis_satellite_model.jpg
  alt: A scale model of a Kinéis nanosatellite carrying an Argos instrument
  width: 1280
  height: 1220
  caption: 'A model of a Kinéis nanosatellite carrying a next-generation Argos instrument, photographed in 2025. Image: Artvill, CC BY-SA 4.0, via Wikimedia Commons.'
links:
- label: Kinéis technology
  href: https://kineis.com/en/technology/
- label: Wildlife Computers on Kinéis
  href: https://wildlifecomputers.com/blog/kineis-updates-what-you-need-to-know/
---

## The problem

Kinéis says only 15% of the planet is covered by terrestrial networks. Yet scientists need data from sea turtles in mid-ocean, fishery authorities need to know where small boats are, and fire services need warnings from forests far from any mast.

For decades, the Argos system has relayed signals from animal tags and ocean buoys using a handful of satellites. Wildlife Computers calls Argos one of the most widely used ways to track marine animals, because it covers the whole globe and calculates locations in near real time. But coverage was patchy, especially near the equator, so tags had to wait for a satellite to pass. Meanwhile, Earth's orbits are filling fast. ESA's 2026 Space Environment Report counted more than 300 launches and over 4,000 new payloads in 2025 alone.

## The product

Kinéis operates 25 nanosatellites, each measuring about 1.40 by 1.60 metres, at around 650 km altitude. They are spread over five orbital planes with five satellites in each. Every satellite carries an IoT payload that can locate, monitor and alert objects, and some also carry a receiver for AIS, the signals ships broadcast to identify themselves.

The satellites were built by Hemeria in Toulouse and launched on five dedicated Rocket Lab Electron flights from New Zealand. The first flew on 20 June 2024 and the last, named "High Five", on 18 March 2025. Rocket Lab said it deployed the full constellation in less than a year, using dedicated launches that let Kinéis choose the date and orbit for each batch. Kinéis' technical chief, Michel Sarthou, called producing and launching 25 nanosatellites in about eight months "an unprecedented feat".

Importantly for space sustainability, Kinéis says each satellite has solar-powered electric propulsion that keeps it in orbit and helps it avoid collisions.

## How it works

1. **Sense.** A low-power device on a tree, animal, buoy or boat records data.
2. **Uplink.** It sends a short message to the nearest passing nanosatellite.
3. **Relay.** The satellite passes the data to one of 20 ground stations.
4. **Locate.** The system also calculates the device's position from the signal.
5. **Deliver.** A service centre running all year sends data to users, often within minutes.
6. **Command.** Two-way messages let users change device settings remotely.

## Timeline

| Date | Milestone |
|---|---|
| 2018 | Kinéis created in Toulouse |
| 20 Jun 2024 | First five satellites launched on Electron, "No Time Toulouse" |
| 9 Feb 2025 | Fourth launch puts five satellites into a 647 km orbit |
| 18 Mar 2025 | "High Five" launch completes the 25-satellite constellation |
| Summer 2025 | Commercial services launched |
| Feb 2026 | Wildlife Computers counts 21 Argos-Kinéis satellites alongside four legacy Argos satellites |
| 7 Sep 2026 | Kinéis targets break-even in 2026 on €18 million revenue |

## Impact and numbers

The clearest environmental benefit is for wildlife science. Wildlife Computers, a US maker of animal tags, says the Kinéis satellites deliver 3 to 4 times the data throughput of the older Argos system. Passes are near-continuous at high latitudes and typically no more than 15 minutes apart, even at the equator. Researchers get more detailed records and fewer gaps from the same battery.

Kinéis says the number of objects connected to its network will grow from about 20,000 to nearly 50,000 by the end of 2026. CLS, a long-standing customer, is rolling out its Nemo beacons to track small-scale fishing boats, a sector of nearly 55 million fishers worldwide. Ship tracking is the other growth area. Kinéis cites a market estimate that puts the global vessel-tracking systems market at $2.27 billion in 2025, rising to $4.5 billion by 2035. Better tracking of fishing fleets could help authorities spot illegal fishing, though Kinéis frames AIS mainly as a transparency and security service.

Forest fires are a newer use. Kinéis says ground cameras and patrols typically spot fires 1 to 3 hours late, and imaging satellites 3 to 6 hours late, because they depend on visible smoke or flames. Kinéis connects Dryad Networks' Silvanet gas sensors, which are attached to trees and designed to detect smouldering fires before flames appear. Tested in southern France with the civil security body Entente Valabre since 2025, the system had nearly 700 active sensors on trial, and 10,000 beacons had been delivered for deployment from September 2026. Kinéis says sensors can run for up to five years without recharging, and firefighters in monitored zones receive alerts and environmental updates several times a day.

## Honest caveats

**More objects in orbit.** Twenty-five more satellites add to a crowded environment that ESA says got an order of magnitude worse in sustainability terms in 2025. Electric propulsion helps, but Kinéis has not published a detailed end-of-life disposal plan in the sources reviewed.

**Defence and security.** Kinéis lists defence among its target sectors and says demand for its AIS ship tracking is driven partly by geopolitical tensions. The same data can serve surveillance as well as conservation.

**Teething problems.** As of April 2026, Wildlife Computers customers still had to manually download Kinéis data from the CLS portal and upload it, pending a fix to security differences between systems.

**Inconsistent numbers.** Wildlife Computers' own pages describe 20 Kinéis satellites with Argos receivers in one place and 21 in another. Kinéis lists 25 satellites in total.

**Commercial claims.** Break-even and the 50,000 object figure are company targets, not audited results.

## What's next

Kinéis is signing partners in Asia-Pacific, North America and the Nordics, and expects new contracts by the end of 2026. It is trialling uses such as groundwater monitoring, drilling wells and fire-retardant tank levels, under a French national investment plan.

## Why it matters for Europe and green buyers

For Europe, Kinéis gives the continent its own satellite IoT network, built and run from Toulouse, for climate, nature and civil protection data. Its wildfire work with Dryad and Entente Valabre addresses a growing threat in southern Europe. Buyers of environmental monitoring can ask for sovereign European connectivity and clear end-of-life plans.

For India, low-power satellite connectivity could support fishers along long coastlines and sensors in remote forests. Kinéis has not announced Indian deployments in the sources reviewed. For the world, a better Argos service means more data on migrating whales, turtles and birds, which is evidence that conservation policy depends on.

## Sources & image credits

1. Kinéis, "Kinéis Technology". https://kineis.com/en/technology/
2. Kinéis, "Kinéis reaches break-even as early as 2026, one year after launching its services", 7 Sep 2026. https://kineis.com/en/kineis-reaches-break-even-as-early-as-2026-one-year-after-launching-its-services/
3. Kinéis, "2026 Wildfires: How Kinéis' nanosatellites and Dryad sensors are winning the race against the flames", 2026. https://kineis.com/en/wildfires-2026-race-against-the-flames-kineis-dryad/
4. Wildlife Computers, "Kinéis Satellite Telemetry: What's Live Now, What to Do Next", 2026. https://wildlifecomputers.com/blog/kineis-updates-what-you-need-to-know/
5. Wildlife Computers, "Argos Satellite System". https://wildlifecomputers.com/data/technologies/argos/
6. Rocket Lab, "Rocket Lab Launches Next Batch of Satellites for Kinéis Constellation", 9 Feb 2025. https://rocketlabcorp.com/updates/rocket-lab-launches-next-batch-of-satellites-for-kineis-constellation/
7. Rocket Lab, "Successful Rocket Lab Launch Completes Deployment of Full Kinéis Constellation in Less Than a Year", 18 Mar 2025. https://rocketlabcorp.com/updates/successful-rocket-lab-launch-completes-deployment-of-full-kineis-constellation-in-less-than-a-year/
8. ESA, "ESA Space Environment Report 2026". https://www.esa.int/Space_Safety/Space_Debris/ESA_Space_Environment_Report_2026
9. Wikimedia Commons, "Kineis satellite model". https://commons.wikimedia.org/wiki/File:Kineis_satellite_model.jpg

**Images:** "Kineis satellite model", Artvill, 27 Feb 2025, CC BY-SA 4.0, via Wikimedia Commons. A model of the satellite rather than flight hardware.
