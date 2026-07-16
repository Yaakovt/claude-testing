'use strict';
/**
 * Starter selection screen — shows all three partners at once with their
 * sprites, names, and type badges, so the choice is visual instead of a
 * cramped text menu. Left/Right to browse, A to choose (confirm Yes/No),
 * B does nothing (you must pick one). Calls onChoose(key) once confirmed.
 */
const StarterSelect = {
  keys: ['trollsprout', 'cindrel', 'selkip'],
  idx: 0, onChoose: null, t: 0,

  open(onChoose) {
    StarterSelect.onChoose = onChoose;
    StarterSelect.idx = 0; StarterSelect.t = 0;
    Game.setState('starter');
    AudioSys.sfx('confirm');
  },

  update() {
    StarterSelect.t++;
    if (Input.pressed.left) { StarterSelect.idx = (StarterSelect.idx + 2) % 3; AudioSys.sfx('select'); }
    if (Input.pressed.right) { StarterSelect.idx = (StarterSelect.idx + 1) % 3; AudioSys.sfx('select'); }
    if (Input.pressed.a) {
      const key = StarterSelect.keys[StarterSelect.idx];
      const d = Dex.byKey[key];
      Game.registerDex(key, 'seen');
      AudioSys.cry(d.cry);
      Textbox.ask('The ' + d.dex.species + ', ' + d.name + '. Choose ' + d.name + ' as your partner?', ['Yes', 'No'], (yn) => {
        if (yn === 0) {
          const cb = StarterSelect.onChoose; StarterSelect.onChoose = null;
          if (cb) cb(key);
        }
        // No -> Textbox closes, StarterSelect.update resumes so they can rebrowse
      });
    }
  },

  draw(ctx) {
    // aurora-lab backdrop: cool vertical gradient + a couple of aurora bands
    for (let y = 0; y < 160; y++) {
      const f = y / 160;
      ctx.fillStyle = Px.rgbToHex(Util.lerp(30, 46, f), Util.lerp(38, 40, f), Util.lerp(64, 58, f));
      ctx.fillRect(0, y, 240, 1);
    }
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = ['#59e6b8', '#8d7bf0'][i];
      for (let x = 0; x < 240; x += 2) {
        const y = 12 + i * 8 + Math.sin(x / 30 + i * 2 + StarterSelect.t / 40) * 5;
        ctx.fillRect(x, y, 2, 4);
      }
      ctx.globalAlpha = 1;
    }
    Font.draw(ctx, 'CHOOSE YOUR PARTNER', 120 - Font.width('CHOOSE YOUR PARTNER') / 2, 8, { color: '#f8e8b0', shadow: '#402c18' });

    // three cards, centered at x = 44 / 120 / 196
    const cxs = [44, 120, 196];
    for (let i = 0; i < 3; i++) {
      const key = StarterSelect.keys[i], d = Dex.byKey[key];
      const cx = cxs[i], sel = i === StarterSelect.idx;
      const cardW = 66, cardX = cx - cardW / 2, cardY = 24, cardH = 92;
      // card plate — selected one is brighter and lifts slightly
      const lift = sel ? Math.round(Math.sin(StarterSelect.t / 8) * 1.5) - 2 : 0;
      UIKit.miniPanel(ctx, cardX, cardY + lift, cardW, cardH);
      if (sel) { ctx.strokeStyle = '#f8d048'; ctx.lineWidth = 2; ctx.strokeRect(cardX + 1, cardY + lift + 1, cardW - 2, cardH - 2); }
      // sprite (48x48, greyed if not selected for focus)
      const spr = Dex.sprite(key, 'front');
      ctx.imageSmoothingEnabled = false;
      if (!sel) ctx.globalAlpha = 0.7;
      ctx.drawImage(spr, 0, 0, 64, 64, cx - 24, cardY + lift + 6, 48, 48);
      ctx.globalAlpha = 1;
      // name
      Font.draw(ctx, d.name, cx - Font.width(d.name) / 2, cardY + lift + 58, { color: '#303038', shadow: '#e8e0c8' });
      // type badge(s), centered
      const tw = d.types.length * 34 - 4;
      d.types.forEach((t, ti) => {
        const bx = cx - tw / 2 + ti * 34;
        ctx.fillStyle = TypeColors[t] || '#888'; ctx.fillRect(bx, cardY + lift + 70, 30, 10);
        const label = t.slice(0, 5).toUpperCase();
        Font.draw(ctx, label, bx + (30 - Font.width(label)) / 2, cardY + lift + 71, { color: '#fff', shadow: null });
      });
    }

    // info panel: selected mon's species + a hint line
    const d = Dex.byKey[StarterSelect.keys[StarterSelect.idx]];
    UIKit.panel(ctx, 6, 122, 228, 32);
    Font.draw(ctx, d.name + ' - the ' + d.dex.species, 14, 128, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, '< >  Select      A: Choose', 14, 140, { color: '#585868', shadow: '#d8d8c8' });
  },
};
