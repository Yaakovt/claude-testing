/* Full mouse-driven playthrough of The Reliquary — proves every puzzle is
   solvable with real pointer input, no debug fast-forwards. */
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
const fail = (msg) => { console.log('FAIL:', msg); process.exitCode = 1; };
const check = async (label, fn, timeoutMs = 6000) => {
  const t0 = Date.now();
  let ok = false;
  while (Date.now() - t0 < timeoutMs) {
    ok = await ev(fn);
    if (ok) break;
    await sleep(400);
  }
  console.log(ok ? ' ok ' : 'FAIL', label);
  if (!ok) process.exitCode = 1;
};
async function waitSettled(maxMs = 12000) {
  let last = null; const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await ev(() => ({ p: window.__REL.camera.position.toArray(), en: window.__REL.controls.enabled }));
    if (last && s.en) {
      const d = Math.hypot(s.p[0] - last[0], s.p[1] - last[1], s.p[2] - last[2]);
      if (d < 0.01) return true;
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
await sleep(4200);

/* ---- double-tap the front face to focus it ---- */
await waitSettled();                                    /* intro sweep done */
const fp = await PW([0, 0.9, 0.76]);
await page.mouse.click(fp.x, fp.y); await sleep(150); await page.mouse.click(fp.x, fp.y);
await waitSettled();
await check('focused front', () => window.__REL.state.focus === 'front');

/* ---- rosette: drag an arc computed from the current angle ---- */
for (let attempt = 0; attempt < 4; attempt++) {
  if (await ev(() => window.__REL.ch1.rosetteSolved)) break;
  await focus('front');                                  /* re-center if a miss orbited us */
  const cur = await ev(() => window.__REL.ch1.rosetteAngle);
  const T = Math.PI * 2;
  let delta = ((-cur % T) + T) % T; if (delta > Math.PI) delta -= T;
  const c = await P('rosette');
  console.log('  attempt', attempt, 'angle', cur.toFixed(2), 'delta', delta.toFixed(2), 'center', c.x.toFixed(0), c.y.toFixed(0));
  console.log('  probe:', JSON.stringify(await ev(([x, y]) => window.__REL.probe(x, y), [c.x + 68 * Math.cos(0.4), c.y - 68 * Math.sin(0.4)])));
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const a = 0.4 + (i / 16) * delta;                 /* screen angle, ccw = +world */
    pts.push({ x: c.x + 68 * Math.cos(a), y: c.y - 68 * Math.sin(a) });
  }
  await page.mouse.move(pts[0].x, pts[0].y);
  await page.mouse.down();
  await sleep(120);
  console.log('  dragging after down:', await ev(() => window.__REL.isDragging()));
  for (const p of pts.slice(1)) { await page.mouse.move(p.x, p.y); await sleep(30); }
  await page.mouse.up();
  await sleep(500);
}
await check('rosette solved', () => window.__REL.ch1.rosetteSolved);

/* ---- latch: drag right ---- */
for (let attempt = 0; attempt < 3; attempt++) {
  if (await ev(() => window.__REL.ch1.latchOpen)) break;
  await focus('front');
  const lp = await P('latch');
  await drag([lp, { x: lp.x + 60, y: lp.y }, { x: lp.x + 140, y: lp.y }, { x: lp.x + 230, y: lp.y }]);
  await sleep(900);
}
await sleep(1400);
await check('latch open + drawer', () => window.__REL.ch1.latchOpen && window.__REL.ch1.drawerOpen);
await page.screenshot({ path: `${shots}/p1-drawer.png` });

/* ---- collect letter + eyepiece ---- */
await tap(await P('letter1')); await sleep(600);
await page.click('#modal .close-x'); await sleep(400);
await tap(await P('eyepiece1')); await sleep(600);
await check('chapter 2 reached, lens owned', () => window.__REL.state.ch === 2 && window.__REL.state.hasLens);

/* ---- raise the lens, go to the lid ---- */
await page.keyboard.press('e'); await sleep(900);
await focus('top');
await page.screenshot({ path: `${shots}/p2-stardial.png` });

/* ---- star rings: arc-drag each ring to its ghost marks ---- */
for (let i = 0; i < 3; i++) {
  const info = await ev((idx) => {
    const s = window.__REL.ch2.rings[idx];
    return { angle: s.angle, target: s.target, r: s.r };
  }, i);
  const STEP = Math.PI / 4;
  let delta = info.target * STEP - info.angle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const a0 = 1.2;
  const pts = [];
  for (let k = 0; k <= 20; k++) {
    const a = a0 + (k / 20) * delta;
    const p = await PW([-0.5 + Math.cos(a) * info.r, 1.729, Math.sin(a) * info.r]);
    pts.push(p);
  }
  await drag(pts, 25);
  await sleep(500);
}
await check('celestial dial solved', () => window.__REL.ch2.solved);
await sleep(2400);                                     /* panel unlock + chapter card */

/* ---- aether engine ---- */
await focus('left');
await tap(await P('panelDoor')); await sleep(1900);
await check('panel open', () => window.__REL.ch3.panelOpen);
for (const m of ['mirror00', 'mirror22', 'mirror21']) {
  await tap(await P(m)); await sleep(700);
}
await page.screenshot({ path: `${shots}/p3-beam.png` });
await check('beam solved', () => window.__REL.ch3.solved);
await sleep(3000);                                     /* drawer slides out */
await tap(await P('rewardKey')); await sleep(500);
await tap(await P('letter2')); await sleep(600);
await page.click('#modal .close-x'); await sleep(400);
await check('chapter 4 reached', () => window.__REL.state.ch === 4);

/* ---- inspect the key and straighten the bow ---- */
await page.click('#inventory .slot:nth-child(2)'); await sleep(400);   /* select key */
await page.click('#inventory .slot:nth-child(2)'); await sleep(700);   /* inspect key */
outer:
for (let x = 700; x <= 1040; x += 40) {
  for (let y = 300; y <= 500; y += 45) {
    await page.mouse.click(x, y); await sleep(120);
    if (await ev(() => window.__REL.state.keyFixed)) break outer;
  }
}
await check('key straightened', () => window.__REL.state.keyFixed);
await page.click('#inspect-close'); await sleep(400);

/* ---- wind the chronometer ---- */
await focus('right');
await check('key still selected', () => window.__REL.state.selected === 'key');
await tap(await P('esc')); await sleep(3200);
await check('key seated', () => window.__REL.ch4.keyIn);

/* minute hand → 15, then hour hand → a quarter past nine */
const CXx = 1.1 + 0.06, CYy = 1.0;
const mGrab = await P('minHand');
const mTip = await PW([CXx, CYy + 0.0, -0.2]);          /* θ=90°: (dy=0, dz=+... sx=-dz → dz=-0.2) */
await drag([mGrab, mTip], 40); await sleep(500);
const hGrab = await P('hourHand');
const hTip = await PW([CXx, CYy + 0.13 * 0.15 / 0.15 * 0.02, 0.99 * 0.15]);
await drag([hGrab, await PW([CXx, CYy + 0.0195, 0.1487])], 40);
await sleep(600);
const clockState = await ev(() => ({ min: window.__REL.ch4.minA, hour: window.__REL.ch4.hourA, solved: window.__REL.ch4.solved }));
console.log('clock:', JSON.stringify(clockState));
await check('clock solved', () => window.__REL.ch4.solved);
/* door opens, letter III modal appears, cryptex rises — close the modal when it shows */
{
  const t0 = Date.now();
  while (Date.now() - t0 < 18000) {
    if (await ev(() => document.querySelector('#modal-wrap').classList.contains('open'))) {
      await page.click('#modal .close-x'); break;
    }
    await sleep(500);
  }
}
await check('chapter 5, cryptex risen', () => window.__REL.state.ch === 5 && window.__REL.ch5.risen, 25000);
await page.screenshot({ path: `${shots}/p4-cryptex.png` });

/* ---- spell the name ---- */
await focus('cryptex');
for (let i = 0; i < 6; i++) {
  const d = await ev((idx) => {
    const s = window.__REL.ch5.rings[idx];
    const STEP = Math.PI * 2 / 10;
    let delta = (-s.target * STEP) - s.rot;
    const T = Math.PI * 2;
    delta = ((delta % T) + T) % T; if (delta > Math.PI) delta -= T;
    return delta;
  }, i);
  const g = await P('cryring' + i);
  const dx = d / 0.013;
  const pts = [];
  for (let k = 0; k <= 12; k++) pts.push({ x: g.x + (dx * k) / 12, y: g.y });
  await drag(pts, 25);
  await sleep(450);
}
await check('the name is spoken', () => window.__REL.ch5.solved, 10000);
await check('finale open', () => window.__REL.fin.open, 15000);
await sleep(12000);                                    /* finale animation plays out */
await page.screenshot({ path: `${shots}/p5-finale.png` });

/* ---- read the last letter, choose an ending ---- */
await tap(await P('letter4'));
await check('last letter open', () => document.querySelector('#modal-wrap').classList.contains('open'), 8000);
await page.click('#modal .close-x'); await sleep(900);
await check('choice offered', () => document.querySelector('#modal-wrap').classList.contains('open'));
const btns = await page.$$('#modal .actions .btn');
await btns[1].click();                                  /* CLOSE THE BOX */
await sleep(4200);
await check('ending shown', () => document.querySelector('#ending').classList.contains('open'));
await page.screenshot({ path: `${shots}/p6-ending.png` });

console.log('ERRORS:', JSON.stringify(errors.filter((e) => !e.includes('favicon')), null, 2));
await browser.close();
