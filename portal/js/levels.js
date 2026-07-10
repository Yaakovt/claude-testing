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
        c.portalHost = (mat === 'white' || mat === 'scorch');
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

  // celebratory baked good (pedestal + cake + candle)
  function bakeCake(g, x, z) {
    const cake = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.0, 20), P.mats.buttonBase);
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
    cake.position.set(x, 0, z);
    g.add(cake);
    return cake;
  }

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

        // decorative baked good — strictly non-interactive (see chamber 06 briefing)
        bakeCake(g, 24, 2);
        P.game.elevator = new P.Elevator(g, V3(26.5, 0, 2));
      }
    },

    /* ------------------------------------- 06 : aerial acceleration plates */
    {
      title: '06', voice: 'ch06', preVoice: 'fakeCake', unlock: 2,
      start: V3(0, 0, 3), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // hall x -2..34 z -4..4 h 10, goo x 4..30, island x 14..19
        S(-2.5, -0.5, -4.5, 4, 0, 4.5, 'floorm');
        S(14, -0.5, -2, 19, 0, 2, 'floorm');
        S(15.5, -2, -1, 17.5, 0, 1, 'metal');                           // island pillar
        S(30, -0.5, -4.5, 34.5, 0, 4.5, 'floorm');
        S(4, -2.5, -4.5, 30, -2, 4.5, 'metal');
        S(3.5, -2, -4.5, 4, 0, 4.5, 'metal');
        S(30, -2, -4.5, 30.5, 0, 4.5, 'metal');
        S(-2.5, 10, -9, 34.5, 10.5, 4.5, 'metal');                      // ceiling
        S(-3, 0, -4.5, -2.5, 10, 4.5, 'white');                         // west
        S(34.5, 0, -4.5, 35, 10, 4.5, 'metal');                         // east
        S(-2.5, 0, 4.5, 34.5, 10, 5, 'metal');                          // south
        S(-2.5, 0, -5, 30.9, 10, -4.5, 'metal');                        // north w/ door
        S(33.1, 0, -5, 34.5, 10, -4.5, 'metal');
        S(30.9, 3, -5, 33.1, 10, -4.5, 'metal');
        // exit alcove x 30..34 z -8.5..-5
        S(30, -0.5, -8.5, 34, 0, -5, 'floorm');
        S(29.5, 0, -8.5, 30, 10, -5, 'metal');
        S(34, 0, -8.5, 34.5, 10, -5, 'metal');
        S(30, 0, -9, 34, 10, -8.5, 'metal');

        ctx.light(0, 8, 0, 0.8); ctx.light(16.5, 8, 0, 0.8); ctx.light(32, 8, 0, 0.7);
        ctx.light(32, 7, -7, 0.6, 9);
        ctx.sign(6, -2.4, 2.8, 2, Math.PI / 2);

        P.game.goos.push(new P.Goo(g, V3(4, -2, -4.5), V3(30, -1.3, 4.5)));
        P.game.plates.push(new P.FaithPlate(g, V3(2.5, 0, 0), V3(11, 13, 0)));
        P.game.plates.push(new P.FaithPlate(g, V3(17.5, 0, 0), V3(11, 13, 0)));
        const d = new P.Door(g, 'd0', V3(32, 0, -4.75), 'x', 2.2, 3);
        d.stayOpen = true; d.target = 1;
        P.game.doors.push(d);
        P.game.elevator = new P.Elevator(g, V3(32, 0, -6.8));
      }
    },

    /* ----------------------------------------------- 07 : repulsion gel */
    {
      title: '07', voice: 'ch07', unlock: 2,
      start: V3(-6, 0, 4), yaw: -Math.PI / 2 - 0.4,
      build(ctx, g) {
        const S = ctx.S;
        // room x -8..10 z -6..6 h 9
        S(-8.5, -0.5, -6.5, 10.5, 0, 6.5, 'floorm');
        S(-8.5, 9, -6.5, 14.5, 9.5, 6.5, 'metal');
        S(-8.5, 0, -6.5, -8, 9, 6.5, 'white');
        S(-8.5, 0, -6.5, 10.5, 9, -6, 'white');
        S(-8.5, 0, 6, 10.5, 9, 6.5, 'metal');
        S(10, 0, -6.5, 10.5, 9, -1.1, 'metal');                         // east w/ door
        S(10, 0, 1.1, 10.5, 9, 6.5, 'metal');
        S(10, 3, -1.1, 10.5, 9, 1.1, 'metal');
        S(4, 4, -6, 8, 4.5, -2, 'metal');                               // cube ledge
        // alcove x 10.5..14 z -2.1..2.1
        S(10.5, -0.5, -2.1, 14.5, 0, 2.1, 'floorm');
        S(10.5, 0, -2.6, 14.5, 9, -2.1, 'metal');
        S(10.5, 0, 2.1, 14.5, 9, 2.6, 'metal');
        S(14, 0, -2.1, 14.5, 9, 2.1, 'metal');

        ctx.light(0, 7.5, 0, 0.85); ctx.light(6, 7, -4, 0.6); ctx.light(12.5, 6, 0, 0.6, 8);
        ctx.sign(7, -7.9, 2.8, 2, Math.PI / 2);

        P.game.gels.push(new P.GelZone(g, 'bounce', V3(-4, 0, -4), V3(4, 0, 4)));
        P.game.cubes.push(new P.Cube(g, V3(6, 5.1, -4)));
        P.game.buttons.push(new P.Button(g, V3(-6, 0, 4), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(10.25, 0, 0), 'z', 2.2, 3));
        P.game.elevator = new P.Elevator(g, V3(12.5, 0, 0));
      }
    },

    /* ---------------------------------------------- 08 : propulsion gel */
    {
      title: '08', voice: 'ch08', unlock: 2,
      start: V3(-3, 0, 3), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // hall x -4..36 z -5..5 h 7 ; goo gap x 18..24
        S(-4.5, -0.5, -5.5, 18, 0, 5.5, 'floorm');
        S(18, -2.5, -5.5, 24, -2, 5.5, 'metal');
        S(17.5, -2, -5.5, 18, 0, 5.5, 'metal');
        S(24, -2, -5.5, 24.5, 0, 5.5, 'metal');
        S(24, -0.5, -5.5, 36.5, 0, 5.5, 'floorm');
        S(-4.5, 7, -5.5, 40.5, 7.5, 5.5, 'metal');
        S(-5, 0, -5.5, -4.5, 7, 5.5, 'white');
        S(-4.5, 0, -6, 36.5, 7, -5.5, 'metal');
        S(-4.5, 0, 5.5, 36.5, 7, 6, 'metal');
        S(36, 0, -5.5, 36.5, 7, -1.1, 'metal');                         // east w/ door
        S(36, 0, 1.1, 36.5, 7, 5.5, 'metal');
        S(36, 3, -1.1, 36.5, 7, 1.1, 'metal');
        // alcove
        S(36.5, -0.5, -2.1, 40.5, 0, 2.1, 'floorm');
        S(36.5, 0, -2.6, 40.5, 7, -2.1, 'metal');
        S(36.5, 0, 2.1, 40.5, 7, 2.6, 'metal');
        S(40, 0, -2.1, 40.5, 7, 2.1, 'metal');

        ctx.light(0, 6, 0, 0.75); ctx.light(12, 6, 0, 0.75); ctx.light(24, 6, 0, 0.7);
        ctx.light(32, 6, 0, 0.7); ctx.light(38.5, 5, 0, 0.6, 8);
        ctx.sign(8, -4.4, 2.8, 2, Math.PI / 2);

        P.game.gels.push(new P.GelZone(g, 'speed', V3(-2, 0, -2), V3(18, 0, 2)));
        P.game.goos.push(new P.Goo(g, V3(18, -2, -5.5), V3(24, -1.3, 5.5)));
        const d = new P.Door(g, 'd0', V3(36.25, 0, 0), 'z', 2.2, 3);
        d.stayOpen = true; d.target = 1;
        P.game.doors.push(d);
        P.game.grills.push(new P.Grill(g, V3(35.4, 0, -1.1), V3(35.55, 3, 1.1)));
        P.game.elevator = new P.Elevator(g, V3(38.5, 0, 0));
      }
    },

    /* -------------------------------------------- 09 : hard light bridge */
    {
      title: '09', voice: 'ch09', unlock: 2,
      start: V3(-1, 0, 4), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // room x -2..24 z -6..6 h 8 ; chasm x 4..20 to y -8 (goo)
        S(-2.5, -0.5, -6.5, 4, 0, 6.5, 'floorm');
        S(20, -0.5, -6.5, 24.5, 0, 6.5, 'floorm');
        S(4, -8.5, -6.5, 20, -8, 6.5, 'metal');
        S(3.5, -8, -6.5, 4, 0, 6.5, 'metal');
        S(20, -8, -6.5, 20.5, 0, 6.5, 'metal');
        S(-2.5, 8, -6.5, 28.5, 8.5, 6.5, 'metal');
        S(-3, 0, -6.5, -2.5, 8, 6.5, 'white');
        S(-2.5, -8, -7, 24.5, 8, -6.5, 'white');                        // north (tall, host)
        S(-2.5, -8, 6, 24.5, 8, 6.5, 'metal');
        S(24, 0, -6.5, 24.5, 8, -1.1, 'metal');                         // east w/ door
        S(24, 0, 1.1, 24.5, 8, 6.5, 'metal');
        S(24, 3, -1.1, 24.5, 8, 1.1, 'metal');
        S(10, 2.5, -6.5, 13, 3, -3.5, 'metal');                         // mid-air cube perch
        // alcove
        S(24.5, -0.5, -2.1, 28.5, 0, 2.1, 'floorm');
        S(24.5, 0, -2.6, 28.5, 8, -2.1, 'metal');
        S(24.5, 0, 2.1, 28.5, 8, 2.6, 'metal');
        S(28, 0, -2.1, 28.5, 8, 2.1, 'metal');

        ctx.light(0, 7, 0, 0.8); ctx.light(12, 7, 0, 0.75); ctx.light(22, 7, 0, 0.75);
        ctx.light(26.5, 5, 0, 0.6, 8);
        ctx.sign(9, -2.4, 2.8, 2, Math.PI / 2);

        P.game.goos.push(new P.Goo(g, V3(4, -8, -6.5), V3(20, -7.3, 6.5)));
        P.game.cubes.push(new P.Cube(g, V3(11.5, 3.6, -5)));
        P.game.bridges.push(new P.Bridge(g, 'b0', V3(3.8, -0.12, -1), V3(20.2, 0, 1)));
        P.game.buttons.push(new P.Button(g, V3(0, 0, 3), ['b0']));
        P.game.turrets.push(new P.Turret(g, V3(21.5, 0, -3), -Math.PI / 2));
        P.game.turrets.push(new P.Turret(g, V3(21.5, 0, 3), -Math.PI / 2));
        const d = new P.Door(g, 'd0', V3(24.25, 0, 0), 'z', 2.2, 3);
        d.stayOpen = true; d.target = 1;
        P.game.doors.push(d);
        P.game.elevator = new P.Elevator(g, V3(26.5, 0, 0));
      }
    },

    /* --------------------------------------- 10 : thermal beam training */
    {
      title: '10', voice: 'ch10', unlock: 2,
      start: V3(0, 0, -4), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // room x -2..20 z -8..8 h 7
        S(-2.5, -0.5, -8.5, 20.5, 0, 8.5, 'floorm');
        S(-2.5, 7, -8.5, 24.5, 7.5, 8.5, 'metal');
        S(-2.5, 0, -8.5, -2, 7, 8.5, 'white');                          // west (emitter mount)
        S(-2.5, 0, -8.5, 20.5, 7, -8, 'metal');                         // north (receiver mount)
        S(-2.5, 0, 8, 20.5, 7, 8.5, 'white');                           // south (host)
        S(20, 0, -8.5, 20.5, 7, -1.1, 'metal');                         // east w/ door
        S(20, 0, 1.1, 20.5, 7, 8.5, 'metal');
        S(20, 3, -1.1, 20.5, 7, 1.1, 'metal');
        S(10, 0, 3, 11, 3, 5, 'white');                                 // beam-catch pillar
        // alcove
        S(20.5, -0.5, -2.1, 24.5, 0, 2.1, 'floorm');
        S(20.5, 0, -2.6, 24.5, 7, -2.1, 'metal');
        S(20.5, 0, 2.1, 24.5, 7, 2.6, 'metal');
        S(24, 0, -2.1, 24.5, 7, 2.1, 'metal');

        ctx.light(4, 6, 0, 0.8); ctx.light(14, 6, 0, 0.8); ctx.light(22.5, 5, 0, 0.6, 8);
        ctx.sign(10, -1.9, 2.8, -2, Math.PI / 2);

        P.game.lasers.push(new P.LaserEmitter(g, V3(-1.75, 1.5, 4), V3(1, 0, 0)));
        P.game.receivers.push(new P.LaserReceiver(g, V3(12, 5, -7.7), V3(0, 0, 1), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(20.25, 0, 0), 'z', 2.2, 3));
        P.game.grills.push(new P.Grill(g, V3(20.6, 0, -1.1), V3(20.75, 3, 1.1)));
        P.game.elevator = new P.Elevator(g, V3(22.5, 0, 0));
      }
    },

    /* ------------------------------- 11 : final examination (and reward) */
    {
      title: '11', voice: 'ch11', unlock: 2,
      start: V3(-4, 0, 4), yaw: -Math.PI / 2 - 0.4,
      build(ctx, g) {
        const S = ctx.S;
        // --- room A: gel + companion cube + button  (x -6..8) ---
        S(-6.5, -0.5, -6.5, 8.5, 0, 6.5, 'floorm');
        S(-6.5, 9, -6.5, 38.5, 9.5, 6.5, 'metal');                      // shared ceiling
        S(-6.5, 0, -6.5, -6, 9, 6.5, 'white');
        S(-6.5, 0, -6.5, 8.5, 9, -6, 'white');
        S(-6.5, 0, 6, 8.5, 9, 6.5, 'metal');
        S(8, 0, -6, 8.5, 9, 1.9, 'metal');                              // east w/ door dA
        S(8, 0, 4.1, 8.5, 9, 6, 'metal');
        S(8, 3, 1.9, 8.5, 9, 4.1, 'metal');
        S(4, 3.5, -6, 8, 4, -3, 'metal');                               // companion ledge
        // --- corridor B: faith plate over goo (x 8.5..24, z 0.5..5.5) ---
        S(8.5, -0.5, 0.5, 10, 0, 5.5, 'floorm');
        S(10, -2.5, 0.5, 20, -2, 5.5, 'metal');
        S(9.5, -2, 0.5, 10, 0, 5.5, 'metal');
        S(20, -2, 0.5, 20.5, 0, 5.5, 'metal');
        S(20, -0.5, 0.5, 24, 0, 5.5, 'floorm');
        S(8.5, 0, 0, 24, 9, 0.5, 'metal');
        S(8.5, 0, 5.5, 24, 9, 6, 'metal');
        // --- room C: beam puzzle (x 24..38) ---
        S(24, 0, -6, 24.5, 9, 2, 'metal');                              // C entrance wall
        S(24, 0, 4.2, 24.5, 9, 6, 'metal');
        S(24, 3, 2, 24.5, 9, 4.2, 'metal');
        S(24.5, -0.5, -6.5, 38.5, 0, 6.5, 'floorm');
        S(24.5, 0, -6.5, 38.5, 9, -6, 'metal');                         // north (receiver)
        S(24.5, 0, 6, 38.5, 9, 6.5, 'white');                           // south (host)
        S(32, 0, -4, 33, 3, -2, 'white');                               // beam pillar
        S(38, 0, -6.5, 38.5, 9, -1.1, 'metal');                         // east w/ door dC
        S(38, 0, 1.1, 38.5, 9, 6.5, 'metal');
        S(38, 3, -1.1, 38.5, 9, 1.1, 'metal');
        // --- final corridor + reward annex ---
        S(38.5, -0.5, -2.1, 44, 0, 2.1, 'floorm');
        S(38.5, 0, -2.6, 44, 4, -2.1, 'metal');
        S(38.5, 0, 2.1, 44, 4, 2.6, 'metal');
        S(38.5, 4, -2.6, 44, 4.5, 2.6, 'metal');
        S(44, -0.5, -4.5, 52.5, 0, 4.5, 'floorm');
        S(44, 0, -5, 52.5, 6, -4.5, 'metal');
        S(44, 0, 4.5, 52.5, 6, 5, 'metal');
        S(52, 0, -4.5, 52.5, 6, 4.5, 'metal');
        S(44, 6, -5, 52.5, 6.5, 5, 'metal');

        ctx.light(0, 7.5, 0, 0.85); ctx.light(6, 7, -4, 0.55); ctx.light(15, 7, 3, 0.7);
        ctx.light(31, 7, 0, 0.8); ctx.light(41, 3.5, 0, 0.55, 8);
        const warm = new THREE.PointLight(0xffd9a0, 1.3, 11);
        warm.position.set(48.5, 4, 0); g.add(warm);
        ctx.sign(11, -6.4, 2.8, 2, Math.PI / 2);

        P.game.gels.push(new P.GelZone(g, 'bounce', V3(-2, 0, -4), V3(4, 0, 2)));
        P.game.cubes.push(new P.Cube(g, V3(6, 4.6, -4.5), { companion: true }));
        P.game.buttons.push(new P.Button(g, V3(-4, 0, 4), ['dA']));
        P.game.doors.push(new P.Door(g, 'dA', V3(8.25, 0, 3), 'z', 2.2, 3));
        P.game.goos.push(new P.Goo(g, V3(10, -2, 0.5), V3(20, -1.3, 5.5)));
        P.game.plates.push(new P.FaithPlate(g, V3(9.3, 0, 3), V3(11, 12, 0)));
        P.game.lasers.push(new P.LaserEmitter(g, V3(24.75, 1.5, -3), V3(1, 0, 0)));
        P.game.receivers.push(new P.LaserReceiver(g, V3(35, 5, -5.7), V3(0, 0, 1), ['dC']));
        P.game.doors.push(new P.Door(g, 'dC', V3(38.25, 0, 0), 'z', 2.2, 3));
        P.game.grills.push(new P.Grill(g, V3(39, 0, -1.6), V3(39.15, 3, 1.6)));
        P.game.turrets.push(new P.Turret(g, V3(41.5, 0, 0), -Math.PI / 2));

        // the "reward"
        bakeCake(g, 48.5, 0);
        P.game.trapPos = V3(48.5, 1, 0);
      }
    },

    /* =================== ACT 3 : behind the facility =================== */

    /* ------------------------------------------------ 12 : disposal pit */
    {
      title: '12', cardLabel: 'DISPOSAL PIT', voice: 'ch12', unlock: 2,
      start: V3(2, 0, 2), yaw: Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // shaft x -6..6 z -6..6 h 16, escape opening west at y 8
        S(-6.5, -0.5, -6.5, 6.5, 0, 6.5, 'rust');
        S(-6.5, 16, -6.5, 6.5, 16.5, 6.5, 'rust');
        S(6, 0, -6.5, 6.5, 16, 6.5, 'rust');
        S(-6.5, 0, -6.5, 6.5, 16, -6, 'scorch');                        // scorched panels (host)
        S(-6.5, 0, 6, 6.5, 16, 6.5, 'rust');
        S(-6.5, 0, -6.5, -6, 6.5, 6.5, 'rust');                         // west below opening
        S(-6.5, 6.5, -6.5, -6, 16, -1.6, 'rust');
        S(-6.5, 6.5, 1.6, -6, 16, 6.5, 'rust');
        S(-6.5, 9.5, -1.6, -6, 16, 1.6, 'rust');
        // escape corridor x -11..-6 at y 6.5
        S(-11, 6, -2.1, -6, 6.5, 2.1, 'rust');
        S(-11, 6.5, -2.6, -6, 10.5, -2.1, 'rust');
        S(-11, 6.5, 2.1, -6, 10.5, 2.6, 'rust');
        S(-11, 10.5, -2.6, -6, 11, 2.6, 'rust');
        S(-11.5, 6.5, -2.1, -11, 10.5, 2.1, 'rust');

        const glow = new THREE.PointLight(0xff8844, 0.7, 20);
        glow.position.set(0, 3, 0); g.add(glow);
        ctx.light(0, 14, 0, 0.5); ctx.light(-8.5, 11, 0, 0.6, 8);

        P.game.gels.push(new P.GelZone(g, 'bounce', V3(-3, 0, -3), V3(3, 0, 3)));
        P.game.elevator = new P.Elevator(g, V3(-9, 6.5, 0));
      }
    },

    /* --------------------------------------------- 13 : service catwalks */
    {
      title: '13', cardLabel: 'SERVICE AREA', voice: 'ch13', unlock: 2,
      start: V3(-3, 0, -2), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // backstage wall + catwalks over a void (falling = retrieval)
        S(-4, -2, -4.5, 30, 10, -4, 'scorch');                          // backstage panels (host)
        S(-4, -0.5, -3, 2, 0, -1, 'rust');                              // catwalk A
        S(8, -0.5, -3, 14, 0, -1, 'rust');                              // catwalk B
        S(20, -0.5, -3, 30, 0, -1, 'rust');                             // catwalk C + exit
        ctx.light(0, 5, -2, 0.6, 14); ctx.light(11, 5, -2, 0.6, 14);
        ctx.light(24, 5, -2, 0.6, 14); ctx.light(28, 4, -2, 0.6, 10);
        ctx.sign(13, 0, 2.5, -3.95, 0);

        P.game.turrets.push(new P.Turret(g, V3(11, 0, -2), -Math.PI / 2));
        P.game.turrets.push(new P.Turret(g, V3(21, 0, -2), -Math.PI / 2));
        P.game.grills.push(new P.Grill(g, V3(25.4, 0, -3), V3(25.55, 3, -1)));
        P.game.elevator = new P.Elevator(g, V3(28, 0, -2));
      }
    },

    /* ------------------------------------------- 14 : long-term storage */
    {
      title: '14', cardLabel: 'LONG-TERM STORAGE', voice: 'ch14', unlock: 2,
      start: V3(-6, 0, 5), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // warehouse x -8..16 z -8..8 h 8, white ceiling for drop tricks
        S(-8.5, -0.5, -8.5, 16.5, 0, 8.5, 'floorm');
        S(-8.5, 8, -8.5, 20.5, 8.5, 8.5, 'white');                      // ceiling (host!)
        S(-8.5, 0, -8.5, -8, 8, 8.5, 'scorch');
        S(-8.5, 0, -8.5, 16.5, 8, -8, 'rust');
        S(-8.5, 0, 8, 16.5, 8, 8.5, 'rust');
        S(16, 0, -8.5, 16.5, 8, -1.1, 'rust');                          // east w/ door
        S(16, 0, 1.1, 16.5, 8, 8.5, 'rust');
        S(16, 3, -1.1, 16.5, 8, 1.1, 'rust');
        S(6, 3.5, -8, 10, 4, -5, 'rust');                               // high shelf
        // crate clutter
        S(-4, 0, -6, -2, 2, -4, 'metal'); S(-2, 0, -6, 0, 1, -5, 'metal');
        S(12, 0, 4, 14, 2, 6, 'metal'); S(11, 0, 6, 14, 1, 7.5, 'metal');
        S(-6, 0, 0, -4.6, 1.4, 1.4, 'metal');
        // alcove
        S(16.5, -0.5, -2.1, 20.5, 0, 2.1, 'floorm');
        S(16.5, 0, -2.6, 20.5, 8, -2.1, 'rust');
        S(16.5, 0, 2.1, 20.5, 8, 2.6, 'rust');
        S(20, 0, -2.1, 20.5, 8, 2.1, 'rust');

        ctx.light(0, 7, 0, 0.7); ctx.light(10, 7, -4, 0.6); ctx.light(18.5, 5, 0, 0.55, 8);
        ctx.sign(14, -7.9, 2.8, 2, Math.PI / 2);

        P.game.cubes.push(new P.Cube(g, V3(0, 0.6, 4)));
        P.game.cubes.push(new P.Cube(g, V3(8, 4.6, -6.5)));
        const b1 = new P.Button(g, V3(3, 0, 2), []);
        const b2 = new P.Button(g, V3(-3, 0, -2), []);
        P.game.buttons.push(b1, b2);
        const d = new P.Door(g, 'd0', V3(16.25, 0, 0), 'z', 2.2, 3);
        P.game.doors.push(d);
        P.game.elevator = new P.Elevator(g, V3(18.5, 0, 0));
        this.onUpdate = () => d.setOpen(b1.pressed && b2.pressed);      // AND gate
      }
    },

    /* --------------------------------------------- 15 : transit spine */
    {
      title: '15', cardLabel: 'TRANSIT SPINE', voice: 'ch15', unlock: 2,
      start: V3(-3.5, 0, 0), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // hall x -4..34.5 z -4..4 h 16 : gel sprint, goo gap, drop shaft, wall fling
        S(-4.5, -0.5, -4.5, 14, 0, 4.5, 'floorm');
        S(14, -2.5, -4.5, 20, -2, 4.5, 'metal');
        S(13.5, -2, -4.5, 14, 0, 4.5, 'metal');
        S(20, -2, -4.5, 20.5, 0, 4.5, 'metal');
        S(20, -0.5, -4.5, 28, 0, 4.5, 'floorm');
        S(28, -0.5, -4.5, 31, 0, -1.5, 'floorm');                       // shaft rim
        S(28, -0.5, 1.5, 31, 0, 4.5, 'floorm');
        S(31, -0.5, -4.5, 34.5, 0, 4.5, 'floorm');
        S(27.5, -12, -2, 28, -0.4, 2, 'rust');                          // shaft walls
        S(31, -12, -2, 31.5, -0.4, 2, 'rust');
        S(28, -12, -2, 31, -0.4, -1.5, 'rust');
        S(28, -12, 1.5, 31, -0.4, 2, 'rust');
        S(27.5, -12.5, -2, 31.5, -12, 2, 'white');                      // fling floor
        S(12, 5.5, -4, 20, 6, 4, 'metal');                              // upper deck
        S(-4.5, 16, -4.5, 35, 16.5, 4.5, 'metal');                      // ceiling
        S(-5, 0, -4.5, -4.5, 16, 4.5, 'white');                        // west
        S(34.5, 0, -4.5, 35, 16, 4.5, 'white');                         // east (fling exit)
        S(-4.5, -2, -5, 34.5, 16, -4.5, 'rust');                        // north
        S(-4.5, -2, 4.5, 34.5, 16, 5, 'rust');                         // south

        ctx.light(0, 9, 0, 0.7); ctx.light(16, 9, 0, 0.7); ctx.light(29, 8, 0, 0.7);
        ctx.light(29.5, -10, 0, 0.7, 10); ctx.light(16, 8, 0, 0.6);
        ctx.sign(15, -4.4, 2.8, 2, Math.PI / 2);

        P.game.gels.push(new P.GelZone(g, 'speed', V3(-2, 0, -2), V3(14, 0, 2)));
        P.game.goos.push(new P.Goo(g, V3(14, -2, -4.5), V3(20, -1.3, 4.5)));
        P.game.elevator = new P.Elevator(g, V3(14.5, 6, 0));
      }
    },

    /* ---------------------------------------------- 16 : the approach */
    {
      title: '16', cardLabel: 'THE APPROACH', voice: 'ch16', unlock: 2,
      start: V3(0, 0, 4), yaw: -Math.PI / 2,
      build(ctx, g) {
        const S = ctx.S;
        // room 1 x -2..18 (beam) -> room 2 x 18.5..30 (sentries) -> elevator
        S(-2.5, -0.5, -6.5, 30.5, 0, 6.5, 'floorm');
        S(-2.5, 7, -6.5, 18.5, 7.5, 6.5, 'metal');                      // room1 ceiling
        S(18.5, 7, -6.5, 34.5, 7.5, 6.5, 'white');                      // room2 ceiling (host)
        S(-2.5, 0, -6.5, -2, 7, 6.5, 'rust');
        S(-2.5, 0, -7, 30.5, 7, -6.5, 'rust');                          // north (receiver mount)
        S(-2.5, 0, 6.5, 30.5, 7, 7, 'white');                           // south (host)
        S(8, 0, -4, 9, 3, -2, 'white');                                 // beam pillar
        S(18, 0, -6.5, 18.5, 7, -1.1, 'white');                         // divider w/ door d0 (host)
        S(18, 0, 1.1, 18.5, 7, 6.5, 'white');
        S(18, 3, -1.1, 18.5, 7, 1.1, 'white');
        S(30, 0, -6.5, 30.5, 7, -1.1, 'rust');                          // east w/ door d1
        S(30, 0, 1.1, 30.5, 7, 6.5, 'rust');
        S(30, 3, -1.1, 30.5, 7, 1.1, 'rust');
        // alcove
        S(30.5, -0.5, -2.1, 34.5, 0, 2.1, 'floorm');
        S(30.5, 0, -2.6, 34.5, 7, -2.1, 'rust');
        S(30.5, 0, 2.1, 34.5, 7, 2.6, 'rust');
        S(34, 0, -2.1, 34.5, 7, 2.1, 'rust');

        ctx.light(4, 6, 0, 0.75); ctx.light(14, 6, 0, 0.7); ctx.light(24, 6, 0, 0.75);
        ctx.light(32.5, 5, 0, 0.55, 8);
        ctx.sign(16, -1.9, 2.8, -2, Math.PI / 2);

        P.game.lasers.push(new P.LaserEmitter(g, V3(-1.75, 1.5, -3), V3(1, 0, 0)));
        P.game.receivers.push(new P.LaserReceiver(g, V3(12, 4.5, -6.2), V3(0, 0, 1), ['d0']));
        P.game.doors.push(new P.Door(g, 'd0', V3(18.25, 0, 0), 'z', 2.2, 3));
        P.game.cubes.push(new P.Cube(g, V3(20, 0.6, 4)));
        P.game.turrets.push(new P.Turret(g, V3(23, 0, -2), -Math.PI / 2));
        P.game.turrets.push(new P.Turret(g, V3(25, 0, 0), -Math.PI / 2));
        P.game.turrets.push(new P.Turret(g, V3(23, 0, 2), -Math.PI / 2));
        P.game.buttons.push(new P.Button(g, V3(27, 0, 3), ['d1']));
        P.game.doors.push(new P.Door(g, 'd1', V3(30.25, 0, 0), 'z', 2.2, 3));
        P.game.grills.push(new P.Grill(g, V3(30.6, 0, -1.1), V3(30.75, 3, 1.1)));
        P.game.elevator = new P.Elevator(g, V3(32.5, 0, 0));
      }
    },

    /* ------------------------------------------- 17 : the Overseer core */
    {
      title: '17', cardLabel: 'CENTRAL AI CHAMBER', voice: 'ch17', unlock: 2,
      start: V3(0, 0, -11), yaw: Math.PI,
      build(ctx, g) {
        const S = ctx.S;
        // grand chamber x -14..14 z -14..14 h 14, all walls portal-friendly
        S(-14.5, -0.5, -14.5, 14.5, 0, 14.5, 'floorm');
        S(-14.5, 14, -14.5, 14.5, 14.5, 14.5, 'metal');
        S(-14.5, 0, -14.5, -14, 14, 14.5, 'scorch');
        S(14, 0, -14.5, 14.5, 14, 14.5, 'scorch');
        S(-14.5, 0, -14.5, 14.5, 14, -14, 'scorch');
        S(-14.5, 0, 14, 14.5, 14, 14.5, 'scorch');
        S(-1, 0, -1, 1, 4, 1, 'white');                                 // core pedestal column

        ctx.light(0, 12, 0, 0.55); ctx.light(-9, 10, -9, 0.5); ctx.light(9, 10, 9, 0.5);
        ctx.light(9, 10, -9, 0.5); ctx.light(-9, 10, 9, 0.5);

        // the Overseer: a hanging core with a red eye and a shield
        const core = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 18),
          new THREE.MeshLambertMaterial({ color: 0x23282c }));
        core.add(shell);
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14),
          new THREE.MeshBasicMaterial({ color: 0xff2222 }));
        eye.position.set(0, 0, -1.35); core.add(eye);
        const eyeLight = new THREE.PointLight(0xff3322, 1.2, 16);
        core.add(eyeLight);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 4, 10), P.mats.cubeEdge);
        stem.position.y = 3.5; core.add(stem);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x66c8ff, transparent: true, opacity: 0.22,
          blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
        });
        const shield = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 18), shieldMat);
        core.add(shield);
        core.position.set(0, 7, 0);
        g.add(core);

        P.game.lasers.push(new P.LaserEmitter(g, V3(-13.75, 2, 0), V3(1, 0, 0)));
        const r1 = new P.LaserReceiver(g, V3(-6, 6, -13.7), V3(0, 0, 1), [], { latch: true });
        const r2 = new P.LaserReceiver(g, V3(13.7, 6, 6), V3(-1, 0, 0), [], { latch: true });
        const r3 = new P.LaserReceiver(g, V3(6, 6, 13.7), V3(0, 0, -1), [], { latch: true });
        P.game.receivers.push(r1, r2, r3);
        P.game.turrets.push(new P.Turret(g, V3(6, 0, 6), Math.PI));
        P.game.turrets.push(new P.Turret(g, V3(-6, 0, 6), Math.PI));

        let lit = 0, overloadT = -1, t = 0, hintT = 14, tauntT = 3;
        const corePos = V3(0, 7, 0);
        const segNear = (a, b, p, r) => {
          const ab = b.clone().sub(a), len = ab.length();
          if (len < 0.01) return false;
          ab.divideScalar(len);
          const k = P.clamp(p.clone().sub(a).dot(ab), 0, len);
          return a.clone().add(ab.multiplyScalar(k)).distanceTo(p) < r;
        };
        this.onUpdate = (dt) => {
          t += dt;
          core.rotation.y = Math.sin(t * 0.4) * 0.6;
          eye.material.color.setHSL(0, 1, 0.45 + Math.sin(t * 5) * 0.1);
          if (overloadT < 0) {
            // shooting the beam at the core itself earns commentary, not damage
            tauntT -= dt;
            const em = P.game.lasers[0];
            if (tauntT <= 0 && em && em.segments) {
              for (const [a, b] of em.segments) {
                if (segNear(a, b, corePos, 2.9)) {
                  tauntT = 9;
                  P.voice.interrupt(P.voice.rand('coreEye'));
                  break;
                }
              }
            }
            // periodic nudge toward the wall nodes while stuck
            if (lit < 3) {
              hintT -= dt;
              if (hintT <= 0 && !P.voice.busy && P.voice.queue.length === 0) {
                hintT = 17;
                P.voice.say(P.voice.rand('coreHint'));
              }
            }
          }
          const n = [r1, r2, r3].filter(r => r.active).length;
          if (n > lit) {
            lit = n;
            P.voice.interrupt(P.voice.lines.coreNode[Math.min(lit - 1, 2)]);
            shieldMat.opacity = 0.22 * (1 - lit / 3);
          }
          if (lit === 3 && overloadT < 0) {
            overloadT = 0;
            P.voice.interrupt(P.voice.lines.overload);
            P.game.turrets.forEach(tu => tu.die(true));   // loyalty has limits
          }
          if (overloadT >= 0) {
            overloadT += dt;
            core.rotation.z = Math.sin(overloadT * 22) * 0.12 * overloadT;
            eyeLight.intensity = 1.2 + Math.sin(overloadT * 30) * overloadT;
            if (overloadT > 5.5) { this.onUpdate = null; P.game.win(); }
          }
        };
      }
    },
  ];

})(window.PORTAL);
