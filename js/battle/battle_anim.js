'use strict';
/**
 * Move animation player. Every move carries an anim spec {fx, col, n} —
 * the fx kind defines motion, the palette + particle count make each move
 * read distinctly. Animations draw over the battle scene each frame.
 */
const BattleAnim = {
  current: null,

  /** geom: {ux,uy,tx,ty} user/target sprite centers. */
  start(spec, geom, onDone) {
    const kind = BattleAnim.kinds[spec.fx] || BattleAnim.kinds.impact;
    BattleAnim.current = {
      spec, geom, onDone,
      frame: 0,
      dur: kind.dur(spec),
      kind,
      state: kind.init ? kind.init(spec, geom) : {},
    };
  },

  get active() { return !!BattleAnim.current; },

  update() {
    const a = BattleAnim.current;
    if (!a) return;
    a.frame++;
    if (a.frame >= a.dur) {
      BattleAnim.current = null;
      if (a.onDone) a.onDone();
    }
  },

  draw(ctx) {
    const a = BattleAnim.current;
    if (!a) return;
    a.kind.draw(ctx, a.spec, a.geom, a.frame / a.dur, a.frame, a.state);
  },

  /** Offset to apply to the USER sprite while animating (lunges). */
  userOffset() {
    const a = BattleAnim.current;
    if (!a || a.spec.fx !== 'lunge') return { x: 0, y: 0 };
    const t = a.frame / a.dur;
    const push = Math.sin(t * Math.PI) * 14;
    const dx = a.geom.tx - a.geom.ux, dy = a.geom.ty - a.geom.uy;
    const len = Math.hypot(dx, dy) || 1;
    return { x: (dx / len) * push, y: (dy / len) * push };
  },

  px(ctx, x, y, c, size = 2) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, size, size); },

  /** 4-point impact star (the classic pixel "hit" flash). */
  star(ctx, x, y, r, col, core = '#fff') {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.28, y - r * 0.28);
    ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.28, y + r * 0.28);
    ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.28, y + r * 0.28);
    ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.28, y - r * 0.28);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = core;
    ctx.fillRect(x - 1, y - 1, 3, 3);
  },

  kinds: {
    lunge: {
      dur: () => 24,
      draw(ctx, spec, g, t) {
        const dx = g.tx - g.ux, dy = g.ty - g.uy;
        const len = Math.hypot(dx, dy) || 1;
        // dust kick at launch
        if (t < 0.35) {
          for (let i = 0; i < 4; i++) {
            ctx.globalAlpha = 1 - t * 2.5;
            BattleAnim.px(ctx, g.ux - (dx / len) * (4 + i * 4) + (i - 1.5) * 3, g.uy + 10 - t * 20 - i, '#d8d0c0', 2);
            ctx.globalAlpha = 1;
          }
        }
        // layered speed streaks (long, tapering)
        for (let i = 0; i < spec.n; i++) {
          const off = (i / spec.n - 0.5) * 24;
          const bx = g.ux + dx * t * 0.85 - (dy / len) * off * 0.4;
          const by = g.uy + dy * t * 0.85 + (dx / len) * off * 0.4;
          const c = spec.col[i % spec.col.length];
          const tail = 8 + (i % 3) * 5;
          ctx.globalAlpha = 0.85 - (i % 3) * 0.2;
          ctx.strokeStyle = c; ctx.lineWidth = i % 2 ? 1 : 2;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - (dx / len) * tail, by - (dy / len) * tail);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // impact star as contact lands
        if (t > 0.62) {
          const it = (t - 0.62) / 0.38;
          BattleAnim.star(ctx, g.tx + 4, g.ty - 2, 12 * (1 - it * 0.4), spec.col[0]);
          ctx.globalAlpha = 1 - it;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(g.tx, g.ty, 6 + it * 14, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      },
    },
    slash: {
      dur: () => 22,
      draw(ctx, spec, g, t) {
        const n = Math.min(3, spec.n);
        for (let i = 0; i < n; i++) {
          const start = i * 0.18;
          if (t < start) continue;
          const lt = Math.min(1, (t - start) / 0.5);
          const cx = g.tx - 8 + i * 8, cy = g.ty;
          // crescent arc: bright core + colored edge, sweeping down-right
          const a0 = -2.4 + lt * 0.9, a1 = -0.9 + lt * 0.9;
          ctx.globalAlpha = 1 - lt * 0.65;
          ctx.strokeStyle = spec.col[i % spec.col.length];
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, cy, 15, a0, a1); ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, cy, 15, a0 + 0.15, a1 - 0.15); ctx.stroke();
          ctx.globalAlpha = 1;
          // trailing spark at the arc tip
          const tipx = cx + Math.cos(a1) * 15, tipy = cy + Math.sin(a1) * 15;
          BattleAnim.px(ctx, tipx, tipy, '#fff', 2);
        }
        if (t > 0.55) {
          const it = (t - 0.55) / 0.45;
          ctx.globalAlpha = 1 - it;
          BattleAnim.star(ctx, g.tx, g.ty, 8, spec.col[0]);
          ctx.globalAlpha = 1;
        }
      },
    },
    impact: {
      dur: () => 22,
      draw(ctx, spec, g, t) {
        // white flash-frame, then star + shockwave + gravity debris
        if (t < 0.14) {
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(g.tx, g.ty, 10, 0, Math.PI * 2); ctx.fill();
          return;
        }
        const et = (t - 0.14) / 0.86;
        BattleAnim.star(ctx, g.tx, g.ty, 13 * (1 - et * 0.5), spec.col[0]);
        // expanding shockwave ring
        ctx.globalAlpha = 1 - et;
        ctx.strokeStyle = spec.col[spec.col.length - 1] || '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.tx, g.ty, 4 + et * 20, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        // debris chunks flying out with gravity
        for (let i = 0; i < spec.n; i++) {
          const ang = (i / spec.n) * Math.PI * 2 + i * 0.7;
          const r = et * (14 + (i % 4) * 5);
          const x = g.tx + Math.cos(ang) * r;
          const y = g.ty + Math.sin(ang) * r * 0.7 + et * et * 10;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], et < 0.5 ? 2 : 1);
        }
      },
    },
    beam: {
      dur: () => 32,
      draw(ctx, spec, g, t, f) {
        const grow = Math.min(1, t * 3.2);
        const fade = t > 0.78 ? 1 - (t - 0.78) * 4.5 : 1;
        const dx = g.tx - g.ux, dy = g.ty - g.uy;
        // muzzle charge glow at the user
        if (t < 0.25) {
          ctx.globalAlpha = t * 4 * fade;
          ctx.fillStyle = spec.col[spec.col.length - 1] || '#fff';
          ctx.beginPath(); ctx.arc(g.ux, g.uy, 6 - t * 8, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = fade * 0.35;   // soft outer glow pass
        ctx.strokeStyle = spec.col[0]; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(g.ux, g.uy); ctx.lineTo(g.ux + dx * grow, g.uy + dy * grow); ctx.stroke();
        ctx.globalAlpha = fade;
        for (let i = spec.col.length - 1; i >= 0; i--) {
          const w = (spec.col.length - i) * 2 + ((f >> 2) & 1);   // pulsing core
          ctx.strokeStyle = spec.col[i];
          ctx.lineWidth = w;
          ctx.beginPath(); ctx.moveTo(g.ux, g.uy); ctx.lineTo(g.ux + dx * grow, g.uy + dy * grow); ctx.stroke();
        }
        // energy motes riding the beam
        for (let i = 0; i < 4; i++) {
          const pt = ((f / 14) + i / 4) % 1;
          if (pt < grow) BattleAnim.px(ctx, g.ux + dx * pt, g.uy + dy * pt - 2, '#fff', 1);
        }
        // contact burst
        if (grow >= 1) {
          BattleAnim.star(ctx, g.tx, g.ty, 8 + ((f >> 1) & 3), spec.col[0]);
          for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2 + f / 4;
            BattleAnim.px(ctx, g.tx + Math.cos(ang) * 10, g.ty + Math.sin(ang) * 8, spec.col[i % spec.col.length]);
          }
        }
        ctx.globalAlpha = 1;
      },
    },
    proj: {
      dur: (spec) => 16 + spec.n * 4,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const start = i / (spec.n + 2);
          const pt = (t - start) * (spec.n + 2) / 2.2;
          if (pt < 0 || pt > 1.1) continue;
          const arcH = 14 + (i % 3) * 6;
          const c = spec.col[i % spec.col.length];
          // fading trail ghosts behind each projectile
          for (let k = 3; k >= 1; k--) {
            const bp = Math.max(0, pt - k * 0.06);
            const bx = Util.lerp(g.ux, g.tx, bp);
            const by = Util.lerp(g.uy, g.ty, bp) - Math.sin(bp * Math.PI) * arcH;
            ctx.globalAlpha = 0.5 - k * 0.13;
            BattleAnim.px(ctx, bx, by, c, 2);
            ctx.globalAlpha = 1;
          }
          if (pt <= 1) {
            const x = Util.lerp(g.ux, g.tx, pt);
            const y = Util.lerp(g.uy, g.ty, pt) - Math.sin(pt * Math.PI) * arcH;
            BattleAnim.px(ctx, x - 1, y - 1, c, 3);
            BattleAnim.px(ctx, x, y - 1, '#fff', 1);   // glint
          } else {
            // pop on landing
            const et = (pt - 1) * 6;
            ctx.globalAlpha = Math.max(0, 1 - et);
            BattleAnim.star(ctx, g.tx, g.ty, 6, c);
            ctx.globalAlpha = 1;
          }
        }
      },
    },
    burst: {
      dur: () => 28,
      draw(ctx, spec, g, t) {
        // white core flash
        if (t < 0.22) {
          ctx.globalAlpha = 1 - t * 3;
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(g.tx, g.ty, 16 * (t * 4.5), 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        // radial streaks
        ctx.globalAlpha = Math.max(0, 1 - t * 1.2);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2 + 0.3;
          ctx.strokeStyle = spec.col[i % spec.col.length];
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(g.tx + Math.cos(ang) * 6, g.ty + Math.sin(ang) * 5);
          ctx.lineTo(g.tx + Math.cos(ang) * (10 + t * 22), g.ty + Math.sin(ang) * (8 + t * 18));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // particle shells
        for (let i = 0; i < spec.n; i++) {
          const ang = (i / spec.n) * Math.PI * 2 + i;
          const r = t * (16 + (i % 4) * 6);
          const size = t < 0.4 ? 3 : t < 0.7 ? 2 : 1;
          BattleAnim.px(ctx, g.tx + Math.cos(ang) * r, g.ty + Math.sin(ang) * r * 0.85, spec.col[i % spec.col.length], size);
        }
        // shockwave ring
        ctx.globalAlpha = Math.max(0, 0.9 - t);
        ctx.strokeStyle = spec.col[spec.col.length - 1] || '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(g.tx, g.ty, 6 + t * 26, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
      },
    },
    spray: {
      dur: () => 24,
      draw(ctx, spec, g, t) {
        const dx = g.tx - g.ux, dy = g.ty - g.uy;
        for (let i = 0; i < spec.n; i++) {
          const jitter = ((i * 37) % 17 - 8) / 8;
          const pt = (t + (i / spec.n) * 0.4) % 1;
          const x = g.ux + dx * pt + jitter * 10 * pt;
          const y = g.uy + dy * pt + jitter * 8 * pt;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length]);
        }
      },
    },
    bolt: {
      dur: () => 26,
      init(spec, g) {
        // Pre-computed zigzag from sky to target
        const segs = [];
        let x = g.tx + Util.randRange(-8, 8), y = 0;
        while (y < g.ty - 4) {
          const nx = g.tx + Util.randRange(-10, 10);
          const ny = y + Util.randRange(8, 16);
          segs.push([x, y, nx, Math.min(ny, g.ty)]);
          x = nx; y = ny;
        }
        return { segs };
      },
      draw(ctx, spec, g, t, f, st) {
        if (t < 0.55) {
          const flash = (f % 4) < 2;
          // sky flash on the first strike frames
          if (t < 0.2 && flash) {
            ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, Screen.W, Screen.H); ctx.globalAlpha = 1;
          }
          // outer colored bolt + hot white core
          ctx.strokeStyle = flash ? spec.col[0] : spec.col[1 % spec.col.length];
          ctx.lineWidth = flash ? 4 : 2;
          ctx.beginPath();
          for (const [x1, y1, x2, y2] of st.segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
          ctx.stroke();
          if (flash) {
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
            ctx.beginPath();
            for (const [x1, y1, x2, y2] of st.segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
            ctx.stroke();
          }
          // crackling branches off the main bolt
          if (flash && st.segs.length > 2) {
            const [bx, by] = [st.segs[1][2], st.segs[1][3]];
            ctx.strokeStyle = spec.col[0]; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(bx, by); ctx.lineTo(bx - 7, by + 5);
            ctx.moveTo(bx, by); ctx.lineTo(bx + 6, by + 7);
            ctx.stroke();
          }
        } else {
          const bt = (t - 0.55) / 0.45;
          BattleAnim.star(ctx, g.tx, g.ty, 11 * (1 - bt * 0.4), spec.col[0]);
          ctx.globalAlpha = 1 - bt;
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(g.tx, g.ty, 5 + bt * 16, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
          for (let i = 0; i < spec.n * 3; i++) {
            const ang = (i / (spec.n * 3)) * Math.PI * 2;
            BattleAnim.px(ctx, g.tx + Math.cos(ang) * bt * 18, g.ty + Math.sin(ang) * bt * 12, spec.col[i % spec.col.length]);
          }
        }
      },
    },
    quake: {
      dur: () => 30,
      draw(ctx, spec, g, t, f) {
        Screen.shakeOffset = t < 0.8 ? ((f % 4) < 2 ? 2 : -2) : 0;
        // dust clods rising at target's feet
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 2 + i / spec.n) % 1;
          const x = g.tx - 20 + (i * 41) % 40;
          const y = g.ty + 14 - pt * 16;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], pt < 0.5 ? 3 : 2);
        }
      },
    },
    wave: {
      dur: () => 30,
      draw(ctx, spec, g, t) {
        const x = Util.lerp(g.ux, g.tx, t);
        for (let i = 0; i < 14; i++) {
          const yo = Math.sin(i / 2 + t * 10) * 4;
          const h = 14 + Math.sin(i + t * 6) * 4;
          ctx.fillStyle = spec.col[i % spec.col.length];
          ctx.fillRect(x - 14 + i * 2, g.ty - h + yo, 2, h);
        }
      },
    },
    sparkle: {
      dur: () => 30,
      draw(ctx, spec, g, t, f) {
        for (let i = 0; i < spec.n; i++) {
          if ((f + i * 3) % 10 > 6) continue;
          const ang = i * 2.4 + t * 2;
          const r = 10 + (i % 3) * 7;
          const x = g.tx + Math.cos(ang) * r, y = g.ty + Math.sin(ang) * r * 0.8;
          const c = spec.col[i % spec.col.length];
          BattleAnim.px(ctx, x, y, c, 1);
          BattleAnim.px(ctx, x - 1, y - 1, c, 1); BattleAnim.px(ctx, x + 1, y - 1, c, 1);
          BattleAnim.px(ctx, x, y - 2, c, 1); BattleAnim.px(ctx, x, y, c, 1);
        }
      },
    },
    aura: {
      dur: () => 30,
      draw(ctx, spec, g, t) {
        // rising motes around the user
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 1.6 + i / spec.n) % 1;
          const x = g.ux - 18 + ((i * 29) % 36);
          const y = g.uy + 16 - pt * 36;
          ctx.globalAlpha = 1 - pt;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length]);
          ctx.globalAlpha = 1;
        }
      },
    },
    wind: {
      dur: () => 28,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = (t + i / spec.n) % 1;
          const ang = pt * Math.PI * 4 + i;
          const r = 22 * (1 - pt) + 4;
          const x = Util.lerp(g.ux, g.tx, pt) + Math.cos(ang) * r * 0.5;
          const y = Util.lerp(g.uy, g.ty, pt) + Math.sin(ang) * r * 0.4;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length]);
          BattleAnim.px(ctx, x - 2, y, spec.col[i % spec.col.length], 1);
        }
      },
    },
    petals: {
      dur: () => 28,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = Util.clamp(t * 1.4 - i * 0.05, 0, 1);
          const x = Util.lerp(g.ux, g.tx, pt) + Math.sin(pt * 8 + i) * 6;
          const y = Util.lerp(g.uy, g.ty, pt) + Math.cos(pt * 6 + i) * 5;
          const c = spec.col[i % spec.col.length];
          // leaf: 2x1 slanted
          BattleAnim.px(ctx, x, y, c, 2);
          BattleAnim.px(ctx, x + 2, y - 1, c, 1);
        }
      },
    },
    rocks: {
      dur: () => 26,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const start = i / (spec.n + 1);
          const pt = Util.clamp((t - start) * 3, 0, 1);
          if (pt <= 0 || pt >= 1) continue;
          const x = g.tx - 16 + ((i * 23) % 32);
          const y = g.ty - 30 + pt * pt * 38;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], 3 + (i % 2));
        }
      },
    },
    bubbles: {
      dur: () => 28,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = Util.clamp(t * 1.5 - i * 0.06, 0, 1);
          const x = Util.lerp(g.ux, g.tx, pt) + Math.sin(i * 2) * 6;
          const y = Util.lerp(g.uy, g.ty, pt) - Math.sin(pt * Math.PI) * 10;
          const c = spec.col[i % spec.col.length];
          ctx.strokeStyle = c;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, 3, 3);
        }
      },
    },
    spore: {
      dur: () => 32,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 1.4 + i / spec.n) % 1;
          const x = g.tx - 18 + ((i * 31) % 36) + Math.sin(pt * 6 + i) * 3;
          const y = g.ty - 24 + pt * 30;
          ctx.globalAlpha = 1 - pt * 0.6;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], 1 + (i % 2));
          ctx.globalAlpha = 1;
        }
      },
    },
    ring: {
      dur: () => 26,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const start = i / (spec.n + 1);
          const pt = Util.clamp((t - start) * 2.2, 0, 1);
          if (pt <= 0 || pt >= 1) continue;
          const x = Util.lerp(g.ux, g.tx, pt);
          const y = Util.lerp(g.uy, g.ty, pt);
          ctx.strokeStyle = spec.col[i % spec.col.length];
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 4 + pt * 10, 0, Math.PI * 2);
          ctx.stroke();
        }
      },
    },
    bite: {
      dur: () => 20,
      draw(ctx, spec, g, t) {
        const close = t < 0.5 ? t * 2 : 1 - (t - 0.5);
        const gap = 16 * (1 - close);
        ctx.fillStyle = spec.col[spec.col.length - 1];
        // upper and lower jaws of triangles
        for (let i = 0; i < 4; i++) {
          const x = g.tx - 12 + i * 7;
          ctx.beginPath();
          ctx.moveTo(x, g.ty - gap - 8); ctx.lineTo(x + 6, g.ty - gap - 8); ctx.lineTo(x + 3, g.ty - gap);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, g.ty + gap + 8); ctx.lineTo(x + 6, g.ty + gap + 8); ctx.lineTo(x + 3, g.ty + gap);
          ctx.fill();
        }
      },
    },
    screen: {
      dur: () => 26,
      draw(ctx, spec, g, t, f) {
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(f / 2);
        ctx.fillStyle = spec.col[0];
        ctx.fillRect(g.ux - 26, g.uy - 26, 8, 52);
        ctx.globalAlpha = 1;
      },
    },
    heal: {
      dur: () => 34,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 1.4 + i / spec.n) % 1;
          const x = g.ux - 20 + ((i * 27) % 40);
          const y = g.uy + 18 - pt * 40;
          const c = spec.col[i % spec.col.length];
          ctx.globalAlpha = Math.sin(pt * Math.PI);
          // little plus
          BattleAnim.px(ctx, x, y, c, 1); BattleAnim.px(ctx, x - 1, y + 1, c, 1);
          BattleAnim.px(ctx, x + 1, y + 1, c, 1); BattleAnim.px(ctx, x, y + 2, c, 1);
          BattleAnim.px(ctx, x, y + 1, c, 1);
          ctx.globalAlpha = 1;
        }
      },
    },
    weather: {
      dur: () => 34,
      draw(ctx, spec, g, t) {
        ctx.globalAlpha = 0.25 * Math.sin(t * Math.PI);
        ctx.fillStyle = spec.col[0];
        ctx.fillRect(0, 0, Screen.W, Screen.H);
        ctx.globalAlpha = 1;
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 2 + i / spec.n) % 1;
          BattleAnim.px(ctx, (i * 53) % Screen.W, pt * 100, spec.col[i % spec.col.length]);
        }
      },
    },

    // ---- second wave: type-flavored attack fx for more battle variety ----
    flames: {
      dur: () => 26,
      draw(ctx, spec, g, t, f) {
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 1.5 + i / spec.n) % 1;
          const x = g.tx - 16 + ((i * 37) % 32) + Math.sin(pt * 10 + i) * 3;
          const y = g.ty + 12 - pt * 30;
          ctx.globalAlpha = 1 - pt * 0.7;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], pt < 0.5 ? 3 : 2);
          ctx.globalAlpha = 1;
        }
        if (t < 0.3) { ctx.fillStyle = spec.col[0]; ctx.beginPath(); ctx.arc(g.tx, g.ty + 6, 10 * (t * 3), 0, Math.PI * 2); ctx.fill(); }
      },
    },
    iceshards: {
      dur: () => 24,
      draw(ctx, spec, g, t) {
        const n = spec.n;
        for (let i = 0; i < n; i++) {
          const ang = (i / n) * Math.PI * 2;
          if (t < 0.6) {
            const r = (1 - t / 0.6) * 26;
            const x = g.tx + Math.cos(ang) * r, y = g.ty + Math.sin(ang) * r;
            ctx.fillStyle = spec.col[i % spec.col.length];
            ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillRect(-1, -3, 2, 6); ctx.restore();
          } else {
            const r = (t - 0.6) / 0.4 * 22;
            BattleAnim.px(ctx, g.tx + Math.cos(ang) * r, g.ty + Math.sin(ang) * r, spec.col[i % spec.col.length], 2);
          }
        }
      },
    },
    shock: {
      dur: () => 22,
      draw(ctx, spec, g, t, f) {
        for (let i = 0; i < spec.n; i++) {
          const ang = i * 2.4 + t * 4;
          const r = 6 + (f % 3) * 3 + t * 10;
          ctx.strokeStyle = spec.col[i % spec.col.length]; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(g.tx, g.ty); ctx.lineTo(g.tx + Math.cos(ang) * r, g.ty + Math.sin(ang) * r * 0.8); ctx.stroke();
        }
        if ((f % 4) < 2) { ctx.fillStyle = spec.col[0]; ctx.fillRect(g.tx - 3, g.ty - 3, 6, 6); }
      },
    },
    psywave: {
      dur: () => 28,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 1.5 + i / spec.n) % 1;
          ctx.globalAlpha = 1 - pt;
          ctx.strokeStyle = spec.col[i % spec.col.length]; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(g.tx, g.ty, 4 + pt * 20, (4 + pt * 20) * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = 1;
        }
      },
    },
    fairydust: {
      dur: () => 28,
      draw(ctx, spec, g, t, f) {
        for (let i = 0; i < spec.n; i++) {
          const ang = i * 2.4 - t * 4;
          const r = 6 + (i % 4) * 5 + Math.sin(t * 6 + i) * 3;
          const x = g.tx + Math.cos(ang) * r, y = g.ty + Math.sin(ang) * r * 0.8;
          if ((f + i) % 6 < 4) {
            const c = spec.col[i % spec.col.length];
            BattleAnim.px(ctx, x, y, c, 1); BattleAnim.px(ctx, x, y - 2, c, 1);
            BattleAnim.px(ctx, x - 2, y, c, 1); BattleAnim.px(ctx, x + 2, y, c, 1); BattleAnim.px(ctx, x, y + 2, c, 1);
          }
        }
      },
    },
    venom: {
      dur: () => 26,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const pt = Util.clamp(t * 1.4 - i * 0.05, 0, 1);
          const x = Util.lerp(g.ux, g.tx, pt) + Math.sin(i) * 6;
          const y = Util.lerp(g.uy, g.ty, pt) + pt * pt * 8;
          const c = spec.col[i % spec.col.length];
          ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
          if (pt > 0.9) BattleAnim.px(ctx, x, y + 3, c, 1);
        }
      },
    },
    vortex: {
      dur: () => 28,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const base = (i / spec.n) * Math.PI * 2;
          const pt = (t + i / spec.n) % 1;
          const ang = base + pt * Math.PI * 3;
          const r = 24 * (1 - pt);
          BattleAnim.px(ctx, g.tx + Math.cos(ang) * r, g.ty + Math.sin(ang) * r * 0.8, spec.col[i % spec.col.length], pt < 0.5 ? 3 : 2);
        }
      },
    },
    phantom: {
      dur: () => 26,
      draw(ctx, spec, g, t, f) {
        for (let i = 0; i < spec.n; i++) {
          const pt = (t * 1.3 + i / spec.n) % 1;
          const x = Util.lerp(g.ux, g.tx, pt) + Math.sin(pt * 8 + i) * 8;
          const y = Util.lerp(g.uy, g.ty, pt) + Math.cos(pt * 6 + i) * 8;
          ctx.globalAlpha = (f + i) % 8 < 5 ? (1 - pt * 0.5) : 0;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], 3);
          ctx.globalAlpha = 1;
        }
      },
    },
    crush: {
      dur: () => 24,
      draw(ctx, spec, g, t, f) {
        if (t < 0.5) {
          const y = g.ty - 40 + (t / 0.5) * 40;
          ctx.fillStyle = spec.col[0]; ctx.fillRect(g.tx - 6, y - 6, 12, 12);
        } else {
          Screen.shakeOffset = (f % 4 < 2) ? 3 : -3;
          const bt = (t - 0.5) / 0.5;
          for (let i = 0; i < spec.n; i++) {
            const ang = (i / spec.n) * Math.PI; const r = bt * 24;
            BattleAnim.px(ctx, g.tx + Math.cos(ang) * r, g.ty + 6 - Math.sin(ang) * r * 0.5, spec.col[i % spec.col.length], 3);
          }
        }
        if (t > 0.95) Screen.shakeOffset = 0;
      },
    },
    explosion: {
      dur: () => 28,
      draw(ctx, spec, g, t, f) {
        Screen.shakeOffset = t < 0.7 ? ((f % 3) - 1) * 3 : 0;
        const r = t * 30;
        ctx.globalAlpha = Math.max(0, 1 - t);
        ctx.fillStyle = spec.col[0]; ctx.beginPath(); ctx.arc(g.tx, g.ty, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = spec.col[spec.col.length - 1] || '#fff'; ctx.beginPath(); ctx.arc(g.tx, g.ty, r * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        for (let i = 0; i < spec.n; i++) {
          const ang = (i / spec.n) * Math.PI * 2 + i; const rr = t * (18 + (i % 5) * 6);
          BattleAnim.px(ctx, g.tx + Math.cos(ang) * rr, g.ty + Math.sin(ang) * rr, spec.col[i % spec.col.length], t < 0.5 ? 3 : 2);
        }
        if (t > 0.95) Screen.shakeOffset = 0;
      },
    },
  },
};
