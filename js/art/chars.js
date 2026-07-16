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

    // ---- cape/cloak: hangs behind the body, sways with the stride ----
    if (pal.cape) {
      const cp = Px.ramp(pal.cape);
      const sw = frame === 1 ? 1 : frame === 2 ? -1 : 0;
      const cy = 9 - bob;
      s.fillPoly([[3, cy], [13, cy], [14 + sw, 19], [2 + sw, 19]], cp.b);
      s.line(2 + sw, 19, 14 + sw, 19, cp.d);              // hem shadow
      s.line(3, cy, 3 + sw, 18, cp.l);                    // lit fold
      s.line(8, cy, 8 + Math.round(sw / 2), 18, cp.d);    // center fold
      if (pal.capeTrim) { s.line(2 + sw, 18, 14 + sw, 18, Px.ramp(pal.capeTrim).b); }
    }

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

    // ---- skirt/dress: flares over the hips, hem swings with the stride ----
    if (pal.dress) {
      const dr = Px.ramp(pal.dress === true ? pal.top : pal.dress);
      const flare = step ? 1 : 0;
      s.fillPoly([[4, ly - 1], [11, ly - 1], [13 + flare, ly + 3], [2 - flare, ly + 3]], dr.b);
      s.line(2 - flare, ly + 3, 13 + flare, ly + 3, dr.d);   // hem shadow
      s.line(4, ly - 1, 2 - flare, ly + 3, dr.l);            // lit fold
      s.set(8, ly + 1, dr.d);                                // center pleat
    }

    // ---- long coat: knee-length skirt split down the front, sways ----
    if (pal.coat) {
      const co = Px.ramp(pal.coat);
      const sw = frame === 1 ? 1 : frame === 2 ? -1 : 0;
      s.fillPoly([[3, ly - 2], [12, ly - 2], [13 + sw, ly + 5], [2 + sw, ly + 5]], co.b);
      s.line(2 + sw, ly + 5, 13 + sw, ly + 5, co.d);         // hem
      s.rect(7, ly - 2, 2, 7, co.d);                         // front split shadow
      s.line(3, ly - 2, 3 + sw, ly + 4, co.l);               // lit lapel edge
      if (pal.coatTrim) {                                     // aurora/gold trim down the split
        const tr = Px.ramp(pal.coatTrim);
        s.line(6, ly - 2, 6, ly + 4, tr.b); s.line(9, ly - 2, 9, ly + 4, tr.d);
      }
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
      // chest emblem (team logo / medal) centered on the torso
      if (pal.emblem) {
        const em = Px.ramp(pal.emblem);
        s.set(7, ty + 3, em.b); s.set(8, ty + 3, em.l);
        s.set(7, ty + 4, em.d); s.set(8, ty + 4, em.b);
      }
      // uniform chest panel (Ionar body-suit paneling)
      if (pal.panel) {
        const pn = Px.ramp(pal.panel);
        s.rect(5, ty + 1, 6, 2, pn.b); s.rect(5, ty + 1, 6, 1, pn.l);
      }
    } else {
      s.rect(5, ty + 1, 6, 1, top.d);              // back yoke seam
    }
    // shoulder pauldrons (heavy officers)
    if (pal.pauldron) {
      const pd = Px.ramp(pal.pauldron);
      s.rect(3, ty, 3, 2, pd.b); s.rect(10, ty, 3, 2, pd.b);
      s.set(3, ty, pd.l); s.set(12, ty, pd.d);
    }
    // sash/scarf across the chest
    if (pal.sash && !back) {
      const sa = Px.ramp(pal.sash);
      s.line(5, ty, 10, ty + 5, sa.b); s.line(5, ty + 1, 10, ty + 6, sa.d);
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
    if (pal.hood) {
      // Ionar helmet/hood: angular shell over the crown with a glowing visor
      // band. `visor` colors the aurora stripe; face below stays in shadow.
      const hc = Px.ramp(pal.hood);
      const vis = pal.visor || '#68e8f0';
      s.fillEllipse(8, hy - 2, 6, 4, hc.b);
      s.rect(2, hy - 2, 12, 4, hc.b);
      s.rect(2, hy - 2, 12, 1, hc.l);                // top light
      s.rect(2, hy + 1, 12, 1, hc.d);                // brow ridge
      if (back) {
        s.rect(3, hy + 2, 10, 3, hc.b);              // back of helmet
        s.rect(4, hy + 2, 8, 1, hc.d);
        s.set(6, hy + 3, hc.l);
      } else if (side) {
        s.rect(3, hy + 2, 8, 2, skin.d);             // shadowed cheek
        s.line(9, hy, 12, hy, vis);                  // visor slit (profile)
        s.set(12, hy, '#ffffff');
        s.set(3, hy + 2, hc.d);                      // ear guard
      } else {
        s.rect(3, hy + 2, 10, 2, skin.b);            // face under the brim
        s.set(4, hy + 2, skin.d); s.set(12, hy + 2, skin.d);
        s.line(4, hy, 11, hy, vis);                  // full visor band
        s.set(5, hy, '#ffffff'); s.set(10, hy, '#ffffff');
        s.set(8, hy + 3, skin.d);                    // set jaw
      }
    } else if (pal.bald) {
      // balding pate: temple tufts + dome shine, face drawn as usual below
      s.rect(3, hy - 1, 2, 3, hair.b); s.rect(11, hy - 1, 2, 3, hair.b);
      if (back) s.rect(4, hy + 1, 8, 2, hair.d);           // low ring behind
      s.set(7, hy - 4, skin.l); s.set(8, hy - 4, skin.h);  // shine
      if (side) {
        s.set(10, hy, '#1a1418');
        s.set(13, hy + 1, skin.d); s.set(11, hy + 3, skin.d);
      } else if (!back) {
        s.set(6, hy, '#1a1418'); s.set(10, hy, '#1a1418');
        s.set(6, hy + 1, skin.d); s.set(10, hy + 1, skin.d);
        s.set(8, hy + 3, '#a06848');
      }
    } else if (back) {
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

    // ---- extra face/head features ----
    if (pal.bun && !pal.bald) {
      // tidy hair bun perched on top (granny / dancer styles)
      s.fillEllipse(back || !side ? 8 : 5, hy - 5, 2, 2, hair.b);
      s.set(back || !side ? 7 : 4, hy - 6, hair.l);
    }
    if (pal.glasses && !back) {
      const gc = '#2a2430';
      if (side) {
        s.set(9, hy, gc); s.set(11, hy, gc); s.set(10, hy - 1, gc);
        s.set(8, hy, gc);                              // temple arm
      } else {
        s.set(5, hy, gc); s.set(7, hy, gc); s.set(8, hy, gc);
        s.set(9, hy, gc); s.set(11, hy, gc);
        s.set(6, hy - 1, gc); s.set(10, hy - 1, gc);   // top rims
      }
    }
    if (pal.beard && !back) {
      const bd = Px.ramp(pal.beard === true ? pal.hair : pal.beard);
      if (side) { s.rect(9, hy + 2, 4, 2, bd.b); s.set(10, hy + 4, bd.d); }
      else {
        s.rect(5, hy + 2, 7, 1, bd.b);
        s.rect(6, hy + 3, 5, 2, bd.b); s.set(8, hy + 5, bd.d);
        s.set(8, hy + 3, '#a06848');                   // mouth peeks through
      }
    }
    if (pal.spiky && !pal.hood) {                       // jagged spikes off the crown
      const hc = Px.ramp(pal.hair);
      for (const dx of [-4, -1, 2, 5]) {
        s.line(8 + dx, hy - 2, 8 + dx + 1, hy - 5, hc.b);
        s.set(8 + dx + 1, hy - 5, hc.l);
      }
    }
    if (pal.pony) {                                     // ponytail out the back/side
      const pc = Px.ramp(pal.pony === true ? pal.hair : pal.pony);
      const swing = frame === 1 ? 1 : 0;
      if (back || !side) { s.rect(7, hy - 4, 2, 3, pc.b); s.rect(6, hy - 1 + swing, 3, 3, pc.b); s.set(7, hy + 2 + swing, pc.d); }
      else { s.rect(11, hy - 3, 2, 2, pc.b); s.rect(12, hy - 1 + swing, 2, 4, pc.b); s.set(12, hy + 3 + swing, pc.d); }
    }
    if (pal.headband && !back && !pal.hood) {
      const hb = Px.ramp(pal.headband);
      if (side) s.line(4, hy - 2, 9, hy - 2, hb.b);
      else { s.rect(3, hy - 2, 10, 1, hb.b); s.set(8, hy - 2, hb.l); }
    }
    if (pal.furhood) {                                  // fur-lined parka hood ring
      const fh = Px.ramp(pal.furhood);
      s.fillEllipse(8, hy - 3, 7, 3, fh.b);
      for (let x = 2; x <= 14; x += 2) s.set(x, hy - 4, fh.l);   // fluffy edge
      if (!back) { s.set(2, hy + 1, fh.b); s.set(13, hy + 1, fh.b); }
    }
    if (pal.scarf && !back) {                           // scarf wound at the neck
      const sc = Px.ramp(pal.scarf);
      s.rect(5, hy + 4, 6, 2, sc.b); s.rect(5, hy + 4, 6, 1, sc.l);
      if (!side) { s.rect(6, hy + 5, 2, 3, sc.b); s.set(6, hy + 7, sc.d); }   // dangling end
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
    // ---- Team Ionar: storm-grey bodysuits, steel-blue panels, aurora-cyan
    // visors and a gold lightning emblem (Aqua/Magma-style faction identity) ----
    ionar_grunt: { skin: '#d0a070', hair: '#3a3a44', top: '#3a4a5e', bottom: '#2a2e38', shoe: '#1a1e26', hood: '#2c3a4c', visor: '#68e8f0', panel: '#3f6f92', emblem: '#f8d048' },
    ionar_grunt_f: { skin: '#e0a878', hair: '#3aa0b0', top: '#3a4a5e', bottom: '#2a2e38', shoe: '#1a1e26', visor: '#68e8f0', panel: '#3f6f92', emblem: '#f8d048', longHair: true, glasses: true, pony: '#3aa0b0' },
    ionar_sable: { skin: '#c89868', hair: '#7a5ac8', top: '#2e3a4e', bottom: '#20283a', shoe: '#14181f', coat: '#324a68', coatTrim: '#59e6b8', cape: '#3a2e5e', capeTrim: '#8d7bf0', emblem: '#68e8f0', longHair: true, pony: '#7a5ac8' },
    ionar_torr: { skin: '#c07a4a', hair: '#2a2e34', top: '#33404e', bottom: '#22282f', shoe: '#141820', coat: '#2a3846', pauldron: '#586878', headband: '#68e8f0', beard: '#22262c', spiky: true, emblem: '#f8d048' },
    ionar_boss: { skin: '#cca070', hair: '#dfe4ee', top: '#28324a', bottom: '#1a2030', shoe: '#10141c', coat: '#22304a', coatTrim: '#f8d048', cape: '#1c2740', capeTrim: '#59e6b8', pauldron: '#4a6a8a', sash: '#68e8f0', emblem: '#f8d048', spiky: true },
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

    // ---- Gym Leaders: each themed to their type ----
    leader_astrid: { skin: '#e8b088', hair: '#a06838', top: '#e8c060', bottom: '#8a6a44', shoe: '#6a4a2a', scarf: '#e07850', longHair: true, emblem: '#fff0c0' },        // Normal — homespun
    leader_eirik: { skin: '#d8a870', hair: '#5a4028', top: '#3a7848', bottom: '#5a4632', shoe: '#3a2c1a', cape: '#2e6a3e', capeTrim: '#8fd060', headband: '#8fd060', emblem: '#c8f0a0' },  // Grass — forest cloak
    leader_runa: { skin: '#e0a878', hair: '#3aa0c8', top: '#3878c8', bottom: '#28609c', shoe: '#1e4878', dress: '#3878c8', longHair: true, scarf: '#8fe0f0', emblem: '#c0f0ff' },        // Water — flowing
    leader_brandt: { skin: '#d89060', hair: '#e86838', top: '#c83828', bottom: '#4a3830', shoe: '#2a1e18', headband: '#f8a030', spiky: true, beard: '#a83828', emblem: '#f8d048' },     // Fire — rugged
    leader_sylja: { skin: '#e8b088', hair: '#c8b0e8', top: '#7a5ac0', bottom: '#4a3a6a', shoe: '#342858', coat: '#6a4ab0', coatTrim: '#59e6b8', longHair: true, bun: true, emblem: '#8de0f0' },  // Psychic — aurora robe
    leader_torvald: { skin: '#c88850', hair: '#6a5240', top: '#5a6470', bottom: '#3a4048', shoe: '#22262c', pauldron: '#8a94a4', goggles: true, beard: '#4a3828', emblem: '#c8d0dc' },  // Steel — smith
    leader_yrsa: { skin: '#e8b8a0', hair: '#c8d8e8', top: '#78c0e0', bottom: '#e8f0f8', shoe: '#88a0b8', furhood: '#e8f0f8', longHair: true, emblem: '#c0f0ff' },                        // Ice — parka
    leader_signe: { skin: '#d8a878', hair: '#3a3a4a', top: '#4a5a78', bottom: '#2e3648', shoe: '#c8a850', coat: '#3a4a6a', coatTrim: '#f8d048', cape: '#2a3450', capeTrim: '#f8d048', spiky: true, emblem: '#f8d048' },  // Dragon — regal storm

    // ---- Elite Four + Champion ----
    e4_corvin: { skin: '#d0b0a0', hair: '#20202a', top: '#2a2a34', bottom: '#1a1a22', shoe: '#101014', cape: '#181820', capeTrim: '#6a5a8a', hood: '#22222c', visor: '#8a5ac8', emblem: '#8a5ac8' },  // Dark — raven cloak
    e4_freyda: { skin: '#d89058', hair: '#e8a830', top: '#e86838', bottom: '#484850', shoe: '#2a2a30', headband: '#f8f0e0', pony: '#e8a830', emblem: '#f8d048' },                       // Fighting — athletic
    e4_mara: { skin: '#d8c8d0', hair: '#b8a8c8', top: '#6a5a7a', bottom: '#4a3e5a', shoe: '#342c44', dress: '#6a5a7a', longHair: true, bun: true, emblem: '#c8b8e0' },                   // Ghost — spectral
    e4_liv: { skin: '#e8b8a0', hair: '#f0a0c8', top: '#f0b8d8', bottom: '#f8e0ec', shoe: '#e090b8', dress: '#f0b8d8', longHair: true, bun: true, emblem: '#fff0f8' },                    // Fairy — dancer
    champion_sigrid: { skin: '#e0a878', hair: '#c8a038', top: '#3a7850', bottom: '#4a4632', shoe: '#6a5232', cape: '#2e6a5a', capeTrim: '#59e6b8', pony: '#c8a038', headband: '#f8d048', emblem: '#f8e8b0' },  // Champion — ranger's aurora cloak
    // ---- variety cast ----
    kid_boy: { skin: '#e8b088', hair: '#4a3222', top: '#f0c030', bottom: '#4878c8', shoe: '#c84838', hat: '#48a8d8', hatBill: true },
    kid_girl: { skin: '#e8b088', hair: '#c87838', top: '#f08888', bottom: '#f8f0e0', shoe: '#e05888', longHair: true, dress: '#f08888' },
    lass: { skin: '#e8b088', hair: '#e8b848', top: '#68b8e0', bottom: '#f8f8f0', shoe: '#4878c8', longHair: true, dress: '#68b8e0' },
    beauty: { skin: '#e8b088', hair: '#a84828', top: '#e858a0', bottom: '#f0e0e8', shoe: '#c8a848', longHair: true, dress: '#e858a0' },
    granny: { skin: '#d8a070', hair: '#d8d8d8', top: '#9878a8', bottom: '#786888', shoe: '#584848', bun: true, dress: '#9878a8', glasses: true },
    gentleman: { skin: '#e0a878', hair: '#b8b8c0', top: '#384048', bottom: '#282e34', shoe: '#181c20', accent: '#c8a850', hat: '#282e34', beard: true },
    scientist: { skin: '#e0a878', hair: '#584838', top: '#f0f0f0', bottom: '#485058', shoe: '#383e44', accent: '#a8b8c0', glasses: true },
    blackbelt: { skin: '#d89868', hair: '#241c14', top: '#f0ead8', bottom: '#f0ead8', shoe: '#c8b898', accent: '#282828', hat: '#c83828' },
    swimmer_m: { skin: '#d89058', hair: '#3858a8', top: '#d89058', bottom: '#3868c8', shoe: '#d89058' },
    swimmer_f: { skin: '#e0a070', hair: '#c85838', top: '#e8486a', bottom: '#e0a070', shoe: '#e0a070', longHair: true },
    skier: { skin: '#e8b088', hair: '#8a5a38', top: '#e86838', bottom: '#384858', shoe: '#282e34', accent: '#78d8e8', hat: '#f0f0f8' },
    miner: { skin: '#d8a070', hair: '#584838', top: '#c8a848', bottom: '#6a5a48', shoe: '#4a3e32', accent: '#f8e048', hat: '#e8c838', beard: true },
    punk: { skin: '#e0a878', hair: '#58c848', top: '#282830', bottom: '#7a2830', shoe: '#181c20', accent: '#c8c8d0' },
    waitress: { skin: '#e8b088', hair: '#5a3a28', top: '#383e44', bottom: '#f0f0f0', shoe: '#282e34', accent: '#f0f0f0', dress: '#383e44', longHair: true },
    camper: { skin: '#e0a878', hair: '#7a5238', top: '#488858', bottom: '#8a6a44', shoe: '#5a4632', hat: '#c8b848', hatBill: true, accent: '#e86838' },
    baldman: { skin: '#e0a878', hair: '#787068', top: '#a86848', bottom: '#586068', shoe: '#3a3e44', bald: true },
    monk: { skin: '#d8a070', hair: '#484038', top: '#c87838', bottom: '#a86028', shoe: '#6a4a2a', bald: true, beard: true },
  };

  /**
   * Deterministic variety pools: generic map sprites fan out into a cast so
   * towns don't repeat the same two villagers. Pick is stable per map spot.
   */
  const VARIETY = {
    npc_villager: ['npc_villager', 'kid_boy', 'camper', 'scientist', 'baldman', 'punk', 'gentleman'],
    npc_woman: ['npc_woman', 'kid_girl', 'lass', 'granny', 'beauty', 'waitress'],
    npc_oldman: ['npc_oldman', 'gentleman', 'monk', 'baldman'],
  };

  return {
    palettes: PALETTES,
    /** Stable per-spot pick from a generic sprite's variety pool. */
    vary(id, seed) {
      const pool = VARIETY[id];
      if (!pool) return id;
      return pool[(seed >>> 0) % pool.length];
    },
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
