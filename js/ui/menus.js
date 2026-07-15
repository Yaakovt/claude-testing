'use strict';
/** Start menu, Pokemart shop, Pokecenter heal animation, evolution scene. */

const StartMenu = {
  open: false,
  idx: 0,
  items: [],

  update() {},

  buildItems() {
    StartMenu.items = [];
    if (Game.dexSeenCount() > 0) StartMenu.items.push('POKEDEX');
    StartMenu.items.push('FAKEMON');
    StartMenu.items.push('BAG');
    StartMenu.items.push('TRAINER');
    StartMenu.items.push('SAVE');
    StartMenu.items.push('EXIT');
  },

  openMenu() {
    StartMenu.buildItems();
    StartMenu.idx = 0;
    Game.setState('startmenu');
  },

  tick() {
    const n = StartMenu.items.length;
    if (Input.pressed.up) { StartMenu.idx = (StartMenu.idx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { StartMenu.idx = (StartMenu.idx + 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.b || Input.pressed.start) { AudioSys.sfx('cancel'); Game.setState('overworld'); return; }
    if (Input.pressed.a) {
      AudioSys.sfx('confirm');
      const sel = StartMenu.items[StartMenu.idx];
      switch (sel) {
        case 'POKEDEX': PokedexUI.open(); break;
        case 'FAKEMON': PartyUI.open({ mode: 'field', onCancel: () => Game.setState('startmenu') }); break;
        case 'BAG': BagUI.open({ mode: 'field', onCancel: () => Game.setState('startmenu') }); break;
        case 'TRAINER': TrainerCard.open(); break;
        case 'SAVE': StartMenu.doSave(); break;
        case 'EXIT': Game.setState('overworld'); break;
      }
    }
  },

  doSave() {
    Textbox.ask('Would you like to save your adventure?', ['Yes', 'No'], (pick) => {
      if (pick === 0) {
        const ok = Game.save();
        AudioSys.sfx('save');
        Textbox.say(ok ? Game.playerName + ' saved the game!' : 'Saving failed!', () => Game.setState('startmenu'));
      } else Game.setState('startmenu');
    });
  },

  draw(ctx) {
    const n = StartMenu.items.length;
    const w = 78, h = n * 14 + 8, x = 240 - w - 4, y = 4;
    UIKit.panel(ctx, x, y, w, h);
    StartMenu.items.forEach((it, i) => {
      Font.draw(ctx, it, x + 16, y + 6 + i * 14, { color: '#383838', shadow: '#d8d8c8' });
      if (StartMenu.idx === i) Font.draw(ctx, '▶', x + 6, y + 6 + i * 14, { color: '#e83030', shadow: null });
    });
  },
};
// route StartMenu.update through tick when active
StartMenu.open = function () { StartMenu.openMenu(); };
StartMenu.update = function () { StartMenu.tick(); };

// -------------------------------------------------------------- Pokemart
const Mart = {
  active: false, stock: [], idx: 0, onClose: null, mode: 'buy', qty: 1, scroll: 0,

  open(stock, onClose) {
    Mart.stock = stock; Mart.idx = 0; Mart.scroll = 0; Mart.onClose = onClose; Mart.active = true;
    Mart.mode = 'menu';
    Textbox.ask('Welcome! How can I help you?', ['Buy', 'Sell', 'Leave'], (pick) => {
      if (pick === 0) { Mart.mode = 'buy'; Mart.state = 'mart'; Game.setState('mart'); }
      else if (pick === 1) { Mart.sellFlow(); }
      else { Mart.active = false; if (onClose) onClose(); }
    });
  },

  sellFlow() {
    // Simplified: sell handled through bag in a full build; acknowledge here.
    Textbox.say('Hmm, you have nothing I need right now. Come back after your journey!', () => {
      Mart.active = false; if (Mart.onClose) Mart.onClose();
    });
  },

  update() {
    const list = Mart.stock;
    const n = list.length + 1; // + CANCEL
    if (Input.pressed.up) { Mart.idx = (Mart.idx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { Mart.idx = (Mart.idx + 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.b) { AudioSys.sfx('cancel'); Mart.active = false; Game.setState('overworld'); if (Mart.onClose) Mart.onClose(); return; }
    if (Input.pressed.a) {
      if (Mart.idx === list.length) { AudioSys.sfx('cancel'); Mart.active = false; Game.setState('overworld'); if (Mart.onClose) Mart.onClose(); return; }
      AudioSys.sfx('confirm');
      const id = list[Mart.idx];
      const price = Items[id].price;
      Mart.buyQty(id, price);
    }
  },

  buyQty(id, price) {
    let qty = 1;
    const max = Math.min(99, Math.floor(Game.money / price) || 1);
    const ask = () => {
      Game.setState('mart');
      Mart.qtyPrompt = { id, qty, price, max };
    };
    Mart.qtyPrompt = { id, qty, price, max };
    Game.setState('mart_qty');
  },

  draw(ctx) {
    Screen.clear('#4868a8');
    // shelf backdrop
    ctx.fillStyle = '#587bb8'; ctx.fillRect(0, 0, 240, 120);
    UIKit.panel(ctx, 6, 6, 150, 118);
    const list = Mart.stock;
    const rows = Math.min(6, list.length + 1);
    for (let i = 0; i < rows; i++) {
      const gi = Mart.scroll + i;
      if (gi > list.length) break;
      const y = 14 + i * 16;
      if (gi === list.length) {
        Font.draw(ctx, 'CANCEL', 22, y, { color: '#383838', shadow: '#d8d8c8' });
      } else {
        const id = list[gi];
        ctx.drawImage(ItemIcons.get(id), 20, y - 5, 12, 12);
        Font.draw(ctx, Items[id].name, 36, y, { color: '#383838', shadow: '#d8d8c8' });
        const p = '$' + Items[id].price;
        Font.draw(ctx, p, 150 - Font.width(p), y, { color: '#383838', shadow: '#d8d8c8' });
      }
      if (Mart.idx === gi) Font.draw(ctx, '▶', 12, y, { color: '#e83030', shadow: null });
    }
    // money + description
    UIKit.miniPanel(ctx, 162, 6, 72, 22);
    Font.draw(ctx, 'MONEY', 168, 10, { color: '#585858', shadow: null });
    const mn = '$' + Game.money;
    Font.draw(ctx, mn, 230 - Font.width(mn), 18, { color: '#383838', shadow: '#d8d8c8' });
    UIKit.panel(ctx, 6, 126, 228, 30);
    const selId = Mart.idx < list.length ? list[Mart.idx] : null;
    if (selId) UIKit.wrapText(ctx, Items[selId].desc, 12, 132, 220, { color: '#383838', shadow: '#d8d8c8' });
    else Font.draw(ctx, 'See you later!', 12, 132, { color: '#383838', shadow: '#d8d8c8' });
  },
};

// quantity sub-state
const MartQty = {
  update() {
    const q = Mart.qtyPrompt;
    if (Input.pressed.up) { q.qty = Math.min(q.max, q.qty + 1); AudioSys.sfx('select'); }
    if (Input.pressed.down) { q.qty = Math.max(1, q.qty - 1); AudioSys.sfx('select'); }
    if (Input.pressed.right) { q.qty = Math.min(q.max, q.qty + 10); AudioSys.sfx('select'); }
    if (Input.pressed.left) { q.qty = Math.max(1, q.qty - 10); AudioSys.sfx('select'); }
    if (Input.pressed.b) { AudioSys.sfx('cancel'); Game.setState('mart'); return; }
    if (Input.pressed.a) {
      const total = q.qty * q.price;
      if (total > Game.money) { AudioSys.sfx('cancel'); Textbox.say("You don't have enough money.", () => Game.setState('mart')); return; }
      AudioSys.sfx('confirm');
      Game.money -= total; Game.give(q.id, q.qty);
      Textbox.say('Here you go! ' + q.qty + '× ' + Items[q.id].name + '. Thank you!', () => Game.setState('mart'));
    }
  },
  draw(ctx) {
    Mart.draw(ctx);
    const q = Mart.qtyPrompt;
    UIKit.panel(ctx, 70, 60, 100, 40);
    Font.draw(ctx, Items[q.id].name, 78, 66, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, '×' + Util.padLeft(q.qty, 2), 78, 80, { color: '#383838', shadow: '#d8d8c8' });
    const tot = '$' + (q.qty * q.price);
    Font.draw(ctx, tot, 162 - Font.width(tot), 80, { color: '#383838', shadow: '#d8d8c8' });
  },
};

// -------------------------------------------------------------- Heal animation
const HealAnim = {
  playing: false, t: 0, cb: null, n: 0,
  play(cb) { HealAnim.playing = true; HealAnim.t = 0; HealAnim.cb = cb; HealAnim.n = Game.party.length; HealAnim.overlay(); },
  overlay() {
    // Reuse the overworld draw but flash orbs; runs on a short timer via Textbox-less loop.
    const step = () => {
      HealAnim.t++;
      if (HealAnim.t < 40) { AudioSys.voice({ wave: 'sine', freq: 660 + (HealAnim.t % HealAnim.n) * 80, dur: 0.1, vol: 0.12 }); requestAnimationFrame(step); }
      else { HealAnim.playing = false; if (HealAnim.cb) HealAnim.cb(); }
    };
    if (HealAnim.t === 0) step();
  },
};

// -------------------------------------------------------------- Evolution scene
const EvolveScene = {
  play(mon, toKey, done) {
    Game.setState('evolve');
    EvolveScene.cur = { mon, toKey, done, t: 0, cancelled: false, fromKey: mon.key };
    Music.play('evolve');
  },
  update() {
    const e = EvolveScene.cur;
    if (!e) { Game.setState('overworld'); return; }
    e.t++;
    if (Input.pressed.b && e.t < 120) { e.cancelled = true; }
    if (e.t === 150) {
      if (e.cancelled) {
        Textbox.say('Huh? ' + Dex.byKey[e.fromKey].name + ' stopped evolving!', () => { EvolveScene.finish(); });
      } else {
        const newName = Dex.byKey[e.toKey].name;
        AudioSys.sfx('levelup');
        e.mon.evolveInto(e.toKey);
        Game.registerDex(e.toKey, 'caught');
        AudioSys.cry(Dex.byKey[e.toKey].cry);
        Textbox.say('Congratulations! Your ' + Dex.byKey[e.fromKey].name + ' evolved into ' + newName + '!', () => {
          // learn new moves at current level
          const learns = e.mon.movesAt(e.mon.level);
          EvolveScene.finish();
        });
      }
    }
  },
  finish() {
    const cb = EvolveScene.cur ? EvolveScene.cur.done : null;
    EvolveScene.cur = null;
    Game.setState('overworld');
    Music.play(Overworld.currentMusic());
    if (cb) cb();
  },
  draw(ctx) {
    const e = EvolveScene.cur;
    Screen.clear('#101018');
    if (!e) return;
    const key = (e.t % 20 < 10 && e.t < 150 && !e.cancelled && e.t > 30) ? e.toKey : e.fromKey;
    const spr = Dex.sprite(e.t > 140 && !e.cancelled ? e.toKey : key, 'front');
    const scale = 1 + Math.sin(e.t / 8) * 0.04;
    ctx.save();
    ctx.translate(120, 70);
    // glow burst near the swap
    if (e.t > 40 && e.t < 150) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(e.t / 3);
      ctx.fillStyle = '#f8f8d0';
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 + e.t / 10;
        ctx.fillRect(Math.cos(a) * 30 - 1, Math.sin(a) * 30 - 1, 2, 40);
      }
      ctx.globalAlpha = 1;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, -32 * scale, -32 * scale, 64 * scale, 64 * scale);
    ctx.restore();
    Font.draw(ctx, 'What?  ' + Dex.byKey[e.fromKey].name + ' is evolving!', 20, 130, { color: '#f8f8f8', shadow: '#303040' });
  },
};

// -------------------------------------------------------------- Trainer card
const TrainerCard = {
  open() { Game.setState('trainercard'); },
  update() { if (Input.pressed.a || Input.pressed.b) { AudioSys.sfx('cancel'); Game.setState('startmenu'); } },
  draw(ctx) {
    Screen.clear('#204068');
    UIKit.panel(ctx, 12, 12, 216, 136);
    Font.draw(ctx, 'TRAINER CARD', 24, 22, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, 'NAME  ' + Game.playerName + ' ' + (Game.gender === 'F' ? '♀' : '♂'), 24, 40, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, 'MONEY  $' + Game.money, 24, 54, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, 'DEX  ' + Game.dexCaughtCount() + '/' + Dex.count() + ' caught', 24, 68, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, 'TIME  ' + Game.timeString(), 24, 82, { color: '#383838', shadow: '#d8d8c8' });
    // BP + Battle Tower honors (right column)
    Font.draw(ctx, 'BP  ' + (Game.bp || 0), 150, 40, { color: '#383838', shadow: '#d8d8c8' });
    if (Game.flags.towerBest) Font.draw(ctx, 'TOWER  ' + Game.flags.towerBest, 150, 54, { color: '#383838', shadow: '#d8d8c8' });
    if (Game.flags.towerTitle) Font.draw(ctx, Game.flags.towerTitle, 150, 68, { color: '#c05028', shadow: '#f0e0c0' });
    Font.draw(ctx, 'BADGES', 24, 100, { color: '#383838', shadow: '#d8d8c8' });
    for (let i = 0; i < 8; i++) {
      const x = 24 + i * 24, y = 112;
      ctx.fillStyle = Game.badges[i] ? '#f8d048' : '#404850';
      ctx.beginPath(); ctx.arc(x + 6, y + 8, 7, 0, Math.PI * 2); ctx.fill();
      if (Game.badges[i]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 4, y + 6, 2, 0, Math.PI * 2); ctx.fill(); }
    }
    Font.draw(ctx, 'B: Back', 170, 132, { color: '#383838', shadow: '#d8d8c8' });
  },
};
