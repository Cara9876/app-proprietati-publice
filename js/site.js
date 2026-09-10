/* Hotel Zarea — page behaviour. Reads data/site.json, fills the time-sensitive fields, runs the compare slider,
   the countdown, the mobile menu, and lazily starts the map. No dependencies beyond MapLibre (map.js). */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const h = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtInt = (n) => Number(n).toLocaleString('en-GB');
  const fmtDec = (n, d) => Number(n).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  const TZ = 'Europe/Chisinau';
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  const setField = (name, value) => $$('[data-field="' + name + '"]').forEach((el) => { el.textContent = value; });
  const km = (a, b) => { const R = 6371, dLat = (b[1] - a[1]) * Math.PI / 180, dLng = (b[0] - a[0]) * Math.PI / 180, s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * Math.PI / 180) * Math.cos(b[1] * Math.PI / 180) * Math.sin(dLng / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };

  /* ---------- data ---------- */
  fetch('data/site.json').then((r) => r.json()).then(render).catch((e) => console.error('site.json', e));

  function render(D) {
    const P = D.property, T = D.transaction, F = D.performance, C = D.contact;
    setField('status', T.status);
    setField('price', fmtInt(T.price)); setField('currency', T.currency);
    setField('deadline-date', fmtDate(T.deadline)); setField('deadline-time', fmtTime(T.deadline));
    setField('auction-date', fmtDate(T.auction)); setField('auction-time', fmtTime(T.auction));
    setField('method', T.method); setField('deposit', fmtInt(T.deposit)); setField('depositNote', T.depositNote);
    setField('feeLegal', fmtInt(T.feeLegal)); setField('feeIndividual', fmtInt(T.feeIndividual));
    setField('auctionPlace', T.auctionPlace); setField('valuation', fmtInt(T.valuation)); setField('valuationDate', fmtDate(T.valuationDate));
    setField('verifiedAt', fmtDate(D.verifiedAt)); setField('today', fmtDate(new Date().toISOString()));
    setField('levels', P.levels); setField('rooms', P.rooms); setField('usedArea', fmtDec(P.usedArea, 1)); setField('footprint', fmtDec(P.footprint, 1)); setField('land', P.land.toFixed(4));
    setField('ownership', P.ownership); setField('idno', P.idno);
    const last = F.years.length - 1;
    setField('revenue2025', fmtDec(F.revenue[last] / 1e6, 2)); setField('stays2025', fmtInt(F.stays[last]));
    $$('[data-href="sourceUrl"]').forEach((a) => { a.href = D.sourceUrl; });
    $$('[data-href="visitMail"]').forEach((a) => { a.href = 'mailto:' + C.emails.join(',') + '?subject=' + encodeURIComponent(C.visitSubject); });

    // countdown to the application deadline (whole days, Chișinău time)
    const left = new Date(T.deadline) - Date.now();
    const days = Math.floor(left / 864e5), hours = Math.floor((left % 864e5) / 36e5);
    setField('countdown', left <= 0 ? 'Closed' : days >= 2 ? days + ' days' : days === 1 ? '1 day ' + hours + ' h' : hours + ' hours');
    if (left <= 0) $$('[data-field="status"]').forEach((el) => { el.textContent = 'Application period closed'; });

    // lists
    $('[data-list="steps"]').innerHTML = T.steps.map((s) => '<li><div><b>' + h(s[0]) + '</b><span>' + h(s[1]) + '</span></div></li>').join('');
    $$('[data-list="conditions"]').forEach((el) => { el.innerHTML = T.conditions.map((c) => '<li>' + h(c) + '</li>').join(''); });
    if (T.submission) {
      const S = T.submission;
      setField('submission-where', S.where); setField('submission-form', S.form);
      setField('deposit-iban', S.depositAccount.iban); setField('deposit-beneficiary', S.depositAccount.beneficiary + ' · fiscal code ' + S.depositAccount.fiscalCode);
      setField('fee-iban', S.feeAccount.iban); setField('fee-beneficiary', S.feeAccount.beneficiary + ' · fiscal code ' + S.feeAccount.fiscalCode);
    }
    $('[data-list="documents"]').innerHTML = D.documents.map((d) => '<li><a href="' + h(d[2]) + '" target="_blank" rel="noopener"><span><b>' + h(d[0]) + '</b><span>' + h(d[1]) + '</span></span><span class="docs__lang">' + h(d[3]) + '</span><span class="docs__meta">PDF · ' + (d[4] > 1e6 ? (d[4] / 1048576).toFixed(1) + ' MB' : Math.round(d[4] / 1024) + ' KB') + '</span></a></li>').join('');
    $('[data-list="distances"]').innerHTML = D.landmarks.map((l) => { const d = km([P.lng, P.lat], [l[1], l[2]]); return '<li><b>' + h(l[0]) + '</b><span>' + (d < 0.95 ? Math.round(d * 100) * 10 + ' m' : d.toFixed(1) + ' km') + '</span></li>'; }).join('');
    $('[data-block="contact"]').innerHTML = '<p><small>' + h(C.organisation) + '</small>' + h(C.unit) + '<small>' + h(C.address) + '</small></p>' +
      '<p><small>Phone</small>' + C.phones.map((p) => '<a href="tel:' + p.replace(/\s/g, '') + '">' + h(p) + '</a>').join('') + '</p>' +
      '<p><small>Email</small>' + C.emails.map((e) => '<a href="mailto:' + h(e) + '">' + h(e) + '</a>').join('') + '</p>';

    // bars + table
    const bars = (key) => { const v = F[key], max = Math.max(...v); return v.map((x, i) => '<i data-year="' + F.years[i] + '" style="height:' + Math.max(4, Math.round(x / max * 100)) + '%"></i>').join(''); };
    $('[data-bars="revenue"]').innerHTML = bars('revenue'); $('[data-bars="stays"]').innerHTML = bars('stays');
    const row = (label, arr, f) => '<tr><td>' + label + '</td>' + arr.map((x) => '<td>' + f(x) + '</td>').join('') + '</tr>';
    $('[data-table="performance"]').innerHTML = '<thead><tr><th></th>' + F.years.map((y) => '<th>' + y + '</th>').join('') + '</tr></thead><tbody>' +
      row('Sales revenue', F.revenue, fmtInt) + row('Net result', F.netProfit, (x) => (x < 0 ? '−' : '') + fmtInt(Math.abs(x))) + row('Overnight stays', F.stays, fmtInt) + row('Employees', F.employees, String) + '</tbody>';

    // map, only when it scrolls near
    const mapEl = $('#lmap');
    if (mapEl && window.ZareaMap) {
      const start = () => window.ZareaMap.init(P);
      if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '400px' }); io.observe(mapEl); }
      else start();
    }
  }

  /* ---------- compare slider ---------- */
  const cmp = $('#compare');
  if (cmp) {
    const frame = $('.compare__frame', cmp), range = $('.compare__range', cmp);
    const set = (v) => { v = Math.min(100, Math.max(0, v)); frame.style.setProperty('--split', v + '%'); range.value = v; range.setAttribute('aria-valuetext', Math.round(v) + '% concept'); };
    range.addEventListener('input', () => set(Number(range.value)));
    let drag = false;
    const fromEvent = (e) => { const r = frame.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    frame.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; drag = true; frame.setPointerCapture(e.pointerId); fromEvent(e); });
    frame.addEventListener('pointermove', (e) => { if (drag) fromEvent(e); });
    const stop = () => { drag = false; };
    frame.addEventListener('pointerup', stop); frame.addEventListener('pointercancel', stop);
    set(50);
    const touched = () => cmp.classList.add('is-touched');
    frame.addEventListener('pointerdown', touched, { once: true }); range.addEventListener('input', touched, { once: true });
    // switch between the two photo / concept pairs
    $$('.pairs button', cmp.parentElement).forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.pair;
      $$('.pairs button', cmp.parentElement).forEach((x) => x.setAttribute('aria-pressed', x === b));
      $$('[data-pair-now]', cmp).forEach((el) => { el.hidden = el.dataset.pairNow !== k; });
      $$('[data-pair-after]', cmp).forEach((el) => { el.hidden = el.dataset.pairAfter !== k; });
      set(50);
    }));
    // opening gesture, once, when the slider first scrolls into view
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => {
        if (!es.some((e) => e.isIntersecting)) return; io.disconnect();
        const t0 = performance.now(), ease = (x) => 1 - Math.pow(1 - x, 3);
        const tick = (t) => { if (drag) return; const p = Math.min(1, (t - t0) / 1400); set(100 - 50 * ease(p)); if (p < 1) requestAnimationFrame(tick); };
        set(100); requestAnimationFrame(tick);
      }, { threshold: 0.5 });
      io.observe(frame);
    }
  }

  /* ---------- hero: slow cross-fade of the concept renders, after the entrance ---------- */
  const slides = $$('.hero__slide'), heroEl = $('.hero');
  if (slides.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let i = 0, timer = null, visible = true;
    const step = () => {
      const prev = slides[i]; i = (i + 1) % slides.length; const next = slides[i];
      prev.classList.replace('is-active', 'is-under'); next.classList.add('is-active');
      setTimeout(() => prev.classList.remove('is-under'), 1900);
    };
    const start = () => { if (!timer && visible && !document.hidden) timer = setInterval(step, 8000); };
    const stop = () => { clearInterval(timer); timer = null; };
    setTimeout(start, 2600);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    if ('IntersectionObserver' in window && heroEl) new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.15 }).observe(heroEl);
  }

  /* ---------- scroll: progress line + solid header ---------- */
  const bar = $('.progress span'), top = $('.top');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
    if (top) top.classList.toggle('is-solid', scrollY > 40);
  };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* ---------- header: mobile menu + current section ---------- */
  const toggle = $('.nav-toggle'), mnav = $('#mobile-nav');
  if (toggle && mnav) {
    toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); mnav.hidden = !open; });
    $$('a', mnav).forEach((a) => a.addEventListener('click', () => { toggle.setAttribute('aria-expanded', 'false'); mnav.hidden = true; }));
  }
  const links = $$('.nav a');
  if (links.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => { if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }); }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
  }
})();
