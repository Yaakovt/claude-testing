/* audio.js — all sound effects synthesized with WebAudio (no asset files). */
'use strict';
(function (P) {

  const A = P.audio = { ctx: null, master: null, hum: null };

  A.init = function () {
    if (A.ctx) { A.ctx.resume(); return; }
    A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    A.master = A.ctx.createGain();
    A.master.gain.value = 0.5;
    A.master.connect(A.ctx.destination);
    startHum();
  };

  function now() { return A.ctx.currentTime; }

  function env(gainNode, t0, peak, attack, decay) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(peak, t0 + attack);
    g.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  function tone(type, f0, f1, dur, peak, when) {
    const t0 = now() + (when || 0);
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    env(g, t0, peak, 0.008, dur);
    o.connect(g); g.connect(A.master);
    o.start(t0); o.stop(t0 + dur + 0.1);
  }

  function noise(dur, peak, filterFreq, when, q) {
    const t0 = now() + (when || 0);
    const n = Math.floor(A.ctx.sampleRate * dur);
    const buf = A.ctx.createBuffer(1, n, A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = A.ctx.createBufferSource(); src.buffer = buf;
    const f = A.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = filterFreq; f.Q.value = q || 1;
    const g = A.ctx.createGain();
    env(g, t0, peak, 0.01, dur);
    src.connect(f); f.connect(g); g.connect(A.master);
    src.start(t0);
  }

  // ambient facility hum
  function startHum() {
    const o = A.ctx.createOscillator(), o2 = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    o.type = 'sine'; o.frequency.value = 55;
    o2.type = 'sine'; o2.frequency.value = 82.5;
    g.gain.value = 0.018;
    o.connect(g); o2.connect(g); g.connect(A.master);
    o.start(); o2.start();
    A.hum = g;
  }

  // ------------------------------------------------------------- public SFX
  A.shootBlue = () => { tone('sawtooth', 300, 1400, 0.16, 0.20); tone('sine', 600, 2100, 0.14, 0.12); };
  A.shootOrange = () => { tone('sawtooth', 260, 950, 0.18, 0.20); tone('sine', 500, 1500, 0.16, 0.12); };
  A.portalOpen = () => { tone('sine', 180, 700, 0.35, 0.16); noise(0.3, 0.10, 1800, 0, 2); };
  A.portalFizzle = () => { noise(0.35, 0.14, 900, 0, 0.8); tone('square', 400, 60, 0.3, 0.06); };
  A.denied = () => { tone('square', 220, 190, 0.10, 0.10); tone('square', 180, 150, 0.12, 0.10, 0.10); };
  A.teleport = () => { noise(0.28, 0.22, 1200, 0, 0.7); tone('sine', 900, 250, 0.25, 0.10); };
  A.jump = () => tone('sine', 320, 420, 0.08, 0.05);
  A.land = () => noise(0.09, 0.10, 500, 0, 1);
  A.pickup = () => tone('sine', 500, 780, 0.10, 0.10);
  A.drop = () => tone('sine', 600, 320, 0.10, 0.10);
  A.buttonDown = () => { tone('square', 700, 500, 0.07, 0.10); tone('sine', 1200, 900, 0.10, 0.06, 0.05); };
  A.buttonUp = () => tone('square', 500, 650, 0.07, 0.08);
  A.doorOpen = () => { noise(0.5, 0.09, 700, 0, 1); tone('sine', 120, 240, 0.5, 0.05); };
  A.doorClose = () => { noise(0.4, 0.08, 500, 0, 1); tone('sine', 240, 110, 0.4, 0.05); };
  A.elevator = () => { tone('sine', 520, 520, 0.12, 0.12); tone('sine', 780, 780, 0.25, 0.12, 0.14); };
  A.fizzleObject = () => { noise(0.5, 0.16, 2500, 0, 0.6); tone('sawtooth', 1500, 90, 0.5, 0.07); };
  A.turretSpot = () => { tone('sine', 1450, 1450, 0.07, 0.10); tone('sine', 1450, 1450, 0.07, 0.10, 0.11); };
  A.turretFire = () => noise(0.05, 0.14, 3000, 0, 3);
  A.turretDie = () => { tone('sawtooth', 900, 60, 0.7, 0.12); noise(0.25, 0.1, 400, 0, 1); };
  A.hurt = () => tone('sawtooth', 180, 90, 0.2, 0.14);
  A.die = () => { tone('sawtooth', 300, 40, 0.9, 0.16); noise(0.6, 0.12, 300, 0, 1); };
  A.splash = () => noise(0.4, 0.18, 600, 0, 0.8);
  A.throwCube = () => noise(0.12, 0.08, 900, 0, 1.5);
  A.blip = () => tone('sine', 880, 880, 0.05, 0.07);

})(window.PORTAL);
