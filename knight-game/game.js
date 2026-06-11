'use strict';
/* ============================================================
   PLUME KNIGHT — a Hollow-Knight-style sidescroller
   ============================================================ */

// ---------------- Canvas ----------------
const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
const W = 960, H = 540;
const low = document.createElement('canvas');
low.width = W / 3; low.height = H / 3;
const lowCtx = low.getContext('2d');

// ---------------- Settings ----------------
const SET = { pixel: true, music: true, sfx: true };
try { Object.assign(SET, JSON.parse(localStorage.getItem('plumeknight_settings') || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem('plumeknight_settings', JSON.stringify(SET)); } catch (e) {} }

// ---------------- Helpers ----------------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const TAU = Math.PI * 2;
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function mulberry32(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------------- Input ----------------
const keys = {}, pressed = {};
const KEYMAP = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], jump: ['ArrowUp', 'KeyW'],
  dash: ['Space'], slash: ['KeyZ', 'KeyJ'], spin: ['KeyX', 'KeyK'], special: ['KeyC', 'KeyL'],
  shield: ['ShiftLeft', 'ShiftRight'], dynamite: ['KeyH'], pause: ['Escape'],
};
function down(action) { return KEYMAP[action].some(c => keys[c]); }
function hit(action) { return KEYMAP[action].some(c => pressed[c]); }
window.addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  initAudio();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
const mouse = { x: 0, y: 0, click: false };
cv.addEventListener('mousemove', e => {
  const r = cv.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) * (W / r.width);
  mouse.y = (e.clientY - r.top) * (H / r.height);
});
cv.addEventListener('mousedown', () => { mouse.click = true; initAudio(); });

// ---------------- Audio ----------------
let AC = null, musicTimer = null, musicStep = 0;
function initAudio() {
  if (AC) return;
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
  startMusic();
}
function beep(freq, dur, type, vol, slide) {
  if (!AC || !SET.sfx) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square'; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), AC.currentTime + dur);
  g.gain.value = vol || 0.08;
  g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(); o.stop(AC.currentTime + dur + 0.02);
}
const SFX = {
  slash: () => beep(700, 0.09, 'sawtooth', 0.05, 220),
  spin: () => beep(300, 0.3, 'sawtooth', 0.06, 900),
  hitEnemy: () => beep(180, 0.08, 'square', 0.07, 90),
  hurt: () => beep(140, 0.2, 'sawtooth', 0.09, 60),
  jump: () => beep(330, 0.12, 'triangle', 0.07, 520),
  djump: () => beep(420, 0.12, 'triangle', 0.07, 700),
  dash: () => beep(900, 0.1, 'sine', 0.06, 300),
  coin: () => { beep(900, 0.06, 'square', 0.05); setTimeout(() => beep(1350, 0.09, 'square', 0.05), 60); },
  die: () => beep(220, 0.7, 'sawtooth', 0.1, 40),
  freeze: () => beep(1200, 0.5, 'sine', 0.08, 200),
  shatter: () => beep(1600, 0.2, 'square', 0.06, 400),
  boom: () => beep(80, 0.5, 'sawtooth', 0.14, 30),
  buy: () => beep(660, 0.1, 'square', 0.06, 880),
  levelup: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'triangle', 0.07), i * 110)); },
  bolt: () => beep(500, 0.15, 'sawtooth', 0.05, 150),
  thunder: () => beep(100, 0.6, 'sawtooth', 0.12, 45),
  roar: () => beep(90, 0.9, 'sawtooth', 0.13, 50),
};
// dark dungeon loop in A minor
const BASS = [110, 110, 130.8, 98];
const MELODY = [220, 0, 261.6, 220, 329.6, 0, 293.7, 261.6, 220, 0, 196, 220, 164.8, 0, 196, 0];
function startMusic() {
  if (musicTimer) return;
  musicTimer = setInterval(() => {
    if (!AC || !SET.music) return;
    const bar = Math.floor(musicStep / 16) % 4, st = musicStep % 16;
    if (st % 4 === 0) beep(BASS[bar] / 2, 0.5, 'triangle', 0.045);
    const m = MELODY[(st + bar * 3) % 16];
    if (m) beep(m, 0.22, 'square', scene === 'game' && level && level.dragon ? 0.035 : 0.028);
    if (scene === 'game' && level && level.dragon && st % 2 === 0) beep(55, 0.2, 'sawtooth', 0.03);
    musicStep++;
  }, 170);
}

// ---------------- Game state ----------------
let scene = 'title';  // title | settings | pick | game | camp | gameover | win | paused-handled-inline
let paused = false;
let time = 0;
let run = null;       // { mode, level, seed, dead? }
let level = null;     // current generated level
let P = null;         // player
let M = [], PR = [], PT = [], IB = [];  // monsters, projectiles, particles, ice blocks
let camX = 0;
let shake = 0;
let campState = null;
let showcaseType = null;
let msg = null;       // floating announcement {text, t}
function announce(t, dur) { msg = { text: t, t: dur || 2 }; }

// ---------------- Player ----------------
const WEAPONS = {
  sword: { name: 'Knight Sword', mult: 1.0, cd: 0.35, range: 54, knock: 180, specCd: 8, specSt: 45 },
  hammer: { name: 'Warhammer', mult: 1.9, cd: 0.7, range: 62, knock: 520, specCd: 10, specSt: 50 },
  axe: { name: 'Greataxe', mult: 1.5, cd: 0.55, range: 60, knock: 260, specCd: 10, specSt: 50 },
  bow: { name: 'Longbow', mult: 0.9, cd: 0.45, range: 0, knock: 80, specCd: 9, specSt: 45 },
};
function newPlayer() {
  return {
    x: 60, y: 300, w: 26, h: 44, vx: 0, vy: 0, face: 1, onGround: false,
    hp: 100, maxhp: 100, st: 100, maxst: 100, stRegen: 20,
    gold: 0, goldAtLevelStart: 0,
    // stats from upgrades
    atkMul: 1, spdMul: 1, jumpMul: 1, cdMul: 1, crit: 0.05, doubleGold: false,
    regenOnLevel: 0, dashDmg: false, djMul: 1,
    weapon: 'sword', owned: { sword: true }, wlvl: { sword: 0, hammer: 0, axe: 0, bow: 0 },
    hasShield: false, dynamite: 0, cleanse: 0, charms: {},
    // timers
    slashCd: 0, spinCd: 0, specCd: 0, dashCd: 0, iframes: 0, anim: 0,
    slashT: 0, spinT: 0, dashT: 0, jumps: 0, shielding: false,
    eff: { poison: 0, slow: 0, backfire: 0, blind: 0, frozen: 0, speed: 0, armor: 0, dmgpot: 0 },
    poisonTick: 0, regenTick: 0, dashHitSet: null, spinHitSet: null, dead: false,
  };
}
function playerDmg() {
  let d = 12 * WEAPONS[P.weapon].mult * P.atkMul;
  if (P.eff.dmgpot > 0) d *= 1.4;
  return d;
}
function tryCrit(d) {
  if (Math.random() < P.crit) { return { d: d * 2, crit: true }; }
  return { d, crit: false };
}

// ---------------- Particles ----------------
function puff(x, y, n, col, spd, life, grav) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = (spd || 80) * (0.3 + Math.random() * 0.7);
    PT.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t: (life || 0.5) * (0.5 + Math.random() * 0.5), max: life || 0.5, col, r: 2 + Math.random() * 3, grav: grav || 0 });
  }
}
function floatText(x, y, text, col) {
  PT.push({ x, y, vx: 0, vy: -50, t: 0.9, max: 0.9, col, text, r: 0, grav: 0 });
}
function updateParticles(dt) {
  for (let i = PT.length - 1; i >= 0; i--) {
    const p = PT[i];
    p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
    if (p.t <= 0) PT.splice(i, 1);
  }
}

// ---------------- Physics ----------------
const GRAV = 2300;
function solids() {
  return level ? level.plats.concat(IB) : [];
}
function moveBody(e, dt, oneWayOK) {
  // horizontal
  e.x += e.vx * dt;
  for (const p of solids()) {
    if (p.oneway) continue;
    if (overlap(e, p)) {
      if (e.vx > 0) e.x = p.x - e.w; else if (e.vx < 0) e.x = p.x + p.w;
      e.vx = 0;
    }
  }
  // vertical
  const oldY = e.y;
  e.y += e.vy * dt;
  e.onGround = false;
  for (const p of solids()) {
    if (!overlap(e, p)) continue;
    if (p.oneway) {
      if (e.vy > 0 && oldY + e.h <= p.y + 6) { e.y = p.y - e.h; e.vy = 0; e.onGround = true; }
      continue;
    }
    if (e.vy > 0) { e.y = p.y - e.h; e.vy = 0; e.onGround = true; }
    else if (e.vy < 0) { e.y = p.y + p.h; e.vy = 0; }
  }
}

// ---------------- Status effects on player ----------------
function applyEffect(name, dur) {
  if (P.dead) return;
  if (['poison', 'slow', 'backfire', 'blind'].includes(name) && P.cleanse > 0) {
    P.cleanse--; announce('Cleanse potion neutralized ' + name + '!');
    SFX.buy(); return;
  }
  P.eff[name] = Math.max(P.eff[name], dur);
  if (name === 'poison') announce('Poisoned!');
  if (name === 'slow') announce('Slowed by witch magic!');
  if (name === 'backfire') announce('Backfire curse! Attacking hurts you!');
  if (name === 'blind') announce('Blinded!');
}
function freezePlayer() {
  if (P.dead || P.eff.frozen > 0) return;
  let d = 1.87;
  if (P.charms.frost) d *= 0.5;
  P.eff.frozen = d;
  P.frozenAt = { x: P.x + P.w / 2, y: P.y + P.h };
  SFX.freeze();
  announce('Frozen solid!');
}
function hurtPlayer(dmg, kx, src) {
  if (P.dead || P.iframes > 0 || P.eff.frozen > 0) return; // monsters can't hit a frozen player
  if (P.shielding && P.st >= 12) {
    P.st -= 12; SFX.dash(); puff(P.x + P.w / 2 + P.face * 18, P.y + P.h / 2, 6, '#9ad6ff', 120, 0.3);
    return;
  }
  if (P.eff.armor > 0) dmg *= 0.6;
  P.hp -= dmg;
  P.vx += kx || 0; P.vy = Math.min(P.vy, -150);
  P.iframes = 0.8; shake = Math.max(shake, 6);
  SFX.hurt();
  puff(P.x + P.w / 2, P.y + P.h / 2, 8, '#d33', 130, 0.4);
  if (P.hp <= 0) killPlayer();
}
function killPlayer() {
  if (P.dead) return;
  P.dead = true; P.deadT = 2;
  SFX.die();
  puff(P.x + P.w / 2, P.y + P.h / 2, 30, '#aaa', 200, 0.8);
}
function respawn() {
  // lose gold gained this level, regenerate SAME level (same seed)
  const kept = P.goldAtLevelStart;
  const savedP = P;
  buildLevel(run.seed + run.level * 7919, run.level, level.dragon, level.showcase);
  P = savedP;
  P.gold = kept;
  P.dead = false; P.hp = P.maxhp; P.st = P.maxst;
  P.x = level.spawnX; P.y = level.spawnY; P.vx = 0; P.vy = 0;
  for (const k in P.eff) P.eff[k] = 0;
  P.frozenAt = null;
  P.iframes = 1.5;
}

// ---------------- Monsters ----------------
const MONSTER_DEFS = {
  slime:   { name: 'Slime', hp: 26, dmg: 8, gold: 5, minLv: 1,
    desc: 'A green slime that squishes and hops toward you. No special attack — just bouncy malice.' },
  bigslime:{ name: 'Big Slime', hp: 62, dmg: 13, gold: 12, minLv: 3,
    desc: 'A giant slime. Acts like a normal slime but stronger — and splits into two normal slimes when killed.' },
  archer:  { name: 'Four-Armed Archer', hp: 36, dmg: 7, gold: 10, minLv: 2,
    desc: 'A four-armed man wielding one bow per pair of hands. Fires two arrows at once from range.' },
  wasp:    { name: 'Giant Wasp', hp: 30, dmg: 9, gold: 10, minLv: 3,
    desc: 'A giant wasp that flies around and dives to sting. Each sting has a chance to poison you (health bar turns green, damage over time).' },
  ghost:   { name: 'Ghost', hp: 18, dmg: 10, gold: 8, minLv: 4,
    desc: 'A weak spirit that drifts through the air. Periodically turns invisible before striking.' },
  stalactite:{ name: 'Stalactite', hp: 14, dmg: 14, gold: 4, minLv: 4,
    desc: 'A living rock spike hanging from above. Drops when you walk underneath, and dies once it hits you (or the ground).' },
  ogre:    { name: 'Ogre', hp: 82, dmg: 10, gold: 18, minLv: 5,
    desc: 'A hulking brute that hurls stones with massive knockback.' },
  mage:    { name: 'Flame Mage', hp: 46, dmg: 6, gold: 18, minLv: 6,
    desc: 'A mage with fire wreathing his hands. Deals AOE damage and stokes the flames to enlarge his burning aura.' },
  knight:  { name: 'Hammer Knight', hp: 130, dmg: 24, gold: 25, minLv: 7,
    desc: 'A big, slow, heavily armored knight with a BIG hammer. Telegraphs a crushing overhead smash.' },
  ice:     { name: 'Frost Core', hp: 75, dmg: 12, gold: 22, minLv: 8,
    desc: 'A floating ice chunk orbited by smaller shards like electrons. Lashes shards at you, or crushes them together to freeze you solid for 1.87s. The ice block left behind is a platform — or shatter it to slow nearby monsters.' },
  witch:   { name: 'Witch', hp: 42, dmg: 6, gold: 20, minLv: 9,
    desc: 'Casts colored spells from her wand: purple = slowness, red = backfire (you take damage when attacking), black = blindness. Vanishes in smoke if you get close. Effects end early if she dies.' },
};
const MONSTER_ORDER = ['slime', 'bigslime', 'archer', 'wasp', 'ghost', 'stalactite', 'ogre', 'mage', 'knight', 'ice', 'witch'];

function hpScale(lv) { return 1 + 0.18 * (lv - 1); }
function dmgScale(lv) { return 1 + 0.1 * (lv - 1); }

function spawnMonster(type, x, y, lv) {
  const d = MONSTER_DEFS[type];
  const m = {
    type, x, y, vx: 0, vy: 0, face: -1, t: Math.random() * 2, state: 'idle', anim: Math.random() * 9,
    hp: d.hp * hpScale(lv), maxhp: d.hp * hpScale(lv), dmg: d.dmg * dmgScale(lv), gold: d.gold,
    slowT: 0, stunT: 0, burnT: 0, hitFlash: 0, lv, onGround: false, gravity: true,
    w: 30, h: 30,
  };
  switch (type) {
    case 'slime': m.w = 32; m.h = 24; break;
    case 'bigslime': m.w = 58; m.h = 42; break;
    case 'archer': m.w = 30; m.h = 52; break;
    case 'wasp': m.w = 40; m.h = 28; m.gravity = false; m.anchor = { x, y }; break;
    case 'ghost': m.w = 28; m.h = 36; m.gravity = false; m.visT = 2.5; m.visible = true; break;
    case 'stalactite': m.w = 24; m.h = 44; m.gravity = false; m.falling = false; break;
    case 'ogre': m.w = 52; m.h = 64; break;
    case 'mage': m.w = 28; m.h = 50; m.stage = 0; m.tick = 0; break;
    case 'knight': m.w = 44; m.h = 62; break;
    case 'ice': m.w = 44; m.h = 40; m.gravity = false; m.shards = 6; m.orbA = 0; m.anchor = { x, y }; m.regrow = 0; m.crush = 0; break;
    case 'witch': m.w = 28; m.h = 50; m.castIdx = 0; break;
  }
  M.push(m);
  return m;
}

