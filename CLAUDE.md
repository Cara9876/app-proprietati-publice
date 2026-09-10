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

1. **Lagmar register, civic content.** Bold grotesk (Onest 800 uppercase hero, 700 headings), big photographs,
   plain large numbers. Palette: paper white, civic off-white `#F4F5F2`, graphite `#1B2125`, the red of the
   existing sign `#C8292F` as the only accent. No gold, no serif, no gradients except photo shades; cards only where Lagmar has them (the three directions).
   Like Lagmar, the page alternates: white sections, two dark graphite "breaks" (compare, visit), one off-white
   section (operating figures) and one **deep navy** section (`#0F1E3A`, the transaction). Leo asked for the breaks
   and for a third colour explicitly. The three directions are **Lagmar-style cards** (rounded 18 px, image with title
   overlay, stats row, floor-allocation bar, Keeps/Needs) because Leo asked for "these cards" from lagmar.md.
   Motion: the hero is a slow loop of the four renders (8 s each, 1.8 s cross-fade, Ken Burns drift alternating
   direction, starts 2.6 s after load, pauses when hidden or scrolled away) as the stand-in for Lagmar's video;
   fixed header that floats transparent over the hero and turns solid after 40 px, a 3 px red scroll-progress
   line at the very top, staggered hero entrance, sliding nav underline. All gated by prefers-reduced-motion.
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
5. **Hero must be dark.** The building is ugly up close; the boss liked the old hero because the photo was subdued.
   Keep the strong shade + desaturation on the hero image so the white type reads and the facade recedes.
6. PDFs are linked as files. Never embed them.
7. **Published** on GitHub Pages since 10 Sep 2026 (see top). Every push to `main` goes live within a minute; verify
   on the live URL with `tools/shoot.js` after pushing. Old catalogue stays reachable at `/catalog/`.
8. **Backups.** Tag `zarea-v1-lagmar` (+ branch `zarea-v1-lagmar-backup`) = the Lagmar-style v1 as published on
   10 Sep 2026, before the upscale restyle. To return to it: `git checkout main && git reset --hard zarea-v1-lagmar`
   (or `git revert` the restyle commits) and push.

## Known gotchas

- The header is `position: fixed`; sections use `scroll-margin-top: 72px`; the mobile nav is fixed at 64 px.
- `.section + .section` removes top padding (specificity 0,2,0). Sections that need it back must be selected as
  `.section.operating` etc., or the rule silently wins. `.compare-section` is a dark break and keeps full padding.
- Contacts (two phones, two emails) are verified against the Official Gazette notice p. 2 (`comunicat-mo-261-264`).
- The hero headline has `ready <br>for`; the break is hidden below 600 px, so the space before it matters.
- The floor-use stacks in "Three credible directions" are rendered from `data-stack="office:4,hotel:8"` (ground floor first).
- The compare slider clips the "after" side with `clip-path`; anything inside it is clipped too.
