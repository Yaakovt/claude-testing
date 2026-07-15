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

  kinds: {
    lunge: {
      dur: () => 22,
      draw(ctx, spec, g, t) {
        // speed lines behind the user
        const dx = g.tx - g.ux, dy = g.ty - g.uy;
        const len = Math.hypot(dx, dy) || 1;
        for (let i = 0; i < spec.n; i++) {
          const off = (i / spec.n - 0.5) * 26;
          const bx = g.ux + dx * t * 0.8 - (dy / len) * off * 0.4;
          const by = g.uy + dy * t * 0.8 + (dx / len) * off * 0.4;
          BattleAnim.px(ctx, bx - (dx / len) * (6 + i * 3), by - (dy / len) * (6 + i * 3), spec.col[i % spec.col.length]);
        }
      },
    },
    slash: {
      dur: () => 20,
      draw(ctx, spec, g, t, f) {
        const n = spec.n;
        for (let i = 0; i < n; i++) {
          const start = (i / n) * 0.5;
          if (t < start) continue;
          const lt = Math.min(1, (t - start) / 0.4);
          const cx = g.tx - 12 + i * (24 / Math.max(1, n - 1));
          ctx.strokeStyle = spec.col[i % spec.col.length];
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1 - lt * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx - 10 + lt * 6, g.ty - 16);
          ctx.lineTo(cx + 4 + lt * 6, g.ty + 14);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      },
    },
    impact: {
      dur: () => 20,
      draw(ctx, spec, g, t) {
        const r = t * 20;
        for (let i = 0; i < spec.n; i++) {
          const ang = (i / spec.n) * Math.PI * 2;
          BattleAnim.px(ctx, g.tx + Math.cos(ang) * r, g.ty + Math.sin(ang) * r * 0.8,
            spec.col[i % spec.col.length], t < 0.5 ? 3 : 2);
        }
        if (t < 0.3) {
          ctx.fillStyle = spec.col[0];
          ctx.fillRect(g.tx - 4, g.ty - 4, 8, 8);
        }
      },
    },
    beam: {
      dur: () => 30,
      draw(ctx, spec, g, t) {
        const grow = Math.min(1, t * 3);
        const fade = t > 0.75 ? 1 - (t - 0.75) * 4 : 1;
        ctx.globalAlpha = fade;
        const dx = g.tx - g.ux, dy = g.ty - g.uy;
        for (let i = spec.col.length - 1; i >= 0; i--) {
          const w = (spec.col.length - i) * 3;
          ctx.strokeStyle = spec.col[i];
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(g.ux, g.uy);
          ctx.lineTo(g.ux + dx * grow, g.uy + dy * grow);
          ctx.stroke();
        }
        // sparks at contact
        if (grow >= 1) {
          for (let i = 0; i < 5; i++) {
            const ang = Math.random() * Math.PI * 2;
            BattleAnim.px(ctx, g.tx + Math.cos(ang) * 8 * Math.random(), g.ty + Math.sin(ang) * 8 * Math.random(), spec.col[0]);
          }
        }
        ctx.globalAlpha = 1;
      },
    },
    proj: {
      dur: (spec) => 16 + spec.n * 4,
      draw(ctx, spec, g, t, f) {
        for (let i = 0; i < spec.n; i++) {
          const start = i / (spec.n + 2);
          const pt = (t - start) * (spec.n + 2) / 2.2;
          if (pt < 0 || pt > 1) continue;
          const x = Util.lerp(g.ux, g.tx, pt);
          const arc = -Math.sin(pt * Math.PI) * (14 + (i % 3) * 6);
          const y = Util.lerp(g.uy, g.ty, pt) + arc;
          BattleAnim.px(ctx, x, y, spec.col[i % spec.col.length], 3);
        }
      },
    },
    burst: {
      dur: () => 26,
      draw(ctx, spec, g, t) {
        for (let i = 0; i < spec.n; i++) {
          const ang = (i / spec.n) * Math.PI * 2 + i;
          const r = t * (16 + (i % 4) * 6);
          const size = t < 0.4 ? 4 : t < 0.7 ? 3 : 2;
          BattleAnim.px(ctx, g.tx + Math.cos(ang) * r, g.ty + Math.sin(ang) * r, spec.col[i % spec.col.length], size);
        }
        if (t < 0.25) {
          ctx.globalAlpha = 1 - t * 4;
          ctx.fillStyle = spec.col[spec.col.length - 1];
          ctx.beginPath();
          ctx.arc(g.tx, g.ty, 14 * (t * 4), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
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
          ctx.strokeStyle = flash ? spec.col[0] : spec.col[1 % spec.col.length];
          ctx.lineWidth = flash ? 3 : 2;
          ctx.beginPath();
          for (const [x1, y1, x2, y2] of st.segs) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
          ctx.stroke();
        } else {
          const bt = (t - 0.55) / 0.45;
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
