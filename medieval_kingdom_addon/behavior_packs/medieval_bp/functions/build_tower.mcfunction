# Medieval Kingdom - Tower builder
# Run with:  /function build_tower
# Builds a 9x9 stone-brick watchtower centred on you, going straight up.
# Stand where you want the ground floor to be (on solid ground, open sky above).

# --- foundation ---
fill ~-4 ~-1 ~-4 ~4 ~-1 ~4 stonebrick 0
fill ~-4 ~0 ~-4 ~4 ~0 ~4 stonebrick 2

# --- solid shell, then hollow it out ---
fill ~-4 ~1 ~-4 ~4 ~19 ~4 stonebrick 0
fill ~-3 ~1 ~-3 ~3 ~19 ~3 air

# --- interior floors (with a ladder shaft hole in the +x back corner) ---
fill ~-3 ~6 ~-3 ~3 ~6 ~3 stonebrick 0
fill ~-3 ~12 ~-3 ~3 ~12 ~3 stonebrick 0
setblock ~3 ~6 ~3 air
setblock ~3 ~12 ~3 air

# --- ladder up the back wall ---
fill ~3 ~1 ~4 ~3 ~18 ~4 stonebrick 0
fill ~3 ~1 ~3 ~3 ~18 ~3 ladder 3

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
fill ~-4 ~20 ~-4 ~4 ~20 ~4 stonebrick 0
fill ~-3 ~20 ~-3 ~3 ~20 ~3 air

# --- crenellations (merlons) at y21 ---
setblock ~-4 ~21 ~-4 stonebrick 3
setblock ~-2 ~21 ~-4 stonebrick 3
setblock ~0 ~21 ~-4 stonebrick 3
setblock ~2 ~21 ~-4 stonebrick 3
setblock ~4 ~21 ~-4 stonebrick 3
setblock ~-4 ~21 ~4 stonebrick 3
setblock ~-2 ~21 ~4 stonebrick 3
setblock ~0 ~21 ~4 stonebrick 3
setblock ~2 ~21 ~4 stonebrick 3
setblock ~4 ~21 ~4 stonebrick 3
setblock ~-4 ~21 ~-2 stonebrick 3
setblock ~-4 ~21 ~0 stonebrick 3
setblock ~-4 ~21 ~2 stonebrick 3
setblock ~4 ~21 ~-2 stonebrick 3
setblock ~4 ~21 ~0 stonebrick 3
setblock ~4 ~21 ~2 stonebrick 3

# --- banner-style accent blocks by the door ---
setblock ~-1 ~3 ~-4 stonebrick 1
setblock ~1 ~3 ~-4 stonebrick 1

# --- post two knight guards at the base ---
summon md:knight ~-2 ~1 ~-2
summon md:knight ~2 ~1 ~-2

tellraw @s {"rawtext":[{"text":"§6Medieval watchtower raised! Guards posted."}]}
