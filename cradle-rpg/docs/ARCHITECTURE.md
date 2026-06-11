# Architecture (as of M4a — narrative machinery & the multi-map world)

Zero-dependency TypeScript + Canvas. `npm run build` (strict tsc) compiles
`src/` to `dist/`; `index.html` loads `dist/game/main.js` as a native ES
module — **all imports must use explicit `.js` extensions**. `npm run check`
runs headless sanity tests (map integrity, world-graph integrity, collision,
combat math, advancement math, narrative-system unit tests, boot + seed-story
+ combat + advancement smoke tests, the Unsouled learn path, and
continue/migration) — keep it green (425 assertions as of M4a).

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
                       interpolation) + EntityManager (update sweep, y-sorted drawSorted,
                       purge(filter) for map swaps)
  save.ts              versioned localStorage save/load (v4), registerMigration, export/import
  debug.ts             F3 overlay: fps, positions, collision boxes (drawWorld + drawScreen)

src/systems/           game-rule systems (engine-agnostic of specific entities)
  stats.ts             Stage enum, Stats, computeDamage() — the PURE stage-gap
                       damage formula (2^gap, asymmetric defense; unit-tested)
  advancement.ts       PURE advancement data: per-stage requirements (Copper = madra
                       fills, Iron = scales + 10s refining channel, Jade/Gold = story
                       gated) + STAGE_GAINS and applyStageUp() (unit-tested)
  combat.ts            Combatant base + CombatSystem (attack arcs, strikes, parry/
                       evasion/armor, injectable rng, hit-pause, shake, onDeath)
  techniques.ts        TechniqueDef registry + TechniqueCaster (Enforcer/Striker/
                       Ruler/Forger taxonomy; TechniqueContext carries
                       entities/combat/map/spawn so defs stay data-driven)
  story.ts             M4a: StoryState (flags — NEVER reset; reputation/resolve/
                       knowledge axes; quest registry + active/completed, objectives
                       keyed to flags so progress is derived state), and the shared
                       Condition/Effect vocabulary + checkConditions/runEffects.
                       Pure: conditions read a StoryQuery, effects dispatch through
                       an EffectHandler the game provides (World.runEffect).
  dialogue.ts          M4a: dialogue tree registry + DialogueRunner (pure state:
                       {placeholder} substitution, node-entry effects run once,
                       condition-gated choices, conditional branches, choice effects)
  cutscene.ts          M4a: CutscenePlayer step sequencer + registry. Steps:
                       walk/face/say/wait/fadeOut/fadeIn/shake/spawn/despawn/
                       panCamera/resetCamera/effect (+ setFlag/giveStage/moveMap
                       sugar). ALL world access goes through the CutsceneHost
                       interface — World adapts itself; tests mock it.
  fx.ts                FxManager: floating damage numbers / text pops

