'use strict';
/**
 * The soundtrack. Each track is registered with the Music sequencer.
 * Channels loop independently, so a short bass/drum line backs a longer melody.
 * Distinct themes per context, including separate battle themes for wild,
 * trainer, gym, Team Ionar, Elite Four, and Champion fights.
 */
function registerMusic() {
  const T = {};

  // ---- Title: slow, wondrous, aurora-like ----
  T.title = {
    bpm: 76,
    channels: [
      { wave: 'triangle', vol: 0.22, notes:
        'A4:4 E5:4 A5:6 G5:2 E5:4 F5:4 E5:8 -:2 D5:2 E5:2 F5:2 E5:8 A4:4 -:4' },
      { wave: 'sine', vol: 0.16, notes:
        'A3:8 F3:8 G3:8 E3:8 F3:8 D3:8 E3:8 A3:8' },
    ],
  };

  // ---- Intro: gentle, curious ----
  T.intro = {
    bpm: 92,
    channels: [
      { wave: 'square', vol: 0.15, staccato: true, notes:
        'C5:2 E5:2 G5:2 E5:2 F5:2 A5:2 G5:2 E5:2 D5:2 F5:2 A5:2 F5:2 E5:4 C5:4' },
      { wave: 'triangle', vol: 0.18, notes: 'C3:4 G3:4 F3:4 G3:4 A3:4 E3:4 F3:4 G3:4' },
    ],
  };

  // ---- Town: warm, homey ----
  T.town = {
    bpm: 108,
    channels: [
      { wave: 'square', vol: 0.16, staccato: true, notes:
        'G4:2 A4:2 B4:2 D5:2 B4:2 A4:2 G4:2 A4:2 B4:4 A4:2 G4:2 E4:4 D4:4 ' +
        'G4:2 A4:2 B4:2 D5:2 E5:4 D5:2 B4:2 A4:4 G4:4 -:4' },
      { wave: 'triangle', vol: 0.2, notes: 'G2:4 D3:4 G2:4 D3:4 C3:4 G3:4 D3:4 D3:4' },
      { wave: 'drums', vol: 0.18, notes: 'k:2 h:2 s:2 h:2' },
    ],
  };

  // ---- Route: upbeat marching adventure ----
  T.route = {
    bpm: 132,
    channels: [
      { wave: 'square', vol: 0.16, staccato: true, notes:
        'C5:2 C5:1 C5:1 E5:2 G5:2 F5:2 E5:2 D5:2 C5:2 D5:2 E5:4 G4:2 A4:2 ' +
        'C5:2 D5:2 E5:2 F5:2 G5:4 E5:2 C5:2 D5:4 G4:4' },
      { wave: 'square', vol: 0.1, notes: 'E4:2 G4:2 E4:2 G4:2 F4:2 A4:2 G4:2 B4:2' },
      { wave: 'triangle', vol: 0.2, notes: 'C3:2 C3:2 G3:2 G3:2 A2:2 A2:2 G3:2 G3:2 F3:2 F3:2 C3:2 C3:2 G2:2 G2:2 G2:2 G2:2' },
      { wave: 'drums', vol: 0.2, notes: 'k:2 h:1 h:1 s:2 h:1 k:1' },
    ],
  };

  // ---- Cave: sparse, tense ----
  T.cave = {
    bpm: 90,
    channels: [
      { wave: 'triangle', vol: 0.2, notes: 'D3:4 -:4 F3:4 -:4 E3:4 -:4 A2:4 -:4 D3:4 -:2 C3:2 D3:8 -:4' },
      { wave: 'sine', vol: 0.12, notes: 'D2:8 D2:8 A1:8 D2:8' },
    ],
  };

  // ---- Surf: rolling, breezy ----
  T.surf = {
    bpm: 116,
    channels: [
      { wave: 'triangle', vol: 0.2, notes:
        'C5:3 E5:3 G5:2 E5:3 C5:3 D5:2 F5:3 A5:3 G5:2 E5:6 -:2' },
      { wave: 'sine', vol: 0.16, notes: 'C3:4 G3:4 A3:4 E3:4 F3:4 C3:4 G3:4 G3:4' },
    ],
  };

  // ---- Evolution: mysterious rising ----
  T.evolve = {
    bpm: 100,
    channels: [
      { wave: 'square', vol: 0.16, notes: 'C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 B5:2 C6:6 -:2' },
      { wave: 'triangle', vol: 0.18, notes: 'C3:2 D3:2 E3:2 F3:2 G3:2 A3:2 B3:2 C4:6 -:2' },
    ],
  };

  // ---- Battle themes ----
  T.battle_wild = {
    bpm: 150,
    channels: [
      { wave: 'square', vol: 0.16, staccato: true, notes:
        'E5:1 E5:1 E5:2 C5:2 E5:2 G5:4 G4:4 C5:2 G4:2 E4:2 A4:2 B4:2 A4:2 G4:2 E5:2 ' +
        'E5:1 E5:1 E5:2 C5:2 E5:2 G5:4 A5:2 G5:2 F5:2 E5:2 D5:4' },
      { wave: 'triangle', vol: 0.2, notes: 'C3:2 C3:2 G2:2 C3:2 A2:2 A2:2 E2:2 A2:2 F2:2 F2:2 C3:2 F2:2 G2:2 G2:2 G2:2 B2:2' },
      { wave: 'drums', vol: 0.22, notes: 'k:1 h:1 s:1 h:1 k:1 k:1 s:1 h:1' },
    ],
  };

  T.battle_trainer = {
    bpm: 160,
    channels: [
      { wave: 'square', vol: 0.16, staccato: true, notes:
        'A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 C5:2 E5:2 F5:2 A5:2 C6:4 B5:2 A5:2 G5:4 E5:4 ' +
        'A4:2 C5:2 E5:2 A5:2 G5:2 E5:2 D5:2 F5:2 E5:6 -:2' },
      { wave: 'square', vol: 0.1, notes: 'A3:2 E4:2 A3:2 E4:2 F3:2 C4:2 G3:2 D4:2' },
      { wave: 'triangle', vol: 0.2, notes: 'A2:2 A2:2 A2:2 E3:2 F2:2 F2:2 C3:2 C3:2 G2:2 G2:2 D3:2 D3:2 E3:2 E3:2 E3:2 E3:2' },
      { wave: 'drums', vol: 0.22, notes: 'k:1 h:1 s:1 h:1' },
    ],
  };

  T.battle_gym = {
    bpm: 168,
    channels: [
      { wave: 'square', vol: 0.17, staccato: true, notes:
        'D5:1 D5:1 D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:2 A5:4 G5:2 E5:2 D5:4 ' +
        'A5:2 G5:2 F5:2 E5:2 D5:2 E5:2 F5:2 G5:2 A5:4 D5:4' },
      { wave: 'square', vol: 0.1, notes: 'D4:2 A4:2 D4:2 A4:2 C4:2 A4:2 B3:2 G4:2' },
      { wave: 'triangle', vol: 0.2, notes: 'D3:1 D3:1 D3:2 D3:1 D3:1 A2:2 F3:1 F3:1 F3:2 C3:2 G3:1 G3:1 G3:2 A3:2' },
      { wave: 'drums', vol: 0.24, notes: 'k:1 s:1 k:1 s:1 k:1 k:1 s:1 s:1' },
    ],
  };

  T.battle_ionar = {
    bpm: 148,
    channels: [
      { wave: 'square', vol: 0.16, staccato: true, notes:
        'E5:2 F5:2 E5:2 D5:2 E5:2 B4:2 E5:4 G5:2 F5:2 E5:2 D5:2 C5:2 B4:2 C5:2 D5:2 ' +
        'E5:2 F5:2 G5:2 A5:2 G5:2 F5:2 E5:4 B4:4' },
      { wave: 'sawtooth', vol: 0.09, notes: 'E3:2 E3:2 B3:2 E3:2 C3:2 C3:2 G3:2 C3:2' },
      { wave: 'triangle', vol: 0.2, notes: 'E2:2 E2:2 E2:2 E2:2 C3:2 C3:2 B2:2 B2:2 A2:2 A2:2 A2:2 A2:2 B2:2 B2:2 B2:2 B2:2' },
      { wave: 'drums', vol: 0.22, notes: 'k:1 h:1 k:1 h:1 s:1 h:1 k:1 s:1' },
    ],
  };

  T.battle_elite = {
    bpm: 172,
    channels: [
      { wave: 'square', vol: 0.17, staccato: true, notes:
        'C5:2 B4:2 C5:2 D5:2 E5:2 D5:2 E5:2 F5:2 G5:4 F5:2 E5:2 D5:4 G4:2 B4:2 ' +
        'C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 B5:2 C6:4 G5:4' },
      { wave: 'square', vol: 0.1, notes: 'G4:2 E5:2 G4:2 E5:2 A4:2 F5:2 G4:2 D5:2' },
      { wave: 'triangle', vol: 0.2, notes: 'C3:2 G3:2 C3:2 G3:2 A2:2 E3:2 F2:2 C3:2 G2:2 D3:2 G2:2 D3:2 G2:2 G3:2 G2:2 B3:2' },
      { wave: 'drums', vol: 0.24, notes: 'k:1 h:1 s:1 h:1 k:1 h:1 s:1 s:1' },
    ],
  };

  T.battle_champion = {
    bpm: 158,
    channels: [
      { wave: 'square', vol: 0.18, notes:
        'A4:2 E5:2 A5:4 G5:2 F5:2 E5:4 D5:2 E5:2 F5:4 E5:2 D5:2 C5:4 A4:4 ' +
        'A4:2 E5:2 A5:4 B5:2 C6:2 B5:4 A5:2 G5:2 A5:8' },
      { wave: 'square', vol: 0.1, notes: 'A3:2 C5:2 A3:2 C5:2 F3:2 A4:2 E3:2 G4:2' },
      { wave: 'triangle', vol: 0.2, notes: 'A2:2 A2:2 E3:2 E3:2 F2:2 F2:2 C3:2 C3:2 G2:2 G2:2 D3:2 D3:2 A2:2 A2:2 E3:2 E3:2' },
      { wave: 'drums', vol: 0.22, notes: 'k:2 h:1 h:1 s:2 h:1 h:1' },
    ],
  };

  // ---- Victory fanfare (short) ----
  T.victory = {
    bpm: 140,
    channels: [
      { wave: 'square', vol: 0.2, notes: 'C5:1 C5:1 C5:1 C5:2 G4:2 A4:2 C5:2 C5:1 B4:1 C5:4' },
      { wave: 'triangle', vol: 0.18, notes: 'C3:2 C3:2 G3:2 C3:2 F3:2 G3:2 C3:4' },
    ],
  };

  Music.registerTracks(T);
}
