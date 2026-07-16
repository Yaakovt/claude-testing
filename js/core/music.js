'use strict';
/**
 * Chiptune music sequencer.
 *
 * A track = { bpm, channels: [{wave, vol, notes}] }.
 * `notes` is a string of tokens: "C4:2" (pitch:16th-note-duration),
 * "-:4" rest, sharps like "F#3". Drum channels use wave:'drums' with
 * tokens k (kick), s (snare), h (hat), o (open hat).
 * Channels loop independently by their own length, so a 1-bar drum
 * loop can back an 8-bar melody.
 */
const Music = {
  tracks: {},          // filled by registerTracks (js/data/tracks section)
  current: null,
  channels: [],
  timer: null,
  playingName: null,
  _pending: null,

  NOTE_OFFSETS: { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 },

  freq(token) {
    const m = /^([A-G]#?)(\d)$/.exec(token);
    if (!m) return 0;
    const semis = Music.NOTE_OFFSETS[m[1]] + (parseInt(m[2]) + 1) * 12;
    return 440 * Math.pow(2, (semis - 69) / 12);
  },

  parse(notes) {
    return notes.trim().split(/\s+/).map((tok) => {
      const [p, d] = tok.split(':');
      return { p, d: parseFloat(d || '1') };
    });
  },

  onAudioReady() {
    if (Music._pending) { const n = Music._pending; Music._pending = null; Music.play(n); }
  },

  play(name) {
    if (Music.playingName === name) return;
    if (!AudioSys.ctx) { Music._pending = name; Music.playingName = name; return; }
    Music.stop();
    const track = Music.tracks[name];
    if (!track) return;
    Music.playingName = name;
    Music.current = track;
    const secPer16 = 60 / track.bpm / 4;
    Music.channels = track.channels.map((ch) => ({
      def: ch,
      seq: Music.parse(ch.notes),
      idx: 0,
      nextTime: AudioSys.now() + 0.1,
      secPer16,
    }));
    Music.timer = setInterval(Music.tick, 55);
  },

  stop() {
    if (Music.timer) clearInterval(Music.timer);
    Music.timer = null;
    Music.current = null;
    Music.playingName = null;
    Music.channels = [];
  },

  // Re-anchor every channel to "now" after the AudioContext was suspended, so
  // resuming doesn't schedule a burst of notes for all the time that passed.
  resync() {
    const t = AudioSys.now() + 0.1;
    for (const ch of Music.channels) ch.nextTime = t;
  },

  tick() {
    if (!AudioSys.ctx || !Music.current) return;
    const ahead = AudioSys.now() + 0.3;
    for (const ch of Music.channels) {
      let guard = 0;
      while (ch.nextTime < ahead && guard++ < 64) {
        const note = ch.seq[ch.idx];
        const dur = note.d * ch.secPer16;
        if (note.p !== '-') Music.playNote(ch.def, note.p, ch.nextTime, dur);
        ch.nextTime += dur;
        ch.idx = (ch.idx + 1) % ch.seq.length;
      }
    }
  },

  playNote(def, pitch, t, dur) {
    const g = AudioSys.ctx.createGain();
    const vol = def.vol !== undefined ? def.vol : 0.2;
    g.connect(AudioSys.musicGain);
    if (def.wave === 'drums') {
      Music.drum(pitch, t, g, vol);
      return;
    }
    const f = Music.freq(pitch);
    if (!f) return;
    const osc = AudioSys.ctx.createOscillator();
    osc.type = def.wave || 'square';
    osc.frequency.setValueAtTime(f, t);
    const sus = Math.max(0.02, dur * (def.staccato ? 0.5 : 0.86));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol * 0.8, t + sus * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sus);
    osc.connect(g);
    osc.start(t);
    osc.stop(t + sus + 0.02);
  },

  drum(kind, t, g, vol) {
    const ctx = AudioSys.ctx;
    if (kind === 'k') {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
      g.gain.setValueAtTime(vol * 1.6, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g); osc.start(t); osc.stop(t + 0.13);
    } else if (kind === 's' || kind === 'h' || kind === 'o') {
      const src = ctx.createBufferSource();
      src.buffer = AudioSys.noiseBuffer();
      const f = ctx.createBiquadFilter();
      f.type = kind === 's' ? 'bandpass' : 'highpass';
      f.frequency.value = kind === 's' ? 1800 : 6000;
      const d = kind === 's' ? 0.09 : kind === 'h' ? 0.03 : 0.09;
      g.gain.setValueAtTime(vol * (kind === 's' ? 1.0 : 0.5), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f); f.connect(g); src.start(t); src.stop(t + d + 0.01);
    }
  },

  registerTracks(obj) { Object.assign(Music.tracks, obj); },
};
