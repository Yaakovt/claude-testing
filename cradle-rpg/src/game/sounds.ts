/**
 * GAME AUDIO (M5) — the sound design, built on src/engine/audio.ts.
 *
 *  - `audio`: the one AudioEngine. main.ts calls audio.unlock() from real
 *    user-gesture handlers (autoplay policy); World persists volume/mute in
 *    the save (systems.audio) and binds M to mute.
 *  - `Sfx`: one short synth cue per game event. Every cue is a no-op until
 *    the context is unlocked, and forever in headless runs.
 *  - `music`: two generative pentatonic ambient beds ("valley" for the
 *    village/wilds, "peak" for the trail/school) plus a sparse tense
 *    variant for the hostile school. Beds are streams of soft scheduled
 *    sine tones on per-bed mix channels; map changes cross-fade channels.
 */

import { AudioEngine } from "../engine/audio.js";
import type { TechniqueType } from "../systems/techniques.js";

export const audio = new AudioEngine();

// ------------------------------------------------------------------- SFX

export const Sfx = {
  /** Title/menu cursor move: dry little square tick. */
  menuMove(): void {
    audio.playTone({ freq: 660, type: "square", duration: 0.03, gain: 0.04 });
  },

  /** Menu confirm: two quick rising sine notes. */
  menuConfirm(): void {
    audio.playTone({ freq: 523, duration: 0.06, gain: 0.07 });
    audio.playTone({ freq: 784, duration: 0.09, gain: 0.07, when: 0.07 });
  },

  /** Sword swing: a short whoosh of high-passed-feeling filtered noise. */
  swing(): void {
    audio.playNoise({ duration: 0.09, gain: 0.06, filterFreq: 2400 });
  },

  /** Hit landed on a foe: a dull square knock dropping an octave. */
  hitLanded(): void {
    audio.playTone({ freq: 220, endFreq: 110, type: "square", duration: 0.06, gain: 0.09 });
    audio.playNoise({ duration: 0.04, gain: 0.05, filterFreq: 900 });
  },

  /** Hit taken by the player: a harsher saw drop — it should sting. */
  hitTaken(): void {
    audio.playTone({ freq: 165, endFreq: 70, type: "sawtooth", duration: 0.16, gain: 0.12 });
  },

  /** Dodge: an airy upward sine flick. */
  dodge(): void {
    audio.playTone({ freq: 300, endFreq: 620, duration: 0.08, gain: 0.05 });
  },

  /** Technique cast — one flavor per canon technique TYPE (lore §3). */
  cast(type: TechniqueType): void {
    switch (type) {
      case "Enforcer": // madra through the body: a warm rising triangle
        audio.playTone({ freq: 330, endFreq: 495, type: "triangle", duration: 0.14, gain: 0.09 });
        break;
      case "Striker": // projected madra: a fast falling saw zap
        audio.playTone({ freq: 880, endFreq: 392, type: "sawtooth", duration: 0.09, gain: 0.08 });
        break;
      case "Ruler": // commanding ambient aura: a slow soft sine swell + fifth
        audio.playTone({ freq: 392, duration: 0.3, attack: 0.12, release: 0.25, gain: 0.07 });
        audio.playTone({ freq: 588, duration: 0.25, attack: 0.15, release: 0.25, gain: 0.05, when: 0.05 });
        break;
      case "Forger": // solidified madra: a low square thunk + grit
        audio.playTone({ freq: 196, endFreq: 147, type: "square", duration: 0.1, gain: 0.09 });
        audio.playNoise({ duration: 0.08, gain: 0.05, filterFreq: 500 });
        break;
    }
  },

  /** Cycling hum: a low rooted triangle drone while C is held. */
  cyclingStart(): void {
    audio.startLoop("cycling", { freq: 110, type: "triangle", gain: 0.035, attack: 0.3 });
  },
  cyclingStop(): void {
    audio.stopLoop("cycling", 0.2);
  },

  /** Scale pickup: a bright glassy ping. */
  scale(): void {
    audio.playTone({ freq: 1245, duration: 0.05, release: 0.12, gain: 0.05 });
  },

  /** Stage-up chime: a slow major arpeggio blooming upward. */
  stageUp(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) =>
      audio.playTone({ freq: f, duration: 0.22, attack: 0.02, release: 0.5, gain: 0.08, when: i * 0.13 }),
    );
  },

  /** Dialogue letter blip: tiny, dry, frequent. */
  blip(): void {
    audio.playTone({ freq: 880, type: "square", duration: 0.015, gain: 0.018 });
  },

  /** Death sting: a long low saw sliding into silence. */
  death(): void {
    audio.playTone({ freq: 110, endFreq: 42, type: "sawtooth", duration: 0.9, release: 0.6, gain: 0.1 });
  },

  /** A Remnant tearing free: two detuned sines beating eerily. */
  remnantRise(): void {
    audio.playTone({ freq: 220, duration: 0.5, attack: 0.05, release: 0.4, gain: 0.06 });
    audio.playTone({ freq: 233, duration: 0.5, attack: 0.05, release: 0.4, gain: 0.06 });
  },

  /** Remnant harvest success: an ascending pentatonic shimmer. */
  harvest(): void {
    const notes = [659.25, 783.99, 987.77, 1318.5];
    notes.forEach((f, i) =>
      audio.playTone({ freq: f, duration: 0.1, attack: 0.01, release: 0.3, gain: 0.06, when: i * 0.07 }),
    );
  },

  /** Soulsmith craft: an anvil-bright tap and its overtone. */
  craft(): void {
    audio.playTone({ freq: 392, type: "square", duration: 0.05, gain: 0.07 });
    audio.playTone({ freq: 587, duration: 0.16, release: 0.3, gain: 0.06, when: 0.06 });
  },
};