src/game/              this game
  tiles.ts             T tile-id table + TILESET: TileDef[] (Sacred Valley tiles incl.
                       stone, lantern, cloud, snow, cliff, orchard, dummy, rope…)
  maps/builder.ts      shared ASCII -> TilemapData builder (one char per tile, legend
                       overridable per map; collision derives from TILESET solidity)
  maps/registry.ts     M4a: MapEntry registry — id/name/build()/spawn/named entries/
                       transitions (tile-rect trigger zones)/enemies/shrines/npcs/
                       hostileFlag/onEnter cutscene/ringGlow; START_MAP; the
                       addMapNpcs()/setMapOnEnter() content hooks
  maps/weiVillage.ts   45x35 START_MAP: family courtyard, festival arena, elder's
                       hall, the guarded south gate (safe ground — no enemies)
  maps/valleyWilds.ts  40x30 — the old testValley layout, same coordinates, plus a
                       west opening (village) and north opening (trail); 7 beasts
  maps/samaraTrail.ts  40x40 switchback climb, snow line, 2 hollow stalkers
  maps/heavensGlory.ts 45x30 school on the peak: orchard, sanctum, hostileFlag
                       machinery ("heavensGlory.hostile") + ringGlow horizon band
  main.ts              boot + GAME FLOW: save migrations (v2..v4), canvas/input,
                       title -> (creation | continue) -> world; autosave; __poaTest hook
  screens.ts           title + character creation (in-canvas, keyboard-driven)
  world.ts             World class: built from a MapEntry. Owns map/player/enemies/
                       shrines/NPCs, combat wiring, HUD, death/respawn (CURRENT map's
                       spawn), aura sight, spirit panel + journal page, StoryState,
                       DialogueUi, CutscenePlayer (implements CutsceneHost through an
                       adapter), the shared Effect executor runEffect(), map
                       transitions (300ms fade each side), hostile-ground HUD line,
                       ring-glow band, buildSave()
  dialogueUi.ts        M4a: text box presentation over systems/dialogue.ts — letter
                       reveal (E skips), W/S+E choices; also the cutscene "say" mode
                       (say()/sayConfirmed()). World freezes the sim while active.
  npc.ts               M4a: NpcDef-driven NPC entity — parameterized palettes
                       (NPC_PALETTES), stand/wander/face-player, name label data,
                       GUARD variant (solid blocker until a story flag, one-time
                       step-aside). World draws prompts and starts dialogueId.
  paths.ts             the four origins as DATA (kits, lore, placeholder names)
  player.ts            Player (a Combatant): origin-aware stats, 8-dir movement,
                       cycling aura, cloak/mantle/parry visuals, setMap() for swaps
  playerCombat.ts      J combo, Space dodge, C-hold cycling, K/L/U/I slots, setMap()
  techniques.ts        ALL technique data; registerGameTechniques()
  techniqueEntities.ts MadraBolt, ExpandingRing, SlowPool, StoneWallSegment
  advancementFlow.ts   shrine prompts/E, Iron elixir state machine, stage-up
                       application + ceremonies, Empty Palm learn trigger, and M4a's
                       giveStage(stage, title?, sub?) — the story-gated advancement
                       entry point (Jade/Gold land through the same ceremony path)
  auraSight.ts         Copper benefit: vital-aura motes + screen bloom (rebuilt per map)
  spiritPanel.ts       Tab panel drawing + M4a drawJournalPanel (Q flips pages):
                       active quests w/ objectives (current highlighted) + completed
  shrine.ts            Shrine entity + spawnShrines(spots) from MapEntry data
  pickups.ts           ScalePickup (forged-madra currency)
  remnantStub.ts       RemnantStub — TODO(M5) real Remnant system
  enemies/dreadbeast.ts  AI base (aggro/leash/separation/daze/madra-lock/slow)
  enemies/slitherer.ts boar.ts stalker.ts   the three beasts
  enemies/spawns.ts    spawnEnemies(MapEntry.enemies) — generic, registry-driven

src/content/           narrative CONTENT (authoring layer; M4b owns this)
  seed.ts              // SEED — placeholder quest/dialogues/NPCs/cutscene proving
                       the machinery; M4b REPLACES it. registerSeedContent() is
                       called once from main.ts.

tools/                 serve.mjs (static server); npm run check =
                       checkmap.mjs (valleyWilds layout + collision, via registry) +
                       checkworld.mjs (registry/transition graph integrity) +
                       checkcombat.mjs + checkadvance.mjs +
                       checkstory.mjs (dialogue/quest/cutscene unit tests) +
                       smoke.mjs (creation -> village seed story -> transition ->
                       combat -> Copper -> Iron, save v4) +
                       smokeUnsouled.mjs (Empty Palm learn path) +
                       smokeContinue.mjs (v2->v4 migration + Continue restore)