function damageMonster(m, dmg, kx, fromPlayer) {
  if (m.hp <= 0) return;
  let crit = false;
  if (fromPlayer) {
    const c = tryCrit(dmg); dmg = c.d; crit = c.crit;
    if (P.eff.backfire > 0) { P.hp -= 3; floatText(P.x + P.w / 2, P.y - 8, '-3 curse', '#f55'); if (P.hp <= 0) killPlayer(); }
    // weapon upgrade on-hit effects
    if (P.weapon === 'sword' && P.wlvl.sword > 0) { m.burnT = 2.5; m.burnDps = 4 * P.wlvl.sword; }
    if (P.weapon === 'axe' && P.wlvl.axe > 0) m.slowT = Math.max(m.slowT, 2 + P.wlvl.axe);
    if (P.weapon === 'hammer') kx *= 1 + 0.5 * P.wlvl.hammer;
  }
  m.hp -= dmg;
  m.hitFlash = 0.12;
  m.vx += kx || 0;
  if (m.gravity) m.vy = Math.min(m.vy, -120);
  SFX.hitEnemy();
  floatText(m.x + m.w / 2, m.y - 6, Math.round(dmg) + (crit ? '!' : ''), crit ? '#ffe14d' : '#fff');
  if (crit) puff(m.x + m.w / 2, m.y + m.h / 2, 6, '#ffe14d', 120, 0.35);
  if (m.hp <= 0) killMonster(m, fromPlayer);
}
function killMonster(m, byPlayer) {
  m.deadFlag = true;
  puff(m.x + m.w / 2, m.y + m.h / 2, 14, '#ccc', 150, 0.5);
  // gold
  let g = m.gold;
  if (P.doubleGold) g *= 2;
  if (P.charms.lucky) g = Math.round(g * 1.25);
  P.gold += g;
  floatText(m.x + m.w / 2, m.y - 18, '+' + g + 'g', '#ffd24d');
  SFX.coin();
  if (P.charms.vampire && byPlayer) P.hp = Math.min(P.maxhp, P.hp + 2);
  if (m.type === 'bigslime') {
    for (let i = 0; i < 2; i++) {
      const s = spawnMonster('slime', m.x + i * 24, m.y + 8, m.lv);
      s.vy = -300; s.vx = (i ? 1 : -1) * 140;
    }
  }
  if (m.type === 'witch') {
    P.eff.slow = 0; P.eff.backfire = 0; P.eff.blind = 0;
    announce('Witch slain — curses lifted!');
  }
  if (level && level.showcase) {
    level.respawnT = 1.5;
  }
}

function nearPlayer(m, r) { return dist(m.x + m.w / 2, m.y + m.h / 2, P.x + P.w / 2, P.y + P.h / 2) < r; }
function towardPlayer(m) { return P.x + P.w / 2 > m.x + m.w / 2 ? 1 : -1; }

function monsterTouch(m, dmg, kx) {
  if (P.eff.frozen > 0) return false;
  if (overlap(m, P)) { hurtPlayer(dmg, kx !== undefined ? kx : towardPlayer(m) * -250 * -1, m); return true; }
  return false;
}

function updateMonster(m, dt) {
  m.anim += dt; m.t -= dt * (m.slowT > 0 ? 0.5 : 1);
  if (m.hitFlash > 0) m.hitFlash -= dt;
  if (m.slowT > 0) m.slowT -= dt;
  if (m.stunT > 0) { m.stunT -= dt; if (m.gravity) { m.vy += GRAV * dt; moveBody(m, dt); } return; }
  if (m.burnT > 0) {
    m.burnT -= dt;
    m.burnTick = (m.burnTick || 0) - dt;
    if (m.burnTick <= 0) { m.burnTick = 0.5; m.hp -= (m.burnDps || 4) * 0.5; floatText(m.x + m.w / 2, m.y, '🔥', '#f80'); if (m.hp <= 0) { killMonster(m, true); return; } }
    if (Math.random() < 0.3) puff(m.x + Math.random() * m.w, m.y + Math.random() * m.h, 1, '#f73', 40, 0.3);
  }
  const sf = m.slowT > 0 ? 0.45 : 1;
  const px = P.x + P.w / 2, py = P.y + P.h / 2;
  switch (m.type) {
    case 'slime': case 'bigslime': {
      const big = m.type === 'bigslime';
      if (m.onGround) {
        m.vx *= 0.8;
        if (m.t <= 0 && nearPlayer(m, 620) && !P.dead) {
          m.t = 0.55 + Math.random() * 0.5;
          m.vy = -(big ? 560 : 470) * sf;
          m.vx = towardPlayer(m) * (big ? 150 : 175) * sf;
          m.face = towardPlayer(m);
        }
      }
      monsterTouch(m, m.dmg, towardPlayer(m) * 200);
      break;
    }
    case 'archer': {
      m.face = towardPlayer(m);
      if (m.t <= 0 && nearPlayer(m, 640) && !P.dead) {
        m.t = 1.9;
        m.shootAnim = 0.3;
        // two bows = two arrows
        for (let i = 0; i < 2; i++) {
          const sx = m.x + m.w / 2, sy = m.y + 14 + i * 16;
          const a = Math.atan2(py - sy, px - sx) + (i ? 0.07 : -0.07);
          PR.push({ kind: 'arrow', from: 'enemy', x: sx, y: sy, vx: Math.cos(a) * 380 * sf, vy: Math.sin(a) * 380 * sf, r: 4, dmg: m.dmg, t: 4, grav: 120 });
        }
        SFX.bolt();
      }
      if (m.shootAnim > 0) m.shootAnim -= dt;
      break;
    }
    case 'wasp': {
      if (m.state === 'idle') {
        m.x = m.anchor.x + Math.cos(m.anim * 1.4) * 60;
        m.y = m.anchor.y + Math.sin(m.anim * 2.2) * 26;
        m.face = towardPlayer(m);
        if (m.t <= 0 && nearPlayer(m, 460) && !P.dead) {
          m.state = 'dive'; m.t = 1.1;
          const a = Math.atan2(py - m.y, px - m.x);
          m.vx = Math.cos(a) * 420 * sf; m.vy = Math.sin(a) * 420 * sf;
        }
      } else {
        m.x += m.vx * dt; m.y += m.vy * dt;
        if (monsterTouch(m, m.dmg, m.vx > 0 ? 250 : -250)) {
          if (Math.random() < 0.35) applyEffect('poison', 4);
          m.state = 'idle'; m.t = 2.4; m.anchor = { x: m.x, y: Math.min(m.y, 330) };
        }
        if (m.t <= 0) { m.state = 'idle'; m.t = 2.2; m.anchor = { x: m.x, y: Math.max(120, m.y - 80) }; }
      }
      break;
    }
    case 'ghost': {
      m.visT -= dt;
      if (m.visT <= 0) { m.visible = !m.visible; m.visT = m.visible ? 2.4 : 1.7; if (!m.visible) puff(m.x + m.w / 2, m.y + m.h / 2, 8, '#dde', 60, 0.5); }
      if (!P.dead && nearPlayer(m, 560)) {
        const a = Math.atan2(py - (m.y + m.h / 2), px - (m.x + m.w / 2));
        const sp = (m.visible ? 85 : 130) * sf;
        m.x += Math.cos(a) * sp * dt; m.y += Math.sin(a) * sp * dt;
        m.face = towardPlayer(m);
      }
      monsterTouch(m, m.dmg, towardPlayer(m) * 220);
      break;
    }
    case 'stalactite': {
      if (!m.falling) {
        if (Math.abs(px - (m.x + m.w / 2)) < 42 && py > m.y && !P.dead) {
          m.shake = (m.shake || 0) + dt;
          if (m.shake > 0.35) { m.falling = true; m.vy = 100; }
        } else m.shake = 0;
      } else {
        m.vy += GRAV * 1.1 * dt;
        m.y += m.vy * dt;
        if (overlap(m, P) && P.eff.frozen <= 0) { hurtPlayer(m.dmg, 0, m); m.hp = 0; killMonster(m, false); }
        for (const p of solids()) if (overlap(m, p)) { m.hp = 0; m.deadFlag = true; puff(m.x + m.w / 2, m.y + m.h, 10, '#999', 120, 0.4); }
      }
      break;
    }
    case 'ogre': {
      m.face = towardPlayer(m);
      if (nearPlayer(m, 700) && !nearPlayer(m, 180)) m.vx = m.face * 28 * sf;
      else m.vx = 0;
      if (m.t <= 0 && nearPlayer(m, 660) && !P.dead) {
        m.t = 2.6; m.throwAnim = 0.4;
        const sx = m.x + m.w / 2, sy = m.y + 8;
        const dx = px - sx, fl = Math.max(0.6, Math.abs(dx) / 420);
        PR.push({ kind: 'stone', from: 'enemy', x: sx, y: sy, vx: dx / fl, vy: (py - sy) / fl - 200, r: 10, dmg: m.dmg, t: 4, grav: 700, knock: 620 });
        SFX.bolt();
      }
      if (m.throwAnim > 0) m.throwAnim -= dt;
      monsterTouch(m, m.dmg * 1.4, towardPlayer(m) * 420);
      break;
    }
    case 'mage': {
      m.face = towardPlayer(m);
      if (nearPlayer(m, 460) && !P.dead) {
        m.stageT = (m.stageT || 0) + dt;
        if (m.stageT > 1.1) { m.stageT = 0; m.stage = m.stage >= 3 ? 1 : m.stage + 1; if (m.stage > 1) puff(m.x + m.w / 2, m.y + m.h / 2, 12, '#f93', 150, 0.5); }
        if (m.stage === 0) m.stage = 1;
      } else { m.stage = 0; m.stageT = 0; }
      if (m.stage > 0) {
        const rad = [0, 60, 105, 155][m.stage];
        m.tick -= dt;
        if (m.tick <= 0) {
          m.tick = 0.5;
          if (dist(px, py, m.x + m.w / 2, m.y + m.h / 2) < rad && P.eff.frozen <= 0) hurtPlayer(m.dmg, towardPlayer(m) * -80, m);
        }
        if (Math.random() < 0.5) {
          const a = Math.random() * TAU, r = rad * (0.5 + Math.random() * 0.5);
          PT.push({ x: m.x + m.w / 2 + Math.cos(a) * r, y: m.y + m.h / 2 + Math.sin(a) * r, vx: 0, vy: -60, t: 0.4, max: 0.4, col: ['#f50', '#fa0', '#ff0'][Math.floor(Math.random() * 3)], r: 3, grav: 0 });
        }
      }
      break;
    }
    case 'knight': {
      m.face = towardPlayer(m);
      if (m.state === 'idle') {
        if (nearPlayer(m, 520) && !nearPlayer(m, 80)) m.vx = m.face * 38 * sf; else m.vx = 0;
        if (nearPlayer(m, 95) && m.t <= 0 && !P.dead) { m.state = 'windup'; m.swingT = 0.7; m.vx = 0; }
      } else if (m.state === 'windup') {
        m.swingT -= dt * sf;
        if (m.swingT <= 0) {
          m.state = 'smash'; m.swingT = 0.25;
          shake = Math.max(shake, 8); SFX.boom();
          const box = { x: m.face > 0 ? m.x + m.w : m.x - 95, y: m.y - 10, w: 95, h: m.h + 20 };
          if (overlap(box, P) && P.eff.frozen <= 0) hurtPlayer(m.dmg, m.face * 380, m);
          puff(m.x + m.w / 2 + m.face * 70, m.y + m.h, 12, '#aa8', 160, 0.4);
        }
      } else if (m.state === 'smash') {
        m.swingT -= dt;
        if (m.swingT <= 0) { m.state = 'idle'; m.t = 1.6; }
      }
      break;
    }
    case 'ice': {
      m.y = m.anchor.y + Math.sin(m.anim * 1.3) * 14;
      m.orbA += dt * (2 - (m.crush > 0 ? 0 : 0));
      m.face = towardPlayer(m);
      if (m.crush > 0) {
        m.crush -= dt;
        if (m.crush <= 0) {
          // release the freeze orb
          const a = Math.atan2(py - (m.y + m.h / 2), px - (m.x + m.w / 2));
          PR.push({ kind: 'freezeorb', from: 'enemy', x: m.x + m.w / 2, y: m.y + m.h / 2, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, r: 12, dmg: m.dmg * 0.6, t: 4, grav: 0 });
          m.shards = 0; m.regrow = 1.2;
          SFX.freeze();
        }
      } else if (m.shards < 6) {
        m.regrow -= dt;
        if (m.regrow <= 0) { m.shards++; m.regrow = 1.2; }
      }
      if (m.t <= 0 && nearPlayer(m, 620) && !P.dead && m.crush <= 0) {
        if (m.shards >= 5 && Math.random() < 0.45) {
          m.crush = 0.9; m.t = 3.2;  // big freeze attack
        } else if (m.shards > 0) {
          // lash a shard at the player
          m.shards--;
          const sx = m.x + m.w / 2, sy = m.y + m.h / 2;
          const a = Math.atan2(py - sy, px - sx);
          PR.push({ kind: 'shard', from: 'enemy', x: sx, y: sy, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, r: 6, dmg: m.dmg, t: 3, grav: 0 });
          m.t = 1.6; SFX.bolt();
        } else m.t = 1;
      }
      break;
    }
    case 'witch': {
      m.face = towardPlayer(m);
      if (nearPlayer(m, 130) && !P.dead) {
        // vanish in a puff of smoke and reappear elsewhere
        puff(m.x + m.w / 2, m.y + m.h / 2, 16, '#857', 130, 0.6);
        const dir = Math.random() < 0.5 ? -1 : 1;
        m.x = clamp(px + dir * (240 + Math.random() * 160), 40, (level.width || W) - 80);
        m.y = P.y - 60;
        m.vy = 0;
        puff(m.x + m.w / 2, m.y + m.h / 2, 16, '#857', 130, 0.6);
        m.t = 1;
      }
      if (m.t <= 0 && nearPlayer(m, 640) && !P.dead) {
        m.t = 2.2; m.castAnim = 0.35;
        const spells = [
          { eff: 'slow', col: '#b36bff' },
          { eff: 'backfire', col: '#ff4d4d' },
          { eff: 'blind', col: '#222' },
        ];
        const sp = spells[m.castIdx % 3]; m.castIdx++;
        const sx = m.x + m.w / 2 + m.face * 16, sy = m.y + 16;
        const a = Math.atan2(py - sy, px - sx);
        PR.push({ kind: 'hex', from: 'enemy', x: sx, y: sy, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, r: 7, dmg: m.dmg, t: 4, grav: 0, eff: sp.eff, col: sp.col });
        SFX.bolt();
      }
      if (m.castAnim > 0) m.castAnim -= dt;
      break;
    }
    case 'dragon': updateDragon(m, dt); break;
  }
  if (m.gravity) { m.vy += GRAV * dt; moveBody(m, dt); }
  // thorn charm
  if (P.charms.thorn && overlap(m, P) && (m.thornT = (m.thornT || 0) - dt) <= 0) {
    m.thornT = 0.6; damageMonster(m, 4, 0, false);
  }
}

