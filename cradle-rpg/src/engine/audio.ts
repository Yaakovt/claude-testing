/**
 * Tiny WebAudio synth engine (M5) — game-agnostic primitives only:
 * tones with envelopes, filtered noise bursts, named looping voices, and
 * named mix channels with timed fades (game code builds SFX palettes and
 * generative music on top — see src/game/sounds.ts).
 *
 * Browser autoplay policy: the AudioContext is NEVER created at module load.
 * Call unlock() from a user-gesture handler (keydown/mousedown); until then
 * every play call is a silent no-op. Headless safety: when the environment
 * has no AudioContext constructor at all (the test shims), the engine
 * permanently no-ops — every method stays callable and throw-free.
 */

export interface ToneSpec {
  /** Start frequency, Hz. */
  freq: number;
  /** Optional glide target frequency reached by the end of the tone. */
  endFreq?: number;
  type?: OscillatorType;
  /** Sustained length, seconds (envelope adds attack/release around it). */
  duration: number;
  attack?: number;
  release?: number;
  /** Peak gain 0..1 (pre master). */
  gain?: number;
  /** Mix channel name (created on demand); omit for the master bus. */
  channel?: string;
  /** Schedule offset in seconds from now. */
  when?: number;
}

export interface NoiseSpec {
  duration: number;
  gain?: number;
  /** Lowpass cutoff, Hz (omit = unfiltered). */
  filterFreq?: number;
  channel?: string;
  when?: number;
}

export interface LoopSpec {
  freq: number;
  type?: OscillatorType;
  gain?: number;
  /** Fade-in seconds. */
  attack?: number;
  channel?: string;
}

interface AudioGlobals {
  AudioContext?: new () => AudioContext;
  webkitAudioContext?: new () => AudioContext;
}

export class AudioEngine {
  /** Master volume 0..1 (persisted by the game). */
  volume = 0.8;
  muted = false;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private channels = new Map<string, GainNode>();
  private loops = new Map<string, { osc: OscillatorNode; gain: GainNode }>();
  private noiseBuffer: AudioBuffer | null = null;

  private get ctor(): (new () => AudioContext) | null {
    const g = globalThis as AudioGlobals;
    return g.AudioContext ?? g.webkitAudioContext ?? null;
  }

  /** True when the environment can ever produce audio (headless = false). */
  get available(): boolean {
    return this.ctor !== null;
  }

  /** True once unlock() has created a context (sound can actually play). */
  get ready(): boolean {
    return this.ctx !== null;
  }

  /** Seconds on the audio clock (0 until ready). */
  get now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /**
   * Create/resume the AudioContext. MUST be called from a user-gesture
   * handler the first time (autoplay policy). Idempotent; headless no-op.
   */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const C = this.ctor;
    if (!C) return;
    try {
      this.ctx = new C();
    } catch {
      this.ctx = null;
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);
  }

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyMaster();
  }

  /** Returns the new muted state. */
  toggleMute(): boolean {
    this.muted = !this.muted;
    this.applyMaster();
    return this.muted;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    this.applyMaster();
  }

  private applyMaster(): void {
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.04);
  }

  /** Get-or-create a named mix channel routed into the master bus. */
  private channelNode(name: string | undefined): GainNode | null {
    if (!this.ctx || !this.master) return null;
    if (!name) return this.master;
    let node = this.channels.get(name);
    if (!node) {
      node = this.ctx.createGain();
      node.gain.value = 1;
      node.connect(this.master);
      this.channels.set(name, node);
    }
    return node;
  }

  /** Fade a named channel's gain over `fade` seconds. */
  setChannelGain(name: string, value: number, fade = 0): void {
    const node = this.channelNode(name);
    if (!node || !this.ctx) return;
    const t = this.ctx.currentTime;
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(node.gain.value, t);
    node.gain.linearRampToValueAtTime(Math.max(0, value), t + Math.max(0.01, fade));
  }

  /** One enveloped oscillator tone. Silent no-op until unlock(). */
  playTone(spec: ToneSpec): void {
    const ctx = this.ctx;
    const out = this.channelNode(spec.channel);
    if (!ctx || !out) return;
    const t0 = ctx.currentTime + (spec.when ?? 0);
    const attack = spec.attack ?? 0.005;
    const release = spec.release ?? 0.06;
    const peak = spec.gain ?? 0.12;
    const osc = ctx.createOscillator();
    osc.type = spec.type ?? "sine";
    osc.frequency.setValueAtTime(Math.max(1, spec.freq), t0);
    if (spec.endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, spec.endFreq), t0 + spec.duration);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + attack);
    gain.gain.setValueAtTime(peak, t0 + attack + spec.duration);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + attack + spec.duration + release);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t0);
    osc.stop(t0 + attack + spec.duration + release + 0.02);
  }

  /** A filtered white-noise burst (swings, impacts). */
  playNoise(spec: NoiseSpec): void {
    const ctx = this.ctx;
    const out = this.channelNode(spec.channel);
    if (!ctx || !out) return;
    if (!this.noiseBuffer) {
      const len = Math.floor(ctx.sampleRate * 0.5);
      this.noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    const t0 = ctx.currentTime + (spec.when ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const gain = ctx.createGain();
    const peak = spec.gain ?? 0.08;
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + spec.duration);
    let head: AudioNode = src;
    if (spec.filterFreq !== undefined) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = spec.filterFreq;
      src.connect(filter);
      head = filter;
    }
    head.connect(gain);
    gain.connect(out);
    src.start(t0);
    src.stop(t0 + spec.duration + 0.02);
  }

  /** Start (or retune) a named sustained voice (cycling hum). */
  startLoop(id: string, spec: LoopSpec): void {
    const ctx = this.ctx;
    const out = this.channelNode(spec.channel);
    if (!ctx || !out) return;
    if (this.loops.has(id)) return;
    const osc = ctx.createOscillator();
    osc.type = spec.type ?? "triangle";
    osc.frequency.value = spec.freq;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(spec.gain ?? 0.05, t + (spec.attack ?? 0.15));
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    this.loops.set(id, { osc, gain });
  }

  /** Fade out and stop a named loop. No-op if it isn't running. */
  stopLoop(id: string, release = 0.12): void {
    const loop = this.loops.get(id);
    if (!loop || !this.ctx) {
      this.loops.delete(id);
      return;
    }
    const t = this.ctx.currentTime;
    loop.gain.gain.cancelScheduledValues(t);
    loop.gain.gain.setValueAtTime(loop.gain.gain.value, t);
    loop.gain.gain.linearRampToValueAtTime(0.0001, t + release);
    loop.osc.stop(t + release + 0.02);
    this.loops.delete(id);
  }

  /** Stop every loop (world teardown). */
  stopAllLoops(): void {
    for (const id of [...this.loops.keys()]) this.stopLoop(id);
  }
}
