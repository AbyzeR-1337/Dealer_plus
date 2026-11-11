#!/usr/bin/env python3
"""Photographic backgrounds for item photos: the surfaces people actually shoot their stuff on.

  python3 scripts/make_photos.py   # -> assets/photo/*.webp

Everything is procedural (numpy + OpenCV): albedo + height map -> lambert/specular shading with a
window light, then camera stuff (light fall-off, vignette, slight defocus, sensor noise, white balance).
"""
import os, math
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'photo')
os.makedirs(OUT, exist_ok=True)
N = 768


def noise(w, h, cells_x, cells_y, seed, interp=cv2.INTER_CUBIC):
    rng = np.random.default_rng(seed)
    g = rng.random((max(2, int(cells_y)) + 1, max(2, int(cells_x)) + 1)).astype(np.float32)
    return cv2.resize(g, (w, h), interpolation=interp)


def fbm(w, h, base, seed, octaves=5, aniso=1.0, gain=0.5):
    acc = np.zeros((h, w), np.float32); amp = 1; tot = 0
    for o in range(octaves):
        c = base * 2 ** o
        acc += noise(w, h, c, c * aniso, seed + o * 17) * amp
        tot += amp; amp *= gain
    return acc / tot


def shade(albedo, height, light=(-0.55, -0.65, 0.52), bump=6.0, spec=0.0, rough=24, amb=0.42):
    gy, gx = np.gradient(height * bump)
    nrm = np.dstack([-gx, -gy, np.ones_like(gx)])
    nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
    L = np.array(light, np.float32); L /= np.linalg.norm(L)
    ndl = np.clip((nrm * L).sum(2), 0, 1)
    out = albedo * (amb + (1 - amb) * ndl[:, :, None] / max(L[2], 0.3))
    if spec:
        H = L + np.array([0, 0, 1], np.float32); H /= np.linalg.norm(H)
        s = np.clip((nrm * H).sum(2), 0, 1) ** rough
        out = out + spec * s[:, :, None]
    return out


def camera(img, seed, warm=0.0, light_xy=(0.2, 0.15), falloff=0.38, blur=0.7, noise_amt=0.014, vign=0.28):
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    lx, ly = light_xy[0] * w, light_xy[1] * h
    d = np.sqrt((xx - lx) ** 2 + (yy - ly) ** 2) / math.hypot(w, h)
    img = img * (1 - falloff * np.clip(d, 0, 1.2) ** 1.2)[:, :, None]
    c = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    img = img * (1 - vign * np.clip(c - 0.55, 0, 1) ** 1.6)[:, :, None]
    if warm:
        img = img * np.array([1 + 0.09 * warm, 1 + 0.015 * warm, 1 - 0.1 * warm], np.float32)
    if blur:
        img = cv2.GaussianBlur(img, (0, 0), blur)
    rng = np.random.default_rng(seed)
    lum = rng.normal(0, noise_amt, (h, w, 1)).astype(np.float32)
    chroma = rng.normal(0, noise_amt * 0.45, (h, w, 3)).astype(np.float32)
    img = img + lum + cv2.GaussianBlur(chroma, (0, 0), 0.8)
    return np.clip(img, 0, 1)


