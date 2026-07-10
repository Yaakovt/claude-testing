#!/usr/bin/env python3
"""
Procedural texture generator for the Medieval Kingdom add-on.

UV-correct, more-detailed placeholder art (panel lines, rivets, shading, glow).
Everything maps to the geometry that ships in the pack. Repaint in Blockbench
for higher-fidelity art.
"""
import os
import struct
import zlib
import math
import random

random.seed(1337)

RP = os.path.join(os.path.dirname(__file__), "..", "resource_packs", "medieval_rp")
ENT_DIR = os.path.join(RP, "textures", "entity")
ITEM_DIR = os.path.join(RP, "textures", "items")
os.makedirs(ENT_DIR, exist_ok=True)
os.makedirs(ITEM_DIR, exist_ok=True)


class Img:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[(0, 0, 0, 0) for _ in range(w)] for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            a = c[3] if len(c) == 4 else 255
            self.px[y][x] = (self._c(c[0]), self._c(c[1]), self._c(c[2]), self._c(a))

    def get(self, x, y):
        return self.px[y][x]

    def rect(self, x0, y0, x1, y1, c):
        for y in range(y0, y1):
            for x in range(x0, x1):
                self.set(x, y, c)

    def noise_rect(self, x0, y0, x1, y1, base, amount=12):
        for y in range(y0, y1):
            for x in range(x0, x1):
                d = random.randint(-amount, amount)
                a = base[3] if len(base) == 4 else 255
                self.set(x, y, (self._c(base[0] + d), self._c(base[1] + d), self._c(base[2] + d), a))

    def grad_rect(self, x0, y0, x1, y1, top, bot):
        h = max(1, y1 - y0 - 1)
        for y in range(y0, y1):
            t = (y - y0) / h
            col = (self._c(top[0] + (bot[0] - top[0]) * t),
                   self._c(top[1] + (bot[1] - top[1]) * t),
                   self._c(top[2] + (bot[2] - top[2]) * t))
            for x in range(x0, x1):
                d = random.randint(-6, 6)
                self.set(x, y, (self._c(col[0] + d), self._c(col[1] + d), self._c(col[2] + d), 255))

    def panel(self, x0, y0, x1, y1, line):
        for x in range(x0, x1):
            self.set(x, y0, line); self.set(x, y1 - 1, line)
        for y in range(y0, y1):
            self.set(x0, y, line); self.set(x1 - 1, y, line)

    def rivets(self, pts, c):
        for (x, y) in pts:
            self.set(x, y, c)

    @staticmethod
    def _c(v):
        return max(0, min(255, int(v)))

    def save(self, path):
        raw = bytearray()
        for y in range(self.h):
            raw.append(0)
            for x in range(self.w):
                r, g, b, a = self.px[y][x]
                raw += bytes((r, g, b, a))

        def chunk(tag, data):
            c = tag + data
            return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

        with open(path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n"
                    + chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0))
                    + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
                    + chunk(b"IEND", b""))
        print("wrote", os.path.relpath(path))


