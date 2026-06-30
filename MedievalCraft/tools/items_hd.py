"""
items_hd.py — hand-authored 16x16 item pixel art.

Each icon is a character-grid sprite (real pixel-art, not procedural blobs)
rendered through a palette. Tools/weapons/armour are templated so one shape
renders in every material tint with proper highlight / mid / shadow / outline
shading and a consistent top-left light source.

Exposes ITEMS_HD: {item_name: PIL.Image (RGBA 16x16)}.
"""
from PIL import Image

S = 16
TRANSP = (0, 0, 0, 0)
OUT = (26, 19, 14, 255)          # warm near-black outline


# --- material metal palettes: (light, mid, dark) ---------------------------
METAL = {
    "wooden":    ((178, 143, 88), (138, 104, 62), (100, 72, 42)),
    "stone":     ((156, 156, 158), (120, 120, 122), (88, 88, 92)),
    "copper":    ((212, 132, 94), (170, 96, 64), (122, 64, 42)),
    "iron":      ((226, 228, 234), (182, 186, 196), (132, 136, 150)),
    "golden":    ((250, 220, 126), (216, 172, 66), (158, 116, 40)),
    "diamond":   ((158, 236, 228), (96, 206, 200), (54, 158, 156)),
    "netherite": ((120, 110, 112), (82, 74, 78), (52, 46, 50)),
}
# leather grips, wood hafts, gold furniture (shared across tools)
WOOD = ((158, 116, 70), (112, 80, 46))      # H, h
LEATHER = ((128, 86, 52), (92, 58, 34))      # K, k
GOLD = ((232, 196, 96), (176, 132, 52))      # G, g


def render(rows, pal):
    im = Image.new("RGBA", (S, S), TRANSP)
    px = im.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            c = pal.get(ch)
            if c:
                px[x, y] = c if len(c) == 4 else (c[0], c[1], c[2], 255)
    return im


def tool_pal(mat, grip=LEATHER, furniture=GOLD):
    L, M, D = METAL[mat]
    return {
        "o": OUT, "L": L, "M": M, "D": D,
        "H": WOOD[0], "h": WOOD[1],
        "K": grip[0], "k": grip[1],
        "G": furniture[0], "g": furniture[1],
    }


# ===========================================================================
# TEMPLATES  (16 rows x 16 cols)
# ===========================================================================
SWORD = [
    "............oo..",
    "...........oLMo.",
    "..........oLMDo.",
    ".........oLMDo..",
    "........oLMDo...",
    ".......oLMDo....",
    "......oLMDo.....",
    ".....oLMDo......",
    "....oLMDo.......",
    "...oGgGo.o......",
    "..oGgGGGo.......",
    "...okKoo........",
    "..okKko.........",
    ".okKko..........",
    ".oGGo...........",
    "..oo............",
]

PICKAXE = [
    ".oooooooooooo...",
    "oLLMMDMMMLLLDo..",
    "oLMMDo.ooDMMLo..",
    "ooooo.oHo.oooo..",
    "......oHho......",
    "......oHho......",
    ".....oHho.......",
    ".....oHho.......",
    "....oHho........",
    "....oHho........",
    "...oHho.........",
    "...oHho.........",
    "..oHho..........",
    "..oHho..........",
    ".oho............",
    "..o.............",
]

def _make_axe(mat):
    """Single-bit axe: flat top, straight left cutting edge, angled beard,
    drawn procedurally then auto-outlined (an oval grid always reads as a mace)."""
    from medieval_lib import outline as _outline
    L, M, D = METAL[mat]
    im = Image.new("RGBA", (S, S), TRANSP)
    px = im.load()

    def put(x, y, c):
        if 0 <= x < S and 0 <= y < S:
            px[x, y] = (c[0], c[1], c[2], 255)

    # wooden haft, vertical with a slight lean
    for y in range(3, 15):
        hx = 10 - (y - 3) // 6
        put(hx, y, WOOD[0]); put(hx + 1, y, WOOD[1])
    # blade: asymmetric bit (y -> x range), shaded left=light to right=shadow
    blade = {2: (4, 9), 3: (3, 9), 4: (2, 9), 5: (2, 9),
             6: (2, 9), 7: (3, 9), 8: (4, 9), 9: (6, 9)}
    for y, (xl, xr) in blade.items():
        for x in range(xl, xr + 1):
            f = (x - xl) / max(1, xr - xl)
            put(x, y, L if f < 0.34 else (M if f < 0.7 else D))
    return _outline(im, OUT[:3])

SHOVEL = [
    ".....ooo........",
    "....oLMDo.......",
    "....oLMDo.......",
    "....oLMDo.......",
    "....oLMDo.......",
    ".....ooo.o......",
    ".....oHho.......",
    ".....oHho.......",
    "....oHho........",
    "....oHho........",
    "...oHho.........",
    "...oHho.........",
    "..oHho..........",
    "..oHho..........",
    ".oho............",
    "..o.............",
]

