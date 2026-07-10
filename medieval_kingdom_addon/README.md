# Medieval Kingdom — Minecraft Bedrock Add-On

A medieval-themed add-on for **Minecraft Bedrock Edition** (Windows 10/11, Pocket,
Console, 1.20+). It adds medieval mobs, natural structure generation, relic
powers, and **five custom bosses** with full geometry, textures and animations:

- 🛡️ **Animated Armor** — an empty suit of armor that sheds plates as it breaks
- 🐉 **Fire Dragon** — a flying dragon with 3 elemental phases and super attacks
- 💀 **Lich King** — a blink-teleporting necromancer in a haunted graveyard
- 🗿 **Siege Golem** — a walking siege engine whose armor cracks off plate by plate
- ⚔️ **Black Knight** — a duelist champion who loses shield, plume and cape as you win

> This is a Bedrock add-on (behavior pack + resource pack), which is the format
> where models (*geometry*), *textures* and *animations* are authored as the JSON
> and PNG files you see here — the same files Blockbench edits.

---

## Contents

```
medieval_kingdom_addon/
├─ behavior_packs/medieval_bp/      # AI, stats, attacks, spawn rules, functions
│  ├─ entities/                     # knight, archer, animated_armor, fire_dragon, projectiles
│  ├─ functions/                    # build_tower, summon_armor, summon_dragon
│  └─ spawn_rules/                  # night spawns for the medieval mobs
├─ resource_packs/medieval_rp/      # how everything looks & moves
│  ├─ models/entity/                # *.geo.json  (geometry)
│  ├─ animations/                   # *.animation.json
│  ├─ animation_controllers/        # state machines that pick the right animation
│  ├─ render_controllers/           # texture / geometry selection
│  ├─ entity/                       # client entity definitions (ties it together)
│  └─ textures/entity/              # *.png
└─ tools/generate_textures.py       # regenerates the placeholder textures
```

## Install

1. Copy `behavior_packs/medieval_bp` into your
   `.../com.mojang/behavior_packs/` folder, and `resource_packs/medieval_rp`
   into `.../com.mojang/resource_packs/`.
   *(Or zip the two `medieval_bp` / `medieval_rp` folders as a `.mcaddon` and
   open it — Minecraft imports both packs automatically.)*
2. Create/edit a world → **Behavior Packs**: add *Medieval Kingdom — Behavior*
   (it will pull in the resource pack as a dependency).
3. Recommended world settings: turn **on** *Holiday Creator Features* /
   *Molang / Upcoming Creator Features* is **not** required — this pack uses only
   stable entity properties available in 1.20+.

## How to play

Give yourself the spawn eggs from the creative inventory (search "Knight",
"Archer", "Animated Armor", "Fire Dragon"), or use the built-in functions:

| Command | What it does |
|---|---|
| `/function build_tower` | Builds a 9×9 stone-brick watchtower where you stand, posts two knight guards, and stocks **three treasure chests** (strongbox, armory, and a gold-trimmed royal vault with diamonds) |
| `/function summon_armor` | Spawns the Animated Armor boss in front of you |
| `/function summon_dragon` | Spawns the Fire Dragon above and in front of you |
| `/function build_village` | Generates a **random medieval village** (jigsaw-style): roads grow from a central plaza in random directions with random branches, and lots pick random rotated buildings — houses, blacksmith, tavern, farms, chapel, market stalls — that follow the terrain. Different every time |
| `/function build_castle` | Builds a full **41×41 castle** around you — crenellated curtain walls, four corner towers, a gatehouse with portcullis, a rear keep — garrisoned by **8 archers on the battlements and 4 knights**, with a **gold treasure mound** in the courtyard where the **Fire Dragon spawns** atop its hoard |
| `/function summon_lich` / `summon_golem` / `summon_champion` | Spawns the Lich King / Siege Golem / Black Knight in front of you |
| `/function build_graveyard` | Raises the Lich King's **haunted graveyard** — iron-fenced yard, gravestones, dead tree, and a stone crypt with soul lanterns and the boss inside |
| `/function build_siege_camp` | Builds a palisaded **siege camp** — trebuchet, tents, supply chest — garrisoned by bandits and the **Siege Golem** |
| `/function build_arena` | Builds a **jousting arena** — tilt barrier, stands, banners, a pavilion with **war horse barding** in its chest — where the **Black Knight** and two war horses wait |
| `/function build_bandit_camp` | Small roadside **bandit camp** — campfire, tents, a chest of stolen goods, three bandits and a stolen war horse |

The two medieval mobs (Knight, Archer) **spawn naturally at night**, and the
**Animated Armor** has a rare natural night spawn on the surface (normal/hard
difficulty).

## Natural structure generation & locating

