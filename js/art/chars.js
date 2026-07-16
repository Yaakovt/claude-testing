'use strict';
/**
 * Overworld character sprites: 16x22 walkers with 4 facing directions and a
 * 3-frame Gen-3 walk cycle (stand / left-foot step / right-foot step). Built
 * through the pixel toolkit so the player (male/female) and NPCs share a
 * consistent chibi Gen-3 style.
 *
 * Chars.get(id, dir, frame) -> canvas. dir: 'down'|'up'|'left'|'right', frame 0/1/2.
 */
const Chars = (() => {
  const cache = {};

  // A palette-driven template: skin, hair, top, bottom, shoe, accent.
  // FABLE ART: bouncier stride, swinging arms, layered hair, dressed jackets.
  function drawWalker(s, dir, frame, pal) {
    const skin = Px.ramp(pal.skin);
    const hair = Px.ramp(pal.hair);
    const top = Px.ramp(pal.top);
    const bot = Px.ramp(pal.bottom);
    const shoe = Px.ramp(pal.shoe);
    const acc = pal.accent ? Px.ramp(pal.accent) : top;
    // 3-frame Gen-3 cycle: 0 = standing, 1 = left/near foot forward,
    // 2 = right/far foot forward. Walking alternates 1,0,2,0,...
    const step = frame ? 1 : 0;
    const bob = step;                    // whole body dips 1px on step frames
    const back = dir === 'up';
    const side = dir === 'left' || dir === 'right';
    const flip = dir === 'left';

    // ground shadow
    s.fillEllipse(8, 21, 5, 2, '#00000030');

    // ---- legs & shoes (proper stride) ----
    const ly = 16 - bob;
    if (side) {
      if (frame === 1) {          // near leg kicks forward, far leg trails
        s.rect(4, ly, 3, 4, bot.d); s.rect(4, ly + 4, 3, 2, shoe.d);       // trailing leg
        s.rect(8, ly, 3, 3, bot.b); s.rect(9, ly + 3, 3, 2, shoe.b);       // leading leg kicks
        s.set(11, ly + 4, shoe.l);
      } else if (frame === 2) {   // opposite scissor: far leg swings ahead
        s.rect(9, ly, 3, 4, bot.b); s.rect(9, ly + 4, 3, 2, shoe.b);       // now-trailing near leg
        s.rect(5, ly, 3, 3, bot.d); s.rect(4, ly + 3, 3, 2, shoe.d);       // far leg reaches
        s.set(4, ly + 4, shoe.l);
      } else {                    // standing pass
        s.rect(6, ly, 3, 4, bot.b); s.rect(6, ly + 4, 3, 2, shoe.b);
        s.rect(8, ly + 1, 3, 3, bot.d); s.rect(8, ly + 4, 3, 2, shoe.d);
      }
    } else if (frame === 1) {     // left foot lifts and steps
      s.rect(5, ly + 1, 3, 3, bot.b); s.rect(5, ly + 4, 3, 2, shoe.b);     // lifted left
      s.rect(9, ly, 3, 5, bot.d); s.rect(9, ly + 5, 3, 2, shoe.d);         // planted right
      s.set(6, ly + 5, shoe.l); s.set(10, ly + 6, shoe.l);
    } else if (frame === 2) {     // right foot lifts and steps
      s.rect(5, ly, 3, 5, bot.b); s.rect(5, ly + 5, 3, 2, shoe.b);         // planted left
      s.rect(9, ly + 1, 3, 3, bot.d); s.rect(9, ly + 4, 3, 2, shoe.d);     // lifted right
      s.set(6, ly + 6, shoe.l); s.set(10, ly + 5, shoe.l);
    } else {                      // standing: both planted
      s.rect(5, ly, 3, 5, bot.b); s.rect(9, ly, 3, 5, bot.d);
      s.rect(5, ly + 5, 3, 2, shoe.b); s.rect(9, ly + 5, 3, 2, shoe.d);
      s.set(6, ly + 6, shoe.l); s.set(10, ly + 6, shoe.l);   // toe caps
    }

    // ---- torso: jacket with collar, hem and side shade ----
    const ty = 10 - bob;
    s.rect(4, ty, 8, 7, top.b);
    s.rect(4, ty, 2, 7, top.d);                    // side shade
    s.rect(5, ty, 6, 1, top.l);                    // shoulder light
    s.rect(4, ty + 6, 8, 1, top.d);                // hem
    if (!back) {
      // collar V + zip/buttons
      s.set(7, ty, top.l); s.set(8, ty, top.l);
      s.set(7, ty + 1, acc.b); s.set(8, ty + 1, acc.b);
      s.set(8, ty + 3, acc.d); s.set(8, ty + 5, acc.d);
    } else {
      s.rect(5, ty + 1, 6, 1, top.d);              // back yoke seam
    }

    // ---- arms: swing opposite to the legs ----
    if (side) {
      const swing = frame === 1 ? 2 : frame === 2 ? -2 : 0;   // fwd / back / rest
      s.rect(7 + swing, ty + 1, 2, 4, top.d);
      s.set(7 + swing, ty + 5, skin.b);            // hand
    } else {
      // opposite arm rises with each stepping foot; both rest when standing
      const lsw = frame === 2 ? 1 : 0, rsw = frame === 1 ? 1 : 0;
      s.rect(3, ty + 1 + lsw, 2, 4, top.d);
      s.rect(11, ty + 1 + rsw, 2, 4, top.d);
      s.set(3, ty + 5 + lsw, skin.b); s.set(12, ty + 5 + rsw, skin.b);
    }

    // ---- head ----
    const hy = 6 - bob;
    const sway = frame === 1 ? 1 : 0;              // hair swings with the stride
    s.fillEllipse(8, hy, 5, 5, skin.b);
    s.set(4, hy + 2, skin.d); s.set(12, hy + 2, skin.d);   // cheek shading

    // ---- hair: layered cap + fringe + sheen ----
    if (back) {
      s.fillEllipse(8, hy - 1, 5, 4, hair.b);
      s.rect(3, hy - 1, 10, 4, hair.b);
      s.fillEllipse(8, hy + 2, 5, 3, hair.d);      // under-layer
      s.line(4, hy - 2, 7, hy - 3, hair.l);        // sheen band
      if (pal.longHair) {                           // falling back-hair sways
        s.rect(4, hy + 3, 3, 6 + sway, hair.b); s.rect(9, hy + 3, 3, 7 - sway, hair.b);
        s.rect(4, hy + 8 + sway, 3, 1, hair.d); s.rect(9, hy + 9 - sway, 3, 1, hair.d);
      }
    } else if (side) {
      s.fillEllipse(8, hy - 2, 5, 3, hair.b);
      s.rect(3, hy - 2, 6, 4, hair.b);             // swept crown
      s.set(9, hy - 1, hair.b); s.set(10, hy - 1, hair.d);
      s.line(4, hy - 3, 7, hy - 3, hair.l);
      s.set(3, hy + 1, hair.d);                    // sideburn
      if (pal.longHair) { s.rect(3, hy + 1, 3, 6 + sway, hair.b); s.set(4, hy + 7 + sway, hair.d); }
      // profile: eye + nose nub + mouth
      s.set(10, hy, '#1a1418');
      s.set(13, hy + 1, skin.d);                   // nose
      s.set(11, hy + 3, skin.d);                   // mouth
    } else {
      s.fillEllipse(8, hy - 2, 5, 3, hair.b);
      s.rect(3, hy - 3, 10, 3, hair.b);
      // fringe points
      s.set(4, hy, hair.b); s.set(7, hy - 1, hair.d); s.set(11, hy, hair.b);
      s.line(4, hy - 3, 7, hy - 4, hair.l);        // sheen
      if (pal.longHair) {
        s.rect(2, hy, 2, 7 + sway, hair.b); s.rect(12, hy, 2, 8 - sway, hair.b);
        s.set(2, hy + 6 + sway, hair.d); s.set(13, hy + 7 - sway, hair.d);
      }
      // face: eyes with lash line, mouth
      s.set(6, hy, '#1a1418'); s.set(10, hy, '#1a1418');
      s.set(6, hy + 1, skin.d); s.set(10, hy + 1, skin.d);
      s.set(8, hy + 3, '#a06848');
    }

    // ---- hat: domed cap with band + bill ----
    if (pal.hat) {
      const hatc = Px.ramp(pal.hat);
      s.fillEllipse(8, hy - 3, 5, 3, hatc.b);
      s.rect(3, hy - 3, 10, 2, hatc.b);
      s.rect(3, hy - 2, 10, 1, hatc.d);            // band
      s.line(5, hy - 5, 8, hy - 5, hatc.l);        // dome light
      if (pal.hatBill && !back) {
        if (side) s.rect(9, hy - 2, 5, 1, hatc.d);
        else s.rect(4, hy - 1, 8, 1, hatc.d);
      }
      if (!back && !side) { s.set(8, hy - 3, acc.b); }   // front emblem
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
