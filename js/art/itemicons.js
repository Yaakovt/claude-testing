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
    s.fillEllipse(7, 5, 3, 2, r.l);           // dome light
    s.fillEllipse(8, 11, 5, 3, '#e8e8e0');     // bottom half
    s.set(11, 12, '#c8c8c0');
    s.rect(3, 8, 11, 1, '#2a2028');            // band
    s.fillCircle(8, 8, 2, '#2a2028');          // button ring
    s.fillCircle(8, 8, 1.3, '#f0f0e0');
    s.set(5, 4, '#ffffff'); s.set(6, 5, r.h);  // shine
  }
  function bottle(s, liquid) {
    const g = Px.ramp('#c8d0d8');
    s.rect(6, 1, 4, 2, Px.shift(liquid, 0, 0, -0.15));   // colored cap
    s.rect(6, 3, 4, 1, g.d);                    // neck ring
    s.rect(5, 4, 6, 10, g.l);
    s.rect(6, 8, 4, 5, liquid);                 // liquid
    s.set(7, 9, Px.shift(liquid, 0, 0, 0.18));  // liquid glint
    s.rect(5, 6, 6, 1, '#ffffff');              // label band
    s.line(5, 4, 5, 13, g.d); s.line(10, 4, 10, 13, '#ffffff');
    s.rect(6, 14, 4, 1, g.d);                   // base
  }
  function berry(s, col) {
    const r = Px.ramp(col);
    s.fillCircle(8, 10, 4, r.b);
    s.fillEllipse(7, 9, 2, 1.4, r.l);
    s.set(6, 8, r.h);
    s.set(8, 13, r.d); s.set(10, 12, r.d);      // underside shade
    s.line(8, 6, 8, 3, '#5a8a3a');
    s.fillEllipse(10, 3, 2, 1, '#6aa84a');      // leaf
    s.set(11, 2, '#8fbf6a');
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
    // data sheen arc + hub ring
    s.line(4, 6, 6, 4, r.h); s.set(5, 5, '#ffffff');
    s.line(10, 12, 12, 10, r.l);
    s.fillCircle(8, 8, 2, r.d2);
    s.fillCircle(8, 8, 1.2, '#e8e8f0');
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

  // ---- distinct pictures for the individual key items (so they aren't all keys) ----
  const KEY_ICONS = {
    town_map(s) {
      s.fillPoly([[2, 3], [14, 2], [14, 13], [2, 14]], '#e8dcc0');       // folded parchment
      s.line(6, 2, 6, 13, '#c8b890'); s.line(10, 3, 10, 14, '#c8b890');  // fold creases
      s.line(3, 8, 13, 7, '#8fb85a'); s.line(4, 5, 9, 11, '#c88848');    // route + river
      s.set(11, 6, '#e05038'); s.set(5, 10, '#4878c8');                  // map pins
      s.line(2, 3, 14, 2, '#fff');
    },
    bike(s) {
      s.fillCircle(5, 11, 3, '#303038'); s.fillCircle(11, 11, 3, '#303038');
      s.fillCircle(5, 11, 1, '#889'); s.fillCircle(11, 11, 1, '#889');
      s.line(5, 11, 8, 6, '#e04838'); s.line(11, 11, 8, 6, '#e04838'); s.line(5, 11, 11, 11, '#e04838');
      s.line(8, 6, 10, 5, '#303038'); s.rect(4, 5, 3, 1, '#303038');     // seat + bars
    },
    exp_share(s) {
      s.fillEllipse(8, 8, 4, 5, '#e8c040'); s.fillEllipse(8, 8, 2, 3, '#f8e890');
      s.line(8, 3, 8, 1, '#c8a850'); s.set(8, 1, '#e8c040');             // loop
      s.set(7, 6, '#a86818'); s.line(6, 9, 10, 9, '#a86818');            // stylized "E"
      s.line(6, 7, 9, 7, '#a86818'); s.line(6, 7, 6, 11, '#a86818'); s.line(6, 11, 9, 11, '#a86818');
    },
    amulet_coin(s) {
      s.fillCircle(8, 8, 6, '#c8981f'); s.fillCircle(8, 8, 5, '#f0c838');
      s.fillCircle(8, 8, 3, '#e8b820'); s.set(6, 5, '#fff4b0');          // shine
      s.set(8, 8, '#a87818'); s.line(6, 8, 10, 8, '#a87818');
    },
    saga_tome(s) {
      s.rect(3, 2, 11, 12, '#7a4038'); s.rect(3, 2, 2, 12, '#5a2c28');   // cover + spine
      s.rect(5, 3, 8, 10, '#e8dcc0'); s.line(5, 6, 12, 6, '#c8b890');    // pages
      s.line(5, 9, 12, 9, '#c8b890'); s.set(9, 4, '#c85038');            // rune
    },
    aurora_compass(s) {
      s.fillCircle(8, 8, 6, '#c8ccd8'); s.fillCircle(8, 8, 5, '#2c3350');
      s.tri(8, 3, 6, 9, 10, 9, '#e85038'); s.tri(8, 13, 6, 8, 10, 8, '#e8e8f0'); // needle N/S
      s.set(8, 8, '#f8f8f8'); s.set(8, 2, '#8de0c0');                    // N mark (aurora tint)
    },
    explorer_permit(s) {
      s.rect(3, 2, 10, 12, '#f0e8d8'); s.line(3, 2, 3, 13, '#c8b890');   // document
      s.line(5, 5, 11, 5, '#4878c8'); s.line(5, 7, 11, 7, '#a0a0a8'); s.line(5, 9, 9, 9, '#a0a0a8');
      s.fillCircle(11, 11, 2, '#e05038'); s.set(11, 11, '#f8c0b0');      // wax seal
    },
    old_lamp(s) {
      s.fillEllipse(8, 11, 5, 3, '#c8a038'); s.fillEllipse(8, 10, 4, 2, '#e8c860');
      s.rect(12, 8, 3, 2, '#c8a038'); s.tri(2, 9, 5, 8, 5, 10, '#c8a038'); // spout + handle
      s.rect(7, 6, 2, 2, '#e8c860'); s.set(8, 4, '#f8d048'); s.set(8, 3, '#f89030'); // flame
    },
    ferry_pass(s) {
      s.rect(2, 4, 12, 8, '#68b0e0'); s.rect(2, 4, 12, 8, '#68b0e0');
      s.rect(3, 5, 10, 6, '#bfe4f8'); s.line(9, 4, 9, 12, '#68b0e0');    // ticket + stub
      s.set(5, 7, '#2c6a9a'); s.line(4, 9, 7, 9, '#2c6a9a'); s.fillCircle(11, 8, 1, '#e8c040');
    },
    ionar_badge(s) {
      s.fillPoly([[8, 2], [13, 6], [11, 13], [5, 13], [3, 6]], '#2c3a4c'); // shield
      s.fillPoly([[8, 4], [11, 7], [9, 12], [6, 12], [5, 7]], '#3f6f92');
      s.fillPoly([[9, 5], [6, 9], [8, 9], [7, 12], [11, 7], [9, 7]], '#f8e038'); // gold bolt
    },
    storm_charm(s) {
      s.fillPoly([[8, 2], [12, 8], [8, 14], [4, 8]], '#5a78c8');          // teardrop gem
      s.fillPoly([[9, 4], [6, 9], [8, 9], [7, 12], [11, 6], [9, 6]], '#f8e038'); // bolt
      s.set(6, 5, '#a8c0f0'); s.line(8, 1, 8, 2, '#c8a850');
    },
    shrine_key(s) { key(s); s.set(4, 4, '#f8f0c0'); s.set(13, 9, '#f8e048'); }, // fancier key
    fin_fossil(s) {
      s.fillEllipse(8, 9, 6, 5, '#a8a090'); s.fillEllipse(8, 9, 5, 4, '#c8c0ac');
      s.fillPoly([[8, 3], [11, 9], [5, 9]], '#8a8272'); s.line(8, 4, 8, 8, '#6a6252'); // fin
      s.set(6, 11, '#8a8272'); s.set(10, 11, '#8a8272');
    },
    tusk_fossil(s) {
      s.fillEllipse(8, 9, 6, 5, '#a8a090'); s.fillEllipse(8, 9, 5, 4, '#c8c0ac');
      s.stroke(5, 12, 11, 5, 1, Px.ramp('#e8e0cc'));                      // curved tusk
      s.set(11, 5, '#fff'); s.line(6, 11, 9, 8, '#9a9280');
    },
  };

  function render(id) {
    const it = Items[id];
    const s = new PixelSurface(16, 16);
    if (it && it.kind === 'key' && !it.rod && KEY_ICONS[id]) { KEY_ICONS[id](s); s.outline('#241c22'); return s.toCanvas(); }
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