// ---------------- Dragon boss ----------------
function spawnDragon(lv) {
  const m = {
    type: 'dragon', x: level.width - 360, y: 140, w: 200, h: 140, vx: 0, vy: 0, face: -1,
    hp: 950 * hpScale(lv), maxhp: 950 * hpScale(lv), dmg: 16 * dmgScale(lv), gold: 300, lv,
    t: 2, summonT: 5, anim: 0, slowT: 0, stunT: 0, burnT: 0, hitFlash: 0, gravity: false, phase: 1,
  };
  M.push(m);
  SFX.roar();
  announce('THE DRAGON AWAKENS', 3);
  return m;
}
function updateDragon(m, dt) {
  const frac = m.hp / m.maxhp;
  const newPhase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (newPhase !== m.phase) {
    m.phase = newPhase; SFX.roar(); shake = 12;
    announce(m.phase === 2 ? 'PHASE 2 — VENOM' : 'PHASE 3 — FROSTBITE', 2.5);
    puff(m.x + m.w / 2, m.y + m.h / 2, 30, m.phase === 2 ? '#6c4' : '#8df', 250, 0.8);
  }
  const pm = [0, 1, 1.3, 1.6][m.phase];
  m.anim += dt;
  m.y = 110 + Math.sin(m.anim * 0.9) * 60;
  m.x = level.width - 420 + Math.sin(m.anim * 0.45) * 110;
  m.face = -1;
  const px = P.x + P.w / 2, py = P.y + P.h / 2;
  m.t -= dt;
  if (m.t <= 0 && !P.dead) {
    m.t = [0, 2.0, 1.8, 1.5][m.phase];
    const sx = m.x + 18, sy = m.y + 60;
    const base = Math.atan2(py - sy, px - sx);
    const n = m.phase === 1 ? 3 : m.phase === 2 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.13;
      const kind = m.phase === 1 ? 'fireball' : m.phase === 2 ? 'venom' : 'frostbolt';
      PR.push({ kind, from: 'enemy', x: sx, y: sy, vx: Math.cos(a) * 340, vy: Math.sin(a) * 340, r: 9, dmg: m.dmg * pm, t: 4, grav: kind === 'venom' ? 240 : 40 });
    }
    SFX.bolt();
  }
  if (m.phase >= 2) {
    m.summonT -= dt;
    const minions = M.filter(x => x.type !== 'dragon').length;
    const cap = m.phase === 2 ? 3 : 5;
    if (m.summonT <= 0 && minions < cap) {
      m.summonT = m.phase === 2 ? 6 : 4;
      const pool = m.phase === 2 ? ['slime', 'wasp'] : ['slime', 'wasp', 'ghost'];
      const t = pool[Math.floor(Math.random() * pool.length)];
      const s = spawnMonster(t, m.x - 60 - Math.random() * 200, m.y + 60, m.lv);
      puff(s.x + s.w / 2, s.y + s.h / 2, 12, '#a6f', 150, 0.5);
    }
  }
  if (overlap(m, P) && P.eff.frozen <= 0) hurtPlayer(25 * pm, towardPlayer(m) * -1 * 450, m);
}

// ---------------- Projectiles ----------------
function updateProjectiles(dt) {
  for (let i = PR.length - 1; i >= 0; i--) {
    const p = PR[i];
    p.t -= dt;
    if (p.kind === 'homingsword') {
      // sword special: seek nearest living monster
      let best = null, bd = 1e9;
      for (const m of M) { if (m.hp > 0) { const d = dist(p.x, p.y, m.x + m.w / 2, m.y + m.h / 2); if (d < bd) { bd = d; best = m; } } }
      if (best) {
        const a = Math.atan2(best.y + best.h / 2 - p.y, best.x + best.w / 2 - p.x);
        p.vx = lerp(p.vx, Math.cos(a) * 520, 6 * dt);
        p.vy = lerp(p.vy, Math.sin(a) * 520, 6 * dt);
      }
      p.hitT = (p.hitT || 0) - dt;
      if (Math.random() < 0.5) PT.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: 0.3, max: 0.3, col: '#cdf', r: 2, grav: 0 });
    }
    p.vy += (p.grav || 0) * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    let kill = p.t <= 0;
    // wall collision
    if (!kill && p.kind !== 'homingsword') {
      const box = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
      for (const pl of solids()) if (!pl.oneway && overlap(box, pl)) { kill = true; break; }
    }
    if (p.from === 'enemy' && !kill) {
      const box = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
      if (overlap(box, P) && !P.dead && P.eff.frozen <= 0) {
        if (p.kind === 'freezeorb') { freezePlayer(); }
        else {
          hurtPlayer(p.dmg, (p.vx > 0 ? 1 : -1) * (p.knock || 160), p);
          if (p.kind === 'hex' && P.iframes >= 0.79) applyEffect(p.eff, p.eff === 'blind' ? 4 : 5);
          if (p.kind === 'venom' && Math.random() < 0.5) applyEffect('poison', 4);
          if (p.kind === 'frostbolt' && Math.random() < 0.35) freezePlayer();
        }
        kill = true;
      }
    } else if (p.from === 'player' && !kill) {
      const box = { x: p.x - p.r, y: p.y - p.r, w: p.r * 2, h: p.r * 2 };
      for (const m of M) {
        if (m.hp <= 0 || p.kind === 'dynamite') continue;
        if (overlap(box, m)) {
          if (p.kind === 'homingsword') {
            if ((p.hitT || 0) <= 0) { damageMonster(m, p.dmg, p.vx > 0 ? 120 : -120, true); p.hitT = 0.4; }
          } else {
            damageMonster(m, p.dmg, p.vx > 0 ? 160 : -160, true);
            kill = true;
          }
          break;
        }
      }
    }
    if (p.kind === 'dynamite' && (p.t <= 0 || kill)) {
      // explode!
      explode(p.x, p.y, 130, 55 * P.atkMul, true);
      PR.splice(i, 1); continue;
    }
    if (kill) {
      if (p.kind === 'freezeorb') puff(p.x, p.y, 10, '#aef', 130, 0.4);
      PR.splice(i, 1);
    }
  }
}
function explode(x, y, r, dmg, byPlayer) {
  SFX.boom(); shake = Math.max(shake, 10);
  puff(x, y, 26, '#fa0', 260, 0.6);
  puff(x, y, 14, '#666', 160, 0.9);
  for (const m of M) {
    if (m.hp <= 0) continue;
    if (dist(x, y, m.x + m.w / 2, m.y + m.h / 2) < r + Math.max(m.w, m.h) / 2)
      damageMonster(m, dmg, (m.x > x ? 1 : -1) * 500, byPlayer);
  }
}

// ---------------- Ice blocks ----------------
function addIceBlock(cx, bottomY) {
  IB.push({ x: cx - 22, y: bottomY - 44, w: 44, h: 44, ice: true });
}
function shatterIce(ib) {
  SFX.shatter();
  puff(ib.x + ib.w / 2, ib.y + ib.h / 2, 18, '#bef', 200, 0.6);
  for (const m of M) {
    if (dist(ib.x + ib.w / 2, ib.y + ib.h / 2, m.x + m.w / 2, m.y + m.h / 2) < 230) {
      m.slowT = Math.max(m.slowT, 4);
      floatText(m.x + m.w / 2, m.y, 'slowed', '#9df');
    }
  }
  IB.splice(IB.indexOf(ib), 1);
}

// ---------------- Level generation ----------------
function buildLevel(seed, lv, dragon, showcase) {
  const rng = mulberry32(seed);
  M = []; PR = []; PT = []; IB = [];
  level = { plats: [], torches: [], width: 0, exitX: 0, spawnX: 60, spawnY: 0, dragon: !!dragon, showcase: showcase || null, num: lv };
  const groundY = 470;
  if (dragon || showcase) {
    level.width = dragon ? 1400 : 960;
    level.plats.push({ x: -40, y: groundY, w: level.width + 80, h: 200 });
    level.plats.push({ x: -60, y: -200, w: 60, h: 900 });
    level.plats.push({ x: level.width, y: -200, w: 60, h: 900 });
    if (dragon) {
      level.plats.push({ x: 300, y: 360, w: 120, h: 18, oneway: true });
      level.plats.push({ x: 620, y: 300, w: 120, h: 18, oneway: true });
      spawnDragon(lv);
    }
    for (let x = 120; x < level.width; x += 280) level.torches.push({ x, y: groundY - 130 });
    level.spawnY = groundY - 60;
    P && (P.x = level.spawnX, P.y = level.spawnY);
    if (showcase) {
      spawnShowcaseMonster(showcase);
    }
    return;
  }
  const width = Math.min(7200, 2600 + lv * 260);
  level.width = width;
  let x = 0;
  let lastY = groundY;
  // left wall
  level.plats.push({ x: -60, y: -300, w: 60, h: 1000 });
  const monsterPool = MONSTER_ORDER.filter(t => MONSTER_DEFS[t].minLv <= lv);
  while (x < width) {
    const segW = 320 + Math.floor(rng() * 420);
    const segY = clamp(lastY + (rng() < 0.5 ? -1 : 1) * Math.floor(rng() * 3) * 30, 380, 480);
    level.plats.push({ x, y: segY, w: segW, h: 600 - segY + 200 });
    // torches
    for (let tx = x + 100; tx < x + segW - 60; tx += 260 + rng() * 160) level.torches.push({ x: tx, y: segY - 140 });
    // floating platforms above
    if (rng() < 0.6) {
      const fp = { x: x + 60 + rng() * (segW - 200), y: segY - 100 - rng() * 60, w: 90 + rng() * 90, h: 16, oneway: true };
      level.plats.push(fp);
      if (rng() < 0.5 && x > 500) maybeSpawn(fp.x + fp.w / 2, fp.y, rng, monsterPool, lv, true);
    }
    // monsters on ground segment
    if (x > 420) {
      const n = 1 + Math.floor(rng() * Math.min(3, 1 + lv / 4));
      for (let i = 0; i < n; i++) {
        const mx = x + 80 + rng() * (segW - 160);
        maybeSpawn(mx, segY, rng, monsterPool, lv, false);
      }
    }
    lastY = segY;
    x += segW;
    // gap (always jumpable)
    if (x < width - 500 && rng() < 0.55) x += 90 + rng() * 80;
  }
  // exit zone
  level.plats.push({ x: width, y: -300, w: 60, h: 1000 });
  level.exitX = width - 120;
  level.spawnY = 470 - 60;
  // find spawn ground
  level.spawnY = findGroundY(80) - 50;
}
function findGroundY(x) {
  let best = 600;
  for (const p of level.plats) if (x >= p.x && x <= p.x + p.w && p.y < best && p.y > 100) best = p.y;
  return best;
}
function maybeSpawn(mx, surfaceY, rng, pool, lv, onPlatform) {
  let type = pool[Math.floor(rng() * pool.length)];
  // weight: slimes more common early
  if (rng() < 0.35) type = rng() < 0.7 ? 'slime' : pool[Math.floor(rng() * pool.length)];
  const d = MONSTER_DEFS[type];
  if (!d) return;
  if (type === 'stalactite') {
    spawnMonster(type, mx, Math.max(20, surfaceY - 300 - rng() * 80), lv);
  } else if (type === 'wasp' || type === 'ghost' || type === 'ice') {
    spawnMonster(type, mx, surfaceY - 140 - rng() * 80, lv);
  } else {
    const m = spawnMonster(type, mx, surfaceY - 80, lv);
    m.y = surfaceY - m.h - 1;
  }
}
function spawnShowcaseMonster(type) {
  const groundY = 470;
  let m;
  if (type === 'dragon') { level.width = 1400; m = spawnDragon(3); }
  else if (type === 'stalactite') m = spawnMonster(type, 540, 60, 3);
  else if (['wasp', 'ghost', 'ice'].includes(type)) m = spawnMonster(type, 640, 260, 3);
  else { m = spawnMonster(type, 640, 200, 3); }
  return m;
}

// ---------------- Run / level flow ----------------
function startRun(mode) {
  run = { mode, level: 1, seed: Math.floor(Math.random() * 1e9) };
  P = newPlayer();
  startLevel(1);
  scene = 'game';
}
function startLevel(n) {
  run.level = n;
  const isDragon = run.mode === 'normal' && n === 26;
  buildLevel(run.seed + n * 7919, Math.min(n, 40), isDragon || run.fightDragon, null);
  run.fightDragon = false;
  P.x = level.spawnX; P.y = level.spawnY; P.vx = 0; P.vy = 0;
  P.goldAtLevelStart = P.gold;
  for (const k in P.eff) if (!['speed', 'armor', 'dmgpot'].includes(k)) P.eff[k] = 0;
  P.frozenAt = null;
  camX = 0;
  if (!level.dragon) announce(run.mode === 'normal' ? `Level ${n} / 25` : `Level ${n}`, 2);
}
function completeLevel() {
  SFX.levelup();
  if (P.regenOnLevel > 0) P.hp = Math.min(P.maxhp, P.hp + P.maxhp * 0.3 * P.regenOnLevel);
  openCamp();
}
function openCamp() {
  scene = 'camp';
  const pool = Object.keys(UPGRADES);
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b = a; while (b === a) b = pool[Math.floor(Math.random() * pool.length)];
  campState = { choices: [a, b], picked: false, tab: 'shop' };
}

// ---------------- Upgrades ----------------
const UPGRADES = {
  vitality: { name: 'Vitality', desc: '+25 max health', icon: 'heart',
    apply: () => { P.maxhp += 25; P.hp += 25; } },
  sharp: { name: 'Sharpness', desc: '+20% attack damage', icon: 'sword',
    apply: () => { P.atkMul *= 1.2; } },
  spring: { name: 'Spring Legs', desc: '+10% jump height', icon: 'boot',
    apply: () => { P.jumpMul *= 1.05; } },
  swift: { name: 'Swiftness', desc: '+12% move speed', icon: 'wing',
    apply: () => { P.spdMul *= 1.12; } },
  endure: { name: 'Endurance', desc: '+20 max stamina', icon: 'jar',
    apply: () => { P.maxst += 20; P.st += 20; } },
  mastery: { name: 'Weapon Mastery', desc: 'Upgrade your current weapon (sword: ignite, hammer: knockback, axe: chilling blade, bow: extra arrows)', icon: 'anvil',
    apply: () => { P.wlvl[P.weapon]++; } },
  midas: { name: 'Midas Touch', desc: 'Double gold from kills', icon: 'coin',
    apply: () => { P.doubleGold = true; } },
  eye: { name: 'Deadly Eye', desc: '+10% crit chance', icon: 'eye',
    apply: () => { P.crit += 0.1; } },
  resto: { name: 'Restoration', desc: 'Heal 30% when advancing levels', icon: 'cross',
    apply: () => { P.regenOnLevel++; } },
  focus: { name: 'Focus', desc: '-20% all cooldowns', icon: 'clock',
    apply: () => { P.cdMul *= 0.8; } },
  phantom: { name: 'Phantom Edge', desc: 'Dashing through enemies deals damage', icon: 'dash',
    apply: () => { P.dashDmg = true; } },
  skydancer: { name: 'Sky Dancer', desc: 'Double jump boosts 25% higher', icon: 'cloud',
    apply: () => { P.djMul *= 1.25; } },
};

