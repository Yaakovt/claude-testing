#!/usr/bin/env python3
"""
Runestone Tyrant texture generator (Pillow).

The script IS the texture. It reads the cubes straight out of
resource_packs/medieval_rp/models/entity/runestone_tyrant.geo.json and derives
every face rectangle from the Bedrock box-UV unwrap rule — there are no
hand-typed pixel coordinates that could drift out of sync with the geometry.

Outputs two PNGs (128x128, matching texture_width/height in the geo):
  runestone_tyrant.png           base colour. Rune/lure pixels are written with
                                 alpha 0 so a `entity_emissive_alpha` material
                                 renders them opaque AND self-lit (glowing),
                                 exactly like vanilla glowing eyes.
  runestone_tyrant_emissive.png  authoring emissive map: black everywhere except
                                 the runes/lure (their glow colour). This is the
                                 human-readable mask; its bright pixels are the
                                 same pixels baked to alpha 0 in the base texture.

Palette: stone greys with green moss. Shadows are hue-shifted toward blue-purple
(never just a darker grey). Every face gets a 1px top/left edge highlight and a
bottom/right shade so cubes read as beveled.
"""
import json
import os
import random
from PIL import Image

random.seed(20260712)

HERE = os.path.dirname(__file__)
RP = os.path.join(HERE, "..", "resource_packs", "medieval_rp")
GEO = os.path.join(RP, "models", "entity", "runestone_tyrant.geo.json")
ENT = os.path.join(RP, "textures", "entity")
os.makedirs(ENT, exist_ok=True)

# ---- palette -------------------------------------------------------------
STONE      = (122, 124, 130)
STONE_HI   = (170, 172, 180)          # 1px edge highlight
STONE_SHAD = (86, 90, 116)            # shadow: shifted toward blue-purple
MOSS       = (88, 132, 72)
MOSS_DK    = (58, 96, 54)
MOSS_HI    = (128, 168, 104)
RUNE       = (120, 245, 205)          # arcane teal — emissive
RUNE_CORE  = (210, 255, 240)          # bright rune core — emissive
LURE       = (150, 255, 230)          # lure crest — emissive
BLACK      = (0, 0, 0, 255)

W = H = 128


def clamp(v):
    return max(0, min(255, int(v)))


def load_cubes():
    """(bone_name, U, V, w, h, d) for every cube, read from the geometry."""
    geo = json.load(open(GEO))
    desc = geo["minecraft:geometry"][0]["description"]
    tw, th = desc["texture_width"], desc["texture_height"]
    assert (tw, th) == (W, H), f"geo texture size {tw}x{th} != script {W}x{H}"
    out = []
    for bone in geo["minecraft:geometry"][0]["bones"]:
        for cube in bone.get("cubes", []):
            U, V = cube["uv"]
            w, h, d = cube["size"]
            out.append((bone["name"], int(U), int(V), int(w), int(h), int(d)))
    return out


def box_faces(U, V, w, h, d):
    """Bedrock box-UV unwrap -> {face: (x, y, fw, fh)} in pixels.

    Footprint is (2*(w+d)) wide by (h+d) tall:
        top    (U+d,      V,     w, d)
        bottom (U+d+w,    V,     w, d)
        right  (U,        V+d,   d, h)
        front  (U+d,      V+d,   w, h)
        left   (U+d+w,    V+d,   d, h)
        back   (U+2d+w,   V+d,   w, h)
    """
    return {
        "top":    (U + d,           V,     w, d),
        "bottom": (U + d + w,       V,     w, d),
        "right":  (U,               V + d, d, h),
        "front":  (U + d,           V + d, w, h),
        "left":   (U + d + w,       V + d, d, h),
        "back":   (U + 2 * d + w,   V + d, w, h),
    }


# ---- painting ------------------------------------------------------------
def paint_stone(px, x, y, fw, fh, mossiness):
    """Noisy stone with moss patches + beveled edges into an RGBA pixel map."""
    for j in range(fh):
        for i in range(fw):
            n = random.randint(-14, 14)
            base = (clamp(STONE[0] + n), clamp(STONE[1] + n), clamp(STONE[2] + n))
            # moss clusters: value-noise-ish blobs
            m = random.random()
            if m < mossiness:
                g = random.randint(-12, 12)
                base = (clamp(MOSS[0] + g), clamp(MOSS[1] + g), clamp(MOSS[2] + g))
                if m < mossiness * 0.35:
                    base = MOSS_DK
            px[x + i, y + j] = (base[0], base[1], base[2], 255)
    # bevel: highlight top + left, shade bottom + right
    for i in range(fw):
        px[x + i, y] = (STONE_HI[0], STONE_HI[1], STONE_HI[2], 255)
        px[x + i, y + fh - 1] = (STONE_SHAD[0], STONE_SHAD[1], STONE_SHAD[2], 255)
    for j in range(fh):
        px[x, y + j] = (STONE_HI[0], STONE_HI[1], STONE_HI[2], 255)
        px[x + fw - 1, y + j] = (STONE_SHAD[0], STONE_SHAD[1], STONE_SHAD[2], 255)


