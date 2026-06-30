#!/usr/bin/env python3
"""
generate.py — builds every MedievalCraft texture into
    assets/minecraft/textures/{block,item}/

Run:  python3 tools/generate.py
"""

import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

from medieval_lib import (  # noqa: E402
    Rng, canvas, flat, noise_fill, weather, moss, crack, planks, vertical_planks,
    log_rings, bricks, stone_blocks, cobble, woven, metal_plate, ore, leaves,
    grass_top, liquid, pane_border, outline, line, fill_rect, px, shade, mix,
    tool_handle, rgba, S,
)

ROOT = os.path.dirname(HERE)
BLOCK_DIR = os.path.join(ROOT, "assets", "minecraft", "textures", "block")
ITEM_DIR = os.path.join(ROOT, "assets", "minecraft", "textures", "item")

BLOCKS = {}   # name -> draw(img, rng)
ITEMS = {}


def block(name):
    def deco(fn):
        BLOCKS[name] = fn
        return fn
    return deco


def item(name):
    def deco(fn):
        ITEMS[name] = fn
        return fn
    return deco


# ==========================================================================
# MEDIEVAL PALETTE — aged, weathered, earthy. Recognisable but characterful.
# ==========================================================================
P = {
    "stone":        (125, 122, 116),
    "mortar":       (88, 84, 76),
    "cobble":       (118, 114, 108),
    "deepslate":    (74, 73, 79),
    "deep_mortar":  (52, 52, 58),
    "blackstone":   (49, 45, 51),
    "andesite":     (130, 130, 132),
    "diorite":      (200, 198, 196),
    "granite":      (150, 104, 88),
    "tuff":         (108, 110, 102),
    "calcite":      (224, 224, 220),
    "basalt":       (78, 78, 84),
    "sand":         (218, 204, 160),
    "red_sand":     (180, 110, 60),
    "sandstone":    (216, 202, 158),
    "red_sandstone":(168, 96, 48),
    "dirt":         (110, 84, 58),
    "coarse_dirt":  (98, 74, 50),
    "grass":        (104, 138, 58),
    "grass_dry":    (150, 140, 70),
    "podzol":       (90, 64, 30),
    "mycelium":     (112, 100, 110),
    "clay":         (158, 162, 170),
    "gravel":       (124, 118, 112),
    "snow":         (236, 240, 248),
    "ice":          (160, 188, 230),
    "obsidian":     (24, 18, 38),
    "bedrock":      (60, 58, 60),
    "netherrack":   (108, 52, 50),
    "nether_brick": (50, 28, 32),
    "soul_sand":    (84, 64, 52),
    "glowstone":    (190, 150, 80),
    "end_stone":    (216, 220, 168),
    "purpur":       (168, 110, 168),
    "prismarine":   (94, 150, 138),
    "quartz":       (232, 228, 220),
    "iron":         (196, 198, 204),
    "gold":         (212, 170, 70),
    "copper":       (190, 110, 84),
    "copper_ox":    (96, 170, 146),
    "netherite":    (76, 70, 74),
    "diamond":      (130, 214, 210),
    "emerald":      (80, 190, 120),
    "lapis":        (42, 78, 150),
    "redstone":     (180, 40, 36),
    "coal":         (40, 40, 44),
    "amethyst":     (160, 120, 210),
    "parchment":    (224, 208, 162),
    "leather":      (140, 96, 60),
    "bone":         (228, 224, 206),
}

# 16 dye colours (medieval-muted but recognisable)
DYES = {
    "white":      (222, 222, 214),
    "orange":     (190, 104, 40),
    "magenta":    (168, 80, 150),
    "light_blue": (104, 142, 190),
    "yellow":     (198, 170, 60),
    "lime":       (120, 160, 56),
    "pink":       (200, 140, 156),
    "gray":       (74, 76, 78),
    "light_gray": (146, 144, 138),
    "cyan":       (40, 124, 138),
    "purple":     (110, 64, 150),
    "blue":       (52, 64, 144),
    "brown":      (104, 72, 44),
    "green":      (88, 110, 44),
    "red":        (150, 48, 42),
    "black":      (34, 32, 36),
}

# Wood families: (plank, bark, stripped, leaf)
WOODS = {
    "oak":       ((150, 116, 70),  (96, 76, 48),  (172, 138, 86),  (84, 120, 48)),
    "spruce":    ((104, 78, 46),   (66, 50, 32),  (132, 100, 60),  (78, 100, 64)),
    "birch":     ((196, 178, 130), (216, 214, 206),(204, 188, 142), (110, 150, 70)),
    "jungle":    ((150, 106, 70),  (88, 68, 46),  (170, 122, 80),  (66, 116, 36)),
    "acacia":    ((176, 96, 56),   (104, 66, 50),  (192, 112, 66),  (110, 134, 50)),
    "dark_oak":  ((76, 54, 32),    (54, 40, 26),  (96, 70, 42),    (74, 104, 44)),
    "mangrove":  ((124, 56, 50),   (84, 52, 44),  (150, 78, 62),   (96, 130, 54)),
    "cherry":    ((220, 170, 170), (84, 60, 66),  (228, 182, 178), (224, 168, 196)),
    "crimson":   ((130, 60, 80),   (94, 44, 60),  (148, 72, 92),   None),
    "warped":    ((54, 110, 110),  (44, 86, 92),  (62, 128, 122),  None),
    "bamboo":    ((196, 176, 96),  (150, 132, 70),(206, 188, 110), None),
}


# ==========================================================================
# STONE & EARTH
# ==========================================================================
@block("stone")
def _(img, r): noise_fill(img, r, P["stone"], 0.14, 0.10); weather(img, r, 0.05)

@block("cobblestone")
def _(img, r): cobble(img, r, P["cobble"], P["mortar"])

@block("mossy_cobblestone")
def _(img, r): cobble(img, r, P["cobble"], P["mortar"]); moss(img, r, 0.16)

@block("stone_bricks")
def _(img, r): bricks(img, r, P["stone"], P["mortar"], rows=4); weather(img, r, 0.06)

@block("mossy_stone_bricks")
def _(img, r): bricks(img, r, P["stone"], P["mortar"], rows=4); moss(img, r, 0.18)

@block("cracked_stone_bricks")
def _(img, r): bricks(img, r, P["stone"], P["mortar"], rows=4); crack(img, r, 3)

@block("chiseled_stone_bricks")
def _(img, r):
    flat(img, P["mortar"]); fill_rect(img, 2, 2, 13, 13, shade(P["stone"], 0))
    fill_rect(img, 4, 4, 11, 11, shade(P["stone"], -0.15))
    crack(img, r, 1)

@block("smooth_stone")
def _(img, r): noise_fill(img, r, shade(P["stone"], 0.08), 0.05, 0.02)

@block("stone_bricks_carved")  # alias safety
def _(img, r): bricks(img, r, P["stone"], P["mortar"])

def _polishable(name, base):
    BLOCKS[name] = lambda img, r: noise_fill(img, r, base, 0.16, 0.06)
    BLOCKS["polished_" + name] = lambda img, r: noise_fill(img, r, shade(base, 0.06), 0.05, 0.02)

for n in ("andesite", "diorite", "granite"):
    _polishable(n, P[n])