// ---------------- Shop ----------------
const SHOP_ITEMS = [
  { id: 'heal', name: 'Healing Potion', price: 25, col: '#e44', desc: 'Restore 60 HP instantly', buy: () => { P.hp = Math.min(P.maxhp, P.hp + 60); } },
  { id: 'stam', name: 'Stamina Potion', price: 20, col: '#4af', desc: 'Refill stamina, +30% regen this run', buy: () => { P.st = P.maxst; P.stRegen += 3; } },
  { id: 'speedp', name: 'Speed Potion', price: 30, col: '#4e4', desc: '+30% speed for 60s', buy: () => { P.eff.speed = 60; } },
  { id: 'armorp', name: 'Armor Potion', price: 30, col: '#bbb', desc: '-40% damage taken for 60s', buy: () => { P.eff.armor = 60; } },
  { id: 'dmgp', name: 'Damage Potion', price: 30, col: '#f80', desc: '+40% damage for 60s', buy: () => { P.eff.dmgpot = 60; } },
  { id: 'cleanse', name: 'Cleanse Potion', price: 35, col: '#fdf', desc: 'Auto-removes the next bad effect', buy: () => { P.cleanse++; } },
  { id: 'dyna', name: 'Dynamite x3', price: 40, col: '#a33', desc: 'Throw with H. Big boom.', buy: () => { P.dynamite += 3; } },
];
const CHARMS = [
  { id: 'heart', name: 'Heart Charm', price: 70, col: '#f6a', desc: 'Slowly regenerate health' },
  { id: 'thorn', name: 'Thorn Charm', price: 65, col: '#6a4', desc: 'Enemies touching you take damage' },
  { id: 'lucky', name: 'Lucky Coin', price: 80, col: '#fd4', desc: '+25% gold from kills' },
  { id: 'feather', name: 'Feather Charm', price: 60, col: '#adf', desc: 'Dash recharges 35% faster' },
  { id: 'frost', name: 'Frost Ward', price: 75, col: '#8ef', desc: 'Freeze duration halved' },
  { id: 'vampire', name: 'Vampire Fang', price: 90, col: '#a2c', desc: 'Heal 2 HP per kill' },
];
const GEAR = [
  { id: 'hammer', name: 'Warhammer', price: 250, weapon: true, desc: 'Slow & brutal. Special (C/L): ground smash — huge knockback to all nearby.' },
  { id: 'axe', name: 'Greataxe', price: 250, weapon: true, desc: 'Heavy slashes. Special (C/L): call lightning, hitting & stunning all nearby.' },
  { id: 'bow', name: 'Longbow', price: 220, weapon: true, desc: 'Ranged shots. Special (C/L): arrows in ALL directions.' },
  { id: 'shield', name: 'Tower Shield', price: 120, desc: 'Hold SHIFT to block hits (costs stamina).' },
];

// ---------------- Player update ----------------
function updatePlayer(dt) {
  if (P.dead) {
    P.deadT -= dt;
    if (P.deadT <= 0) {
      if (level.showcase) { respawn(); }
      else respawn();
    }
    return;
  }
  // timers
  for (const k of ['slashCd', 'spinCd', 'specCd', 'dashCd', 'iframes']) if (P[k] > 0) P[k] -= dt;
  for (const k in P.eff) if (P.eff[k] > 0) P.eff[k] -= dt;
  P.anim += dt;
  // poison DoT
  if (P.eff.poison > 0) {
    P.poisonTick -= dt;
    if (P.poisonTick <= 0) { P.poisonTick = 1; P.hp -= 3; floatText(P.x + P.w / 2, P.y, '-3', '#5d5'); if (P.hp <= 0) { killPlayer(); return; } }
  }
  // heart charm
  if (P.charms.heart) {
    P.regenTick -= dt;
    if (P.regenTick <= 0) { P.regenTick = 2; P.hp = Math.min(P.maxhp, P.hp + 1); }
  }
  // stamina regen
  P.st = Math.min(P.maxst, P.st + P.stRegen * dt);

  // thaw: ice block stays behind, player ends up on top of it
  if (P.frozenAt && P.eff.frozen <= 0) {
    addIceBlock(P.frozenAt.x, P.frozenAt.y);
    P.y = P.frozenAt.y - 44 - P.h - 1;
    P.x = P.frozenAt.x - P.w / 2;
    P.frozenAt = null;
    puff(P.x + P.w / 2, P.y + P.h, 14, '#bef', 160, 0.5);
  }
  // FROZEN: no control at all
  if (P.eff.frozen > 0) {
    P.vx = 0; P.vy = 0;
    return;
  }

  const speed = 330 * P.spdMul * (P.eff.slow > 0 ? 0.5 : 1) * (P.eff.speed > 0 ? 1.3 : 1);
  const spinning = P.spinT > 0;
  const dashing = P.dashT > 0;

  // shield
  P.shielding = P.hasShield && down('shield') && P.onGround && !dashing && !spinning;

  // horizontal
  if (!dashing) {
    let mx = 0;
    if (down('left')) mx -= 1;
    if (down('right')) mx += 1;
    if (P.shielding) mx *= 0.25;
    if (mx) { P.vx = lerp(P.vx, mx * speed, 14 * dt); P.face = mx; }
    else P.vx = lerp(P.vx, 0, 16 * dt);
  }

  // jump & double jump
  const jumpV = 820 * P.jumpMul;
  if (hit('jump')) {
    if (P.onGround) { P.vy = -jumpV; P.jumps = 1; SFX.jump(); puff(P.x + P.w / 2, P.y + P.h, 4, '#999', 60, 0.3); }
    else if (P.jumps < 2 && P.st >= 15) {
      P.st -= 15; P.jumps = 2;
      P.vy = -jumpV * Math.sqrt(0.8) * P.djMul;  // 4/5 the height of a normal jump
      SFX.djump();
      // smoke particles under the player
      for (let i = 0; i < 10; i++) PT.push({ x: P.x + P.w / 2 + (Math.random() - 0.5) * 24, y: P.y + P.h, vx: (Math.random() - 0.5) * 80, vy: 60 + Math.random() * 60, t: 0.5, max: 0.5, col: '#ccc', r: 3 + Math.random() * 3, grav: -60 });
    }
  }
  // dash
  if (hit('dash') && P.dashCd <= 0 && !dashing) {
    P.dashT = 0.16; P.dashCd = (P.charms.feather ? 0.59 : 0.9) * P.cdMul;
    P.dashHitSet = new Set();
    SFX.dash();
  }
  if (dashing) {
    P.dashT -= dt;
    P.vx = P.face * 850;
    P.vy = 0;
    PT.push({ x: P.x + P.w / 2 - P.face * 12, y: P.y + P.h / 2, vx: -P.face * 60, vy: 0, t: 0.25, max: 0.25, col: '#9cf', r: 4, grav: 0 });
    if (P.dashDmg) {
      for (const m of M) {
        if (m.hp > 0 && overlap(m, P) && !P.dashHitSet.has(m)) {
          P.dashHitSet.add(m);
          damageMonster(m, playerDmg() * 0.8, P.face * 200, true);
        }
      }
    }
  }
  // basic slash (Z/J)
  if (hit('slash') && P.slashCd <= 0 && !spinning) {
    const wp = WEAPONS[P.weapon];
    if (P.st >= 8) {
      P.st -= 8;
      P.slashCd = wp.cd * P.cdMul;
      P.slashT = 0.18;
      SFX.slash();
      if (P.weapon === 'bow') {
        const n = 1 + P.wlvl.bow;
        for (let i = 0; i < n; i++) {
          const a = (P.face > 0 ? 0 : Math.PI) + (i - (n - 1) / 2) * 0.09;
          PR.push({ kind: 'parrow', from: 'player', x: P.x + P.w / 2, y: P.y + 16, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640 - 20, r: 4, dmg: playerDmg(), t: 2, grav: 60 });
        }
      } else {
        const box = { x: P.face > 0 ? P.x + P.w : P.x - wp.range, y: P.y - 6, w: wp.range, h: P.h + 12 };
        let hitAny = false;
        for (const m of M) if (m.hp > 0 && overlap(box, m)) { damageMonster(m, playerDmg(), P.face * wp.knock, true); hitAny = true; }
        // slash can shatter ice blocks
        for (let i = IB.length - 1; i >= 0; i--) if (overlap(box, IB[i])) shatterIce(IB[i]);
        if (hitAny) shake = Math.max(shake, 2);
      }
    }
  }
  if (P.slashT > 0) P.slashT -= dt;
  // spin attack (X/K)
  if (hit('spin') && P.spinCd <= 0 && P.st >= 30) {
    P.st -= 30;
    P.spinCd = 4 * P.cdMul;
    P.spinT = 0.55;
    P.spinHitSet = new Set();
    SFX.spin();
  }
  if (spinning) {
    P.spinT -= dt;
    if (!P.onGround) P.vy = 0;  // hovering while spinning in the air
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
    for (const m of M) {
      if (m.hp > 0 && !P.spinHitSet.has(m) && dist(cx, cy, m.x + m.w / 2, m.y + m.h / 2) < 78 + Math.max(m.w, m.h) / 2) {
        P.spinHitSet.add(m);
        damageMonster(m, playerDmg() * 1.2, (m.x > P.x ? 1 : -1) * 260, true);
      }
    }
    for (let i = IB.length - 1; i >= 0; i--) {
      if (dist(cx, cy, IB[i].x + 22, IB[i].y + 22) < 100) shatterIce(IB[i]);
    }
  }
  // weapon special (C/L)
  if (hit('special') && P.specCd <= 0) {
    const wp = WEAPONS[P.weapon];
    if (P.st >= wp.specSt) {
      P.st -= wp.specSt;
      P.specCd = wp.specCd * P.cdMul;
      doSpecial();
    } else floatText(P.x + P.w / 2, P.y - 10, 'Not enough stamina!', '#4af');
  }
  // dynamite (H)
  if (hit('dynamite') && P.dynamite > 0) {
    P.dynamite--;
    PR.push({ kind: 'dynamite', from: 'player', x: P.x + P.w / 2, y: P.y + 8, vx: P.face * 320, vy: -360, r: 6, dmg: 0, t: 1.1, grav: 900 });
  }

  // physics
  if (!spinning || P.onGround) P.vy += GRAV * dt;
  else if (spinning) P.vy = 0;
  if (!dashing) P.vy = Math.min(P.vy, 1100);
  moveBody(P, dt);
  if (P.onGround) P.jumps = 0;
  P.x = clamp(P.x, 0, level.width - P.w);
  // fell into a pit
  if (P.y > 700) {
    hurtPlayer(25, 0, null);
    if (!P.dead) {
      P.x = Math.max(40, P.x - 160);
      P.y = findGroundY(P.x + P.w / 2) - P.h - 4;
      P.vx = 0; P.vy = 0;
    }
  }
  // reach exit
  if (!level.dragon && !level.showcase && P.x + P.w / 2 > level.exitX + 20) {
    completeLevel();
  }
}
function doSpecial() {
  const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
  if (P.weapon === 'sword') {
    // spectral sword that hunts enemies
    PR.push({ kind: 'homingsword', from: 'player', x: cx, y: cy - 30, vx: P.face * 300, vy: -200, r: 12, dmg: playerDmg() * 1.4, t: 3.2, grav: 0 });
    SFX.spin();
  } else if (P.weapon === 'hammer') {
    SFX.boom(); shake = 14;
    puff(cx, P.y + P.h, 24, '#cb9', 240, 0.6);
    for (const m of M) {
      if (m.hp <= 0) continue;
      if (dist(cx, cy, m.x + m.w / 2, m.y + m.h / 2) < 250) {
        damageMonster(m, playerDmg() * 1.3, (m.x > P.x ? 1 : -1) * (900 + 200 * P.wlvl.hammer), true);
        if (m.gravity) m.vy = -500;
      }
    }
  } else if (P.weapon === 'axe') {
    SFX.thunder(); shake = 10;
    for (const m of M) {
      if (m.hp <= 0) continue;
      if (dist(cx, cy, m.x + m.w / 2, m.y + m.h / 2) < 270) {
        m.lightning = 0.3;
        damageMonster(m, playerDmg() * 1.5, 0, true);
        if (m.hp > 0) m.stunT = 1.6;
      }
    }
  } else if (P.weapon === 'bow') {
    const n = 12 + 4 * P.wlvl.bow;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      PR.push({ kind: 'parrow', from: 'player', x: cx, y: cy, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 4, dmg: playerDmg(), t: 2, grav: 40 });
    }
    SFX.spin();
  }
}

// ---------------- Game update ----------------
function updateGame(dt) {
  time += dt;
  if (hit('pause')) paused = !paused;
  if (paused) return;
  updatePlayer(dt);
  for (let i = M.length - 1; i >= 0; i--) {
    const m = M[i];
    if (m.deadFlag) {
      if (m.type === 'dragon') dragonDefeated();
      M.splice(i, 1); continue;
    }
    // only update monsters near camera
    if (Math.abs(m.x - (camX + W / 2)) < W * 0.9 || m.type === 'dragon') updateMonster(m, dt);
  }
  // showcase respawn
  if (level.showcase && level.respawnT !== undefined && level.respawnT > 0) {
    level.respawnT -= dt;
    if (level.respawnT <= 0 && M.length === 0) spawnShowcaseMonster(level.showcase);
  }
  updateProjectiles(dt);
  updateParticles(dt);
  if (shake > 0) shake = Math.max(0, shake - 30 * dt);
  if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
  // camera
  const target = clamp(P.x + P.w / 2 - W / 2, 0, Math.max(0, level.width - W));
  camX = lerp(camX, target, 8 * dt);
  // dragon win in showcase = just respawn
}
function dragonDefeated() {
  SFX.levelup();
  if (level.showcase) return;
  if (run.mode === 'normal') { scene = 'win'; }
  else { announce('DRAGON SLAIN! +300 bonus gold', 3); openCamp(); }
}

/* ============================================================
   RENDERING
   ============================================================ */
function g2() { return SET.pixel ? lowCtx : ctx; }

