---
title: 'Katam Forest: the Swedish app that turns a smartphone walk into a forest inventory'
dek:
- A Lund-made app that films trees as a forester walks through a stand, builds a 3D model on the phone and returns stem diameters, basal area and timber volume in minutes.
dateline: Eco-restoration / Sustainable Forestry. Lund, Sweden. Independently tested by the Swedish University of Agricultural Sciences (SLU) in 2019.
sub: eco-sustainable-forestry
company: Katam Technologies AB
product: Katam Forest smartphone and drone inventory app
country: Sweden
launchDate: '2019'
sdgs:
- 9
- 12
- 13
- 15
tags:
- forest inventory
- smartphone
- computer vision
- AI
- basal area
- timber volume
- Sweden
- Brazil
sources:
- https://www.katam.se/
- https://www.katam.se/faq/
- https://play.google.com/store/apps/details?id=katam.com.datarecorder
- https://www.vinnova.se/en/p/tree-volume-measurement-by-ai/
- https://www.vinnova.se/en/p/ai-resilience-in-the-digitalization-of-the-forest-industry
- https://www.mdpi.com/1999-4907/14/8/1553
- https://www.ipef.br/publicacoes/scientia/v53_2025/2318-1222-scifor-53-e4079.pdf
- https://usercontent.one/wp/www.katam.se/wp-content/uploads/2023/02/2019-SLU-Test-report-Katam-Forest-ENG.pdf
- https://commons.wikimedia.org/wiki/File:Swedish_Spruce_Forest.jpg
glance:
- label: Company
  text: Katam Technologies AB, Lund, Sweden
- label: Product
  text: Katam Forest, an Android app (with a free Mini version) and drone workflow for measuring forest stands
- label: Key fact
  text: measures tree diameter, basal area, stem density and volume from a short video and a reference sign
- label: Scale
  text: used by forest owners and plantation companies in Europe and Latin America; Swedish innovation agency support of about SEK 3 million from 2024 to 2027
- label: Caveat
  text: independent tests show it can underestimate stem diameter and tree counts, and heights and volumes in some plantations
image:
  src: https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Swedish_Spruce_Forest.jpg/1280px-Swedish_Spruce_Forest.jpg
  alt: A Swedish spruce forest near Ånnaboda
  width: 1280
  height: 828
  caption: 'A spruce forest near Ånnaboda, Sweden, the type of stand a forester can measure with the Katam app (illustrative; app not shown). Photo: Nick Lott, CC BY 2.0, via Wikimedia Commons.'
links:
- label: Katam
  href: https://www.katam.se/
- label: Katam FAQ
  href: https://www.katam.se/faq/
- label: Katam on Google Play
  href: https://play.google.com/store/apps/details?id=katam.com.datarecorder
---

## The problem

You cannot manage a forest well without knowing what is in it. Before a thinning, a sale or a certification audit, forest owners need to know how many trees they have per hectare, how thick they are and how much wood they hold. Traditionally that means a forester with a calliper, a measuring tape and a relascope, walking sample plots and writing numbers down. It is slow, costly and prone to error, so many small forest owners rely on rough estimates or on numbers from the timber buyer.

Airborne laser scanning gives excellent data, but it is expensive, done only every few years and does not help a forester standing in a stand today. There is a gap for a fast, cheap measurement method that anyone can use on the ground.

## The product

Katam Technologies AB is a company from Lund in southern Sweden that builds computer vision and AI tools for forestry. Its main product is Katam Forest, an app for Android smartphones.

The user places a reference sign on a tree, then walks slowly through the stand while filming with the phone. The app uses a method called SLAM (simultaneous localisation and mapping) to build a 3D model of the stems from the video, then measures each tree's diameter at breast height. From these it calculates basal area, stem density and, using height curves or heights entered by the user, timber volume.

In the Pro version, each tree also gets a position, diameter, height and volume, and several recordings can be combined into a stand report with a diameter distribution. The free Katam Mini app allows recordings of about 30 seconds, which can be upgraded to 90 seconds. Paid versions add longer recordings, reporting and drone support, so larger areas can be measured from the air. On its website, Katam quotes plantation customers such as the Chilean forest company CMPC on the time saved.

## How it works

1. **Set up.** Place the reference sign on a tree so the app can scale its 3D model.
2. **Film.** Walk a set path through the stand, filming the stems at chest height.
3. **Model.** The app builds a 3D point model and finds each stem.
4. **Measure.** It calculates diameter for every tree, then basal area and stems per hectare.
5. **Estimate volume.** Height is added from a height curve or manual measurement, and volume is calculated.
6. **Report.** Results are saved, mapped and exported for planning, sales or certification.

## Timeline