@block("deepslate")
def _(img, r): noise_fill(img, r, P["deepslate"], 0.12, 0.08)
@block("cobbled_deepslate")
def _(img, r): cobble(img, r, P["deepslate"], P["deep_mortar"])
@block("polished_deepslate")
def _(img, r): noise_fill(img, r, shade(P["deepslate"], 0.05), 0.05, 0.02)
@block("deepslate_bricks")
def _(img, r): bricks(img, r, P["deepslate"], P["deep_mortar"])
@block("deepslate_tiles")
def _(img, r): bricks(img, r, P["deepslate"], P["deep_mortar"], rows=4, offset=False)
@block("chiseled_deepslate")
def _(img, r):
    flat(img, P["deep_mortar"]); fill_rect(img, 2, 2, 13, 13, P["deepslate"])
    fill_rect(img, 5, 4, 10, 11, shade(P["deepslate"], -0.2))

@block("blackstone")
def _(img, r): noise_fill(img, r, P["blackstone"], 0.16, 0.1)
@block("polished_blackstone")
def _(img, r): noise_fill(img, r, shade(P["blackstone"], 0.05), 0.05, 0.02)
@block("polished_blackstone_bricks")
def _(img, r): bricks(img, r, P["blackstone"], shade(P["blackstone"], -0.3))
@block("gilded_blackstone")
def _(img, r):
    noise_fill(img, r, P["blackstone"], 0.16, 0.1)
    for _2 in range(6):
        px(img, r.randint(2, 13), r.randint(2, 13), P["gold"])

@block("tuff")
def _(img, r): noise_fill(img, r, P["tuff"], 0.16, 0.1)
@block("calcite")
def _(img, r): noise_fill(img, r, P["calcite"], 0.07, 0.04)
@block("dripstone_block")
def _(img, r): noise_fill(img, r, (150, 118, 96), 0.18, 0.1)
@block("basalt_side")
def _(img, r): vertical_planks(img, r, P["basalt"], lines=(0, 4, 8, 12), groove=-0.3, grain=0.1)
@block("basalt_top")
def _(img, r): noise_fill(img, r, shade(P["basalt"], 0.05), 0.12, 0.08)
@block("smooth_basalt")
def _(img, r): noise_fill(img, r, shade(P["basalt"], 0.04), 0.08, 0.04)

@block("obsidian")
def _(img, r):
    noise_fill(img, r, P["obsidian"], 0.2, 0.05)
    for _2 in range(5):
        px(img, r.randint(1, 14), r.randint(1, 14), (120, 80, 170))
@block("crying_obsidian")
def _(img, r):
    noise_fill(img, r, P["obsidian"], 0.2, 0.05)
    for _2 in range(6):
        px(img, r.randint(1, 14), r.randint(1, 14), (90, 50, 200))

@block("bedrock")
def _(img, r): noise_fill(img, r, P["bedrock"], 0.24, 0.18, 0.6)
@block("gravel")
def _(img, r): noise_fill(img, r, P["gravel"], 0.22, 0.2, 0.5)
@block("sand")
def _(img, r): noise_fill(img, r, P["sand"], 0.10, 0.08, 0.35)
@block("red_sand")
def _(img, r): noise_fill(img, r, P["red_sand"], 0.12, 0.1, 0.4)
@block("clay")
def _(img, r): noise_fill(img, r, P["clay"], 0.08, 0.04)

@block("dirt")
def _(img, r): noise_fill(img, r, P["dirt"], 0.2, 0.16, 0.5)
@block("coarse_dirt")
def _(img, r): noise_fill(img, r, P["coarse_dirt"], 0.24, 0.22, 0.55)
@block("rooted_dirt")
def _(img, r):
    noise_fill(img, r, P["dirt"], 0.2, 0.16, 0.5)
    for _2 in range(8): px(img, r.randint(0, 15), r.randint(0, 15), (200, 200, 170))
@block("grass_block_top")
def _(img, r): grass_top(img, r, P["grass"])
@block("grass_block_side")
def _(img, r):
    noise_fill(img, r, P["dirt"], 0.2, 0.16, 0.5)
    for x in range(S):  # turf overhang at top
        h = 2 + r.randint(0, 3)
        for y in range(h):
            px(img, x, y, shade(P["grass"], (r.rand() - 0.5) * 0.3))
@block("dirt_path_top")
def _(img, r):
    noise_fill(img, r, shade(P["dirt"], 0.12), 0.14, 0.1)
    fill_rect(img, 0, 0, 15, 0, shade(P["grass"], -0.1))
@block("podzol_top")
def _(img, r): noise_fill(img, r, P["podzol"], 0.22, 0.2, 0.5)
@block("mycelium_top")
def _(img, r):
    noise_fill(img, r, P["mycelium"], 0.16, 0.14)
    for _2 in range(20): px(img, r.randint(0, 15), r.randint(0, 15), (150, 130, 150))
@block("farmland")
def _(img, r):
    noise_fill(img, r, P["dirt"], 0.16, 0.12)
    for x in range(2, 14, 4): fill_rect(img, x, 0, x + 1, 15, shade(P["dirt"], -0.3))
@block("farmland_moist")
def _(img, r):
    noise_fill(img, r, shade(P["dirt"], -0.2), 0.16, 0.12)
    for x in range(2, 14, 4): fill_rect(img, x, 0, x + 1, 15, shade(P["dirt"], -0.45))


# ==========================================================================
# SANDSTONE / QUARTZ / PURPUR / PRISMARINE / END
# ==========================================================================
def _sandstone_set(prefix, base):
    BLOCKS[prefix] = lambda img, r: noise_fill(img, r, base, 0.07, 0.03)
    def top(img, r):
        noise_fill(img, r, shade(base, 0.04), 0.06, 0.02)
        for i in range(0, 16, 4):
            fill_rect(img, 0, i, 15, i, shade(base, -0.15))
    BLOCKS[prefix + "_top"] = top
    def carved(img, r):
        noise_fill(img, r, base, 0.05, 0.02)
        fill_rect(img, 2, 2, 13, 13, shade(base, -0.12))
        fill_rect(img, 4, 4, 11, 11, base)
    BLOCKS["chiseled_" + prefix] = carved
    def cut(img, r):
        noise_fill(img, r, base, 0.05, 0.02)
        fill_rect(img, 0, 7, 15, 8, shade(base, -0.2))
        fill_rect(img, 7, 0, 8, 15, shade(base, -0.2))
    BLOCKS["cut_" + prefix] = cut
    BLOCKS["smooth_" + prefix] = lambda img, r: noise_fill(img, r, shade(base, 0.03), 0.03, 0.01)

_sandstone_set("sandstone", P["sandstone"])
_sandstone_set("red_sandstone", P["red_sandstone"])

@block("quartz_block_side")
def _(img, r): noise_fill(img, r, P["quartz"], 0.05, 0.02)
@block("quartz_block_top")
def _(img, r): noise_fill(img, r, shade(P["quartz"], 0.03), 0.05, 0.02)
@block("chiseled_quartz_block")
def _(img, r):
    noise_fill(img, r, P["quartz"], 0.04, 0.02)
    fill_rect(img, 2, 2, 13, 13, shade(P["quartz"], -0.1)); fill_rect(img, 4, 4, 11, 11, P["quartz"])
@block("quartz_pillar")
def _(img, r): vertical_planks(img, r, P["quartz"], lines=(0, 8), groove=-0.18, grain=0.05)
@block("quartz_bricks")
def _(img, r): bricks(img, r, P["quartz"], shade(P["quartz"], -0.15))
@block("smooth_quartz")
def _(img, r): noise_fill(img, r, P["quartz"], 0.03, 0.01)

@block("purpur_block")
def _(img, r): noise_fill(img, r, P["purpur"], 0.12, 0.06)
@block("purpur_pillar")
def _(img, r): vertical_planks(img, r, P["purpur"], lines=(0, 8), groove=-0.2, grain=0.08)

