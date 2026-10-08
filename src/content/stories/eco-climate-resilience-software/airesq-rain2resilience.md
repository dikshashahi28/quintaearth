---
title: 'AIResQ Rain2Resilience: physics-guided AI and Made-in-India sensors that warn Gurugram which streets will flood'
dek:
- 'Every monsoon, roads in Indian cities vanish under water, trains stall and commutes stretch into hours. Usually the response starts only after the rain: pumping, rerouting and cleaning up.'
- AIResQ, a start-up incubated at IIT Gandhinagar, wants to flip that order. Its Rain2Resilience software combines physics-based flood models, AI and its own cheap sensors to show city officials where water will go and how deep it will get, before it arrives.
sub: eco-climate-resilience-software
company: AIResQ ClimSols Pvt Ltd (Gandhinagar, Gujarat, India; registered in November 2024 and incubated at IIT Gandhinagar; founded by Prof Udit Bhatia with co-founders Prof Auroop Ganguly, Dr Divya Upadhyay, Vivek P. Kapadia and Brijeshbhai Patel)
product: Rain2Resilience suite for urban flood forecasting and response, made up of AquaResQ (flood simulation), MobiResQ (traffic and mobility disruption) and FloodTwin (3D city digital twin), fed by the company's own low-cost flood-depth and sewer sensors and a citizen reporting portal
country: India
launchDate: Nov 2024 (company registered); Nov 2025 (MoU with the Municipal Corporation of Gurugram); 31 Jan 2026 (Gurugram Rain-to-Resilience pilot announced); Jun 2026 (40 sensors installed in Gurugram before the monsoon); 26 Jul 2026 (Andhra Pradesh City Flood Alert, co-developed with IIT Gandhinagar, launched in Vijayawada)
sdgs:
- 6
- 9
- 11
- 13
tags:
- greentech
- climate-resilience
- urban-flooding
- monsoon
- sensors
- digital-twin
- early-warning
- airesq
- iit-gandhinagar
- india
sources:
- https://coe.northeastern.edu/news/airesq-startup-uses-physics-guided-ai-for-flood-resilience/
- https://news.iitgn.ac.in/beyond-the-paper-how-airesq-climsols-is-protecting-urban-india-from-flooding/
- https://www.hindustantimes.com/cities/gurugram-news/gurugram-to-pilot-flood-management-system-with-iit-gandhinagar-101769797097055.html
- https://indianexpress.com/article/cities/delhi/gurgaon-gurugram-ai-sewer-sensors-monsoon-waterlogging-prevention-10726957/
- https://timesofindia.indiatimes.com/city/gurgaon/mcg-installs-real-time-sewer-sensors-to-prevent-overflows-flooding/articleshow/131618196.cms
- https://www.thehindu.com/news/national/andhra-pradesh/andhra-pradesh-launches-ai-platform-to-forecast-urban-floods-vijayawada-first/article71269032.ece
- https://www.niti.gov.in/sites/default/files/2021-03/Flood-Report.pdf
- https://www.eea.europa.eu/en/newsroom/news/europe-is-not-prepared-for
glance:
- label: Company
  text: AIResQ ClimSols, Gandhinagar, India, registered in November 2024 and incubated at IIT Gandhinagar
- label: Product
  text: 'Rain2Resilience suite: AquaResQ flood simulation, MobiResQ traffic impact and FloodTwin 3D digital twin, plus flood-depth and sewer sensors'
- label: Key fact
  text: Gurugram officials say the system flags faults in about five minutes, where other models take two to three days
- label: Scale
  text: 20 flood-depth and 20 sewer sensors installed in about 15 flood-prone areas of Gurugram in June 2026
- label: Caveat
  text: a young company in pilot projects, with no published accuracy data from a full monsoon yet
image:
  src: https://upload.wikimedia.org/wikipedia/commons/9/9c/Indian_Navy_extends_support_during_2017_Mumbai_flood_%282%29.jpg
  alt: Rescue and relief workers in a flooded Mumbai street during the August 2017 floods.
  width: 1280
  height: 962
  caption: 'Illustrative: Indian Navy relief work during the Mumbai floods of August 2017. This is not an AIResQ site or product. Photo: Indian Navy, <a href="https://data.gov.in/sites/default/files/Gazette_Notification_OGDL.pdf" target="_blank" rel="noopener">GODL-India</a>, via <a href="https://commons.wikimedia.org/wiki/File:Indian_Navy_extends_support_during_2017_Mumbai_flood_(2" target="_blank" rel="noopener">Wikimedia Commons</a>.jpg).'
links:
- label: IIT Gandhinagar on AIResQ
  href: https://news.iitgn.ac.in/beyond-the-paper-how-airesq-climsols-is-protecting-urban-india-from-flooding/
- label: IIT Gandhinagar on LinkedIn
  href: https://www.linkedin.com/school/iit-gandhinagar/
