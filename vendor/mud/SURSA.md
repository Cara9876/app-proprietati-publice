# Sursa fișierelor MUD din acest folder

Repo: https://github.com/egov-moldova/design-system
Commit: dab645ac1bc9bb637caeccb9837f33d683326ec7
Data commit-ului: 2026-07-16
Data vendorării: 2026-08-03

Repo-ul lor nu are release-uri versionate. Fără acest pin nu se poate spune
de la ce am pornit.

## Ce s-a modificat față de original

- `main.css`: s-au șters blocurile `@font-face` (Onest și JetBrainsMono).
  Fonturile sunt declarate în `fonts.css`, subsetate și în woff2. Unul dintre
  `@font-face`-urile lor era oricum rupt: greutatea 300 trimitea către
  `OnestExtraLight1602-hint.woff`, fișier care nu există în repo.
- `sprite1.svg` → `public/assets/icons/sprite.svg`. Markup-ul lor referă
  `assets/icons/sprite.svg`, dar fișierul livrat are alt nume.
- Fonturile Onest: subsetate la glifele folosite și convertite din
  `.woff`/`.ttf` în woff2. Maparea greutăților lor e păstrată neschimbată.
- Fonturile subsetate stau în `src/styles/mud/fonts/`, nu în `public/assets/fonts/`.
  Cu `base: './'` din `vite.config.ts`, o cale absolută (`/assets/...`) s-ar
  rupe într-un subfolder, iar `public/` nu trece prin procesarea Vite —
  fișierele de-acolo nu primesc amprentă și nu li se rescriu căile. Stând în
  `src/`, Vite le procesează și emite URL-uri relative corecte în CSS-ul
  compilat. Sprite-ul și logourile rămân în `public/assets/`, referite din
  JSX la runtime cu căi relative (`./assets/...`), nu din CSS.

## Cum se actualizează

Se schimbă commit-ul de mai sus, se repetă pașii din Sarcina 1 a planului
`docs/superpowers/plans/2026-08-03-mud-migration.md`, apoi `npm run check:mud`.
