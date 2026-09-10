const { spawn } = require('child_process'); const fs = require('fs');
const [,, url, out, w=1440, h=900, wait=5000, maxH=12000, viewAt] = process.argv; // viewAt: scrollY for a viewport-only capture
const CH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'; const PORT=9334;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const chrome=spawn(CH,['--headless=new','--remote-debugging-port='+PORT,'--hide-scrollbars','--allow-file-access-from-files','--window-size='+w+','+h,'--user-data-dir=/tmp/zarea-shoot-profile','about:blank'],{stdio:'ignore'});
 for(let i=0;i<40;i++){try{await fetch(`http://127.0.0.1:${PORT}/json/version`);break;}catch(e){await sleep(250);}}
 const t=await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`,{method:'PUT'})).json();
 const ws=new WebSocket(t.webSocketDebuggerUrl); await new Promise(r=>ws.addEventListener('open',r));
 let id=0; const pending={};
 ws.addEventListener('message',m=>{const d=JSON.parse(m.data); if(d.id&&pending[d.id]){pending[d.id](d);delete pending[d.id];}});
 const send=(method,params)=>new Promise(r=>{const i=++id;pending[i]=r;ws.send(JSON.stringify({id:i,method,params:params||{}}));});
 await send('Emulation.setDeviceMetricsOverride',{width:+w,height:+h,deviceScaleFactor:1,mobile:+w<600});
 await send('Page.enable'); await send('Page.navigate',{url}); await sleep(2500);
 // scroll through the page so lazy images and the map initialise, then return to the top
 await send('Runtime.evaluate',{expression:'(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}window.scrollTo(0,H);for(let k=0;k<50&&![...document.images].every(i=>i.complete);k++)await new Promise(r=>setTimeout(r,200));window.scrollTo(0,0);})()',awaitPromise:true});
 await sleep(+wait);
 if(viewAt){ await send('Runtime.evaluate',{expression:'window.scrollTo(0,'+(+viewAt)+')'}); await sleep(800); const v=await send('Page.captureScreenshot',{format:'png'}); fs.writeFileSync(out,Buffer.from(v.result.data,'base64')); console.log(out,'viewport at',viewAt); ws.close(); chrome.kill(); return; }
 const m=await send('Page.getLayoutMetrics'); const cs=m.result.cssContentSize||m.result.contentSize;
 const clip={x:0,y:0,width:+w,height:Math.min(Math.ceil(cs.height),+maxH),scale:1};
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});
 fs.writeFileSync(out,Buffer.from(shot.result.data,'base64'));
 const errs=await send('Runtime.evaluate',{expression:'JSON.stringify({h:document.body.scrollHeight, imgs:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src), canvas:document.querySelectorAll(".maplibregl-canvas").length})',returnByValue:true});
 console.log(out, errs.result.result.value);
 ws.close(); chrome.kill();
})().catch(e=>{console.error(e);process.exit(1);});
