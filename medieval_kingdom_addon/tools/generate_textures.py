#!/usr/bin/env python3
"""
Procedural texture generator for the Medieval Kingdom add-on.

These are functional, UV-correct placeholder textures. Every texture maps to the
geometry that ships in the resource pack, so entities render correctly in-game.
Open any of them in Blockbench to repaint if you want higher-fidelity art.
"""
import os
import struct
import zlib
import random

random.seed(1337)

RP = os.path.join(os.path.dirname(__file__), "..", "resource_packs", "medieval_rp")
ENT_DIR = os.path.join(RP, "textures", "entity")
ITEM_DIR = os.path.join(RP, "textures", "items")
os.makedirs(ENT_DIR, exist_ok=True)
os.makedirs(ITEM_DIR, exist_ok=True)


class Img:
    """Tiny RGBA canvas with a hand-rolled PNG writer (no external deps at runtime)."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[(0, 0, 0, 0) for _ in range(w)] for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            if len(c) == 3:
                c = (c[0], c[1], c[2], 255)
            self.px[y][x] = c

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1):
            for x in range(x0, x1):
                self.set(x, y, c)

    def noise_rect(self, x0, y0, x1, y1, base, amount=14):
        for y in range(y0, y1):
            for x in range(x0, x1):
                d = random.randint(-amount, amount)
                r = max(0, min(255, base[0] + d))
                g = max(0, min(255, base[1] + d))
                b = max(0, min(255, base[2] + d))
                a = base[3] if len(base) == 4 else 255
                self.set(x, y, (r, g, b, a))

    def save(self, path):
        raw = bytearray()
        for y in range(self.h):
            raw.append(0)  # filter type 0
            for x in range(self.w):
                r, g, b, a = self.px[y][x]
                raw += bytes((r, g, b, a))

        def chunk(tag, data):
            c = tag + data
            return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

        sig = b"\x89PNG\r\n\x1a\n"
        ihdr = struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)
        idat = zlib.compress(bytes(raw), 9)
        with open(path, "wb") as f:
            f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b""))
        print("wrote", os.path.relpath(path))


# ---- Humanoid helper (64x64 vanilla layout) -------------------------------
# Box-UV face position for the FRONT (north) face of the head cube at uv (0,0),
# cube 8x8x8, is at pixel (8,8)-(16,16). We use that to paint a face / helmet.

def humanoid(base, accent, dark, eye=None, face=None):
    img = Img(64, 64)
    img.noise_rect(0, 0, 64, 64, base, 10)
    # head faces block (0,0)-(32,16)
    img.noise_rect(0, 0, 32, 16, accent, 8)
    # head front face (8,8)-(16,16)
    if face:
        img.noise_rect(8, 8, 16, 16, face, 6)
    if eye:
        img.rect(10, 11, 12, 13, eye)
        img.rect(14, 11, 16, 13, eye)
    # body (16,16)-(40,32) darker plate
    img.noise_rect(16, 16, 40, 32, dark, 10)
    # arms & legs get accent trim
    img.noise_rect(40, 16, 56, 32, base, 10)   # right arm
    img.noise_rect(0, 16, 16, 32, base, 10)    # right leg
    img.noise_rect(16, 48, 32, 64, base, 10)   # left leg
    img.noise_rect(32, 48, 48, 64, base, 10)   # left arm
    return img


# ---- Knight: steel plate with a blue tabard --------------------------------
humanoid(
    base=(120, 128, 140),
    accent=(150, 158, 170),
    dark=(60, 90, 160),   # blue tabard chest
    face=(210, 180, 150),
    eye=(40, 40, 60),
).save(os.path.join(ENT_DIR, "knight.png"))

# ---- Archer: leather & green hood ------------------------------------------
humanoid(
    base=(90, 70, 45),
    accent=(60, 100, 55),   # green hood
    dark=(110, 85, 55),
    face=(205, 175, 145),
    eye=(30, 30, 30),
).save(os.path.join(ENT_DIR, "archer.png"))

# ---- Animated Armor boss: dark iron, glowing cyan void, empty face ----------
armor = humanoid(
    base=(70, 74, 82),
    accent=(58, 62, 70),
    dark=(48, 52, 60),
    face=(10, 12, 16),      # empty black interior
    eye=(90, 230, 240),     # glowing cyan eyes in the void
)
# rivets on the chest plate
for (rx, ry) in [(18, 18), (37, 18), (18, 30), (37, 30), (28, 24)]:
    armor.set(rx, ry, (150, 200, 210, 255))
armor.save(os.path.join(ENT_DIR, "animated_armor.png"))

# A separate "broken" tint used for the final armor stage (more damage taken).
broken = humanoid(
    base=(58, 40, 36),
    accent=(50, 34, 30),
    dark=(44, 30, 28),
    face=(6, 6, 8),
    eye=(255, 120, 60),   # eyes turn ember-orange as it dies
)
broken.save(os.path.join(ENT_DIR, "animated_armor_broken.png"))


# ---- Fire Dragon (128x128) -------------------------------------------------
# The dragon geometry references broad UV regions; we paint scale-toned bands
# so body, wings, head and tail all read as fiery red/black scales.
def dragon():
    img = Img(128, 128)
    body = (150, 40, 30)
    belly = (210, 120, 40)
    wing = (90, 24, 22)
    membrane = (200, 70, 40)
    horn = (40, 30, 28)
    img.noise_rect(0, 0, 128, 128, body, 16)
    # belly / underside band
    img.noise_rect(0, 40, 128, 64, belly, 14)
    # wing membranes region
    img.noise_rect(0, 64, 128, 112, membrane, 20)
    img.noise_rect(0, 112, 64, 128, wing, 12)
    # head + horns region (top-left)
    img.noise_rect(0, 0, 48, 40, (120, 30, 26), 14)
    img.noise_rect(0, 0, 16, 12, horn, 8)
    # glowing eyes + mouth heat
    img.rect(20, 8, 24, 12, (255, 220, 80, 255))
    img.rect(30, 8, 34, 12, (255, 220, 80, 255))
    img.rect(16, 20, 40, 26, (255, 150, 40, 255))  # hot maw
    # scale speckle highlights
    for _ in range(600):
        x = random.randint(0, 127)
        y = random.randint(0, 127)
        img.set(x, y, (255, 180, 90, 255))
    return img


dragon().save(os.path.join(ENT_DIR, "fire_dragon.png"))


# ---- Dragon fireball projectile (16x16) ------------------------------------
def fireball():
    img = Img(16, 16)
    for y in range(16):
        for x in range(16):
            dx, dy = x - 7.5, y - 7.5
            d = (dx * dx + dy * dy) ** 0.5
            if d < 8:
                t = 1 - d / 8
                r = int(255)
                g = int(120 + 130 * t)
                b = int(30 * t)
                img.set(x, y, (r, g, b, 255))
    return img


fireball().save(os.path.join(ENT_DIR, "dragon_fireball.png"))


# ---- Fire sphere (expanding blast) 16x16, translucent red ------------------
def sphere():
    img = Img(16, 16)
    for y in range(16):
        for x in range(16):
            dx, dy = x - 7.5, y - 7.5
            d = (dx * dx + dy * dy) ** 0.5
            if d < 8:
                a = int(90 + 120 * (d / 8))   # brighter, more opaque at the rim
                img.set(x, y, (255, 40, 30, min(255, a)))
    return img


sphere().save(os.path.join(ENT_DIR, "fire_sphere.png"))


# ---- Pack icons (128x128) --------------------------------------------------
def pack_icon(c1, c2, path):
    img = Img(128, 128)
    for y in range(128):
        t = y / 128
        col = (
            int(c1[0] + (c2[0] - c1[0]) * t),
            int(c1[1] + (c2[1] - c1[1]) * t),
            int(c1[2] + (c2[2] - c1[2]) * t),
            255,
        )
        img.rect(0, y, 128, y + 1, col)
    # a little crenellated tower silhouette
    img.rect(48, 40, 80, 110, (40, 40, 46, 255))
    for x in range(48, 80, 8):
        img.rect(x, 34, x + 4, 40, (40, 40, 46, 255))
    img.rect(58, 70, 70, 90, (255, 200, 90, 255))  # window glow
    img.save(path)


pack_icon((60, 70, 110), (20, 24, 40), os.path.join(RP, "..", "medieval_rp_icon_tmp.png"))
print("done")
