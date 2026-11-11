#!/usr/bin/env python3
"""Asset pipeline (run locally, not in CI):
  - upscales the hand-made sprite sheets in assets/src/ to 2x with Lanczos + light sharpening -> assets/sheets/*.webp
  - generates dark grunge background tiles -> assets/tex/*.webp
Usage: python3 scripts/make_assets.py
Requires: Pillow, numpy (opencv optional for nicer sharpening)."""
import os, glob, math, random
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'src')
OUT_S = os.path.join(ROOT, 'assets', 'sheets')
OUT_T = os.path.join(ROOT, 'assets', 'tex')
os.makedirs(OUT_S, exist_ok=True); os.makedirs(OUT_T, exist_ok=True)

# ------------------------------------------------------------------ sheets
for path in sorted(glob.glob(os.path.join(SRC, 'sheet*.png'))):
    name = os.path.splitext(os.path.basename(path))[0]
    im = Image.open(path).convert('RGB')
    w, h = im.size
    big = im.resize((w * 2, h * 2), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    big = ImageEnhance.Contrast(big).enhance(1.04)
    out = os.path.join(OUT_S, name + '.webp')
    big.save(out, 'WEBP', quality=82, method=6)
    print('sheet', out, os.path.getsize(out) // 1024, 'KB')

# ------------------------------------------------------------------ procedural textures
def fbm(size, octaves=6, seed=0, base=4):
    rng = np.random.default_rng(seed)
    acc = np.zeros((size, size), np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        g = rng.random((n + 1, n + 1)).astype(np.float32)
        g[-1, :] = g[0, :]; g[:, -1] = g[:, 0]  # tileable
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC)
        acc += np.asarray(img, np.float32) / 255 * amp
        tot += amp; amp *= 0.55
    return acc / tot

def cracks(draw, size, rng, n, col, wmax=2):
    for _ in range(n):
        x, y = rng.uniform(0, size), rng.uniform(0, size)
        ang = rng.uniform(0, math.pi * 2)
        pts = [(x, y)]
        for _ in range(int(rng.integers(6, 16))):
            ang += rng.normal(0, 0.75)
            step = rng.uniform(5, 18)
            x += math.cos(ang) * step; y += math.sin(ang) * step
            pts.append((x, y))
        draw.line(pts, fill=col, width=int(rng.integers(1, wmax + 1)))
        if rng.random() < 0.5 and len(pts) > 4:  # branch
            bx, by = pts[len(pts) // 2]
            a2 = ang + rng.choice([-1, 1]) * rng.uniform(0.6, 1.4)
            bp = [(bx, by)]
            for _ in range(int(rng.integers(3, 8))):
                a2 += rng.normal(0, 0.4); bx += math.cos(a2) * 12; by += math.sin(a2) * 12; bp.append((bx, by))
            draw.line(bp, fill=col, width=1)

def grunge(seed, tint, size=512, crack_n=26, light=1.0):
    rng = np.random.default_rng(seed)
    n = fbm(size, 7, seed)
    n2 = fbm(size, 5, seed + 9, base=8)
    base = 22 + n * 34 + n2 * 14
    rgb = np.stack([base * tint[0], base * tint[1], base * tint[2]], axis=2)
    # stains
    st = fbm(size, 4, seed + 3, base=3)
    rgb *= (0.8 + 0.35 * st)[..., None]
    img = Image.fromarray(np.clip(rgb * light, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    cracks(d, size, rng, crack_n, (8, 8, 10), 2)
    cracks(d, size, rng, max(2, crack_n // 3), (74, 72, 70), 1)
    # panel seams like worn tiles
    for k in range(1, 3):
        p = int(size * k / 3 + rng.uniform(-14, 14))
        d.line([(p, 0), (p + rng.uniform(-6, 6), size)], fill=(12, 12, 14), width=2)
        d.line([(0, p), (size, p + rng.uniform(-6, 6))], fill=(12, 12, 14), width=2)
    # scratches
    for _ in range(55):
        x, y = rng.uniform(0, size, 2)
        a = rng.uniform(0, math.pi)
        l = rng.uniform(4, 26)
        c = int(rng.uniform(60, 110))
        d.line([(x, y), (x + math.cos(a) * l, y + math.sin(a) * l)], fill=(c, c, c - 4), width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.35))
    # vignette
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    r = np.sqrt((xx - size / 2) ** 2 + (yy - size / 2.2) ** 2) / (size * 0.72)
    vig = np.clip(1.08 - r ** 1.8 * 0.75, 0.25, 1.1)
    arr = np.asarray(img, np.float32) * vig[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))

BGS = [
    ('bg_char', 11, (1.0, 1.0, 1.04)),   # charcoal marble
    ('bg_warm', 23, (1.08, 1.0, 0.9)),   # warm grimy stone
    ('bg_cold', 37, (0.92, 0.98, 1.1)),  # cold slate
    ('bg_green', 41, (0.92, 1.04, 0.96)),
    ('bg_red', 53, (1.12, 0.94, 0.92)),
    ('bg_asphalt', 67, (1.0, 1.0, 1.0)),
]
for name, seed, tint in BGS:
    im = grunge(seed, tint, crack_n=9 if name != 'bg_asphalt' else 5, light=1.05 if name == 'bg_asphalt' else 1.0)
    out = os.path.join(OUT_T, name + '.webp')
    im.save(out, 'WEBP', quality=80, method=6)
    print('tex', out, os.path.getsize(out) // 1024, 'KB')
