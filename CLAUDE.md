# Hotel Zarea — site for buyers and investors

**This repo is the deployment.** GitHub Pages serves `main` at <https://cara9876.github.io/app-proprietati-publice/>;
`git push` = deploy. The root is the Zarea investor site. `catalog/` is the earlier public-property catalogue
prototype, kept as a backup and still served at <https://cara9876.github.io/app-proprietati-publice/catalog/>
(its own `catalog/CLAUDE.md` applies inside it; git tag `catalog-v1-backup` and branch `catalog-backup` hold the
state before the move). The standalone copy at `~/Projects/hotel-zarea` is retired; work here.

Static single-page site (HTML/CSS/JS, no build) presenting the privatisation of Hotel Zarea, Chișinău, to a
business audience. English first; the data file is the only thing to edit when dates or prices change.
Read `README.md` for structure. This file holds the rules.

## Run and verify

```bash
python3 -m http.server 8766 --directory /Users/leo/Projects/app-proprietati-publice   # or preview_start name "zarea"
node tools/shoot.js http://localhost:8766/ shots/desktop.png 1440 900 16000
node tools/shoot.js http://localhost:8766/ shots/mobile.png 390 844 18000
node tools/shoot.js http://localhost:8766/ shots/at-1400.png 1440 900 6000 14000 1400   # viewport only, scrolled to 1400 px
```

- The Browser pane stops WebGL when hidden, so the map looks blank there. Always verify with `tools/shoot.js`
  (headless Chrome via CDP, scrolls the page so lazy images and the map load) and look at the captures.
- After any visible change: capture, look, then say it is done.

## Design rules (agreed with Leo, 10 Sep 2026)

1. **Four Seasons register (since 10 Sep 2026, v2).** Leo's boss found fourseasons.com/residences "sexy"; Whiteley
   and Sobha were the other references. The skin: ivory `#F7F5F0` ground, warm charcoal `#1E1C19`, champagne
   `#B9A176` for hairlines, the monogram and small marks only (never gold text or gold buttons); **Bodoni Moda**
   (Google Fonts, latin-ext) for the hero title in tracked capitals, section titles, big numbers and document
   titles; **Onest** for body and for the tracked 11 px small capitals used on nav, buttons, labels, eyebrows.
   Bodoni Moda is set at **weight 500 with the optical-size axis pinned to 22** (`--serif-opsz`, `font-optical-sizing:
   none`): at the display optical size its hairlines vanish and Leo found it unreadable. Keep that on every serif use.
   **Logo** (from the boss, 10 Sep 2026): burgundy `#700112` + gold `#D2A13D` wordmark with a building mark.
   Source `assets/img/src-logo.png` (flat ivory background); `logo-full*.png` are alpha-cut by the script in the
   session notes (background noise floor 16, ramp to 72, edges un-blended). `logo-full-light` swaps burgundy for
   ivory and is the header logo over the hero; the burgundy one appears once the header turns solid and in the
   footer. `logo-mark` is the building alone (favicon, touch icon). Site gold is `#C4A056`, tuned toward the logo.
   Burgundy is used nowhere else on the page.
   Rectangular buttons, no pills, no rounded corners, no shadows except under the slider frame. Section eyebrows
   with champagne hairlines, centred on single-column sections. Red and navy are gone. No countdown anywhere.
   Page rhythm: ivory, dark charcoal break (compare), ivory, ivory + map, deeper ivory (operations), warm charcoal
   (the sale) with the terms on ivory, ivory (documents), dark (viewings), ivory footer with a champagne rule.
   "Three directions" are **Whiteley-style image panels** (4:5, serif title over the image, concept label, one gold
   tracked line of floor allocation, one paragraph). Leo rejected the earlier card version as "Claude made": no
   stats rows, no bars, no Keeps/Needs, no bordered boxes there. The Lagmar-style v1 is at tag `zarea-v1-lagmar`.
   Motion (unchanged): the hero is a slow loop of the four renders opening on the dusk render (8 s each, 2 s
   cross-fade, Ken Burns alternating), fixed header transparent over the hero then ivory after 40 px, a 2 px
   champagne scroll-progress line, staggered hero entrance, hairline nav underline. All gated by reduced-motion.
2. **No invented facts.** Every figure comes from `assets/docs/` or app.gov.md; `data/site.json` carries `verifiedAt`.
   Time-sensitive items (price, deadline, auction) are rendered from the data file, never hard-coded twice.
