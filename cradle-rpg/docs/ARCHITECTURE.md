# Architecture (as of M1 — walkable world)

Zero-dependency TypeScript + Canvas. `npm run build` (strict tsc) compiles
`src/` to `dist/`; `index.html` loads `dist/game/main.js` as a native ES
module — **all imports must use explicit `.js` extensions**. `npm run check`
runs headless sanity tests (map integrity, collision, boot smoke test) —
keep it green.

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
  player.ts            Player entity, 16x24 Wei-clan sprite, 8-dir movement @90px/s
  main.ts              boot: canvas, world, camera, HUD, save wiring, loop

src/systems/           (planned, M2+) combat, madra/cycling, techniques, advancement, AI
src/content/           (planned, M4) dialogue, quests, flags
tools/                 serve.mjs (static server), checkmap.mjs + smoke.mjs (npm run check)
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

## Where systems plug in (M2+)

- Per-tick logic: a system object with `update(dt, world)` called from the
  loop in `main.ts` before `entities.update` — keep `input.endFrame()` last.
- Screen shake on hits: `camera.shake(px, seconds)` already works.
- HUD: `drawHud()` in `main.ts` reserves the top-left "Foundation" label and
  the empty madra bar frame — fill the bar from your madra system.
- Input: combat actions (`attack`, `tech1..4`, `dodge`, `cycle`, `interact`,
  `sheet`) are already bound in `src/engine/input.ts`.
