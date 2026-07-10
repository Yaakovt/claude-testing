# Medieval Kingdom - Tower builder
# Run with:  /function build_tower   (cheats must be ON)
# Builds a 9x9 stone-brick watchtower centred on you, going straight up.
# Stand where you want the ground floor to be (on solid ground, open sky above).

# --- foundation ---
fill ~-4 ~-1 ~-4 ~4 ~-1 ~4 cobblestone
fill ~-4 ~0 ~-4 ~4 ~0 ~4 stonebrick

# --- solid shell, then hollow it out ---
fill ~-4 ~1 ~-4 ~4 ~19 ~4 stonebrick
fill ~-3 ~1 ~-3 ~3 ~19 ~3 air

# --- interior floors (with a ladder-shaft hole in one corner) ---
fill ~-3 ~6 ~-3 ~3 ~6 ~3 stonebrick
fill ~-3 ~12 ~-3 ~3 ~12 ~3 stonebrick
setblock ~3 ~6 ~3 air
setblock ~3 ~12 ~3 air

# --- ladder up the back-east wall ---
fill ~3 ~1 ~3 ~3 ~18 ~3 ladder ["facing_direction"=2]

# --- doorway on the -z face ---
fill ~0 ~1 ~-4 ~0 ~2 ~-4 air

# --- arrow-slit windows on all four faces ---
setblock ~0 ~3 ~4 air
setblock ~0 ~9 ~4 air
setblock ~0 ~15 ~4 air
setblock ~-4 ~4 ~0 air
setblock ~-4 ~10 ~0 air
setblock ~4 ~4 ~0 air
setblock ~4 ~10 ~0 air
setblock ~0 ~4 ~-4 air
setblock ~0 ~10 ~-4 air

# --- torches inside for light ---
setblock ~-2 ~2 ~-2 torch
setblock ~2 ~2 ~2 torch
setblock ~-2 ~8 ~-2 torch
setblock ~-2 ~14 ~-2 torch

# --- battlement walkway ring at the top ---
fill ~-4 ~20 ~-4 ~4 ~20 ~4 stonebrick
fill ~-3 ~20 ~-3 ~3 ~20 ~3 air

# --- crenellations (merlons) at y21 ---
setblock ~-4 ~21 ~-4 stonebrick
setblock ~-2 ~21 ~-4 stonebrick
setblock ~0 ~21 ~-4 stonebrick
setblock ~2 ~21 ~-4 stonebrick
setblock ~4 ~21 ~-4 stonebrick
setblock ~-4 ~21 ~4 stonebrick
setblock ~-2 ~21 ~4 stonebrick
setblock ~0 ~21 ~4 stonebrick
setblock ~2 ~21 ~4 stonebrick
setblock ~4 ~21 ~4 stonebrick
setblock ~-4 ~21 ~-2 stonebrick
setblock ~-4 ~21 ~0 stonebrick
setblock ~-4 ~21 ~2 stonebrick
setblock ~4 ~21 ~-2 stonebrick
setblock ~4 ~21 ~0 stonebrick
setblock ~4 ~21 ~2 stonebrick

# --- treasure: ground-floor strongbox ---
setblock ~-2 ~1 ~2 chest
replaceitem block ~-2 ~1 ~2 slot.container 0 iron_ingot 12
replaceitem block ~-2 ~1 ~2 slot.container 1 bread 8
replaceitem block ~-2 ~1 ~2 slot.container 2 arrow 32
replaceitem block ~-2 ~1 ~2 slot.container 3 gold_ingot 5
replaceitem block ~-2 ~1 ~2 slot.container 4 iron_sword 1
replaceitem block ~-2 ~1 ~2 slot.container 5 shield 1
replaceitem block ~-2 ~1 ~2 slot.container 6 torch 16

# --- treasure: second-floor armory chest ---
setblock ~2 ~7 ~2 chest
replaceitem block ~2 ~7 ~2 slot.container 0 iron_chestplate 1
replaceitem block ~2 ~7 ~2 slot.container 1 iron_helmet 1
replaceitem block ~2 ~7 ~2 slot.container 2 crossbow 1
replaceitem block ~2 ~7 ~2 slot.container 3 arrow 64
replaceitem block ~2 ~7 ~2 slot.container 4 golden_apple 2
replaceitem block ~2 ~7 ~2 slot.container 5 cooked_beef 10

# --- treasure: top-floor royal vault ---
setblock ~-2 ~13 ~2 chest
replaceitem block ~-2 ~13 ~2 slot.container 0 diamond 4
replaceitem block ~-2 ~13 ~2 slot.container 1 emerald 8
replaceitem block ~-2 ~13 ~2 slot.container 2 gold_ingot 15
replaceitem block ~-2 ~13 ~2 slot.container 3 golden_apple 3
replaceitem block ~-2 ~13 ~2 slot.container 4 experience_bottle 12
replaceitem block ~-2 ~13 ~2 slot.container 5 md:iron_plating 3
replaceitem block ~-2 ~13 ~2 slot.container 6 md:dragon_scale 2
replaceitem block ~-2 ~13 ~2 slot.container 7 diamond_sword 1
setblock ~-2 ~13 ~1 gold_block
setblock ~-1 ~13 ~2 gold_block

# --- post two knight guards at the base ---
summon md:knight ~-2 ~1 ~-2
summon md:knight ~2 ~1 ~-2

tellraw @s {"rawtext":[{"text":"§6Medieval watchtower raised! Guards posted, treasure stocked on every floor."}]}
