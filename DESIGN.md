---
name: QuintaEarth
description: One calm story joined by a river; green, with gold where the river touches something.
colors:
  page: "#ffffff"
  sky: "#f6f9f1"
  river: "#2f6b3a"
  river-deep: "#245a2e"
  deep: "#14301c"
  reed: "#7fa26b"
  reed-ink: "#4d6e3d"
  gold: "#b8912f"
  gold-ink: "#245a2e"
  gold-dark: "#8a6a1c"
  gold-light: "#d9b85a"
  mist: "#cfe0cc"
  water: "#d3e7df"
  shallow: "#e7f0e3"
  hair: "#d3e0d0"
  text: "#1b2a1e"
  muted: "#566457"
  ink-2: "#3d4a3f"
  placeholder: "#5f6f60"
  field-line: "#7a957a"
  id-line: "#c9d3c8"
  live-wash: "#e3ecd9"
  live-ink: "#3f5c31"
  quiet-wash: "#eef1ee"
  danger: "#b3261e"
  danger-line: "#e3c4c1"
typography:
  display:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(42px, 5.2vw, 76px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.01em"
  statement:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(32px, 3.8vw, 50px)"
    fontWeight: 400
    lineHeight: 1.14
    letterSpacing: "-0.012em"
  headline:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "clamp(30px, 3.2vw, 42px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  numeral:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  body-lead:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.45vw, 20px)"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
  small:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "100px"
  circle: "50%"
spacing:
  gutter: "16px"
  section: "clamp(72px, 9vw, 128px)"
  column: "760px"
  wide: "min(1080px, calc(100vw - 200px))"
components:
  button-fill:
    backgroundColor: "{colors.river}"
    textColor: "{colors.page}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-fill-hover:
    backgroundColor: "{colors.river-deep}"
    textColor: "{colors.page}"
  button-line:
    backgroundColor: "{colors.page}"
    textColor: "{colors.river}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-line-hover:
    backgroundColor: "{colors.shallow}"
    textColor: "{colors.river}"
  button-gold-on-deep:
    backgroundColor: "{colors.gold-light}"
    textColor: "{colors.deep}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  text-link:
    textColor: "{colors.river}"
    height: "44px"
  fact-chip:
    backgroundColor: "{colors.page}"
    textColor: "{colors.deep}"
    rounded: "{rounded.pill}"
    padding: "8px 16px 8px 12px"
    height: "44px"
  chip:
    backgroundColor: "{colors.page}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  chip-action:
    backgroundColor: "{colors.shallow}"
    textColor: "{colors.river-deep}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
    height: "40px"
  status-pill-next:
    backgroundColor: "{colors.shallow}"
    textColor: "{colors.river-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 11px"
  stone:
    backgroundColor: "{colors.page}"
    rounded: "{rounded.circle}"
    size: "118px"
    padding: "6px"
  part-circle:
    backgroundColor: "{colors.page}"
    textColor: "{colors.river}"
    rounded: "{rounded.circle}"
    size: "68px"
  part-circle-open-lit:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.page}"
  pebble:
    backgroundColor: "{colors.page}"
    textColor: "{colors.river}"
    rounded: "{rounded.circle}"
    size: "58px"
  pebble-current:
    backgroundColor: "{colors.gold}"
    textColor: "{colors.page}"
  input-email:
    backgroundColor: "{colors.page}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "48px"
  feature-card:
    backgroundColor: "{colors.shallow}"
    rounded: "{rounded.lg}"
    padding: "18px"
---

# Design System: QuintaEarth

## Overview

**Creative North Star: "The Riverline"**

One calm story read top to bottom, joined by a river that draws itself as the visitor scrolls. The page is white, the hero is a pale sky over an illustrated valley (sun, clouds, turbines, trees, reeds), and from a gold spring at the bottom of the hero a single green river runs down the left of every section, branching through the people and the parts it serves. Green carries everything; gold appears only where the river touches something: a bead lights, a stone rims, a current part fills, a chosen industry turns gold.

Density is low and editorial. Sections are separated by generous vertical air rather than rules or cards, headlines are a roman book serif set at regular weight, and the furniture (stones, part circles, pebbles) is round, outlined and botanical. Icons are Material Symbols Rounded (filled glyphs, weight 400), coloured by context, scaling in as their block reveals, each with its own hover motion. One deep forest-green band holds the CSR statement and the footer; the river turns pale while it crosses it.

