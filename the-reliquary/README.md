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

**Act I — the horologist's study**

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
- **Chapter VI.** The box opens. Close it and the story ends here — or
  raise the eyepiece, and go where it has been trying to take you.

**Act II — the second room** *(raise the eyepiece at the finale)*

- **Chapter VII — The Second Room.** A chamber drawn in chalk and
  starlight, and four bells that remember a lullaby. Listen; say it back.
- **Chapter VIII — The Weight of Stars.** Star-metal on a balance —
  the heaviest star alone is worth the three bright ones together.
- **Chapter IX — The Shadow Key.** Twisted iron in front of a lantern:
  turn it until the light on the wall stops lying.
- **Chapter X — The Chalk Door.** Trace her door true — sides, arch,
  and the handle every door her age deserves — then make the last choice.

Three endings in all. Every puzzle is a different mechanism — nothing
repeats, in either room.

Graphics: procedural wood/brass/paper textures, PBR materials with an
environment map, soft shadows, bloom, dust motes, candlelight, and a
separate additive "aether" render layer for the eyepiece. Audio is
synthesized live with WebAudio — drones, ticks, chimes, thunks — nothing
recorded.

## Verifying it works

Two headless-Chromium tests drive full games with real mouse input —
every drag, arc, tap and inspection — asserting each chapter's state:

- `test/playthrough.mjs` — Act I front to back, ending with the box closed
- `test/act2-playthrough.mjs` — crosses over and plays Act II to an ending

```bash
python3 -m http.server 8901 &          # from the-reliquary/
node test/playthrough.mjs              # expects playwright-core + chromium
node test/act2-playthrough.mjs
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
7. Read the last letter. **Close the box** ends the story here;
   **raise the eyepiece** to cross into Act II.

**Act II**

8. **Bells:** wind the crank, watch the order the bells glow (five
   notes), tap them back in that order.
9. **Scales:** all four star-weights on the pans — the 6-dot alone on
   one side, 1+2+3 together on the other.
10. **Shadow:** drag the twisted iron around until its cast shape becomes
    a keyhole; it locks itself when true.
11. **Chalk door:** with the eyepiece raised, trace the two sides and the
    arch along the pale guides, then tap where the handle belongs
    (right side, waist height). Choose your ending at the open door.

</details>

[genre]: # "mechanics homage; all content original"
