# Medieval Kingdom — Minecraft Bedrock Add-On

A medieval-themed add-on for **Minecraft Bedrock Edition** (Windows 10/11, Pocket,
Console, 1.20+). It adds medieval mobs, a tower you can raise with one command,
and **two custom bosses** with full geometry, textures and animations:

- 🛡️ **Animated Armor** — an empty suit of armor with **3 attacks**
- 🐉 **Fire Dragon** — a flying dragon with **5 attacks**

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
| `/function build_tower` | Builds a 9×9 stone-brick watchtower where you stand and posts two knight guards |
| `/function summon_armor` | Spawns the Animated Armor boss in front of you |
| `/function summon_dragon` | Spawns the Fire Dragon above and in front of you |

The two medieval mobs (Knight, Archer) also **spawn naturally at night** on the
surface. The bosses are summon-only.

---

## The bosses

### 🛡️ Animated Armor (`md:animated_armor`)

An empty suit of dark iron. 320 HP. Three attacks are chosen at random on a
2–3.5 s timer:

1. **Hammer Swing** — a quick overhand strike (`attack_swing` animation, ~3.5 block reach).
2. **Ground Smash** — raises the hammer and slams it down, sending out a
   shockwave ring (`attack_smash` animation + `knockback_roar` particle, ~5.5 block radius).
3. **Spin** — holds the hammer out and spins a full 720°, hitting everything in a
   radius (`attack_spin` animation, ~4.5 block radius, longest window).

**Armor-breaking damage model** (exactly as requested):

| Stage | HP range | Incoming damage taken | Look |
|---|---|---|---|
| 0 — full plate | 320–241 | **20%** (takes *way* less damage) | intact, cyan eyes |
| 1 — cracked | 240–161 | 40% | intact |
| 2 — breaking | 160–81 | 70% | intact |
| 3 — shattering | 80–0 | **100%** (full damage) | switches to the **broken** texture, ember-orange eyes |

So the more damage you deal, the more the armor gives way — early hits barely
scratch it, and once the plates are failing it takes full damage and dies when
the last stage is destroyed. This is implemented with `minecraft:damage_sensor`
`damage_multiplier` values that swap via component groups at each HP threshold,
and a synced entity property (`md:stage`) that drives the texture swap in the
render controller.

### 🐉 Fire Dragon (`md:fire_dragon`)

A flying fire dragon. 350 HP. Five attacks, chosen at random on a 3–5 s timer:

1. **Fireball** — spits a single `md:dragon_fireball` (`fireball` animation).
2. **Volley** — a burst of ~6 fireballs while sweeping its head (`volley` animation).
3. **Dive** — charges down onto the target and pulls back up (`dive` animation +
   `charge_attack` + splash damage).
4. **Tail Whip** — sweeps its segmented tail to strike everything beside it
   (`tail_whip` animation, ~5 block radius).
5. **Fire Sphere** — rears back and conjures a huge translucent red sphere
   (`sphere_charge` animation). The sphere entity (`md:fire_sphere`) **expands for
   ~2 seconds, then explodes**, setting the area alight and dealing blast damage.

Projectiles: `md:dragon_fireball` (damaging, sets fire) and `md:fire_sphere`
(the expanding blast) are their own entities so their timing and visuals are
self-contained.

---

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
