/* ============================================================================
   THE RELIQUARY — a browser puzzle box in the tradition of The Room
   Original story, art and code. No assets are loaded from the network.
   ==========================================================================*/
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ============================== small utils ============================== */
const $  = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;
const mod = (n, m) => ((n % m) + m) % m;
const easeInOut = (t) => t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
const easeOut   = (t) => 1 - Math.pow(1 - t, 3);

/* deterministic pseudo-random for procedural textures */
let _seed = 1873;
function rnd() { _seed = (_seed * 16807) % 2147483647; return (_seed - 1) / 2147483646; }

/* --- tiny tween engine ---------------------------------------------------*/
const tweens = [];
function tween({ dur = 1, delay = 0, ease = easeInOut, step, done }) {
  const tw = { t: -delay, dur, ease, step, done, dead: false };
  tweens.push(tw);
  return tw;
}
function updateTweens(dt) {
  for (const tw of tweens) {
    if (tw.dead) continue;
    tw.t += dt;
    if (tw.t < 0) continue;
    const k = clamp(tw.t / tw.dur, 0, 1);
    tw.step && tw.step(tw.ease(k));
    if (k >= 1) { tw.dead = true; tw.done && tw.done(); }
  }
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].dead) tweens.splice(i, 1);
}
function delay(sec, fn) { tween({ dur: 0.001, delay: sec, done: fn }); }

/* ================================ audio ================================== */
const Snd = (() => {
  let ctx = null, master = null, noiseBuf = null, on = true, started = false;
  let humGain = null;
  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = on ? 0.9 : 0; master.connect(ctx.destination);
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = buf;
    } catch (e) { return false; }
    return true;
  }
  function env(g, t0, a, peak, dec) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + dec);
  }
  function osc(type, f0, f1, a, peak, dec, when = 0) {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + a + dec);
    env(g, t0, a, peak, dec);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + a + dec + 0.05);
  }
  function noise(peak, dec, fLow = 400, fHigh = 2200, when = 0, type = 'bandpass') {
    if (!ensure()) return;
    const t0 = ctx.currentTime + when;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type;
    f.frequency.setValueAtTime((fLow + fHigh) / 2, t0); f.Q.value = 0.8;
    const g = ctx.createGain(); env(g, t0, 0.004, peak, dec);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dec + 0.1);
  }
  return {
    get on() { return on; },
    toggle() { on = !on; if (ctx) master.gain.linearRampToValueAtTime(on ? 0.9 : 0.0001, ctx.currentTime + 0.15); return on; },
    start() {                       /* ambient bed, called on first gesture */
      if (started || !ensure()) return; started = true;
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime;
      for (const [f, v] of [[44, .035], [44.35, .028], [66, .012]]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v, t0 + 6);
        o.connect(g); g.connect(master); o.start();
      }
      const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.016, t0 + 8);
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = 0.07; lg.gain.value = 0.008;
      lfo.connect(lg); lg.connect(g.gain); lfo.start();
      src.connect(f); f.connect(g); g.connect(master); src.start();
      humGain = ctx.createGain(); humGain.gain.value = 0; humGain.connect(master);
      const h1 = ctx.createOscillator(); h1.type = 'sine'; h1.frequency.value = 138.6;
      const h2 = ctx.createOscillator(); h2.type = 'sine'; h2.frequency.value = 208.0;
      const hg2 = ctx.createGain(); hg2.gain.value = 0.4;
      h1.connect(humGain); h2.connect(hg2); hg2.connect(humGain); h1.start(); h2.start();
    },
    hum(v) { if (humGain) humGain.gain.linearRampToValueAtTime(v * 0.05, ctx.currentTime + 0.8); },
    tick()   { osc('square', 1900, 1200, 0.002, 0.05, 0.03); noise(0.05, 0.03, 3000, 6000); },
    click()  { osc('square', 950, 500, 0.002, 0.09, 0.05); noise(0.07, 0.04, 1400, 3000); },
    slide()  { noise(0.10, 0.22, 300, 900, 0, 'lowpass'); },
    knock()  { osc('sine', 130, 60, 0.002, 0.22, 0.14); noise(0.06, 0.06, 150, 500); },
    thunk()  { osc('sine', 95, 40, 0.003, 0.35, 0.30); noise(0.10, 0.10, 120, 420, 0, 'lowpass'); },
    paper()  { noise(0.09, 0.20, 900, 2600); noise(0.05, 0.12, 1800, 4200, 0.06); },
    pickup() { osc('sine', 520, 780, 0.004, 0.10, 0.25); osc('sine', 1040, 1560, 0.004, 0.05, 0.22, 0.03); },
    ratchet() { for (let i = 0; i < 5; i++) { osc('square', 1500, 900, 0.002, 0.05, 0.03, i * 0.07); } },
    unlock() { osc('sine', 180, 70, 0.003, 0.3, 0.2); osc('sine', 120, 50, 0.003, 0.3, 0.35, 0.14); noise(0.08, 0.2, 200, 700, 0.1, 'lowpass'); },
    chime()  {
      [659.25, 830.61, 987.77, 1318.51].forEach((f, i) =>
        osc('sine', f, f, 0.01, 0.12, 1.9 + i * 0.15, i * 0.13));
      osc('sine', 329.63, 329.63, 0.02, 0.08, 2.6, 0.1);
    },
    lens(onNow) {
      if (onNow) { noise(0.10, 0.45, 500, 4200); osc('sine', 300, 900, 0.05, 0.05, 0.5); }
      else       { noise(0.08, 0.3, 3800, 700);  osc('sine', 800, 260, 0.05, 0.04, 0.35); }
    },
    riser() {
      osc('sine', 80, 320, 2.2, 0.14, 2.4); osc('sine', 120, 480, 2.2, 0.08, 2.6, 0.1);
      noise(0.06, 3.2, 300, 2400, 0.4);
    },
  };
})();

/* =========================== renderer & scene ============================ */
const app = $('#app');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.body.innerHTML = '<p style="padding:3em;font-family:serif">This chamber requires WebGL, and your browser has declined to provide it.</p>';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x040302, 0.045);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.05, 60);
camera.position.set(7.5, 5, 9);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.07;
controls.minDistance = 1.15; controls.maxDistance = 9;
controls.maxPolarAngle = 1.48; controls.enablePan = false;
controls.target.set(0, 0.95, 0);
controls.enabled = false;

/* post processing */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.85, 0.8);
composer.addPass(bloom);
composer.addPass(new OutputPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  if (typeof inspectCam !== 'undefined') {
    inspectCam.aspect = camera.aspect; inspectCam.updateProjectionMatrix();
  }
});

/* lights */
scene.add(new THREE.HemisphereLight(0x35302a, 0x070605, 0.65));
const key = new THREE.SpotLight(0xffd9a0, 115, 0, 0.55, 0.65, 1.8);
key.position.set(2.6, 5.2, 2.2); key.target.position.set(0, 0.8, 0);
key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.0004; key.shadow.radius = 4;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0x4f6f96, 0.7);
rim.position.set(-4, 2.6, -3.5); scene.add(rim);
const candleLight = new THREE.PointLight(0xff9a3c, 4, 7, 1.6);
candleLight.position.set(2.15, 0.95, -1.55); scene.add(candleLight);

/* ========================= procedural textures =========================== */
function makeTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function paintWood(ctx, w, h, base, dark, streaks = 130) {
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < streaks; i++) {
    const y = rnd() * h, len = 40 + rnd() * w, x = rnd() * w - len / 2;
    ctx.strokeStyle = `rgba(0,0,0,${0.04 + rnd() * 0.10})`;
    ctx.lineWidth = 0.5 + rnd() * 2.2;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * .3, y + (rnd() - .5) * 14, x + len * .7, y + (rnd() - .5) * 14, x + len, y + (rnd() - .5) * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {                                   /* knots */
    const x = rnd() * w, y = rnd() * h, r = 3 + rnd() * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
    g.addColorStop(0, dark); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.4, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,235,190,0.03)';
  for (let i = 0; i < 250; i++) ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1);
}
function filigree(ctx, w, h, tint = 'rgba(20,12,6,0.55)') {
  ctx.strokeStyle = tint; ctx.lineWidth = 3;
  const m = w * 0.055;
  ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
  ctx.lineWidth = 1.4;
  ctx.strokeRect(m * 1.7, m * 1.7, w - 3.4 * m, h - 3.4 * m);
  const r = m * 1.35;
  for (const [cx, cy] of [[m, m], [w - m, m], [m, h - m], [w - m, h - m]]) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, TAU); ctx.stroke();
  }
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(Math.PI / 4);
  const d = Math.min(w, h) * 0.11;
  ctx.strokeRect(-d, -d, 2 * d, 2 * d);
  ctx.restore();
  ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.19, 0, TAU); ctx.stroke();
}
const woodBoxTex = makeTex(1024, 512, (c, w, h) => { paintWood(c, w, h, '#4a300f', '#1c1006'); });

const woodPanelTex = makeTex(1024, 640, (c, w, h) => {
  paintWood(c, w, h, '#503512', '#20120a'); filigree(c, w, h);
});
const woodLidTex = makeTex(1024, 700, (c, w, h) => {
  paintWood(c, w, h, '#452c0e', '#1a0e05'); filigree(c, w, h, 'rgba(210,170,90,0.20)');
});
const tableTex = makeTex(1024, 1024, (c, w, h) => {
  paintWood(c, w, h, '#2b1c0c', '#120a04', 220);
  const g = c.createRadialGradient(w/2, h/2, w*0.1, w/2, h/2, w*0.7);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
});
tableTex.wrapS = tableTex.wrapT = THREE.RepeatWrapping; tableTex.repeat.set(2, 2);