function drawWorld(g) {
  // background — dark stone with bricks
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#181820'); grd.addColorStop(1, '#23232e');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // distant pillars (parallax)
  g.fillStyle = '#1d1d28';
  const par = camX * 0.4;
  for (let x = -((par) % 300) - 300; x < W + 300; x += 300) {
    g.fillRect(x, 60, 70, H);
    g.fillRect(x - 10, 50, 90, 24);
  }
  // brick texture on background
  g.strokeStyle = 'rgba(255,255,255,0.025)'; g.lineWidth = 2;
  const bx = -(camX * 0.7 % 64);
  for (let y = 0; y < H; y += 32) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    for (let x = bx + (Math.floor(y / 32) % 2) * 32; x < W; x += 64) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 32); g.stroke();
    }
  }
  g.save();
  const sx = shake ? (Math.random() - 0.5) * shake : 0, sy = shake ? (Math.random() - 0.5) * shake : 0;
  g.translate(-camX + sx, sy);

  // torches on the walls
  for (const t of level.torches) {
    if (t.x < camX - 60 || t.x > camX + W + 60) continue;
    g.fillStyle = '#54422a';
    g.fillRect(t.x - 3, t.y, 6, 26);
    g.fillStyle = '#332', g.fillRect(t.x - 6, t.y + 22, 12, 6);
    // flame
    const fl = Math.sin(time * 11 + t.x) * 2;
    const fg = g.createRadialGradient(t.x, t.y - 6, 2, t.x, t.y - 6, 60);
    fg.addColorStop(0, 'rgba(255,170,60,0.35)'); fg.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = fg; g.beginPath(); g.arc(t.x, t.y - 6, 60, 0, TAU); g.fill();
    g.fillStyle = '#f93';
    g.beginPath(); g.ellipse(t.x, t.y - 8 + fl * 0.3, 5, 9 + fl, 0, 0, TAU); g.fill();
    g.fillStyle = '#fd5';
    g.beginPath(); g.ellipse(t.x, t.y - 6, 2.5, 5, 0, 0, TAU); g.fill();
  }

  // platforms — stone
  for (const p of level.plats) {
    if (p.x + p.w < camX - 40 || p.x > camX + W + 40) continue;
    if (p.oneway) {
      g.fillStyle = '#4a4a58';
      g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle = '#5d5d6e';
      g.fillRect(p.x, p.y, p.w, 5);
    } else {
      g.fillStyle = '#3a3a46';
      g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle = '#4d4d5c';
      g.fillRect(p.x, p.y, p.w, 8);
      // brick lines
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 2;
      for (let yy = p.y + 24; yy < Math.min(p.y + p.h, 620); yy += 26) {
        g.beginPath(); g.moveTo(p.x, yy); g.lineTo(p.x + p.w, yy); g.stroke();
      }
    }
  }
  // ice blocks
  for (const ib of IB) {
    g.fillStyle = 'rgba(160,220,255,0.8)';
    g.fillRect(ib.x, ib.y, ib.w, ib.h);
    g.strokeStyle = '#def'; g.lineWidth = 2; g.strokeRect(ib.x + 2, ib.y + 2, ib.w - 4, ib.h - 4);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fillRect(ib.x + 6, ib.y + 6, 10, 4);
  }
  // exit door
  if (!level.dragon && !level.showcase) {
    const ex = level.exitX;
    const gy = findGroundY(ex + 30);
    g.fillStyle = '#2a2118';
    g.fillRect(ex, gy - 86, 60, 86);
    g.beginPath(); g.arc(ex + 30, gy - 86, 30, Math.PI, 0); g.fillStyle = '#2a2118'; g.fill();
    g.fillStyle = '#181009';
    g.fillRect(ex + 8, gy - 78, 44, 78);
    g.beginPath(); g.arc(ex + 30, gy - 78, 22, Math.PI, 0); g.fill();
    const gl = 0.5 + Math.sin(time * 3) * 0.2;
    g.fillStyle = `rgba(120,200,255,${gl * 0.4})`;
    g.fillRect(ex + 8, gy - 78, 44, 78);
    g.fillStyle = '#ddd'; g.font = '13px serif'; g.textAlign = 'center';
    g.fillText('EXIT', ex + 30, gy - 100);
  }

  // monsters
  for (const m of M) {
    if (m.x + m.w < camX - 80 || m.x > camX + W + 80) continue;
    drawMonster(g, m);
  }
  // projectiles
  for (const p of PR) drawProjectile(g, p);
  // player
  if (!P.dead) drawKnight(g, P);
  if (P.eff.frozen > 0) {
    // ice cube around player
    g.fillStyle = 'rgba(150,215,255,0.65)';
    g.fillRect(P.x - 9, P.y - 8, P.w + 18, P.h + 10);
    g.strokeStyle = '#eef'; g.lineWidth = 2;
    g.strokeRect(P.x - 7, P.y - 6, P.w + 14, P.h + 6);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.fillRect(P.x - 4, P.y - 3, 8, 4);
  }
  // particles
  for (const p of PT) {
    const a = clamp(p.t / p.max, 0, 1);
    if (p.text) {
      g.globalAlpha = a;
      g.fillStyle = p.col; g.font = 'bold 14px monospace'; g.textAlign = 'center';
      g.fillText(p.text, p.x, p.y);
      g.globalAlpha = 1;
    } else {
      g.globalAlpha = a;
      g.fillStyle = p.col;
      g.beginPath(); g.arc(p.x, p.y, p.r * a + 0.5, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }
  }
  g.restore();
}

// ---------------- Knight (player) sprite ----------------
function drawKnight(g, P) {
  const cx = P.x + P.w / 2, feet = P.y + P.h;
  const runC = Math.abs(P.vx) > 40 && P.onGround;
  const legA = runC ? Math.sin(P.anim * 14) * 8 : 0;
  g.save();
  g.translate(cx, feet);
  g.scale(P.face, 1);
  if (P.iframes > 0 && Math.floor(time * 18) % 2 === 0) g.globalAlpha = 0.4;
  // CAPE — flows behind
  const capeW = clamp(-P.vx * P.face * 0.04, -4, 12) + 8;
  g.fillStyle = '#28406e';
  g.beginPath();
  g.moveTo(-4, -38);
  g.quadraticCurveTo(-14 - capeW, -24 + Math.sin(P.anim * 6) * 2, -10 - capeW, -2);
  g.lineTo(-6, -8);
  g.closePath(); g.fill();
  // legs (steel)
  g.fillStyle = '#7c8494';
  g.fillRect(-8 + legA * 0.4, -16, 6, 16);
  g.fillRect(2 - legA * 0.4, -16, 6, 16);
  g.fillStyle = '#565d6b';
  g.fillRect(-9 + legA * 0.4, -4, 8, 4);
  g.fillRect(1 - legA * 0.4, -4, 8, 4);
  // torso armor
  const tg = g.createLinearGradient(-10, -36, 10, -16);
  tg.addColorStop(0, '#aab2c4'); tg.addColorStop(0.5, '#8d95a6'); tg.addColorStop(1, '#6a7180');
  g.fillStyle = tg;
  g.beginPath();
  g.moveTo(-9, -34); g.lineTo(9, -34); g.lineTo(11, -22); g.lineTo(7, -14); g.lineTo(-7, -14); g.lineTo(-11, -22);
  g.closePath(); g.fill();
  g.strokeStyle = '#454b56'; g.lineWidth = 1; g.stroke();
  // belt
  g.fillStyle = '#503a22'; g.fillRect(-8, -17, 16, 3);
  // sword arm + sword
  const slashing = P.slashT > 0;
  const spin = P.spinT > 0;
  let swordA = -0.5;  // resting angle
  if (slashing) swordA = lerp(-2.0, 1.1, 1 - P.slashT / 0.18);
  if (spin) swordA = (0.55 - P.spinT) * 22;
  g.save();
  g.translate(7, -27);
  g.rotate(swordA);
  // arm
  g.fillStyle = '#8d95a6'; g.fillRect(0, -2, 10, 5);
  if (P.weapon !== 'bow') {
    drawWeaponSprite(g, P.weapon, 10, 0);
  } else {
    // bow
    g.strokeStyle = '#85622f'; g.lineWidth = 3;
    g.beginPath(); g.arc(14, 0, 13, -1.2, 1.2); g.stroke();
    g.strokeStyle = '#ddd'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(14 + Math.cos(-1.2) * 13, Math.sin(-1.2) * 13); g.lineTo(14 + Math.cos(1.2) * 13, Math.sin(1.2) * 13); g.stroke();
  }
  g.restore();
  // shield
  if (P.shielding) {
    g.fillStyle = '#6b7383';
    g.beginPath();
    g.moveTo(13, -36); g.lineTo(21, -34); g.lineTo(21, -16); g.lineTo(17, -10); g.lineTo(13, -16);
    g.closePath(); g.fill();
    g.strokeStyle = '#c9d2e0'; g.lineWidth = 1.5; g.stroke();
  }
  // other arm
  g.fillStyle = '#7c8494'; g.fillRect(-9, -30, 5, 10);
  // HELMET
  g.fillStyle = '#9aa3b5';
  g.beginPath();
  g.arc(0, -42, 9, Math.PI * 0.95, Math.PI * 2.05);
  g.lineTo(9, -36); g.lineTo(-9, -36);
  g.closePath(); g.fill();
  // visor slit
  g.fillStyle = '#1a1d24';
  g.fillRect(2, -45, 8, 3);
  // mouth holes for breathing
  g.fillStyle = '#1a1d24';
  g.beginPath(); g.arc(4, -39, 1.1, 0, TAU); g.fill();
  g.beginPath(); g.arc(7, -39, 1.1, 0, TAU); g.fill();
  g.beginPath(); g.arc(5.5, -36.5, 1.1, 0, TAU); g.fill();
  // RED PLUME on top
  g.fillStyle = '#c92f2f';
  g.beginPath();
  g.moveTo(-2, -50);
  g.quadraticCurveTo(-8, -56 + Math.sin(P.anim * 9) * 1.5, -16, -50);
  g.quadraticCurveTo(-9, -49, -5, -46);
  g.closePath(); g.fill();
  g.fillStyle = '#e84d4d';
  g.beginPath();
  g.moveTo(-1, -50);
  g.quadraticCurveTo(-6, -54, -12, -50.5);
  g.quadraticCurveTo(-7, -49.5, -4, -47.5);
  g.closePath(); g.fill();
  g.restore();
  // spin attack visual
  if (P.spinT > 0) {
    g.save(); g.translate(cx, P.y + P.h / 2);
    g.strokeStyle = 'rgba(220,230,255,0.5)';
    g.lineWidth = 3;
    const a0 = P.spinT * 25;
    g.beginPath(); g.arc(0, 0, 70, a0, a0 + 2.2); g.stroke();
    g.beginPath(); g.arc(0, 0, 58, -a0, -a0 + 1.8); g.stroke();
    g.restore();
  }
}
function drawWeaponSprite(g, weapon, x, y) {
  if (weapon === 'sword') {
    g.fillStyle = '#5a4a2f'; g.fillRect(x, y - 1.5, 5, 3);
    g.fillStyle = '#cbb24f'; g.fillRect(x + 5, y - 4, 2.5, 8);
    const bg = g.createLinearGradient(x + 7, 0, x + 30, 0);
    bg.addColorStop(0, '#e8edf5'); bg.addColorStop(1, '#9aa5b5');
    g.fillStyle = bg;
    g.beginPath(); g.moveTo(x + 7.5, y - 2.5); g.lineTo(x + 28, y - 1.5); g.lineTo(x + 31, y); g.lineTo(x + 28, y + 1.5); g.lineTo(x + 7.5, y + 2.5); g.closePath(); g.fill();
  } else if (weapon === 'hammer') {
    g.fillStyle = '#6e5435'; g.fillRect(x, y - 2, 20, 4);
    g.fillStyle = '#7a828f'; g.fillRect(x + 18, y - 9, 12, 18);
    g.fillStyle = '#5b626d'; g.fillRect(x + 18, y - 9, 12, 4);
  } else if (weapon === 'axe') {
    g.fillStyle = '#6e5435'; g.fillRect(x, y - 2, 22, 4);
    g.fillStyle = '#b9c2d0';
    g.beginPath(); g.moveTo(x + 20, y - 12); g.quadraticCurveTo(x + 34, y, x + 20, y + 12); g.quadraticCurveTo(x + 26, y, x + 20, y - 12); g.fill();
  }
}

