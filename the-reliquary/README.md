# THE RELIQUARY

*A chamber of locks in the tradition of The Room.*

A 3D puzzle-box game that runs entirely in the browser. You inherit the
worktable of Edwin Vane — horologist, missing forty days — and the ornate,
warm-to-the-touch box he left behind. Everything on it is an original
creation: the story, the letters, the art, the sound, and the code.

![genre] Fireproof's *The Room* is the inspiration for the *mechanics* —
tactile drag interactions, an eyepiece that reveals a hidden layer,
box-within-box progression — but the puzzles, plot and assets here are all
new work.

## Play it

**Easiest way — just open the file.** Download / double-click
**`TheReliquary.html`**: a single self-contained file (game, engine,
textures, audio — everything inlined, ~0.6 MB). No server, no install,
no internet. Chrome/Edge/Firefox/Safari, desktop or mobile.

**Developer way** — the readable source (`index.html` + `game.js`) uses
ES modules, so it needs any static file server:

```bash
cd the-reliquary
python3 -m http.server 8000
# then open http://localhost:8000
```

To regenerate `TheReliquary.html` after editing the source:
`npm i esbuild && node build.mjs`.

## Controls

| input | effect |
|---|---|
| drag | orbit the table |
| scroll / pinch | lean closer |
| double-tap a face | focus on it (‹ button or **Esc** / right-click to step back) |
| tap & drag mechanisms | turn dials, slide bolts, spin rings, set hands |
| **E** or the round button | raise / lower the eyepiece |
| tap an inventory item twice | inspect it in hand (drag to turn it — some items can be *changed*) |
| ? button | tiered hints for the current chapter |

Progress saves automatically at each chapter (localStorage).

## What's inside

- **Chapter I — The Horologist's Drawer.** An interlocked rosette-and-bolt
  mechanism guarding the eyepiece and the first letter.
- **Chapter II — The Celestial Dial.** Three concentric star rings on the
  lid; their true sky is only visible through the glass.
- **Chapter III — The Aether Engine.** A mirror-and-beam router burning a
  fuel the naked eye can't see.
- **Chapter IV — A Quarter Past Nine.** A stopped chronometer, a winding
  key bent in grief (mend it in your hands), and a minute someone never
  stopped seeing.
- **Chapter V — The Unspoken Name.** A six-ring cryptex rising from the
  lid, keyed to an acrostic hidden in the final letter.
- **Finale.** The box opens. Two endings; the choice is yours, as it was
  always meant to be.

Every puzzle is a different mechanism — nothing repeats.

Graphics: procedural wood/brass/paper textures, PBR materials with an
environment map, soft shadows, bloom, dust motes, candlelight, and a
separate additive "aether" render layer for the eyepiece. Audio is
synthesized live with WebAudio — drones, ticks, chimes, thunks — nothing
recorded.

## Verifying it works

`test/playthrough.mjs` drives a full game with real mouse input in
headless Chromium — every drag, tap, inspection and both letters of the
ending path — and asserts each chapter's state. To run it you need
`playwright-core` and a Chromium build:

```bash
python3 -m http.server 8901 &          # from the-reliquary/
node test/playthrough.mjs              # expects Playwright's chromium
```

## Spoilers — full walkthrough

<details>
<summary>Open only if the house has defeated you</summary>

1. **Front:** turn the rosette until its notch meets the engraved arrow.
   Slide the bolt right. The drawer opens: take the letter and the
   eyepiece.
2. **Lid (eyepiece on):** rotate each brass ring until its stars sit in
   the pale ghost-marks. All three at once.
3. **Left housing:** open the panel. With the eyepiece on, tap the
   mirrors until the beam runs: down the left column, along the bottom,
   up the right column, into the crystal. Take the bent key and the
   letter from the small drawer.
4. **Key:** select it, tap it again to inspect, tap the bent bow to
   straighten it.
5. **Right face:** use the key on the escutcheon below the clock. Set the
   hands to **9:15** (the glass shows *IX·XV* scorched beside the dial).
6. **Cryptex:** the last letter is an acrostic — first letters top to
   bottom spell **ELOWEN**. Dial it in, top ring to bottom.
7. Read the last letter. Choose.

</details>

[genre]: # "mechanics homage; all content original"