```

Render order each frame: ground+flat decor → y-sorted (entities merged with
tree/rock decor) → fx → aura-sight motes → shrine prompt → NPC name/E-Talk
prompts → debug world pass → HUD (ring-glow band, Copper tint, panel, hostile
line, arrival caption, channel/ceremony overlays, spirit/journal panel,
transition+cutscene fade, dialogue box, death overlay) → debug screen pass.

## Game flow (M4a)

`main.ts` owns a single GameLoop. Until a `World` exists it ticks/draws
`Screens`. New game → `World` built on `START_MAP` ("weiVillage") at its
spawn; Continue → the save's `player.map` (validated against the registry,
unknown ids fall back to START_MAP) at the saved position. `__poaTest`
exposes world internals (plus `story`, `dialogueUi`, `cutscene`, `npcs`,
`warp(mapId, entry?)`) for the headless harnesses. Headless note: never use
canvas gradients/measureText — the test shim's 2d context is a no-op proxy.

### World update gating (the freeze rules)

Per-tick order in `World.update`: debug toggle → fades/transition timers
(always advance) → **cutscene branch** (DialogueUi serviced for `say`,
CutscenePlayer stepped, camera glides; everything else frozen) → **dialogue
branch** (DialogueUi only) → **transition branch** (frozen during the fade)
→ panel keys → hit-pause gate → NPC interact (E consumes the press before
the shrine flow sees it) → combat → entities → fx → advancement → death →
aura sight → map/camera → transition-zone check. `main.ts` calls
`input.endFrame()` last, always.

### Map transitions

A `TransitionDef` is a tile-rect trigger zone + destination map id + named
entry. When the player's center enters a zone: 300ms fade out → the old
map's entities are purged (player survives), the destination is built via
`entry.build()`, per-map content (enemies/shrines/NPCs) respawns, the player
lands on the named entry (with facing), AuraSight/camera rebuild → 300ms
fade in. The `moveMap` story Effect takes the same path (entry `""`/omitted
= the map's spawn). Respawn after death uses the CURRENT map's spawn.
Per-map vs persistent: enemies/NPCs/shrines rebuild every entry; story
flags/quests/scales/advancement NEVER reset. `onEnter` cutscenes fire once,
guarded by their `onceFlag` (set when fired — even a migrated save sees an
unseen scene exactly once).

## Authoring narrative content (the M4b how-to)

Everything below lives in `src/content/*` (see seed.ts for working
examples) and uses only registries + the two map hooks — no engine edits.

**Quest** — `registerQuest({ id, title, description, objectives, reward?,
autoStart? })`. Each objective has a `flag`: setting that flag (from any
dialogue/cutscene/effect) completes it; the quest auto-completes when all
objective flags are truthy and `reward` effects run through World. The
journal (Tab, then Q) renders active quests with the first incomplete
objective highlighted. `autoStart: true` = started for fresh characters.

**Dialogue** — `registerDialogue({ id, start, nodes })`; point an NPC's
`dialogueId` at it. Nodes: `speaker`, `text` (`{playerName}`/`{clanName}`
substitution), optional `effects` (run once on entry), `choices` (label +
optional `conditions` to show + `effects` on pick + `next`; omit `next` to
end), `branches` (condition-routed, checked before `next`). Conditions:
`flag` (truthy/equals/gte), `stageGte`, `origin`, `scalesGte`.

**Effects** (shared vocabulary, executed by `World.runEffect`): `setFlag`,
`reputation`/`resolve`/`knowledge`, `give/takeScales`, `startQuest`,
`completeObjective`, `giveItem` (a flag `item.<id>` until M5 inventory),
`heal`, `moveMap`, `cutscene`, and `giveStage` — story-gated advancement
that runs the real ceremony path (this is how Jade/Gold land).

**NPC** — `addMapNpcs(mapId, [{ id, name, tx, ty, sprite, facing?,
behavior?, dialogueId?, guard? }])`. `sprite` is a palette (use
`NPC_PALETTES.villagerA…` or raw hex); `behavior.wanderRadius` makes them
stroll; `guard: { untilFlag, stepAside? }` makes a solid blocker that stands
down (and sidesteps once) when the flag turns truthy. World draws the name
label and "E — Talk" and starts `dialogueId` on E.

**Cutscene** — `registerCutscene(id, steps)` then either
`setMapOnEnter(mapId, { cutscene, onceFlag })` or a `{ kind: "cutscene" }`
effect. Steps (see systems/cutscene.ts): `walk` (collision-aware),
`face`, `say` (waits for E), `wait`, `fadeOut/fadeIn`, `shake`,
`spawn/despawn` (def = an NpcDef), `panCamera/resetCamera` (camera glides on
its follow lerp), `effect`, plus `setFlag/giveStage/moveMap` sugar.

After authoring, run `node tools/checkworld.mjs` — it asserts NPC spots are
walkable, dialogueIds resolve, onEnter cutscenes exist, and quest objective
flags are present.

## How to add a tile / map

Tile: add ASCII art + palette in `src/game/tiles.ts`, append an id to `T` and
a `TileDef` to `TILESET` at the same index. Map: copy `maps/weiVillage.ts` —
author an ASCII grid (legend in `maps/builder.ts`, overridable per map),
export a `MapEntry` with spawn/entries/transitions/enemies/shrines, and
register it in `maps/registry.ts`. Link it with `TransitionDef`s from/to
existing maps (both directions). `tools/checkworld.mjs` then validates the
whole graph automatically — spawn/entries/shrines/NPC walkability,
zone reachability from spawn, and destination map+entry existence.

## How to add a sprite / entity / enemy / technique / Path

Unchanged from M3 — see sprites.ts (definePixelFrames + Animation),
entity.ts (extend Entity, moveAndCollide, renderX/renderY), dreadbeast.ts
(extend Dreadbeast, implement think(), add a row to the MapEntry's
`enemies`), techniques.ts (TechniqueDef + register + reference from a kit in
paths.ts), paths.ts (PathDef drives creation screen/slots/panel).

## Save schema (v4)

`src/engine/save.ts` is at **v4**:
- `player`: x, y, **map (registry id)**, facing, stage label
- `flags`: ALL story flags (StoryState.flags — never reset)
- `systems.combat` { health, madra, scales }
- `systems.character` { origin, name }
- `systems.advancement` { stage, madraFills, basicHits, emptyPalmLearned }
- `systems.story` (StorySave) { reputation, resolve, knowledge,
  questsActive, questsCompleted } — quest *progress* is derived from flags,
  so only the id lists persist.

Migrations live in main.ts: v1→v2 (combat bucket), v2→v3 (mint a Wei
character), v3→v4 (old/unknown map ids → "valleyWilds", which kept
testValley's exact layout and coordinates; empty story bucket). For new
state: extend `World.buildSave()`, bump `SAVE_VERSION`, register a
migration. `main.ts` autosaves every 10s and on pagehide.

## Where systems plug in

- Combatants: extend `Combatant`, call `tickCombat(dt, map)` first in
  update(), render via `drawWithEffects()`.
- Death drops are game policy: `combat.onDeath` in world.ts.
- Story conditions never read game objects directly — only the `StoryQuery`
  World provides (flags/stage/origin/scales). Story effects never write
  game objects directly — only `World.runEffect`. Keep it that way so
  checkstory.mjs keeps running headless.
- Advancement balance lives ONLY in src/systems/advancement.ts; runtime
  rules (refunds, channel breaks) in src/game/advancementFlow.ts; the
  story-gated entry point is `AdvancementFlow.giveStage()`.
- Stage-gap balance: ALL math in `computeDamage()` (src/systems/stats.ts).
- Headless testing: `main.ts` exposes `globalThis.__poaTest` (screens,
  world getters, story/dialogueUi/cutscene/npcs, `warp()`, classes…) for
  tools/smoke*.mjs; drive the real title/creation UI with key events before
  touching world internals. Harness counts (M4a): checkmap 25, checkworld
  86, checkcombat 61, checkadvance 38, checkstory 54, smoke 108,
  smokeUnsouled 29, smokeContinue 24 — 425 total.
