'use strict';
/**
 * Procedural in-battle TRAINER sprites — drawn to a cached 48×48 canvas and
 * shown on the foe's side until they send out their first fakemon. Every named
 * boss (each gym leader, Elite Four member, the champion, and the whole Team
 * Ionar hierarchy) has its own style; ordinary route trainers key off class.
 * An external PNG at `trainers/<key>` (via the asset manifest) overrides.
 *
 * Facing LEFT, mid ball-throw. Styles carry a small feature vocabulary
 * (cape / coat / hood / spiky / beard / pauldron / long / headband / emblem)
 * so each figure reads as distinctly as its overworld walker.
 */
const TrainerArt = (() => {
  const cache = {};

  // f: feature flags — cape,capeTrim,coat,coatTrim,hood,visor,spiky,beard,
  // pauldron,long,headband,emblem,panel,sash,bun,glasses,fur,scarf,hat
  const STYLES = {
    // ---- ordinary route classes ----
    leader: { skin: '#e8b088', hair: '#3a2a20', coat: '#c0392b', pants: '#2c3e50' },
    elite: { skin: '#e0a878', hair: '#20202a', coat: '#5a3a8a', pants: '#20202a' },
    rival: { skin: '#e8b088', hair: '#d0803a', coat: '#3a6ea5', pants: '#2c2c34', f: { spiky: 1 } },
    professor: { skin: '#e8b088', hair: '#b8b8b8', coat: '#eef0f2', pants: '#8090a0', f: { glasses: 1 } },
    hiker: { skin: '#e0a878', hair: '#7a4a2a', coat: '#b5651d', pants: '#4a5a3a', f: { hat: '#a85838', beard: '#5a3a1a' } },
    fisher: { skin: '#d09868', hair: '#333333', coat: '#3a78b8', pants: '#c8a848', f: { hat: '#e8e8e8' } },
    sailor: { skin: '#d8a878', hair: '#222228', coat: '#f0f0f0', pants: '#385898' },
    ranger: { skin: '#e0a878', hair: '#4a3a28', coat: '#4a9850', pants: '#786848', f: { hat: '#487848' } },
    psychic: { skin: '#e8b088', hair: '#6a3ab0', coat: '#7a5ac0', pants: '#3a2a5a', f: { long: 1 } },
    lass: { skin: '#e8b088', hair: '#c86838', coat: '#e86890', pants: '#c04868', f: { long: 1 } },
    beauty: { skin: '#e8b088', hair: '#a83838', coat: '#e8a048', pants: '#c85858', f: { long: 1 } },
    blackbelt: { skin: '#d89868', hair: '#181818', coat: '#f0f0f0', pants: '#181818', f: { headband: '#c83828' } },
    miner: { skin: '#d0a070', hair: '#3a2a1a', coat: '#8a7a4a', pants: '#4a4238', f: { hat: '#f0d040', beard: '#3a2a1a' } },
    tower: { skin: '#e0a878', hair: '#2a2a3a', coat: '#38506a', pants: '#22303f' },
    default: { skin: '#e0a878', hair: '#6a4a2a', coat: '#4a90d0', pants: '#3a4050' },

    // ---- Team Ionar (storm-grey uniforms, cyan visors, gold lightning) ----
    ionar_grunt_m: { skin: '#d0a070', hair: '#3a3a44', coat: '#3a4a5e', pants: '#2a2e38', f: { hood: '#2c3a4c', visor: '#68e8f0', panel: '#3f6f92', emblem: '#f8d048' } },
    ionar_grunt_f: { skin: '#e0a878', hair: '#3aa0b0', coat: '#3a4a5e', pants: '#2a2e38', f: { panel: '#3f6f92', emblem: '#f8d048', long: 1, glasses: 1 } },
    ionar_sable: { skin: '#c89868', hair: '#7a5ac8', coat: '#324a68', pants: '#20283a', f: { coatTrim: '#59e6b8', cape: '#3a2e5e', capeTrim: '#8d7bf0', emblem: '#68e8f0', long: 1 } },
    ionar_torr: { skin: '#c07a4a', hair: '#2a2e34', coat: '#2a3846', pants: '#22282f', f: { pauldron: '#586878', headband: '#68e8f0', beard: '#22262c', spiky: 1, emblem: '#f8d048' } },
    ionar_boss: { skin: '#cca070', hair: '#dfe4ee', coat: '#22304a', pants: '#1a2030', f: { coatTrim: '#f8d048', cape: '#1c2740', capeTrim: '#59e6b8', pauldron: '#4a6a8a', sash: '#68e8f0', emblem: '#f8d048', spiky: 1 } },

    // ---- Gym Leaders ----
    astrid: { skin: '#e8b088', hair: '#a06838', coat: '#e8c060', pants: '#8a6a44', f: { scarf: '#e07850', long: 1 } },
    eirik: { skin: '#d8a870', hair: '#5a4028', coat: '#3a7848', pants: '#5a4632', f: { cape: '#2e6a3e', capeTrim: '#8fd060', headband: '#8fd060' } },
    runa: { skin: '#e0a878', hair: '#3aa0c8', coat: '#3878c8', pants: '#28609c', f: { long: 1, scarf: '#8fe0f0' } },
    brandt: { skin: '#d89060', hair: '#e86838', coat: '#c83828', pants: '#4a3830', f: { headband: '#f8a030', spiky: 1, beard: '#a83828' } },
    sylja: { skin: '#e8b088', hair: '#c8b0e8', coat: '#6a4ab0', pants: '#4a3a6a', f: { coatTrim: '#59e6b8', long: 1, cape: '#5a3aa0', capeTrim: '#8de0f0' } },
    torvald: { skin: '#c88850', hair: '#6a5240', coat: '#5a6470', pants: '#3a4048', f: { pauldron: '#8a94a4', glasses: 1, beard: '#4a3828' } },
    yrsa: { skin: '#e8b8a0', hair: '#c8d8e8', coat: '#78c0e0', pants: '#e8f0f8', f: { fur: '#e8f0f8', long: 1 } },
    signe: { skin: '#d8a878', hair: '#3a3a4a', coat: '#4a5a78', pants: '#2e3648', f: { cape: '#2a3450', capeTrim: '#f8d048', spiky: 1, emblem: '#f8d048' } },

    // ---- Elite Four + Champion ----
    e4_corvin: { skin: '#d0b0a0', hair: '#20202a', coat: '#2a2a34', pants: '#1a1a22', f: { cape: '#181820', capeTrim: '#6a5a8a', hood: '#22222c', visor: '#8a5ac8', emblem: '#8a5ac8' } },
    e4_freyda: { skin: '#d89058', hair: '#e8a830', coat: '#e86838', pants: '#484850', f: { headband: '#f8f0e0', spiky: 1 } },
    e4_mara: { skin: '#d8c8d0', hair: '#b8a8c8', coat: '#6a5a7a', pants: '#4a3e5a', f: { long: 1, bun: 1 } },
    e4_liv: { skin: '#e8b8a0', hair: '#f0a0c8', coat: '#f0b8d8', pants: '#f8e0ec', f: { long: 1, bun: 1 } },
    champion_sigrid: { skin: '#e0a878', hair: '#c8a038', coat: '#3a7850', pants: '#4a4632', f: { cape: '#2e6a5a', capeTrim: '#59e6b8', headband: '#f8d048', emblem: '#f8e8b0' } },
  };

  function styleFor(key) { return STYLES[key] || STYLES.default; }

  /** Resolve a trainer to a style key (specific bosses first, then class). */
  function keyFor(tr) {
    const id = tr.id || '';
    if (STYLES[id]) return id;                                  // named boss
    if (id.startsWith('rival')) return 'rival';
    if (id === 'ionar_grunt2') return 'ionar_grunt_f';         // second grunt is female
    if (id === 'ionar_grunt1') return 'ionar_grunt_m';
    if (id === 'aspen_master') return 'professor';
    const c = (tr.cls || '').toLowerCase();
    if (c.includes('ionar') && (c.includes('lieutenant') || c.includes('leader'))) return 'ionar_torr';
    if (c.includes('ionar')) return 'ionar_grunt_m';
    if (c.includes('champion')) return 'champion_sigrid';
    if (c.includes('elite')) return 'elite';
    if (c.includes('leader')) return 'leader';
    if (c.includes('professor')) return 'professor';
    if (c.includes('tower')) return 'tower';
    if (c.includes('hiker')) return 'hiker';
    if (c.includes('fisher')) return 'fisher';
    if (c.includes('sailor') || c.includes('swimmer')) return 'sailor';
    if (c.includes('ranger')) return 'ranger';
    if (c.includes('psychic') || c.includes('hex') || c.includes('mystic') || c.includes('druid')) return 'psychic';
    if (c.includes('lass') || c.includes('picnicker') || c.includes('twins')) return 'lass';
    if (c.includes('aroma') || c.includes('beauty') || c.includes('lady')) return 'beauty';
    if (c.includes('belt') || c.includes('hunter')) return 'blackbelt';
    if (c.includes('miner') || c.includes('firebreather')) return 'miner';
    return 'default';
  }

  function render(st) {
    const f = st.f || {};
    const s = new PixelSurface(48, 48);
    const skin = Px.ramp(st.skin), hair = Px.ramp(st.hair);
    const coat = Px.ramp(st.coat), pants = Px.ramp(st.pants);

    s.fillEllipse(24, 45, 13, 3, '#00000030');                 // cast shadow

    // cape drapes behind everything
    if (f.cape) {
      const cp = Px.ramp(f.cape);
      s.fillPoly([[16, 18], [34, 18], [38, 44], [12, 44]], cp.b);
      s.line(12, 44, 38, 44, cp.d);
      s.line(17, 20, 14, 42, cp.l);
      s.line(26, 19, 26, 43, cp.d);
      if (f.capeTrim) { const t = Px.ramp(f.capeTrim); s.line(12, 43, 38, 43, t.b); s.line(15, 30, 15, 42, t.b); }
    }

    // legs in an A-stance
    s.fillPoly([[27, 32], [32, 32], [34, 43], [29, 43]], pants.d);
    s.rect(29, 43, 7, 3, '#20242a'); s.rect(34, 43, 2, 2, '#31353d');
    s.fillPoly([[19, 32], [24, 32], [22, 43], [17, 43]], pants.b);
    s.line(20, 33, 19, 42, pants.l);
    s.rect(14, 43, 8, 3, '#282c34'); s.rect(14, 43, 8, 1, '#3f444d');

    // long coat skirt over the legs
    if (f.coat) {
      s.fillPoly([[15, 30], [33, 30], [35, 44], [13, 44]], coat.d);
      s.rect(22, 30, 3, 14, Px.shift(st.coat, 0, 0, -0.14));   // front split
      s.line(14, 31, 13, 43, coat.b);
      if (f.coatTrim) { const t = Px.ramp(f.coatTrim); s.line(20, 31, 20, 43, t.b); s.line(27, 31, 27, 43, t.d); }
    }

    // torso
    s.fillPoly([[16, 18], [31, 19], [33, 33], [17, 33]], coat.b);
    s.fillPoly([[28, 19], [31, 19], [33, 33], [30, 33]], coat.d);
    s.line(17, 20, 16, 31, coat.l);
    s.rect(17, 31, 16, 2, coat.d);
    if (f.panel) { const p = Px.ramp(f.panel); s.rect(19, 20, 11, 4, p.b); s.rect(19, 20, 11, 1, p.l); }
    if (f.sash) { const sa = Px.ramp(f.sash); s.line(18, 20, 31, 30, sa.b); s.line(18, 21, 31, 31, sa.d); }
    if (f.emblem) { const em = Px.ramp(f.emblem); s.rect(22, 24, 3, 3, em.b); s.set(23, 25, em.l); s.set(24, 26, em.d); }
    if (f.pauldron) { const pd = Px.ramp(f.pauldron); s.rect(15, 18, 5, 3, pd.b); s.rect(29, 18, 5, 3, pd.b); s.set(15, 18, pd.l); s.set(33, 20, pd.d); }

    // back arm trailing
    s.fillPoly([[30, 21], [35, 23], [34, 29], [31, 27]], coat.d);
    s.rect(33, 29, 3, 3, skin.d);

    // throwing arm up-left
    s.fillPoly([[18, 21], [9, 15], [7, 18], [16, 25]], coat.l);
    s.line(17, 22, 9, 17, coat.b);
    s.rect(5, 13, 4, 4, skin.b); s.set(4, 14, skin.b); s.set(6, 12, skin.l);

    // ---- head ----
    s.fillEllipse(24, 12, 7, 6, skin.b);
    s.rect(16, 12, 2, 3, skin.b); s.set(16, 14, skin.d);       // nose
    s.set(28, 13, skin.d); s.rect(27, 12, 2, 3, skin.d);       // ear

    if (f.hood) {
      // helmet shell + glowing visor slit
      const hc = Px.ramp(f.hood), vis = f.visor || '#68e8f0';
      s.fillEllipse(24, 9, 8, 5, hc.b);
      s.rect(16, 7, 16, 4, hc.b); s.rect(16, 7, 16, 1, hc.l);
      s.rect(16, 11, 12, 1, hc.d);
      s.line(16, 12, 21, 12, vis); s.set(16, 12, '#ffffff');   // visor (profile)
      s.rect(16, 14, 4, 3, skin.d);                            // shadowed jaw
    } else {
      // eye + brow
      s.rect(19, 11, 2, 2, '#20202a'); s.set(19, 11, '#f4f4f4');
      s.line(18, 9, 21, 9, hair.d);
      s.set(18, 17, skin.d);                                   // mouth
      // hair
      if (f.spiky) {
        s.fillEllipse(25, 8, 7, 3, hair.b);
        for (const [hx, hy2] of [[18, 4], [22, 3], [26, 4], [30, 5]]) { s.line(hx, 8, hx - 1, hy2, hair.b); s.set(hx - 1, hy2, hair.l); }
        s.rect(17, 8, 14, 2, hair.b);
      } else {
        s.fillEllipse(25, 8, 7, 4, hair.b);
        s.rect(18, 6, 13, 4, hair.b);
        s.fillPoly([[17, 8], [21, 7], [20, 12], [17, 12]], hair.b);
        s.line(19, 5, 25, 5, hair.l);
      }
      if (f.long) { s.fillPoly([[29, 9], [34, 12], [34, 27], [29, 25]], hair.b); s.line(34, 14, 34, 26, hair.d); }
      if (f.bun) { s.fillCircle(30, 6, 3, hair.b); s.set(29, 5, hair.l); }
      if (f.headband) { const hb = Px.ramp(f.headband); s.rect(17, 9, 14, 1, hb.b); s.set(24, 9, hb.l); }
      if (f.glasses) { s.rect(18, 11, 5, 2, '#2a2430'); s.set(20, 11, '#88a8c8'); }
      if (f.beard) { const bd = Px.ramp(f.beard); s.rect(15, 15, 8, 3, bd.b); s.set(16, 18, bd.d); s.set(18, 17, '#a06848'); }
      if (f.fur) { const fu = Px.ramp(f.fur); s.fillEllipse(24, 6, 9, 3, fu.b); for (let x = 16; x <= 32; x += 3) s.set(x, 4, fu.l); }
      if (f.hat) { const ht = Px.ramp(f.hat); s.fillEllipse(24, 6, 8, 4, ht.b); s.rect(16, 5, 16, 3, ht.b); s.rect(16, 7, 16, 1, ht.d); s.rect(10, 7, 8, 2, ht.d); }
    }

    s.outline('#241c20');
    return s.toCanvas();
  }

  return {
    get(tr) {
      const key = keyFor(tr);
      if (typeof Assets !== 'undefined') { const ov = Assets.get('trainers/' + key); if (ov) return ov; }
      if (!cache[key]) cache[key] = render(styleFor(key));
      return cache[key];
    },
  };
})();