| Date | Milestone |
|---|---|
| 2019 | SLU tests Katam Forest against manual measurements and publishes a test report |
| 2023 | Peer-reviewed comparison of Katam with two other smartphone apps published in Forests |
| Apr 2024 | Vinnova grants SEK 2,996,400 for "Tree volume measurement by AI" with Linnaeus University and Brazilian partners, running to Dec 2027 |
| 2025 | Brazilian study in Scientia Forestalis tests the app in loblolly pine plantations |
| Jan to Apr 2026 | Vinnova grants SEK 150,000 for an AI resilience project, linked to Nvidia's GTC conference |

## Impact and numbers

The app's selling point is speed. A forester can record a plot in about a minute and get results on the spot, instead of measuring every tree by hand.

Its accuracy has been tested several times. In 2019 the Swedish University of Agricultural Sciences ran a test against calliper measurements and published a report, which Katam shares on its website. A 2023 peer-reviewed study in the journal Forests compared Katam with two other smartphone apps. It found that Katam tended to underestimate stem diameter and the number of trees, but its estimates of basal area were not significantly different from field measurements. Accuracy fell in dense stands and on slopes.

A 2025 study in Brazil's Scientia Forestalis tested the app in plantations of loblolly pine. Diameter, basal area and density were measured well, but height and volume were underestimated, which matters because volume is what timber buyers pay for.

Sweden's innovation agency Vinnova is backing the next step. Its 2024 grant of about SEK 3 million funds work with Linnaeus University in Sweden, the Federal University of Viçosa in Brazil and the Brazilian innovation body EMBRAPII on measuring tree volume with AI.

## Honest caveats

**Diameter and counts can be low.** Independent studies show the app can miss small or hidden trees and underestimate diameters, especially in dense or steep stands.

**Volume needs height.** The app measures stems at chest height well, but tree height still has to come from a model or a manual measurement. Errors there carry into volume.

**Android only.** The main app runs only on Android phones that meet its performance requirements, and there is no iPhone version yet.

**Technique matters.** Katam's own help pages say trees can be missed if they are too close to or too far from the camera, or hidden behind other stems, and that at least one reference sign must be visible. Short recordings are less precise, and the company advises checking results against calliper measurements of the same trees rather than broad forest plan figures.

**A sample, not a census.** Like any plot method, results depend on how many plots are filmed and where.

**Forest health is not measured.** The app counts and sizes trees. It does not assess biodiversity, deadwood or soil, which certification also cares about.

## What's next

Katam's research projects aim to measure height and volume directly with AI, the main gap found by researchers. Better drone workflows would let plantation companies cover whole estates. If the volume problem is solved, the app could become a low-cost tool for timber sales, carbon accounting and certification audits.

## Why it matters for Europe and green buyers

For Europe, millions of small private forest owners in Sweden, Finland, Germany and France need cheap, reliable data on their forests, both for good management and for new reporting demands under the EU deforestation and nature rules. A phone app that gives a usable inventory in minutes lowers the cost of planning and of joining certification schemes, and helps owners check what timber buyers tell them.

For India, where farm forestry and plantations of eucalyptus, poplar and casuarina supply much of the wood used by industry, farmers often sell trees with little idea of their volume. A smartphone tool that estimates stem diameter and basal area could give growers more bargaining power and help state forest departments measure plantations. It would need testing on Indian species and planting patterns first.

## Sources & image credits

1. Katam Technologies, company website. https://www.katam.se/
2. Katam, FAQ (reference sign, height, recording length). https://www.katam.se/faq/
3. Google Play, Katam app listing. https://play.google.com/store/apps/details?id=katam.com.datarecorder
4. Vinnova, "Tree volume measurement by AI" (project 2024-00189). https://www.vinnova.se/en/p/tree-volume-measurement-by-ai/
5. Vinnova, "AI resilience in the digitalization of the forest industry" (project 2025-04727). https://www.vinnova.se/en/p/ai-resilience-in-the-digitalization-of-the-forest-industry
6. Forests (2023), 14(8): 1553, comparison of smartphone forest inventory apps including Katam. https://www.mdpi.com/1999-4907/14/8/1553
7. Scientia Forestalis (2025), v53, e4079, Katam in Pinus taeda plantations. https://www.ipef.br/publicacoes/scientia/v53_2025/2318-1222-scifor-53-e4079.pdf
8. SLU, Katam Forest test report (2019). https://usercontent.one/wp/www.katam.se/wp-content/uploads/2023/02/2019-SLU-Test-report-Katam-Forest-ENG.pdf
9. Wikimedia Commons, "Swedish Spruce Forest.jpg". https://commons.wikimedia.org/wiki/File:Swedish_Spruce_Forest.jpg

**Images:** "Swedish Spruce Forest", Nick Lott, near Ånnaboda, Sweden, May 2004, CC BY 2.0, via Wikimedia Commons. Illustrative: shows a Swedish forest, not the app.
