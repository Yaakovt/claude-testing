'use strict';
/** Bag: pockets (Items, Balls, TMs/HMs, Key), use/toss in field or battle. */
const BagUI = {
  mode: 'field', pocket: 0, idx: 0, scroll: 0, onUse: null, onCancel: null, prevState: null,
  POCKETS: [
    { name: 'ITEMS', kinds: ['medicine', 'battle', 'misc'] },
    { name: 'BALLS', kinds: ['ball'] },
    { name: 'TM/HM', kinds: ['tm'] },
    { name: 'STONES', kinds: ['stone'] },
    { name: 'KEY', kinds: ['key'] },
  ],

  open(opts) {
    BagUI.mode = opts.mode || 'field';
    BagUI.onUse = opts.onUse || null;
    BagUI.onCancel = opts.onCancel || null;
    BagUI.pocket = BagUI.mode === 'battle' ? 0 : 0;
    BagUI.idx = 0; BagUI.scroll = 0;
    BagUI.prevState = Game.state;
    Game.setState('bag');
  },

  list() {
    const kinds = BagUI.POCKETS[BagUI.pocket].kinds;
    return Object.keys(Game.bag)
      .filter((id) => Items[id] && kinds.includes(Items[id].kind) && Game.bag[id] > 0)
      .sort((a, b) => Items[a].name.localeCompare(Items[b].name));
  },

  update() {
    const items = BagUI.list();
    const n = items.length + 1; // + CLOSE
    if (Input.pressed.left) { BagUI.pocket = (BagUI.pocket + BagUI.POCKETS.length - 1) % BagUI.POCKETS.length; BagUI.idx = 0; BagUI.scroll = 0; AudioSys.sfx('select'); }
    if (Input.pressed.right) { BagUI.pocket = (BagUI.pocket + 1) % BagUI.POCKETS.length; BagUI.idx = 0; BagUI.scroll = 0; AudioSys.sfx('select'); }
    if (Input.pressed.up) { BagUI.idx = (BagUI.idx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { BagUI.idx = (BagUI.idx + 1) % n; AudioSys.sfx('select'); }
    if (BagUI.idx < BagUI.scroll) BagUI.scroll = BagUI.idx;
    if (BagUI.idx > BagUI.scroll + 5) BagUI.scroll = BagUI.idx - 5;

    if (Input.pressed.b) { AudioSys.sfx('cancel'); BagUI.close(); return; }
    if (Input.pressed.a) {
      if (BagUI.idx >= items.length) { AudioSys.sfx('cancel'); BagUI.close(); return; }
      const id = items[BagUI.idx];
      AudioSys.sfx('confirm');
      BagUI.useItem(id);
    }
  },

  close() {
    if (BagUI.onCancel) BagUI.onCancel();
    else Game.setState('overworld');
  },

  useItem(id) {
    const item = Items[id];
    if (BagUI.mode === 'battle') {
      if (item.kind === 'ball') { if (BagUI.onUse) BagUI.onUse(id); return; }
      if (item.xstat) { if (BagUI.onUse) BagUI.onUse(id); return; }
      if (item.heal || item.cure || item.revive || item.pp) {
        // choose target
        PartyUI.open({ mode: 'use-item', forItem: id,
          onPick: (ti) => { if (BagUI.onUse) BagUI.onUse(id, ti); },
          onCancel: () => { Game.setState('bag'); } });
        return;
      }
      Textbox.say("You can't use that now.");
      return;
    }
    // field use
    if (item.kind === 'tm') { BagUI.teachFlow(id); return; }
    if (item.kind === 'stone') { BagUI.stoneFlow(id); return; }
    if (item.repel) { Game.repelSteps = item.repel; Game.removeItem(id); AudioSys.sfx('confirm'); Textbox.say('Used ' + item.name + '! Weak fakemon will keep away for a while.'); return; }
    if (item.heal || item.cure || item.revive || item.candy || item.pp) {
      PartyUI.open({ mode: 'use-item', forItem: id,
        onPick: (ti) => {
          const mon = Game.party[ti];
          const ok = Game.applyMedicine(item, mon, (msg) => Textbox.say(msg, () => Game.setState('bag')));
          if (ok) { Game.removeItem(id); AudioSys.sfx('jingle_heal'); }
        },
        onCancel: () => Game.setState('bag') });
      return;
    }
    if (item.kind === 'key') { Textbox.say(item.desc); return; }
    Textbox.say('This item can\'t be used here.');
  },

  teachFlow(id) {
    const move = Items[id].move;
    PartyUI.open({ mode: 'use-item', forItem: id,
      onPick: (ti) => {
        const mon = Game.party[ti];
        if (!mon.canTeachTm(id)) { Textbox.say(mon.name + " can't learn " + Moves[move].name + '.', () => Game.setState('bag')); return; }
        if (mon.knows(move)) { Textbox.say(mon.name + ' already knows ' + Moves[move].name + '.', () => Game.setState('bag')); return; }
        if (mon.moves.length < 4) {
          mon.teach(move);
          if (!Items[id].hm) Game.removeItem(id);
          AudioSys.sfx('jingle_item');
          Textbox.say(mon.name + ' learned ' + Moves[move].name + '!', () => Game.setState('bag'));
        } else {
          MoveForget.open(mon, move, () => { if (!Items[id].hm) Game.removeItem(id); Game.setState('bag'); });
        }
      },
      onCancel: () => Game.setState('bag') });
  },

  stoneFlow(id) {
    PartyUI.open({ mode: 'use-item', forItem: id,
      onPick: (ti) => {
        const mon = Game.party[ti];
        const to = mon.evolveTarget({ stone: id });
        if (to) {
          Game.removeItem(id);
          EvolveScene.play(mon, to, () => Game.setState('overworld'));
        } else {
          Textbox.say('It had no effect on ' + mon.name + '.', () => Game.setState('bag'));
        }
      },
      onCancel: () => Game.setState('bag') });
  },

  draw(ctx) {
    Screen.clear('#48a878');
    // pocket tabs
    ctx.fillStyle = '#387858'; ctx.fillRect(0, 0, 240, 14);
    BagUI.POCKETS.forEach((p, i) => {
      const x = 6 + i * 47;
      if (i === BagUI.pocket) { ctx.fillStyle = '#f0f0e0'; ctx.fillRect(x - 2, 1, 46, 12); }
      Font.draw(ctx, p.name, x, 3, { color: i === BagUI.pocket ? '#383838' : '#c8e0d0', shadow: null });
    });
    UIKit.panel(ctx, 4, 18, 232, 106);
    const items = BagUI.list();
    for (let i = 0; i < 6; i++) {
      const gi = BagUI.scroll + i;
      const y = 26 + i * 15;
      if (gi > items.length) break;
      if (gi === items.length) { Font.draw(ctx, 'CLOSE BAG', 26, y, { color: '#383838', shadow: '#d8d8c8' }); }
      else {
        const id = items[gi];
        Font.draw(ctx, Items[id].name, 26, y, { color: '#383838', shadow: '#d8d8c8' });
        if (Items[id].kind !== 'key' && !Items[id].hm) {
          const q = '×' + Game.bag[id];
          Font.draw(ctx, q, 224 - Font.width(q), y, { color: '#383838', shadow: '#d8d8c8' });
        }
      }
      if (gi === BagUI.idx) Font.draw(ctx, '▶', 14, y, { color: '#e83030', shadow: null });
    }
    // description
    UIKit.miniPanel(ctx, 4, 126, 232, 30);
    const selId = BagUI.idx < items.length ? items[BagUI.idx] : null;
    if (selId) UIKit.wrapText(ctx, Items[selId].desc, 10, 132, 222, { color: '#383838', shadow: null });
    else Font.draw(ctx, 'Close the bag.', 10, 132, { color: '#383838', shadow: null });
  },
};

// move-forget prompt when learning a 5th move
const MoveForget = {
  open(mon, move, done) {
    MoveForget.mon = mon; MoveForget.move = move; MoveForget.done = done; MoveForget.idx = 0;
    Game.setState('moveforget');
  },
  update() {
    const n = 5;
    if (Input.pressed.up) { MoveForget.idx = (MoveForget.idx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { MoveForget.idx = (MoveForget.idx + 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.b) { AudioSys.sfx('cancel'); Textbox.say('Gave up teaching ' + Moves[MoveForget.move].name + '.', MoveForget.done); return; }
    if (Input.pressed.a) {
      AudioSys.sfx('confirm');
      if (MoveForget.idx === 4) { Textbox.say('Gave up.', MoveForget.done); return; }
      const old = Moves[MoveForget.mon.moves[MoveForget.idx].id].name;
      MoveForget.mon.teach(MoveForget.move, MoveForget.idx);
      Textbox.say('Forgot ' + old + ' and learned ' + Moves[MoveForget.move].name + '!', MoveForget.done);
    }
  },
  draw(ctx) {
    Screen.clear('#284878');
    UIKit.panel(ctx, 40, 30, 160, 100);
    Font.draw(ctx, 'Forget which move?', 50, 38, { color: '#383838', shadow: '#d8d8c8' });
    MoveForget.mon.moves.forEach((slot, i) => {
      Font.draw(ctx, Moves[slot.id].name, 62, 54 + i * 13, { color: '#383838', shadow: '#d8d8c8' });
      if (MoveForget.idx === i) Font.draw(ctx, '▶', 52, 54 + i * 13, { color: '#e83030', shadow: null });
    });
    Font.draw(ctx, 'GIVE UP', 62, 54 + 4 * 13, { color: '#383838', shadow: '#d8d8c8' });
    if (MoveForget.idx === 4) Font.draw(ctx, '▶', 52, 54 + 4 * 13, { color: '#e83030', shadow: null });
  },
};
