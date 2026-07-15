'use strict';
/**
 * Move Relearner picker — a full-screen scrolling list of moves a fakemon can
 * remember (past level-up moves it doesn't currently know). Chosen from an NPC
 * service; on pick it teaches directly, or routes through MoveForget if the
 * fakemon already knows four moves.
 */
const MoveRelearn = {
  mon: null, moves: [], idx: 0, scroll: 0, done: null,

  open(mon, moves, done) {
    MoveRelearn.mon = mon;
    MoveRelearn.moves = moves;
    MoveRelearn.idx = 0; MoveRelearn.scroll = 0;
    MoveRelearn.done = done || (() => { Scripts.done(); Game.setState('overworld'); });
    Game.setState('relearn');
  },

  finish() { const d = MoveRelearn.done; MoveRelearn.done = null; if (d) d(); },

  update() {
    const list = MoveRelearn.moves;
    const n = list.length + 1;   // + CANCEL
    if (Input.pressed.up) { MoveRelearn.idx = (MoveRelearn.idx + n - 1) % n; AudioSys.sfx('select'); }
    if (Input.pressed.down) { MoveRelearn.idx = (MoveRelearn.idx + 1) % n; AudioSys.sfx('select'); }
    if (MoveRelearn.idx < MoveRelearn.scroll) MoveRelearn.scroll = MoveRelearn.idx;
    if (MoveRelearn.idx > MoveRelearn.scroll + 5) MoveRelearn.scroll = MoveRelearn.idx - 5;
    if (Input.pressed.b) { AudioSys.sfx('cancel'); MoveRelearn.finish(); return; }
    if (Input.pressed.a) {
      AudioSys.sfx('confirm');
      if (MoveRelearn.idx === list.length) { MoveRelearn.finish(); return; }
      const mon = MoveRelearn.mon, mv = list[MoveRelearn.idx];
      if (mon.knows(mv)) { Textbox.say(mon.name + ' already knows ' + Moves[mv].name + '.', () => Game.setState('relearn')); return; }
      if (mon.moves.length < 4) {
        mon.teach(mv);
        AudioSys.sfx('jingle_item');
        Textbox.say(mon.name + ' remembered ' + Moves[mv].name + '!', () => { MoveRelearn.finish(); });
      } else {
        MoveForget.open(mon, mv, () => { MoveRelearn.finish(); });
      }
    }
  },

  draw(ctx) {
    Screen.clear('#284878');
    UIKit.panel(ctx, 20, 12, 200, 136);
    Font.draw(ctx, MoveRelearn.mon.name + ' can remember...', 30, 20, { color: '#383838', shadow: '#d8d8c8' });
    const list = MoveRelearn.moves;
    for (let i = 0; i < 6; i++) {
      const gi = MoveRelearn.scroll + i;
      if (gi > list.length) break;
      const y = 36 + i * 15;
      if (gi === list.length) {
        Font.draw(ctx, 'CANCEL', 44, y, { color: '#383838', shadow: '#d8d8c8' });
      } else {
        const mv = Moves[list[gi]];
        ctx.fillStyle = TypeColors[mv.type] || '#888'; ctx.fillRect(160, y - 1, 42, 11);
        Font.draw(ctx, mv.type.slice(0, 4).toUpperCase(), 163, y + 1, { color: '#fff', shadow: null });
        Font.draw(ctx, mv.name, 44, y, { color: '#383838', shadow: '#d8d8c8' });
      }
      if (MoveRelearn.idx === gi) Font.draw(ctx, '▶', 30, y, { color: '#e83030', shadow: null });
    }
    // detail of highlighted move
    const sel = MoveRelearn.idx < list.length ? Moves[list[MoveRelearn.idx]] : null;
    UIKit.miniPanel(ctx, 20, 130, 200, 16);
    if (sel) Font.draw(ctx, 'PWR ' + (sel.power || '—') + '  PP ' + sel.pp + '  ' + (sel.cat.toUpperCase()), 26, 134, { color: '#383838', shadow: null });
    else Font.draw(ctx, 'Leave the move unremembered.', 26, 134, { color: '#383838', shadow: null });
  },
};
