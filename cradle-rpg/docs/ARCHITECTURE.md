# Architecture (as of M4b — the full Unsouled-arc story as content)

Zero-dependency TypeScript + Canvas. `npm run build` (strict tsc) compiles
`src/` to `dist/`; `index.html` loads `dist/game/main.js` as a native ES
module — **all imports must use explicit `.js` extensions**. `npm run check`
runs headless sanity tests (map integrity, world-graph integrity, collision,
combat math, advancement math, narrative-system unit tests, narrative-REGISTRY
static integrity, boot + Act-1-story + combat + advancement smoke tests, the
Unsouled learn path, continue/migration, and the three endings driven through
the real runtime) — keep it green (765 assertions as of M4b).

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
  maps/registry.ts     MapEntry registry — id/name/build()/spawn/named entries/
                       transitions (tile-rect trigger zones)/enemies/shrines/npcs/
                       hostileFlag/onEnter list/ringGlow; START_MAP; M4b content
                       hooks: addMapNpcs() / addMapEnemies() / addMapEntries() /
                       addMapOnEnter() (onEnter is now a LIST of
                       { cutscene, onceFlag, when?: Condition[] } — first
                       eligible entry plays; failing `when` leaves it unfired)
  maps/weiVillage.ts   45x35 START_MAP: family courtyard, festival arena, elder's
                       hall, the guarded south gate (safe ground — no enemies)
  maps/valleyWilds.ts  40x30 — the old testValley layout, same coordinates, plus a
                       west opening (village) and north opening (trail); 7 beasts
  maps/samaraTrail.ts  40x40 switchback climb, snow line, 2 hollow stalkers
  maps/heavensGlory.ts 45x30 school on the peak: orchard, sanctum, hostileFlag
                       machinery ("heavensGlory.hostile") + ringGlow horizon band
  main.ts              boot + GAME FLOW: save migrations (v2..v4), canvas/input,
                       title -> (creation | continue) -> world; autosave; __poaTest
                       hook; M4b ENDING FLOW: a finale cutscene sets the numeric
                       "ending.played" flag (1..3) -> main persists, tears the
                       world down, shows the EndingScreen, returns to the title
                       ("ending.acknowledged" stops a continued save re-showing it)
  screens.ts           title + character creation (in-canvas, keyboard-driven)
  endingScreen.ts      M4b: the finale card — ending title + epilogue + the
                       axes/choice summary (data from content/endings.ts)
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
  npc.ts               NpcDef-driven NPC entity — parameterized palettes
                       (NPC_PALETTES), stand/wander/face-player, name label data,
                       GUARD variant (solid blocker until a story flag, one-time
                       step-aside). M4b: ifFlag/unlessFlag — story-conditional
                       presence, filtered by World on every map build.
                       World draws prompts and starts dialogueId.
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
  enemies/spawns.ts    spawnEnemies(MapEntry.enemies) — generic, registry-driven.
                       M4b EnemySpawn extras: ifFlag/unlessFlag (story-conditional
                       spawns, checked on every map build), onDeathFlag (World
                       sets it when the beast dies — duel wins, hunt targets,
                       waves), sealed (permanent madra-lock: the halfsilver
                       trick), name (displayName override, "Wei Jin Amon")

src/content/           the STORY as DATA (M4b) — registerStoryContent() is called
                       once from main.ts; only the public authoring surface is used
  index.ts             registerStoryContent() -> the four act registrars
  act1.ts              THE FESTIVAL: the family (Seisha/Jaran/Kelsa, origin-
                       mirrored framing), Patriarch Sairus, the exhibition duel
                       (trick/honest/refuse/sabotage), Li Markuth's descent,
                       Suriel's warning (accept/reject/tell-family)
  act2.ts              THE DISCIPLE: Yerin's trust/rival/betray stances, the
                       "Blood on the Snow" hunt, Disciple Verren (the bribe),
                       the Jade-granting cutscene (giveStage gated stageGte Iron)
                       + the "Temper Your Body" shrine quest below Iron
  act3.ts              HEAVEN'S GLORY: orchard + ancestor's hall quests, Elder
                       Whitehall's TURN (hostileFlag + friendly-NPC despawn +
                       enforcer spawns via the content hooks), the Treasure-Hall
                       theft (item flags), the flight down Mount Samara
  endings.ts           the "Leave the Valley" gate choice + three endings
                       (E1 road-with-Yerin / E2 gate-defense wave -> Gold /
                       E3 alone), ENDINGS cards + endingSummary() for the screen