def _prismarine_family():
    BLOCKS["prismarine"] = lambda img, r: noise_fill(img, r, P["prismarine"], 0.16, 0.1)
    BLOCKS["prismarine_bricks"] = lambda img, r: bricks(img, r, P["prismarine"], shade(P["prismarine"], -0.25))
    BLOCKS["dark_prismarine"] = lambda img, r: noise_fill(img, r, shade(P["prismarine"], -0.35), 0.14, 0.1)
_prismarine_family()

@block("end_stone")
def _(img, r): noise_fill(img, r, P["end_stone"], 0.08, 0.05)
@block("end_stone_bricks")
def _(img, r): bricks(img, r, P["end_stone"], shade(P["end_stone"], -0.2))
@block("purpur")
def _(img, r): noise_fill(img, r, P["purpur"], 0.12, 0.06)


# ==========================================================================
# NETHER
# ==========================================================================
@block("netherrack")
def _(img, r): noise_fill(img, r, P["netherrack"], 0.2, 0.16, 0.5)
@block("nether_bricks")
def _(img, r): bricks(img, r, P["nether_brick"], shade(P["nether_brick"], -0.4))
@block("red_nether_bricks")
def _(img, r): bricks(img, r, (90, 24, 28), (40, 14, 16))
@block("chiseled_nether_bricks")
def _(img, r):
    flat(img, shade(P["nether_brick"], -0.4)); fill_rect(img, 2, 2, 13, 13, P["nether_brick"])
    fill_rect(img, 6, 4, 9, 11, shade(P["nether_brick"], 0.2))
@block("cracked_nether_bricks")
def _(img, r): bricks(img, r, P["nether_brick"], shade(P["nether_brick"], -0.4)); crack(img, r, 3, (20, 10, 12))
@block("soul_sand")
def _(img, r):
    noise_fill(img, r, P["soul_sand"], 0.18, 0.14, 0.5)
    for cx, cy in ((4, 5), (10, 9)):
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                px(img, cx + dx, cy + dy, shade(P["soul_sand"], -0.4))
@block("soul_soil")
def _(img, r): noise_fill(img, r, shade(P["soul_sand"], -0.1), 0.2, 0.16, 0.5)
@block("glowstone")
def _(img, r):
    noise_fill(img, r, P["glowstone"], 0.18, 0.05)
    for _2 in range(10): px(img, r.randint(1, 14), r.randint(1, 14), (240, 220, 150))
@block("magma")
def _(img, r): liquid(img, r, (120, 40, 20), (240, 160, 40))
@block("ancient_debris_side")
def _(img, r):
    noise_fill(img, r, (78, 56, 50), 0.14, 0.08)
    fill_rect(img, 5, 4, 10, 11, P["netherite"])
@block("ancient_debris_top")
def _(img, r):
    noise_fill(img, r, (78, 56, 50), 0.14, 0.08)
    fill_rect(img, 5, 5, 10, 10, P["netherite"])

@block("crimson_nylium")
def _(img, r):
    noise_fill(img, r, P["netherrack"], 0.18, 0.14)
    for x in range(S):
        for y in range(r.randint(0, 4)):
            px(img, x, y, (140, 40, 60))
@block("warped_nylium")
def _(img, r):
    noise_fill(img, r, P["netherrack"], 0.18, 0.14)
    for x in range(S):
        for y in range(r.randint(0, 4)):
            px(img, x, y, (40, 120, 110))


# ==========================================================================
# ORES & MINERAL / METAL BLOCKS
# ==========================================================================
ORES = {
    "coal": P["coal"], "iron": (200, 170, 140), "copper": P["copper"],
    "gold": P["gold"], "redstone": P["redstone"], "lapis": P["lapis"],
    "diamond": P["diamond"], "emerald": P["emerald"],
}
for oname, ocol in ORES.items():
    BLOCKS[f"{oname}_ore"] = (lambda c: lambda img, r: ore(img, r, P["stone"], c))(ocol)
    BLOCKS[f"deepslate_{oname}_ore"] = (lambda c: lambda img, r: ore(img, r, P["deepslate"], c))(ocol)

@block("nether_gold_ore")
def _(img, r): ore(img, r, P["netherrack"], P["gold"])
@block("nether_quartz_ore")
def _(img, r): ore(img, r, P["netherrack"], P["quartz"])

# raw + refined metal blocks
@block("raw_iron_block")
def _(img, r): noise_fill(img, r, (200, 150, 110), 0.16, 0.1)
@block("raw_copper_block")
def _(img, r): noise_fill(img, r, (180, 110, 80), 0.16, 0.1)
@block("raw_gold_block")
def _(img, r): noise_fill(img, r, (200, 160, 70), 0.16, 0.1)
@block("iron_block")
def _(img, r): metal_plate(img, r, P["iron"])
@block("gold_block")
def _(img, r): metal_plate(img, r, P["gold"])
@block("diamond_block")
def _(img, r):
    noise_fill(img, r, P["diamond"], 0.1, 0.04)
    for _2 in range(8): px(img, r.randint(1, 14), r.randint(1, 14), (220, 250, 250))
@block("emerald_block")
def _(img, r): noise_fill(img, r, P["emerald"], 0.12, 0.06)
@block("lapis_block")
def _(img, r):
    noise_fill(img, r, P["lapis"], 0.16, 0.1)
    for _2 in range(8): px(img, r.randint(1, 14), r.randint(1, 14), (220, 200, 80))
@block("redstone_block")
def _(img, r): noise_fill(img, r, P["redstone"], 0.14, 0.08)
@block("coal_block")
def _(img, r): noise_fill(img, r, P["coal"], 0.16, 0.1)
@block("netherite_block")
def _(img, r): metal_plate(img, r, P["netherite"])
@block("copper_block")
def _(img, r): metal_plate(img, r, P["copper"], rivets=False)
@block("oxidized_copper")
def _(img, r): metal_plate(img, r, P["copper_ox"], rivets=False)
@block("amethyst_block")
def _(img, r):
    noise_fill(img, r, P["amethyst"], 0.16, 0.06)
    for _2 in range(10): px(img, r.randint(1, 14), r.randint(1, 14), (200, 170, 240))


# ==========================================================================
# WOOD FAMILIES
# ==========================================================================
for wname, (plank, bark, stripped, leaf) in WOODS.items():
    BLOCKS[f"{wname}_planks"] = (lambda b: lambda img, r: (planks(img, r, b), weather(img, r, 0.05)))(plank)
    BLOCKS[f"{wname}_log"] = (lambda b: lambda img, r: vertical_planks(img, r, b, lines=(0,), groove=0, grain=0.16))(bark)
    BLOCKS[f"{wname}_log_top"] = (lambda c, b: lambda img, r: log_rings(img, r, c, b))(plank, bark)
    BLOCKS[f"stripped_{wname}_log"] = (lambda b: lambda img, r: vertical_planks(img, r, b, lines=(), grain=0.14))(stripped)
    BLOCKS[f"stripped_{wname}_log_top"] = (lambda c: lambda img, r: log_rings(img, r, c, shade(c, -0.2)))(stripped)
    BLOCKS[f"{wname}_door_top"] = (lambda b: lambda img, r: _door(img, r, b, top=True))(plank)
    BLOCKS[f"{wname}_door_bottom"] = (lambda b: lambda img, r: _door(img, r, b, top=False))(plank)
    BLOCKS[f"{wname}_trapdoor"] = (lambda b: lambda img, r: _trapdoor(img, r, b))(plank)
    if leaf is not None:
        BLOCKS[f"{wname}_leaves"] = (lambda lf: lambda img, r: leaves(img, r, lf))(leaf)
        BLOCKS[f"{wname}_sapling"] = (lambda lf, b: lambda img, r: _sapling(img, r, lf, b))(leaf, bark)