HOE = [
    "..oooooo........",
    ".oLLLLLDo.......",
    ".oDDDDMDoHo.....",
    "..ooooooHho....",
    "........oHho....",
    ".......oHho.....",
    ".......oHho.....",
    "......oHho......",
    "......oHho......",
    ".....oHho.......",
    ".....oHho.......",
    "....oHho........",
    "....oHho........",
    "...oHho.........",
    "...oho..........",
    "....o...........",
]

# --- armour ---------------------------------------------------------------
HELMET = [
    "................",
    "....oooooo......",
    "...oLLLLLLo.....",
    "..oLLMMMMLDo....",
    "..oLMMMMMMDo....",
    "..oLMoММoMDo....".replace("М", "o"),
    "..oLMMMMMMDo....",
    "..ooMMMMMMoo....",
    "...oMDDDDMo.....",
    "....oooooo......",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]
CHEST = [
    "................",
    "..oo......oo....",
    ".oLLoooooooLDo..",
    "oLLLLLLLLLLLLDo.",
    "oLLLLLLLLLLLLDo.",
    "oLMMMMDMMMMMMDo.",
    "oLMMMMDMMMMMMDo.",
    "oLMMMMDMMMMMMDo.",
    ".oMMMMDMMMMMMo..",
    ".oMMMMDMMMMMMo..",
    ".oMMMMMMMMMMMo..",
    ".oMDDDDDDDDDMo..",
    ".ooo......ooo...",
    "................",
    "................",
    "................",
]
LEGGINGS = [
    "................",
    "..ooooooooo....",
    ".oLLLLLLLLDo...",
    ".oLMMMMMMMDo...",
    ".oMMMMMMMMDo...",
    ".oMMMoooMMDo...",
    ".oMMo.ooMDo...",
    ".oMo...oMo....",
    ".oMo...oMo....",
    ".oMo...oMo....",
    ".oMo...oMo....",
    ".ooo...ooo....",
    "................",
    "................",
    "................",
    "................",
]
BOOTS = [
    "................",
    "................",
    "................",
    "..oo....oo.....",
    ".oLDo..oLDo....",
    ".oMDo..oMDo....",
    ".oMDo..oMDo....",
    ".oMDoooMMDo....",
    ".oMMMMMMMMDo...",
    ".oMMMMMMMMMDo..",
    ".oDDDDDDDDDDo..",
    "..oooooooooo...",
    "................",
    "................",
    "................",
    "................",
]


def _armor_pal(mat):
    L, M, D = METAL[mat]
    return {"o": OUT, "L": L, "M": M, "D": D}


# --- materials & misc (own palettes) --------------------------------------
def gem_pal(L, M, D):
    return {"o": OUT, "L": L, "M": M, "D": D}


INGOT = [
    "................",
    "................",
    "................",
    "................",
    "....ooooooo.....",
    "...oLLLLLLDo....",
    "..oLLLLLLLDDo...",
    "..oMMMMMMMMDo...",
    "..oMMMMMMMMDo...",
    "..oDDDDDDDDDo...",
    "...ooooooooo....",
    "................",
    "................",
    "................",
    "................",
    "................",
]
GEM = [
    "................",
    "................",
    ".....oooo.......",
    "....oLLLMo......",
    "...oLLLMMDo.....",
    "..oLLLMMMDDo....",
    "..oLLMMMMMDo....",
    "...oMMMMMDo.....",
    "....oMMMDo......",
    ".....oMDo.......",
    "......oo........",
    "................",
    "................",
    "................",
    "................",
    "................",
]
NUGGET = [
    "................",
    "................",
    "................",
    "................",
    "......ooo.......",
    ".....oLLDo......",
    ".....oLMDo......",
    ".....oMMDo......",
    "......oDo.......",
    ".......o........",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
]
STICK = [
    "..........oo....",
    ".........oHho...",
    ".........oHho...",
    "........oHho....",
    "........oHho....",
    ".......oHho.....",
    ".......oHho.....",
    "......oHho......",
    "......oHho......",
    ".....oHho.......",
    ".....oHho.......",
    "....oHho........",
    "....oHho........",
    "...oho..........",
    "...o............",
    "................",
]

# foods / misc with bespoke palettes
APPLE = [
    "................",
    "................",
    ".......oo.......",
    "......oKo.......",
    "....oooLooo.....",
    "...oRRRLRRRo....",
    "..oRRRRRRRRRo...",
    "..oRRLRRRRRRo...",
    "..oRRRRRRRRRo...",
    "..oRRRRRRRRRo...",
    "...oRRRRRRRo....",
    "...oRRRRRRo.....",
    "....oRRRo......",  # padded below
    ".....ooo........",
    "................",
    "................",
]
BREAD = [
    "................",
    "................",
    "................",
    "....oooooo......",
    "...oLBBBBLo.....",
    "..oBBLBBLBBo....",
    "..oBLBBLBBLDo...",
    "..oBBBLBBBBDo...",
    "..oBBLBBBLBDo...",
    "...oBBBBBBDo....",
    "....ooooooo.....",
    "................",
    "................",
    "................",
    "................",
    "................",
]


