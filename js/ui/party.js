'use strict';
/** Party screen (view/switch/use-item target) and the summary screen. */
const PartyUI = {
  idx: 0, mode: 'field', onPick: null, onCancel: null, forItem: null, prevState: null,

  open(opts) {
    PartyUI.mode = opts.mode || 'field';
    PartyUI.onPick = opts.onPick || null;
    PartyUI.onCancel = opts.onCancel || null;
    PartyUI.forItem = opts.forItem || null;
    PartyUI.idx = 0;
    PartyUI.prevState = Game.state;
    Game.setState('party');
  },

  update() {
    const n = Game.party.length;
    if (Input.pressed.up) { PartyUI.idx = (PartyUI.idx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { PartyUI.idx = (PartyUI.idx + 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.left && PartyUI.idx % 2 === 1) { PartyUI.idx--; AudioSys.sfx('select'); }
    if (Input.pressed.right && PartyUI.idx % 2 === 0 && PartyUI.idx + 1 < n) { PartyUI.idx++; AudioSys.sfx('select'); }

    if (Input.pressed.b) {
      if (PartyUI.mode === 'battle-must') { AudioSys.sfx('cancel'); return; } // cannot cancel forced switch
      AudioSys.sfx('cancel');
      if (PartyUI.onCancel) PartyUI.onCancel();
      else Game.setState(PartyUI.prevState === 'party' ? 'overworld' : PartyUI.prevState);
      return;
    }
    if (Input.pressed.a) {
      const mon = Game.party[PartyUI.idx];
      if (PartyUI.mode === 'battle-switch' || PartyUI.mode === 'battle-must') {
        if (mon.fainted) { AudioSys.sfx('cancel'); Textbox.say(mon.name + ' has no energy left to battle!'); return; }
        if (mon === Battle.pl.mon && PartyUI.mode === 'battle-switch') { AudioSys.sfx('cancel'); Textbox.say(mon.name + ' is already in battle!'); return; }
        AudioSys.sfx('confirm');
        if (PartyUI.onPick) PartyUI.onPick(PartyUI.idx);
        return;
      }
      if (PartyUI.mode === 'use-item') {
        AudioSys.sfx('confirm');
        if (PartyUI.onPick) PartyUI.onPick(PartyUI.idx);
        return;
      }
      // field: open a small action menu
      AudioSys.sfx('confirm');
      PartyUI.actionMenu(mon);
    }
  },

  actionMenu(mon) {
    const opts = ['Summary', mon.heldItem ? 'Take Item' : 'Give Item', 'Cancel'];
    Textbox.ask('What to do with ' + mon.name + '?', opts, (pick) => {
      Game.setState('party');
      const label = opts[pick];
      if (label === 'Summary') SummaryUI.open(PartyUI.idx);
      else if (label === 'Give Item') {
        BagUI.open({ mode: 'field', startPocket: 'HELD', onCancel: () => Game.setState('party') });
      } else if (label === 'Take Item') {
        const it = mon.heldItem; mon.heldItem = null; Game.give(it);
        AudioSys.sfx('confirm');
        Textbox.say('Took the ' + Items[it].name + ' from ' + mon.name + '.', () => Game.setState('party'));
      }
    });
  },

  draw(ctx) {
    Screen.clear('#3868a8');
    // header
    ctx.fillStyle = '#284878'; ctx.fillRect(0, 0, 240, 12);
    Font.draw(ctx, PartyUI.mode === 'use-item' ? 'Use on which fakemon?' : 'FAKEMON', 6, 2, { color: '#f8f8f8', shadow: '#182838' });
    Game.party.forEach((mon, i) => {
      const x = (i % 2) * 116 + 6, y = 16 + Math.floor(i / 2) * 34;
      PartyUI.drawSlot(ctx, mon, x, y, i === PartyUI.idx);
    });
    Font.draw(ctx, 'A: Select   B: Back', 66, 150, { color: '#f8f8f8', shadow: '#182838' });
  },

  drawSlot(ctx, mon, x, y, sel) {
    ctx.fillStyle = sel ? '#f0e8a0' : '#d8e0e8';
    ctx.fillRect(x, y, 112, 32);
    ctx.fillStyle = sel ? '#c8b850' : '#a8b0b8';
    ctx.fillRect(x, y + 30, 112, 2);
    // icon
    ctx.drawImage(Dex.icon(mon.key), x + 2, y + 6);
    Font.draw(ctx, mon.name, x + 22, y + 3, { color: '#303030', shadow: null });
    Font.draw(ctx, 'Lv' + mon.level, x + 22, y + 12, { color: '#303030', shadow: null });
    if (mon.gender) Font.draw(ctx, mon.gender === 'M' ? '♂' : '♀', x + 60, y + 3, { color: mon.gender === 'M' ? '#3868c8' : '#e05888', shadow: null });
    // hp bar
    const frac = mon.curHp / mon.maxHp;
    ctx.fillStyle = '#404048'; ctx.fillRect(x + 22, y + 22, 62, 5);
    ctx.fillStyle = frac > 0.5 ? '#58d048' : frac > 0.2 ? '#f8c830' : '#f05838';
    ctx.fillRect(x + 23, y + 23, Math.floor(60 * frac), 3);
    Font.draw(ctx, mon.curHp + '/' + mon.maxHp, x + 22, y + 12 + 12, { color: '#303030', shadow: null, maxChars: 20 });
    if (mon.status) BattleUI.drawStatusTag(ctx, x + 88, y + 4, mon.status);
    if (mon.heldItem) ctx.drawImage(ItemIcons.get(mon.heldItem), x + 98, y + 18, 12, 12);
    if (mon.fainted) { ctx.fillStyle = 'rgba(80,80,90,0.35)'; ctx.fillRect(x, y, 112, 32); }
  },
};

const SummaryUI = {
  idx: 0, page: 0, prevState: null,
  open(idx) { SummaryUI.idx = idx; SummaryUI.page = 0; SummaryUI.prevState = Game.state; Game.setState('summary'); },
  update() {
    if (Input.pressed.b) { AudioSys.sfx('cancel'); Game.setState('party'); return; }
    if (Input.pressed.left || Input.pressed.right) { SummaryUI.page = (SummaryUI.page + 1) % 3; AudioSys.sfx('select'); }
    if (Input.pressed.up && SummaryUI.idx > 0) { SummaryUI.idx--; AudioSys.sfx('select'); }
    if (Input.pressed.down && SummaryUI.idx < Game.party.length - 1) { SummaryUI.idx++; AudioSys.sfx('select'); }
  },
  draw(ctx) {
    const mon = Game.party[SummaryUI.idx];
    const def = mon.def;
    Screen.clear('#284878');
    // left: big sprite panel
    UIKit.miniPanel(ctx, 4, 4, 74, 100);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(Dex.sprite(mon.key, 'front'), 7, 20, 64, 64);
    Font.draw(ctx, '#' + Util.padLeft(def.id, 3, '0'), 10, 8, { color: '#585858', shadow: null });
    Font.draw(ctx, mon.name, 10, 88, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, 'Lv' + mon.level + (mon.gender ? ' ' + (mon.gender === 'M' ? '♂' : '♀') : ''), 10, 96, { color: '#383838', shadow: null });
    // type chips
    def.types.forEach((t, i) => {
      ctx.fillStyle = TypeColors[t]; ctx.fillRect(84 + i * 42, 6, 40, 11);
      Font.draw(ctx, t.toUpperCase(), 87 + i * 42, 8, { color: '#fff', shadow: null });
    });

    UIKit.panel(ctx, 82, 20, 154, 122);
    if (SummaryUI.page === 0) {
      Font.draw(ctx, 'INFO', 90, 26, { color: '#c85838', shadow: null });
      const rows = [
        ['Species', def.dex.species], ['OT', mon.ot || Game.playerName],
        ['Nature', mon.nature], ['Ability', abilityName(mon.ability || def.ability)],
        ['Held', mon.heldItem ? Items[mon.heldItem].name : '—'], ['Height', def.dex.h],
      ];
      rows.forEach(([k, v], i) => {
        Font.draw(ctx, k, 90, 40 + i * 15, { color: '#585858', shadow: null });
        Font.draw(ctx, String(v), 150, 40 + i * 15, { color: '#383838', shadow: '#d8d8c8' });
      });
    } else if (SummaryUI.page === 1) {
      Font.draw(ctx, 'STATS', 90, 26, { color: '#c85838', shadow: null });
      const stats = [['HP', mon.maxHp], ['ATTACK', mon.atk], ['DEFENSE', mon.defense],
        ['SP.ATK', mon.spa], ['SP.DEF', mon.spd], ['SPEED', mon.spe]];
      stats.forEach(([k, v], i) => {
        const n = Natures.list[mon.nature];
        const sk = { ATTACK: 'atk', DEFENSE: 'def', 'SP.ATK': 'spa', 'SP.DEF': 'spd', SPEED: 'spe' }[k];
        let col = '#383838';
        if (n.up === sk) col = '#c85838'; if (n.down === sk) col = '#3858c8';
        Font.draw(ctx, k, 90, 40 + i * 15, { color: '#585858', shadow: null });
        Font.draw(ctx, String(v), 150, 40 + i * 15, { color: col, shadow: '#d8d8c8' });
      });
      // exp bar
      Font.draw(ctx, 'EXP', 90, 130, { color: '#585858', shadow: null });
      ctx.fillStyle = '#404048'; ctx.fillRect(114, 132, 110, 4);
      ctx.fillStyle = '#58c8f0'; ctx.fillRect(114, 132, Math.floor(110 * mon.expPct()), 4);
    } else {
      Font.draw(ctx, 'MOVES', 90, 26, { color: '#c85838', shadow: null });
      mon.moves.forEach((slot, i) => {
        const mv = Moves[slot.id];
        ctx.fillStyle = TypeColors[mv.type]; ctx.fillRect(90, 40 + i * 22, 10, 10);
        Font.draw(ctx, mv.name, 104, 40 + i * 22, { color: '#383838', shadow: '#d8d8c8' });
        Font.draw(ctx, 'PP ' + slot.pp + '/' + slot.maxPp, 104, 50 + i * 22, { color: '#585858', shadow: null });
      });
    }
    Font.draw(ctx, '< >: Page   B: Back', 84, 146, { color: '#f8f8f8', shadow: '#182838' });
  },
};
