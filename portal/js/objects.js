/* objects.js — cubes, floor buttons, doors, goo pools, fizzler grills,
   sentry turrets, exit elevators. */
'use strict';
(function (P) {

  const V3 = P.V3;

  function rayHitsAABB(origin, dir, maxDist, min, max) {
    let tmin = 0, tmax = maxDist;
    for (const ax of ['x', 'y', 'z']) {
      const o = origin[ax], d = dir[ax];
      if (Math.abs(d) < 1e-9) {
        if (o < min[ax] || o > max[ax]) return false;
      } else {
        let t1 = (min[ax] - o) / d, t2 = (max[ax] - o) / d;
        if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
        tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
        if (tmin > tmax) return false;
      }
    }
    return true;
  }

  // ------------------------------------------------------------------ Cube
  class Cube {
    constructor(scene, pos, opts) {
      this.companion = !!(opts && opts.companion);
      this.spawn = pos.clone();
      this.pos = pos.clone();          // center
      this.vel = new THREE.Vector3();
      this.half = V3(0.28, 0.28, 0.28);
      this.carried = false;
      this.dead = false;

      const g = new THREE.Group();
      const body = P.boxMesh(0.56, 0.56, 0.56, P.mats.cube, 1);
      g.add(body);
      // edge frame gives it the storage-cube look
      const e = 0.60, t = 0.10;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
        const rz = P.boxMesh(t, t, e, P.mats.cubeEdge, 1);
        rz.position.set(sx * 0.28, sy * 0.28, 0); g.add(rz);
        const rx = P.boxMesh(e, t, t, P.mats.cubeEdge, 1);
        rx.position.set(0, sx * 0.28, sy * 0.28); g.add(rx);
        const ry = P.boxMesh(t, e, t, P.mats.cubeEdge, 1);
        ry.position.set(sx * 0.28, 0, sy * 0.28); g.add(ry);
      }
      const dotMat = this.companion
        ? new THREE.MeshLambertMaterial({ color: 0xff6fa8, emissive: 0x5c1030 })
        : new THREE.MeshLambertMaterial({ color: 0x67c1e8, emissive: 0x1a4a60 });
      for (const [rx, ry, dz] of [[0, 0, 1], [0, Math.PI, -1], [0, Math.PI / 2, 1], [0, -Math.PI / 2, 1]]) {
        const dot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), dotMat);
        if (ry === 0 || ry === Math.PI) { dot.rotation.y = ry; dot.position.z = 0.286 * dz; }
        else { dot.rotation.y = ry; dot.position.x = 0.286 * (ry > 0 ? 1 : -1); }
        void rx;
        g.add(dot);
      }
      this.mesh = g;
      scene.add(g);
      this.sync();
    }
    sync() { this.mesh.position.copy(this.pos); }
    update(dt) {
      if (this.dead) return;
      if (!this.carried) {
        this.vel.y -= P.GRAVITY * dt;
        this.vel.y = Math.max(this.vel.y, -P.TERMINAL);
        const vyBefore = this.vel.y;
        const res = P.world.move(this.pos, this.half, this.vel, dt);
        if (res.onGround) {
          // repulsion gel makes cubes bounce (with damping so they settle)
          let bounced = false;
          for (const gz of P.game.gels) {
            if (gz.type === 'bounce' && gz.contains(this.pos) && Math.abs(vyBefore) > 4) {
              this.vel.y = Math.abs(vyBefore) * 0.7;
              bounced = true; break;
            }
          }
          if (!bounced) { this.vel.x *= 0.86; this.vel.z *= 0.86; }
        }
        P.portals.tryTeleportEntity(this);
      }
      this.sync();
      this.mesh.rotation.set(0, 0, 0);
    }
    fizzle() {
      if (this.dead) return;
      this.dead = true; this.carried = false;
      P.audio.fizzleObject();
      const m = this.mesh;
      const t0 = performance.now();
      const tick = () => {
        const k = (performance.now() - t0) / 400;
        if (k >= 1) { this.respawn(); return; }
        m.scale.setScalar(1 - k * 0.9);
        m.rotation.y = k * 5;
        requestAnimationFrame(tick);
      };
      tick();
    }
    respawn() {
      this.pos.copy(this.spawn);
      this.vel.set(0, 0, 0);
      this.mesh.scale.setScalar(1);
      this.mesh.rotation.set(0, 0, 0);
      this.dead = false;
      this.sync();
    }
    aabb() {
      return { min: this.pos.clone().sub(this.half), max: this.pos.clone().add(this.half) };
    }
  }
  P.Cube = Cube;

  // ------------------------------------------------------------ Floor button
  class Button {
    constructor(scene, pos, targetIds) {
      this.pos = pos.clone(); // center of base, on floor
      this.targets = targetIds;
      this.pressed = false;

      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.12, 28), P.mats.buttonBase);
      base.position.y = 0.06; g.add(base);
      this.cap = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.14, 28), P.mats.button);
      this.cap.position.y = 0.18; g.add(this.cap);
      g.position.copy(pos);
      scene.add(g);
      this.mesh = g;
    }
    update(dt, player, cubes) {
      const r = 0.85;
      let hit = false;
      const check = (p, half) =>
        Math.abs(p.x - this.pos.x) < r && Math.abs(p.z - this.pos.z) < r &&
        (p.y - half.y) < this.pos.y + 0.35 && (p.y + half.y) > this.pos.y - 0.1;
      if (check(player.center(), player.half)) hit = true;
      for (const c of cubes) if (!c.dead && check(c.pos, c.half)) hit = true;
      if (hit !== this.pressed) {
        this.pressed = hit;
        if (hit) P.audio.buttonDown(); else P.audio.buttonUp();
        for (const id of this.targets) {
          const d = P.game.doorById(id);
          if (d) d.setOpen(hit);
        }
      }
      this.cap.position.y = P.lerp(this.cap.position.y, hit ? 0.10 : 0.18, dt * 12);
    }
  }
  P.Button = Button;

  // ------------------------------------------------------------------ Door
  // Sliding double-panel door in a frame. `axis` = 'x' or 'z' (wall direction).
  class Door {
    constructor(scene, id, pos, axis, width, height) {
      this.id = id;
      this.pos = pos.clone(); // center at floor level
      this.axis = axis;
      this.w = width || 2.2; this.h = height || 3.0;
      this.open = 0; this.target = 0; this.stayOpen = false;

      const thick = 0.3;
      const g = new THREE.Group();
      const px = axis === 'x' ? this.w : thick, pz = axis === 'x' ? thick : this.w;

      this.left = P.boxMesh(axis === 'x' ? this.w / 2 : thick * 0.8, this.h, axis === 'x' ? thick * 0.8 : this.w / 2, P.mats.door, 0.8);
      this.right = this.left.clone();
      g.add(this.left, this.right);

      // frame posts
      for (const s of [-1, 1]) {
        const post = P.boxMesh(axis === 'x' ? 0.25 : thick, this.h + 0.4, axis === 'x' ? thick : 0.25, P.mats.doorFrame, 0.8);
        if (axis === 'x') post.position.set(s * (this.w / 2 + 0.12), this.h / 2, 0);
        else post.position.set(0, this.h / 2, s * (this.w / 2 + 0.12));
        g.add(post);
      }
      const lintel = P.boxMesh(px + 0.5, 0.3, pz + (axis === 'x' ? 0 : 0.5), P.mats.doorFrame, 0.8);
      lintel.position.y = this.h + 0.15; g.add(lintel);

      g.position.copy(pos);
      scene.add(g);
      this.mesh = g;

      // collider blocks the doorway while closed
      const cmin = pos.clone().add(V3(axis === 'x' ? -this.w / 2 : -thick / 2, 0, axis === 'x' ? -thick / 2 : -this.w / 2));
      const cmax = pos.clone().add(V3(axis === 'x' ? this.w / 2 : thick / 2, this.h, axis === 'x' ? thick / 2 : this.w / 2));
      this.collider = P.world.add(new P.Collider(cmin, cmax));
      this.collider.portalHost = false;
      this._layout();
    }
    setOpen(v) {
      if (this.stayOpen && !v) return;
      const t = v ? 1 : 0;
      if (t !== this.target) {
        this.target = t;
        if (v) P.audio.doorOpen(); else P.audio.doorClose();
      }
    }
    _layout() {
      const slide = this.open * (this.w / 2 + 0.05);
      if (this.axis === 'x') {
        this.left.position.set(-this.w / 4 - slide, this.h / 2, 0);
        this.right.position.set(this.w / 4 + slide, this.h / 2, 0);
      } else {
        this.left.position.set(0, this.h / 2, -this.w / 4 - slide);
        this.right.position.set(0, this.h / 2, this.w / 4 + slide);
      }
    }
    update(dt) {
      this.open = P.lerp(this.open, this.target, dt * 6);
      this._layout();
      this.collider.enabled = this.open < 0.6;
    }
  }
  P.Door = Door;

  // ------------------------------------------------------------------- Goo
  class Goo {
    constructor(scene, min, max) {
      this.min = min; this.max = max;
      const m = P.boxMesh(max.x - min.x, max.y - min.y, max.z - min.z, P.mats.goo, 0.3);
      m.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
      scene.add(m);
      this.mesh = m;
      this.t = 0;
    }
    contains(p) {
      return p.x > this.min.x && p.x < this.max.x &&
             p.z > this.min.z && p.z < this.max.z &&
             p.y < this.max.y + 0.1;
    }
    update(dt) {
      this.t += dt;
      this.mesh.position.y += Math.sin(this.t * 1.4) * 0.0006;
    }
  }
  P.Goo = Goo;

  // -------------------------------------------------- Emancipation grill
  // A shimmering plane: crossing it clears portals & fizzles cubes.
  class Grill {
    constructor(scene, min, max) {
      this.min = min; this.max = max;
      const w = max.x - min.x, h = max.y - min.y, d = max.z - min.z;
      const geo = new THREE.PlaneGeometry(Math.max(w, d), h);
      this.mat = new THREE.MeshBasicMaterial({
        color: 0x9fd8ff, transparent: true, opacity: 0.16,
        side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const m = new THREE.Mesh(geo, this.mat);
      m.position.set((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
      if (d > w) m.rotation.y = Math.PI / 2;
      scene.add(m);
      this.mesh = m;
      this.wasInside = new Set();
      this.t = 0;
    }
    _inside(p) {
      return p.x > this.min.x - 0.1 && p.x < this.max.x + 0.1 &&
             p.y > this.min.y - 0.1 && p.y < this.max.y + 0.1 &&
             p.z > this.min.z - 0.1 && p.z < this.max.z + 0.1;
    }
    update(dt, player, cubes) {
      this.t += dt;
      this.mat.opacity = 0.13 + Math.sin(this.t * 6) * 0.04;
      // player crossing
      const pin = this._inside(player.center());
      if (pin && !this.wasInside.has('p')) {
        this.wasInside.add('p');
        if (P.portals.anyOpen()) { P.portals.clearAll(); P.audio.portalFizzle(); }
        if (player.carrying) { player.carrying.fizzle(); player.carrying = null; P.voice.say(P.voice.rand('fizzle')); }
      } else if (!pin) this.wasInside.delete('p');
      // loose cubes crossing
      cubes.forEach((c, i) => {
        const cin = !c.dead && this._inside(c.pos);
        const key = 'c' + i;
        if (cin && !this.wasInside.has(key)) {
          this.wasInside.add(key);
          if (!c.carried) { c.fizzle(); P.voice.say(P.voice.rand('fizzle')); }
        } else if (!cin) this.wasInside.delete(key);
      });
    }
  }
  P.Grill = Grill;

  // ---------------------------------------------------------------- Turret
  class Turret {
    constructor(scene, pos, yaw) {
      this.pos = pos.clone(); // floor position
      this.yaw = yaw || 0;
      this.alive = true;
      this.spotted = 0;      // lock-on timer
      this.fireTimer = 0;

      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 6, 14), P.mats.turret);
      body.position.y = 0.75; g.add(body);
      for (const s of [-1, 1]) {  // legs
        const leg = P.boxMesh(0.06, 0.7, 0.06, P.mats.cubeEdge, 1);
        leg.position.set(s * 0.24, 0.35, 0.1); leg.rotation.z = s * 0.35; g.add(leg);
      }
      const leg3 = P.boxMesh(0.06, 0.7, 0.06, P.mats.cubeEdge, 1);
      leg3.position.set(0, 0.35, -0.26); leg3.rotation.x = -0.35; g.add(leg3);
      this.eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xff2222 }));
      this.eye.position.set(0, 0.85, 0.27); g.add(this.eye);

      g.position.copy(pos);
      g.rotation.y = yaw;
      scene.add(g);
      this.mesh = g;

      // laser sight
      const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      this.laser = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.75 }));
      scene.add(this.laser);
      this.tipTime = 0;
    }
    eyePos() { return this.pos.clone().add(V3(0, 0.85, 0)); }
    update(dt, player) {
      if (!this.alive) {
        // fall over animation
        this.tipTime = Math.min(1, this.tipTime + dt * 2.5);
        this.mesh.rotation.z = this.tipTime * (Math.PI / 2) * this.tipDir;
        this.mesh.position.y = this.pos.y + Math.sin(this.tipTime * Math.PI * 0.5) * -0.0;
        this.laser.visible = false;
        this.eye.material.color.setHex(0x441111);
        return;
      }
      // knocked over by player or a cube?
      const kb = b => Math.abs(b.x - this.pos.x) < 0.55 && Math.abs(b.z - this.pos.z) < 0.55 &&
                      b.y - this.pos.y < 1.4 && b.y - this.pos.y > -0.2;
      let knocked = kb(player.center());
      for (const c of P.game.cubes) if (!c.dead && kb(c.pos)) knocked = true;
      if (knocked) { this.die(); return; }

      const eye = this.eyePos();
      const toP = player.center().add(V3(0, 0.3, 0)).sub(eye);
      const dist = toP.length();
      const dir = toP.clone().normalize();
      const fwd = V3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const facing = fwd.dot(V3(dir.x, 0, dir.z).normalize());
      let sees = false;
      if (dist < 14 && facing > 0.35 && player.alive) {
        const block = P.world.raycast(eye, dir, dist, false);
        sees = block >= dist - 0.15;
        // a cube (carried or not) blocks line of sight — portable cover
        if (sees) for (const c of P.game.cubes) {
          if (c.dead) continue;
          if (rayHitsAABB(eye, dir, dist, c.pos.clone().sub(c.half), c.pos.clone().add(c.half))) {
            sees = false; break;
          }
        }
      }
      if (sees) {
        if (this.spotted === 0) P.audio.turretSpot();
        this.spotted = Math.min(1, this.spotted + dt * 2);
        // track player slowly
        const wantYaw = Math.atan2(dir.x, dir.z);
        let dy = wantYaw - this.yaw;
        while (dy > Math.PI) dy -= 2 * Math.PI;
        while (dy < -Math.PI) dy += 2 * Math.PI;
        this.yaw += P.clamp(dy, -dt * 1.6, dt * 1.6);
        this.mesh.rotation.y = this.yaw;
        if (this.spotted >= 1) {
          this.fireTimer -= dt;
          if (this.fireTimer <= 0) {
            this.fireTimer = 0.12;
            P.audio.turretFire();
            player.damage(2.5);
          }
        }
        // laser
        this.laser.visible = true;
        const pts = [eye, eye.clone().add(dir.clone().multiplyScalar(dist))];
        this.laser.geometry.setFromPoints(pts);
        this.eye.material.color.setHex(this.spotted >= 1 ? 0xff2222 : 0xff8844);
      } else {
        this.spotted = Math.max(0, this.spotted - dt * 1.5);
        this.laser.visible = this.spotted > 0.05;
        if (this.laser.visible) {
          const fdir = V3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
          const d = P.world.raycast(this.eyePos(), fdir, 20, false);
          const len = Math.min(d, 20);
          this.laser.geometry.setFromPoints([this.eyePos(), this.eyePos().add(fdir.multiplyScalar(len))]);
        }
      }
    }
    die(silent) {
      if (!this.alive) return;
      this.alive = false;
      this.tipDir = Math.random() < 0.5 ? 1 : -1;
      P.audio.turretDie();
      if (!silent) P.voice.say(P.voice.rand('turretDown'));
    }
  }
  P.Turret = Turret;

  // -------------------------------------------------------------- Elevator
  class Elevator {
    constructor(scene, pos) {
      this.pos = pos.clone();
      const g = new THREE.Group();
      const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 24), P.mats.elevator);
      floor.position.y = 0.05; g.add(floor);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 8, 32),
        new THREE.MeshBasicMaterial({ color: 0x37b6ff }));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
      const ring2 = ring.clone(); ring2.position.y = 3.0; g.add(ring2);
      // glass tube
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.0, 24, 1, true), P.mats.glass);
      tube.position.y = 1.55; g.add(tube);
      g.position.copy(pos);
      scene.add(g);
      this.mesh = g;
      this.ring = ring;
      this.t = 0;
    }
    update(dt, player) {
      this.t += dt;
      this.ring.position.y = 0.12 + (Math.sin(this.t * 2) + 1) * 0.1;
      const p = player.center();
      return Math.hypot(p.x - this.pos.x, p.z - this.pos.z) < 1.0 &&
             Math.abs(p.y - this.pos.y - 1) < 1.8;
    }
  }
  P.Elevator = Elevator;

  // --------------------------------------------------------------- GelZone
  // type 'bounce' (blue: reflects vertical speed, grows on repeat bounces)
  // type 'speed'  (orange: raises run speed while standing on it)
  class GelZone {
    constructor(scene, type, min, max) {
      this.type = type;
      this.min = min; this.max = max;
      const color = type === 'bounce' ? 0x2f7dff : 0xff8a2a;
      const emis = type === 'bounce' ? 0x0a2f66 : 0x66300a;
      const m = P.boxMesh(max.x - min.x, 0.07, max.z - min.z,
        new THREE.MeshLambertMaterial({ color, emissive: emis, transparent: true, opacity: 0.85 }), 0.3);
      m.position.set((min.x + max.x) / 2, max.y + 0.035, (min.z + max.z) / 2);
      scene.add(m);
      this.mesh = m;
      this.t = Math.random() * 9;
    }
    contains(feet) {
      return feet.x > this.min.x && feet.x < this.max.x &&
             feet.z > this.min.z && feet.z < this.max.z &&
             feet.y > this.min.y - 0.35 && feet.y < this.max.y + 0.6;
    }
    update(dt) {
      this.t += dt;
      this.mesh.material.opacity = 0.78 + Math.sin(this.t * 3) * 0.08;
    }
  }
  P.GelZone = GelZone;

  // ------------------------------------------------------------ FaithPlate
  // Steps on it -> launched along a fixed velocity vector.
  class FaithPlate {
    constructor(scene, pos, launchVel) {
      this.pos = pos.clone();
      this.launch = launchVel.clone();
      const g = new THREE.Group();
      const base = P.boxMesh(1.5, 0.12, 1.5, P.mats.buttonBase, 1);
      base.position.y = 0.06; g.add(base);
      this.plate = P.boxMesh(1.2, 0.1, 1.2,
        new THREE.MeshLambertMaterial({ color: 0xd8a13a, emissive: 0x4a3005 }), 1);
      this.plate.position.y = 0.16; g.add(this.plate);
      // chevron showing launch direction
      const dirH = P.V3(launchVel.x, 0, launchVel.z);
      const chev = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 4),
        new THREE.MeshBasicMaterial({ color: 0xffcf6a }));
      chev.position.y = 0.25;
      if (dirH.lengthSq() > 0.01) {
        chev.rotation.z = -Math.PI / 2;
        chev.lookAt && chev.position.add(dirH.normalize().multiplyScalar(0.25));
        chev.rotation.set(Math.PI / 2, 0, Math.atan2(-dirH.x, -dirH.z) + Math.PI);
      }
      g.add(chev);
      g.position.copy(pos);
      scene.add(g);
      this.mesh = g;
      this.anim = 0;
    }
    _zone(p, half) {
      return Math.abs(p.x - this.pos.x) < 0.85 && Math.abs(p.z - this.pos.z) < 0.85 &&
             (p.y - half.y) < this.pos.y + 0.45 && (p.y + half.y) > this.pos.y - 0.1;
    }
    _fire(ent) {
      const now = performance.now();
      if (ent._plateT && now - ent._plateT < 600) return;
      ent._plateT = now;
      ent.vel.copy(this.launch);
      if (ent.onGround !== undefined) ent.onGround = false;
      this.anim = 1;
      P.audio.sproing();
    }
    update(dt, player, cubes) {
      if (player.alive && this._zone(player.center(), player.half)) this._fire(player);
      for (const c of cubes)
        if (!c.dead && !c.carried && this._zone(c.pos, c.half)) this._fire(c);
      this.anim = Math.max(0, this.anim - dt * 4);
      this.plate.rotation.x = -this.anim * 0.5;
      this.plate.position.y = 0.16 + this.anim * 0.25;
    }
  }
  P.FaithPlate = FaithPlate;

  // ---------------------------------------------------------------- Bridge
  // Hard light bridge: a glowing walkable plane, wired like a door.
  class Bridge {
    constructor(scene, id, min, max) {
      this.id = id;
      this.open = 0; this.target = 0; this.stayOpen = false;
      const w = max.x - min.x, d = max.z - min.z;
      this.mat = new THREE.MeshBasicMaterial({
        color: 0xbfe6ff, transparent: true, opacity: 0.0,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), this.mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((min.x + max.x) / 2, max.y, (min.z + max.z) / 2);
      scene.add(m);
      this.mesh = m;
      this.collider = P.world.add(new P.Collider(min, max));
      this.collider.portalHost = false;
      this.collider.enabled = false;
      this.t = 0;
    }
    setOpen(v) {
      if (this.stayOpen && !v) return;
      const t = v ? 1 : 0;
      if (t !== this.target) {
        this.target = t;
        if (v) P.audio.bridgeOn(); else P.audio.doorClose();
      }
    }
    update(dt) {
      this.t += dt;
      this.open = P.lerp(this.open, this.target, dt * 7);
      this.collider.enabled = this.open > 0.5;
      this.mat.opacity = this.open * (0.34 + Math.sin(this.t * 7) * 0.05);
    }
  }
  P.Bridge = Bridge;

  // --------------------------------------------------- Laser (emitter side)
  // Beam travels in straight segments, passes THROUGH open portals, stops at
  // walls or at a receiver. Touching it stings.
  class LaserEmitter {
    constructor(scene, pos, dir) {
      this.pos = pos.clone();
      this.dir = dir.clone().normalize();
      const g = new THREE.Group();
      const box = P.boxMesh(0.5, 0.5, 0.5, P.mats.metal, 1);
      g.add(box);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xff4444 }));
      lens.position.copy(this.dir.clone().multiplyScalar(0.28));
      g.add(lens);
      g.position.copy(pos);
      scene.add(g);
      this.mesh = g;
      // pooled beam segment meshes
      this.segMeshes = [];
      this.scene = scene;
      this.beamMat = new THREE.MeshBasicMaterial({
        color: 0xff3b30, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending
      });
      this.zapT = 0;
    }
    _segMesh(i) {
      while (this.segMeshes.length <= i) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 1), this.beamMat);
        m.visible = false;
        this.scene.add(m);
        this.segMeshes.push(m);
      }
      return this.segMeshes[i];
    }
    // nearest open-portal crossing of ray, closer than maxT
    _portalHit(origin, dir, maxT) {
      if (!P.portals.bothOpen()) return null;
      let best = null;
      for (const key of ['blue', 'orange']) {
        const p = P.portals[key];
        const dn = dir.dot(p.normal);
        if (dn > -1e-6) continue;                     // must enter the front face
        const t = p.pos.clone().sub(origin).dot(p.normal) / dn;
        if (t < 0.05 || t > maxT) continue;
        const pt = origin.clone().add(dir.clone().multiplyScalar(t));
        const off = p.planeOffset(pt);
        const D = P.PORTAL_DIMS;
        if (Math.abs(off.x) < D.W / 2 && Math.abs(off.y) < D.H / 2) {
          if (!best || t < best.t) best = { t, portal: p, point: pt };
        }
      }
      return best;
    }
    update(dt, player) {
      const segs = [];
      let origin = this.pos.clone().add(this.dir.clone().multiplyScalar(0.3));
      let dir = this.dir.clone();
      let receiverHit = null;
      for (let hop = 0; hop < 4; hop++) {
        let dist = Math.min(P.world.raycast(origin, dir, 80, false), 80);
        const ph = this._portalHit(origin, dir, dist);
        let end = origin.clone().add(dir.clone().multiplyScalar(ph ? ph.t : dist));
        let stop = true;
        // does this segment hit a receiver first?
        for (const rc of P.game.receivers) {
          const toR = rc.pos.clone().sub(origin);
          const t = toR.dot(dir);
          if (t > 0 && t < (ph ? ph.t : dist)) {
            const closest = origin.clone().add(dir.clone().multiplyScalar(t));
            if (closest.distanceTo(rc.pos) < 1.4) { end = closest; receiverHit = rc; ph && (stop = true); break; }
          }
        }
        segs.push([origin.clone(), end.clone()]);
        if (receiverHit) break;
        if (ph) {
          const other = P.portals.other(ph.portal);
          const T = P.portals.teleportMatrix(ph.portal, other);
          const R = new THREE.Matrix4().extractRotation(T);
          dir = dir.clone().applyMatrix4(R).normalize();
          // the portal "conducts" the beam out of its center — forgiving of
          // off-center entry, so aiming the exit portal is what matters
          origin = other.pos.clone().add(dir.clone().multiplyScalar(0.1));
          stop = false;
        }
        if (stop) break;
      }
      this.segments = segs;   // exposed for level scripts (boss taunts)
      // draw segments
      for (let i = 0; i < this.segMeshes.length; i++) this.segMeshes[i].visible = false;
      segs.forEach(([a, b], i) => {
        const m = this._segMesh(i);
        const len = a.distanceTo(b);
        m.visible = len > 0.01;
        m.position.copy(a).lerp(b, 0.5);
        m.scale.set(1, 1, len);
        m.lookAt(b);
      });
      // sting the player
      if (player.alive) {
        const pc = player.center().add(V3(0, 0.3, 0));
        for (const [a, b] of segs) {
          const ab = b.clone().sub(a), len = ab.length();
          if (len < 0.01) continue;
          ab.divideScalar(len);
          const t = P.clamp(pc.clone().sub(a).dot(ab), 0, len);
          if (a.clone().add(ab.multiplyScalar(t)).distanceTo(pc) < 0.45) {
            player.damage(26 * dt, true);
            this.zapT -= dt;
            if (this.zapT <= 0) { this.zapT = 0.18; P.audio.laserZap(); }
            break;
          }
        }
      }
      if (receiverHit) receiverHit.hitThisFrame = true;
    }
  }
  P.LaserEmitter = LaserEmitter;

  class LaserReceiver {
    constructor(scene, pos, normal, targets, opts) {
      this.pos = pos.clone();
      this.targets = targets;
      this.latch = !!(opts && opts.latch);
      this.active = false;
      this.hitThisFrame = false;
      const g = new THREE.Group();
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.3, 18), P.mats.buttonBase);
      housing.rotation.x = Math.PI / 2;
      g.add(housing);
      this.eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12),
        new THREE.MeshBasicMaterial({ color: 0x552222 }));
      this.eye.position.copy(normal.clone().multiplyScalar(0.16));
      g.add(this.eye);
      // pulsing target ring so receivers read as objectives from across a room
      this.ringMat = new THREE.MeshBasicMaterial({
        color: 0xffb347, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
      });
      this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 10, 30), this.ringMat);
      this.ring.position.copy(normal.clone().multiplyScalar(0.05));
      g.add(this.ring);
      this.glow = new THREE.PointLight(0xff9d33, 0.55, 7);
      this.glow.position.copy(normal.clone().multiplyScalar(0.6));
      g.add(this.glow);
      g.position.copy(pos);
      g.lookAt(pos.clone().add(normal));
      scene.add(g);
      this.mesh = g;
      this.t = Math.random() * 9;
    }
    update(dt) {
      this.t += dt || 0.016;
      if (this.active) {
        this.ring.scale.setScalar(1);
        this.ringMat.opacity = 1;
        this.ringMat.color.setHex(0x66ff99);
        this.glow.color.setHex(0x66ff99);
        this.glow.intensity = 1.1;
      } else {
        this.ring.scale.setScalar(1 + Math.sin(this.t * 3.5) * 0.18);
        this.ringMat.opacity = 0.55 + Math.sin(this.t * 3.5) * 0.3;
        this.ringMat.color.setHex(0xffb347);
        this.glow.color.setHex(0xff9d33);
        this.glow.intensity = 0.45 + Math.sin(this.t * 3.5) * 0.2;
      }
      this._logic();
    }
    _logic() {
      const hit = this.hitThisFrame || (this.latch && this.active);
      this.hitThisFrame = false;
      if (hit !== this.active) {
        this.active = hit;
        if (hit) P.audio.receiverOn(); else P.audio.receiverOff();
        for (const id of this.targets) {
          const d = P.game.doorById(id);
          if (d) d.setOpen(hit);
        }
      }
      this.eye.material.color.setHex(this.active ? 0xff9d33 : 0x552222);
    }
  }
  P.LaserReceiver = LaserReceiver;

})(window.PORTAL);