def _food_pal_apple():
    return {"o": OUT, "R": (190, 44, 40), "L": (236, 120, 96),
            "K": (96, 64, 34), "B": (84, 120, 50)}


def _food_pal_bread():
    return {"o": OUT, "B": (176, 122, 60), "L": (214, 168, 96), "D": (132, 88, 44)}


# ===========================================================================
# BUILD REGISTRY
# ===========================================================================
ITEMS_HD = {}

_TOOLS = {"sword": SWORD, "pickaxe": PICKAXE, "shovel": SHOVEL, "hoe": HOE}
for mat in METAL:
    for tool, tmpl in _TOOLS.items():
        grip = WOOD if mat == "wooden" else LEATHER
        ITEMS_HD[f"{mat}_{tool}"] = render(tmpl, tool_pal(mat, grip=grip))
    ITEMS_HD[f"{mat}_axe"] = _make_axe(mat)

_ARMOR = {"helmet": HELMET, "chestplate": CHEST, "leggings": LEGGINGS, "boots": BOOTS}
_ARMOR_MATS = {
    "leather": ((150, 102, 60), (112, 74, 42), (80, 52, 30)),
    "chainmail": ((180, 182, 188), (132, 134, 142), (96, 98, 106)),
    "copper": METAL["copper"],
    "iron": METAL["iron"], "golden": METAL["golden"],
    "diamond": METAL["diamond"], "netherite": METAL["netherite"],
    "turtle": ((120, 168, 96), (88, 130, 66), (60, 96, 46)),
}
for mat, (L, M, D) in _ARMOR_MATS.items():
    pal = {"o": OUT, "L": L, "M": M, "D": D}
    for piece, tmpl in _ARMOR.items():
        if mat == "turtle" and piece != "helmet":
            continue
        ITEMS_HD[f"{mat}_{piece}"] = render(tmpl, pal)

# ingots / gems / nuggets
_MATS = {
    "iron_ingot": METAL["iron"], "gold_ingot": METAL["golden"],
    "copper_ingot": ((206, 128, 92), (170, 96, 64), (124, 66, 42)),
    "netherite_ingot": METAL["netherite"],
}
for nm, (L, M, D) in _MATS.items():
    ITEMS_HD[nm] = render(INGOT, gem_pal(L, M, D))

_GEMS = {
    "diamond": METAL["diamond"], "emerald": ((104, 214, 130), (60, 176, 96), (36, 130, 70)),
    "amethyst_shard": ((196, 158, 232), (158, 116, 210), (112, 78, 160)),
    "lapis_lazuli": ((86, 120, 200), (52, 84, 168), (34, 58, 130)),
    "quartz": ((238, 232, 222), (208, 198, 184), (158, 148, 134)),
}
for nm, (L, M, D) in _GEMS.items():
    ITEMS_HD[nm] = render(GEM, gem_pal(L, M, D))

_NUGGETS = {
    "iron_nugget": METAL["iron"], "gold_nugget": METAL["golden"],
    "coal": ((70, 70, 74), (44, 44, 48), (26, 26, 30)),
    "charcoal": ((84, 70, 64), (56, 46, 42), (32, 26, 24)),
    "redstone": ((214, 60, 48), (170, 36, 30), (120, 22, 20)),
    "glowstone_dust": ((240, 216, 130), (210, 176, 84), (160, 128, 50)),
    "gunpowder": ((92, 90, 92), (64, 62, 66), (40, 38, 42)),
    "raw_iron": ((204, 158, 120), (168, 120, 86), (122, 84, 58)),
    "raw_copper": ((196, 122, 86), (158, 90, 60), (116, 62, 40)),
    "raw_gold": ((222, 182, 92), (188, 144, 56), (140, 102, 36)),
    "clay_ball": ((180, 184, 192), (150, 154, 164), (114, 118, 128)),
    "flint": ((70, 68, 72), (48, 46, 50), (30, 28, 32)),
    "blaze_powder": ((244, 188, 70), (216, 138, 40), (168, 96, 24)),
    "sugar": ((244, 244, 246), (212, 212, 216), (170, 170, 176)),
    "bone_meal": ((236, 234, 220), (206, 204, 188), (164, 162, 148)),
}
for nm, (L, M, D) in _NUGGETS.items():
    ITEMS_HD[nm] = render(NUGGET, gem_pal(L, M, D))

ITEMS_HD["stick"] = render(STICK, {"o": OUT, "H": WOOD[0], "h": WOOD[1]})
ITEMS_HD["apple"] = render(APPLE, _food_pal_apple())
ITEMS_HD["bread"] = render(BREAD, _food_pal_bread())


def get(name):
    return ITEMS_HD.get(name)
