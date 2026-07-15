'use strict';
/**
 * Species registry ("the Dex").
 *
 * Dex.add({
 *   id: 1, key:'trollsprout', name:'Trollsprout', types:['Grass'],
 *   base:{hp,atk,def,spa,spd,spe}, ability:'verdant_surge',
 *   catchRate: 45, expYield: 62, growth:'medslow', gender: 87.5,  // % male, -1 = unknown
 *   evolve:{to:'bryteknott', level:16} | {to:'x', stone:'ember_stone'} | null,
 *   learn:[[1,'tackle'],...], tms:['tm01',...],
 *   dex:{species:'Seedling Troll', h:'0.5m', w:'6.2kg', entry:'...'},
 *   cry:{base:520, sweep:0.6, wave:'square', dur:0.45, vib:14},
 *   draw(s){...}, drawBack(s){...},   // s = 64x64 PixelSurface
 * })
 */
const Dex = {
  byKey: {},
  byId: {},
  order: [],
  _spriteCache: {},

  add(def) {
    if (Dex.byKey[def.key]) throw new Error('duplicate species ' + def.key);
    Dex.byKey[def.key] = def;
    Dex.byId[def.id] = def;
    Dex.order.push(def.key);
    return def;
  },

  count() { return Dex.order.length; },

  /** Render (and cache) a species sprite. side: 'front' | 'back' */
  sprite(key, side) {
    const ck = key + ':' + side;
    if (Dex._spriteCache[ck]) return Dex._spriteCache[ck];
    const def = Dex.byKey[key];
    const s = new PixelSurface(64, 64);
    if (side === 'front') def.draw(s);
    else def.drawBack(s);
    s.outline(def.outlineColor || '#26202b');
    s.innerEdge(0.12);
    const cv = s.toCanvas();
    Dex._spriteCache[ck] = cv;
    return cv;
  },

  /** Tiny 16x16 party icon: the front sprite scaled down. */
  icon(key) {
    const ck = key + ':icon';
    if (Dex._spriteCache[ck]) return Dex._spriteCache[ck];
    const front = Dex.sprite(key, 'front');
    const cv = document.createElement('canvas');
    cv.width = 20; cv.height = 20;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(front, 0, 0, 64, 64, -1, -1, 22, 22);
    Dex._spriteCache[ck] = cv;
    return cv;
  },
};

/**
 * Shared sprite-drawing helpers used by species draw() functions.
 * Keeps eyes/mouths/claws consistent across the dex (like one spriter drew them).
 */
const SpriteKit = {
  /** Gen-3 style eye: dark rim, colored iris, white shine at upper-left. */
  eye(s, x, y, r, iris = '#742', rim = '#1a1418') {
    s.fillCircle(x, y, r + 1, rim);
    s.fillCircle(x, y, r, iris);
    s.set(x - Math.max(1, r - 1), y - Math.max(1, r - 1), '#ffffff');
    if (r >= 2) s.set(x - r + 1, y - r + 2, '#ffffff');
  },
  /** Small angry brow above an eye. */
  brow(s, x, y, w, c = '#1a1418') { s.line(x - w, y, x + w, y - 1, c); },
  /** Simple smiling mouth. */
  smile(s, x, y, w, c = '#1a1418') {
    s.line(x - w, y, x, y + 1, c); s.line(x, y + 1, x + w, y, c);
  },
  /** Open beak/fang mouth. */
  fang(s, x, y, c = '#ffffff') { s.tri(x, y, x + 2, y, x + 1, y + 2, c); },
  /** Claw tips on a paw. */
  claws(s, x, y, n, c = '#e8e4da') {
    for (let i = 0; i < n; i++) s.set(x + i * 2, y, c);
  },
  /** Blush/cheek spot. */
  cheek(s, x, y, c) { s.set(x, y, c); s.set(x + 1, y, c); },
  /** A leaf shape pointing up-right. */
  leaf(s, x, y, len, ramp) {
    for (let i = 0; i < len; i++) {
      const w = Math.max(0, Math.round(Math.sin((i / len) * Math.PI) * (len * 0.4)));
      for (let j = -w; j <= w; j++) s.set(x + i, y - i + j, j < 0 ? ramp.l : ramp.b);
    }
  },
  /** Spike fin / horn as triangle with shading. */
  horn(s, x, y, dx, dy, len, halfW, ramp) {
    const tip = [x + dx * len, y + dy * len];
    const px = -dy, py = dx;
    s.fillPoly([[x + px * halfW, y + py * halfW], [x - px * halfW, y - py * halfW], tip], ramp.b);
    s.line(x + px * halfW, y + py * halfW, tip[0], tip[1], ramp.l);
  },
};

/** EXP required to reach a level, by growth group. */
const Growth = {
  fast: (n) => Math.floor(0.8 * n * n * n),
  medfast: (n) => n * n * n,
  medslow: (n) => Math.max(0, Math.floor(1.2 * n * n * n - 15 * n * n + 100 * n - 140)),
  slow: (n) => Math.floor(1.25 * n * n * n),
};
function expForLevel(growth, level) { return (Growth[growth] || Growth.medfast)(level); }
