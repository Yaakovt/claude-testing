/* physics.js — minimal AABB physics world.
   Level geometry is axis-aligned boxes; entities (player, cubes) are AABBs.
   Colliders that host an open portal get a "hole" the entity may pass through. */
'use strict';
(function (P) {

  P.GRAVITY = 20;
  P.TERMINAL = 40;

  class Collider {
    constructor(min, max, opts) {
      this.min = min.clone();
      this.max = max.clone();
      this.opts = opts || {};
      this.enabled = true;        // doors toggle this
      this.mesh = null;
      this.portalHost = true;     // may a portal be placed here? (set from material)
    }
    intersects(min, max) {
      return this.enabled &&
        min.x < this.max.x && max.x > this.min.x &&
        min.y < this.max.y && max.y > this.min.y &&
        min.z < this.max.z && max.z > this.min.z;
    }
  }
  P.Collider = Collider;

  class World {
    constructor() { this.colliders = []; }
    add(c) { this.colliders.push(c); return c; }
    clear() { this.colliders.length = 0; }

    // Which colliders should `center` ignore because an open portal punches
    // a hole through them? Managed by the portal system each frame.
    holeSet(center) {
      return P.portals ? P.portals.holeColliders(center) : null;
    }

    /* Move an AABB entity: pos = center of the box, half = half extents.
       Returns { onGround, hitWall }. Mutates pos & vel. */
    move(pos, half, vel, dt) {
      const ignore = this.holeSet(pos);
      const res = { onGround: false, hitWall: false, hitCeil: false };
      const axes = ['x', 'y', 'z'];
      for (const ax of axes) {
        const delta = vel[ax] * dt;
        if (delta === 0) continue;
        pos[ax] += delta;
        const min = pos.clone().sub(half), max = pos.clone().add(half);
        for (const c of this.colliders) {
          if (ignore && ignore.has(c)) continue;
          if (!c.intersects(min, max)) continue;
          if (delta > 0) { pos[ax] = c.min[ax] - half[ax] - 1e-4; }
          else { pos[ax] = c.max[ax] + half[ax] + 1e-4; }
          if (ax === 'y') {
            if (delta < 0) res.onGround = true; else res.hitCeil = true;
          } else res.hitWall = true;
          vel[ax] = 0;
          min.copy(pos).sub(half); max.copy(pos).add(half);
        }
      }
      return res;
    }

    /* Raycast against colliders (for turret line-of-sight).
       Returns distance to first hit or Infinity. */
    raycast(origin, dir, maxDist, ignoreHoles) {
      let best = Infinity;
      const ignore = ignoreHoles ? this.holeSet(origin) : null;
      for (const c of this.colliders) {
        if (!c.enabled) continue;
        if (ignore && ignore.has(c)) continue;
        let tmin = 0, tmax = maxDist;
        let ok = true;
        for (const ax of ['x', 'y', 'z']) {
          const o = origin[ax], d = dir[ax];
          if (Math.abs(d) < 1e-9) {
            if (o < c.min[ax] || o > c.max[ax]) { ok = false; break; }
          } else {
            let t1 = (c.min[ax] - o) / d, t2 = (c.max[ax] - o) / d;
            if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
            tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
            if (tmin > tmax) { ok = false; break; }
          }
        }
        if (ok && tmin < best) best = tmin;
      }
      return best;
    }
  }

  P.world = new World();

})(window.PORTAL);
