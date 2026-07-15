'use strict';
/**
 * Overworld character sprites: 16x22 walkers with 4 facing directions and a
 * 2-frame walk cycle (legs alternate). Built through the pixel toolkit so the
 * player (male/female) and NPCs share a consistent chibi Gen-3 style.
 *
 * Chars.get(id, dir, frame) -> canvas. dir: 'down'|'up'|'left'|'right', frame 0/1.
 */
const Chars = (() => {
  const cache = {};

  // A palette-driven template: skin, hair, top, bottom, shoe, accent.
  function drawWalker(s, dir, frame, pal) {
    const skin = Px.ramp(pal.skin);
    const hair = Px.ramp(pal.hair);
    const top = Px.ramp(pal.top);
    const bot = Px.ramp(pal.bottom);
    const shoe = Px.ramp(pal.shoe);
    const acc = pal.accent ? Px.ramp(pal.accent) : top;
    const step = frame === 1 ? 1 : 0;
    const back = dir === 'up';
    const side = dir === 'left' || dir === 'right';
    const flip = dir === 'left';

    // shadow
    s.fillEllipse(8, 21, 5, 2, '#00000030');

    // legs (walk cycle: one forward one back)
    const ly = 16;
    if (side) {
      s.rect(6, ly, 3, 4 - step, bot.b);
      s.rect(8, ly + step, 3, 4 - step, bot.d);
      s.rect(6, ly + (4 - step), 3, 2, shoe.b);
      s.rect(8, ly + 4, 3, 2, shoe.d);
    } else {
      s.rect(5, ly + (step && 0), 3, 5 - step, bot.b);
      s.rect(9, ly + step, 3, 5 - step, bot.d);
      s.rect(5, ly + 5 - step, 3, 2, shoe.b);
      s.rect(9, ly + 5, 3, 2, shoe.d);
    }

    // torso / jacket
    s.rect(4, 10, 8, 7, top.b);
    s.rect(4, 10, 8, 2, top.l);
    s.rect(4, 15, 8, 2, top.d);
    // accent stripe
    if (!back) s.rect(7, 11, 2, 5, acc.b);
    // arms
    if (side) {
      s.rect(flip ? 4 : 10, 11, 2, 4, top.d);
    } else {
      s.rect(3, 11, 2, 4, top.d);
      s.rect(11, 11, 2, 4, top.d);
      s.set(3, 14, skin.b); s.set(12, 14, skin.b); // hands
    }

    // head
    s.fillEllipse(8, 6, 5, 5, skin.b);
    // hair
    if (back) {
      s.fillEllipse(8, 5, 5, 4, hair.b);
      s.rect(3, 5, 10, 3, hair.b);
      s.fillEllipse(8, 8, 5, 2, hair.d);
      s.dither(4, 3, 8, 3, hair.l, 0);
    } else if (side) {
      s.fillEllipse(8, 4, 5, 3, hair.b);
      s.rect(flip ? 8 : 3, 3, 5, 4, hair.b);
      // face on the side
      const fx = flip ? 5 : 10;
      s.set(fx, 6, '#1a1418'); // eye
      if (pal.longHair) { s.rect(flip ? 9 : 4, 6, 3, 6, hair.b); }
    } else {
      // front hair with bangs
      s.fillEllipse(8, 4, 5, 3, hair.b);
      s.rect(3, 3, 10, 3, hair.b);
      s.set(4, 6, hair.b); s.set(11, 6, hair.b);
      if (pal.longHair) { s.rect(3, 6, 2, 6, hair.b); s.rect(11, 6, 2, 6, hair.b); }
      // eyes
      s.set(6, 6, '#1a1418'); s.set(10, 6, '#1a1418');
      s.set(6, 7, skin.d); s.set(10, 7, skin.d);
      // mouth
      s.set(8, 8, skin.d);
    }
    // hat/accessory
    if (pal.hat) {
      const hatc = Px.ramp(pal.hat);
      s.rect(3, 2, 10, 2, hatc.b);
      s.fillEllipse(8, 2, 5, 2, hatc.b);
      if (!back) s.rect(4, 3, 8, 1, hatc.d);
      s.rect(3, 3, 10, 1, hatc.l);
      if (pal.hatBill && !back) s.rect(6, 4, 6, 1, hatc.d); // cap bill
    }

    if (flip) return s.mirrored();
    return s;
  }

  const PALETTES = {
    player_m: { skin: '#e8b088', hair: '#5a3a28', top: '#c84838', bottom: '#3858a8', shoe: '#e8e8e8', accent: '#f8f8f8', hat: '#e03828', hatBill: true },
    player_f: { skin: '#e8b088', hair: '#8a5a38', top: '#e05888', bottom: '#4868b8', shoe: '#f0f0f0', accent: '#f8f8f8', hat: '#f06898', hatBill: true, longHair: true },
    prof: { skin: '#e0a878', hair: '#c8c8c8', top: '#f0f0f0', bottom: '#888890', shoe: '#585860', accent: '#d8d8e0' },
    rival_m: { skin: '#e8b088', hair: '#3868c8', top: '#48a868', bottom: '#38404a', shoe: '#d8d8d8', accent: '#f8f8f8' },
    rival_f: { skin: '#e8b088', hair: '#c85888', top: '#9868c8', bottom: '#e8e0d0', shoe: '#d8d8d8', longHair: true, accent: '#f8e8f8' },
    ionar_grunt: { skin: '#d8a878', hair: '#484850', top: '#586878', bottom: '#383840', shoe: '#282830', accent: '#f8d048', hat: '#485868' },
    ionar_boss: { skin: '#d8a878', hair: '#d8d8e0', top: '#384858', bottom: '#282838', shoe: '#181820', accent: '#68e8f0', hat: '#283848' },
    npc_villager: { skin: '#e0a878', hair: '#7a5238', top: '#68a858', bottom: '#8a6a44', shoe: '#5a4632' },
    npc_woman: { skin: '#e8b088', hair: '#a86838', top: '#e8b048', bottom: '#c86858', shoe: '#8a6a44', longHair: true },
    npc_oldman: { skin: '#d8a878', hair: '#d0d0d0', top: '#8898a8', bottom: '#585860', shoe: '#484850' },
    npc_fisher: { skin: '#d09868', hair: '#3a3a42', top: '#4888c8', bottom: '#c8a848', shoe: '#5a4632', hat: '#e8e8e8' },
    npc_hiker: { skin: '#e0a878', hair: '#8a5a38', top: '#c87838', bottom: '#586848', shoe: '#5a4632', hat: '#a85838' },
    npc_sailor: { skin: '#d8a878', hair: '#2a2a32', top: '#f0f0f0', bottom: '#385898', shoe: '#282830', accent: '#3868c8' },
    npc_ranger: { skin: '#e0a878', hair: '#4a3a28', top: '#589858', bottom: '#786848', shoe: '#5a4632', hat: '#487848' },
    nurse: { skin: '#e8b088', hair: '#e888a8', top: '#f8f8f8', bottom: '#f8f8f8', shoe: '#e0e0e0', accent: '#f06888', hat: '#f8f8f8', longHair: true },
    clerk: { skin: '#e0a878', hair: '#4a4a52', top: '#4878c8', bottom: '#383840', shoe: '#282830', accent: '#f8f8f8' },
    gym_leader: { skin: '#e0a878', hair: '#c89838', top: '#8848c8', bottom: '#484858', shoe: '#d8b848', accent: '#f8d848' },
    champion: { skin: '#e0a878', hair: '#c8a038', top: '#487848', bottom: '#5a4632', shoe: '#8a6a44', hat: '#487848' },
  };

  return {
    palettes: PALETTES,
    get(id, dir = 'down', frame = 0) {
      if (typeof Assets !== 'undefined') {
        const ov = Assets.get('chars/' + id + '_' + dir + '_' + frame);
        if (ov) return ov;
      }
      const key = id + ':' + dir + ':' + frame;
      if (cache[key]) return cache[key];
      const pal = PALETTES[id] || PALETTES.npc_villager;
      const s = new PixelSurface(16, 22);
      const out = drawWalker(s, dir, frame, pal);
      out.outline('#20181c');
      const cv = out.toCanvas();
      cache[key] = cv;
      return cv;
    },
  };
})();
