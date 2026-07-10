/* game.js — bootstrap, main loop, level management, input & HUD. */
'use strict';
(function (P) {

  const V3 = P.V3;

  const G = P.game = {
    scene: null, camera: null, renderer: null,
    levelGroup: null, levelIndex: 0,
    cubes: [], buttons: [], doors: [], goos: [], grills: [], turrets: [],
    gels: [], plates: [], bridges: [], lasers: [], receivers: [],
    funnels: [], pedestals: [],
    elevator: null, cakePos: null, trapPos: null, lockOrange: false,
    progress: 0,
    player: null, running: false, transitioning: false,
    testMode: /[?&]test=1/.test(location.search),
  };

  // ------------------------------------------------------------------ setup
  G.init = function () {
    P.buildMaterials();

    G.renderer = new THREE.WebGLRenderer({ antialias: true });
    G.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    G.renderer.setSize(window.innerWidth, window.innerHeight);
    G.renderer.outputEncoding = THREE.sRGBEncoding;
    document.getElementById('canvas-holder').appendChild(G.renderer.domElement);

    G.scene = new THREE.Scene();
    G.scene.background = new THREE.Color(0x0b0e10);
    G.scene.fog = new THREE.Fog(0x0b0e10, 30, 90);

    G.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.08, 200);

    // persistent lighting
    G.scene.add(new THREE.HemisphereLight(0xcfd8dd, 0x2a2f33, 0.75));
    const sun = new THREE.DirectionalLight(0xffffff, 0.35);
    sun.position.set(3, 10, 2);
    G.scene.add(sun);

    P.portals.init(G.scene);
    P.portals.setRTSize(window.innerWidth, window.innerHeight);

    G.player = new P.Player(G.camera);
    G.buildViewmodel();

    window.addEventListener('resize', () => {
      G.camera.aspect = window.innerWidth / window.innerHeight;
      G.camera.updateProjectionMatrix();
      G.renderer.setSize(window.innerWidth, window.innerHeight);
      P.portals.setRTSize(window.innerWidth, window.innerHeight);
    });

    try { G.progress = parseInt(localStorage.getItem('portalCloneProgress') || '0', 10) || 0; } catch (e) { G.progress = 0; }
    G.progress = Math.min(G.progress, P.levels.length - 1);
    G.buildChapters();

    G.bindInput();
    G.loadLevel(0, true);
    G.lastT = performance.now();
    requestAnimationFrame(G.loop);
  };

  // ------------------------------------------------------- portal-gun view
  G.buildViewmodel = function () {
    const vm = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 10), P.mats.turret);
    body.rotation.x = Math.PI / 2;
    vm.add(body);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), P.mats.cubeEdge);
    shell.position.z = 0.1; vm.add(shell);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x2f9fff }));
    core.position.z = -0.14; vm.add(core);
    for (const a of [0, 2.1, -2.1]) {
      const prong = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.16, 6), P.mats.cubeEdge);
      prong.position.set(Math.sin(a) * 0.055, Math.cos(a) * 0.055, -0.16);
      prong.rotation.x = -Math.PI / 2;
      vm.add(prong);
    }
    vm.position.set(0.28, -0.24, -0.5);
    vm.rotation.y = 0.08;
    vm.visible = false;
    G.camera.add(vm);
    G.scene.add(G.camera);
    G.viewmodel = vm;
    G.vmCore = core;
  };

  // ------------------------------------------------------------- lifecycle
  G.loadLevel = function (idx, first, quiet) {
    G.transitioning = false;
    G.levelIndex = idx;
    const def = P.levels[idx];

    // teardown
    if (G.levelGroup) {
      G.scene.remove(G.levelGroup);
      G.levelGroup.traverse(o => {
        if (o.geometry) o.geometry.dispose();
      });
    }
    P.world.clear();
    P.portals.clearAll();
    G.cubes = []; G.buttons = []; G.doors = []; G.goos = [];
    G.grills = []; G.turrets = []; G.elevator = null; G.cakePos = null;
    G.gels = []; G.plates = []; G.bridges = []; G.lasers = []; G.receivers = [];
    G.funnels = []; G.pedestals = [];
    G.trapPos = null; G.lockOrange = false;
    def.onUpdate = null; // build() may install a per-level script hook

    G.levelGroup = new THREE.Group();
    G.scene.add(G.levelGroup);
    def.build(P.makeCtx(G.levelGroup), G.levelGroup);

    P.portals.maxUnlocked = def.unlock;
    G.viewmodel.visible = def.unlock > 0;
    G.player.spawnAt(def.start, def.yaw);
    G.updateCrosshair();

    // level bounds: anything that escapes the map dies / respawns
    const bmin = V3(Infinity, Infinity, Infinity), bmax = V3(-Infinity, -Infinity, -Infinity);
    for (const c of P.world.colliders) { bmin.min(c.min); bmax.max(c.max); }
    bmin.x -= 4; bmin.z -= 4; bmin.y -= 6;
    bmax.x += 4; bmax.z += 4; bmax.y += 8;
    G.bounds = { min: bmin, max: bmax };

    // HUD chamber card
    const card = document.getElementById('chamber-card');
    card.querySelector('.num').textContent = def.title;
    card.querySelector('.lbl').textContent = def.cardLabel || 'TEST CHAMBER';
    card.classList.add('show');
    setTimeout(() => card.classList.remove('show'), 4200);

    document.getElementById('fade').classList.add('clear');

    // remember how far the participant has been processed
    if (idx > G.progress) {
      G.progress = idx;
      try { localStorage.setItem('portalCloneProgress', String(idx)); } catch (e) { /* private mode */ }
      G.buildChapters();
    }

    if (quiet) return;
    if (def.preVoice) P.voice.say(P.voice.lines[def.preVoice]);
    if (first) P.voice.say(P.voice.lines.wake.concat(P.voice.lines[def.voice] || []));
    else if (def.voice) P.voice.say(P.voice.lines[def.voice]);
  };

  G.restartLevel = function () {
    P.voice.interrupt(P.voice.rand('restart'));
    G.loadLevel(G.levelIndex, false, true);
  };

  // chapter-select buttons in the pause menu (unlocked up to best progress)
  G.buildChapters = function () {
    const wrap = document.getElementById('chapters');
    if (!wrap) return;
    wrap.innerHTML = '';
    P.levels.forEach((def, i) => {
      const b = document.createElement('div');
      const open = i <= G.progress;
      b.className = 'chap' + (open ? '' : ' locked');
      b.textContent = def.title;
      b.title = def.cardLabel || 'TEST CHAMBER';
      if (open) b.addEventListener('click', () => {
        P.audio.init();
        G.loadLevel(i, false, true);
        document.getElementById('menu').classList.add('hidden');
        if (!G.testMode) G.renderer.domElement.requestPointerLock();
        G.running = true;
      });
      wrap.appendChild(b);
    });
  };

  G.prePlace = function (which, pos, normal) {
    let up;
    if (Math.abs(normal.y) > 0.9) up = V3(0, 0, 1);
    else up = V3(0, 1, 0);
    // find host collider: small step behind the surface
    const inside = pos.clone().sub(normal.clone().multiplyScalar(0.1));
    let host = null;
    for (const c of P.world.colliders) {
      if (inside.x > c.min.x - 0.01 && inside.x < c.max.x + 0.01 &&
          inside.y > c.min.y - 0.01 && inside.y < c.max.y + 0.01 &&
          inside.z > c.min.z - 0.01 && inside.z < c.max.z + 0.01) { host = c; break; }
    }
    P.portals[which].place(pos, normal, up, host);
    G.updateCrosshair();
  };

  G.doorById = function (id) {
    return G.doors.find(d => d.id === id) || G.bridges.find(b => b.id === id) || null;
  };

  // chamber 11's "reward": the floor of the story opens instead
  G.springTrap = function () {
    if (G.transitioning) return;
    G.transitioning = true;
    P.voice.interrupt(P.voice.lines.trap);
    P.audio.fizzleObject();
    document.getElementById('fade').classList.remove('clear');
    setTimeout(() => G.loadLevel(G.levelIndex + 1), 1600);
  };

  G.nextLevel = function () {
    if (G.transitioning) return;
    G.transitioning = true;
    P.audio.elevator();
    document.getElementById('fade').classList.remove('clear');
    setTimeout(() => {
      const nxt = G.levelIndex + 1;
      if (nxt >= P.levels.length) G.win();
      else G.loadLevel(nxt);
    }, 900);
  };

  G.win = function () {
    G.running = false;
    document.exitPointerLock && document.exitPointerLock();
    P.voice.interrupt(P.voice.lines.victory);
    const v = document.getElementById('victory');
    document.getElementById('victory-text').innerHTML =
      'The Overseer\'s core has gone into standby, which it insists was voluntary.<br>' +
      'Thirty-six chambers, one betrayal, and a great deal of unauthorized momentum later,<br>' +
      'you have reached the one room in this facility with working lights and a table.<br><br>' +
      'On the table there is a cake. It is real. It was in the break room the whole time.<br><br>' +
      'Featured technology: real-time portals, conservation of momentum, storage cubes,<br>' +
      'sentry units, repulsion and propulsion gel, aerial plates, hard light bridges,<br>' +
      'thermal beams, emancipation fields, and one (1) genuine baked good.<br><br>' +
      '<i>The facility thanks you. The facility has been advised to stop thanking you.</i>';
    v.classList.remove('hidden');
  };

  G.onPlayerDeath = function (cause) {
    if (G.transitioning) return;
    G.transitioning = true;
    const bank = cause === 'goo' ? 'goo' : cause === 'void' ? 'void' : 'death';
    P.voice.interrupt(P.voice.rand(bank));
    document.getElementById('fade').classList.remove('clear');
    setTimeout(() => {
      const def = P.levels[G.levelIndex];
      G.player.spawnAt(def.start, def.yaw);
      G.cubes.forEach(c => c.respawn());
      G.transitioning = false;
      document.getElementById('fade').classList.add('clear');
    }, 1200);
  };

  // ------------------------------------------------------------------ input
  G.bindInput = function () {
    const canvas = G.renderer.domElement;
    const menu = document.getElementById('menu');

    document.getElementById('btn-start').addEventListener('click', () => {
      P.audio.init();
      if (!G.testMode) canvas.requestPointerLock();
      menu.classList.add('hidden');
      G.running = true;
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      P.audio.init();
      G.restartLevel();
      if (!G.testMode) canvas.requestPointerLock();
      menu.classList.add('hidden');
      G.running = true;
    });
    document.getElementById('btn-again').addEventListener('click', () => {
      document.getElementById('victory').classList.add('hidden');
      G.loadLevel(0, true);
      if (!G.testMode) canvas.requestPointerLock();
      G.running = true;
    });

    document.addEventListener('pointerlockchange', () => {
      if (G.testMode) return;
      const locked = document.pointerLockElement === canvas;
      if (!locked && G.running) {
        G.running = false;
        menu.classList.remove('hidden');
        document.getElementById('paused-note').classList.remove('hidden');
      }
    });

    document.addEventListener('mousemove', e => {
      if (!G.running) return;
      if (!G.testMode && document.pointerLockElement !== canvas) return;
      G.player.look(e.movementX, e.movementY);
    });

    document.addEventListener('mousedown', e => {
      if (!G.running) return;
      if (e.button === 0) {
        if (G.player.carrying) { G.player.dropCube(true); return; }
        P.portals.shoot('blue', G.camera);
        G.flashCore(0x2f9fff);
      } else if (e.button === 2) {
        if (G.lockOrange) { P.audio.denied(); return; }
        P.portals.shoot('orange', G.camera);
        G.flashCore(0xff9a2a);
      }
    });
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', e => {
      G.player.keys[e.code] = true;
      if (e.code === 'KeyE' && G.running) G.player.interact();
      if (e.code === 'KeyR' && G.running && !G.transitioning) G.restartLevel();
      if (e.code === 'Space') e.preventDefault();
    });
    document.addEventListener('keyup', e => { G.player.keys[e.code] = false; });
  };

  G.flashCore = function (color) {
    G.vmCore.material.color.setHex(color);
    G.viewmodel.position.z = -0.44;
    setTimeout(() => { G.viewmodel.position.z = -0.5; }, 90);
  };

  // -------------------------------------------------------------------- HUD
  G.updateCrosshair = function () {
    document.getElementById('ch-blue').style.opacity = P.portals.blue.active ? '1' : '0.25';
    document.getElementById('ch-orange').style.opacity = P.portals.orange.active ? '1' : '0.25';
  };

  G.updateHint = function () {
    const el = document.getElementById('hint');
    let text = '';
    if (G.player.carrying) text = '[E] drop • [CLICK] throw';
    else {
      const eye = G.player.eye(), fwd = G.player.forwardVec();
      for (const pb of G.pedestals) {
        const to = pb.topPos().sub(eye);
        if (to.length() < 2.4 && to.normalize().dot(fwd) > 0.6) { text = '[E] press'; break; }
      }
      if (!text) for (const c of G.cubes) {
        if (c.dead) continue;
        const to = c.pos.clone().sub(eye);
        if (to.length() < 2.6 && to.normalize().dot(fwd) > 0.8) { text = '[E] pick up'; break; }
      }
    }
    if (text !== G._hint) {
      G._hint = text;
      el.textContent = text;
      el.classList.toggle('show', !!text);
    }
  };

  // ------------------------------------------------------------------- loop
  G.loop = function () {
    requestAnimationFrame(G.loop);
    const t = performance.now();
    let dt = Math.min((t - G.lastT) / 1000, 0.05);
    G.lastT = t;

    if (G.running && !G.transitioning) {
      G.player.update(dt);
      for (const c of G.cubes) c.update(dt);
      for (const b of G.buttons) b.update(dt, G.player, G.cubes);
      for (const d of G.doors) d.update(dt);
      for (const gr of G.grills) gr.update(dt, G.player, G.cubes);
      for (const tu of G.turrets) tu.update(dt, G.player);
      for (const gz of G.gels) gz.update(dt);
      for (const fn of G.funnels) fn.update(dt, G.player, G.cubes);
      for (const pb of G.pedestals) pb.update(dt);
      for (const fp of G.plates) fp.update(dt, G.player, G.cubes);
      for (const br of G.bridges) br.update(dt);
      for (const ls of G.lasers) ls.update(dt, G.player);
      for (const rc of G.receivers) rc.update(dt);
      const ldef = P.levels[G.levelIndex];
      if (ldef.onUpdate) ldef.onUpdate(dt);
      for (const go of G.goos) {
        go.update(dt);
        if (go.contains(G.player.pos.clone().add(V3(0, 0.15, 0)))) { P.audio.splash(); G.player.kill('goo'); }
        for (const c of G.cubes) if (!c.dead && !c.carried && go.contains(c.pos)) c.fizzle();
      }
      // escaped the map? the facility notices.
      if (G.bounds) {
        const b = G.bounds, pc = G.player.center();
        if (pc.x < b.min.x || pc.x > b.max.x || pc.y < b.min.y ||
            pc.y > b.max.y || pc.z < b.min.z || pc.z > b.max.z) {
          G.player.kill('void');
        }
        for (const c of G.cubes) {
          if (c.dead || c.carried) continue;
          if (c.pos.x < b.min.x || c.pos.x > b.max.x || c.pos.y < b.min.y ||
              c.pos.y > b.max.y || c.pos.z < b.min.z || c.pos.z > b.max.z) c.respawn();
        }
      }
      if (G.elevator && G.elevator.update(dt, G.player)) G.nextLevel();
      if (G.cakePos) {
        const p = G.player.center();
        if (p.distanceTo(G.cakePos) < 1.6) G.win();
      }
      if (G.trapPos) {
        const p = G.player.center();
        if (p.distanceTo(G.trapPos) < 2.6) G.springTrap();
      }
      G.updateHint();
      // damage vignette
      document.getElementById('damage-vignette').style.opacity =
        String(P.clamp((100 - G.player.health) / 100 * 1.2, 0, 0.9));
    }

    P.portals.render(G.renderer, G.scene, G.camera);
    G.renderer.render(G.scene, G.camera);
  };

  // debug hooks for automated testing
  window.__portalGame = G;

  window.addEventListener('load', G.init);

})(window.PORTAL);
