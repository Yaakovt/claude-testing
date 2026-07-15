'use strict';
/**
 * Legends of Norvenna — entry point, global game state, and the main loop.
 *
 * `Game` holds all persistent state (party, box, bag, money, dex, badges,
 * flags, position) and the helpers the rest of the engine calls. The loop
 * dispatches update/draw to whichever top-level state is active.
 */
const Game = {
  frame: 0,
  state: 'boot',        // boot | title | intro | overworld | battle | pokedex | menu | party | bag
  prevState: 'overworld',

  // --- player / save data ---
  playerName: 'Aksel',
  gender: 'M',           // 'M' | 'F'
  money: 3000,
  bp: 0,                 // Battle Points (Battle Tower currency)
  party: [],             // Mon[]
  box: [],               // serialized Mon[]
  bag: {},               // { itemId: count }
  dexSeen: {},           // key -> true
  dexCaught: {},         // key -> true
  badges: [false, false, false, false, false, false, false, false],
  flags: {},             // story flags
  repelSteps: 0,
  playtime: 0,           // frames
  seenIntro: false,

  // --- position (managed by Overworld, mirrored here for save) ---
  mapId: 'frosthollow',
  px: 8, py: 6, pdir: 'down',

  init() {
    Screen.init();
    Input.init();
    Assets.boot();
    AudioSys.init();
    registerMusic();
    Game.give('fieldorb', 5);
    Game.give('potion', 3);
    Game.give('town_map', 1);
    Title.open();
    Game.state = 'title';
    requestAnimationFrame(Game.loop);
  },

  loop() {
    Game.frame++;
    Input.update();
    Game.update();
    Game.draw();
    Screen.post();
    requestAnimationFrame(Game.loop);
  },

  update() {
    // Global-overlay states first
    if (Textbox.active) { Textbox.update(); return; }
    switch (Game.state) {
      case 'title': Title.update(); break;
      case 'intro': Intro.update(); break;
      case 'naming': Naming.update(); break;
      case 'overworld': Overworld.update(); break;
      case 'battle': BattleUI.update(); break;
      case 'startmenu': StartMenu.update(); break;
      case 'party': PartyUI.update(); break;
      case 'bag': BagUI.update(); break;
      case 'pokedex': PokedexUI.update(); break;
      case 'summary': SummaryUI.update(); break;
      case 'mart': Mart.update(); break;
      case 'mart_qty': MartQty.update(); break;
      case 'evolve': EvolveScene.update(); break;
      case 'trainercard': TrainerCard.update(); break;
      case 'moveforget': MoveForget.update(); break;
      case 'relearn': MoveRelearn.update(); break;
    }
    if (Game.state !== 'title' && Game.state !== 'intro' && Game.state !== 'naming') Game.playtime++;
  },

  draw() {
    const ctx = Screen.ctx;
    switch (Game.state) {
      case 'title': Title.draw(ctx); break;
      case 'intro': Intro.draw(ctx); break;
      case 'naming': Naming.draw(ctx); break;
      case 'overworld': Overworld.draw(ctx); break;
      case 'battle': BattleUI.draw(ctx); break;
      case 'startmenu': Overworld.draw(ctx); StartMenu.draw(ctx); break;
      case 'party': PartyUI.draw(ctx); break;
      case 'bag': BagUI.draw(ctx); break;
      case 'pokedex': PokedexUI.draw(ctx); break;
      case 'summary': SummaryUI.draw(ctx); break;
      case 'mart': Mart.draw(ctx); break;
      case 'mart_qty': MartQty.draw(ctx); break;
      case 'evolve': EvolveScene.draw(ctx); break;
      case 'trainercard': TrainerCard.draw(ctx); break;
      case 'moveforget': MoveForget.draw(ctx); break;
      case 'relearn': MoveRelearn.draw(ctx); break;
      default: Screen.clear('#000');
    }
    if (Textbox.active) Textbox.draw(ctx);
  },

  setState(s) { Game.prevState = Game.state; Game.state = s; },

  // ---------------------------------------------------------------- items
  give(id, n = 1) { Game.bag[id] = (Game.bag[id] || 0) + n; },
  removeItem(id, n = 1) {
    if (!Game.bag[id]) return;
    Game.bag[id] -= n;
    if (Game.bag[id] <= 0) delete Game.bag[id];
  },
  hasItem(id) { return (Game.bag[id] || 0) > 0; },
  itemsByKind(kind) {
    return Object.keys(Game.bag).filter((id) => Items[id] && (kind ? Items[id].kind === kind : true));
  },

  applyMedicine(item, mon, say) {
    if (item.heal) {
      if (mon.fainted) { say(mon.name + ' has fainted and cannot be healed that way.'); return false; }
      const before = mon.curHp;
      mon.curHp = Math.min(mon.maxHp, mon.curHp + item.heal);
      say(mon.name + ' recovered ' + (mon.curHp - before) + ' HP!');
      return true;
    }
    if (item.cure) {
      if (item.cure.includes(mon.status) || (mon.status === 'tox' && item.cure.includes('psn'))) {
        mon.status = null; say(mon.name + ' is cured!'); return true;
      }
      say('It had no effect.'); return false;
    }
    if (item.revive) {
      if (!mon.fainted) { say('It had no effect.'); return false; }
      mon.curHp = Math.floor(mon.maxHp * item.revive);
      mon.status = null;
      say(mon.name + ' was revived!'); return true;
    }
    if (item.candy) {
      const ups = mon.gainExp(mon.expNext() - mon.exp);
      say(mon.name + ' grew to Lv ' + mon.level + '!');
      return true;
    }
    return false;
  },

  // ---------------------------------------------------------------- dex
  registerDex(key, how) {
    Game.dexSeen[key] = true;
    if (how === 'caught') Game.dexCaught[key] = true;
  },
  dexSeenCount() { return Object.keys(Game.dexSeen).length; },
  dexCaughtCount() { return Object.keys(Game.dexCaught).length; },

  // ---------------------------------------------------------------- party
  healParty() {
    for (const m of Game.party) m.fullHeal();
  },
  firstHealthy() { return Game.party.find((m) => !m.fainted); },
  partyAlive() { return Game.party.some((m) => !m.fainted); },

  addToParty(mon) {
    if (Game.party.length < 6) { Game.party.push(mon); return 'party'; }
    Game.box.push(mon.serialize()); return 'box';
  },

  /** Post-battle: check whole party for level/stone/friendship evolutions. */
  checkEvolutions(trigger, done) {
    const queue = [];
    for (let i = 0; i < Game.party.length; i++) {
      const mon = Game.party[i];
      const to = mon.evolveTarget(trigger);
      if (to) queue.push({ mon, to });
    }
    let qi = 0;
    function next() {
      if (qi >= queue.length) { if (done) done(); return; }
      const { mon, to } = queue[qi++];
      const to2 = mon.evolveTarget(trigger); // re-check (may have changed)
      if (!to2) { next(); return; }
      EvolveScene.play(mon, to2, next);
    }
    next();
  },

  // ---------------------------------------------------------------- battles
  startWildBattle(key, level, env) {
    if (!Game.partyAlive()) return;   // no healthy fakemon — cannot battle
    const mon = new Mon(key, level);
    Game.registerDex(key, 'seen');
    Game.setState('battle');
    Battle.start({
      kind: 'wild', mon, env: env || Overworld.battleEnv(),
      onEnd: (result) => {
        Game.setState('overworld');
        if (key === 'auroryx' && (result === 'caught' || result === 'win')) Game.flags.caughtAuroryx = true;
        if (key === 'umbryx') { if (result === 'caught') Game.flags.caughtUmbryx = true; if (result === 'win') Game.flags.beat_umbryx = true; }
        if (result === 'lose') Game.whiteout();
        else Game.checkEvolutions({ level: true }, () => {});
        Music.play(Overworld.currentMusic());
      },
    });
  },

  startTrainerBattle(trainer, onWin) {
    Game.setState('battle');
    Battle.start({
      kind: 'trainer', trainer, env: Overworld.battleEnv(),
      onEnd: (result) => {
        Game.setState('overworld');
        if (result === 'lose') { Game.whiteout(); return; }
        Game.flags['beat_' + trainer.id] = true;
        Game.checkEvolutions({ level: true }, () => {
          if (onWin) onWin();
        });
        Music.play(Overworld.currentMusic());
      },
    });
  },

  whiteout() {
    Game.healParty();
    Game.money = Math.floor(Game.money / 2);
    const tp = Game.flags.lastCenter || { mapId: 'frosthollow', px: 8, py: 6 };
    Overworld.warpTo(tp.mapId, tp.px, tp.py, 'down');
    Textbox.say('You scurried back to safety, then healed your fakemon.', () => {
      Music.play(Overworld.currentMusic());
    });
  },

  // ---------------------------------------------------------------- save
  save() {
    const data = {
      v: 1, playerName: Game.playerName, gender: Game.gender, money: Game.money, bp: Game.bp,
      party: Game.party.map((m) => m.serialize()), box: Game.box, bag: Game.bag,
      dexSeen: Game.dexSeen, dexCaught: Game.dexCaught, badges: Game.badges,
      flags: Game.flags, playtime: Game.playtime, seenIntro: true,
      mapId: Overworld.map ? Overworld.map.id : Game.mapId,
      px: Overworld.player ? Overworld.player.tx : Game.px,
      py: Overworld.player ? Overworld.player.ty : Game.py,
      pdir: Overworld.player ? Overworld.player.dir : Game.pdir,
    };
    try { localStorage.setItem('norvenna_save', JSON.stringify(data)); return true; }
    catch (e) { return false; }
  },

  hasSave() { return !!localStorage.getItem('norvenna_save'); },

  load() {
    const raw = localStorage.getItem('norvenna_save');
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      Game.playerName = d.playerName; Game.gender = d.gender; Game.money = d.money; Game.bp = d.bp || 0;
      Game.party = d.party.map((m) => Mon.deserialize(m));
      Game.box = d.box || []; Game.bag = d.bag || {};
      Game.dexSeen = d.dexSeen || {}; Game.dexCaught = d.dexCaught || {};
      Game.badges = d.badges || Game.badges; Game.flags = d.flags || {};
      Game.playtime = d.playtime || 0; Game.seenIntro = true;
      Game.mapId = d.mapId; Game.px = d.px; Game.py = d.py; Game.pdir = d.pdir;
      return true;
    } catch (e) { return false; }
  },

  badgeCount() { return Game.badges.filter(Boolean).length; },
  timeString() {
    const secs = Math.floor(Game.playtime / 60);
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60);
    return h + ':' + Util.padLeft(m, 2, '0');
  },
};

window.addEventListener('load', () => Game.init());
