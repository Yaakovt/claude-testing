'use strict';
/**
 * Procedural in-battle TRAINER sprites — one per trainer class, drawn to a
 * cached 48×48 canvas and shown on the foe's side until they send out their
 * first fakemon. These are honest placeholders; Fable will replace each class
 * (and the named bosses) with proper battle art. The look keys off trainer.cls,
 * with a few id-specific styles for the rival, champion and Ionar boss.
 */
const TrainerArt = (() => {
  const cache = {};

  // style: { skin, hair, coat, pants, hat?:color, long?:bool }
  const STYLES = {
    leader: { skin: '#e8b088', hair: '#3a2a20', coat: '#c0392b', pants: '#2c3e50' },
    champion: { skin: '#e8b088', hair: '#c8a030', coat: '#d4af37', pants: '#3a2c1a' },
    elite: { skin: '#e0a878', hair: '#20202a', coat: '#5a3a8a', pants: '#20202a' },
    rival: { skin: '#e8b088', hair: '#d0803a', coat: '#3a6ea5', pants: '#2c2c34' },
    ionar: { skin: '#d8a878', hair: '#404048', coat: '#59626e', pants: '#33383f', hat: '#3a4048' },
    ionarlead: { skin: '#d0a070', hair: '#2a2a30', coat: '#46505c', pants: '#2a2e34', hat: '#2f353d' },
    professor: { skin: '#e8b088', hair: '#b8b8b8', coat: '#eef0f2', pants: '#8090a0' },
    hiker: { skin: '#e0a878', hair: '#7a4a2a', coat: '#b5651d', pants: '#4a5a3a', hat: '#a85838' },
    fisher: { skin: '#d09868', hair: '#333333', coat: '#3a78b8', pants: '#c8a848', hat: '#e8e8e8' },
    sailor: { skin: '#d8a878', hair: '#222228', coat: '#f0f0f0', pants: '#385898' },
    ranger: { skin: '#e0a878', hair: '#4a3a28', coat: '#4a9850', pants: '#786848', hat: '#487848' },
    psychic: { skin: '#e8b088', hair: '#6a3ab0', coat: '#7a5ac0', pants: '#3a2a5a', long: true },
    lass: { skin: '#e8b088', hair: '#c86838', coat: '#e86890', pants: '#c04868', long: true },
    beauty: { skin: '#e8b088', hair: '#a83838', coat: '#e8a048', pants: '#c85858', long: true },
    blackbelt: { skin: '#d89868', hair: '#181818', coat: '#f0f0f0', pants: '#181818' },
    miner: { skin: '#d0a070', hair: '#3a2a1a', coat: '#8a7a4a', pants: '#4a4238', hat: '#f0d040' },
    tower: { skin: '#e0a878', hair: '#2a2a3a', coat: '#38506a', pants: '#22303f' },
    grunt: { skin: '#d8a878', hair: '#404048', coat: '#59626e', pants: '#33383f', hat: '#3a4048' },
    default: { skin: '#e0a878', hair: '#6a4a2a', coat: '#4a90d0', pants: '#3a4050' },
  };

  function styleFor(tr) {
    const id = tr.id || '';
    if (id.startsWith('rival')) return STYLES.rival;
    if (id === 'ionar_boss') return STYLES.ionarlead;
    if (id === 'aspen_master') return STYLES.professor;
    const c = (tr.cls || '').toLowerCase();
    if (c.includes('champion')) return STYLES.champion;
    if (c.includes('elite')) return STYLES.elite;
    if (c.includes('leader') && c.includes('ionar')) return STYLES.ionarlead;
    if (c.includes('lieutenant')) return STYLES.ionarlead;
    if (c.includes('leader')) return STYLES.leader;
    if (c.includes('ionar')) return STYLES.ionar;
    if (c.includes('professor')) return STYLES.professor;
    if (c.includes('tower')) return STYLES.tower;
    if (c.includes('hiker')) return STYLES.hiker;
    if (c.includes('fisher')) return STYLES.fisher;
    if (c.includes('sailor') || c.includes('swimmer')) return STYLES.sailor;
    if (c.includes('ranger')) return STYLES.ranger;
    if (c.includes('psychic') || c.includes('hex') || c.includes('mystic') || c.includes('druid')) return STYLES.psychic;
    if (c.includes('lass') || c.includes('picnicker') || c.includes('twins')) return STYLES.lass;
    if (c.includes('aroma') || c.includes('beauty') || c.includes('lady')) return STYLES.beauty;
    if (c.includes('belt') || c.includes('hunter')) return STYLES.blackbelt;
    if (c.includes('miner') || c.includes('firebreather')) return STYLES.miner;
    if (c.includes('grunt')) return STYLES.grunt;
    return STYLES.default;
  }

  function render(st) {
    // Dynamic "just threw the ball" pose facing LEFT, built on the pixel
    // toolkit with proper ramps, cast shadow and a silhouette outline.
    const s = new PixelSurface(48, 48);
    const skin = Px.ramp(st.skin), hair = Px.ramp(st.hair);
    const coat = Px.ramp(st.coat), pants = Px.ramp(st.pants);

    s.fillEllipse(24, 45, 13, 3, '#00000030');                    // cast shadow

    // legs in an A-stance: weight on the forward (left) leg
    s.fillPoly([[27, 32], [32, 32], [34, 43], [29, 43]], pants.d); // back leg
    s.rect(29, 43, 7, 3, '#20242a'); s.rect(34, 43, 2, 2, '#31353d');
    s.fillPoly([[19, 32], [24, 32], [22, 43], [17, 43]], pants.b); // front leg
    s.line(20, 33, 19, 42, pants.l);                               // crease
    s.rect(14, 43, 8, 3, '#282c34'); s.rect(14, 43, 8, 1, '#3f444d');

    // torso: coat leaning into the throw, lit from upper-left
    s.fillPoly([[16, 18], [31, 19], [33, 33], [17, 33]], coat.b);
    s.fillPoly([[28, 19], [31, 19], [33, 33], [30, 33]], coat.d);  // far-side shade
    s.line(17, 20, 16, 31, coat.l);                                // near-edge light
    s.rect(17, 31, 16, 2, coat.d);                                 // hem
    s.set(22, 24, coat.d); s.set(23, 28, coat.d);                  // fold hints

    // back arm trailing behind the swing
    s.fillPoly([[30, 21], [35, 23], [34, 29], [31, 27]], coat.d);
    s.rect(33, 29, 3, 3, skin.d);                                  // trailing hand

    // throwing arm extended up-left with an open hand
    s.fillPoly([[18, 21], [9, 15], [7, 18], [16, 25]], coat.l);
    s.line(17, 22, 9, 17, coat.b);
    s.rect(5, 13, 4, 4, skin.b); s.set(4, 14, skin.b);             // open palm
    s.set(6, 12, skin.l);

    // head in profile: jaw toward the foe, ear on the near side
    s.fillEllipse(24, 12, 7, 6, skin.b);
    s.rect(16, 12, 2, 3, skin.b);                                  // nose
    s.set(16, 14, skin.d);
    s.set(28, 13, skin.d); s.rect(27, 12, 2, 3, skin.d);           // ear shade
    s.rect(19, 11, 2, 2, '#20202a'); s.set(19, 11, '#f4f4f4');     // keen eye
    s.line(18, 9, 21, 9, hair.d);                                  // brow
    s.set(18, 17, skin.d);                                         // set mouth

    // hair: swept crown + fringe, optional long fall down the back
    s.fillEllipse(25, 8, 7, 4, hair.b);
    s.rect(18, 6, 13, 4, hair.b);
    s.fillPoly([[17, 8], [21, 7], [20, 12], [17, 12]], hair.b);     // fringe
    s.line(19, 5, 25, 5, hair.l);                                  // sheen
    s.set(31, 9, hair.d);
    if (st.long) {
      s.fillPoly([[29, 10], [33, 12], [33, 25], [29, 24]], hair.b);
      s.line(33, 14, 33, 24, hair.d); s.set(31, 25, hair.d);
    }

    // hat: domed cap with a forward bill
    if (st.hat) {
      const hat = Px.ramp(st.hat);
      s.fillEllipse(24, 6, 8, 4, hat.b);
      s.rect(16, 5, 16, 3, hat.b);
      s.rect(16, 7, 16, 1, hat.d);                                 // band
      s.rect(10, 7, 8, 2, hat.d); s.rect(10, 7, 8, 1, hat.b);      // bill
      s.line(20, 3, 26, 3, hat.l);
    }

    s.outline('#241c20');
    return s.toCanvas();
  }

  return {
    get(tr) {
      // Allow an external override sprite (Fable) via the asset manifest.
      const id = tr.id || '';
      const key = id.startsWith('rival') ? 'rival'
        : id === 'ionar_boss' ? 'ionar_boss'
        : id === 'aspen_master' ? 'aspen_master'
        : (tr.cls || 'default');
      if (typeof Assets !== 'undefined') { const ov = Assets.get('trainers/' + key); if (ov) return ov; }
      if (!cache[key]) cache[key] = render(styleFor(tr));
      return cache[key];
    },
  };
})();
