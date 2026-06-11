# Architecture (as of M3 — paths & advancement)

Zero-dependency TypeScript + Canvas. `npm run build` (strict tsc) compiles
`src/` to `dist/`; `index.html` loads `dist/game/main.js` as a native ES
module — **all imports must use explicit `.js` extensions**. `npm run check`
runs headless sanity tests (map integrity, collision, combat math,
advancement math, boot + combat + advancement smoke tests, the Unsouled
learn path, and continue/migration) — keep it green.

## Module map

```
src/engine/            reusable, game-agnostic
  loop.ts              GameLoop: fixed 60Hz update + rAF render(alpha), pauses when hidden
  input.ts             Input: action-based (held/pressed/released), mouse, anyPressed(),
                       keyPressed(code) for raw keys (name entry); call endFrame() once per tick
  camera.ts            Camera: lerp follow, bounds clamp, world<->screen, shake(intensity, duration)
  tilemap.ts           Tilemap: ground/decor/collision number[][] layers, 16px tiles,
                       visible-only draw, animated tiles, SortedDrawable decor for y-sorting
  collision.ts         AABB helpers + moveAndCollide (axis-separated sliding) + overlapsSolid
  sprites.ts           definePixelSprite(rows, palette) ASCII pixel art (lazy-baked to
                       offscreen canvas, flip support), Animation(frames, fps, loop)
  entity.ts            Entity base (anchor = feet center, hitbox, facing, prev pos for
                       interpolation) + EntityManager (update sweep, y-sorted drawSorted)
  save.ts              versioned localStorage save/load (v3), registerMigration, export/import
  debug.ts             F3 overlay: fps, positions, collision boxes (drawWorld + drawScreen)

src/game/              this game
  tiles.ts             T tile-id table + TILESET: TileDef[] (Sacred Valley tiles)
  maps/testValley.ts   40x30 ASCII-authored map + spawn point
  main.ts              boot + GAME FLOW: save migrations (v2, v3), canvas/input,
                       title -> (creation | continue) -> world; autosave; __poaTest hook
  screens.ts           title + character creation (in-canvas, keyboard-driven):
                       press-any-key aura screen, Continue/New Game (+wipe confirm),
                       origin choice (Path summary/playstyle/difficulty/lore), A-Z name entry
  world.ts             World class: everything in-game (was M2 main) — map, player,
                       enemies, shrines, combat wiring, HUD, death/respawn, aura sight,
                       spirit panel, ceremony/channel overlays, buildSave()
  paths.ts             the four origins as DATA: PathDef (kit ids, lore lines, placeholder
                       names), slotsFor(origin, stage, progress), kitInfo() for the panel.
                       TODO(M-future): the Unsouled U slot is the twin-core hook
  player.ts            Player (a Combatant): origin-aware stats, 8-dir movement @90px/s,
                       cycling aura, cloak afterimages/mantle/parry visuals, applyIronLook()
  playerCombat.ts      J/click 2-hit combo (reports landed hits via onBasicHit), Space dodge,
                       C-hold cycling, K/L/U/I slots via TechniqueCaster (setSlots()),
                       full TechniqueContext (entities/combat/map/spawn) for casts
  techniques.ts        ALL technique data: White Fox / Sunset Lake / Mountain's Spine kits,
                       Empty Palm + Burst of Effort (Unsouled); registerGameTechniques()
  techniqueEntities.ts MadraBolt (projectiles), ExpandingRing (visual), SlowPool (zone),
                       StoneWallSegment (temporary collision entity — never map edits)
  advancementFlow.ts   AdvancementFlow: fill tracking, shrine prompts/E, the Iron elixir
                       offer/channel state machine (refund only before drinking), stage-up
                       application + ceremonies, Empty Palm learn trigger, panel data
  auraSight.ts         Copper benefit: vital-aura motes near water/trees (precomputed
                       sources, deterministic drift) + subtle screen bloom/tint
  spiritPanel.ts       Tab panel drawing: name, Path, stage, kit (locked slots shown),
                       progress lines ("cycled to full: 3/5", "scales: 12/25")
  shrine.ts            Shrine entity (stone seat + incense) + TEST_VALLEY_SHRINES spots
  pickups.ts           ScalePickup (forged-madra currency diamonds, collect on touch)
  remnantStub.ts       RemnantStub — harmless fading wisp; TODO(M5) real Remnant system
  enemies/dreadbeast.ts  AI base: state machine scaffold, proximity+LOS aggro, leash,
                       separation, HP pips, windup jitter; M3: applyDaze (lose aggro,
                       wander), applyMadraLock (specials sealed), applySlow, stage label
                       shown on sight once the player is Copper+
  enemies/slitherer.ts Foundation serpent: patrol + lunge bite (starter food)
  enemies/boar.ts      Copper boar: telegraphed overshooting charge, wall-stun punish
  enemies/stalker.ts   Iron stalker: prowl bursts faster than the player; says RUN
  enemies/spawns.ts    testValley placement table + spawner

src/systems/           game-rule systems (engine-agnostic of specific entities)
  stats.ts             Stage enum, Stats, computeDamage() — the PURE stage-gap
                       damage formula (2^gap, asymmetric defense; unit-tested)
  advancement.ts       PURE advancement data: per-stage requirements (Copper = madra
                       fills, Iron = scales + 10s refining channel, Jade/Gold = story
                       gated M4) + STAGE_GAINS and applyStageUp() (unit-tested)
  combat.ts            Combatant base (hitstun/iframes/flash/knockback/buffs/dissolve;
                       M3: evasion, flat armor, parryTimer) + CombatSystem (attack arcs,
                       strikes — parry riposte + evasion rolls resolved here, injectable
                       rng, hit-pause, shake, onDeath)
  techniques.ts        TechniqueDef registry + TechniqueCaster (Enforcer/Striker/
                       Ruler/Forger taxonomy; TechniqueContext now optionally carries
                       entities/combat/map/spawn so defs stay data-driven)
  fx.ts                FxManager: floating damage numbers / text pops
src/content/           (planned, M4) dialogue, quests, flags
tools/                 serve.mjs (static server); npm run check =
                       checkmap.mjs (map + shrine reachability) + checkcombat.mjs
                       (damage table, technique kits, parry/armor/evasion, LOS) +
                       checkadvance.mjs (requirements + stage-up math + path data) +
                       smoke.mjs (creation UI -> combat -> Copper -> Iron, save v3) +
                       smokeUnsouled.mjs (Empty Palm learn path) +
                       smokeContinue.mjs (v2->v3 migration + Continue restore)
```

