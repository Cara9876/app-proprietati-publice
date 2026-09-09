# APP · Proprietăți publice — machetă funcțională

Catalog map-first al activelor publice oferite mediului privat (Agenția Proprietății Publice).
Direcție: **disciplina Zillow, pielea MUD** — hartă reală, carduri cu preț, fișă de tip investment showcase,
totul construit pe tokenii și componentele oficiale MUD (HG 677/2025).

## Rulare

```bash
cd ~/Projects/app-proprietati-publice && python3 -m http.server 8765
```

Apoi deschide <http://localhost:8765/>. Nu există build, backend sau chei API.

| Rută | Ce arată |
|---|---|
| `#/` | Acasă: hero cu căutare, active în procedură, trei căi de participare, terenuri anunțate |
| `#/cauta?q=…&tranzactie=…&tip=…&pret=…&deschise=1&sort=…` | Căutare: filtre sticky, hartă MapLibre cu pinuri-preț și clustere, listă sincronizată, „Caută în această zonă” |
| `#/activ/hotelul-zarea` | Fișa-pilot: galerie, rail cu preț/EUR/countdown, facts, hartă 3D, financiar, condiții, timeline, documente |
| `#/activ/<slug>` | Fișă generică pentru activele fără fotografie (hartă în loc de galerie) |
| `#/calendar`, `#/cum-participi` | Pagini editoriale |

**Live:** <https://cara9876.github.io/app-proprietati-publice/> (GitHub Pages, din ramura `main`; orice `git push` republică). Toate fișierele locale sunt publicate, inclusiv documentele APP (decizie Leo, 10 sept 2026). Ca să le ascunzi pe host, pune `PUBLIC_HOST = true` în `js/app.js` și adaugă-le în `.gitignore`.

## Structură

```
index.html            shell: pre-header MUD, header, footer
css/app.css           strat de aplicație (prefix ap-); tokenii vin din vendor/mud
js/app.js             router hash, randare, hartă, thumbnails derivate din hartă
data/properties.json  14 active reale de pe app.gov.md (geocodate; câmpul `precision` spune cât de exactă e poziția)
assets/photos/        fotografii Zarea (3 din vechea machetă; setul complet vine de la Leo)
assets/docs/          cele 7 documente reale ale procedurii Zarea (din ~/Downloads/zarea)
vendor/mud/           egov-moldova/design-system @ dab645a: main.css, fonturi Onest, sprite, logo Guvern
tools/shoot.js        capturi de ecran headless (node tools/shoot.js <folder>) — așteaptă hărțile
_old/appmockup.html   macheta anterioară, păstrată pentru comparație
```

## Surse de adevăr pentru Zarea

Toate cifrele din fișă vin din `~/Downloads/zarea`: Nota informativă APP (profil, finanțe 2021–2025, condiții speciale, cronologie, condițiile licitației), extrasul din raportul de evaluare MOLDAUDITING nr. 1532.1/26.05.2026 (102 965 000 lei prin cost; 20 848 000 lei prin DCF), Ordinul APP nr. 208/11.06.2026 și comunicatul din MO nr. 261-264/19.06.2026 (taxe, acont, loc: str. Vasile Alecsandri 78). Termenele actuale (19/20 oct 2026) sunt cele prelungite prin comunicatul APP din 14.08.2026. Condiția „păstrarea profilului 5 ani” din Ordin se aplică la Știința și Lumina, nu la Zarea.

## Decizii de design

- **MUD real, nu „MUD-like”**: Onest, `--blue-sky-600` ca unic accent, `--gray-250` pentru linii, raze 8/16, umbrele MUD, `status-tag`, `mud-btn`, `chip`, banda guvernamentală. Tot ce e custom stă în `css/app.css`.
- **Hartă**: MapLibre GL 5 + OpenFreeMap „positron” (vector, gratuit, fără cheie). Pinurile comunică *preț* unde există, *suprafață* unde nu; conturul întrerupt = poziție la nivel de localitate. Clustering manual (14 puncte).
- **Fără randări false**: activele fără fotografie primesc un thumbnail derivat din hartă, etichetat ca atare.
- **Harta 3D a fișei**: clădirile sunt colorate după înălțime (OSM `render_height`), clădirea activului e în albastru (aleasă după numărul de niveluri din fișă, nu doar după punctul geocodat), fiecare clădire e clicabilă și deschide un popup cu înălțimea estimată. Reperele de referință din fișă (`ZAREA.pois`: BNM, ASEM, Casa-Muzeu Pușkin, Arcul de Triumf, Gara, Aeroportul) sunt potrivite după nume cu clădirile din **OpenStreetMap** (Overpass, rază 450 m) și își primesc conturul real de acolo, colorate pe categorie, cu o etichetă mică fiecare și legendă generată; activul are eticheta mare. Fără listă de referință, harta colorează toate reperele OSM din cele 5 categorii. Pentru punctele fără contur se colorează clădirea din tile care le conține. Răspunsul Overpass e ținut în sessionStorage; dacă API-ul nu răspunde, se folosește lista de rezervă din `ZAREA.pois`. Google Places ar merge la fel, dar cere cheie cu facturare și nu permite afișarea datelor pe altă hartă decât Google. Galeria deschide un lightbox.
- **Suprafețe „sleek”**: fără contur gri de 1 px + inel de umbră. Cardurile, rail-ul, panourile și popup-urile folosesc `--ap-edge` (fir de 7% negru) și umbrele difuze `--ap-sh-1/2`; hover-ul adâncește umbra, nu închide marginea.
- **Adevăr la nivel de câmp**: EUR cu curs BNM și dată, „de confirmat prin document primar” acolo unde brief-ul nu are sursă, condițiile (adăpost, servitute) marcate „de verificat în due diligence”.

## De făcut (următoarea rundă)

- Set de iconițe coerent (brief mai jos), pentru tipuri de activ și proceduri.
- Poligoane cadastrale reale pentru Zarea (amprentă + teren) pe harta 3D; azi conturul vine din OSM.
- Pagina „Contul meu” / expresie de interes ca formular MUD.
- RU/EN: comutatorul e decorativ; textele stau în `L` (js/app.js) și în `data/properties.json`.

## Brief iconițe (pentru ChatGPT / designer)

Stil: grilă 24×24, contur 1,75 px, colțuri și capete rotunjite, fără umplere, culoare `currentColor`, geometrie
simplă în spiritul Lucide; livrare SVG optimizat, un fișier per iconiță, `viewBox="0 0 24 24"`.

Set 1 — tipuri de activ (8): hotel, întreprindere industrială, clădire administrativă, teren pentru construcții,
teren agricol, depozit / hală, spațiu comercial, infrastructură (rețele / drum).

Set 2 — proceduri (4): licitație cu strigare (ciocan), concurs investițional (plan + clădire), vânzare directă
(contract), locațiune / concesiune (cheie).

Set 3 — UI (8): pin hartă, cluster, document PDF, calendar cu termen, vizită programată (ușă + ceas),
expresie de interes (mână ridicată / plic), notificare, verificat (scut cu bifă).