The world was pinned by the user (Riverline artifact liked 8 Oct 2026) and shipped as a code-led refinement. It replaced the Environs Bootstrap template across the whole site in the 9 Oct 2026 Astro rebuild.

Where it lives: the Astro site in `src/` (homepage `src/pages/index.astro`, sections in `src/components/home/`, inner pages through `src/components/page/PageHead.astro` and `src/components/views/`). The original comp lived in `samples/riverline/index.html` until the samples folder was dropped from the repo on 11 Oct 2026 (git history before that commit still has it). The homepage grew from the comp's six numbered sections to ten (Press, YouTube, Volunteer and Collaborators came over from the old site in the rebuild). Inner pages open with a breadcrumb and title; numbered kickers stay on the homepage only.

**Key Characteristics:**
- White page, sky hero, one deep-green band; no other section fills.
- A drawn river rail with gold beads is the page's spine and its progress indicator.
- Green does the work; gold marks arrival and is never body text.
- Literata roman display over Public Sans body; numbers in Literata tabular figures.
- Round, outlined furniture and pill controls; stroked botanical icons.
- Soft, green-tinted lift shadows on hover only.

## Colors

A green-forward palette of river, reed and forest, lit by a single gold, on white and a pale sky.

### Primary
- **River Green** (river): the voice of the system. Fill buttons, outline buttons, links, the river line, stone and part-circle outlines, icons at rest, focus rings and the text caret.
- **Deep Current** (river-deep): hover state of the fill button, kicker text, chip and pill text, sub-category labels.