3. **Concept images must be labelled** "Architectural concept. Not an approved project." Leo delivered four renders on
   10 Sep 2026 (`assets/img/src-concept-*`); the day render is the hero, the slider has two switchable pairs
   (approach, entrance), the three direction columns use the dusk, entrance and aerial renders. Brief and status in
   `docs/concept-image-brief.md`.
4. **The map is the real 3D MapLibre map** ported from `~/Projects/app-proprietati-publice` (`js/map.js`):
   OpenFreeMap positron basemap. The Zarea tower and the institutions (Parliament, Presidency, Government House,
   National Bank, Ministry of Finance, City Hall, MFA, Constitutional Court, World Bank, Cathedral, Arch) are
   **baked outlines in `data/landmarks.geojson`**, fetched once from OpenStreetMap on 10 Sep 2026. No live Overpass
   call at runtime (it hung for Leo). The camera fits those buildings with bearing 205 so the hotel sits low in the
   frame and the government quarter is "up". Investors care about institutions, not ASEM or the Pushkin museum.
5. **Hero must be dark.** The boss liked the old hero because the photo was subdued. Keep the strong left and bottom
   shade + desaturation so the white serif reads and the facade recedes.
6. PDFs are linked as files. Never embed them.
7. **Published** on GitHub Pages since 10 Sep 2026 (see top). Every push to `main` goes live within a minute; verify
   on the live URL with `tools/shoot.js` after pushing. Old catalogue stays reachable at `/catalog/`.
8. **Backups.** Tag `zarea-v1-lagmar` (+ branch `zarea-v1-lagmar-backup`) = the Lagmar-style v1 as published on
   10 Sep 2026, before the upscale restyle. To return to it: `git checkout main && git reset --hard zarea-v1-lagmar`
   (or `git revert` the restyle commits) and push.

## Feedback round from Regina Mogorean (10 Sep 2026), all applied
- Numerals were too thin → serif numerals at weight 600, optical size 16 (`--serif-num`); titles 500 / opsz 20.
- The shelter (IGSU) and Premier Energy conditions are stated **before the price** in their own short section
  `.section.attached` ("Two things stay as they are") between the operations and the sale: centred serif title on
  one line, quiet sub-line, the two conditions in two left-aligned columns each opening with a short gold mark.
  Leo rejected a numbered split layout there as "too many lines"; keep it rule-free.
- Her English copy replaced ours in: property, compare, directions lead, location, operations, documents, hero lead
  ("right in the heart of Chișinău").
- A room must be visible → the old prospect's room photograph (`src-room.webp`, 576×768) sits under the figures
  with the entrance photo, labelled "Photograph, 2026". A room *concept* render would allow a third slider pair.
- How to apply was unclear → step 2 and three terms rows now say: on paper at the agency (no online channel),
  Annex 1 form, attachments, and the two treasury IBANs from the Gazette notice p. 67 (in `data/site.json`).

## Feedback round from Leo (11 Sep 2026), applied
- "Don't shock right away": the concept comes before the reality. The `.wrap today` block ("What a buyer sees
  today") was pulled out of the `.section.property` and made its own `.section.today-section` **after** the dark
  `.compare-section` ("Ready for what comes next"). Order is now property intro → compare (vision) → today (photos)
  → directions. `today-section` is in the `padding-top` exception list; it sits on deeper ivory (`--civic`); the
  `.today` block's old within-section divider (margin-top / padding-top / gold `border-top`) was dropped.

## Known gotchas
- `setField` sets `textContent` on the element carrying `data-field`; never put it on a `dd` that also holds a
  `<small>` child, or the child is wiped. Wrap the text in a `span` instead.

- The header is `position: fixed`; sections use `scroll-margin-top: 72px`; the mobile nav is fixed at 64 px.
- `.section + .section` removes top padding (specificity 0,2,0). Sections that need it back must be selected as
  `.section.operating` etc., or the rule silently wins. `.compare-section` is a dark break and keeps full padding.
- Contacts (two phones, two emails) are verified against the Official Gazette notice p. 2 (`comunicat-mo-261-264`).
- The hero headline has `ready <br>for`; the break is hidden below 600 px, so the space before it matters.
- The compare slider clips the "after" side with `clip-path`; anything inside it is clipped too.
