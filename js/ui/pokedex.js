'use strict';
/** Pokedex: scrollable list of seen species + a detail page with the entry. */
const PokedexUI = {
  idx: 0, scroll: 0, detail: false, prevState: null,

  open() { PokedexUI.idx = 0; PokedexUI.scroll = 0; PokedexUI.detail = false; PokedexUI.prevState = Game.state; Game.setState('pokedex'); },

  update() {
    const n = Dex.count();
    if (PokedexUI.detail) {
      if (Input.pressed.b || Input.pressed.a) { AudioSys.sfx('cancel'); PokedexUI.detail = false; }
      if (Input.pressed.up) { PokedexUI.move(-1); }
      if (Input.pressed.down) { PokedexUI.move(1); }
      return;
    }
    if (Input.pressed.up) { PokedexUI.move(-1); AudioSys.sfx('select'); }
    if (Input.pressed.down) { PokedexUI.move(1); AudioSys.sfx('select'); }
    if (Input.pressed.left) { for (let i = 0; i < 7; i++) PokedexUI.move(-1); AudioSys.sfx('select'); }
    if (Input.pressed.right) { for (let i = 0; i < 7; i++) PokedexUI.move(1); AudioSys.sfx('select'); }
    if (Input.pressed.b) { AudioSys.sfx('cancel'); Game.setState(PokedexUI.prevState === 'pokedex' ? 'overworld' : 'startmenu'); return; }
    if (Input.pressed.a) {
      const key = Dex.byId[PokedexUI.idx + 1].key;
      if (Game.dexSeen[key]) { AudioSys.sfx('confirm'); PokedexUI.detail = true; AudioSys.cry(Dex.byKey[key].cry); }
      else AudioSys.sfx('cancel');
    }
  },

  move(d) {
    const n = Dex.count();
    PokedexUI.idx = Util.clamp(PokedexUI.idx + d, 0, n - 1);
    if (PokedexUI.idx < PokedexUI.scroll) PokedexUI.scroll = PokedexUI.idx;
    if (PokedexUI.idx > PokedexUI.scroll + 6) PokedexUI.scroll = PokedexUI.idx - 6;
  },

  draw(ctx) {
    Screen.clear('#c83838');
    if (PokedexUI.detail) { PokedexUI.drawDetail(ctx); return; }
    // header
    ctx.fillStyle = '#a02828'; ctx.fillRect(0, 0, 240, 14);
    Font.draw(ctx, 'POKEDEX', 6, 3, { color: '#f8f8f8', shadow: '#601818' });
    const cnt = Game.dexSeenCount() + ' seen  ' + Game.dexCaughtCount() + ' caught';
    Font.draw(ctx, cnt, 234 - Font.width(cnt), 3, { color: '#f8f8f8', shadow: '#601818' });
    // list
    UIKit.panel(ctx, 4, 18, 150, 138);
    for (let i = 0; i < 7; i++) {
      const id = PokedexUI.scroll + i + 1;
      if (id > Dex.count()) break;
      const def = Dex.byId[id];
      const seen = Game.dexSeen[def.key];
      const y = 26 + i * 18;
      const name = seen ? def.name : '-----';
      Font.draw(ctx, '#' + Util.padLeft(id, 3, '0'), 26, y, { color: '#585858', shadow: null });
      if (Game.dexCaught[def.key]) { ctx.fillStyle = '#e04838'; ctx.fillRect(50, y, 4, 7); ctx.fillStyle = '#f0f0f0'; ctx.fillRect(50, y + 3, 4, 1); }
      Font.draw(ctx, name, 60, y, { color: seen ? '#383838' : '#a0a0a0', shadow: '#d8d8c8' });
      if (id - 1 === PokedexUI.idx) Font.draw(ctx, '▶', 14, y, { color: '#f8d048', shadow: '#601818' });
    }
    // preview
    const cur = Dex.byId[PokedexUI.idx + 1];
    UIKit.panel(ctx, 158, 18, 78, 138);
    if (Game.dexSeen[cur.key]) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(Dex.sprite(cur.key, 'front'), 165, 40, 64, 64);
      Font.draw(ctx, cur.name, 197 - Font.width(cur.name) / 2, 110, { color: '#383838', shadow: '#d8d8c8' });
      cur.types.forEach((t, i) => { ctx.fillStyle = TypeColors[t]; ctx.fillRect(165 + i * 34, 122, 32, 10); Font.draw(ctx, t.slice(0, 5).toUpperCase(), 167 + i * 34, 123, { color: '#fff', shadow: null }); });
    } else {
      Font.draw(ctx, '?', 193, 60, { color: '#a0a0a0', shadow: null });
    }
    Font.draw(ctx, 'A: Info', 165, 142, { color: '#383838', shadow: null });
  },

  drawDetail(ctx) {
    const def = Dex.byId[PokedexUI.idx + 1];
    Screen.clear('#f0f0e0');
    ctx.fillStyle = '#c83838'; ctx.fillRect(0, 0, 240, 16);
    Font.draw(ctx, '#' + Util.padLeft(def.id, 3, '0') + '  ' + def.name, 6, 4, { color: '#f8f8f8', shadow: '#601818' });
    // sprite
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(Dex.sprite(def.key, 'front'), 8, 24, 72, 72);
    // species + measures
    Font.draw(ctx, def.dex.species, 90, 26, { color: '#383838', shadow: null });
    Font.draw(ctx, 'HT ' + def.dex.h, 90, 40, { color: '#585858', shadow: null });
    Font.draw(ctx, 'WT ' + def.dex.w, 160, 40, { color: '#585858', shadow: null });
    def.types.forEach((t, i) => { ctx.fillStyle = TypeColors[t]; ctx.fillRect(90 + i * 44, 52, 42, 11); Font.draw(ctx, t.toUpperCase(), 93 + i * 44, 54, { color: '#fff', shadow: null }); });
    // ability + evolution
    Font.draw(ctx, 'ABILITY  ' + abilityName(def.ability), 90, 68, { color: '#585858', shadow: null });
    Font.draw(ctx, 'EVOLUTION', 90, 80, { color: '#c85838', shadow: null });
    UIKit.wrapText(ctx, Dex.evoText(def.key), 90, 90, 144, { color: '#383838', shadow: null });
    // entry
    UIKit.panel(ctx, 6, 116, 228, 40);
    UIKit.wrapText(ctx, def.dex.entry, 12, 122, 216, { color: '#383838', shadow: null });
  },
};
