---
title: 'Vaisala RS41: the Finnish weather balloon sensor that measures the atmosphere from the ground to the stratosphere'
dek:
- An 80-gram box of sensors that rides a balloon up through the atmosphere twice a day at stations around the world, feeding weather forecasts and the climate record. Its maker is now working to shrink the litter it leaves behind.
dateline: Planetary Engineering / Atmospheric Frontiers. Vantaa, Finland. Introduced in 2013.
sub: planetary-atmospheric-frontiers
company: Vaisala Oyj
product: Vaisala Radiosonde RS41
country: Finland
launchDate: '2013'
sdgs:
- 9
- 13
- 14
tags:
- radiosonde
- weather balloon
- upper air
- climate observation
- GRUAN
- forecasting
- marine litter
- Finland
sources:
- https://docs.vaisala.com/v/u/B211321EN-L/en-US
- https://www.gruan.org/data/data-products/gdp/rs41-gdp-1
- https://www.meteorologicaltechnologyinternational.com/features/exclusive-feature-how-are-industry-leaders-increasing-the-sustainability-of-radiosondes.html
- https://www.smithsonianmag.com/science-nature/heres-how-weather-balloons-can-harm-marine-animals-180985276/
- https://researchonline.jcu.edu.au/32945/
- https://www.govcb.com/government-bids/REPLACEMENT-RADIOSONDES-FOR-THE-AND-23645767.htm
- https://www.vaisala.com/sites/default/files/documents/Vaisala%20Financial%20Statement%20Release%20January-December%202025.pdf
- https://commons.wikimedia.org/wiki/File:2022-05-11_07_10_53_A_Vaisala_RS41_Radiosonde_ready_for_release_at_the_National_Weather_Service%27s_Baltimore-Washington_Weather_Forecast_Office_in_the_Dulles_section_of_Sterling,_Loudoun_County,_Virginia.jpg
glance:
- label: Company
  text: Vaisala Oyj, Vantaa, Finland
- label: Product
  text: Radiosonde RS41, a disposable instrument package flown on weather balloons
- label: Key fact
  text: measures temperature, humidity, wind and height every second, with a temperature uncertainty of 0.3°C below 16 km
- label: Scale
  text: the backbone of the global climate reference network GRUAN, launched regularly at 22 of its sites
- label: Caveat
  text: most radiosondes and balloons are never recovered and end up as litter, often at sea
image:
  src: https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c1/2022-05-11_07_10_53_A_Vaisala_RS41_Radiosonde_ready_for_release_at_the_National_Weather_Service%27s_Baltimore-Washington_Weather_Forecast_Office_in_the_Dulles_section_of_Sterling%2C_Loudoun_County%2C_Virginia.jpg/1280px-thumbnail.jpg
  alt: A Vaisala RS41 radiosonde ready for release
  width: 1280
  height: 1707
  caption: 'A Vaisala RS41 radiosonde ready for release at the US National Weather Service office in Sterling, Virginia, May 2022. Photo: Famartin, CC BY-SA 4.0, via Wikimedia Commons.'
links:
- label: RS41-SG datasheet
  href: https://docs.vaisala.com/v/u/B211321EN-L/en-US
- label: GRUAN RS41 data product
  href: https://www.gruan.org/data/data-products/gdp/rs41-gdp-1
---

## The problem

Satellites watch the planet from above, but they cannot directly measure everything in the column of air beneath them. To know how temperature, moisture and wind change with height, forecasters and climate scientists still need instruments that physically travel through the atmosphere. Those vertical profiles feed weather models, warn of storms, help airlines plan routes and are used to check and calibrate satellite data.

For climate science the bar is even higher. Detecting small long-term trends in the upper air needs measurements that are stable, traceable to international standards and come with honest uncertainty estimates. Older sondes struggled with errors from sunlight heating the temperature sensor and from slow humidity sensors in very cold air.

## The product

Vaisala, the Finnish measurement company, introduced the RS41 radiosonde in 2013. It is a small, light instrument package: the sonde weighs about 80 grams and the string about 25 grams. Hung beneath a latex balloon, it climbs through the troposphere into the stratosphere, sending data by radio to a ground station until the balloon bursts.

The RS41-SG uses a platinum resistor for temperature, with a range from plus 60°C to minus 95°C and a response time of half a second. Its thin-film humidity sensor includes its own temperature element and a heating function that removes chemical contamination before launch and de-ices the sensor in flight. A satellite receiver tracking GPS, Galileo and BeiDou signals is used to derive wind, height and, in models without a pressure sensor, pressure. The sonde transmits at 400 to 406 MHz and has been proven to send data up to 350 km.

A serial connector lets scientists add extra instruments, mainly ozone sensors, whose readings travel down through the same radio link. Before each flight, an automated ground check tests the temperature sensor, reconditions and checks the humidity sensor and sets the radio frequency wirelessly.

## How it works

1. **Prepare.** An operator runs the automated ground check and attaches the sonde to an unwinder and balloon.
2. **Launch.** The balloon is released at fixed times; the US Weather Service, for example, launches at 00 and 12 UTC.
3. **Measure.** Every second, the RS41 measures temperature and humidity and logs its satellite position.
4. **Transmit.** Data is sent by radio, with error correction, to the ground station.
5. **Calculate.** Wind is derived from changes in satellite signals; height and pressure from positioning and sensor data.
6. **Share.** Profiles go into national weather models and the global observing system.

## Timeline

