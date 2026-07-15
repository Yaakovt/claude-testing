'use strict';
/**
 * Battle scene renderer + event playback. Drains Battle.queue one event at a
 * time: typewriter text, HP/EXP bar animation, move animations, ball throws,
 * faints, level-ups, move learning, menus.
 */
const BattleUI = {
  visible: false,
  mode: 'idle',       // idle | playing | menu | moves | learn | end
  event: null,        // current event being played
  wait: 0,
  text: '',
  textProgress: 0,
  menuIdx: 0,
  moveIdx: 0,
  learnIdx: 0,
  hpShown: { pl: 1, en: 1 },     // displayed HP fraction (animates toward true)
  expShown: 0,
  spriteState: { pl: { visible: false, y: 0, alpha: 1 }, en: { visible: false, y: 0, alpha: 1 } },
  ball: null,        // ball throw animation state
  flash: { pl: 0, en: 0 },
  statArrows: null,

  GEOM: { ux: 48, uy: 76, tx: 168, ty: 44 },   // player/enemy sprite centers

  open() {
    BattleUI.visible = true;
    BattleUI.mode = 'playing';
    BattleUI.event = null;
    BattleUI.hpShown = { pl: Battle.pl.mon.curHp / Battle.pl.mon.maxHp, en: 1 };
    BattleUI.expShown = Battle.pl.mon.expPct();
    BattleUI.spriteState = { pl: { visible: false, y: 0, alpha: 1 }, en: { visible: false, y: 0, alpha: 1 } };
    BattleUI.trainerIntro = (Battle.kind === 'trainer');   // show foe trainer until first send
    BattleUI.throwFx = null;
    Music.play(Battle.kind === 'trainer' ? (Battle.trainer.music || 'battle_trainer') : 'battle_wild');
  },

  close() {
    BattleUI.visible = false;
    BattleUI.mode = 'idle';
  },

  play() { if (BattleUI.mode !== 'learn') BattleUI.mode = 'playing'; },

  // ------------------------------------------------------------- update
  update() {
    if (!BattleUI.visible) return;
    BattleAnim.update();
    // animate HP bars
    for (const tag of ['pl', 'en']) {
      const side = tag === 'pl' ? Battle.pl : Battle.en;
      if (!side || !side.mon) continue;
      const target = Util.clamp(side.mon.curHp / side.mon.maxHp, 0, 1);
      const cur = BattleUI.hpShown[tag];
      if (Math.abs(cur - target) > 0.002) {
        BattleUI.hpShown[tag] += Util.clamp(target - cur, -0.02, 0.02);
      } else BattleUI.hpShown[tag] = target;
    }
    if (BattleUI.flash.pl > 0) BattleUI.flash.pl--;
    if (BattleUI.flash.en > 0) BattleUI.flash.en--;
    if (BattleUI.statArrows) { BattleUI.statArrows.t++; if (BattleUI.statArrows.t > 30) BattleUI.statArrows = null; }
    if (BattleUI.ball) BattleUI.updateBall();

    switch (BattleUI.mode) {
      case 'playing': BattleUI.updatePlaying(); break;
      case 'menu': BattleUI.updateMenu(); break;
      case 'moves': BattleUI.updateMoves(); break;
      case 'learn': BattleUI.updateLearn(); break;
      case 'end': BattleUI.updateEnd(); break;
    }
  },

  updatePlaying() {
    const ev = BattleUI.event;
    if (!ev) { BattleUI.nextEvent(); return; }
    switch (ev.t) {
      case 'text': {
        if (BattleUI.textProgress < BattleUI.text.length) {
          BattleUI.textProgress += Input.held.a ? 3 : 1.4;
          if (BattleUI.textProgress >= BattleUI.text.length) BattleUI.wait = 26;
        } else if (--BattleUI.wait <= 0 || Input.pressed.a) {
          BattleUI.event = null;
        }
        break;
      }
      case 'anim':
        if (!BattleAnim.active) BattleUI.event = null;
        break;
      case 'hp': {
        const tag = ev.side;
        if (tag === 'none') { BattleUI.event = null; break; }
        const side = tag === 'pl' ? Battle.pl : Battle.en;
        const target = Util.clamp(side.mon.curHp / side.mon.maxHp, 0, 1);
        if (Math.abs(BattleUI.hpShown[tag] - target) < 0.003) BattleUI.event = null;
        break;
      }
      case 'expbar': {
        const target = Battle.pl.mon.expPct();
        const d = target - BattleUI.expShown;
        // handle wrap on level-up (target < shown)
        BattleUI.expShown += d < -0.5 ? 0.04 : Util.clamp(d, -0.03, 0.03);
        if (BattleUI.expShown > 1) BattleUI.expShown = 0;
        if (Math.abs(target - BattleUI.expShown) < 0.01) { BattleUI.expShown = target; BattleUI.event = null; }
        break;
      }
      case 'wait':
        if (--BattleUI.wait <= 0) BattleUI.event = null;
        break;
      case 'ball':
        if (!BattleUI.ball) BattleUI.event = null;
        break;
      default:
        BattleUI.event = null;
    }
  },

  nextEvent() {
    const ev = Battle.queue.shift();
    if (!ev) { BattleUI.mode = 'menu'; return; }
    BattleUI.event = ev;
    switch (ev.t) {
      case 'text':
        BattleUI.text = ev.msg;
        BattleUI.textProgress = 0;
        break;
      case 'menu':
        BattleUI.event = null;
        BattleUI.mode = 'menu';
        BattleUI.menuIdx = 0;
        break;
      case 'anim': {
        const mv = Moves[ev.move];
        const g = BattleUI.GEOM;
        const geom = ev.user === 'pl'
          ? { ux: g.ux, uy: g.uy, tx: ev.target === 'pl' ? g.ux : g.tx, ty: ev.target === 'pl' ? g.uy : g.ty }
          : { ux: g.tx, uy: g.ty, tx: ev.target === 'en' ? g.tx : g.ux, ty: ev.target === 'en' ? g.uy : g.uy };
        if (ev.user === 'en' && ev.target === 'en') { geom.tx = g.tx; geom.ty = g.ty; }
        BattleAnim.start(mv.anim, geom, null);
        BattleUI.moveSfx(mv);
        break;
      }
      case 'hitfx': {
        BattleUI.flash[ev.side] = 14;
        AudioSys.sfx(ev.eff > 1 ? 'hit_super' : ev.eff < 1 ? 'hit_weak' : 'hit');
        break;
      }
      case 'cry': {
        AudioSys.cry(Dex.byKey[ev.key].cry);
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 22;
        break;
      }
      case 'status': case 'statusClear':
        BattleUI.event = null;
        break;
      case 'stat':
        BattleUI.statArrows = { side: ev.side, up: ev.up, t: 0 };
        AudioSys.sfx(ev.up ? 'stat_up' : 'stat_down');
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 24;
        break;
      case 'faint': {
        BattleUI.spriteState[ev.side].fainting = true;
        AudioSys.sfx('faint');
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 30;
        break;
      }
      case 'sendEnemy':
        BattleUI.trainerIntro = false;        // foe trainer throws its ball and steps back
        BattleUI.throwBall('en');
        BattleUI.spriteState.en = { visible: true, y: -40, alpha: 1 };
        BattleUI.hpShown.en = Battle.en ? Util.clamp(Battle.en.mon.curHp / Battle.en.mon.maxHp, 0, 1) : 1;
        AudioSys.sfx('ball_throw');
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 20;
        break;
      case 'sendPlayer':
        BattleUI.throwBall('pl');
        BattleUI.spriteState.pl = { visible: true, y: -40, alpha: 1 };
        BattleUI.hpShown.pl = Util.clamp(Battle.pl.mon.curHp / Battle.pl.mon.maxHp, 0, 1);
        BattleUI.expShown = Battle.pl.mon.expPct();
        AudioSys.sfx('ball_throw');
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 20;
        break;
      case 'recall':
        BattleUI.spriteState[ev.side].visible = false;
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 12;
        break;
      case 'ball':
        BattleUI.startBall(ev);
        break;
      case 'weather':
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 10;
        break;
      case 'mega': {
        Screen.doFlash((Megas[ev.key] && Megas[ev.key].color) || '#a8f0d8', 1);
        AudioSys.sfx('levelup');
        AudioSys.cry(Dex.byKey[ev.key].cry);
        BattleUI.flash[ev.side] = 20;
        BattleUI.event = { t: 'wait' }; BattleUI.wait = 30;
        break;
      }
      case 'levelup':
        AudioSys.sfx('levelup');
        BattleUI.text = ev.name + ' grew to LV ' + ev.lv + '!';
        BattleUI.textProgress = 0;
        BattleUI.event = { t: 'text', msg: BattleUI.text };
        break;
      case 'learn': {
        const mon = Game.party[ev.mon];
        if (!mon) { BattleUI.event = null; break; }
        if (mon.moves.length < 4) {
          mon.teach(ev.move);
          BattleUI.text = mon.name + ' learned ' + Moves[ev.move].name + '!';
          BattleUI.textProgress = 0;
          AudioSys.sfx('jingle_item');
          BattleUI.event = { t: 'text', msg: BattleUI.text };
        } else {
          BattleUI.mode = 'learn';
          BattleUI.learn = { mon, move: ev.move };
          BattleUI.learnIdx = 0;
          BattleUI.event = null;
        }
        break;
      }
      case 'forceSwitch':
        BattleUI.event = null;
        PartyUI.open({
          mode: 'battle-must',
          onPick: (idx) => {
            Battle.switchPlayer(idx, true);
            BattleUI.play();
          },
        });
        break;
      case 'run':
        AudioSys.sfx('run');
        break;
      case 'end':
        BattleUI.mode = 'end';
        Screen.fadeOut(0.06);
        BattleUI.endTimer = 26;
        break;
    }
  },

  moveSfx(mv) {
    const f = { phys: 300, spec: 500 }[mv.cat] || 400;
    const typeFreq = { Fire: 260, Water: 420, Electric: 800, Grass: 520, Ice: 700, Psychic: 640, Ghost: 220, Dragon: 180, Dark: 200, Fairy: 760, Steel: 340, Rock: 150, Ground: 120, Fighting: 280, Poison: 380, Bug: 560, Flying: 480, Normal: 400 };
    AudioSys.voice({ wave: mv.cat === 'status' ? 'sine' : 'square', freq: typeFreq[mv.type] || f, freqEnd: (typeFreq[mv.type] || f) * 0.7, dur: 0.18, vol: 0.15, vibrato: 12 });
  },

  // ------------------------------------------------------------- menus
  updateMenu() {
    if (BattleUI.endTimer) { BattleUI.updateEnd(); return; }
    const grid = [['FIGHT', 'BAG'], ['FAKEMON', 'RUN']];
    let r = BattleUI.menuIdx >> 1, c = BattleUI.menuIdx & 1;
    if (Input.pressed.up) r = 0;
    if (Input.pressed.down) r = 1;
    if (Input.pressed.left) c = 0;
    if (Input.pressed.right) c = 1;
    if (Input.pressed.up || Input.pressed.down || Input.pressed.left || Input.pressed.right) AudioSys.sfx('select');
    BattleUI.menuIdx = r * 2 + c;
    if (Input.pressed.a) {
      AudioSys.sfx('confirm');
      switch (BattleUI.menuIdx) {
        case 0: BattleUI.mode = 'moves'; BattleUI.moveIdx = 0; break;
        case 1:
          BagUI.open({
            mode: 'battle',
            onUse: (itemId, target) => { BattleUI.mode = 'playing'; Battle.playerAction({ type: 'item', id: itemId, target }); },
            onCancel: () => { BattleUI.mode = 'menu'; },
          });
          BattleUI.mode = 'submenu';
          break;
        case 2:
          PartyUI.open({
            mode: 'battle-switch',
            onPick: (idx) => { BattleUI.mode = 'playing'; Battle.playerAction({ type: 'switch', idx }); },
            onCancel: () => { BattleUI.mode = 'menu'; },
          });
          BattleUI.mode = 'submenu';
          break;
        case 3: BattleUI.mode = 'playing'; Battle.playerAction({ type: 'run' }); break;
      }
    }
  },

  updateMoves() {
    const moves = Battle.pl.mon.moves;
    let idx = BattleUI.moveIdx;
    if (Input.pressed.up && idx >= 2) idx -= 2;
    if (Input.pressed.down && idx + 2 < moves.length) idx += 2;
    if (Input.pressed.left && (idx & 1)) idx--;
    if (Input.pressed.right && !(idx & 1) && idx + 1 < moves.length) idx++;
    if (idx !== BattleUI.moveIdx) AudioSys.sfx('select');
    BattleUI.moveIdx = idx;
    // Toggle Mega Evolution with SELECT (Shift) when eligible.
    if (Battle.pl.mon.canMega() && Input.pressed.select) { BattleUI.megaPending = !BattleUI.megaPending; AudioSys.sfx('select'); }
    if (Input.pressed.b) { AudioSys.sfx('cancel'); BattleUI.mode = 'menu'; BattleUI.megaPending = false; return; }
    if (Input.pressed.a) {
      if (moves[idx].pp <= 0) { AudioSys.sfx('cancel'); return; }
      AudioSys.sfx('confirm');
      BattleUI.mode = 'playing';
      const mega = BattleUI.megaPending; BattleUI.megaPending = false;
      Battle.playerAction({ type: 'move', idx, mega });
    }
  },

  updateLearn() {
    // choosing which move to forget (0-3) or give up (4)
    const n = 5;
    if (Input.pressed.up) { BattleUI.learnIdx = (BattleUI.learnIdx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { BattleUI.learnIdx = (BattleUI.learnIdx + 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.b) { BattleUI.learnIdx = 4; }
    if (Input.pressed.a || (Input.pressed.b && BattleUI.learnIdx === 4)) {
      AudioSys.sfx('confirm');
      const { mon, move } = BattleUI.learn;
      if (BattleUI.learnIdx < 4) {
        const old = Moves[mon.moves[BattleUI.learnIdx].id].name;
        mon.teach(move, BattleUI.learnIdx);
        Battle.queue.unshift({ t: 'text', msg: mon.name + ' forgot ' + old + ' and learned ' + Moves[move].name + '!' });
      } else {
        Battle.queue.unshift({ t: 'text', msg: mon.name + ' did not learn ' + Moves[move].name + '.' });
      }
      BattleUI.mode = 'playing';
    }
  },

  updateEnd() {
    if (--BattleUI.endTimer <= 0) {
      BattleUI.endTimer = 0;
      Screen.fadeIn(0.08);
      Battle.finish();
    }
  },

  // ------------------------------------------------------------- send-out ball throw
  /** A poke-ball arcing to a mon's spot when it's sent out (both sides). */
  throwBall(side) {
    const g = BattleUI.GEOM;
    const to = side === 'en' ? { x: g.tx, y: g.ty } : { x: g.ux, y: g.uy };
    const from = side === 'en' ? { x: 150, y: 96 } : { x: 40, y: 150 };
    BattleUI.throwFx = { t: 0, dur: 14, from, to };
  },

  drawBallIcon(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#e83828'; ctx.beginPath(); ctx.arc(0, 0, 4, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f8f8f8'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = '#181818'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(4, 0); ctx.stroke();
    ctx.fillStyle = '#f8f8f8'; ctx.beginPath(); ctx.arc(0, 0, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },

  drawThrowFx(ctx) {
    const f = BattleUI.throwFx;
    if (!f) return;
    if (f.t <= f.dur) {
      const t = f.t / f.dur;
      const x = Util.lerp(f.from.x, f.to.x, t);
      const y = Util.lerp(f.from.y, f.to.y, t) - Math.sin(t * Math.PI) * 28;   // arc
      BattleUI.drawBallIcon(ctx, x, y, f.t * 0.7);
    } else {
      // burst of light where the mon materialises
      const bt = f.t - f.dur;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - bt / 9);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(f.to.x, f.to.y, 6 + bt * 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (bt > 9) BattleUI.throwFx = null;
    }
    f.t++;
  },

  // ------------------------------------------------------------- ball anim
  startBall(ev) {
    AudioSys.sfx('ball_throw');
    BattleUI.ball = { phase: 'throw', t: 0, shakes: ev.shakes, caught: ev.caught, shakeNum: 0 };
  },

  updateBall() {
    const b = BattleUI.ball;
    b.t++;
    const g = BattleUI.GEOM;
    if (b.phase === 'throw' && b.t > 24) {
      b.phase = 'drop'; b.t = 0;
      BattleUI.spriteState.en.visible = false;
      Screen.doFlash('#fff', 0.6);
    } else if (b.phase === 'drop' && b.t > 14) {
      b.phase = 'shake'; b.t = 0;
      AudioSys.sfx('ball_bounce');
    } else if (b.phase === 'shake') {
      if (b.t === 20 && b.shakeNum < b.shakes) { AudioSys.sfx('ball_shake'); }
      if (b.t > 40) {
        b.shakeNum++;
        b.t = 0;
        if (b.shakeNum > b.shakes || (b.caught && b.shakeNum >= 3)) {
          if (b.caught) { b.phase = 'caught'; AudioSys.sfx('ball_click'); }
          else {
            b.phase = 'break';
            BattleUI.spriteState.en.visible = true;
            Screen.doFlash('#fff', 0.5);
          }
          b.t = 0;
        }
      }
    } else if ((b.phase === 'caught' || b.phase === 'break') && b.t > 20) {
      BattleUI.ball = null;
    }
  },

  // ------------------------------------------------------------- drawing
  draw(ctx) {
    if (!BattleUI.visible) return;
    ctx.save();
    if (Screen.shakeOffset) ctx.translate(Screen.shakeOffset, 0);

    // backdrop
    ctx.drawImage(BattleBG.get(Battle.env), 0, 0);
    BattleUI.drawWeather(ctx);

    // sprites
    const g = BattleUI.GEOM;
    const off = BattleAnim.userOffset();
    const anim = BattleAnim.current;
    const enSt = BattleUI.spriteState.en, plSt = BattleUI.spriteState.pl;
    // Foe trainer stands in until they send out their first mon.
    if (Battle.kind === 'trainer' && BattleUI.trainerIntro && typeof TrainerArt !== 'undefined') {
      ctx.drawImage(TrainerArt.get(Battle.trainer), g.tx - 24, g.ty - 36, 48, 48);
    }
    if (enSt.visible && Battle.en) {
      let ex = g.tx - 32, ey = g.ty - 32;
      if (enSt.y < 0) { enSt.y += 4; ey += enSt.y; }
      if (enSt.fainting) { ey += 20; ctx.globalAlpha = 0.4; enSt.visible = enSt.doneFaint ? false : true; enSt.doneFaint = true; }
      if (anim && anim.geom.ux === g.tx) { ex += off.x; ey += off.y; }
      if (!(BattleUI.flash.en % 4 >= 2)) {
        ctx.drawImage(Dex.sprite(Battle.en.mon.key, 'front', Battle.en.mon.mega), ex, ey);
      }
      ctx.globalAlpha = 1;
    }
    if (plSt.visible && Battle.pl) {
      let px = g.ux - 32, py = g.uy - 28;
      if (plSt.y < 0) { plSt.y += 4; px -= plSt.y; }
      if (plSt.fainting) { py += 20; ctx.globalAlpha = 0.4; plSt.doneFaint = true; }
      if (anim && anim.geom.ux === g.ux) { px += off.x; py += off.y; }
      if (!(BattleUI.flash.pl % 4 >= 2)) {
        ctx.drawImage(Dex.sprite(Battle.pl.mon.key, 'back', Battle.pl.mon.mega), px, py);
      }
      ctx.globalAlpha = 1;
    }

    // send-out ball throw
    BattleUI.drawThrowFx(ctx);

    // ball animation
    if (BattleUI.ball) BattleUI.drawBall(ctx);

    // stat arrows
    if (BattleUI.statArrows) {
      const sa = BattleUI.statArrows;
      const cx = sa.side === 'pl' ? g.ux : g.tx;
      const cy = (sa.side === 'pl' ? g.uy : g.ty) + (sa.up ? 10 - sa.t / 3 : -10 + sa.t / 3);
      ctx.fillStyle = sa.up ? '#f8b048' : '#6890e8';
      for (let i = 0; i < 3; i++) {
        const x = cx - 12 + i * 12;
        if (sa.up) { ctx.beginPath(); ctx.moveTo(x - 3, cy + 3); ctx.lineTo(x + 3, cy + 3); ctx.lineTo(x, cy - 3); ctx.fill(); }
        else { ctx.beginPath(); ctx.moveTo(x - 3, cy - 3); ctx.lineTo(x + 3, cy - 3); ctx.lineTo(x, cy + 3); ctx.fill(); }
      }
    }

    BattleAnim.draw(ctx);

    // info boxes
    if (Battle.en && enSt.visible !== undefined) BattleUI.drawEnemyBox(ctx);
    if (Battle.pl && plSt.visible) BattleUI.drawPlayerBox(ctx);

    ctx.restore();
    Screen.shakeOffset = 0;

    // text panel
    UIKit.panel(ctx, 0, 112, 240, 48);
    if (BattleUI.mode === 'menu' && !BattleUI.endTimer) BattleUI.drawMenu(ctx);
    else if (BattleUI.mode === 'moves') BattleUI.drawMoves(ctx);
    else if (BattleUI.mode === 'learn') BattleUI.drawLearn(ctx);
    else if (BattleUI.text) {
      const shown = BattleUI.text.slice(0, Math.floor(BattleUI.textProgress));
      UIKit.wrapText(ctx, shown, 10, 122, 220);
    }
  },

  drawWeather(ctx) {
    const w = Battle.weather.kind;
    if (!w) return;
    const f = Game.frame;
    if (w === 'rain') {
      ctx.strokeStyle = 'rgba(160,200,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 26; i++) {
        const x = ((i * 37) + f * 3) % 250 - 5;
        const y = ((i * 53) + f * 5) % 112;
        ctx.moveTo(x, y); ctx.lineTo(x - 2, y + 6);
      }
      ctx.stroke();
    } else if (w === 'sun') {
      ctx.fillStyle = 'rgba(255,230,140,0.16)';
      ctx.fillRect(0, 0, 240, 112);
    } else if (w === 'hail') {
      ctx.fillStyle = 'rgba(220,240,255,0.9)';
      for (let i = 0; i < 18; i++) {
        const x = ((i * 41) + f * 2) % 246 - 3;
        const y = ((i * 67) + f * 3) % 112;
        ctx.fillRect(x, y, 2, 2);
      }
    } else if (w === 'sandstorm') {
      ctx.fillStyle = 'rgba(210,180,110,0.25)';
      ctx.fillRect(0, 0, 240, 112);
      ctx.fillStyle = 'rgba(230,200,130,0.8)';
      for (let i = 0; i < 20; i++) {
        const x = ((i * 47) + f * 6) % 250 - 5;
        const y = ((i * 31) + Math.sin(f / 8 + i) * 10 + 56) % 112;
        ctx.fillRect(x, y, 2, 1);
      }
    }
  },

  drawEnemyBox(ctx) {
    const mon = Battle.en.mon;
    UIKit.miniPanel(ctx, 4, 6, 104, 30);
    Font.draw(ctx, mon.name, 10, 10, { color: '#383838', shadow: '#d0d0c0' });
    Font.draw(ctx, 'Lv' + mon.level, 78, 10, { color: '#383838', shadow: '#d0d0c0' });
    BattleUI.drawHpBar(ctx, 26, 22, 72, BattleUI.hpShown.en);
    if (mon.status) BattleUI.drawStatusTag(ctx, 8, 20, mon.status);
  },

  drawPlayerBox(ctx) {
    const mon = Battle.pl.mon;
    UIKit.miniPanel(ctx, 128, 74, 108, 36);
    Font.draw(ctx, mon.name, 134, 78, { color: '#383838', shadow: '#d0d0c0' });
    Font.draw(ctx, 'Lv' + mon.level, 206, 78, { color: '#383838', shadow: '#d0d0c0' });
    BattleUI.drawHpBar(ctx, 152, 90, 76, BattleUI.hpShown.pl);
    const hpTxt = Math.max(0, mon.curHp) + '/' + mon.maxHp;
    Font.draw(ctx, hpTxt, 228 - Font.width(hpTxt), 97, { color: '#383838', shadow: '#d0d0c0' });
    // EXP bar
    ctx.fillStyle = '#484858';
    ctx.fillRect(134, 106, 98, 3);
    ctx.fillStyle = '#58c8f0';
    ctx.fillRect(134, 106, Math.floor(98 * BattleUI.expShown), 3);
    if (mon.status) BattleUI.drawStatusTag(ctx, 132, 88, mon.status);
  },

  drawHpBar(ctx, x, y, w, frac) {
    Font.draw(ctx, 'HP', x - 14, y - 2, { color: '#c8a030', shadow: null });
    ctx.fillStyle = '#404048';
    ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = '#585860';
    ctx.fillRect(x, y, w, 4);
    const col = frac > 0.5 ? '#58d048' : frac > 0.2 ? '#f8c830' : '#f05838';
    ctx.fillStyle = col;
    ctx.fillRect(x, y, Math.max(0, Math.floor(w * frac)), 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y, Math.max(0, Math.floor(w * frac)), 1);
  },

  drawStatusTag(ctx, x, y, st) {
    const labels = { psn: 'PSN', tox: 'PSN', brn: 'BRN', par: 'PAR', slp: 'SLP', frz: 'FRZ' };
    const colors = { psn: '#a050c8', tox: '#8040b0', brn: '#e87038', par: '#d8b830', slp: '#8888a0', frz: '#68c0e8' };
    ctx.fillStyle = colors[st] || '#888';
    ctx.fillRect(x, y, 18, 9);
    Font.draw(ctx, labels[st] || '???', x + 2, y + 1, { color: '#fff', shadow: null });
  },

  drawBall(ctx) {
    const b = BattleUI.ball;
    const g = BattleUI.GEOM;
    let x = g.tx, y = g.ty + 16;
    if (b.phase === 'throw') {
      const t = b.t / 24;
      x = Util.lerp(g.ux, g.tx, t);
      y = Util.lerp(g.uy - 10, g.ty, t) - Math.sin(t * Math.PI) * 34;
    } else if (b.phase === 'drop') {
      y = g.ty + (b.t / 14) * 16;
    } else if (b.phase === 'shake') {
      x += b.t > 14 && b.t < 30 ? Math.sin(b.t) * 3 : 0;
    } else if (b.phase === 'break') {
      return;
    }
    // the orb: red-white gen-style capture device
    ctx.fillStyle = '#303038';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e84848';
    ctx.beginPath(); ctx.arc(x, y, 4, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#303038'; ctx.fillRect(x - 4, y - 1, 9, 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 2, 2);
    if (b.phase === 'caught') {
      ctx.fillStyle = '#f8e048';
      const st = Math.min(1, b.t / 10);
      for (let i = 0; i < 3; i++) {
        const ang = -Math.PI / 2 + (i - 1) * 0.8;
        BattleAnim.px(ctx, x + Math.cos(ang) * 10 * st, y + Math.sin(ang) * 10 * st, '#f8e048', 2);
      }
    }
  },

  drawMenu(ctx) {
    UIKit.wrapText(ctx, 'What will ' + Battle.pl.mon.name + ' do?', 8, 122, 110);
    UIKit.subPanel(ctx, 118, 112, 122, 48);
    const items = ['FIGHT', 'BAG', 'FAKEMON', 'RUN'];
    items.forEach((label, i) => {
      const x = 132 + (i & 1) * 58, y = 122 + (i >> 1) * 16;
      Font.draw(ctx, label, x, y, { color: '#383838', shadow: '#d8d8c8' });
      if (BattleUI.menuIdx === i) Font.draw(ctx, '▶', x - 9, y, { color: '#e84848', shadow: null });
    });
  },

  drawMoves(ctx) {
    const moves = Battle.pl.mon.moves;
    moves.forEach((slot, i) => {
      const x = 14 + (i & 1) * 82, y = 120 + (i >> 1) * 16;
      const mv = Moves[slot.id];
      Font.draw(ctx, mv.name, x, y, { color: slot.pp > 0 ? '#383838' : '#a0a0a0', shadow: '#d8d8c8' });
      if (BattleUI.moveIdx === i) Font.draw(ctx, '▶', x - 9, y, { color: '#e84848', shadow: null });
    });
    // right info panel
    UIKit.subPanel(ctx, 178, 112, 62, 48);
    const sel = moves[BattleUI.moveIdx];
    if (sel) {
      const mv = Moves[sel.id];
      Font.draw(ctx, 'PP ' + sel.pp + '/' + sel.maxPp, 186, 122, { color: '#383838', shadow: '#d8d8c8' });
      ctx.fillStyle = TypeColors[mv.type];
      ctx.fillRect(186, 136, 46, 11);
      Font.draw(ctx, mv.type.toUpperCase(), 188, 138, { color: '#fff', shadow: null });
    }
    // Mega Evolve prompt (SELECT to toggle)
    if (Battle.pl.mon.canMega()) {
      const on = BattleUI.megaPending;
      ctx.fillStyle = on ? '#e858a8' : '#584860';
      ctx.fillRect(120, 150, 54, 9);
      Font.draw(ctx, (on ? '★' : ' ') + 'MEGA', 124, 151, { color: on ? '#fff' : '#c0b8c8', shadow: null });
    }
  },

  drawLearn(ctx) {
    const { mon, move } = BattleUI.learn;
    UIKit.panel(ctx, 40, 24, 160, 96);
    Font.draw(ctx, 'Forget a move for', 50, 30, { color: '#383838', shadow: '#d8d8c8' });
    Font.draw(ctx, Moves[move].name + '?', 50, 42, { color: '#c83828', shadow: '#d8d8c8' });
    mon.moves.forEach((slot, i) => {
      Font.draw(ctx, Moves[slot.id].name, 62, 56 + i * 11, { color: '#383838', shadow: '#d8d8c8' });
      if (BattleUI.learnIdx === i) Font.draw(ctx, '▶', 52, 56 + i * 11, { color: '#e84848', shadow: null });
    });
    Font.draw(ctx, 'GIVE UP', 62, 56 + 4 * 11, { color: '#383838', shadow: '#d8d8c8' });
    if (BattleUI.learnIdx === 4) Font.draw(ctx, '▶', 52, 56 + 4 * 11, { color: '#e84848', shadow: null });
  },
};
