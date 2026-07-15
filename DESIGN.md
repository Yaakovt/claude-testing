# LEGENDS OF NORVENNA — Design Document
*(The "upgraded prompt" — full specification this game is built against.)*

## Vision
A complete, original, professional-quality 2D monster-catching RPG in the style of a
mainline Gen-3 Pokémon game (Ruby/Sapphire/Emerald era), playable in any web browser,
with roughly 1–1.5 hours of main-story gameplay. **Everything is original** — no
copyrighted names, designs, sprites, sounds, or team concepts.

## Technical pillars
- **Platform:** HTML5 + Canvas + WebAudio, zero dependencies, runs from `index.html`.
- **Resolution:** native 240×160 (GBA), integer-scaled to fit any monitor, letterboxed —
  never stretched, never blurry (`image-rendering: pixelated`).
- **Controls (GBA-style):** Arrows/WASD = D-pad, Z/Enter = A, X/Esc = B, Enter = Start.
- **Art:** hand-crafted pixel art rendered by per-asset drawing code through a shared
  Gen-3-style toolkit (dark outlines, 3-tone shading ramps, top-left key light, dither).
  Every fakemon has a unique **front sprite** and a true **back sprite** (actually
  facing away — back of head, tail toward camera).
- **Audio:** original chiptune engine (square/triangle/noise channels). Unique themes for
  title, towns, routes, wild/trainer/gym/Team Ionar/Elite Four/Champion battles, caves,
  surfing, evolution. Every species has a unique synthesized cry. Move & UI SFX.
- **Save:** localStorage, save anywhere from the Start menu.

## World: the Norvenna Region
Cold northern coastal region beneath a permanent aurora. The aurora is the sleeping
radiance of **AURORYX** (Dragon/Electric), the Storm-Heart of the North.

### Settlements (9 towns + League)
| # | Town | Biome | Gym |
|---|------|-------|-----|
| — | Frosthollow Village | taiga edge | none — Professor Aspen's lab, starters |
| 1 | Birchwick Town | lumber taiga | Astrid — Normal |
| 2 | Mossmere Town | mossy wetland forest | Eirik — Grass |
| 3 | Tidesend Harbor | fishing port | Runa — Water |
| 4 | Emberfall City | geothermal springs | Brandt — Fire |
| 5 | Lumenveil City | aurora highlands | Sylja — Psychic |
| 6 | Irondeep City | mining city | Torvald — Steel |
| 7 | Glacierholm | glacier shelf | Yrsa — Ice |
| 8 | Stormcrest City | foot of the Sky Spire | Signe — Dragon |
| — | Aurora Plateau | league | Elite Four + Champion |

Routes connect towns; dungeons: Whisperwood, Tidegrot Cave (Flash), Cinder Vents,
Ionar Depot, Irondeep Mines (Strength puzzles), Glacier Cavern (ice-slide puzzle),
Sky Spire (climax), Victory Road.

### Story spine (Team Ionar)
Team Ionar — engineers-turned-zealots in storm-grey coats — believe Auroryx's waking
heartbeat can charge the entire sky with free, infinite energy. Their plan: awaken it
atop the Sky Spire. Waking the Storm-Heart means a permanent global lightning superstorm.
Story beats: depot theft → grunts harvesting "aurora residue" → seizing the Lumenveil
observatory → draining the glacier shrine → final ascent of the Sky Spire, where the
player calms/battles/catches Auroryx after defeating Boss **Magnus Voll**.
- **Rivals:** Kai (friendly childhood friend, picks the starter weak to yours) and
  Vera (arrogant prodigy, picks the starter strong against yours).
- **Champion (secret):** Sigrid — the easygoing ranger who helps you on early routes.
- **Elite Four:** Corvin (Dark), Freyda (Fighting), Mara (Ghost), Liv (Fairy).

### Sidequests (10+) & puzzles
Lost moss-fawn rescue, lighthouse keeper's lamp, herbalist's gathering list, miner's
lost pick, ferryman's letter, aurora photographer, gym leader rematch notes, fossil
revival, ghost in the old lodge, the deer-spirit shrine. Puzzles: ice-slide floors,
Strength boulders, Flash-dark caves, gym switch/maze puzzles, Ionar warp-panel base.

## Monsters ("fakemon")
- **~100 species**, all original designs/names. Coverage rule: **≥4 species per each of
  the 18 types** (dual types count for both). Audit script enforces this.
- Evolution chains of varied lengths: standalone (0 evos), 2-stage, and 3-stage lines;
  level, stone, and friendship triggers.
- Starters (given by Professor Aspen, mandatory pick, Norse-mythic):
  - Grass: **Trollsprout → Bryteknott → Jotunwald** (seedling troll → forest jötunn)
  - Fire: **Cindrel → Pyrolisk → Fafnirn** (fire salamander → lava lindworm)
  - Water: **Selkip → Selkora → Krakelott** (selkie pup → storm kraken-seal)
- Legendary: **Auroryx** (Dragon/Electric), catchable at the Sky Spire climax.
- Every species: base stats, 1–2 types, ability, level-up learnset, TM compat,
  evolution data, Pokédex entry (species + flavor + height/weight), unique synthesized
  cry, unique front & back sprite, catch rate, EXP curve, gender ratio.

## Battle engine (full mainline depth)
18-type chart (verified against canon matchups), physical/special split, STAB,
critical hits, stat stages ±6, natures, status conditions (PSN/TOX/BRN/PAR/SLP/FRZ),
weather (rain/sun/hail/sandstorm), priority brackets, accuracy/evasion, multi-hit,
recoil, drain, flinch, confusion, protect, abilities with in-battle effects, proper
catch-rate formula (ball modifiers), Gen-3 EXP formula & level curves, **escape formula
based on speed (never guaranteed)**, unique per-move animations, per-environment battle
backgrounds, switch/bag/run menus, trainer AI that considers matchups.

## Items
Poké-ball equivalents (Orb line: Fieldorb/Greatorb/Ultraorb), potions/status heals,
revives, repels, evolution stones, key items, **all field HMs** (Cut, Fly, Surf,
Strength, Flash, Rock Smash, Waterfall) and **20+ TMs**, held items for bosses,
Pokémarts with tiered stock, Pokécenter full-heal stations in every town.

## Presentation
Opening animation (aurora over snowfield → Auroryx silhouette → title), title screen,
new-game intro with Professor Aspen, **name entry + gender select** (distinct male/female
player sprites, 4-direction walk cycles), Pokédex UI with sprites & entries, party/summary
screens, bag, trainer card, options. Enterable buildings with full interiors. Animated
tiles (water, flowers, aurora). All move animations unique.

## Quality bars
- Looks like a Gen-3 game: outlined, shaded pixel art — **no "pile of squares"**.
- Back sprites genuinely show the monster's back.
- Type matchups exactly correct; audit script in `tools/`.
- Runs at 60fps; no stretching at any window size.
- Code organized like a professional project: `js/core`, `js/data`, `js/battle`,
  `js/overworld`, `js/ui`, `js/maps`, documented, consistent style.
