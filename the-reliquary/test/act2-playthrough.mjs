/* Act II playthrough — crosses over via the finale choice, then solves the
   bells, the scales, the shadow key and the chalk door with real mouse input. */
import { chromium } from 'playwright-core';

const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const shots = process.env.SHOTS || '/tmp/shots';
const browser = await chromium.launch({
  executablePath: exe,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
const ev = (fn, arg) => page.evaluate(fn, arg);
const P = (name) => ev((n) => window.__REL.project(n), name);
const PW = (v) => ev(([x, y, z]) => window.__REL.project(x, y, z), v);
const sleep = (ms) => page.waitForTimeout(ms);
const check = async (label, fn, timeoutMs = 8000) => {
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < timeoutMs) { ok = await ev(fn); if (ok) break; await sleep(400); }
  console.log(ok ? ' ok ' : 'FAIL', label);
  if (!ok) process.exitCode = 1;
};
async function waitSettled(maxMs = 12000) {
  let last = null; const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await ev(() => ({ p: window.__REL.camera.position.toArray(), en: window.__REL.controls.enabled }));
    if (last && s.en) {
      if (Math.hypot(s.p[0]-last[0], s.p[1]-last[1], s.p[2]-last[2]) < 0.01) return true;
    }
    last = s.p; await sleep(400);
  }
  return false;
}
async function focus(name) { await ev((n) => window.__REL.focusNode(n), name); await waitSettled(); }
async function drag(points, stepDelay = 30) {
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  for (const p of points.slice(1)) { await page.mouse.move(p.x, p.y); await sleep(stepDelay); }
  await page.mouse.up();
}
async function tap(p) { await page.mouse.click(p.x, p.y); }

await page.goto('http://127.0.0.1:8901/index.html', { waitUntil: 'networkidle' });
await sleep(1500);
await ev(() => localStorage.clear());
await page.click('#btn-new');
await sleep(3000); await waitSettled();

/* jump to the finale and choose the eyepiece */
await ev(() => window.__REL.solveTo(6));
await sleep(2500);
await tap(await P('letter4'));
await check('last letter open', () => document.querySelector('#modal-wrap').classList.contains('open'));
await page.click('#modal .close-x'); await sleep(900);
await check('choice offered', () => document.querySelector('#modal-wrap').classList.contains('open'));
await page.click('#modal .actions .btn');                    /* RAISE THE EYEPIECE */
await sleep(1000);
await check('crossed over', () => window.__REL.state.act === 2 && window.__REL.state.ch === 7, 15000);
await sleep(2500);
await page.screenshot({ path: `${shots}/a2-arrival.png` });

/* arrival note */
await tap(await P('arrivalNote'));
await check('arrival note read', () => window.__REL.state.letters.includes(4));
await page.click('#modal .close-x'); await sleep(500);

/* ---- the four bells ---- */
await focus('bells');
await tap(await P('crank'));                                  /* hear the lullaby */
await check('demo finished (lock released)', () => !window.__REL.ch7.lock, 30000);
const MELODY = [0, 2, 1, 3, 2];
for (const b of MELODY) { await tap(await P('bell' + b)); await sleep(900); }
await check('lullaby said back', () => window.__REL.ch7.solved, 12000);
await sleep(2500);
await page.screenshot({ path: `${shots}/a2-bells.png` });

/* ---- collect drawer contents ---- */
for (let attempt = 0; attempt < 5; attempt++) {
  if (await ev(() => window.__REL.state.letters.includes(5))) break;
  await tap(await P('drawerNote'));
  await sleep(1600);
}
await check('drawer note read', () => window.__REL.state.letters.includes(5));
if (await ev(() => document.querySelector('#modal-wrap').classList.contains('open')))
  { await page.click('#modal .close-x'); await sleep(500); }

