// Headless smoke test: stubs out DOM/canvas and drives the game loop
// to catch runtime errors in game logic. Run with: node smoke_test.js
'use strict';
function makeCtx() {
  const grad = { addColorStop: () => {} };
  return new Proxy({}, {
    get(t, k) {
      if (k === 'canvas') return { width: 960, height: 540 };
      if (k === 'measureText') return () => ({ width: 50 });
      if (k.toString().startsWith('create')) return () => grad;
      if (typeof t[k] !== 'undefined') return t[k];
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
const listeners = {};
global.window = {
  addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
  AudioContext: undefined, webkitAudioContext: undefined,
};
global.document = {
  getElementById: () => ({
    getContext: () => makeCtx(),
    addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 540 }),
    width: 960, height: 540,
  }),
  createElement: () => ({ getContext: () => makeCtx(), width: 320, height: 180 }),
};
global.localStorage = { getItem: () => null, setItem: () => {} };
let frameCb = null;
global.requestAnimationFrame = cb => { frameCb = cb; };
global.setInterval = () => 0;
global.setTimeout = () => 0;

const src = require('fs').readFileSync(__dirname + '/game.js', 'utf8');
// run in this context so our globals apply, and expose internals for testing
const exposed = `;globalThis.__g = () => ({ startRun, startLevel, updateGame, P: () => P, M: () => M, level: () => level, sceneGet: () => scene, sceneSet: s => scene = s, run: () => run, keys, pressed, freezePlayer, spawnMonster, buildLevel, newPlayer, setP: p => P = p, openCamp, hurtPlayer, killPlayer, MONSTER_ORDER, SET });`;
eval(src + exposed);
const G = globalThis.__g();

let ts = 0;
function frames(n, codes) {
  for (let i = 0; i < n; i++) {
    if (codes) for (const c of codes) { G.keys[c] = true; if (i % 7 === 0) G.pressed[c] = true; }
    ts += 16.7;
    frameCb(ts);
    if (codes) for (const c of codes) G.keys[c] = false;
  }
}

// title screen frames
frames(10);
// start a normal run
G.startRun('normal');
console.log('level 1 built, monsters:', G.M().length, 'width:', G.level().width);
// run right + jumping + slashing through the level
frames(300, ['KeyD', 'KeyW', 'KeyZ']);
frames(100, ['KeyD', 'Space', 'KeyX']);
frames(100, ['KeyD', 'KeyW', 'KeyC', 'KeyJ']);
console.log('after movement: x=', Math.round(G.P().x), 'hp=', Math.round(G.P().hp), 'scene=', G.sceneGet());

// force every monster type to spawn near player and brawl
G.sceneSet('game');
for (const t of G.MONSTER_ORDER) G.spawnMonster(t, G.P().x + 100, G.P().y - 60, 5);
frames(400, ['KeyA', 'KeyZ', 'KeyX', 'KeyW']);
console.log('brawl survived, hp=', Math.round(G.P().hp), 'monsters left=', G.M().length, 'dead=', G.P().dead);

// freeze mechanic
if (!G.P().dead) { G.freezePlayer(); frames(150); console.log('freeze/thaw ok'); }

// give player all gear and weapons, test each special
const P = G.P();
P.dead = false; P.hp = P.maxhp = 500; P.gold = 9999;
for (const w of ['hammer', 'axe', 'bow']) { P.owned[w] = true; P.weapon = w; P.specCd = 0; P.st = 100; frames(40, ['KeyC', 'KeyZ']); }
P.hasShield = true; P.dynamite = 5;
frames(60, ['ShiftLeft', 'KeyH']);
console.log('weapons/specials ok');

// kill player -> respawn same level
G.killPlayer();
frames(200);
console.log('death+respawn ok, scene=', G.sceneGet(), 'hp=', Math.round(G.P().hp));

// dragon fight (normal level 26)
G.run().level = 25;
G.startLevel(26);
console.log('dragon level:', G.level().dragon, 'monsters:', G.M().map(m => m.type).join(','));
frames(600, ['KeyD', 'KeyZ', 'KeyW', 'KeyX']);
console.log('dragon fight frames ok, scene=', G.sceneGet());

// camp screen render
G.setP(G.newPlayer());
G.run().level = 3; G.run().mode = 'infinite';
G.openCamp();
frames(30);
console.log('camp ok');

// showcase each monster briefly
for (const t of G.MONSTER_ORDER.concat(['dragon'])) {
  G.setP(G.newPlayer());
  G.run().mode = 'showcase'; G.run().level = 3; G.run().seed = 1;
  G.buildLevel(1, 3, false, t);
  G.sceneSet('game');
  frames(120, ['KeyD', 'KeyZ', 'KeyX']);
}
console.log('showcase all monsters ok');

// smooth (non-pixel) render path
G.SET.pixel = false;
G.sceneSet('game');
G.startLevel(2);
frames(120, ['KeyD', 'KeyW', 'KeyZ']);
console.log('smooth render path ok');

// 10 more levels of progression in infinite mode
for (let lv = 3; lv <= 12; lv++) {
  G.startLevel(lv);
  G.sceneSet('game');
  frames(150, ['KeyD', 'KeyW', 'KeyZ', 'Space']);
}
console.log('multi-level progression ok');
console.log('ALL SMOKE TESTS PASSED');
