'use strict';
/**
 * WebAudio chiptune synth: square / triangle / saw / noise voices,
 * used for SFX, per-species cries, and the music sequencer.
 */
const AudioSys = {
  ctx: null,
  master: null,
  sfxGain: null,
  musicGain: null,
  enabled: true,

  init() {
    const unlock = () => {
      if (AudioSys.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      AudioSys.ctx = new AC();
      AudioSys.master = AudioSys.ctx.createGain();
      AudioSys.master.gain.value = 0.5;
      AudioSys.master.connect(AudioSys.ctx.destination);
      AudioSys.sfxGain = AudioSys.ctx.createGain();
      AudioSys.sfxGain.gain.value = 0.9;
      AudioSys.sfxGain.connect(AudioSys.master);
      AudioSys.musicGain = AudioSys.ctx.createGain();
      AudioSys.musicGain.gain.value = 0.55;
      AudioSys.musicGain.connect(AudioSys.master);
      Music.onAudioReady();
      const hint = document.getElementById('boot-hint');
      if (hint) hint.style.display = 'none';
    };
    window.addEventListener('keydown', unlock);
    window.addEventListener('mousedown', unlock);

    // Silence audio when the game is hidden, backgrounded, or its panel/tab is
    // closed — otherwise the music sequencer keeps scheduling notes on a live
    // AudioContext and plays on after you've left. Suspending stops all output
    // instantly and freezes the clock; on return we resume and re-anchor the
    // music so it doesn't fire a catch-up burst of notes.
    const hide = () => { if (AudioSys.ctx && AudioSys.ctx.state === 'running') AudioSys.ctx.suspend(); };
    const show = () => {
      if (AudioSys.ctx && AudioSys.enabled && AudioSys.ctx.state === 'suspended') {
        AudioSys.ctx.resume().then(() => Music.resync()).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', () => (document.hidden ? hide() : show()));
    window.addEventListener('pagehide', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
  },

  now() { return AudioSys.ctx ? AudioSys.ctx.currentTime : 0; },

  _noiseBuffer: null,
  noiseBuffer() {
    if (!AudioSys._noiseBuffer) {
      const len = AudioSys.ctx.sampleRate * 0.5;
      const buf = AudioSys.ctx.createBuffer(1, len, AudioSys.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      AudioSys._noiseBuffer = buf;
    }
    return AudioSys._noiseBuffer;
  },

  /**
   * Play one synth voice.
   * o = {wave, freq, freqEnd, dur, vol, attack, decay, delay, dest, vibrato, vibratoRate, duty}
   * wave: 'square'|'triangle'|'sawtooth'|'sine'|'noise'
   */
  voice(o) {
    if (!AudioSys.ctx || !AudioSys.enabled) return;
    const t0 = AudioSys.now() + (o.delay || 0);
    const dur = o.dur || 0.2;
    const vol = o.vol !== undefined ? o.vol : 0.3;
    const dest = o.dest || AudioSys.sfxGain;
    const g = AudioSys.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + (o.attack || 0.005));
    g.gain.setValueAtTime(vol, t0 + Math.max(0.001, dur - (o.decay || 0.05)));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g.connect(dest);

    let src;
    if (o.wave === 'noise') {
      src = AudioSys.ctx.createBufferSource();
      src.buffer = AudioSys.noiseBuffer();
      src.loop = true;
      if (o.freq) {
        const f = AudioSys.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(o.freq, t0);
        if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.freqEnd), t0 + dur);
        f.Q.value = o.q || 1.2;
        src.connect(f); f.connect(g);
      } else src.connect(g);
    } else {
      src = AudioSys.ctx.createOscillator();
      src.type = o.wave || 'square';
      src.frequency.setValueAtTime(Math.max(20, o.freq || 440), t0);
      if (o.freqEnd) src.frequency.exponentialRampToValueAtTime(Math.max(20, o.freqEnd), t0 + dur);
      if (o.vibrato) {
        const lfo = AudioSys.ctx.createOscillator();
        const lg = AudioSys.ctx.createGain();
        lfo.frequency.value = o.vibratoRate || 9;
        lg.gain.value = o.vibrato;
        lfo.connect(lg); lg.connect(src.frequency);
        lfo.start(t0); lfo.stop(t0 + dur);
      }
      src.connect(g);
    }
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  },

  // ---- UI / battle sound effects --------------------------------------
  sfx(name) {
    if (!AudioSys.ctx || !AudioSys.enabled) return;
    const S = AudioSys.voice.bind(AudioSys);
    switch (name) {
      case 'select': S({ wave: 'square', freq: 880, dur: 0.06, vol: 0.15 }); break;
      case 'confirm': S({ wave: 'square', freq: 660, dur: 0.05, vol: 0.18 });
        S({ wave: 'square', freq: 990, dur: 0.07, vol: 0.18, delay: 0.05 }); break;
      case 'cancel': S({ wave: 'square', freq: 440, freqEnd: 300, dur: 0.08, vol: 0.15 }); break;
      case 'bump': S({ wave: 'square', freq: 140, dur: 0.06, vol: 0.2 }); break;
      case 'door': S({ wave: 'triangle', freq: 500, freqEnd: 700, dur: 0.12, vol: 0.25 }); break;
      case 'jingle_item':
        [523, 659, 784, 1047].forEach((f, i) => S({ wave: 'square', freq: f, dur: 0.09, vol: 0.2, delay: i * 0.09 })); break;
      case 'jingle_heal':
        [784, 988, 784, 1175].forEach((f, i) => S({ wave: 'square', freq: f, dur: 0.11, vol: 0.2, delay: i * 0.11 })); break;
      case 'jingle_badge':
        [659, 784, 988, 1319, 1568].forEach((f, i) => S({ wave: 'square', freq: f, dur: 0.12, vol: 0.22, delay: i * 0.1 })); break;
      case 'hit': S({ wave: 'noise', freq: 900, freqEnd: 200, dur: 0.12, vol: 0.35 }); break;
      case 'hit_super': S({ wave: 'noise', freq: 1600, freqEnd: 200, dur: 0.2, vol: 0.42 });
        S({ wave: 'square', freq: 220, freqEnd: 80, dur: 0.18, vol: 0.25 }); break;
      case 'hit_weak': S({ wave: 'noise', freq: 500, freqEnd: 250, dur: 0.08, vol: 0.22 }); break;
      case 'faint': S({ wave: 'square', freq: 400, freqEnd: 60, dur: 0.45, vol: 0.3 }); break;
      case 'ball_throw': S({ wave: 'sine', freq: 300, freqEnd: 900, dur: 0.25, vol: 0.25 }); break;
      case 'ball_bounce': S({ wave: 'square', freq: 700, freqEnd: 500, dur: 0.06, vol: 0.2 }); break;
      case 'ball_shake': S({ wave: 'noise', freq: 400, dur: 0.09, vol: 0.25 }); break;
      case 'ball_click': S({ wave: 'square', freq: 1200, dur: 0.05, vol: 0.2 });
        S({ wave: 'square', freq: 800, dur: 0.09, vol: 0.15, delay: 0.05 }); break;
      case 'run': S({ wave: 'noise', freq: 2000, freqEnd: 600, dur: 0.25, vol: 0.3 }); break;
      case 'levelup':
        [523, 659, 784, 1047, 1319].forEach((f, i) => S({ wave: 'square', freq: f, dur: 0.08, vol: 0.2, delay: i * 0.07 })); break;
      case 'stat_up': S({ wave: 'square', freq: 300, freqEnd: 700, dur: 0.18, vol: 0.2, vibrato: 20 }); break;
      case 'stat_down': S({ wave: 'square', freq: 700, freqEnd: 300, dur: 0.18, vol: 0.2, vibrato: 20 }); break;
      case 'save': [660, 880].forEach((f, i) => S({ wave: 'sine', freq: f, dur: 0.15, vol: 0.22, delay: i * 0.12 })); break;
      case 'pc': S({ wave: 'square', freq: 1000, dur: 0.05, vol: 0.15 });
        S({ wave: 'square', freq: 1400, dur: 0.05, vol: 0.15, delay: 0.06 }); break;
    }
  },

  /**
   * Play a species cry. p = {base, sweep, wave, dur, vib, vibRate, grit, chirps}
   * Every species defines its own params, so every cry is unique.
   */
  cry(p, vol = 0.35) {
    if (!AudioSys.ctx || !AudioSys.enabled || !p) return;
    const dur = p.dur || 0.5;
    AudioSys.voice({
      wave: p.wave || 'square', freq: p.base, freqEnd: p.base * (p.sweep || 0.7),
      dur, vol, vibrato: p.vib || 0, vibratoRate: p.vibRate || 10,
    });
    if (p.grit) {
      AudioSys.voice({ wave: 'noise', freq: p.base * 1.5, freqEnd: p.base * 0.5, dur: dur * 0.8, vol: vol * p.grit });
    }
    if (p.chirps) {
      for (let i = 1; i <= p.chirps; i++) {
        AudioSys.voice({
          wave: p.wave || 'square', freq: p.base * (1 + 0.15 * i), freqEnd: p.base * (p.sweep || 0.7),
          dur: dur * 0.4, vol: vol * 0.7, delay: dur * 0.5 * i,
        });
      }
    }
    if (p.sub) {
      AudioSys.voice({ wave: 'triangle', freq: p.base / 2, freqEnd: (p.base / 2) * (p.sweep || 0.7), dur, vol: vol * 0.8 });
    }
  },
};
