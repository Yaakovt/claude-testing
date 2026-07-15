// SpriteForge studio: renders a spec file at 8x + island lint.
// usage: node studio.mjs spec.js out.png
import { chromium } from 'playwright';
import path from 'path';
import { readFileSync } from 'fs';
const [, , specPath, out] = process.argv;
const specSrc = readFileSync(specPath, 'utf8');
const url = 'file://' + path.resolve(process.env.GAME_ROOT || '/home/user/claude-testing', 'index.html');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1230, height: 850 } });
const perr = []; page.on('pageerror', (e) => perr.push(e.message));
await page.goto(url); await page.waitForTimeout(350);
const rep = await page.evaluate((specSrc) => {
  // spec file defines: function SPECS() -> { name: [parts...] or {parts, post} }
  const factory = new Function('SF', 'K', specSrc + '; return SPECS;')(SpriteForge, SpriteKit);
  const specs = factory();
  document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#8fa9ba';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:10px;padding:6px;flex-wrap:wrap';
  for (const k in specs) {} // keep
  const report = [];
  for (const name in specs) {
    const entry = specs[name];
    const parts = entry.parts || entry;
    const s = new PixelSurface(64, 64);
    SpriteForge.draw(s, parts, entry.opts || {});
    if (entry.post) entry.post(s);
    s.weld(3);
    // lint islands
    const seen = new Uint8Array(64*64); let islands = 0; const boxes = [];
    for (let i = 0; i < 64*64; i++) {
      if (!s.data[i] || seen[i]) continue;
      islands++; const q=[i]; seen[i]=1;
      let x1=64,y1=64,x2=0,y2=0,sz=0;
      while(q.length){const j=q.pop();const jx=j%64,jy=(j/64)|0;sz++;
        if(jx<x1)x1=jx;if(jx>x2)x2=jx;if(jy<y1)y1=jy;if(jy>y2)y2=jy;
        for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=jx+dx,ny=jy+dy;
          if(nx<0||ny<0||nx>=64||ny>=64)continue;const k=ny*64+nx;
          if(s.data[k]&&!seen[k]){seen[k]=1;q.push(k);}}}
      boxes.push(sz+'px@'+x1+','+y1+'..'+x2+','+y2);
    }
    boxes.sort((a,b)=>parseInt(b)-parseInt(a));
    s.outlineSel(); s.innerEdge(0.10);
    const cv = s.toCanvas();
    const big = document.createElement('canvas'); big.width = 64*6; big.height = 64*6;
    const c = big.getContext('2d'); c.imageSmoothingEnabled = false;
    c.drawImage(cv, 0, 0, 384, 384);
    // faint pixel grid
    c.strokeStyle = 'rgba(0,0,0,0.06)';
    for (let i = 0; i <= 64; i += 8) { c.beginPath(); c.moveTo(i*6,0); c.lineTo(i*6,384); c.stroke(); c.beginPath(); c.moveTo(0,i*6); c.lineTo(384,i*6); c.stroke(); }
    const cell = document.createElement('div');
    const label = document.createElement('div');
    label.textContent = name + '  [' + islands + ' island' + (islands===1?'':'s') + ']';
    label.style.cssText = 'font:14px monospace;color:' + (islands>1?'#a00':'#123');
    cell.appendChild(big); cell.appendChild(label); wrap.appendChild(cell);
    report.push(name + ': ' + islands + ' islands  ' + boxes.slice(1,5).join(' | '));
  }
  document.body.appendChild(wrap);
  return report;
}, specSrc);
await page.waitForTimeout(120);
await page.screenshot({ path: out, fullPage: true });
console.log(rep.join('\n'));
if (perr.length) console.log('PAGE ERRORS:', perr);
await browser.close();
console.log('saved', out);