def _door(img, r, base, top):
    planks(img, r, base, lines=(0, 8) if top else (7, 15))
    # iron banding + studs
    band = (90, 88, 92)
    for by in ((2, 5) if top else (10, 13)):
        fill_rect(img, 1, by, 14, by, band)
        for sx in (2, 7, 12):
            px(img, sx, by, (200, 200, 205))
    if top:  # window grille
        fill_rect(img, 5, 9, 10, 13, (40, 40, 48))
        px(img, 7, 9, band); px(img, 7, 13, band)
    else:  # ring handle
        px(img, 12, 7, band); px(img, 13, 7, band); px(img, 13, 8, band)


def _trapdoor(img, r, base):
    planks(img, r, base, lines=(0, 8, 15))
    band = (90, 88, 92)
    fill_rect(img, 0, 3, 15, 3, band); fill_rect(img, 0, 12, 15, 12, band)
    for sx in (2, 7, 13):
        px(img, sx, 3, (200, 200, 205)); px(img, sx, 12, (200, 200, 205))


def _sapling(img, r, leaf, bark):
    line(img, 8, 15, 8, 9, bark)
    for _2 in range(16):
        a = r.rand() * 6.28
        rad = 2 + r.rand() * 3
        import math
        x = int(8 + math.cos(a) * rad); y = int(7 - abs(math.sin(a)) * rad)
        px(img, x, y, shade(leaf, (r.rand() - 0.5) * 0.4))


# ==========================================================================
# COLOURED FAMILIES (wool / carpet / concrete / terracotta / glass)
# ==========================================================================
for dname, dcol in DYES.items():
    BLOCKS[f"{dname}_wool"] = (lambda c: lambda img, r: woven(img, r, c))(dcol)
    BLOCKS[f"{dname}_carpet"] = (lambda c: lambda img, r: woven(img, r, c))(dcol)
    BLOCKS[f"{dname}_concrete"] = (lambda c: lambda img, r: noise_fill(img, r, c, 0.05, 0.02))(dcol)
    BLOCKS[f"{dname}_concrete_powder"] = (lambda c: lambda img, r: noise_fill(img, r, shade(c, 0.08), 0.12, 0.08))(dcol)
    BLOCKS[f"{dname}_terracotta"] = (lambda c: lambda img, r: noise_fill(img, r, mix(c, P["granite"], 0.45), 0.12, 0.06))(dcol)
    BLOCKS[f"{dname}_stained_glass"] = (lambda c: lambda img, r: pane_border(img, r, c, shade(c, -0.5)))(dcol)
    BLOCKS[f"{dname}_glazed_terracotta"] = (lambda c: lambda img, r: _glazed(img, r, c))(dcol)
    BLOCKS[f"{dname}_candle"] = (lambda c: lambda img, r: _candle(img, r, c))(dcol)

@block("terracotta")
def _(img, r): noise_fill(img, r, (150, 96, 70), 0.12, 0.06)
@block("glass")
def _(img, r): pane_border(img, r, (210, 226, 232), (90, 100, 110))

def _glazed(img, r, c):
    flat(img, shade(c, 0.05))
    # ornate quarter-tile motif
    fill_rect(img, 0, 0, 15, 0, shade(c, -0.4)); fill_rect(img, 0, 15, 15, 15, shade(c, -0.4))
    fill_rect(img, 0, 0, 0, 15, shade(c, -0.4)); fill_rect(img, 15, 0, 15, 15, shade(c, -0.4))
    line(img, 0, 0, 15, 15, shade(c, 0.4))
    line(img, 3, 12, 12, 3, P["parchment"])
    fill_rect(img, 6, 6, 9, 9, shade(c, -0.3))

def _candle(img, r, c):
    fill_rect(img, 7, 5, 8, 13, c)
    px(img, 7, 4, (60, 50, 40))      # wick
    px(img, 7, 3, (255, 200, 80))    # flame
    px(img, 7, 2, (255, 160, 40))


# ==========================================================================
# PLANTS & CROPS
# ==========================================================================
@block("grass")  # short grass / tuft
def _(img, r):
    for x in range(2, 15, 2):
        h = r.randint(4, 9)
        for y in range(16 - h, 16):
            px(img, x + r.randint(-1, 1), y, shade(P["grass"], (r.rand() - 0.3) * 0.4))