const paperTex = makeTex(256, 256, (c, w, h) => {
  c.fillStyle = '#e5d7b4'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(120,90,40,${rnd()*0.07})`; c.fillRect(rnd()*w, rnd()*h, 1.5, 1); }
  c.strokeStyle = 'rgba(90,70,40,0.5)'; c.strokeRect(4, 4, w - 8, h - 8);
  c.fillStyle = 'rgba(70,50,25,0.55)'; c.font = 'italic 13px Georgia';
  for (let i = 0; i < 9; i++) c.fillText('~~~~~~~~~~~~~~~~~~~~~~', 22, 40 + i * 22);
});

/* materials */
const MAT = {
  wood:      new THREE.MeshStandardMaterial({ map: woodBoxTex, roughness: 0.82, metalness: 0.05, envMapIntensity: 0.35, bumpMap: woodBoxTex, bumpScale: 0.6 }),
  woodPanel: new THREE.MeshStandardMaterial({ map: woodPanelTex, roughness: 0.78, metalness: 0.05, envMapIntensity: 0.4, bumpMap: woodPanelTex, bumpScale: 0.9 }),
  woodLid:   new THREE.MeshStandardMaterial({ map: woodLidTex, roughness: 0.75, metalness: 0.06, envMapIntensity: 0.45, bumpMap: woodLidTex, bumpScale: 0.8 }),
  woodDark:  new THREE.MeshStandardMaterial({ color: 0x1c1208, roughness: 0.9, envMapIntensity: 0.15 }),
  brass:     new THREE.MeshStandardMaterial({ color: 0xc79a3e, roughness: 0.34, metalness: 0.95, envMapIntensity: 1.1 }),
  brassDark: new THREE.MeshStandardMaterial({ color: 0x6e5423, roughness: 0.5, metalness: 0.9, envMapIntensity: 0.9 }),
  iron:      new THREE.MeshStandardMaterial({ color: 0x3b3a38, roughness: 0.55, metalness: 0.85, envMapIntensity: 0.7 }),
  paper:     new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9, side: THREE.DoubleSide }),
  mirror:    new THREE.MeshStandardMaterial({ color: 0xcfd6dd, roughness: 0.06, metalness: 1.0, envMapIntensity: 1.6 }),
  glassLens: new THREE.MeshStandardMaterial({ color: 0x9fd7e8, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.75, emissive: 0x1b3d4a, emissiveIntensity: 0.6 }),
};

/* ============================ the aether layer ============================ */
const aether = { k: 0, on: false, mats: [] };
function aetherMat(maxOp = 0.85, color = 0x9fe0ff, map = null) {
  const m = new THREE.MeshBasicMaterial({
    color, map, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  m.userData.maxOp = maxOp; aether.mats.push(m); return m;
}
function setLens(on) {
  if (on === aether.on) return;
  if (on && !state.hasLens) return;
  aether.on = on;
  document.body.classList.toggle('lens-on', on);
  $('#btn-lens').classList.toggle('active', on);
  Snd.lens(on); Snd.hum(on ? 0.5 : (state.ch >= 6 ? 0.4 : 0));
  const from = aether.k, to = on ? 1 : 0;
  tween({ dur: 0.6, step: (k) => {
    aether.k = lerp(from, to, k);
    bloom.strength = lerp(0.5, 1.25, aether.k);
    for (const m of aether.mats) m.opacity = m.userData.maxOp * aether.k;
  }});
}
function glyphTex(draw) {
  return makeTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = '#bfeaff'; c.fillStyle = '#bfeaff';
    c.shadowColor = '#7fd4ff'; c.shadowBlur = 14; c.lineWidth = 4; c.lineCap = 'round';
    draw(c, w, h);
  });
}

/* ================================ world =================================== */
/* backdrop */
{
  const t = makeTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0d0a06'); g.addColorStop(0.45, '#070503'); g.addColorStop(1, '#020202');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16),
    new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false }));
  scene.add(sky);
}
/* table */
{
  const table = new THREE.Mesh(new THREE.BoxGeometry(16, 0.35, 16),
    new THREE.MeshStandardMaterial({ map: tableTex, roughness: 0.85, envMapIntensity: 0.25 }));
  table.position.y = -0.175; table.receiveShadow = true; scene.add(table);
}
/* candle */
{
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.09, 0.16, 16), MAT.brassDark);
  stick.position.y = 0.08;
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.55, 12), new THREE.MeshStandardMaterial({ color: 0xe8dcbf, roughness: 0.6 }));
  wax.position.y = 0.44; wax.castShadow = true;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.09, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false }));
  flame.position.y = 0.78; flame.name = 'flame';
  g.add(stick, wax, flame); g.position.set(2.15, 0, -1.55); scene.add(g);
}
/* dust motes */
let dust;
{
  const N = 260, pos = new Float32Array(N * 3), seedArr = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i*3] = (rnd() - .5) * 7; pos[i*3+1] = rnd() * 3.2; pos[i*3+2] = (rnd() - .5) * 7;
    seedArr[i] = rnd() * TAU;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const spr = makeTex(32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  });
  dust = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.02, map: spr, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  dust.userData.seeds = seedArr; scene.add(dust);
}

/* ============================== THE BOX =================================== */
const box = new THREE.Group(); scene.add(box);
const BW = 2.2, BH = 1.4, BD = 1.5, BY = 0.12;          /* body dims, bottom y */

function brassStrip(w, h, d, x, y, z, mat = MAT.brass) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; box.add(m); return m;
}
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BD),
    [MAT.woodPanel, MAT.woodPanel, MAT.wood, MAT.wood, MAT.woodPanel, MAT.woodPanel]);
  body.position.set(0, BY + BH / 2, 0);
  body.castShadow = body.receiveShadow = true;
  body.userData.knock = true;
  box.add(body);
  /* corner brass */
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    brassStrip(0.07, BH + 0.03, 0.07, sx * (BW/2 - 0.02), BY + BH/2, sz * (BD/2 - 0.02), MAT.brassDark);
  /* horizontal trims */
  for (const yy of [BY + 0.05, BY + BH - 0.05]) {
    brassStrip(BW + 0.05, 0.05, 0.05, 0, yy, BD/2, MAT.brassDark);
    brassStrip(BW + 0.05, 0.05, 0.05, 0, yy, -BD/2, MAT.brassDark);
    brassStrip(0.05, 0.05, BD + 0.05, BW/2, yy, 0, MAT.brassDark);
    brassStrip(0.05, 0.05, BD + 0.05, -BW/2, yy, 0, MAT.brassDark);
  }
  /* feet */
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), MAT.brassDark);
    f.scale.y = 0.8; f.position.set(sx * (BW/2 - 0.16), 0.07, sz * (BD/2 - 0.16));
    f.castShadow = true; box.add(f);
  }
  /* maker's plaque */
  const plq = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.012),
    new THREE.MeshStandardMaterial({
      map: makeTex(512, 100, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#d8b25e'); g.addColorStop(0.5, '#a37c31'); g.addColorStop(1, '#d8b25e');
        c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.strokeStyle = '#5c431a'; c.lineWidth = 4; c.strokeRect(6, 6, w - 12, h - 12);
        c.fillStyle = '#43300f'; c.font = '600 40px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('E · VANE — HOROLOGIST', w / 2, h / 2 + 2);
      }), metalness: 0.9, roughness: 0.35, envMapIntensity: 1.1,
    }));
  plq.position.set(-0.55, 0.27, BD/2 + 0.007);
  plq.userData.onTap = () => say('“E. Vane — Horologist.” The plate is worn smooth where a thumb has rested for forty years.');
  box.add(plq);
}
/* lid (two halves so the finale can split them) */
const lidL = new THREE.Group(), lidR = new THREE.Group();
box.add(lidL, lidR);
{
  const lw = (BW + 0.14) / 2;
  for (const [grp, sx] of [[lidL, -1], [lidR, 1]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.18, BD + 0.14), MAT.woodLid);
    m.position.set(sx * lw / 2, 0, 0); m.castShadow = m.receiveShadow = true;
    m.userData.knock = true;
    grp.add(m);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(lw + 0.02, 0.045, BD + 0.2), MAT.brassDark);
    trim.position.set(sx * lw / 2, -0.075, 0); grp.add(trim);
    grp.position.set(0, BY + BH + 0.09, 0);
  }
}
const LID_TOP = BY + BH + 0.18;                                    /* y = 1.70 */

/* ====================== interaction plumbing ============================= */
const state = {
  ch: 0, hasLens: false, keyFixed: false, playing: false,
  letters: [], selected: null, focus: 'overview', busy: false,
};
const MARKS = {};                 /* named world objects, for the debug API */
const interactables = [];                    /* meshes with userData handlers */
function reg(mesh, ud) { Object.assign(mesh.userData, ud); interactables.push(mesh); return mesh; }

const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
function castAt(ev, list) {
  const r = renderer.domElement.getBoundingClientRect();
  pointerNdc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointerNdc, camera);
  return raycaster.intersectObjects(list, true);
}
function planePoint(planeNormal, planeConst) {
  const pl = new THREE.Plane(planeNormal, planeConst);
  const p = new THREE.Vector3();
  return raycaster.ray.intersectPlane(pl, p) ? p : null;
}

/* ========================= subtitles / cards / UI ======================== */
let sayTimer = null;
function say(text, dur = 4.2) {
  const el = $('#subtitle');
  el.textContent = text; el.classList.add('show');
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => el.classList.remove('show'), dur * 1000);
}
const CHAPTERS = [
  null,
  ['CHAPTER I', 'THE HOROLOGIST’S DRAWER'],
  ['CHAPTER II', 'THE CELESTIAL DIAL'],
  ['CHAPTER III', 'THE AETHER ENGINE'],
  ['CHAPTER IV', 'A QUARTER PAST NINE'],
  ['CHAPTER V', 'THE UNSPOKEN NAME'],
  ['CHAPTER VI', 'THE DOOR HELD SHUT'],
];
function chapterCard(n) {
  const el = $('#chapter-card');
  el.querySelector('.num').textContent = CHAPTERS[n][0];
  el.querySelector('.name').textContent = CHAPTERS[n][1];
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4200);
}

/* ------------------------------ modal ----------------------------------- */
const modalWrap = $('#modal-wrap'), modal = $('#modal');
let onModalClose = null, modalClosable = true;
function openModal({ title, html, sig = '', dark = false, actions = [], closable = true, onClose = null }) {
  modalClosable = closable;
  modal.classList.toggle('dark', dark);
  modal.querySelector('h2').textContent = title;
  modal.querySelector('.body').innerHTML = html;
  modal.querySelector('.sig').textContent = sig;
  const act = modal.querySelector('.actions'); act.innerHTML = '';
  for (const a of actions) {
    const b = document.createElement('button');
    b.className = 'btn small'; b.textContent = a.label;
    b.onclick = () => a.fn();
    act.appendChild(b);
  }
  modal.querySelector('.close-x').style.display = closable ? '' : 'none';
  onModalClose = onClose;
  modalWrap.classList.add('open');
}
function closeModal() {
  modalWrap.classList.remove('open');
  const fn = onModalClose; onModalClose = null; fn && fn();
}
modal.querySelector('.close-x').onclick = closeModal;
modalWrap.addEventListener('pointerdown', (e) => { if (e.target === modalWrap && modalClosable) closeModal(); });

/* ------------------------------ letters ---------------------------------- */
const LETTERS = [
  {
    title: 'LETTER THE FIRST', sig: '— E.V.',
    html: `To the one who finds my house in disorder —

The solicitors will have told you that Edwin Vane is dead. Sign nothing. Grief makes a poor witness, and I am not yet done being alive.

The box upon my worktable is not an heirloom. It is an <em>instrument</em>, and like any instrument it is honest only with those who learn its tuning. I have left you my second-best eyepiece; the best one went with me. Wear the glass. Nothing in this room is only what it seems — least of all the room.

Begin gently. The Reliquary rewards patience and punishes pride. In that respect it takes after its maker.`,
  },
  {
    title: 'LETTER THE SECOND', sig: '— E.V.',
    html: `I write this with a hand I no longer trust.

On the night my sister left us I stopped every clock in this house, and I bent the winding key so that no well-meaning fool could start them again. Time did not deserve to continue. I see now that this was vanity. Time continued anyway; it merely stopped visiting me.

If you mean to go further, you must give the house back its heartbeat. Mend what my fury bent. Wind the chronometer, and set its hands to the minute I have never once stopped seeing:

<em>a quarter past nine.</em>`,
  },
  {
    title: 'THE SIXTH LINE', sig: '— E.V.',
    html: `<em>E</em>very night I wind the house to silence, and still I hear her counting the stairs.

<em>L</em>ong before the Hollow had a name, she drew its door in chalk upon the nursery wall.

<em>O</em>nly I believed her. That is my sin — belief, arriving too late to be of use.

<em>W</em>hen the glass shows you a second room, do not mistake it for a trick of grief.

<em>E</em>very lock I ever cut was practice for this one.

<em>N</em>ow spell what I could never bring myself to say aloud, and open my heart’s last door.`,
  },
  {
    title: 'LETTER THE LAST', sig: '— Edwin Vane, horologist, brother',
    html: `So you have opened my heart’s last door. Then you have earned arithmetic instead of poetry.

Elowen did not die. <em>Died</em> is a word for something the world takes from you, and the world did not take her — a door did. A door she drew in chalk when she was nine, and that I was old enough to laugh at.

For forty years I built locks against that door. Then I grew honest, and built a key instead. This box. My one true work.

The Hollow waits on the other side. I do not believe it is cruel. I believe it is <em>empty</em>, and that for forty years my sister has been keeping it company.

I have gone through to see which of us is right.

The glass will show you. Whether you raise it is not my decision to make.`,
  },
];
function giveLetter(i, silent = false) {
  if (!state.letters.includes(i)) state.letters.push(i);
  $('#btn-journal').classList.remove('hidden');
  if (!silent) { Snd.paper(); showLetter(i); }
}
function showLetter(i) {
  const L = LETTERS[i];
  openModal({ title: L.title, html: L.html, sig: L.sig });
}
$('#btn-journal').onclick = () => {
  const actions = state.letters.slice().sort((a, b) => a - b)
    .map((i) => ({ label: LETTERS[i].title, fn: () => showLetter(i) }));
  openModal({ title: 'THE JOURNAL', dark: true, actions,
    html: 'Everything Edwin Vane left behind, he left on purpose.\n\nRead again what the house has surrendered so far.' });
};

/* ------------------------------ hints ------------------------------------ */
const HINTS = {
  1: ['The rosette on the front face sits proud of the wood, on a spindle. Such things are made to be turned — and machines resist in the right order.',
      'Turn the rosette until its notch meets the small engraved arrow above it. The bolt beside it will then slide to the right, and the drawer below will give.'],
  2: ['The chart on the lid is missing its sky. The glass you found shows where the stars would rather be.',
      'Raise the eyepiece (E) and look at the lid. Turn each brass ring until its stars sit inside the pale ghost-marks. All three rings must agree at once.'],
  3: ['An engine with nothing to burn — to the naked eye, that is.',
      'With the eyepiece raised, tap the little mirrors to tilt them. Steer the pale beam from the nozzle down the left column, along the bottom, and up into the crystal.'],
  4: ['The house wants its heartbeat back, but the winding key was bent by grief. Look more closely at what fury bent.',
      'Select the key and tap it a second time to examine it — press its bow straight. Use it on the small keyhole, then drag the hands to a quarter past nine. If you doubt the letter, the glass has scorched the answer beside the dial.'],
  5: ['Whose name is never once spoken in these letters — and yet begins every line of the last one?',
      'Read “The Sixth Line” top to bottom, first letters only: E · L · O · W · E · N. Spell it on the column, top ring to bottom.'],
  6: ['There is nothing left to solve. There is only what you choose to see.',
      'There is nothing left to solve. There is only what you choose to see.'],
};
$('#btn-hint').onclick = () => {
  const h = HINTS[clamp(state.ch, 1, 6)] || HINTS[1];
  openModal({
    title: 'A WHISPER', dark: true, html: h[0],
    actions: [{ label: 'WHISPER MORE', fn: () => { modal.querySelector('.body').textContent = h[1]; } }],
  });
};

/* ---------------------------- inventory ---------------------------------- */
const inventory = [];         /* {id, icon, name, desc} */
function invAdd(item) { inventory.push(item); renderInv(); Snd.pickup(); }
function invRemove(id) {
  const i = inventory.findIndex((x) => x.id === id);
  if (i >= 0) inventory.splice(i, 1);
  if (state.selected === id) state.selected = null;
  renderInv();
}
function renderInv() {
  const bar = $('#inventory'); bar.innerHTML = '';
  for (const it of inventory) {
    const s = document.createElement('div');
    s.className = 'slot' + (state.selected === it.id ? ' selected' : '');
    s.innerHTML = `<span class="icon">${it.icon}</span><span class="tag">${it.name}</span>`;
    s.onclick = () => {
      if (state.selected === it.id) { openInspect(it.id); }
      else { state.selected = it.id; renderInv(); say(`${it.name} — tap it again to look closer, or tap where it might belong.`); }
    };
    bar.appendChild(s);
  }
}

/* ---------------------------- inspection --------------------------------- */
const inspectScene = new THREE.Scene();
inspectScene.add(new THREE.HemisphereLight(0x807a6e, 0x0a0806, 1.2));
{ const d = new THREE.DirectionalLight(0xffe0b0, 2.2); d.position.set(1.5, 2, 2); inspectScene.add(d); }
const inspectCam = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.01, 10);
inspectCam.position.set(0, 0, 0.55);
let inspectItem = null, inspectOpen = false;

function buildKeyModel() {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12), MAT.brass);
  shaft.rotation.z = Math.PI / 2;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 12), MAT.brassDark);
  collar.rotation.z = Math.PI / 2; collar.position.x = -0.02;
  const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.012), MAT.brass);
  bit1.position.set(-0.095, -0.032, 0);
  const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.034, 0.012), MAT.brass);
  bit2.position.set(-0.062, -0.026, 0);
  const bowPivot = new THREE.Group(); bowPivot.position.x = 0.11;
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 10, 24), MAT.brass);
  bow.position.x = 0.045;
  bowPivot.add(bow);
  bow.userData.isBow = true;
  g.add(shaft, collar, bit1, bit2, bowPivot);
  g.userData.bowPivot = bowPivot;
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
function buildEyepieceModel() {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.15, 20), MAT.brass);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.009, 10, 24), MAT.brassDark);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.075;
  const knurl = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.022, 24), MAT.brassDark);
  knurl.position.y = -0.045;
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.008, 20), MAT.glassLens);
  lens.position.y = 0.078;
  g.add(tube, ring, knurl, lens);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
const INSPECT_META = {
  key: {
    name: 'THE WINDING KEY',
    desc: () => state.keyFixed
      ? 'A winding key, true again. It remembers its clock.'
      : 'A winding key — bent almost double at the bow, by a strong hand and a bad night. Tap the bent loop.',
  },
  eyepiece: {
    name: 'THE EYEPIECE',
    desc: () => 'Edwin Vane’s second-best eyepiece. Cold to the touch, and faintly humming. Press E to wear it.',
  },
};
function openInspect(id) {
  if (inspectItem) inspectScene.remove(inspectItem);
  inspectItem = id === 'key' ? buildKeyModel() : buildEyepieceModel();
  if (id === 'key' && !state.keyFixed) inspectItem.userData.bowPivot.rotation.z = -1.1;
  if (id === 'eyepiece') inspectItem.rotation.z = Math.PI / 2.4;
  inspectItem.userData.id = id;
  inspectScene.add(inspectItem);
  inspectOpen = true;
  $('#inspect-wrap').classList.add('open');
  $('#inspect-name').textContent = INSPECT_META[id].name;
  $('#inspect-desc').textContent = INSPECT_META[id].desc();
}
function closeInspect() { inspectOpen = false; $('#inspect-wrap').classList.remove('open'); }
$('#inspect-close').onclick = closeInspect;
{
  let dragging = false, px = 0, py = 0, moved = 0;
  const el = $('#inspect-wrap');
  el.addEventListener('pointerdown', (e) => { dragging = true; moved = 0; px = e.clientX; py = e.clientY; });
  el.addEventListener('pointermove', (e) => {
    if (!dragging || !inspectItem) return;
    const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    inspectItem.rotation.y += dx * 0.012; inspectItem.rotation.x += dy * 0.012;
  });
  el.addEventListener('pointerup', (e) => {
    dragging = false;
    if (moved > 8 || !inspectItem) return;
    /* a tap — check for the bent bow */
    if (inspectItem.userData.id === 'key' && !state.keyFixed) {
      const r = renderer.domElement.getBoundingClientRect();
      pointerNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(pointerNdc, inspectCam);
      const hits = raycaster.intersectObject(inspectItem, true);
      if (hits.some((h) => h.object.userData.isBow)) {
        state.keyFixed = true; Snd.click(); Snd.thunk();
        const piv = inspectItem.userData.bowPivot, from = piv.rotation.z;
        tween({ dur: 0.5, step: (k) => { piv.rotation.z = lerp(from, 0, k); },
          done: () => { $('#inspect-desc').textContent = INSPECT_META.key.desc(); saveGame(); } });
        say('The bow gives, then rings straight. Good metal forgives.');
      }
    }
  });
}

/* ========================= camera focus system =========================== */
const NODES = {
  overview: { pos: [3.2, 2.6, 4.4],  tgt: [0, 0.95, 0] },
  front:    { pos: [0.15, 1.1, 3.1], tgt: [0, 0.82, 0.7] },
  top:      { pos: [-0.15, 3.55, 1.45], tgt: [0, 1.62, 0] },
  left:     { pos: [-3.5, 1.4, 0.5], tgt: [-1.3, 0.9, 0] },
  right:    { pos: [3.15, 1.25, 0.35], tgt: [0.95, 0.9, 0] },
  cryptex:  { pos: [0.55, 2.45, 2.2], tgt: [0.55, 1.95, 0] },
  finale:   { pos: [0.3, 2.1, 3.5],  tgt: [0, 1.35, 0] },
};
let camTween = null;
function focusNode(name, dur = 1.4) {
  if (state.focus === name && !camTween) return;
  state.focus = name;
  $('#btn-back').classList.toggle('hidden', name === 'overview');
  const n = NODES[name];
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  const p1 = new THREE.Vector3(...n.pos), t1 = new THREE.Vector3(...n.tgt);
  controls.enabled = false;
  if (camTween) camTween.dead = true;
  camTween = tween({ dur, step: (k) => {
    camera.position.lerpVectors(p0, p1, k);
    controls.target.lerpVectors(t0, t1, k);
  }, done: () => { camTween = null; controls.enabled = true; } });
}
$('#btn-back').onclick = () => focusNode('overview');
function regionOfPoint(p) {
  if (state.ch === 5 && p.y > 1.72) return 'cryptex';
  const dx = p.x / (BW / 2), dy = (p.y - (BY + BH / 2)) / (BH / 2 + 0.3), dz = p.z / (BD / 2);
  const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
  if (ay > ax && ay > az && dy > 0) return 'top';
  if (ax > az) return dx > 0 ? 'right' : 'left';
  return dz > 0 ? 'front' : 'front';
}

/* ====================== CHAPTER I — latch & drawer ======================== */
const ch1 = {};
{
  const FZ = BD / 2;                                       /* front plane z */
  /* engraved arrow above rosette */
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.06, 3), MAT.brassDark);
  arrow.position.set(-0.55, 1.33, FZ + 0.006); arrow.rotation.z = Math.PI;
  box.add(arrow);
  /* rosette dial */
  const rosette = new THREE.Group();
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.05, 24), MAT.brass);
  disk.rotation.x = Math.PI / 2;
  rosette.add(disk);
  const petalGeo = new THREE.SphereGeometry(0.045, 10, 8);
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(petalGeo, MAT.brassDark);
    p.scale.set(1, 0.55, 0.5);
    const a = (i / 8) * TAU;
    p.position.set(Math.cos(a) * 0.115, Math.sin(a) * 0.115, 0.028);
    p.rotation.z = a;
    rosette.add(p);
  }
  const notchMat = new THREE.MeshStandardMaterial({ color: 0xf0dc9a, metalness: 0.85, roughness: 0.25 });
  const notch = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 3), notchMat);
  notch.position.set(0, 0.155, 0.03);
  rosette.add(notch);
  ch1.rosette = rosette;
  rosette.position.set(-0.55, 1.08, FZ + 0.035);
  box.add(rosette);
  MARKS.rosette = rosette;

  ch1.rosetteAngle = Math.PI;                      /* notch starts pointing down */
  rosette.rotation.z = ch1.rosetteAngle;
  ch1.rosetteSolved = false;

  reg(disk, {
    enabled: () => state.ch === 1 && !ch1.rosetteSolved,
    cursor: 'grab',
    dragStart(hit) {
      const p = planePoint(new THREE.Vector3(0, 0, 1), -(FZ + 0.03));
      this._a0 = p ? Math.atan2(p.y - 1.08, p.x + 0.55) : 0;
      this._r0 = ch1.rosetteAngle;
    },
    drag() {
      const p = planePoint(new THREE.Vector3(0, 0, 1), -(FZ + 0.03));
      if (!p) return;
      const a = Math.atan2(p.y - 1.08, p.x + 0.55);
      ch1.rosetteAngle = this._r0 + (a - this._a0);
      rosette.rotation.z = ch1.rosetteAngle;
      const st = Math.round(ch1.rosetteAngle / (TAU / 16));
      if (st !== this._lastTick) { this._lastTick = st; Snd.tick(); }
    },
    dragEnd() {
      const a = mod(ch1.rosetteAngle, TAU);
      if (a < 0.16 || TAU - a < 0.16) {
        ch1.rosetteSolved = true;
        const from = ch1.rosetteAngle; ch1.rosetteAngle = 0;
        tween({ dur: 0.25, step: (k) => { rosette.rotation.z = lerp(from, Math.round(from / TAU) * TAU, k); } });
        Snd.unlock();
        say('Inside the wood, something heavy leans back and lets go.');
      }
    },
  });

  /* latch bolt */
  const latch = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.075, 0.035), MAT.brass);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), MAT.brassDark);
  knob.position.set(0.16, 0, 0.03);
  latch.add(bar, knob);
  latch.position.set(0.22, 1.08, FZ + 0.03);
  box.add(latch);
  MARKS.latch = bar; MARKS.latchGrp = latch;
  for (const kx of [-0.02, 0.42]) {                       /* keeper staples */
    const kp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.11, 0.055), MAT.brassDark);
    kp.position.set(0.22 + kx, 1.08, FZ + 0.02); box.add(kp);
  }
  ch1.latchT = 0; ch1.latchOpen = false;
  reg(bar, {
    enabled: () => state.ch === 1 && !ch1.latchOpen,
    cursor: 'grab',
    dragStart() {
      if (!ch1.rosetteSolved) {
        Snd.knock(); say('The bolt won’t budge. Something pins it — behind the rosette, perhaps.');
        return;
      }
      const p = planePoint(new THREE.Vector3(0, 0, 1), -(FZ + 0.03));
      this._x0 = p ? p.x : 0; this._t0 = ch1.latchT;
    },
    drag() {
      if (!ch1.rosetteSolved) return;
      const p = planePoint(new THREE.Vector3(0, 0, 1), -(FZ + 0.03));
      if (!p) return;
      ch1.latchT = clamp(this._t0 + (p.x - this._x0), 0, 0.34);
      latch.position.x = 0.22 + ch1.latchT;
    },
    dragEnd() {
      if (!ch1.rosetteSolved) return;
      if (ch1.latchT > 0.30) {
        ch1.latchOpen = true; latch.position.x = 0.22 + 0.34;
        Snd.thunk();
        delay(0.25, () => { openDrawer(); });
      } else {
        tween({ dur: 0.3, step: (k) => { latch.position.x = 0.22 + lerp(ch1.latchT, 0, k); }, done: () => { ch1.latchT = 0; } });
      }
    },
  });

  /* drawer */
  const drawer = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.04), MAT.woodPanel);
  const pull = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 10, 24), MAT.brassDark);
  pull.position.set(0, -0.04, 0.035); pull.rotation.x = 0.5;
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.06, 0.5), MAT.woodDark);
  tray.position.set(0, -0.14, -0.27);
  drawer.add(face, pull, tray);
  drawer.position.set(0.1, 0.5, BD / 2 - 0.02);
  box.add(drawer);
  ch1.drawer = drawer; ch1.drawerOpen = false;

  /* contents */
  const letterMesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.2), MAT.paper);
  letterMesh.position.set(-0.2, -0.09, -0.3); letterMesh.rotation.y = 0.3;
  const eyepiece = buildEyepieceModel();
  eyepiece.scale.setScalar(1.15);
  eyepiece.position.set(0.22, -0.05, -0.28); eyepiece.rotation.z = Math.PI / 2; eyepiece.rotation.y = 0.5;
  drawer.add(letterMesh, eyepiece);
  MARKS.letter1 = letterMesh; MARKS.eyepiece1 = eyepiece;
  ch1.gotLetter = false; ch1.gotLens = false;

  function openDrawer() {
    if (ch1.drawerOpen) return;
    ch1.drawerOpen = true; Snd.slide();
    tween({ dur: 0.9, ease: easeOut, step: (k) => { drawer.position.z = BD / 2 - 0.02 + k * 0.55; },
      done: () => say('The drawer offers up its keepings like an apology.') });
  }
  ch1.openDrawer = openDrawer;

  reg(face, {
    enabled: () => state.ch === 1 && !ch1.drawerOpen,
    cursor: 'pointer',
    tap() {
      if (ch1.latchOpen) openDrawer();
      else { Snd.knock(); say('Locked. A bolt above holds it fast.'); }
    },
  });
  letterMesh.traverse((o) => reg(o, {
    enabled: () => ch1.drawerOpen && !ch1.gotLetter, cursor: 'pointer',
    tap() {
      ch1.gotLetter = true; letterMesh.visible = false;
      giveLetter(0); checkCh1Done();
    },
  }));
  eyepiece.traverse((o) => { if (o.isMesh) reg(o, {
    enabled: () => ch1.drawerOpen && !ch1.gotLens, cursor: 'pointer',
    tap() {
      ch1.gotLens = true; eyepiece.visible = false;
      state.hasLens = true;
      invAdd({ id: 'eyepiece', icon: '◎', name: 'the eyepiece' });
      $('#btn-lens').classList.remove('hidden');
      say('The eyepiece is cold, and not quite silent. Press E to raise it.');
      checkCh1Done();
    },
  }); });

  function checkCh1Done() {
    if (ch1.gotLetter && ch1.gotLens && state.ch === 1) advanceChapter(2);
  }

  ch1.applySolved = () => {
    ch1.rosetteSolved = true; ch1.rosetteAngle = 0; rosette.rotation.z = 0;
    ch1.latchOpen = true; ch1.latchT = 0.34; latch.position.x = 0.22 + 0.34;
    ch1.drawerOpen = true; drawer.position.z = BD / 2 - 0.02 + 0.55;
    ch1.gotLetter = true; letterMesh.visible = false;
    ch1.gotLens = true; eyepiece.visible = false;
    state.hasLens = true;
    if (!inventory.some((i) => i.id === 'eyepiece')) invAdd({ id: 'eyepiece', icon: '◎', name: 'the eyepiece' });
    $('#btn-lens').classList.remove('hidden');
    if (!state.letters.includes(0)) giveLetter(0, true);
  };

  /* front aether glyph — a chalk door, child-drawn */
  const doorGlyph = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.44),
    aetherMat(0.45, 0x9fe0ff, glyphTex((c, w, h) => {
      c.strokeRect(w * .2, h * .12, w * .6, h * .8);
      c.beginPath(); c.arc(w * .66, h * .55, 7, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(w * .2, h * .12); c.quadraticCurveTo(w * .5, h * .0, w * .8, h * .12); c.stroke();
    })));
  doorGlyph.position.set(-0.55, 0.62, FZ + 0.004);
  box.add(doorGlyph);
}

/* ==================== CHAPTER II — the celestial dial ===================== */
const ch2 = { solved: false };
{
  const CX = -0.5, CY = LID_TOP + 0.001, STEP = TAU / 8;
  const LIDY = BY + BH + 0.09;                    /* lid group world height */
  /* everything here is parented to lidL so it rides along in the finale */
  const dial = new THREE.Group(); dial.position.set(CX, CY - LIDY, 0); lidL.add(dial);
  const chart = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.02, 48),
    new THREE.MeshStandardMaterial({
      map: makeTex(512, 512, (c, w, h) => {
        c.fillStyle = '#101826'; c.beginPath(); c.arc(w/2, h/2, w/2, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(180,200,230,0.25)';
        for (const r of [0.92, 0.72, 0.52, 0.32]) { c.beginPath(); c.arc(w/2, h/2, w/2*r, 0, TAU); c.stroke(); }
        c.fillStyle = 'rgba(220,230,255,0.5)';
        for (let i = 0; i < 90; i++) { c.beginPath(); c.arc(rnd()*w, rnd()*h, rnd()*1.4, 0, TAU); c.fill(); }
      }), roughness: 0.5, metalness: 0.2, envMapIntensity: 0.5,
    }));
  chart.position.y = 0.011; dial.add(chart);

  const RINGS = [
    { r: 0.355, offs: [0, 95, 170],  target: 3, init: 6 },
    { r: 0.265, offs: [20, 200],     target: 6, init: 2 },
    { r: 0.175, offs: [0],           target: 2, init: 5 },
  ];
  ch2.rings = [];
  const starGeo = new THREE.SphereGeometry(0.02, 10, 8);
  const starMat = new THREE.MeshStandardMaterial({ color: 0xd8e6ff, emissive: 0x9fb8ff, emissiveIntensity: 0.35, roughness: 0.3, metalness: 0.4 });

  for (const R of RINGS) {
    const grp = new THREE.Group(); dial.add(grp);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R.r, 0.028, 12, 64), MAT.brassDark);
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.028; grp.add(ring);
    for (const od of R.offs) {
      const s = new THREE.Mesh(starGeo, starMat.clone());
      const a = od * Math.PI / 180;
      s.position.set(Math.cos(a) * R.r, 0.056, Math.sin(a) * R.r);
      grp.add(s);
    }
    const st = { grp, ring, step: R.init, target: R.target, angle: R.init * STEP, offs: R.offs, r: R.r };
    grp.rotation.y = -st.angle;
    ch2.rings.push(st);
    /* ghost marks (aether targets) */
    for (const od of R.offs) {
      const a = od * Math.PI / 180 + R.target * STEP;
      const g = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), aetherMat(0.9));
      g.position.set(CX + Math.cos(a) * R.r, CY + 0.075 - LIDY, Math.sin(a) * R.r);
      lidL.add(g);
    }
    reg(ring, {
      enabled: () => state.ch === 2 && !ch2.solved,
      cursor: 'grab',
      dragStart() {
        const p = planePoint(new THREE.Vector3(0, 1, 0), -CY);
        this._a0 = p ? Math.atan2(p.z, p.x - CX) : 0;
        this._r0 = st.angle;
      },
      drag() {
        const p = planePoint(new THREE.Vector3(0, 1, 0), -CY);
        if (!p) return;
        const a = Math.atan2(p.z, p.x - CX);
        st.angle = this._r0 + (a - this._a0);
        grp.rotation.y = -st.angle;
        const t = Math.round(st.angle / (STEP / 2));
        if (t !== this._tick) { this._tick = t; Snd.tick(); }
      },
      dragEnd() {
        st.step = mod(Math.round(st.angle / STEP), 8);
        const snapped = Math.round(st.angle / STEP) * STEP;
        const from = st.angle;
        tween({ dur: 0.22, step: (k) => { grp.rotation.y = -lerp(from, snapped, k); },
          done: () => { st.angle = snapped; Snd.click(); checkStars(); } });
      },
    });
  }
  function checkStars() {
    if (ch2.solved) return;
    if (!ch2.rings.every((s) => s.step === s.target)) return;
    ch2.solved = true;
    Snd.chime(); Snd.thunk();
    /* flare the stars, draw the constellation */
    const pts = [];
    for (const s of ch2.rings) for (const od of s.offs) {
      const a = od * Math.PI / 180 + s.target * STEP;
      pts.push(new THREE.Vector3(CX + Math.cos(a) * s.r, CY + 0.06 - LIDY, Math.sin(a) * s.r));
    }
    const lineMat = new THREE.LineBasicMaterial({ color: 0xaad9ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat);
    lidL.add(line);
    tween({ dur: 1.6, step: (k) => { lineMat.opacity = k * 0.8; } });
    for (const s of ch2.rings) s.grp.traverse((o) => {
      if (o.isMesh && o.material.emissive && o.material !== MAT.brassDark) o.material.emissiveIntensity = 2.2;
    });
    say('The little sky agrees with itself at last. Somewhere below, a lock changes its mind.');
    delay(1.4, () => { ch3.unlockPanel(); if (state.ch === 2) advanceChapter(3); });
  }
  ch2.applySolved = () => {
    for (const s of ch2.rings) { s.step = s.target; s.angle = s.target * STEP; s.grp.rotation.y = -s.angle; }
    ch2.solved = true;
  };

  /* lid glyph ring around the hatch (rides the right lid half) */
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72),
    aetherMat(0.5, 0x9fe0ff, glyphTex((c, w, h) => {
      c.beginPath(); c.arc(w/2, h/2, w*0.42, 0, TAU); c.stroke();
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU;
        c.save(); c.translate(w/2 + Math.cos(a)*w*0.42, h/2 + Math.sin(a)*w*0.42); c.rotate(a);
        c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.stroke(); c.restore();
      }
    })));
  gl.rotation.x = -Math.PI / 2;
  gl.position.set(0.55, LID_TOP + 0.004 - LIDY, 0);
  lidR.add(gl);
}

/* ===================== CHAPTER III — the aether engine ==================== */
const ch3 = { solved: false, panelUnlocked: false, panelOpen: false };
{
  const PX = -BW / 2;                                     /* left face x */
  /* the engine lives in a housing mounted PROUD of the left face,
     like the bolted-on sub-chests of the originals */
  const HX0 = PX - 0.36;                                  /* housing outer face */
  const CS = 0.24, Z0 = -CS, Y0 = 1.14, BEAMX = PX - 0.18;
  const cellPos = (c, r) => new THREE.Vector3(BEAMX, Y0 - r * CS, Z0 + c * CS);

  const cavity = new THREE.Group(); box.add(cavity);
  /* housing shell: top, bottom, two cheeks, back lining */
  for (const [w, hgt, dpt, x, y, z, mat] of [
    [0.38, 0.04, 0.98, PX - 0.19, 1.42, 0, MAT.wood],
    [0.38, 0.04, 0.98, PX - 0.19, 0.38, 0, MAT.wood],
    [0.38, 1.08, 0.04, PX - 0.19, 0.9, 0.47, MAT.wood],
    [0.38, 1.08, 0.04, PX - 0.19, 0.9, -0.47, MAT.wood],
    [0.015, 1.0, 0.9, PX - 0.008, 0.9, 0, MAT.woodDark],
  ]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hgt, dpt), mat);
    m.position.set(x, y, z); m.castShadow = true; m.userData.knock = true; cavity.add(m);
  }
  /* iron axle-pegs at every cell */
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) {
    const peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8), MAT.iron);
    peg.rotation.z = Math.PI / 2;
    const p = cellPos(c, r); peg.position.set(BEAMX + 0.08, p.y, p.z);
    cavity.add(peg);
  }
  /* emitter */
  const emitter = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 14), MAT.brass);
  barrel.rotation.x = Math.PI / 2;
  emitter.add(barrel);
  emitter.position.set(BEAMX, Y0, Z0 - 0.17); cavity.add(emitter);
  /* receiver crystal */
  const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.055, 0),
    new THREE.MeshStandardMaterial({ color: 0x8fd8ff, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, emissive: 0x2e7ea6, emissiveIntensity: 0.25 }));
  crystal.position.set(BEAMX, Y0 - CS, Z0 + 2 * CS + 0.17);
  const cradle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 20), MAT.brassDark);
  cradle.position.copy(crystal.position); cradle.position.y -= 0.05; cradle.rotation.x = Math.PI / 2;
  cavity.add(crystal, cradle);
  ch3.crystal = crystal;

  /* mirrors: state '/' or '\' in grid space (grid x = +z world, grid y = down) */
  const MIRRORS = [
    { c: 0, r: 0, st: '/',  goal: '\\' },
    { c: 0, r: 2, st: '\\', goal: '\\' },
    { c: 2, r: 2, st: '\\', goal: '/' },
    { c: 2, r: 1, st: '\\', goal: '/' },
  ];
  ch3.mirrors = MIRRORS;
  const mirGeo = new THREE.BoxGeometry(0.05, 0.014, 0.17);
  for (const M of MIRRORS) {
    const grp = new THREE.Group();
    const plate = new THREE.Mesh(mirGeo, MAT.mirror);
    const back = new THREE.Mesh(mirGeo.clone(), MAT.brassDark);
    back.position.y = -0.012; back.scale.set(1.1, 0.9, 1.06);
    grp.add(plate, back);
    const p = cellPos(M.c, M.r); grp.position.copy(p);
    grp.rotation.x = M.st === '\\' ? Math.PI / 4 : -Math.PI / 4;
    cavity.add(grp);
    M.grp = grp; MARKS['mirror' + M.c + M.r] = plate;
    reg(plate, {
      enabled: () => ch3.panelOpen && !ch3.solved,
      cursor: 'pointer',
      tap() {
        M.st = M.st === '/' ? '\\' : '/';
        const from = grp.rotation.x, to = M.st === '\\' ? Math.PI / 4 : -Math.PI / 4;
        Snd.click();
        tween({ dur: 0.28, step: (k) => { grp.rotation.x = lerp(from, to, k); }, done: () => { traceBeam(); } });
        if (!aether.on) say('The mirror tilts. Something faint stirs against the glass — more than the eye admits.');
      },
    });
  }

  /* beam visuals */
  const beamGroup = new THREE.Group(); cavity.add(beamGroup);
  const beamMat = aetherMat(0.9, 0xaee6ff);
  const nodeGeo = new THREE.SphereGeometry(0.018, 8, 8);
  function traceBeam() {
    beamGroup.clear();
    let c = 0, r = 0, dx = 1, dy = 0;
    const pts = [new THREE.Vector3(BEAMX, Y0, Z0 - 0.1)];
    let hit = false;
    for (let guard = 0; guard < 24; guard++) {
      if (c < 0 || c > 2 || r < 0 || r > 2) {
        if (r === 1 && dx === 1 && c === 3) { pts.push(crystal.position.clone()); hit = true; }
        else {
          const last = pts[pts.length - 1].clone();
          pts.push(last.add(new THREE.Vector3(0, -dy * CS * 0.8, dx * CS * 0.8)));
        }
        break;
      }
      const m = MIRRORS.find((M) => M.c === c && M.r === r);
      if (m) {
        pts.push(cellPos(c, r));
        const nd = m.st === '\\' ? [dy, dx] : [-dy, -dx];
        dx = nd[0]; dy = nd[1];
      }
      c += dx; r += dy;
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const len = a.distanceTo(b);
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), beamMat);
      cyl.position.lerpVectors(a, b, 0.5);
      cyl.lookAt(b); cyl.rotateX(Math.PI / 2);
      beamGroup.add(cyl);
      const n = new THREE.Mesh(nodeGeo, beamMat); n.position.copy(b); beamGroup.add(n);
    }
    if (hit && !ch3.solved) solveBeam();
  }
  ch3.traceBeam = traceBeam;

  function solveBeam() {
    ch3.solved = true;
    Snd.chime(); Snd.hum(0.4);
    crystal.material.emissiveIntensity = 2.6;
    const light = new THREE.PointLight(0x7fd4ff, 0, 2);
    light.position.copy(crystal.position).x += 0.1; cavity.add(light);
    tween({ dur: 1.5, step: (k) => { light.intensity = k * 3; } });
    say('The crystal drinks the pale light and wakes. Below it, a small drawer surrenders.');
    delay(1.6, () => {
      Snd.slide();
      tween({ dur: 0.8, ease: easeOut, step: (k) => { rewardDrawer.position.x = PX - 0.03 - k * 0.36; } });
      Snd.hum(aether.on ? 0.5 : 0);
    });
  }

  /* panel door on the housing's outer face */
  const hinge = new THREE.Group(); hinge.position.set(HX0 - 0.01, 0.9, -0.46); box.add(hinge);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.12, 0.98), MAT.woodPanel);
  door.position.set(0, 0, 0.46); door.castShadow = true; door.userData.knock = true;
  hinge.add(door);
  const doorPull = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), MAT.brassDark);
  doorPull.position.set(-0.03, 0, 0.8); hinge.add(doorPull);
  MARKS.panelDoor = door;
  ch3.unlockPanel = () => {
    if (ch3.panelUnlocked) return;
    ch3.panelUnlocked = true;
    Snd.unlock();
    tween({ dur: 0.5, step: (k) => { hinge.rotation.y = -k * 0.12; } });
  };
  reg(door, {
    enabled: () => true, cursor: 'pointer',
    tap() {
      if (!ch3.panelUnlocked) { Snd.knock(); say('A seam in the wood, tight as a promise. It is not ready.'); return; }
      if (ch3.panelOpen) return;
      ch3.panelOpen = true; Snd.slide();
      tween({ dur: 1.0, step: (k) => { hinge.rotation.y = -(0.12 + k * 1.85); },
        done: () => {
          say('Mirrors on iron pegs — and an engine with nothing, apparently, to burn.');
          traceBeam();
        } });
    },
  });

  /* reward drawer (below the housing) */
  const rewardDrawer = new THREE.Group();
  const rdFace = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.2, 0.46), MAT.woodPanel);
  const rdPull = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 8, 20), MAT.brassDark);
  rdPull.position.set(-0.03, 0, 0); rdPull.rotation.y = Math.PI / 2;
  const rdTray = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.4), MAT.woodDark);
  rdTray.position.set(0.19, -0.05, 0);
  rewardDrawer.add(rdFace, rdPull, rdTray);
  rewardDrawer.position.set(PX - 0.03, 0.26, 0);
  box.add(rewardDrawer);
  const keyMesh = buildKeyModel(); keyMesh.scale.setScalar(1.1);
  keyMesh.userData.bowPivot.rotation.z = -1.1;              /* bent */
  keyMesh.position.set(0.16, 0.0, -0.1); keyMesh.rotation.y = Math.PI / 2 + 0.4;
  const letter2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.01, 0.15), MAT.paper);
  letter2.position.set(0.18, -0.015, 0.12); letter2.rotation.y = -0.4;
  rewardDrawer.add(keyMesh, letter2);
  MARKS.rewardKey = keyMesh; MARKS.letter2 = letter2;
  ch3.gotKey = false; ch3.gotLetter2 = false;
  keyMesh.traverse((o) => { if (o.isMesh) reg(o, {
    enabled: () => ch3.solved && !ch3.gotKey, cursor: 'pointer',
    tap() {
      ch3.gotKey = true; keyMesh.visible = false;
      invAdd({ id: 'key', icon: '⚷', name: 'a bent winding key' });
      say('A winding key — bent nearly double, by a strong hand and a bad night.');
      checkCh3Done();
    },
  }); });
  reg(letter2, {
    enabled: () => ch3.solved && !ch3.gotLetter2, cursor: 'pointer',
    tap() { ch3.gotLetter2 = true; letter2.visible = false; giveLetter(1); checkCh3Done(); },
  });
  function checkCh3Done() {
    if (ch3.gotKey && ch3.gotLetter2 && state.ch === 3) advanceChapter(4);
  }
  ch3.applySolved = () => {
    ch3.panelUnlocked = true; ch3.panelOpen = true; hinge.rotation.y = -(0.12 + 1.85);
    for (const M of MIRRORS) { M.st = M.goal; M.grp.rotation.x = M.st === '\\' ? Math.PI / 4 : -Math.PI / 4; }
    ch3.solved = true; crystal.material.emissiveIntensity = 2.6;
    rewardDrawer.position.x = PX - 0.03 - 0.36;
    ch3.gotKey = true; keyMesh.visible = false;
    ch3.gotLetter2 = true; letter2.visible = false;
    if (!state.letters.includes(1)) giveLetter(1, true);
    traceBeam();
  };
}

/* ===================== CHAPTER IV — a quarter past nine =================== */
const ch4 = { solved: false, keyIn: false };
{
  const CXx = BW / 2, CYy = 1.0, R = 0.36;
  /* clock door (face swings open on solve) */
  const clockHinge = new THREE.Group();
  clockHinge.position.set(CXx + 0.01, CYy, -R);
  box.add(clockHinge);
  const faceTex = makeTex(512, 512, (c, w, h) => {
    c.fillStyle = '#e8dcc0'; c.beginPath(); c.arc(w/2, h/2, w/2 - 4, 0, TAU); c.fill();
    c.strokeStyle = '#6b5225'; c.lineWidth = 10; c.beginPath(); c.arc(w/2, h/2, w/2 - 10, 0, TAU); c.stroke();
    c.lineWidth = 2; c.beginPath(); c.arc(w/2, h/2, w/2 - 44, 0, TAU); c.stroke();
    c.fillStyle = '#3a2c12'; c.font = '600 42px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const RN = ['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU - Math.PI / 2;
      c.fillText(RN[i], w/2 + Math.cos(a) * (w/2 - 74), h/2 + Math.sin(a) * (h/2 - 74));
    }
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * TAU;
      c.strokeStyle = '#3a2c12'; c.lineWidth = i % 5 === 0 ? 4 : 1.5;
      c.beginPath();
      c.moveTo(w/2 + Math.cos(a) * (w/2 - 26), h/2 + Math.sin(a) * (h/2 - 26));
      c.lineTo(w/2 + Math.cos(a) * (w/2 - 40), h/2 + Math.sin(a) * (h/2 - 40));
      c.stroke();
    }
  });
  const clockDoor = new THREE.Group(); clockDoor.position.set(0, 0, R); clockHinge.add(clockDoor);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 14, 48), MAT.brass);
  bezel.rotation.y = Math.PI / 2;
  const backing = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.03, 48), MAT.brassDark);
  backing.rotation.z = -Math.PI / 2;
  /* face as a CircleGeometry looking down +x: texture up stays up, no mirroring */
  const faceM = new THREE.Mesh(new THREE.CircleGeometry(R - 0.015, 48),
    new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.6 }));
  faceM.rotation.y = Math.PI / 2;
  faceM.position.x = 0.017;
  clockDoor.add(bezel, backing, faceM);

  /* hands: pivot rotation about x — 0 = twelve, negative = clockwise seen from +x */
  function hand(len, wdt, mat) {
    const piv = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.015, len, wdt), mat);
    m.position.y = len / 2 - 0.03;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 12), MAT.brassDark);
    hub.rotation.z = Math.PI / 2;
    piv.add(m, hub);
    piv.position.set(0.035, 0, 0);
    clockDoor.add(piv);
    return { piv, mesh: m };
  }
  const hourH = hand(0.17, 0.03, MAT.iron);
  const minH  = hand(0.26, 0.02, MAT.iron);
  MARKS.hourHand = hourH.mesh; MARKS.minHand = minH.mesh; MARKS.esc = null;
  ch4._parts = { hourH, minH };
  ch4.hourA = (10.6 / 12) * TAU;                       /* stopped at some sad hour */
  ch4.minA  = (23 / 60) * TAU;
  const applyHands = () => { hourH.piv.rotation.x = -ch4.hourA; minH.piv.rotation.x = -ch4.minA; };
  applyHands();

  /* keyhole escutcheon below the clock */
  const esc = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 18), MAT.brassDark);
  esc.rotation.z = Math.PI / 2; esc.position.set(CXx + 0.01, 0.44, 0); box.add(esc);
  const holeT = makeTex(64, 64, (c, w, h) => {
    c.fillStyle = '#000'; c.beginPath(); c.arc(w/2, 24, 9, 0, TAU); c.fill();
    c.fillRect(w/2 - 5, 24, 10, 22);
  });
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.06),
    new THREE.MeshBasicMaterial({ map: holeT, transparent: true }));
  hole.rotation.y = Math.PI / 2; hole.position.set(CXx + 0.027, 0.44, 0); box.add(hole);
  const keyInserted = buildKeyModel();
  keyInserted.rotation.y = Math.PI / 2; keyInserted.rotation.x = Math.PI / 2;
  keyInserted.position.set(CXx + 0.13, 0.44, 0); keyInserted.visible = false;
  box.add(keyInserted);

  MARKS.esc = esc;
  reg(esc, {
    enabled: () => state.ch === 4 && !ch4.keyIn, cursor: 'pointer',
    tap() {
      if (state.selected !== 'key') { Snd.knock(); say('A winding square, starved of its key.'); return; }
      if (!state.keyFixed) { Snd.knock(); say('The bent bow jams against the escutcheon. It will not seat. Perhaps look at it more closely.'); return; }
      ch4.keyIn = true;
      invRemove('key'); keyInserted.visible = true;
      Snd.click(); Snd.ratchet();
      const kx0 = CXx + 0.2;
      keyInserted.position.x = kx0;
      tween({ dur: 0.5, step: (k) => { keyInserted.position.x = lerp(kx0, CXx + 0.11, k); } });
      tween({ dur: 1.4, delay: 0.5, step: (k) => { keyInserted.rotation.x = Math.PI / 2 + k * TAU; },
        done: () => {
          say('The house takes back its heartbeat. The hands are free — set them to the minute he never stopped seeing.');
        } });
    },
  });

  /* hand dragging */
  function angleAt() {
    const p = planePoint(new THREE.Vector3(1, 0, 0), -(CXx + 0.05));
    if (!p) return null;
    return mod(Math.atan2(-(p.z), p.y - CYy), TAU);       /* cw from 12, viewer at +x */
  }
  function regHand(h, isMin) {
    reg(h.mesh, {
      enabled: () => ch4.keyIn && !ch4.solved, cursor: 'grab',
      dragStart() { this._last = angleAt(); },
      drag() {
        const a = angleAt(); if (a == null) return;
        if (isMin) ch4.minA = a; else ch4.hourA = a;
        applyHands();
        const t = Math.round(a / (TAU / 60));
        if (t !== this._tk) { this._tk = t; Snd.tick(); }
      },
      dragEnd() {
        if (isMin) ch4.minA = mod(Math.round(ch4.minA / (TAU / 60)) * (TAU / 60), TAU);
        else       ch4.hourA = mod(Math.round(ch4.hourA / (TAU / 48)) * (TAU / 48), TAU);
        applyHands(); Snd.click();
        checkClock();
      },
    });
  }
  regHand(minH, true); regHand(hourH, false);

  function checkClock() {
    const minOK  = Math.abs(ch4.minA - TAU * 0.25) < 0.03;                 /* 15 min */
    const hourOK = Math.abs(ch4.hourA - TAU * (9.25 / 12)) < 0.07;         /* quarter past nine */
    if (!(minOK && hourOK) || ch4.solved) return;
    ch4.solved = true;
    Snd.chime(); Snd.unlock();
    say('A quarter past nine. The chronometer sighs, and forgives him.');
    delay(1.2, () => {
      Snd.slide();
      tween({ dur: 1.2, step: (k) => { clockHinge.rotation.y = k * 1.6; },
        done: () => { giveLetter(2); } });
      delay(1.8, () => raiseCryptex(false));
    });
  }

  /* letter III hides in the shallow well behind the clock door */
  const well4 = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 40),
    new THREE.MeshStandardMaterial({ color: 0x0d0905, roughness: 0.95 }));
  well4.rotation.y = Math.PI / 2; well4.position.set(CXx + 0.005, CYy, 0); box.add(well4);
  const letter3 = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.17, 0.24), MAT.paper);
  letter3.position.set(CXx + 0.018, CYy - 0.02, 0.02); letter3.rotation.x = 0.12;
  box.add(letter3);
  reg(letter3, {
    enabled: () => ch4.solved, cursor: 'pointer',
    tap() { showLetter(2); },
  });

  /* scorched roman numerals — the aether remembers the time */
  const scorch = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.2),
    aetherMat(0.6, 0x9fe0ff, glyphTex((c, w, h) => {
      c.font = '700 64px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('IX · XV', w / 2, h / 2);
    })));
  scorch.rotation.y = Math.PI / 2;
  scorch.position.set(CXx + 0.008, 1.32, -0.52);
  box.add(scorch);

  ch4.applySolved = () => {
    state.keyFixed = true; ch4.keyIn = true; keyInserted.visible = true;
    keyInserted.position.x = CXx + 0.11;
    invRemove('key');
    ch4.minA = TAU * 0.25; ch4.hourA = TAU * (9.25 / 12); applyHands();
    ch4.solved = true; clockHinge.rotation.y = 1.6;
    if (!state.letters.includes(2)) giveLetter(2, true);
    raiseCryptex(true);
  };
  ch4.giveKeyIfMissing = () => {
    if (!ch4.keyIn && !inventory.some((i) => i.id === 'key'))
      invAdd({ id: 'key', icon: '⚷', name: state.keyFixed ? 'a winding key' : 'a bent winding key' });
  };
}

/* ====================== CHAPTER V — the unspoken name ===================== */
const ch5 = { solved: false, risen: false };
const cryptex = new THREE.Group();
let raiseCryptex;
{
  const CX = 0.55, STEP = TAU / 10, RNG = 0.168;
  cryptex.position.set(CX, 1.02, 0);                 /* hidden inside the box */
  box.add(cryptex);

  /* the dark well through the lid, and two brass hatch half-moons over it —
     all parented to the right lid half so they ride along in the finale */
  const LIDY = BY + BH + 0.09;
  const well = new THREE.Mesh(new THREE.CircleGeometry(0.28, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000 }));
  well.rotation.x = -Math.PI / 2; well.position.set(CX, LID_TOP + 0.006 - LIDY, 0);
  const wellTube = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x0a0703, roughness: 1, side: THREE.BackSide }));
  wellTube.position.set(CX, LID_TOP - 0.1 - LIDY, 0);
  lidR.add(well, wellTube);
  const hatchF = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.035, 32, 1, false, -Math.PI / 2, Math.PI), MAT.brass);
  const hatchB = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.035, 32, 1, false, Math.PI / 2, Math.PI), MAT.brass);
  hatchF.position.set(CX, LID_TOP + 0.012 - LIDY, 0); hatchB.position.copy(hatchF.position);
  lidR.add(hatchF, hatchB);

  /* column */
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.66, 20), MAT.iron);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), MAT.brass);
  cap.scale.y = 0.55; cap.position.y = 0.345;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.06, 24), MAT.brassDark);
  base.position.y = -0.36;
  cryptex.add(col, cap, base);
  /* indicator rail */
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.56, 0.016), MAT.brass);
  rail.position.set(0, -0.02, 0.208); cryptex.add(rail);
  const railTip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), MAT.brass);
  railTip.position.set(0, 0.28, 0.208); railTip.rotation.x = 0.0; cryptex.add(railTip);

  const RINGS = [
    { letters: ['R','A','E','C','S','T','H','M','I','B'], target: 2, init: 7 },
    { letters: ['D','G','U','L','N','P','Y','F','K','A'], target: 3, init: 8 },
    { letters: ['M','B','O','H','T','C','S','I','U','R'], target: 2, init: 6 },
    { letters: ['E','I','A','N','V','W','H','S','L','O'], target: 5, init: 1 },
    { letters: ['T','R','M','E','D','A','C','U','G','P'], target: 3, init: 9 },
    { letters: ['S','H','N','O','R','A','L','T','I','G'], target: 2, init: 5 },
  ];
  ch5.rings = [];
  const letterTexCache = {};
  function letterTex(ch) {
    if (letterTexCache[ch]) return letterTexCache[ch];
    const t = makeTex(64, 64, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#e9d391'; c.shadowColor = '#7a5a1c'; c.shadowBlur = 3;
      c.font = '600 44px Georgia'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch, w/2, h/2 + 2);
    });
    letterTexCache[ch] = t; return t;
  }
  RINGS.forEach((R, idx) => {
    const grp = new THREE.Group();
    grp.position.y = 0.235 - idx * 0.094;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(RNG, RNG, 0.082, 32), MAT.brassDark);
    grp.add(band);
    const rim1 = new THREE.Mesh(new THREE.TorusGeometry(RNG, 0.008, 8, 32), MAT.brass);
    rim1.rotation.x = Math.PI / 2; rim1.position.y = 0.041; grp.add(rim1);
    R.letters.forEach((L, i) => {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.095, 0.066),
        new THREE.MeshBasicMaterial({ map: letterTex(L), transparent: true, fog: false }));
      const a = i * STEP;
      pl.position.set(Math.sin(a) * (RNG + 0.004), 0, Math.cos(a) * (RNG + 0.004));
      pl.rotation.y = a;
      grp.add(pl);
    });
    const st = { grp, rot: -R.init * STEP, target: R.target, letters: R.letters };
    grp.rotation.y = st.rot;
    cryptex.add(grp);
    ch5.rings.push(st);
    MARKS['cryring' + idx] = band;
    reg(band, {
      enabled: () => state.ch === 5 && ch5.risen && !ch5.solved,
      cursor: 'grab',
      dragStart(hit, ev) { this._px = ev.clientX; this._r0 = st.rot; },
      drag(ev) {
        st.rot = this._r0 + (ev.clientX - this._px) * 0.013;
        grp.rotation.y = st.rot;
        const t = Math.round(st.rot / (STEP / 2));
        if (t !== this._tk) { this._tk = t; Snd.tick(); }
      },
      dragEnd() {
        const snapped = Math.round(st.rot / STEP) * STEP;
        const from = st.rot;
        tween({ dur: 0.2, step: (k) => { grp.rotation.y = lerp(from, snapped, k); },
          done: () => { st.rot = snapped; Snd.click(); checkWord(); } });
      },
    });
  });
  function ringLetter(st) {
    return st.letters[mod(Math.round(-st.rot / STEP), 10)];
  }
  function checkWord() {
    if (ch5.solved) return;
    const word = ch5.rings.map(ringLetter).join('');
    if (word === 'ELOWEN') {
      ch5.solved = true;
      Snd.chime(); Snd.thunk(); Snd.riser();
      say('“Elowen.” Said at last — and the whole box says it back.');
      delay(2.0, () => beginFinale(false));
    }
  }

  raiseCryptex = (instant) => {
    if (ch5.risen) return;
    ch5.risen = true;
    const doRise = () => {
      if (instant) {
        hatchF.position.z = 0.34; hatchB.position.z = -0.34;
        cryptex.position.y = 2.06;
        return;
      }
      Snd.slide();
      tween({ dur: 1.0, step: (k) => { hatchF.position.z = k * 0.34; hatchB.position.z = -k * 0.34; } });
      Snd.ratchet();
      tween({ dur: 2.4, delay: 0.8, ease: easeOut, step: (k) => { cryptex.position.y = lerp(1.02, 2.06, k); },
        done: () => {
          Snd.thunk();
          say('A column of rings rises from the lid, wearing letters like regalia.');
          if (state.ch === 4) advanceChapter(5);
        } });
    };
    doRise();
    if (instant && state.ch === 4) state.ch = 5;
  };

  ch5.applySolved = () => {
    ch5.rings.forEach((st) => { st.rot = -st.target * STEP; st.grp.rotation.y = st.rot; });
    ch5.solved = true;
  };
}

/* ============================== THE FINALE ================================ */
const fin = { open: false, letterGiven: false };
let beginFinale;
{
  /* the heart of the reliquary — a tiny captive orrery */
  const heart = new THREE.Group();
  heart.position.set(0, 0.75, 0); heart.visible = false;
  box.add(heart);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xffe9b0, emissive: 0xffb84d, emissiveIntensity: 1.3, roughness: 0.3 }));
  heart.add(core);
  const orb1 = new THREE.Group(), orb2 = new THREE.Group();
  for (const [grp, r, tilt] of [[orb1, 0.22, 0.4], [orb2, 0.31, -0.7]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.006, 8, 48), MAT.brass);
    ring.rotation.x = Math.PI / 2;
    const pl = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), MAT.brassDark);
    pl.position.x = r;
    grp.add(ring, pl); grp.rotation.z = tilt;
    heart.add(grp);
  }
  const heartLight = new THREE.PointLight(0xffc26e, 0, 5, 1.8);
  heart.add(heartLight);
  fin.heart = heart; fin.orb = [orb1, orb2];

  /* the last letter, floating */
  const letter4 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.21), MAT.paper);
  letter4.position.set(0, 1.65, 0.75); letter4.visible = false;
  letter4.rotation.x = 0.5;
  box.add(letter4);
  MARKS.letter4 = letter4;
  reg(letter4, {
    enabled: () => fin.open, cursor: 'pointer',
    tap() {
      if (!fin.letterGiven) { fin.letterGiven = true; giveLetter(3); }
      else showLetter(3);
      onModalClose = fin.offerChoice;     /* the choice follows the reading */
    },
  });

  beginFinale = (instant) => {
    if (fin.open) return;
    fin.open = true;
    state.ch = 6; saveGame();
    const dur = instant ? 0.001 : 2.6;
    if (!instant) { Snd.riser(); Snd.hum(0.6); focusNode('finale', 2.2); }
    /* cryptex sinks back down with the hatch left open */
    tween({ dur, step: (k) => { cryptex.position.y = lerp(2.06, 1.35, k); } });
    /* lid halves part */
    tween({ dur, delay: instant ? 0 : 0.8, ease: easeInOut, step: (k) => {
      lidL.position.x = -k * 1.15; lidR.position.x = k * 1.15;
      lidL.rotation.z = k * 0.12; lidR.rotation.z = -k * 0.12;
    } });
    /* heart rises */
    heart.visible = true;
    tween({ dur: instant ? 0.001 : 3.2, delay: instant ? 0 : 1.6, ease: easeOut, step: (k) => {
      heart.position.y = lerp(0.75, 1.78, k);
      heartLight.intensity = k * 2.2;
    }, done: () => {
      letter4.visible = true;
      if (!instant) {
        chapterCard(6);
        say('The Reliquary is open. One letter remains, riding the light.');
      }
    } });
  };

  function offerChoice() {
    openModal({
      title: 'THE LAST CHOICE', dark: true, closable: false,
      html: 'The eyepiece hums against your chest like a held breath.\n\nEdwin Vane has left you the only thing he ever refused himself: the decision.',
      actions: [
        { label: 'RAISE THE EYEPIECE', fn: () => { closeModal(); ending(0); } },
        { label: 'CLOSE THE BOX',      fn: () => { closeModal(); ending(1); } },
      ],
    });
  }
  fin.offerChoice = offerChoice;
}

/* ------------------------------- endings --------------------------------- */
const ENDINGS = [
  {
    title: 'SHE SEES YOU TOO',
    text: `You raise the glass, and the room becomes a sketch of itself — walls gone thin as paper held to a lamp.

Where the box stood there is a doorway, chalk-drawn and nine years tall, and beyond it a field of patient stars. Between star and star stand two figures: an old man, straight-backed at last, and a girl with chalk dust on her fingers.

They are looking at you. They have been looking for some time.

The girl lifts her hand — hello, or goodbye, or come along. You lower the eyepiece before you can learn which.

Some doors are kind enough to let you choose. This one, you understand now, was built by a kind man.`,
  },
  {
    title: 'THE DOOR HELD SHUT',
    text: `You fold the panels closed, and the mechanisms accept their duty the way old servants do — gravely, and with relief.

The house exhales. Morning finds the windows, which had honestly forgotten what to do with it.

In the drawer, wrapped in a letter that no longer needs answering, the eyepiece goes on humming. Patient as its maker. Glass remembers what it has shown, and it knows that one evening — not this one — curiosity will pick it back up.

Let it wait. Wherever the Vanes are, they are two, and the Hollow is empty no longer.`,
  },
];
function ending(which) {
  if (aether.on && which === 1) setLens(false);
  if (which === 0 && state.hasLens) setLens(true);
  Snd.chime(); Snd.hum(which === 0 ? 0.9 : 0);
  localStorage.removeItem(SAVE_KEY);
  $('#fader').classList.add('show');
  setTimeout(() => {
    const e = $('#ending');
    e.querySelector('.etitle').textContent = ENDINGS[which].title;
    const t = e.querySelector('.etext');
    t.textContent = ENDINGS[which].text + '\n\n\n— THE RELIQUARY —\nwritten, carved and wound for you by a machine that admires The Room';
    t.style.whiteSpace = 'pre-wrap';
    e.classList.add('open');
    requestAnimationFrame(() => t.classList.add('show'));
  }, 2600);
}
$('#btn-again').onclick = () => location.reload();

/* =========================== chapter sequencing ========================== */
function advanceChapter(n) {
  state.ch = n; saveGame();
  delay(0.9, () => chapterCard(n));
  if (n === 2) delay(2.2, () => say('Something on the lid has been waiting for that glass.'));
}

/* ============================ save / load ================================ */
const SAVE_KEY = 'reliquary-save-v1';
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ch: state.ch, keyFixed: state.keyFixed }));
  } catch (e) { /* private browsing — the house forgets */ }
}
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return null; }
}
function fastForwardTo(ch) {
  if (ch >= 2) ch1.applySolved();
  if (ch >= 3) ch2.applySolved();
  if (ch >= 4) { ch3.applySolved(); ch4.giveKeyIfMissing(); }
  if (ch >= 5) ch4.applySolved();
  if (ch >= 6) { ch5.applySolved(); beginFinale(true); }
  state.ch = clamp(ch, 1, 6);
}

/* =============================== input =================================== */
let dragging = null, downAt = 0, downXY = [0, 0], lastTap = 0, lastTapXY = [0, 0];
const knockLines = [
  'Solid. Patient. Not for prying fingers — for clever ones.',
  'Somewhere inside, a counterweight shifts its opinion of you.',
  'The wood is warm where the varnish has gone. Someone leaned here, often.',
  'It sounds hollow only if you believe every box owes you an inside.',
];
let knockIdx = 0, lastKnock = 0;

renderer.domElement.addEventListener('pointerdown', (ev) => {
  if (!state.playing || state.busy) return;
  downAt = performance.now(); downXY = [ev.clientX, ev.clientY];
  const hits = castAt(ev, interactables);
  const hit = hits.find((h) => {
    const en = h.object.userData.enabled;
    return en && (typeof en === 'function' ? en() : true);
  });
  if (hit && (hit.object.userData.dragStart || hit.object.userData.drag)) {
    dragging = hit.object.userData;
    controls.enabled = false;
    dragging.dragStart && dragging.dragStart(hit, ev);
  }
});
renderer.domElement.addEventListener('pointermove', (ev) => {
  if (!state.playing) return;
  if (dragging) {
    castAt(ev, []);                       /* refresh raycaster from pointer */
    dragging.drag && dragging.drag(ev);
    return;
  }
  if (ev.pointerType === 'mouse') {
    const hits = castAt(ev, interactables);
    const hit = hits.find((h) => {
      const en = h.object.userData.enabled;
      return en && (typeof en === 'function' ? en() : true);
    });
    renderer.domElement.style.cursor = hit ? (hit.object.userData.cursor || 'pointer') : '';
  }
});
function endDrag() {
  if (dragging) { dragging.dragEnd && dragging.dragEnd(); dragging = null; }
  if (!camTween) controls.enabled = true;
}
renderer.domElement.addEventListener('pointerup', (ev) => {
  if (!state.playing) return;
  const wasDrag = dragging; endDrag();
  const dt = performance.now() - downAt;
  const dist = Math.hypot(ev.clientX - downXY[0], ev.clientY - downXY[1]);
  if (dist > 14 || dt > 600) return;                       /* not a tap */
  /* double tap → focus */
  const sinceLast = performance.now() - lastTap;
  const nearLast = Math.hypot(ev.clientX - lastTapXY[0], ev.clientY - lastTapXY[1]) < 40;
  lastTap = performance.now(); lastTapXY = [ev.clientX, ev.clientY];
  if (sinceLast < 350 && nearLast) {
    const hits = castAt(ev, [box]);
    if (hits.length) focusNode(regionOfPoint(hits[0].point));
    else focusNode('overview');
    return;
  }
  if (wasDrag) return;
  /* single tap */
  const hits = castAt(ev, interactables);
  const hit = hits.find((h) => {
    const en = h.object.userData.enabled;
    return en && (typeof en === 'function' ? en() : true);
  });
  if (hit && hit.object.userData.tap) { hit.object.userData.tap(hit, ev); return; }
  /* knock on the box for flavour */
  const boxHits = castAt(ev, [box]);
  if (boxHits.length && boxHits[0].object.userData.knock && performance.now() - lastKnock > 2500) {
    lastKnock = performance.now();
    Snd.knock();
    say(knockLines[knockIdx++ % knockLines.length]);
  }
});
renderer.domElement.addEventListener('pointercancel', endDrag);
renderer.domElement.addEventListener('contextmenu', (e) => { e.preventDefault(); if (state.playing) focusNode('overview'); });
addEventListener('keydown', (e) => {
  if (!state.playing) return;
  if (e.key === 'e' || e.key === 'E') setLens(!aether.on);
  if (e.key === 'Escape') {
    if (modalWrap.classList.contains('open')) closeModal();
    else if (inspectOpen) closeInspect();
    else focusNode('overview');
  }
});
$('#btn-lens').onclick = () => setLens(!aether.on);
$('#btn-sound').onclick = function () { this.style.opacity = Snd.toggle() ? 1 : 0.4; };

/* ============================ title & start ============================== */
const saved = loadSave();
if (saved && saved.ch > 1) {
  $('#btn-continue').style.display = '';
}
$('#btn-new').onclick = () => { localStorage.removeItem(SAVE_KEY); startGame(1, false); };
$('#btn-continue').onclick = () => startGame(saved.ch, true, saved.keyFixed);

function startGame(ch, resume, keyFixed = false) {
  Snd.start();
  $('#title-screen').classList.add('gone');
  document.body.classList.add('playing');
  state.playing = true;
  state.keyFixed = keyFixed || false;
  if (resume && ch > 1) fastForwardTo(ch);
  else state.ch = 1;
  /* intro sweep */
  const p0 = camera.position.clone(), p1 = new THREE.Vector3(...NODES.overview.pos);
  tween({ dur: 3.4, ease: easeInOut, step: (k) => {
    camera.position.lerpVectors(p0, p1, k);
  }, done: () => { controls.enabled = true; } });
  if (!resume || ch <= 1) {
    delay(3.0, () => chapterCard(1));
    delay(5.2, () => say('The worktable of Edwin Vane, horologist. Missing these forty days. The box is warm.'));
  } else {
    delay(2.5, () => chapterCard(clamp(ch, 1, 6)));
    if (ch >= 6 && fin.open) delay(3.4, () => say('The Reliquary stands open, as you left it. The letter is still riding the light.'));
  }
  saveGame();
}

/* ============================== main loop ================================ */
const clock = new THREE.Clock();
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  /* cap only against monster hitches — animations must stay wall-clock true
     even on slow renderers, or the whole game turns to slow motion */
  const dt = Math.min(clock.getDelta(), 0.5);
  elapsed += dt;
  updateTweens(dt);
  controls.update();

  /* candle flicker */
  candleLight.intensity = 3.6 + Math.sin(elapsed * 11.3) * 0.5 + Math.sin(elapsed * 23.7) * 0.35;
  /* dust drift */
  {
    const pos = dust.geometry.attributes.position, seeds = dust.userData.seeds;
    for (let i = 0; i < seeds.length; i++) {
      pos.array[i*3]     += Math.sin(elapsed * 0.3 + seeds[i]) * 0.0004;
      pos.array[i*3 + 1] -= 0.0006;
      if (pos.array[i*3 + 1] < 0) pos.array[i*3 + 1] = 3.2;
    }
    pos.needsUpdate = true;
  }
  /* the heart spins */
  if (fin.open) {
    fin.orb[0].rotation.y += dt * 0.9; fin.orb[1].rotation.y -= dt * 0.6;
    fin.heart.rotation.y += dt * 0.15;
    fin.heart.position.y += Math.sin(elapsed * 1.2) * 0.0006;
  }
  /* crystal breathing */
  if (ch3.solved) ch3.crystal.material.emissiveIntensity = 2.2 + Math.sin(elapsed * 3) * 0.5;

  if (inspectOpen) { renderer.render(inspectScene, inspectCam); return; }
  composer.render();
}
animate();

/* ================================ debug =================================== */
window.__REL = {
  state, setLens, focusNode, MARKS, ch1, ch2, ch3, ch4, ch5, fin, aether, camera, controls,
  solveTo(n) { fastForwardTo(n); saveGame(); },
  say,
  isDragging() { return !!dragging; },
  probe(x, y) {
    const hits = castAt({ clientX: x, clientY: y }, interactables);
    return hits.slice(0, 4).map((h) => ({
      type: h.object.type, geo: h.object.geometry && h.object.geometry.type,
      hasDrag: !!(h.object.userData.dragStart || h.object.userData.drag),
      hasTap: !!h.object.userData.tap,
      enabled: typeof h.object.userData.enabled === 'function' ? h.object.userData.enabled() : h.object.userData.enabled,
      d: +h.distance.toFixed(3),
    }));
  },
  /* world → CSS pixel coords, for automated play-testing */
  project(x, y, z) {
    let v;
    if (typeof x === 'string') {
      const o = MARKS[x]; if (!o) return null;
      v = new THREE.Vector3(); o.getWorldPosition(v);
    } else v = new THREE.Vector3(x, y, z);
    v.project(camera);
    return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
  },
};
