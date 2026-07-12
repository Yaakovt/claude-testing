/* Act III playthrough — crosses over from the chalk door, walks the stones,
   weaves the loom, wakes the Hollow in rhythm, draws a door, ends the game. */
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
const check = async (label, fn, timeoutMs = 10000) => {
  const t0 = Date.now(); let ok = false;
  while (Date.now() - t0 < timeoutMs) { ok = await ev(fn); if (ok) break; await sleep(400); }
  console.log(ok ? ' ok ' : 'FAIL', label);
  if (!ok) process.exitCode = 1;
};
async function waitSettled(maxMs = 14000) {
  let last = null; const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await ev(() => ({ p: window.__REL.camera.position.toArray(), en: window.__REL.controls.enabled }));
    if (last && s.en && Math.hypot(s.p[0]-last[0], s.p[1]-last[1], s.p[2]-last[2]) < 0.01) return true;
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
async function closeModalIfOpen() {
  if (await ev(() => document.querySelector('#modal-wrap').classList.contains('open')))
    { await page.click('#modal .close-x'); await sleep(600); }
}

await page.goto('http://127.0.0.1:8901/index.html', { waitUntil: 'networkidle' });
await sleep(1500);
await ev(() => { localStorage.clear(); });
await page.click('#btn-new');
await sleep(3000); await waitSettled();

/* jump to act2 chapter 10 with the shadow locked, then trace the door live */
await ev(() => window.__REL.solveTo(10));
await sleep(2500);
await page.keyboard.press('e'); await sleep(900);
await focus('wall');
const WALLZ2 = -2.0 + 0.02;
async function traceSeg(s) {
  const pts = await ev((idx) => window.__REL.ch10.segs[idx].pts, s);
  const screen = [];
  for (const [x, y] of pts) screen.push(await PW([x, y, WALLZ2]));
  const dense = [];
  for (let i = 0; i < screen.length - 1; i++)
    for (let k = 0; k < 6; k++)
      dense.push({ x: screen[i].x + (screen[i+1].x - screen[i].x) * k / 6,
                   y: screen[i].y + (screen[i+1].y - screen[i].y) * k / 6 });
  dense.push(screen[screen.length - 1]);
  await drag(dense, 25);
  await sleep(600);
}
for (let s = 0; s < 3; s++) {
  for (let a = 0; a < 4; a++) {
    if (await ev((i) => window.__REL.ch10.done[i], s)) break;
    await traceSeg(s);
  }
}
await tap(await PW([0.36, 1.05, WALLZ2]));
await check('door opens', () => window.__REL.ch10.doorOpen, 20000);
await check('final choice offered', () => document.querySelector('#modal-wrap').classList.contains('open'), 40000);
await page.click('#modal .actions .btn');                    /* STEP THROUGH */
await check('crossed into the field', () => window.__REL.state.act === 3 && window.__REL.state.ch === 11, 20000);
await sleep(2500);
await page.screenshot({ path: `${shots}/a3-field.png` });

/* ---- walk the stones ---- */
for (let i = 1; i <= 3; i++) {
  for (let a = 0; a < 4; a++) {
    if (await ev((n) => window.__REL.ch11.progress >= n, i)) break;
    await tap(await P('stone' + i));
    await sleep(1200); await waitSettled();
  }
}
for (let a = 0; a < 4; a++) {
  if (await ev(() => window.__REL.ch11.arrived)) break;
  await tap(await P('platform'));
  await sleep(1500); await waitSettled();
}
await check('arrived at the platform', () => window.__REL.ch11.arrived);
await check('letter in two hands', () => window.__REL.state.letters.includes(7), 15000);
await closeModalIfOpen();
await check('chapter 12', () => window.__REL.state.ch === 12, 15000);
await page.screenshot({ path: `${shots}/a3-platform.png` });

/* ---- weave the loom (lens on for ghost threads) ---- */
await focus('loom');
const EDGES = await ev(() => window.__REL.ch12.edges);
for (const [a, b] of EDGES) {
  for (let att = 0; att < 3; att++) {
    const made = await ev((k) => window.__REL.ch12.made.includes(k), `${a}-${b}`);
    if (made) break;
    const pa = await P('loomstar' + a), pb = await P('loomstar' + b);
    const pts = [];
    for (let k = 0; k <= 8; k++)
      pts.push({ x: pa.x + (pb.x - pa.x) * k / 8, y: pa.y + (pb.y - pa.y) * k / 8 });
    await drag(pts, 30);
    await sleep(700);
  }
}
await check('constellation rewoven', () => window.__REL.ch12.solved, 12000);
await check('chapter 13', () => window.__REL.state.ch === 13, 15000);
await page.screenshot({ path: `${shots}/a3-loom.png` });

/* ---- wake the Hollow: three knocks at the top of the breath ---- */
await focus('hollow');
for (let knocks = 0; knocks < 12; knocks++) {
  if (await ev(() => window.__REL.ch13.solved)) break;
  /* wait until just before the peak */
  for (let w = 0; w < 40; w++) {
    const ph = await ev(() => window.__REL.ch13.phaseInfo());
    if (ph.offPeak < 0.35) break;
    await sleep(120);
  }
  await tap(await P('hollow'));
  await sleep(700);
  console.log('  streak:', await ev(() => window.__REL.ch13.streak), 'misses:', await ev(() => window.__REL.ch13.misses));
}
await check('the Hollow wakes', () => window.__REL.ch13.solved, 8000);
await check('her chalk received', () => window.__REL.state.ch === 14, 25000);
await page.screenshot({ path: `${shots}/a3-hollow.png` });

/* ---- draw a door of your own ---- */
await focus('slab');
const SLABC = [1.8, 1.5, -0.5];
/* draw three strokes across the slab face: two verticals and a top bar */
async function slabPt(u, v) {
  /* slab plane basis in world: u along (-0.78,0,-0.62)? use world offsets via project of param points */
  return await ev(([uu, vv]) => {
    const c = new (window.__REL.camera.position.constructor)(1.8, 1.5, -0.5);
    /* recompute basis exactly like the game: n=(-0.62,0,0.78) → u = cross(Y,n) */
    const n = { x: -0.62, y: 0, z: 0.78 }; const nl = Math.hypot(n.x, n.z); n.x /= nl; n.z /= nl;
    const ux = n.z * 1, uz = -n.x * 1;      /* cross((0,1,0), n) = (n.z, 0, -n.x) */
    const px = 1.8 + ux * uu + n.x * 0.09, py = 1.5 + vv, pz = -0.5 + uz * uu + n.z * 0.09;
    return window.__REL.project(px, py, pz);
  }, [u, v]);
}
for (const stroke of [
  [[-0.35, -0.6], [-0.35, 0.0], [-0.35, 0.6]],
  [[0.35, -0.6], [0.35, 0.0], [0.35, 0.6]],
  [[-0.35, 0.6], [0, 0.75], [0.35, 0.6]],
  [[-0.35, -0.6], [0, -0.6], [0.35, -0.6]],
]) {
  const pts = [];
  for (const [u, v] of stroke)
    for (let k = 0; k < 5; k++) {
      const nu = u, nv = v;   /* densified below via segment interp */
      pts.push([nu, nv]);
    }
  /* densify properly between waypoints */
  const dense = [];
  for (let i = 0; i < stroke.length - 1; i++)
    for (let k = 0; k <= 6; k++)
      dense.push([
        stroke[i][0] + (stroke[i+1][0] - stroke[i][0]) * k / 6,
        stroke[i][1] + (stroke[i+1][1] - stroke[i][1]) * k / 6,
      ]);
  const screenPts = [];
  for (const [u, v] of dense) screenPts.push(await slabPt(u, v));
  await drag(screenPts, 25);
  await sleep(500);
  console.log('  drawn:', await ev(() => window.__REL.ch14.drawn.toFixed(2)), 'humming:', await ev(() => window.__REL.ch14.humming));
  if (await ev(() => window.__REL.ch14.humming)) break;
}
await check('the chalk hums', () => window.__REL.ch14.humming, 8000);
await page.screenshot({ path: `${shots}/a3-drawing.png` });
await tap(await slabPt(0, 0));
await check('the last door made true', () => window.__REL.ch14.done, 8000);
await check('final ending shown', () => document.querySelector('#ending').classList.contains('open'), 30000);
await page.screenshot({ path: `${shots}/a3-ending.png` });
console.log('keepsakes earned:', await ev(() => Object.keys(window.__REL.achEarned).length));

console.log('ERRORS:', JSON.stringify(errors.filter((e) => !e.includes('favicon'))));
await browser.close();