Structures also **generate naturally as you explore** — no commands needed. The
world is divided into 320-block cells; each cell deterministically rolls whether
it holds a **watchtower**, **armor shrine** (ruin guarded by an Animated Armor),
**random village**, **castle** (complete with dragon and hoard), **bandit camp**,
or one of the rarer boss arenas — **haunted graveyard** (Lich King), **siege
camp** (Siege Golem) or **jousting arena** (Black Knight). When you wander near
one, it rises out of the landscape. Every builder **snaps to real terrain** over
a wide vertical range, so structures sit on the ground even across valleys and
hills — no more floating towers.

Bedrock's vanilla `/locate` can't learn custom structures, so the pack keeps its
own registry of everything generated:

| Command | What it does |
|---|---|
| `/function locate_castle` | Nearest discovered castle — distance, direction, coordinates |
| `/function locate_village` / `locate_tower` / `locate_shrine` | Same for the other structures |
| `/function locate_graveyard` / `locate_siege_camp` / `locate_arena` / `locate_bandit_camp` | Same for the new arenas and camps |
| `/function worldgen_off` / `worldgen_on` | Pause/resume natural generation |

Tip: raise **Simulation Distance** to 6+ so large structures generate fully in
one pass. Structures flatten the terrain where they appear — turn worldgen off
near your base if you're worried.

---

## The bosses

### 🛡️ Animated Armor (`md:animated_armor`)

An empty suit of dark iron. 160 HP behind heavy plate. Three attacks are chosen at random on a
2–3.5 s timer:

1. **Hammer Swing** — a quick overhand strike (`attack_swing` animation, ~3.5 block reach).
2. **Ground Smash** — raises the hammer and slams it down, sending out a
   shockwave ring (`attack_smash` animation + `knockback_roar` particle, ~5.5 block radius).
3. **Spin** — holds the hammer out and spins a full 720°, hitting everything in a
   radius (`attack_spin` animation, ~4.5 block radius, longest window).

Armor-breaking stages are detailed in **“The armor actually breaks now”** below.

### 🐉 Fire Dragon (`md:fire_dragon`)

A flying fire dragon. 280 HP, immune to fire and explosions. Five attacks, chosen at random on a 2.4–4 s timer:

1. **Fireball** — spits a single homing projectile (element follows the current phase).
2. **Volley** — a barrage of ~14 homing fireballs while sweeping its head (`volley` animation).
3. **Dive** — charges down onto the target and pulls back up (`dive` animation +
   `charge_attack` + splash damage).
4. **Tail Whip** — sweeps its segmented tail to strike everything beside it
   (`tail_whip` animation, ~5 block radius).
5. **Fire Sphere** — rears back and conjures a huge translucent red sphere **at the
   player's position**; it expands for ~2 seconds, then explodes.

**Three elemental phases.** The dragon transforms as you hurt it:

| Phase | HP | Skin | Signature |
|---|---|---|---|
| 🔥 Fire | 280–191 | red | fireballs, fire sphere |
| ❄️ Ice | 190–96 | glacial blue | slowing **ice shards**, summons 2 **Frost Wisps** |
| ☠️ Poison | 95–0 | venom green | poisoning **venom globs**, summons 3 **Plague Rats** |

Each transformation bursts with particles and swaps the dragon's texture and
projectiles. Frost Wisps are floating ice orbs that pelt you with slowing shards;
Plague Rats are fast little biters whose bite poisons. The dragon also **lands
beside you** for its tail whip (it slams down with an explosion of particles,
whips, then takes off).

**v2.0 dragon fixes & supers:**

- **Altitude leash** — the dragon can never climb more than ~12 blocks above its
  target. If it drifts higher, the script pulls it back down into the fight, so
  it always stays in bow and melee range.
- **Summons spawn at the player** — Frost Wisps and Plague Rats now materialize
  in a ring **on the ground around you**, not in the sky next to the dragon.