// ---------------- Monster sprites ----------------
function drawMonster(g, m) {
  g.save();
  const cx = m.x + m.w / 2, cy = m.y + m.h / 2;
  if (m.hitFlash > 0) { g.globalAlpha = 0.9; }
  const flash = m.hitFlash > 0;
  switch (m.type) {
    case 'slime': case 'bigslime': {
      const big = m.type === 'bigslime';
      const squish = m.onGround ? 1 + Math.sin(m.anim * 6) * 0.06 : (m.vy < 0 ? 0.8 : 1.2);
      g.translate(cx, m.y + m.h);
      g.scale(1 / Math.sqrt(squish), squish);
      g.fillStyle = flash ? '#fff' : (big ? '#2f8f3f' : '#46c258');
      g.beginPath();
      g.ellipse(0, -m.h / 2, m.w / 2, m.h / 2, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath(); g.ellipse(-m.w * 0.18, -m.h * 0.68, m.w * 0.13, m.h * 0.14, -0.5, 0, TAU); g.fill();
      g.fillStyle = '#143'; // eyes
      g.beginPath(); g.arc(-m.w * 0.14 * m.face * -1, -m.h * 0.55, big ? 4 : 2.5, 0, TAU); g.fill();
      g.beginPath(); g.arc(m.w * 0.16 * m.face * -1, -m.h * 0.55, big ? 4 : 2.5, 0, TAU); g.fill();
      break;
    }
    case 'archer': {
      g.translate(cx, m.y + m.h); g.scale(m.face, 1);
      // legs
      g.fillStyle = '#5b4632'; g.fillRect(-6, -14, 5, 14); g.fillRect(2, -14, 5, 14);
      // body
      g.fillStyle = flash ? '#fff' : '#b08858';
      g.fillRect(-8, -38, 16, 24);
      // 4 arms! 2 bows!
      const pull = m.shootAnim > 0 ? 4 : 0;
      for (let i = 0; i < 2; i++) {
        const ay = -34 + i * 12;
        g.fillStyle = '#b08858';
        g.fillRect(0, ay, 13, 4);            // front arm
        g.fillRect(-2, ay + 5, 10 - pull, 4); // pulling arm
        g.strokeStyle = '#7a5c2e'; g.lineWidth = 2.5;
        g.beginPath(); g.arc(14, ay + 3, 10, -1.25, 1.25); g.stroke();
        g.strokeStyle = '#eee'; g.lineWidth = 1;
        g.beginPath();
        g.moveTo(14 + Math.cos(-1.25) * 10, ay + 3 + Math.sin(-1.25) * 10);
        g.lineTo(8 - pull, ay + 3);
        g.lineTo(14 + Math.cos(1.25) * 10, ay + 3 + Math.sin(1.25) * 10);
        g.stroke();
      }
      // head
      g.fillStyle = '#caa36d';
      g.beginPath(); g.arc(0, -44, 7, 0, TAU); g.fill();
      g.fillStyle = '#311'; g.beginPath(); g.arc(3, -45, 1.4, 0, TAU); g.fill();
      // headband
      g.fillStyle = '#84323a'; g.fillRect(-7, -50, 14, 4);
      break;
    }
    case 'wasp': {
      g.translate(cx, cy); g.scale(m.face, 1);
      // wings
      g.globalAlpha *= 0.55;
      const wf = Math.sin(m.anim * 40) * 0.6;
      g.fillStyle = '#cfe4ff';
      g.beginPath(); g.ellipse(-2, -12, 13, 5, -0.4 + wf, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(-6, -11, 11, 4, 0.4 - wf, 0, TAU); g.fill();
      g.globalAlpha = m.hitFlash > 0 ? 0.9 : 1;
      // abdomen striped
      g.fillStyle = flash ? '#fff' : '#e8b820';
      g.beginPath(); g.ellipse(-8, 2, 14, 9, 0.2, 0, TAU); g.fill();
      g.fillStyle = '#2c2416';
      g.save(); g.beginPath(); g.ellipse(-8, 2, 14, 9, 0.2, 0, TAU); g.clip();
      g.fillRect(-12, -8, 5, 20); g.fillRect(-3, -8, 5, 20);
      g.restore();
      // thorax + head
      g.fillStyle = '#caa015';
      g.beginPath(); g.arc(6, -2, 7, 0, TAU); g.fill();
      g.beginPath(); g.arc(14, -3, 5, 0, TAU); g.fill();
      g.fillStyle = '#000'; g.beginPath(); g.arc(16, -4, 1.8, 0, TAU); g.fill();
      // stinger
      g.fillStyle = '#444';
      g.beginPath(); g.moveTo(-20, 4); g.lineTo(-28, 8); g.lineTo(-19, 9); g.closePath(); g.fill();
      break;
    }
    case 'ghost': {
      const a = m.visible ? 0.85 : 0.07;
      g.globalAlpha = a;
      g.translate(cx, cy); g.scale(m.face, 1);
      g.fillStyle = flash ? '#fff' : '#e7e9f4';
      g.beginPath();
      g.arc(0, -6, 13, Math.PI, 0);
      const wob = m.anim * 7;
      g.lineTo(13, 12 + Math.sin(wob) * 2);
      for (let i = 3; i >= -3; i--) g.lineTo(i * 4.3, 12 + Math.sin(wob + i) * 4);
      g.lineTo(-13, 12 + Math.sin(wob + 4) * 2);
      g.closePath(); g.fill();
      g.fillStyle = '#23253a';
      g.beginPath(); g.arc(-4, -7, 2.6, 0, TAU); g.fill();
      g.beginPath(); g.arc(4, -7, 2.6, 0, TAU); g.fill();
      g.beginPath(); g.ellipse(0, 0, 2.5, 3.5, 0, 0, TAU); g.fill();
      break;
    }
    case 'stalactite': {
      const shx = (!m.falling && m.shake > 0) ? (Math.random() - 0.5) * 3 : 0;
      g.translate(cx + shx, m.y);
      g.fillStyle = flash ? '#fff' : '#8b8b97';
      g.beginPath();
      g.moveTo(-12, 0); g.lineTo(12, 0); g.lineTo(5, m.h * 0.55); g.lineTo(0, m.h); g.lineTo(-4, m.h * 0.5);
      g.closePath(); g.fill();
      g.fillStyle = '#6e6e7a';
      g.beginPath(); g.moveTo(0, 6); g.lineTo(6, 6); g.lineTo(1, m.h * 0.8); g.closePath(); g.fill();
      // angry eyes
      g.fillStyle = '#f33';
      g.beginPath(); g.arc(-4, 12, 1.7, 0, TAU); g.fill();
      g.beginPath(); g.arc(4, 12, 1.7, 0, TAU); g.fill();
      break;
    }
    case 'ogre': {
      g.translate(cx, m.y + m.h); g.scale(m.face, 1);
      g.fillStyle = '#4c3a28'; g.fillRect(-14, -22, 11, 22); g.fillRect(4, -22, 11, 22);
      g.fillStyle = flash ? '#fff' : '#7da25a';
      g.beginPath(); g.ellipse(0, -38, 24, 20, 0, 0, TAU); g.fill();  // belly
      g.fillStyle = '#5d4a32'; g.fillRect(-22, -42, 44, 10);          // loincloth strap
      // throwing arm
      const ta = m.throwAnim > 0 ? -1.8 + (0.4 - m.throwAnim) * 6 : 0.4;
      g.save(); g.translate(14, -48); g.rotate(ta);
      g.fillStyle = '#7da25a'; g.fillRect(0, -4, 20, 9);
      if (m.throwAnim > 0.2) { g.fillStyle = '#888'; g.beginPath(); g.arc(24, 0, 8, 0, TAU); g.fill(); }
      g.restore();
      g.fillStyle = '#7da25a'; g.fillRect(-24, -52, 9, 18);  // back arm
      // head
      g.fillStyle = '#88af66';
      g.beginPath(); g.arc(4, -60, 11, 0, TAU); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.arc(8, -62, 2, 0, TAU); g.fill();
      g.fillStyle = '#ddd';  // tusks
      g.beginPath(); g.moveTo(0, -53); g.lineTo(2, -47); g.lineTo(5, -53); g.fill();
      break;
    }
    case 'mage': {
      g.translate(cx, m.y + m.h); g.scale(m.face, 1);
      // aura
      if (m.stage > 0) {
        const rad = [0, 60, 105, 155][m.stage];
        const fg = g.createRadialGradient(0, -25, 6, 0, -25, rad);
        fg.addColorStop(0, 'rgba(255,120,0,0.25)');
        fg.addColorStop(0.8, 'rgba(255,60,0,0.12)');
        fg.addColorStop(1, 'rgba(255,60,0,0)');
        g.fillStyle = fg; g.beginPath(); g.arc(0, -25, rad, 0, TAU); g.fill();
        g.strokeStyle = `rgba(255,140,40,${0.4 + Math.sin(time * 8) * 0.2})`;
        g.lineWidth = 2; g.beginPath(); g.arc(0, -25, rad, 0, TAU); g.stroke();
      }
      // robe
      g.fillStyle = flash ? '#fff' : '#7a2020';
      g.beginPath(); g.moveTo(0, -50); g.lineTo(13, 0); g.lineTo(-13, 0); g.closePath(); g.fill();
      // fire-wreathed hands
      for (const s of [-1, 1]) {
        const hx = s * 15, hy = -30 + Math.sin(time * 6 + s) * 3;
        g.fillStyle = '#f60';
        g.beginPath(); g.arc(hx, hy, 6 + Math.sin(time * 10 + s) * 1.5, 0, TAU); g.fill();
        g.fillStyle = '#fc3';
        g.beginPath(); g.arc(hx, hy, 3, 0, TAU); g.fill();
      }
      // hood + face
      g.fillStyle = '#5e1717';
      g.beginPath(); g.arc(0, -48, 9, Math.PI * 0.9, Math.PI * 2.1); g.fill();
      g.fillStyle = '#fa3';
      g.beginPath(); g.arc(-3, -47, 1.5, 0, TAU); g.fill();
      g.beginPath(); g.arc(3, -47, 1.5, 0, TAU); g.fill();
      break;
    }
    case 'knight': {
      g.translate(cx, m.y + m.h); g.scale(m.face, 1);
      // legs
      g.fillStyle = '#3d4250'; g.fillRect(-13, -20, 10, 20); g.fillRect(4, -20, 10, 20);
      // massive armored body
      const kg = g.createLinearGradient(-18, -58, 18, -20);
      kg.addColorStop(0, flash ? '#fff' : '#646e80'); kg.addColorStop(1, flash ? '#eee' : '#3c4350');
      g.fillStyle = kg;
      g.fillRect(-18, -56, 36, 38);
      g.strokeStyle = '#262b34'; g.lineWidth = 2; g.strokeRect(-18, -56, 36, 38);
      g.fillStyle = '#2c313c'; g.fillRect(-18, -42, 36, 4);
      // helmet
      g.fillStyle = '#717c90';
      g.fillRect(-10, -70, 20, 16);
      g.fillStyle = '#16181e'; g.fillRect(2, -66, 8, 4);
      // BIG hammer
      const wind = m.state === 'windup' ? -2.4 + (0.7 - m.swingT) * 1.4 : m.state === 'smash' ? 1.2 : -0.5;
      g.save(); g.translate(16, -50); g.rotate(wind);
      g.fillStyle = '#5e4a30'; g.fillRect(0, -3, 44, 6);
      g.fillStyle = '#525a68'; g.fillRect(40, -16, 18, 32);
      g.fillStyle = '#3a4150'; g.fillRect(40, -16, 18, 6);
      g.restore();
      break;
    }
    case 'ice': {
      // big chunk of ice nucleus
      g.translate(cx, cy);
      const bob = Math.sin(m.anim * 1.3);
      g.fillStyle = flash ? '#fff' : 'rgba(150,215,250,0.9)';
      g.beginPath();
      g.moveTo(-22, -4); g.lineTo(-10, -19); g.lineTo(12, -17); g.lineTo(22, 0); g.lineTo(10, 18); g.lineTo(-12, 16);
      g.closePath(); g.fill();
      g.strokeStyle = '#e8f8ff'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillRect(-10, -10, 9, 5);
      // angry blue core
      g.fillStyle = '#1c5d8c';
      g.beginPath(); g.arc(-4, 1, 3, 0, TAU); g.fill();
      g.beginPath(); g.arc(6, 1, 3, 0, TAU); g.fill();
      // orbiting shards (electrons)
      const orbR = m.crush > 0 ? lerp(34, 6, 1 - m.crush / 0.9) : 34;
      for (let i = 0; i < m.shards; i++) {
        const a = m.orbA + (i / 6) * TAU;
        const ox = Math.cos(a) * orbR * 1.3, oy = Math.sin(a) * orbR * 0.55 + Math.cos(a * 0.7) * 6;
        g.fillStyle = 'rgba(190,235,255,0.92)';
        g.save(); g.translate(ox, oy); g.rotate(a);
        g.fillRect(-5, -5, 10, 10);
        g.strokeStyle = '#fff'; g.lineWidth = 1; g.strokeRect(-5, -5, 10, 10);
        g.restore();
      }
      if (m.crush > 0) {
        g.strokeStyle = `rgba(200,240,255,${0.6 + Math.sin(time * 20) * 0.3})`;
        g.lineWidth = 3;
        g.beginPath(); g.arc(0, 0, 28, 0, TAU); g.stroke();
      }
      break;
    }
    case 'witch': {
      g.translate(cx, m.y + m.h); g.scale(m.face, 1);
      // robe
      g.fillStyle = flash ? '#fff' : '#5a2a78';
      g.beginPath(); g.moveTo(0, -46); g.lineTo(14, 0); g.lineTo(-14, 0); g.closePath(); g.fill();
      // head
      g.fillStyle = '#d8b9a0';
      g.beginPath(); g.arc(0, -48, 7, 0, TAU); g.fill();
      g.fillStyle = '#222'; g.beginPath(); g.arc(3, -49, 1.3, 0, TAU); g.fill();
      // witch hat
      g.fillStyle = '#3a1b52';
      g.beginPath(); g.moveTo(-12, -53); g.lineTo(12, -53); g.lineTo(4, -55); g.lineTo(2, -74); g.lineTo(-4, -56); g.closePath(); g.fill();
      // wand arm
      g.fillStyle = '#5a2a78'; g.fillRect(4, -40, 14, 4);
      g.strokeStyle = '#8a6a3a'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(17, -38); g.lineTo(26, -46); g.stroke();
      // wand sparkle in next spell's color
      const cols = ['#b36bff', '#ff4d4d', '#333'];
      g.fillStyle = cols[m.castIdx % 3];
      const sp = m.castAnim > 0 ? 5 : 3;
      g.beginPath(); g.arc(27, -47, sp + Math.sin(time * 9) * 1, 0, TAU); g.fill();
      break;
    }
    case 'dragon': {
      g.translate(cx, cy); g.scale(m.face, 1);
      const cols = { 1: ['#a23232', '#7c1f1f', '#f80'], 2: ['#3f8f3a', '#2a6e2a', '#7f4'], 3: ['#3a6f9f', '#28567e', '#8ef'] }[m.phase];
      const wf = Math.sin(m.anim * 5) * 0.5;
      // wings
      g.fillStyle = cols[1];
      g.save(); g.rotate(-0.3 + wf * 0.3);
      g.beginPath(); g.moveTo(-10, -30); g.lineTo(-95, -85); g.lineTo(-65, -38); g.lineTo(-110, -50); g.lineTo(-50, -10); g.closePath(); g.fill();
      g.restore();
      // tail
      g.strokeStyle = cols[0]; g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-50, 10);
      g.quadraticCurveTo(-110, 30 + wf * 18, -150, 0 + wf * 26); g.stroke();
      g.lineWidth = 1;
      // body
      const dg = g.createLinearGradient(0, -50, 0, 60);
      dg.addColorStop(0, cols[0]); dg.addColorStop(1, cols[1]);
      g.fillStyle = flash ? '#fff' : dg;
      g.beginPath(); g.ellipse(-20, 10, 70, 48, 0.1, 0, TAU); g.fill();
      // belly plates
      g.fillStyle = 'rgba(255,230,180,0.35)';
      g.beginPath(); g.ellipse(-14, 34, 48, 20, 0.05, 0, TAU); g.fill();
      // neck + head
      g.fillStyle = flash ? '#fff' : cols[0];
      g.beginPath(); g.moveTo(30, -10); g.quadraticCurveTo(58, -45, 78, -52); g.lineTo(92, -38); g.quadraticCurveTo(60, -16, 44, 14); g.closePath(); g.fill();
      g.beginPath(); g.ellipse(86, -46, 22, 13, -0.25, 0, TAU); g.fill();
      // jaw + eye
      g.fillStyle = cols[1];
      g.beginPath(); g.moveTo(96, -42); g.lineTo(112, -36); g.lineTo(94, -32); g.closePath(); g.fill();
      g.fillStyle = cols[2];
      g.beginPath(); g.arc(84, -50, 3.5, 0, TAU); g.fill();
      // horns
      g.fillStyle = '#e8e0c8';
      g.beginPath(); g.moveTo(74, -56); g.lineTo(66, -72); g.lineTo(80, -58); g.fill();
      // breath glow
      g.fillStyle = cols[2]; g.globalAlpha = 0.5 + Math.sin(time * 7) * 0.25;
      g.beginPath(); g.arc(106, -36, 6, 0, TAU); g.fill();
      g.globalAlpha = 1;
      break;
    }
  }
  g.restore();
  // lightning strike fx
  if (m.lightning > 0) {
    m.lightning -= 1 / 60;
    g.strokeStyle = '#fffa9a'; g.lineWidth = 3;
    g.beginPath();
    let lx = cx, ly = m.y - 200;
    g.moveTo(lx, ly);
    while (ly < m.y + m.h / 2) { lx += (Math.random() - 0.5) * 26; ly += 32; g.lineTo(lx, ly); }
    g.stroke();
  }
  // hp bar over hurt monsters
  if (m.hp < m.maxhp && m.hp > 0 && m.type !== 'dragon') {
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.fillRect(m.x, m.y - 10, m.w, 4);
    g.fillStyle = m.slowT > 0 ? '#7cf' : '#e33';
    g.fillRect(m.x, m.y - 10, m.w * clamp(m.hp / m.maxhp, 0, 1), 4);
  }
  // stun stars
  if (m.stunT > 0) {
    g.fillStyle = '#ff6';
    for (let i = 0; i < 3; i++) {
      const a = time * 4 + i * TAU / 3;
      g.beginPath(); g.arc(cx + Math.cos(a) * 16, m.y - 12 + Math.sin(a) * 4, 2.5, 0, TAU); g.fill();
    }
  }
}

function drawProjectile(g, p) {
  g.save();
  switch (p.kind) {
    case 'arrow': case 'parrow': {
      const a = Math.atan2(p.vy, p.vx);
      g.translate(p.x, p.y); g.rotate(a);
      g.strokeStyle = p.kind === 'parrow' ? '#ddc' : '#a87';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(-9, 0); g.lineTo(7, 0); g.stroke();
      g.fillStyle = '#ccc';
      g.beginPath(); g.moveTo(10, 0); g.lineTo(5, -3); g.lineTo(5, 3); g.closePath(); g.fill();
      break;
    }
    case 'stone':
      g.fillStyle = '#8d8d96';
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      g.fillStyle = '#6f6f78';
      g.beginPath(); g.arc(p.x - 3, p.y + 2, p.r * 0.5, 0, TAU); g.fill();
      break;
    case 'shard':
      g.translate(p.x, p.y); g.rotate(time * 8);
      g.fillStyle = 'rgba(190,235,255,0.95)';
      g.fillRect(-5, -5, 10, 10);
      g.strokeStyle = '#fff'; g.strokeRect(-5, -5, 10, 10);
      break;
    case 'freezeorb': {
      const fg = g.createRadialGradient(p.x, p.y, 2, p.x, p.y, 16);
      fg.addColorStop(0, '#fff'); fg.addColorStop(0.5, '#9fdfff'); fg.addColorStop(1, 'rgba(120,200,255,0)');
      g.fillStyle = fg;
      g.beginPath(); g.arc(p.x, p.y, 16, 0, TAU); g.fill();
      break;
    }
    case 'hex':
      g.fillStyle = p.col;
      g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1;
      g.beginPath(); g.arc(p.x, p.y, p.r + 2 + Math.sin(time * 12) * 2, 0, TAU); g.stroke();
      break;
    case 'fireball':
      g.fillStyle = '#f60'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      g.fillStyle = '#fd4'; g.beginPath(); g.arc(p.x, p.y, p.r * 0.5, 0, TAU); g.fill();
      if (Math.random() < 0.6) PT.push({ x: p.x, y: p.y, vx: 0, vy: -30, t: 0.3, max: 0.3, col: '#f93', r: 3, grav: 0 });
      break;
    case 'venom':
      g.fillStyle = '#5b2'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      g.fillStyle = '#9e5'; g.beginPath(); g.arc(p.x - 2, p.y - 2, p.r * 0.4, 0, TAU); g.fill();
      break;
    case 'frostbolt':
      g.fillStyle = '#9df'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, TAU); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(p.x, p.y, p.r * 0.4, 0, TAU); g.fill();
      break;
    case 'dynamite':
      g.translate(p.x, p.y); g.rotate(time * 10);
      g.fillStyle = '#a32'; g.fillRect(-4, -8, 8, 16);
      g.strokeStyle = '#fd0'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -8); g.lineTo(3, -13); g.stroke();
      g.fillStyle = '#ff0'; g.beginPath(); g.arc(3, -13, 2, 0, TAU); g.fill();
      break;
    case 'homingsword': {
      const a = Math.atan2(p.vy, p.vx);
      g.translate(p.x, p.y); g.rotate(a);
      g.globalAlpha = 0.9;
      g.fillStyle = '#cfe2ff';
      g.beginPath(); g.moveTo(-14, -3); g.lineTo(12, -2); g.lineTo(17, 0); g.lineTo(12, 2); g.lineTo(-14, 3); g.closePath(); g.fill();
      g.fillStyle = '#ffd24d'; g.fillRect(-16, -5, 3, 10);
      break;
    }
  }
  g.restore();
}