# =====================================================================
#  HUMANOID mobs (knight / archer) — 64x64 vanilla layout
# =====================================================================
def humanoid(base, accent, chest, face, eye, trim=None):
    img = Img(64, 64)
    img.noise_rect(0, 0, 64, 64, (base[0] - 20, base[1] - 20, base[2] - 20), 6)
    # head block
    img.grad_rect(0, 0, 32, 16, accent, (accent[0] - 25, accent[1] - 25, accent[2] - 25))
    img.noise_rect(8, 8, 16, 16, face, 6)          # face front
    img.set(10, 11, eye); img.set(11, 11, eye)
    img.set(14, 11, eye); img.set(15, 11, eye)
    # torso with tabard/plate
    img.grad_rect(16, 16, 40, 32, chest, (chest[0] - 30, chest[1] - 30, chest[2] - 30))
    img.panel(20, 20, 36, 32, (chest[0] - 45, chest[1] - 45, chest[2] - 45))
    # arms & legs
    for (x0, y0) in [(40, 16), (0, 16), (16, 48), (32, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, base, (base[0] - 30, base[1] - 30, base[2] - 30))
    if trim:
        img.rivets([(21, 21), (34, 21), (21, 30), (34, 30)], trim)
    return img


humanoid(base=(122, 130, 142), accent=(150, 158, 172), chest=(52, 84, 158),
         face=(214, 184, 152), eye=(45, 45, 70), trim=(200, 205, 215)
         ).save(os.path.join(ENT_DIR, "knight.png"))

humanoid(base=(96, 74, 48), accent=(64, 104, 58), chest=(74, 58, 40),
         face=(208, 178, 148), eye=(35, 30, 28), trim=(150, 120, 80)
         ).save(os.path.join(ENT_DIR, "archer.png"))


# =====================================================================
#  ANIMATED ARMOR — 64x64, dark ornate iron, glowing helm slit
# =====================================================================
def armor_tex(metal, deep, glow, rust=0):
    img = Img(64, 64)
    img.noise_rect(0, 0, 64, 64, (deep[0] - 10, deep[1] - 10, deep[2] - 10), 5)
    # helm block: gradient + brow + slit
    img.grad_rect(0, 0, 32, 16, metal, deep)
    img.panel(0, 0, 16, 16, (deep[0] - 15, deep[1] - 15, deep[2] - 15))
    img.rect(8, 8, 16, 16, (6, 7, 10))            # dark void inside helm (front)
    img.rect(9, 11, 15, 13, glow)                  # glowing eye slit
    img.set(8, 12, (glow[0] // 2, glow[1] // 2, glow[2] // 2))
    # breastplate
    img.grad_rect(16, 16, 40, 32, metal, deep)
    img.panel(18, 17, 38, 31, (deep[0] - 20, deep[1] - 20, deep[2] - 20))
    img.rect(27, 18, 29, 30, (deep[0] - 25, deep[1] - 25, deep[2] - 25))  # centre ridge
    img.rivets([(19, 18), (37, 18), (19, 30), (37, 30), (28, 24)], (glow[0], glow[1], glow[2]))
    # arms & legs
    for (x0, y0) in [(40, 16), (0, 16), (16, 48), (32, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, metal, deep)
        img.panel(x0 + 4, y0 + 2, x0 + 12, y0 + 14, (deep[0] - 18, deep[1] - 18, deep[2] - 18))
    # plume / crest strip up top-right unused area
    img.grad_rect(40, 0, 56, 8, glow, (glow[0] // 2, glow[1] // 2, glow[2] // 2))
    if rust:
        for _ in range(rust):
            x, y = random.randint(0, 63), random.randint(16, 63)
            img.set(x, y, (120, 60, 30))
    return img


armor_tex(metal=(84, 90, 100), deep=(50, 54, 63), glow=(120, 235, 245)
          ).save(os.path.join(ENT_DIR, "animated_armor.png"))
armor_tex(metal=(70, 58, 52), deep=(44, 34, 30), glow=(255, 150, 70), rust=260
          ).save(os.path.join(ENT_DIR, "animated_armor_broken.png"))


# =====================================================================
#  FIRE DRAGON — 128x128, layered scales, spikes, membranes
# =====================================================================
def dragon(body, belly, membrane, wingbone, horn, eye, maw, ember):
    img = Img(128, 128)
    img.noise_rect(0, 0, 128, 128, body, 12)
    # scale rows across the body region
    for y in range(0, 64):
        shade = 18 * math.sin(y / 3.0)
        for x in range(0, 128):
            r, g, b, a = img.get(x, y)
            img.set(x, y, (img._c(r + shade), img._c(g + shade / 2), img._c(b), 255))
    img.grad_rect(0, 40, 128, 64, belly, (belly[0] - 40, belly[1] - 40, belly[2] - 30))  # belly plates
    for yy in range(42, 63, 3):
        img.rect(0, yy, 128, yy + 1, (belly[0] - 55, belly[1] - 55, belly[2] - 40))
    # wing membranes
    img.grad_rect(0, 64, 128, 112, membrane, (membrane[0] - 60, membrane[1] - 50, membrane[2] - 40))
    for xx in range(0, 128, 10):
        img.rect(xx, 64, xx + 1, 112, wingbone)          # wing struts
    img.noise_rect(0, 112, 64, 128, wingbone, 8)
    # head + horns (top-left)
    img.grad_rect(0, 0, 48, 40, (body[0] - 22, body[1] - 8, body[2] - 4), (body[0] - 70, body[1] - 20, body[2] - 12))
    img.noise_rect(0, 0, 16, 12, horn, 6)
    img.rect(20, 8, 24, 12, eye)                          # eyes
    img.rect(30, 8, 34, 12, eye)
    img.set(21, 9, (255, 255, 230)); img.set(31, 9, (255, 255, 230))
    img.rect(16, 20, 40, 26, maw)                         # maw
    img.rect(16, 22, 40, 23, (maw[0], min(255, maw[1] + 70), min(255, maw[2] + 80)))
    # ember/speckle
    for _ in range(700):
        x, y = random.randint(0, 127), random.randint(0, 127)
        img.set(x, y, ember)
    # tail spade region highlight
    img.grad_rect(88, 60, 128, 78, (body[0] + 20, body[1] + 6, body[2] + 4), (body[0] - 40, body[1] - 12, body[2] - 6))
    return img


# fire — red/orange
dragon(body=(150, 40, 30), belly=(216, 128, 46), membrane=(196, 66, 40),
       wingbone=(86, 24, 22), horn=(46, 34, 30), eye=(255, 226, 96),
       maw=(255, 150, 40), ember=(255, 180, 90)
       ).save(os.path.join(ENT_DIR, "fire_dragon.png"))
# ice — glacial blue/white
dragon(body=(58, 122, 172), belly=(208, 236, 248), membrane=(140, 200, 235),
       wingbone=(36, 74, 110), horn=(220, 240, 250), eye=(160, 240, 255),
       maw=(120, 200, 255), ember=(230, 248, 255)
       ).save(os.path.join(ENT_DIR, "fire_dragon_ice.png"))
# poison — venomous green
dragon(body=(74, 128, 46), belly=(168, 190, 66), membrane=(112, 164, 58),
       wingbone=(46, 84, 30), horn=(30, 44, 24), eye=(230, 120, 250),
       maw=(150, 235, 60), ember=(180, 230, 100)
       ).save(os.path.join(ENT_DIR, "fire_dragon_poison.png"))


# =====================================================================
#  Projectiles / effects
# =====================================================================
def radial(size, inner, outer, alpha_edge=False, core_white=True):
    img = Img(size, size)
    c = (size - 1) / 2.0
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - c, y - c) / (size / 2.0)
            if d <= 1.0:
                t = 1 - d
                col = (Img._c(outer[0] + (inner[0] - outer[0]) * t),
                       Img._c(outer[1] + (inner[1] - outer[1]) * t),
                       Img._c(outer[2] + (inner[2] - outer[2]) * t))
                a = Img._c(80 + 175 * d) if alpha_edge else 255
                img.set(x, y, (col[0], col[1], col[2], a))
    if core_white:
        img.set(int(c), int(c), (255, 255, 230, 255))
    return img


radial(16, (255, 250, 180), (200, 40, 10)).save(os.path.join(ENT_DIR, "dragon_fireball.png"))
radial(16, (255, 90, 60), (150, 12, 8), alpha_edge=True, core_white=False).save(os.path.join(ENT_DIR, "fire_sphere.png"))
radial(16, (240, 252, 255), (60, 140, 220)).save(os.path.join(ENT_DIR, "ice_shard.png"))
radial(16, (220, 255, 120), (60, 120, 20)).save(os.path.join(ENT_DIR, "venom_glob.png"))

# frost wisp — 32x32 UV texture for geometry.frost_wisp
# core cube 6x6x6 at uv (0,0); orbit shards 2x2x2 at uv (0,20)
def frost_wisp():
    img = Img(32, 32)
    # core block region (0,0)-(24,12): icy gradient panels
    img.grad_rect(0, 0, 24, 12, (200, 236, 252), (86, 150, 210))
    for x0 in range(0, 24, 6):
        img.panel(x0, 6, x0 + 6, 12, (60, 110, 170))
    # bright "soul" on the front face (6,6)-(12,12)
    img.grad_rect(7, 7, 11, 11, (255, 255, 255), (170, 230, 255))
    img.set(8, 8, (255, 255, 255)); img.set(9, 9, (230, 250, 255))
    # frost cracks
    for _ in range(30):
        x, y = random.randint(0, 23), random.randint(0, 11)
        img.set(x, y, (235, 250, 255))
    # shard region (0,20)-(8,26): crystalline white-blue
    img.grad_rect(0, 20, 8, 26, (240, 252, 255), (120, 190, 240))
    img.set(2, 21, (255, 255, 255)); img.set(5, 23, (255, 255, 255))
    return img


frost_wisp().save(os.path.join(ENT_DIR, "frost_wisp.png"))


# plague rat — 32x32 painted per UV region of geometry.plague_rat
def plague_rat():
    img = Img(32, 32)
    fur = (96, 84, 52)
    sick = (110, 130, 60)
    dark = (66, 56, 36)
    # body box 4x3x7 at uv(0,0): region (0,0)-(22,10)
    img.noise_rect(0, 0, 22, 10, fur, 12)
    # spine stripe on top face (7,0)-(11,7): sickly green ridge
    img.noise_rect(8, 0, 10, 7, sick, 10)
    # mangy patches
    for _ in range(26):
        x, y = random.randint(0, 21), random.randint(0, 9)
        img.set(x, y, sick if random.random() < 0.6 else dark)
    # head box 3x3x3 at uv(0,16): region (0,16)-(12,22); front face (3,19)-(6,22)
    img.noise_rect(0, 16, 12, 22, fur, 12)
    img.set(3, 19, (216, 70, 216)); img.set(5, 19, (216, 70, 216))   # glowing eyes
    img.set(4, 21, (54, 38, 32))                                      # nose
    img.noise_rect(6, 19, 9, 22, (86, 74, 46), 8)                     # muzzle side shading
    # ears 1x1x1 at uv(22,0): region (22,0)-(26,2) — pink inner
    img.noise_rect(22, 0, 26, 2, (172, 116, 120), 10)
    # tail 1x1x6 at uv(12,16): region (12,16)-(26,23) — bare pink, segmented
    img.grad_rect(12, 16, 26, 23, (176, 126, 116), (118, 78, 72))
    for x in range(14, 26, 3):
        img.rect(x, 16, x + 1, 23, (140, 92, 86))
    # legs 1x1x1 at uv(0,24): region (0,24)-(4,26) — dark claws
    img.noise_rect(0, 24, 4, 26, dark, 8)
    return img


plague_rat().save(os.path.join(ENT_DIR, "plague_rat.png"))


# ---- worn armor layer textures (64x32, vanilla armor layout) --------------
ARMOR_DIR = os.path.join(RP, "textures", "models", "armor")
os.makedirs(ARMOR_DIR, exist_ok=True)


def knight_helm_layer():
    img = Img(64, 32)  # fully transparent except the helmet block
    # helmet block (0,0)-(32,16), same layout as a head cube
    img.grad_rect(0, 0, 32, 16, (96, 102, 112), (52, 56, 64))
    for x0 in (0, 8, 16, 24):
        img.panel(x0, 8, x0 + 8, 16, (40, 44, 52))
    img.panel(8, 0, 16, 8, (40, 44, 52))
    # face plate: dark void + glowing cyan slit on the front face (8,8)-(16,16)
    img.rect(9, 10, 15, 15, (16, 18, 24))
    img.rect(9, 11, 15, 13, (120, 235, 245))
    # crest rivets
    img.rivets([(10, 9), (13, 9), (12, 2)], (150, 200, 210))
    return img


def dragon_chest_layer():
    img = Img(64, 32)
    scale_hi = (196, 54, 36)
    scale_lo = (110, 28, 24)
    # torso (16,16)-(40,32)
    img.grad_rect(16, 16, 40, 32, scale_hi, scale_lo)
    for y in range(18, 32, 3):
        img.rect(16, y, 40, y + 1, (150, 40, 28))
    img.panel(20, 20, 36, 32, (80, 22, 18))
    img.set(28, 22, (255, 180, 90)); img.set(27, 26, (255, 180, 90))  # ember studs
    # arms (40,16)-(56,32) — scaled pauldron sleeves
    img.grad_rect(40, 16, 56, 32, scale_hi, scale_lo)
    for y in range(18, 32, 3):
        img.rect(40, y, 56, y + 1, (150, 40, 28))
    return img


knight_helm_layer().save(os.path.join(ARMOR_DIR, "knight_helm_layer.png"))
dragon_chest_layer().save(os.path.join(ARMOR_DIR, "dragon_chest_layer.png"))


def dragon_chestplate():
    img = Img(16, 16)
    # chestplate silhouette in red scales
    img.grad_rect(3, 3, 13, 13, (190, 50, 34), (110, 28, 24))
    img.rect(3, 3, 5, 6, (0, 0, 0, 0))     # neck cutout corners
    img.rect(11, 3, 13, 6, (0, 0, 0, 0))
    img.rect(6, 3, 10, 5, (0, 0, 0, 0))    # neck hole
    img.panel(3, 5, 13, 13, (70, 20, 16))
    for y in range(6, 13, 2):
        img.rect(4, y, 12, y + 1, (150, 40, 28))
    img.set(8, 8, (255, 180, 90))
    return img


dragon_chestplate().save(os.path.join(ITEM_DIR, "dragon_chestplate.png"))


# =====================================================================
#  Custom items — 16x16
# =====================================================================
def warhammer():
    img = Img(16, 16)
    # handle (diagonal)
    for i in range(10):
        img.set(4 + i, 12 - i, (110, 74, 40)); img.set(5 + i, 12 - i, (140, 96, 56))
    # hammer head
    img.rect(9, 1, 15, 7, (86, 92, 102))
    img.grad_rect(9, 1, 15, 7, (150, 158, 170), (70, 76, 86))
    img.panel(9, 1, 15, 7, (48, 52, 60))
    img.rect(11, 3, 13, 5, (120, 235, 245))     # glowing core
    return img


def dragon_heart():
    img = Img(16, 16)
    for y in range(16):
        for x in range(16):
            # heart shape
            fx = (x - 8) / 6.0
            fy = (y - 6) / 6.0
            v = (fx * fx + fy * fy - 1)
            v = v * v * v - fx * fx * fy * fy * fy
            if v < 0:
                d = min(1.0, math.hypot(fx, fy))
                img.set(x, y, (Img._c(255 - 40 * d), Img._c(70 - 40 * d), Img._c(30 - 20 * d), 255))
    img.set(6, 6, (255, 220, 160)); img.set(7, 5, (255, 240, 200))  # highlight
    return img


def dragon_scale():
    img = Img(16, 16)
    img.rect(0, 0, 16, 16, (0, 0, 0, 0))
    for y in range(2, 15):
        for x in range(3, 13):
            if 2 < (x - 8) ** 2 / 16 + (y - 8) ** 2 / 30 < 1:
                pass
    # simple overlapping-scale diamond
    for y in range(1, 15):
        w = 7 - abs(y - 8) // 2
        for x in range(8 - w, 8 + w):
            t = (y - 1) / 13
            img.set(x, y, (Img._c(190 - 90 * t), Img._c(50 - 20 * t), Img._c(34 - 10 * t), 255))
    for y in range(3, 14, 3):
        for x in range(3, 13):
            img.set(x, y, (110, 22, 18, 255))
    img.set(7, 4, (255, 180, 120, 255))
    return img


def iron_plating():
    img = Img(16, 16)
    img.rect(2, 2, 14, 14, (0, 0, 0, 0))
    img.grad_rect(3, 2, 13, 15, (150, 158, 170), (74, 80, 90))
    img.panel(3, 2, 13, 15, (48, 52, 60))
    img.rivets([(5, 4), (11, 4), (5, 12), (11, 12)], (200, 206, 216))
    img.rect(7, 6, 9, 10, (60, 66, 76))
    return img


def searing_fang():
    img = Img(16, 16)
    # curved fang blade
    for i in range(13):
        w = max(1, 4 - i // 4)
        for j in range(w):
            img.set(3 + i // 3 + j, 13 - i, (240, 236, 220) if j == 0 else (210, 120, 60))
    img.rect(2, 12, 6, 15, (90, 60, 34))       # grip
    img.set(9, 3, (255, 240, 200))
    return img


def knight_trophy():
    img = Img(16, 16)
    # a little great-helm on a stand
    img.grad_rect(4, 2, 12, 11, (110, 118, 130), (60, 66, 76))
    img.panel(4, 2, 12, 11, (40, 44, 52))
    img.rect(5, 6, 11, 8, (10, 12, 16))         # slit
    img.rect(6, 6, 10, 7, (120, 235, 245))      # glow
    img.rect(5, 12, 11, 14, (90, 62, 34))       # wood base
    return img


warhammer().save(os.path.join(ITEM_DIR, "knight_hammer.png"))
knight_trophy().save(os.path.join(ITEM_DIR, "knight_trophy.png"))
iron_plating().save(os.path.join(ITEM_DIR, "iron_plating.png"))
dragon_heart().save(os.path.join(ITEM_DIR, "dragon_heart.png"))
dragon_scale().save(os.path.join(ITEM_DIR, "dragon_scale.png"))
searing_fang().save(os.path.join(ITEM_DIR, "searing_fang.png"))


# =====================================================================
#  Pack icon
# =====================================================================
def pack_icon(path):
    img = Img(128, 128)
    img.grad_rect(0, 0, 128, 128, (60, 70, 110), (18, 20, 34))
    img.rect(48, 40, 80, 110, (44, 48, 56))
    img.grad_rect(48, 40, 80, 110, (70, 76, 88), (34, 38, 46))
    for x in range(48, 80, 8):
        img.rect(x, 34, x + 4, 40, (44, 48, 56))
    img.rect(58, 66, 70, 86, (255, 200, 90))
    img.rect(60, 92, 68, 110, (24, 26, 32))     # door
    img.save(path)


pack_icon(os.path.join(RP, "pack_icon.png"))
pack_icon(os.path.join(RP, "..", "..", "behavior_packs", "medieval_bp", "pack_icon.png"))
print("done")


# =====================================================================
#  v2.0 — three new bosses, new mobs, relics and armor
# =====================================================================

# ---- BLACK KNIGHT — 64x64 humanoid layout + shield/cape/plume regions ----
def black_knight(berserk=False):
    img = Img(64, 64)
    steel = (52, 52, 60) if not berserk else (58, 46, 44)
    deep = (28, 28, 34)
    glow = (255, 66, 48) if berserk else (196, 40, 36)
    silver = (128, 132, 142)
    # helm block
    img.grad_rect(0, 0, 32, 16, steel, deep)
    img.panel(0, 0, 16, 16, (18, 18, 24))
    img.rect(8, 8, 16, 16, (14, 14, 18))                 # face plate
    img.rect(9, 11, 15, 13, glow)                        # eye slit
    # helm overlay (hat) — raised great-helm shell
    img.grad_rect(32, 0, 64, 16, (steel[0] + 8, steel[1] + 8, steel[2] + 10), deep)
    img.panel(32, 0, 48, 16, (16, 16, 22))
    img.rect(40, 8, 48, 16, (12, 12, 16))
    img.rect(41, 11, 47, 13, glow)
    img.rivets([(42, 9), (45, 9)], silver)
    # cuirass
    img.grad_rect(16, 16, 40, 32, steel, deep)
    img.panel(20, 20, 36, 32, (16, 16, 22))
    img.rect(27, 21, 29, 29, glow)                       # red center line
    img.rivets([(21, 21), (34, 21), (21, 30), (34, 30)], silver)
    # arms
    for (x0, y0) in [(40, 16), (32, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, steel, deep)
        img.panel(x0 + 4, y0 + 2, x0 + 12, y0 + 14, (18, 18, 24))
    # legs
    for (x0, y0) in [(0, 16), (16, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, (steel[0] - 6, steel[1] - 6, steel[2] - 4), deep)
        img.panel(x0 + 4, y0 + 2, x0 + 12, y0 + 14, (16, 16, 22))
    # shield (0,32)-(18,41): black field, red cross, steel rim
    img.grad_rect(0, 32, 18, 41, (34, 34, 40), (20, 20, 26))
    img.panel(0, 32, 18, 41, silver)
    img.rect(8, 33, 10, 40, glow)
    img.rect(3, 35, 15, 37, glow)
    # cape (18,32)-(36,47): crimson with dark hem
    img.grad_rect(18, 32, 36, 47, (122, 26, 26), (52, 12, 14))
    img.rect(18, 44, 36, 47, (40, 10, 12))
    img.rect(26, 36, 28, 40, (216, 172, 60))             # gold clasp emblem
    # plume (40,32)-(60,44): red bristle stripes
    img.grad_rect(40, 32, 60, 44, (190, 40, 34), (96, 18, 18))
    for x in range(40, 60, 2):
        img.rect(x, 32, x + 1, 44, (150, 28, 26))
    if berserk:
        for _ in range(120):
            x, y = random.randint(0, 63), random.randint(16, 63)
            img.set(x, y, (255, random.randint(90, 150), 40))
    return img


black_knight().save(os.path.join(ENT_DIR, "black_knight.png"))
black_knight(berserk=True).save(os.path.join(ENT_DIR, "black_knight_berserk.png"))


# ---- BANDIT — 64x64 humanoid, hooded leather ----
def bandit():
    img = Img(64, 64)
    leather = (96, 74, 48)
    dark = (56, 42, 30)
    hood = (70, 56, 40)
    face = (206, 172, 140)
    img.noise_rect(0, 0, 64, 64, dark, 6)
    # head: hood sides + bare face
    img.grad_rect(0, 0, 32, 16, hood, (hood[0] - 22, hood[1] - 18, hood[2] - 14))
    img.noise_rect(8, 8, 16, 16, face, 6)
    img.set(10, 11, (40, 32, 26)); img.set(11, 11, (40, 32, 26))
    img.set(14, 11, (40, 32, 26)); img.set(15, 11, (40, 32, 26))
    img.rect(10, 14, 15, 15, (150, 118, 92))             # stubble shadow
    # hood overlay with open face
    img.grad_rect(32, 0, 64, 16, (hood[0] - 10, hood[1] - 8, hood[2] - 6), (36, 28, 20))
    img.rect(40, 8, 48, 16, (0, 0, 0, 0))                # face opening
    img.rect(40, 8, 48, 9, (30, 24, 18))                 # hood brim
    # jerkin with diagonal strap
    img.grad_rect(16, 16, 40, 32, leather, (leather[0] - 32, leather[1] - 26, leather[2] - 18))
    img.panel(20, 20, 36, 32, (46, 34, 24))
    for i in range(10):
        img.set(22 + i, 20 + i if 20 + i < 32 else 31, (40, 30, 22))
    img.rivets([(23, 22), (27, 25), (31, 28)], (150, 150, 158))
    # arms: tan shirt
    for (x0, y0) in [(40, 16), (32, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, (130, 106, 74), (86, 68, 46))
    # legs: dark trousers, boots at bottom
    for (x0, y0) in [(0, 16), (16, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, (62, 50, 40), (40, 32, 26))
        img.rect(x0, y0 + 12, x0 + 16, y0 + 16, (34, 26, 20))
    return img


bandit().save(os.path.join(ENT_DIR, "bandit.png"))


# ---- SKELETON MAGE — 64x64 humanoid, bone + violet robe ----
def skeleton_mage():
    img = Img(64, 64)
    bone = (226, 220, 202)
    robe = (62, 44, 96)
    robe_d = (34, 24, 56)
    glow = (170, 120, 250)
    img.noise_rect(0, 0, 64, 64, robe_d, 5)
    # skull head
    img.grad_rect(0, 0, 32, 16, bone, (bone[0] - 45, bone[1] - 45, bone[2] - 40))
    img.noise_rect(8, 8, 16, 16, bone, 5)
    img.rect(9, 10, 12, 13, (20, 16, 28)); img.rect(12, 10, 15, 13, (20, 16, 28))
    img.set(10, 11, glow); img.set(13, 11, glow)          # glowing pupils
    img.rect(10, 14, 14, 15, (150, 142, 126))             # jaw line
    for x in range(10, 14):
        img.set(x, 14, (100, 94, 82))
    # hood overlay, open at the face
    img.grad_rect(32, 0, 64, 16, robe, robe_d)
    img.rect(40, 8, 48, 16, (0, 0, 0, 0))
    img.rect(40, 8, 48, 9, (26, 18, 44))
    # robe body with rune belt
    img.grad_rect(16, 16, 40, 32, robe, robe_d)
    img.panel(20, 20, 36, 32, (26, 18, 44))
    img.rect(20, 27, 36, 29, (44, 32, 70))
    img.rivets([(22, 28), (26, 28), (30, 28), (34, 28)], glow)
    # arms: sleeves ending in bone hands
    for (x0, y0) in [(40, 16), (32, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, robe, robe_d)
        img.rect(x0, y0 + 13, x0 + 16, y0 + 16, bone)
    # legs: robe skirt continues
    for (x0, y0) in [(0, 16), (16, 48)]:
        img.grad_rect(x0, y0, x0 + 16, y0 + 16, (robe[0] - 10, robe[1] - 8, robe[2] - 14), robe_d)
        img.rect(x0, y0 + 14, x0 + 16, y0 + 16, (22, 16, 36))
    return img


skeleton_mage().save(os.path.join(ENT_DIR, "skeleton_mage.png"))


# ---- LICH KING — 64x64 custom UV (see geometry.lich_king) ----
def lich_king(wraith=False):
    img = Img(64, 64)
    bone = (222, 218, 200) if not wraith else (190, 210, 210)
    robe = (58, 34, 92) if not wraith else (30, 46, 58)
    robe_d = (30, 18, 50) if not wraith else (14, 24, 32)
    glow = (120, 235, 220) if not wraith else (170, 255, 240)
    gold = (222, 178, 64)
    # skull head (0,0)-(32,16), front face (8,8)-(16,16)
    img.grad_rect(0, 0, 32, 16, bone, (bone[0] - 50, bone[1] - 50, bone[2] - 45))
    img.noise_rect(8, 8, 16, 16, bone, 5)
    img.rect(9, 10, 12, 13, (12, 14, 18)); img.rect(12, 10, 15, 13, (12, 14, 18))
    img.set(10, 11, glow); img.set(11, 11, glow)
    img.set(13, 11, glow); img.set(14, 11, glow)
    img.rect(10, 14, 14, 16, (140, 134, 118))            # teeth row
    for x in range(10, 14):
        img.set(x, 15, (90, 86, 74))
    # crown (32,0)-(64,10): gold ring with jewels
    img.grad_rect(32, 0, 64, 10, gold, (150, 110, 30))
    img.panel(32, 0, 64, 10, (110, 80, 22))
    for x in range(34, 64, 4):
        img.set(x, 1, (255, 232, 140))                   # spike tips
        img.set(x, 8, (90, 220, 200))                    # jewels
    # staff rod (0,16)-(4,33)
    img.grad_rect(0, 16, 4, 33, (104, 72, 40), (62, 42, 24))
    # orb (4,16)-(16,22)
    img.grad_rect(4, 16, 16, 22, glow, (40, 90, 90))
    img.set(9, 18, (255, 255, 240)); img.set(10, 18, (235, 255, 250))
    # torso robe (16,16)-(40,32)
    img.grad_rect(16, 16, 40, 32, robe, robe_d)
    img.panel(20, 20, 36, 32, (robe_d[0] - 8, robe_d[1] - 6, robe_d[2] - 10))
    img.rect(20, 26, 36, 28, (robe[0] + 20, robe[1] + 14, robe[2] + 24))
    img.rivets([(22, 27), (27, 27), (33, 27)], glow)     # rune studs
    # arms (40,16)-(52,31)
    img.grad_rect(40, 16, 52, 31, robe, robe_d)
    img.rect(40, 28, 52, 31, bone)                       # bone hands
    # robe skirt (0,34)-(32,52) with glowing hem runes
    img.grad_rect(0, 34, 32, 52, (robe[0] - 6, robe[1] - 4, robe[2] - 8), robe_d)
    img.rect(0, 49, 32, 52, (robe_d[0] - 6, robe_d[1] - 4, robe_d[2] - 8))
    for x in range(2, 32, 5):
        img.set(x, 50, glow)
    # soul shards (32,52)-(40,56)
    img.grad_rect(32, 52, 40, 56, (240, 255, 252), glow)
    img.set(34, 53, (255, 255, 255))
    if wraith:
        for _ in range(90):
            x, y = random.randint(0, 63), random.randint(16, 63)
            img.set(x, y, (glow[0], glow[1], glow[2]))
    return img


lich_king().save(os.path.join(ENT_DIR, "lich_king.png"))
lich_king(wraith=True).save(os.path.join(ENT_DIR, "lich_king_wraith.png"))


# ---- SIEGE GOLEM — 128x128 custom UV (see geometry.siege_golem) ----
def crack(img, x0, y0, x1, y1, col, n):
    for _ in range(n):
        x = random.randint(x0, x1 - 1)
        y = random.randint(y0, y1 - 1)
        for _ in range(random.randint(3, 7)):
            img.set(x, y, col)
            x += random.choice([-1, 0, 1])
            y += random.choice([0, 1])


def siege_golem(cracked=False):
    img = Img(128, 128)
    stone = (112, 114, 120)
    stone_d = (70, 72, 78)
    iron = (140, 146, 156)
    iron_d = (78, 84, 94)
    seam = (255, 150, 50)
    # torso (0,0)-(72,30)
    img.grad_rect(0, 0, 72, 30, stone, stone_d)
    img.panel(12, 12, 36, 30, (52, 54, 60))              # front face frame
    for y in range(4, 30, 6):
        img.rect(0, y, 72, y + 1, (60, 62, 68))          # masonry courses
    crack(img, 0, 0, 72, 30, (48, 50, 56), 26 if not cracked else 60)
    # head (72,0)-(108,16), front face (80,8)-(90,16)
    img.grad_rect(72, 0, 108, 16, stone, stone_d)
    img.panel(80, 8, 90, 16, (50, 52, 58))
    img.rect(81, 10, 89, 13, (24, 26, 30))
    img.rect(82, 11, 85, 12, seam); img.rect(86, 11, 88, 12, seam)   # glowing eyes
    # arms (0,30)-(40,62)
    img.grad_rect(0, 30, 40, 62, stone, stone_d)
    for y in range(34, 62, 7):
        img.rect(0, y, 40, y + 1, (60, 62, 68))
    img.rect(0, 54, 40, 62, iron_d)                      # iron fists
    img.grad_rect(0, 54, 40, 58, iron, iron_d)
    img.rivets([(4, 56), (14, 56), (24, 56), (34, 56)], (200, 206, 216))
    crack(img, 0, 30, 40, 54, (48, 50, 56), 20 if not cracked else 46)
    # legs (40,30)-(76,57)
    img.grad_rect(40, 30, 76, 57, (stone[0] - 8, stone[1] - 8, stone[2] - 8), stone_d)
    for y in range(34, 57, 6):
        img.rect(40, y, 76, y + 1, (58, 60, 66))
    img.rect(40, 52, 76, 57, (52, 54, 60))               # stone feet
    crack(img, 40, 30, 76, 52, (46, 48, 54), 16 if not cracked else 40)
    # core (76,30)-(96,40): molten heart
    img.grad_rect(76, 30, 96, 40, (255, 210, 90), (200, 80, 20))
    img.panel(76, 30, 96, 40, (120, 50, 16))
    img.set(85, 34, (255, 255, 230)); img.set(86, 35, (255, 250, 210))
    # chest plate (0,62)-(56,76): riveted iron
    img.grad_rect(0, 62, 56, 76, iron, iron_d)
    img.panel(2, 64, 28, 76, (52, 56, 64))
    img.rect(13, 66, 16, 74, (60, 66, 74))               # center ridge
    img.rivets([(4, 66), (25, 66), (4, 73), (25, 73), (14, 64)], (210, 216, 226))
    # pauldrons (56,62)-(104,80)
    img.grad_rect(56, 62, 104, 80, iron, iron_d)
    img.panel(56, 62, 104, 80, (52, 56, 64))
    for x in range(58, 104, 6):
        img.set(x, 64, (206, 212, 222))
    if cracked:
        # molten seams glow through every broken plate
        for _ in range(90):
            x, y = random.randint(0, 95), random.randint(0, 76)
            img.set(x, y, seam)
    return img


siege_golem().save(os.path.join(ENT_DIR, "siege_golem.png"))
siege_golem(cracked=True).save(os.path.join(ENT_DIR, "siege_golem_cracked.png"))


# ---- GARGOYLE — 64x64 custom UV (see geometry.gargoyle) ----
def gargoyle():
    img = Img(64, 64)
    stone = (118, 122, 130)
    stone_d = (72, 76, 84)
    moss = (86, 110, 70)
    eye = (255, 70, 50)
    # body (0,0)-(32,16)
    img.grad_rect(0, 0, 32, 16, stone, stone_d)
    crack(img, 0, 0, 32, 16, (54, 58, 66), 14)
    for _ in range(16):
        img.set(random.randint(0, 31), random.randint(0, 15), moss)
    # head (32,0)-(52,9), front face (37,5)-(42,9)
    img.grad_rect(32, 0, 52, 9, stone, stone_d)
    img.rect(38, 6, 39, 7, eye); img.rect(40, 6, 41, 7, eye)
    img.rect(38, 8, 41, 9, (50, 54, 60))                 # snarling maw
    # horns (52,0)-(56,4)
    img.grad_rect(52, 0, 56, 4, (150, 152, 158), (96, 98, 104))
    # wings (0,16)-(34,24): membrane with stone struts
    img.grad_rect(0, 16, 34, 24, (88, 90, 98), (54, 56, 64))
    for x in range(0, 34, 6):
        img.rect(x, 16, x + 1, 24, stone_d)
    # wing tips (0,24)-(24,30)
    img.grad_rect(0, 24, 24, 30, (80, 82, 90), (48, 50, 58))
    for x in range(0, 24, 5):
        img.rect(x, 24, x + 1, 30, stone_d)
    # legs (34,16)-(42,22)
    img.grad_rect(34, 16, 42, 22, stone, stone_d)
    img.rect(34, 20, 42, 22, (58, 62, 70))               # claws
    # tail (0,30)-(20,40) segmented + spade (20,30)-(32,34)
    img.grad_rect(0, 30, 20, 40, stone, stone_d)
    for x in range(2, 20, 4):
        img.rect(x, 30, x + 1, 40, (60, 64, 72))
    img.grad_rect(20, 30, 32, 34, (100, 102, 110), (62, 64, 72))
    for _ in range(10):
        img.set(random.randint(0, 33), random.randint(16, 39), moss)
    return img


gargoyle().save(os.path.join(ENT_DIR, "gargoyle.png"))


# ---- WAR HORSE — 64x64 custom UV (see geometry.war_horse) ----
def war_horse(armored=False):
    img = Img(64, 64)
    bay = (94, 62, 38)
    bay_d = (58, 38, 24)
    black = (30, 24, 20)
    steel = (150, 156, 166)
    steel_d = (84, 90, 100)
    # body (0,0)-(64,32); top face (22,0)-(32,22)
    img.grad_rect(0, 0, 64, 32, bay, bay_d)
    img.noise_rect(0, 22, 64, 32, bay, 10)
    # saddle blanket across the middle of the back
    img.rect(22, 8, 32, 15, (140, 30, 30))
    img.rect(22, 8, 32, 9, (216, 172, 60))
    img.rect(22, 14, 32, 15, (216, 172, 60))
    img.rect(25, 9, 29, 14, (68, 40, 26))                # leather saddle seat
    # girth strap visible on both side faces
    img.rect(8, 22, 10, 32, (50, 34, 24))
    img.rect(40, 22, 42, 32, (50, 34, 24))
    # neck (0,32)-(20,48)
    img.grad_rect(0, 32, 20, 48, bay, bay_d)
    # head (20,32)-(48,46), front face (29,41)-(34,46)
    img.grad_rect(20, 32, 48, 46, bay, bay_d)
    img.rect(31, 41, 33, 46, (226, 218, 206))            # white blaze
    img.set(28, 42, black); img.set(35, 42, black)       # eyes on cheeks
    img.rect(29, 44, 34, 46, (44, 30, 22))               # muzzle
    # ears (48,32)-(52,35)
    img.noise_rect(48, 32, 52, 35, bay_d, 8)
    # mane (48,36)-(62,48)
    img.grad_rect(48, 36, 62, 48, (40, 30, 24), black)
    for x in range(48, 62, 2):
        img.rect(x, 36, x + 1, 48, (24, 18, 14))
    # legs (0,48)-(12,62): bay upper, black socks, dark hooves
    img.grad_rect(0, 48, 12, 62, bay, bay_d)
    img.rect(0, 56, 12, 60, black)
    img.rect(0, 60, 12, 62, (52, 52, 56))
    # tail (12,48)-(20,58)
    img.grad_rect(12, 48, 20, 58, (38, 28, 22), black)
    for x in range(12, 20, 2):
        img.rect(x, 48, x + 1, 58, (22, 16, 12))
    if armored:
        # steel barding over flanks + chamfron on the face
        for (sx0, sx1) in [(0, 22), (32, 54)]:
            img.grad_rect(sx0, 22, sx1, 28, steel, steel_d)
            img.rect(sx0, 27, sx1, 28, (60, 66, 74))
            for x in range(sx0 + 2, sx1, 5):
                img.set(x, 24, (210, 216, 226))
        img.grad_rect(22, 0, 32, 8, steel, steel_d)      # rump plate on top face
        img.rect(29, 41, 34, 44, steel)                  # chamfron
        img.set(31, 42, steel_d); img.set(32, 42, steel_d)
        img.grad_rect(0, 32, 20, 36, steel, steel_d)     # crinet on neck
    return img


war_horse().save(os.path.join(ENT_DIR, "war_horse.png"))
war_horse(armored=True).save(os.path.join(ENT_DIR, "war_horse_armored.png"))


# ---- SOUL WISP — 32x32, spectral violet twin of the frost wisp ----
def soul_wisp():
    img = Img(32, 32)
    img.grad_rect(0, 0, 24, 12, (222, 202, 252), (108, 70, 180))
    for x0 in range(0, 24, 6):
        img.panel(x0, 6, x0 + 6, 12, (78, 46, 140))
    img.grad_rect(7, 7, 11, 11, (255, 255, 255), (216, 190, 255))
    img.set(8, 8, (255, 255, 255)); img.set(9, 9, (240, 228, 255))
    for _ in range(30):
        x, y = random.randint(0, 23), random.randint(0, 11)
        img.set(x, y, (238, 226, 255))
    img.grad_rect(0, 20, 8, 26, (246, 238, 255), (150, 110, 220))
    img.set(2, 21, (255, 255, 255)); img.set(5, 23, (255, 255, 255))
    return img


soul_wisp().save(os.path.join(ENT_DIR, "soul_wisp.png"))

# ---- projectiles ----
radial(16, (236, 214, 255), (92, 48, 168)).save(os.path.join(ENT_DIR, "soul_bolt.png"))


def boulder_tex():
    img = Img(16, 16)
    c = 7.5
    for y in range(16):
        for x in range(16):
            d = math.hypot(x - c, y - c)
            if d <= 7.5:
                v = random.randint(-14, 14)
                t = d / 7.5
                base = int(122 - 50 * t)
                img.set(x, y, (Img._c(base + v), Img._c(base + v + 2), Img._c(base + v + 6), 255))
    # chips and pocks
    for _ in range(14):
        x, y = random.randint(3, 12), random.randint(3, 12)
        img.set(x, y, (54, 56, 62))
    img.set(6, 5, (168, 172, 180)); img.set(10, 9, (160, 164, 172))
    return img


boulder_tex().save(os.path.join(ENT_DIR, "boulder.png"))


# =====================================================================
#  New item icons — 16x16
# =====================================================================
def dragon_talon():
    img = Img(16, 16)
    # curved claw sweeping up-right, red scale base to bone tip
    for i in range(12):
        w = max(1, 3 - i // 4)
        x = 3 + i
        y = 13 - i if i < 8 else 13 - i - (i - 8) // 2
        for j in range(w):
            col = (238, 232, 216) if i > 7 else (196, 54, 36)
            img.set(x, max(1, y - j), col)
    img.rect(2, 12, 6, 15, (110, 28, 24))                # scaled base
    img.set(3, 13, (255, 180, 90))
    img.set(14, 2, (255, 250, 230))                      # gleaming tip
    return img


def soul_staff_icon():
    img = Img(16, 16)
    for i in range(11):
        img.set(4 + i, 14 - i, (104, 72, 40))
        img.set(5 + i, 14 - i, (140, 96, 56))
    img.grad_rect(11, 1, 15, 5, (170, 255, 240), (60, 140, 130))
    img.set(12, 2, (255, 255, 255))
    img.set(10, 5, (120, 235, 220)); img.set(15, 0, (120, 235, 220))
    return img


def golem_gauntlet_icon():
    img = Img(16, 16)
    img.grad_rect(3, 3, 13, 13, (150, 156, 166), (70, 76, 86))
    img.panel(3, 3, 13, 13, (48, 52, 60))
    for y in (5, 8, 11):
        img.rect(4, y, 12, y + 1, (96, 102, 112))        # knuckle plates
    img.rect(7, 7, 9, 9, (255, 170, 60))                 # molten core stud
    img.rect(3, 12, 13, 14, (60, 44, 30))                # leather cuff
    return img


def champion_banner_icon():
    img = Img(16, 16)
    img.rect(3, 1, 4, 15, (104, 72, 40))                 # pole
    img.set(3, 0, (216, 172, 60))                        # gold finial
    img.grad_rect(4, 1, 14, 9, (170, 34, 30), (96, 18, 18))
    img.rect(8, 2, 10, 8, (230, 220, 200))               # white cross
    img.rect(5, 4, 13, 6, (230, 220, 200))
    for x in range(4, 14, 3):
        img.set(x, 9, (120, 22, 20))                     # ragged hem
    return img


def greatsword_icon():
    img = Img(16, 16)
    for i in range(10):
        img.set(5 + i, 10 - i, (196, 202, 212))
        img.set(6 + i, 10 - i, (150, 158, 170))
        if i < 9:
            img.set(6 + i, 9 - i, (230, 236, 244))       # edge highlight
    img.rect(3, 10, 8, 12, (90, 96, 106))                # crossguard
    img.set(3, 11, (216, 172, 60)); img.set(7, 10, (216, 172, 60))
    for i in range(3):
        img.set(3 + i, 12 + i, (90, 62, 34))             # grip
    img.set(2, 14, (216, 172, 60))                       # pommel
    return img


def horse_barding_icon():
    img = Img(16, 16)
    img.grad_rect(2, 5, 14, 11, (150, 156, 166), (78, 84, 94))
    img.panel(2, 5, 14, 11, (52, 56, 64))
    img.rect(1, 7, 2, 10, (150, 156, 166))               # chest plate lip
    img.rivets([(4, 7), (8, 7), (12, 7)], (210, 216, 226))
    img.rect(4, 11, 6, 13, (60, 44, 30))                 # straps
    img.rect(10, 11, 12, 13, (60, 44, 30))
    img.grad_rect(5, 3, 11, 5, (140, 30, 30), (96, 18, 18))  # crimson caparison
    return img


def lich_crown_icon():
    img = Img(16, 16)
    img.grad_rect(3, 8, 13, 12, (222, 178, 64), (150, 110, 30))
    img.panel(3, 8, 13, 12, (110, 80, 22))
    for x in range(4, 13, 3):
        img.rect(x, 5, x + 1, 8, (222, 178, 64))         # spikes
        img.set(x, 4, (255, 232, 140))
    img.set(7, 9, (90, 220, 200)); img.set(10, 10, (90, 220, 200))
    img.set(5, 10, (120, 235, 220))
    return img


def golem_core_icon():
    img = Img(16, 16)
    c = 7.5
    for y in range(16):
        for x in range(16):
            d = math.hypot(x - c, y - c)
            if d <= 6.5:
                t = d / 6.5
                img.set(x, y, (Img._c(255 - 60 * t), Img._c(200 - 130 * t), Img._c(90 - 70 * t), 255))
    img.set(7, 7, (255, 255, 240)); img.set(8, 8, (255, 255, 230))
    for a in range(8):
        x = int(c + math.cos(a * 0.785) * 7)
        y = int(c + math.sin(a * 0.785) * 7)
        img.set(x, y, (110, 60, 24))                     # stone crust flecks
    return img


def champion_crest_icon():
    img = Img(16, 16)
    # heater shield crest, quartered red and black
    for y in range(2, 14):
        w = 6 if y < 8 else 6 - (y - 8)
        for x in range(8 - w, 8 + w):
            col = (150, 26, 26) if (x < 8) == (y < 8) else (34, 34, 40)
            img.set(x, y, col)
    img.panel(2, 2, 14, 9, (216, 172, 60))
    img.rect(7, 2, 9, 14, (216, 172, 60))
    img.rect(2, 7, 14, 9, (216, 172, 60))
    return img


def dragon_armor_icon(kind):
    img = Img(16, 16)
    hi, lo, line = (190, 50, 34), (110, 28, 24), (70, 20, 16)
    if kind == "helmet":
        img.grad_rect(3, 3, 13, 11, hi, lo)
        img.rect(4, 8, 12, 10, (30, 12, 10))             # face opening
        img.rect(3, 11, 5, 12, hi); img.rect(11, 11, 13, 12, hi)
        img.set(4, 2, (255, 180, 90)); img.set(11, 2, (255, 180, 90))  # horn studs
        img.panel(3, 3, 13, 11, line)
    elif kind == "leggings":
        img.grad_rect(3, 2, 13, 6, hi, lo)               # belt
        img.grad_rect(3, 6, 7, 14, hi, lo)               # left leg
        img.grad_rect(9, 6, 13, 14, hi, lo)              # right leg
        img.panel(3, 2, 13, 6, line)
        for y in range(7, 14, 2):
            img.rect(3, y, 7, y + 1, (150, 40, 28))
            img.rect(9, y, 13, y + 1, (150, 40, 28))
    else:  # boots
        for x0 in (2, 9):
            img.grad_rect(x0, 6, x0 + 5, 13, hi, lo)
            img.rect(x0, 11, x0 + 5, 13, line)
            img.panel(x0, 6, x0 + 5, 13, line)
            img.set(x0 + 2, 8, (255, 180, 90))
    return img


dragon_talon().save(os.path.join(ITEM_DIR, "dragon_talon.png"))
soul_staff_icon().save(os.path.join(ITEM_DIR, "soul_staff.png"))
golem_gauntlet_icon().save(os.path.join(ITEM_DIR, "golem_gauntlet.png"))
champion_banner_icon().save(os.path.join(ITEM_DIR, "champion_banner.png"))
greatsword_icon().save(os.path.join(ITEM_DIR, "greatsword.png"))
horse_barding_icon().save(os.path.join(ITEM_DIR, "horse_barding.png"))
lich_crown_icon().save(os.path.join(ITEM_DIR, "lich_crown.png"))
golem_core_icon().save(os.path.join(ITEM_DIR, "golem_core.png"))
champion_crest_icon().save(os.path.join(ITEM_DIR, "champion_crest.png"))
dragon_armor_icon("helmet").save(os.path.join(ITEM_DIR, "dragon_helmet.png"))
dragon_armor_icon("leggings").save(os.path.join(ITEM_DIR, "dragon_leggings.png"))
dragon_armor_icon("boots").save(os.path.join(ITEM_DIR, "dragon_boots.png"))


# =====================================================================
#  New worn-armor layers — 64x32 vanilla armor layout
# =====================================================================
def dragon_helm_layer():
    img = Img(64, 32)
    hi, lo = (196, 54, 36), (110, 28, 24)
    img.grad_rect(0, 0, 32, 16, hi, lo)
    for y in range(9, 16, 3):
        img.rect(0, y, 32, y + 1, (150, 40, 28))         # scale rows
    img.panel(8, 0, 16, 8, (80, 22, 18))
    img.panel(0, 8, 32, 16, (80, 22, 18))
    img.rect(9, 11, 15, 13, (30, 12, 10))                # visor slit
    img.set(9, 9, (255, 180, 90)); img.set(14, 9, (255, 180, 90))  # ember studs
    return img


def dragon_leg_layer():
    img = Img(64, 32)
    hi, lo = (180, 46, 32), (100, 26, 22)
    # waist band on torso region
    img.grad_rect(16, 16, 40, 21, hi, lo)
    img.rect(16, 20, 40, 21, (70, 20, 16))
    img.set(27, 18, (255, 180, 90))
    # legs
    img.grad_rect(0, 16, 16, 32, hi, lo)
    for y in range(18, 32, 3):
        img.rect(0, y, 16, y + 1, (140, 36, 26))
    img.panel(4, 18, 12, 30, (70, 20, 16))
    return img


def dragon_boot_layer():
    img = Img(64, 32)
    hi, lo = (196, 54, 36), (110, 28, 24)
    img.grad_rect(0, 26, 16, 32, hi, lo)
    img.rect(0, 30, 16, 32, (70, 20, 16))
    for x in range(1, 16, 4):
        img.set(x, 27, (255, 180, 90))
    return img


def lich_crown_layer():
    img = Img(64, 32)
    gold, gold_d = (222, 178, 64), (150, 110, 30)
    # band around the top rows of all four head side faces
    img.grad_rect(0, 8, 32, 11, gold, gold_d)
    for x in range(1, 32, 4):
        img.rect(x, 6, x + 1, 8, gold)                   # spikes
        img.set(x, 5, (255, 232, 140))
    for x in range(3, 32, 8):
        img.set(x, 9, (90, 220, 200))                    # soul jewels
    return img


dragon_helm_layer().save(os.path.join(ARMOR_DIR, "dragon_helm_layer.png"))
dragon_leg_layer().save(os.path.join(ARMOR_DIR, "dragon_leg_layer.png"))
dragon_boot_layer().save(os.path.join(ARMOR_DIR, "dragon_boot_layer.png"))
lich_crown_layer().save(os.path.join(ARMOR_DIR, "lich_crown_layer.png"))
print("v2.0 textures done")