@block("fern")
def _(img, r):
    line(img, 8, 15, 8, 6, shade(P["grass"], -0.1))
    for y in range(6, 15, 2):
        line(img, 8, y, 8 - (15 - y) // 2, y - 1, P["grass"])
        line(img, 8, y, 8 + (15 - y) // 2, y - 1, P["grass"])
@block("dead_bush")
def _(img, r):
    for _2 in range(10):
        x0 = r.randint(5, 10)
        line(img, 8, 15, x0, r.randint(4, 10), (120, 86, 50))
@block("sugar_cane")
def _(img, r):
    fill_rect(img, 7, 0, 8, 15, (120, 170, 90))
    for y in range(0, 16, 4): px(img, 7, y, shade((120, 170, 90), -0.3))
@block("bamboo_stalk")
def _(img, r):
    fill_rect(img, 7, 0, 9, 15, P["WOODS_bamboo"] if False else (160, 180, 70))
    for y in range(0, 16, 5): fill_rect(img, 6, y, 10, y, shade((160, 180, 70), -0.4))
@block("lily_pad")
def _(img, r):
    import math
    for y in range(S):
        for x in range(S):
            if (x - 7.5) ** 2 + (y - 7.5) ** 2 <= 56:
                px(img, x, y, shade((60, 120, 50), (r.rand() - 0.5) * 0.3))
    fill_rect(img, 7, 8, 8, 15, (0, 0, 0, 0))
@block("vine")
def _(img, r):
    for x in range(0, 16, 3):
        for y in range(r.randint(2, 14)):
            px(img, x + r.randint(0, 1), y, shade((70, 110, 50), (r.rand() - 0.5) * 0.4))

# flowers
FLOWERS = {
    "dandelion": (220, 200, 60), "poppy": (200, 50, 40), "blue_orchid": (80, 170, 220),
    "allium": (180, 120, 210), "azure_bluet": (220, 220, 230), "oxeye_daisy": (240, 240, 230),
    "cornflower": (90, 110, 200), "lily_of_the_valley": (230, 240, 230),
    "orange_tulip": (220, 130, 40), "red_tulip": (200, 50, 40),
    "white_tulip": (230, 230, 230), "pink_tulip": (220, 150, 180),
}
for fname, fcol in FLOWERS.items():
    def _mk(c):
        def draw(img, r):
            line(img, 8, 15, 8, 7, shade(P["grass"], -0.1))
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    if dx * dx + dy * dy <= 5:
                        px(img, 8 + dx, 6 + dy, shade(c, (r.rand() - 0.5) * 0.3))
            px(img, 8, 6, shade(c, 0.4) if "daisy" in "" else (240, 220, 60))
        return draw
    BLOCKS[fname] = _mk(fcol)

# crops growth stages
def _crop(color):
    def mk(stage):
        def draw(img, r):
            n = 2 + stage
            for i in range(n):
                x = 2 + i * (12 // max(1, n - 1)) if n > 1 else 8
                h = 3 + stage * 1.5
                col = mix((90, 120, 50), color, stage / 7)
                for y in range(16 - int(h), 16):
                    px(img, x, y, shade(col, (r.rand() - 0.5) * 0.3))
        return draw
    return mk

for st in range(8):
    BLOCKS[f"wheat_stage{st}"] = _crop((200, 180, 80))(st)
for st in range(8):
    BLOCKS[f"carrots_stage{st}"] = _crop((90, 150, 60))(st)
    BLOCKS[f"potatoes_stage{st}"] = _crop((100, 150, 70))(st)
for st in range(4):
    BLOCKS[f"beetroots_stage{st}"] = _crop((150, 60, 60))(st)

@block("pumpkin_side")
def _(img, r):
    noise_fill(img, r, (200, 120, 30), 0.1, 0.04)
    for x in range(2, 15, 3): fill_rect(img, x, 0, x, 15, shade((200, 120, 30), -0.25))
@block("pumpkin_top")
def _(img, r):
    noise_fill(img, r, (180, 110, 30), 0.1, 0.04); fill_rect(img, 6, 6, 9, 9, (120, 90, 40))
@block("carved_pumpkin")
def _(img, r):
    noise_fill(img, r, (200, 120, 30), 0.1, 0.04)
    fill_rect(img, 3, 5, 5, 7, (40, 30, 10)); fill_rect(img, 10, 5, 12, 7, (40, 30, 10))
    fill_rect(img, 6, 10, 9, 12, (40, 30, 10))
@block("melon_side")
def _(img, r):
    noise_fill(img, r, (90, 130, 50), 0.12, 0.06)
    for x in range(0, 16, 4): fill_rect(img, x, 0, x, 15, shade((60, 100, 40), -0.1))
@block("melon_top")
def _(img, r): noise_fill(img, r, (80, 120, 50), 0.12, 0.06)
@block("hay_block_side")
def _(img, r):
    planks(img, r, (190, 160, 60), lines=(0, 5, 10, 15))
@block("hay_block_top")
def _(img, r):
    noise_fill(img, r, (190, 160, 60), 0.12, 0.06); fill_rect(img, 5, 5, 10, 10, (150, 120, 40))

# mushrooms / fungus
@block("brown_mushroom")
def _(img, r):
    fill_rect(img, 7, 9, 8, 14, (200, 190, 170)); fill_rect(img, 5, 7, 10, 9, (130, 90, 60))
@block("red_mushroom")
def _(img, r):
    fill_rect(img, 7, 9, 8, 14, (210, 200, 180)); fill_rect(img, 5, 7, 10, 9, (190, 50, 40))
    px(img, 6, 8, (240, 240, 240)); px(img, 9, 8, (240, 240, 240))


# ==========================================================================
# UTILITY / FUNCTIONAL BLOCKS
# ==========================================================================
@block("oak_planks_base")  # safety alias
def _(img, r): planks(img, r, WOODS["oak"][0])

@block("crafting_table_top")
def _(img, r):
    planks(img, r, WOODS["oak"][0]); fill_rect(img, 1, 1, 14, 14, None) if False else None
    fill_rect(img, 2, 2, 13, 13, (60, 44, 30))
    # tool icons
    line(img, 4, 4, 6, 6, (180, 180, 190)); line(img, 9, 4, 11, 7, (150, 110, 60))
@block("crafting_table_front")
def _(img, r):
    planks(img, r, WOODS["oak"][0])
    fill_rect(img, 2, 6, 13, 13, shade(WOODS["oak"][0], -0.3))
    line(img, 4, 8, 11, 8, (60, 44, 30))
@block("crafting_table_side")
def _(img, r):
    planks(img, r, WOODS["oak"][0]); fill_rect(img, 1, 4, 14, 14, shade(WOODS["oak"][0], -0.2))

@block("furnace_front")
def _(img, r):
    noise_fill(img, r, P["stone"], 0.12, 0.06)
    fill_rect(img, 3, 7, 12, 13, (40, 36, 34))
    fill_rect(img, 5, 9, 10, 12, (190, 90, 30))  # ember glow
@block("furnace_front_on")
def _(img, r):
    noise_fill(img, r, P["stone"], 0.12, 0.06)
    fill_rect(img, 3, 7, 12, 13, (40, 36, 34))
    fill_rect(img, 4, 8, 11, 12, (240, 160, 40))
@block("furnace_side")
def _(img, r): noise_fill(img, r, P["stone"], 0.12, 0.06)
@block("furnace_top")
def _(img, r):
    noise_fill(img, r, P["stone"], 0.12, 0.06); fill_rect(img, 6, 6, 9, 9, (40, 36, 34))

@block("bookshelf")
def _(img, r):
    planks(img, r, WOODS["oak"][0])
    fill_rect(img, 1, 1, 14, 6, (60, 44, 30)); fill_rect(img, 1, 9, 14, 14, (60, 44, 30))
    for bx in range(2, 14, 2):
        col = r.pick([(150, 60, 50), (60, 90, 140), (90, 130, 70), (180, 150, 70)])
        fill_rect(img, bx, 1, bx, 6, col); fill_rect(img, bx, 9, bx, 14, col)
@block("chiseled_bookshelf")
def _(img, r):
    planks(img, r, WOODS["oak"][0]); fill_rect(img, 1, 1, 14, 14, (60, 44, 30))
    for bx in (3, 8, 13):
        for by in (1, 8):
            col = r.pick([(150, 60, 50), (60, 90, 140), (90, 130, 70)])
            fill_rect(img, bx, by, bx + 1, by + 5, col)

@block("ladder")
def _(img, r):
    wood = (150, 116, 70)
    fill_rect(img, 3, 0, 4, 15, wood); fill_rect(img, 11, 0, 12, 15, wood)
    for y in range(2, 15, 4): fill_rect(img, 4, y, 11, y, shade(wood, -0.1))
@block("scaffolding_top")
def _(img, r):
    wood = (196, 176, 96)
    for i in (1, 14): fill_rect(img, 1, i, 14, i, wood); fill_rect(img, i, 1, i, 14, wood)

@block("torch")
def _(img, r):
    fill_rect(img, 7, 6, 8, 15, (130, 96, 50))
    px(img, 7, 4, (255, 220, 120)); px(img, 8, 4, (255, 180, 60))
    px(img, 7, 3, (255, 160, 40)); px(img, 7, 5, (255, 240, 180))
@block("lantern")
def _(img, r):
    fill_rect(img, 5, 4, 10, 12, (60, 58, 62))
    fill_rect(img, 6, 6, 9, 10, (255, 210, 110))
    fill_rect(img, 6, 2, 9, 3, (90, 88, 92)); px(img, 7, 1, (90, 88, 92))
@block("soul_lantern")
def _(img, r):
    fill_rect(img, 5, 4, 10, 12, (60, 58, 62))
    fill_rect(img, 6, 6, 9, 10, (90, 200, 220))
    fill_rect(img, 6, 2, 9, 3, (90, 88, 92))

@block("bricks")
def _(img, r): bricks(img, r, (150, 78, 60), (110, 90, 80)); weather(img, r, 0.05)
@block("mud_bricks")
def _(img, r): bricks(img, r, (120, 96, 70), (90, 72, 54))
@block("packed_mud")
def _(img, r): noise_fill(img, r, (130, 102, 74), 0.14, 0.1)
@block("mud")
def _(img, r): noise_fill(img, r, (70, 62, 60), 0.16, 0.12, 0.5)

@block("ice")
def _(img, r): noise_fill(img, r, P["ice"], 0.08, 0.03)
@block("packed_ice")
def _(img, r): noise_fill(img, r, shade(P["ice"], -0.05), 0.06, 0.02)
@block("blue_ice")
def _(img, r): noise_fill(img, r, (130, 170, 230), 0.05, 0.02)
@block("snow")
def _(img, r): noise_fill(img, r, P["snow"], 0.05, 0.02)
@block("snow_block")
def _(img, r): noise_fill(img, r, P["snow"], 0.05, 0.02)

@block("sponge")
def _(img, r): noise_fill(img, r, (200, 196, 90), 0.16, 0.14, 0.5)
@block("slime_block")
def _(img, r):
    flat(img, rgba((110, 190, 110), 180)); fill_rect(img, 4, 4, 11, 11, rgba((90, 170, 90), 200))
@block("honey_block")
def _(img, r): flat(img, rgba((220, 160, 50), 200))
@block("tnt_side")
def _(img, r):
    fill_rect(img, 0, 0, 15, 15, (170, 50, 40)); fill_rect(img, 0, 6, 15, 9, (220, 220, 210))
    # 'medieval barrel of powder' lettering hint
    fill_rect(img, 5, 7, 6, 8, (40, 30, 30)); fill_rect(img, 9, 7, 10, 8, (40, 30, 30))
@block("tnt_top")
def _(img, r):
    fill_rect(img, 0, 0, 15, 15, (170, 50, 40)); fill_rect(img, 4, 4, 11, 11, (40, 30, 30))
    px(img, 7, 3, (60, 50, 40))  # fuse

@block("bell")
def _(img, r):
    fill_rect(img, 5, 3, 10, 11, P["gold"]); fill_rect(img, 4, 11, 11, 12, shade(P["gold"], -0.2))
    px(img, 7, 13, (90, 88, 92))
@block("anvil")
def _(img, r):
    fill_rect(img, 2, 2, 13, 5, P["iron"]); fill_rect(img, 5, 5, 10, 9, shade(P["iron"], -0.2))
    fill_rect(img, 3, 9, 12, 13, P["iron"])
@block("cauldron_side")
def _(img, r):
    metal_plate(img, r, shade(P["iron"], -0.4), rivets=False)
    fill_rect(img, 0, 1, 15, 1, P["iron"]); fill_rect(img, 0, 14, 15, 15, P["iron"])

# barrels / chest-like
@block("barrel_side")
def _(img, r):
    vertical_planks(img, r, (140, 100, 60), lines=(0, 4, 8, 12))
    fill_rect(img, 0, 2, 15, 2, (90, 88, 92)); fill_rect(img, 0, 13, 15, 13, (90, 88, 92))
@block("barrel_top")
def _(img, r):
    import math
    for y in range(S):
        for x in range(S):
            d = ((x - 7.5) ** 2 + (y - 7.5) ** 2) ** 0.5
            px(img, x, y, shade((140, 100, 60), -0.1 if int(d) % 2 else 0.05))
    fill_rect(img, 6, 6, 9, 9, (90, 88, 92))


# ==========================================================================
# LIQUIDS (still frames)
# ==========================================================================
@block("water_still")
def _(img, r): liquid(img, r, (52, 88, 170), (90, 130, 210))
@block("water_flow")
def _(img, r): liquid(img, r, (48, 82, 160), (84, 122, 200))
@block("lava_still")
def _(img, r): liquid(img, r, (190, 70, 20), (250, 200, 40))
@block("lava_flow")
def _(img, r): liquid(img, r, (180, 64, 18), (250, 190, 36))


# ==========================================================================
# DESTROY STAGES (crack overlays)
# ==========================================================================
for st in range(10):
    def _mk(stage):
        def draw(img, r):
            n = 1 + stage // 2
            crack(img, Rng(f"destroy{stage}"), n, (20, 20, 20))
            # thin out so it reads as an overlay
            for y in range(S):
                for x in range(S):
                    c = img.getpixel((x, y))
                    if c[3] and r.chance(0.4):
                        px(img, x, y, (0, 0, 0, 0))
        return draw
    BLOCKS[f"destroy_stage_{st}"] = _mk(st)


# ==========================================================================
# ITEMS
# ==========================================================================
TOOL_MATS = {
    "wooden": (150, 116, 70), "stone": (130, 128, 124), "iron": P["iron"],
    "golden": P["gold"], "diamond": P["diamond"], "netherite": P["netherite"],
}
HAFT = (120, 88, 52)

def _pickaxe(head):
    def draw(img, r):
        tool_handle(img, r, HAFT, (9, 14), (7, 4))
        line(img, 3, 4, 13, 2, head)
        line(img, 3, 3, 13, 1, shade(head, 0.2))
        line(img, 2, 5, 4, 4, head); line(img, 12, 3, 14, 2, head)
    return draw

def _axe(head):
    def draw(img, r):
        tool_handle(img, r, HAFT, (10, 14), (7, 4))
        fill_rect(img, 4, 2, 8, 6, head); fill_rect(img, 3, 3, 4, 5, head)
        fill_rect(img, 4, 2, 8, 2, shade(head, 0.2))
    return draw

def _shovel(head):
    def draw(img, r):
        tool_handle(img, r, HAFT, (9, 14), (7, 5))
        fill_rect(img, 5, 2, 9, 6, head); fill_rect(img, 5, 2, 9, 2, shade(head, 0.2))
    return draw

def _sword(blade):
    def draw(img, r):
        line(img, 11, 2, 5, 9, blade); line(img, 12, 3, 6, 10, shade(blade, -0.2))
        line(img, 3, 11, 6, 8, (90, 70, 40))   # guard
        line(img, 2, 13, 4, 11, HAFT)          # grip
        px(img, 2, 13, P["gold"])              # pommel
    return draw

def _hoe(head):
    def draw(img, r):
        tool_handle(img, r, HAFT, (10, 14), (8, 4))
        fill_rect(img, 4, 2, 9, 3, head); fill_rect(img, 4, 3, 5, 5, head)
    return draw

for mat, col in TOOL_MATS.items():
    ITEMS[f"{mat}_pickaxe"] = (lambda c: lambda img, r: _pickaxe(c)(img, r))(col)
    ITEMS[f"{mat}_axe"] = (lambda c: lambda img, r: _axe(c)(img, r))(col)
    ITEMS[f"{mat}_shovel"] = (lambda c: lambda img, r: _shovel(c)(img, r))(col)
    ITEMS[f"{mat}_sword"] = (lambda c: lambda img, r: _sword(c)(img, r))(col)
    ITEMS[f"{mat}_hoe"] = (lambda c: lambda img, r: _hoe(c)(img, r))(col)

# armour
def _helmet(col):
    def draw(img, r):
        fill_rect(img, 3, 4, 12, 6, col); fill_rect(img, 3, 7, 4, 10, col); fill_rect(img, 11, 7, 12, 10, col)
        fill_rect(img, 3, 4, 12, 4, shade(col, 0.2)); fill_rect(img, 5, 7, 10, 8, shade(col, -0.3))
    return draw
def _chest(col):
    def draw(img, r):
        fill_rect(img, 3, 3, 12, 12, col); fill_rect(img, 1, 4, 3, 8, col); fill_rect(img, 12, 4, 14, 8, col)
        fill_rect(img, 7, 3, 8, 12, shade(col, -0.2)); fill_rect(img, 3, 3, 12, 3, shade(col, 0.2))
    return draw
def _legs(col):
    def draw(img, r):
        fill_rect(img, 3, 2, 12, 5, col); fill_rect(img, 3, 6, 6, 14, col); fill_rect(img, 9, 6, 12, 14, col)
    return draw
def _boots(col):
    def draw(img, r):
        fill_rect(img, 3, 6, 6, 13, col); fill_rect(img, 9, 6, 12, 13, col)
        fill_rect(img, 2, 12, 13, 13, shade(col, -0.2))
    return draw

ARMOR_MATS = {"leather": P["leather"], "chainmail": (140, 140, 146),
              "iron": P["iron"], "golden": P["gold"], "diamond": P["diamond"],
              "netherite": P["netherite"], "turtle": (90, 150, 90)}
for mat, col in ARMOR_MATS.items():
    if mat != "turtle":
        ITEMS[f"{mat}_helmet"] = (lambda c: lambda img, r: _helmet(c)(img, r))(col)
        ITEMS[f"{mat}_chestplate"] = (lambda c: lambda img, r: _chest(c)(img, r))(col)
        ITEMS[f"{mat}_leggings"] = (lambda c: lambda img, r: _legs(c)(img, r))(col)
        ITEMS[f"{mat}_boots"] = (lambda c: lambda img, r: _boots(c)(img, r))(col)
ITEMS["turtle_helmet"] = lambda img, r: _helmet(ARMOR_MATS["turtle"])(img, r)

# ingots / gems / materials
def _ingot(col):
    def draw(img, r):
        fill_rect(img, 3, 6, 12, 10, col); fill_rect(img, 4, 5, 11, 5, col)
        fill_rect(img, 3, 6, 12, 6, shade(col, 0.25)); fill_rect(img, 3, 10, 12, 10, shade(col, -0.25))
    return draw
def _gem(col):
    def draw(img, r):
        fill_rect(img, 6, 3, 9, 12, col); fill_rect(img, 4, 6, 11, 9, col)
        px(img, 7, 5, shade(col, 0.4)); px(img, 6, 6, shade(col, 0.4))
        fill_rect(img, 6, 11, 9, 12, shade(col, -0.3))
    return draw
def _nugget(col):
    def draw(img, r):
        fill_rect(img, 6, 6, 9, 9, col); px(img, 6, 6, shade(col, 0.3)); px(img, 9, 9, shade(col, -0.3))
    return draw

ITEMS["iron_ingot"] = lambda img, r: _ingot(P["iron"])(img, r)
ITEMS["gold_ingot"] = lambda img, r: _ingot(P["gold"])(img, r)
ITEMS["copper_ingot"] = lambda img, r: _ingot(P["copper"])(img, r)
ITEMS["netherite_ingot"] = lambda img, r: _ingot(P["netherite"])(img, r)
ITEMS["netherite_scrap"] = lambda img, r: _nugget((120, 90, 70))(img, r)
ITEMS["diamond"] = lambda img, r: _gem(P["diamond"])(img, r)
ITEMS["emerald"] = lambda img, r: _gem(P["emerald"])(img, r)
ITEMS["lapis_lazuli"] = lambda img, r: _nugget(P["lapis"])(img, r)
ITEMS["amethyst_shard"] = lambda img, r: _gem(P["amethyst"])(img, r)
ITEMS["quartz"] = lambda img, r: _nugget(P["quartz"])(img, r)
ITEMS["coal"] = lambda img, r: _nugget(P["coal"])(img, r)
ITEMS["charcoal"] = lambda img, r: _nugget((50, 46, 44))(img, r)
ITEMS["redstone"] = lambda img, r: _nugget(P["redstone"])(img, r)
ITEMS["glowstone_dust"] = lambda img, r: _nugget((220, 200, 120))(img, r)
ITEMS["gunpowder"] = lambda img, r: _nugget((70, 68, 70))(img, r)
ITEMS["iron_nugget"] = lambda img, r: _nugget(P["iron"])(img, r)
ITEMS["gold_nugget"] = lambda img, r: _nugget(P["gold"])(img, r)
ITEMS["raw_iron"] = lambda img, r: _nugget((200, 150, 110))(img, r)
ITEMS["raw_copper"] = lambda img, r: _nugget((180, 110, 80))(img, r)
ITEMS["raw_gold"] = lambda img, r: _nugget((200, 160, 70))(img, r)
ITEMS["clay_ball"] = lambda img, r: _nugget(P["clay"])(img, r)
ITEMS["brick"] = lambda img, r: _ingot((160, 84, 64))(img, r)
ITEMS["nether_brick"] = lambda img, r: _ingot(P["nether_brick"])(img, r)
ITEMS["flint"] = lambda img, r: _nugget((60, 58, 60))(img, r)

@item("stick")
def _(img, r): tool_handle(img, r, HAFT, (11, 13), (5, 3))
@item("bone")
def _(img, r):
    fill_rect(img, 6, 3, 9, 12, P["bone"])
    fill_rect(img, 4, 2, 11, 3, P["bone"]); fill_rect(img, 4, 12, 11, 13, P["bone"])
@item("bone_meal")
def _(img, r): _nugget(P["bone"])(img, r)
@item("string")
def _(img, r):
    for x in range(2, 14): px(img, x, 8 + r.randint(-2, 2), (220, 220, 220))
@item("feather")
def _(img, r):
    line(img, 11, 2, 4, 13, (230, 230, 230)); line(img, 11, 3, 5, 13, (200, 200, 200))
@item("leather")
def _(img, r): noise_fill(img, r, P["leather"], 0.12, 0.06)
@item("paper")
def _(img, r):
    fill_rect(img, 2, 2, 13, 13, P["parchment"]); fill_rect(img, 2, 2, 13, 2, shade(P["parchment"], -0.2))
@item("book")
def _(img, r):
    fill_rect(img, 3, 2, 12, 13, (120, 50, 44)); fill_rect(img, 4, 3, 11, 12, P["parchment"])
    fill_rect(img, 3, 2, 4, 13, (90, 36, 32))
@item("enchanted_book")
def _(img, r):
    fill_rect(img, 3, 2, 12, 13, (90, 60, 140)); fill_rect(img, 4, 3, 11, 12, P["parchment"])
    px(img, 12, 3, (220, 200, 90)); px(img, 13, 4, (220, 200, 90))
@item("wheat")
def _(img, r):
    line(img, 8, 14, 8, 3, (180, 150, 60))
    for y in range(4, 13, 2):
        line(img, 8, y, 5, y - 2, (200, 180, 70)); line(img, 8, y, 11, y - 2, (200, 180, 70))

# food
@item("apple")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 9) ** 2 <= 22:
                px(img, x, y, shade((190, 40, 36), (r.rand() - 0.4) * 0.3))
    fill_rect(img, 8, 3, 8, 5, (90, 60, 30)); px(img, 9, 4, (90, 130, 50))
    px(img, 6, 7, (240, 180, 180))
@item("golden_apple")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 9) ** 2 <= 22:
                px(img, x, y, shade(P["gold"], (r.rand() - 0.4) * 0.3))
    fill_rect(img, 8, 3, 8, 5, (120, 90, 40)); px(img, 6, 7, (250, 240, 180))
@item("bread")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if 3 <= x <= 12 and 5 <= y <= 11 and (x - 7.5) ** 2 / 20 + (y - 8) ** 2 / 9 <= 1:
                px(img, x, y, shade((180, 130, 70), (r.rand() - 0.4) * 0.3))
    for sx in (5, 8, 11): px(img, sx, 6, shade((140, 96, 50), 0))
@item("carrot")
def _(img, r):
    line(img, 5, 13, 11, 5, (210, 120, 30)); line(img, 6, 13, 12, 5, (190, 100, 24))
    px(img, 11, 4, (90, 140, 50)); px(img, 12, 3, (90, 140, 50))
@item("golden_carrot")
def _(img, r):
    line(img, 5, 13, 11, 5, P["gold"]); px(img, 11, 4, (200, 220, 120))
@item("potato")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 / 16 + (y - 8) ** 2 / 12 <= 1:
                px(img, x, y, shade((190, 150, 90), (r.rand() - 0.4) * 0.3))
@item("baked_potato")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 / 16 + (y - 8) ** 2 / 12 <= 1:
                px(img, x, y, shade((150, 110, 60), (r.rand() - 0.4) * 0.3))
@item("beetroot")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 9) ** 2 <= 16: px(img, x, y, (150, 40, 50))
    px(img, 8, 3, (90, 140, 50))