### Secondary
- **Bead Gold** (gold): arrival. River beads when lit, the stone and part rims when the river reaches them, the current pebble and current dot fills, the hero spring, progress bars, and icon strokes inside kickers and pills. Strokes and fills only.
- **Gold Ink** (gold-ink): despite the name, deep green (#245a2e) since 8 Oct 2026 (Paras: "change the brown color"): the rotating hero word, kicker numerals, chip counts. The old brown text gold is kept as **Gold Dark** (gold-dark, #8a6a1c, 5:1 on white), the only gold that may carry text on light grounds.
- **Lantern Gold** (gold-light): gold on the deep band: the CSR ring stroke, the CSR ornament, the gold pill button and email link inside the band, and the sun and glints in the hero illustration.

### Tertiary
- **Reed** (reed): illustration hills, reed strokes, floating leaves, resting icons in the industry name row, scrollbar thumb.
- **Reed Ink** (reed-ink): darker illustration greens (birds, trees) and the "open" status pill text.

### Neutral
- **Page White** (page): every content section and the header (at 94% with a blurred backdrop).
- **Valley Sky** (sky): the hero ground and the browser theme colour.
- **Forest Deep** (deep): headline colour on light, and the full ground of the CSR band and footer.
- **Shallow** (shallow): quiet fills: the feature card, image placeholders, action chips, the selected industry name, hover fill for the outline button.
- **Water** (water): the wide pale stroke under the river line, the river in the illustration, text selection.
- **Mist** (mist): the pale river while it crosses the deep band, secondary text on deep, the far hill in the illustration.
- **Ink** (text): body text.
- **Moss Grey** (muted): ledes, captions, meta, inactive labels.
- **Hairline** (hair): dividers, chip borders, the scrolled header rule, progress track.

### Named Rules
**The Gold Means Arrival Rule.** Gold marks a place the river has reached or the thing currently chosen. If nothing has arrived, it stays green.

**The Gold Ink Rule.** Bead Gold measures about 3:1 on white and never sets text. Text in gold uses Gold Ink on light grounds and Lantern Gold on Forest Deep.

**The No Orange Rule.** The warm voice is gold only. No orange, coral or amber accents (user decision, 8 Oct 2026).

## Typography

**Display Font:** Literata (with Georgia, serif), roman 400 and 500, italic 400, optical sizes 7 to 72, from Google Fonts.
**Body Font:** Public Sans (with system-ui, sans-serif), 400, 500 and 600, from Google Fonts.

**Character:** A warm, bookish serif at regular weight for everything spoken, over a plain civic sans for everything read or pressed. The pair is locked by the user.

### Hierarchy
- **Display** (Literata 400, clamp(42px, 5.2vw, 76px), 1.04): the hero headline only, max about 17ch, balanced. One word may rotate in Literata italic in Gold Ink.
- **Statement** (Literata 400, clamp(32px, 3.8vw, 50px), 1.14): the founder quote; the CSR line runs larger on deep (clamp(34px, 4.6vw, 60px), 1.1) and the industry name larger again (clamp(40px, 4.6vw, 64px), 1.02).
- **Headline** (Literata 400, clamp(30px, 3.2vw, 42px), 1.12): every section h2.
- **Title** (Literata 400, 21 to 28px, 1.1 to 1.3): stone names (22px), part names (28px), insight titles (21px).
- **Numeral** (Literata 400 or 500, tabular figures): counts and figures, 17px in lists, 22px in hero chips, 40px in industry figures, 56px in the CSR ring.
- **Body lead** (Public Sans 400, clamp(18px, 1.45vw, 20px), 1.6, max 56ch): long-form paragraphs and the hero sub line (max 44ch).
- **Body** (Public Sans 400, 17px, 1.6; 16px under 640px): default text; ledes at 17px in Moss Grey, max 46ch.
- **Label** (Public Sans 600, 13px): pills, tags, sub-category labels; footer heads at 14px with 0.02em tracking.
- **Small** (Public Sans 400, 14px, 1.45): captions, dates, meta.

### Named Rules
**The Regular Serif Rule.** Literata headings stay at weight 400 with -0.01em tracking; 500 is reserved for numerals. No bold display.

**The Numbers Are Set Rule.** Every count uses Literata with tabular figures, so numbers read as set type, not UI.

## Layout

Two measures: a reading column (760px) and a wide frame (min(1080px, 100vw - 200px)), both shrunk by a 16px gutter on each side. The 200px reserve on desktop is the river's lane: the rail sits 44px left of the wide frame (64px left of the column). Sections stack with clamp(72px, 9vw, 128px) top and bottom padding and no dividers; section order is the story order.

Within sections, the forms are: a centred hero; a five-across stone row with odd stones dropped 40px; a two-column editorial spread (0.86fr image, 1.14fr text); a five-across part grid; a two-column industry stage (photo, then info); a feature card then a dated list; a centred band on deep; a pond image beside the join copy; a four-column footer.

Responsive behaviour:
- **1179px and below:** the river straightens into a fixed left rail (18px in), the wide frame becomes full width minus gutters, section content shifts right 34px to clear the rail, the part grid goes to three columns.
- **900px and below:** the header nav becomes a menu button with a drop panel; spreads, the industry stage, the feature card and the pool become single column; stones auto-fit at 150px; footer goes to two columns.
- **640px and below:** body drops to 16px, header to 64px, every river rail and the scene river are hidden and content uses the full width (owner decision, 13 Oct 2026: "no river anywhere" on phones; base.css collapses each rail grid to one column); stones and parts become rows (circle left, text right); industry pebbles become a horizontal scroll-snap strip; the email form stacks with a full-width button. Both hero buttons stay above the fold on phone.

**The River Lane Rule.** Nothing but the river lives in the left lane. Content clears the rail at every breakpoint.

## Elevation & Depth

Flat at rest. Depth comes from the illustrated hero's parallax layers, outlined round forms, and one deep band. Shadows appear only on hover or for the open menu panel, always soft and tinted with Forest Deep (rgba(20, 48, 28, …)), never neutral black and never hard-offset.

### Shadow Vocabulary
- **Lift** (`0 8px 20px rgba(20,48,28,.14)`): buttons on hover, with a 2px rise.
- **Chip lift** (`0 6px 18px rgba(20,48,28,.12)`): hero fact chips on hover.
- **Stone lift** (`0 14px 30px rgba(20,48,28,.16)`): stones and part circles on hover (part circles use `0 12px 26px`).
- **Card lift** (`0 16px 36px rgba(20,48,28,.12)`): the feature card on hover.
- **Panel** (`0 16px 32px rgba(20,48,28,.1)`): the open phone menu.
- **Gold halo** (`0 0 0 6px rgba(184,145,47,.14)`): a lit part circle.

**The Lift On Touch Rule.** A shadow is a response to the pointer, never decoration at rest.

## Shapes

Round and outlined. Controls are full pills (100px). Furniture is circular: stones (118px, 88px on phone), part circles (68px, 56px on phone), pebbles (58px), river beads (6px radius; none on phone), the pond (up to 400px). Circles carry a 2px River Green outline that turns gold when the river reaches them, and a lit circle gains a second 1.5px gold ring 7px outside. Not-yet-open parts use a dashed outline.

Photographs sit in 12px-radius frames, the feature card in 16px, small fills (QR, flash rows) in 8px. The industry photo is the one organic silhouette: a pebble-shaped blob (`44% 56% 52% 48% / 46% 44% 56% 54%`).

Icons come in two sets. The content set is Material Symbols Rounded, weight 400 (chosen by Paras on 8 Oct 2026 from a ten-direction picker): filled glyphs on the 960 grid, inlined as `hi-*` symbols (sprig=spa, leaf=eco, sprout=psychiatry, sun=sunny, wind=air, drop=water_drop, ripple=waves, mountain=landscape, reed=grass, book=menu_book, connect=groups, frame=storefront, bulb=lightbulb, basket=handshake, tech=memory, materials=recycling, arch=apartment, transport=local_shipping, planet=public, atom=biotech), coloured by context, scaling in from 60% when the block reveals, and each carrying a motion class (`m-spin`, `m-grow`, `m-glow` and so on) that plays once on hover. A separate filled UI set handles arrows, carets, menu, close and social marks.

## Components

### Buttons
Calm, round, and they lift a little when pointed at.
- **Shape:** full pill (100px), 48px tall (44px in the header), 1.5px border.
- **Fill:** River Green with white text, Public Sans 500 16px, 24px side padding; hover goes to Deep Current.
- **Line:** white with River Green border and text; hover fills Shallow.
- **Gold on deep:** Lantern Gold with Forest Deep text, used only inside the deep band.
- **Hover / Active:** rise 2px with the Lift shadow; an arrow icon slides 4px right; active presses to scale 0.98 with no shadow.
- **Text link:** River Green, 500, with a 1.5px inset underline; 44px tall hit area; arrow slides on hover.
- **Focus:** 2px River Green outline, 3px offset, 6px radius, on every link, button and input.

### Chips and Pills
- **Fact chip:** white at 90%, hairline border, a Literata numeral in River Green beside a stroked icon; lifts on hover.
- **Chip:** white, hairline border, 14px body text. **Action chip:** Shallow fill, Deep Current text, count in Gold Ink; hover adds a River Green border.
- **Status pills:** open (pale reed fill, Reed Ink text, gold sprig), next (Shallow, Deep Current), later (cool grey, Moss Grey).

### Cards / Containers
- **Feature card:** Shallow ground, 16px radius, 18px padding, image and text side by side; Card lift on hover and a slow 1.05 image zoom.
- **Lists:** hairline-separated rows with a small 12px-radius thumbnail right; title turns River Green on hover.
- No other cards: sections, stones and parts are not boxed.

### Inputs / Fields
- **Style:** pill field (selects too, with a River Green chevron; textareas keep the 12px radius), 48px tall, 1.5px border (Field Line `#7a957a` on member pages, 3.3:1), white ground, 16px body text, River Green caret.
- **Focus:** border turns River Green with the standard 2px outline at 2px offset.
- **Message:** a 14px Deep Current note line under the row; no backend is wired yet.

### Navigation
- **Header:** sticky, white at 94% with saturate-and-blur backdrop; 72px tall, 64px once scrolled (a hairline appears and the logo shrinks from 30px to 26px). Six links (About, Industries with a mega menu, Insights, Press, Volunteer, Contact; Public Sans 500 16px) and one fill pill CTA.
- **Active state:** link turns Deep Current and a 5px gold dot grows under it; scroll-spied.
- **Phone (900px and below):** a 44px round outline menu button; the nav drops as a full-width white panel with 52px rows and hairline separators, Panel shadow; Escape closes and returns focus. Links and "Sign in" never wrap: from 901 to 1279px the CTA reads "Join" and below 1180px the links tighten to 15px with 20px gaps (16px at 960px and below), so the header holds one line at every desktop width. Under 640px the CTA shortens to "Join".

### The River Rail (signature)
An absolutely positioned SVG over the main column, rebuilt from section geometry on resize. Three strokes share one path: an 11px Water band, a 1.6px River Green line, and a 2px white dashed current (3 on, 17 off) that flows continuously and is masked to the drawn length. The path draws as the visitor scrolls. At each section a bead (white fill, River Green stroke) waits; when the drawn river reaches it, it fills gold, scales 1.25 and sends one gold ring outward. In stone and part rows the river branches horizontally through each item in serpentine order and lights them gold one by one. It starts from a pulsing gold spring in the hero, turns Mist through the deep band, and ends at the pond. Three small leaves (reed, gold, reed ink) drift along it.

### Stones, Part Circles and Pebbles
The river's stopping places. All are white circles with a 2px River Green outline and an icon or photo inside; they lift (stones 6px, part circles 5px with a 5-degree tilt, pebbles 4px with 6 degrees) on hover. Lit means a gold outline; current or open-and-lit means a solid gold fill with white icon.

### Numbered section label (surface-pinned, not a system pattern)
The landing page carries an uppercase 13px label above each section heading (gold sprig, a two-digit Gold Ink numeral, Deep Current text, 0.08em tracking), plus an unnumbered one over the hero headline. The user pinned these for this page on 8 Oct 2026. They are recorded so the page can be maintained; they are not a pattern for new surfaces, which should open on the heading itself.

### Motion
One easing for everything: `cubic-bezier(.22, 1, .36, 1)`. Blocks reveal by fading up 18px over 0.8s, staggered 0.09s per item (capped at seven); hero lines rise 14px over 0.9s, staggered 0.08s; industry slides exit in 0.18s and enter in 0.38s, 28px sideways; counts tick up once on first view. Reveal is only armed when JavaScript adds the `anim` class, so content is visible without it. Under `prefers-reduced-motion: reduce`, every loop (sun, clouds, turbines, reeds, birds, glints, current, ripples, rings) stops, the river and its beads render fully drawn and lit, reveals and icon draws are instant, and smooth scrolling is off.

### Member pages (added 10 Oct 2026)
Built from the approved "QuintaEarth member pages" canvas; styles in `src/styles/members.css`, parts in `src/components/members/`. Their `ms-*` icons live in one static sprite, `public/icons/members.svg`, which `Icon.astro` references (`<use href="/icons/members.svg#ms-name">`) so the browser fetches and caches it once instead of every page inlining it.
- **Member tokens** (in `tokens.css`, each passing the WCAG ratio it is used for on white): Ink 2 `#3d4a3f` secondary text (9.3:1); Placeholder `#5f6f60` (5.3:1); Field Line `#7a957a` borders of inputs, selects, textareas and the upload box (3.3:1, WCAG 1.4.11); ID Line `#c9d3c8` the Identity checked outline; Live Wash `#e3ecd9` and Live Ink `#3f5c31` the live pill; Quiet Wash `#eef1ee` draft pills; Danger `#b3261e` remove, delete and errors (6.5:1) with Danger Line `#e3c4c1` around a quiet destructive button. No other literal colours in member styles.
- **State marks keep 3:1:** a step not reached is a dashed Field Line pebble with a Reed Ink icon; a done step is filled Gold Ink `#8a6a1c` with a white tick (5:1); an unmet requirement icon is Muted.
- **Dashboard shell:** page head, then a 216px left nav of pill links beside the content. The current item has a Shallow fill and a gold icon (gold means selected), drawn in Gold Ink so it holds 4.3:1 on Shallow. Admins also get an "Identity checks" item linking to `/admin`. Sign out is the nav's last item, under a hairline on desktop. At 900px and below the nav becomes a sideways-scrolling strip of outlined pills that opens scrolled to the current pill and fades at any edge that hides more; sign out stays as the strip's last pill.
- **Account button:** signed in, the header shows a 44px initials circle (Shallow fill, River Green outline, Literata initials) linking to the dashboard; signed out, a "Sign in" text link. "Directory" sits after Industries in the main nav.
- **Avatar:** people use the stone (initials in Literata on Shallow, or the photo); companies use the round mark (logo, or a storefront icon). Sizes 118, 64 and 48px.
- **Identity checked:** see the Don'ts; 32px pill, 28px in lists.
- **Status pills:** Live (pale reed with a gold dot), Draft (cool grey), In review (white with a hairline).
- **Chip pickers:** multi-selects are checkbox chips; a checked chip takes the Shallow fill. They work without JavaScript.
- **Uploads:** a dashed 1.5px Field Line box with an upload icon and the accepted types, above hairline file rows (type tile, name, size, remove).
- **Lists:** hairline rows whose title link covers the whole row; inbox is two panes with a gold dot on new threads, stacking on phone.
- **Admin table:** bordered, scrolls sideways on small screens.
- **Hit areas:** breadcrumb links and chips are 44px tall on member pages.
- **Directory filters (15 Oct 2026):** the bar shows the type segment, Industry, Country and Identity checked; the rarer company filters sit behind one "More filters (n)" disclosure (hidden for People). Each chosen filter chip carries its own remove ×. A pick by pointer applies at once; keyboard users move through the radios freely and apply with Enter or "Show results" (WCAG 3.2.2). At 640px and below the whole set sits behind one "Filters (n)" button that opens a full-screen sheet (Clear / Show results, Escape closes, focus returns). Proof on cards reads "N evidence file(s)" in River Green with the paperclip; on the company header the evidence count is a River Green text link, so Identity checked stays the only trust pill.
- **Gated actions:** where an action needs an account (an enquiry), the signed-out page offers two doors: "Join free to send" (go button) and "Sign in" (text link), both carrying `next`.
- **Sent state:** after an email link is sent, the stone shows the address, "Not there? Check spam, or send it again." and an outlined "Send it again"; if the short-lived note has expired, the form returns with "That page timed out. Enter your email again." Go buttons show a pending label and refuse a second submit while waiting.

### Member pages, "the spring" (added 11 Oct 2026)
The member screens were redesigned on the "QuintaEarth member pages · the spring" canvas and ported on 11 Oct 2026. The account doors (`/join`, `/signin`, `/welcome`; `src/layouts/Account.astro`, `src/styles/members/spring.css`) are a full-screen split: a photo of people doing the work on the left under a Forest Deep wash, the brand line in Literata and a gold sub-line, a mist river that draws itself down to a gold spring; the form on white on the right beside its own river rail. The dashboard, enquiries, profile editor, public pages and the directory keep the site header and the dashboard shell and carry the rail in their body (`src/styles/members/dashboard.css`, `enquiries.css`, `profile-editor.css`, `company.css`, `person.css`, `directory.css`).
- **The rail's one rule.** A bead is a 12px white disc with a 2px River Green ring, 24px column, 20px gap to the content. It lights gold (Bead Gold fill and ring, scale 1.15, one gold ring sent outward) only for something completed: a form step whose fields are valid, a profile section that is filled in, a dashboard part that is live, the newest message in a thread. Never on hover, never on scroll position, never as decoration; a page with nothing to complete has no rail (the directory) or an unlit rail (the public person page). The 3px Water track between beads fills River Green only between two lit beads, animated with `transform: scaleY` from the top, never `height`. Lit state is set in the markup so it is right without JavaScript and in a background tab; script only adds the ring animation and live updates.
- **Beads work without JavaScript:** the server renders the lit state; `Account.astro` and the editors update it on `input`/`change`.
- **Account doors on phone:** the photo becomes a short band (about 120 to 140px) that keeps the brand line, so the first field is one short scroll away.
- **Identity checked** keeps its neutral grey pill with the words visible on every surface, cards included (see the Don'ts).
- **Proof leads:** evidence counts sit in the company header meta and evidence rows stay open on listing cards; the one word is "evidence".

### New pages start from the spring (12 Oct 2026)
The first builds of /services and /terms used the plain inner-page pattern (`src/layouts/Page.astro`: pale-sky `PageHead`, white body) and were rejected for not being the same product as /join and /signin, the second time this happened. So the spring is now a shared layer, and every new page gets it by default:
- **`src/styles/spring-core.css`** holds the pieces: the scene (`.qe-scene`: photo under the Forest Deep wash, `.qe-wash`, the mist river `.qe-river` that draws itself to a gold spring, `.qe-foot` with the Literata `.say` and the gold `.sub`), the rail (`.qe-grid`, `.qe-rail` with `.bead`, `.track` and `.fill`), the go button (`.qe-btn`) and their keyframes. `members/spring.css` (the account doors) and `spring-page.css` (public pages) both import it and only size it; nothing is copied.
- **`src/components/spring/`**: `SpringScene.astro` (the scene; the account doors use it as the left half of their split, public pages as the band under the site header), `RiverRail.astro` (the two-column grid; with `arrive`, the default on public pages, each bead lights gold as its section is reached and the track above it fills from the bead before, so the river is always drawn between two lit beads) and `Bead.astro` (one stop: the rail cell with its bead and the track to the next; `last` ends the river, `lit` renders it lit).
- **`src/layouts/Spring.astro`**: site header and footer, the scene as a band (its spring moved to sit exactly above the rail's first bead, the brand line starting on the content column), then on white a breadcrumb (`Home › Page`), the h1, and the page's own stops. Props: `title`, `scene`, `sceneAlt`, `scenePos`, `say`, `sub`, optional `lede`. The h1 on white is the page's name ("Services", "Terms of use"), the statement on the photo is the brand or positioning line, and the gold line is one short fact ("Every claim linked to its evidence", "Last updated 12 October 2026").
- **The scene's subject is people doing the work**, on every spring page including the legal ones (owner decision, 12 Oct 2026; no landscape exception): /services a chemist over a rack of samples (`scene-services`), /terms a carpenter marking a plank (`scene-terms`), /privacy a grain warehouse with a worker (`scene-privacy`), /contact a farm worker walking the paddy path toward the camera (`scene-contact`); the doors use the fisherman casting a net (`scene-join`), the workshop technician (`scene-signin`, shared with its magic-link page, the same door) and the beekeeper (`scene-welcome`). The scene takes a photo by name (see Photographs below); its focal point is the default `scenePos`, and a page overrides it only when the people need to sit higher above the wash.
- **Band sizes:** `clamp(380px, 46vh, 560px)` on desktop (414px at 1440x900, so the first stop's door is inside the first screen), 360px at 1100 and below, 220px at 640 and below. The statement on a band runs to 24ch (the doors' runs to 14ch); the phone band keeps the 22px statement and the river's last bend.
- **Which layout:** `Spring.astro` for every public page with the site header (/services, /terms, /privacy, /contact, and every page to come: it opens on the photo and the river); `Account.astro` for a form with steps and no site header (/join, /signin, /welcome); `Dashboard.astro` / `Member.astro` for member screens, which carry the rail in their body. **`Page.astro` is not to be used for new pages.** Every public page is on the spring as of 13 Oct 2026.
- **Beads on public pages mark arrival, on member pages completion.** A public page has nothing to complete, so its beads light as the reader reaches each section (the home page's rule) and the lit state does not depend on the script: without JavaScript, or under reduced motion, the rail renders fully drawn and lit. On member pages a bead lights only for something completed (the rail's one rule above).
- **A form on a public page (/contact, 12 Oct 2026):** the doors' form is part of the core, so a public page can carry it: `.qe-form` with a `.qe-grid` of `.qe-rail[data-for]` + `.qe-step` pairs (the 50px pill field, select and textarea, the 52px go button at the last bead, the `.qe-sent` stone for the sent state), the fields themselves from `styles/fields.css` (shared with members.css). Its beads mark completion, as on the doors: on /contact one bead per group (your company, who to reach, what you need, send), lit from the form's own rules in `scripts/partner-form.ts`, so a bead never lights beside a value the form would reject; without JavaScript the rail is unlit. The direct ways (email, the WhatsApp community) are two text links under the h1, and the form head ("Partner with us", or "Ask for a proposal" with the offer named when a /services door sent the reader) sits above the rail the way the doors' h1 does.
- **The door:** on /services each offer ends in a door (`.sp-door`): a pill with a stone (a 48px white circle, 2px River Green ring, the arrow inside) and the label "Ask for a proposal" (the free listing's reads "Join free"). On hover the stone fills River Green, the arrow nudges, the pill lifts. It is the only action on an offer; the page closes on the solid go button beside the email link.
- **The footer's bead:** the newsletter line opens with a 12px bead ringed in Mist (the river pale on deep). When a subscription is saved it fills Lantern Gold, scales 1.15 and sends one ring out (`.news.lit`), the river's last arrival; typing a new address puts it back at rest. The form, its action and its states are otherwise unchanged.

### Photographs (12 Oct 2026)
Site photographs live in Cloudflare R2 and reach the page through `<Media name="…" sizes="…" />` (`src/components/Media.astro`: a responsive `<img>` with the photo's own alt and focal point; `src/lib/media.ts` has `mediaUrl` and `mediaSrcset` for the share image and the industries stage). The scene layouts (`Spring.astro`, `Account.astro`) take the name as `scene`.
- **One photo, one subject, never reused.** A name is wired to one slot; the only repeats are the same subject in two places (`about-spread` on the home spread and /about, `scene-signin` on /signin and its link page). Before adding a page, add its own photo.
- **Adding a photo:** put an entry in `scripts/media/sources.json` (name = the slot, Unsplash id, alt, focal as object-position, credit: photographer, profile, photo URL, Unsplash License), then `node scripts/media/build-media.mjs --local` (and `--remote` for dev and prod). It cuts the WebP widths, uploads them and writes `src/data/media.json`. Add the credit to CREDITS.md.
- **Minimum widths:** scene bands and the about spread 2400px, the account doors 2000px, frames (industries, offers, article heros, the pond) 1600px, stones 1000px.
- **Subject and crop:** people doing the work, candid, no masks, logos or readable text; set the focal so the subject holds every crop the slot uses (circle, 5:4 blob, 16:10 card, 3:1 band under the wash) and, on scene bands, so the people sit above the wash.
- **Loading:** scene and hero photos `loading="eager" fetchpriority="high"`; everything else lazy. On-demand pages never use Astro's `<Image>` (the Worker does not serve `/_image`); `<Media>` works everywhere.

## Do's and Don'ts

### Do:
- **Do** keep River Green as the only action colour; buttons, links, outlines and focus rings are all river.
- **Do** use gold only for arrival and selection, and set any gold text in Gold Ink on light or Lantern Gold on Forest Deep.
- **Do** set headings in Literata 400 and every count in Literata tabular figures.
- **Do** keep controls as full pills and furniture as outlined circles; photographs in 12px frames.
- **Do** keep content clear of the river lane at every breakpoint (34px in at 1179px, 22px at 640px).
- **Do** start every new public page from `src/layouts/Spring.astro` (the scene, then the page beside its river rail); never from the plain `Page.astro` pattern.
- **Do** use Material Symbols Rounded (weight 400, filled) for content icons, with the `hi-*` symbol ids and a `m-*` hover motion per icon; keep the filled UI set only for arrows, carets, menu and social marks.
- **Do** give every interactive element a 44px minimum hit area and the 2px River Green focus ring.
- **Do** stop all loops and draw the river complete under reduced motion.

### Don't:
- **Don't** use orange or any warm accent other than gold (user decision, 8 Oct 2026).
- **Don't** set text in Bead Gold (#b8912f); it fails contrast on white.
- **Don't** add a "verified" badge, seal or home-made certification mark (open EmpCo risk; user decision, 8 Oct 2026). The one trust label is **Identity checked** (decided 10 Oct 2026): a neutral grey outlined pill with the badge icon, never green or gold, never worded as a green claim. It says who a company is, nothing about its products.
- **Don't** show prices anywhere on the site; they come only in the written proposal. "Ask for a proposal" is the one action on an offer (owner decision, 12 Oct 2026, reversing the 8 Oct note against the button).
- **Don't** split the landing page's five parts into separate sections; they live together in one section (user decision, 8 Oct 2026).
- **Don't** add new section fills; white, sky (hero only) and one Forest Deep band are the full set.
- **Don't** use neutral black or hard-offset shadows, or shadows at rest.
- **Don't** add new uppercase section labels on new surfaces; the numbered labels are pinned to this landing page only.
