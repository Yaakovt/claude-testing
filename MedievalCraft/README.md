# MedievalCraft — a complete medieval texture pack for Minecraft: Java Edition

Every texture the game ships is reskinned toward an aged, hand-built medieval
look: weathered ashlar and mortar, iron-banded oak doors, parchment, forged
tools, and a warm, candle-lit, slightly-desaturated palette across the whole
world — blocks, items, mobs, particles, paintings, the HUD, menus and more.

The pack mirrors vanilla's **entire texture set (3,384 textures)** at native
resolution, so nothing renders as a missing-texture checkerboard.

## What's covered

- **1,083 block** textures — the most-seen ones are bespoke handcrafted pixel
  art (masonry, iron-banded woodwork); the rest are graded through the filter.
- **747 item** textures — the core gameplay items (all tools/weapons in every
  material, armour, ingots, gems, nuggets, sticks, food) are **hand-drawn**
  pixel art (`tools/items_hd.py`) with proper outline + highlight/mid/shadow
  shading and a consistent light source. The hundreds of niche items (potions,
  discs, spawn eggs, smithing templates…) use the warm-graded vanilla icon.
- **577 entity textures** — every mob, plus banners, shields, decorated pots,
  beds, fishing bobbers and equipment, keeping all of vanilla's hand-drawn
  detail recoloured to the aged palette. The **Ender Dragon is reskinned as a
  red fire-dragon** (its scales remapped to a glowing fire gradient).
- **Custom medieval boss bars** — gold-framed banner bars with brass rivets and
  segment notches, in every colour.
- **All animated textures** — water, lava, fire, the nether portal, prismarine,
  sea lantern, magma, campfires, kelp, etc. — preserved as their real
  multi-frame strips with `.mcmeta` timing, so they flow exactly like vanilla,
  just medieval-toned.
- **519 GUI textures** including the full **HUD** you see constantly — hearts,
  hunger, armour, air, the XP bar, hotbar and crosshair — plus menus, buttons
  and container screens (9-slice metadata preserved so panels stretch cleanly).
- **253 particles**, **52 paintings**, **39 mob-effect icons**, **37 map
  markers**, **56 armour-trim** overlays, and the **environment** (sun, moon,
  clouds, weather).

## Install

1. Grab **`MedievalCraft.zip`** (build it with the one-liner below, or use the
   copy provided).
2. Minecraft → **Options → Resource Packs → Open Pack Folder**.
3. Drop the zip in, move MedievalCraft to **Selected**, click **Done**.

`pack.mcmeta` declares a wide `supported_formats` range, so it loads across
modern versions. It was built against the 1.21.8 texture set.

```bash
zip -r MedievalCraft.zip pack.mcmeta pack.png assets    # rebuild the zip
```

## How it's built

Two complementary techniques, tied together by `tools/build_pack.py`:

1. **Bespoke procedural art** for the most-seen blocks & items —
   `tools/generate.py` + `tools/medieval_lib.py` generate weathered masonry,
   iron-banded doors, ore veins and forged tools from a shared palette.
2. **The medieval aging filter** — `tools/medievalize.py` — recolours every
   other vanilla texture toward the aged palette while preserving its exact
   shape, alpha, animation frames and GUI 9-slice metadata. Biome-tinted
   textures (grass, leaves, water) are filtered gently so the colormap still
   reads.

`build_pack.py` walks the authoritative vanilla texture tree, writes a medieval
counterpart for every file (bespoke where available, filtered otherwise), and
copies all `.mcmeta` verbatim.

### Regenerating from scratch

The vanilla tree is **not** redistributed here — it's read at build time from
the `minecraft-assets` npm package purely to mirror the file list and sizes:

```bash
python3 -m pip install Pillow numpy
npm pack minecraft-assets && tar xzf minecraft-assets-*.tgz
python3 tools/build_pack.py package/minecraft-assets/data/1.21.8
zip -r MedievalCraft.zip pack.mcmeta pack.png assets
```

To restyle anything, edit the palette/filter in `medievalize.py` or add a
bespoke generator in `generate.py`, then re-run `build_pack.py`.

## Scope & honesty

- This now covers **every texture vanilla references** — complete, correctly
  sized, with no missing textures.
- The most-visible blocks, items and the HUD are **handcrafted**; the long tail
  (and all entities) is the vanilla art **medieval-toned** through the filter,
  which keeps full detail and recognisability. It is a coherent aged restyle,
  not 3,000 individually hand-painted tiles.
- **Colormaps** (biome grass/leaf tint) and the **UI font** are intentionally
  left vanilla — recolouring the colormap would skew every biome and tinting
  the font hurts readability.
- The pack is a derivative resource pack of Minecraft's assets and is meant for
  use with a legitimate copy of the game under Mojang's usage guidelines.