Render order each frame: ground+flat decor → y-sorted (entities merged with
tree/rock decor by feet position) → fx → aura-sight motes → shrine prompt →
debug world pass → HUD (incl. Copper tint, channel/ceremony overlays, spirit
panel) → debug screen pass. Rendering uses interpolation `alpha`; camera
transform snaps to whole device pixels (3x scale) to avoid shimmer.

## Game flow (M3)

`main.ts` owns a single GameLoop. Until a `World` exists it ticks/draws
`Screens` (title → menu → origin → name). `Screens.result` is either
`{ kind: "continue" }` (load the existing save) or `{ kind: "new", origin,
name }` (clearSave(), fresh world). The world is only constructed at that
moment; `__poaTest` exposes world internals through getters for the headless
harnesses. Headless note: never use canvas gradients/measureText — the test
shim's 2d context is a no-op proxy.

## How to add a sprite

```ts
const frames = definePixelFrames([rowsA, rowsB], { X: "#hex", ... });
const anim = new Animation(frames, 8 /* fps */, true /* loop */);
anim.update(dt); anim.draw(ctx, x, y, flipped);
```
Rows are equal-length strings; chars not in the palette are transparent.
One Animation instance per entity (it holds playback state); frames are shared.

## How to add an entity

Extend `Entity` (src/engine/entity.ts): set `hitbox` (relative to the feet
anchor), implement `update(dt)` and `draw(ctx, alpha)`. Move with
`moveAndCollide(this.aabb, dx, dy, map)` for wall sliding. Draw at
`renderX(alpha)/renderY(alpha)`, not `x/y`. Register via `entityManager.add()`;
set `dead = true` to despawn. Combat hooks: give your subclass
takeDamage()/onHit() methods and drive them from a system in `src/systems/` —
the manager deliberately knows nothing beyond update/draw. Ground-decals
(SlowPool) override `renderY()` to sort under everything; blocking entities
(StoneWallSegment) push overlapping combatants out per tick — no map edits.

