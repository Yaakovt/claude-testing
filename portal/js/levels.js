/* levels.js — the test chambers. Each level is a function that builds
   geometry + entities through the ctx helpers and returns spawn info. */
'use strict';
(function (P) {

  const V3 = P.V3;

  /* ctx helpers: S(x0,y0,z0, x1,y1,z1, mat) -> slab (mesh + collider).
     mat: 'white' (portalable) | 'metal' | 'floorm' | 'glass' */
  function makeCtx(group) {
    return {
      group,
      S(x0, y0, z0, x1, y1, z1, mat) {
        const w = x1 - x0, h = y1 - y0, d = z1 - z0;
        const m = P.boxMesh(w, h, d, P.mats[mat] || P.mats.metal, mat === 'floorm' ? 0.4 : 0.5);
        m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
        group.add(m);
        const c = P.world.add(new P.Collider(V3(x0, y0, z0), V3(x1, y1, z1)));
        c.portalHost = (mat === 'white');
        c.mesh = m;
        return c;
      },
      light(x, y, z, intensity, dist) {
        const l = new THREE.PointLight(0xfff4e0, intensity || 0.7, dist || 18);
        l.position.set(x, y, z);
        group.add(l);
      },
      sign(num, x, y, z, ry) {
        const plate = P.textPlate([String(num).padStart(2, '0'), 'TEST CHAMBER'], 2.2, 1.1);
        plate.position.set(x, y, z);
        plate.rotation.y = ry || 0;
        group.add(plate);
      },
    };
  }
  P.makeCtx = makeCtx;

  P.levels = [

    /* ------------------------------------------------ 00 : introduction */
    {
      title: '00', voice: 'ch00', unlock: 0,
      start: V3(-4, 0, 0), yaw: Math.PI / 2, // face +? west-side, look east (-x? ) toward glass
      build(ctx, g) {
        const S = ctx.S;
        // main room  x -7..7  z -5..5  h 4.5, elevator alcove x 7.5..11 z 0.4..3.6
        S(-7.5, -0.5, -5.5, 11.5, 0, 5.5, 'floorm');                    // floor (covers alcove)
        S(-7.5, 4.5, -5.5, 11.5, 5, 5.5, 'metal');                      // ceiling
        S(-7.5, 0, -5.5, -7, 4.5, 5.5, 'white');                        // west (portal host)
        S(-7.5, 0, -5.5, 7.5, 4.5, -5, 'white');                        // north (portal host)
        S(-7.5, 0, 5, 7.5, 4.5, 5.5, 'metal');                          // south
        S(7, 0, -5.5, 7.5, 4.5, 0.9, 'metal');                          // east w/ door hole
        S(7, 0, 3.1, 7.5, 4.5, 5.5, 'metal');
        S(7, 3, 0.9, 7.5, 4.5, 3.1, 'metal');
        S(-0.08, 0, -5, 0.08, 4.5, 5, 'glass');                         // glass divider
        // alcove walls
        S(7.5, 0, -0.1, 11.5, 4.5, 0.4, 'metal');
        S(7.5, 0, 3.6, 11.5, 4.5, 4.1, 'metal');
        S(11, 0, 0.4, 11.5, 4.5, 3.6, 'metal');

        ctx.light(-4, 4, 0, 0.8); ctx.light(4, 4, 0, 0.8); ctx.light(9.5, 4, 2, 0.6, 8);
        ctx.sign(0, -6.9, 2.6, -2.5, Math.PI / 2);

        P.game.cubes.push(new P.Cube(g, V3(4, 0.6, -2.5)));
        P.game.buttons.push(new P.Button(g, V3(4, 0, 2), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(7.25, 0, 2), 'z', 2.2, 3));
        P.game.elevator = new P.Elevator(g, V3(9.5, 0, 2));

        // fixed demonstration portals (no gun yet)
        P.game.prePlace('blue', V3(-7, 1.6, 2), V3(1, 0, 0));
        P.game.prePlace('orange', V3(3.5, 1.6, -5), V3(0, 0, 1));
      }
    },

    /* --------------------------------- 01 : blue aperture only + goo pit */
    {
      title: '01', voice: 'ch01', unlock: 1,
      start: V3(-2, 0, 0), yaw: -Math.PI / 2, // face +x toward the pit
      build(ctx, g) {
        const S = ctx.S;
        // hall x -4..18  z -4..4  h 6 ; pit x 2..13 ; ledge x 13..18
        S(-4.5, -0.5, -4.5, 2, 0, 4.5, 'floorm');                       // west floor
        S(13, -0.5, -4.5, 18.5, 0, 4.5, 'floorm');                      // ledge
        S(2, -2.5, -4.5, 13, -2, 4.5, 'metal');                         // pit floor
        S(1.5, -2, -4.5, 2, 0, 4.5, 'metal');                           // pit walls
        S(13, -2, -4.5, 13.5, 0, 4.5, 'metal');
        S(-4.5, 6, -8.5, 18.5, 6.5, 4.5, 'metal');                      // ceiling (covers alcove)
        S(-4.5, 0, -4.5, -4, 6, 4.5, 'white');                          // west wall (host)
        S(18, 0, -4.5, 18.5, 6, 4.5, 'metal');                          // east wall (fixed orange)
        S(-4.5, 0, 4, 18.5, 6, 4.5, 'metal');                           // south
        S(-4.5, 0, -4.5, 14.4, 6, -4, 'metal');                         // north w/ exit hole
        S(16.6, 0, -4.5, 18.5, 6, -4, 'metal');
        S(14.4, 3, -4.5, 16.6, 6, -4, 'metal');
        // exit alcove x 13.5..17.5 z -8..-4.5
        S(13.5, -0.5, -8.5, 17.5, 0, -4.5, 'floorm');
        S(13, 0, -8.5, 13.5, 6, -4.5, 'metal');
        S(17.5, 0, -8.5, 18, 6, -4.5, 'metal');
        S(13.5, 0, -8.5, 17.5, 6, -8, 'metal');

        ctx.light(-1, 5, 0, 0.8); ctx.light(8, 5, 0, 0.7); ctx.light(15.5, 5, -1, 0.7);
        ctx.sign(1, -3.9, 2.8, 2, Math.PI / 2);

        P.game.goos.push(new P.Goo(g, V3(2, -2, -4.5), V3(13, -1.3, 4.5)));
        const d = new P.Door(g, 'd0', V3(15.5, 0, -4.25), 'x', 2.2, 3);
        d.stayOpen = true; d.setOpen(true); d.stayOpen = true; d.target = 1;
        P.game.doors.push(d);
        P.game.grills.push(new P.Grill(g, V3(14.4, 0, -4.45), V3(16.6, 3, -4.3)));
        P.game.elevator = new P.Elevator(g, V3(15.5, 0, -6.5));

        // fixed orange portal above the far ledge
        P.game.prePlace('orange', V3(18, 1.7, 0), V3(-1, 0, 0));
        P.game.lockOrange = true;
      }
    },

    /* ---------------------------- 02 : full device, high ledge + button */
    {
      title: '02', voice: 'ch02', unlock: 2,
      start: V3(-6, 0, 4), yaw: -Math.PI / 2 - 0.5,
      build(ctx, g) {
        const S = ctx.S;
        // room x -8..8 z -6..6 h 7 ; alcove x 8.5..12 z 1..5
        S(-8.5, -0.5, -6.5, 8.5, 0, 6.5, 'floorm');
        S(-8.5, 7, -6.5, 12.5, 7.5, 6.5, 'metal');
        S(-8.5, 0, -6.5, -8, 7, 6.5, 'white');                          // west (host)
        S(-8.5, 0, -6.5, 8.5, 7, -6, 'white');                          // north (host)
        S(-8.5, 0, 6, 8.5, 7, 6.5, 'metal');                            // south
        S(8, 0, -6.5, 8.5, 7, 1.9, 'metal');                            // east w/ door
        S(8, 0, 4.1, 8.5, 7, 6.5, 'metal');
        S(8, 3, 1.9, 8.5, 7, 4.1, 'metal');
        S(3, 3, -6, 8, 3.5, -2, 'metal');                               // high ledge
        // alcove
        S(8.5, -0.5, 1, 12.5, 0, 5, 'floorm');
        S(8.5, 0, 0.5, 12.5, 7, 1, 'metal');
        S(8.5, 0, 5, 12.5, 7, 5.5, 'metal');
        S(12, 0, 1, 12.5, 7, 5, 'metal');

        ctx.light(0, 6, 0, 0.85); ctx.light(5.5, 6, -4, 0.6); ctx.light(10.5, 5, 3, 0.6, 8);
        ctx.sign(2, -7.9, 2.8, 2, Math.PI / 2);

        P.game.cubes.push(new P.Cube(g, V3(5.5, 4.1, -4)));
        P.game.buttons.push(new P.Button(g, V3(-3, 0, 3), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(8.25, 0, 3), 'z', 2.2, 3));
        P.game.elevator = new P.Elevator(g, V3(10.5, 0, 3));
      }
    },

    /* -------------------------------------- 03 : momentum fling chamber */
    {
      title: '03', voice: 'ch03', unlock: 2,
      start: V3(-1, 0, 3), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // hall x -2..24 z -4..4 h 9 ; shaft x 2..5 z -1.5..1.5 down to -14
        S(-2.5, -0.5, -4.5, 2, 0, 4.5, 'floorm');                       // floor around shaft
        S(5, -0.5, -4.5, 6, 0, 4.5, 'floorm');
        S(2, -0.5, -4.5, 5, 0, -1.5, 'floorm');
        S(2, -0.5, 1.5, 5, 0, 4.5, 'floorm');
        // shaft walls + white bottom
        S(1.5, -14, -2, 2, -0.4, 2, 'metal');
        S(5, -14, -2, 5.5, -0.4, 2, 'metal');
        S(2, -14, -2, 5, -0.4, -1.5, 'metal');
        S(2, -14, 1.5, 5, -0.4, 2, 'metal');
        S(1.5, -14.5, -2, 5.5, -14, 2, 'white');                        // fling floor (host)
        // goo pit x 6..12
        S(6, -2.5, -4.5, 12, -2, 4.5, 'metal');
        S(5.5, -2, -4.5, 6, 0, 4.5, 'metal');
        S(12, -2, -4.5, 12.5, 0, 4.5, 'metal');
        S(12, -0.5, -4.5, 24.5, 0, 4.5, 'floorm');                      // landing ledge
        // shell
        S(-2.5, 9, -5, 28.5, 9.5, 5, 'metal');                          // ceiling
        S(-2.5, 0, -4.5, -2, 9, 4.5, 'white');                          // west wall (fling exit)
        S(-2.5, 0, -5, 24.5, 9, -4.5, 'metal');                         // north
        S(-2.5, 0, 4.5, 24.5, 9, 5, 'metal');                           // south
        S(24, 0, -4.5, 24.5, 9, -1.1, 'metal');                         // east w/ door
        S(24, 0, 1.1, 24.5, 9, 4.5, 'metal');
        S(24, 3, -1.1, 24.5, 9, 1.1, 'metal');
        // exit alcove x 24.5..28 z -2.1..2.1
        S(24.5, -0.5, -2.1, 28.5, 0, 2.1, 'floorm');
        S(24.5, 0, -2.6, 28.5, 9, -2.1, 'metal');
        S(24.5, 0, 2.1, 28.5, 9, 2.6, 'metal');
        S(28, 0, -2.1, 28.5, 9, 2.1, 'metal');

        ctx.light(0, 7, 0, 0.8); ctx.light(9, 7, 0, 0.7); ctx.light(18, 7, 0, 0.8);
        ctx.light(3.5, -12, 0, 0.7, 10); ctx.light(26.5, 5, 0, 0.6, 8);
        ctx.sign(3, -1.9, 2.8, -2, Math.PI / 2);

        P.game.goos.push(new P.Goo(g, V3(6, -2, -4.5), V3(12, -1.3, 4.5)));
        const d = new P.Door(g, 'd0', V3(24.25, 0, 0), 'z', 2.2, 3);
        d.stayOpen = true; d.target = 1;
        P.game.doors.push(d);
        P.game.grills.push(new P.Grill(g, V3(23.4, 0, -1.1), V3(23.55, 3, 1.1)));
        P.game.elevator = new P.Elevator(g, V3(26.5, 0, 0));
      }
    },

    /* --------------------------------------------- 04 : sentry gauntlet */
    {
      title: '04', voice: 'ch04', unlock: 2,
      start: V3(0, 0, 3.5), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // room x -2..20 z -5..5 h 6 ; alcove x 20.5..24 z -1.6..1.6
        S(-2.5, -0.5, -5.5, 20.5, 0, 5.5, 'floorm');
        S(-2.5, 6, -5.5, 24.5, 6.5, 5.5, 'metal');
        S(-2.5, 0, -5.5, -2, 6, 5.5, 'white');                          // west (host)
        S(-2.5, 0, -5.5, 20.5, 6, -5, 'metal');
        S(-2.5, 0, 5, 20.5, 6, 5.5, 'metal');
        S(20, 0, -5.5, 20.5, 6, -1.1, 'white');                         // east (host) w/ door
        S(20, 0, 1.1, 20.5, 6, 5.5, 'white');
        S(20, 3, -1.1, 20.5, 6, 1.1, 'white');
        S(4, 0, -1.5, 5, 1.4, 1.5, 'metal');                            // cover block
        // alcove
        S(20.5, -0.5, -2.1, 24.5, 0, 2.1, 'floorm');
        S(20.5, 0, -2.6, 24.5, 6, -2.1, 'metal');
        S(20.5, 0, 2.1, 24.5, 6, 2.6, 'metal');
        S(24, 0, -2.1, 24.5, 6, 2.1, 'metal');

        ctx.light(2, 5, 0, 0.8); ctx.light(10, 5, 0, 0.75); ctx.light(17, 5, 0, 0.75);
        ctx.light(22.5, 4.5, 0, 0.6, 8);
        ctx.sign(4, -1.9, 2.8, 3.2, Math.PI / 2);

        P.game.cubes.push(new P.Cube(g, V3(0, 0.6, -3)));
        P.game.turrets.push(new P.Turret(g, V3(9, 0, -2.5), -Math.PI / 2));
        P.game.turrets.push(new P.Turret(g, V3(11, 0, 0), -Math.PI / 2));
        P.game.turrets.push(new P.Turret(g, V3(9, 0, 2.5), -Math.PI / 2));
        P.game.buttons.push(new P.Button(g, V3(16, 0, 3), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(20.25, 0, 0), 'z', 2.2, 3));
        P.game.elevator = new P.Elevator(g, V3(22.5, 0, 0));
      }
    },

    /* ----------------------------------------- 05 : the final synthesis */
    {
      title: '05', voice: 'ch05', unlock: 2,
      start: V3(-4, 0, 4), yaw: -Math.PI / 2 - 0.4,
      build(ctx, g) {
        const S = ctx.S;
        // main room x -6..12 z -6..6 h 8
        S(-6.5, -0.5, -6.5, 12.5, 0, 6.5, 'floorm');
        S(-6.5, 8, -6.5, 12.5, 8.5, 6.5, 'metal');
        S(-6.5, 0, -6.5, -6, 8, 6.5, 'white');                          // west (host)
        S(-6.5, 0, -6.5, 12.5, 8, -6, 'white');                         // north (host)
        S(-6.5, 0, 6, 12.5, 8, 6.5, 'metal');
        S(12, 0, -6.5, 12.5, 8, 0.9, 'metal');                          // east w/ door
        S(12, 0, 3.1, 12.5, 8, 6.5, 'metal');
        S(12, 3, 0.9, 12.5, 8, 3.1, 'metal');
        S(8, 3.5, -6, 12, 4, -1, 'metal');                              // high ledge (cube)
        // turret corridor x 12.5..20 z 0.4..3.6 h 4
        S(12.5, -0.5, 0.4, 20, 0, 3.6, 'floorm');
        S(12.5, 4, 0.4, 20, 4.5, 3.6, 'metal');
        S(12.5, 0, -0.1, 20, 4, 0.4, 'metal');
        S(12.5, 0, 3.6, 20, 4, 4.1, 'metal');
        // cake room x 20..28 z -2..6 h 6
        S(20, -0.5, -2.5, 28.5, 0, 6.5, 'floorm');
        S(20, 6, -2.5, 28.5, 6.5, 6.5, 'metal');
        S(20, 0, -2.5, 28.5, 4, 0.4, 'metal');                          // partial wall (corridor mouth)
        S(20, 0, 3.6, 28.5, 6, 6.5, 'metal');
        S(20, 4, -2.5, 20.5, 6, 3.6, 'metal');
        S(28, 0, -2.5, 28.5, 6, 3.6, 'metal');
        S(20, 0, -2.5, 28.5, 6, -2, 'metal');

        ctx.light(0, 7, 0, 0.85); ctx.light(9, 6.5, -3, 0.6); ctx.light(16, 3.5, 2, 0.6, 8);
        const cakeLight = new THREE.PointLight(0xffd9a0, 1.4, 10);
        cakeLight.position.set(24, 3.5, 2); g.add(cakeLight);
        ctx.sign(5, -5.9, 2.8, 2, Math.PI / 2);

        P.game.cubes.push(new P.Cube(g, V3(10, 4.6, -3.5)));
        P.game.buttons.push(new P.Button(g, V3(-2, 0, 2), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(12.25, 0, 2), 'z', 2.2, 3));
        P.game.turrets.push(new P.Turret(g, V3(16.5, 0, 2), -Math.PI / 2));
        P.game.grills.push(new P.Grill(g, V3(19.4, 0, 0.4), V3(19.55, 3, 3.6)));

        // ---- the celebratory baked good ----
        const cake = new THREE.Group();
        const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.0, 20),
          P.mats.buttonBase);
        ped.position.y = 0.5; cake.add(ped);
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24),
          new THREE.MeshLambertMaterial({ color: 0x5b3220 }));
        base.position.y = 1.15; cake.add(base);
        const icing = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.07, 24),
          new THREE.MeshLambertMaterial({ color: 0xf6e6ee }));
        icing.position.y = 1.33; cake.add(icing);
        const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10),
          new THREE.MeshLambertMaterial({ color: 0xc7183c, emissive: 0x400512 }));
        cherry.position.y = 1.43; cake.add(cherry);
        const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 8),
          new THREE.MeshLambertMaterial({ color: 0xfff3cf }));
        candle.position.set(0.15, 1.47, 0); cake.add(candle);
        const flame = new THREE.PointLight(0xffaa33, 0.8, 3);
        flame.position.set(0.15, 1.62, 0); cake.add(flame);
        cake.position.set(24, 0, 2);
        g.add(cake);
        P.game.cakePos = V3(24, 1, 2);
      }
    },
  ];

})(window.PORTAL);