@item("egg")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 / 12 + (y - 8) ** 2 / 16 <= 1: px(img, x, y, (235, 230, 215))
@item("sugar")
def _(img, r): _nugget((240, 240, 240))(img, r)
@item("cookie")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 25: px(img, x, y, (170, 120, 60))
    for _2 in range(5): px(img, r.randint(4, 11), r.randint(4, 11), (60, 40, 20))

# misc tools/items
@item("bucket")
def _(img, r):
    fill_rect(img, 4, 5, 11, 13, P["iron"]); fill_rect(img, 5, 6, 10, 12, shade(P["iron"], -0.15))
    fill_rect(img, 4, 5, 11, 5, shade(P["iron"], 0.2))
@item("water_bucket")
def _(img, r):
    fill_rect(img, 4, 5, 11, 13, P["iron"]); fill_rect(img, 5, 6, 10, 12, (60, 110, 200))
@item("lava_bucket")
def _(img, r):
    fill_rect(img, 4, 5, 11, 13, P["iron"]); fill_rect(img, 5, 6, 10, 12, (230, 130, 30))
@item("milk_bucket")
def _(img, r):
    fill_rect(img, 4, 5, 11, 13, P["iron"]); fill_rect(img, 5, 6, 10, 12, (235, 235, 230))
@item("bow")
def _(img, r):
    line(img, 11, 2, 11, 13, (120, 80, 44))
    line(img, 11, 2, 5, 4, (120, 80, 44)); line(img, 11, 13, 5, 11, (120, 80, 44))
    line(img, 5, 4, 5, 11, (230, 230, 230))
