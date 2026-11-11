#!/usr/bin/env python3
"""Cuts every sprite listed in js/data/sprites.js out of its painted background.

  pip install rembg pillow numpy opencv-python-headless
  python3 scripts/cut_sprites.py            # -> assets/sheets/sheet{1,2,3}.webp (RGBA, 2x)

Each sprite rectangle is upscaled 2x (Lanczos + light sharpening), the object is segmented with
rembg (ISNet), small debris is dropped, edge pixels are re-coloured from the object interior
(no dark halo on light backgrounds) and the result is pasted at the same 2x coordinates into a
transparent sheet, so the coordinates in sprites.js stay valid. Sprites the model fails on keep
their painted background with a soft oval mask.
"""
import os, re, sys, json
import numpy as np
import cv2
from PIL import Image, ImageFilter, ImageEnhance
from rembg import new_session, remove

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'src')
OUT = os.path.join(ROOT, 'assets', 'sheets')
K = 2

rows = re.findall(r"\['(\w+)', (\d), (\d+), (\d+), (\d+), (\d+), \{([^}]*)\}", open(os.path.join(ROOT, 'js', 'data', 'sprites.js')).read())
only = set(sys.argv[1].split(',')) if len(sys.argv) > 1 else None
sess = new_session('isnet-general-use')
sheets = {}
canv = {}
report = []


def oval(w, h):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    return np.clip((1.0 - d) / 0.25, 0, 1)


for sid, sh, x0, y0, x1, y1, tags in rows:
    if only and sid not in only:
        continue
    sh = int(sh); x0, y0, x1, y1 = map(int, (x0, y0, x1, y1))
    if sh not in sheets:
        sheets[sh] = Image.open(os.path.join(SRC, f'sheet{sh}.png')).convert('RGB')
        canv[sh] = Image.new('RGBA', (sheets[sh].width * K, sheets[sh].height * K), (0, 0, 0, 0))
    crop = sheets[sh].crop((x0, y0, x1, y1))
    big = crop.resize(((x1 - x0) * K, (y1 - y0) * K), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))
    big = ImageEnhance.Contrast(big).enhance(1.04)
    cut = remove(big, session=sess, post_process_mask=True)
    a = np.asarray(cut)[:, :, 3].astype(np.float32) / 255.0
    rgb = np.asarray(big).astype(np.float32)
    # drop faint haze + small debris, keep the main object(s)
    a[a < 0.12] = 0
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), 8)
    if n > 1:
        areas = st[1:, cv2.CC_STAT_AREA]
        keep = np.zeros(n, bool)
        keep[1:] = areas >= max(areas.max() * 0.1, 40)
        solid = keep[lab]
        near = cv2.dilate(solid.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
        a = a * near
    cover = float((a > 0.5).mean())
    thin = "'jewelry'" in tags and any(k in tags for k in ("'necklace'", "'bracelet'", "'earrings'"))
    ok = (0.015 if thin else 0.06) < cover < 0.97
    a_rembg = a.copy()
    if not thin and cover < 0.15:
        # second opinion: GrabCut seeded with the inner rectangle (flat comic covers, dark-on-dark bags)
        bgr = cv2.cvtColor(np.asarray(big), cv2.COLOR_RGB2BGR)
        m = np.zeros(bgr.shape[:2], np.uint8)
        hh, ww = m.shape
        rect = (int(ww * 0.04), int(hh * 0.04), int(ww * 0.92), int(hh * 0.92))
        cv2.grabCut(bgr, m, rect, np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64), 6, cv2.GC_INIT_WITH_RECT)
        a = np.where((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD), 1.0, 0.0).astype(np.float32)
        a = cv2.morphologyEx(a, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), 8)
        if n > 1:
            big_i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
            a = (lab == big_i).astype(np.float32)
            a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
        gc_cover = float((a > 0.5).mean())
        if 0.15 < gc_cover < 0.95 and gc_cover > cover * 2:
            cover, ok = gc_cover, True
        else:
            a = a_rembg
    if ok and "'jewelry'" in tags and any(k in tags for k in ("'ring'", "'love'", "'bangle'", "'clovers'")):
        # the painted background shows through the middle of rings/bangles: cut that hole out
        gray = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2GRAY)
        hh, ww = gray.shape
        dark = ((gray < 62) & (a > 0.3)).astype(np.uint8)
        n2, lab2, st2, _ = cv2.connectedComponentsWithStats(dark, 8)
        cy, cx = hh // 2, ww // 2
        hole = np.zeros_like(a)
        for i in range(1, n2):
            x, y, bw, bh, area = st2[i]
            if x < cx < x + bw and y < cy < y + bh and area > hh * ww * 0.03:
                hole = np.maximum(hole, (lab2 == i).astype(np.float32))
        if hole.any():
            hole = cv2.GaussianBlur(cv2.erode(hole, np.ones((3, 3), np.uint8)), (0, 0), 1.2)
            a = a * (1 - hole)
    if not ok:
        a = oval(a.shape[1], a.shape[0]).astype(np.float32)
    else:
        a = cv2.GaussianBlur(a, (0, 0), 0.7)
        # re-colour semi-transparent edge pixels from the solid interior (removes dark fringes)
        w = (a > 0.92).astype(np.float32)
        num = cv2.GaussianBlur(rgb * w[:, :, None], (0, 0), 3)
        den = cv2.GaussianBlur(w, (0, 0), 3)[:, :, None]
        fill = np.where(den > 1e-3, num / np.maximum(den, 1e-3), rgb)
        edge = (a < 0.92)[:, :, None]
        rgb = np.where(edge, fill, rgb)
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    canv[sh].paste(Image.fromarray(out, 'RGBA'), (x0 * K, y0 * K))
    report.append((sid, round(cover, 3), ok))
    print(f'{sid:20s} cover={cover:.2f} {"ok" if ok else "FALLBACK"}', flush=True)

for sh, im in canv.items():
    path = os.path.join(OUT, f'sheet{sh}.webp')
    if only and os.path.exists(path):  # partial run: merge into the existing sheet
        base = Image.open(path).convert('RGBA')
        for sid, s2, x0, y0, x1, y1, _ in rows:
            if sid in only and int(s2) == sh:
                box = (int(x0) * K, int(y0) * K, int(x1) * K, int(y1) * K)
                base.paste((0, 0, 0, 0), box)
                base.paste(im.crop(box), box[:2])
        im = base
    im.save(path, 'WEBP', quality=84, method=6, alpha_quality=90)
    print('sheet', path, os.path.getsize(path) // 1024, 'KB')
json.dump(report, open(os.path.join(SRC, 'cut_report.json'), 'w'))