| Date | Milestone |
|---|---|
| 2013 | Vaisala introduces the RS41 radiosonde |
| Late 2014 | RS41 enters use in the GCOS Reference Upper-Air Network (GRUAN) |
| 2018 | Vaisala cuts plastic in radiosonde covers by 47% and switches to paper packaging supports |
| 2022 | GRUAN publishes its RS41 reference data product, RS41-GDP.1 |
| 2023 | BioCover and BioTwine introduced, replacing expanded polystyrene and polypropylene |
| 2026 | NOAA issues a sole-source notice to buy RS41-SGP sondes for Barrow, Alaska |

## Impact and numbers

The RS41 has become the standard reference instrument for climate-quality upper-air data. GRUAN, run by a lead centre at Germany's weather service DWD in Lindenberg, says the RS41 has been used in the network since late 2014, is launched regularly at 22 sites and is the backbone of its soundings. GRUAN's RS41 data product corrects for known errors, such as solar heating of the temperature sensor and slow humidity response in the cold, and gives an uncertainty for every data point.

The datasheet lists a combined temperature uncertainty of 0.3°C in soundings below 16 km and 0.4°C above, and 4% relative humidity for the humidity sensor.

Operational services rely on it too. In 2026, NOAA said the US National Weather Service has used the RS41-SGP since it introduced automatic radiosonde launchers, that most of those sites now use the RS41-SG, and that Vaisala is the only maker of the model needed at Barrow, Alaska, a key upstream station for US forecasts. There, the US Department of Energy also launches sondes four times a day and requires the RS41-SGP model. Hakai Magazine, republished by Smithsonian, reports about 1,300 stations worldwide release weather balloons, with the US alone launching some 76,600 a year.

Vaisala's Weather and Environment business is part of a group with 2025 net sales of EUR 596.9 million.

## Honest caveats

**A single-use instrument.** Most radiosondes are not recovered. A 2014 study of Australia's Great Barrier Reef estimated that 65 to 70% of balloons released there land in the ocean, and beach clean-ups found 2,460 balloon fragments at 24 sites.

**Wildlife harm.** Researchers in Brazil documented albatrosses entangled in balloon strings still attached to radiosondes, and Hakai reported that those birds were caught in Vaisala equipment.

**Greener models cost more.** Vaisala says its RS41 E-models use 82% less plastic than the original 2013 RS41, using BioCover and cellulose-based BioTwine. But the company told Hakai that its natural-material versions are 20 to 30% more expensive, which slows uptake.

**Batteries remain hard.** Industry experts quoted by Meteorological Technology International say the battery is the hardest part to make sustainable, and Vaisala argues recycling materials into new sondes beats collecting and shipping used ones back.

**Market concentration.** NOAA's sole-source notice shows how much some services depend on one supplier.

## What's next

EU rules on ecodesign and digital product passports are pushing radiosonde makers toward lower-impact designs. Vaisala's balloon prototypes have been tried by Australia's Bureau of Meteorology, and the UK Met Office planned tests from British Antarctic Survey stations. Expect more bio-based parts and pressure to solve the battery problem.

## Why it matters for Europe and green buyers

For Europe, the RS41 is a Finnish-made pillar of weather and climate infrastructure. Accurate upper-air data improves forecasts of storms, floods and heatwaves, supports aviation fuel planning and anchors the climate record that EU policy relies on. Public buyers can use their purchasing power to favour the lower-plastic versions.

For India, weather balloons are part of the national observing system, and better profiles of temperature and moisture matter for monsoon and cyclone forecasting. Instruments with climate-grade accuracy, plus biodegradable strings and covers, would help at coastal stations, where many balloons can come down in the sea.

## Sources & image credits

1. Vaisala, Radiosonde RS41-SG datasheet B211321EN-L. https://docs.vaisala.com/v/u/B211321EN-L/en-US
2. GRUAN Lead Centre (DWD), "RS41 GRUAN Data Product Version 1 (RS41-GDP.1)". https://www.gruan.org/data/data-products/gdp/rs41-gdp-1
3. Meteorological Technology International, "How are industry leaders increasing the sustainability of radiosondes?". https://www.meteorologicaltechnologyinternational.com/features/exclusive-feature-how-are-industry-leaders-increasing-the-sustainability-of-radiosondes.html
4. Smithsonian Magazine (Hakai Magazine), "Here's how weather balloons can harm marine animals". https://www.smithsonianmag.com/science-nature/heres-how-weather-balloons-can-harm-marine-animals-180985276/
5. Marine Pollution Bulletin 79 (2014), "Predictable pollution: an assessment of weather balloons... Great Barrier Reef", via JCU ResearchOnline. https://researchonline.jcu.edu.au/32945/
6. NOAA sole-source notice for RS41-SGP replacement radiosondes, 2026, via GovCB. https://www.govcb.com/government-bids/REPLACEMENT-RADIOSONDES-FOR-THE-AND-23645767.htm
7. Vaisala, Financial Statement Release January to December 2025. https://www.vaisala.com/sites/default/files/documents/Vaisala%20Financial%20Statement%20Release%20January-December%202025.pdf
8. Wikimedia Commons, "A Vaisala RS41 Radiosonde ready for release at the National Weather Service's Baltimore-Washington Weather Forecast Office". https://commons.wikimedia.org/wiki/File:2022-05-11_07_10_53_A_Vaisala_RS41_Radiosonde_ready_for_release_at_the_National_Weather_Service%27s_Baltimore-Washington_Weather_Forecast_Office_in_the_Dulles_section_of_Sterling,_Loudoun_County,_Virginia.jpg

**Images:** "A Vaisala RS41 Radiosonde ready for release", Famartin, Sterling, Virginia, USA, 11 May 2022, CC BY-SA 4.0, via Wikimedia Commons.