// ---------------- HUD ----------------
function drawHUD() {
  const g = ctx;
  // ---- SWORD-SHAPED HEALTH BAR ----
  const hx = 18, hy = 26;
  const bladeLen = 220, bladeH = 14;
  g.save();
  g.translate(hx, hy);
  // pommel
  g.fillStyle = '#caa84f'; g.beginPath(); g.arc(4, 0, 7, 0, TAU); g.fill();
  // grip
  g.fillStyle = '#5a4128'; g.fillRect(8, -4, 26, 8);
  // crossguard
  g.fillStyle = '#caa84f'; g.fillRect(34, -14, 8, 28);
  // blade outline
  g.fillStyle = '#222630';
  g.beginPath();
  g.moveTo(42, -bladeH / 2); g.lineTo(42 + bladeLen, -bladeH / 2);
  g.lineTo(42 + bladeLen + 18, 0); g.lineTo(42 + bladeLen, bladeH / 2); g.lineTo(42, bladeH / 2);
  g.closePath(); g.fill();
  g.strokeStyle = '#8a93a6'; g.lineWidth = 2; g.stroke();
  // blade fill = health. green when poisoned, blue when frozen
  const frac = clamp(P.hp / P.maxhp, 0, 1);
  let col1 = '#e23b3b', col2 = '#8f1d1d';
  if (P.eff.frozen > 0) { col1 = '#58b9f0'; col2 = '#2a6da0'; }
  else if (P.eff.poison > 0) { col1 = '#4fc94f'; col2 = '#1f7a1f'; }
  g.save();
  g.beginPath();
  g.moveTo(43, -bladeH / 2 + 1.5); g.lineTo(42 + bladeLen, -bladeH / 2 + 1.5);
  g.lineTo(42 + bladeLen + 16, 0); g.lineTo(42 + bladeLen, bladeH / 2 - 1.5); g.lineTo(43, bladeH / 2 - 1.5);
  g.closePath(); g.clip();
  const hg = g.createLinearGradient(0, -bladeH / 2, 0, bladeH / 2);
  hg.addColorStop(0, col1); hg.addColorStop(1, col2);
  g.fillStyle = hg;
  g.fillRect(43, -bladeH / 2, (bladeLen + 16) * frac, bladeH);
  // shine
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.fillRect(43, -bladeH / 2 + 1, (bladeLen + 16) * frac, 3);
  g.restore();
  g.fillStyle = '#fff'; g.font = 'bold 11px monospace'; g.textAlign = 'left';
  g.fillText(Math.ceil(Math.max(0, P.hp)) + '/' + P.maxhp, 48, 4);
  g.restore();

  // ---- ROUND JAR STAMINA, sloshing blue liquid ----
  const jx = hx + 320, jy = 34, jr = 22;
  g.save();
  // jar neck + cork
  g.fillStyle = '#6b5a3a'; g.fillRect(jx - 7, jy - jr - 12, 14, 7);
  g.fillStyle = 'rgba(200,220,235,0.25)';
  g.fillRect(jx - 6, jy - jr - 6, 12, 8);
  // round jar glass
  g.beginPath(); g.arc(jx, jy, jr, 0, TAU);
  g.fillStyle = 'rgba(190,215,235,0.15)'; g.fill();
  g.strokeStyle = '#9fb4c8'; g.lineWidth = 2.5; g.stroke();
  // liquid (clip to circle)
  g.save();
  g.beginPath(); g.arc(jx, jy, jr - 2, 0, TAU); g.clip();
  const sfrac = clamp(P.st / P.maxst, 0, 1);
  const liqY = jy + jr - 2 - sfrac * (jr * 2 - 4);
  const slosh = clamp(P.vx / 330, -1, 1) * 4;
  g.fillStyle = '#2277dd';
  g.beginPath();
  g.moveTo(jx - jr, jy + jr);
  g.lineTo(jx - jr, liqY);
  for (let i = 0; i <= 12; i++) {
    const wx = jx - jr + (i / 12) * jr * 2;
    const wy = liqY + Math.sin(time * 4 + i * 0.9) * 2 + (i / 12 - 0.5) * -slosh * 2;
    g.lineTo(wx, wy);
  }
  g.lineTo(jx + jr, jy + jr);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(120,190,255,0.55)';
  g.beginPath();
  for (let i = 0; i <= 12; i++) {
    const wx = jx - jr + (i / 12) * jr * 2;
    const wy = liqY + Math.sin(time * 4 + i * 0.9) * 2 + (i / 12 - 0.5) * -slosh * 2;
    i === 0 ? g.moveTo(wx, wy) : g.lineTo(wx, wy);
  }
  for (let i = 12; i >= 0; i--) {
    const wx = jx - jr + (i / 12) * jr * 2;
    const wy = liqY + 4 + Math.sin(time * 4.7 + i * 1.1 + 2) * 2;
    g.lineTo(wx, wy);
  }
  g.closePath(); g.fill();
  g.restore();
  // glass shine
  g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 2;
  g.beginPath(); g.arc(jx - 7, jy - 7, jr * 0.55, Math.PI * 0.9, Math.PI * 1.45); g.stroke();
  g.restore();

  // gold + level
  g.fillStyle = '#ffd24d';
  g.beginPath(); g.arc(jx + 50, 22, 7, 0, TAU); g.fill();
  g.strokeStyle = '#b8901f'; g.lineWidth = 2;
  g.beginPath(); g.arc(jx + 50, 22, 7, 0, TAU); g.stroke();
  g.fillStyle = '#fff'; g.font = 'bold 14px monospace'; g.textAlign = 'left';
  g.fillText(P.gold, jx + 62, 27);
  g.font = '12px monospace'; g.fillStyle = '#aab';
  const lvText = level.showcase ? 'SHOWCASE' : level.dragon ? 'DRAGON' : (run.mode === 'normal' ? `LV ${run.level}/25` : `LV ${run.level} ∞`);
  g.fillText(lvText, jx + 50, 45);
  // weapon + cooldowns
  let cdx = jx + 140;
  drawCDIcon(g, cdx, 28, 'Z', P.slashCd / (WEAPONS[P.weapon].cd * P.cdMul)); cdx += 38;
  drawCDIcon(g, cdx, 28, 'X', P.spinCd / (4 * P.cdMul)); cdx += 38;
  drawCDIcon(g, cdx, 28, 'C', P.specCd / (WEAPONS[P.weapon].specCd * P.cdMul)); cdx += 38;
  drawCDIcon(g, cdx, 28, '⇥', P.dashCd / 0.9); cdx += 44;
  g.fillStyle = '#ccd'; g.font = '11px monospace';
  g.fillText(WEAPONS[P.weapon].name + (P.wlvl[P.weapon] ? ' +' + P.wlvl[P.weapon] : ''), cdx, 24);
  let inv = [];
  if (P.dynamite) inv.push('💣x' + P.dynamite + ' (H)');
  if (P.cleanse) inv.push('🧪x' + P.cleanse);
  if (P.hasShield) inv.push('🛡(SHIFT)');
  g.fillText(inv.join('  '), cdx, 40);
  // active effects
  let ex = 18, ey = 60;
  const effIcons = { poison: ['POISON', '#4c4'], slow: ['SLOW', '#b6f'], backfire: ['BACKFIRE', '#f55'], blind: ['BLIND', '#888'], frozen: ['FROZEN', '#8df'], speed: ['SPEED+', '#5e5'], armor: ['ARMOR+', '#ccc'], dmgpot: ['DMG+', '#fa0'] };
  for (const k in P.eff) {
    if (P.eff[k] > 0) {
      const [label, col] = effIcons[k];
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(ex - 3, ey - 11, label.length * 7 + 22, 15);
      g.fillStyle = col; g.font = 'bold 10px monospace';
      g.fillText(label + ' ' + Math.ceil(P.eff[k]), ex, ey);
      ex += label.length * 7 + 30;
    }
  }
  // charms
  let chx = W - 24;
  for (const c of CHARMS) if (P.charms[c.id]) {
    g.fillStyle = c.col;
    g.beginPath(); g.arc(chx, 22, 8, 0, TAU); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
    chx -= 22;
  }
  // dragon hp bar
  const dragon = M.find(m => m.type === 'dragon');
  if (dragon) {
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(W / 2 - 220, H - 36, 440, 18);
    const dcol = ['', '#e33', '#5c3', '#6cf'][dragon.phase];
    g.fillStyle = dcol;
    g.fillRect(W / 2 - 218, H - 34, 436 * clamp(dragon.hp / dragon.maxhp, 0, 1), 14);
    g.fillStyle = '#fff'; g.font = 'bold 12px monospace'; g.textAlign = 'center';
    g.fillText('THE DRAGON — PHASE ' + dragon.phase, W / 2, H - 42);
  }
  // announcement
  if (msg) {
    g.globalAlpha = clamp(msg.t, 0, 1);
    g.fillStyle = '#ffe9a8'; g.font = 'bold 22px serif'; g.textAlign = 'center';
    g.fillText(msg.text, W / 2, 110);
    g.globalAlpha = 1;
  }
  // showcase info
  if (level.showcase) {
    const d = level.showcase === 'dragon' ? { name: 'The Dragon', desc: '3 phases: fire → poison + summons → frost + more summons. Gets stronger each phase.' } : MONSTER_DEFS[level.showcase];
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(W / 2 - 330, H - 74, 660, 58);
    g.fillStyle = '#ffd24d'; g.font = 'bold 15px serif'; g.textAlign = 'center';
    g.fillText(d.name, W / 2, H - 56);
    g.fillStyle = '#ccc'; g.font = '11px monospace';
    wrapText(g, d.desc, W / 2, H - 40, 640, 13);
    g.fillStyle = '#889'; g.font = '11px monospace';
    g.fillText('ESC = back to monster list', W / 2, 70);
  }
  if (P.dead) {
    g.fillStyle = 'rgba(60,0,0,0.45)'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff'; g.font = 'bold 34px serif'; g.textAlign = 'center';
    g.fillText('YOU DIED', W / 2, H / 2 - 10);
    g.font = '14px monospace'; g.fillStyle = '#fbb';
    g.fillText('Returning to the start of the level... gold gained here is lost.', W / 2, H / 2 + 20);
  }
}
function drawCDIcon(g, x, y, key, frac) {
  frac = clamp(frac, 0, 1);
  g.fillStyle = 'rgba(0,0,0,0.5)';
  g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill();
  if (frac > 0) {
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath(); g.moveTo(x, y); g.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + TAU * frac); g.closePath(); g.fill();
  }
  g.strokeStyle = frac > 0 ? '#556' : '#8da3c8'; g.lineWidth = 2;
  g.beginPath(); g.arc(x, y, 14, 0, TAU); g.stroke();
  g.fillStyle = frac > 0 ? '#778' : '#fff'; g.font = 'bold 12px monospace'; g.textAlign = 'center';
  g.fillText(key, x, y + 4);
}
function wrapText(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if (g.measureText(line + w).width > maxW) { g.fillText(line, x, yy); line = w + ' '; yy += lh; }
    else line += w + ' ';
  }
  g.fillText(line, x, yy);
}