@item("arrow")
def _(img, r):
    line(img, 2, 13, 12, 3, (180, 180, 180)); fill_rect(img, 11, 2, 13, 4, (200, 200, 200))
    px(img, 2, 13, (230, 230, 230)); px(img, 3, 12, (230, 230, 230))
@item("shield")
def _(img, r):
    for y in range(2, 14):
        w = 5 if y < 10 else max(0, 5 - (y - 9))
        fill_rect(img, 8 - w, y, 8 + w, y, (90, 64, 40))
    fill_rect(img, 6, 3, 9, 12, P["iron"]); px(img, 7, 7, P["gold"])
@item("fishing_rod")
def _(img, r):
    line(img, 2, 14, 12, 3, (130, 96, 50)); line(img, 12, 3, 13, 9, (220, 220, 220))
    px(img, 13, 10, (200, 60, 60))
@item("shears")
def _(img, r):
    line(img, 4, 12, 11, 4, P["iron"]); line(img, 11, 12, 4, 4, P["iron"])
    px(img, 7, 8, (90, 88, 92))
@item("flint_and_steel")
def _(img, r):
    fill_rect(img, 3, 8, 8, 11, P["iron"]); fill_rect(img, 9, 4, 12, 9, (60, 58, 60))
    px(img, 12, 4, (255, 200, 80))
