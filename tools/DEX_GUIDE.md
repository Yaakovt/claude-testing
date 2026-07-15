# Dex batch authoring guide (for batch agents)

You are writing ONE file: `js/data/dex/batch_X.js` containing 18 species definitions.
Everything is ORIGINAL — no real Pokémon names, designs, or references.

## Study these files first (mandatory)
1. `js/data/dex/starters.js` — THE exemplar. Match its structure, art style, and quality exactly.
2. `js/core/pixel.js` — PixelSurface API + Px.ramp.
3. `js/data/species_core.js` — Dex.add schema + SpriteKit helpers.
4. `js/data/moves.js` — the ONLY legal move ids for learnsets.
5. `js/data/items.js` — legal tm/hm/stone ids.
6. `js/data/abilities.js` — legal ability ids. Pick thematically.

## File shape
```js
'use strict';
/** Batch X (dex #NN-#NN): <theme>. */
(() => {
  const K = SpriteKit;
  const FUR = Px.ramp('#b08850');   // define ramps per line
  Dex.add({ id, key, name, types, base, ability, catchRate, expYield, growth,
            gender, evolve, learn, tms, dex, cry, draw(s){}, drawBack(s){} });
  ...
})();
```

## Art rules (Gen-3 quality bar — this is the whole point)
- Canvas is a 64×64 `PixelSurface s`. Feet/ground shadow around y≈56-58. Center x≈32.
- Build bodies from `s.ball(...)` (auto 3-tone shading), `s.limb`, `s.stroke(ramp ok)`,
  `s.tri/fillPoly`, `K.horn`, `K.leaf`. Faces from `K.eye`, `K.smile`, `K.brow`, `K.fang`, `K.cheek`.
- 2-4 color ramps per species; add ONE accent detail (markings, glow dots, dither
  texture via `s.dither`) so nothing looks plain. Outline & inner-edge passes are automatic.
- Size by stage: basic ≈ 24-34px tall, mid ≈ 34-44px, final ≈ 44-56px (fill the frame).
- **Back sprites must truly face away**: back of the head (no eyes/mouth — ears, hood,
  crest from behind), spine/back markings visible, tail/wings toward the camera. Slightly
  bulkier silhouette than the front (backs are "closer to camera").
- Every species must have a DISTINCT silhouette. Vary poses: quadruped, upright, serpent,
  floating, winged. No two species may read as the same shape recolored.

## MANDATORY visual iteration loop (do at least 2 rounds)
```bash
SP=/tmp/claude-0/-home-user-claude-testing/68d44f5f-c129-5289-8e69-efd4b77efc4e/scratchpad
cd $SP && CHROMIUM_PATH=/opt/pw-browsers/chromium node shot.mjs \
  "/home/user/claude-testing/tools/preview.html?from=<firstId>&to=<lastId>" \
  $SP/batch_X.png 1500 1400 800
```
Then **Read the PNG and look at it critically**. Fix anything blobby, unreadable,
mis-proportioned, or where a back sprite shows a face. Iterate until it looks like a
real Gen-3 sprite sheet. (`?from=&to=` filters to your ids.) Console errors from the
page print to stdout — fix them.

## Data rules
- `base`: six stats summing to the BST target given in your species table (±10).
  Shape them to the concept (tank = def/hp, sweeper = spe/atk...). Final stages
  get one stat ≥ 95.
- `learn`: 8-13 entries `[level, 'move_id']`, ids from moves.js ONLY. At least two
  level-1 moves. Same-line moves overlap but evolved forms add stronger ones
  (levels ≤ 58). STAB coverage for BOTH types of a dual-type.
- `tms`: 4-10 tm ids + HM compatibility: water mons get 'hm03','hm07';
  birds 'hm02'; most land mons 'hm01' and/or 'hm04'; fighters/rock/ground 'hm06';
  electric/psychic/fairy/ghost 'hm05'. (These matter — HMs must be teachable.)
- `evolve`: exactly as your species table says ({to, level} | {to, stone} |
  {to, friendship: 160} | null).
- `catchRate`: common 160-255, mid-rare 90-140, strong/standalone 45-75.
- `expYield` ≈ BST/2.4. `growth`: mix of fast/medfast/medslow/slow. `gender`: % male
  (50 typical, 87.5 starters-like, -1 genderless golems/objects).
- `dex`: {species:'Two-Word Class', h:'X.Xm', w:'XX.Xkg', entry:'1-2 evocative
  Norse-flavored sentences, no real-world brand or Pokémon references'}.
- `cry`: unique per species. Vary base (140-900Hz), wave (square/sawtooth/sine/triangle),
  sweep (0.4-1.4), dur (0.3-0.8), vib, optional grit/chirps/sub. Big mons = low+sub,
  small = high+chirps.

## Validation (must pass before you finish)
```bash
cd /home/user/claude-testing && node tools/audit.mjs
```
(Other batches may be missing — that's fine; YOUR species must produce no errors.)
Do NOT run git commands. Do NOT edit any file outside your batch file.
