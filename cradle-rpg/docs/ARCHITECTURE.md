# Architecture (as of M2 — first blood)

Zero-dependency TypeScript + Canvas. `npm run build` (strict tsc) compiles
`src/` to `dist/`; `index.html` loads `dist/game/main.js` as a native ES
module — **all imports must use explicit `.js` extensions**. `npm run check`
runs headless sanity tests (map integrity, collision, combat math, boot +
combat smoke test) — keep it green.

## Module map

```
src/engine/            reusable, game-agnostic
  loop.ts              GameLoop: fixed 60Hz update + rAF render(alpha), pauses when hidden
  input.ts             Input: action-based (held/pressed/released), mouse; call endFrame() once per tick
  camera.ts            Camera: lerp follow, bounds clamp, world<->screen, shake(intensity, duration)
  tilemap.ts           Tilemap: ground/decor/collision number[][] layers, 16px tiles,
                       visible-only draw, animated tiles, SortedDrawable decor for y-sorting
  collision.ts         AABB helpers + moveAndCollide (axis-separated sliding) + overlapsSolid
  sprites.ts           definePixelSprite(rows, palette) ASCII pixel art (lazy-baked to
                       offscreen canvas, flip support), Animation(frames, fps, loop)
  entity.ts            Entity base (anchor = feet center, hitbox, facing, prev pos for
                       interpolation) + EntityManager (update sweep, y-sorted drawSorted)
  save.ts              versioned localStorage save/load, registerMigration, export/import strings
  debug.ts             F3 overlay: fps, positions, collision boxes (drawWorld + drawScreen)

src/game/              this game
  tiles.ts             T tile-id table + TILESET: TileDef[] (Sacred Valley tiles)
  maps/testValley.ts   40x30 ASCII-authored map + spawn point
  player.ts            Player (a Combatant), 16x24 Wei-clan sprite, 8-dir movement @90px/s,
                       cycling aura + slash visuals; wireCombat() hooks up PlayerCombat
  playerCombat.ts      J/click 2-hit combo, Space dodge (i-frames, 5 madra),
                       C-hold cycling (35% speed, +50% dmg taken, +20% madra/s),
                       K/L/U/I technique slots via TechniqueCaster
  techniques.ts        game technique DATA (M2: "Burst of Effort" Enforcer stub) +
                       default slot assignment — M3 adds Path techniques here
  pickups.ts           ScalePickup (forged-madra currency diamonds, collect on touch)
  remnantStub.ts       RemnantStub — harmless fading wisp; TODO(M5) real Remnant system
  enemies/dreadbeast.ts  AI base: state machine scaffold, proximity+LOS aggro,
                       leash home, separation steering, HP pips, windup jitter
  enemies/slitherer.ts Foundation serpent: patrol + lunge bite (starter food)
  enemies/boar.ts      Copper boar: telegraphed overshooting charge, wall-stun punish
  enemies/stalker.ts   Iron stalker: prowl bursts faster than the player; says RUN
  enemies/spawns.ts    testValley placement table + spawner
  main.ts              boot: world, combat wiring, enemies, HUD (bars/scales/labels),
                       death/respawn sequence, hit-pause, save v2, loop

src/systems/           game-rule systems (engine-agnostic of specific entities)
  stats.ts             Stage enum, Stats, computeDamage() — the PURE stage-gap
                       damage formula (2^gap, asymmetric defense; unit-tested)
  combat.ts            Combatant base (hitstun/iframes/flash/knockback/buffs/dissolve)
                       + CombatSystem (attack arcs, strikes, hit-pause, shake, onDeath)
  techniques.ts        TechniqueDef registry + TechniqueCaster (Enforcer/Striker/
                       Ruler/Forger taxonomy; data-driven — M3 only adds defs)
  fx.ts                FxManager: floating damage numbers / text pops
src/content/           (planned, M4) dialogue, quests, flags
tools/                 serve.mjs (static server); npm run check =
                       checkmap.mjs + checkcombat.mjs (damage table, techniques,
                       LOS) + smoke.mjs (boot + scripted combat scenario)
```

Render order each frame: ground+flat decor → y-sorted (entities merged with
tree/rock decor by feet position) → debug world pass → HUD/debug screen pass.
Rendering uses interpolation `alpha`; camera transform snaps to whole device
pixels (3x scale) to avoid shimmer.

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
set `dead = true` to despawn. Combat hooks (M2): give your subclass
takeDamage()/onHit() methods and drive them from a system in `src/systems/` —
the manager deliberately knows nothing beyond update/draw.

## How to add a tile / map

Tile: add ASCII art + palette in `src/game/tiles.ts`, append an id to `T` and
a `TileDef` to `TILESET` at the same index (`solid`, optional `frames[]`+`fps`
for animation, `sortWithEntities` for tall things players walk behind).
Map: copy `maps/testValley.ts` — author an ASCII grid, map chars to
ground/decor ids, derive collision from `TILESET[id].solid`. Export a
`create…(): Tilemap` and a spawn point; add a case to the map id handling in
`main.ts`. Add reachability checks to `tools/checkmap.mjs`.

## Save schema extension

`src/engine/save.ts`: put new state in `SaveData.systems["yourSystem"]` (or
`flags` for story booleans). For breaking shape changes: bump `SAVE_VERSION`
and `registerMigration(newVersion, old => upgraded)` so old saves keep
loading. `main.ts` already autosaves every 10s and on pagehide via
`buildSave()` — extend that function when you add persistent state.

## Where systems plug in (as wired in M2)

- Per-tick order in `main.ts`: hit-pause gate → `combat.update` →
  `entities.update` → `fx.update` → death sequence → map/camera —
  keep `input.endFrame()` last.
- Combatants: extend `Combatant` (src/systems/combat.ts), call
  `tickCombat(dt, map)` first in update() (returns true → skip acting) and
  render via `drawWithEffects()` for hit-flash + death dissolve.
- New enemies: extend `Dreadbeast` (state machine + aggro/leash/separation
  for free), implement `think(dt)`, add a row to `enemies/spawns.ts`.
- Death drops are game policy: `combat.onDeath` in `main.ts` (dreadbeasts →
  scales, `leavesRemnant` foes → RemnantStub; real Remnants are M5).
- New techniques (M3): add a `TechniqueDef` in `src/game/techniques.ts`,
  register it, point a K/L/U/I slot at its id. No plumbing changes.
- Balance: ALL stage-gap math lives in `computeDamage()` in
  src/systems/stats.ts — keep it pure; tools/checkcombat.mjs asserts the
  doubling/halving table.
- Headless testing: `main.ts` exposes `globalThis.__poaTest` (player,
  entities, combat, classes…) for tools/smoke.mjs scenario scripting.