---

## The problem

Urban flooding is a global problem, and Europe is not immune: the European Environment Agency's 2024 climate risk assessment counts protecting people and infrastructure from floods among Europe's eight most urgent climate risks ([EEA](https://www.eea.europa.eu/en/newsroom/news/europe-is-not-prepared-for)).

In India the problem is sharper. NITI Aayog's 2021 flood report says urban flooding caused by congested stormwater drains has become common in Indian towns and cities, and that unplanned building and encroachment along rivers and watercourses has increased runoff. It calls for every city to have a flood mitigation plan tied to its land use and master plan ([NITI Aayog](https://www.niti.gov.in/sites/default/files/2021-03/Flood-Report.pdf)).

Off-the-shelf flood models do not help much. Models built for Western cities tend to fail in Indian ones, which grow unevenly, layer new building on old cores and have drains that were never designed to keep up. Reliable data is often thin or missing, and classic physics-based simulations can take days to run ([Northeastern University](https://coe.northeastern.edu/news/airesq-startup-uses-physics-guided-ai-for-flood-resilience/)).

## The product

**Rain2Resilience** is AIResQ's suite of urban flood tools ([IIT Gandhinagar](https://news.iitgn.ac.in/beyond-the-paper-how-airesq-climsols-is-protecting-urban-india-from-flooding/)):

- **AquaResQ** runs flood simulations: where water will flow, how deep it will get and how long it will stay.
- **MobiResQ** shows how flooding will disrupt traffic and movement across the city.
- **FloodTwin** renders it all as a 3D digital twin, so planners can run mock preparedness drills and compare, say, a bigger pump with a wider drain before spending public money.
- **Sensors:** AIResQ designs and builds its own low-cost flood-depth and drainage health sensors in India. In Gurugram they measure water levels, drainage capacity, silt and blockages ([Hindustan Times](https://www.hindustantimes.com/cities/gurugram-news/gurugram-to-pilot-flood-management-system-with-iit-gandhinagar-101769797097055.html)).
- **Citizen reports:** a portal on Gurugram's city website lets residents log flooding as it happens.

## How it works

1. **Data:** rainfall observations and forecasts are combined with terrain, drainage, sensor and mobility data. Where no drainage map exists, the team infers likely drainage paths from road networks.
2. **Physics-guided AI:** machine learning speeds up the forecast, while physical rules for water flow keep it within plausible bounds.
3. **Micro-zonation:** each city is split into zones with distinct characteristics, so coastal Surat and inland Gurugram are treated differently.
4. **Alerts:** if sensors detect water above set limits or a blockage, they alert the municipal control room automatically.
5. **Decisions:** the system compares response options by expected depth, flow direction, duration and impact on movement ([Northeastern University](https://coe.northeastern.edu/news/airesq-startup-uses-physics-guided-ai-for-flood-resilience/)).

## Timeline

| Date | Milestone |
|---|---|
| 2019 | Udit Bhatia joins IIT Gandhinagar and builds its flood research lab |
| Nov 2024 | AIResQ ClimSols registered as an IIT Gandhinagar start-up |
| Nov 2025 | Municipal Corporation of Gurugram signs an MoU with IIT Gandhinagar |
| 31 Jan 2026 | Gurugram announces the Rain-to-Resilience pilot |
| Jun 2026 | 40 sensors installed across Gurugram before the monsoon |
| 26 Jul 2026 | Andhra Pradesh launches City Flood Alert in Vijayawada, co-developed with IIT Gandhinagar |

## Impact and numbers

- **Gurugram pilot:** under a multipartite agreement with the Municipal Corporation of Gurugram, IIT Gandhinagar's Machine Intelligence and Resilience (MIR) Lab leads the science and AIResQ builds the dashboards and 3D tools. In the first year the software is provided without licence fees, while the city buys the sensor hardware, initially costing about Rs 20 lakh. Data stays on encrypted servers in India ([Hindustan Times](https://www.hindustantimes.com/cities/gurugram-news/gurugram-to-pilot-flood-management-system-with-iit-gandhinagar-101769797097055.html)).
- **Sensors in place:** by June 2026, 20 sewer sensors and 20 flood-depth sensors were installed in about 15 flood-prone areas. A senior official said the simulations flag faults in five minutes rather than the two to three days other models take, and the city hired 50 data entry operators to pass flagged problems to junior engineers ([Indian Express](https://indianexpress.com/article/cities/delhi/gurgaon-gurugram-ai-sewer-sensors-monsoon-waterlogging-prevention-10726957/), [Times of India](https://timesofindia.indiatimes.com/city/gurgaon/mcg-installs-real-time-sewer-sensors-to-prevent-overflows-flooding/articleshow/131618196.cms)).
- **Other users:** the platform is also deployed in Changodar, an industrial area of Ahmedabad, and is being rolled out across Ahmedabad and in Vijayawada. Indian Railways uses AIResQ data to flag vulnerable stretches of track during heavy rain.
- **Andhra Pradesh:** City Flood Alert, built by the state's Real Time Governance Society with the disaster management authority and IIT Gandhinagar, gives rainfall forecasts 48 hours ahead and flash flood warnings six hours ahead, and will be extended to all urban local bodies in the state ([The Hindu](https://www.thehindu.com/news/national/andhra-pradesh/andhra-pradesh-launches-ai-platform-to-forecast-urban-floods-vijayawada-first/article71269032.ece)).
- **National programme:** IIT Gandhinagar's MIR Lab was selected for the urban flooding part of a Rs 300 crore national initiative anchored at the Airawat Research Foundation at IIT Kanpur.

**Honest caveats.** AIResQ is less than two years old, and most of its work is still in pilots. Founder Udit Bhatia says the team reports accuracy honestly, whether 75% or 88%, but no independent, full-season validation has been published. The line between the university lab and the start-up is blurred: news reports credit IIT Gandhinagar for much of the work, and The Hindu does not name AIResQ in its report on City Flood Alert. Forecasts are only as good as the input data, and Indian cities often lack drainage maps. Sensors and software do not clear drains; the benefits depend on city staff acting on the alerts. Reports even spell the company and the commissioner's name differently.

## What's next

If the Gurugram pilot succeeds, a second phase would bring citywide deployment, round-the-clock operations and advanced modelling sold as software as a service ([Hindustan Times](https://www.hindustantimes.com/cities/gurugram-news/gurugram-to-pilot-flood-management-system-with-iit-gandhinagar-101769797097055.html)). The team is extending its approach to urban heat and working with the Government of Gujarat to model how water released from a dam would travel downstream, so villages know how much warning they have. Bhatia also mentions projects in Surat, Kozhikode and with Western Railway.

## Why it matters for Europe / green buyers

AIResQ was invited to represent Indian start-ups at Bharat Innovates in Nice, France, and is exploring a US venture ([Northeastern University](https://coe.northeastern.edu/news/airesq-startup-uses-physics-guided-ai-for-flood-resilience/)). Its approach, fast forecasts built on cheap local sensors and patchy data, could suit smaller European towns hit by cloudbursts that cannot afford full hydraulic studies, and it shows how European flood tech firms could partner with Indian cities.

For India, it is a homegrown answer to a homegrown problem. A system that tells a city which manhole will overflow, which underpass to close and which drain to clear first could protect commuters and homes in dozens of cities that flood every monsoon, at a cost a municipal budget can bear.

## Sources & image credits

1. Northeastern University College of Engineering, "AIResQ startup uses physics-guided AI for flood resilience" (11 Sep 2026): https://coe.northeastern.edu/news/airesq-startup-uses-physics-guided-ai-for-flood-resilience/
2. IIT Gandhinagar News, "Beyond the paper: how AIResQ ClimSols is protecting urban India from flooding" (4 Jun 2026): https://news.iitgn.ac.in/beyond-the-paper-how-airesq-climsols-is-protecting-urban-india-from-flooding/
3. Hindustan Times, "Gurugram to pilot flood management system with IIT Gandhinagar" (31 Jan 2026): https://www.hindustantimes.com/cities/gurugram-news/gurugram-to-pilot-flood-management-system-with-iit-gandhinagar-101769797097055.html
4. The Indian Express, "Gurgaon deploys IIT-backed AI sewer sensors across city to stop monsoon waterlogging" (6 Jun 2026): https://indianexpress.com/article/cities/delhi/gurgaon-gurugram-ai-sewer-sensors-monsoon-waterlogging-prevention-10726957/
5. The Times of India, "MCG installs real-time sewer sensors to prevent overflows, flooding" (9 Jun 2026): https://timesofindia.indiatimes.com/city/gurgaon/mcg-installs-real-time-sewer-sensors-to-prevent-overflows-flooding/articleshow/131618196.cms
6. The Hindu, "Andhra Pradesh launches AI platform to forecast urban floods; Vijayawada first" (26 Jul 2026): https://www.thehindu.com/news/national/andhra-pradesh/andhra-pradesh-launches-ai-platform-to-forecast-urban-floods-vijayawada-first/article71269032.ece
7. NITI Aayog, flood management strategy report (2021-26) (Mar 2021): https://www.niti.gov.in/sites/default/files/2021-03/Flood-Report.pdf
8. European Environment Agency, "Europe is not prepared for rapidly growing climate risks" (Mar 2024): https://www.eea.europa.eu/en/newsroom/news/europe-is-not-prepared-for

**Images:**
- "Indian Navy extends support during 2017 Mumbai flood (2)" by the Indian Navy, Government Open Data License India (GODL-India), via Wikimedia Commons: https://commons.wikimedia.org/wiki/File:Indian_Navy_extends_support_during_2017_Mumbai_flood_(2).jpg
