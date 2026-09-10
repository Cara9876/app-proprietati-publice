# Hotel Zarea — privatisation site

Live at <https://cara9876.github.io/app-proprietati-publice/> (GitHub Pages from `main`). The earlier catalogue
prototype lives in `catalog/` and stays online at `/catalog/`.

Single-page static site presenting Hotel Zarea (Chișinău) to buyers and investors. No build step.

- `index.html` — the page. Copy lives here; figures, dates, documents and contacts come from `data/site.json`.
- `data/site.json` — **the only file to edit for time-sensitive data.** Update `verifiedAt` after checking app.gov.md.
- `css/site.css`, `js/site.js` (rendering, slider, countdown), `js/map.js` (3D MapLibre map ported from app-proprietati-publice).
- `assets/img/src-*` are the source photos; `python3 tools/images.py` regenerates the AVIF/WebP/JPEG sets.
- `assets/docs/` — the official PDFs, linked as files (never embedded).

Run: `python3 -m http.server 8766` then open http://localhost:8766/.
Screenshots: `node tools/shoot.js http://localhost:8766/ shots/desktop.png 1440 900 15000`.
