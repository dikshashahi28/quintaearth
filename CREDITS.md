# Credits

## Type and icons
- Literata and Public Sans, from Google Fonts (SIL Open Font License).
- Material Symbols Rounded (Apache 2.0) for the botanical and industry icons; Phosphor Icons (MIT) for arrows,
  menu and social glyphs. Both are inlined in `src/components/IconSprite.astro`.

## Illustration
The hero valley, the river rail and the footer meadow are drawn in SVG for this site. The default share image
(`og-share`, 1200x630) is the hero valley with the wordmark, rendered by `scripts/media/render-og-share.mjs`.

## Photographs
- **Story images** come from Wikimedia Commons and are stored, resized, in `src/assets/stories/`. Each
  story credits the photographer and licence in its caption and in its "Sources & image credits" section.
- **Site photographs (Cloudflare R2)**: every other photo on the site (the home page, /about, the industries,
  the services, the scene bands, the account doors, and the Insights and press heroes) is listed in
  `scripts/media/sources.json` with its Unsplash id and credit, cut to WebP sizes by `scripts/media/build-media.mjs`,
  stored in R2 and served from `/media/`. One photo, one subject; none is reused. All under the Unsplash License
  except `og-share`, drawn for this site. The 44 photographs:

  | Slot | Photographer | Unsplash photo | Licence |
  | --- | --- | --- | --- |
  | who-stone-1 | James Kovin | https://unsplash.com/photos/K0Q2fSZSXTM | Unsplash License |
  | who-stone-2 | Kumpan Electric | https://unsplash.com/photos/G1Xk2C87Rb8 | Unsplash License |
  | who-stone-3 | Anoof Junaid | https://unsplash.com/photos/yUu2H68ingI | Unsplash License |
  | who-stone-4 | EqualStock | https://unsplash.com/photos/kBkrFGnS5us | Unsplash License |
  | who-stone-5 | SwapnIl Dwivedi | https://unsplash.com/photos/w46tRF64qNc | Unsplash License |
  | about-spread | EqualStock | https://unsplash.com/photos/lv5FvD65Cz4 | Unsplash License |
  | industry-technology | I'M ZION | https://unsplash.com/photos/0qmozg-eQj0 | Unsplash License |
  | industry-energy | Infinara | https://unsplash.com/photos/ClWvi3gkWTc | Unsplash License |
  | industry-materials | Parastoo Maleki | https://unsplash.com/photos/vJdz_J_Uf9E | Unsplash License |
  | industry-architecture | Tim Umphreys | https://unsplash.com/photos/d2kc7Lpldu8 | Unsplash License |
  | industry-transport | Olga Subach | https://unsplash.com/photos/Zuxxq0iHkN4 | Unsplash License |
  | industry-eco | sutirta budiman | https://unsplash.com/photos/dwctehXPvXg | Unsplash License |
  | industry-planetary | NOAA | https://unsplash.com/photos/5hZJVGPG6vo | Unsplash License |
  | industry-advanced | Toon Lambrechts | https://unsplash.com/photos/pVkMHP3RINU | Unsplash License |
  | vol-arch | Jonathan Kemper | https://unsplash.com/photos/4z3lnwEvZQw | Unsplash License |
  | vol-stone | Vitaly Gariev | https://unsplash.com/photos/FJRYUL_YHXg | Unsplash License |
  | community-pond | CoWomen | https://unsplash.com/photos/3ALW9V3jNkc | Unsplash License |
  | scene-services | National Cancer Institute | https://unsplash.com/photos/6q1C_XDNR4s | Unsplash License |
  | offer-stories | Carlos Felipe Ramírez Mesa | https://unsplash.com/photos/U0dqLMx4vvw | Unsplash License |
  | offer-audit | EqualStock | https://unsplash.com/photos/niC-8W7158E | Unsplash License |
  | offer-cbam | Bhupathi Srinu | https://unsplash.com/photos/pjGqgc_JZcY | Unsplash License |
  | offer-csr | Yannis H | https://unsplash.com/photos/uaPaEM7MiQQ | Unsplash License |
  | offer-sponsored | Vitaly Gariev | https://unsplash.com/photos/pe9rSorLxZ0 | Unsplash License |
  | offer-listing | Job Savelsberg | https://unsplash.com/photos/7UZRCMt9FME | Unsplash License |
  | scene-terms | Minh Đức | https://unsplash.com/photos/IAR-l-Cq4Is | Unsplash License |
  | scene-privacy | motomoto sc | https://unsplash.com/photos/Ru9Uf4G0Gx0 | Unsplash License |
  | scene-contact | Abhishek Ravi | https://unsplash.com/photos/B45kO_czCrg | Unsplash License |
  | scene-join | Sandip Kalal | https://unsplash.com/photos/tMqgXU7A70E | Unsplash License |
  | scene-signin | Spencer Liao | https://unsplash.com/photos/B07sbiunrtY | Unsplash License |
  | scene-welcome | HiveBoxx | https://unsplash.com/photos/65icrs88YYs | Unsplash License |
  | article-insight-thai | Kamaruld Salleh | https://unsplash.com/photos/GVpeVYxEFgw | Unsplash License |
  | article-press-thai | Duangphorn Wiriya | https://unsplash.com/photos/zgQKzDL1Pt0 | Unsplash License |
  | article-press-ferragamo | Sergio Peláez | https://unsplash.com/photos/a2EAaN3ha_c | Unsplash License |
  | article-press-torque | Infralist.com | https://unsplash.com/photos/UOiNcIb6IWQ | Unsplash License |
  | article-insight-csrd | ammar ahsan | https://unsplash.com/photos/SsTd-oR60S4 | Unsplash License |
  | article-insight-empco-makers | byhome work | https://unsplash.com/photos/x19mK3HcG7M | Unsplash License |
  | article-insight-ferragamo | Jakob Cotton | https://unsplash.com/photos/UQJf6y91zZs | Unsplash License |
  | article-insight-aijek | Joshua Kuswardi | https://unsplash.com/photos/Z6y68ndU_ac | Unsplash License |
  | article-insight-confiance | Saif Rahman | https://unsplash.com/photos/wcOm7W67X3w | Unsplash License |
  | article-insight-empco-vs-gcd | Carl Gruner | https://unsplash.com/photos/dxQ6ISn7_tQ | Unsplash License |
  | article-insight-le-meridien | Cosmic Timetraveler | https://unsplash.com/photos/hXxgCOocQos | Unsplash License |
  | article-insight-torque | Vitaly Gariev | https://unsplash.com/photos/Pqa0-ucJLZA | Unsplash License |
  | article-press-empco-eu | Kadarius Seegars | https://unsplash.com/photos/b9KAwJRBXgw | Unsplash License |
  | article-press-aijek | Trisha Downing | https://unsplash.com/photos/pyud8ZaVq4I | Unsplash License |

  The files still in `src/assets/photos/` and `src/assets/articles/` are the photos used before 12 October 2026;
  nothing imports them any more.
- **Brand files** (`public/assets/`): `logo.png` (Riverline header logo), earlier logo versions, the YouTube
  banner, WhatsApp community QR.
- **Demo community photos** (`scripts/seed-demo/media/`, shown on dev.quintaearth.com's member pages): CC0,
  CC BY, CC BY-SA and public-domain photographs found through Openverse and Wikimedia Commons. Photographer,
  licence and source page for each file are in `scripts/seed-demo/CREDITS.json`. Company logos are generated from the
  site's own icon sprite; evidence PDFs are generated samples.

## UN Sustainable Development Goals
Goal names and links follow the UN (sdgs.un.org). `public/assets/sdg/` keeps the UN goal icons the
pre-revamp pages used; see `CREDITS-sdg.txt` there.
