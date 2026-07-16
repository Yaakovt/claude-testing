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
      if (npc.tx === x && npc.ty === y && !npc.passable && !npc.hidden()) return true;
    }
    if (Overworld.followerBlocks(x, y)) return true;
    return false;
  }

  warpAt(x, y) { return this.warps.find((w) => w.x === x && w.y === y); }
  signAt(x, y) { return this.signs.find((s) => s.x === x && s.y === y); }
  itemAt(x, y) { return this.items.find((it) => it.x === x && it.y === y && !Game.flags[it.flag]); }
  npcAt(x, y) { return this.npcs.find((n) => n.tx === x && n.ty === y && !n.hidden()); }
}

const Overworld = {
  map: null,
  player: null,
  camX: 0, camY: 0,
  transition: null,       // {phase, ...} during warps
  doorAnim: null,         // {x, y, t, go} while a door swings open
  stepFx: 0,

  boot() {
    Overworld.player = new Player(Game.px, Game.py, Game.pdir);
    Overworld.loadMap(Game.mapId, false);
  },

  loadMap(id, playMusic = true) {
    const def = Maps[id];
    if (!def) { console.error('no map ' + id); return; }
    Overworld.doorAnim = null;
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
    // No cycling indoors — auto-dismount when entering a building/cave.
    if (Overworld.map && Overworld.map.indoor) Overworld.player.biking = false;
    Game.mapId = mapId;
  },

  followerBlocks() { return false; },

  /** Toggle the Bike (used from the Bag). Faster overland movement. */
  toggleBike() {
    const p = Overworld.player;
    if (!p) { Textbox.say('You can\'t ride right now.'); return; }
    if (Overworld.map && Overworld.map.indoor) { Textbox.say('No cycling indoors!'); return; }
    if (p.surfing) { Textbox.say('You can\'t cycle on the water!'); return; }
    p.biking = !p.biking;
    AudioSys.sfx('confirm');
    Game.setState('overworld');
    Textbox.say(p.biking ? 'You hopped on the BIKE! Zoom!' : 'You got off the BIKE.');
  },

  /** Aurora Compass: hint the player toward the next available legendary. */
  auroraHint() {
    let msg;
    if (!Game.flags.beat_ionar_boss && !Game.flags.caughtAuroryx) {
      msg = 'The needle strains NORTH — to the SKY SPIRE above Stormcrest. A great heart wakes there.';
    } else if (Game.flags.champion && !(Game.flags.caughtUmbryx || Game.flags.beat_umbryx)) {
      msg = 'On moonless nights the needle quivers toward the Sky Spire ALTAR. Something nocturnal stirs...';
    } else if (Game.hasItem('ferry_pass') && !(Game.flags.caughtVesperyx || Game.flags.beatVesperyx)) {
      msg = 'The needle drifts far SOUTH, out past the harbor — toward the DUSK ISLES.';
    } else if (Game.flags.champion && !(Game.flags.caughtMagnadrake || Game.flags.beatMagnadrake)) {
      msg = 'The needle sinks straight DOWN — toward the AURORA DEPTHS beneath the Sky Spire.';
    } else {
      msg = 'The needle spins freely. For now, the great hearts are at peace.';
    }
    AudioSys.sfx('confirm');
    Game.setState('overworld');
    Textbox.say(msg);
  },

  update() {
    if (Overworld.transition) { Overworld.updateTransition(); return; }
    if (Overworld.doorAnim && !Overworld.doorAnim.hold) {
      const da = Overworld.doorAnim;
      // after swinging open, hold the overlay through the fade-out so the
      // player stays "inside" the doorway; loadMap clears it
      if (++da.t >= 14) { da.hold = true; da.go(); }
      return;
    }
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
    // Wild encounters fire on grass/tall-snow, and — for indoor caves that carry
    // an encounter table — on any open cave floor (no grass tiles underground).
    const caveWild = m.indoor && m.encounters && m.encounters.grass && d && !d.solid && !d.water;
    if (d && (d.grass || caveWild)) {
      if (d.grass) { Overworld.stepFx = 14; Overworld.stepFxX = x; Overworld.stepFxY = y; }
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
      const go = () => Overworld.beginTransition(() => {
        if (w.to === '@back') {
          const r = Game.flags.returnWarp || { mapId: 'frosthollow', x: 9, y: 16, dir: 'down' };
          Overworld.warpTo(r.mapId, r.x, r.y, r.dir);
        } else Overworld.warpTo(w.to, w.tx, w.ty, w.dir || 'down');
      });
      // Doors swing open first; the overlay hides the player "stepping inside".
      if (d && d.door) Overworld.doorAnim = { x, y, t: 0, go };
      else go();
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
    if (sign) { if (sign.script) Scripts.run(sign.script); else Textbox.say(sign.text); return true; }
    // field tile actions
    const d = m.tileDef(x, y);
    if (d && d.water && !p.surfing && Overworld.bestRod()) { Overworld.fish(x, y); return true; }
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

  bestRod() {
    if (Game.hasItem('super_rod')) return 'super';
    if (Game.hasItem('good_rod')) return 'good';
    if (Game.hasItem('old_rod')) return 'old';
    return null;
  },

  fish(x, y) {
    const rod = Overworld.bestRod();
    if (!rod) return;
    const name = { old: 'Old Rod', good: 'Good Rod', super: 'Super Rod' }[rod];
    const hook = { old: 45, good: 65, super: 85 }[rod];
    const boost = { old: 0, good: 2, super: 5 }[rod];
    const p = Overworld.player;
    p.fishing = { x, y, rod };            // draw the rod + line toward the water tile
    const stop = () => { p.fishing = null; };
    AudioSys.sfx('confirm');
    Textbox.say('You cast the ' + name + ' into the water...', () => {
      if (!Util.chance(hook)) { Textbox.say('...Not even a nibble.', stop); return; }
      const table = fishTable(Overworld.map.id);
      const pick = Overworld.rollEncounter(table);
      if (!pick) { Textbox.say('...Not even a nibble.', stop); return; }
      Textbox.say('Oh! A bite!', () => {
        stop();
        Music.play('battle_wild');
        Overworld.beginBattleFlash(() => Game.startWildBattle(pick.key, Util.randRange(pick.min + boost, pick.max + boost), 'water'));
      });
    });
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
    // ground layer (variant picked per position so open areas don't lattice)
    for (let y = y0 - 1; y <= y0 + 11; y++) {
      for (let x = x0 - 1; x <= x0 + 16; x++) {
        const id = m.tileId('ground', x, y);
        if (id) ctx.drawImage(Tiles.canvas(id, phase, (x * 7 + y * 13) & 0xffff), x * 16 - cx, y * 16 - cy);
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
    // grass rustle: leaf specks kicked out of the tile just stepped into
    if (Overworld.stepFx > 0) {
      Overworld.stepFx--;
      const t = 1 - Overworld.stepFx / 14;
      const gx = Overworld.stepFxX * 16 - cx, gy = Overworld.stepFxY * 16 - cy;
      const spread = Math.round(2 + t * 5), rise = Math.round(t * 4);
      ctx.globalAlpha = 1 - t * 0.8;
      ctx.fillStyle = t < 0.5 ? '#4e8a44' : '#7cb860';
      ctx.fillRect(gx + 7 - spread, gy + 12 - rise, 2, 2);
      ctx.fillRect(gx + 7 + spread, gy + 12 - rise, 2, 2);
      ctx.fillStyle = '#9ccc80';
      ctx.fillRect(gx + 7 - spread + 1, gy + 15 - (rise >> 1), 2, 1);
      ctx.fillRect(gx + 7 + spread - 1, gy + 15 - (rise >> 1), 2, 1);
      ctx.globalAlpha = 1;
    }
    // door swings open over the player as they step inside
    if (Overworld.doorAnim) {
      const da = Overworld.doorAnim;
      const id = da.t < 7 ? 'door_ajar' : 'door_open';
      ctx.drawImage(Tiles.canvas(id, 0), da.x * 16 - cx, da.y * 16 - cy);
    }
    // over layer (tree tops, roofs above player)
    if (m.over) {
      for (let y = y0 - 1; y <= y0 + 11; y++) {
        for (let x = x0 - 1; x <= x0 + 16; x++) {
          const id = m.tileId('over', x, y);
          if (id) ctx.drawImage(Tiles.canvas(id, phase, (x * 7 + y * 13) & 0xffff), x * 16 - cx, y * 16 - cy);
        }
      }
    }
    // location banner on entry
    Overworld.drawBanner(ctx);
    if (m.indoor) Overworld.drawVignette(ctx);
  },

  itemBallSprite: null,
  drawItemBall(ctx, x, y) {
    // proper grounded Poké Ball: shadow, domed red top, white base, band,
    // button and a catchlight — rendered once and cached
    if (!Overworld.itemBallSprite) {
      const s = new PixelSurface(16, 16);
      s.fillEllipse(8, 13, 5, 2, '#00000028');            // ground shadow
      s.fillCircle(8, 9, 4.5, '#2a2028');                 // rim
      s.fillEllipse(8, 7.5, 3.8, 3, '#e04838');           // red dome
      s.fillEllipse(7, 6.5, 1.8, 1.2, '#f88878');         // dome light
      s.fillEllipse(8, 11, 3.8, 2.2, '#e8e8e0');          // white base
      s.rect(4, 9, 9, 1, '#2a2028');                      // band
      s.fillCircle(8, 9, 1.3, '#f0f0e8');                 // button
      s.set(8, 9, '#a8a8a0');
      s.set(6, 5, '#ffffff');                             // catchlight
      Overworld.itemBallSprite = s.toCanvas();
    }
    ctx.drawImage(Overworld.itemBallSprite, x, y);
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