def save(name, img, q=80):
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGB')
    p = os.path.join(OUT, name + '.webp')
    im.save(p, 'WEBP', quality=q, method=6)
    print(name, im.size, os.path.getsize(p) // 1024, 'KB')


def ramp(t, a, b):
    t = np.clip(t, 0, 1)[:, :, None]
    return np.array(a, np.float32) * (1 - t) + np.array(b, np.float32) * t


# ------------------------------------------------------------------ wood
def wood(seed, light, dark, boards=4, horizontal=True, w=N, h=N, gloss=0.08):
    rng = np.random.default_rng(seed)
    W, H = (w, h) if horizontal else (h, w)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    bh = H / boards
    board = (yy // bh).astype(int)
    v = yy % bh
    warp = fbm(W, H, 2, seed, 4, aniso=6) * 26 + fbm(W, H, 1, seed + 5, 3, aniso=3) * 60
    offs = rng.uniform(0, 400, boards + 1)[board]
    freq = rng.uniform(0.16, 0.24) * (0.75 + 0.5 * fbm(W, H, 2, seed + 21, 3, aniso=2))
    rings = np.sin((v * 0.9 + warp + offs) * freq)
    grain = np.clip((rings + 1) / 2, 0, 1) ** 3.0
    fine = 0.6 * fbm(W, H, 5, seed + 9, 3, aniso=16) + 0.4 * noise(W, H, W / 90, H / 1.6, seed + 13)
    t = 0.5 * grain + 0.38 * fine + 0.12 * fbm(W, H, 3, seed + 3, 3)
    tint = rng.uniform(-0.05, 0.05, boards + 1)[board][:, :, None]
    alb = ramp(t, light, dark) * (1 + tint)
    pores = (noise(W, H, W / 40, H / 2, seed + 11, cv2.INTER_NEAREST) > 0.97).astype(np.float32)
    pores = cv2.GaussianBlur(pores, (0, 0), 0.7)
    alb *= (1 - 0.18 * pores)[:, :, None]
    seam = np.exp(-((v - 0.5) ** 2) / 2.2) + np.exp(-((v - bh + 0.5) ** 2) / 2.2)
    alb *= (1 - 0.55 * seam)[:, :, None]
    height = 0.6 * grain + 0.2 * fine - 2.2 * seam
    img = shade(alb, height, bump=1.6, spec=gloss, rough=18, amb=0.55)
    return img if horizontal else np.transpose(img, (1, 0, 2))


# ------------------------------------------------------------------ fabric with folds
def folds(w, h, seed, n=7, amp=1.0, width=(18, 60)):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    hgt = np.zeros((h, w), np.float32)
    warp = fbm(w, h, 2, seed + 1, 3) * 120
    for i in range(n):
        a = rng.uniform(0, math.pi)
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        d = (xx - cx) * math.cos(a) + (yy - cy) * math.sin(a) + warp * rng.uniform(0.4, 1)
        along = -(xx - cx) * math.sin(a) + (yy - cy) * math.cos(a)
        wd = rng.uniform(*width)
        fade = np.exp(-(along / rng.uniform(150, 420)) ** 2)
        hgt += rng.uniform(0.5, 1) * amp * np.exp(-(d / wd) ** 2) * fade
    return hgt + fbm(w, h, 2, seed + 2, 4) * 0.8


def fabric(seed, color, weave=3.0, fold_n=7, fold_amp=14, width=(18, 60), tint_var=0.04, knit=False):
    h = w = N
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    hf = folds(w, h, seed, fold_n, 1.0, width)
    if knit:
        wv = (np.sin(xx * 2 * math.pi / 7) * 0.5 + 0.5) * (np.abs(np.sin(yy * math.pi / 9)))
    else:
        wv = np.sin(xx * 2 * math.pi / weave) * np.sin(yy * 2 * math.pi / weave)
    lint = fbm(w, h, 60, seed + 7, 2)
    alb = np.ones((h, w, 3), np.float32) * np.array(color, np.float32)
    alb *= (1 + tint_var * (fbm(w, h, 3, seed + 4, 3) - 0.5) * 2)[:, :, None]
    alb *= (1 - 0.06 * lint)[:, :, None]
    height = hf * fold_amp + wv * 0.25 + lint * 0.4
    return shade(alb, height, light=(-0.6, -0.5, 0.45), bump=1.0, amb=0.38)


# ------------------------------------------------------------------ others
def carpet(seed, c1, c2):
    h = w = N
    pile = fbm(w, h, 180, seed, 2) * 0.6 + np.random.default_rng(seed).random((h, w)).astype(np.float32) * 0.4
    pile = cv2.GaussianBlur(pile, (0, 0), 0.7)
    pat = fbm(w, h, 3, seed + 3, 3)
    alb = ramp(pat * 0.6 + pile * 0.4, c1, c2)
    return shade(alb, pile * 3 + fbm(w, h, 4, seed + 9, 3) * 4, bump=1.2, amb=0.45)


def marble(seed):
    h = w = N
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    f = fbm(w, h, 2, seed, 6, gain=0.55)
    t1 = np.sin((xx * 0.7 + yy * 0.4) * 0.007 + f * 2.6)
    t2 = np.sin((xx * -0.25 + yy) * 0.012 + fbm(w, h, 2, seed + 3, 5) * 3.2)
    vein = np.exp(-np.abs(t1) / 0.05) * 0.8 + np.exp(-np.abs(t2) / 0.025) * 0.35
    vein *= 0.5 + 0.5 * fbm(w, h, 3, seed + 6, 3)
    cloud = fbm(w, h, 2, seed + 8, 5)
    alb = ramp(vein + (cloud - 0.5) * 0.25, (0.95, 0.94, 0.92), (0.5, 0.5, 0.52))
    img = shade(alb, f * 0.3, bump=0.5, spec=0.0, amb=0.7)
    win = np.zeros((h, w), np.float32)
    cv2.rectangle(win, (int(w * 0.05), int(h * 0.02)), (int(w * 0.42), int(h * 0.3)), 1, -1)
    win = cv2.GaussianBlur(win, (0, 0), 40)
    return img + 0.1 * win[:, :, None]


def tiles(seed, color=(0.92, 0.91, 0.88), size=150, grout=(0.62, 0.6, 0.56)):
    h = w = N
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ox, oy = rng.uniform(0, size, 2)
    u, v = (xx + ox) % size, (yy + oy) % size
    gd = np.minimum(np.minimum(u, size - u), np.minimum(v, size - v))
    g = np.clip(1 - gd / 3.2, 0, 1)
    tid = ((xx + ox) // size + 31 * ((yy + oy) // size)).astype(int)
    var = rng.uniform(-0.035, 0.035, tid.max() + 2)[tid]
    alb = np.array(color, np.float32) * (1 + var[:, :, None] + 0.03 * (fbm(w, h, 6, seed, 3)[:, :, None] - 0.5))
    alb = alb * (1 - g[:, :, None]) + np.array(grout, np.float32) * g[:, :, None]
    height = -g * 2 + fbm(w, h, 20, seed + 2, 2) * 0.05
    img = shade(alb, height, bump=2.0, spec=0.35, rough=60, amb=0.6)
    win = np.zeros((h, w), np.float32)
    cv2.ellipse(win, (int(w * 0.3), int(h * 0.22)), (160, 90), 20, 0, 360, 1, -1)
    return img + 0.1 * cv2.GaussianBlur(win, (0, 0), 50)[:, :, None]


def cutting_mat(seed):
    h = w = N
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    alb = np.ones((h, w, 3), np.float32) * np.array((0.13, 0.33, 0.26), np.float32)
    alb *= (1 + 0.08 * (fbm(w, h, 5, seed, 4) - 0.5))[:, :, None]
    for step, wd, col in ((24, 0.8, 0.3), (120, 1.6, 0.55)):
        lx = np.exp(-((xx % step) ** 2) / wd) + np.exp(-(((step - xx % step)) ** 2) / wd)
        ly = np.exp(-((yy % step) ** 2) / wd) + np.exp(-(((step - yy % step)) ** 2) / wd)
        line = np.clip(lx + ly, 0, 1) * col
        alb = alb * (1 - line[:, :, None]) + np.array((0.7, 0.85, 0.75), np.float32) * line[:, :, None]
    img = Image.fromarray((alb * 255).astype(np.uint8))
    arr = np.asarray(img).astype(np.float32) / 255
    rng = np.random.default_rng(seed)
    sc = np.zeros((h, w), np.float32)
    for _ in range(70):
        x, y = rng.uniform(0, w, 2); a = rng.uniform(0, math.pi); l = rng.uniform(20, 160)
        cv2.line(sc, (int(x), int(y)), (int(x + math.cos(a) * l), int(y + math.sin(a) * l)), 1, 1)
    arr = arr + 0.08 * cv2.GaussianBlur(sc, (0, 0), 0.6)[:, :, None]
    return shade(arr, fbm(w, h, 30, seed + 4, 2) * 0.3, amb=0.6)


def leather(seed, color=(0.1, 0.1, 0.11)):
    h = w = N
    rng = np.random.default_rng(seed)
    pts = np.zeros((h, w), np.uint8)
    for _ in range(9000):
        pts[rng.integers(0, h), rng.integers(0, w)] = 255
    dist = cv2.distanceTransform(255 - pts, cv2.DIST_L2, 3).astype(np.float32)
    cells = np.clip(dist / 6, 0, 1)
    height = cells * 1.2 + fbm(w, h, 4, seed, 3) * 1.5
    alb = np.ones((h, w, 3), np.float32) * np.array(color, np.float32) * (1 + 0.2 * (fbm(w, h, 3, seed + 1, 3)[:, :, None] - 0.5))
    # seam with stitching
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    sy = h * 0.62 + fbm(w, h, 1, seed + 2, 2) * 20
    seam = np.exp(-((yy - sy) ** 2) / 30)
    height -= seam * 4
    st = ((np.abs(yy - sy + 12) < 1.6) & ((xx % 16) < 9)).astype(np.float32)
    alb = alb * (1 - st[:, :, None]) + np.array((0.5, 0.48, 0.45), np.float32) * st[:, :, None]
    return shade(alb, height, bump=1.4, spec=0.18, rough=30, amb=0.45)


def cardboard(seed):
    h = w = N
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    fib = fbm(w, h, 120, seed, 2) * 0.6 + np.random.default_rng(seed).random((h, w)).astype(np.float32) * 0.4
    corr = (np.sin(yy * 2 * math.pi / 22) + 1) / 2
    alb = ramp(fib * 0.35 + fbm(w, h, 4, seed + 2, 3) * 0.65, (0.78, 0.62, 0.44), (0.62, 0.47, 0.31))
    tape = (np.abs(xx - w * 0.6 - fbm(w, h, 1, seed + 3, 2) * 10) < 46).astype(np.float32)
    tape = cv2.GaussianBlur(tape, (0, 0), 1.2)
    alb = alb * (1 - 0.25 * tape[:, :, None]) + np.array((0.78, 0.66, 0.45), np.float32) * 0.25 * tape[:, :, None]
    return shade(alb, corr * 0.9 + fib * 0.5, bump=1.0, spec=0.06, rough=40, amb=0.5)


def concrete(seed, base=(0.55, 0.55, 0.53)):
    h = w = N
    f = fbm(w, h, 4, seed, 6)
    pits = (np.random.default_rng(seed).random((h, w)) > 0.996).astype(np.float32)
    pits = cv2.GaussianBlur(pits, (0, 0), 1.2) * 6
    stain = np.clip((fbm(w, h, 2, seed + 4, 4) - 0.55) * 3, 0, 1)
    alb = np.array(base, np.float32) * (0.8 + 0.4 * f[:, :, None]) * (1 - 0.25 * stain[:, :, None]) * (1 - 0.4 * np.clip(pits, 0, 1)[:, :, None])
    return shade(alb, f * 3 - pits, bump=1.2, spec=0.05, amb=0.55)


def asphalt(w, h, seed, base=0.3):
    rng = np.random.default_rng(seed)
    agg = rng.random((h, w)).astype(np.float32)
    agg = cv2.GaussianBlur(agg, (0, 0), 0.9)
    stones = (rng.random((h, w)) > 0.992).astype(np.float32)
    stones = cv2.dilate(stones, np.ones((2, 2), np.uint8))
    f = fbm(w, h, 3, seed + 1, 5)
    v = base * (0.75 + 0.5 * agg) * (0.85 + 0.3 * f) + 0.25 * stones
    alb = np.dstack([v, v * 0.99, v * 0.97])
    return shade(alb, agg * 1.5 + f * 2, bump=1.2, amb=0.55)


# ------------------------------------------------------------------ vehicle scenes (backdrop + ground in perspective)
def perspective_ground(tex, w, h, horizon):
    th, tw = tex.shape[:2]
    src = np.float32([[0, 0], [tw, 0], [tw, th], [0, th]])
    dst = np.float32([[w * 0.28, horizon], [w * 0.72, horizon], [w * 1.9, h * 1.15], [-w * 0.9, h * 1.15]])
    M = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(tex, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def panel_building(w, h, seed, color=(0.72, 0.7, 0.66), night=False):
    rng = np.random.default_rng(seed)
    img = np.ones((h, w, 3), np.float32) * np.array(color, np.float32)
    img *= (0.88 + 0.24 * fbm(w, h, 3, seed, 3))[:, :, None]
    pw, ph = w / rng.uniform(7, 10), h / rng.uniform(5, 6.5)
    for r in range(8):
        for c in range(12):
            x0, y0 = c * pw + pw * rng.uniform(0.18, 0.28), r * ph + ph * 0.22
            lit = rng.random()
            if night and lit > 0.5:
                col = (0.95, 0.75 + rng.uniform(-0.1, 0.1), 0.42)
            else:
                k = rng.uniform(0.12, 0.38)
                col = (k * rng.uniform(0.9, 1.1), k, k * rng.uniform(1.0, 1.3))
            cv2.rectangle(img, (int(x0), int(y0)), (int(x0 + pw * 0.48), int(y0 + ph * 0.56)), col, -1)
            if rng.random() < 0.35:  # curtains
                cc = tuple(float(v) for v in rng.uniform(0.4, 0.9, 3))
                cv2.rectangle(img, (int(x0), int(y0)), (int(x0 + pw * rng.uniform(0.1, 0.24)), int(y0 + ph * 0.56)), cc, -1)
            if rng.random() < 0.3:  # balcony
                cv2.rectangle(img, (int(x0 - pw * 0.08), int(y0 + ph * 0.42)), (int(x0 + pw * 0.6), int(y0 + ph * 0.72)), tuple(float(v) * 0.85 for v in color), -1)
        cv2.line(img, (0, int(r * ph)), (w, int(r * ph)), tuple(float(v) * 0.82 for v in color), 2)
    # trees / bushes in front
    tr = np.clip((fbm(w, h, 6, seed + 3, 5) - 0.35) * 3, 0, 1) * (np.linspace(0, 1, h) ** 2.2)[:, None]
    leaf = np.array((0.2, 0.3, 0.16) if not night else (0.06, 0.08, 0.06), np.float32) * (0.7 + 0.6 * fbm(w, h, 20, seed + 4, 3))[:, :, None]
    img = img * (1 - tr[:, :, None]) + leaf * tr[:, :, None]
    return img


def scene(name, seed, ground, backdrop, horizon=0.42, warm=0.0, sky=None, light=(0.3, 0.1), lines=False, snow=False):
    w = h = N
    hz = int(h * horizon)
    img = np.zeros((h, w, 3), np.float32)
    bd = cv2.resize(backdrop, (w, hz + 30))
    bd = cv2.GaussianBlur(bd, (0, 0), 9)  # shallow depth of field
    img[:hz] = bd[:hz]
    g = perspective_ground(ground, w, h, hz)
    if lines:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        t = np.clip((yy - hz) / (h - hz), 0, 1)
        for base_x in (-0.25, 1.25):
            cx = w * (0.5 + (base_x - 0.5) * (0.25 + 1.6 * t))
            wd = 2 + 18 * t
            m = (np.abs(xx - cx) < wd) & (yy > hz)
            g[m] = g[m] * 0.25 + np.array((0.85, 0.85, 0.8), np.float32) * 0.75 * (0.85 + 0.15 * np.random.default_rng(seed).random(m.sum()))[:, None]
    if snow:
        sn = np.clip((fbm(w, h, 5, seed + 8, 5) - 0.5) * 4, 0, 1)
        sn = cv2.GaussianBlur(sn, (0, 0), 2)
        g = g * (1 - sn[:, :, None]) + np.array((0.86, 0.88, 0.92), np.float32) * sn[:, :, None]
    img[hz:] = g[hz:]
    # soft contact between backdrop and ground
    band = np.exp(-((np.arange(h) - hz) ** 2) / 900.0).astype(np.float32)
    img *= (1 - 0.18 * band)[:, None, None]
    soft = cv2.GaussianBlur(img, (0, 0), 3)
    m = np.exp(-((np.arange(h) - hz) ** 2) / 200.0).astype(np.float32)[:, None, None]
    img = img * (1 - m) + soft * m
    img = camera(img, seed, warm=warm, light_xy=light, falloff=0.25, blur=0.6, noise_amt=0.016, vign=0.3)
    save(name, img)


# ------------------------------------------------------------------ build
if __name__ == '__main__':
    save('wood_oak', camera(wood(3, (0.8, 0.62, 0.42), (0.55, 0.37, 0.2)), 1, warm=0.3, light_xy=(0.15, 0.1)))
    save('wood_walnut', camera(wood(7, (0.45, 0.3, 0.2), (0.22, 0.13, 0.08), boards=3, gloss=0.12), 2, warm=0.5, light_xy=(0.85, 0.1)))
    save('wood_pine', camera(wood(11, (0.88, 0.74, 0.55), (0.7, 0.52, 0.32), boards=5, horizontal=False), 3, warm=0.2, light_xy=(0.1, 0.5)))
    save('laminate', camera(wood(13, (0.66, 0.6, 0.53), (0.48, 0.42, 0.36), boards=6, gloss=0.15), 4, warm=0.1, light_xy=(0.2, 0.0)))
    save('bedsheet', camera(fabric(21, (0.93, 0.92, 0.89)), 5, warm=0.15, light_xy=(0.1, 0.1), falloff=0.3))
    save('duvet_grey', camera(fabric(23, (0.62, 0.64, 0.68), weave=4, fold_n=6, fold_amp=22, width=(30, 90)), 6, warm=-0.1, light_xy=(0.9, 0.2)))
    save('blanket_knit', camera(fabric(25, (0.78, 0.7, 0.6), fold_n=5, fold_amp=16, knit=True), 7, warm=0.35, light_xy=(0.2, 0.9)))
    save('sofa', camera(fabric(27, (0.33, 0.37, 0.43), weave=2.5, fold_n=4, fold_amp=10, width=(40, 120)), 8, warm=0.2, light_xy=(0.8, 0.1)))
    save('carpet', camera(carpet(31, (0.72, 0.64, 0.52), (0.52, 0.45, 0.36)), 9, warm=0.3, light_xy=(0.5, -0.1)))
    save('carpet_grey', camera(carpet(33, (0.5, 0.5, 0.5), (0.32, 0.32, 0.34)), 10, warm=0.0, light_xy=(0.1, 0.3)))
    save('marble', camera(marble(41), 11, warm=0.05, light_xy=(0.15, 0.05), falloff=0.25))
    save('tiles', camera(tiles(43), 12, warm=-0.15, light_xy=(0.3, 0.15)))
    save('cutting_mat', camera(cutting_mat(45), 13, warm=0.0, light_xy=(0.2, 0.2)))
    save('car_seat', camera(leather(47), 14, warm=0.1, light_xy=(0.7, 0.1)))
    save('cardboard', camera(cardboard(49), 15, warm=0.25, light_xy=(0.3, 0.1)))
    save('concrete', camera(concrete(51), 16, warm=-0.05, light_xy=(0.5, 0.0)))
    # vehicles
    asp = asphalt(1024, 1024, 61)
    scene('lot_day', 61, asp, panel_building(900, 420, 62), horizon=0.42, light=(0.2, 0.0), lines=True)
    scene('yard_snow', 63, asphalt(1024, 1024, 64, 0.26), panel_building(900, 420, 65, (0.62, 0.6, 0.58)), horizon=0.44, warm=-0.25, snow=True)
    gar = np.ones((420, 900, 3), np.float32) * 0.42
    yy, xx = np.mgrid[0:420, 0:900].astype(np.float32)
    gar *= (0.85 + 0.15 * (np.sin(xx * 2 * math.pi / 14) > 0))[:, :, None]
    gar[:, :, 0] *= 1.05
    scene('garage', 66, concrete(67, (0.5, 0.5, 0.49)), gar, horizon=0.48, warm=0.35, light=(0.5, -0.2))
    fence = np.ones((420, 900, 3), np.float32) * np.array((0.3, 0.42, 0.3), np.float32)
    fence *= (0.75 + 0.35 * fbm(900, 420, 6, 68, 4))[:, :, None]
    fence[260:] = np.array((0.55, 0.5, 0.45), np.float32) * (0.85 + 0.3 * fbm(900, 160, 30, 69, 3))[:, :, None]
    scene('dacha', 70, concrete(71, (0.5, 0.45, 0.38)), fence, horizon=0.46, warm=0.2, light=(0.8, 0.0))
    scene('street_evening', 72, asphalt(1024, 1024, 73, 0.22), panel_building(900, 420, 74, (0.35, 0.33, 0.36), night=True), horizon=0.43, warm=0.6, light=(0.5, 0.2), lines=True)
    # grain tile for the photo look (black/white specks with alpha)
    rng = np.random.default_rng(99)
    gsz = 256
    n = rng.normal(0, 1, (gsz, gsz)).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 0.55)
    n /= n.std()
    v = np.where(n > 0, 255, 0).astype(np.uint8)
    a = np.clip(np.abs(n) * 30, 0, 90).astype(np.uint8)
    Image.fromarray(np.dstack([v, v, v, a]), 'RGBA').save(os.path.join(OUT, 'grain.webp'), 'WEBP', quality=70, method=6)
    print('grain', os.path.getsize(os.path.join(OUT, 'grain.webp')) // 1024, 'KB')
