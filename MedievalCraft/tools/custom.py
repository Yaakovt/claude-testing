"""
custom.py — bespoke special-case textures:
  * the Ender Dragon reskinned as a red fire-dragon (luminance -> fire gradient,
    preserving every scale/wing detail and the alpha mask)
  * medieval boss bars (gold-framed banner bars with rivets + segment notches)
"""
import numpy as np
from PIL import Image

_LUM = np.array([0.299, 0.587, 0.114], dtype=np.float32)


def _ramp(stops, t):
    """t: float array in [0,1] -> (..,3) colour from the stop list."""
    s = np.array(stops, dtype=np.float32)
    n = len(stops) - 1
    seg = np.clip(t, 0, 1) * n
    i = np.clip(seg.astype(int), 0, n - 1)
    f = (seg - i)[..., None]
    return s[i] * (1 - f) + s[np.minimum(i + 1, n)] * f


# molten body: black-red embers -> orange -> white-hot
_FIRE = [(18, 6, 4), (96, 16, 10), (172, 40, 14), (226, 96, 24),
         (252, 188, 78), (255, 240, 170)]
# emissive eyes / glow stripes: hot orange -> white
_GLOW = [(150, 26, 12), (255, 150, 36), (255, 244, 168)]


def fire_dragon(im):
    im = im.convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4]
    lum = (rgb @ _LUM) / 255.0
    lum = np.clip(lum * 1.18 + 0.06, 0, 1)   # lift the very dark scales into red
    fire = _ramp(_FIRE, lum)
    out = np.concatenate([np.clip(fire, 0, 255), a], -1).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def fire_eyes(im):
    im = im.convert("RGBA")
    arr = np.asarray(im).astype(np.float32)
    rgb, a = arr[..., :3], arr[..., 3:4]
    lum = (rgb @ _LUM) / 255.0
    glow = _ramp(_GLOW, np.clip(lum * 1.3, 0, 1))
    out = np.concatenate([np.clip(glow, 0, 255), a], -1).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


# -------------------------------------------------------------------------
# boss bars
# -------------------------------------------------------------------------
BOSS_COLORS = {
    "pink": (198, 92, 134), "blue": (62, 98, 198), "red": (190, 42, 38),
    "green": (90, 152, 54), "yellow": (216, 178, 58), "purple": (132, 72, 182),
    "white": (224, 216, 196),
}
_GOLD = (204, 170, 88)
_GOLD_HI = (244, 222, 150)
_DARK = (34, 28, 26)
_SLATE = (58, 54, 60)


def _sh(c, amt):
    if amt >= 0:
        return tuple(int(v + (255 - v) * amt) for v in c)
    return tuple(int(v * (1 + amt)) for v in c)


def boss_bar(w, h, color, progress):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pix = im.load()
    for x in range(w):
        for y in range(h):
            if y == 0:
                c = _GOLD
            elif y == h - 1:
                c = _DARK
            elif progress:
                amt = 0.18 if y == 1 else (-0.22 if y == h - 2 else 0.0)
                c = _sh(color, amt)
            else:
                c = _sh(_SLATE, 0.12 if y == 1 else -0.12)
            pix[x, y] = (c[0], c[1], c[2], 255)
    # brass rivets along the top rail
    for x in range(4, w, 22):
        pix[x, 0] = (_GOLD_HI[0], _GOLD_HI[1], _GOLD_HI[2], 255)
    return im


def boss_notch(w, h, n, progress):
    """Transparent overlay with n-1 divider ticks (drawn over the coloured bar)."""
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pix = im.load()
    col = (_GOLD_HI + (255,)) if progress else (24, 18, 16, 255)
    for k in range(1, n):
        x = round(k * w / n)
        if 0 <= x < w:
            for y in range(h):
                pix[x, y] = col
    return im


def boss_sprite(name, w, h):
    """Dispatch a boss_bar/ sprite by its file stem."""
    if name.startswith("notched_"):
        _, num, kind = name.split("_")
        return boss_notch(w, h, int(num), kind == "progress")
    color, kind = name.rsplit("_", 1)
    return boss_bar(w, h, BOSS_COLORS.get(color, (170, 170, 170)), kind == "progress")
