# APP · Proprietăți publice — instrucțiuni pentru Claude

Machetă funcțională (HTML/CSS/JS static, fără build) a platformei Agenției Proprietății Publice:
catalog map-first al activelor publice oferite mediului privat, cu Hotelul „Zarea” ca activ-pilot.
Leo o arată unor oameni reali din administrație. **Credibilitatea e produsul**: date reale, hărți reale,
sistem de design real. Citește `README.md` pentru structură și surse; aici sunt regulile de lucru.

## Rulare și verificare

```bash
python3 -m http.server 8765        # din acest folder → http://localhost:8765/
node tools/shoot.js <dir> [base] [filtru-nume]   # capturi headless după ce hărțile s-au încărcat
```

- Browser pane-ul din Claude desktop **oprește WebGL când e ascuns** → hărțile par goale acolo. Verifică
  întotdeauna cu `tools/shoot.js` (Chrome headless prin DevTools Protocol) și uită-te la capturi.
- Fișa Zarea are nevoie de ~14 s până răspunde Overpass; `shoot.js` știe asta.
- După orice schimbare vizibilă: captură → privește → abia apoi spune că e gata.

## Publicare

Live: <https://cara9876.github.io/app-proprietati-publice/> — GitHub Pages din `main`. `git push` = deploy.
Repo public `Cara9876/app-proprietati-publice`. Leo a decis (10 sept 2026) să publice **tot**, inclusiv
documentele APP din `assets/docs/`. Dacă vrea să le ascundă: `PUBLIC_HOST = true` în `js/app.js` + `.gitignore`.

## Reguli de design (Leo le-a impus explicit)

1. **MUD real, nu „MUD-like”.** Tokenii și componentele vin din `vendor/mud/main.css` (egov-moldova/design-system
   @ dab645a): Onest, `--blue-sky-600` ca unic accent, `status-tag`, `mud-btn`, `chip`, pre-header. Nu inventa
   fonturi sau hex-uri. Tot ce e custom stă în `css/app.css` cu prefix `ap-`.
2. **Disciplina Zillow.** Search-first, split hartă/listă cu pinuri-preț, fișă cu galerie mozaic + rail sticky.
   Leo a respins o machetă anterioară ca „AI slop” (font display generic, hartă SVG desenată, carduri placeholder,
   tab-bar de prototip). Nu reveni la asta.
3. **Fără carduri-șablon cu iconițe în pătrate colorate, margini colorate laterale, pastile „de verificat”.**
   Excepție acceptată de Leo: cardurile „Trei moduri de a participa” (le-a vrut înapoi).
4. **Suprafețe sleek:** fără border 1 px + inel de umbră. Folosește `--ap-edge` (hairline 7 %) și `--ap-sh-1/2`;
   hover-ul adâncește umbra, nu închide marginea.
5. **Fără date inventate.** Fiecare cifră din fișa Zarea are sursă în `~/Downloads/zarea/` (PDF-urile APP) — vezi
   README „Surse de adevăr”. Ce nu e în document se marchează „de confirmat” sau nu apare. Nu desena randări false;
   activele fără foto primesc thumbnail din hartă, etichetat.
6. **Reperele de pe harta 3D vin din OpenStreetMap**, alese de lista de referință `ZAREA.pois` și potrivite după
   nume (`matchRef`). Nu plasa clădiri manual. Zarea = etichetă mare, reperele = etichete mici.

## Capcane tehnice deja rezolvate (nu le reintroduce)

- **Z-fighting 3D:** straturile evidențiate au contur decalat 0,4 m (`offsetRing`) și +0,4 m înălțime, opace;
  stratul de bază are opacitate 0,55.
- **Hover pe MultiPolygon:** OpenMapTiles unește clădiri mici; `partAt` coboară pe ecran cel mult cât înălțimea
  proiectată a clădirii. Un scan fix (140 px) aprindea clădiri de departe.
- **`.lmap > div { inset:0 }`** a acoperit odată harta cu legenda — țintește `#locmap`, nu `div`.
- **Grid-uri cu `1fr`** depășeau pe mobil → folosește `minmax(0, 1fr)`.
- **Punctul geocodat al Zarea** cade pe anexa joasă; clădirea se alege după `levels` (12 → ~36 m), nu după punct.
- MapLibre e încărcat din cdnjs cu SRI; dacă schimbi versiunea, recalculează hash-urile.

## Ce urmează (stare la 10 sept 2026)

- Fotografiile Zarea le trimite Leo (nu extrage din PDF-uri — a cerut explicit să nu). Se pun în
  `assets/photos/` + intrări în `data/properties.json`; galeria suportă orice număr (1+4 + lightbox).
- Set de iconițe: brief în README, Leo îl generează cu ChatGPT.
- Poligoane cadastrale reale pentru Zarea; RU/EN reale; formular EOI pe componente MUD.
- De confirmat cu APP: ora licitației (10:00 din comunicatul de prelungire vs. 10:30 din Ordin).

## Model de lucru

Leo e orchestrat de Claude ca „orchestrator, vizionar și designer”. Subagenți: Haiku pentru scouting, Opus doar
pentru lucru greu, niciodată Fable (regulă globală). Prezintă direcția în câteva rânduri, ia un „da”, apoi construiește
și verifică cu capturi. Memoria persistentă a proiectului: `~/.claude/projects/-Users-leo/memory/app-proprietati-publice.md`;
hub Obsidian: `~/Projects/second-brain/Projects/APP-Proprietati-Publice.md`.
