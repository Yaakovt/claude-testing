'use strict';
/**
 * Difficulty balance knobs. EXP_RATE multiplies all EXP gained; ENEMY_LEVEL_DROP
 * is subtracted from every wild/trainer/gym foe's level (floored at 2). Tuned
 * down from the original brutal curve so a steadily-leveled team can keep pace.
 */
const Balance = { EXP_RATE: 1.3, ENEMY_LEVEL_DROP: 2 };

/** Core utilities shared across the engine. */
const Util = {
  clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(n) { return Math.floor(Math.random() * n); },          // 0..n-1
  randRange(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
  chance(pct) { return Math.random() * 100 < pct; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  deepClone(o) { return JSON.parse(JSON.stringify(o)); },
  padLeft(s, n, c) { s = String(s); while (s.length < n) s = (c || ' ') + s; return s; },
  capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); },
};

/** Simple event timer helpers driven by the frame loop. */
class Cooldown {
  constructor() { this.t = 0; }
  set(frames) { this.t = frames; }
  tick() { if (this.t > 0) this.t--; return this.t === 0; }
  get ready() { return this.t <= 0; }
}
