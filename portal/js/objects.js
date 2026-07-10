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
    constructor(scene, pos) {
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
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20),
        new THREE.MeshLambertMaterial({ color: 0x67c1e8, emissive: 0x1a4a60 }));
      dot.position.z = 0.286; g.add(dot);
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
        // ground friction
        const res = P.world.move(this.pos, this.half, this.vel, dt);
        if (res.onGround) { this.vel.x *= 0.86; this.vel.z *= 0.86; }
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
    die() {
      if (!this.alive) return;
      this.alive = false;
      this.tipDir = Math.random() < 0.5 ? 1 : -1;
      P.audio.turretDie();
      P.voice.say(P.voice.rand('turretDown'));
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

})(window.PORTAL);