/* ---- the star scales: 6 alone left, 1+2+3 right ---- */
/* first pull the two heavier stars out of her drawer, while it's on screen */
for (const i of [2, 3]) {
  for (let g = 0; g < 4; g++) {
    const pl = await ev((idx) => window.__REL.ch8.weights[idx].place, i);
    if (pl !== -1) break;
    await tap(await P('weight' + i));
    await sleep(2200);
  }
}
console.log('extracted:', JSON.stringify(await ev(() => window.__REL.ch8.weights.map((w) => [w.v, w.place]))));
await focus('scales');
/* put each star where it belongs: v6 → left pan (1), the rest → right pan (2) */
for (let i = 0; i < 4; i++) {
  for (let guard = 0; guard < 5; guard++) {
    const st = await ev((idx) => {
      const w = window.__REL.ch8.weights[idx];
      return { v: w.v, place: w.place, solved: window.__REL.ch8.solved };
    }, i);
    if (st.solved) break;
    const want = st.v === 6 ? 1 : 2;
    if (st.place === want) break;
    await tap(await P('weight' + i));
    await sleep(2400);
  }
}
await check('the sky balances', () => window.__REL.ch8.solved, 20000);
await sleep(7000);                                            /* sculpture rises */
await page.screenshot({ path: `${shots}/a2-scales.png` });

/* ---- the shadow key ---- */
await focus('wall');
for (let attempt = 0; attempt < 4; attempt++) {
  if (await ev(() => window.__REL.ch9.locked)) break;
  const d = await ev(() => {
    const T = Math.PI * 2;
    let delta = window.__REL.ch9.target - (window.__REL.MARKS.sculpture.parent.rotation.y);
    delta = ((delta % T) + T) % T; if (delta > Math.PI) delta -= T;
    return delta;
  });
  const g = await P('sculpture');
  const dx = d / 0.011;
  const pts = [];
  for (let k = 0; k <= 14; k++) pts.push({ x: g.x + (dx * k) / 14, y: g.y });
  await drag(pts, 30);
  await sleep(600);
}
await check('the light stops lying', () => window.__REL.ch9.locked, 10000);
await sleep(3000);
await page.screenshot({ path: `${shots}/a2-shadow.png` });

/* ---- Edwin's last note ---- */
await tap(await P('lastNote'));
await check('last note read', () => window.__REL.state.letters.includes(6));
await page.click('#modal .close-x'); await sleep(500);

/* ---- trace the chalk door (lens on) ---- */
await page.keyboard.press('e'); await sleep(900);
const WALLZ2 = -2.0 + 0.02;
async function traceSeg(s) {
  const pts = await ev((idx) => window.__REL.ch10.segs[idx].pts, s);
  const screen = [];
  for (const [x, y] of pts) screen.push(await PW([x, y, WALLZ2]));
  /* densify straight segments */
  const dense = [];
  for (let i = 0; i < screen.length - 1; i++) {
    for (let k = 0; k < 6; k++) {
      dense.push({ x: screen[i].x + (screen[i+1].x - screen[i].x) * k / 6,
                   y: screen[i].y + (screen[i+1].y - screen[i].y) * k / 6 });
    }
  }
  dense.push(screen[screen.length - 1]);
  await drag(dense, 25);
  await sleep(600);
}
for (let s = 0; s < 3; s++) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (await ev((i) => window.__REL.ch10.done[i], s)) break;
    await traceSeg(s);
  }
  const done = await ev((i) => window.__REL.ch10.done[i], s);
  console.log(done ? ' ok ' : 'FAIL', 'segment ' + s + ' chalked');
  if (!done) process.exitCode = 1;
}
/* the handle */
const hp = await PW([0.36, 1.05, WALLZ2]);
await tap(hp);
await check('door opens', () => window.__REL.ch10.doorOpen, 20000);
await sleep(8000);
await page.screenshot({ path: `${shots}/a2-door.png` });

/* ---- final choice: send them home ---- */
await check('final choice offered', () => document.querySelector('#modal-wrap').classList.contains('open'), 30000);
const btns = await page.$$('#modal .actions .btn');
await btns[1].click();
await sleep(4200);
await check('ending shown', () => document.querySelector('#ending').classList.contains('open'));
await page.screenshot({ path: `${shots}/a2-ending.png` });

console.log('ERRORS:', JSON.stringify(errors.filter((e) => !e.includes('favicon'))));
await browser.close();