tools/                 serve.mjs (static server); npm run check =
                       checkmap.mjs (valleyWilds layout + collision, via registry) +
                       checkworld.mjs (registry/transition graph integrity) +
                       checkcombat.mjs + checkadvance.mjs +
                       checkstory.mjs (dialogue/quest/cutscene unit tests) +
                       checknarrative.mjs (M4b: static integrity of the WHOLE
                       story registry — graph targets, effect refs, objective-
                       flag coverage, cutscene entity refs, ending reachability) +
                       smoke.mjs (creation -> ACT 1: opening, family quest, the
                       honest duel, Markuth/Suriel, Act-2 quest start ->
                       transition -> combat -> Copper -> Iron, save v4) +
                       smokeUnsouled.mjs (Empty Palm learn path) +
                       smokeContinue.mjs (v2->v4 migration + Continue restore) +
                       smokeEndings.mjs x3 (ENDING=1|2|3: Acts 2-3 + each
                       ending through the real runtime, to the title card)
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

Everything below lives in `src/content/*` (act1.ts is the richest working
example) and uses only registries + the map content hooks — no engine edits.

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
behavior?, dialogueId?, guard?, ifFlag?, unlessFlag? }])`. `sprite` is a
palette (use `NPC_PALETTES.villagerA…` or raw hex); `behavior.wanderRadius`
makes them stroll; `guard: { untilFlag, stepAside? }` makes a solid blocker
that stands down (and sidesteps once) when the flag turns truthy;
`ifFlag`/`unlessFlag` make presence story-conditional (filtered on every map
build — pair with a `moveMap` back onto the same map to "re-cast" a scene
mid-story, the way the duel and the hostile turn do). World draws the name
label and "E — Talk" and starts `dialogueId` on E.

**Enemy spawns** — `addMapEnemies(mapId, spawns)` appends to the map's
table. Beyond kind/tx/ty a spawn may carry `ifFlag`/`unlessFlag`
(conditional, e.g. the duel rival or the hostile-school enforcers),
`onDeathFlag` (World sets it on the kill — quest objectives), `sealed`
(spawn with madra permanently locked — the halfsilver trick) and `name`.
Spawns are evaluated on map (re)build, so a flag flipped mid-map needs a
`moveMap` rebuild to take effect.

**Entries** — `addMapEntries(mapId, { arena: { x, y, facing } })` adds named
arrival points (cutscene `moveMap` targets) without touching map modules.

**Cutscene** — `registerCutscene(id, steps)` then either
`addMapOnEnter(mapId, { cutscene, onceFlag, when? })` or a
`{ kind: "cutscene" }` effect. A map's onEnter list is checked in order;
the first entry whose `onceFlag` is unset and whose `when` conditions pass
fires (and burns its onceFlag) — a failing `when` leaves it armed for later
(this is how the Act-3 flight variants share "a3.sawFlight"). Steps (see
systems/cutscene.ts): `walk` (collision-aware), `face`, `say` (waits for E),
`wait`, `fadeOut/fadeIn`, `shake`, `spawn/despawn` (def = an NpcDef;
`despawn` also removes map NPCs by def id), `panCamera/resetCamera`,
`effect`, plus `setFlag/giveStage/moveMap` sugar.

**Flags the GAME sets** (the documented game events; everything else is
content data): `reached.<stage>` (World.onStageUp — "reach Iron"
objectives), spawn-table `onDeathFlag`s (World.combat.onDeath), and the axis
mirrors `axis.resolve` / `axis.knowledge` / `axis.rep.<faction>` (World
keeps them equal to the running axis totals so dialogue conditions can gate
on `{ kind: "flag", key: "axis.knowledge", gte: 1 }`).

**Endings** — a finale cutscene sets `{ kind: "setFlag", key:
"ending.played", value: 1|2|3 }`; once the scene ends, main.ts persists,
shows the matching ENDINGS card from `content/endings.ts` (title + epilogue
+ `endingSummary()`), and returns to the title.

After authoring, run `node tools/checkworld.mjs` (spots walkable,
dialogueIds resolve, onEnter cutscenes exist, objective flags present) AND
`node tools/checknarrative.mjs` — the deep static pass: every dialogue
next/branch/choice target exists and is reachable (trees capped at 12
nodes), every effect's quest/cutscene/map+entry reference resolves, every
quest objective flag is set somewhere (content data, spawn-table death
flags, or the documented game-event allowlist), every cutscene entity ref is
player/an NPC/a scene spawn, and all three endings stay REACHABLE via a
fixpoint walk over the declared flag effects.

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
  endingScreen, world getters, story/dialogueUi/cutscene/npcs, `warp()`,
  classes…) for tools/smoke*.mjs; drive the real title/creation UI with key
  events before touching world internals. Harness counts (M4b): checkmap 25,
  checkworld 142, checkcombat 61, checkadvance 38, checkstory 54,
  checknarrative 139, smoke 136, smokeUnsouled 31, smokeContinue 24,
  smokeEndings 40+43+32 — 765 total. Smoke coverage note: smoke.mjs drives
  ACT 1 end-to-end through the real UI (opening, family, the honest-duel
  branch, Markuth/Suriel, the Act-2 quest start); smokeEndings.mjs drives
  Acts 2-3 and each ending at runtime (Act 1 fast-forwarded by flag);
  branch COMBINATIONS beyond those four routes are covered by
  checknarrative's static reachability walk — by design, not omission.