## How to add a tile / map

Tile: add ASCII art + palette in `src/game/tiles.ts`, append an id to `T` and
a `TileDef` to `TILESET` at the same index (`solid`, optional `frames[]`+`fps`
for animation, `sortWithEntities` for tall things players walk behind).
Map: copy `maps/testValley.ts` — author an ASCII grid, map chars to
ground/decor ids, derive collision from `TILESET[id].solid`. Export a
`create…(): Tilemap` and a spawn point; add a case to the map id handling in
`world.ts`. Add reachability checks to `tools/checkmap.mjs` (shrines too).

## Save schema extension

`src/engine/save.ts` is at **v3**: `systems.combat` { health, madra, scales },
`systems.character` { origin, name }, `systems.advancement` { stage,
madraFills, basicHits, emptyPalmLearned }. Put new state in
`SaveData.systems["yourSystem"]` (or `flags` for story booleans). For
breaking shape changes: bump `SAVE_VERSION` and `registerMigration(newVersion,
old => upgraded)` in main.ts (defaults are game knowledge) so old saves keep
loading — the v2→v3 migration mints a Wei character for M2 saves.
`main.ts` autosaves every 10s and on pagehide via `world.buildSave()` —
extend that method when you add persistent state.

## Where systems plug in (as wired in M3)

- Per-tick order in `world.update`: hit-pause gate → `combat.update` →
  `entities.update` → `fx.update` → `advancement.update` → death sequence →
  aura sight → map/camera. `main.ts` calls `input.endFrame()` last, always.
- Combatants: extend `Combatant` (src/systems/combat.ts), call
  `tickCombat(dt, map)` first in update() (returns true → skip acting) and
  render via `drawWithEffects()` for hit-flash + death dissolve.
- New enemies: extend `Dreadbeast` (state machine + aggro/leash/separation +
  daze/madra-lock/slow handling for free), implement `think(dt)`, add a row
  to `enemies/spawns.ts`.
- Death drops are game policy: `combat.onDeath` in `world.ts` (dreadbeasts →
  scales, `leavesRemnant` foes → RemnantStub; real Remnants are M5).
- New techniques: add a `TechniqueDef` in `src/game/techniques.ts`, register
  it, reference its id from a Path kit in `paths.ts`. Defs receive the full
  TechniqueContext (user/fx/entities/combat/map/spawn) — no plumbing changes.
- New Paths/origins: add a `PathDef` to `PATHS` in `paths.ts` — creation
  screen, slot assignment, and the spirit panel are all data-driven from it.
- Advancement balance: requirements + stage multipliers live ONLY in
  src/systems/advancement.ts (pure; tools/checkadvance.mjs asserts them).
  Runtime rules (refunds, channel-break conditions) live in
  src/game/advancementFlow.ts.
- Stage-gap balance: ALL math lives in `computeDamage()` in
  src/systems/stats.ts — keep it pure; tools/checkcombat.mjs asserts the
  doubling/halving table.
- Headless testing: `main.ts` exposes `globalThis.__poaTest` (screens, world
  getters, classes…) for the tools/smoke*.mjs scenario scripts; drive the
  real title/creation UI with key events before touching world internals.
