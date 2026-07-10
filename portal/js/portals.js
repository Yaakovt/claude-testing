/* portals.js — the heart of it: portal placement on white surfaces,
   see-through rendering via render targets + oblique near-plane clipping,
   and teleportation that preserves momentum. */
'use strict';
(function (P) {

  const V3 = P.V3;
  const PORTAL_W = 1.15, PORTAL_H = 1.9;   // visual half-sizes are half of these
  const HOLE_W = 0.75, HOLE_H = 1.05;      // collision hole half extents
  const FLIP_Y = new THREE.Matrix4().makeRotationY(Math.PI);

  // ---------------------------------------------------------------- Portal
  class Portal {
    constructor(scene, color) {
      this.color = color;                    // 0x2f9fff | 0xff9a2a
      this.active = false;
      this.normal = V3(0, 0, 1);
      this.up = V3(0, 1, 0);
      this.pos = V3(0, 0, 0);
      this.hostCollider = null;
      this.openT = 0;                        // open animation 0..1

      this.group = new THREE.Group();
      this.group.visible = false;
      this.group.matrixAutoUpdate = false;

      // inner surface: elliptical disc showing the linked view
      const shape = new THREE.Shape();
      shape.absellipse(0, 0, PORTAL_W / 2, PORTAL_H / 2, 0, Math.PI * 2);
      const innerGeo = new THREE.ShapeGeometry(shape, 40);

      this.rtA = new THREE.WebGLRenderTarget(2, 2);
      this.rtB = new THREE.WebGLRenderTarget(2, 2);
      this.readRT = this.rtA; this.writeRT = this.rtB;

      this.innerMat = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: this.rtA.texture },
          resolution: { value: new THREE.Vector2(2, 2) },
          open: { value: 0 },       // 1 when a linked view exists
          tint: { value: new THREE.Color(color) },
          time: { value: 0 },
        },
        vertexShader: `
          void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `
          uniform sampler2D map; uniform vec2 resolution;
          uniform float open; uniform vec3 tint; uniform float time;
          void main() {
            vec2 uv = gl_FragCoord.xy / resolution;
            vec3 through = texture2D(map, uv).rgb;
            // idle swirl when unlinked
            float sw = 0.5 + 0.5 * sin(uv.x * 40.0 + time * 3.0) * sin(uv.y * 30.0 - time * 2.0);
            vec3 idle = mix(vec3(0.02, 0.02, 0.03), tint * 0.35, sw * 0.35);
            gl_FragColor = vec4(mix(idle, through, open), 1.0);
          }`,
      });
      this.inner = new THREE.Mesh(innerGeo, this.innerMat);
      this.inner.position.z = 0.02;
      this.group.add(this.inner);

      // glowing ring
      const ringShape = new THREE.Shape();
      ringShape.absellipse(0, 0, PORTAL_W / 2 + 0.09, PORTAL_H / 2 + 0.09, 0, Math.PI * 2);
      const hole = new THREE.Path();
      hole.absellipse(0, 0, PORTAL_W / 2 - 0.01, PORTAL_H / 2 - 0.01, 0, Math.PI * 2);
      ringShape.holes.push(hole);
      this.ring = new THREE.Mesh(new THREE.ShapeGeometry(ringShape, 40),
        new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.95 }));
      this.ring.position.z = 0.03;
      this.group.add(this.ring);

      const light = new THREE.PointLight(color, 0.9, 5);
      light.position.z = 0.4;
      this.group.add(light);

      scene.add(this.group);
    }

    place(pos, normal, up, hostCollider) {
      this.pos.copy(pos);
      this.normal.copy(normal);
      this.up.copy(up);
      this.hostCollider = hostCollider;
      this.active = true;
      this.openT = 0.01;
      this.group.visible = true;
      // right-handed basis: x = up × normal, y = up, z = normal
      const right = up.clone().cross(normal);
      const m = new THREE.Matrix4().makeBasis(right, up.clone(), normal.clone());
      m.setPosition(pos.clone().add(normal.clone().multiplyScalar(0.015)));
      this.matrix = m;
      this.group.matrix.copy(m);
      this.group.updateMatrixWorld(true);
    }

    clear() {
      this.active = false;
      this.group.visible = false;
      this.hostCollider = null;
    }

    // signed distance of a point from the portal plane (positive = in front)
    sideOf(p) { return p.clone().sub(this.pos).dot(this.normal); }

    // local (x=right, y=up) offset of point within portal plane
    planeOffset(p) {
      const d = p.clone().sub(this.pos);
      const right = this.normal.clone().cross(this.up).negate();
      return { x: d.dot(right), y: d.dot(this.up) };
    }

    swapRT() {
      const t = this.readRT; this.readRT = this.writeRT; this.writeRT = t;
      this.innerMat.uniforms.map.value = this.readRT.texture;
    }
  }

  // --------------------------------------------------------- PortalManager
  class PortalManager {
    constructor() {
      this.blue = null; this.orange = null;
      this.virtualCam = new THREE.PerspectiveCamera();
      this.virtualCam.matrixAutoUpdate = false;
      this.maxUnlocked = 0;   // 0 = no gun, 1 = blue only, 2 = both
    }

    init(scene) {
      this.blue = new Portal(scene, 0x2f9fff);
      this.orange = new Portal(scene, 0xff9a2a);
    }

    setRTSize(w, h) {
      const sw = Math.max(2, Math.floor(w * 0.75)), sh = Math.max(2, Math.floor(h * 0.75));
      for (const p of [this.blue, this.orange]) {
        p.rtA.setSize(sw, sh); p.rtB.setSize(sw, sh);
        p.innerMat.uniforms.resolution.value.set(sw, sh);
      }
    }

    bothOpen() { return this.blue.active && this.orange.active; }
    anyOpen() { return this.blue.active || this.orange.active; }
    clearAll() { this.blue.clear(); this.orange.clear(); }
    other(p) { return p === this.blue ? this.orange : this.blue; }

    /* ---- placement ------------------------------------------------- */
    shoot(which, camera) {
      if (this.maxUnlocked === 0) return;
      if (which === 'orange' && this.maxUnlocked < 2) { P.audio.denied(); return; }
      const portal = which === 'blue' ? this.blue : this.orange;
      if (which === 'blue') P.audio.shootBlue(); else P.audio.shootOrange();

      const origin = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const hit = this._raycastWalls(origin, dir);
      if (!hit) { P.audio.denied(); return; }
      if (!hit.collider.portalHost) { P.audio.denied(); this._sparks(hit.point); return; }

      // orientation
      const n = hit.normal.clone();
      let up;
      if (Math.abs(n.y) > 0.9) {
        // floor/ceiling: portal "up" faces away from the player's view direction
        up = V3(dir.x, 0, dir.z);
        if (up.lengthSq() < 1e-6) up = V3(0, 0, 1);
        up.normalize().negate();
        if (n.y < 0) up.negate();
      } else {
        up = V3(0, 1, 0);
      }

      // clamp so the oval fits on the host face
      const pos = this._fitOnFace(hit, n, up);
      if (!pos) { P.audio.denied(); this._sparks(hit.point); return; }

      // reject overlap with the other portal on the same plane
      const o = this.other(portal);
      if (o.active && Math.abs(o.sideOf(pos)) < 0.1) {
        const off = o.planeOffset(pos);
        if (Math.abs(off.x) < PORTAL_W && Math.abs(off.y) < PORTAL_H) {
          P.audio.denied(); return;
        }
      }

      portal.place(pos, n, up, hit.collider);
      P.audio.portalOpen();
      P.game.updateCrosshair();
    }

    _raycastWalls(origin, dir) {
      let best = null, bestT = Infinity;
      for (const c of P.world.colliders) {
        if (!c.enabled) continue;
        // slab test, track which face was hit
        let tmin = 0, tmax = 200, axis = -1, sign = 0, ok = true;
        const axes = ['x', 'y', 'z'];
        for (let i = 0; i < 3; i++) {
          const ax = axes[i], o = origin[ax], d = dir[ax];
          if (Math.abs(d) < 1e-9) {
            if (o < c.min[ax] || o > c.max[ax]) { ok = false; break; }
          } else {
            let t1 = (c.min[ax] - o) / d, t2 = (c.max[ax] - o) / d;
            let s = -1;
            if (t1 > t2) { const t = t1; t1 = t2; t2 = t; s = 1; }
            if (t1 > tmin) { tmin = t1; axis = i; sign = s; }
            tmax = Math.min(tmax, t2);
            if (tmin > tmax) { ok = false; break; }
          }
        }
        if (ok && tmin < bestT && tmin > 0.01) {
          bestT = tmin;
          const nrm = V3(0, 0, 0);
          nrm[axes[axis]] = sign;
          best = { collider: c, t: tmin, point: origin.clone().add(dir.clone().multiplyScalar(tmin)), normal: nrm, axis };
        }
      }
      return best;
    }

    _fitOnFace(hit, n, up) {
      const c = hit.collider;
      const right = n.clone().cross(up).negate();
      const halfW = PORTAL_W / 2 + 0.12, halfH = PORTAL_H / 2 + 0.12;
      const p = hit.point.clone();
      // clamp point so that oval (plus margin) stays within the face bounds
      for (const [vec, half] of [[right, halfW], [up, halfH]]) {
        for (const ax of ['x', 'y', 'z']) {
          const comp = vec[ax];
          if (Math.abs(comp) < 1e-6) continue;
          const lo = c.min[ax] + half * Math.abs(comp);
          const hi = c.max[ax] - half * Math.abs(comp);
          if (lo > hi) return null;       // face too small
          p[ax] = P.clamp(p[ax], lo, hi);
        }
      }
      return p;
    }

    _sparks(point) {
      // simple flash where the shot failed
      const s = new THREE.PointLight(0xffffcc, 2, 3);
      s.position.copy(point);
      P.game.scene.add(s);
      setTimeout(() => P.game.scene.remove(s), 90);
    }

    /* ---- physics holes --------------------------------------------- */
    holeColliders(center) {
      if (!this.bothOpen()) return null;
      const set = new Set();
      for (const p of [this.blue, this.orange]) {
        if (!p.hostCollider) continue;
        // wide in FRONT so fast fallers punch through before contact,
        // shallow BEHIND so walls can't be walked through from the back
        const d = p.sideOf(center);
        if (d > 3.0 || d < -0.6) continue;
        const off = p.planeOffset(center);
        if (Math.abs(off.x) < HOLE_W && Math.abs(off.y) < HOLE_H) set.add(p.hostCollider);
      }
      return set.size ? set : null;
    }

    /* ---- teleport --------------------------------------------------- */
    teleportMatrix(from, to) {
      const inv = from.matrix.clone().invert();
      return to.matrix.clone().multiply(FLIP_Y).multiply(inv);
    }

    // entity: { pos (center), vel, prevSide: Map } — cubes
    tryTeleportEntity(ent) {
      if (!this.bothOpen()) return false;
      ent._sides = ent._sides || {};
      for (const key of ['blue', 'orange']) {
        const p = this[key];
        const side = p.sideOf(ent.pos);
        const prev = ent._sides[key];
        ent._sides[key] = side;
        if (prev === undefined) continue;
        if (prev > 0 && side <= 0 && Math.abs(side) < 3.0) {
          const off = p.planeOffset(ent.pos);
          if (Math.abs(off.x) < HOLE_W + 0.1 && Math.abs(off.y) < HOLE_H + 0.4) {
            const T = this.teleportMatrix(p, this.other(p));
            ent.pos.applyMatrix4(T);
            const R = new THREE.Matrix4().extractRotation(T);
            ent.vel.applyMatrix4(R);
            const q = this.other(p);
            ent.pos.add(q.normal.clone().multiplyScalar(0.35));
            if (q.normal.y > 0.5 && ent.vel.y < 2.5) ent.vel.y = 2.5;
            ent._sides.blue = undefined; ent._sides.orange = undefined;
            P.audio.teleport();
            return true;
          }
        }
      }
      return false;
    }

    /* ---- rendering --------------------------------------------------- */
    render(renderer, scene, camera) {
      const open = this.bothOpen();
      const t = performance.now() / 1000;
      for (const p of [this.blue, this.orange]) {
        if (!p.active) continue;
        p.openT = Math.min(1, p.openT + 0.08);
        p.group.scale && p.inner.scale.setScalar(1); // shape handled by group matrix
        p.innerMat.uniforms.time.value = t;
        p.innerMat.uniforms.open.value = open ? p.openT : 0;
      }
      if (!open) return;

      camera.updateMatrixWorld();
      for (const p of [this.blue, this.orange]) {
        const q = this.other(p);
        // virtual camera for what p displays: transform main camera through p -> q
        const T = this.teleportMatrix(p, q);
        const vm = T.clone().multiply(camera.matrixWorld);
        const vc = this.virtualCam;
        vc.matrixWorld.copy(vm);
        vc.matrixWorldInverse.copy(vm).invert();
        // oblique near clipping at q's plane
        vc.projectionMatrix.copy(camera.projectionMatrix);
        this._oblique(vc, q);
        // hide p (the portal we're rendering INTO) & swap so q doesn't sample its write target
        renderer.setRenderTarget(p.writeRT);
        renderer.setClearColor(0x0a0c0e, 1);
        renderer.clear();
        const hidden = [];
        // hide the destination portal's own surface to avoid feedback via q
        // (q.inner samples q.readRT which is safe; p.inner must not be sampled while writing p.writeRT)
        p.group.visible = false;
        hidden.push(p.group);
        renderer.render(scene, vc);
        hidden.forEach(h => h.visible = true);
        renderer.setRenderTarget(null);
      }
      // present the freshly rendered textures
      this.blue.swapRT();
      this.orange.swapRT();
    }

    _oblique(cam, portal) {
      // Lengyel oblique near-plane clipping
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(
        portal.normal.clone(), portal.pos.clone().add(portal.normal.clone().multiplyScalar(0.005)));
      plane.applyMatrix4(cam.matrixWorldInverse);
      const clip = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
      const proj = cam.projectionMatrix;
      const q = new THREE.Vector4(
        (Math.sign(clip.x) + proj.elements[8]) / proj.elements[0],
        (Math.sign(clip.y) + proj.elements[9]) / proj.elements[5],
        -1.0,
        (1.0 + proj.elements[10]) / proj.elements[14]);
      clip.multiplyScalar(2.0 / clip.dot(q));
      proj.elements[2] = clip.x;
      proj.elements[6] = clip.y;
      proj.elements[10] = clip.z + 1.0;
      proj.elements[14] = clip.w;
    }
  }

  P.portals = new PortalManager();
  P.PORTAL_DIMS = { W: PORTAL_W, H: PORTAL_H, HOLE_W, HOLE_H };

})(window.PORTAL);
