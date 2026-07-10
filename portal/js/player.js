/* player.js — first-person controller: movement, look, jumping,
   portal transit (with momentum), object carrying, health. */
'use strict';
(function (P) {

  const V3 = P.V3;
  const EYE = 1.62;

  class Player {
    constructor(camera) {
      this.camera = camera;
      this.pos = V3(0, 0, 0);          // feet
      this.vel = new THREE.Vector3();
      this.half = V3(0.32, 0.9, 0.32); // AABB half extents (center at feet+0.9)
      this.yaw = 0; this.pitch = 0;
      this.onGround = false;
      this.keys = {};
      this.carrying = null;
      this.health = 100;
      this.alive = true;
      this.hurtCooldown = 0;
      this._sides = {};
      this._airtime = 0;
    }

    center() { return this.pos.clone().add(V3(0, 0.9, 0)); }
    eye() { return this.pos.clone().add(V3(0, EYE, 0)); }

    spawnAt(pos, yaw) {
      this.pos.copy(pos);
      this.vel.set(0, 0, 0);
      this.yaw = yaw || 0;
      this.pitch = 0;
      this.health = 100;
      this.alive = true;
      this._sides = {};
      if (this.carrying) { this.carrying.carried = false; this.carrying = null; }
      this.syncCamera();
    }

    look(dx, dy) {
      if (!this.alive) return;
      this.yaw -= dx * 0.0023;
      this.pitch -= dy * 0.0023;
      const lim = Math.PI / 2 - 0.06;
      this.pitch = P.clamp(this.pitch, -lim, lim);
    }

    forwardVec() {
      return new THREE.Vector3(0, 0, -1)
        .applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    }

    update(dt) {
      if (!this.alive) return;
      const k = this.keys;
      let speed = 5.2;
      // propulsion gel underfoot: go fast
      for (const gz of P.game.gels)
        if (gz.type === 'speed' && this.onGround && gz.contains(this.pos)) { speed = 12.5; break; }
      const f = V3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      const r = V3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      let wish = V3(0, 0, 0);
      if (k['KeyW']) wish.add(f);
      if (k['KeyS']) wish.sub(f);
      if (k['KeyD']) wish.add(r);
      if (k['KeyA']) wish.sub(r);
      if (wish.lengthSq() > 0) wish.normalize().multiplyScalar(speed);

      if (this.onGround) {
        // strong ground control (also acts as friction)
        this.vel.x = P.lerp(this.vel.x, wish.x, Math.min(1, 12 * dt));
        this.vel.z = P.lerp(this.vel.z, wish.z, Math.min(1, 12 * dt));
      } else if (wish.lengthSq() > 0) {
        // air: accelerate toward wish direction but never bleed off a fling
        const wd = wish.clone().normalize();
        const proj = this.vel.x * wd.x + this.vel.z * wd.z;
        const add = Math.min(Math.max(speed - proj, 0), speed * 1.6 * dt);
        this.vel.x += wd.x * add;
        this.vel.z += wd.z * add;
      }

      if (k['Space'] && this.onGround) {
        this.vel.y = 7.2;
        this.onGround = false;
        P.audio.jump();
      }

      this.vel.y -= P.GRAVITY * dt;
      this.vel.y = Math.max(this.vel.y, -P.TERMINAL);
      const vyBefore = this.vel.y;

      const c = this.center();
      const res = P.world.move(c, this.half, this.vel, dt);
      this.pos.copy(c).sub(V3(0, 0.9, 0));
      const wasAir = !this.onGround;
      this.onGround = res.onGround;
      if (this.onGround) {
        // repulsion gel: bounce, growing a little each time (capped)
        for (const gz of P.game.gels) {
          if (gz.type === 'bounce' && gz.contains(this.pos)) {
            this.vel.y = P.clamp(Math.max(11, Math.abs(vyBefore) * 1.15), 11, 22);
            this.onGround = false;
            P.audio.boing();
            break;
          }
        }
      }
      if (this.onGround) {
        if (wasAir && this._airtime > 0.35) P.audio.land();
        this._airtime = 0;
      } else this._airtime += dt;

      this.tryPortalTransit();
      this.updateCarry(dt);

      if (this.hurtCooldown > 0) this.hurtCooldown -= dt;
      else if (this.health < 100) this.health = Math.min(100, this.health + dt * 18);

      this.syncCamera();
    }

    /* ---- portal transit -------------------------------------------- */
    tryPortalTransit() {
      const pm = P.portals;
      if (!pm.bothOpen()) { this._sides = {}; return; }
      for (const key of ['blue', 'orange']) {
        const p = pm[key];
        const cen = this.center();
        const side = p.sideOf(cen);
        const prev = this._sides[key];
        this._sides[key] = side;
        if (prev === undefined) continue;
        if (prev > 0 && side <= 0 && Math.abs(side) < 3.0) {
          const off = p.planeOffset(cen);
          const D = P.PORTAL_DIMS;
          if (Math.abs(off.x) < D.HOLE_W + 0.15 && Math.abs(off.y) < D.HOLE_H + 0.5) {
            this.teleportThrough(p, pm.other(p));
            return;
          }
        }
      }
    }

    teleportThrough(from, to) {
      const T = P.portals.teleportMatrix(from, to);
      const R = new THREE.Matrix4().extractRotation(T);

      const cen = this.center().applyMatrix4(T);
      this.vel.applyMatrix4(R);

      // re-derive yaw/pitch from transformed forward
      const fwd = this.forwardVec().applyMatrix4(R);
      const hLen = Math.hypot(fwd.x, fwd.z);
      if (hLen > 0.05) {
        this.yaw = Math.atan2(-fwd.x, -fwd.z);
        this.pitch = P.clamp(Math.asin(P.clamp(fwd.y, -1, 1)), -1.45, 1.45);
      } else {
        // looking almost straight up/down: derive yaw from transformed horizontal
        const h = V3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).applyMatrix4(R);
        if (Math.hypot(h.x, h.z) > 0.01) this.yaw = Math.atan2(-h.x, -h.z);
      }

      // exit nudge & floor-portal pop
      cen.add(to.normal.clone().multiplyScalar(0.4));
      if (to.normal.y > 0.5) {
        if (this.vel.y < 3) this.vel.y = 3;
        cen.y = Math.max(cen.y, to.pos.y + 0.95);
      }
      if (to.normal.y < -0.5 && this.vel.y > -1) this.vel.y = -1;
      // depenetrate: if the exit placed us inside geometry (e.g. a ledge
      // hugging the exit portal), push along the exit normal, then upward
      const half = this.half;
      const overlaps = (c) => {
        for (const col of P.world.colliders) {
          if (!col.enabled || col === to.hostCollider) continue;
          if (c.x - half.x < col.max.x && c.x + half.x > col.min.x &&
              c.y - half.y < col.max.y && c.y + half.y > col.min.y &&
              c.z - half.z < col.max.z && c.z + half.z > col.min.z) return true;
        }
        return false;
      };
      for (let i = 0; i < 10 && overlaps(cen); i++)
        cen.add(to.normal.clone().multiplyScalar(0.15));
      for (let i = 0; i < 10 && overlaps(cen); i++) cen.y += 0.15;
      this.pos.copy(cen).sub(V3(0, 0.9, 0));
      this._sides = {};
      P.audio.teleport();
    }

    /* ---- carrying ---------------------------------------------------- */
    interact() {
      if (!this.alive) return;
      if (this.carrying) { this.dropCube(); return; }
      const eye = this.eye(), fwd = this.forwardVec();
      // pedestal buttons take priority
      for (const pb of P.game.pedestals) {
        const to = pb.topPos().sub(eye);
        if (to.length() < 2.4 && to.normalize().dot(fwd) > 0.6) { pb.press(); return; }
      }
      // find a cube in front of us
      let best = null, bestD = 2.6;
      for (const c of P.game.cubes) {
        if (c.dead) continue;
        const to = c.pos.clone().sub(eye);
        const d = to.length();
        if (d < bestD && to.normalize().dot(fwd) > 0.75) { best = c; bestD = d; }
      }
      if (best) {
        this.carrying = best;
        best.carried = true;
        P.audio.pickup();
      }
    }

    dropCube(throwIt) {
      const c = this.carrying;
      if (!c) return;
      this.carrying = null;
      c.carried = false;
      c.vel.copy(this.vel);
      if (throwIt) {
        c.vel.add(this.forwardVec().multiplyScalar(7));
        P.audio.throwCube();
      } else P.audio.drop();
    }

    updateCarry(dt) {
      const c = this.carrying;
      if (!c) return;
      if (c.dead) { this.carrying = null; return; }
      const eye = this.eye(), fwd = this.forwardVec();
      let target = eye.clone().add(fwd.clone().multiplyScalar(1.7));
      target.y = Math.max(target.y, this.pos.y + 0.35);

      // if the hold-line crosses an open portal, carry the cube through it
      const pm = P.portals;
      if (pm.bothOpen()) {
        for (const key of ['blue', 'orange']) {
          const p = pm[key];
          const sEye = p.sideOf(eye), sTar = p.sideOf(target);
          if (sEye > 0 && sTar <= 0) {
            const hit = eye.clone().lerp(target, sEye / (sEye - sTar));
            const off = p.planeOffset(hit);
            const D = P.PORTAL_DIMS;
            if (Math.abs(off.x) < D.HOLE_W && Math.abs(off.y) < D.HOLE_H) {
              target.applyMatrix4(pm.teleportMatrix(p, pm.other(p)));
              break;
            }
          }
        }
      }

      const to = target.sub(c.pos);
      const dist = to.length();
      if (dist > 3.2) { this.dropCube(); return; }   // yanked away
      c.vel.copy(to.multiplyScalar(12));
      const half = c.half;
      P.world.move(c.pos, half, c.vel, dt);
      P.portals.tryTeleportEntity(c);
      c.sync();
    }

    /* ---- health ------------------------------------------------------ */
    damage(amount, quiet) {
      if (!this.alive) return;
      this.health -= amount;
      this.hurtCooldown = 2.5;
      if (!quiet) P.audio.hurt();
      if (this.health <= 0) this.kill('turret');
    }

    kill(cause) {
      if (!this.alive) return;
      this.alive = false;
      P.audio.die();
      P.game.onPlayerDeath(cause);
    }

    syncCamera() {
      const e = this.eye();
      this.camera.position.copy(e);
      this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    }
  }

  P.Player = Player;

})(window.PORTAL);
