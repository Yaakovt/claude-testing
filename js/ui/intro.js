'use strict';
/**
 * New-game intro: Professor Aspen welcomes the player, then gender select and
 * on-screen name entry. Ends by booting the overworld in Frosthollow.
 */
const Intro = {
  t: 0, stage: 0,

  open() {
    Intro.t = 0; Intro.stage = 0;
    Game.setState('intro');
    Music.play('intro');
    const lines = [
      'Welcome to the world of NORVENNA!',
      'My name is ASPEN. Everyone calls me the fakemon Professor.',
      'This northern land lives beneath a shimmering aurora... the light of a sleeping legend.',
      'Creatures we call FAKEMON share every forest, shore, and snowfield with us.',
      'Some folk keep them as partners. Some study them. And some... would misuse them.',
      'But first — I feel I already know you. Tell me a little about yourself!',
    ];
    let i = 0;
    const step = () => {
      if (i < lines.length) { Textbox.say(lines[i++], step); }
      else { Naming.open('gender'); }
    };
    step();
  },

  update() { Intro.t++; },

  draw(ctx) {
    Screen.clear('#101830');
    // soft aurora backdrop
    for (let k = 0; k < 3; k++) {
      const col = ['#59e6b8', '#8d7bf0', '#f08bd8'][k];
      ctx.globalAlpha = 0.4;
      for (let x = 0; x < 240; x += 3) {
        const y = 20 + k * 12 + Math.sin(x / 26 + k + Intro.t / 34) * 9;
        ctx.fillStyle = col; ctx.fillRect(x, y, 3, 5);
      }
      ctx.globalAlpha = 1;
    }
    // Professor sprite (big, centered upper)
    ctx.imageSmoothingEnabled = false;
    const prof = Chars.get('prof', 'down', (Intro.t >> 4) & 1);
    ctx.save(); ctx.translate(120, 56); ctx.scale(3, 3);
    ctx.drawImage(prof, -8, -11); ctx.restore();
    Font.draw(ctx, 'PROF. ASPEN', 120 - Font.width('PROF. ASPEN') / 2, 108, { color: '#f8f8f8', shadow: '#203050' });
  },
};

