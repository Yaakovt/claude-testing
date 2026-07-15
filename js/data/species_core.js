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

  /** Render (and cache) a species sprite. side: 'front' | 'back'; mega=true for the mega form. */
  sprite(key, side, mega) {
    if (mega && typeof Megas !== 'undefined' && Megas[key]) return Dex.megaSprite(key, side);
    // External PNG override (if delivered) wins.
    if (typeof Assets !== 'undefined') {
      const ov = Assets.get('pokemon/' + side + '/' + key);
      if (ov) return ov;
    }
    const ck = key + ':' + side;
    if (Dex._spriteCache[ck]) return Dex._spriteCache[ck];
    const def = Dex.byKey[key];
    const s = new PixelSurface(64, 64);
    if (side === 'front') def.draw(s);
    else def.drawBack(s);
    s.weld(3);                              // reattach floating parts
    if (def.outlineColor) s.outline(def.outlineColor);
    else s.outlineSel();                    // hue-keyed selective outline
    s.innerEdge(0.10);
    const cv = s.toCanvas();
    Dex._spriteCache[ck] = cv;
    return cv;
  },

  /** Energized "mega" variant: base silhouette, brighter palette, aura + sparks. */
  megaSprite(key, side) {
    const ck = key + ':' + side + ':mega';
    if (Dex._spriteCache[ck]) return Dex._spriteCache[ck];
    if (typeof Assets !== 'undefined') {
      const ov = Assets.get('pokemon/' + side + '/' + key + '_mega');
      if (ov) { Dex._spriteCache[ck] = ov; return ov; }
    }
    const def = Dex.byKey[key];
    const aura = (Megas[key] && Megas[key].color) || '#a8f0d8';
    const s = new PixelSurface(64, 64);
    if (side === 'front') def.draw(s); else def.drawBack(s);
    s.weld(3);
    // brighten & saturate the whole silhouette
    for (let i = 0; i < s.data.length; i++) {
      if (s.data[i]) s.data[i] = Px.shift(s.data[i], 0, 0.10, 0.06);
    }
    // energy aura: colored outline ring
    s.outline(aura);
    s.outline('#1c1620');
    s.innerEdge(0.12);
    // orbiting energy sparks
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      const x = 32 + Math.cos(ang) * 27, y = 34 + Math.sin(ang) * 27;
      s.set(x, y, aura); s.set(x + 1, y, '#ffffff');
    }
    const cv = s.toCanvas();
    Dex._spriteCache[ck] = cv;
    return cv;
  },

  /** One trigger option -> short phrase, e.g. "Lv 16", "Aurora Stone", "Friendship". */
  evoHow(opt) {
    if (opt.level) return 'Lv ' + opt.level;
    if (opt.stone) return (typeof Items !== 'undefined' && Items[opt.stone] ? Items[opt.stone].name : opt.stone);
    if (opt.friendship) return 'Friendship';
    return '???';
  },

  /** Human-readable evolution line for the Pokedex. */
  evoText(key) {
    const d = Dex.byKey[key];
    if (!d) return '';
    // Forward evolution(s) — compact arrow form so split evos fit two lines
    if (d.evolve) {
      const opts = Array.isArray(d.evolve) ? d.evolve : [d.evolve];
      const parts = opts.map((o) => (Dex.byKey[o.to] ? Dex.byKey[o.to].name : o.to) + ' (' + Dex.evoHow(o) + ')');
      return '→ ' + parts.join('  or  ');
    }
    // Otherwise note the pre-evolution, if any
    const pre = Dex.preEvo(key);
    if (pre) return 'Evolved form of ' + Dex.byKey[pre].name + '.';
    return 'Does not evolve.';
  },

  /** Find the species that evolves into `key`, if any. */
  preEvo(key) {
    if (Dex._preCache === undefined) {
      Dex._preCache = {};
      for (const k of Dex.order) {
        const d = Dex.byKey[k];
        if (!d.evolve) continue;
        const opts = Array.isArray(d.evolve) ? d.evolve : [d.evolve];
        for (const o of opts) Dex._preCache[o.to] = k;
      }
    }
    return Dex._preCache[key] || null;
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
  /**
   * Full Gen-3 eye: white sclera, colored iris with dark pupil, double
   * catchlight, dark rim, and an optional lid line for expression.
   * (x,y) is the eye center; w/h the sclera radii.
   * opts: { lid: -1 fierce / 0 none / 1 sleepy, look: [dx,dy] pupil offset }
   */
  eyeBig(s, x, y, w, h, iris = '#3d7fd4', opts = {}) {
    const rim = '#1a1418';
    s.fillEllipse(x, y, w + 1, h + 1, rim);
    s.fillEllipse(x, y, w, h, '#f8f8f8');
    const lx = (opts.look ? opts.look[0] : 0), ly = (opts.look ? opts.look[1] : 0);
    // iris fills the lower 2/3, pupil at its heart
    s.fillEllipse(x + lx, y + 1 + ly, Math.max(1, w - 1), Math.max(1, h - 1), iris);
    s.fillEllipse(x + lx, y + 1 + ly, Math.max(1, w - 2), Math.max(1, h - 2), Px.shift(iris, 0, 0.05, -0.10));
    s.rect(x + lx - 1, y + ly, 2, 2, rim);                       // pupil
    s.set(x + lx - Math.max(1, w - 2), y + ly - Math.max(1, h - 2), '#ffffff');   // big catchlight
    s.set(x + lx + 1, y + ly + Math.max(0, h - 2), '#ffffff');                     // small low glint
    if (opts.lid === -1) {          // fierce: angled upper lid
      s.line(x - w, y - h + 1, x + w, y - h - 1, rim);
      s.line(x - w, y - h + 2, x + w, y - h, iris === '#f8f8f8' ? rim : Px.shift(iris, 0, 0, -0.2));
    } else if (opts.lid === 1) {    // sleepy: flat upper lid
      s.line(x - w, y - h + 2, x + w, y - h + 2, rim);
    }
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
