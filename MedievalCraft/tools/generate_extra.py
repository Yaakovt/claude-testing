#!/usr/bin/env python3
"""
generate_extra.py — the remaining texture categories:
  * particles  (textures/particle/)
  * paintings  (textures/painting/)  — medieval tapestry / heraldry style
  * entities   (textures/entity/...) — themed, UV-region-aware mob skins
  * gui        (textures/gui/...)     — parchment & wood panels, menu backdrop

Entity skins are correctly-sized and tinted to the medieval palette with
region-aware clothing (tunic / trousers / boots) on humanoids and iconic
faces where the UV location is well-known (creeper, skeleton). They are
themed recolours, not bespoke per-mob art — but they read correctly in-world
and the helpers make hand-detailing any single mob easy.

Run:  python3 tools/generate_extra.py
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(HERE)
TEX = os.path.join(ROOT, "assets", "minecraft", "textures")

from PIL import Image  # noqa: E402
from medieval_lib import Rng, shade, mix, clamp  # noqa: E402


def img(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def P(im, x, y, c, a=255):
    if 0 <= x < im.width and 0 <= y < im.height:
        if len(c) == 4:
            im.putpixel((x, y), c)
        else:
            im.putpixel((x, y), (c[0], c[1], c[2], a))


def rect(im, x0, y0, x1, y1, c, a=255):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            P(im, x, y, c, a)


def noise_region(im, x0, y0, x1, y1, base, rng, grain=0.14, speck=0.06, a=255):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            v = (rng.rand() - 0.5) * 2 * grain
            c = shade(base, v)
            if rng.chance(speck):
                c = shade(c, -0.4 * rng.rand())
            P(im, x, y, c, a)


def save(im, *parts):
    path = os.path.join(TEX, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path)


# ==========================================================================
# PARTICLES
# ==========================================================================
def gen_particles():
    n = 0
    # generic_0..7 : soft smoke/dust puffs (8x8)
    for i in range(8):
        im = img(8, 8)
        rng = Rng(f"particle_generic{i}")
        tone = 70 + i * 16
        for y in range(8):
            for x in range(8):
                d = ((x - 3.5) ** 2 + (y - 3.5) ** 2) ** 0.5
                if d <= 3.6:
                    v = clamp(tone + (rng.rand() - 0.5) * 40)
                    a = clamp(220 - d * 40)
                    P(im, x, y, (v, v, v), a)
        save(im, "particle", f"generic_{i}.png"); n += 1

    # big_smoke_0..11 (16x16) drifting grey smoke
    for i in range(12):
        im = img(16, 16)
        rng = Rng(f"smoke{i}")
        tone = 60 + i * 6
        for y in range(16):
            for x in range(16):
                d = ((x - 7.5) ** 2 + (y - 7.5) ** 2) ** 0.5
                if d <= 7 - (i * 0.2):
                    v = clamp(tone + (rng.rand() - 0.5) * 50)
                    P(im, x, y, (v, v, v), clamp(200 - d * 22))
        save(im, "particle", f"big_smoke_{i}.png"); n += 1

    # flame (8x8 teardrop)
    im = img(8, 8); rng = Rng("flame")
    for y in range(8):
        w = int((y) * 0.5)
        for x in range(4 - w, 4 + w + 1):
            t = 1 - y / 8
            c = mix((255, 90, 20), (255, 230, 120), t)
            P(im, x, y, c, 230)
    save(im, "particle", "flame.png"); n += 1

    # lava (8x8 ember)
    im = img(8, 8); rng = Rng("plava")
    for y in range(8):
        for x in range(8):
            if (x - 3.5) ** 2 + (y - 3.5) ** 2 <= 9:
                P(im, x, y, shade((230, 120, 30), (rng.rand() - 0.5) * 0.4), 240)
    save(im, "particle", "lava.png"); n += 1

    # bubble / splash / drips / misc — all 8x8 unless noted
    def disc(name, color, sz=8, a=230):
        im = img(sz, sz); rng = Rng(name)
        c = sz / 2 - 0.5
        for y in range(sz):
            for x in range(sz):
                if (x - c) ** 2 + (y - c) ** 2 <= (sz / 2 - 0.5) ** 2:
                    P(im, x, y, shade(color, (rng.rand() - 0.5) * 0.3), a)
        save(im, "particle", name + ".png")
    for nm, col in [("bubble", (170, 200, 230)), ("splash_0", (120, 160, 210)),
                    ("splash_1", (130, 170, 215)), ("splash_2", (140, 175, 220)),
                    ("splash_3", (150, 180, 225)), ("drip_hang", (90, 130, 200)),
                    ("drip_fall", (90, 130, 200)), ("drip_land", (90, 130, 200)),
                    ("damage", (160, 30, 30)), ("flash", (255, 240, 180)),
                    ("glint", (220, 200, 120)), ("nautilus", (200, 190, 160))]:
        disc(nm, col); n += 1

    # heart (8x8)
    im = img(8, 8)
    heart = ["..XX.XX.", ".XXXXXXX", ".XXXXXXX", ".XXXXXXX", "..XXXXX.", "...XXX..", "....X...", "........"]
    for y, row in enumerate(heart):
        for x, ch in enumerate(row):
            if ch == "X":
                P(im, x, y, (190, 30, 40))
    save(im, "particle", "heart.png"); n += 1

    # angry (villager anger) 8x8
    im = img(8, 8)
    for y in range(8):
        for x in range(8):
            if 3 <= x <= 4 and 0 <= y <= 6:
                P(im, x, y, (200, 200, 200))
            if 3 <= x <= 4 and y == 7:
                P(im, x, y, (200, 200, 200))
    save(im, "particle", "angry.png"); n += 1

    # note (8x8)
    im = img(8, 8)
    for y in range(8):
        for x in range(8):
            if (x - 3) ** 2 + (y - 5) ** 2 <= 3:
                P(im, x, y, (80, 60, 40))
    rect(im, 4, 1, 5, 5, (80, 60, 40))
    save(im, "particle", "note.png"); n += 1

    # critical_hit & enchanted_hit (8x8 sparks)
    for nm, col in [("critical_hit", (200, 180, 90)), ("enchanted_hit", (140, 110, 200))]:
        im = img(8, 8)
        for a, b in [(0, 0), (1, 1), (2, 2), (3, 3), (4, 4), (5, 5), (6, 6), (7, 7),
                     (0, 7), (1, 6), (6, 1), (7, 0)]:
            P(im, a, b, col)
        save(im, "particle", nm + ".png"); n += 1

    # the enchanting-table glyph atlas glyphs sga_a..z would be many; provide a
    # representative rune sheet via generic glints already covered.
    return n


# ==========================================================================
# PAINTINGS — medieval tapestry / heraldry
# ==========================================================================
PAINTINGS = {
    # 1x1
    "kebab": (16, 16), "aztec": (16, 16), "alban": (16, 16), "aztec2": (16, 16),
    "bomb": (16, 16), "plant": (16, 16), "wasteland": (16, 16),
    "earth": (16, 16), "wind": (16, 16), "fire": (16, 16), "water": (16, 16),
    # 2x1
    "pool": (32, 16), "courbet": (32, 16), "sea": (32, 16), "sunset": (32, 16),
    "creebet": (32, 16),
    # 1x2
    "wanderer": (16, 32), "graham": (16, 32),
    # 2x2
    "match": (32, 32), "bust": (32, 32), "stage": (32, 32), "void": (32, 32),
    "skull_and_roses": (32, 32), "wither": (32, 32),
    # 4x2
    "fighters": (64, 32),
    # 4x3
    "skeleton": (64, 48), "donkey_kong": (64, 48),
    # 4x4
    "pointer": (64, 64), "pigscene": (64, 64), "burning_skull": (64, 64),
}

CLOTH = [(168, 140, 92), (150, 120, 80), (120, 96, 64), (96, 72, 48)]
HERALD = [(150, 48, 42), (52, 64, 144), (88, 110, 44), (198, 170, 60),
          (110, 64, 150), (40, 124, 138)]


def painting(name, w, h):
    im = img(w, h)
    rng = Rng("painting:" + name)
    field = rng.pick(CLOTH)
    # woven cloth field
    for y in range(h):
        for x in range(w):
            knot = ((x % 4 < 2) ^ (y % 4 < 2))
            P(im, x, y, shade(field, (0.08 if knot else -0.05) + (rng.rand() - 0.5) * 0.1))
    # wooden frame
    frame = (96, 70, 44)
    for i in range(w):
        P(im, i, 0, frame); P(im, i, h - 1, frame)
    for i in range(h):
        P(im, 0, i, frame); P(im, w - 1, i, shade(frame, -0.2))
    # inner gold trim
    gold = (190, 156, 70)
    for i in range(1, w - 1):
        P(im, i, 1, gold); P(im, i, h - 2, shade(gold, -0.2))
    for i in range(1, h - 1):
        P(im, 1, i, gold); P(im, w - 2, i, shade(gold, -0.2))

    cx, cy = w // 2, h // 2
    motif = HERALD[rng.randint(0, len(HERALD) - 1)]
    pick = rng.randint(0, 4)

    if pick == 0:  # heraldic shield
        sw = max(3, w // 4)
        for y in range(cy - sw, cy + sw):
            taper = 0 if y < cy + sw // 2 else (y - (cy + sw // 2))
            for x in range(cx - sw + taper, cx + sw - taper):
                P(im, x, y, shade(motif, (rng.rand() - 0.5) * 0.2))
        # a chevron
        for x in range(cx - sw, cx + sw):
            P(im, x, cy - abs(x - cx) // 1, shade(motif, 0.4))
    elif pick == 1:  # castle towers
        ground = h - 3
        for bx in (cx - w // 4, cx, cx + w // 4):
            tw = max(2, w // 10)
            for y in range(cy, ground):
                for x in range(bx - tw, bx + tw):
                    P(im, x, y, shade((150, 146, 138), (rng.rand() - 0.5) * 0.2))
            for x in range(bx - tw, bx + tw, 2):  # crenellations
                P(im, x, cy - 1, (150, 146, 138))
    elif pick == 2:  # tree of life
        for y in range(cy, h - 2):
            P(im, cx, y, (110, 80, 48))
        for _ in range(w * h // 6):
            a = rng.rand() * 6.28
            r = rng.rand() * (w / 3)
            x = int(cx + math.cos(a) * r); y = int(cy - 1 + math.sin(a) * r * 0.7)
            P(im, x, y, shade((90, 120, 50), (rng.rand() - 0.5) * 0.4))
    elif pick == 3:  # sun / moon over hills
        for x in range(1, w - 1):
            hy = cy + int(2 * math.sin(x / w * 6.28))
            for y in range(hy, h - 1):
                P(im, x, y, shade((80, 100, 50), (rng.rand() - 0.5) * 0.2))
        for y in range(h):
            for x in range(w):
                if (x - cx) ** 2 + (y - cy + h // 4) ** 2 <= (w // 6) ** 2:
                    P(im, x, y, (220, 190, 90))
    else:  # rampant beast silhouette
        for _ in range(w * h // 3):
            x = rng.randint(3, w - 4); y = rng.randint(3, h - 4)
            if abs(x - cx) + abs(y - cy) < w // 2:
                P(im, x, y, shade(motif, (rng.rand() - 0.5) * 0.3))
    return im


def gen_paintings():
    n = 0
    for name, (w, h) in PAINTINGS.items():
        save(painting(name, w, h), "painting", name + ".png")
        n += 1
    # canvas back
    back = img(16, 16); rng = Rng("painting_back")
    noise_region(back, 0, 0, 15, 15, (120, 92, 58), rng, 0.12, 0.05)
    for i in range(16):
        P(back, i, 0, (90, 66, 40)); P(back, i, 15, (90, 66, 40))
        P(back, 0, i, (90, 66, 40)); P(back, 15, i, (90, 66, 40))
    save(back, "painting", "back.png"); n += 1
    return n


# ==========================================================================
# ENTITIES — themed, region-aware
# ==========================================================================
def base_fill(im, w, h, color, rng, grain=0.12):
    noise_region(im, 0, 0, w - 1, h - 1, color, rng, grain, 0.04)


def humanoid(name, path, w, h, skin, tunic, trousers, boots=None, eyes=True,
             tunic2=None):
    """64x32 or 64x64 biped UV. Clothes the torso/arms/legs regions."""
    im = img(w, h)
    rng = Rng("entity:" + name)
    boots = boots or shade(trousers, -0.4)
    tunic2 = tunic2 or shade(tunic, -0.12)
    for y in range(h):
        for x in range(w):
            if y < 16:
                c = skin                      # head band
            elif y < 32:
                if x < 16:
                    c = trousers              # right leg
                elif x < 40:
                    c = tunic                 # torso
                elif x < 56:
                    c = tunic2                # right arm / sleeve
                else:
                    c = skin
            else:  # 64x64 second layer
                if x < 16:
                    c = boots if y > 44 else trousers   # left leg / boots
                elif x < 40:
                    c = trousers
                elif x < 56:
                    c = tunic2
                else:
                    c = boots
            P(im, x, y, shade(c, (rng.rand() - 0.5) * 0.18))
    # face on head-front UV (x8..15, y8..15)
    if eyes:
        P(im, 10, 11, (24, 20, 28)); P(im, 11, 11, (24, 20, 28))
        P(im, 13, 11, (24, 20, 28)); P(im, 14, 11, (24, 20, 28))
    save(im, *path)


def quadruped(name, path, w, h, body, rng_extra=None, hoof=None, spots=None,
              snout=None):
    im = img(w, h)
    rng = Rng("entity:" + name)
    base_fill(im, w, h, body, rng, 0.14)
    hoof = hoof or shade(body, -0.45)
    # legs sit in the lower band of a 64x32 quadruped sheet -> darken hooves
    rect(im, 0, h - 3, w - 1, h - 1, hoof, 255)
    for y in range(h - 3, h):
        for x in range(w):
            P(im, x, y, shade(hoof, (rng.rand() - 0.5) * 0.2))
    if spots:
        for _ in range((w * h) // 24):
            cx, cy = rng.randint(0, w - 1), rng.randint(2, h - 4)
            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    if rng.chance(0.6):
                        P(im, cx + dx, cy + dy, shade(spots, (rng.rand() - 0.5) * 0.2))
    if snout:  # pig/cow nose on head-front (x ~ 0..8 top-left for these layouts)
        rect(im, 2, 4, 7, 8, snout)
    save(im, *path)


def gen_entities():
    n = 0
    # --- creeper (iconic face) ---
    im = img(64, 32); rng = Rng("entity:creeper")
    base_fill(im, 64, 32, (78, 128, 58), rng, 0.18)
    # mossy mottling
    for _ in range(120):
        P(im, rng.randint(0, 63), rng.randint(0, 31),
          shade((60, 104, 44), (rng.rand() - 0.5) * 0.4))
    # classic face on front-of-head UV: front face at x8..15, y8..15
    face = (28, 30, 18)
    rect(im, 9, 9, 10, 11, face); rect(im, 13, 9, 14, 11, face)   # eyes
    rect(im, 11, 11, 12, 14, face)                                 # nose
    rect(im, 9, 13, 10, 15, face); rect(im, 13, 13, 14, 15, face)  # mouth corners
    save(im, "entity", "creeper", "creeper.png"); n += 1

    # --- skeletons (bone, dark sockets) ---
    for nm, col, eye in [("skeleton", (208, 204, 188), (30, 30, 34)),
                         ("wither_skeleton", (54, 52, 50), (60, 60, 60)),
                         ("stray", (180, 196, 200), (40, 60, 70))]:
        im = img(64, 32); rng = Rng("entity:" + nm)
        base_fill(im, 64, 32, col, rng, 0.1)
        # rib gaps on torso band
        for x in range(18, 30, 3):
            rect(im, x, 22, x, 30, shade(col, -0.4))
        rect(im, 10, 10, 11, 11, eye); rect(im, 13, 10, 14, 11, eye)  # eye sockets
        save(im, "entity", "skeleton", nm + ".png"); n += 1

    # --- humanoids with clothing ---
    humanoid("zombie", ("entity", "zombie", "zombie.png"), 64, 64,
             skin=(86, 122, 80), tunic=(70, 96, 130), trousers=(70, 60, 44))
    humanoid("husk", ("entity", "zombie", "husk.png"), 64, 64,
             skin=(150, 134, 92), tunic=(120, 100, 60), trousers=(90, 76, 48))
    humanoid("drowned", ("entity", "zombie", "drowned.png"), 64, 64,
             skin=(70, 120, 110), tunic=(60, 96, 96), trousers=(54, 80, 80))
    humanoid("zombie_villager", ("entity", "zombie_villager", "zombie_villager.png"),
             64, 64, skin=(86, 122, 80), tunic=(110, 74, 44), trousers=(80, 56, 36))
    humanoid("villager", ("entity", "villager", "villager.png"), 64, 64,
             skin=(186, 150, 112), tunic=(108, 72, 44), trousers=(78, 54, 36),
             tunic2=(96, 64, 40))   # brown monk's robe
    humanoid("steve", ("entity", "player", "wide", "steve.png"), 64, 64,
             skin=(196, 156, 116), tunic=(96, 120, 150), trousers=(70, 60, 90))
    humanoid("alex", ("entity", "player", "slim", "alex.png"), 64, 64,
             skin=(206, 168, 130), tunic=(110, 140, 96), trousers=(96, 72, 48))
    n += 7

    # --- enderman (tall, dark, glowing eyes) ---
    im = img(64, 32); rng = Rng("entity:enderman")
    base_fill(im, 64, 32, (22, 20, 28), rng, 0.25)
    rect(im, 9, 11, 11, 12, (180, 120, 230)); rect(im, 13, 11, 15, 12, (180, 120, 230))
    save(im, "entity", "enderman", "enderman.png"); n += 1

    # --- animals (quadruped 64x32) ---
    quadruped("pig", ("entity", "pig", "pig.png"), 64, 32, (214, 150, 150),
              snout=(196, 120, 124))
    quadruped("cow", ("entity", "cow", "cow.png"), 64, 32, (98, 70, 44),
              spots=(232, 226, 214), snout=(180, 150, 150))
    quadruped("red_mooshroom", ("entity", "cow", "red_mooshroom.png"), 64, 32,
              (150, 56, 48), spots=(220, 60, 56))
    quadruped("sheep", ("entity", "sheep", "sheep.png"), 64, 32, (224, 220, 210))
    quadruped("sheep_fur", ("entity", "sheep", "sheep_fur.png"), 64, 32,
              (236, 232, 224))
    quadruped("chicken", ("entity", "chicken", "chicken.png"), 64, 32,
              (232, 228, 220), hoof=(220, 170, 40), snout=(220, 150, 30))
    quadruped("wolf", ("entity", "wolf", "wolf.png"), 64, 32, (150, 146, 140),
              spots=(110, 104, 98))
    quadruped("squid", ("entity", "squid", "squid.png"), 64, 32, (90, 70, 120))
    n += 8

    # --- slimes ---
    for nm, col, folder in [("slime", (96, 168, 84), "slime"),
                            ("magmacube", (180, 70, 30), "slime")]:
        im = img(64, 32); rng = Rng("entity:" + nm)
        base_fill(im, 64, 32, col, rng, 0.2)
        save(im, "entity", folder, nm + ".png"); n += 1

    # --- iron golem (128x128, iron + vines) ---
    im = img(128, 128); rng = Rng("entity:iron_golem")
    base_fill(im, 128, 128, (176, 172, 166), rng, 0.12)
    for _ in range(400):  # creeping vines
        x, y = rng.randint(0, 127), rng.randint(0, 127)
        if rng.chance(0.5):
            P(im, x, y, shade((90, 120, 60), (rng.rand() - 0.5) * 0.4))
    save(im, "entity", "iron_golem", "iron_golem.png"); n += 1

    # --- bat (64x64) ---
    im = img(64, 64); rng = Rng("entity:bat")
    base_fill(im, 64, 64, (84, 66, 54), rng, 0.18)
    save(im, "entity", "bat", "bat.png"); n += 1

    return n


# ==========================================================================
# GUI — parchment & wood panels (extra PNGs are harmless if a version
# doesn't reference them; correctly-sized where they are referenced)
# ==========================================================================
PARCH = (222, 206, 162)
WOOD = (120, 88, 54)
WOOD_D = (90, 64, 40)
SLOT = (150, 134, 100)
SLOT_D = (120, 104, 74)


def panel(im, x0, y0, x1, y1, rng):
    """Parchment field with a carved wooden border."""
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            P(im, x, y, shade(PARCH, (rng.rand() - 0.5) * 0.08))
    for t in range(3):
        col = WOOD if t == 0 else shade(WOOD, -0.1 * t)
        for x in range(x0 + t, x1 - t + 1):
            P(im, x, y0 + t, col); P(im, x, y1 - t, shade(col, -0.2))
        for y in range(y0 + t, y1 - t + 1):
            P(im, x0 + t, y, col); P(im, x1 - t, y, shade(col, -0.2))


def slot(im, x, y):
    rect(im, x, y, x + 17, y + 17, SLOT_D)
    rect(im, x + 1, y + 1, x + 16, y + 16, SLOT)
    for i in range(x + 1, x + 17):
        P(im, i, y + 1, shade(SLOT_D, -0.2))
    for i in range(y + 1, y + 17):
        P(im, x + 1, i, shade(SLOT_D, -0.2))


def slot_grid(im, x0, y0, cols, rows):
    for r in range(rows):
        for c in range(cols):
            slot(im, x0 + c * 18, y0 + r * 18)


def gen_gui():
    n = 0
    # menu / world-list backdrop tiles (tiled, size-tolerant)
    for nm in ("light_dirt_background", "menu_background"):
        im = img(32, 32); rng = Rng("gui:" + nm)
        noise_region(im, 0, 0, 31, 31, (120, 116, 108), rng, 0.12, 0.06, a=255)
        for i in range(0, 32, 16):  # faint mortar grid
            for j in range(32):
                P(im, i, j, shade((92, 88, 80), 0)); P(im, j, i, shade((92, 88, 80), 0))
        save(im, "gui", nm + ".png"); n += 1

    # title-screen plain background
    im = img(16, 16); rng = Rng("gui:title_bg")
    noise_region(im, 0, 0, 15, 15, (108, 104, 98), rng, 0.12, 0.06)
    save(im, "gui", "title", "background", "panorama_overlay.png"); n += 1

    # container backgrounds (256x256 canvas, themed used-area)
    def container(name, uw, uh, build):
        im = img(256, 256)
        rng = Rng("gui:" + name)
        panel(im, 0, 0, uw - 1, uh - 1, rng)
        build(im)
        save(im, "gui", "container", name + ".png")

    def inv(im):
        slot_grid(im, 7, 83, 9, 3)     # main inventory
        slot_grid(im, 7, 141, 9, 1)    # hotbar
        for i in range(4):             # armour column
            slot(im, 7, 7 + i * 18)
        slot_grid(im, 97, 17, 2, 2)    # 2x2 crafting
        slot(im, 153, 27)              # result
    container("inventory", 176, 166, inv)

    def craft(im):
        slot_grid(im, 29, 16, 3, 3)
        slot(im, 123, 34)              # result
        slot_grid(im, 7, 83, 9, 3)     # player inv
        slot_grid(im, 7, 141, 9, 1)
    container("crafting_table", 176, 166, craft)

    def furnace(im):
        slot(im, 55, 16)   # input
        slot(im, 55, 52)   # fuel
        slot(im, 111, 34)  # output
        slot_grid(im, 7, 83, 9, 3)
        slot_grid(im, 7, 141, 9, 1)
    container("furnace", 176, 166, furnace)

    def chest(im):
        slot_grid(im, 7, 17, 9, 6)     # 54-slot chest
        slot_grid(im, 7, 139, 9, 3)
        slot_grid(im, 7, 197, 9, 1)
    container("generic_54", 176, 222, chest)
    n += 4

    return n


if __name__ == "__main__":
    p = gen_particles()
    a = gen_paintings()
    e = gen_entities()
    g = gen_gui()
    print(f"Particles: {p}  Paintings: {a}  Entities: {e}  GUI: {g}  "
          f"= {p + a + e + g} extra textures")
