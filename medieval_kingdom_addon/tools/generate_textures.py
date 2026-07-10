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
def dragon():
    img = Img(128, 128)
    body = (150, 40, 30)
    belly = (216, 128, 46)
    membrane = (196, 66, 40)
    wingbone = (86, 24, 22)
    horn = (46, 34, 30)
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
    img.grad_rect(0, 0, 48, 40, (128, 32, 26), (78, 20, 18))
    img.noise_rect(0, 0, 16, 12, horn, 6)
    img.rect(20, 8, 24, 12, (255, 226, 96))              # eye
    img.rect(30, 8, 34, 12, (255, 226, 96))
    img.set(21, 9, (255, 255, 200)); img.set(31, 9, (255, 255, 200))
    img.rect(16, 20, 40, 26, (255, 150, 40))             # hot maw
    img.rect(16, 22, 40, 23, (255, 220, 120))
    # ember speckle
    for _ in range(700):
        x, y = random.randint(0, 127), random.randint(0, 127)
        img.set(x, y, (255, 180, 90))
    # tail spade region highlight
    img.grad_rect(88, 60, 128, 78, (170, 46, 34), (110, 28, 24))
    return img


dragon().save(os.path.join(ENT_DIR, "fire_dragon.png"))


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
