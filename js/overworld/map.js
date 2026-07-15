'use strict';
/**
 * Tile maps + the Overworld controller (camera, rendering, encounters,
 * warps, interactions, field HM moves).
 *
 * Maps are authored compactly: a `legend` maps single characters to tile ids,
 * `ground`/`over` are arrays of row strings. See js/maps/*.js.
 */
const Maps = {};
function defineMap(def) {
  // Normalize: pad every row to the widest row so ragged authoring can't crash.
  const norm = (rows) => {
    if (!rows) return rows;
    let w = 0;
    for (const r of rows) w = Math.max(w, r.length);
    return rows.map((r) => r.length < w ? r + ' '.repeat(w - r.length) : r.slice(0, w));
  };
  def.ground = norm(def.ground);
  if (def.over) def.over = norm(def.over);
  Maps[def.id] = def;
  return def;
}

class Tilemap {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.music = def.music || 'town';
    this.battleEnv = def.battleEnv || 'grass';
    this.legend = def.legend;
    this.ground = def.ground;
    this.over = def.over || null;
    this.h = def.ground.length;
    this.w = def.ground[0].length;
    this.warps = def.warps || [];
    this.signs = def.signs || [];
    this.items = def.items || [];        // {x,y,item,flag}
    this.encounters = def.encounters || null;
    this.npcs = (def.npcs || []).map((n) => new NPC(n));
    this.onEnter = def.onEnter || null;
    this.indoor = def.indoor || false;
  }

  tileId(layer, x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const rows = layer === 'over' ? this.over : this.ground;
    if (!rows || !rows[y]) return null;
    const ch = rows[y][x];
    return this.legend[ch] !== undefined ? this.legend[ch] : null;
  }

  tileDef(x, y) {
    const id = this.tileId('ground', x, y);
    return id ? Tiles.def(id) : null;
  }

  solidAt(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    const d = this.tileDef(x, y);
    if (d && d.solid && !d.water) return true;
    // over-layer solids (e.g. tree tops with trunks)
    const od = this.tileId('over', x, y);
    if (od && Tiles.def(od) && Tiles.def(od).solid) return true;
    // NPCs block
    for (const npc of this.npcs) {
      if (npc.tx === x && npc.ty === y && !npc.passable) return true;
    }
    if (Overworld.followerBlocks(x, y)) return true;
    return false;
  }

  warpAt(x, y) { return this.warps.find((w) => w.x === x && w.y === y); }
  signAt(x, y) { return this.signs.find((s) => s.x === x && s.y === y); }
  itemAt(x, y) { return this.items.find((it) => it.x === x && it.y === y && !Game.flags[it.flag]); }
  npcAt(x, y) { return this.npcs.find((n) => n.tx === x && n.ty === y); }
}

