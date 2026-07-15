'use strict';
/**
 * Battle engine — full mainline mechanics:
 * Gen-3 damage formula, phys/spec split, STAB, type chart, stat stages ±6,
 * natures (via Mon), status conditions, weather, priority, crits, abilities,
 * multi-hit, recoil, drain, flinch, confusion, protect, screens, leech seed,
 * proper catch & escape formulas, EXP with participation split.
 *
 * The engine resolves logic instantly and emits a queue of playback events
 * that battle_ui.js animates one at a time.
 */
const Battle = {
  active: false,
  kind: 'wild',            // 'wild' | 'trainer'
  env: 'grass',            // battle background key
  trainer: null,           // trainer def for trainer battles
  trainerPartyIdx: 0,
  pl: null, en: null,      // sides
  weather: { kind: null, turns: 0 },
  queue: [],
  onEnd: null,
  result: null,
  runAttempts: 0,
  participants: new Set(),
  caughtMon: null,
  expShare: false,

  E(t, d = {}) { Battle.queue.push(Object.assign({ t }, d)); },

  makeSide(mon, isPlayer) {
    return {
      mon, isPlayer,
      stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 },
      confuse: 0, seeded: false, protect: false, protectStreak: 0,
      focusEnergy: false, flinch: 0,
      screens: { phys: 0, spec: 0 },
      usedItems: 0,
    };
  },

  ability(side) { return Abilities[side.mon.def.ability] || {}; },

  start(opts) {
    Battle.active = true;
    Battle.kind = opts.kind;
    Battle.env = opts.env || 'grass';
    Battle.trainer = opts.trainer || null;
    Battle.trainerPartyIdx = 0;
    Battle.onEnd = opts.onEnd || null;
    Battle.queue = [];
    Battle.weather = { kind: opts.weather || null, turns: opts.weather ? 999 : 0 };
    Battle.runAttempts = 0;
    Battle.result = null;
    Battle.caughtMon = null;
    Battle.participants = new Set();

    const pmon = Game.party.find((m) => !m.fainted);
    Battle.pl = Battle.makeSide(pmon, true);
    let emon;
    if (opts.kind === 'trainer') {
      emon = Battle.trainerMon(0);
      Battle.E('text', { msg: (Battle.trainer.cls ? Battle.trainer.cls + ' ' : '') + Battle.trainer.name + ' wants to battle!' });
      Battle.E('sendEnemy');
      Battle.E('text', { msg: Battle.trainer.name + ' sent out ' + emon.name + '!' });
    } else {
      emon = opts.mon;
      Battle.E('sendEnemy');
      Battle.E('text', { msg: 'Wild ' + emon.name + ' appeared!' });
      Battle.E('cry', { key: emon.key });
    }
    Battle.en = Battle.makeSide(emon, false);
    Battle.E('sendPlayer');
    Battle.E('text', { msg: 'Go! ' + pmon.name + '!' });
    Battle.E('cry', { key: pmon.key });
    Battle.participants.add(pmon);
    Battle.entryAbilities();
    BattleUI.open();
  },

  trainerMon(i) {
    const spec = Battle.trainer.party[i];
    return new Mon(spec.key, spec.level, { moves: spec.moves, ot: Battle.trainer.name });
  },

  entryAbilities() {
    for (const side of [Battle.pl, Battle.en]) {
      const ab = Battle.ability(side);
      const foe = side.isPlayer ? Battle.en : Battle.pl;
      if (ab.entryWeather && Battle.weather.kind !== ab.entryWeather) {
        Battle.weather = { kind: ab.entryWeather, turns: 5 };
        Battle.E('weather', { kind: ab.entryWeather });
        Battle.E('text', { msg: side.mon.name + "'s " + ab.name + ' changed the weather!' });
      }
      if (ab.entryLower && foe.mon && !foe.mon.fainted) {
        Battle.changeStage(foe, ab.entryLower.stat, -1, side.mon.name + "'s " + ab.name);
      }
    }
  },

  // ---------------------------------------------------------------- turns
  /** action: {type:'move',idx} | {type:'item',id,target} | {type:'switch',idx} | {type:'run'} */
  playerAction(action) {
    const pl = Battle.pl, en = Battle.en;

    if (action.type === 'run') {
      if (Battle.kind === 'trainer') {
        Battle.E('text', { msg: "You can't run from a trainer battle!" });
        Battle.E('menu');
        return BattleUI.play();
      }
      if (Battle.tryRun()) return BattleUI.play();
      // failed to flee: enemy attacks
      Battle.execMove(en, pl, Battle.aiChoose());
      Battle.endOfTurn();
      return BattleUI.play();
    }

    let playerMoves = action.type === 'move';
    if (action.type === 'switch') {
      Battle.switchPlayer(action.idx);
    } else if (action.type === 'item') {
      Battle.useItem(action);
      if (Battle.result) return BattleUI.play();
    }

    const enemyMove = Battle.aiChoose();
    if (!playerMoves) {
      // Enemy gets a free attack after switch/item.
      if (!en.mon.fainted && !pl.mon.fainted) Battle.execMove(en, pl, enemyMove);
      Battle.endOfTurn();
      return BattleUI.play();
    }

    const pMove = pl.mon.moves[action.idx];
    const pPri = Moves[pMove.id].pri, ePri = Moves[enemyMove.id].pri;
    let first, second, firstMove, secondMove;
    const pSpe = Battle.effSpeed(pl), eSpe = Battle.effSpeed(en);
    const plFirst = pPri !== ePri ? pPri > ePri : (pSpe === eSpe ? Util.chance(50) : pSpe > eSpe);
    if (plFirst) { first = pl; firstMove = pMove; second = en; secondMove = enemyMove; }
    else { first = en; firstMove = enemyMove; second = pl; secondMove = pMove; }

    Battle.execMove(first, second, firstMove);
    if (!first.mon.fainted && !second.mon.fainted && !Battle.result) {
      Battle.execMove(second, first, secondMove);
    }
    Battle.endOfTurn();
    BattleUI.play();
  },

  effSpeed(side) {
    let spe = side.mon.spe * Battle.stageMult(side, 'spe');
    const ab = Battle.ability(side);
    if (ab.weatherSpeed && Battle.weather.kind === ab.weatherSpeed) spe *= 2;
    if (side.mon.status === 'par') spe *= 0.25;
    return spe;
  },

  stageMult(side, stat) {
    const s = side.stages[stat];
    if (stat === 'acc' || stat === 'eva') return s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
    return s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  },

  changeStage(side, stats, delta, cause) {
    const list = Array.isArray(stats) ? stats : [stats];
    for (const stat of list) {
      const cur = side.stages[stat];
      const next = Util.clamp(cur + delta, -6, 6);
      const names = { atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'accuracy', eva: 'evasiveness' };
      if (next === cur) {
        Battle.E('text', { msg: side.mon.name + "'s " + names[stat] + (delta > 0 ? " won't go higher!" : " won't go lower!") });
        continue;
      }
      side.stages[stat] = next;
      Battle.E('stat', { side: side.isPlayer ? 'pl' : 'en', up: delta > 0 });
      const adv = Math.abs(delta) >= 2 ? 'sharply ' : '';
      Battle.E('text', { msg: (cause ? cause + ': ' : '') + side.mon.name + "'s " + names[stat] + (delta > 0 ? ' rose ' + adv + '!' : ' ' + adv + 'fell!') });
    }
  },

  // ---------------------------------------------------------------- moves
  execMove(user, target, moveSlot) {
    const mon = user.mon;
    const move = Moves[moveSlot.id];
    user.protect = false;

    // Pre-move status checks
    if (user.flinch) {
      user.flinch = 0;
      Battle.E('text', { msg: mon.name + ' flinched!' });
      return;
    }
    if (mon.status === 'slp') {
      if (mon.sleepTurns <= 0) {
        mon.status = null;
        Battle.E('statusClear', { side: user.isPlayer ? 'pl' : 'en' });
        Battle.E('text', { msg: mon.name + ' woke up!' });
      } else {
        mon.sleepTurns--;
        Battle.E('text', { msg: mon.name + ' is fast asleep.' });
        return;
      }
    }
    if (mon.status === 'frz') {
      if (Util.chance(20) || move.type === 'Fire') {
        mon.status = null;
        Battle.E('statusClear', { side: user.isPlayer ? 'pl' : 'en' });
        Battle.E('text', { msg: mon.name + ' thawed out!' });
      } else {
        Battle.E('text', { msg: mon.name + ' is frozen solid!' });
        return;
      }
    }
    if (mon.status === 'par' && Util.chance(25)) {
      Battle.E('text', { msg: mon.name + ' is fully paralyzed!' });
      return;
    }
    if (user.confuse > 0) {
      user.confuse--;
      if (user.confuse === 0) {
        Battle.E('text', { msg: mon.name + ' snapped out of confusion!' });
      } else {
        Battle.E('text', { msg: mon.name + ' is confused!' });
        if (Util.chance(50)) {
          // hurt itself: 40-power typeless physical
          const dmg = Battle.rawDamage(user, user, 40, 'phys', 1, false, 1);
          Battle.E('text', { msg: 'It hurt itself in its confusion!' });
          Battle.applyDamage(user, dmg);
          return;
        }
      }
    }

    if (moveSlot.pp <= 0) {
      Battle.E('text', { msg: mon.name + ' has no PP left for this move!' });
      return;
    }
    moveSlot.pp--;

    Battle.E('text', { msg: mon.name + ' used ' + move.name + '!' });

    const fx = move.effect || {};
    const userTag = user.isPlayer ? 'pl' : 'en';
    const targetTag = target.isPlayer ? 'pl' : 'en';

    // Self-targeting / field status moves never miss.
    const selfMove = move.cat === 'status' && !!(fx.statSelf || fx.heal || fx.rest || fx.weather || fx.screen || fx.protect || fx.critSelf || Object.keys(fx).length === 0);

    if (fx.protect) {
      const odds = [100, 50, 25, 12][Math.min(3, user.protectStreak)];
      if (Util.chance(odds)) {
        user.protect = true;
        user.protectStreak++;
        Battle.E('anim', { move: move.id, user: userTag, target: userTag });
        Battle.E('text', { msg: mon.name + ' protected itself!' });
      } else {
        user.protectStreak = 0;
        Battle.E('text', { msg: 'But it failed!' });
      }
      return;
    }
    user.protectStreak = 0;

    if (!selfMove) {
      // Protect check
      if (target.protect) {
        Battle.E('anim', { move: move.id, user: userTag, target: targetTag });
        Battle.E('text', { msg: target.mon.name + ' protected itself!' });
        return;
      }
      // Accuracy check
      if (!Battle.accuracyCheck(user, target, move, fx)) {
        Battle.E('anim', { move: move.id, user: userTag, target: targetTag, miss: true });
        Battle.E('text', { msg: mon.name + "'s attack missed!" });
        return;
      }
    }

    // Absorb / immunity abilities
    const tAb = Battle.ability(target);
    if (!selfMove && move.cat !== 'status' && tAb.absorb && tAb.absorb.type === move.type) {
      Battle.E('anim', { move: move.id, user: userTag, target: targetTag });
      const heal = Math.floor(target.mon.maxHp * tAb.absorb.heal);
      target.mon.curHp = Math.min(target.mon.maxHp, target.mon.curHp + heal);
      Battle.E('hp', { side: targetTag });
      Battle.E('text', { msg: target.mon.name + "'s " + tAb.name + ' absorbed the attack!' });
      return;
    }
    if (!selfMove && move.type === 'Ground' && tAb.levitate) {
      Battle.E('text', { msg: "It doesn't affect " + target.mon.name + '...' });
      return;
    }

    // ---- status-category moves ----
    if (move.cat === 'status') {
      Battle.E('anim', { move: move.id, user: userTag, target: selfMove ? userTag : targetTag });
      Battle.statusMoveEffect(user, target, move, fx);
      return;
    }

    // ---- damaging moves ----
    let hits = 1;
    if (fx.multi) {
      const r = Util.rand(8);
      hits = fx.multi[0] + (r < 3 ? 0 : r < 6 ? 1 : r < 7 ? 2 : 3);
      hits = Math.min(hits, fx.multi[1]);
    } else if (fx.hits2) hits = 2;

    let totalDmg = 0, lastEff = 1, lastCrit = false;
    for (let h = 0; h < hits && !target.mon.fainted; h++) {
      const { dmg, crit, eff } = Battle.calcDamage(user, target, move, fx);
      lastEff = eff; lastCrit = crit;
      if (eff === 0) {
        Battle.E('text', { msg: "It doesn't affect " + target.mon.name + '...' });
        return;
      }
      Battle.E('anim', { move: move.id, user: userTag, target: targetTag });
      Battle.E('hitfx', { side: targetTag, eff });
      totalDmg += Battle.applyDamage(target, dmg);
      if (crit) Battle.E('text', { msg: 'A critical hit!' });
    }
    if (hits > 1) Battle.E('text', { msg: 'Hit ' + hits + ' time(s)!' });
    if (lastEff > 1) Battle.E('text', { msg: "It's super effective!" });
    else if (lastEff < 1 && lastEff > 0) Battle.E('text', { msg: "It's not very effective..." });

    // Contact ability on the defender
    if (move.contact && tAb.contact && !target.mon.fainted && !user.mon.fainted &&
        !user.mon.status && Util.chance(tAb.contact.pct)) {
      Battle.applyStatus(user, tAb.contact.status, target.mon.name + "'s " + tAb.name);
    }

    // Secondary effects
    if (!target.mon.fainted) {
      if (fx.status && Util.chance(fx.status.pct)) Battle.applyStatus(target, fx.status.id, null, true);
      if (fx.statFoe && Util.chance(fx.statFoe.pct || 100)) {
        Battle.changeStage(target, fx.statFoe.stat, fx.statFoe.stages, null);
      }
      if (fx.flinch && Util.chance(fx.flinch)) target.flinch = 1;
    }
    if (!user.mon.fainted) {
      if (fx.statSelf && Util.chance(fx.statSelf.pct || 100)) {
        Battle.changeStage(user, fx.statSelf.stat, fx.statSelf.stages, null);
      }
      if (fx.drain && totalDmg > 0) {
        const heal = Math.max(1, Math.floor(totalDmg * fx.drain));
        user.mon.curHp = Math.min(user.mon.maxHp, user.mon.curHp + heal);
        Battle.E('hp', { side: userTag });
        Battle.E('text', { msg: target.mon.name + ' had its energy drained!' });
      }
      if (fx.recoil && totalDmg > 0 && !Battle.ability(user).hardBody) {
        const rec = Math.max(1, Math.floor(totalDmg * fx.recoil));
        Battle.applyDamage(user, rec);
        Battle.E('text', { msg: user.mon.name + ' was hurt by recoil!' });
      }
    }

    Battle.checkFaints();
  },

  statusMoveEffect(user, target, move, fx) {
    const mon = user.mon;
    const userTag = user.isPlayer ? 'pl' : 'en';
    if (fx.statSelf) Battle.changeStage(user, fx.statSelf.stat, fx.statSelf.stages, null);
    if (fx.statFoe) {
      const tAb = Battle.ability(target);
      Battle.changeStage(target, fx.statFoe.stat, fx.statFoe.stages, null);
    }
    if (fx.status) Battle.applyStatus(target, fx.status.id);
    if (fx.heal) {
      if (mon.curHp >= mon.maxHp) Battle.E('text', { msg: "But it failed!" });
      else {
        mon.curHp = Math.min(mon.maxHp, mon.curHp + Math.floor(mon.maxHp * fx.heal));
        Battle.E('hp', { side: userTag });
        Battle.E('text', { msg: mon.name + ' regained health!' });
      }
    }
    if (fx.rest) {
      if (mon.curHp >= mon.maxHp) Battle.E('text', { msg: 'But it failed!' });
      else {
        mon.status = 'slp'; mon.sleepTurns = 2; mon.curHp = mon.maxHp;
        Battle.E('hp', { side: userTag });
        Battle.E('status', { side: userTag, st: 'slp' });
        Battle.E('text', { msg: mon.name + ' slept and became healthy!' });
      }
    }
    if (fx.weather) {
      if (Battle.weather.kind === fx.weather) Battle.E('text', { msg: 'But it failed!' });
      else {
        Battle.weather = { kind: fx.weather, turns: 5 };
        Battle.E('weather', { kind: fx.weather });
        const msgs = { rain: 'It started to rain!', sun: 'The sunlight turned harsh!', hail: 'It started to hail!', sandstorm: 'A sandstorm kicked up!' };
        Battle.E('text', { msg: msgs[fx.weather] });
      }
    }
    if (fx.screen) {
      if (user.screens[fx.screen] > 0) Battle.E('text', { msg: 'But it failed!' });
      else {
        user.screens[fx.screen] = 5;
        Battle.E('text', { msg: (fx.screen === 'phys' ? 'A wall of force' : 'A veil of light') + ' surrounds ' + mon.name + '!' });
      }
    }
    if (fx.critSelf) {
      user.focusEnergy = true;
      Battle.E('text', { msg: mon.name + ' is getting pumped!' });
    }
    if (fx.seed) {
      if (target.seeded || target.mon.types.includes('Grass')) Battle.E('text', { msg: 'But it failed!' });
      else {
        target.seeded = true;
        Battle.E('text', { msg: target.mon.name + ' was seeded!' });
      }
    }
    if (Object.keys(fx).length === 0) {
      Battle.E('text', { msg: 'But nothing happened!' });
    }
  },

  accuracyCheck(user, target, move, fx) {
    if (fx.neverMiss) return true;
    if (move.acc === null || move.acc === undefined) return true;
    if (fx.rainPerfect && Battle.weather.kind === 'rain') return true;
    if (fx.hailPerfect && Battle.weather.kind === 'hail') return true;
    let acc = move.acc * Battle.stageMult(user, 'acc') / Battle.stageMult(target, 'eva');
    const ab = Battle.ability(user);
    if (ab.accBoost) acc *= ab.accBoost;
    return Util.chance(Math.min(100, acc));
  },

  critStage(user, move, fx) {
    let stage = 0;
    if (fx.highCrit) stage++;
    if (user.focusEnergy) stage += 2;
    if (Battle.ability(user).critBoost) stage += Battle.ability(user).critBoost;
    return Math.min(stage, 3);
  },

  calcDamage(user, target, move, fx) {
    const eff = TypeChart.effect(move.type, target.mon.types);
    if (eff === 0) return { dmg: 0, crit: false, eff };

    const critChance = [1 / 16, 1 / 8, 1 / 4, 1 / 3][Battle.critStage(user, move, fx)];
    const crit = Math.random() < critChance;

    let power = move.power;
    const uAb = Battle.ability(user);
    if (uAb.technician && power <= 60) power *= 1.5;
    if (uAb.pinch && uAb.pinch.type === move.type && user.mon.curHp <= user.mon.maxHp / 3) power *= 1.5;
    if (uAb.auroraHeart && (Battle.weather.kind === 'rain' || Battle.weather.kind === 'hail')) power *= 1.3;
    if (fx.hexBoost && (target.mon.status || target.confuse > 0)) power *= 2;

    // Weather modifiers
    if (Battle.weather.kind === 'rain') {
      if (move.type === 'Water') power *= 1.5;
      if (move.type === 'Fire') power *= 0.5;
    } else if (Battle.weather.kind === 'sun') {
      if (move.type === 'Fire') power *= 1.5;
      if (move.type === 'Water') power *= 0.5;
    }

    if (fx.levelDamage) return { dmg: user.mon.level, crit: false, eff: 1 };
    if (fx.fixed) return { dmg: fx.fixed, crit: false, eff: 1 };

    const phys = move.cat === 'phys';
    let atk = phys ? user.mon.atk : user.mon.spa;
    let def = phys ? target.mon.defense : target.mon.spd;
    // Stat stages (crits ignore attacker's drops and defender's boosts)
    let atkStage = Battle.stageMult(user, phys ? 'atk' : 'spa');
    let defStage = Battle.stageMult(target, phys ? 'def' : 'spd');
    if (crit) { atkStage = Math.max(1, atkStage); defStage = Math.min(1, defStage); }
    atk *= atkStage; def *= defStage;
    // Burn halves physical attack (unless Guts)
    if (phys && user.mon.status === 'brn' && !uAb.guts) atk *= 0.5;
    if (uAb.guts && user.mon.status && phys) atk *= 1.5;

    let dmg = (((2 * user.mon.level) / 5 + 2) * power * (atk / Math.max(1, def))) / 50 + 2;
    // STAB
    if (user.mon.types.includes(move.type)) dmg *= uAb.adaptability ? 2 : 1.5;
    dmg *= eff;
    if (crit) dmg *= 2;
    // Screens
    if (!crit && target.screens[phys ? 'phys' : 'spec'] > 0) dmg *= 0.5;
    // Halving abilities
    const tAb = Battle.ability(target);
    if (tAb.halve && tAb.halve.includes(move.type)) dmg *= 0.5;
    // Random spread
    dmg *= (85 + Util.rand(16)) / 100;
    return { dmg: Math.max(1, Math.floor(dmg)), crit, eff };
  },

  rawDamage(user, target, power, cat, eff, crit, stab) {
    const phys = cat === 'phys';
    const atk = phys ? user.mon.atk : user.mon.spa;
    const def = phys ? target.mon.defense : target.mon.spd;
    let dmg = (((2 * user.mon.level) / 5 + 2) * power * (atk / Math.max(1, def))) / 50 + 2;
    return Math.max(1, Math.floor(dmg * eff * (stab || 1) * (85 + Util.rand(16)) / 100));
  },

  /** Deals damage, emits HP event, returns actual damage dealt. */
  applyDamage(side, dmg) {
    const mon = side.mon;
    let deal = Math.min(mon.curHp, Math.floor(dmg));
    // Sturdy: survive from full HP
    if (Battle.ability(side).sturdy && mon.curHp === mon.maxHp && deal >= mon.curHp) {
      deal = mon.curHp - 1;
      mon.curHp = 1;
      Battle.E('hp', { side: side.isPlayer ? 'pl' : 'en' });
      Battle.E('text', { msg: mon.name + ' endured the hit!' });
      return deal;
    }
    mon.curHp -= deal;
    Battle.E('hp', { side: side.isPlayer ? 'pl' : 'en' });
    return deal;
  },

  applyStatus(side, id, cause, silent) {
    const mon = side.mon;
    const ab = Battle.ability(side);
    if (id === 'confuse') {
      if (side.confuse > 0 || (ab.statusImmune || []).includes('confuse')) {
        if (!silent) Battle.E('text', { msg: 'But it failed!' });
        return;
      }
      side.confuse = 2 + Util.rand(4);
      Battle.E('text', { msg: mon.name + ' became confused!' });
      return;
    }
    if (mon.status) { if (!silent) Battle.E('text', { msg: 'But it failed!' }); return; }
    const baseId = id === 'tox' ? 'psn' : id;
    if ((ab.statusImmune || []).includes(baseId)) {
      if (!silent) Battle.E('text', { msg: mon.name + "'s " + ab.name + ' prevents that!' });
      return;
    }
    // Type immunities
    if ((id === 'psn' || id === 'tox') && (mon.types.includes('Poison') || mon.types.includes('Steel'))) {
      if (!silent) Battle.E('text', { msg: "It doesn't affect " + mon.name + '...' }); return;
    }
    if (id === 'brn' && mon.types.includes('Fire')) { if (!silent) Battle.E('text', { msg: "It doesn't affect " + mon.name + '...' }); return; }
    if (id === 'frz' && mon.types.includes('Ice')) { if (!silent) Battle.E('text', { msg: "It doesn't affect " + mon.name + '...' }); return; }
    if (id === 'par' && mon.types.includes('Electric')) { if (!silent) Battle.E('text', { msg: "It doesn't affect " + mon.name + '...' }); return; }
    mon.status = id;
    if (id === 'slp') mon.sleepTurns = 1 + Util.rand(3);
    if (id === 'tox') mon.toxCounter = 1;
    const msgs = {
      psn: ' was poisoned!', tox: ' was badly poisoned!', brn: ' was burned!',
      par: ' is paralyzed! It may be unable to move!', slp: ' fell asleep!', frz: ' was frozen solid!',
    };
    Battle.E('status', { side: side.isPlayer ? 'pl' : 'en', st: id });
    Battle.E('text', { msg: (cause ? cause + ': ' : '') + mon.name + msgs[id] });
  },

  // ---------------------------------------------------------------- end of turn
  endOfTurn() {
    if (Battle.result) return;
    // Weather
    if (Battle.weather.kind && Battle.weather.turns < 900) {
      Battle.weather.turns--;
      if (Battle.weather.turns <= 0) {
        const msgs = { rain: 'The rain stopped.', sun: 'The sunlight faded.', hail: 'The hail stopped.', sandstorm: 'The sandstorm subsided.' };
        Battle.E('text', { msg: msgs[Battle.weather.kind] });
        Battle.weather.kind = null;
        Battle.E('weather', { kind: null });
      }
    }
    for (const side of [Battle.pl, Battle.en]) {
      if (side.mon.fainted) continue;
      const mon = side.mon;
      const tag = side.isPlayer ? 'pl' : 'en';
      const ab = Battle.ability(side);
      // Weather chip
      if (Battle.weather.kind === 'hail' && !mon.types.includes('Ice')) {
        Battle.applyDamage(side, Math.max(1, Math.floor(mon.maxHp / 16)));
        Battle.E('text', { msg: mon.name + ' is buffeted by the hail!' });
      }
      if (Battle.weather.kind === 'sandstorm' && !mon.types.some((t) => ['Rock', 'Ground', 'Steel'].includes(t))) {
        Battle.applyDamage(side, Math.max(1, Math.floor(mon.maxHp / 16)));
        Battle.E('text', { msg: mon.name + ' is buffeted by the sandstorm!' });
      }
      // Status residuals
      if (mon.status === 'psn' && !mon.fainted) {
        Battle.applyDamage(side, Math.max(1, Math.floor(mon.maxHp / 8)));
        Battle.E('text', { msg: mon.name + ' is hurt by poison!' });
      } else if (mon.status === 'tox' && !mon.fainted) {
        Battle.applyDamage(side, Math.max(1, Math.floor((mon.maxHp * mon.toxCounter) / 16)));
        mon.toxCounter = Math.min(15, mon.toxCounter + 1);
        Battle.E('text', { msg: mon.name + ' is hurt by poison!' });
      } else if (mon.status === 'brn' && !mon.fainted) {
        Battle.applyDamage(side, Math.max(1, Math.floor(mon.maxHp / 8)));
        Battle.E('text', { msg: mon.name + ' is hurt by its burn!' });
      }
      // Leech seed
      if (side.seeded && !mon.fainted) {
        const foe = side.isPlayer ? Battle.en : Battle.pl;
        if (!foe.mon.fainted) {
          const drain = Math.max(1, Math.floor(mon.maxHp / 8));
          const dealt = Battle.applyDamage(side, drain);
          foe.mon.curHp = Math.min(foe.mon.maxHp, foe.mon.curHp + dealt);
          Battle.E('hp', { side: foe.isPlayer ? 'pl' : 'en' });
          Battle.E('text', { msg: mon.name + "'s health was sapped by the seed!" });
        }
      }
      // Regen ability
      if (ab.regen && mon.curHp < mon.maxHp && !mon.fainted) {
        mon.curHp = Math.min(mon.maxHp, mon.curHp + Math.max(1, Math.floor(mon.maxHp * ab.regen)));
        Battle.E('hp', { side: tag });
      }
      // Screens tick
      if (side.screens.phys > 0) side.screens.phys--;
      if (side.screens.spec > 0) side.screens.spec--;
    }
    Battle.checkFaints();
    if (!Battle.result) Battle.E('menu');
  },

  // ---------------------------------------------------------------- faints & exp
  checkFaints() {
    if (Battle.result) return;
    const pl = Battle.pl, en = Battle.en;
    if (en.mon.fainted) {
      Battle.E('cry', { key: en.mon.key });
      Battle.E('faint', { side: 'en' });
      Battle.E('text', { msg: (Battle.kind === 'trainer' ? 'Foe ' : 'Wild ') + en.mon.name + ' fainted!' });
      // Moxie-style ability
      const ab = Battle.ability(pl);
      if (ab.moxie && !pl.mon.fainted) Battle.changeStage(pl, ab.moxie.stat, 1, ab.name);
      Battle.awardExp();
      if (Battle.kind === 'trainer' && Battle.trainerPartyIdx + 1 < Battle.trainer.party.length) {
        Battle.trainerPartyIdx++;
        const next = Battle.trainerMon(Battle.trainerPartyIdx);
        Battle.en = Battle.makeSide(next, false);
        Battle.participants = new Set([pl.mon]);
        Battle.E('sendEnemy');
        Battle.E('text', { msg: Battle.trainer.name + ' sent out ' + next.name + '!' });
        Battle.E('cry', { key: next.key });
        Battle.entryAbilities();
      } else {
        Battle.result = Battle.kind === 'trainer' ? 'win' : 'win';
        if (Battle.kind === 'trainer') {
          Battle.E('text', { msg: 'You defeated ' + Battle.trainer.name + '!' });
          if (Battle.trainer.reward) {
            Game.money += Battle.trainer.reward;
            Battle.E('text', { msg: 'You got $' + Battle.trainer.reward + ' for winning!' });
          }
          if (Battle.trainer.loss) Battle.E('text', { msg: Battle.trainer.name + ': ' + Battle.trainer.loss });
        }
        Battle.E('end');
      }
      return;
    }
    if (pl.mon.fainted) {
      Battle.E('cry', { key: pl.mon.key });
      Battle.E('faint', { side: 'pl' });
      Battle.E('text', { msg: pl.mon.name + ' fainted!' });
      const alive = Game.party.filter((m) => !m.fainted);
      if (alive.length === 0) {
        Battle.result = 'lose';
        Battle.E('text', { msg: 'You have no more fakemon that can fight!' });
        Battle.E('text', { msg: 'You blacked out!' });
        Battle.E('end');
      } else {
        Battle.E('forceSwitch');
      }
    }
  },

  awardExp() {
    const en = Battle.en.mon;
    const base = en.def.expYield;
    let exp = Math.floor((base * en.level) / 7);
    if (Battle.kind === 'trainer') exp = Math.floor(exp * 1.5);
    const parts = [...Battle.participants].filter((m) => !m.fainted && m.level < 100);
    if (!parts.length) return;
    const each = Math.max(1, Math.floor(exp / parts.length));
    for (const mon of parts) {
      Battle.E('text', { msg: mon.name + ' gained ' + each + ' EXP. Points!' });
      // EV award: 2 points to the foe's highest base stat
      const stats = Object.entries(en.def.base).sort((a, b) => b[1] - a[1]);
      const evStat = stats[0][0];
      mon.evs[evStat] = Math.min(252, mon.evs[evStat] + 2);
      const ups = mon.gainExp(each);
      if (mon === Battle.pl.mon) Battle.E('expbar');
      for (const lv of ups) {
        Battle.E('cry', { key: mon.key });
        Battle.E('levelup', { name: mon.name, lv });
        Battle.E('hp', { side: mon === Battle.pl.mon ? 'pl' : 'none' });
        for (const mv of mon.movesAt(lv)) Battle.E('learn', { mon: Game.party.indexOf(mon), move: mv });
      }
    }
  },

  // ---------------------------------------------------------------- switching / items / run
  switchPlayer(idx, forced) {
    const mon = Game.party[idx];
    if (!forced) Battle.E('text', { msg: Battle.pl.mon.name + ', come back!' });
    Battle.E('recall', { side: 'pl' });
    Battle.pl = Battle.makeSide(mon, true);
    Battle.participants.add(mon);
    Battle.E('sendPlayer');
    Battle.E('text', { msg: 'Go! ' + mon.name + '!' });
    Battle.E('cry', { key: mon.key });
    Battle.entryAbilities();
  },

  useItem(action) {
    const item = Items[action.id];
    Game.removeItem(action.id, 1);
    if (item.kind === 'ball') {
      Battle.E('text', { msg: Game.playerName + ' threw a ' + item.name + '!' });
      Battle.tryCatch(item);
      return;
    }
    if (item.xstat) {
      Battle.E('text', { msg: 'Used the ' + item.name + '!' });
      Battle.changeStage(Battle.pl, item.xstat, 1, null);
      return;
    }
    const target = Game.party[action.target !== undefined ? action.target : Game.party.indexOf(Battle.pl.mon)];
    Battle.E('text', { msg: 'Used the ' + item.name + ' on ' + target.name + '!' });
    Game.applyMedicine(item, target, (msg) => Battle.E('text', { msg }));
    Battle.E('hp', { side: target === Battle.pl.mon ? 'pl' : 'none' });
    if (!target.status) Battle.E('statusClear', { side: target === Battle.pl.mon ? 'pl' : 'none' });
  },

  tryCatch(ball) {
    const en = Battle.en.mon;
    if (Battle.kind === 'trainer') {
      Battle.E('text', { msg: "You can't catch another trainer's fakemon!" });
      return;
    }
    const statusBonus = en.status === 'slp' || en.status === 'frz' ? 2
      : en.status ? 1.5 : 1;
    const a = Math.min(255, Math.floor(
      ((3 * en.maxHp - 2 * en.curHp) * en.def.catchRate * ball.ballMult * statusBonus) / (3 * en.maxHp)
    ));
    let shakes = 0, caught = false;
    if (a >= 255) { shakes = 3; caught = true; }
    else {
      const b = Math.floor(1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a))));
      for (let i = 0; i < 4; i++) {
        if (Util.rand(65536) < b) shakes++;
        else break;
      }
      caught = shakes === 4;
      shakes = Math.min(3, shakes);
    }
    Battle.E('ball', { shakes, caught });
    if (caught) {
      Battle.result = 'caught';
      Battle.caughtMon = en;
      en.ball = ball.id;
      Battle.E('text', { msg: 'Gotcha! ' + en.name + ' was caught!' });
      Game.registerDex(en.key, 'caught');
      if (Game.party.length < 6) {
        Game.party.push(en);
        Battle.E('text', { msg: en.name + ' joined your party!' });
      } else {
        Game.box.push(en.serialize());
        Battle.E('text', { msg: en.name + ' was sent to the Storage Box!' });
      }
      Battle.awardExp = () => {}; // no exp on catch
      Battle.E('end');
    } else {
      const msgs = ['Oh no! It broke free!', 'Aww! It appeared to be caught!', 'Aargh! Almost had it!', 'Shoot! It was so close, too!'];
      Battle.E('text', { msg: msgs[shakes] });
      // Enemy attacks after failed catch
      Battle.execMove(Battle.en, Battle.pl, Battle.aiChoose());
      Battle.endOfTurn();
    }
  },

  tryRun() {
    Battle.runAttempts++;
    if (Battle.ability(Battle.pl).escapeArtist) {
      Battle.E('text', { msg: 'Got away safely!' });
      Battle.result = 'run';
      Battle.E('end');
      return true;
    }
    const a = Battle.pl.mon.spe, b = Math.max(1, Battle.en.mon.spe);
    const f = Math.floor((a * 128) / b + 30 * Battle.runAttempts) % 256;
    if (Util.rand(256) < f) {
      Battle.E('run');
      Battle.E('text', { msg: 'Got away safely!' });
      Battle.result = 'run';
      Battle.E('end');
      return true;
    }
    Battle.E('text', { msg: "Can't escape!" });
    return false;
  },

  // ---------------------------------------------------------------- enemy AI
  aiChoose() {
    const en = Battle.en, pl = Battle.pl;
    const usable = en.mon.moves.filter((m) => m.pp > 0);
    if (!usable.length) return { id: 'flop', pp: 99, maxPp: 99 };
    const smart = Battle.kind === 'trainer' && (Battle.trainer.ai === 'smart');
    if (!smart && Battle.kind === 'wild') return Util.pick(usable);

    // Trainer AI: score moves by expected damage; sprinkle status early.
    let best = null, bestScore = -1;
    for (const slot of usable) {
      const mv = Moves[slot.id];
      let score;
      if (mv.cat === 'status') {
        score = 20;
        const fx = mv.effect || {};
        if (fx.status && !pl.mon.status) score = 45;
        if (fx.statSelf && en.mon.curHp > en.mon.maxHp * 0.7) score = 40;
        if (fx.heal && en.mon.curHp < en.mon.maxHp * 0.4) score = 90;
        if (fx.weather && Battle.weather.kind !== fx.weather) score = 35;
      } else {
        const eff = TypeChart.effect(mv.type, pl.mon.types);
        const stab = en.mon.types.includes(mv.type) ? 1.5 : 1;
        score = (mv.power || 0) * eff * stab * ((mv.acc || 100) / 100);
        if (eff === 0) score = 0;
      }
      score *= 0.85 + Math.random() * 0.3;
      if (score > bestScore) { bestScore = score; best = slot; }
    }
    return best || Util.pick(usable);
  },

  finish() {
    Battle.active = false;
    const cb = Battle.onEnd;
    Battle.onEnd = null;
    BattleUI.close();
    if (cb) cb(Battle.result);
  },
};
