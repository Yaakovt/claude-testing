# Norvenna — continuation roadmap

The engine and all systems are complete and tested. What remains is **content
authoring** using patterns already established. Everything below plugs into
existing systems with no engine changes.

## Status
- **Playable now:** Frosthollow → Route 1 → Birchwick (Gym 1, Normal) → Route 2
  (+ Whisperwood cave) → Mossmere (Gym 2, Grass) → Route 3 → Tidesend (Gym 3, Water).
- **Defined but not yet mapped:** Gyms 4–8, the Elite Four, Champion Sigrid, the
  rivals Kai & Vera, and Team Ionar's arc — all already exist as trainers in
  `js/data/trainers.js`.

## How to add the remaining gyms/towns (repeat the established pattern)
1. **Town map** — in `js/maps/world.js`, copy a town IIFE. Use `building(g,x,y,roof,'C'|'M')`
   to stamp Center/Mart/Gym; keep the gym off the central N-S path. Wire warps to
   the interiors and to the adjoining routes (both directions).
2. **Gym interior** — in `js/maps/interiors.js`, copy a `*_gym` map; exit warp is
   `back(doorX,doorY)`. Put the leader NPC at top with `script:'gym_<name>'` and a
   couple of `trainer:` helpers.
3. **Leader + trainers** — add to `js/data/trainers.js` (`ai:'smart'`, a 3–4 mon party
   scaled to the badge number).
4. **Scripts** — in `js/maps/story.js`, add `gym_<name>` (gate on the previous badge,
   start the battle, `giveBadge(n,...)`, grant the HM, hand a TM). Add townsfolk lines
   to the `chats` map.
5. **Validate**: `node tools/audit.mjs` and `node tools/mapcheck.mjs` (must both pass),
   then `node tools/townview.mjs <mapId> <x> <y> out.png` to eyeball it.

### Remaining gyms (leaders + types to slot in)
4 Emberfall City — Brandt (Fire) · 5 Lumenveil City — Sylja (Psychic) ·
6 Irondeep City — Torvald (Steel) · 7 Glacierholm — Yrsa (Ice) ·
8 Stormcrest City — Signe (Dragon). Suggested biomes/battleEnv: `volcano`,
`aurora`, `cave`, `snow`, `aurora`.

## Team Ionar arc (story spine)
Beats already have hooks (`ionar_grunt_r2`, `ionar_boss`=Magnus Voll). Add: depot
theft (Birchwick area), observatory seizure (Lumenveil), glacier-shrine drain
(Glacierholm), Sky Spire ascent. Each is a script that starts grunt battles and
sets flags; reuse `Game.startTrainerBattle`.

## Legendary encounter (Auroryx)
At the Sky Spire climax, after beating Magnus Voll, call:
`Game.startWildBattle('auroryx', 50, 'aurora')` from a script (give the player the
`storm_charm` key item first for flavor). Catching is already wired — Auroryx has
`catchRate:3`, so hand out Ultraorbs beforehand.

## Elite Four + Champion
Build the Aurora Plateau map: five rooms chained by warps, each with an
`e4_*`/`champion_sigrid` leader NPC gated on the 8th badge. Trainers already exist.
On beating Sigrid, set `Game.flags.champion = true` and roll credits (a simple
scripted text sequence + `Music.play('victory')`).

## Postgame ideas (cheap wins)
- Fossil revival at a lab NPC: the player holds `fin_fossil`/`tusk_fossil`; a script
  calls `Scripts.giveMon('coralith'|'mammorost', 20)`.
- Gym-leader rematches; a Battle Tower-style streak using random `Trainers`.
- Roaming/second legendary.

## Megas (leave for Fable — needs sprites)
Add `mega:{to, stone, base, types?}` to eligible finals + a mega sprite pair each,
and a "Mega Evolve" battle action. Deferred because each needs new art.