def emissive_px(pxb, pxe, x, y, col, core=False):
    """Write one glowing pixel: alpha 0 in base (so emissive_alpha lights it),
    and the glow colour into the emissive authoring map."""
    if not (0 <= x < W and 0 <= y < H):
        return
    c = RUNE_CORE if core else col
    pxb[x, y] = (c[0], c[1], c[2], 0)         # alpha 0 == emissive+opaque
    pxe[x, y] = (c[0], c[1], c[2], 255)


def draw_rune(pxb, pxe, x, y, fw, fh, col):
    """A small angular rune centered in the face (stays 1px inside the edges)."""
    if fw < 6 or fh < 6:
        return
    cx = x + fw // 2
    top, bot = y + 2, y + fh - 3
    # vertical stave
    for j in range(top, bot + 1):
        emissive_px(pxb, pxe, cx, j, col)
    # arms — a couple of diagonal/horizontal strokes, deterministic per position
    style = (x * 7 + y * 13) % 3
    if style == 0:
        for k in range(1, min(fw // 2, 4)):
            emissive_px(pxb, pxe, cx + k, top + k, col)
            emissive_px(pxb, pxe, cx - k, bot - k, col)
    elif style == 1:
        for k in range(1, min(fw // 2, 4)):
            emissive_px(pxb, pxe, cx + k, top, col)
            emissive_px(pxb, pxe, cx - k, bot, col)
        emissive_px(pxb, pxe, cx, (top + bot) // 2, col, core=True)
    else:
        for k in range(1, min(fw // 2, 3)):
            emissive_px(pxb, pxe, cx + k, top + k, col)
            emissive_px(pxb, pxe, cx + k, bot - k, col)
    emissive_px(pxb, pxe, cx, top, col, core=True)


# faces that carry runes, per bone
RUNE_FACES = {
    "body": ["left", "right", "top"],
    "tail0": ["top", "left", "right"],
    "tail1": ["top"],
    "head": ["top"],
}


def main():
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    emis = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    pxb = base.load()
    pxe = emis.load()

    audit = []
    for name, U, V, w, h, d in load_cubes():
        faces = box_faces(U, V, w, h, d)
        # mossier on the top/back (where rain and age settle), bare on the belly
        for face, (fx, fy, fw, fh) in faces.items():
            moss = {"top": 0.34, "back": 0.24, "left": 0.16, "right": 0.16,
                    "front": 0.10, "bottom": 0.04}[face]
            if name == "lure":
                # the whole crest is a solid glowing lure
                for j in range(fh):
                    for i in range(fw):
                        emissive_px(pxb, pxe, fx + i, fy + j, LURE,
                                    core=((i + j) % 3 == 0))
                continue
            paint_stone(pxb, fx, fy, fw, fh, moss)
            if name in RUNE_FACES and face in RUNE_FACES[name]:
                draw_rune(pxb, pxe, fx, fy, fw, fh, RUNE)
        # UV audit record (footprint)
        audit.append((name, U, V, 2 * (w + d), h + d))

    base.save(os.path.join(ENT, "runestone_tyrant.png"))
    emis.save(os.path.join(ENT, "runestone_tyrant_emissive.png"))

    # ---- UV audit: footprints + overlap / bounds check ----
    print("cube              uv(U,V)   footprint(WxH)   rect[x0,y0 - x1,y1]")
    rects = []
    ok = True
    for name, U, V, fw, fh in audit:
        x1, y1 = U + fw, V + fh
        print(f"{name:14s}  ({U:3d},{V:3d})   {fw:3d} x {fh:3d}        [{U:3d},{V:3d} - {x1:3d},{y1:3d}]")
        if x1 > W or y1 > H or U < 0 or V < 0:
            print(f"   !! OUT OF BOUNDS ({name})")
            ok = False
        rects.append((name, U, V, x1, y1))
    for i in range(len(rects)):
        for j in range(i + 1, len(rects)):
            a, ax0, ay0, ax1, ay1 = rects[i]
            b, bx0, by0, bx1, by1 = rects[j]
            if ax0 < bx1 and bx0 < ax1 and ay0 < by1 and by0 < ay1:
                print(f"   !! UV OVERLAP: {a} <-> {b}")
                ok = False
    print("UV AUDIT:", "PASS — no overlaps, all in bounds" if ok else "FAIL")
    print("wrote", os.path.relpath(os.path.join(ENT, "runestone_tyrant.png")))
    print("wrote", os.path.relpath(os.path.join(ENT, "runestone_tyrant_emissive.png")))


if __name__ == "__main__":
    main()


# =====================================================================
#  Runeplate armour, items, and the rune block — same palette & rigor
# =====================================================================
from PIL import ImageDraw  # noqa: E402

ITEM = os.path.join(RP, "textures", "items")
ARMOR = os.path.join(RP, "textures", "models", "armor")
BLOCKT = os.path.join(RP, "textures", "blocks")
for d in (ITEM, ARMOR, BLOCKT):
    os.makedirs(d, exist_ok=True)


def new(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def stone_fill(px, x0, y0, x1, y1, moss=0.14):
    for y in range(y0, y1):
        for x in range(x0, x1):
            n = random.randint(-12, 12)
            c = (clamp(STONE[0] + n), clamp(STONE[1] + n), clamp(STONE[2] + n), 255)
            if random.random() < moss:
                g = random.randint(-10, 10)
                c = (clamp(MOSS[0] + g), clamp(MOSS[1] + g), clamp(MOSS[2] + g), 255)
            px[x, y] = c
    for x in range(x0, x1):
        px[x, y0] = (*STONE_HI, 255); px[x, y1 - 1] = (*STONE_SHAD, 255)
    for y in range(y0, y1):
        px[x0, y] = (*STONE_HI, 255); px[x1 - 1, y] = (*STONE_SHAD, 255)


def rune_line(px, x0, y0, x1, y1):
    cx = (x0 + x1) // 2
    for y in range(y0 + 1, y1 - 1):
        px[cx, y] = (*RUNE, 255)
    px[cx, y0 + 1] = (*RUNE_CORE, 255)
    if x1 - x0 > 6:
        px[cx + 2, y0 + 2] = (*RUNE, 255); px[cx - 2, y1 - 3] = (*RUNE, 255)


# ---- armour LAYERS (64x32 vanilla armour UV) ------------------------
def runeplate_layer(legs=False):
    img = new(64, 32); px = img.load()
    if not legs:
        stone_fill(px, 0, 0, 32, 16, 0.12)          # helm (head)
        px_rect = (8, 8, 16, 12)                     # visor slit
        for y in range(10, 13):
            for x in range(9, 15):
                px[x, y] = (10, 12, 16, 255)
        rune_line(px, 8, 1, 16, 8)                   # crest rune
        stone_fill(px, 16, 16, 40, 32, 0.14)         # chest
        rune_line(px, 24, 18, 32, 31)
        stone_fill(px, 40, 16, 56, 32, 0.12)         # right arm / pauldron
        rune_line(px, 44, 18, 52, 28)
        stone_fill(px, 0, 25, 16, 32, 0.10)          # boot caps
    else:
        stone_fill(px, 16, 16, 40, 27, 0.14)         # belt
        rune_line(px, 24, 17, 32, 26)
        stone_fill(px, 0, 16, 16, 32, 0.12)          # legs
        rune_line(px, 4, 18, 12, 30)
    return img


runeplate_layer(False).save(os.path.join(ARMOR, "runeplate_layer_1.png"))
runeplate_layer(True).save(os.path.join(ARMOR, "runeplate_layer_2.png"))


# ---- item ICONS (16x16) --------------------------------------------
def icon_stone_body(px, pts, moss=0.16):
    for (x, y) in pts:
        n = random.randint(-12, 12)
        c = (clamp(STONE[0] + n), clamp(STONE[1] + n), clamp(STONE[2] + n), 255)
        if random.random() < moss:
            c = (*MOSS, 255)
        px[x, y] = c


def runestone_icon():
    img = new(16, 16); px = img.load()
    pts = [(x, y) for y in range(2, 15) for x in range(3, 14)
           if 2 < x + y < 26 and abs(x - 8) + abs(y - 8) < 9]
    icon_stone_body(px, pts)
    for y in range(4, 13):
        px[8, y] = (*RUNE, 255)
    px[8, 4] = (*RUNE_CORE, 255); px[10, 6] = (*RUNE, 255); px[6, 10] = (*RUNE, 255)
    return img


def tyrant_fang():
    img = new(16, 16); px = img.load()
    # curved stone fang, ivory edge + rune groove
    for i in range(13):
        w = max(1, 4 - i // 4)
        for j in range(w):
            x, y = 3 + i // 2 + j, 14 - i
            if 0 <= x < 16 and 0 <= y < 16:
                px[x, y] = (232, 230, 214, 255) if j == 0 else (STONE[0], STONE[1], STONE[2], 255)
    for i in range(9):
        x, y = 5 + i // 2, 12 - i
        if 0 <= x < 16 and 0 <= y < 16:
            px[x, y] = (*RUNE, 255)
    for x in range(2, 7):
        for y in range(12, 15):
            px[x, y] = (70, 58, 44, 255)             # bound grip
    return img


def runeheart():
    img = new(16, 16); px = img.load()
    import math
    for y in range(16):
        for x in range(16):
            fx, fy = (x - 8) / 6.0, (y - 6) / 6.0
            v = (fx * fx + fy * fy - 1) ** 3 - fx * fx * fy ** 3
            if v < 0:
                d = min(1.0, math.hypot(fx, fy))
                px[x, y] = (clamp(90 + 90 * (1 - d)), clamp(220 - 40 * d), clamp(200 - 30 * d), 255)
    px[6, 6] = (*RUNE_CORE, 255); px[7, 5] = (255, 255, 255, 255)
    return img


def armor_icon(kind):
    img = new(16, 16); px = img.load()
    def box(x0, y0, x1, y1):
        stone_fill(px, x0, y0, x1, y1, 0.14)
    if kind == "helmet":
        box(4, 3, 12, 11); 
        for y in range(7, 9):
            for x in range(5, 11): px[x, y] = (12, 14, 18, 255)
        rune_line(px, 4, 2, 12, 6)
    elif kind == "chestplate":
        box(3, 3, 13, 12)
        for y in range(4, 12): px[8, y] = (*RUNE, 255)
        px[4, 4] = (*RUNE_CORE, 255); px[12, 4] = (*RUNE_CORE, 255)
    elif kind == "leggings":
        box(3, 2, 13, 6); box(3, 6, 7, 14); box(9, 6, 13, 14)
        for y in range(7, 14): px[5, y] = (*RUNE, 255); px[11, y] = (*RUNE, 255)
    else:  # boots
        box(2, 7, 7, 13); box(9, 7, 14, 13)
        for x in (4, 11): px[x, 8] = (*RUNE, 255)
    return img


runestone_icon().save(os.path.join(ITEM, "runestone.png"))
tyrant_fang().save(os.path.join(ITEM, "tyrant_fang.png"))
runeheart().save(os.path.join(ITEM, "runeheart.png"))
for k in ("helmet", "chestplate", "leggings", "boots"):
    armor_icon(k).save(os.path.join(ITEM, f"runeplate_{k}.png"))


# ---- RUNE BLOCK texture: box-unwrapped from geometry.rune_block -----
def rune_block_tex(lit):
    bgeo = json.load(open(os.path.join(RP, "models", "blocks", "rune_block.geo.json")))
    d = bgeo["minecraft:geometry"][0]["description"]
    bw, bh = d["texture_width"], d["texture_height"]
    img = new(bw, bh); px = img.load()
    glow = RUNE_CORE if lit else (70, 150, 130)
    for bone in bgeo["minecraft:geometry"][0]["bones"]:
        for i, cube in enumerate(bone["cubes"]):
            U, V = cube["uv"]; w, h, dp = cube["size"]
            for face, (fx, fy, fw, fh) in box_faces(U, V, w, h, dp).items():
                moss = 0.22 if face in ("top", "back") else 0.12
                stone_fill(px, fx, fy, fx + fw, fy + fh, moss)
                # sigil ring on the top faces (i==1 is the raised plate)
                if face == "top":
                    ccx, ccy = fx + fw // 2, fy + fh // 2
                    rad = min(fw, fh) // 2 - 1
                    import math
                    for a in range(0, 360, 12):
                        rx = int(ccx + math.cos(math.radians(a)) * rad)
                        ry = int(ccy + math.sin(math.radians(a)) * rad)
                        if fx <= rx < fx + fw and fy <= ry < fy + fh:
                            px[rx, ry] = (*glow, 255)
                    px[ccx, ccy] = (*glow, 255)
    return img


rune_block_tex(False).save(os.path.join(BLOCKT, "rune_block.png"))
rune_block_tex(True).save(os.path.join(BLOCKT, "rune_block_lit.png"))
print("runeplate + items + rune block textures done")
