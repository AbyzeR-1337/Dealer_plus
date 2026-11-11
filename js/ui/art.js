// Procedural SVG art for every item: colours, variants, damage overlays and photo backgrounds.
import { MODEL, colorHex, DEFECTS } from '../data/catalog.js';
import { RNG } from '../core/rng.js';
import { shade, mix, clamp, lum, esc } from '../core/util.js';
import { DRAW2 } from './art2.js';
import { pickSprite, spriteMarkup } from './sprite_art.js';
import { photoSetup, photoBackground, photoPost, shadowDefs, groundShadow } from './photo.js';
import { viewsOf, defectView } from '../data/views.js';

let UID = 0;
const CACHE = new Map();
const S = (n) => +n.toFixed(1);

// ---------------------------------------------------------------- context helpers
export function mkCtx(it, o) {
  const m = MODEL[it.m];
  const P = 'a' + (++UID).toString(36);
  const defs = [];
  let gid = 0;
  const ctx = {
    it, m, a: m?.art || {}, o, P, defs, rng: new RNG(it.seed || 1), view: o.view || 'front',
    c: it.color === 'cw' ? (m?.art?.c?.[0] || '#888') : colorHex(it.color),
    lin(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) { const id = `${P}g${gid++}`; defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o2, c, op]) => `<stop offset="${o2}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</linearGradient>`); return `url(#${id})`; },
    rad(stops, cx = 0.5, cy = 0.5, r = 0.5) { const id = `${P}g${gid++}`; defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o2, c, op]) => `<stop offset="${o2}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`); return `url(#${id})`; },
    clip(shape) { const id = `${P}c${gid++}`; defs.push(`<clipPath id="${id}">${shape}</clipPath>`); return `url(#${id})`; },
    pat(w, h, body) { const id = `${P}p${gid++}`; defs.push(`<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse">${body}</pattern>`); return `url(#${id})`; },
  };
  return ctx;
}
export const rr = (x, y, w, h, r, fill, extra = '') => `<rect x="${S(x)}" y="${S(y)}" width="${S(w)}" height="${S(h)}" rx="${S(r)}" fill="${fill}" ${extra}/>`;
export const ci = (x, y, r, fill, extra = '') => `<circle cx="${S(x)}" cy="${S(y)}" r="${S(r)}" fill="${fill}" ${extra}/>`;
export const el = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${S(x)}" cy="${S(y)}" rx="${S(rx)}" ry="${S(ry)}" fill="${fill}" ${extra}/>`;
export const pa = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const tx = (x, y, s, size, fill, extra = '') => `<text x="${S(x)}" y="${S(y)}" font-size="${size}" fill="${fill}" font-family="-apple-system,Helvetica,Arial,sans-serif" text-anchor="middle" ${extra}>${esc(s)}</text>`;
export const ln = (x1, y1, x2, y2, st, w = 2, extra = '') => `<line x1="${S(x1)}" y1="${S(y1)}" x2="${S(x2)}" y2="${S(y2)}" stroke="${st}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
export const metal = (ctx, kind) => {
  const M = { steel: ['#f4f5f7', '#b9bdc4', '#7c818a'], gold: ['#fff1b8', '#e2b84a', '#9b7420'], ygold: ['#fff1b8', '#e2b84a', '#9b7420'], rose: ['#ffe2d4', '#e3a68c', '#a86a52'], rgold: ['#ffe2d4', '#e3a68c', '#a86a52'], white: ['#ffffff', '#dfe3e8', '#9aa1aa'], wgold: ['#ffffff', '#dfe3e8', '#9aa1aa'], platinum: ['#ffffff', '#dfe3e8', '#9aa1aa'], silver: ['#ffffff', '#cfd3d8', '#8a9099'], titanium: ['#e2e0db', '#a7a49e', '#6d6a64'], black: ['#4a4c52', '#1f2024', '#0a0a0b'], alu: ['#f4f5f7', '#cfd3d8', '#9aa1aa'], plastic: ['#5a5c62', '#2a2b2f', '#141416'], brass: ['#ffe9a8', '#c99a3a', '#7a5a1a'] };
  const c = M[kind] || M.steel;
  return ctx.lin([[0, c[0]], [0.5, c[1]], [1, c[2]]], 0, 0, 1, 1);
};

// ---------------------------------------------------------------- backgrounds
const BG_BY_CAT = {
  phones: ['studio', 'wood', 'desk', 'fabric', 'marble', 'bed'], electronics: ['desk', 'wood', 'studio', 'concrete'], consoles: ['desk', 'wood', 'carpet', 'studio'],
  accessories: ['studio', 'marble', 'wood', 'fabric'], sneakers: ['studio', 'concrete', 'wood', 'bed'], clothing: ['bed', 'wood', 'concrete', 'studio'],
  bags: ['marble', 'studio', 'velvet', 'bed'], watches: ['velvet', 'marble', 'wood', 'desk'], jewelry: ['velvet', 'marble', 'velvet2'], perfume: ['marble', 'studio', 'velvet'],
  cards: ['desk', 'wood', 'fabric'], comics: ['wood', 'desk', 'concrete'], toys: ['studio', 'wood', 'carpet'], antiques: ['wood', 'velvet2', 'carpet'],
  art: ['wall', 'wall2', 'wood'], collectibles: ['velvet', 'wood', 'desk'], instruments: ['wall', 'wood', 'studio'], cars: ['street', 'parking', 'garage', 'country'], bikes: ['street', 'garage', 'country'],
};
function background(ctx) {
  const { rng, it } = ctx;
  const kind = rng.pick(BG_BY_CAT[it.cat] || ['studio']);
  const W = 400;
  switch (kind) {
    case 'studio': return rr(0, 0, W, W, 0, ctx.rad([[0, '#f3f3f1'], [1, '#c9ccd1']], 0.5, 0.35, 0.8));
    case 'marble': return rr(0, 0, W, W, 0, '#eeedea') + Array.from({ length: 5 }, (_, i) => pa(`M${rng.int(-50, 100)} ${rng.int(0, 400)} C ${rng.int(80, 200)} ${rng.int(0, 400)}, ${rng.int(200, 320)} ${rng.int(0, 400)}, ${rng.int(320, 460)} ${rng.int(0, 400)}`, 'none', `stroke="#b9b6b0" stroke-width="${rng.float(0.6, 2)}" opacity="${rng.float(0.25, 0.6)}"`)).join('');
    case 'wood': {
      const base = rng.pick(['#9b6a3e', '#7a4f2c', '#b07d4a', '#5e3b22', '#c49a6c']);
      let g = rr(0, 0, W, W, 0, base);
      for (let i = 0; i < 14; i++) { const y = i * 30 + rng.int(-8, 8); g += pa(`M-10 ${y} C 100 ${y + rng.int(-14, 14)}, 260 ${y + rng.int(-14, 14)}, 410 ${y + rng.int(-6, 6)}`, 'none', `stroke="${shade(base, rng.float(-0.25, 0.15))}" stroke-width="${rng.float(1, 4)}" opacity=".55"`); }
      return g + rr(0, 0, W, W, 0, ctx.rad([[0, '#fff', 0.12], [1, '#000', 0.25]], 0.5, 0.4, 0.8));
    }
    case 'desk': return rr(0, 0, W, W, 0, ctx.rad([[0, '#3a4252'], [1, '#161a22']], 0.5, 0.4, 0.8));
    case 'concrete': { let g = rr(0, 0, W, W, 0, '#a7a9ab'); for (let i = 0; i < 70; i++) g += ci(rng.int(0, 400), rng.int(0, 400), rng.float(0.5, 2), rng.chance(0.5) ? '#8e9092' : '#bfc1c3', 'opacity=".7"'); return g; }
    case 'fabric': return rr(0, 0, W, W, 0, ctx.pat(8, 8, rr(0, 0, 8, 8, 0, '#2e3a55') + rr(0, 0, 4, 4, 0, '#33405e'))) + rr(0, 0, W, W, 0, ctx.rad([[0, '#fff', 0.08], [1, '#000', 0.35]]));
    case 'bed': { let g = rr(0, 0, W, W, 0, '#eceae6'); for (let i = 0; i < 6; i++) g += pa(`M${rng.int(-40, 80)} ${rng.int(0, 400)} Q ${rng.int(120, 280)} ${rng.int(0, 400)} ${rng.int(320, 460)} ${rng.int(0, 400)}`, 'none', `stroke="#cfccc6" stroke-width="${rng.int(6, 16)}" opacity=".35"`); return g; }
    case 'velvet': case 'velvet2': { const c = kind === 'velvet' ? rng.pick(['#1d2b4a', '#3a0f1f', '#0f3326', '#241a3a']) : rng.pick(['#5a1020', '#132a52']); return rr(0, 0, W, W, 0, ctx.rad([[0, shade(c, 0.25)], [1, shade(c, -0.5)]], 0.5, 0.4, 0.75)); }
    case 'carpet': return rr(0, 0, W, W, 0, ctx.pat(20, 20, rr(0, 0, 20, 20, 0, '#6b2a2a') + pa('M0 10 L10 0 L20 10 L10 20Z', '#7d3535'))) + rr(0, 0, W, W, 0, ctx.rad([[0, '#fff', 0.05], [1, '#000', 0.35]]));
    case 'wall': case 'wall2': { const c = kind === 'wall' ? rng.pick(['#e9e4da', '#d9dde3', '#f1ede4']) : rng.pick(['#2a2f3a', '#3a2f2a']); return rr(0, 0, W, W, 0, ctx.rad([[0, shade(c, 0.1)], [1, shade(c, -0.15)]], 0.5, 0.3, 0.9)); }
    case 'street': return rr(0, 0, W, 240, 0, ctx.lin([[0, '#8fc3ea'], [1, '#dfeefa']])) + pa('M0 240 L0 150 L40 150 L40 120 L90 120 L90 170 L130 170 L130 100 L190 100 L190 160 L250 160 L250 130 L300 130 L300 180 L350 180 L350 110 L400 110 L400 240Z', '#b9c3cf', 'opacity=".7"') + rr(0, 240, W, 160, 0, '#4a4f57') + rr(0, 236, W, 8, 0, '#9ea3aa') + Array.from({ length: 5 }, (_, i) => rr(i * 90 + 10, 360, 50, 6, 2, '#e8e8e8', 'opacity=".6"')).join('');
    case 'parking': return rr(0, 0, W, W, 0, '#5a6069') + rr(0, 0, W, 200, 0, ctx.lin([[0, '#c9d6e3'], [1, '#e9eef3']])) + rr(0, 200, W, 4, 0, '#7a8089') + ln(20, 330, 60, 390, '#f2f2f2', 5) + ln(360, 330, 400, 390, '#f2f2f2', 5);
    case 'garage': return rr(0, 0, W, 250, 0, '#d8d4cc') + Array.from({ length: 8 }, (_, i) => rr(0, i * 32, W, 1, 0, '#bdb8ae')).join('') + rr(0, 250, W, 150, 0, ctx.lin([[0, '#8d8a85'], [1, '#6e6b66']])) + el(200, 330, 170, 20, '#000', 'opacity=".12"');
    case 'country': return rr(0, 0, W, W, 0, ctx.lin([[0, '#a7d3f2'], [0.6, '#eaf5fb']])) + pa('M0 230 Q 100 170 200 220 T 400 200 L400 400 L0 400Z', '#7fb069') + rr(0, 255, W, 145, 0, '#9a9488') + rr(0, 252, W, 5, 0, '#c9c2b2');
    default: return rr(0, 0, W, W, 0, '#ddd');
  }
}

// ---------------------------------------------------------------- defect overlays
function crackPath(rng, x, y, size) {
  let d = '';
  const n = rng.int(5, 8);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.float(-0.3, 0.3);
    let px = x, py = y; d += `M${S(x)} ${S(y)} `;
    const segs = rng.int(2, 4);
    for (let k = 0; k < segs; k++) { const l = size * rng.float(0.25, 0.5); px += Math.cos(a + rng.float(-0.4, 0.4)) * l; py += Math.sin(a + rng.float(-0.4, 0.4)) * l; d += `L${S(px)} ${S(py)} `; }
  }
  for (let r = 0; r < 2; r++) { const rad = size * (0.25 + r * 0.22); d += `M${S(x + rad)} ${S(y)} `; for (let k = 1; k <= 8; k++) { const a = (k / 8) * Math.PI * 2; d += `L${S(x + Math.cos(a) * rad * rng.float(0.8, 1.15))} ${S(y + Math.sin(a) * rad * rng.float(0.8, 1.15))} `; } }
  return d;
}
export function overlay(ctx, d, box, opacity = 1) {
  const r = new RNG(ctx.it.seed + d.c.length * 977 + Math.round(d.x * 1000));
  const x = box.x + d.x * box.w, y = box.y + d.y * box.h;
  const sz = Math.min(box.w, box.h);
  const op = (v) => `opacity="${S(v * opacity * 100) / 100}"`;
  switch (ctx.vizOf(d)) {
    case 'crack': { const p = crackPath(r, x, y, sz * 0.38); return pa(p, 'none', `stroke="#fff" stroke-width="1.3" ${op(0.85)}`) + pa(p, 'none', `stroke="#000" stroke-width="0.6" ${op(0.4)} transform="translate(0.8 0.8)"`); }
    case 'lightcrack': return pa(crackPath(r, x, y, 26), 'none', `stroke="#fff" stroke-width="1.1" ${op(0.9)}`);
    case 'glass': return pa(crackPath(r, x, y, 40), 'none', `stroke="#fff" stroke-width="1" ${op(0.8)}`);
    case 'scratch': { let g = ''; for (let i = 0; i < 6; i++) { const a = r.float(-0.6, 0.6), l = r.float(14, 40); const ox = r.float(-18, 18), oy = r.float(-18, 18); g += ln(x + ox, y + oy, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l, '#ffffff', r.float(0.5, 1.4), op(0.7)); } return g; }
    case 'dent': return el(x, y, sz * 0.09, sz * 0.06, ctx.rad([[0, '#000', 0.45], [0.7, '#000', 0.15], [1, '#000', 0]]), op(1)) + pa(`M${S(x - sz * 0.07)} ${S(y - sz * 0.03)} Q ${S(x)} ${S(y - sz * 0.08)} ${S(x + sz * 0.07)} ${S(y - sz * 0.03)}`, 'none', `stroke="#fff" stroke-width="1.4" ${op(0.5)}`);
    case 'rust': { let g = ''; for (let i = 0; i < 9; i++) g += ci(x + r.float(-sz * 0.08, sz * 0.08), y + r.float(-sz * 0.05, sz * 0.05), r.float(2, sz * 0.045), r.pick(['#8a4b1c', '#a5591e', '#6b3a17', '#c06a2a']), op(r.float(0.6, 0.95))); return g; }
    case 'stain': return pa(`M${S(x - 12)} ${S(y)} Q ${S(x - 14)} ${S(y - 14)} ${S(x)} ${S(y - 11)} Q ${S(x + 16)} ${S(y - 12)} ${S(x + 13)} ${S(y + 3)} Q ${S(x + 9)} ${S(y + 15)} ${S(x - 3)} ${S(y + 12)} Q ${S(x - 16)} ${S(y + 10)} ${S(x - 12)} ${S(y)}Z`, r.pick(['#7a5a2a', '#5a4a3a', '#8a6a3a']), op(0.45));
    case 'scuff': return el(x, y, sz * 0.08, sz * 0.04, '#6b6b6b', op(0.35)) + el(x + 6, y + 2, sz * 0.05, sz * 0.025, '#4a4a4a', op(0.3));
    case 'crease': { let g = ''; for (let i = 0; i < 4; i++) g += pa(`M${S(x - 22 + i * 6)} ${S(y - 10 + i * 4)} q 12 ${r.int(-6, 6)} 26 ${r.int(-2, 4)}`, 'none', `stroke="#000" stroke-width="1" ${op(0.35)}`); return g; }
    case 'yellow': return rr(box.x, box.y + box.h * 0.75, box.w, box.h * 0.25, 6, '#d9b54a', op(0.38));
    case 'fade': return el(box.x + box.w / 2, box.y + box.h / 2, box.w * 0.55, box.h * 0.55, ctx.rad([[0, '#ffffff', 0.38], [1, '#ffffff', 0]]), op(1));
    case 'tear': return pa(`M${S(x - 16)} ${S(y)} l6 -5 l5 6 l6 -7 l5 6 l6 -5`, 'none', `stroke="#1b1b1b" stroke-width="2.2" ${op(0.8)}`);
    case 'chip': return pa(`M${S(x)} ${S(y)} l9 -3 l-2 9Z`, '#e8e8e8', op(0.85)) + pa(`M${S(x)} ${S(y)} l9 -3 l-2 9Z`, 'none', `stroke="#555" stroke-width=".6" ${op(0.6)}`);
    case 'line': return rr(x, box.y + 4, 3, box.h - 8, 0, r.pick(['#ff2bd6', '#2bff7a', '#2bd6ff', '#ffffff']), op(0.85)) + ci(x + 18, y, 1.6, '#fff', op(0.9));
    case 'bend': return pa(`M${S(box.x)} ${S(y)} Q ${S(box.x + box.w / 2)} ${S(y - 6)} ${S(box.x + box.w)} ${S(y)}`, 'none', `stroke="#000" stroke-width="1.2" ${op(0.35)}`);
    case 'panel': return rr(x - sz * 0.12, box.y + box.h * 0.35, sz * 0.24, box.h * 0.4, 4, shade(ctx.c, 0.13), op(0.55));
    case 'flat': return '';
    default: return '';
  }
}

// ---------------------------------------------------------------- category drawers (part 1)
const WALLS = [['#ff8a5c', '#6a3cff'], ['#1e5bd8', '#0a1a3a'], ['#ff5ca8', '#6a1a8a'], ['#2ec5a8', '#1a3a6a'], ['#f7b733', '#fc4a1a'], ['#7f7fd5', '#86a8e7'], ['#0f2027', '#2c5364'], ['#c471f5', '#fa71cd']];
function screenWall(ctx, x, y, w, h, r) {
  const [a, b] = ctx.rng.pick(WALLS);
  return rr(x, y, w, h, r, ctx.lin([[0, a], [1, b]], 0, 0, 1, 1)) + pa(`M${S(x)} ${S(y + h * 0.15)} L${S(x + w * 0.65)} ${S(y)} L${S(x + w)} ${S(y)} L${S(x)} ${S(y + h * 0.55)}Z`, '#fff', 'opacity=".07"');
}
function lockScreen(ctx, x, y, w, h, lock) {
  if (lock === 'bootloop') return rr(x, y, w, h, 10, '#000') + ci(x + w / 2, y + h * 0.45, 14, '#ddd') + tx(x + w / 2, y + h * 0.62, '…', 18, '#aaa');
  if (lock === 'blacklist') return '';
  return rr(x + w / 2 - 9, y + h * 0.22, 18, 14, 3, '#fff', 'opacity=".95"') + pa(`M${S(x + w / 2 - 6)} ${S(y + h * 0.22)} v-6 a6 6 0 0 1 12 0 v6`, 'none', 'stroke="#fff" stroke-width="2.5" opacity=".95"') + tx(x + w / 2, y + h * 0.36, lock === 'icloud' ? 'Pear ID' : lock === 'frp' ? 'FRP lock' : '• • • •', 11, '#fff', 'opacity=".9"');
}
function pearLogo(x, y, s, fill) {
  return pa(`M${x} ${y - s * 0.9} q ${s * 0.12} ${-s * 0.35} ${s * 0.38} ${-s * 0.42} M${x} ${y - s * 0.75} c ${-s * 0.25} 0 ${-s * 0.32} ${s * 0.3} ${-s * 0.42} ${s * 0.55} c ${-s * 0.3} ${s * 0.2} ${-s * 0.42} ${s * 0.55} ${-s * 0.25} ${s * 0.82} c ${s * 0.2} ${s * 0.3} ${s * 0.7} ${s * 0.3} ${s * 0.9} 0 c ${s * 0.17} ${-s * 0.27} ${s * 0.05} ${-s * 0.62} ${-s * 0.25} ${-s * 0.82} c ${-s * 0.1} ${-s * 0.25} ${-s * 0.17} ${-s * 0.55} ${-s * 0.4} ${-s * 0.55}z`, fill, `stroke="${fill}" stroke-width="1.5"`);
}
function lens(ctx, x, y, r) {
  return ci(x, y, r + 3, '#2a2b2e') + ci(x, y, r, ctx.rad([[0, '#3b4a6a'], [0.6, '#11131a'], [1, '#000']], 0.4, 0.35, 0.7)) + ci(x - r * 0.3, y - r * 0.3, r * 0.22, '#fff', 'opacity=".35"') + ci(x, y, r * 0.45, 'none', 'stroke="#2c3a5a" stroke-width="1.5"');
}
function phone(ctx) {
  const { a, view, it } = ctx;
  if (['retro', 'slider', 'flipold', 'qwerty'].includes(a.f)) return retroPhone(ctx);
  if (view === 'left' || view === 'right' || view === 'bottom') return phoneEdge(ctx, view);
  const fold = a.f === 'fold';
  const w = fold ? 210 : 150, h = 320, x = 200 - w / 2, y = 40, r = a.f === 'bezel' ? 24 : 28;
  const box = { x, y, w, h };
  const body = ctx.c;
  const frame = ctx.lin([[0, shade(body, 0.35)], [0.5, shade(body, -0.05)], [1, shade(body, -0.3)]], 0, 0, 1, 0);
  let g = '';
  // side buttons
  const btnFill = shade(body, -0.1);
  g += rr(x - 3, y + 70, 4, 22, 2, btnFill) + rr(x - 3, y + 102, 4, 34, 2, btnFill) + rr(x - 3, y + 142, 4, 34, 2, btnFill) + rr(x + w - 1, y + 105, 4, 48, 2, btnFill);
  ctx.buttons = [{ x: x - 3, y: y + 102, w: 6, h: 34, side: 'L', k: 'volup' }, { x: x - 3, y: y + 142, w: 6, h: 34, side: 'L', k: 'voldn' }, { x: x + w - 3, y: y + 105, w: 6, h: 48, side: 'R', k: 'power' }];
  g += rr(x, y, w, h, r, frame);
  if (view === 'front') {
    const bez = a.f === 'bezel' ? { t: 42, b: 46, s: 9 } : a.f === 'bezel2' ? { t: 24, b: 24, s: 7 } : { t: 6, b: 6, s: 6 };
    g += rr(x + 3, y + 3, w - 6, h - 6, r - 3, a.f === 'bezel' && lum(body) > 0.6 ? '#f4f4f2' : '#060607');
    const sx = x + bez.s, sy = y + bez.t, sw = w - bez.s * 2, sh = h - bez.t - bez.b, sr = a.f === 'bezel' ? 2 : r - 7;
    ctx.screen = { x: sx, y: sy, w: sw, h: sh };
    if (it.lock === 'bootloop') g += lockScreen(ctx, sx, sy, sw, sh, 'bootloop');
    else {
      g += screenWall(ctx, sx, sy, sw, sh, sr);
      g += tx(200, sy + sh * 0.12, ctx.o.dateStr || 'пн, 10 окт.', 10, '#fff', 'opacity=".85"');
      g += tx(200, sy + sh * 0.25, '9:41', fold ? 54 : 46, '#fff', 'font-weight="300" letter-spacing="-1"');
      if (it.lock) g += lockScreen(ctx, sx, sy + sh * 0.25, sw, sh * 0.7, it.lock);
      g += rr(200 - 32, sy + sh - 12, 64, 4, 2, '#fff', 'opacity=".85"');
    }
    if (a.f === 'island') g += rr(200 - 26, sy + 9, 52, 15, 8, '#000');
    else if (a.f === 'notch') g += pa(`M${S(200 - 42)} ${S(sy)} h84 v8 q0 12 -12 12 h-60 q-12 0 -12 -12z`, '#000');
    else if (a.f === 'punch' || a.f === 'flip') g += ci(200, sy + 13, 5, '#000');
    if (a.f === 'bezel') { g += rr(200 - 16, y + 20, 32, 4, 2, '#333'); g += ci(200 - 28, y + 22, 3, '#222'); g += ci(200, y + h - 23, 15, 'none', `stroke="${lum(body) > 0.6 ? '#bbb' : '#333'}" stroke-width="2"`); }
    if (a.f === 'bezel2') { g += rr(200 - 20, y + 10, 40, 3, 2, '#333'); }
    if (fold) g += rr(199, y + 4, 2, h - 8, 1, '#fff', 'opacity=".12"');
    if (a.f === 'flip') g += rr(x + 4, y + h / 2 - 1, w - 8, 2, 1, '#fff', 'opacity=".12"');
  } else {
    // back
    g += rr(x + 2, y + 2, w - 4, h - 4, r - 2, ctx.lin([[0, shade(body, 0.12)], [0.6, body], [1, shade(body, -0.12)]], 0, 0, 1, 1));
    g += pa(`M${S(x + 10)} ${S(y + 10)} L${S(x + w * 0.55)} ${S(y + 10)} L${S(x + 10)} ${S(y + h * 0.55)}Z`, '#fff', 'opacity=".09"');
    const cx = x + 14, cy = y + 14;
    const bump = shade(body, -0.06);
    switch (a.cam) {
      case 'p1': case 'p1old': g += lens(ctx, cx + 20, cy + 20, a.cam === 'p1old' ? 6 : 9) + ci(cx + 42, cy + 16, 3, '#f5e9c8'); break;
      case 'p2v': g += rr(cx + 4, cy + 2, 34, 74, 17, bump, `stroke="${shade(body, -0.2)}"`) + lens(ctx, cx + 21, cy + 20, 10) + lens(ctx, cx + 21, cy + 56, 10) + ci(cx + 46, cy + 38, 3, '#f5e9c8'); break;
      case 'p2h': g += rr(cx + 2, cy + 4, 74, 34, 17, bump) + lens(ctx, cx + 20, cy + 21, 10) + lens(ctx, cx + 56, cy + 21, 10); break;
      case 'p2d': g += rr(cx, cy, 70, 70, 18, bump, `stroke="${shade(body, -0.18)}"`) + lens(ctx, cx + 20, cy + 20, 11) + lens(ctx, cx + 50, cy + 50, 11) + ci(cx + 52, cy + 18, 3, '#f5e9c8'); break;
      case 'p2sq': g += rr(cx, cy, 70, 70, 18, shade(body, 0.05), `stroke="${shade(body, -0.18)}"`) + lens(ctx, cx + 20, cy + 20, 11) + lens(ctx, cx + 20, cy + 50, 11) + ci(cx + 52, cy + 20, 3, '#f5e9c8'); break;
      case 'p3': g += rr(cx - 2, cy - 2, 82, 82, 20, bump, `stroke="${shade(body, -0.2)}"`) + lens(ctx, cx + 20, cy + 20, 13) + lens(ctx, cx + 20, cy + 58, 13) + lens(ctx, cx + 56, cy + 39, 13) + ci(cx + 58, cy + 14, 4, '#f5e9c8') + ci(cx + 58, cy + 64, 5, '#222'); break;
      case 'pbar': g += rr(x + 6, y + 10, w - 12, 46, 22, bump) + lens(ctx, x + 32, y + 33, 11) + ci(x + 58, y + 33, 3, '#f5e9c8'); break;
      case 'p3bar': g += rr(x + 4, y + 8, w - 8, 78, 24, bump) + lens(ctx, x + 30, y + 30, 12) + lens(ctx, x + 30, y + 64, 12) + lens(ctx, x + 64, y + 47, 12) + ci(x + w - 26, y + 30, 4, '#f5e9c8'); break;
      case 's3v': g += lens(ctx, cx + 18, cy + 18, 10) + lens(ctx, cx + 18, cy + 46, 10) + lens(ctx, cx + 18, cy + 74, 10) + ci(cx + 40, cy + 18, 3, '#f5e9c8'); break;
      case 's4u': g += lens(ctx, cx + 18, cy + 18, 11) + lens(ctx, cx + 18, cy + 48, 11) + lens(ctx, cx + 18, cy + 78, 11) + lens(ctx, cx + 46, cy + 22, 7) + ci(cx + 46, cy + 48, 3, '#f5e9c8'); break;
      case 'sq4': g += rr(cx, cy, 80, 80, 16, shade(body, -0.12)) + lens(ctx, cx + 22, cy + 22, 11) + lens(ctx, cx + 58, cy + 22, 11) + lens(ctx, cx + 22, cy + 58, 11) + ci(cx + 58, cy + 58, 6, '#f5e9c8'); break;
      case 'bar': g += rr(x - 1, y + 50, w + 2, 38, 6, shade(body, -0.35)) + rr(x + 20, y + 58, 66, 22, 11, '#111') + lens(ctx, x + 32, y + 69, 8) + lens(ctx, x + 60, y + 69, 8) + ci(x + 102, y + 69, 3, '#f5e9c8'); break;
      case 'circle': g += ci(200, y + 70, 46, shade(body, -0.1), `stroke="${shade(body, -0.25)}" stroke-width="2"`) + lens(ctx, 200 - 18, y + 52, 11) + lens(ctx, 200 + 18, y + 52, 11) + lens(ctx, 200 - 18, y + 88, 11) + ci(200 + 18, y + 88, 5, '#f5e9c8'); break;
      case 'dual': g += ci(cx + 22, cy + 22, 22, shade(body, -0.18)) + lens(ctx, cx + 22, cy + 22, 14) + ci(cx + 22, cy + 70, 22, shade(body, -0.18)) + lens(ctx, cx + 22, cy + 70, 14) + ci(cx + 60, cy + 16, 7, '#f5e9c8'); break;
      case 'flip': g += rr(x + 8, y + 8, w - 16, h / 2 - 16, 18, '#0b0b0c') + lens(ctx, x + 30, y + 30, 9) + lens(ctx, x + 30, y + 60, 9) + rr(x + 4, y + h / 2 - 1, w - 8, 2, 1, '#000', 'opacity=".2"'); break;
      default: g += lens(ctx, cx + 20, cy + 20, 10);
    }
    if (a.logo === 'pear') g += pearLogo(200, y + h * 0.5, 22, shade(body, lum(body) > 0.5 ? -0.12 : 0.18));
    else if (a.logo === 'g') g += tx(200, y + h * 0.83, 'G', 22, shade(body, lum(body) > 0.5 ? -0.25 : 0.3), 'font-weight="700"');
    else if (a.txt) g += tx(200, y + h * 0.86, a.txt, 15, shade(body, lum(body) > 0.5 ? -0.3 : 0.3), 'font-weight="700" letter-spacing="3"');
  }
  return { g, box, clip: rr(x, y, w, h, r, '#000') };
}
// Phone seen edge-on (lying on the table, camera low): the long sides with buttons and SIM tray,
// or the bottom edge with port, speaker, mic and screws. Everything tappable is reported in ctx.hot.
function phoneEdge(ctx, view) {
  const { a, it } = ctx;
  const body = ctx.c;
  const pear = a.logo === 'pear';
  const bottom = view === 'bottom';
  const L = bottom ? 300 : 340, T = bottom ? 46 : 34, D = bottom ? 70 : 52;
  const x0 = 200 - L / 2, ey = bottom ? 200 : 205; // top of the edge band
  const rad = bottom ? 22 : T / 2;
  let g = '';
  // top face (glass) seen at a grazing angle
  const glass = ctx.lin([[0, '#2b2f36'], [0.45, '#0b0c0f'], [0.5, '#3a404a'], [0.56, '#0b0c0f'], [1, '#050506']], 0, 0, 1, 0);
  g += pa(`M${S(x0 + 18)} ${S(ey - D)} L${S(x0 + L - 18)} ${S(ey - D)} Q${S(x0 + L)} ${S(ey - D)} ${S(x0 + L)} ${S(ey - D + 10)} L${S(x0 + L)} ${S(ey)} L${S(x0)} ${S(ey)} L${S(x0)} ${S(ey - D + 10)} Q${S(x0)} ${S(ey - D)} ${S(x0 + 18)} ${S(ey - D)}Z`, glass);
  g += rr(x0 + 6, ey - D + 4, L - 12, 3, 1.5, '#fff', 'opacity=".18"');
  // metal frame band
  const metalBand = ctx.lin([[0, shade(body, 0.45)], [0.18, shade(body, 0.15)], [0.5, shade(body, -0.05)], [0.82, shade(body, -0.3)], [1, shade(body, -0.5)]], 0, 0, 0, 1);
  g += rr(x0, ey, L, T, rad, metalBand);
  g += rr(x0 + 4, ey + 2, L - 8, 2, 1, '#fff', 'opacity=".35"');
  // antenna lines
  for (const fx of [0.08, 0.92]) g += rr(x0 + L * fx, ey, 4, T, 0, shade(body, -0.25), 'opacity=".8"');
  // back glass edge peeking under the frame
  g += rr(x0 + 8, ey + T - 3, L - 16, 5, 2, shade(body, -0.15));
  ctx.hot = [];
  ctx.buttons = [];
  const btn = (bx, bw, k) => {
    const bfill = ctx.lin([[0, shade(body, 0.35)], [0.5, shade(body, 0)], [1, shade(body, -0.35)]], 0, 0, 0, 1);
    g += rr(bx, ey - 3, bw, T * 0.62, 4, bfill, `stroke="${shade(body, -0.4)}" stroke-width=".8"`);
    ctx.buttons.push({ x: bx, y: ey - 6, w: bw, h: T * 0.62 + 8, k, side: view === 'left' ? 'L' : 'R' });
  };
  const sim = (sx) => {
    g += rr(sx, ey + T * 0.3, 74, T * 0.4, T * 0.2, shade(body, -0.12), `stroke="${shade(body, -0.45)}" stroke-width="1"`) + ci(sx + 64, ey + T * 0.5, 2.6, '#111');
    ctx.hot.push({ x: sx - 4, y: ey, w: 82, h: T, k: 'sim' });
  };
  if (view === 'left') {
    // top of the phone is on the left of the frame
    if (pear) g += rr(x0 + 42, ey + T * 0.3, 18, T * 0.4, 3, shade(body, -0.2), 'stroke="#000" stroke-width=".6"');
    btn(x0 + 76, 40, 'volup'); btn(x0 + 126, 40, 'voldn');
    if (pear) sim(x0 + 196); else g += rr(x0 + 200, ey + T * 0.42, 50, 3, 1.5, '#000', 'opacity=".35"');
  } else if (view === 'right') {
    btn(x0 + L - 150, 58, 'power');
    if (!pear) sim(x0 + 60);
  } else {
    // bottom edge: mic | screw | port | screw | speaker
    const cy = ey + T / 2;
    const port = pear && it.year < 2023 ? { w: 34, h: 10 } : { w: 40, h: 13 };
    g += rr(200 - port.w / 2, cy - port.h / 2, port.w, port.h, port.h / 2, '#050505', `stroke="${shade(body, -0.5)}" stroke-width="1"`) + rr(200 - port.w * 0.32, cy - 1.5, port.w * 0.64, 3, 1.5, '#4a4f58');
    ctx.hot.push({ x: 200 - port.w / 2 - 10, y: cy - 18, w: port.w + 20, h: 36, k: 'port' });
    for (const sx of [200 - port.w / 2 - 22, 200 + port.w / 2 + 22]) {
      if (pear) { g += ci(sx, cy, 4.2, shade(body, -0.3)) + pa(`M${S(sx - 2.5)} ${S(cy)} h5 M${S(sx)} ${S(cy - 2.5)} v5`, 'none', 'stroke="#111" stroke-width="1.1"'); ctx.hot.push({ x: sx - 12, y: cy - 14, w: 24, h: 28, k: 'screw' }); }
    }
    let holes = '';
    for (let i = 0; i < 7; i++) holes += ci(200 + 64 + i * 11, cy, 3, '#060606');
    g += holes; ctx.hot.push({ x: 254, y: cy - 16, w: 86, h: 32, k: 'speaker' });
    let mic = '';
    for (let i = 0; i < 5; i++) mic += ci(200 - 64 - i * 11, cy, 2.2, '#080808');
    g += mic; ctx.hot.push({ x: 74, y: cy - 16, w: 70, h: 32, k: 'mic' });
  }
  const box = { x: x0, y: ey - D, w: L, h: D + T };
  return { g, box, clip: rr(x0, ey - D, L, D + T, 10, '#000') };
}
function retroPhone(ctx) {
  const { a, view, c } = ctx;
  const x = 140, y = 40, w = 120, h = 320;
  let g = '';
  const body = ctx.lin([[0, shade(c, 0.25)], [1, shade(c, -0.25)]], 0, 0, 1, 1);
  if (a.f === 'flipold') {
    g += rr(x, y, w, h / 2 + 6, 18, body) + rr(x + 10, y + 16, w - 20, 104, 8, '#0b0b0c') + rr(x + 15, y + 22, w - 30, 92, 4, ctx.lin([[0, '#5aa0e6'], [1, '#1e3a8a']])) + tx(200, y + 75, '12:34', 18, '#fff');
    g += rr(x, y + h / 2, w, h / 2, 18, shade(c, -0.1)) + rr(x + 6, y + h / 2 + 6, w - 12, h / 2 - 12, 12, '#2a2b2e');
    for (let r2 = 0; r2 < 4; r2++) for (let k = 0; k < 3; k++) g += rr(x + 16 + k * 31, y + h / 2 + 30 + r2 * 30, 26, 20, 4, ctx.lin([[0, '#a0b8d8'], [1, '#5a7aa8']]), 'opacity=".9"');
    return { g, box: { x, y, w, h } };
  }
  g += rr(x, y, w, h, a.f === 'qwerty' ? 14 : 40, body);
  if (view === 'back') {
    g += lens(ctx, 200, y + 60, 9) + tx(200, y + 200, ctx.m.brand.toUpperCase(), 14, shade(c, 0.4), 'font-weight="700" letter-spacing="2"');
    return { g, box: { x, y, w, h } };
  }
  const lcd = a.f === 'qwerty' ? ['#0b1a2a', '#3a6aa8'] : ['#a8c48a', '#7f9a62'];
  g += rr(x + 14, y + 40, w - 28, a.f === 'qwerty' ? 110 : 90, 6, '#222') + rr(x + 20, y + 46, w - 40, a.f === 'qwerty' ? 98 : 78, 3, ctx.lin([[0, lcd[0]], [1, lcd[1]]]));
  g += tx(200, y + 80, a.f === 'qwerty' ? '10:24' : ctx.m.brand.toUpperCase(), 13, a.f === 'qwerty' ? '#fff' : '#1f2a12', 'font-family="monospace"');
  if (a.f === 'qwerty') { for (let r2 = 0; r2 < 4; r2++) for (let k = 0; k < 8; k++) g += rr(x + 12 + k * 12.5, y + 190 + r2 * 22, 10, 16, 3, '#dfe3ea'); }
  else {
    g += el(200, y + 160, 34, 14, shade(c, -0.3)) + rr(200 - 18, y + 156, 36, 8, 4, '#cfd3d8');
    for (let r2 = 0; r2 < 4; r2++) for (let k = 0; k < 3; k++) g += rr(x + 18 + k * 30, y + 190 + r2 * 28, 24, 18, 8, '#e8eaee', `stroke="${shade(c, -0.3)}"`);
  }
  return { g, box: { x, y, w, h } };
}

function electronics(ctx) {
  const { a, c, view } = ctx;
  let g = '';
  const fill = ctx.lin([[0, shade(c, 0.3)], [1, shade(c, -0.2)]], 0, 0, 1, 1);
  switch (a.t) {
    case 'laptop': {
      if (view === 'back') { g += rr(70, 80, 260, 175, 14, fill) + (a.logo === 'pear' ? pearLogo(200, 172, 26, shade(c, lum(c) > 0.5 ? -0.15 : 0.2)) : tx(200, 172, a.txt || '', 16, shade(c, -0.3), 'font-weight="700" letter-spacing="3"')); return { g, box: { x: 70, y: 80, w: 260, h: 175 } }; }
      g += rr(80, 70, 240, 160, 12, '#0d0e10') + screenWall(ctx, 90, 80, 220, 140, 4) + tx(200, 160, '9:41', 30, '#fff', 'font-weight="300"');
      g += pa('M60 236 L340 236 L360 268 Q360 274 352 274 L48 274 Q40 274 40 268Z', fill) + rr(80, 238, 240, 2, 1, '#000', 'opacity=".2"') + rr(170, 262, 60, 8, 3, shade(c, -0.12));
      for (let r2 = 0; r2 < 3; r2++) g += rr(90 + r2 * 4, 244 + r2 * 5, 220 - r2 * 8, 3, 1, shade(c, -0.18), 'opacity=".5"');
      return { g, box: { x: 80, y: 70, w: 240, h: 160 } };
    }
    case 'tablet': g += rr(60, 85, 280, 200, 18, fill) + rr(68, 93, 264, 184, 12, '#050505') + screenWall(ctx, 72, 97, 256, 176, 9) + tx(200, 180, '9:41', 40, '#fff', 'font-weight="300"'); if (view === 'back') g = rr(60, 85, 280, 200, 18, fill) + lens(ctx, 90, 112, 8) + (a.logo === 'pear' ? pearLogo(200, 190, 22, shade(c, -0.15)) : ''); return { g, box: { x: 60, y: 85, w: 280, h: 200 } };
    case 'camera': {
      const body = a.style === 'rangefinder' && ctx.it.color === 'silver' ? '#d8dadf' : '#1d1e21';
      g += rr(90, 140, 220, 130, 16, body) + rr(90, 200, 220, 70, 0, '#2a2b2e', 'opacity=".6"');
      if (a.style === 'dslr' || a.style === 'mirrorless') g += pa('M170 140 L190 108 L250 108 L265 140Z', body) + rr(95, 150, 40, 110, 14, '#141516');
      if (a.style === 'rangefinder') g += rr(115, 152, 34, 22, 4, '#3a4a5a') + rr(250, 150, 44, 18, 4, '#3a4a5a');
      g += rr(270, 124, 22, 16, 4, '#2a2a2a') + rr(240, 128, 18, 12, 4, '#2a2a2a');
      g += ci(210, 205, 58, '#111') + ci(210, 205, 50, '#2a2a2e') + lens(ctx, 210, 205, 34) + tx(230, 128, a.txt || '', 11, '#bbb', 'font-weight="700"');
      if (a.style === 'action') g = rr(130, 130, 140, 120, 18, '#1d1e21') + lens(ctx, 170, 190, 26) + rr(220, 150, 36, 30, 4, '#0b2a3a') + tx(200, 240, 'GoPra', 12, '#888');
      return { g, box: { x: 90, y: 110, w: 220, h: 160 } };
    }
    case 'drone': {
      const arm = ctx.lin([[0, '#9a9da3'], [1, '#4a4d53']]);
      g += ln(110, 110, 290, 290, arm, 16) + ln(290, 110, 110, 290, arm, 16);
      for (const [px, py] of [[110, 110], [290, 110], [110, 290], [290, 290]]) g += ci(px, py, 46, '#cfd3d8', 'opacity=".25"') + ci(px, py, 12, '#2a2a2e') + el(px, py, 46, 6, '#3a3b40', `transform="rotate(${ctx.rng.int(0, 180)} ${px} ${py})" opacity=".8"`);
      g += rr(160, 150, 80, 100, 26, ctx.lin([[0, '#c9ccd1'], [1, '#7a7d83']])) + lens(ctx, 200, 165, 9);
      return { g, box: { x: 70, y: 70, w: 260, h: 260 } };
    }
    case 'gpu': {
      g += rr(40, 140, 320, 120, 10, ctx.lin([[0, '#3a3c42'], [1, '#141518']])) + rr(40, 252, 320, 10, 2, '#c9a227');
      const n = a.fans || 3; const step = 300 / n;
      for (let i = 0; i < n; i++) { const fx = 50 + step * (i + 0.5); g += ci(fx, 200, Math.min(46, step / 2 - 4), '#0b0b0c'); for (let k = 0; k < 9; k++) g += el(fx, 200 - 22, 6, 20, '#2a2b30', `transform="rotate(${k * 40} ${fx} 200)"`); g += ci(fx, 200, 10, '#3a3b40'); }
      g += tx(320, 158, a.txt || '', 10, '#9adf4a', 'font-weight="800"');
      return { g, box: { x: 40, y: 140, w: 320, h: 120 } };
    }
    case 'vr': g += rr(90, 150, 220, 110, 50, ctx.lin([[0, '#f0f0f0'], [1, '#b9bcc2']])) + rr(105, 165, 190, 80, 40, a.pear ? '#111' : '#d8dadf') + rr(60, 190, 40, 24, 12, '#888') + rr(300, 190, 40, 24, 12, '#888'); return { g, box: { x: 90, y: 150, w: 220, h: 110 } };
    case 'monitor': g += rr(50, 70, 300, 190, 12, a.pear ? fill : '#e6e8ec') + rr(58, 78, 284, 160, 4, '#000') + screenWall(ctx, 60, 80, 280, 156, 2) + pa('M175 260 L225 260 L235 320 L165 320Z', a.pear ? shade(c, -0.1) : '#c9ccd1') + rr(140, 318, 120, 10, 5, a.pear ? shade(c, -0.15) : '#b9bcc2'); if (a.pear) g += rr(50, 238, 300, 22, 0, fill); return { g, box: { x: 50, y: 70, w: 300, h: 190 } };
    case 'box': g += rr(110, 170, 180, 110, 20, ctx.lin([[0, '#f0f1f3'], [1, '#b9bcc2']])) + rr(110, 260, 180, 20, 0, '#a9acb2', 'opacity=".4"') + ci(150, 250, 3, '#222') + rr(230, 246, 30, 6, 3, '#222'); return { g, box: { x: 110, y: 170, w: 180, h: 110 } };
    case 'keyboard': {
      g += rr(40, 140, 320, 130, 12, fill);
      for (let r2 = 0; r2 < 5; r2++) for (let k = 0; k < 14; k++) g += rr(50 + k * 21.5, 150 + r2 * 22, 18, 18, 3, a.synth ? (k % 3 === 0 ? '#ff7a00' : '#e8e8e8') : shade(c, -0.25));
      return { g, box: { x: 40, y: 140, w: 320, h: 130 } };
    }
    default: g += rr(100, 120, 200, 160, 14, fill); return { g, box: { x: 100, y: 120, w: 200, h: 160 } };
  }
}

function consoles(ctx) {
  const { a, c } = ctx;
  let g = '';
  const dark = ctx.lin([[0, '#3a3b40'], [1, '#0b0b0c']], 0, 0, 1, 1);
  const light = ctx.lin([[0, '#ffffff'], [1, '#c9ccd1']], 0, 0, 1, 1);
  const col = ctx.lin([[0, shade(c, 0.25)], [1, shade(c, -0.25)]], 0, 0, 1, 1);
  const pad = (x, y, color = '#1d1e21') => rr(x, y, 90, 50, 25, color) + ci(x + 22, y + 22, 7, '#444') + ci(x + 66, y + 18, 4, '#c8102e') + ci(x + 74, y + 26, 4, '#2a5bd7') + ci(x + 58, y + 26, 4, '#2fa36b') + ci(x + 66, y + 34, 4, '#f2c218');
  switch (a.t) {
    case 'ps5': g += pa('M150 60 Q 120 200 140 340 L170 340 Q 160 200 182 60Z', ctx.it.color === 'grey' ? '#bfc3ca' : light) + rr(178, 70, 46, 270, 14, '#121316') + pa('M250 60 Q 280 200 260 340 L230 340 Q 240 200 218 60Z', ctx.it.color === 'grey' ? '#bfc3ca' : light) + rr(196, 110, 8, 40, 3, '#4da3ff', 'opacity=".7"'); return { g, box: { x: 120, y: 60, w: 160, h: 280 } };
    case 'ps4': g += pa('M60 180 L330 180 L350 230 L80 230Z', dark) + pa('M80 230 L350 230 L340 262 L72 262Z', '#1a1b1e') + rr(190, 186, 4, 40, 1, '#4da3ff', 'opacity=".8"'); return { g, box: { x: 60, y: 180, w: 290, h: 82 } };
    case 'ps1': g += rr(80, 150, 240, 120, 10, '#bfc1c4') + ci(170, 205, 48, '#a9acb0') + ci(170, 205, 44, '#b5b8bc') + ci(270, 200, 8, '#888') + ci(270, 230, 8, '#888') + rr(90, 250, 220, 8, 2, '#999'); return { g, box: { x: 80, y: 150, w: 240, h: 120 } };
    case 'ps2': case 'ps2s': g += rr(70, 160, 260, a.t === 'ps2s' ? 60 : 100, 6, dark); for (let i = 0; i < 6; i++) g += rr(80, 170 + i * 12, 240, 2, 1, '#2a2b2e'); g += rr(290, 168, 30, 8, 2, '#2a5bd7', 'opacity=".7"'); return { g, box: { x: 70, y: 160, w: 260, h: 100 } };
    case 'ps3': g += pa('M60 220 Q 60 160 200 150 Q 340 160 340 220 L340 260 L60 260Z', dark) + rr(80, 245, 240, 4, 2, '#555'); return { g, box: { x: 60, y: 150, w: 280, h: 110 } };
    case 'xbox': g += rr(80, 150, 240, 120, 14, dark) + ci(200, 210, 26, '#2fa36b') + ci(200, 210, 18, '#111') + tx(200, 216, 'Y', 18, '#2fa36b', 'font-weight="800"'); return { g, box: { x: 80, y: 150, w: 240, h: 120 } };
    case 'x360': g += pa('M110 120 Q 100 200 110 300 L290 300 Q 300 200 290 120Z', ctx.it.color === 'black' ? dark : light) + ci(200, 150, 14, '#cfd3d8') + ci(200, 150, 8, '#2fa36b'); return { g, box: { x: 100, y: 120, w: 200, h: 180 } };
    case 'xone': case 'xss': g += rr(90, 160, 220, 110, 10, light) + ci(260, 215, 30, '#111') + rr(110, 180, 60, 6, 3, '#ccc'); return { g, box: { x: 90, y: 160, w: 220, h: 110 } };
    case 'xsx': g += rr(130, 70, 140, 270, 10, dark) + ci(200, 82, 46, '#0a0a0a') + ci(200, 82, 38, '#1a6a2a', 'opacity=".5"'); for (let i = 0; i < 40; i++) g += ci(170 + (i % 8) * 8.5, 64 + Math.floor(i / 8) * 8, 2, '#000'); return { g, box: { x: 130, y: 70, w: 140, h: 270 } };
    case 'switch': case 'switchlite': {
      const lite = a.t === 'switchlite';
      const L2 = lite ? col : ctx.it.color === 'grey' ? '#555' : '#ff4554', R2 = lite ? col : ctx.it.color === 'grey' ? '#555' : '#00b4e6';
      g += rr(40, 140, 60, 140, 26, L2) + rr(300, 140, 60, 140, 26, R2) + rr(96, 140, 208, 140, 6, '#1d1e21') + rr(104, 148, 192, 124, 3, '#000') + screenWall(ctx, 106, 150, 188, 120, 2);
      g += ci(70, 180, 11, '#222') + ci(330, 230, 11, '#222') + ci(70, 240, 6, '#222') + ci(330, 170, 5, '#222') + ci(318, 182, 5, '#222') + ci(342, 182, 5, '#222') + ci(330, 194, 5, '#222');
      return { g, box: { x: 40, y: 140, w: 320, h: 140 } };
    }
    case 'gb': case 'gbc': case 'gba': {
      const gb = a.t === 'gb';
      const fill = gb ? '#c9c6bf' : col;
      g += rr(120, 60, 160, 280, gb ? 18 : 30, fill) + rr(138, 80, 124, 108, 10, '#4a4c5a') + rr(158, 94, 84, 76, 2, gb ? '#9bbc0f' : ctx.lin([[0, '#9fd3ff'], [1, '#3a6aa8']]));
      g += rr(150, 230, 40, 12, 2, '#222') + rr(164, 216, 12, 40, 2, '#222') + ci(240, 240, 12, '#8a1a4a') + ci(262, 226, 12, '#8a1a4a') + rr(180, 290, 18, 6, 3, '#777', 'transform="rotate(-25 189 293)"') + rr(205, 290, 18, 6, 3, '#777', 'transform="rotate(-25 214 293)"');
      if (gb) g += tx(200, 205, 'Nintendu GAME BOI', 9, '#2a2a7a', 'font-style="italic" font-weight="700"');
      return { g, box: { x: 120, y: 60, w: 160, h: 280 } };
    }
    case 'nes': case 'dendy': g += rr(70, 170, 260, 90, 6, a.t === 'dendy' ? dark : '#cfccc4') + rr(70, 220, 260, 40, 4, a.t === 'dendy' ? '#2a2a2a' : '#4a4a4a') + rr(120, 180, 160, 24, 3, '#2a2a2a') + rr(90, 236, 20, 10, 2, '#c8102e') + rr(120, 236, 20, 10, 2, '#c8102e') + pad(250, 285, a.t === 'dendy' ? '#2a2a2a' : '#cfccc4'); return { g, box: { x: 70, y: 170, w: 260, h: 90 } };
    case 'snes': g += rr(80, 160, 240, 100, 30, '#cfccc4') + rr(130, 170, 140, 30, 6, '#b9b6ae') + rr(100, 230, 30, 12, 6, '#7a6aa8') + rr(270, 230, 30, 12, 6, '#7a6aa8'); return { g, box: { x: 80, y: 160, w: 240, h: 100 } };
    case 'n64': g += pa('M80 230 Q 90 160 200 150 Q 310 160 320 230 L320 260 L80 260Z', col) + rr(160, 156, 80, 22, 4, '#2a2a2a') + ci(200, 240, 8, '#c8102e'); return { g, box: { x: 80, y: 150, w: 240, h: 110 } };
    case 'cube': g += rr(110, 120, 180, 170, 18, col) + ci(200, 170, 30, shade(c, -0.25)) + rr(110, 260, 180, 30, 0, shade(c, -0.2)) + rr(260, 270, 18, 8, 3, '#222'); return { g, box: { x: 110, y: 120, w: 180, h: 170 } };
    case 'mega': g += rr(80, 170, 240, 80, 20, dark) + ci(200, 200, 34, '#0b0b0c') + ci(200, 200, 26, '#1a1a1a') + tx(200, 240, '16‑BIT', 10, '#c8102e', 'font-weight="800"'); return { g, box: { x: 80, y: 170, w: 240, h: 80 } };
    case 'dream': g += rr(90, 160, 220, 110, 16, light) + ci(200, 210, 30, '#e8e8e8') + pa('M188 210 a12 12 0 1 1 24 0', 'none', 'stroke="#f26522" stroke-width="5"'); return { g, box: { x: 90, y: 160, w: 220, h: 110 } };
    case 'atari': g += rr(70, 170, 260, 90, 6, '#1a1a1a') + rr(70, 210, 260, 50, 0, ctx.pat(12, 12, rr(0, 0, 12, 12, 0, '#6b4428') + rr(0, 0, 3, 12, 0, '#5a3820'))) + ci(110, 190, 6, '#888') + ci(140, 190, 6, '#888'); return { g, box: { x: 70, y: 170, w: 260, h: 90 } };
    case 'deck': g += rr(30, 150, 340, 120, 50, ctx.it.color === 'white' ? light : dark) + rr(110, 160, 180, 100, 6, '#000') + screenWall(ctx, 114, 164, 172, 92, 3) + ci(70, 190, 14, '#2a2a2a') + ci(330, 190, 14, '#2a2a2a') + ci(70, 235, 10, '#2a2a2a') + ci(330, 235, 10, '#2a2a2a'); return { g, box: { x: 30, y: 150, w: 340, h: 120 } };
    case 'psp': g += rr(40, 160, 320, 110, 50, col) + rr(110, 168, 180, 94, 6, '#000') + screenWall(ctx, 114, 172, 172, 86, 3) + ci(76, 200, 12, '#222') + ci(326, 200, 6, '#222') + ci(314, 212, 6, '#222') + ci(338, 212, 6, '#222') + ci(326, 224, 6, '#222'); return { g, box: { x: 40, y: 160, w: 320, h: 110 } };
    case 'ds': g += rr(110, 50, 180, 140, 16, col) + rr(126, 64, 148, 112, 4, '#000') + screenWall(ctx, 130, 68, 140, 104, 2) + rr(110, 196, 180, 150, 16, col) + rr(140, 210, 120, 92, 4, '#111') + rr(144, 214, 112, 84, 2, '#9fd3ff'); return { g, box: { x: 110, y: 50, w: 180, h: 296 } };
    case 'wii': g += rr(160, 70, 70, 260, 10, light) + rr(170, 90, 50, 6, 3, '#4da3ff', 'opacity=".6"') + rr(250, 120, 34, 150, 14, light) + ci(267, 150, 7, '#ddd'); return { g, box: { x: 160, y: 70, w: 130, h: 260 } };
    default: g += rr(100, 150, 200, 110, 14, col); return { g, box: { x: 100, y: 150, w: 200, h: 110 } };
  }
}

function accessories(ctx) {
  const { a, c } = ctx;
  let g = '';
  const col = ctx.lin([[0, shade(c, 0.3)], [1, shade(c, -0.25)]], 0, 0, 1, 1);
  switch (a.t) {
    case 'headphones': g += pa('M110 230 Q 110 80 200 80 Q 290 80 290 230', 'none', `stroke="${shade(c, -0.15)}" stroke-width="20" stroke-linecap="round"`) + rr(80, 200, 70, 110, 30, col) + rr(250, 200, 70, 110, 30, col) + rr(95, 215, 40, 80, 20, shade(c, -0.35), 'opacity=".5"') + rr(265, 215, 40, 80, 20, shade(c, -0.35), 'opacity=".5"'); return { g, box: { x: 80, y: 80, w: 240, h: 230 } };
    case 'buds': g += rr(140, 150, 120, 110, 40, ctx.lin([[0, '#ffffff'], [1, '#d8dbe0']])) + rr(140, 190, 120, 2, 1, '#bbb') + ci(200, 230, 4, '#2fa36b') + el(110, 270, 16, 22, '#f4f4f4') + rr(104, 285, 12, 40, 6, '#f4f4f4') + el(290, 270, 16, 22, '#f4f4f4') + rr(284, 285, 12, 40, 6, '#f4f4f4'); return { g, box: { x: 100, y: 150, w: 200, h: 175 } };
    case 'glasses': case 'aviator': {
      const fr = a.t === 'aviator' ? metal(ctx, ctx.it.color === 'gold' ? 'gold' : 'silver') : col;
      const lensF = ctx.lin([[0, '#3a4a5a'], [1, '#0b0f14']]);
      if (a.t === 'aviator') g += pa('M95 170 Q 90 245 140 250 Q 185 250 188 185 Q 180 165 140 165Z', lensF, `stroke="${fr}" stroke-width="5"`) + pa('M305 170 Q 310 245 260 250 Q 215 250 212 185 Q 220 165 260 165Z', lensF, `stroke="${fr}" stroke-width="5"`) + ln(188, 178, 212, 178, fr, 4);
      else g += rr(80, 170, 110, 75, 16, lensF, `stroke="${fr}" stroke-width="12"`) + rr(210, 170, 110, 75, 16, lensF, `stroke="${fr}" stroke-width="12"`) + ln(190, 185, 210, 185, fr, 10);
      g += ln(60, 180, 30, 190, fr, 8) + ln(340, 180, 370, 190, fr, 8) + pa('M100 185 L150 175', 'none', 'stroke="#fff" stroke-width="4" opacity=".25"');
      return { g, box: { x: 80, y: 165, w: 240, h: 85 } };
    }
    case 'wallet': g += rr(100, 140, 200, 140, 14, col) + rr(100, 205, 200, 2, 0, shade(c, -0.3)) + rr(110, 150, 180, 120, 10, 'none', `stroke="${shade(c, 0.3)}" stroke-dasharray="4 3"`) + tx(200, 185, ctx.m.brand.split(' ')[0].toUpperCase(), 11, shade(c, 0.35), 'font-weight="700" letter-spacing="2"'); return { g, box: { x: 100, y: 140, w: 200, h: 140 } };
    case 'belt': g += pa('M40 230 Q 200 300 360 230', 'none', `stroke="${shade(c, -0.05)}" stroke-width="30"`) + pa('M40 230 Q 200 300 360 230', 'none', `stroke="${shade(c, 0.25)}" stroke-width="1" stroke-dasharray="3 3"`) + rr(160, 210, 80, 70, 8, metal(ctx, 'gold')) + tx(200, 262, ctx.m.brand === 'Hermez' ? 'H' : ctx.m.brand === 'Gucchi' ? 'GG' : 'G', 40, '#9b7420', 'font-weight="900"'); return { g, box: { x: 40, y: 200, w: 320, h: 90 } };
    case 'cap': g += pa('M100 230 Q 100 110 210 110 Q 310 110 310 230Z', col) + pa('M90 225 Q 30 235 40 260 Q 120 265 200 240Z', shade(c, -0.15)) + ci(210, 112, 7, shade(c, -0.2)) + (ctx.m.brand === 'Supremo' ? rr(160, 160, 100, 30, 2, '#c8102e') + tx(210, 182, 'Supremo', 17, '#fff', 'font-style="italic" font-weight="800"') : tx(210, 185, 'NY', 40, '#fff', 'font-weight="800"')); return { g, box: { x: 40, y: 110, w: 270, h: 150 } };
    case 'speaker': g += rr(90, 160, 220, 100, 50, col) + rr(105, 175, 190, 70, 35, ctx.pat(6, 6, ci(3, 3, 1.2, shade(c, -0.4)))) + ci(90, 210, 30, shade(c, -0.3)) + ci(310, 210, 30, shade(c, -0.3)) + tx(200, 216, 'JBK', 18, '#fff', 'font-weight="900"'); return { g, box: { x: 60, y: 160, w: 280, h: 100 } };
    case 'speaker2': g += rr(110, 140, 180, 120, 10, col) + rr(118, 148, 164, 104, 6, ctx.pat(5, 5, ci(2.5, 2.5, 1, '#000'))) + tx(200, 200, 'Marshell', 20, '#f2ead8', 'font-style="italic" font-family="Georgia"'); return { g, box: { x: 110, y: 140, w: 180, h: 120 } };
    case 'cup': g += pa('M150 120 L250 120 L240 330 Q 200 345 160 330Z', col) + rr(145, 100, 110, 26, 8, shade(c, -0.15)) + rr(205, 50, 10, 60, 4, shade(c, -0.25), 'transform="rotate(10 210 80)"') + pa('M250 150 Q 300 150 300 200 Q 300 250 245 250', 'none', `stroke="${shade(c, -0.1)}" stroke-width="16"`) + tx(200, 240, 'STANLI', 14, '#fff', 'opacity=".8" font-weight="800"'); return { g, box: { x: 145, y: 100, w: 160, h: 245 } };
    case 'brick': g += pa('M90 190 L280 160 L330 190 L140 222Z', '#e04a3a') + pa('M90 190 L140 222 L140 272 L90 240Z', '#a5281a') + pa('M140 222 L330 190 L330 240 L140 272Z', '#c8102e') + tx(235, 240, 'Supremo', 26, '#fff', 'font-style="italic" font-weight="900" transform="skewY(-9)"'); return { g, box: { x: 90, y: 160, w: 240, h: 112 } };
    case 'tracker': g += ci(150, 200, 44, '#f6f6f6') + ci(150, 200, 30, '#e8e8e8') + ci(250, 220, 44, '#f6f6f6') + ci(250, 220, 30, '#e8e8e8') + pearLogo(250, 228, 12, '#cfcfcf'); return { g, box: { x: 106, y: 156, w: 188, h: 108 } };
    case 'pencil': g += rr(60, 190, 280, 18, 9, '#f6f6f6', 'transform="rotate(-20 200 199)"') + pa('M330 145 L360 135 L338 157Z', '#cfcfcf'); return { g, box: { x: 60, y: 130, w: 300, h: 140 } };
    case 'powerbank': g += rr(130, 110, 140, 200, 20, col) + rr(150, 280, 100, 8, 4, '#4da3ff', 'opacity=".7"'); return { g, box: { x: 130, y: 110, w: 140, h: 200 } };
    case 'action': g += rr(160, 150, 80, 140, 20, '#1d1e21') + lens(ctx, 200, 190, 18) + rr(150, 270, 100, 40, 10, '#2a2b2e'); return { g, box: { x: 150, y: 150, w: 100, h: 160 } };
    case 'keyfob': g += rr(160, 160, 80, 120, 20, '#1d1e21') + ci(200, 195, 12, '#444') + ci(200, 235, 12, '#444') + ci(200, 140, 18, 'none', 'stroke="#aaa" stroke-width="5"'); return { g, box: { x: 160, y: 122, w: 80, h: 158 } };
    default: g += rr(120, 140, 160, 120, 20, col); return { g, box: { x: 120, y: 140, w: 160, h: 120 } };
  }
}

// ---------------------------------------------------------------- sneakers
function sneakers(ctx) {
  const { a, view } = ctx;
  const [up, acc, sole, ex] = a.c || ['#fff', '#c00', '#fff', '#111'];
  let g = '';
  if (view === 'back') {
    // outsole view
    g += pa('M70 200 Q 70 130 160 120 L300 130 Q 350 140 350 200 Q 350 260 300 270 L160 280 Q 70 270 70 200Z', a.t === 'court' && sole === '#b7814a' ? '#b7814a' : shade(sole, -0.15));
    for (let i = 0; i < 12; i++) g += pa(`M${95 + i * 20} 150 Q ${100 + i * 20} 200 ${95 + i * 20} 255`, 'none', `stroke="${shade(sole, -0.35)}" stroke-width="5" opacity=".7"`);
    g += ci(270, 200, 30, 'none', `stroke="${shade(sole, -0.4)}" stroke-width="4"`);
    return { g, box: { x: 70, y: 120, w: 280, h: 160 } };
  }
  const t = a.t;
  const high = t === 'high' || t === 'canvas' || t === 'boot' || t === 'cartoon';
  const mid = t === 'mid';
  const collarY = high ? 95 : mid ? 125 : 160;
  const soleH = t === 'chunky' ? 52 : t === 'runner' || t === 'knit' ? 38 : t === 'slide' || t === 'clog' ? 30 : 28;
  const soleTop = 300 - soleH;
  const fillUp = ctx.lin([[0, shade(up, 0.15)], [1, shade(up, -0.12)]], 0, 0, 0, 1);
  if (t === 'slide') {
    g += rr(50, soleTop, 300, soleH, 15, ctx.lin([[0, shade(sole, 0.1)], [1, shade(sole, -0.2)]])) + pa(`M110 ${soleTop} Q 160 ${soleTop - 80} 260 ${soleTop - 60} L 280 ${soleTop}Z`, fillUp);
    return { g, box: { x: 50, y: soleTop - 80, w: 300, h: soleH + 80 } };
  }
  if (t === 'clog') {
    g += pa(`M60 ${soleTop} Q 50 180 150 170 L 290 170 Q 350 175 350 ${soleTop}Z`, fillUp) + rr(55, soleTop, 300, soleH, 12, shade(up, -0.2));
    for (let i = 0; i < 6; i++) g += ci(110 + i * 22, 200, 6, shade(up, -0.4));
    return { g, box: { x: 55, y: 170, w: 300, h: 160 } };
  }
  if (t === 'cartoon') {
    g += pa(`M50 ${soleTop} Q 30 160 120 150 L 200 150 Q 210 70 260 60 L 330 60 Q 350 160 350 ${soleTop}Z`, fillUp) + rr(40, soleTop, 320, soleH + 8, 20, '#1c1c1c');
    return { g, box: { x: 40, y: 60, w: 320, h: 250 } };
  }
  // upper outline
  const up1 = `M48 ${soleTop + 2} C 40 ${soleTop - 30}, 62 ${soleTop - 52}, 105 ${soleTop - 60} L ${high ? 175 : 180} ${soleTop - 78} C ${high ? 200 : 205} ${high ? 120 : 175}, ${high ? 210 : 220} ${collarY + 10}, ${high ? 225 : 245} ${collarY} L ${high ? 300 : 305} ${collarY - 2} C ${high ? 322 : 328} ${collarY}, 342 ${collarY + 30}, 348 ${Math.min(soleTop - 40, collarY + 60)} C 352 ${soleTop - 30}, 352 ${soleTop - 6}, 350 ${soleTop + 2}Z`;
  g += pa(up1, fillUp);
  const clipU = ctx.clip(pa(up1, '#000'));
  let panels = '';
  // toe cap / mudguard
  panels += pa(`M30 ${soleTop + 2} C 34 ${soleTop - 40}, 80 ${soleTop - 64}, 140 ${soleTop - 58} L 130 ${soleTop + 4}Z`, acc, 'opacity=".95"');
  // heel counter
  panels += pa(`M290 ${soleTop + 2} C 295 ${soleTop - 60}, 315 ${collarY + 20}, 352 ${collarY + 10} L 360 ${soleTop + 4}Z`, acc);
  // eyestay
  if (t !== 'knit') panels += pa(`M150 ${soleTop - 64} C 175 ${soleTop - 90}, ${high ? 195 : 205} ${collarY + 40}, ${high ? 222 : 240} ${collarY + 2} L ${high ? 238 : 256} ${collarY + 6} C ${high ? 215 : 225} ${collarY + 45}, 195 ${soleTop - 75}, 170 ${soleTop - 48}Z`, acc, 'opacity=".9"');
  if (high) panels += pa(`M225 ${collarY} L 300 ${collarY - 2} L 305 ${collarY + 40} C 280 ${collarY + 40}, 250 ${collarY + 46}, 232 ${collarY + 52}Z`, acc);
  if (a.logo === 'jumpman') panels += pa(`M30 ${soleTop + 2} C 40 ${soleTop - 40}, 120 ${soleTop - 55}, 360 ${soleTop - 40} L 360 ${soleTop + 4}Z`, ex, 'opacity=".95"');
  if (t === 'canvas') panels += rr(30, soleTop - 22, 70, 30, 10, '#f2ead8');
  // material: mesh for runners/knits, suede/leather grain for the rest
  const r2 = new RNG((ctx.it.seed || 1) + 991);
  let grain = '';
  if (t === 'runner' || t === 'knit') grain = rr(20, 40, 360, 300, 0, ctx.pat(7, 7, ci(3.5, 3.5, 1.5, '#000', 'opacity=".22"') + ci(0, 0, 0.8, '#fff', 'opacity=".25"')));
  else {
    let dots = '';
    for (let i = 0; i < 36; i++) dots += ci(r2.float(0, 26), r2.float(0, 26), r2.float(0.4, 1.1), r2.chance(0.5) ? '#000' : '#fff', `opacity="${r2.float(0.05, 0.16).toFixed(2)}"`);
    grain = rr(20, 40, 360, 300, 0, ctx.pat(26, 26, dots));
  }
  panels += grain;
  // stitching along the panels
  const stitch = (d) => pa(d, 'none', `stroke="${lum(acc) > 0.6 ? '#000' : '#fff'}" stroke-opacity=".38" stroke-width="1.1" stroke-dasharray="4 3"`);
  panels += stitch(`M36 ${soleTop - 8} C 40 ${soleTop - 44}, 86 ${soleTop - 66}, 136 ${soleTop - 60}`);
  panels += stitch(`M296 ${soleTop - 4} C 300 ${soleTop - 58}, 318 ${collarY + 28}, 350 ${collarY + 18}`);
  if (t !== 'knit') panels += stitch(`M156 ${soleTop - 60} C 180 ${soleTop - 86}, ${high ? 198 : 208} ${collarY + 44}, ${high ? 226 : 244} ${collarY + 8}`);
  // ambient occlusion above the sole and a soft key light on the toe/top
  panels += rr(20, soleTop - 16, 360, 18, 0, ctx.lin([[0, '#000', 0], [1, '#000', 0.28]], 0, 0, 0, 1));
  panels += el(150, soleTop - 70, 110, 34, ctx.rad([[0, '#fff', 0.18], [1, '#fff', 0]]));
  g += `<g clip-path="${clipU}">${panels}</g>`;
  // collar opening with padded lining, tongue and heel tab
  const cx0 = high ? 225 : 245, cx1 = high ? 300 : 305;
  g += el((cx0 + cx1) / 2, collarY + 3, (cx1 - cx0) / 2 + 2, 8, shade(up, -0.55)) + el((cx0 + cx1) / 2, collarY + 1, (cx1 - cx0) / 2 - 4, 4, shade(up, -0.75));
  if (t !== 'knit' && t !== 'slide') g += pa(`M${cx0 - 6} ${collarY + 6} Q ${cx0 + 2} ${collarY - 22} ${cx0 + 26} ${collarY - 18} L ${cx0 + 30} ${collarY + 6}Z`, shade(up, -0.06), `stroke="${shade(up, -0.3)}" stroke-width="1"`) + rr(cx0 + 4, collarY - 14, 18, 9, 2, ex === up ? acc : ex, 'opacity=".9"');
  g += rr(342, collarY + 8, 10, 30, 4, shade(acc, -0.1), `stroke="${shade(acc, -0.35)}" stroke-width=".8"`);
  // logo
  const lx = 150, ly = soleTop - 30;
  switch (a.logo) {
    case 'swoosh': g += pa(`M${lx + 140} ${ly - 46} C ${lx + 80} ${ly - 18}, ${lx + 20} ${ly + 6}, ${lx - 20} ${ly + 4} C ${lx - 40} ${ly + 2}, ${lx - 36} ${ly - 12}, ${lx - 22} ${ly - 20} C ${lx - 28} ${ly - 8}, ${lx - 10} ${ly - 4}, ${lx + 20} ${ly - 12}Z`, a.c[1] === up ? ex : t === 'high' || a.c[1] !== up ? (a.c[1] === acc ? ex : acc) : ex); break;
    case 'swoosh2': g += pa(`M${lx + 120} ${ly - 30} C ${lx + 70} ${ly - 10}, ${lx + 10} ${ly + 4}, ${lx - 10} ${ly + 2} C ${lx - 24} ${ly}, ${lx - 18} ${ly - 10}, ${lx - 8} ${ly - 14}Z`, ex); break;
    case 'stripes': for (let i = 0; i < 3; i++) g += pa(`M${lx + 20 + i * 22} ${soleTop - 6} L ${lx + 50 + i * 22} ${soleTop - 78} L ${lx + 62 + i * 22} ${soleTop - 78} L ${lx + 32 + i * 22} ${soleTop - 6}Z`, acc === up ? ex : acc); break;
    case 'stripe1': g += rr(110, soleTop - 46, 210, 14, 7, acc, 'transform="rotate(-6 200 200)"') + tx(220, soleTop - 37, 'SPLYY‑350', 9, '#fff', 'opacity=".7" transform="rotate(-6 200 200)"'); break;
    case 'n': g += tx(lx + 60, ly + 4, 'N', 64, acc === up ? ex : acc, 'font-weight="900" font-style="italic"'); break;
    case 'formstrip': g += pa(`M${lx - 10} ${soleTop - 8} C ${lx + 40} ${soleTop - 30}, ${lx + 80} ${soleTop - 70}, ${lx + 140} ${soleTop - 70} L ${lx + 140} ${soleTop - 54} C ${lx + 90} ${soleTop - 50}, ${lx + 50} ${soleTop - 20}, ${lx + 10} ${soleTop - 6}Z`, acc === up ? ex : acc); break;
    case 'jazz': g += pa(`M${lx - 30} ${soleTop - 10} C ${lx + 20} ${soleTop - 40}, ${lx + 60} ${soleTop - 10}, ${lx + 100} ${soleTop - 50} C ${lx + 120} ${soleTop - 70}, ${lx + 150} ${soleTop - 64}, ${lx + 160} ${soleTop - 52}`, 'none', `stroke="${acc === up ? '#fff' : acc}" stroke-width="10"`); break;
    case 'star': g += ci(300, collarY + 50, 18, '#fff') + tx(300, collarY + 57, '★', 20, '#1e3f9a'); break;
    case 'tiger': g += pa(`M${lx} ${soleTop - 12} L ${lx + 60} ${soleTop - 70} L ${lx + 74} ${soleTop - 70} L ${lx + 18} ${soleTop - 12}Z M${lx + 40} ${soleTop - 12} L ${lx + 110} ${soleTop - 60} L ${lx + 122} ${soleTop - 56} L ${lx + 58} ${soleTop - 12}Z`, acc === up ? ex : acc); break;
    case 'wing': g += pa(`M${lx + 120} ${collarY + 50} l40 -6 l-6 34Z`, ex, 'opacity=".8"'); break;
    case 'cage': for (let i = 0; i < 5; i++) g += ln(lx + i * 22, soleTop - 10, lx + 30 + i * 18, soleTop - 70, shade(up, -0.25), 6); break;
    case 'gooze': g += tx(lx + 70, ly, '★', 46, '#c0c0c0'); break;
    default: break;
  }
  // laces
  if (t !== 'knit') {
    const lace = ex === up ? '#e8e8e8' : ex;
    const n = high ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const px = 176 + i * (high ? 7 : 11), py = soleTop - 74 - i * (high ? 22 : 12);
      // eyelets, then a crossed lace with a highlight so it reads as a round cord
      g += ci(px - 5, py + 3, 2.4, shade(acc, -0.5)) + ci(px + 15, py - 7, 2.4, shade(acc, -0.5));
      g += ln(px - 5, py + 3, px + 15, py - 7, shade(lace, -0.35), 4.6) + ln(px - 5, py + 3, px + 15, py - 7, lace, 3.2) + ln(px - 3, py + 1.5, px + 12, py - 6, '#fff', 0.9, 'opacity=".45"');
      if (i < n - 1) { const qx = 176 + (i + 1) * (high ? 7 : 11), qy = soleTop - 74 - (i + 1) * (high ? 22 : 12); g += ln(px + 15, py - 7, qx - 5, qy + 3, shade(lace, -0.45), 3.4, 'opacity=".75"'); }
    }
    // loose lace ends
    const lx2 = 176 + (n - 1) * (high ? 7 : 11), ly2 = soleTop - 74 - (n - 1) * (high ? 22 : 12);
    g += pa(`M${lx2 + 15} ${ly2 - 7} q 18 10 6 34`, 'none', `stroke="${lace}" stroke-width="3" stroke-linecap="round"`) + pa(`M${lx2 + 15} ${ly2 - 7} q 26 2 26 28`, 'none', `stroke="${shade(lace, -0.15)}" stroke-width="3" stroke-linecap="round"`);
  }
  // midsole + outsole
  const soleFill = ctx.lin([[0, shade(sole, 0.1)], [1, shade(sole, -0.12)]], 0, 0, 0, 1);
  g += pa(`M40 ${soleTop} L 356 ${soleTop - 2} Q 364 ${soleTop + soleH / 2} 354 ${300} L 50 ${300} Q 34 ${300} 36 ${soleTop + soleH * 0.5}Z`, soleFill);
  if (t === 'runner' || t === 'chunky') g += pa(`M60 ${soleTop + soleH * 0.55} C 120 ${soleTop + soleH * 0.3}, 200 ${soleTop + soleH * 0.8}, 340 ${soleTop + soleH * 0.4}`, 'none', `stroke="${shade(sole, -0.2)}" stroke-width="2"`);
  if (a.air) g += rr(250, soleTop + 6, 70, soleH - 14, 6, '#cfe8ff', 'opacity=".8"') + rr(254, soleTop + 9, 62, 4, 2, '#fff', 'opacity=".6"');
  // cupsole stitching, sidewall texture and tread edge
  if (['court', 'high', 'canvas', 'skate', 'mid'].includes(t)) g += pa(`M48 ${soleTop + soleH * 0.42} L 350 ${soleTop + soleH * 0.4}`, 'none', `stroke="${shade(sole, -0.3)}" stroke-width="1.2" stroke-dasharray="3 3" opacity=".8"`);
  g += rr(40, soleTop + 1, 316, 3, 1.5, '#fff', 'opacity=".25"');
  let tread = '';
  for (let x = 50; x < 350; x += 9) tread += rr(x, 296, 4, 7, 1, shade(sole, -0.5), 'opacity=".5"');
  g += rr(42, 296, 314, 7, 3, a.t === 'court' && sole === '#b7814a' ? '#8a5a2a' : shade(sole, -0.35)) + tread;
  return { g, box: { x: 40, y: collarY - 10, w: 320, h: 310 - collarY } };
}

// ---------------------------------------------------------------- clothing
function clothing(ctx) {
  const { a, c, view } = ctx;
  const t = a.t;
  const fill = ctx.lin([[0, shade(c, 0.12)], [1, shade(c, -0.12)]], 0, 0, 1, 1);
  const dark = shade(c, -0.22);
  let path, box = { x: 60, y: 70, w: 280, h: 280 };
  const sleeves = (long) => long ? 'L 40 250 L 20 235 L 70 120' : 'L 72 175 L 40 150 L 85 100';
  switch (t) {
    case 'tee': case 'polo': path = 'M140 70 Q 200 95 260 70 L 315 100 L 360 150 L 328 175 L 300 155 L 300 340 L 100 340 L 100 155 L 72 175 L 40 150 L 85 100Z'; break;
    case 'pants': case 'jeans': path = 'M120 70 L 280 70 L 300 340 L 220 340 L 200 150 L 180 340 L 100 340Z'; box = { x: 100, y: 70, w: 200, h: 270 }; break;
    case 'beanie': path = 'M110 260 Q 100 110 200 100 Q 300 110 290 260Z'; box = { x: 100, y: 100, w: 200, h: 200 }; break;
    case 'coat': case 'parka': path = 'M140 60 Q 200 80 260 60 L 320 90 L 365 260 L 335 275 L 305 150 L 310 360 L 90 360 L 95 150 L 65 275 L 35 260 L 80 90Z'; box = { x: 60, y: 60, w: 280, h: 300 }; break;
    default: path = 'M140 70 Q 200 92 260 70 L 320 100 L 365 250 L 335 265 L 300 160 L 300 330 L 100 330 L 100 160 L 65 265 L 35 250 L 80 100Z';
  }
  let g = pa(path, fill);
  const clipC = ctx.clip(pa(path, '#000'));
  let inner = '';
  if (t === 'puffer' || t === 'parka') for (let i = 0; i < 9; i++) inner += pa(`M30 ${110 + i * 28} Q 200 ${120 + i * 28} 370 ${110 + i * 28}`, 'none', `stroke="${dark}" stroke-width="2.5" opacity=".7"`);
  if (t === 'fleece') inner += rr(0, 0, 400, 400, 0, ctx.pat(7, 7, ci(3.5, 3.5, 1.4, shade(c, -0.1))));
  if (t === 'knit') inner += rr(0, 0, 400, 400, 0, ctx.pat(10, 10, pa('M0 10 L5 0 L10 10', 'none', `stroke="${shade(c, -0.12)}" stroke-width="1"`)));
  if (t === 'jeans') inner += rr(0, 0, 400, 400, 0, ctx.pat(6, 6, ln(0, 6, 6, 0, shade(c, 0.12), 1))) + ln(200, 75, 200, 150, shade(c, -0.3), 2) + pa('M130 90 q 20 30 50 10', 'none', `stroke="#c9a227" stroke-width="2"`);
  if (view === 'front' && (t === 'jacket' || t === 'puffer' || t === 'parka' || t === 'track' || t === 'coat' || (t === 'hoodie' && /Zip/.test(ctx.m.name)))) inner += ln(200, 85, 200, 335, shade(c, -0.35), 3) + rr(196, 85, 8, 250, 1, '#c0c0c0', 'opacity=".5"');
  if (t === 'hoodie' && view === 'front') inner += pa('M140 250 L 260 250 L 275 320 L 125 320Z', shade(c, -0.08)) + ln(185, 95, 180, 160, '#eee', 3) + ln(215, 95, 220, 160, '#eee', 3);
  if (t === 'track' || a.print === 'stripes') { inner += ln(70, 110, 30, 245, '#fff', 4) + ln(80, 115, 42, 250, '#fff', 4) + ln(330, 110, 370, 245, '#fff', 4) + ln(320, 115, 358, 250, '#fff', 4); }
  if (t === 'coat') inner += rr(90, 230, 220, 14, 0, shade(c, -0.15)) + pa('M140 60 L 200 160 L 260 60', 'none', `stroke="${dark}" stroke-width="3"`);
  if (t === 'polo') inner += pa('M170 78 L 200 120 L 230 78', '#f6f6f6') + ln(200, 120, 200, 160, dark, 2);
  if (t === 'beanie') inner += rr(100, 215, 200, 50, 6, shade(c, -0.1)) + rr(0, 0, 400, 215, 0, ctx.pat(8, 8, ln(4, 0, 4, 8, shade(c, -0.08), 2)));
  g += `<g clip-path="${clipC}">${inner}</g>`;
  if (t === 'hoodie' && view === 'front') g += pa('M140 70 Q 145 30 200 28 Q 255 30 260 70 Q 200 100 140 70Z', shade(c, -0.05));
  if (t === 'parka' && view === 'front') g += pa('M130 70 Q 130 20 200 18 Q 270 20 270 70', 'none', 'stroke="#d8c8a8" stroke-width="16" stroke-linecap="round"');
  if (view === 'front') g += printOf(ctx, a.print, a.txt);
  else g += rr(185, 85, 30, 18, 2, '#f4f4f4') + tx(200, 97, (ctx.it.size || 'M'), 9, '#222', 'font-weight="700"');
  return { g, box, clip: pa(path, '#000') };
}
function printOf(ctx, p, txt) {
  const fg = lum(ctx.c) > 0.55 ? '#1c1c1c' : '#ffffff';
  switch (p) {
    case 'box': return rr(135, 145, 130, 40, 2, '#d1191f') + tx(200, 173, txt || 'Supremo', 24, '#fff', 'font-style="italic" font-weight="800"');
    case 'script': return tx(200, 175, txt || '', 30, fg, 'font-style="italic" font-family="Georgia,serif"');
    case 'text': case 'logo': return tx(200, 170, txt || '', txt && txt.length > 8 ? 16 : 22, fg, 'font-weight="800" letter-spacing="2"');
    case 'badge': return ci(80, 150, 16, '#f4f4f4') + ci(80, 150, 12, '#2a5a2a') + tx(80, 155, '✦', 14, '#f2c218');
    case 'arrows': return [0, 45, 90, 135].map((r) => ln(200, 200, 200 + 50 * Math.cos(r * Math.PI / 180), 200 + 50 * Math.sin(r * Math.PI / 180), fg, 6)).join('') + ci(200, 200, 6, fg);
    case 'diag': return Array.from({ length: 6 }, (_, i) => ln(140 + i * 14, 300, 170 + i * 14, 250, fg, 6)).join('');
    case 'half': return pa('M150 170 A 22 22 0 0 1 194 170Z', fg) + tx(220, 168, txt || '', 10, fg, 'font-weight="800"');
    case 'disc': return ci(320, 150, 14, '#1e3f9a') + ci(320, 150, 10, '#f4f4f4');
    case 'web': return rr(185, 85, 30, 250, 0, '#2f7a4a') + rr(193, 85, 14, 250, 0, '#c8102e');
    case 'triangle': return pa('M220 140 L 250 140 L 235 160Z', '#1c1c1c') + pa('M224 143 L 246 143 L 235 157Z', '#c0c0c0');
    case 'patch': return rr(140, 140, 50, 34, 4, '#e8a21a') + tx(165, 163, txt || '', 14, '#1c1c1c', 'font-weight="900"');
    case 'ball': return ci(200, 200, 40, '#111') + ci(200, 195, 18, '#fff') + tx(200, 203, '8', 22, '#111', 'font-weight="900"');
    case 'shark': return pa('M150 60 L 250 60 L 240 90 L 160 90Z', '#1c1c1c') + Array.from({ length: 8 }, (_, i) => pa(`M${162 + i * 10} 90 l5 -10 l5 10Z`, '#fff')).join('');
    case 'camo': return Array.from({ length: 14 }, (_, i) => el(110 + (i * 37) % 180, 130 + ((i * 53) % 180), 20, 12, i % 2 ? shade(ctx.c, -0.25) : shade(ctx.c, 0.2), 'opacity=".8"')).join('');
    case 'bear': return ci(200, 190, 30, '#6b4428') + ci(180, 162, 10, '#6b4428') + ci(220, 162, 10, '#6b4428') + rr(180, 220, 40, 50, 10, '#1f2b4a');
    case 'horse': return tx(140, 150, '♞', 22, '#c8102e');
    case 'swoosh': return pa('M240 150 C 220 160 160 175 150 168 C 145 164 150 158 156 155 C 150 165 175 160 240 150Z', fg);
    case 'bird': return pa('M150 150 l 10 -18 l 6 10 l 8 -14 l 4 22Z', fg);
    case 'check': return rr(0, 0, 0, 0, 0, '#000');
    case 'alcatraz': return tx(200, 175, 'KORTEZ', 20, fg, 'font-weight="900" letter-spacing="2"') + pa('M185 190 l15 -10 l15 10 v20 h-30z', fg);
    case 'cross': return pa('M190 140 h20 v30 h30 v20 h-30 v60 h-20 v-60 h-30 v-20 h30z', '#c0c0c0');
    case 'paint': return Array.from({ length: 10 }, (_, i) => ci(120 + (i * 41) % 160, 120 + ((i * 67) % 200), 3 + (i % 4) * 2, ['#f2c218', '#c8102e', '#2a5bd7', '#fff'][i % 4])).join('');
    default: return '';
  }
}

// ---------------------------------------------------------------- bags
function bagPattern(ctx, pat, c) {
  const lt = shade(c, 0.25), dk = shade(c, -0.25);
  switch (pat) {
    case 'mono': return ctx.pat(36, 36, rr(0, 0, 36, 36, 0, c) + tx(9, 14, '✿', 10, '#d8b56a') + tx(27, 32, '◆', 8, '#d8b56a') + tx(27, 14, 'LV', 7, '#d8b56a', 'font-weight="700" opacity=".0"') + ci(27, 12, 4, 'none', 'stroke="#d8b56a" stroke-width="1"') + tx(9, 32, '✦', 9, '#d8b56a'));
    case 'damier': return ctx.pat(20, 20, rr(0, 0, 20, 20, 0, c) + rr(0, 0, 10, 10, 0, lt) + rr(10, 10, 10, 10, 0, lt));
    case 'quilt': case 'quiltV': return ctx.pat(22, 22, rr(0, 0, 22, 22, 0, c) + ln(0, 0, 22, 22, dk, 1.2) + ln(22, 0, 0, 22, dk, 1.2));
    case 'gg': return ctx.pat(26, 22, rr(0, 0, 26, 22, 0, '#c9b58a') + ci(9, 11, 5, 'none', 'stroke="#5a4a32" stroke-width="2"') + ci(17, 11, 5, 'none', 'stroke="#5a4a32" stroke-width="2"'));
    case 'oblique': return ctx.pat(40, 20, rr(0, 0, 40, 20, 0, c) + tx(20, 14, 'Diorr', 9, lt, 'font-style="italic" transform="rotate(-15 20 10)"'));
    case 'cannage': return ctx.pat(24, 24, rr(0, 0, 24, 24, 0, c) + ln(0, 12, 12, 0, dk, 1) + ln(12, 0, 24, 12, dk, 1) + ln(24, 12, 12, 24, dk, 1) + ln(12, 24, 0, 12, dk, 1) + ci(12, 12, 1.5, '#c9a227'));
    case 'chevron': return ctx.pat(12, 10, rr(0, 0, 12, 10, 0, c) + pa('M1 7 L3 3 L5 7', 'none', `stroke="${lt}" stroke-width="1.6"`) + pa('M7 7 L9 3 L11 7', 'none', `stroke="${lt}" stroke-width="1.6"`));
    case 'weave': return ctx.pat(16, 16, rr(0, 0, 16, 16, 0, c) + rr(0, 0, 8, 7, 1, lt, 'opacity=".55"') + rr(8, 8, 8, 7, 1, lt, 'opacity=".55"'));
    case 'saffiano': return ctx.pat(4, 4, rr(0, 0, 4, 4, 0, c) + ln(0, 4, 4, 0, lt, 0.6));
    case 'ff': return ctx.pat(22, 22, rr(0, 0, 22, 22, 0, '#6b4428') + tx(11, 15, 'ꟻF', 9, '#2a1a10', 'font-weight="800"'));
    case 'mk': return ctx.pat(24, 18, rr(0, 0, 24, 18, 0, c) + tx(12, 12, 'MK', 7, lt, 'font-weight="700"'));
    case 'perfH': return ctx.pat(16, 16, rr(0, 0, 16, 16, 0, c) + tx(8, 12, 'H', 8, dk, 'font-weight="700" opacity=".7"'));
    case 'net': return ctx.pat(14, 14, pa('M0 7 L7 0 L14 7 L7 14Z', 'none', `stroke="${c}" stroke-width="2"`));
    default: return ctx.lin([[0, lt], [1, dk]], 0, 0, 1, 1);
  }
}
function bags(ctx) {
  const { a, c, view } = ctx;
  const t = a.t;
  const hw = a.hw === 'silver' ? metal(ctx, 'silver') : metal(ctx, 'gold');
  const fill = bagPattern(ctx, a.pat, c);
  const trim = shade(c, -0.25);
  let g = '', body, box;
  const handle = (x1, x2, top) => pa(`M${x1} 175 Q ${x1} ${top} ${(x1 + x2) / 2} ${top} Q ${x2} ${top} ${x2} 175`, 'none', `stroke="${trim}" stroke-width="10" stroke-linecap="round"`);
  switch (t) {
    case 'birkin': case 'kelly': case 'flapH':
      body = 'M90 180 L 310 180 L 335 330 L 65 330Z';
      g += t === 'birkin' ? handle(145, 185, 110) + handle(215, 255, 110) : t === 'kelly' ? handle(165, 235, 110) : '';
      g += pa(body, fill) + pa('M86 180 L 314 180 L 300 240 L 100 240Z', shade(c, 0.05)) + ln(100, 240, 300, 240, trim, 2);
      g += rr(180, 228, 40, 30, 4, hw) + rr(192, 236, 16, 12, 3, shade('#c9a227', -0.4));
      if (t === 'birkin') g += rr(110, 230, 50, 10, 4, trim) + rr(240, 230, 50, 10, 4, trim);
      if (t === 'flapH') g += tx(200, 254, 'H', 26, '#9b7420', 'font-weight="900"');
      box = { x: 65, y: 180, w: 270, h: 150 }; break;
    case 'flapC': case 'flap': case 'pochette': case 'baguette':
      body = t === 'baguette' ? 'M70 200 L 330 200 L 330 290 L 70 290Z' : 'M90 170 L 310 170 L 310 320 L 90 320Z';
      if (t === 'flapC') g += pa('M100 172 Q 200 30 300 172', 'none', `stroke="${a.hw === 'silver' ? '#cfd3d8' : '#d4af37'}" stroke-width="5" stroke-dasharray="6 3"`);
      else g += pa('M110 172 Q 200 60 290 172', 'none', `stroke="${trim}" stroke-width="7"`);
      g += pa(body, fill) + pa(t === 'baguette' ? 'M70 200 L 330 200 L 330 250 L 70 250Z' : 'M90 170 L 310 170 L 310 250 Q 200 262 90 250Z', shade(c, 0.04), 'opacity=".55"');
      if (t === 'flapC') g += ci(190, 252, 10, 'none', `stroke="${a.hw === 'silver' ? '#e6e8ec' : '#e2b84a'}" stroke-width="4"`) + ci(210, 252, 10, 'none', `stroke="${a.hw === 'silver' ? '#e6e8ec' : '#e2b84a'}" stroke-width="4"`);
      else g += rr(185, 240, 30, 20, 4, hw);
      box = t === 'baguette' ? { x: 70, y: 200, w: 260, h: 90 } : { x: 90, y: 170, w: 220, h: 150 }; break;
    case 'tote':
      body = 'M80 170 L 320 170 L 300 330 L 100 330Z';
      g += handle(125, 175, 70) + handle(225, 275, 70) + pa(body, fill) + rr(80, 168, 240, 8, 2, trim);
      box = { x: 80, y: 170, w: 240, h: 160 }; break;
    case 'speedy': case 'duffle':
      body = 'M70 230 Q 70 160 140 150 L 260 150 Q 330 160 330 230 L 330 320 L 70 320Z';
      g += handle(140, 185, 100) + handle(215, 260, 100) + pa(body, fill) + ln(90, 165, 310, 165, '#d4af37', 3) + rr(180, 250, 40, 22, 4, hw);
      box = { x: 70, y: 150, w: 260, h: 170 }; break;
    case 'alma': case 'lady':
      body = t === 'alma' ? 'M90 320 L 90 220 Q 200 110 310 220 L 310 320Z' : 'M95 180 L 305 180 L 315 320 L 85 320Z';
      g += handle(150, 250, 100) + pa(body, fill) + rr(185, 250, 30, 20, 4, hw);
      if (t === 'lady') g += ci(260, 210, 8, hw) + tx(260, 240, 'D·I·O', 9, '#d4af37');
      box = { x: 85, y: 160, w: 230, h: 160 }; break;
    case 'saddle':
      body = 'M110 180 Q 330 130 320 250 Q 300 340 160 320 Q 80 300 110 180Z';
      g += pa('M140 180 Q 200 80 290 160', 'none', `stroke="${trim}" stroke-width="12"`) + pa(body, fill) + tx(250, 260, 'D', 34, '#d4af37', 'font-weight="900"');
      box = { x: 90, y: 150, w: 230, h: 170 }; break;
    case 'backpack':
      body = 'M110 130 Q 110 90 200 90 Q 290 90 290 130 L 300 330 L 100 330Z';
      g += pa(body, fill) + pa('M130 200 L 270 200 L 265 300 L 135 300Z', shade(c, -0.06)) + ln(140, 200, 260, 200, '#d4af37', 3) + pa('M170 90 Q 200 50 230 90', 'none', `stroke="${trim}" stroke-width="8"`);
      box = { x: 100, y: 90, w: 200, h: 240 }; break;
    case 'hobo': case 'puzzle': case 'bucket': case 'mini': case 'clutch': case 'net':
      body = t === 'hobo' ? 'M80 200 Q 200 340 320 200 Q 300 160 200 165 Q 100 160 80 200Z' : t === 'bucket' ? 'M110 160 L 290 160 L 280 320 L 120 320Z' : t === 'mini' ? 'M150 220 L 250 220 L 250 300 L 150 300Z' : t === 'clutch' ? 'M70 230 Q 200 170 330 230 Q 340 300 200 310 Q 60 300 70 230Z' : t === 'net' ? 'M110 160 Q 80 330 200 330 Q 320 330 290 160Z' : 'M100 180 L 300 160 L 320 320 L 90 320Z';
      if (t === 'hobo') g += pa('M100 195 Q 200 60 300 195', 'none', `stroke="${trim}" stroke-width="10"`);
      if (t === 'mini') g += handle(170, 230, 170);
      if (t === 'bucket' || t === 'net') g += handle(150, 250, 90);
      g += pa(body, t === 'net' ? 'none' : fill, t === 'net' ? `stroke="${c}" stroke-width="3"` : '');
      if (t === 'net') g += pa(body, fill, 'opacity=".9"');
      if (t === 'puzzle') g += pa('M100 180 L 200 240 L 320 160 M200 240 L 210 320', 'none', `stroke="${trim}" stroke-width="3"`);
      box = { x: 80, y: 160, w: 240, h: 170 }; break;
    default:
      body = 'M90 170 L 310 170 L 310 320 L 90 320Z'; g += pa(body, fill); box = { x: 90, y: 170, w: 220, h: 150 };
  }
  if (view === 'back') g += rr(160, 280, 80, 22, 3, '#f2ead8', 'opacity=".95"') + tx(200, 295, ctx.m.brand.toUpperCase().slice(0, 12), 8, '#333', 'font-weight="700"');
  g += pa(body, ctx.lin([[0, '#fff', 0.16], [0.5, '#fff', 0], [1, '#000', 0.2]], 0, 0, 1, 1));
  return { g, box, clip: pa(body, '#000') };
}

// ---------------------------------------------------------------- watches
function watches(ctx) {
  const { a, view, it } = ctx;
  const cx = 200, cy = 200;
  let g = '';
  const met = metal(ctx, a.metal === 'two' ? 'steel' : a.metal);
  const strapCol = a.strap === 'leather' ? shade(colorHex(it.color) === '#888888' ? '#5a3a22' : '#5a3a22', 0) : a.strap === 'rubber' || a.strap === 'resin' ? (a.case || '#1c1c1c') : a.strap === 'nato' ? '#3a4a2a' : null;
  // strap / bracelet
  const sw = a.t === 'tank' || a.t === 'square' ? 70 : 84;
  if (strapCol) g += rr(cx - sw / 2, 0, sw, 400, 16, strapCol) + (a.strap === 'nato' ? rr(cx - 6, 0, 12, 400, 0, '#c8102e', 'opacity=".6"') : '') + (a.strap === 'leather' ? rr(cx - sw / 2 + 6, 0, sw - 12, 400, 10, 'none', 'stroke="#d8c8a8" stroke-width="1" stroke-dasharray="4 4" opacity=".6"') : '');
  else {
    const linkC = a.metal === 'two' ? metal(ctx, 'gold') : met;
    for (let y = -10; y < 410; y += 26) { if (y > 110 && y < 290) continue; g += rr(cx - sw / 2, y, sw * 0.3, 24, 5, met) + rr(cx - sw * 0.2, y, sw * 0.4, 24, 5, a.strap === 'jubilee' ? linkC : met) + rr(cx + sw * 0.2, y, sw * 0.3, 24, 5, met); if (a.strap === 'jubilee' || a.strap === 'president') g += rr(cx - sw * 0.06, y + 3, sw * 0.12, 18, 3, linkC); }
    if (a.strap === 'mesh') g += rr(cx - sw / 2, 0, sw, 400, 6, ctx.pat(4, 4, rr(0, 0, 4, 4, 0, '#cfd3d8') + ln(0, 4, 4, 0, '#8a9099', 0.6)));
  }
  if (view === 'back') {
    g += ci(cx, cy, 98, met) + ci(cx, cy, 80, shade('#c9ccd1', -0.05)) + ci(cx, cy, 60, 'none', 'stroke="#9aa1aa" stroke-width="2"');
    g += tx(cx, cy - 20, ctx.m.brand.toUpperCase(), 13, '#6a6f78', 'font-weight="700" letter-spacing="2"') + tx(cx, cy + 6, 'SWISS MADE', 9, '#6a6f78') + tx(cx, cy + 28, `№ ${String(it.seed % 9000000 + 1000000)}`, 10, '#6a6f78', 'font-family="monospace"');
    return { g, box: { x: cx - 98, y: cy - 98, w: 196, h: 196 } };
  }
  // case
  const R = a.t === 'octagon' ? 96 : 92;
  if (a.t === 'square' || a.t === 'tank' || a.t === 'digital' || a.t === 'smart' || a.t === 'cushion') {
    const w = a.t === 'tank' ? 120 : a.t === 'digital' ? 150 : a.t === 'smart' ? 150 : 170, h = a.t === 'tank' ? 160 : a.t === 'digital' ? 140 : a.t === 'smart' ? 180 : 170;
    const rad = a.t === 'cushion' ? 46 : a.t === 'smart' ? 40 : 18;
    g += rr(cx - w / 2 - 8, cy - h / 2 - 8, w + 16, h + 16, rad + 6, a.case || met) + rr(cx - w / 2, cy - h / 2, w, h, rad, a.t === 'digital' ? '#2a2b2e' : a.dial);
    g += rr(cx + w / 2 + 6, cy - 12, 12, 24, 4, a.case || met);
    if (a.t === 'digital') { g += rr(cx - 55, cy - 30, 110, 60, 4, a.dial) + tx(cx, cy + 14, '12:45', 36, '#1f2a12', 'font-family="monospace" font-weight="700"') + tx(cx, cy - 46, ctx.m.brand.toUpperCase(), 11, '#ddd', 'font-weight="700"'); return { g, box: { x: cx - w / 2, y: cy - h / 2, w, h } }; }
    if (a.t === 'smart') { g += ci(cx, cy - 20, 34, 'none', 'stroke="#ff3b30" stroke-width="8"') + ci(cx, cy - 20, 22, 'none', 'stroke="#4cd964" stroke-width="8"') + tx(cx, cy + 50, '10:09', 30, '#fff', 'font-weight="600"'); if (a.bezel === 'ultra') g += rr(cx - w / 2 - 10, cy - h / 2 - 10, w + 20, h + 20, 46, 'none', 'stroke="#ff7a00" stroke-width="3"'); return { g, box: { x: cx - w / 2, y: cy - h / 2, w, h } }; }
  } else if (a.t === 'octagon') {
    const pts = Array.from({ length: 8 }, (_, i) => { const an = (i / 8) * Math.PI * 2 + Math.PI / 8; return `${S(cx + Math.cos(an) * R)},${S(cy + Math.sin(an) * R)}`; }).join(' ');
    g += `<polygon points="${pts}" fill="${a.case || met}"/>` + ci(cx, cy, R - 18, a.dial) + rr(cx + R - 4, cy - 12, 14, 24, 4, met);
    if (a.bezel === 'screws') for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2 + Math.PI / 8; g += ci(cx + Math.cos(an) * (R - 8), cy + Math.sin(an) * (R - 8), 4, '#e6e8ec', 'stroke="#888"'); }
    g += rr(0, 0, 400, 400, 0, ctx.pat(8, 8, rr(0, 0, 8, 8, 0, 'none') + rr(1, 1, 6, 6, 1, '#000', 'opacity=".12"')), `clip-path="${ctx.clip(ci(cx, cy, R - 18, '#000'))}"`);
  } else {
    g += ci(cx, cy, R + 4, a.case || met) + rr(cx + R, cy - 13, 16, 26, 4, met);
    if (a.crownGuard) g += pa(`M${cx + R} ${cy - 20} Q ${cx + R + 22} ${cy} ${cx + R} ${cy + 20}`, met);
    // bezel
    if (a.bezel === 'dive' || a.bezel === 'gmt' || a.bezel === 'tachy') {
      const bz = a.bzl || '#121316';
      if (a.bezel === 'gmt') { g += pa(`M${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}Z`, a.left ? a.bzl2 : bz) + pa(`M${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}Z`, a.left ? bz : a.bzl2); }
      else g += ci(cx, cy, R, bz);
      for (let i = 0; i < 60; i++) { const an = (i / 60) * Math.PI * 2 - Math.PI / 2; const r1 = R - 4, r2 = R - (i % 5 === 0 ? 14 : 8); g += ln(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1, cx + Math.cos(an) * r2, cy + Math.sin(an) * r2, '#e8e8e8', i % 5 === 0 ? 2 : 1, 'opacity=".85"'); }
      if (a.bezel === 'dive') g += pa(`M${cx} ${cy - R + 4} l-7 11 h14z`, '#e8e8e8');
      g += ci(cx, cy, R - 16, metal(ctx, 'steel'));
    } else if (a.bezel === 'fluted') { g += ci(cx, cy, R, metal(ctx, a.metal === 'gold' ? 'gold' : a.metal === 'two' ? 'gold' : 'steel')); for (let i = 0; i < 48; i++) { const an = (i / 48) * Math.PI * 2; g += ln(cx + Math.cos(an) * (R - 2), cy + Math.sin(an) * (R - 2), cx + Math.cos(an) * (R - 13), cy + Math.sin(an) * (R - 13), '#fff', 1.4, 'opacity=".5"'); } }
    else if (a.bezel === 'slide') { g += ci(cx, cy, R, met); for (let i = 0; i < 60; i++) { const an = (i / 60) * Math.PI * 2; g += ln(cx + Math.cos(an) * (R - 2), cy + Math.sin(an) * (R - 2), cx + Math.cos(an) * (R - 8), cy + Math.sin(an) * (R - 8), '#333', 1); } }
    else if (a.bezel === 'screws') { g += ci(cx, cy, R, met); }
    g += ci(cx, cy, R - 18, a.dial);
    if (a.bezel === 'screws') for (let i = 0; i < 4; i++) { const an = (i / 4) * Math.PI * 2 + Math.PI / 4; g += ci(cx + Math.cos(an) * (R - 9), cy + Math.sin(an) * (R - 9), 4, '#e6e8ec'); }
  }
  // dial details
  const dr = a.t === 'tank' ? 55 : a.t === 'square' || a.t === 'cushion' ? 70 : R - 22;
  const ink = lum(a.dial) > 0.55 ? '#1c1c1c' : '#f4f4f4';
  if (a.waves) for (let i = 0; i < 6; i++) g += pa(`M${cx - dr} ${cy - dr + i * 30} q ${dr / 2} 10 ${dr} 0 t ${dr} 0`, 'none', `stroke="${shade(a.dial, 0.15)}" stroke-width="5" opacity=".5"`);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * Math.PI * 2 - Math.PI / 2;
    if (a.roman) g += tx(cx + Math.cos(an) * (dr - 14), cy + Math.sin(an) * (dr - 14) + 4, ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i], 9, ink, 'font-family="Georgia,serif"');
    else if (a.exp && [2, 4, 8].includes(i)) g += tx(cx + Math.cos(an) * (dr - 14), cy + Math.sin(an) * (dr - 14) + 5, String(i), 13, ink, 'font-weight="700"');
    else if (i === 0 && (a.bezel === 'dive' || a.bezel === 'gmt')) g += pa(`M${cx} ${cy - dr + 6} l-6 12 h12z`, ink);
    else g += ln(cx + Math.cos(an) * (dr - 4), cy + Math.sin(an) * (dr - 4), cx + Math.cos(an) * (dr - 14), cy + Math.sin(an) * (dr - 14), ink, i % 3 === 0 ? 4 : 3);
  }
  if (a.sub) for (const [dx, dy] of [[-30, 0], [30, 0], [0, 30]]) g += ci(cx + dx, cy + dy, 15, a.sub, `stroke="${ink}" stroke-width="1" opacity=".95"`) + ln(cx + dx, cy + dy, cx + dx + 7, cy + dy - 9, lum(a.sub) > 0.5 ? '#111' : '#fff', 1.5);
  if (a.date) g += rr(cx + dr * 0.48, cy - 8, 20, 16, 2, '#fff') + tx(cx + dr * 0.48 + 10, cy + 4, '10', 10, '#111', 'font-weight="700"');
  if (a.star) g += tx(cx, cy + 30, '★', 22, '#c8102e');
  g += tx(cx, cy - dr * 0.45, ctx.m.brand.toUpperCase(), Math.max(7, dr * 0.13), ink, 'font-weight="700" letter-spacing="1"');
  // hands at 10:10
  g += ln(cx, cy, cx - dr * 0.45, cy - dr * 0.28, ink, 6) + ln(cx, cy, cx + dr * 0.62, cy - dr * 0.42, ink, 4) + ln(cx, cy + 14, cx, cy - dr * 0.85, '#d63a2a', 1.5) + ci(cx, cy, 5, ink);
  // crystal glare
  g += pa(`M${cx - dr * 0.8} ${cy - dr * 0.2} A ${dr} ${dr} 0 0 1 ${cx + dr * 0.2} ${cy - dr * 0.85} L ${cx + dr * 0.3} ${cy - dr * 0.6} A ${dr * 0.8} ${dr * 0.8} 0 0 0 ${cx - dr * 0.55} ${cy}Z`, '#fff', 'opacity=".08"');
  return { g, box: { x: cx - R, y: cy - R, w: R * 2, h: R * 2 } };
}

// ---------------------------------------------------------------- jewelry
function jewelry(ctx) {
  const { a, it } = ctx;
  const m = metal(ctx, it.color);
  const mc = colorHex(it.color);
  const gem = a.gem || null;
  let g = '';
  switch (a.t) {
    case 'love': case 'cuff': case 'nail': case 'charm': case 'clovers': case 'cuban': case 'serpent': {
      g += el(200, 210, 130, 90, 'none', `stroke="${m}" stroke-width="${a.t === 'cuban' ? 28 : 22}"`) + el(200, 205, 130, 90, 'none', `stroke="#fff" stroke-width="3" opacity=".35"`);
      if (a.t === 'love') for (let i = 0; i < 10; i++) { const an = (i / 10) * Math.PI * 2; g += ci(200 + Math.cos(an) * 130, 210 + Math.sin(an) * 90, 6, shade(mc, -0.2)) + ln(196 + Math.cos(an) * 130, 210 + Math.sin(an) * 90, 204 + Math.cos(an) * 130, 210 + Math.sin(an) * 90, shade(mc, -0.45), 1.5); if (gem && i % 2) g += ci(200 + Math.cos(an + 0.3) * 130, 210 + Math.sin(an + 0.3) * 90, 4, gem); }
      if (a.t === 'nail') g += rr(300, 160, 50, 14, 4, m) + pa('M70 250 l-24 10 l20 6z', m);
      if (a.t === 'charm') for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; g += ci(200 + Math.cos(an) * 130, 222 + Math.sin(an) * 90, 10, ['#f2c218', '#c8102e', '#2a5bd7', '#e8e8e8'][i % 4]); }
      if (a.t === 'clovers') for (let i = 0; i < 5; i++) { const an = (i / 5) * Math.PI * 2; g += clover(200 + Math.cos(an) * 130, 210 + Math.sin(an) * 90, 16, m, gem); }
      if (a.t === 'cuban') for (let i = 0; i < 26; i++) { const an = (i / 26) * Math.PI * 2; g += el(200 + Math.cos(an) * 130, 210 + Math.sin(an) * 90, 14, 9, 'none', `stroke="${shade(mc, -0.35)}" stroke-width="2" transform="rotate(${an * 57.3} ${200 + Math.cos(an) * 130} ${210 + Math.sin(an) * 90})"`); }
      if (a.t === 'serpent') g += pa('M320 200 l26 -8 l-6 22z', m) + ci(330, 202, 3, '#1f9a5a');
      return { g, box: { x: 70, y: 120, w: 260, h: 180 } };
    }
    case 'ring': case 'band': case 'trinity': case 'signet': {
      if (a.t === 'trinity') { g += el(170, 220, 70, 55, 'none', `stroke="${metal(ctx, 'ygold')}" stroke-width="14"`) + el(230, 220, 70, 55, 'none', `stroke="${metal(ctx, 'rgold')}" stroke-width="14"`) + el(200, 200, 70, 55, 'none', `stroke="${metal(ctx, 'wgold')}" stroke-width="14"`); return { g, box: { x: 100, y: 145, w: 200, h: 130 } }; }
      g += el(200, 240, 90, 70, 'none', `stroke="${m}" stroke-width="${a.t === 'band' ? 22 : 16}"`) + el(200, 236, 90, 70, 'none', 'stroke="#fff" stroke-width="2" opacity=".35"');
      if (a.love) for (let i = 0; i < 6; i++) g += ci(120 + i * 32, 296 - Math.abs(i - 2.5) * 6, 4, shade(mc, -0.3));
      if (a.t === 'signet') g += rr(160, 150, 80, 40, 10, m) + tx(200, 177, '★', 20, shade(mc, -0.4));
      if (gem) { const s = a.big ? 34 : 24; g += pa(`M${200 - s * 0.6} 172 L 200 ${172 + s * 0.9} L ${200 + s * 0.6} 172Z`, m) + pa(`M${200 - s} 160 L ${200 - s * 0.5} ${160 - s * 0.6} L ${200 + s * 0.5} ${160 - s * 0.6} L ${200 + s} 160 L 200 ${160 + s}Z`, gem) + pa(`M${200 - s * 0.5} ${160 - s * 0.6} L 200 160 L ${200 + s * 0.5} ${160 - s * 0.6}`, 'none', 'stroke="#fff" stroke-width="1.5" opacity=".7"') + ci(200 - s * 0.3, 150, 3, '#fff', 'opacity=".9"'); }
      return { g, box: { x: 110, y: 120, w: 180, h: 200 } };
    }
    case 'clover': case 'heart': case 'pendant': case 'cross': case 'pearls': case 'chain': case 'earrings': {
      if (a.t !== 'earrings') g += pa('M60 60 Q 200 260 340 60', 'none', `stroke="${a.t === 'pearls' ? 'none' : m}" stroke-width="${a.t === 'chain' ? (a.thick || 2) * 3 : 3}" stroke-dasharray="${a.t === 'chain' ? '6 2' : '3 2'}"`);
      if (a.t === 'pearls') for (let i = 0; i <= 24; i++) { const tt = i / 24; const x = (1 - tt) * (1 - tt) * 60 + 2 * (1 - tt) * tt * 200 + tt * tt * 340; const y = (1 - tt) * (1 - tt) * 60 + 2 * (1 - tt) * tt * 260 + tt * tt * 60; g += ci(x, y, 9, ctx.rad([[0, '#ffffff'], [1, '#d8d0c0']], 0.35, 0.35, 0.7)); }
      if (a.t === 'clover') g += clover(200, 190, a.small ? 26 : 38, m, gem);
      if (a.t === 'heart') g += pa('M200 250 C 140 210 150 160 180 160 C 192 160 200 170 200 178 C 200 170 208 160 220 160 C 250 160 260 210 200 250Z', m) + tx(200, 210, 'RETURN', 7, shade(mc, -0.4), 'font-weight="700"');
      if (a.t === 'pendant') g += a.bean ? el(200, 200, 24, 14, m) : pa('M200 165 L 222 205 L 200 245 L 178 205Z', gem || m);
      if (a.t === 'cross') g += pa('M192 165 h16 v24 h20 v16 h-20 v40 h-16 v-40 h-20 v-16 h20z', m);
      if (a.t === 'earrings') g += ci(150, 200, 24, m) + ci(150, 200, 16, gem || '#eef7ff') + ci(250, 200, 24, m) + ci(250, 200, 16, gem || '#eef7ff');
      return { g, box: { x: 120, y: 150, w: 160, h: 110 } };
    }
    default: g += ci(200, 200, 60, m); return { g, box: { x: 140, y: 140, w: 120, h: 120 } };
  }
}
function clover(x, y, r, m, gem) {
  let g = '';
  for (let i = 0; i < 4; i++) { const an = (i / 4) * Math.PI * 2; g += ci(x + Math.cos(an) * r * 0.48, y + Math.sin(an) * r * 0.48, r * 0.55, m); }
  for (let i = 0; i < 4; i++) { const an = (i / 4) * Math.PI * 2; g += ci(x + Math.cos(an) * r * 0.48, y + Math.sin(an) * r * 0.48, r * 0.42, gem || '#fff'); }
  return g + ci(x, y, r * 0.18, m);
}

// ---------------------------------------------------------------- perfume
function perfume(ctx) {
  const { a, it } = ctx;
  const liquid = a.liquid || '#f1d27a';
  const fill = it.fill ?? 100;
  let g = '', body, box;
  switch (a.t) {
    case 'round': body = ci(200, 230, 90, '#000'); box = { x: 110, y: 140, w: 180, h: 180 }; break;
    case 'tall': body = rr(140, 110, 120, 230, 10, '#000'); box = { x: 140, y: 110, w: 120, h: 230 }; break;
    case 'amphora': body = pa('M175 130 L 225 130 Q 220 170 260 220 Q 290 300 200 335 Q 110 300 140 220 Q 180 170 175 130Z', '#000'); box = { x: 120, y: 130, w: 160, h: 205 }; break;
    case 'apothecary': case 'cyl': case 'lab': body = rr(140, 140, 120, 200, a.t === 'cyl' ? 20 : 6, '#000'); box = { x: 140, y: 140, w: 120, h: 200 }; break;
    case 'facet': body = pa('M130 170 L 270 170 L 285 260 L 250 335 L 150 335 L 115 260Z', '#000'); box = { x: 115, y: 170, w: 170, h: 165 }; break;
    case 'bar': body = pa('M120 180 L 280 180 L 300 320 L 100 320Z', '#000'); box = { x: 100, y: 180, w: 200, h: 140 }; break;
    case 'torso': body = pa('M160 130 L 240 130 Q 280 150 265 230 Q 250 300 240 335 L 160 335 Q 150 300 135 230 Q 120 150 160 130Z', '#000'); box = { x: 125, y: 130, w: 150, h: 205 }; break;
    case 'kremlin': body = pa('M150 200 L 250 200 L 250 340 L 150 340Z', '#000'); box = { x: 150, y: 200, w: 100, h: 140 }; break;
    case 'flask': body = pa('M170 140 L 230 140 L 235 180 Q 290 200 290 280 Q 290 340 200 340 Q 110 340 110 280 Q 110 200 165 180Z', '#000'); box = { x: 110, y: 140, w: 180, h: 200 }; break;
    case 'square': body = rr(125, 160, 150, 170, 12, '#000'); box = { x: 125, y: 160, w: 150, h: 170 }; break;
    case 'spray': body = rr(150, 170, 100, 170, 14, '#000'); box = { x: 150, y: 170, w: 100, h: 170 }; break;
    default: body = rr(130, 150, 140, 180, 8, '#000'); box = { x: 130, y: 150, w: 140, h: 180 };
  }
  const clip = ctx.clip(body);
  // glass
  g += `<g clip-path="${clip}">` + rr(0, 0, 400, 400, 0, ctx.lin([[0, '#ffffff', 0.55], [1, '#cfd8e0', 0.45]], 0, 0, 1, 1)) + rr(0, box.y + box.h * (1 - fill / 100), 400, 400, 0, ctx.lin([[0, shade(liquid, 0.15)], [1, shade(liquid, -0.2)]]), 'opacity=".85"') + rr(box.x + 8, box.y + 6, 10, box.h - 12, 5, '#fff', 'opacity=".45"') + '</g>';
  g += body.replace('fill="#000"', 'fill="none" stroke="#ffffff" stroke-opacity=".7" stroke-width="3"');
  // cap
  const capC = a.cap || '#1c1c1c';
  const topY = box.y;
  if (a.t === 'kremlin') g += pa('M170 200 L 200 110 L 230 200Z', capC) + ci(200, 108, 5, '#d4af37');
  else if (a.t === 'apothecary') g += rr(165, topY - 50, 70, 50, 4, capC) + Array.from({ length: 6 }, (_, i) => rr(165, topY - 46 + i * 8, 70, 2, 0, '#fff', 'opacity=".2"')).join('');
  else if (a.t === 'amphora') g += rr(170, topY - 40, 60, 40, 6, metal(ctx, 'gold')) + rr(178, topY - 4, 44, 12, 4, metal(ctx, 'gold'));
  else if (a.t === 'facet') g += pa(`M170 ${topY} L 230 ${topY} L 240 ${topY - 50} L 160 ${topY - 50}Z`, ctx.lin([[0, '#fff1b8'], [1, capC]]));
  else if (a.t === 'square' || a.t === 'rect' || a.t === 'tall') g += rr(160, topY - 44, 80, 44, 4, ctx.lin([[0, shade(capC, 0.2)], [1, shade(capC, -0.2)]]));
  else g += rr(175, topY - 40, 50, 40, 8, ctx.lin([[0, shade(capC, 0.2)], [1, shade(capC, -0.2)]]));
  if (it.defects.some((d) => d.c === 'p_cap')) g = g.replace(/<rect[^>]*y="(\d+(\.\d+)?)"[^>]*\/>$/, '');
  // label
  g += rr(box.x + box.w * 0.18, box.y + box.h * 0.38, box.w * 0.64, 40, 3, '#ffffff', 'opacity=".88"') + tx(200, box.y + box.h * 0.38 + 18, a.label || '', 12, '#111', 'font-weight="800" letter-spacing="1"') + tx(200, box.y + box.h * 0.38 + 32, ctx.m.brand.toUpperCase().slice(0, 18), 7, '#555', 'letter-spacing="1"');
  return { g, box, clip: body };
}

const DRAW = { phones: phone, electronics, consoles, accessories, sneakers, clothing, bags, watches, jewelry, perfume };

// ---------------------------------------------------------------- public
// Grit filter: follows the object's own silhouette (no rectangles). Inner bevel from the blurred alpha gives
// volume, fractal noise adds grain, low-frequency noise adds grime patches — the same worn look as the sprites.
function grit(ctx, box, lite) {
  const id = ctx.P + 'gf';
  const x = Math.max(0, box.x - 40), y = Math.max(0, box.y - 40);
  const w = Math.min(400 - x, box.w + 80), h = Math.min(400 - y, box.h + 80);
  const seed = ((ctx.it.seed || 1) % 997) + 1;
  // dirt follows condition: mint items get almost none, junk gets visible patches
  const wear = Math.max(0, Math.min(1, (100 - (ctx.it.cond ?? 80)) / 90)) * (ctx.it.cleaned ? 0.25 : 1);
  // gadgets get grey finger smudges and dust, shoes/clothes get brown dirt
  const smudge = ['phones', 'electronics', 'consoles', 'accessories'].includes(ctx.it.cat);
  const k = smudge ? 0.5 : 1;
  const ga = ((0.6 + 3.2 * wear) * k).toFixed(2), gb = (-(0.33 + 1.76 * wear) * k).toFixed(2);
  const gcol = smudge ? '0.55  0 0 0 0 0.55  0 0 0 0 0.56' : '0.16  0 0 0 0 0.11  0 0 0 0 0.06';
  const grime = lite || wear < 0.08 ? '' : `<feTurbulence type="fractalNoise" baseFrequency="${smudge ? 0.045 : 0.03}" numOctaves="3" seed="${seed}" result="gn"/><feColorMatrix in="gn" type="matrix" values="0 0 0 0 ${gcol}  ${ga} 0 0 0 ${gb}" result="gc"/><feComposite in="gc" in2="SourceAlpha" operator="in" result="grime"/>`;
  ctx.defs.push(`<filter id="${id}" filterUnits="userSpaceOnUse" x="${S(x)}" y="${S(y)}" width="${S(w)}" height="${S(h)}" color-interpolation-filters="sRGB">`
    + `<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b"/>`
    + `<feOffset in="b" dx="-6" dy="-8" result="bs"/><feComposite in="SourceAlpha" in2="bs" operator="out" result="rs"/>`
    + `<feOffset in="b" dx="5" dy="7" result="bh"/><feComposite in="SourceAlpha" in2="bh" operator="out" result="rh"/>`
    + `<feFlood flood-color="#000" flood-opacity="0.6"/><feComposite in2="rs" operator="in" result="shade"/>`
    + `<feFlood flood-color="#fff" flood-opacity="0.2"/><feComposite in2="rh" operator="in" result="hi"/>`
    + `<feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="1" seed="${seed}" result="n"/>`
    + `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 -0.44" result="nd"/><feComposite in="nd" in2="SourceAlpha" operator="in" result="gd"/>`
    + `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0.55 0 0 -0.33" result="nl"/><feComposite in="nl" in2="SourceAlpha" operator="in" result="gl"/>`
    + grime
    + `<feMerge><feMergeNode in="SourceGraphic"/>${grime ? '<feMergeNode in="grime"/>' : ''}<feMergeNode in="gd"/><feMergeNode in="gl"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge></filter>`);
  return `url(#${id})`;
}
const RETRO_F = ['retro', 'slider', 'flipold', 'qwerty'];
// camera transform for an angle; everything is in object space, so overlays and taps follow it
function viewTransform(it, view, box, veh, native) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const r = new RNG((it.seed || 1) * 7 + view.length);
  if (native) return '';
  if (veh && view === 'back') return `translate(${S(2 * cx)} 0) scale(-1 1)`;
  if (view === 'left') return `translate(${S(cx)} ${S(cy)}) matrix(0.8 0.13 0 1 0 0) translate(${S(-cx)} ${S(-cy)})`;
  if (view === 'right') return `translate(${S(cx)} ${S(cy)}) matrix(0.8 -0.13 0 1 0 0) translate(${S(-cx)} ${S(-cy)})`;
  if (view === 'close' || view === 'close2') {
    const z = view === 'close' ? 1.85 : 2.2;
    const fx = box.x + box.w * (view === 'close' ? r.float(0.35, 0.65) : r.float(0.25, 0.75)), fy = box.y + box.h * (view === 'close' ? r.float(0.35, 0.6) : r.float(0.3, 0.7));
    return `translate(200 205) scale(${z}) translate(${S(-fx)} ${S(-fy)})`;
  }
  return '';
}
// dust and grime on items that were never cleaned; the amount follows the condition
export const dirtOf = (it) => (it.cleaned || it.sealed ? 0 : clamp((100 - (it.cond ?? 80)) / 85, 0.12, 0.85));
function dirtFilter(ctx, amt, lite) {
  const id = `${ctx.P}dirt`;
  const seed = ((ctx.it.seed || 1) % 991) + 3;
  const a = (3.2 * amt).toFixed(2), b = (-(1.05 + 0.6 * (1 - amt))).toFixed(2);
  const specks = lite ? '' : `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="${seed + 7}" result="sn"/><feColorMatrix in="sn" type="matrix" values="0 0 0 0 0.76  0 0 0 0 0.74  0 0 0 0 0.7  ${(2.1 * amt).toFixed(2)} 0 0 0 -0.9" result="sc"/><feComposite in="sc" in2="SourceAlpha" operator="in" result="dust"/>`;
  ctx.defs.push(`<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="400" height="400" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="${lite ? 2 : 3}" seed="${seed}" result="gn"/><feColorMatrix in="gn" type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.19  0 0 0 0 0.13  ${a} 0 0 0 ${b}" result="gc"/><feComposite in="gc" in2="SourceAlpha" operator="in" result="grime"/>${specks}<feMerge><feMergeNode in="grime"/>${specks ? '<feMergeNode in="dust"/>' : ''}</feMerge></filter>`);
  return `url(#${id})`;
}
export function renderItem(it, o = {}) {
  const ctx = mkCtx(it, o);
  const view = ctx.view;
  const veh = it.cat === 'cars' || it.cat === 'bikes';
  const native = it.cat === 'phones' && !RETRO_F.includes(ctx.a.f);
  let res = null, sprite = false;
  // watches turned over show the procedural caseback; everything else uses the painted photo when there is one
  const pick = o.procedural || (view === 'back' && it.cat === 'watches') ? null : pickSprite(it);
  // drawers only know front/back; other angles are camera moves around those two
  ctx.view = native ? view : view === 'back' && !veh ? 'back' : 'front';
  if (pick) {
    res = spriteMarkup(ctx, pick, { clean: !!it.cleaned });
    sprite = true;
  } else {
    const draw = DRAW[it.cat] || DRAW2[it.cat];
    try { res = draw ? draw(ctx) : null; } catch (e) { console.error('art', it.m, e); res = null; }
    if (!res) res = { g: rr(120, 120, 160, 160, 20, ctx.c), box: { x: 120, y: 120, w: 160, h: 160 } };
  }
  ctx.view = view;
  const { box } = res;
  ctx.vizOf = (d) => DEFECTS[d.c]?.viz;
  let ov = '';
  const vs = viewsOf(it);
  for (const d of it.defects || []) {
    if (!DEFECTS[d.c]?.viz) continue;
    const dv = defectView(it, d, vs);
    if (dv !== view && dv !== 'any') continue;
    const vis = DEFECTS[d.c].vis;
    if (vis === 'hidden') continue;
    let op = vis === 'visible' ? 1 : o.inspect ? 0.45 : 0.3;
    if (d.known) op = Math.max(op, 0.85);
    ov += overlay(ctx, d, box, op);
  }
  if (ov) ov = `<g clip-path="${ctx.clip(res.clip || rr(box.x - 4, box.y - 4, box.w + 8, box.h + 8, 14, '#000'))}">${ov}</g>`;
  const staged = o.bg !== false;
  const ps = staged ? photoSetup(it, view) : null;
  const jit = staged && !o.inspect ? ps.jitter : { x: 0, y: 0, rot: 0, scale: 1 };
  const close = view.startsWith('close');
  const base = o.zoom || (sprite ? 1 : veh ? 1.08 : native && view !== 'front' && view !== 'back' ? 1 : 0.9);
  const scale = base * (close || veh ? 1 : jit.scale);
  const rot = close || veh ? 0 : jit.rot;
  const tr = `translate(${S(200 + (close ? 0 : jit.x))} ${S(200 + (close ? 0 : jit.y))}) rotate(${S(rot)}) scale(${S(scale * 100) / 100}) translate(-200 -200) ${viewTransform(it, view, box, veh, native)}`;
  const objId = `${ctx.P}obj`;
  const body = sprite ? res.g : `<g filter="${grit(ctx, box, o.lite)}">${res.g}</g>`;
  let shadow = '';
  if (staged) {
    if (ps.scene && veh) shadow = groundShadow(ctx, objId, res.bottom ?? box.y + box.h, box);
    else shadow = `<use href="#${objId}" xlink:href="#${objId}" filter="${shadowDefs(ctx, ps)}"/>`;
  }
  const bg = staged ? photoBackground(ctx, ps) : '';
  const post = staged ? photoPost(ctx, ps) : '';
  const dirt = dirtOf(it);
  const dirtLayer = dirt > 0 && o.bg !== false ? `<use href="#${objId}" xlink:href="#${objId}" filter="${dirtFilter(ctx, dirt, o.lite)}" style="pointer-events:none"/>` : '';
  const svg = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid slice"><defs>${ctx.defs.join('')}</defs>${bg}<g class="itemg" transform="${tr}">${shadow}<g id="${objId}">${body}</g>${dirtLayer}${ov}</g>${post}</svg>`;
  return { svg, box, ctx, buttons: ctx.buttons, hot: ctx.hot, screen: ctx.screen, scale, tilt: rot, sprite };
}
export function itemSVG(it, o = {}) {
  const sig = `${it.id}|${o.view || 'front'}|${o.bg !== false}|${o.inspect ? 1 : 0}|${o.lite ? 1 : 0}|${(it.defects || []).map((d) => d.c + (d.known ? 1 : 0)).join(',')}|${it.lock || ''}|${it.grade || ''}|${it.fill ?? ''}|${it.cond}|${it.cleaned ? 1 : 0}`;
  const hit = CACHE.get(sig);
  if (hit) return hit;
  const { svg } = renderItem(it, o);
  CACHE.set(sig, svg);
  if (CACHE.size > 600) CACHE.delete(CACHE.keys().next().value);
  return svg;
}
