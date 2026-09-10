# Concept images — status

**Delivered 10 Sep 2026** by Leo (four renders in `~/Downloads/Zarea/Concepte-renovare/`, copied to
`assets/img/src-concept-*.png`): day approach (hero + "The approach" pair), entrance (the "The entrance" pair and
the offices-below column), dusk (renewed hotel column), aerial at sunset (mixed-use column).
Every placement carries an "Architectural concept" label; the hero carries "not an approved project".

The original brief is kept below for future renders.

---

# Concept image brief — Hotel Zarea renovation study

Purpose: the right-hand side of the "As it stands, and as it could stand" slider on the site. It must read as a
credible architectural concept of **this** building on **this** forecourt, not a new building.

## Edit target

Use `assets/img/src-entrance.webp` (2400 × 1600) as the base image and keep the camera, framing and crop exactly.
The slider compares the two images pixel for pixel, so anything that moves (trees, camera angle, horizon) breaks the effect.

## Keep

- The 12-storey tower massing, its proportions, the window rhythm and the blank stair-core wall on the right.
- The walnut canopy of leaves at the top of the frame and the mature trees on the right.
- The forecourt, the low single-storey entrance annex, the neighbouring buildings glimpsed at left, the parked cars.
- Chișinău summer daylight, the same sun direction.

## Change

- **Facade**: replace the pink render and grey concrete with durable mineral cladding (light stone-coloured or pale
  brick-toned panels, matte), contemporary aluminium windows in the existing openings, restrained dark metalwork.
- **Entrance**: remove the polycarbonate canopy and the truss walkway entirely. Replace with a low, flat, contemporary
  entrance canopy in dark metal or concrete, level with the annex roof, no more than 3 m deep.
- **Ground floor**: full-height glazing along the annex, so the café and lobby are visible from the forecourt.
- **Access**: a gently graded paved approach integrated into the landscaping, no separate steel ramp, no handrail clutter.
- **Forecourt**: coherent large-format paving, a few planted beds, two or three slim light poles, a bench. Remove the
  air-conditioning units, cables, signage boards and the "no smoking" stickers.
- **Signage**: a small, flat "Zarea" in dark lettering beside the entrance only. **No rooftop lettering, no red
  canopy sign, no hotel-chain logo.**
- A few believable people at the entrance and one or two cars, nothing more.

## Do not

- No boulevard, plaza, skyline, extra storeys, curtain wall, gold, palace materials, tropical planting or night scene.
- Do not brighten or "clean" the trees; the greenery is the building's best feature and must stay as photographed.

## Delivery

One image, same 3:2 ratio, at least 2400 px wide, PNG or high-quality WebP. Save it as `assets/img/src-concept.png`,
add a `'concept': ('src-concept.png', [2400, 1600, 1000, 640])` line to `tools/images.py`, run it, and point the
`#compare-after` picture in `index.html` at the `concept-*` files. Remove the `.compare__pending` paragraph.
