'use strict';
/**
 * Procedural 16x16 item icons for the bag/shop/party screens. Drawn by kind
 * (balls, potions, berries/charms, stones, TMs, keys, etc.) so every item has a
 * recognizable picture without external art. An external PNG at
 * `items/<id>` (via the asset manifest) overrides the built-in icon.
 */
const ItemIcons = (() => {
  const cache = {};

  const BALL_COL = {
    fieldorb: '#e04838', greatorb: '#3f7fe0', ultraorb: '#f0c020',
    meshorb: '#48b0a0', gloomorb: '#5850a0', rushorb: '#f08838',
    denorb: '#c86848', primeorb: '#9048c8',
  };
  const STONE_COL = {
    verdant_stone: '#58b04a', ember_stone: '#e8613a', tide_stone: '#3f7fe0',
    storm_stone: '#f0c020', aurora_stone: '#78e8c8',
  };

  function ball(s, col) {
    const r = Px.ramp(col);
    s.fillCircle(8, 8, 6, '#2a2028');
    s.fillEllipse(8, 6, 5, 4, r.b);           // top half
    s.fillEllipse(8, 11, 5, 3, '#e8e8e0');     // bottom half
    s.rect(3, 8, 11, 1, '#2a2028');            // band
    s.fillCircle(8, 8, 1.6, '#f0f0e0');        // button
    s.set(6, 5, r.h);                          // shine
  }
  function bottle(s, liquid) {
    const g = Px.ramp('#c8d0d8');
    s.rect(6, 2, 4, 2, g.d);                    // cap
    s.rect(5, 4, 6, 10, g.l);                   // glass
    s.rect(6, 8, 4, 5, liquid);                 // liquid
    s.line(5, 4, 5, 13, g.d); s.line(10, 4, 10, 13, '#ffffff');
  }
  function berry(s, col) {
    const r = Px.ramp(col);
    s.fillCircle(8, 10, 4, r.b);
    s.set(6, 8, r.h);
    s.line(8, 6, 8, 3, '#5a8a3a'); s.line(8, 4, 11, 3, '#6aa84a'); // stem+leaf
    s.set(10, 3, '#8fbf6a');
  }
  function charm(s, col) {
    const r = Px.ramp(col);
    s.fillPoly([[8, 3], [12, 8], [8, 13], [4, 8]], r.b);   // diamond charm
    s.set(6, 6, r.h);
    s.line(8, 3, 8, 1, '#c8a850'); s.fillCircle(8, 1, 1, '#e8c860'); // loop
  }
  function gem(s, col) {
    const r = Px.ramp(col);
    s.fillPoly([[8, 2], [13, 7], [8, 14], [3, 7]], r.b);
    s.line(3, 7, 13, 7, r.l); s.line(8, 2, 8, 14, r.h);
    s.set(6, 5, '#ffffff');
  }
  function disc(s, col) {
    const r = Px.ramp(col);
    s.fillCircle(8, 8, 6, r.d);
    s.fillCircle(8, 8, 5, r.b);
    s.fillCircle(8, 8, 1.5, '#e8e8f0');
    s.set(6, 5, r.h);
  }
  function key(s) {
    const g = Px.ramp('#e8c050');
    s.fillCircle(6, 6, 3, g.b); s.fillCircle(6, 6, 1.5, '#584018');
    s.rect(8, 6, 6, 2, g.b); s.rect(12, 8, 2, 2, g.b); s.rect(10, 8, 1, 2, g.b);
    s.set(4, 4, g.h);
  }
  function vial(s, col) {
    bottle(s, col);
    s.set(8, 3, '#f0f0f0'); s.line(6, 6, 10, 6, '#ffffff');
  }
  function spray(s) {
    const g = Px.ramp('#a0a8b0');
    s.rect(5, 5, 6, 9, g.b); s.rect(6, 2, 3, 3, g.d);
    s.set(9, 1, '#c8e0f0'); s.set(11, 1, '#c8e0f0'); // mist
    s.line(5, 5, 5, 13, g.l);
  }
  function rod(s, col) {
    const r = Px.ramp(col);
    // diagonal rod shaft from lower-left grip to upper-right tip
    s.stroke(3, 13, 12, 3, 1, r);
    s.rect(2, 12, 3, 3, Px.shift(col, 0, 0, -0.2)); // grip
    s.set(12, 3, r.h);
    // line + hook
    s.line(12, 3, 13, 9, '#d8d8e0');
    s.set(13, 10, '#d8d8e0'); s.set(12, 11, '#d8d8e0');
  }
  function candy(s) {
    const r = Px.ramp('#f088c0');
    s.fillCircle(8, 8, 4, r.b); s.set(6, 6, r.h);
    s.tri(2, 6, 2, 10, 5, 8, r.d); s.tri(14, 6, 14, 10, 11, 8, r.d); // wrapper
  }

  function render(id) {
    const it = Items[id];
    const s = new PixelSurface(16, 16);
    if (!it) { s.rect(4, 4, 8, 8, '#888'); }
    else if (it.kind === 'ball') ball(s, BALL_COL[id] || '#e04838');
    else if (it.kind === 'stone') gem(s, STONE_COL[id] || '#a0a0c0');
    else if (it.kind === 'tm') disc(s, it.hm ? '#48b878' : (it.move && typeof Moves !== 'undefined' && Moves[it.move] ? TypeColors[Moves[it.move].type] : '#8890a0'));
    else if (it.rod) rod(s, { old: '#9a6a3a', good: '#3f7fe0', super: '#e8c040' }[it.rod] || '#9a6a3a');
    else if (it.kind === 'key') key(s);
    else if (it.kind === 'battle') vial(s, '#c060d0');
    else if (it.kind === 'misc') { if (it.repel) spray(s); else charm(s, '#88c0e8'); }
    else if (it.kind === 'held') {
      if (it.typeBoost) charm(s, TypeColors[it.typeBoost.type]);
      else if (it.cureBerry || it.pinchBerry) berry(s, it.cureBerry ? '#88c8f0' : '#f06868');
      else if (it.leftovers) berry(s, '#88c860');
      else if (it.preventEvo) gem(s, '#9098a8');
      else charm(s, '#e8b0d0');
    }
    else if (it.kind === 'medicine') {
      if (it.candy) candy(s);
      else if (it.revive) bottle(s, '#f0d048');
      else if (it.cure) bottle(s, '#68b0e8');
      else if (it.pp) bottle(s, '#b088e0');
      else bottle(s, '#f07850');       // potions
    } else s.rect(4, 4, 8, 8, '#a0a0a0');
    s.outline('#241c22');
    return s.toCanvas();
  }

  return {
    get(id) {
      if (typeof Assets !== 'undefined') { const ov = Assets.get('items/' + id); if (ov) return ov; }
      if (!cache[id]) cache[id] = render(id);
      return cache[id];
    },
  };
})();
