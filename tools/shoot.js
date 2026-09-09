// Capturi de ecran cu Chrome headless prin DevTools Protocol (fără dependențe).
// node tools/shoot.js <outDir> [base]   — așteaptă încărcarea hărților înainte de captură.
const { spawn } = require('child_process');
const fs = require('fs');
const out = process.argv[2] || 'shots'; const base = process.argv[3] || 'http://localhost:8765/';
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const PAGES = [
  ['home', '#/', 1440, 900, 6000, true],
  ['search', '#/cauta', 1440, 900, 9000, false],
  ['search-chisinau', '#/cauta?q=Chi%C8%99in%C4%83u', 1440, 900, 9000, false],
  ['listing-zarea', '#/activ/hotelul-zarea', 1440, 900, 16000, true],
  ['listing-teren', '#/activ/teren-drumul-bacioiului', 1440, 900, 8000, true],
  ['calendar', '#/calendar', 1440, 900, 2500, true],
  ['participa', '#/cum-participi', 1440, 900, 2500, true],
  ['mobile-home', '#/', 390, 844, 6000, true],
  ['mobile-search', '#/cauta', 390, 844, 8000, false],
  ['mobile-listing', '#/activ/hotelul-zarea', 390, 844, 8000, true],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const chrome = spawn(CH, ['--headless=new', '--remote-debugging-port=' + PORT, '--hide-scrollbars', '--window-size=1440,900', '--user-data-dir=/tmp/ap-shoot-profile', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 40; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch (e) { await sleep(250); } }
  const only = process.argv[4];
  for (const [name, hash, w, h, wait, full] of PAGES.filter((p) => !only || p[0].includes(only))) {
    const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const pending = {};
    ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; } });
    const send = (method, params) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
    await send('Page.enable');
    await send('Page.navigate', { url: base + '?s=' + Date.now() + hash });
    await sleep(wait);
    let clip;
    if (full) { const m = await send('Page.getLayoutMetrics'); const cs = m.result.cssContentSize || m.result.contentSize; clip = { x: 0, y: 0, width: w, height: Math.min(Math.ceil(cs.height), 8000), scale: 1 }; }
    const shot = await send('Page.captureScreenshot', Object.assign({ format: 'png', captureBeyondViewport: !!full }, clip ? { clip } : {}));
    fs.writeFileSync(`${out}/${name}.png`, Buffer.from(shot.result.data, 'base64'));
    const errs = await send('Runtime.evaluate', { expression: 'JSON.stringify({pois: (()=>{try{return window.apLocMap.getSource("ap-pois")._data.features.length+"/"+window.apLocMap.getSource("ap-poi-pts")._data.features.length}catch(e){return "n/a"}})(), legend: (document.querySelector(".lmap__hint")||{}).innerText, mk: document.querySelectorAll(".mk").length, pending: document.querySelectorAll(".thumb--pending").length, thumbs: document.querySelectorAll(".thumb").length, canvas: document.querySelectorAll(".maplibregl-canvas").length})', returnByValue: true });
    console.log(name, errs.result.result.value);
    ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);
  }
  chrome.kill();
})().catch((e) => { console.error(e); process.exit(1); });