- **Every phase has a super attack.** Fire keeps its exploding **Fire Sphere**;
  the Ice phase gains **Glacial Tempest** (a converging ring of 8 ice shards that
  rain onto your position) and the Poison phase gains **Plague Storm** (9 venom
  globs falling from the sky above you). Every super is **telegraphed for ~2
  seconds** — expanding particle rings, a dragon roar, and an on-screen
  “SHIELD UP!” warning — and every super is **blockable with a raised shield**
  (they're projectiles and explosions, which shields mitigate).

---

## The three new bosses (v2.0)

All three use the same **breaking-stage system as the Animated Armor**: entity
properties drive both the AI *and* the renderer, so parts of the model visibly
shatter off at HP thresholds.

### 💀 Lich King (`md:lich_king`) — 240 HP

Found in **haunted graveyards**. A robed skeleton sorcerer with a gold crown,
a soul staff, and three orbiting soul shards.

- **Soul Bolts** — bursts of 3 homing, withering projectiles.
- **Summon** — raises 2–3 **Skeleton Mages** from the earth around him.
- **Death Nova** — telegraphed for 2+ seconds (soul particles, warning text),
  then a huge non-block-breaking explosion. Shield up or run.
- **Blinks away** when struck (on a cooldown), trailing soul particles.
- Breaking stages: **soul shards shatter** (stage 1) → **crown falls** (stage 2)
  → he becomes a **glowing wraith** who casts nearly twice as fast.
- Drops: **Soul Staff** relic + wearable **Crown of the Lich King** trophy.

### 🗿 Siege Golem (`md:siege_golem`) — 320 HP

Found in **siege camps**. A three-block-tall stone-and-iron construct.

- **Boulder Throw** — lobs arcing boulders (12 dmg) at range.
- **Ground Slam** — telegraphed fist-raise, then a shockwave explosion that
  launches everything within ~6 blocks.
- Breaking stages: **right pauldron** → **left pauldron** (texture cracks,
  molten seams glow) → **chestplate falls, exposing its molten core** — it takes
  30% *extra* damage but speeds up and hits for 16.
- Drops: **Golem Gauntlet** relic + **Molten Golem Core** trophy + iron plating.

### ⚔️ Black Knight (`md:black_knight`) — 200 HP

Found in **jousting arenas** with his war horses. A human-scale duelist.

- Fast sword work with a proper **guard stance** — while guarding he takes only
  15% damage, so wait it out or circle behind.
- **Rally Charge** — telegraphed blade-lower, then he lunges across the arena.
- Breaking stages: **shield breaks** (he can no longer guard!) → **plume knocked
  off** → **cape torn away** — then he **goes berserk**: faster, harder-hitting,
  wreathed in embers.
- Drops: **Champion's Banner** relic + **Champion's Crest** trophy, and sometimes
  his **Knight's Greatsword**.

---

## Relics — player powers (v2.0)

Boss-dropped relics give **you** active abilities (each has a built-in item
cooldown and particle/sound feedback):

| Relic | From | Use it to... |
|---|---|---|
| **Talon of the Fire Dragon** | Fire Dragon | **Dragonfire Dash** — launch forward in a burst of flame, igniting and damaging everything you dash through (6 s cooldown) |
| **Soul Staff of the Lich King** | Lich King | Fire a homing **soul bolt**; **sneak-use** to summon **2 friendly Soul Wisps** that fight monsters for you for 45 s (30 s cooldown) |
| **Gauntlet of the Siege Golem** | Siege Golem | **Ground Slam** — a shockwave ring that damages and launches nearby enemies (10 s cooldown) |
| **Champion's Banner** | Black Knight | **Rally** — you and all players within 12 blocks gain Strength, Speed and Resistance for 20 s (25 s cooldown) |

**Dragonscale armor set** — Dragon Scales now craft the **full set** (helmet,
chestplate, leggings, boots — all render on your body with scale-red armor
layers). Wearing all four pieces grants **permanent Fire Resistance** with a
flicker of ember particles.

**Knight's Greatsword** — craftable from 2 Enchanted Iron Plating + a stick.
11 damage, and every hit **cleaves** everything around your target.

---

## New mobs (v2.0)

| Mob | Where | Behaviour |
|---|---|---|
| 🏴 **Bandit** (`md:bandit`) | Night surface spawns in packs of 2–4, bandit camps, siege camps | Fast dagger rushes; attacks players, villagers *and* knights; drops emeralds/bread/plating |
| 🗿 **Gargoyle** (`md:gargoyle`) | Perched on generated watchtowers & castle towers, rare night flyer | Stone-winged ambusher that dives from above |
| 💀 **Skeleton Mage** (`md:skeleton_mage`) | Summoned by the Lich King, graveyards, rare night spawn | Ranged soul-bolt caster in violet robes |
| 🐴 **War Horse** (`md:war_horse`) | Villages, jousting arenas, plains/savanna herds | **Tameable & rideable** — faster than a vanilla horse. Use **War Horse Barding** (craft: 5 iron plating + 2 leather, or loot the arena pavilion) on it for a fully armored steed: +10 HP, 40% damage reduction, steel barding skin |
| 🔮 **Soul Wisp** (`md:soul_wisp`) | Summoned by your Soul Staff | Friendly spirit that shoots soul bolts at monsters, fades after 45 s |

Projectiles: `md:dragon_fireball` (damaging, sets fire) and `md:fire_sphere`
(the expanding blast) are their own entities so their timing and visuals are
self-contained.

---

## Drops

Both bosses drop a guaranteed custom weapon, a rare trophy, crafting materials,
and vanilla loot. They also award XP.

| Boss | Weapon | Trophy | Materials |
|---|---|---|---|
| Animated Armor | **Warhammer of the Fallen Knight** — 14 dmg, 1200 durability, repairable with iron. **Ability:** every hit slams the ground, knocking the target flying and blasting everything near it with shockwave damage | **Helm of the Animated Armor** — wearable helmet | 2–5 Enchanted Iron Plating + 3–7 iron ingots |
| Fire Dragon | **Searing Fang** — 12 dmg, 900 durability, repairable with Dragon Scales, glowing. **Ability:** every hit ignites the target and scorches everything around it | **Dragon Heart** — eat it for Strength II, Regeneration, Fire Resistance and Absorption (90 s) | 3–8 Dragon Scales + 3–8 gold ingots |

The **Helm of the Animated Armor** is a wearable helmet (5 armor, enchantable,
repairable with iron). **Dragon Scales craft a Dragonscale Chestplate** (7 armor)
— 8 scales in a chestplate pattern at a crafting table. Both **render on your
body when worn** (attachables with custom armor-layer textures): a dark iron
great-helm with a glowing cyan slit, and red dragon-scale plate with ember studs.

Weapon abilities are implemented with the stable Script API (`@minecraft/server`),
so the pack now requires **Minecraft 1.20.60+** (no experiments needed).

All custom items appear in the creative menu too (search their names).

## Difficulty & AI

- Both bosses now **acquire and chase the player** (48–70 block detection, aggressive
  re-targeting) instead of wandering — the Armor pursues and faces you with
  `melee_attack`, the Dragon flies toward you between attacks.
- Attacks hit harder and cycle faster, tuned for a solo player in iron/early-diamond gear.
- The **Fire Sphere** is conjured **at the player's position** (via script): it swells
  there for ~2 seconds, then explodes — run! The dragon itself is immune to
  explosions, so it can never bomb itself out of the sky.
- **Fireballs home in** on their target and fly fast and flat; the **volley** now
  unleashes ~14 fireballs in a sweeping barrage.
- The dragon **lands for its tail whip** — it drops out of the sky, sweeps its tail
  through everything around it, then takes off again — and it hovers lower overall
  so melee players can reach it between attacks.

## The armor actually breaks now

The Animated Armor is a **purpose-built suit** — great helm, breastplate, pauldrons,
faulds, gauntlets and a plume, each a separate bone — not a reskinned player. As you
damage it, plates are physically shed stage by stage:

| Stage | HP | Damage taken | Plates lost |
|---|---|---|---|
| 0 | 160–121 | 30% | full armor, cyan eyes |
| 1 | 120–81 | 50% | plume + left pauldron gone |
| 2 | 80–41 | 75% | faulds + right pauldron gone, texture rusts |
| 3 | 40–0 | 100% | breastplate, visor & gauntlets gone — a shuddering frame with ember-orange eyes, then it falls |

So it shrugs off most early damage, and the more you break it, the more it takes and
the more armor visibly falls away — dying once the last plates are destroyed.

At **stage 2** it sounds a call to arms and **summons two Knight reinforcements**;
at **stage 3** it **enrages** — faster and hitting harder — for its last stand.
Every plate shatter bursts with particles and a metallic crack.

## How the animations are wired

Each boss exposes a **client-synced entity property** `md:state`. When the
behavior pack starts an attack it sets that property (e.g. `md:state = "smash"`).
A **resource-pack animation controller** watches the property
(`query.property('md:state') == 'smash'`) and plays the matching animation, then
returns to idle/fly when the attack's timer ends and the property resets. This is
the clean, testable way to keep server-side AI and client-side animation in sync
without experimental scripting.

## Regenerating / editing textures

The PNGs in `textures/entity/` are **UV-correct placeholder art** generated by
`tools/generate_textures.py` (pure Python, no runtime dependency). Every texture
maps to its geometry, so entities render correctly out of the box. To repaint,
open any `models/entity/*.geo.json` **plus** its texture in
[Blockbench](https://www.blockbench.net/) and edit freely — nothing else needs to
change.

```bash
python3 tools/generate_textures.py   # rebuilds every texture
```

## Tuning notes

Bedrock boss balance is best felt in-game. The obvious knobs:

- **Attack cadence:** the `time` on the `*:ready` timer in each boss entity.
- **Attack damage / radius:** `damage_per_tick` and `damage_range` on the
  `minecraft:area_attack` in each attack component group.
- **Armor toughness:** the `damage_multiplier` values in `armor:stage0…3`.
- **HP thresholds for armor stages:** the `value` in each stage's `on_damage` filter.

All identifiers are namespaced `md:` so they won't clash with other packs.
