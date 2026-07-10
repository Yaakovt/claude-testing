/* util.js — shared helpers, procedural textures & materials. */
'use strict';
window.PORTAL = window.PORTAL || {};

(function (P) {

  P.V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  P.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  P.lerp = (a, b, t) => a + (b - a) * t;

  // ---------------------------------------------------------------- textures
  function canvasTex(size, draw, repeatX, repeatY) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeatX) t.repeat.set(repeatX, repeatY || repeatX);
    t.anisotropy = 4;
    return t;
  }

  function panelTexture(base, line, weathering) {
    return canvasTex(256, (g, s) => {
      g.fillStyle = base; g.fillRect(0, 0, s, s);
      // subtle noise
      for (let i = 0; i < 900; i++) {
        g.fillStyle = 'rgba(0,0,0,' + (Math.random() * weathering) + ')';
        g.fillRect(Math.random() * s, Math.random() * s, 2, 2);
      }
      // panel seams (2x2 panels per tile)
      g.strokeStyle = line; g.lineWidth = 3;
      g.strokeRect(1, 1, s - 2, s - 2);
      g.beginPath();
      g.moveTo(s / 2, 0); g.lineTo(s / 2, s);
      g.moveTo(0, s / 2); g.lineTo(s, s / 2);
      g.stroke();
      // corner screws
      g.fillStyle = 'rgba(0,0,0,0.25)';
      for (const px of [8, s / 2 + 8, s - 10])
        for (const py of [8, s / 2 + 8, s - 10]) {
          g.beginPath(); g.arc(px, py, 2.4, 0, 7); g.fill();
        }
    });
  }

  P.buildMaterials = function () {
    const white = panelTexture('#cfd3d4', 'rgba(90,96,100,0.55)', 0.05);
    const metal = panelTexture('#3a4045', 'rgba(12,14,16,0.8)', 0.10);
    const floor = panelTexture('#565d63', 'rgba(20,22,25,0.85)', 0.12);
    const rust = panelTexture('#54422f', 'rgba(20,12,6,0.9)', 0.30);
    const scorch = panelTexture('#98948a', 'rgba(45,40,34,0.75)', 0.22);

    P.mats = {
      // portal-friendly white wall panels
      white: new THREE.MeshLambertMaterial({ map: white }),
      // dark metal — portals refuse to stick
      metal: new THREE.MeshLambertMaterial({ map: metal }),
      // backstage surfaces: corroded plate (no portals) & scorched panel (portals OK)
      rust: new THREE.MeshLambertMaterial({ map: rust }),
      scorch: new THREE.MeshLambertMaterial({ map: scorch }),
      floorm: new THREE.MeshLambertMaterial({ map: floor }),
      glass: new THREE.MeshLambertMaterial({
        color: 0xbfe8ff, transparent: true, opacity: 0.22,
        side: THREE.DoubleSide, depthWrite: false
      }),
      goo: new THREE.MeshLambertMaterial({ color: 0x4a3b10, emissive: 0x2a2405 }),
      doorFrame: new THREE.MeshLambertMaterial({ color: 0x22262a }),
      door: new THREE.MeshLambertMaterial({ color: 0x9aa4ab }),
      button: new THREE.MeshLambertMaterial({ color: 0xd23b2e, emissive: 0x3a0c08 }),
      buttonBase: new THREE.MeshLambertMaterial({ color: 0x767e85 }),
      cube: new THREE.MeshLambertMaterial({ color: 0x8f979e }),
      cubeEdge: new THREE.MeshLambertMaterial({ color: 0x545b61 }),
      turret: new THREE.MeshLambertMaterial({ color: 0xe8eaec }),
      sign: new THREE.MeshBasicMaterial({ color: 0x0e1112 }),
      elevator: new THREE.MeshLambertMaterial({ color: 0x2c3338, emissive: 0x0a2030 }),
    };
    // uv scale per world unit is handled in geometry builder
  };

  // Box mesh whose texture repeats once per world-unit-ish on each face.
  P.boxMesh = function (w, h, d, mat, uvScale) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const s = uvScale || 0.5; // texture tiles per unit
    const uv = geo.attributes.uv, pos = geo.attributes.position;
    // BoxGeometry face order: +x,-x,+y,-y,+z,-z (4 verts each)
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) {
      const [du, dv] = dims[f];
      for (let i = 0; i < 4; i++) {
        const k = f * 4 + i;
        uv.setXY(k, uv.getX(k) * du * s, uv.getY(k) * dv * s);
      }
    }
    return new THREE.Mesh(geo, mat);
  };

  // Text label plate (for chamber signs)
  P.textPlate = function (lines, w, h) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#dfe5e8'; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = '#30363b'; g.lineWidth = 10; g.strokeRect(5, 5, 502, 246);
    g.fillStyle = '#22282c'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((ln, i) => {
      g.font = (i === 0 ? 'bold 84px' : '28px') + ' Arial';
      g.fillText(ln, 256, i === 0 ? 92 : 170 + (i - 1) * 38);
    });
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: t }));
    return m;
  };

})(window.PORTAL);