const Overworld = {
  map: null,
  player: null,
  camX: 0, camY: 0,
  transition: null,       // {phase, ...} during warps
  stepFx: 0,

  boot() {
    Overworld.player = new Player(Game.px, Game.py, Game.pdir);
    Overworld.loadMap(Game.mapId, false);
  },

  loadMap(id, playMusic = true) {
    const def = Maps[id];
    if (!def) { console.error('no map ' + id); return; }
    Overworld.map = new Tilemap(def);
    Overworld.centerCamera();
    if (playMusic) Music.play(Overworld.currentMusic());
    if (Overworld.map.onEnter) Overworld.map.onEnter();
  },

  currentMusic() { return Overworld.map ? Overworld.map.music : 'town'; },
  battleEnv() { return Overworld.map ? Overworld.map.battleEnv : 'grass'; },

  centerCamera() {
    const p = Overworld.player;
    Overworld.camX = p.px - Screen.W / 2 + 8;
    Overworld.camY = p.py - Screen.H / 2 + 8;
    Overworld.clampCamera();
  },
  clampCamera() {
    const m = Overworld.map;
    if (m.w * 16 <= Screen.W) Overworld.camX = (m.w * 16 - Screen.W) / 2;
    else Overworld.camX = Util.clamp(Overworld.camX, 0, m.w * 16 - Screen.W);
    if (m.h * 16 <= Screen.H) Overworld.camY = (m.h * 16 - Screen.H) / 2;
    else Overworld.camY = Util.clamp(Overworld.camY, 0, m.h * 16 - Screen.H);
  },

  warpTo(mapId, tx, ty, dir) {
    Overworld.player.tx = tx; Overworld.player.ty = ty;
    Overworld.player.px = tx * 16; Overworld.player.py = ty * 16;
    Overworld.player.dir = dir || Overworld.player.dir;
    Overworld.player.moving = false;
    Overworld.loadMap(mapId);
    Game.mapId = mapId;
  },

  followerBlocks() { return false; },

  update() {
    if (Overworld.transition) { Overworld.updateTransition(); return; }
    if (Scripts.running) { Scripts.update(); return; }
    // Start menu
    if (Input.pressed.start) { AudioSys.sfx('confirm'); StartMenu.open(); return; }
    for (const npc of Overworld.map.npcs) npc.update();
    Overworld.player.update();
    Overworld.centerCamera();
  },

  /** Called by Player when it completes a step onto (x,y). */
  onStep(x, y) {
    const m = Overworld.map;
    // item ball
    const it = m.itemAt(x, y);
    // warp (auto on doors/stairs/ledges handled in tryMove); grass encounter:
    const d = m.tileDef(x, y);
    if (d && d.grass) {
      Overworld.stepFx = 6;
      if (Game.repelSteps > 0) Game.repelSteps--;
      Overworld.tryEncounter();
    }
    if (Game.flags.pendingWarp) {
      const w = Game.flags.pendingWarp; Game.flags.pendingWarp = null;
      AudioSys.sfx('door');
      // Entering a building: remember where to come back out (handles shared interiors).
      if (w.to !== '@back' && Maps[w.to] && Maps[w.to].indoor && !Overworld.map.indoor) {
        Game.flags.returnWarp = { mapId: Overworld.map.id, x: Overworld.player.tx, y: Overworld.player.ty, dir: 'down' };
      }
      Overworld.beginTransition(() => {
        if (w.to === '@back') {
          const r = Game.flags.returnWarp || { mapId: 'frosthollow', x: 9, y: 16, dir: 'down' };
          Overworld.warpTo(r.mapId, r.x, r.y, r.dir);
        } else Overworld.warpTo(w.to, w.tx, w.ty, w.dir || 'down');
      });
    }
  },

  tryEncounter() {
    const enc = Overworld.map.encounters;
    if (!enc || !enc.grass || Game.repelSteps > 0) return;
    if (!Util.chance(enc.rate || 12)) return;
    const pick = Overworld.rollEncounter(enc.grass);
    if (!pick) return;
    const level = Util.randRange(pick.min, pick.max);
    Music.play('battle_wild');
    Overworld.beginBattleFlash(() => Game.startWildBattle(pick.key, level, Overworld.battleEnv()));
  },

  rollEncounter(list) {
    let total = 0;
    for (const e of list) total += e.weight || 1;
    let r = Math.random() * total;
    for (const e of list) { r -= (e.weight || 1); if (r <= 0) return e; }
    return list[0];
  },

  // interaction (A button) — handled by Player facing a tile
  interact() {
    const p = Overworld.player;
    const [dx, dy] = DIRV[p.dir];
    const x = p.tx + dx, y = p.ty + dy;
    const m = Overworld.map;
    const npc = m.npcAt(x, y);
    if (npc) { npc.face(OPP[p.dir]); if (npc.script) Scripts.run(npc.script, npc); return true; }
    // item ball on the faced tile OR under the player
    let it = m.itemAt(x, y) || m.itemAt(p.tx, p.ty);
    if (it) { Overworld.pickupItem(it); return true; }
    const sign = m.signAt(x, y);
    if (sign) { Textbox.say(sign.text); return true; }
    // field tile actions
    const d = m.tileDef(x, y);
    if (d && d.water && Game.flags.hm_surf && !p.surfing) { Overworld.promptSurf(x, y); return true; }
    if (d && d.cut && Game.flags.hm_cut) { Overworld.useCut(x, y); return true; }
    if (d && d.boulder && Game.flags.hm_strength) { Overworld.useStrength(x, y, p.dir); return true; }
    if (d && d.smash && Game.flags.hm_smash) { Overworld.useRockSmash(x, y); return true; }
    return false;
  },

  pickupItem(it) {
    Game.give(it.item, it.count || 1);
    Game.flags[it.flag] = true;
    AudioSys.sfx('jingle_item');
    const name = Items[it.item].name;
    Textbox.say(Game.playerName + ' found ' + (it.count > 1 ? it.count + ' ' : 'a ') + name + '!');
  },

  promptSurf(x, y) {
    const mon = Game.party.find((m) => m.knows('surf'));
    Textbox.ask('The water is deep and blue. Surf on it?', ['Yes', 'No'], (pick) => {
      if (pick === 0) { Overworld.player.startSurf(x, y); }
    });
  },
  useCut(x, y) {
    Textbox.say('You cut down the bush with a swipe!', () => {
      Overworld.map.def.ground[y] = replaceChar(Overworld.map.ground[y], x, findChar(Overworld.map, 'grass'));
      Overworld.map.ground = Overworld.map.def.ground;
    });
  },
  useStrength(x, y, dir) {
    Textbox.say('The boulder can be pushed with STRENGTH!');
  },
  useRockSmash(x, y) {
    Textbox.say('You smashed the cracked rock!', () => {
      Overworld.map.def.ground[y] = replaceChar(Overworld.map.ground[y], x, findChar(Overworld.map, 'grass'));
      if (Util.chance(40)) {
        const enc = Overworld.map.encounters;
        if (enc && enc.smash) {
          const pick = Overworld.rollEncounter(enc.smash);
          Overworld.beginBattleFlash(() => Game.startWildBattle(pick.key, Util.randRange(pick.min, pick.max)));
        }
      }
    });
  },

  // -- transitions --
  beginTransition(mid) {
    Overworld.transition = { phase: 'out', t: 0, mid };
    Screen.fadeOut(0.1);
  },
  updateTransition() {
    const tr = Overworld.transition;
    tr.t++;
    if (tr.phase === 'out' && !Screen.fading) {
      tr.mid(); tr.phase = 'in'; Screen.fadeIn(0.1);
    } else if (tr.phase === 'in' && !Screen.fading) {
      Overworld.transition = null;
    }
  },
  beginBattleFlash(mid) {
    Screen.doFlash('#fff', 1);
    Overworld.transition = { phase: 'battle', t: 0, mid };
  },

  // -- draw --
  draw(ctx) {
    if (Overworld.transition && Overworld.transition.phase === 'battle') {
      const tr = Overworld.transition;
      Overworld.drawWorld(ctx);
      // radial-ish wipe
      ctx.fillStyle = '#000';
      const rows = Math.floor(tr.t / 2);
      for (let i = 0; i < rows; i++) ctx.fillRect(0, i * 8, 240, 4);
      if (tr.t > 22) { Overworld.transition = null; tr.mid(); }
      return;
    }
    Overworld.drawWorld(ctx);
  },

  drawWorld(ctx) {
    const m = Overworld.map;
    if (!m) { Screen.clear('#000'); return; }
    Screen.clear(m.indoor ? '#2a2438' : '#79c46e');
    const cx = Math.round(Overworld.camX), cy = Math.round(Overworld.camY);
    const x0 = Math.floor(cx / 16), y0 = Math.floor(cy / 16);
    const phase = Game.frame >> 4;
    // ground layer
    for (let y = y0 - 1; y <= y0 + 11; y++) {
      for (let x = x0 - 1; x <= x0 + 16; x++) {
        const id = m.tileId('ground', x, y);
        if (id) ctx.drawImage(Tiles.canvas(id, phase), x * 16 - cx, y * 16 - cy);
      }
    }
    // item balls
    for (const it of m.items) {
      if (Game.flags[it.flag]) continue;
      Overworld.drawItemBall(ctx, it.x * 16 - cx, it.y * 16 - cy);
    }
    // sprites sorted by y (player + npcs)
    const sprites = [Overworld.player, ...m.npcs];
    sprites.sort((a, b) => (a.py) - (b.py));
    for (const sp of sprites) sp.draw(ctx, cx, cy);
    // over layer (tree tops, roofs above player)
    if (m.over) {
      for (let y = y0 - 1; y <= y0 + 11; y++) {
        for (let x = x0 - 1; x <= x0 + 16; x++) {
          const id = m.tileId('over', x, y);
          if (id) ctx.drawImage(Tiles.canvas(id, phase), x * 16 - cx, y * 16 - cy);
        }
      }
    }
    // location banner on entry
    Overworld.drawBanner(ctx);
    if (m.indoor) Overworld.drawVignette(ctx);
  },

  drawItemBall(ctx, x, y) {
    ctx.fillStyle = '#e04838'; ctx.fillRect(x + 5, y + 6, 6, 3);
    ctx.fillStyle = '#f0f0f0'; ctx.fillRect(x + 5, y + 9, 6, 3);
    ctx.fillStyle = '#303038'; ctx.fillRect(x + 5, y + 8, 6, 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, y + 7, 1, 1);
  },

  bannerTimer: 0,
  showBanner() { Overworld.bannerTimer = 110; },
  drawBanner(ctx) {
    if (Overworld.bannerTimer <= 0) return;
    Overworld.bannerTimer--;
    const t = Overworld.bannerTimer;
    const slide = t > 90 ? (110 - t) / 20 : t < 20 ? t / 20 : 1;
    const w = 100, x = 6, y = Util.lerp(-14, 6, slide);
    UIKit.miniPanel(ctx, x, y, w, 16);
    Font.draw(ctx, Overworld.map.name, x + 8, y + 4, { color: '#383838', shadow: '#d8d8c8' });
  },

  drawVignette(ctx) {
    // subtle dark edges for indoor coziness
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, 240, 6); ctx.fillRect(0, 154, 240, 6);
  },
};

// direction vectors + opposites
const DIRV = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
const OPP = { down: 'up', up: 'down', left: 'right', right: 'left' };

function replaceChar(str, i, ch) { return str.slice(0, i) + ch + str.slice(i + 1); }
function findChar(map, tileId) {
  for (const ch in map.legend) if (map.legend[ch] === tileId) return ch;
  return ' ';
}
