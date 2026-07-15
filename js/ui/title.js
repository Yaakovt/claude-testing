'use strict';
/**
 * Title screen with an animated opening: aurora over a snowfield, a rising
 * Auroryx silhouette, snow, then the logo and menu (New Game / Continue).
 */
const Title = {
  t: 0, menu: false, idx: 0, snow: [], stars: [],

  open() {
    Title.t = 0; Title.menu = false; Title.idx = 0;
    Title.snow = [];
    for (let i = 0; i < 40; i++) Title.snow.push({ x: Util.rand(240), y: Util.rand(160), s: 0.4 + Math.random() });
    Title.stars = [];
    for (let i = 0; i < 30; i++) Title.stars.push({ x: Util.rand(240), y: Util.rand(70), p: Math.random() });
    Music.play('title');
  },

  update() {
    Title.t++;
    for (const f of Title.snow) { f.y += f.s; f.x += Math.sin(Title.t / 40 + f.y) * 0.3; if (f.y > 160) { f.y = -4; f.x = Util.rand(240); } }
    if (!Title.menu) {
      if (Title.t > 150 && (Input.pressed.a || Input.pressed.start)) { AudioSys.sfx('confirm'); Title.menu = true; }
      return;
    }
    const options = Game.hasSave() ? 2 : 1;
    if (Input.pressed.up || Input.pressed.down) { Title.idx = (Title.idx + 1) % options; AudioSys.sfx('select'); }
    if (Input.pressed.a) {
      AudioSys.sfx('confirm');
      if (Game.hasSave() && Title.idx === 0) {
        Game.load();
        Overworld.boot();
        Overworld.showBanner();
        Game.setState('overworld');
      } else {
        Intro.open();
      }
    }
  },

  draw(ctx) {
    // sky gradient (night)
    for (let y = 0; y < 160; y++) {
      const t = y / 160;
      ctx.fillStyle = Px.rgbToHex(Util.lerp(16, 40, t), Util.lerp(20, 52, t), Util.lerp(46, 78, t));
      ctx.fillRect(0, y, 240, 1);
    }
    // stars
    for (const s of Title.stars) {
      const tw = 0.5 + 0.5 * Math.sin(Title.t / 20 + s.p * 6);
      ctx.globalAlpha = tw; ctx.fillStyle = '#e8ecff';
      ctx.fillRect(s.x, s.y, 1, 1); ctx.globalAlpha = 1;
    }
    // aurora ribbons
    for (let i = 0; i < 3; i++) {
      const col = ['#59e6b8', '#8d7bf0', '#f08bd8'][i];
      ctx.globalAlpha = 0.55;
      for (let x = 0; x < 240; x += 2) {
        const y = 24 + i * 10 + Math.sin(x / 24 + i * 2 + Title.t / 30) * 10;
        ctx.fillStyle = col; ctx.fillRect(x, y, 2, 6);
      }
      ctx.globalAlpha = 1;
    }
    // Auroryx silhouette rising (fades in over first ~120 frames)
    const rise = Util.clamp((Title.t - 30) / 90, 0, 1);
    if (rise > 0) {
      ctx.globalAlpha = rise * 0.9;
      const spr = Dex.sprite('auroryx', 'front');
      const y = Util.lerp(120, 74, rise);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(spr, 88, y, 64, 64);
      ctx.globalAlpha = 1;
    }
    // snowfield foreground
    ctx.fillStyle = '#e8f0f8'; ctx.fillRect(0, 132, 240, 28);
    ctx.fillStyle = '#d0e0ee';
    ctx.beginPath(); ctx.moveTo(0, 138); ctx.quadraticCurveTo(120, 128, 240, 140); ctx.lineTo(240, 160); ctx.lineTo(0, 160); ctx.fill();
    // snow
    ctx.fillStyle = '#ffffff';
    for (const f of Title.snow) ctx.fillRect(f.x | 0, f.y | 0, f.s > 1 ? 2 : 1, f.s > 1 ? 2 : 1);

    // logo
    if (Title.t > 40) {
      Title.drawLogo(ctx, 120, 34, Util.clamp((Title.t - 40) / 30, 0, 1));
    }

    if (!Title.menu) {
      if (Title.t > 150 && (Game.frame >> 4) & 1) {
        const s = 'PRESS  START';
        Font.draw(ctx, s, 120 - Font.width(s) / 2, 120, { color: '#f8f8f8', shadow: '#304060' });
      }
    } else {
      const opts = Game.hasSave() ? ['CONTINUE', 'NEW GAME'] : ['NEW GAME'];
      const bx = 80, by = 104, bw = 80;
      UIKit.panel(ctx, bx, by, bw, opts.length * 15 + 8);
      opts.forEach((o, i) => {
        Font.draw(ctx, o, bx + 18, by + 6 + i * 15, { color: '#383838', shadow: '#d8d8c8' });
        if (Title.idx === i) Font.draw(ctx, '▶', bx + 8, by + 6 + i * 15, { color: '#e83030', shadow: null });
      });
    }
  },

  drawLogo(ctx, cx, y, a) {
    ctx.globalAlpha = a;
    // "LEGENDS OF" small
    const s1 = 'LEGENDS OF';
    Font.draw(ctx, s1, cx - Font.width(s1) / 2, y - 12, { color: '#f8e8b0', shadow: '#604020' });
    // "NORVENNA" big (draw scaled font glyphs)
    const s2 = 'NORVENNA';
    ctx.save();
    ctx.translate(cx, y + 6);
    ctx.scale(2.2, 2.4);
    const w = Font.width(s2);
    Font.draw(ctx, s2, -w / 2, -3, { color: '#8fe8ff', shadow: '#204058' });
    ctx.restore();
    // underline sparkle
    ctx.fillStyle = '#f8f8d0';
    ctx.fillRect(cx - 52, y + 22, 104, 1);
    ctx.globalAlpha = 1;
  },
};
