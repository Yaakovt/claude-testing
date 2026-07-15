'use strict';
/**
 * Mon: a living instance of a species — level, IVs, EVs, nature, gender,
 * moves with PP, status, EXP. Stats follow the mainline Gen-3 formulas.
 */
class Mon {
  constructor(key, level, opts = {}) {
    const def = Dex.byKey[key];
    if (!def) throw new Error('unknown species ' + key);
    this.key = key;
    this.level = level;
    this.nickname = opts.nickname || null;
    this.ivs = opts.ivs || {
      hp: Util.rand(32), atk: Util.rand(32), def: Util.rand(32),
      spa: Util.rand(32), spd: Util.rand(32), spe: Util.rand(32),
    };
    this.evs = opts.evs || { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    this.nature = opts.nature || Natures.random();
    this.gender = opts.gender !== undefined ? opts.gender
      : (def.gender < 0 ? null : (Util.chance(def.gender) ? 'M' : 'F'));
    this.exp = expForLevel(def.growth, level);
    this.status = null;          // 'psn'|'tox'|'brn'|'par'|'slp'|'frz'
    this.sleepTurns = 0;
    this.toxCounter = 1;
    this.friendship = 70;
    this.ball = opts.ball || 'fieldorb';
    this.ot = opts.ot || null;
    this.heldItem = opts.heldItem || null;
    // Ability: some species have two possible abilities; one is chosen at random
    // on creation and kept for the mon's life (persisted in the save).
    const abils = (def.abilities && def.abilities.length) ? def.abilities : [def.ability];
    this.ability = (opts.ability && abils.includes(opts.ability)) ? opts.ability : Util.pick(abils);
    this.mega = false;   // transient in-battle Mega state (not saved)

    // Default moves: the last 4 level-up moves at this level.
    if (opts.moves) {
      this.moves = opts.moves.map((id) => ({ id, pp: Moves[id].pp, maxPp: Moves[id].pp }));
    } else {
      const avail = def.learn.filter(([lv]) => lv <= level).map(([, id]) => id);
      const picked = [...new Set(avail)].slice(-4);
      this.moves = picked.map((id) => ({ id, pp: Moves[id].pp, maxPp: Moves[id].pp }));
    }
    this.curHp = this.maxHp;
  }

  get def() { return Dex.byKey[this.key]; }
  get name() { return this.nickname || this.def.name; }
  get megaData() { return this.mega && typeof Megas !== 'undefined' ? Megas[this.key] : null; }
  get activeBase() { const m = this.megaData; return m ? m.base : this.def.base; }
  get types() { const m = this.megaData; return m ? m.types : this.def.types; }
  get fainted() { return this.curHp <= 0; }

  canMega() { return !this.mega && typeof Megas !== 'undefined' && !!Megas[this.key] && this.heldItem === 'rift_stone'; }
  megaName() { const m = typeof Megas !== 'undefined' ? Megas[this.key] : null; return m ? m.name : this.name; }

  statCalc(stat) {
    const base = this.activeBase[stat];
    const iv = this.ivs[stat];
    const ev = Math.floor(this.evs[stat] / 4);
    if (stat === 'hp') {
      return Math.floor(((2 * base + iv + ev) * this.level) / 100) + this.level + 10;
    }
    const raw = Math.floor(((2 * base + iv + ev) * this.level) / 100) + 5;
    return Math.floor(raw * Natures.mult(this.nature, stat));
  }
  get maxHp() { return this.statCalc('hp'); }
  get atk() { return this.statCalc('atk'); }
  get defense() { return this.statCalc('def'); }
  get spa() { return this.statCalc('spa'); }
  get spd() { return this.statCalc('spd'); }
  get spe() { return this.statCalc('spe'); }

  /** EXP needed for the next level (absolute). */
  expNext() { return expForLevel(this.def.growth, this.level + 1); }
  expCur() { return expForLevel(this.def.growth, this.level); }
  expPct() {
    const lo = this.expCur(), hi = this.expNext();
    return Util.clamp((this.exp - lo) / Math.max(1, hi - lo), 0, 1);
  }

  /** Add exp; returns array of levels gained. */
  gainExp(amount) {
    if (this.level >= 100) return [];
    this.exp += amount;
    const ups = [];
    while (this.level < 100 && this.exp >= this.expNext()) {
      const beforeMax = this.maxHp;
      this.level++;
      this.curHp = Math.min(this.maxHp, this.curHp + (this.maxHp - beforeMax));
      ups.push(this.level);
    }
    return ups;
  }

  /** Moves newly learnable at exactly `level`. */
  movesAt(level) {
    return this.def.learn.filter(([lv]) => lv === level).map(([, id]) => id)
      .filter((id) => !this.moves.some((m) => m.id === id));
  }

  knows(id) { return this.moves.some((m) => m.id === id); }

  teach(id, replaceIndex = -1) {
    if (this.knows(id)) return false;
    const entry = { id, pp: Moves[id].pp, maxPp: Moves[id].pp };
    if (this.moves.length < 4) { this.moves.push(entry); return true; }
    if (replaceIndex >= 0) { this.moves[replaceIndex] = entry; return true; }
    return false;
  }

  canTeachTm(itemId) {
    const it = Items[itemId];
    return !!(it && it.move && (this.def.tms || []).includes(itemId));
  }

  /**
   * Evolution check. trigger: {level:true} | {stone:'id'} | {friendship:true}
   * `evolve` may be a single option or an ARRAY of options (split evolution).
   * The first matching branch wins (stone branches are tested with the stone).
   */
  evolveTarget(trigger) {
    const ev = this.def.evolve;
    if (!ev) return null;
    if (this.heldItem === 'stillstone') return null;   // Stillstone blocks evolution
    const options = Array.isArray(ev) ? ev : [ev];
    for (const opt of options) {
      if (opt.level && trigger.level && this.level >= opt.level) return opt.to;
      if (opt.stone && trigger.stone === opt.stone) return opt.to;
      if (opt.friendship && trigger.friendship && this.friendship >= opt.friendship) return opt.to;
    }
    return null;
  }

  evolveInto(key) {
    const hpPct = this.curHp / this.maxHp;
    this.key = key;
    this.curHp = Math.max(1, Math.round(this.maxHp * hpPct));
  }

  fullHeal() {
    this.curHp = this.maxHp;
    this.status = null;
    this.toxCounter = 1;
    for (const m of this.moves) m.pp = m.maxPp;
  }

  serialize() {
    return {
      key: this.key, level: this.level, nickname: this.nickname, ivs: this.ivs,
      evs: this.evs, nature: this.nature, gender: this.gender, exp: this.exp,
      status: this.status, curHp: this.curHp, friendship: this.friendship,
      ball: this.ball, ot: this.ot, heldItem: this.heldItem, ability: this.ability,
      moves: this.moves.map((m) => ({ id: m.id, pp: m.pp, maxPp: m.maxPp })),
    };
  }

  static deserialize(d) {
    const m = new Mon(d.key, d.level, {
      ivs: d.ivs, evs: d.evs, nature: d.nature, gender: d.gender,
      moves: d.moves.map((x) => x.id), ball: d.ball, ot: d.ot, nickname: d.nickname,
      heldItem: d.heldItem || null, ability: d.ability || null,
    });
    m.exp = d.exp;
    m.status = d.status;
    m.curHp = d.curHp;
    m.friendship = d.friendship;
    d.moves.forEach((x, i) => { m.moves[i].pp = x.pp; m.moves[i].maxPp = x.maxPp; });
    return m;
  }
}