@item("compass")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 30: px(img, x, y, P["iron"])
    fill_rect(img, 7, 4, 8, 8, (200, 50, 40)); fill_rect(img, 8, 8, 9, 11, (230, 230, 230))
@item("clock")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 30: px(img, x, y, P["gold"])
    fill_rect(img, 4, 4, 11, 11, (60, 90, 140)); px(img, 8, 8, (240, 240, 240))
@item("map")
def _(img, r):
    fill_rect(img, 2, 2, 13, 13, P["parchment"]); fill_rect(img, 2, 2, 13, 2, shade(P["parchment"], -0.2))
    for _2 in range(4): line(img, r.randint(3, 12), r.randint(3, 12), r.randint(3, 12), r.randint(3, 12), (150, 120, 80))
@item("name_tag")
def _(img, r):
    fill_rect(img, 3, 6, 13, 10, P["parchment"]); px(img, 4, 8, (90, 88, 92)); line(img, 2, 8, 4, 8, (160, 130, 90))
@item("torch_item")
def _(img, r): BLOCKS["torch"](img, r)
@item("coal_item")
def _(img, r): _nugget(P["coal"])(img, r)
@item("ender_pearl")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 22: px(img, x, y, shade((30, 120, 110), (r.rand() - 0.5) * 0.3))
    px(img, 6, 6, (120, 220, 200))
@item("ender_eye")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 22: px(img, x, y, (30, 120, 110))
    fill_rect(img, 6, 6, 9, 9, (210, 200, 80))
@item("blaze_rod")
def _(img, r): line(img, 4, 13, 12, 3, (230, 170, 40)); line(img, 5, 13, 13, 3, (200, 130, 20))
@item("blaze_powder")
def _(img, r): _nugget((230, 150, 40))(img, r)
@item("slime_ball")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 22: px(img, x, y, rgba((110, 190, 110), 220))
@item("magma_cream")
def _(img, r): _nugget((200, 90, 40))(img, r)
@item("ghast_tear")
def _(img, r):
    for y in range(3, 13):
        w = (y - 3) // 3
        fill_rect(img, 8 - w, y, 8 + w, y, (220, 240, 235))
@item("spider_eye")
def _(img, r):
    for y in range(S):
        for x in range(S):
            if (x - 8) ** 2 + (y - 8) ** 2 <= 18: px(img, x, y, (140, 60, 50))
    px(img, 8, 8, (240, 200, 60))
@item("rotten_flesh")
def _(img, r): noise_fill(img, r, (130, 90, 70), 0.2, 0.16, 0.5)
@item("gold_ingot_alt")
def _(img, r): _ingot(P["gold"])(img, r)
@item("nether_star")
def _(img, r):
    for dx, dy in ((0, -5), (0, 5), (-5, 0), (5, 0), (-3, -3), (3, 3), (-3, 3), (3, -3)):
        line(img, 8, 8, 8 + dx, 8 + dy, (235, 235, 220))
    px(img, 8, 8, (255, 255, 240))
@item("totem_of_undying")
def _(img, r):
    fill_rect(img, 6, 3, 9, 6, P["gold"]); fill_rect(img, 4, 7, 11, 12, P["gold"])
    px(img, 6, 9, (60, 160, 80)); px(img, 9, 9, (60, 160, 80))


# ==========================================================================
# RUN
# ==========================================================================
def save_all():
    os.makedirs(BLOCK_DIR, exist_ok=True)
    os.makedirs(ITEM_DIR, exist_ok=True)
    nb = ni = 0
    for name, fn in BLOCKS.items():
        img = canvas()
        fn(img, Rng("block:" + name))
        img.save(os.path.join(BLOCK_DIR, name + ".png"))
        nb += 1
    for name, fn in ITEMS.items():
        img = canvas()
        fn(img, Rng("item:" + name))
        img = outline(img)  # items read better with a dark contour
        img.save(os.path.join(ITEM_DIR, name + ".png"))
        ni += 1
    return nb, ni


if __name__ == "__main__":
    nb, ni = save_all()
    print(f"Generated {nb} block textures + {ni} item textures = {nb + ni} total")