// ------------------------------------------------------------------ music

export type MusicScene = "valley" | "peak" | "tense";

interface BedDef {
  /** Mix channel name. */
  channel: string;
  /** Pentatonic note pool, Hz. */
  scale: number[];
  /** Occasional low drone root, Hz (0 = none). */
  drone: number;
  /** Seconds between notes: min + random * spread. */
  gapMin: number;
  gapSpread: number;
  noteGain: number;
}

const BEDS: Record<MusicScene, BedDef> = {
  // The valley floor: a warm A-minor pentatonic, unhurried.
  valley: {
    channel: "music.valley",
    scale: [220.0, 261.63, 293.66, 329.63, 392.0],
    drone: 110,
    gapMin: 1.3,
    gapSpread: 1.4,
    noteGain: 0.045,
  },
  // The peak: a higher, airier E pentatonic under Samara's ring.
  peak: {
    channel: "music.peak",
    scale: [329.63, 392.0, 440.0, 493.88, 587.33],
    drone: 164.8,
    gapMin: 1.6,
    gapSpread: 1.6,
    noteGain: 0.04,
  },
  // The hostile school: the peak set hollowed out — sparse, low, uneasy.
  tense: {
    channel: "music.tense",
    scale: [311.13, 329.63, 466.16],
    drone: 82.4,
    gapMin: 2.4,
    gapSpread: 2.2,
    noteGain: 0.045,
  },
};

const MUSIC_FADE = 1.6; // seconds for the cross-fade on map change

class MusicDirector {
  private scene: MusicScene | null = null;
  private nextNote = 0;
  private nextDrone = 0;
  private lastIdx = 0;

  /** Cross-fade to a scene's bed (no-op when unchanged). */
  setScene(scene: MusicScene): void {
    if (scene === this.scene) return;
    if (!audio.ready) {
      this.scene = scene; // remember the target for when audio unlocks
      return;
    }
    for (const [name, bed] of Object.entries(BEDS) as [MusicScene, BedDef][]) {
      audio.setChannelGain(bed.channel, name === scene ? 1 : 0, MUSIC_FADE);
    }
    this.scene = scene;
    this.nextNote = 0.4; // first note shortly after arrival
    this.nextDrone = 1.5;
  }

  /** Fade everything out (title screen / endings). */
  silence(): void {
    if (audio.ready) {
      for (const bed of Object.values(BEDS)) audio.setChannelGain(bed.channel, 0, MUSIC_FADE);
    }
    this.scene = null;
  }

  /** Drive the generative bed; call once per simulation tick. */
  update(dt: number): void {
    if (!audio.ready || audio.muted || !this.scene) return;
    const bed = BEDS[this.scene];
    // Make sure a scene chosen before unlock actually opens its channel.
    audio.setChannelGain(bed.channel, 1, 0.2);

    this.nextNote -= dt;
    if (this.nextNote <= 0) {
      this.nextNote = bed.gapMin + Math.random() * bed.gapSpread;
      // A drunkard's walk over the scale sounds melodic without a melody.
      const step = Math.floor(Math.random() * 3) - 1;
      this.lastIdx = Math.min(bed.scale.length - 1, Math.max(0, this.lastIdx + step));
      audio.playTone({
        freq: bed.scale[this.lastIdx]!,
        duration: 1.2 + Math.random() * 0.8,
        attack: 0.5,
        release: 1.4,
        gain: bed.noteGain,
        channel: bed.channel,
      });
    }

    if (bed.drone > 0) {
      this.nextDrone -= dt;
      if (this.nextDrone <= 0) {
        this.nextDrone = 7 + Math.random() * 6;
        audio.playTone({
          freq: bed.drone,
          duration: 3.5,
          attack: 1.2,
          release: 2.5,
          gain: bed.noteGain * 0.8,
          type: "triangle",
          channel: bed.channel,
        });
      }
    }
  }
}

export const music = new MusicDirector();
