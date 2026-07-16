'use strict';
/**
 * Region map (Town Map key item). A stylized chart of Norvenna's towns along
 * the northbound trail, with a "you are here" marker. B or A closes it.
 */
const MapUI = {
  prevState: null,
  t: 0,
  // town nodes bottom->top along the journey (x, y on the 240x160 screen)
  NODES: [
    { id: 'frosthollow', name: 'Frosthollow', x: 40, y: 142 },
    { id: 'birchwick', name: 'Birchwick', x: 92, y: 130 },
    { id: 'mossmere', name: 'Mossmere', x: 150, y: 122 },
    { id: 'tidesend', name: 'Tidesend', x: 202, y: 108 },
    { id: 'emberfall', name: 'Emberfall', x: 158, y: 94 },
    { id: 'lumenveil', name: 'Lumenveil', x: 100, y: 82 },
    { id: 'irondeep', name: 'Irondeep', x: 48, y: 70 },
    { id: 'frostmoor', name: 'Frostmoor', x: 96, y: 56 },
    { id: 'glacierholm', name: 'Glacierholm', x: 152, y: 44 },
    { id: 'stormcrest', name: 'Stormcrest', x: 200, y: 32 },
    { id: 'plateau', name: 'Aurora Plateau', x: 150, y: 22 },
  ],
  // routes / interiors resolve to the nearest town node
  REGION: {
    route1: 'birchwick', route2: 'mossmere', route3: 'tidesend', route4: 'emberfall',
    route5: 'lumenveil', route6: 'irondeep', route7: 'frostmoor', route8: 'glacierholm',
    route9: 'stormcrest', aspen_lab: 'frosthollow', player_room: 'frosthollow',
    birchwick_gym: 'birchwick', mossmere_gym: 'mossmere', tidesend_gym: 'tidesend',
    emberfall_gym: 'emberfall', lumenveil_gym: 'lumenveil', irondeep_gym: 'irondeep',
    glacierholm_gym: 'glacierholm', stormcrest_gym: 'stormcrest',
    aurora_plateau: 'plateau', sky_spire: 'plateau',
  },

  open() {
    MapUI.prevState = Game.state;
    MapUI.t = 0;
    Game.setState('map');
    AudioSys.sfx('confirm');
  },

  currentNode() {
    const id = MapUI.REGION[Game.mapId] || Game.mapId;
    let n = MapUI.NODES.findIndex((nd) => nd.id === id);
    if (n < 0) n = 0;
    return n;
  },

  update() {
    MapUI.t++;
    if (Input.pressed.a || Input.pressed.b || Input.pressed.start) {
      AudioSys.sfx('cancel');
      Game.setState(MapUI.prevState === 'map' ? 'overworld' : (MapUI.prevState || 'overworld'));
    }
  },

  draw(ctx) {
    // parchment map backdrop
    for (let y = 0; y < 160; y++) {
      const f = y / 160;
      ctx.fillStyle = Px.rgbToHex(Util.lerp(228, 210, f), Util.lerp(216, 198, f), Util.lerp(180, 160, f));
      ctx.fillRect(0, y, 240, 1);
    }
    // faint sea to the east + snowfields
    ctx.fillStyle = 'rgba(120,170,200,0.30)'; ctx.fillRect(200, 40, 40, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 16, 240, 26);
    // title bar
    ctx.fillStyle = '#4a3a28'; ctx.fillRect(0, 0, 240, 14);
    Font.draw(ctx, 'NORVENNA REGION', 120 - Font.width('NORVENNA REGION') / 2, 3, { color: '#f0e0b0', shadow: '#201810' });

    // trail connectors
    ctx.strokeStyle = '#9a7a4a'; ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    MapUI.NODES.forEach((n, i) => { if (i === 0) ctx.moveTo(n.x, n.y); else ctx.lineTo(n.x, n.y); });
    ctx.stroke();
    ctx.setLineDash([]);

    const cur = MapUI.currentNode();
    MapUI.NODES.forEach((n, i) => {
      // node marker: a little roofed house, gold for the plateau
      const c = i === MapUI.NODES.length - 1 ? '#c8a038' : '#c85848';
      ctx.fillStyle = '#5a4030'; ctx.fillRect(n.x - 4, n.y - 1, 8, 5);   // house body
      ctx.fillStyle = c;                                                  // roof
      ctx.beginPath(); ctx.moveTo(n.x - 5, n.y - 1); ctx.lineTo(n.x, n.y - 6); ctx.lineTo(n.x + 5, n.y - 1); ctx.closePath(); ctx.fill();
      // label (kept on-screen)
      const lbl = n.name;
      let lx = n.x + 7; if (lx + Font.width(lbl) > 238) lx = n.x - 7 - Font.width(lbl);
      Font.draw(ctx, lbl, lx, n.y - 3, { color: '#3a2c1c', shadow: '#f0e6c8' });
    });

    // "you are here" pulsing ring
    const n = MapUI.NODES[cur];
    const r = 5 + Math.sin(MapUI.t / 6) * 1.5;
    ctx.strokeStyle = '#e83030'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(n.x, n.y - 2, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f8d048'; ctx.fillRect(n.x - 1, n.y - 3, 2, 2);

    // footer
    ctx.fillStyle = '#4a3a28'; ctx.fillRect(0, 148, 240, 12);
    Font.draw(ctx, 'You are near: ' + n.name, 6, 150, { color: '#f0e0b0', shadow: '#201810' });
    Font.draw(ctx, 'B: Close', 238 - Font.width('B: Close'), 150, { color: '#c8b890', shadow: '#201810' });
  },
};