// blindness overlay
function drawBlindness() {
  if (P.eff.blind <= 0) return;
  const g = ctx;
  const px = P.x + P.w / 2 - camX, py = P.y + P.h / 2;
  const grd = g.createRadialGradient(px, py, 60, px, py, 160);
  const a = clamp(P.eff.blind, 0, 1) * 0.96;
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = grd;
  g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(0,0,0,${a})`;
  // fill corners beyond gradient radius
  g.save();
  g.beginPath();
  g.rect(0, 0, W, H);
  g.arc(px, py, 160, 0, TAU, true);
  g.fill('evenodd');
  g.restore();
}

/* ============================================================
   UI / MENUS
   ============================================================ */
function button(g, x, y, w, h, label, sub, disabled) {
  const hov = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
  g.fillStyle = disabled ? '#23232c' : hov ? '#3d4a66' : '#2c3344';
  g.strokeStyle = disabled ? '#333' : hov ? '#8fb4ff' : '#556';
  g.lineWidth = 2;
  roundRect(g, x, y, w, h, 8); g.fill(); g.stroke();
  g.fillStyle = disabled ? '#666' : '#fff';
  g.font = 'bold 16px serif'; g.textAlign = 'center';
  g.fillText(label, x + w / 2, y + (sub ? h / 2 - 4 : h / 2 + 6));
  if (sub) { g.font = '11px monospace'; g.fillStyle = disabled ? '#555' : '#9ab'; g.fillText(sub, x + w / 2, y + h / 2 + 14); }
  return hov && mouse.click && !disabled;
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function drawTitle() {
  const g = ctx;
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#11111a'); grd.addColorStop(1, '#1f1f2c');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // torches
  for (const tx of [120, W - 120]) {
    const fl = Math.sin(time * 10 + tx) * 2;
    const fg = g.createRadialGradient(tx, 200, 4, tx, 200, 130);
    fg.addColorStop(0, 'rgba(255,170,60,0.3)'); fg.addColorStop(1, 'rgba(255,140,40,0)');
    g.fillStyle = fg; g.beginPath(); g.arc(tx, 200, 130, 0, TAU); g.fill();
    g.fillStyle = '#54422a'; g.fillRect(tx - 4, 205, 8, 40);
    g.fillStyle = '#f93'; g.beginPath(); g.ellipse(tx, 198 + fl * 0.4, 7, 13 + fl, 0, 0, TAU); g.fill();
    g.fillStyle = '#fd5'; g.beginPath(); g.ellipse(tx, 202, 3.5, 7, 0, 0, TAU); g.fill();
  }
  g.fillStyle = '#e8d9b0'; g.font = 'bold 54px serif'; g.textAlign = 'center';
  g.fillText('PLUME KNIGHT', W / 2, 110);
  g.fillStyle = '#8a8aa0'; g.font = '15px serif';
  g.fillText('a tale of steel, slime and dragonfire', W / 2, 140);
  // knight hero
  const fakeP = { x: W / 2 - 13, y: 190, w: 26, h: 44, vx: 0, vy: 0, face: 1, onGround: true, anim: time, slashT: 0, spinT: 0, iframes: 0, shielding: false, weapon: 'sword', dashT: 0 };
  g.save(); g.translate(0, 0); g.scale(1.6, 1.6); g.translate(-W * 0.19, -70);
  drawKnight(g, fakeP);
  g.restore();
  if (button(g, W / 2 - 130, 290, 260, 46, 'NORMAL MODE', '25 levels + the Dragon')) { startRun('normal'); }
  if (button(g, W / 2 - 130, 346, 260, 46, 'INFINITE MODE', 'endless — fight the Dragon when you dare')) { startRun('infinite'); }
  if (button(g, W / 2 - 130, 402, 260, 40, 'MONSTER SHOWCASE', 'inspect every monster')) { scene = 'pick'; }
  if (button(g, W / 2 - 130, 450, 260, 36, 'SETTINGS', SET.pixel ? 'style: PIXEL ART' : 'style: SMOOTH')) { scene = 'settings'; }
  g.fillStyle = '#667'; g.font = '11px monospace';
  g.fillText('A/D move · W jump (×2!) · SPACE dash · Z slash · X spin · C special · SHIFT shield · H dynamite', W / 2, H - 14);
}
function drawSettings() {
  const g = ctx;
  g.fillStyle = '#15151f'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8d9b0'; g.font = 'bold 36px serif'; g.textAlign = 'center';
  g.fillText('SETTINGS', W / 2, 90);
  if (button(g, W / 2 - 160, 150, 320, 50, 'Art style: ' + (SET.pixel ? 'PIXEL ART' : 'SMOOTH'), 'click to toggle — pick the one you like better!')) { SET.pixel = !SET.pixel; saveSettings(); }
  if (button(g, W / 2 - 160, 215, 320, 50, 'Music: ' + (SET.music ? 'ON' : 'OFF'))) { SET.music = !SET.music; saveSettings(); }
  if (button(g, W / 2 - 160, 280, 320, 50, 'Sound FX: ' + (SET.sfx ? 'ON' : 'OFF'))) { SET.sfx = !SET.sfx; saveSettings(); }
  if (button(g, W / 2 - 100, 380, 200, 44, 'BACK')) scene = 'title';
  // live preview of the knight in current style
  const fakeP = { x: W / 2 - 13, y: 440, w: 26, h: 44, vx: 0, vy: 0, face: 1, onGround: true, anim: time, slashT: 0, spinT: 0, iframes: 0, shielding: false, weapon: 'sword', dashT: 0 };
  if (SET.pixel) {
    lowCtx.clearRect(0, 0, low.width, low.height);
    lowCtx.save(); lowCtx.scale(1 / 3, 1 / 3);
    drawKnight(lowCtx, fakeP);
    lowCtx.restore();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(low, 0, 0, W, H);
    ctx.imageSmoothingEnabled = true;
  } else drawKnight(g, fakeP);
}
function drawPick() {
  const g = ctx;
  g.fillStyle = '#15151f'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8d9b0'; g.font = 'bold 32px serif'; g.textAlign = 'center';
  g.fillText('MONSTER SHOWCASE', W / 2, 60);
  g.fillStyle = '#99a'; g.font = '13px monospace';
  g.fillText('Choose a monster to inspect. It respawns when killed. ESC returns here.', W / 2, 86);
  const all = MONSTER_ORDER.concat(['dragon']);
  const cols = 4, bw = 200, bh = 64, gapx = 24, gapy = 18;
  const x0 = (W - cols * bw - (cols - 1) * gapx) / 2, y0 = 120;
  all.forEach((t, i) => {
    const x = x0 + (i % cols) * (bw + gapx), y = y0 + Math.floor(i / cols) * (bh + gapy);
    const nm = t === 'dragon' ? 'The Dragon' : MONSTER_DEFS[t].name;
    if (button(g, x, y, bw, bh, nm, t === 'dragon' ? 'boss' : 'lv ' + MONSTER_DEFS[t].minLv + '+')) {
      run = { mode: 'showcase', level: 3, seed: 1 };
      P = newPlayer();
      P.maxhp = 300; P.hp = 300;
      buildLevel(1, 3, false, t);
      P.x = 80; P.y = level.spawnY;
      showcaseType = t;
      scene = 'game';
    }
  });
  if (button(g, W / 2 - 100, H - 70, 200, 42, 'BACK')) scene = 'title';
}

// ---------------- Camp (upgrades + shop between levels) ----------------
function drawCamp() {
  const g = ctx;
  g.fillStyle = '#171720'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#e8d9b0'; g.font = 'bold 26px serif'; g.textAlign = 'center';
  g.fillText(`LEVEL ${run.level} CLEARED — choose an upgrade & restock`, W / 2, 40);
  g.fillStyle = '#ffd24d'; g.font = 'bold 16px monospace';
  g.fillText('GOLD: ' + P.gold, W / 2, 66);
  // upgrade choice
  if (!campState.picked) {
    g.fillStyle = '#9ab'; g.font = '13px serif'; g.fillText('— Pick ONE upgrade —', W / 2, 92);
    campState.choices.forEach((id, i) => {
      const u = UPGRADES[id];
      const x = W / 2 - 320 + i * 340, y = 100, w = 300, h = 96;
      const hov = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
      g.fillStyle = hov ? '#34405c' : '#262d3e';
      g.strokeStyle = hov ? '#ffd24d' : '#556'; g.lineWidth = 2;
      roundRect(g, x, y, w, h, 10); g.fill(); g.stroke();
      drawUpgradeIcon(g, u.icon, x + 36, y + 48);
      g.fillStyle = '#ffd24d'; g.font = 'bold 16px serif'; g.textAlign = 'left';
      g.fillText(u.name, x + 70, y + 30);
      g.fillStyle = '#bcd'; g.font = '11px monospace';
      g.textAlign = 'left';
      wrapLeft(g, u.desc, x + 70, y + 50, 215, 14);
      if (hov && mouse.click) {
        u.apply(); campState.picked = true; SFX.levelup();
      }
    });
  } else {
    g.fillStyle = '#6c6'; g.font = '14px serif'; g.fillText('✔ Upgrade chosen!', W / 2, 130);
  }
  // shop
  g.textAlign = 'center';
  g.fillStyle = '#9ab'; g.font = '13px serif'; g.fillText('— SHOP — potions · charms · weapons & gear —', W / 2, 218);
  let sx = 30, sy = 228;
  SHOP_ITEMS.forEach((it, i) => {
    shopButton(g, sx + i * 130, sy, 122, 56, it.name, it.price + 'g', it.col, it.desc, () => { it.buy(); });
  });
  sy += 66;
  CHARMS.forEach((c, i) => {
    const ownedC = !!P.charms[c.id];
    shopButton(g, 30 + i * 152, sy, 144, 52, c.name, ownedC ? 'OWNED' : c.price + 'g', c.col, c.desc, () => { P.charms[c.id] = true; }, ownedC, ownedC ? 0 : c.price);
  });
  sy += 62;
  GEAR.forEach((it, i) => {
    const ownedG = it.weapon ? !!P.owned[it.id] : (it.id === 'shield' ? P.hasShield : false);
    const equipped = it.weapon && P.weapon === it.id;
    const label = ownedG ? (it.weapon ? (equipped ? 'EQUIPPED' : 'EQUIP') : 'OWNED') : it.price + 'g';
    shopButton(g, 30 + i * 180, sy, 170, 52, it.name, label, '#caa84f', it.desc, () => {
      if (ownedG) { if (it.weapon) P.weapon = it.id; }
      else {
        if (it.weapon) { P.owned[it.id] = true; P.weapon = it.id; }
        else P.hasShield = true;
      }
    }, ownedG && !it.weapon, ownedG ? 0 : it.price);
  });
  // sword equip
  if (P.weapon !== 'sword') {
    shopButton(g, 30 + 4 * 180, sy, 130, 52, 'Knight Sword', 'EQUIP', '#bbc', 'Your trusty blade.', () => { P.weapon = 'sword'; }, false, 0);
  }
  // hover tooltip
  if (hoverTip) {
    g.fillStyle = 'rgba(10,10,16,0.95)';
    const tw = Math.min(360, hoverTip.text.length * 6.4 + 20);
    let tx = clamp(mouse.x + 14, 4, W - tw - 4), ty = clamp(mouse.y - 8, 30, H - 50);
    roundRect(g, tx, ty, tw, 40, 6); g.fill();
    g.strokeStyle = '#667'; g.stroke();
    g.fillStyle = '#dde'; g.font = '10px monospace'; g.textAlign = 'left';
    wrapLeft(g, hoverTip.text, tx + 8, ty + 14, tw - 16, 12);
    hoverTip = null;
  }
  // continue
  const canGo = campState.picked;
  if (button(g, W / 2 - (run.mode === 'infinite' ? 230 : 110), H - 64, 220, 48, 'CONTINUE ➜', canGo ? (run.mode === 'normal' && run.level === 25 ? 'THE DRAGON AWAITS' : 'next level') : 'pick an upgrade first', !canGo)) {
    scene = 'game'; startLevel(run.level + 1);
  }
  if (run.mode === 'infinite') {
    if (button(g, W / 2 + 16, H - 64, 220, 48, '🔥 FIGHT THE DRAGON', canGo ? 'are you ready?' : 'pick an upgrade first', !canGo)) {
      run.fightDragon = true;
      scene = 'game'; startLevel(run.level + 1);
    }
  }
}
let hoverTip = null;
function shopButton(g, x, y, w, h, name, price, col, desc, buyFn, owned, costOverride) {
  const cost = costOverride !== undefined ? costOverride : parseInt(price);
  const afford = owned || isNaN(cost) || P.gold >= cost;
  const hov = mouse.x > x && mouse.x < x + w && mouse.y > y && mouse.y < y + h;
  g.fillStyle = owned ? '#1d2a1d' : hov && afford ? '#34405c' : '#23283a';
  g.strokeStyle = hov ? col : '#445'; g.lineWidth = 2;
  roundRect(g, x, y, w, h, 8); g.fill(); g.stroke();
  g.fillStyle = col;
  g.beginPath(); g.arc(x + 16, y + h / 2, 8, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.stroke();
  g.fillStyle = afford ? '#fff' : '#777'; g.font = 'bold 11px monospace'; g.textAlign = 'left';
  g.fillText(name, x + 30, y + h / 2 - 4);
  g.fillStyle = owned ? '#6c6' : afford ? '#ffd24d' : '#a55';
  g.fillText(price, x + 30, y + h / 2 + 12);
  if (hov) hoverTip = { text: desc };
  if (hov && mouse.click && afford && !owned) {
    if (!isNaN(cost)) P.gold -= cost;
    buyFn(); SFX.buy();
  }
}
function wrapLeft(g, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    if (g.measureText(line + w).width > maxW) { g.fillText(line, x, yy); line = w + ' '; yy += lh; }
    else line += w + ' ';
  }
  g.fillText(line, x, yy);
}
function drawUpgradeIcon(g, icon, x, y) {
  g.save(); g.translate(x, y);
  g.lineWidth = 2;
  switch (icon) {
    case 'heart':
      g.fillStyle = '#e34';
      g.beginPath(); g.moveTo(0, 10); g.bezierCurveTo(-16, -4, -8, -16, 0, -6); g.bezierCurveTo(8, -16, 16, -4, 0, 10); g.fill();
      break;
    case 'sword':
      g.strokeStyle = '#dde'; g.beginPath(); g.moveTo(-9, 9); g.lineTo(9, -9); g.stroke();
      g.strokeStyle = '#ca4'; g.beginPath(); g.moveTo(-5, -1); g.lineTo(1, 5); g.stroke();
      g.fillStyle = '#dde'; g.beginPath(); g.moveTo(9, -9); g.lineTo(12, -12); g.lineTo(11, -7); g.fill();
      break;
    case 'boot':
      g.fillStyle = '#a76'; g.fillRect(-6, -10, 7, 14); g.fillRect(-6, 2, 14, 6);
      break;
    case 'wing':
      g.fillStyle = '#cdf';
      g.beginPath(); g.moveTo(-10, 6); g.quadraticCurveTo(2, -14, 12, -8); g.quadraticCurveTo(4, -4, 2, 0); g.quadraticCurveTo(-2, 4, -10, 6); g.fill();
      break;
    case 'jar':
      g.strokeStyle = '#9fc'; g.beginPath(); g.arc(0, 2, 9, 0, TAU); g.stroke();
      g.fillStyle = '#27d'; g.beginPath(); g.arc(0, 2, 7, 0.2, Math.PI - 0.2); g.fill();
      break;
    case 'anvil':
      g.fillStyle = '#99a'; g.fillRect(-10, -4, 20, 6); g.fillRect(-4, 2, 8, 6); g.fillRect(-8, 8, 16, 3);
      break;
    case 'coin':
      g.fillStyle = '#fd4'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.fill();
      g.fillStyle = '#b8901f'; g.font = 'bold 12px serif'; g.textAlign = 'center'; g.fillText('g', 0, 4);
      break;
    case 'eye':
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, 0, 11, 6, 0, 0, TAU); g.fill();
      g.fillStyle = '#f33'; g.beginPath(); g.arc(0, 0, 4, 0, TAU); g.fill();
      break;
    case 'cross':
      g.fillStyle = '#5d5'; g.fillRect(-3, -10, 6, 20); g.fillRect(-10, -3, 20, 6);
      break;
    case 'clock':
      g.strokeStyle = '#adf'; g.beginPath(); g.arc(0, 0, 10, 0, TAU); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -6); g.moveTo(0, 0); g.lineTo(5, 2); g.stroke();
      break;
    case 'dash':
      g.strokeStyle = '#9cf';
      for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-10 + i * 4, -6 + i * 6); g.lineTo(2 + i * 4, -6 + i * 6); g.stroke(); }
      g.fillStyle = '#9cf'; g.beginPath(); g.moveTo(6, 0); g.lineTo(13, 0); g.lineTo(9, -5); g.fill();
      break;
    case 'cloud':
      g.fillStyle = '#dde';
      g.beginPath(); g.arc(-6, 2, 6, 0, TAU); g.arc(2, -2, 7, 0, TAU); g.arc(9, 3, 5, 0, TAU); g.fill();
      break;
  }
  g.restore();
}

function drawGameOverWin(win) {
  const g = ctx;
  g.fillStyle = win ? '#101a12' : '#190f0f'; g.fillRect(0, 0, W, H);
  g.fillStyle = win ? '#ffe9a8' : '#e88'; g.font = 'bold 44px serif'; g.textAlign = 'center';
  g.fillText(win ? 'THE DRAGON IS SLAIN!' : 'GAME OVER', W / 2, 180);
  g.fillStyle = '#ccc'; g.font = '16px serif';
  if (win) g.fillText(`The kingdom is saved. You finished with ${P.gold} gold.`, W / 2, 230);
  if (button(g, W / 2 - 110, 300, 220, 48, 'BACK TO TITLE')) { scene = 'title'; }
}

// ---------------- Pause overlay ----------------
function drawPause() {
  const g = ctx;
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff'; g.font = 'bold 32px serif'; g.textAlign = 'center';
  g.fillText('PAUSED', W / 2, 200);
  if (button(g, W / 2 - 100, 240, 200, 44, 'RESUME')) paused = false;
  if (button(g, W / 2 - 100, 296, 200, 44, 'QUIT TO TITLE', 'progress is lost')) { paused = false; scene = 'title'; }
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
let lastT = 0;
function frame(ts) {
  const dt = Math.min(0.033, (ts - lastT) / 1000 || 0.016);
  lastT = ts;
  time += scene === 'game' ? 0 : dt; // time advances in updateGame during play
  if (scene === 'game') {
    if (level.showcase && hit('pause')) { scene = 'pick'; pressed['Escape'] = false; paused = false; }
    else updateGame(dt);
  }
  // RENDER
  ctx.clearRect(0, 0, W, H);
  if (scene === 'game' || scene === 'gameover-none') {
    if (SET.pixel) {
      lowCtx.save();
      lowCtx.setTransform(1 / 3, 0, 0, 1 / 3, 0, 0);
      drawWorld(lowCtx);
      lowCtx.restore();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;
    } else {
      drawWorld(ctx);
    }
    drawBlindness();
    drawHUD();
    if (paused) drawPause();
  }
  else if (scene === 'title') drawTitle();
  else if (scene === 'settings') drawSettings();
  else if (scene === 'pick') drawPick();
  else if (scene === 'camp') drawCamp();
  else if (scene === 'win') drawGameOverWin(true);
  else if (scene === 'gameover') drawGameOverWin(false);
  // consume one-frame input
  for (const k in pressed) pressed[k] = false;
  mouse.click = false;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
