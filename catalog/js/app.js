/* APP · Proprietăți publice — aplicație de prezentare (machetă funcțională)
   Rute: #/  #/cauta?…  #/activ/:slug  #/cum-participi  #/calendar
   Hartă: MapLibre GL + OpenFreeMap (positron). Fără chei, fără backend. */
(function () {
  'use strict';

  const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
  // Pe hostingul public, documentele interne APP nu se servesc: apar ca disponibile în data room.
  // Setează pe true dacă documentele interne nu trebuie servite de pe hosting (apar ca „Data room · la cerere”).
  const PUBLIC_HOST = false;
  const app = document.getElementById('app');
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const h = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const L = {
    transaction: { licitatie: 'Licitație cu strigare', concurs: 'Concurs investițional', vanzare: 'Vânzare', locatiune: 'Locațiune' },
    transactionShort: { licitatie: 'Licitație', concurs: 'Concurs', vanzare: 'Vânzare', locatiune: 'Locațiune' },
    type: { hotel: 'Hotel', industrial: 'Întreprindere', teren: 'Teren', cladire: 'Clădire' },
    status: {
      deschis: ['success', 'Deschis'],
      prelungit: ['success', 'Deschis · termen prelungit'],
      anuntat: ['info', 'Anunțat'],
      evaluare: ['warning', 'În evaluare'],
      adjudecat: ['muted', 'Adjudecat'],
    },
    precision: { adresa: 'Adresă exactă', 'adresa-verificare': 'Adresă de verificat', localitate: 'Precizie: localitate' },
  };

  const nf = { format: (n) => new Intl.NumberFormat('ro-MD').format(n).replace(/\./g, '\u202f') }; // spațiu îngust ca separator de mii
  const fmtMDL = (n) => nf.format(n) + ' MDL';
  const fmtEUR = (n, rate) => nf.format(Math.round(n / rate / 10000) / 100) + ' mil. EUR';
  const trim = (x, d) => { const s = x.toFixed(d); return s.replace(/\.?0+$/, '').replace('.', ','); };
  const shortPrice = (n) => n >= 1e6 ? trim(n / 1e6, n >= 1e8 ? 0 : 1) + ' mil.' : trim(n / 1e3, 0) + ' mii';
  const fmtHa = (x) => trim(x, x < 1 ? 3 : 2) + ' ha';
  const fmtM2 = (x) => nf.format(Math.round(x)) + ' m²';
  const MONTHS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sept', 'oct', 'nov', 'dec'];
  const fmtDate = (iso, withTime) => {
    const d = new Date(iso);
    const s = d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    return withTime ? s + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : s;
  };
  const daysUntil = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 864e5));
  const km = (a, b) => { const R = 6371, dLat = (b[1] - a[1]) * Math.PI / 180, dLng = (b[0] - a[0]) * Math.PI / 180, s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };

  const ICON = {
    pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    warn: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5"/><path d="M12 17h.01"/></svg>',
    gavel: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6"/><path d="m4 14 6 6"/><path d="m9 9 6 6"/><path d="m3 21 8-8"/><path d="M12 6l6 6"/></svg>',
    invest: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 20V10l7-6 7 6v10"/><path d="M9 20v-6h6v6"/></svg>',
    key: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7"/><path d="m16 7 3 3"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    share: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/></svg>',
    save: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/></svg>',
  };

  // Detalii curate pentru activul-pilot. Sursa: profil investițional APP (iun 2026) + app.gov.md.
  const ZAREA = {
    facts: [
      ['Adresă', 'str. Anton Pann 4, Chișinău', 'MD-2005 · sectorul Rîșcani'],
      ['IDNO', '1003600080200'],
      ['Teren aferent', '0,3111 ha', 'nr. cadastral 0100418216 · proprietar Republica Moldova'],
      ['Construcție', 'nr. cadastral 0100418.216.01', 'amprentă 1 135,3 m² în documentul de drept'],
      ['Suprafață interioară', '6 506,8 m²', 'utilizată la evaluare · 6 123,7 m² în profilul investițional'],
      ['Niveluri', '12', 'clădire construită în 1981'],
      ['Camere', '137', '3 lux · 29 semi-lux · 42 triple · 62 duble · 1 apartament'],
      ['Facilități', 'sală de conferințe 30 locuri · cafenea 50 locuri'],
      ['Întreprinderea', 'înființată în 1992', 'capital social 4 105 967 lei · 18 angajați'],
      ['Autorizație de funcționare', 'nr. 10a/07 din 20.02.2007'],
      ['Datorii pe termen lung', '0 lei', 'la 31.12.2024 și 31.12.2025'],
      ['Cea mai bună utilizare (evaluator)', 'comercial / administrativ', 'diferită de utilizarea hotelieră curentă'],
    ],
    // Notă informativă APP, tabelul „Situația financiară 2021–2025” (mii lei; înnoptări în număr)
    fin: {
      years: [2021, 2022, 2023, 2024, 2025],
      revenue: [2719, 8430, 7407, 9521, 9750],
      profit: [-1085.5, 326.2, 7.812, 197, 29],
      stays: [18598, 59454, 42523, 48112, 50552],
      equity: [2503, 2855, 2857, 3051, 3131],
      currentDebt: [1565, 1877, 2147, 2431, 2535],
    },
    valuation: [
      ['Abordarea prin cost (activ net ajustat)', '102 965 000 lei', '≈ 5 211 000 EUR · valoarea reținută'],
      ['Abordarea prin venit (DCF)', '20 848 000 lei', '≈ 1 055 000 EUR · doar analitic'],
      ['Preț inițial stabilit de Comisie', '106 000 000 lei', 'peste valoarea evaluată, ca marjă la riscul valutar'],
    ],
    conditions: [
      ['Adăpost de protecție civilă', '520 m² · 400 persoane · dat în exploatare 30.06.1981', 'Bun al domeniului public, inalienabil, exclus din evaluare și din privatizare. Cumpărătorul îl păstrează și îl exploatează, inclusiv la construcție, reconstrucție sau modernizare; lucrările se coordonează cu IGSU.', [['Temei', 'Legea 271/1994 · Legea 29/2018 art. 9 · HG 1012/2023'], ['Sursă', 'Notă informativă APP · Ordinul nr. 208/2026 · comunicat MO 261-264']]],
      ['Servitute de trecere pentru postul de transformare', 'construcția 0100418.216.02 · 0,0260 ha', 'Transformatorul de pe teren este proprietatea Î.C.S. „Premier Energy”. Cumpărătorul asigură accesul și trecerea pentru exploatare și întreținere. Evaluarea terenului a ținut cont de construcție și de servitute.', [['Temei', 'Legea 164/2025 privind energia electrică, art. 135'], ['Sursă', 'Notă informativă APP · comunicat MO 261-264']]],
    ],
    timeline: [
      ['2023-12-29', 'Recomandată pentru privatizare imediată', 'Comisia de triere, PV nr. 2: categoria 4.', 'done'],
      ['2024-05-01', 'Inclusă în lista bunurilor supuse privatizării', 'HG 345/2024 modifică anexa 2 la HG 945.', 'done'],
      ['2026-05-25', 'Evaluarea complexului patrimonial', 'MOLDAUDITING S.R.L., 1 mar – 25 mai 2026; valoare de piață 102 965 000 lei la 31.12.2025.', 'done'],
      ['2026-06-04', 'Comisia stabilește prețul și condițiile', 'PV nr. 2: preț inițial 106 000 000 lei, adăpost și transformator ca condiții speciale.', 'done'],
      ['2026-06-11', 'Ordinul APP nr. 208: expunere la licitație', 'Licitația fixată pentru 20 aug 2026, cereri până la 19 aug.', 'done'],
      ['2026-06-19', 'Comunicat în Monitorul Oficial nr. 261-264', 'Condițiile de participare, taxa și acontul.', 'done'],
      ['2026-08-14', 'Termen prelungit', 'APP extinde perioada de depunere a cererilor pentru cele 4 companii.', 'done'],
      ['2026-10-19T12:00', 'Termen depunere cereri', 'Cerere, documentele din comunicat, acontul de 10% și taxa de participare achitate.', 'next'],
      ['2026-10-20T10:00', 'Licitație cu strigare', 'Sediul APP, str. Vasile Alecsandri 78, et. 4, bir. 402, Chișinău.', ''],
    ],
    steps: [
      ['Taxă de participare', '6 000 lei persoane juridice și străine · 1 500 lei persoane fizice din RM'],
      ['Acont', '10% din prețul inițial: 10 600 000 lei, inclus în preț pentru câștigător'],
      ['Plata', 'integral, în 20 de zile de la procesul-verbal al licitației'],
      ['Contract', 'în 7 zile după plată, după avizul Consiliului Concurenței'],
      ['Retragere', 'cererea poate fi retrasă cu cel puțin 3 zile lucrătoare înainte, cu restituirea acontului'],
    ],
    docs: [
      ['Profil investițional Hotel „Zarea”', 'APP / Invest Moldova · 2026 · EN · 4 pagini', 'PDF · 11,5 MB', 'assets/docs/profil-investitional-zarea-en.pdf'],
      ['Comunicat informativ, Monitorul Oficial nr. 261-264', 'Monitorul Oficial · 19 iun 2026 · RO · 2 pagini', 'PDF · 0,4 MB', 'assets/docs/comunicat-mo-261-264-2026-06-19.pdf'],
      ['Ordinul APP nr. 208 privind expunerea la licitație', 'APP · 11 iun 2026 · RO · 2 pagini', 'PDF · 0,9 MB', 'assets/docs/ordin-app-208-2026-06-11.pdf', true],
      ['Notă informativă: privatizarea prin licitație cu strigare', 'APP · 2026 · RO · 3 pagini', 'PDF · 0,3 MB', 'assets/docs/nota-informativa-zarea.pdf', true],
      ['Extras din raportul de evaluare nr. 1532.1', 'MOLDAUDITING S.R.L. · 26 mai 2026 · RO · 4 pagini', 'PDF · 0,2 MB', 'assets/docs/extras-raport-evaluare-zarea.pdf', true],
      ['Procesul-verbal nr. 2 al Comisiei de licitație', 'APP · 4 iun 2026 · RO · 6 pagini, scanat', 'PDF · 4,4 MB', 'assets/docs/pv-2-comisie-2026-06-04.pdf', true],
      ['Raportul de evaluare complet, cu anexe', 'MOLDAUDITING S.R.L. · 27 mai 2026 · RO · 276 pagini', 'PDF · 11,6 MB', 'assets/docs/raport-evaluare-complet-2026-05-27.pdf', true],
    ],
    // [nume, lng, lat, culoare pentru clădire] — reperele cu culoare se colorează pe harta 3D
    pois: [
      ['Banca Națională a Moldovei', 28.8381, 47.0292, '#D92D20'],
      ['ASEM', 28.8365, 47.0302, '#039855'],
      ['Casa-Muzeu „A.S. Pușkin”', 28.8367, 47.0317, '#7E37F9'],
      ['Arcul de Triumf · Piața Marii Adunări Naționale', 28.8326, 47.0247],
      ['Gara feroviară Chișinău', 28.8598, 47.0128],
      ['Aeroportul Internațional Chișinău', 28.9376, 46.9296],
    ],
  };

  let DATA = null;
  let META = null;
  let ITEMS = [];
  let currentMap = null;
  let locMap = null;
  let cleanup = [];

  /* ---------------- thumbnails derivate din hartă ---------------- */
  const thumbs = { cache: {}, queue: [], map: null, busy: false };
  function thumbInit() {
    if (thumbs.map || !window.maplibregl) return;
    const el = document.createElement('div'); el.id = 'thumbgen'; document.body.appendChild(el);
    thumbs.map = new maplibregl.Map({ container: el, style: STYLE_URL, center: [28.83, 47.02], zoom: 12, interactive: false, attributionControl: false, preserveDrawingBuffer: true, fadeDuration: 0 });
    thumbs.map.once('load', thumbNext);
  }
  function thumbRequest(item) {
    if (!item || item.photos.length) return;
    if (thumbs.cache[item.id]) { thumbApply(item.id); return; }
    if (!thumbs.queue.find((i) => i.id === item.id)) thumbs.queue.push(item);
    thumbInit();
    if (thumbs.map && thumbs.map.loaded()) thumbNext();
  }
  function thumbNext() {
    if (thumbs.busy || !thumbs.queue.length || !thumbs.map) return;
    const item = thumbs.queue.shift();
    thumbs.busy = true;
    thumbs.map.jumpTo({ center: [item.lng, item.lat], zoom: item.precision === 'localitate' ? 12.5 : 15.6 });
    thumbs.map.once('idle', () => {
      try { thumbs.cache[item.id] = thumbs.map.getCanvas().toDataURL('image/jpeg', 0.82); thumbApply(item.id); } catch (e) { /* canvas tainted/unsupported */ }
      thumbs.busy = false; setTimeout(thumbNext, 30);
    });
  }
  function thumbApply(id) {
    const url = thumbs.cache[id]; if (!url) return;
    $$('[data-thumb="' + id + '"]').forEach((el) => { el.style.backgroundImage = 'url(' + url + ')'; el.classList.remove('thumb--pending'); });
  }

  /* ---------------- componente ---------------- */
  function statusTag(item, small) {
    const [kind, label] = L.status[item.status] || L.status.anuntat;
    const txt = item.transaction === 'concurs' && item.status === 'deschis' ? 'Concurs deschis' : label;
    return '<span class="status-tag status-tag--' + kind + ' is-subtle' + (small ? ' status-tag--small' : '') + '"><i class="dot"></i>' + h(txt) + '</span>';
  }
  function mediaHTML(item, cls) {
    if (item.photos.length) {
      const p = item.photos[0];
      return '<img src="' + h(p.src) + '" alt="' + h(p.alt) + '" loading="lazy">' + (cls === 'card' ? '<span class="pcard__kind">Fotografie curentă</span>' : '');
    }
    return '<div class="thumb thumb--pending" data-thumb="' + h(item.id) + '" role="img" aria-label="Amplasament pe hartă, fără fotografie"></div>' + (cls === 'card' ? '<span class="pcard__kind">Amplasament · ' + h(item.precision === 'localitate' ? 'precizie localitate' : 'fără fotografie') + '</span>' : '');
  }
  function priceHTML(item, cls) {
    if (item.price) return '<div class="' + cls + '">' + h(fmtMDL(item.price)) + (item.priceNote ? '<small>+ investiții</small>' : '') + '</div>';
    return '<div class="' + cls + ' ' + cls + '--na">Preț conform raportului de evaluare</div>';
  }
  function cardHTML(item) {
    const meta = [];
    if (item.area) meta.push('<span><b>' + h(fmtM2(item.area)) + '</b> utili</span>');
    if (item.land) meta.push('<span><b>' + h(fmtHa(item.land)) + '</b> teren</span>');
    if (item.rooms) meta.push('<span><b>' + item.rooms + '</b> camere</span>');
    if (item.deadline) meta.push('<span>Termen <b>' + h(fmtDate(item.deadline)) + '</b></span>');
    return '<a class="pcard" href="#/activ/' + h(item.slug) + '" data-id="' + h(item.id) + '">' +
      '<div class="pcard__media">' + mediaHTML(item, 'card') + '<div class="pcard__tag">' + statusTag(item, true) + '</div></div>' +
      '<div class="pcard__body">' + priceHTML(item, 'pcard__price') +
      '<div class="pcard__name">' + h(item.name) + '</div>' +
      '<div class="pcard__addr">' + h(item.address) + ' · ' + h(item.locality) + ' · ' + h(L.transactionShort[item.transaction]) + '</div>' +
      (meta.length ? '<div class="pcard__meta">' + meta.join('') + '</div>' : '') +
      '</div></a>';
  }
  function afterRenderCards(root) { $$('.pcard', root).forEach((c) => thumbRequest(ITEMS.find((i) => i.id === c.dataset.id))); }

  /* ---------------- ACASĂ ---------------- */
  function renderHome() {
    const open = ITEMS.filter((i) => i.deadline).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const next = open[0];
    const localities = new Set(ITEMS.map((i) => i.locality.split(',')[0]));
    const zarea = ITEMS.find((i) => i.id === 'zarea');
    app.innerHTML =
      '<section class="hero">' +
        '<div class="hero__media"><img src="' + zarea.photos[0].src + '" alt="" fetchpriority="high"></div>' +
        '<div class="ap-container hero__in">' +
          '<p class="hero__eyebrow">Agenția Proprietății Publice · catalog oficial</p>' +
          '<h1 class="hero__title">Proprietăți publice, deschise investitorilor.</h1>' +
          '<p class="hero__sub">Hoteluri, întreprinderi, terenuri și clădiri ale statului, propuse spre privatizare, vânzare sau locațiune. Cu documente, termene și condiții la vedere.</p>' +
          '<form class="search" role="search" data-search>' +
            '<label class="search__field"><span class="sr-only">Caută</span>' + ICON.pin + '<input class="search__input" name="q" type="search" placeholder="Localitate, adresă sau tip de activ" autocomplete="off"></label>' +
            '<button class="mud-btn mud-btn-primary mud-btn-lg search__btn" type="submit">' + ICON.search + ' Caută</button>' +
          '</form>' +
          '<div class="hero__chips">' +
            '<a class="chip" href="#/cauta?deschise=1">Licitații deschise</a>' +
            '<a class="chip" href="#/cauta?tip=teren">Terenuri</a>' +
            '<a class="chip" href="#/cauta?tip=cladire">Clădiri</a>' +
            '<a class="chip" href="#/cauta?tranzactie=locatiune">Locațiune</a>' +
            '<a class="chip" href="#/cauta?q=Chi%C8%99in%C4%83u">Chișinău</a>' +
          '</div>' +
        '</div>' +
        '<p class="hero__caption">Hotelul „Zarea”, Chișinău · fotografie curentă</p>' +
      '</section>' +
      '<div class="strip"><div class="ap-container strip__in">' +
        '<div class="strip__item"><b>' + ITEMS.length + '</b><span>active publicate</span></div>' +
        '<div class="strip__item"><b>' + localities.size + '</b><span>localități</span></div>' +
        '<div class="strip__item"><b>' + h(fmtDate(next.deadline)) + '</b><span>următorul termen · ' + h(next.name) + '</span></div>' +
        '<div class="strip__item"><b>' + h(fmtDate(META.verified)) + '</b><span>date verificate · sursa app.gov.md</span></div>' +
      '</div></div>' +
      '<section class="section"><div class="ap-container">' +
        '<div class="section__head"><div><h2 class="section__title">În procedură acum</h2><p class="section__lead">Active cu termen de depunere a cererilor deschis. Ordonate după cel mai apropiat termen.</p></div><a class="section__link" href="#/cauta?deschise=1">Vezi toate pe hartă ' + ICON.arrow + '</a></div>' +
        '<div class="cards" data-cards>' + open.slice(0, 4).map(cardHTML).join('') + '</div>' +
      '</div></section>' +
      '<section class="section section--alt"><div class="ap-container">' +
        '<div class="section__head"><div><h2 class="section__title">Trei moduri de a participa</h2><p class="section__lead">Fiecare activ are o singură procedură, stabilită prin actul de expunere. Pașii și documentele diferă.</p></div></div>' +
        pathsHTML() +
      '</div></section>' +
      '<section class="section"><div class="ap-container">' +
        '<div class="section__head"><div><h2 class="section__title">Terenuri și clădiri anunțate</h2><p class="section__lead">Loturi și imobile pentru care raportul de evaluare și prețul se publică în perioada următoare. Poți cere notificare.</p></div><a class="section__link" href="#/cauta?tip=teren">Toate terenurile ' + ICON.arrow + '</a></div>' +
        '<div class="cards" data-cards>' + ITEMS.filter((i) => !i.deadline).slice(0, 4).map(cardHTML).join('') + '</div>' +
      '</div></section>';
    $('[data-search]').addEventListener('submit', (e) => { e.preventDefault(); const q = e.target.q.value.trim(); location.hash = '#/cauta' + (q ? '?q=' + encodeURIComponent(q) : ''); });
    afterRenderCards(app);
  }
  function pathsHTML() {
    return '<div class="paths">' +
      '<article class="path"><div class="path__icon">' + ICON.gavel + '</div><h3>Licitație cu strigare</h3><p>Prețul pornește de la valoarea evaluată și crește prin strigări. Câștigă oferta cea mai mare.</p><ul class="path__steps"><li>Depui cererea și garanția de participare până la termen</li><li>Primești confirmarea înscrierii</li><li>Participi la ședință, la sediul APP</li></ul><a href="#/cauta?tranzactie=licitatie">Active în licitație ' + ICON.arrow + '</a></article>' +
      '<article class="path"><div class="path__icon">' + ICON.invest + '</div><h3>Concurs investițional</h3><p>Contează prețul și planul de investiții. Cumpărătorul își asumă obligații pe mai mulți ani.</p><ul class="path__steps"><li>Studiezi caietul de sarcini și data room-ul</li><li>Depui oferta tehnică și financiară</li><li>Comisia evaluează și negociază</li></ul><a href="#/cauta?tranzactie=concurs">Concursuri deschise ' + ICON.arrow + '</a></article>' +
      '<article class="path"><div class="path__icon">' + ICON.key + '</div><h3>Locațiune și concesiune</h3><p>Folosești activul fără să îl cumperi. Chirie sau redevență pe o perioadă stabilită.</p><ul class="path__steps"><li>Verifici destinația permisă</li><li>Depui oferta de chirie</li><li>Semnezi contractul cu administratorul</li></ul><a href="#/cauta?tranzactie=locatiune">Oferte de locațiune ' + ICON.arrow + '</a></article>' +
    '</div>';
  }

  /* ---------------- CĂUTARE ---------------- */
  function parseQuery(qs) { const p = new URLSearchParams(qs || ''); return { q: p.get('q') || '', tranzactie: p.get('tranzactie') || '', tip: p.get('tip') || '', pret: p.get('pret') || '', deschise: p.get('deschise') === '1', sort: p.get('sort') || 'termen' }; }
  function writeQuery(s) {
    const p = new URLSearchParams();
    if (s.q) p.set('q', s.q); if (s.tranzactie) p.set('tranzactie', s.tranzactie); if (s.tip) p.set('tip', s.tip); if (s.pret) p.set('pret', s.pret); if (s.deschise) p.set('deschise', '1'); if (s.sort !== 'termen') p.set('sort', s.sort);
    const qs = p.toString(); history.replaceState(null, '', '#/cauta' + (qs ? '?' + qs : ''));
  }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function applyFilters(s, bounds) {
    let r = ITEMS.slice();
    if (s.q) { const q = norm(s.q); r = r.filter((i) => norm([i.name, i.official || '', i.locality, i.address, i.typeLabel, L.transaction[i.transaction]].join(' ')).includes(q)); }
    if (s.tranzactie) r = r.filter((i) => i.transaction === s.tranzactie);
    if (s.tip) r = r.filter((i) => i.type === s.tip);
    if (s.deschise) r = r.filter((i) => i.deadline);
    if (s.pret) {
      const [lo, hi] = s.pret.split('-').map((x) => x === '' ? null : Number(x));
      r = r.filter((i) => i.price != null && (lo == null || i.price >= lo) && (hi == null || i.price < hi));
    }
    if (bounds) r = r.filter((i) => bounds.contains([i.lng, i.lat]));
    const sorters = {
      termen: (a, b) => (a.deadline ? new Date(a.deadline) : 8.64e15) - (b.deadline ? new Date(b.deadline) : 8.64e15),
      'pret-desc': (a, b) => (b.price || -1) - (a.price || -1),
      'pret-asc': (a, b) => (a.price || Infinity) - (b.price || Infinity),
      nume: (a, b) => a.name.localeCompare(b.name, 'ro'),
    };
    return r.sort(sorters[s.sort] || sorters.termen);
  }
  function renderSearch(qs) {
    const state = parseQuery(qs);
    let bounds = null;
    let markers = [];
    let popup = null;
    let programmatic = false;
    let mapReady = false;
    const optSel = (name, opts, val) => '<label class="fsel' + (val ? ' is-set' : '') + '"><span class="sr-only">' + name + '</span><select name="' + name + '">' + opts.map(([v, t]) => '<option value="' + v + '"' + (v === val ? ' selected' : '') + '>' + h(t) + '</option>').join('') + '</select></label>';
    app.innerHTML =
      '<div class="srch" data-srch>' +
        '<div class="filters"><form class="ap-container filters__in" data-filters>' +
          '<label class="filters__search">' + ICON.search + '<input name="q" type="search" placeholder="Localitate, adresă, denumire" value="' + h(state.q) + '" autocomplete="off"><span class="sr-only">Caută</span></label>' +
          optSel('tranzactie', [['', 'Tranzacție'], ['licitatie', 'Licitație cu strigare'], ['concurs', 'Concurs investițional'], ['vanzare', 'Vânzare'], ['locatiune', 'Locațiune']], state.tranzactie) +
          optSel('tip', [['', 'Tip activ'], ['hotel', 'Hotel'], ['industrial', 'Întreprindere'], ['cladire', 'Clădire'], ['teren', 'Teren']], state.tip) +
          optSel('pret', [['', 'Preț'], ['-1000000', 'sub 1 mil. MDL'], ['1000000-10000000', '1 – 10 mil. MDL'], ['10000000-200000000', '10 – 200 mil. MDL'], ['200000000-', 'peste 200 mil. MDL']], state.pret) +
          '<label class="ftoggle"><input type="checkbox" name="deschise"' + (state.deschise ? ' checked' : '') + '> Termen deschis</label>' +
          '<span class="filters__spacer"></span>' +
          '<span class="filters__count" data-count hidden></span>' +
          optSel('sort', [['termen', 'Termen'], ['pret-desc', 'Preț descrescător'], ['pret-asc', 'Preț crescător'], ['nume', 'Denumire']], state.sort) +
          '<button class="filters__reset" type="button" data-reset>Resetează</button>' +
        '</form></div>' +
        '<div class="ap-container srch__wrap"><div class="srch__body">' +
          '<div class="srch__map"><div id="map" role="region" aria-label="Hartă cu proprietățile din rezultate"></div>' +
            '<button class="map-redo" type="button" data-redo>' + ICON.search + ' Caută în această zonă</button>' +
            '<div class="map-legend"><span><i class="is-price"></i>preț inițial, MDL</span><span><i class="is-area"></i>suprafață, preț în evaluare</span><span><i class="is-precision"></i>amplasament la nivel de localitate</span></div>' +
          '</div>' +
          '<div class="srch__list" data-list><div class="srch__listhead"><div><h1 data-title>Proprietăți publice</h1><p data-sub></p></div></div><div class="srch__grid" data-grid></div></div>' +
        '</div></div>' +
        '<button class="mud-btn mud-btn-primary srch__toggle" type="button" data-toggle>' + ICON.pin + ' Hartă</button>' +
      '</div>';

    const srch = $('[data-srch]'), form = $('[data-filters]'), grid = $('[data-grid]'), redo = $('[data-redo]');
    let results = [];

    function renderList() {
      results = applyFilters(state, bounds);
      const n = results.length;
      $('[data-count]').textContent = n + (n === 1 ? ' rezultat' : ' rezultate');
      const locs = Array.from(new Set(results.map((i) => i.locality.split(',')[0])));
      $('[data-title]').textContent = state.q ? 'Rezultate pentru „' + state.q + '”' : state.tip ? L.type[state.tip] + (state.tip === 'teren' ? 'uri' : state.tip === 'cladire' ? ' administrative' : ' — active publice') : 'Proprietăți publice';
      $('[data-sub]').textContent = n ? n + (n === 1 ? ' activ' : ' active') + ' · ' + (locs.length <= 3 ? locs.join(', ') : locs.slice(0, 2).join(', ') + ' și alte ' + (locs.length - 2) + ' localități') + (bounds ? ' · în zona afișată' : '') : '';
      grid.innerHTML = n ? results.map(cardHTML).join('') : '<div class="srch__empty"><b>Niciun activ nu corespunde filtrelor.</b>Lărgește zona de pe hartă sau <button class="filters__reset" type="button" data-reset>resetează filtrele</button>.</div>';
      afterRenderCards(grid);
      $$('.pcard', grid).forEach((c) => {
        c.addEventListener('mouseenter', () => setActive(c.dataset.id, false));
        c.addEventListener('mouseleave', () => setActive(null, false));
      });
      $$('.fsel', form).forEach((f) => f.classList.toggle('is-set', !!f.querySelector('select').value && f.querySelector('select').name !== 'sort'));
      if (mapReady) drawMarkers();
    }
    function setActive(id, scroll) {
      $$('.pcard', grid).forEach((c) => c.classList.toggle('is-active', c.dataset.id === id));
      markers.forEach((m) => m.getElement().firstChild.classList.toggle('is-active', m._apId === id));
      if (id && scroll) { const c = grid.querySelector('[data-id="' + id + '"]'); if (c) c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    }
    function fitTo(items, opts) {
      if (!items.length) return;
      programmatic = true;
      if (items.length === 1) { currentMap.easeTo({ center: [items[0].lng, items[0].lat], zoom: Math.max(currentMap.getZoom(), 13), duration: 600 }); }
      else { const b = new maplibregl.LngLatBounds(); items.forEach((i) => b.extend([i.lng, i.lat])); currentMap.fitBounds(b, Object.assign({ padding: { top: 70, right: 60, bottom: 70, left: 60 }, maxZoom: 15, duration: 700 }, opts || {})); }
      currentMap.once('moveend', () => { programmatic = false; });
    }
    function drawMarkers() {
      markers.forEach((m) => m.remove()); markers = [];
      if (popup) { popup.remove(); popup = null; }
      const pts = results.map((i) => ({ i, p: currentMap.project([i.lng, i.lat]) }));
      const clusters = [];
      pts.forEach((pt) => {
        const c = clusters.find((cl) => Math.hypot(cl.p.x - pt.p.x, cl.p.y - pt.p.y) < 48);
        if (c) { c.items.push(pt.i); c.p = { x: (c.p.x * (c.items.length - 1) + pt.p.x) / c.items.length, y: (c.p.y * (c.items.length - 1) + pt.p.y) / c.items.length }; }
        else clusters.push({ items: [pt.i], p: { x: pt.p.x, y: pt.p.y } });
      });
      clusters.forEach((cl) => {
        const wrap = document.createElement('div');
        const el = document.createElement('button'); el.type = 'button'; wrap.appendChild(el);
        let lngLat;
        if (cl.items.length > 1) {
          el.className = 'mk mk--cluster'; el.textContent = cl.items.length + ' active';
          el.setAttribute('aria-label', cl.items.length + ' active în această zonă, apropiază');
          lngLat = currentMap.unproject([cl.p.x, cl.p.y]);
          el.addEventListener('click', () => fitTo(cl.items, { maxZoom: 16 }));
        } else {
          const i = cl.items[0];
          el.className = 'mk' + (i.price ? '' : ' mk--area') + (i.precision === 'localitate' ? ' mk--approx' : '');
          el.textContent = i.price ? shortPrice(i.price) : i.land ? fmtHa(i.land) : L.type[i.type];
          el.setAttribute('aria-label', i.name + ', ' + i.locality + (i.price ? ', ' + fmtMDL(i.price) : ''));
          lngLat = [i.lng, i.lat];
          el.addEventListener('mouseenter', () => setActive(i.id, true));
          el.addEventListener('mouseleave', () => setActive(null, false));
          el.addEventListener('click', (e) => { e.stopPropagation(); openPopup(i); });
        }
        const m = new maplibregl.Marker({ element: wrap, anchor: 'bottom', offset: [0, -6] }).setLngLat(lngLat).addTo(currentMap);
        m._apId = cl.items.length === 1 ? cl.items[0].id : null;
        markers.push(m);
      });
    }
    function openPopup(i) {
      if (popup) popup.remove();
      popup = new maplibregl.Popup({ offset: [0, -40], closeOnClick: true, maxWidth: '280px' })
        .setLngLat([i.lng, i.lat])
        .setHTML('<a class="pop" href="#/activ/' + h(i.slug) + '"><div class="pop__img">' + mediaHTML(i) + '</div><div class="pop__body">' + priceHTML(i, 'pop__price') + '<div class="pop__name">' + h(i.name) + '</div><div class="pop__addr">' + h(i.address) + ' · ' + h(i.locality) + '</div></div></a>')
        .addTo(currentMap);
      thumbRequest(i);
      setActive(i.id, true);
    }

    // hartă
    currentMap = new maplibregl.Map({ container: 'map', style: STYLE_URL, center: [28.6, 47.15], zoom: 6.4, attributionControl: { compact: true }, cooperativeGestures: false });
    currentMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    currentMap.on('load', () => { mapReady = true; renderList(); fitTo(results, { duration: 0 }); });
    currentMap.on('move', () => { if (mapReady) drawMarkers(); });
    currentMap.on('moveend', () => { if (!programmatic && mapReady) redo.classList.add('is-visible'); });
    redo.addEventListener('click', () => { bounds = currentMap.getBounds(); redo.classList.remove('is-visible'); renderList(); });
    cleanup.push(() => { currentMap.remove(); currentMap = null; });

    // filtre
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', (e) => {
      if (e.target.name === 'q') { state.q = e.target.value.trim(); }
      else if (e.target.name === 'deschise') state.deschise = e.target.checked;
      else state[e.target.name] = e.target.value;
      bounds = null; redo.classList.remove('is-visible');
      writeQuery(state); renderList(); if (mapReady && e.target.name !== 'sort') fitTo(results);
    });
    srch.addEventListener('click', (e) => {
      if (e.target.closest('[data-reset]')) { Object.assign(state, { q: '', tranzactie: '', tip: '', pret: '', deschise: false, sort: 'termen' }); form.reset(); form.q.value = ''; bounds = null; writeQuery(state); renderList(); if (mapReady) fitTo(results); }
      if (e.target.closest('[data-toggle]')) { srch.classList.toggle('srch--map'); const on = srch.classList.contains('srch--map'); $('[data-toggle]').innerHTML = on ? ICON.search + ' Listă' : ICON.pin + ' Hartă'; if (on) setTimeout(() => currentMap.resize(), 50); }
    });
    renderList();
  }

  /* ---------------- FIȘĂ ACTIV ---------------- */
  function renderListing(slug) {
    const item = ITEMS.find((i) => i.slug === slug);
    if (!item) { renderNotFound(); return; }
    const isZ = item.id === 'zarea';
    const Z = ZAREA;
    const similar = ITEMS.filter((i) => i.id !== item.id && (i.transaction === item.transaction || i.type === item.type)).slice(0, 4);
    const galleryHTML = item.photos.length >= 3
      ? '<div class="gallery' + (item.photos.length >= 5 ? ' gallery--5' : '') + '">' + item.photos.slice(0, item.photos.length >= 5 ? 5 : 3).map((p, k) => '<figure><img src="' + h(p.src) + '" alt="' + h(p.alt) + '"' + (k ? ' loading="lazy"' : '') + '><figcaption>' + h(p.caption) + '</figcaption></figure>').join('') + '<button class="mud-btn mud-btn-outline-primary mud-btn-md gallery__more" type="button" style="background:#fff">Toate fotografiile (' + item.photos.length + ')</button></div>'
      : '<div class="gallery gallery--map"><div class="lmap" style="margin:0;border:0;border-radius:0"><div id="locmap"></div></div><p class="gallery__note">Fără fotografie publicată. Amplasament orientativ · ' + h(L.precision[item.precision]) + '</p></div>';
    const keyfacts = isZ
      ? [['137', 'camere'], ['6 507 m²', 'suprafață interioară'], ['12', 'niveluri'], ['0,31 ha', 'teren aferent']]
      : [[item.land ? fmtHa(item.land) : item.area ? fmtM2(item.area) : '—', item.land ? 'teren' : 'suprafață'], [L.type[item.type], 'tip activ'], [L.transactionShort[item.transaction], 'procedură'], [item.deadline ? fmtDate(item.deadline) : 'urmează', 'termen cereri']];
    const railDeadline = item.deadline
      ? '<div class="rail__dead"><b>' + daysUntil(item.deadline) + '<small>zile</small></b><p>până la termenul de depunere<span>' + h(fmtDate(item.deadline, true)) + ' · ora Chișinăului</span></p></div>'
      : '<div class="rail__dead"><b>—<small>termen</small></b><p>Procedura nu a fost încă lansată<span>Cere notificare când se publică raportul de evaluare</span></p></div>';
    app.innerHTML =
      '<article class="lst"><div class="ap-container">' +
        '<div class="lst__top"><nav class="crumbs" aria-label="Poziție"><a href="#/">Acasă</a><span>/</span><a href="#/cauta">Proprietăți</a><span>/</span><a href="#/cauta?q=' + encodeURIComponent(item.locality.split(',')[0]) + '">' + h(item.locality) + '</a><span>/</span><span>' + h(item.name) + '</span></nav>' +
          '<div class="lst__actions"><button class="mud-btn mud-btn-outline-primary" type="button">' + ICON.save + ' Salvează</button><button class="mud-btn mud-btn-outline-primary" type="button" data-share>' + ICON.share + ' Trimite</button></div></div>' +
        galleryHTML +
        '<div class="lst__grid"><div class="lst__main">' +
          '<header class="lst__head">' +
            '<div class="lst__tags">' + statusTag(item) + '<span class="status-tag status-tag--neutral is-subtle">' + h(L.transaction[item.transaction]) + '</span><span class="status-tag status-tag--neutral is-subtle">' + h(item.typeLabel) + '</span></div>' +
            '<h1 class="lst__title">' + h(item.name) + '</h1>' +
            '<p class="lst__addr">' + h(item.address) + ', ' + h(item.locality) + '</p>' +
            '<div class="lst__ids">' + (item.official ? '<span>Denumire oficială <b>' + h(item.official) + '</b></span>' : '') + (item.idno ? '<span>IDNO <b class="mono">' + h(item.idno) + '</b></span>' : '') + (item.cadastralLand ? '<span>Nr. cadastral teren <b class="mono">' + h(item.cadastralLand) + '</b></span>' : '<span>Nr. cadastral <b>în raportul de evaluare</b></span>') + '<span>Verificat <b>' + h(fmtDate(META.verified)) + '</b></span></div>' +
          '</header>' +
          '<div class="keyfacts">' + keyfacts.map(([b, s]) => '<div><b>' + h(b) + '</b><span>' + h(s) + '</span></div>').join('') + '</div>' +
          '<section class="blk"><h2 class="blk__title">Despre activ</h2><p class="blk__lead">' + h(item.summary) + '</p>' +
            (isZ ? '<div class="facts">' + Z.facts.map(([k, v, s]) => '<div><span class="k">' + h(k) + '</span><span class="v">' + h(v) + (s ? '<small>' + h(s) + '</small>' : '') + '</span></div>').join('') + '</div>' : '<div class="facts"><div><span class="k">Tip tranzacție</span><span class="v">' + h(L.transaction[item.transaction]) + '</span></div><div><span class="k">Localitate</span><span class="v">' + h(item.locality) + '</span></div>' + (item.land ? '<div><span class="k">Suprafață teren</span><span class="v">' + h(fmtHa(item.land)) + '</span></div>' : '') + '<div><span class="k">Precizia amplasamentului</span><span class="v">' + h(L.precision[item.precision]) + '</span></div><div><span class="k">Raport de evaluare</span><span class="v">' + (item.price ? 'publicat' : 'în curs de publicare') + '</span></div><div><span class="k">Vizionare</span><span class="v">la cerere, cu programare</span></div></div>') +
            '<p class="blk__src">Sursă: ' + (isZ ? 'Notă informativă APP, profil investițional APP / Invest Moldova, Ordinul APP nr. 208/2026, comunicat MO nr. 261-264/2026.' : '<a href="' + h(item.source) + '" target="_blank" rel="noreferrer">app.gov.md</a>.') + '</p></section>' +
          (item.photos.length >= 3 ? '<section class="blk"><h2 class="blk__title">Amplasament</h2><p class="blk__lead">' + (isZ ? 'Centrul Chișinăului, sectorul Rîșcani. Patru minute de mers până la bulevardul Ștefan cel Mare, acces direct din str. Anton Pann.' : h(item.locality)) + '</p><div class="lmap"><div id="locmap"></div><span class="lmap__badge">' + h(L.precision[item.precision]) + '</span><button class="mud-btn mud-btn-outline-primary mud-btn-md lmap__3d" type="button" data-3d aria-pressed="true" style="background:#fff">3D</button>' + '<div class="lmap__hint"><span><i style="background:#0058D2"></i> <b>' + h(item.name) + '</b></span><span class="lmap__hint-src">se încarcă reperele din OpenStreetMap…</span></div>' + '</div>' + (isZ ? '<ul class="dist">' + Z.pois.map(([n, lng, lat]) => '<li><b>' + h(n.split(' · ')[0]) + '</b><span>' + trim(km([item.lng, item.lat], [lng, lat]), 1) + ' km</span></li>').join('') + '</ul><p class="blk__src">Distanțe în linie dreaptă, calculate din coordonate. Orientative.</p>' : '') + '</section>' : '') +
          (isZ ? '<section class="blk"><h2 class="blk__title">Evaluare și preț</h2><p class="blk__lead">Evaluare independentă la 31 decembrie 2025, făcută de MOLDAUDITING S.R.L. pentru APP. Terenul și clădirea au fost evaluate la cea mai bună utilizare, comercial-administrativă, nu la cea hotelieră curentă.</p><div class="facts facts--1">' + Z.valuation.map(([k, v, n]) => '<div><span class="k">' + h(k) + '</span><span class="v">' + h(v) + '<small>' + h(n) + '</small></span></div>').join('') + '</div><p class="blk__src">Sursă: extras din raportul de evaluare nr. 1532.1 din 26.05.2026; PV nr. 2 al Comisiei de licitație din 04.06.2026. Echivalentele EUR sunt ale evaluatorului, la cursul din data raportului.</p></section>' : '') +
          (isZ ? '<section class="blk"><h2 class="blk__title">Situația financiară 2021–2025</h2><p class="blk__lead">Veniturile au revenit după pandemie și s-au stabilizat în jurul a 9,5–9,75 mil. lei pe an. Profitul net e marginal, iar evaluatorul consideră activitatea hotelieră curentă sub potențialul amplasamentului.</p>' + finChart(Z.fin) + '</section>' : '') +
          (isZ ? '<section class="blk" id="conditii"><h2 class="blk__title">Condiții care afectează activul</h2><p class="blk__lead">Două elemente cu regim juridic special pe terenul aferent, preluate în ordinul de expunere și în comunicatul din Monitorul Oficial. Devin obligații contractuale permanente ale cumpărătorului.</p><div class="cond">' + Z.conditions.map(([t, sub, d, meta]) => '<div class="cond__item"><h4>' + h(t) + '<small>' + h(sub) + '</small></h4><div><p>' + h(d) + '</p><div class="cond__meta">' + meta.map(([k, v]) => '<span><b>' + h(k) + '</b> ' + h(v) + '</span>').join('') + '</div></div></div>').join('') + '</div></section>' : '') +
          (item.deadline ? '<section class="blk"><h2 class="blk__title">Proces și termene</h2><p class="blk__lead">' + h(L.transaction[item.transaction]) + '. Modificările de termen rămân vizibile în istoric.</p><ol class="tline">' + (isZ ? Z.timeline : [['2026-08-14', 'Anunț și prelungire', 'Publicat de APP.', 'done'], [item.deadline, 'Termen depunere cereri', 'Dosar complet și garanție achitată.', 'next']].concat(item.auction ? [[item.auction, 'Licitație cu strigare', 'Sediul APP, Chișinău.', '']] : [])).map(([d, t, s, st]) => '<li class="' + (st ? 'is-' + st : '') + '"><span class="d">' + h(fmtDate(d, d.length > 10)) + '</span><span class="n"><i></i></span><span class="t"><b>' + h(t) + '</b><span>' + h(s) + '</span></span></li>').join('') + '</ol>' + (isZ ? '<h3 class="blk__sub">Condițiile licitației</h3><div class="facts facts--1">' + Z.steps.map(([k, v]) => '<div><span class="k">' + h(k) + '</span><span class="v">' + h(v) + '</span></div>').join('') + '</div><p class="blk__src">Sursă: Ordinul APP nr. 208 din 11.06.2026; comunicat informativ MO nr. 261-264 din 19.06.2026; comunicat APP din 14.08.2026 privind prelungirea.</p>' : '') + '</section>' : '<section class="blk"><h2 class="blk__title">Proces și termene</h2><p class="blk__lead">Procedura se lansează după aprobarea raportului de evaluare. Termenele apar aici și în calendar; poți cere notificare prin e-mail.</p></section>') +
          '<section class="blk"><h2 class="blk__title">Documente</h2><p class="blk__lead">' + (isZ ? 'Fiecare document are emitent, dată, limbă și versiune. Documentul oficial al procedurii prevalează asupra acestei pagini.' + (PUBLIC_HOST ? ' Documentele interne se consultă în data room, la sediul APP sau la cerere.' : '') : 'Documentele procedurii se publică aici în ordinea emiterii.') + '</p>' + (isZ ? '<div class="docs">' + Z.docs.map(([t, m, s, u, restricted]) => (restricted && PUBLIC_HOST) ? '<div class="doc doc--locked"><span class="doc__ic">PDF</span><span><span class="doc__t">' + h(t) + '</span><span class="doc__m">' + h(m) + '</span></span><span class="doc__s"><span class="status-tag status-tag--neutral is-subtle status-tag--small">Data room · la cerere</span></span></div>' : '<a class="doc" href="' + h(u) + '" target="_blank" rel="noreferrer"><span class="doc__ic">' + (s.startsWith('PDF') ? 'PDF' : 'WEB') + '</span><span><span class="doc__t">' + h(t) + '</span><span class="doc__m">' + h(m) + '</span></span><span class="doc__s">' + h(s) + '</span></a>').join('') + '</div>' : '<div class="docs"><a class="doc" href="' + h(item.source) + '" target="_blank" rel="noreferrer"><span class="doc__ic">WEB</span><span><span class="doc__t">Lista bunurilor expuse la privatizare</span><span class="doc__m">APP · actualizată periodic · RO</span></span><span class="doc__s">app.gov.md</span></a></div>') + '</section>' +
        '</div>' +
        '<aside class="rail"><div class="rail__card">' +
          '<div class="rail__label">' + h(item.priceLabel || 'Preț') + '</div>' +
          (item.price ? '<div class="rail__price">' + h(nf.format(item.price)) + '<small>MDL</small></div><div class="rail__eur">≈ ' + h(fmtEUR(item.price, META.eurRate)) + ' <span>· curs BNM ' + h(String(META.eurRate).replace('.', ',')) + ', ' + h(fmtDate(META.eurRateDate)) + ' · orientativ</span></div>' + (item.priceNote ? '<div class="rail__eur">' + h(item.priceNote) + '</div>' : '') : '<div class="rail__price" style="font-size:22px">Conform raportului de evaluare</div><div class="rail__eur"><span>Prețul inițial se publică împreună cu anunțul procedurii.</span></div>') +
          railDeadline +
          '<div class="rail__ctas"><button class="mud-btn mud-btn-primary mud-btn-lg" type="button">Exprimă interes</button><button class="mud-btn mud-btn-outline-primary mud-btn-lg" type="button">Programează o vizită</button></div>' +
          (item.deposit ? '<div class="rail__terms"><div><span>Acont 10%</span><b>' + h(nf.format(item.deposit)) + ' lei</b></div><div><span>Taxă de participare</span><b>' + h(nf.format(item.fee.legal)) + ' / ' + h(nf.format(item.fee.individual)) + ' lei</b></div></div>' : '') +
          '<p class="rail__note">Expresia de interes nu ține loc de înscriere. Înscrierea se face prin cerere, acont și taxă, conform comunicatului din Monitorul Oficial.</p>' +
        '</div><div class="rail__card">' +
          '<div class="rail__contact"><span class="av">DV</span><div><b>Direcția vânzări și privatizare</b><span>Agenția Proprietății Publice</span></div></div>' +
          '<div class="rail__links"><a href="mailto:office@app.gov.md">Trimite o întrebare despre activ</a><a href="#/cum-participi">Cum decurge ' + h(L.transaction[item.transaction].toLowerCase()) + '</a><a href="' + h(item.source) + '" target="_blank" rel="noreferrer">Vezi anunțul oficial pe app.gov.md</a></div>' +
        '</div></aside></div>' +
        (similar.length ? '<section class="similar"><div class="section__head"><h2 class="section__title">Active similare</h2><a class="section__link" href="#/cauta">Toate proprietățile ' + ICON.arrow + '</a></div><div class="cards">' + similar.map(cardHTML).join('') + '</div></section>' : '') +
      '</div></article>';
    afterRenderCards(app);
    initLocMap(item, isZ ? Z.pois : []);
    initLightbox(item);
    const sh = $('[data-share]'); if (sh) sh.addEventListener('click', async () => { try { if (navigator.share) await navigator.share({ title: item.name, url: location.href }); else { await navigator.clipboard.writeText(location.href); sh.textContent = 'Link copiat'; } } catch (e) { /* anulat */ } });
  }
  /* ---------------- harta de amplasament: activ + repere din OpenStreetMap ---------------- */
  // Categorii de repere. Culorile sunt validate (contrast, daltonism) împreună cu albastrul activului.
  const CATS = {
    administratie: ['Instituții publice', '#DC6803'],
    finante: ['Bănci și finanțe', '#B32318'],
    educatie: ['Educație', '#039855'],
    cultura: ['Cultură și patrimoniu', '#561FE5'],
    hotel: ['Hoteluri', '#BB46D8'],
  };
  const CAT_ORDER = ['administratie', 'finante', 'educatie', 'cultura', 'hotel'];
  function categorize(t) {
    const a = t.amenity || '', b = t.building || '', o = t.office || '', tr = t.tourism || '';
    if (tr === 'hotel' || b === 'hotel') return 'hotel';
    if (a === 'bank') return 'finante';
    if (/^(university|college|school)$/.test(a) || /^(university|school|college|dormitory)$/.test(b)) return 'educatie';
    if (/^(museum|theatre|library|place_of_worship|arts_centre)$/.test(a) || /^(museum|attraction|artwork)$/.test(tr) || t.historic) return 'cultura';
    if (/^(government|ministry|diplomatic)$/.test(o) || /^(townhall|courthouse|embassy|police|hospital)$/.test(a) || t.diplomatic || /^(government|hospital|public)$/.test(b)) return 'administratie';
    return null;
  }
  // Interogare Overpass (OSM) în jurul activului; răspunsul se ține în sessionStorage.
  async function fetchLandmarks(item, radius) {
    const key = 'ov2:' + item.id;
    try { const c = sessionStorage.getItem(key); if (c) return JSON.parse(c); } catch (e) { /* fără storage */ }
    const R = radius, LL = item.lat + ',' + item.lng;
    const q = '[out:json][timeout:25];(' +
      'way(around:' + R + ',' + LL + ')["building"]["name"];relation(around:' + R + ',' + LL + ')["building"]["name"];' +
      'way(around:' + R + ',' + LL + ')["amenity"~"^(bank|university|college|school|theatre|museum|hospital|townhall|courthouse|embassy|library|place_of_worship)$"];' +
      'way(around:' + R + ',' + LL + ')["tourism"~"^(museum|attraction|hotel)$"];way(around:' + R + ',' + LL + ')["office"~"^(government|ministry|diplomatic)$"];' +
      'node(around:' + R + ',' + LL + ')["amenity"~"^(bank|university|college|theatre|museum|hospital|townhall|courthouse|embassy|library)$"]["name"];' +
      'node(around:' + R + ',' + LL + ')["tourism"~"^(museum|hotel)$"]["name"];node(around:' + R + ',' + LL + ')["office"~"^(government|ministry|diplomatic)$"]["name"];' +
      ');out geom tags;';
    const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
    if (!r.ok) throw new Error('overpass ' + r.status);
    const els = (await r.json()).elements || [];
    try { sessionStorage.setItem(key, JSON.stringify(els)); } catch (e) { /* plin */ }
    return els;
  }
  // Elemente OSM → repere: nume, categorie, poligon (dacă există), centru, distanță.
  function toLandmarks(els, item) {
    const out = [];
    const ringOf = (geom) => geom.map((p) => [p.lon, p.lat]);
    els.forEach((e) => {
      const t = e.tags || {}; const name = t['name:ro'] || t.name; const cat = categorize(t);
      if (!name || !cat) return;
      let geometry = null, center = null;
      if (e.type === 'node') center = [e.lon, e.lat];
      else if (e.type === 'way' && e.geometry && e.geometry.length > 3) { const ring = ringOf(e.geometry); geometry = { type: 'Polygon', coordinates: [ring] }; center = centroid(ring); }
      else if (e.type === 'relation' && e.members) { const outers = e.members.filter((m) => m.role === 'outer' && m.geometry && m.geometry.length > 3).map((m) => [ringOf(m.geometry)]); if (!outers.length) return; geometry = { type: 'MultiPolygon', coordinates: outers }; center = centroid(outers[0][0]); }
      if (!center) return;
      const dist = km([item.lng, item.lat], center) * 1000;
      if (dist < 35) return; // activul însuși
      const lv = Number(t['building:levels']); const hg = parseFloat(t.height);
      out.push({ id: e.type + '/' + e.id, name, cat, geometry, center, dist, height: hg > 0 ? hg : lv > 0 ? lv * 3.2 : null, tags: t });
    });
    // dublurile (aceeași denumire, la sub 60 m): păstrăm varianta cu poligon
    const seen = [];
    const uniq = out.filter((l) => { const d = seen.find((s) => s.name === l.name && km(s.center, l.center) * 1000 < 60); if (d) { if (!d.geometry && l.geometry) { d.geometry = l.geometry; d.height = l.height; } return false; } seen.push(l); return true; });
    uniq.forEach((l) => {
      if (/^Blocul\s+[A-Z]$/i.test(l.name) && l.cat === 'educatie') { const host = uniq.find((o) => o !== l && o.cat === 'educatie' && /\(([A-Z]{3,6})\)/.test(o.name) && km(o.center, l.center) * 1000 < 300); if (host) l.name = host.name.match(/\(([A-Z]{3,6})\)/)[1] + ' · ' + l.name; }
      l.rank = CAT_ORDER.indexOf(l.cat) * 100 + l.dist / 10;
    });
    return uniq.sort((a, b) => a.rank - b.rank);
  }
  function initLocMap(item, pois) {
    const el = document.getElementById('locmap'); if (!el) return;
    const exact = item.precision !== 'localitate';
    locMap = new maplibregl.Map({ container: el, style: STYLE_URL, center: [item.lng, item.lat], zoom: exact ? 15.95 : 12.2, pitch: exact ? 52 : 0, bearing: exact ? 150 : 0, attributionControl: { compact: true }, cooperativeGestures: true });
    locMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right'); window.apLocMap = locMap;
    // pinul și eticheta mare a activului
    const pin = document.createElement('div'); pin.className = 'pin'; pin.setAttribute('aria-label', item.name);
    const pinMarker = new maplibregl.Marker({ element: pin }).setLngLat([item.lng, item.lat]).addTo(locMap);
    const big = document.createElement('div'); big.className = 'poi-asset'; big.innerHTML = '<b>' + h(item.name) + '</b><span>' + h(L.type[item.type]) + ' · activul acestei fișe</span>';
    const bigMarker = new maplibregl.Marker({ element: big, anchor: 'left', offset: [18, 2] }).setLngLat([item.lng, item.lat]).addTo(locMap);
    const legend = $('.lmap__hint');
    const layersAll = ['ap-3d', 'ap-3d-hover', 'ap-3d-asset', 'ap-3d-pois', 'ap-poi-labels'];

    locMap.on('load', () => {
      if (!exact) { locMap.addSource('ap-approx', { type: 'geojson', data: circle([item.lng, item.lat], 1.2) }); locMap.addLayer({ id: 'ap-approx', type: 'fill', source: 'ap-approx', paint: { 'fill-color': '#0058D2', 'fill-opacity': 0.08 } }); locMap.addLayer({ id: 'ap-approx-line', type: 'line', source: 'ap-approx', paint: { 'line-color': '#0058D2', 'line-width': 1.5, 'line-dasharray': [2, 2] } }); }
      const bl = locMap.getStyle().layers.find((l) => l.id === 'building' || (l['source-layer'] === 'building' && l.type === 'fill'));
      if (!bl) return;
      const labelLayer = locMap.getStyle().layers.find((l) => l.type === 'symbol' && l.layout && l.layout['text-field']);
      const before = labelLayer ? labelLayer.id : undefined;
      const H = ['coalesce', ['get', 'render_height'], 12];
      const H2 = ['+', H, 0.4];
      const BASE = ['coalesce', ['get', 'render_min_height'], 0];
      const empty = { type: 'FeatureCollection', features: [] };
      // clădirile din jur: translucide și fără culoare, ca activul și reperele să se vadă
      locMap.addLayer({ id: 'ap-3d', type: 'fill-extrusion', source: bl.source, 'source-layer': bl['source-layer'], minzoom: 13, paint: { 'fill-extrusion-color': ['interpolate', ['linear'], H, 4, '#eef1f5', 14, '#dde4ec', 30, '#c5cfda', 60, '#a9b6c5'], 'fill-extrusion-height': H, 'fill-extrusion-base': BASE, 'fill-extrusion-opacity': 0.55 } }, before);
      locMap.addSource('ap-hover', { type: 'geojson', data: empty });
      locMap.addLayer({ id: 'ap-3d-hover', type: 'fill-extrusion', source: 'ap-hover', paint: { 'fill-extrusion-color': '#669BE4', 'fill-extrusion-height': H2, 'fill-extrusion-base': BASE, 'fill-extrusion-opacity': 1 } }, before);
      locMap.addSource('ap-asset', { type: 'geojson', data: empty });
      locMap.addLayer({ id: 'ap-3d-asset', type: 'fill-extrusion', source: 'ap-asset', paint: { 'fill-extrusion-color': '#0058D2', 'fill-extrusion-height': H2, 'fill-extrusion-base': BASE, 'fill-extrusion-opacity': 1 } }, before);
      locMap.addSource('ap-pois', { type: 'geojson', data: empty });
      locMap.addLayer({ id: 'ap-3d-pois', type: 'fill-extrusion', source: 'ap-pois', paint: { 'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-height': H2, 'fill-extrusion-base': BASE, 'fill-extrusion-opacity': 1 } }, before);
      locMap.addSource('ap-poi-pts', { type: 'geojson', data: empty });
      locMap.addLayer({ id: 'ap-poi-labels', type: 'symbol', source: 'ap-poi-pts', layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-max-width': 9, 'text-anchor': 'top', 'text-offset': [0, 0.3], 'text-padding': 6, 'symbol-sort-key': ['get', 'rank'], 'text-optional': false }, paint: { 'text-color': ['get', 'color'], 'text-halo-color': 'rgba(255,255,255,0.95)', 'text-halo-width': 1.6 } });
      if (!exact) layersAll.forEach((id) => { if (locMap.getLayer(id)) locMap.setLayoutProperty(id, 'visibility', 'none'); });

      // --- clădirea activului: poligonul din tile-uri care conține punctul / are înălțimea așteptată ---
      const findBuilding = (feats, lng, lat, expected) => {
        const cands = [];
        feats.forEach((f) => {
          const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
          polys.forEach((rings) => {
            const inside = pointInRing([lng, lat], rings[0]);
            const d = inside ? 0 : km([lng, lat], centroid(rings[0])) * 1000;
            if (d > 60) return;
            const hgt = Number(f.properties && f.properties.render_height) || 0;
            const score = expected != null ? -Math.abs(hgt - expected) - d / 6 + (inside ? 8 : 0) : (inside ? 1000 : 0) - d;
            cands.push({ rings, props: f.properties || {}, fid: f.id, d, score });
          });
        });
        if (!cands.length) return null;
        cands.sort((a, b) => b.score - a.score);
        const best = cands[0];
        const parts = cands.filter((c) => c === best || (expected != null && best.fid != null && c.fid === best.fid && c.d < 80)).map((c) => c.rings);
        return { type: 'Feature', properties: Object.assign({}, best.props), geometry: parts.length === 1 ? { type: 'Polygon', coordinates: parts[0] } : { type: 'MultiPolygon', coordinates: parts } };
      };
      let assetFeature = null;
      const findAsset = () => {
        if (!exact || assetFeature) return;
        const feats = locMap.querySourceFeatures(bl.source, { sourceLayer: bl['source-layer'] });
        assetFeature = findBuilding(feats, item.lng, item.lat, item.levels ? item.levels * 3 : null);
        if (assetFeature) { locMap.getSource('ap-asset').setData(offsetFeature(assetFeature, 0.4)); const g = assetFeature.geometry; const ring = g.type === 'Polygon' ? g.coordinates[0] : g.coordinates[0][0]; const c = centroid(ring); pinMarker.setLngLat(c); bigMarker.setLngLat(c); }
        placeLandmarks(feats);
      };
      locMap.on('idle', findAsset);

      // --- repere: din OSM (Overpass); dacă nu răspunde, lista de rezervă din fișă ---
      let landmarks = null, placed = false;
      const fallback = () => (pois || []).filter((p) => p[3]).map(([n, lng, lat]) => ({ id: n, name: n.split(' · ')[0], cat: /Banc/.test(n) ? 'finante' : /ASEM|Univers|Liceu/.test(n) ? 'educatie' : /Muzeu|Teatr/.test(n) ? 'cultura' : 'administratie', geometry: null, center: [lng, lat], dist: km([item.lng, item.lat], [lng, lat]) * 1000, height: null, rank: 0, tags: {} }));
      if (exact) fetchLandmarks(item, 450).then((els) => { landmarks = toLandmarks(els, item); if (locMap && locMap.loaded()) placeLandmarks(locMap.querySourceFeatures(bl.source, { sourceLayer: bl['source-layer'] })); }).catch(() => { landmarks = fallback(); if (locMap && locMap.loaded()) placeLandmarks(locMap.querySourceFeatures(bl.source, { sourceLayer: bl['source-layer'] })); });
      // Reperele de referință din fișă aleg ce se colorează; conturul vine din OSM. O referință poate avea mai multe clădiri (campus).
      const refs = (pois || []).map(([n, lng, lat]) => ({ name: n.split(' · ')[0], lng, lat }));
      const matchRef = (lm) => {
        const ln = norm(lm.name);
        return refs.find((r) => {
          const rn = norm(r.name); const acr = rn.replace(/[^a-z]/g, '') === rn && rn.length <= 6 ? rn : null;
          if (acr) return new RegExp('(^|[^a-z])' + acr + '([^a-z]|$)').test(ln) && (lm.tags.building === 'university' || /universit|academi/.test(ln) || ln.includes(acr + ' ·'));
          const words = rn.split(/[^a-zăâîșț\-]+/).filter((w) => w.length >= 5);
          return words.length && words.every((w) => ln.includes(w));
        });
      };
      function placeLandmarks(feats) {
        if (placed || !landmarks || !feats.length) return;
        const polys = [], pts = [];
        const chosen = [];
        if (refs.length) {
          refs.forEach((r) => {
            const hits = landmarks.filter((lm) => matchRef(lm) === r);
            if (hits.length) { hits.forEach((lm, i) => chosen.push(Object.assign({}, lm, { name: r.name, label: i === 0 }))); }
            else { const near = km([item.lng, item.lat], [r.lng, r.lat]) * 1000; if (near <= 700) chosen.push({ id: r.name, name: r.name, cat: /banc/i.test(r.name) ? 'finante' : /asem|universit|liceu|colegiu/i.test(r.name) ? 'educatie' : /muzeu|teatr|arcul|biseric/i.test(r.name) ? 'cultura' : 'administratie', geometry: null, center: [r.lng, r.lat], dist: near, height: null, rank: 0, tags: {}, label: true }); }
          });
          // eticheta unei referințe cu mai multe clădiri stă pe cea mai apropiată de coordonata de referință
          refs.forEach((r) => { const grp = chosen.filter((c) => c.name === r.name); if (grp.length > 1) { grp.forEach((c) => { c.label = false; }); grp.sort((x, y) => km(x.center, [r.lng, r.lat]) - km(y.center, [r.lng, r.lat]))[0].label = true; } });
        }
        const list = refs.length ? chosen : landmarks.map((lm) => Object.assign({}, lm, { label: true }));
        list.forEach((lm) => {
          const color = CATS[lm.cat][1];
          let geometry = lm.geometry, height = lm.height;
          if (!geometry) { const f = findBuilding(feats, lm.center[0], lm.center[1], null); if (f && f.geometry) { geometry = f.geometry; height = height || Number(f.properties.render_height) || null; } }
          if (geometry) {
            // aceeași clădire deja colorată de un reper mai important → doar eticheta
            const c = geometry.type === 'Polygon' ? centroid(geometry.coordinates[0]) : centroid(geometry.coordinates[0][0]);
            if (!polys.some((p) => km(p.c, c) * 1000 < 12)) { polys.push({ c, f: offsetFeature({ type: 'Feature', properties: { name: lm.name, color, cat: lm.cat, render_height: height || 12, render_min_height: 0, dist: lm.dist }, geometry }, 0.4) }); }
            lm.center = c;
          }
          if (lm.label) pts.push({ type: 'Feature', properties: { name: lm.name, color, cat: lm.cat, rank: lm.rank }, geometry: { type: 'Point', coordinates: lm.center } });
        });
        locMap.getSource('ap-pois').setData({ type: 'FeatureCollection', features: polys.map((p) => p.f) });
        locMap.getSource('ap-poi-pts').setData({ type: 'FeatureCollection', features: pts });
        placed = true;
        if (legend) { const items = refs.length ? list.filter((l) => l.label).map((l) => [l.name, CATS[l.cat][1]]) : CAT_ORDER.filter((c) => landmarks.some((l) => l.cat === c)).map((c) => [CATS[c][0], CATS[c][1]]); legend.innerHTML = '<span><i style="background:#0058D2"></i> <b>' + h(item.name) + '</b></span>' + items.map(([n, c]) => '<span><i style="background:' + c + '"></i> ' + h(n) + '</span>').join('') + '<span class="lmap__hint-src">contururi din OpenStreetMap</span>'; }
      }

      // --- interacțiune ---
      let bpop = null, tip = null;
      // Partea de MultiPolygon de sub cursor: în perspectivă, cursorul e pe perete/acoperiș, iar amprenta clădirii e mai jos pe ecran.
      // Coborâm pe ecran de la cursor și luăm prima amprentă care conține punctul de la sol.
      // Coborâm cel mult cât înălțimea clădirii proiectată pe ecran (plus o marjă), altfel am „prinde” o clădire de mai jos.
      const partAt = (f, point) => {
        const g = f.geometry;
        const hgt = Number(f.properties && f.properties.render_height) || 12;
        const ll0 = locMap.unproject([point.x, point.y]);
        const q0 = locMap.project([ll0.lng, ll0.lat]), q1 = locMap.project([ll0.lng + 0.0001, ll0.lat]);
        const ppm = Math.hypot(q1.x - q0.x, q1.y - q0.y) / (0.0001 * 111320 * Math.cos(ll0.lat * Math.PI / 180));
        const hpx = hgt * ppm * Math.sin(locMap.getPitch() * Math.PI / 180) * 1.6 + 8;
        const parts = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
        for (let dy = 0; dy <= hpx; dy += 3) { const ll = locMap.unproject([point.x, point.y + dy]); const hit = parts.find((rings) => pointInRing([ll.lng, ll.lat], rings[0])); if (hit) return { type: 'Polygon', coordinates: hit }; }
        return null;
      };
      const showTip = (text, lngLat) => { if (!tip) tip = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 10, className: 'tip' }); tip.setLngLat(lngLat).setText(text).addTo(locMap); };
      const hideTip = () => { if (tip) tip.remove(); };
      const popup = (html, lngLat) => { if (bpop) bpop.remove(); bpop = new maplibregl.Popup({ offset: 12, closeButton: false, closeOnClick: false, maxWidth: '300px' }).setLngLat(lngLat).setHTML(html).addTo(locMap); };
      const assetInfo = (lngLat) => popup('<div class="bpop"><span class="status-tag status-tag--brand is-subtle status-tag--small">Activul din această fișă</span><b>' + h(item.name) + '</b><span>' + h(item.address) + ', ' + h(item.locality) + (item.levels ? ' · ' + item.levels + ' niveluri' : '') + (item.area ? ' · ' + h(fmtM2(item.area)) : '') + '</span>' + (isZarea(item) ? '<a href="#conditii">Vezi condițiile care afectează activul</a>' : '') + '</div>', lngLat);
      const hoverSrc = locMap.getSource('ap-hover');
      locMap.on('mousemove', 'ap-3d', (e) => { const f = e.features[0]; const part = f && partAt(f, e.point); locMap.getCanvas().style.cursor = part ? 'pointer' : ''; hoverSrc.setData(part ? offsetFeature({ type: 'Feature', geometry: part, properties: f.properties }, 0.4) : empty); });
      locMap.on('mouseleave', 'ap-3d', () => { locMap.getCanvas().style.cursor = ''; hoverSrc.setData(empty); });
      locMap.on('mousemove', 'ap-3d-asset', (e) => { locMap.getCanvas().style.cursor = 'pointer'; showTip(item.name, e.lngLat); });
      locMap.on('mouseleave', 'ap-3d-asset', () => { locMap.getCanvas().style.cursor = ''; hideTip(); });
      locMap.on('mousemove', 'ap-3d-pois', (e) => { locMap.getCanvas().style.cursor = 'pointer'; showTip(e.features[0].properties.name, e.lngLat); });
      locMap.on('mouseleave', 'ap-3d-pois', () => { locMap.getCanvas().style.cursor = ''; hideTip(); });
      locMap.on('click', 'ap-3d-asset', (e) => { e.originalEvent._apHandled = true; assetInfo(e.lngLat); });
      locMap.on('click', 'ap-3d-pois', (e) => { e.originalEvent._apHandled = true; const p = e.features[0].properties; popup('<div class="bpop"><span class="status-tag status-tag--neutral is-subtle status-tag--small">' + h(CATS[p.cat][0]) + '</span><b>' + h(p.name) + '</b><span>la ' + (p.dist < 950 ? Math.round(p.dist / 10) * 10 + ' m' : trim(p.dist / 1000, 1) + ' km') + ' de activ' + (p.render_height ? ' · înălțime ≈ ' + Math.round(p.render_height) + ' m' : '') + '</span><small>Denumire și contur din OpenStreetMap · orientativ</small></div>', e.lngLat); });
      locMap.on('click', 'ap-3d', (e) => { if (e.originalEvent._apHandled) return; e.originalEvent._apHandled = true; const f = e.features[0]; const hgt = f.properties && f.properties.render_height; const lv = hgt ? Math.max(1, Math.round(hgt / 3.1)) : null; popup('<div class="bpop"><b>Clădire învecinată</b><span>' + (hgt ? 'înălțime ≈ ' + Math.round(hgt) + ' m · ≈ ' + lv + (lv === 1 ? ' nivel' : ' niveluri') : 'înălțime necunoscută') + '</span><small>Contur și înălțime din OpenStreetMap · orientativ, nu face parte din ofertă</small></div>', e.lngLat); });
      locMap.on('click', (e) => { if (bpop && !e.originalEvent._apHandled && !locMap.queryRenderedFeatures(e.point, { layers: ['ap-3d', 'ap-3d-asset', 'ap-3d-pois'] }).length) { bpop.remove(); bpop = null; } });
      pin.addEventListener('click', (e) => { e._apHandled = true; assetInfo(pinMarker.getLngLat()); });
      big.addEventListener('click', (e) => { e._apHandled = true; assetInfo(pinMarker.getLngLat()); });
    });
    const b3 = $('[data-3d]');
    if (b3) b3.addEventListener('click', () => { const on = b3.getAttribute('aria-pressed') !== 'true'; b3.setAttribute('aria-pressed', on); layersAll.filter((id) => id !== 'ap-poi-labels').forEach((id) => { if (locMap.getLayer(id)) locMap.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); }); locMap.easeTo({ pitch: on ? 52 : 0, bearing: on ? 150 : 0, duration: 600 }); });
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => { if (locMap) locMap.resize(); }) : null; if (ro) ro.observe(el);
    requestAnimationFrame(() => { if (locMap) locMap.resize(); });
    cleanup.push(() => { if (ro) ro.disconnect(); locMap.remove(); locMap = null; });
  }
  function isZarea(item) { return item.id === 'zarea'; }
  // Decalăm un inel spre exterior cu d metri: fiecare latură se mută pe normala ei, apoi laturile vecine se reintersectează.
  function offsetRing(ring, d) {
    const n = ring.length - 1; if (n < 3) return ring;
    let area = 0; for (let i = 0; i < n; i++) area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    const ccw = area > 0; const lat0 = ring[0][1] * Math.PI / 180; const kx = 1 / (111320 * Math.cos(lat0)), ky = 1 / 110540;
    const lines = [];
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n]; const dx = (b[0] - a[0]) / kx, dy = (b[1] - a[1]) / ky; const len = Math.hypot(dx, dy) || 1;
      let nx = dy / len, ny = -dx / len; if (ccw) { nx = -nx; ny = -ny; }
      lines.push({ a: [a[0] + nx * d * kx, a[1] + ny * d * ky], b: [b[0] + nx * d * kx, b[1] + ny * d * ky] });
    }
    const out = [];
    for (let i = 0; i < n; i++) {
      const L1 = lines[(i - 1 + n) % n], L2 = lines[i];
      const x1 = L1.a[0], y1 = L1.a[1], x2 = L1.b[0], y2 = L1.b[1], x3 = L2.a[0], y3 = L2.a[1], x4 = L2.b[0], y4 = L2.b[1];
      const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(den) < 1e-14) { out.push(L2.a); continue; }
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
      const px = x1 + t * (x2 - x1), py = y1 + t * (y2 - y1);
      // vârfuri foarte ascuțite: limităm deplasarea la 3·d
      if (Math.hypot((px - ring[i][0]) / kx, (py - ring[i][1]) / ky) > 3 * d) out.push(L2.a); else out.push([px, py]);
    }
    out.push(out[0]); return out;
  }
  function offsetFeature(f, d) { const g = f.geometry; const rings = (rs) => rs.map((r, i) => i === 0 ? offsetRing(r, d) : r); return { type: 'Feature', properties: f.properties, geometry: g.type === 'Polygon' ? { type: 'Polygon', coordinates: rings(g.coordinates) } : { type: 'MultiPolygon', coordinates: g.coordinates.map(rings) } }; }
  function pointInRing(p, ring) { let inside = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const a = ring[i], b = ring[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside; } return inside; }
  function centroid(ring) { let x = 0, y = 0; ring.forEach((c) => { x += c[0]; y += c[1]; }); return [x / ring.length, y / ring.length]; }
  function circle(c, rkm) { const pts = []; for (let k = 0; k <= 64; k++) { const a = k / 64 * 2 * Math.PI; pts.push([c[0] + rkm / (111.32 * Math.cos(c[1] * Math.PI / 180)) * Math.cos(a), c[1] + rkm / 110.57 * Math.sin(a)]); } return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [pts] } }; }



  /* ---------------- grafic financiar: două serii cu scări diferite → două grafice mici, o singură axă fiecare ---------------- */
  function finChart(F) {
    const W = 360, Hh = 170, padL = 8, padR = 8, top = 26, base = 136;
    const bars = (vals, fmt, unit) => {
      const max = Math.max.apply(null, vals) * 1.08; const n = vals.length; const slot = (W - padL - padR) / n; const bw = Math.min(40, slot * 0.56);
      const y = (v) => base - Math.max(0, v) / max * (base - top);
      const ticks = [0, 0.5, 1].map((t) => Math.round(max / 1.08 * t));
      return '<svg class="fchart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + h(unit) + '">' +
        ticks.map((t) => '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '" class="fchart__grid"/>').join('') +
        vals.map((v, i) => { const x = padL + slot * i + (slot - bw) / 2; const yy = y(v); const last = i === n - 1; return '<g class="fchart__bar' + (last ? ' is-last' : '') + '"><rect class="fchart__hit" x="' + (padL + slot * i).toFixed(1) + '" y="' + top + '" width="' + slot.toFixed(1) + '" height="' + (base - top + 22) + '" fill="transparent"/><path d="M' + x.toFixed(1) + ' ' + base + 'V' + (yy + 4).toFixed(1) + 'a4 4 0 0 1 4-4h' + (bw - 8).toFixed(1) + 'a4 4 0 0 1 4 4V' + base + 'Z"/><text class="fchart__val" x="' + (x + bw / 2).toFixed(1) + '" y="' + (yy - 7).toFixed(1) + '" text-anchor="middle">' + h(fmt(v)) + '</text><text class="fchart__x" x="' + (x + bw / 2).toFixed(1) + '" y="' + (base + 16) + '" text-anchor="middle">' + F.years[i] + '</text><title>' + F.years[i] + ': ' + h(fmt(v)) + ' ' + h(unit) + '</title></g>'; }).join('') +
        '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + base + '" y2="' + base + '" class="fchart__base"/></svg>';
    };
    const fmtK = (v) => trim(v / 1000, 2) + ' mil.';
    const fmtN = (v) => nf.format(v);
    const rows = [['Venituri din vânzări', F.revenue, (v) => nf.format(v) + ' mii lei'], ['Profit net', F.profit, (v) => (v < 0 ? '−' : '') + nf.format(Math.abs(Math.round(v * 10) / 10)) + ' mii lei'], ['Capital propriu', F.equity, (v) => nf.format(v) + ' mii lei'], ['Datorii curente', F.currentDebt, (v) => nf.format(v) + ' mii lei'], ['Înnoptări', F.stays, (v) => nf.format(v)]];
    return '<div class="fin">' +
      '<figure class="fin__fig"><figcaption><b>Venituri din vânzări</b><span>mil. lei · 2021–2025</span></figcaption>' + bars(F.revenue, fmtK, 'mii lei') + '</figure>' +
      '<figure class="fin__fig"><figcaption><b>Înnoptări</b><span>număr · 2021–2025</span></figcaption>' + bars(F.stays, fmtN, 'înnoptări') + '</figure>' +
      '</div>' +
      '<details class="fin__table"><summary>Tabelul complet, 2021–2025</summary><div class="tablewrap"><table><thead><tr><th scope="col">Indicator</th>' + F.years.map((y) => '<th scope="col">' + y + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(([k, vals, f]) => '<tr><th scope="row">' + h(k) + '</th>' + vals.map((v) => '<td>' + h(f(v)) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></details>' +
      '<p class="blk__src">Sursă: Notă informativă APP, tabelul „Situația financiară 2021–2025” (mii lei). Profitul net 2023 este preluat exact cum apare în document și cere verificare în situațiile financiare.</p>';
  }

  /* ---------------- lightbox galerie ---------------- */
  function initLightbox(item) {
    const gal = $('.gallery'); if (!gal || !item.photos.length) return;
    let k = 0;
    const dlg = document.createElement('dialog'); dlg.className = 'lb';
    dlg.innerHTML = '<button class="lb__close" type="button" aria-label="Închide">×</button><button class="lb__nav lb__nav--prev" type="button" aria-label="Fotografia anterioară">‹</button><figure class="lb__fig"><img alt=""><figcaption></figcaption></figure><button class="lb__nav lb__nav--next" type="button" aria-label="Fotografia următoare">›</button><div class="lb__count"></div>';
    document.body.appendChild(dlg);
    const img = $('img', dlg), cap = $('figcaption', dlg), cnt = $('.lb__count', dlg);
    const show = (i) => { k = (i + item.photos.length) % item.photos.length; const p = item.photos[k]; img.src = p.src; img.alt = p.alt; cap.textContent = p.caption + ' · ' + p.alt; cnt.textContent = (k + 1) + ' / ' + item.photos.length; };
    const open = (i) => { show(i); if (!dlg.open) dlg.showModal(); };
    $$('figure', gal).forEach((f, i) => { f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Deschide fotografia ' + (i + 1)); f.addEventListener('click', () => open(i)); f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } }); });
    const more = $('.gallery__more', gal); if (more) more.addEventListener('click', () => open(0));
    $('.lb__close', dlg).addEventListener('click', () => dlg.close());
    $('.lb__nav--prev', dlg).addEventListener('click', () => show(k - 1));
    $('.lb__nav--next', dlg).addEventListener('click', () => show(k + 1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(k - 1); if (e.key === 'ArrowRight') show(k + 1); });
    cleanup.push(() => dlg.remove());
  }

  /* ---------------- pagini simple ---------------- */
  function renderParticipate() {
    app.innerHTML = '<div class="page"><div class="ap-container"><h1 class="page__title">Cum participi</h1><p class="page__lead">Trei proceduri, trei seturi de pași. Toate încep public, fără cont. Autentificarea cu MPass e necesară doar pentru pașii personali: dosar, garanție, data room.</p><div style="margin-top:36px">' + pathsHTML() + '</div>' +
      '<section class="blk" style="margin-top:24px"><h2 class="blk__title">Întrebări frecvente</h2>' +
      [['Ce înseamnă „expresie de interes”?', 'Un mesaj către APP prin care ceri informații, o vizită sau notificări. Nu produce efecte juridice și nu te înscrie în procedură.'],
       ['Cum se calculează echivalentul în EUR?', 'La cursul oficial BNM din data afișată. Valoarea juridică este exclusiv cea în MDL din documentul procedurii.'],
       ['Ce se întâmplă dacă termenul se prelungește?', 'Fișa activului își actualizează termenul și countdown-ul, iar modificarea rămâne în istoricul procesului. Cei abonați primesc notificare.'],
       ['Pot vizita activul?', 'Da, cu programare prin fișa activului. Vizitele sunt confirmate de responsabilul APP.']].map(([q, a]) => '<details style="border-bottom:1px solid var(--ap-line);padding:14px 0"><summary style="font-weight:500;cursor:pointer">' + h(q) + '</summary><p style="margin-top:8px;color:var(--ap-ink-2);max-width:66ch">' + h(a) + '</p></details>').join('') +
      '</section></div></div>';
  }
  function renderCalendar() {
    const ev = [];
    ITEMS.forEach((i) => { if (i.deadline) ev.push([i.deadline, 'Termen depunere cereri', i]); if (i.auction) ev.push([i.auction, 'Licitație cu strigare', i]); });
    ev.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    app.innerHTML = '<div class="page"><div class="ap-container"><h1 class="page__title">Calendar licitații</h1><p class="page__lead">Toate termenele publicate, în ordine cronologică. Ora Chișinăului.</p><div class="cal">' +
      ev.map(([d, t, i]) => { const dt = new Date(d); return '<a class="cal__row" href="#/activ/' + h(i.slug) + '"><div class="cal__d"><b>' + dt.getDate() + ' ' + MONTHS[dt.getMonth()] + '</b><span>' + dt.getFullYear() + ' · ' + String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0') + '</span></div><div class="cal__t"><b>' + h(t) + ' · ' + h(i.name) + '</b><span>' + h(i.locality) + (i.price ? ' · ' + h(fmtMDL(i.price)) : '') + '</span></div>' + statusTag(i, true) + '</a>'; }).join('') +
      '</div></div></div>';
  }
  function renderNotFound() { app.innerHTML = '<div class="page"><div class="ap-container"><h1 class="page__title">Pagina nu există</h1><p class="page__lead">Activul căutat nu este publicat sau adresa este greșită. <a href="#/cauta">Vezi toate proprietățile</a>.</p></div></div>'; }

  /* ---------------- router ---------------- */
  function route() {
    cleanup.forEach((f) => { try { f(); } catch (e) { /* noop */ } }); cleanup = [];
    const hash = location.hash || '#/';
    const [path, qs] = hash.slice(1).split('?');
    const seg = path.split('/').filter(Boolean);
    $$('.ap-nav__link').forEach((a) => a.classList.toggle('is-on', !!a.dataset.nav && a.dataset.nav === seg[0]));
    $('.ap-header').classList.remove('ap-header--open');
    if (!seg.length) renderHome();
    else if (seg[0] === 'cauta') renderSearch(qs);
    else if (seg[0] === 'activ' && seg[1]) renderListing(seg[1]);
    else if (seg[0] === 'cum-participi') renderParticipate();
    else if (seg[0] === 'calendar') renderCalendar();
    else renderNotFound();
    if (seg[0] !== 'cauta') window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    document.title = (seg[0] === 'activ' ? (ITEMS.find((i) => i.slug === seg[1]) || {}).name + ' · ' : seg[0] === 'cauta' ? 'Caută proprietăți · ' : '') + 'Proprietăți publice · APP';
  }

  $('[data-burger]').addEventListener('click', (e) => { const hd = $('.ap-header'); hd.classList.toggle('ap-header--open'); e.currentTarget.setAttribute('aria-expanded', hd.classList.contains('ap-header--open')); });

  fetch('data/properties.json').then((r) => r.json()).then((d) => {
    DATA = d; META = d.meta; ITEMS = d.items.map((i) => Object.assign({ photos: [] }, i));
    window.addEventListener('hashchange', route);
  }).then(route).catch((err) => { console.error(err); if (!DATA) app.innerHTML = '<div class="page"><div class="ap-container"><h1 class="page__title">Datele nu s-au încărcat</h1><p class="page__lead">Verifică fișierul data/properties.json și reîncarcă pagina.</p></div></div>'; });
})();
