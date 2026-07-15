# ART REDO BRIEF — all 100 sprites (run when Fable 5 resets)

**Verdict on v1:** too blobby, flat, and generic. Silhouettes read as "shaded ovals
with parts stuck on." We are redoing **every species' `draw()` and `drawBack()`** to a
higher bar. This is a pure art swap — do NOT change any data fields, ids, keys, stats,
learnsets, or the file structure. Only rewrite the two draw functions per species.

## The quality bar (what "good" means here)
Think Gen-3 (Ruby/Sapphire/Emerald) box art quality at 64×64:
1. **Silhouette first.** Before shading, the black outline alone must be instantly
   readable as the creature. Add gesture — a lean, a turn, a raised limb, an arched
   neck. No symmetric front-on T-poses. Vary the pose per species.
2. **Deeper shading.** Use 4 tone bands minimum on major masses (highlight, light,
   base, shade) plus the outline. Add a cast shadow where forms overlap (chin on chest,
   arm on torso, wing on back). Keep the light upper-left and consistent.
3. **Detail density.** Fill the 64×64 frame (final stages ~52px tall). Add the details
   that sell the concept: individual claws, feather/scale rows, fur clumps, horn ridges,
   eye shine + lower-lid, nostril, mouth interior. One or two "hero" details each.
4. **Character in the face.** Eyes with iris + pupil + shine + a brow attitude. Mouths
   that emote. The starter finals and legendary should look *fierce/majestic*, basics
   *cute*, mid-stages *in-between*.
5. **Distinct silhouettes across the dex.** No two species may be the same blob recolored.
   Rotate body plans: quadruped, biped, serpentine, floating, winged, insectoid, aquatic.
6. **Clean edges.** No stray single pixels; anti-halo the outline; smooth curves via the
   ellipse/poly helpers rather than lumpy freehand `ball` stacks.

## FRONT sprites
- Face the camera but angled ~10° (three-quarter view) so they have depth, not a flat
  mugshot. Weight on the ground; add a small ground-contact shadow implied by the feet.

## BACK sprites (important new rule)
- The back sprite is shown bottom-left in battle facing the enemy at top-right.
- **Turn the head/gaze slightly to the RIGHT and up**, as if watching the opponent's
  fakemon. Show the far cheek/ear and a sliver of the eye or brow on the right side —
  never the full face, but clearly *looking toward the foe*, not straight away.
- Still show the back: spine, dorsal markings, tail/wings toward the camera, back of the
  crest/hood. Bulkier read than the front (closer to camera).

## Workflow (per batch of 18)
1. Rewrite the draw functions for your id range only.
2. Screenshot & **look critically**:
   `cd $SCRATCH && CHROMIUM_PATH=/opt/pw-browsers/chromium node shot.mjs \
    "/home/user/claude-testing/tools/preview.html?from=<a>&to=<b>" out.png 1500 1500 900`
3. Iterate at least 3 rounds. Compare against a real Gen-3 sprite in your mind's eye.
4. `node tools/audit.mjs` must still pass. No git.

## Toolkit reminders
- `Px.ramp(hex)` gives {o,d,b,l,h}. For deeper shading, also derive an extra mid tone.
- `s.ball` does 3-tone; for hero masses, hand-layer `fillEllipse` in 4 tones + a cast
  shadow crescent for a rounder, less "auto-shaded" look.
- Add `SpriteKit`-style helpers as needed (feather rows, scale rows, claw clusters).
- Outline + innerEdge passes run automatically in `Dex.sprite`.

## Split evolutions / megas (also for Fable)
- Split evo already wired: `evolve` may be an array. glacierling → frystdrake (level) OR
  frostfern (Aurora Stone). Add more where thematic.
- Megas: add optional `mega:{to, stone, base, types?}` data + a mega sprite pair per
  eligible final (starters finals, Auroryx, pseudo). Wire a Mega Evolve battle action.
  Left entirely for Fable since each needs a new sprite pair.