const Naming = {
  mode: 'gender', gender: 'M', name: '', cursor: 0, prof: false,
  preset: { M: ['Aksel', 'Bjorn', 'Erik', 'Leif'], F: ['Astrid', 'Freya', 'Ingrid', 'Sigrid'] },
  KB: ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ....', 'abcdefghij', 'klmnopqrst', 'uvwxyz    '],
  kbx: 0, kby: 0, presetIdx: 0,

  open(mode) {
    Naming.mode = mode || 'gender';
    Naming.name = '';
    Game.setState('naming');
  },

  update() {
    if (Naming.mode === 'gender') {
      if (Input.pressed.left || Input.pressed.right) { Naming.gender = Naming.gender === 'M' ? 'F' : 'M'; AudioSys.sfx('select'); }
      if (Input.pressed.a) { AudioSys.sfx('confirm'); Game.gender = Naming.gender; Naming.mode = 'preset'; Naming.presetIdx = 0; }
      return;
    }
    if (Naming.mode === 'preset') {
      const opts = Naming.preset[Naming.gender].concat(['Type your own...']);
      if (Input.pressed.up) { Naming.presetIdx = (Naming.presetIdx + opts.length - 1) % opts.length; AudioSys.sfx('select'); }
      if (Input.pressed.down) { Naming.presetIdx = (Naming.presetIdx + 1) % opts.length; AudioSys.sfx('select'); }
      if (Input.pressed.b) { AudioSys.sfx('cancel'); Naming.mode = 'gender'; return; }
      if (Input.pressed.a) {
        AudioSys.sfx('confirm');
        if (Naming.presetIdx < opts.length - 1) { Game.playerName = opts[Naming.presetIdx]; Naming.finish(); }
        else { Naming.mode = 'keyboard'; Naming.name = ''; Naming.kbx = 0; Naming.kby = 0; }
      }
      return;
    }
    // keyboard
    if (Input.pressed.up) { Naming.kby = (Naming.kby + Naming.KB.length - 1) % Naming.KB.length; AudioSys.sfx('select'); }
    if (Input.pressed.down) { Naming.kby = (Naming.kby + 1) % Naming.KB.length; AudioSys.sfx('select'); }
    if (Input.pressed.left) { Naming.kbx = (Naming.kbx + Naming.KB[0].length - 1) % Naming.KB[0].length; AudioSys.sfx('select'); }
    if (Input.pressed.right) { Naming.kbx = (Naming.kbx + 1) % Naming.KB[0].length; AudioSys.sfx('select'); }
    if (Input.pressed.b) { if (Naming.name.length) { Naming.name = Naming.name.slice(0, -1); AudioSys.sfx('cancel'); } }
    if (Input.pressed.a) {
      const ch = Naming.KB[Naming.kby][Naming.kbx];
      if (ch !== ' ' && ch !== '.' && Naming.name.length < 8) { Naming.name += ch; AudioSys.sfx('select'); }
      else if (ch === '.') { /* period reserved */ }
    }
    if (Input.pressed.start) {
      if (Naming.name.length) { Game.playerName = Naming.name; AudioSys.sfx('confirm'); Naming.finish(); }
    }
  },

  finish() {
    Naming.mode = 'done';   // stop drawing the picker under the closing dialogue
    const prof = 'Right! So your name is ' + Game.playerName + '! A fine name for a new trainer.';
    Textbox.say([prof, 'Your very own adventure is about to unfold. A world of dreams and challenges awaits!', "Let's go!"], () => {
      Game.mapId = 'player_room'; Game.px = 3; Game.py = 4; Game.pdir = 'down';
      Overworld.boot();
      Overworld.showBanner();
      Game.setState('overworld');
      Game.flags.gameStarted = true;
    });
  },

  draw(ctx) {
    Screen.clear('#284878');
    if (Naming.mode === 'done') {
      // just the aurora backdrop while the closing dialogue plays
      for (let k = 0; k < 3; k++) {
        const col = ['#59e6b8', '#8d7bf0', '#f08bd8'][k];
        ctx.globalAlpha = 0.4;
        for (let x = 0; x < 240; x += 3) {
          const y = 40 + k * 14 + Math.sin(x / 26 + k + Game.frame / 34) * 9;
          ctx.fillStyle = col; ctx.fillRect(x, y, 3, 5);
        }
        ctx.globalAlpha = 1;
      }
      return;
    }
    if (Naming.mode === 'gender') {
      Font.draw(ctx, 'Are you a boy or a girl?', 120 - Font.width('Are you a boy or a girl?') / 2, 20, { color: '#f8f8f8', shadow: '#182838' });
      ['M', 'F'].forEach((g, i) => {
        const x = 60 + i * 90, sel = Naming.gender === g;
        UIKit.miniPanel(ctx, x - 20, 50, 52, 74);
        ctx.imageSmoothingEnabled = false;
        ctx.save(); ctx.translate(x + 6, 66); ctx.scale(2.4, 2.4);
        ctx.drawImage(Chars.get(g === 'M' ? 'player_m' : 'player_f', 'down', 0), -8, -6); ctx.restore();
        Font.draw(ctx, g === 'M' ? 'BOY' : 'GIRL', x - 4, 112, { color: sel ? '#e83030' : '#383838', shadow: '#d8d8c8' });
        if (sel) { ctx.strokeStyle = '#f8d048'; ctx.lineWidth = 2; ctx.strokeRect(x - 20, 50, 52, 74); }
      });
      Font.draw(ctx, '← → choose,  A confirm', 66, 140, { color: '#f8f8f8', shadow: '#182838' });
    } else if (Naming.mode === 'preset') {
      Font.draw(ctx, 'What is your name?', 120 - Font.width('What is your name?') / 2, 16, { color: '#f8f8f8', shadow: '#182838' });
      const opts = Naming.preset[Naming.gender].concat(['Type your own...']);
      UIKit.panel(ctx, 70, 30, 100, opts.length * 15 + 8);
      opts.forEach((o, i) => {
        Font.draw(ctx, o, 88, 36 + i * 15, { color: '#383838', shadow: '#d8d8c8' });
        if (Naming.presetIdx === i) Font.draw(ctx, '▶', 78, 36 + i * 15, { color: '#e83030', shadow: null });
      });
    } else {
      Font.draw(ctx, 'Enter a name:', 12, 12, { color: '#f8f8f8', shadow: '#182838' });
      // name box
      UIKit.miniPanel(ctx, 12, 24, 216, 20);
      Font.draw(ctx, Naming.name + ((Game.frame >> 4) & 1 ? '_' : ''), 20, 30, { color: '#383838', shadow: '#d8d8c8' });
      // keyboard
      UIKit.panel(ctx, 12, 50, 216, 96);
      Naming.KB.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const x = 26 + c * 20, y = 58 + r * 14;
          const ch = row[c];
          Font.draw(ctx, ch === ' ' ? '_' : ch, x, y, { color: '#383838', shadow: '#d8d8c8' });
          if (Naming.kbx === c && Naming.kby === r) Font.draw(ctx, '▶', x - 8, y, { color: '#e83030', shadow: null });
        }
      });
      Font.draw(ctx, 'A: type  B: erase  START: done', 40, 150, { color: '#f8f8f8', shadow: '#182838' });
    }
  },
};
