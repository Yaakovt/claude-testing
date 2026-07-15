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
    const cv = document.createElement('canvas');
    cv.width = 48; cv.height = 48;
    const c = cv.getContext('2d');
    // facing LEFT (toward the player's fakemon). A simple pixel-blocky figure.
    // shadow
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(24, 45, 12, 3, 0, 0, Math.PI * 2); c.fill();
    // legs
    c.fillStyle = st.pants; c.fillRect(19, 34, 5, 11); c.fillRect(25, 34, 5, 11);
    c.fillStyle = '#20242a'; c.fillRect(18, 44, 7, 3); c.fillRect(25, 44, 7, 3);   // shoes
    // torso (coat)
    c.fillStyle = st.coat; c.fillRect(16, 20, 17, 16);
    c.fillStyle = shade(st.coat, -18); c.fillRect(16, 20, 4, 16);                  // side shading
    // throwing arm raised to the left
    c.fillStyle = st.coat; c.fillRect(8, 18, 10, 4);
    c.fillStyle = st.skin; c.fillRect(6, 17, 4, 4);                                // hand
    // head
    c.fillStyle = st.skin; c.beginPath(); c.arc(24, 14, 7, 0, Math.PI * 2); c.fill();
    // hair
    c.fillStyle = st.hair;
    c.beginPath(); c.arc(24, 12, 7, Math.PI, 0); c.fill();
    c.fillRect(17, 10, 5, 6);                                                       // side fringe (facing left)
    if (st.long) { c.fillRect(28, 12, 5, 12); }                                     // long hair down the back
    // eye (facing left)
    c.fillStyle = '#20202a'; c.fillRect(20, 13, 2, 2);
    // hat
    if (st.hat) { c.fillStyle = st.hat; c.fillRect(16, 7, 15, 3); c.fillRect(12, 9, 8, 2); }
    return cv;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  return {
    get(tr) {
      // Allow an external override sprite (Fable) via the asset manifest.
      const key = (tr.id && (tr.id.startsWith('rival') ? 'rival' : tr.id === 'ionar_boss' ? 'ionar_boss' : tr.id === 'aspen_master' ? 'aspen_master' : (tr.cls || 'default'))) || 'default';
      if (typeof Assets !== 'undefined') { const ov = Assets.get('trainers/' + key); if (ov) return ov; }
      if (!cache[key]) cache[key] = render(styleFor(tr));
      return cache[key];
    },
  };
})();
