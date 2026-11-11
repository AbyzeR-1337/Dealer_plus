// Procedural SVG art, part 2: cards, comics, toys, antiques, art, collectibles, instruments, cars, bikes.
import { rr, ci, el, pa, tx, ln, metal } from './art.js';
import { shade, lum, mix } from '../core/util.js';
import { colorHex } from '../data/catalog.js';
import { RNG } from '../core/rng.js';

const S = (n) => +n.toFixed(1);

// ---------------------------------------------------------------- trading cards
function creature(ctx, x, y, s, col) {
  const r = new RNG(ctx.it.m);
  const body = shade(col, 0.15);
  let g = el(x, y + s * 0.15, s * 0.55, s * 0.45, body) + ci(x, y - s * 0.25, s * 0.38, body);
  const ear = r.int(0, 2);
  if (ear === 0) g += pa(`M${x - s * 0.3} ${y - s * 0.45} l-${s * 0.15} -${s * 0.45} l${s * 0.3} ${s * 0.25}Z M${x + s * 0.3} ${y - s * 0.45} l${s * 0.15} -${s * 0.45} l-${s * 0.3} ${s * 0.25}Z`, body);
  if (ear === 1) g += pa(`M${x - s * 0.1} ${y - s * 0.6} q -${s * 0.3} -${s * 0.4} -${s * 0.05} -${s * 0.5} M${x + s * 0.1} ${y - s * 0.6} q ${s * 0.3} -${s * 0.4} ${s * 0.05} -${s * 0.5}`, 'none', `stroke="${body}" stroke-width="${s * 0.12}" stroke-linecap="round"`);
  if (ear === 2) g += pa(`M${x + s * 0.5} ${y + s * 0.2} q ${s * 0.6} -${s * 0.2} ${s * 0.4} -${s * 0.8}`, 'none', `stroke="${shade(col, -0.1)}" stroke-width="${s * 0.1}" stroke-linecap="round"`) + ci(x + s * 0.9, y - s * 0.62, s * 0.12, '#ff7a1a');
  g += ci(x - s * 0.13, y - s * 0.3, s * 0.08, '#111') + ci(x + s * 0.13, y - s * 0.3, s * 0.08, '#111') + ci(x - s * 0.11, y - s * 0.33, s * 0.03, '#fff') + ci(x + s * 0.15, y - s * 0.33, s * 0.03, '#fff');
  g += pa(`M${x - s * 0.1} ${y - s * 0.12} q ${s * 0.1} ${s * 0.08} ${s * 0.2} 0`, 'none', 'stroke="#111" stroke-width="2"');
  return g;
}
function cardFace(ctx, x, y, w, h) {
  const { a } = ctx;
  const t = a.t;
  const frame = t === 'poke' ? '#f2d03b' : t === 'magic' ? (a.frame || '#2a2a2a') : t === 'yugi' ? (a.frame || '#c9a24a') : (a.team || '#1e3f9a');
  let g = rr(x, y, w, h, 10, frame) + rr(x + 8, y + 8, w - 16, h - 16, 6, t === 'magic' ? '#d8cfb8' : t === 'yugi' ? '#b98a4a' : '#f6f2e6');
  const artY = y + 30, artH = h * 0.42;
  g += rr(x + 14, artY, w - 28, artH, 3, ctx.lin([[0, shade(a.el, 0.45)], [1, shade(a.el, -0.15)]], 0, 0, 1, 1), 'stroke="#c9a227" stroke-width="2"');
  if (t === 'sport') g += ci(x + w / 2, artY + artH * 0.35, artH * 0.18, '#d9a77a') + pa(`M${x + w / 2 - artH * 0.35} ${artY + artH} Q ${x + w / 2} ${artY + artH * 0.45} ${x + w / 2 + artH * 0.35} ${artY + artH}Z`, a.team || '#1e3f9a');
  else if (a.art === 'swirl') for (let i = 0; i < 6; i++) g += pa(`M${x + 20} ${artY + 10 + i * 12} q 30 -10 60 0 t 60 0`, 'none', `stroke="${['#f2c218', '#2a5bd7', '#fff'][i % 3]}" stroke-width="3" opacity=".7"`) + creature(ctx, x + w / 2, artY + artH * 0.62, artH * 0.38, a.el);
  else if (t === 'magic' && /Lotos/.test(ctx.m.name)) g += pa(`M${x + w / 2} ${artY + 20} q 30 30 0 70 q -30 -40 0 -70Z`, '#1c1c1c') + pa(`M${x + w / 2 - 30} ${artY + 60} q 30 10 30 30 q -30 0 -30 -30Z M${x + w / 2 + 30} ${artY + 60} q -30 10 -30 30 q 30 0 30 -30Z`, '#2a2a2a');
  else g += creature(ctx, x + w / 2, artY + artH * 0.62, artH * 0.38, a.el);
  if (a.holo) g += rr(x + 14, artY, w - 28, artH, 3, ctx.lin([[0, '#ff6ad5', 0.35], [0.3, '#fffb7d', 0.25], [0.6, '#8affc1', 0.3], [1, '#6ac8ff', 0.35]], 0, 0, 1, 1));
  if (a.full) g += rr(x + 8, y + 8, w - 16, h - 16, 6, ctx.lin([[0, shade(a.el, 0.3), 0.55], [1, shade(a.el, -0.2), 0.55]], 0, 0, 1, 1));
  const name = ctx.m.name.split(' — ')[0].split(' (')[0].replace(/Holo/i, '').trim();
  g += tx(x + 16, y + 24, name.length > 22 ? name.slice(0, 21) + '…' : name, 10, '#111', 'font-weight="800" text-anchor="start"');
  if (a.hp) g += tx(x + w - 18, y + 24, `${a.hp} HP`, 9, '#c8102e', 'font-weight="800" text-anchor="end"');
  for (let i = 0; i < 3; i++) g += rr(x + 18, artY + artH + 18 + i * 24, w - 36, 3, 1, '#888', 'opacity=".5"');
  if (a.ed1) g += ci(x + 22, artY + artH + 8, 7, '#111') + tx(x + 22, artY + artH + 11, '1', 8, '#fff', 'font-weight="800"');
  return g;
}
function cards(ctx) {
  const { a, it } = ctx;
  let g = '';
  if (a.t === 'box') { g += pa('M90 150 L 260 120 L 320 150 L 150 182Z', shade(a.el, 0.2)) + pa('M90 150 L 150 182 L 150 300 L 90 268Z', shade(a.el, -0.25)) + pa('M150 182 L 320 150 L 320 268 L 150 300Z', a.el) + tx(235, 235, 'BOOSTER BOX', 15, '#fff', 'font-weight="900" transform="skewY(-10)"') + tx(235, 210, ctx.m.brand.split(' ')[0].toUpperCase(), 11, '#ffd34d', 'font-weight="900" transform="skewY(-10)"'); if (it.sealed) g += pa('M90 150 L 260 120 L 320 150 L 150 182Z', '#fff', 'opacity=".15"'); return { g, box: { x: 90, y: 120, w: 230, h: 180 } }; }
  if (a.t === 'pack') { g += pa('M140 80 L 260 80 L 255 330 L 145 330Z', ctx.lin([[0, shade(a.el, 0.3)], [0.5, a.el], [1, shade(a.el, -0.3)]], 0, 0, 1, 1)) + pa('M140 80 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8 l10 -8 l10 8', '#ccc') + creature(ctx, 200, 210, 50, '#f2c218'); return { g, box: { x: 140, y: 72, w: 120, h: 258 } }; }
  if (a.t === 'album') { g += rr(90, 100, 220, 220, 8, a.el) + rr(98, 100, 10, 220, 2, shade(a.el, -0.3)) + tx(210, 200, 'WORLD CUP', 18, '#fff', 'font-weight="900"') + tx(210, 225, '2002', 22, '#ffd34d', 'font-weight="900"'); return { g, box: { x: 90, y: 100, w: 220, h: 220 } }; }
  if (it.grade) {
    g += rr(110, 40, 180, 330, 12, '#e8eef4', 'opacity=".9" stroke="#b9c3cf" stroke-width="3"') + rr(120, 50, 160, 50, 4, '#fff') + rr(120, 50, 160, 12, 3, it.cat === 'cards' ? '#c8102e' : '#1e5bd8');
    g += tx(200, 80, `${it.cat === 'cards' ? 'PZA' : 'CGS'} ${it.grade >= 10 ? 'GEM MT' : it.grade >= 9 ? 'MINT' : it.grade >= 8 ? 'NM‑MT' : 'EX'} ${it.grade}`, 12, '#111', 'font-weight="900"') + tx(200, 94, `#${String(it.seed).slice(0, 8)}`, 8, '#666', 'font-family="monospace"');
    g += cardFace(ctx, 130, 115, 140, 235);
    return { g, box: { x: 130, y: 115, w: 140, h: 235 } };
  }
  g += cardFace(ctx, 115, 55, 170, 290);
  return { g, box: { x: 115, y: 55, w: 170, h: 290 }, clip: rr(115, 55, 170, 290, 10, '#000') };
}

// ---------------------------------------------------------------- comics
function heroShape(kind, x, y, s, c) {
  switch (kind) {
    case 'bat': return pa(`M${x - s} ${y} q ${s * 0.3} -${s * 0.2} ${s * 0.5} 0 q ${s * 0.15} -${s * 0.35} ${s * 0.3} -${s * 0.1} l ${s * 0.1} -${s * 0.25} l ${s * 0.1} ${s * 0.25} q ${s * 0.15} -${s * 0.25} ${s * 0.3} ${s * 0.1} q ${s * 0.2} -${s * 0.2} ${s * 0.5} 0 q -${s * 0.4} ${s * 0.1} -${s * 0.5} ${s * 0.45} q -${s * 0.2} -${s * 0.2} -${s * 0.5} ${s * 0.1} q -${s * 0.3} -${s * 0.3} -${s * 0.5} -${s * 0.1} q -${s * 0.1} -${s * 0.35} -${s * 0.5} -${s * 0.45}Z`, c);
    case 'spider': { let g = ''; for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2; g += ln(x, y, x + Math.cos(an) * s * 1.3, y + Math.sin(an) * s * 1.3, '#fff', 1, 'opacity=".5"'); } return g + ci(x, y - s * 0.55, s * 0.28, c) + pa(`M${x - s * 0.35} ${y + s} L ${x - s * 0.25} ${y - s * 0.25} L ${x + s * 0.25} ${y - s * 0.25} L ${x + s * 0.35} ${y + s}Z`, c) + ln(x - s * 0.25, y - s * 0.15, x - s * 0.8, y - s * 0.6, c, s * 0.12) + ln(x + s * 0.25, y - s * 0.15, x + s * 0.8, y + s * 0.2, c, s * 0.12); }
    case 'team': return [-1, 0, 1].map((k) => ci(x + k * s * 0.6, y - s * 0.5 + Math.abs(k) * 10, s * 0.22, shade(c, k * 0.2)) + pa(`M${x + k * s * 0.6 - s * 0.28} ${y + s} L ${x + k * s * 0.6 - s * 0.2} ${y - s * 0.25 + Math.abs(k) * 10} L ${x + k * s * 0.6 + s * 0.2} ${y - s * 0.25 + Math.abs(k) * 10} L ${x + k * s * 0.6 + s * 0.28} ${y + s}Z`, shade(c, k * 0.2))).join('');
    case 'skull': return ci(x, y - s * 0.1, s * 0.6, '#f4f4f4') + rr(x - s * 0.35, y + s * 0.35, s * 0.7, s * 0.35, 6, '#f4f4f4') + ci(x - s * 0.22, y - s * 0.1, s * 0.16, '#111') + ci(x + s * 0.22, y - s * 0.1, s * 0.16, '#111');
    case 'turtle': return el(x, y, s * 0.8, s * 0.6, '#2fa36b') + rr(x - s * 0.7, y - s * 0.32, s * 1.4, s * 0.18, 4, '#c8102e');
    case 'smile': return ci(x, y, s * 0.8, '#f2c218') + ci(x - s * 0.25, y - s * 0.2, s * 0.08, '#111') + ci(x + s * 0.25, y - s * 0.2, s * 0.08, '#111') + pa(`M${x - s * 0.4} ${y + s * 0.15} q ${s * 0.4} ${s * 0.45} ${s * 0.8} 0`, 'none', 'stroke="#111" stroke-width="4"') + ln(x + s * 0.1, y - s * 0.6, x + s * 0.5, y + s * 0.1, '#c8102e', 5);
    default: return ci(x, y - s * 0.55, s * 0.3, shade(c, 0.1)) + pa(`M${x - s * 0.45} ${y + s} L ${x - s * 0.3} ${y - s * 0.22} L ${x + s * 0.3} ${y - s * 0.22} L ${x + s * 0.45} ${y + s}Z`, c) + pa(`M${x - s * 0.3} ${y - s * 0.2} Q ${x - s * 1.1} ${y + s * 0.4} ${x - s * 0.8} ${y + s * 1.05} L ${x - s * 0.4} ${y + s}Z`, '#c8102e', 'opacity=".9"');
  }
}
function comics(ctx) {
  const { a, it } = ctx;
  const x = 105, y = 45, w = 190, h = 290;
  let g = '';
  const inSlab = !!it.grade;
  const X = inSlab ? 125 : x, Y = inSlab ? 105 : y, W = inSlab ? 150 : w, H = inSlab ? 230 : h;
  if (inSlab) g += rr(105, 30, 190, 340, 12, '#e8eef4', 'opacity=".9" stroke="#b9c3cf" stroke-width="3"') + rr(115, 40, 170, 52, 4, '#fff') + rr(115, 40, 170, 14, 3, '#1e5bd8') + tx(200, 72, `CGS ${it.grade}`, 16, '#111', 'font-weight="900"') + tx(200, 86, 'UNIVERSAL GRADE', 7, '#555');
  g += rr(X, Y, W, H, 2, a.c || '#c8102e');
  let rays = '';
  for (let i = 0; i < 14; i++) { const an = (i / 14) * Math.PI * 2; rays += pa(`M${X + W / 2} ${Y + H * 0.6} L ${X + W / 2 + Math.cos(an) * W} ${Y + H * 0.6 + Math.sin(an) * W} L ${X + W / 2 + Math.cos(an + 0.15) * W} ${Y + H * 0.6 + Math.sin(an + 0.15) * W}Z`, '#fff', 'opacity=".12"'); }
  g += `<g clip-path="${ctx.clip(rr(X, Y, W, H, 2, '#000'))}">${rays}${heroShape(a.hero, X + W / 2, Y + H * 0.6, W * 0.3, lum(a.c || '#000') > 0.5 ? '#1c1c1c' : '#f2f2f2')}</g>`;
  g += rr(X, Y, W, H * 0.2, 0, a.manga ? '#fff' : shade(a.c || '#c8102e', -0.35)) + tx(X + W / 2, Y + H * 0.13, a.title || '', Math.min(22, (W * 1.5) / Math.max(6, (a.title || '').length)), a.manga ? '#c8102e' : '#ffd34d', 'font-weight="900" letter-spacing="1" font-family="Impact,Arial Black,sans-serif"');
  g += ci(X + 18, Y + H * 0.26, 13, '#fff') + tx(X + 18, Y + H * 0.26 + 4, `#${a.n || 1}`, 9, '#111', 'font-weight="900"');
  g += rr(X + W - 36, Y + H * 0.22, 28, 18, 2, '#fff') + tx(X + W - 22, Y + H * 0.22 + 13, ctx.m.year < 1970 ? '12¢' : ctx.m.year < 1990 ? '75¢' : '$3', 9, '#111', 'font-weight="800"');
  return { g, box: { x: X, y: Y, w: W, h: H }, clip: rr(X, Y, W, H, 2, '#000') };
}

// ---------------------------------------------------------------- toys
function brickBuild(kind, x, y, w, h) {
  const B = (bx, by, bw, bh, c) => rr(bx, by, bw, bh, 2, c) + Array.from({ length: Math.max(1, Math.floor(bw / 10)) }, (_, i) => rr(bx + 2 + i * 10, by - 3, 6, 3, 1, shade(c, 0.15))).join('');
  const grey = '#a9adb3', dg = '#6b7078';
  switch (kind) {
    case 'ship': return pa(`M${x} ${y + h * 0.6} L ${x + w * 0.7} ${y + h * 0.3} L ${x + w} ${y + h * 0.45} L ${x + w * 0.7} ${y + h * 0.85}Z`, grey) + ci(x + w * 0.62, y + h * 0.55, h * 0.18, dg) + B(x + w * 0.4, y + h * 0.35, 30, 10, '#c8102e');
    case 'sphere': return ci(x + w / 2, y + h / 2, h * 0.45, dg) + rr(x + w * 0.1, y + h / 2 - 3, w * 0.8, 6, 2, '#333') + ci(x + w * 0.62, y + h * 0.35, h * 0.1, grey);
    case 'walker': return B(x + w * 0.2, y + h * 0.2, w * 0.6, h * 0.3, grey) + [0.25, 0.4, 0.6, 0.75].map((f) => rr(x + w * f, y + h * 0.5, 8, h * 0.45, 2, dg)).join('');
    case 'car': return pa(`M${x} ${y + h * 0.7} L ${x + w * 0.15} ${y + h * 0.45} L ${x + w * 0.75} ${y + h * 0.4} L ${x + w} ${y + h * 0.65} L ${x + w} ${y + h * 0.75} L ${x} ${y + h * 0.75}Z`, '#c9a227') + ci(x + w * 0.22, y + h * 0.78, h * 0.12, '#222') + ci(x + w * 0.8, y + h * 0.78, h * 0.12, '#222');
    case 'tower': return pa(`M${x + w * 0.5} ${y} L ${x + w * 0.75} ${y + h} L ${x + w * 0.25} ${y + h}Z`, dg) + ln(x + w * 0.3, y + h * 0.6, x + w * 0.7, y + h * 0.6, '#333', 3);
    case 'rocket': return rr(x + w * 0.42, y, w * 0.16, h, 4, '#f4f4f4') + rr(x + w * 0.42, y + h * 0.3, w * 0.16, 8, 0, '#111') + pa(`M${x + w * 0.42} ${y} L ${x + w * 0.5} ${y - 14} L ${x + w * 0.58} ${y}Z`, '#ddd');
    case 'castle': case 'palace': return B(x + w * 0.1, y + h * 0.45, w * 0.8, h * 0.5, kind === 'palace' ? '#f2ead8' : '#8a8d93') + [0.15, 0.45, 0.75].map((f) => rr(x + w * f, y + h * 0.15, w * 0.12, h * 0.35, 2, kind === 'palace' ? '#f2ead8' : '#6b7078') + (kind === 'palace' ? ci(x + w * f + w * 0.06, y + h * 0.15, w * 0.07, '#f2ead8') : pa(`M${x + w * f - 3} ${y + h * 0.15} L ${x + w * f + w * 0.06} ${y} L ${x + w * f + w * 0.12 + 3} ${y + h * 0.15}Z`, '#2a5bd7'))).join('');
    case 'house': return B(x + w * 0.15, y + h * 0.3, w * 0.7, h * 0.65, '#c8102e') + rr(x + w * 0.25, y + h * 0.45, w * 0.15, h * 0.15, 1, '#fff') + rr(x + w * 0.55, y + h * 0.45, w * 0.15, h * 0.15, 1, '#fff') + rr(x + w * 0.15, y + h * 0.22, w * 0.7, 10, 1, '#2fa36b');
    case 'ship2': return pa(`M${x} ${y + h * 0.55} L ${x + w} ${y + h * 0.55} L ${x + w * 0.9} ${y + h * 0.85} L ${x + w * 0.1} ${y + h * 0.85}Z`, '#1c1c1c') + rr(x + w * 0.1, y + h * 0.45, w * 0.8, h * 0.1, 0, '#f4f4f4') + [0.3, 0.45, 0.6, 0.75].map((f) => rr(x + w * f, y + h * 0.2, 10, h * 0.25, 1, '#f2c218')).join('');
    default: return B(x + w * 0.1, y + h * 0.5, w * 0.8, h * 0.4, '#1e3f9a') + B(x + w * 0.3, y + h * 0.3, w * 0.4, h * 0.2, grey);
  }
}
function toys(ctx) {
  const { a, it } = ctx;
  const c = a.c || '#c8102e';
  let g = '';
  switch (a.t) {
    case 'brickbox': {
      g += pa('M80 120 L 300 95 L 330 115 L 110 142Z', shade(c, 0.25)) + pa('M300 95 L 330 115 L 330 300 L 300 290Z', shade(c, -0.35)) + rr(80, 120, 250, 180, 2, c, 'transform="skewY(-6)"').replace('<rect', '<rect') ;
      g = pa('M70 125 L 300 100 L 330 120 L 100 146Z', shade(c, 0.25)) + pa('M300 100 L 330 120 L 330 300 L 300 284Z', shade(c, -0.35)) + pa('M70 125 L 300 100 L 300 284 L 70 310Z', ctx.lin([[0, shade(c, 0.1)], [1, shade(c, -0.15)]], 0, 0, 1, 1));
      g += `<g transform="skewY(-6) translate(0 20)">` + rr(82, 128, 52, 36, 6, a.knock ? '#2a5bd7' : '#e3000b') + tx(108, 152, a.knock ? 'LEPINO' : 'LEGGO', a.knock ? 9 : 12, a.knock ? '#fff' : '#ffd500', 'font-weight="900"') + tx(275, 152, a.num || '', 14, '#fff', 'font-weight="800"') + brickBuild(a.build, 100, 180, 180, 100) + '</g>';
      if (it.sealed) g += pa('M70 125 L 300 100 L 300 284 L 70 310Z', ctx.lin([[0, '#fff', 0.18], [1, '#fff', 0.02]], 0, 0, 1, 1));
      return { g, box: { x: 70, y: 100, w: 260, h: 210 } };
    }
    case 'minifig': g += rr(180, 120, 40, 34, 8, c) + rr(170, 156, 60, 70, 6, c) + rr(170, 226, 28, 60, 4, c) + rr(202, 226, 28, 60, 4, c) + ci(190, 134, 3, '#111') + ci(210, 134, 3, '#111') + rr(150, 160, 20, 50, 8, c) + rr(230, 160, 20, 50, 8, c); return { g, box: { x: 150, y: 120, w: 100, h: 166 } };
    case 'pop': case 'boxfig': {
      const boxC = a.t === 'boxfig' ? '#141414' : '#f4f4f4';
      g += rr(110, 70, 180, 260, 6, boxC) + rr(130, 110, 140, 190, 70, '#ffffff', 'opacity=".9"').replace('#ffffff', a.t === 'boxfig' ? '#222' : '#e8f0ff');
      g += a.t === 'pop' ? rr(160, 130, 80, 70, 24, c) + ci(182, 168, 7, '#111') + ci(218, 168, 7, '#111') + rr(176, 200, 48, 70, 10, shade(c, -0.2)) : ci(200, 150, 20, c) + rr(180, 172, 40, 100, 8, c);
      g += tx(200, 95, a.t === 'pop' ? 'FUNKY POP!' : 'HOT TOYZ', 14, a.t === 'pop' ? '#111' : '#d4af37', 'font-weight="900"');
      return { g, box: { x: 110, y: 70, w: 180, h: 260 } };
    }
    case 'bear': { const body = c; g += ci(200, 130, 50, body) + ci(162, 92, 18, body) + ci(238, 92, 18, body) + rr(160, 175, 80, 90, 24, body) + rr(160, 265, 34, 50, 10, body) + rr(206, 265, 34, 50, 10, body) + rr(130, 185, 30, 60, 14, body) + rr(240, 185, 30, 60, 14, body); if (a.pat === 'x') g += tx(184, 138, '✕', 16, '#111') + tx(216, 138, '✕', 16, '#111'); if (a.pat === 'crown') g += pa('M180 200 l8 -16 l12 12 l12 -12 l8 16Z', '#111'); if (a.pat === 'dots') for (let i = 0; i < 10; i++) g += ci(170 + (i * 23) % 60, 190 + (i * 31) % 70, 5, '#fff'); return { g, box: { x: 130, y: 74, w: 140, h: 241 } }; }
    case 'kawz': g += ci(200, 120, 44, c) + ci(160, 90, 16, c) + ci(240, 90, 16, c) + tx(182, 128, '✕', 18, '#111') + tx(218, 128, '✕', 18, '#111') + rr(165, 165, 70, 100, 20, c) + rr(130, 165, 30, 80, 14, c) + rr(240, 165, 30, 80, 14, c) + rr(170, 265, 26, 60, 8, c) + rr(204, 265, 26, 60, 8, c); return { g, box: { x: 130, y: 74, w: 140, h: 251 } };
    case 'labobo': g += pa('M165 90 Q 160 40 175 30 Q 185 60 182 92Z', c) + pa('M235 90 Q 240 40 225 30 Q 215 60 218 92Z', c) + ci(200, 140, 55, c) + el(200, 150, 38, 30, '#f4e0d0') + Array.from({ length: 9 }, (_, i) => pa(`M${172 + i * 7} 165 l3.5 8 l3.5 -8Z`, '#fff')).join('') + ci(184, 140, 7, a.bad ? '#5a3a3a' : '#111') + ci(216, 140, 7, '#111') + rr(165, 190, 70, 90, 30, c); return { g, box: { x: 145, y: 30, w: 110, h: 250 } };
    case 'tama': g += el(200, 200, 75, 95, c) + rr(165, 165, 70, 60, 8, '#9bbc0f') + ci(200, 195, 10, '#1f2a12') + ci(175, 260, 8, '#f2c218') + ci(200, 268, 8, '#f2c218') + ci(225, 260, 8, '#f2c218') + ci(200, 98, 10, 'none', 'stroke="#aaa" stroke-width="4"'); return { g, box: { x: 125, y: 105, w: 150, h: 190 } };
    case 'furby': g += el(200, 210, 80, 90, c) + pa('M150 140 L 135 70 L 175 130Z', c) + pa('M250 140 L 265 70 L 225 130Z', c) + ci(178, 185, 20, '#fff') + ci(222, 185, 20, '#fff') + ci(178, 188, 10, '#111') + ci(222, 188, 10, '#111') + pa('M190 215 L 210 215 L 200 232Z', '#f2a218'); return { g, box: { x: 120, y: 70, w: 160, h: 230 } };
    case 'diecast': g += pa('M90 240 L 120 200 L 260 195 L 310 230 L 310 250 L 90 255Z', c) + rr(140, 205, 100, 22, 6, '#a8d0f0', 'opacity=".8"') + ci(135, 255, 16, '#222') + ci(275, 255, 16, '#222') + rr(160, 300, 80, 20, 3, '#c8102e') + tx(200, 315, 'HOT WHEELZ', 10, '#ffd500', 'font-weight="900"'); return { g, box: { x: 90, y: 195, w: 220, h: 125 } };
    case 'doll': g += ci(200, 100, 26, '#f4d3b5') + pa('M174 95 Q 200 50 226 95 L 230 130 L 170 130Z', '#1c1c1c') + pa('M180 130 L 220 130 L 245 300 L 155 300Z', 'none').replace('none', '#111') + Array.from({ length: 6 }, (_, i) => ln(160, 160 + i * 25, 240, 160 + i * 25, '#fff', 3)).join(''); return { g, box: { x: 155, y: 74, w: 90, h: 226 } };
    case 'robot': g += rr(160, 90, 80, 70, 8, c) + ci(182, 120, 9, '#f2c218') + ci(218, 120, 9, '#f2c218') + rr(150, 165, 100, 100, 6, shade(c, -0.15)) + rr(120, 170, 26, 80, 6, c) + rr(254, 170, 26, 80, 6, c) + rr(160, 268, 32, 60, 6, c) + rr(208, 268, 32, 60, 6, c) + ln(200, 90, 200, 66, '#888', 3) + ci(200, 62, 5, '#c8102e'); return { g, box: { x: 120, y: 60, w: 160, h: 268 } };
    case 'blister': g += rr(110, 50, 180, 290, 8, c) + rr(140, 110, 120, 200, 40, '#f0f6ff', 'opacity=".6"') + ci(200, 150, 16, '#3a5a4a') + rr(185, 168, 30, 90, 6, '#3a5a4a') + tx(200, 85, 'STAR WARZ', 16, '#f2c218', 'font-weight="900"'); return { g, box: { x: 110, y: 50, w: 180, h: 290 } };
    case 'cube': { const cs = ['#c8102e', '#2a5bd7', '#2fa36b', '#f2c218', '#ff7a1a', '#ffffff']; for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) g += rr(140 + k * 42, 140 + i * 42, 38, 38, 6, cs[(i * 3 + k + it.seed) % 6]); g = rr(134, 134, 132, 132, 10, '#111') + g; return { g, box: { x: 134, y: 134, w: 132, h: 132 } }; }
    case 'handheld': g += rr(90, 140, 220, 130, 12, c === '#c8102e' ? '#d8d2c2' : '#c9a227') + rr(140, 158, 120, 84, 4, '#9aa58a') + tx(200, 205, '🐺🥚', 26, '#1f2a12') + ci(115, 230, 10, '#c8102e') + ci(285, 230, 10, '#c8102e') + tx(200, 260, c === '#c8102e' ? 'ЭЛЕКТРОНИКА' : 'GAME & WATCH', 9, '#333', 'font-weight="700"'); return { g, box: { x: 90, y: 140, w: 220, h: 130 } };
    case 'plush': g += ci(200, 200, 70, c) + ci(118, 160, 50, c) + ci(282, 160, 50, c) + ci(118, 160, 34, '#d8a07a') + ci(282, 160, 34, '#d8a07a') + el(200, 220, 40, 34, '#d8a07a') + ci(182, 192, 8, '#111') + ci(218, 192, 8, '#111') + rr(160, 260, 80, 70, 30, c); return { g, box: { x: 68, y: 110, w: 264, h: 220 } };
    case 'matryoshka': g += pa('M200 70 Q 250 70 255 150 Q 290 220 270 330 L 130 330 Q 110 220 145 150 Q 150 70 200 70Z', c) + ci(200, 130, 34, '#f4d3b5') + ci(188, 128, 4, '#111') + ci(212, 128, 4, '#111') + el(200, 250, 40, 50, '#f2c218') + ci(200, 250, 18, '#c8102e'); return { g, box: { x: 128, y: 70, w: 144, h: 260 } };
    default: g += rr(130, 130, 140, 140, 20, c); return { g, box: { x: 130, y: 130, w: 140, h: 140 } };
  }
}

// ---------------------------------------------------------------- antiques
function antiques(ctx) {
  const { a } = ctx;
  const brass = metal(ctx, 'brass'), silver = metal(ctx, 'silver');
  let g = '';
  switch (a.t) {
    case 'samovar': g += pa('M140 130 Q 120 200 140 280 L 260 280 Q 280 200 260 130Z', a.el ? silver : brass) + rr(150, 280, 100, 16, 4, a.el ? silver : brass) + pa('M160 296 L 150 330 L 250 330 L 240 296Z', a.el ? silver : brass) + rr(175, 95, 50, 35, 6, a.el ? silver : brass) + pa('M260 220 L 300 230 L 302 240 L 262 236Z', a.el ? silver : brass) + pa('M140 160 Q 105 165 108 200', 'none', 'stroke="#2a1a10" stroke-width="8"') + pa('M260 160 Q 295 165 292 200', 'none', 'stroke="#2a1a10" stroke-width="8"') + rr(150, 150, 12, 120, 6, '#fff', 'opacity=".25"'); return { g, box: { x: 108, y: 95, w: 194, h: 235 } };
    case 'teapot': g += el(200, 230, 90, 70, '#f6f6f2') + rr(0, 0, 400, 400, 0, ctx.pat(14, 14, pa('M0 7 L7 0 L14 7 L7 14Z', 'none', 'stroke="#1e3f9a" stroke-width="1.6"')), `clip-path="${ctx.clip(el(200, 230, 90, 70, '#000'))}"`) + el(200, 165, 40, 10, '#f6f6f2') + ci(200, 152, 9, '#d4af37') + pa('M290 220 Q 330 190 340 160', 'none', 'stroke="#f6f6f2" stroke-width="14"') + pa('M112 200 Q 70 220 112 260', 'none', 'stroke="#f6f6f2" stroke-width="12"'); return { g, box: { x: 110, y: 150, w: 180, h: 150 } };
    case 'vase': { const body = 'M175 80 L 225 80 Q 220 120 245 150 Q 300 220 250 320 L 150 320 Q 100 220 155 150 Q 180 120 175 80Z'; g += pa(body, '#f4f4f0') + `<g clip-path="${ctx.clip(pa(body, '#000'))}">` + rr(100, 180, 200, 70, 0, a.pat === 'qing' ? '#1e3f9a' : '#2a5bd7', 'opacity=".2"') + Array.from({ length: 6 }, (_, i) => pa(`M${130 + i * 26} 230 q 13 -24 26 0 q -13 20 -26 0`, 'none', `stroke="${a.pat === 'qing' ? '#1e3f9a' : '#3a6ad8'}" stroke-width="3"`)).join('') + rr(100, 120, 200, 8, 0, '#1e3f9a') + rr(100, 290, 200, 8, 0, '#1e3f9a') + '</g>'; return { g, box: { x: 120, y: 80, w: 160, h: 240 }, clip: pa(body, '#000') }; }
    case 'egg': g += el(200, 190, 70, 95, a.cheap ? ctx.lin([[0, '#e86a9a'], [1, '#8a2a5a']]) : ctx.lin([[0, '#5ad6c8'], [1, '#1e6a8a']])) + Array.from({ length: 5 }, (_, i) => pa(`M${135 + i * 30} 110 Q 200 190 ${135 + i * 30} 280`, 'none', `stroke="${a.cheap ? '#e6c86a' : '#f2d36b'}" stroke-width="3"`)).join('') + Array.from({ length: 12 }, (_, i) => ci(150 + (i * 37) % 100, 120 + (i * 53) % 150, 3, '#fff')).join('') + rr(165, 280, 70, 40, 6, metal(ctx, 'gold')); return { g, box: { x: 130, y: 95, w: 140, h: 225 } };
    case 'icon': g += rr(110, 70, 180, 250, 6, metal(ctx, 'gold')) + rr(125, 85, 150, 220, 4, '#3a1a10') + ci(200, 140, 34, metal(ctx, 'gold')) + ci(200, 145, 22, '#d9b48a') + pa('M160 300 L 175 180 L 225 180 L 240 300Z', '#5a1a2a'); return { g, box: { x: 110, y: 70, w: 180, h: 250 } };
    case 'badge': g += pa('M200 120 L 280 170 L 250 280 L 150 280 L 120 170Z', '#c8102e') + pa('M200 140 L 260 178 L 238 262 L 162 262 L 140 178Z', metal(ctx, 'gold')) + tx(200, 215, '★', 46, '#c8102e'); return { g, box: { x: 120, y: 120, w: 160, h: 160 } };
    case 'typewriter': g += pa('M90 230 L 310 230 L 330 300 L 70 300Z', '#1c1c1c') + rr(110, 180, 180, 50, 10, '#2a2a2a') + rr(80, 170, 240, 16, 8, '#3a3a3a') + rr(160, 120, 80, 60, 2, '#f4f0e6'); for (let r2 = 0; r2 < 3; r2++) for (let k = 0; k < 10; k++) g += ci(110 + k * 20 + r2 * 6, 248 + r2 * 16, 6, '#e8e2cf'); return { g, box: { x: 70, y: 120, w: 260, h: 180 } };
    case 'gramophone': g += rr(110, 240, 160, 80, 6, ctx.lin([[0, '#8a5a3a'], [1, '#4a2a1a']])) + el(190, 238, 70, 10, '#111') + pa('M230 230 L 240 160 Q 250 80 340 60 Q 320 140 250 165Z', brass) + ln(225, 235, 240, 160, '#c9a227', 6); return { g, box: { x: 110, y: 60, w: 230, h: 260 } };
    case 'pocketwatch': g += ci(200, 220, 80, silver) + ci(200, 220, 66, '#f4f1e8') + Array.from({ length: 12 }, (_, i) => { const an = (i / 12) * Math.PI * 2; return tx(200 + Math.cos(an) * 52, 225 + Math.sin(an) * 52, String(((i + 2) % 12) + 1), 9, '#222', 'font-family="Georgia,serif"'); }).join('') + ln(200, 220, 180, 195, '#222', 3) + ln(200, 220, 228, 205, '#222', 2) + rr(190, 128, 20, 16, 4, silver) + ci(200, 120, 10, 'none', `stroke="${silver}" stroke-width="5"`) + pa('M200 110 Q 280 60 330 120', 'none', `stroke="${silver}" stroke-width="3" stroke-dasharray="4 2"`); return { g, box: { x: 120, y: 110, w: 160, h: 190 } };
    case 'mantel': g += pa('M110 300 L 290 300 L 270 150 Q 200 90 130 150Z', ctx.lin([[0, '#c9a23a'], [1, '#6a4a10']])) + ci(200, 200, 44, '#f4f1e8') + ln(200, 200, 200, 172, '#222', 3) + ln(200, 200, 222, 210, '#222', 2) + rr(100, 300, 200, 20, 4, '#5a3a10'); return { g, box: { x: 100, y: 110, w: 200, h: 210 } };
    case 'carpet': g += rr(60, 100, 280, 200, 4, '#7a1f2a') + rr(75, 115, 250, 170, 2, 'none', 'stroke="#d8b46a" stroke-width="6"') + pa('M200 140 L 260 200 L 200 260 L 140 200Z', '#1e3f6a', 'stroke="#d8b46a" stroke-width="3"') + rr(85, 125, 230, 150, 0, ctx.pat(16, 16, ci(8, 8, 2, '#d8b46a')), 'opacity=".5"'); for (let i = 0; i < 20; i++) g += ln(60 + i * 14.5, 300, 60 + i * 14.5, 315, '#e8dcc0', 2); return { g, box: { x: 60, y: 100, w: 280, h: 200 } };
    case 'spoons': for (let i = 0; i < 6; i++) g += `<g transform="rotate(${-30 + i * 12} 200 330)">` + el(200, 150, 18, 28, silver) + rr(196, 175, 8, 150, 4, silver) + '</g>'; return { g, box: { x: 110, y: 110, w: 180, h: 220 } };
    case 'radio': g += rr(80, 120, 240, 180, 14, ctx.lin([[0, '#9a6a3a'], [1, '#5a3a1a']])) + rr(100, 140, 200, 90, 6, ctx.pat(6, 6, rr(0, 0, 6, 6, 0, '#e8dcc0') + rr(0, 0, 3, 6, 0, '#cfc2a2'))) + rr(100, 240, 200, 26, 4, '#f4ead0') + ln(120, 253, 280, 253, '#5a3a1a', 1) + ci(130, 285, 10, '#2a1a10') + ci(270, 285, 10, '#2a1a10'); return { g, box: { x: 80, y: 120, w: 240, h: 180 } };
    case 'globe': g += ci(200, 170, 80, ctx.lin([[0, '#8fc3ea'], [1, '#3a6aa8']])) + pa('M160 130 q 20 -10 40 10 q 10 30 -20 40 q -30 -20 -20 -50Z M220 190 q 30 0 30 30 q -20 20 -40 0Z', '#c9b88a') + pa('M200 90 A 80 80 0 0 1 200 250', 'none', 'stroke="#c9a227" stroke-width="5"') + rr(195, 250, 10, 50, 2, '#5a3a1a') + rr(160, 300, 80, 12, 4, '#5a3a1a'); return { g, box: { x: 120, y: 90, w: 160, h: 222 } };
    case 'candle': g += rr(190, 140, 20, 70, 4, '#f6f2e0') + pa('M200 120 q 8 10 0 20 q -8 -10 0 -20Z', '#ffb02e') + pa('M170 210 L 230 210 L 215 230 L 210 300 L 240 320 L 160 320 L 190 300 L 185 230Z', brass); return { g, box: { x: 160, y: 120, w: 80, h: 200 } };
    case 'chess': g += pa('M60 260 L 200 190 L 340 260 L 200 330Z', ctx.pat(20, 20, rr(0, 0, 20, 20, 0, '#d8b48a') + rr(0, 0, 10, 10, 0, '#5a3a1a') + rr(10, 10, 10, 10, 0, '#5a3a1a'))); for (let i = 0; i < 6; i++) g += rr(140 + i * 22, 210 - (i % 2) * 8, 12, 26, 4, i % 2 ? '#f4ead0' : '#2a1a10') + ci(146 + i * 22, 206 - (i % 2) * 8, 6, i % 2 ? '#f4ead0' : '#2a1a10'); return { g, box: { x: 60, y: 190, w: 280, h: 140 } };
    case 'chest': g += rr(80, 170, 240, 130, 6, ctx.lin([[0, '#8a5a2a'], [1, '#4a2a10']])) + pa('M80 170 Q 200 100 320 170Z', '#7a4a1a') + rr(80, 200, 240, 10, 0, '#3a3a3a') + rr(80, 260, 240, 10, 0, '#3a3a3a') + rr(190, 190, 20, 30, 3, brass); return { g, box: { x: 80, y: 120, w: 240, h: 180 } };
    case 'chair': g += pa('M160 90 Q 200 60 240 90 L 240 200', 'none', 'stroke="#3a1a0a" stroke-width="10"') + pa('M160 90 L 160 200', 'none', 'stroke="#3a1a0a" stroke-width="10"') + el(200, 205, 60, 16, '#5a2a1a') + ln(150, 210, 140, 330, '#3a1a0a', 8) + ln(250, 210, 260, 330, '#3a1a0a', 8) + ci(200, 280, 40, 'none', 'stroke="#3a1a0a" stroke-width="5"'); return { g, box: { x: 140, y: 70, w: 120, h: 260 } };
    case 'rotary': g += pa('M110 300 L 130 200 L 270 200 L 290 300Z', '#1c1c1c') + ci(200, 250, 40, '#2a2a2a') + Array.from({ length: 10 }, (_, i) => { const an = (i / 10) * Math.PI * 1.6 + 0.9; return ci(200 + Math.cos(an) * 28, 250 + Math.sin(an) * 28, 6, '#f4f4f4'); }).join('') + pa('M110 190 Q 110 150 140 150 L 260 150 Q 290 150 290 190 L 270 196 L 130 196Z', '#1c1c1c'); return { g, box: { x: 110, y: 150, w: 180, h: 150 } };
    case 'sword': g += pa('M80 300 Q 220 200 340 80 L 345 86 Q 228 210 88 308Z', silver) + rr(70, 290, 34, 14, 4, '#d4af37', 'transform="rotate(-40 87 297)"') + pa('M40 340 L 80 300 L 88 308 L 48 348Z', a.cheap ? '#333' : '#1a1a3a'); return { g, box: { x: 40, y: 80, w: 305, h: 268 } };
    default: g += rr(130, 130, 140, 140, 10, brass); return { g, box: { x: 130, y: 130, w: 140, h: 140 } };
  }
}

// ---------------------------------------------------------------- art (paintings)
function painting(ctx, x, y, w, h, style) {
  const r = new RNG(ctx.it.m + ctx.it.seed);
  let g = '';
  const P = (cs) => r.pick(cs);
  switch (style) {
    case 'sea': g += rr(x, y, w, h, 0, ctx.lin([[0, '#f2d0a0'], [0.5, '#c97a4a'], [1, '#2a3a5a']])) + pa(`M${x} ${y + h * 0.6} Q ${x + w * 0.3} ${y + h * 0.45} ${x + w * 0.5} ${y + h * 0.62} T ${x + w} ${y + h * 0.55} L ${x + w} ${y + h} L ${x} ${y + h}Z`, '#1a3a5a') + Array.from({ length: 6 }, (_, i) => pa(`M${x + i * w / 6} ${y + h * 0.7} q 15 -12 30 0`, 'none', 'stroke="#e8f0ff" stroke-width="3" opacity=".6"')).join('') + ci(x + w * 0.7, y + h * 0.3, h * 0.08, '#fff6c8', 'opacity=".9"'); break;
    case 'landscape': case 'impress': g += rr(x, y, w, h, 0, ctx.lin([[0, '#a7cfe8'], [1, '#e8f0d8']])) + pa(`M${x} ${y + h * 0.65} Q ${x + w * 0.4} ${y + h * 0.45} ${x + w} ${y + h * 0.6} L ${x + w} ${y + h} L ${x} ${y + h}Z`, '#6a9a4a'); if (style === 'impress') for (let i = 0; i < 90; i++) g += el(x + r.float(0, w), y + r.float(h * 0.4, h), r.float(3, 7), r.float(1.5, 3), P(['#f2a0c8', '#a8d8a0', '#5a8aa8', '#f4e0a0', '#ffffff']), 'opacity=".75"'); else g += rr(x + w * 0.6, y + h * 0.5, 10, h * 0.2, 0, '#5a3a1a') + ci(x + w * 0.6 + 5, y + h * 0.48, 22, '#3a6a2a'); break;
    case 'still': g += rr(x, y, w, h, 0, '#3a2a1a') + rr(x, y + h * 0.7, w, h * 0.3, 0, '#5a4a3a') + ci(x + w * 0.35, y + h * 0.65, 22, '#c8102e') + ci(x + w * 0.55, y + h * 0.66, 20, '#f2c218') + el(x + w * 0.45, y + h * 0.5, 20, 34, '#4a6a3a'); break;
    case 'abstract': case 'graffiti': for (let i = 0; i < 14; i++) g += pa(`M${x + r.float(0, w)} ${y + r.float(0, h)} Q ${x + r.float(0, w)} ${y + r.float(0, h)} ${x + r.float(0, w)} ${y + r.float(0, h)}`, 'none', `stroke="${P(['#ff2bd6', '#2bf2ff', '#f2c218', '#111', '#c8102e', '#2a5bd7'])}" stroke-width="${r.int(4, 16)}" stroke-linecap="round" opacity=".85"`); g = rr(x, y, w, h, 0, style === 'graffiti' ? '#2a2a2a' : '#f4f0e6') + g; break;
    case 'swirl': g += rr(x, y, w, h, 0, '#1a2a6a'); for (let i = 0; i < 12; i++) g += pa(`M${x + r.float(0, w)} ${y + r.float(0, h * 0.6)} q 20 -20 40 0 t 40 0`, 'none', `stroke="${P(['#f2d36b', '#8fc3ea', '#e8f0ff'])}" stroke-width="5" opacity=".8"`); g += ci(x + w * 0.8, y + h * 0.2, h * 0.08, '#f2d36b') + pa(`M${x + w * 0.15} ${y + h} Q ${x + w * 0.1} ${y + h * 0.4} ${x + w * 0.2} ${y + h * 0.2} Q ${x + w * 0.25} ${y + h * 0.5} ${x + w * 0.28} ${y + h}Z`, '#0a1a1a'); break;
    case 'cubist': for (let i = 0; i < 16; i++) { const px = x + r.float(0, w), py = y + r.float(0, h); g += pa(`M${px} ${py} l${r.int(-60, 60)} ${r.int(-60, 60)} l${r.int(-60, 60)} ${r.int(-30, 60)}Z`, P(['#8a6a4a', '#c9a27a', '#5a4a3a', '#a8b8c8', '#e8dcc0']), 'opacity=".9"'); } g = rr(x, y, w, h, 0, '#b8a888') + g; break;
    case 'supremat': g += rr(x, y, w, h, 0, '#f4f0e6') + rr(x + w * 0.2, y + h * 0.2, w * 0.4, h * 0.4, 0, '#111', `transform="rotate(12 ${x + w / 2} ${y + h / 2})"`) + rr(x + w * 0.5, y + h * 0.55, w * 0.35, 14, 0, '#c8102e', `transform="rotate(-25 ${x + w / 2} ${y + h / 2})"`) + ci(x + w * 0.75, y + h * 0.25, 14, '#2a5bd7'); break;
    case 'fields': g += rr(x, y, w, h, 0, '#c84a1a') + rr(x + 10, y + 10, w - 20, h * 0.45, 6, '#f28a2a', 'opacity=".9"') + rr(x + 10, y + h * 0.55, w - 20, h * 0.38, 6, '#8a1a1a', 'opacity=".9"'); break;
    case 'neo': g += rr(x, y, w, h, 0, '#f2c218') + pa(`M${x + w * 0.3} ${y + h * 0.3} l15 -30 l15 25 l15 -30 l15 30 l15 -25 l10 30Z`, '#111', 'stroke="#111" stroke-width="3" fill="none"') + ci(x + w * 0.5, y + h * 0.6, 34, 'none', 'stroke="#111" stroke-width="5"') + ci(x + w * 0.44, y + h * 0.58, 6, '#111') + ci(x + w * 0.56, y + h * 0.58, 6, '#111') + tx(x + w * 0.5, y + h * 0.9, 'SAMO©', 14, '#111', 'font-weight="900"'); break;
    case 'portrait': case 'social': g += rr(x, y, w, h, 0, style === 'social' ? '#8a2a1a' : '#2a6a5a') + el(x + w / 2, y + h * 0.42, w * 0.18, h * 0.2, '#d9a77a') + pa(`M${x + w * 0.2} ${y + h} Q ${x + w / 2} ${y + h * 0.55} ${x + w * 0.8} ${y + h}Z`, style === 'social' ? '#3a4a6a' : '#c8102e') + pa(`M${x + w * 0.32} ${y + h * 0.35} Q ${x + w / 2} ${y + h * 0.1} ${x + w * 0.68} ${y + h * 0.35}`, '#2a1a10'); break;
    case 'pop': g += rr(x, y, w, h, 0, '#f4f4f4') + rr(x + w * 0.3, y + h * 0.15, w * 0.4, h * 0.7, 6, '#c8102e') + rr(x + w * 0.3, y + h * 0.45, w * 0.4, h * 0.2, 0, '#f4f4f4') + tx(x + w / 2, y + h * 0.33, 'SOUP', 14, '#fff', 'font-weight="900"') + tx(x + w / 2, y + h * 0.58, 'TOMATO', 10, '#c8102e', 'font-weight="900"'); break;
    case 'popface': { const cs = ['#ff5ca8', '#2bd6ff', '#f2c218', '#7a2bff']; for (let i = 0; i < 4; i++) { const qx = x + (i % 2) * w / 2, qy = y + Math.floor(i / 2) * h / 2; g += rr(qx, qy, w / 2, h / 2, 0, cs[i]) + el(qx + w / 4, qy + h / 4, w * 0.12, h * 0.16, '#f2c218') + pa(`M${qx + w * 0.12} ${qy + h * 0.2} q ${w * 0.13} -${h * 0.15} ${w * 0.26} 0`, '#f2e08a'); } break; }
    case 'stencil': g += rr(x, y, w, h, 0, '#e8e4dc') + ci(x + w * 0.62, y + h * 0.3, 22, '#c8102e') + ln(x + w * 0.62, y + h * 0.3 + 22, x + w * 0.45, y + h * 0.62, '#111', 1) + ci(x + w * 0.35, y + h * 0.55, 12, '#111') + pa(`M${x + w * 0.28} ${y + h * 0.9} L ${x + w * 0.32} ${y + h * 0.62} L ${x + w * 0.4} ${y + h * 0.62} L ${x + w * 0.44} ${y + h * 0.9}Z`, '#111'); break;
    case 'dots': g += rr(x, y, w, h, 0, '#f2c218') + el(x + w / 2, y + h * 0.6, w * 0.35, h * 0.3, '#f2c218', 'stroke="#111" stroke-width="3"'); for (let i = 0; i < 40; i++) g += ci(x + r.float(w * 0.18, w * 0.82), y + r.float(h * 0.35, h * 0.88), r.float(3, 8), '#111'); break;
    case 'spots': g += rr(x, y, w, h, 0, '#f6f6f2'); for (let i = 0; i < 5; i++) for (let k = 0; k < 4; k++) g += ci(x + 20 + i * (w - 40) / 4, y + 20 + k * (h - 40) / 3, 10, P(['#c8102e', '#2a5bd7', '#2fa36b', '#f2c218', '#ff7a1a', '#7a2bff', '#ff5ca8'])); break;
    case 'flowers': g += rr(x, y, w, h, 0, '#f4f4f4'); for (let i = 0; i < 9; i++) { const fx = x + 25 + (i % 3) * (w - 50) / 2, fy = y + 30 + Math.floor(i / 3) * (h - 60) / 2; for (let k = 0; k < 8; k++) { const an = (k / 8) * Math.PI * 2; g += ci(fx + Math.cos(an) * 12, fy + Math.sin(an) * 12, 8, P(['#ff5ca8', '#2bd6ff', '#f2c218', '#7a2bff', '#2fa36b'])); } g += ci(fx, fy, 8, '#f2e08a') + ci(fx - 3, fy - 2, 1.5, '#111') + ci(fx + 3, fy - 2, 1.5, '#111'); } break;
    case 'geometric': g += rr(x, y, w, h, 0, '#f4f0e6') + rr(x + 10, y + 10, w * 0.5, h * 0.4, 0, '#c8102e') + rr(x + w * 0.6, y + h * 0.5, w * 0.35, h * 0.45, 0, '#2a5bd7') + rr(x + 10, y + h * 0.75, w * 0.25, h * 0.2, 0, '#f2c218') + ln(x + w * 0.55, y, x + w * 0.55, y + h, '#111', 6) + ln(x, y + h * 0.45, x + w, y + h * 0.45, '#111', 6); break;
    default: g += rr(x, y, w, h, 0, '#ccc');
  }
  return g;
}
function artDraw(ctx) {
  const { a } = ctx;
  let g = '';
  if (a.t === 'sculpt') {
    g += rr(150, 280, 100, 70, 2, '#f4f4f2') + rr(140, 270, 120, 12, 2, '#e8e8e6');
    if (a.style === 'balloon') g += el(170, 210, 34, 22, '#2a8af2') + el(240, 210, 26, 20, '#2a8af2') + ci(260, 175, 18, '#2a8af2') + rr(160, 225, 12, 45, 6, '#2a8af2') + rr(236, 225, 12, 45, 6, '#2a8af2') + el(185, 205, 8, 4, '#fff', 'opacity=".6"');
    else g += ci(200, 170, 40, metal(ctx, 'brass')) + pa('M150 270 Q 150 210 200 205 Q 250 210 250 270Z', metal(ctx, 'brass'));
    return { g, box: { x: 140, y: 130, w: 120, h: 220 } };
  }
  const print = a.t === 'print';
  const fx = 70, fy = 70, fw = 260, fh = 260;
  const frameC = print ? '#1c1c1c' : ctx.rng.pick([metal(ctx, 'gold'), '#5a3a1a', '#1c1c1c', metal(ctx, 'gold')]);
  g += rr(fx - 4, fy + 6, fw + 8, fh + 8, 2, '#000', 'opacity=".25"') + rr(fx, fy, fw, fh, 2, frameC);
  if (print) g += rr(fx + 8, fy + 8, fw - 16, fh - 16, 0, '#f8f8f6') + painting(ctx, fx + 34, fy + 34, fw - 68, fh - 68, a.style) + tx(fx + fw - 40, fy + fh - 16, `${(ctx.it.seed % 100) + 1}/100`, 8, '#777');
  else g += painting(ctx, fx + 16, fy + 16, fw - 32, fh - 32, a.style) + rr(fx + 16, fy + 16, fw - 32, fh - 32, 0, 'none', 'stroke="#000" stroke-opacity=".25"');
  return { g, box: { x: fx + 16, y: fy + 16, w: fw - 32, h: fh - 32 } };
}

// ---------------------------------------------------------------- collectibles
function collectibles(ctx) {
  const { a } = ctx;
  let g = '';
  switch (a.t) {
    case 'coin': { const m = metal(ctx, a.metal === 'gold' ? 'gold' : a.metal === 'brass' ? 'brass' : a.metal === 'nickel' ? 'silver' : 'silver'); g += ci(200, 200, 110, m) + ci(200, 200, 98, 'none', 'stroke="#fff" stroke-opacity=".35" stroke-width="3"'); if (a.metal === 'bimetal') g += ci(200, 200, 70, metal(ctx, 'brass')); g += pa('M170 250 Q 160 180 200 150 Q 240 160 230 200 Q 245 230 230 250Z', '#000', 'opacity=".12"') + tx(200, 120, a.txt || '', 16, '#000', 'opacity=".35" font-weight="800" letter-spacing="2"') + tx(200, 290, String(ctx.m.year), 16, '#000', 'opacity=".35" font-weight="800"'); return { g, box: { x: 90, y: 90, w: 220, h: 220 } }; }
    case 'banknote': g += rr(60, 140, 280, 130, 6, shade(a.c, 0.4)) + rr(70, 150, 260, 110, 4, 'none', `stroke="${a.c}" stroke-width="2"`) + ci(270, 205, 34, shade(a.c, 0.2)) + tx(110, 185, a.txt || '', 26, a.c, 'font-weight="900"') + tx(290, 255, a.txt || '', 14, a.c, 'font-weight="900"') + rr(0, 0, 400, 400, 0, ctx.pat(8, 8, ln(0, 8, 8, 0, a.c, 0.4)), `clip-path="${ctx.clip(rr(60, 140, 280, 130, 6, '#000'))}" opacity=".35"`); return { g, box: { x: 60, y: 140, w: 280, h: 130 } };
    case 'stamp': { let perf = ''; for (let i = 0; i < 14; i++) perf += ci(130 + i * 10, 120, 4, '#e8e4dc') + ci(130 + i * 10, 300, 4, '#e8e4dc'); for (let i = 0; i < 18; i++) perf += ci(125, 125 + i * 10, 4, '#e8e4dc') + ci(275, 125 + i * 10, 4, '#e8e4dc'); g += rr(125, 120, 150, 180, 0, '#f6f2e6') + rr(140, 135, 120, 150, 0, a.c) + (a.plane ? pa('M160 240 l40 -8 l40 8 l-40 4Z M195 230 h10 v20 h-10z', '#2a5bd7') : a.rocket ? pa('M200 160 l12 40 h-24z M192 200 h16 v40 h-16z', '#f4f4f4') : el(200, 205, 30, 40, shade(a.c, 0.35))) + perf; return { g, box: { x: 125, y: 120, w: 150, h: 180 } }; }
    case 'album': g += rr(90, 100, 220, 220, 8, a.c || '#3a2a1a') + rr(98, 100, 10, 220, 2, '#000', 'opacity=".3"') + tx(210, 215, 'STAMPS', 18, '#d4af37', 'font-weight="800" letter-spacing="3"'); return { g, box: { x: 90, y: 100, w: 220, h: 220 } };
    case 'vinyl': g += ci(250, 200, 100, ctx.rad([[0, '#2a2a2a'], [1, '#050505']])) + Array.from({ length: 8 }, (_, i) => ci(250, 200, 30 + i * 9, 'none', 'stroke="#333" stroke-width="1"')).join('') + ci(250, 200, 26, a.label || '#c8102e') + ci(250, 200, 3, '#ddd') + rr(60, 100, 200, 200, 2, a.c || '#f2ead8') + (a.prism ? pa('M160 160 L 200 230 L 120 230Z', 'none', 'stroke="#fff" stroke-width="3"') + pa('M70 200 L 140 195', 'none', 'stroke="#fff" stroke-width="2"') + pa('M180 200 L 260 180 L 260 220Z', ctx.lin([[0, '#c8102e'], [0.5, '#f2c218'], [1, '#2a5bd7']])) : ci(160, 200, 50, shade(a.c || '#f2ead8', -0.25)) + tx(160, 280, ctx.m.brand, 12, '#333', 'font-weight="700"')); return { g, box: { x: 60, y: 100, w: 290, h: 200 } };
    case 'ball': g += ci(200, 200, 100, '#f4f4f4') + Array.from({ length: 6 }, (_, i) => { const an = (i / 6) * Math.PI * 2; return pa(`M${200 + Math.cos(an) * 60} ${200 + Math.sin(an) * 60} l10 -14 l16 4 l2 16 l-14 8Z`, '#111'); }).join('') + pa('M160 220 c 10 -20 20 10 30 -10 s 20 15 40 -5', 'none', 'stroke="#1e3f9a" stroke-width="3"'); return { g, box: { x: 100, y: 100, w: 200, h: 200 } };
    case 'jersey': g += pa('M140 80 Q 200 100 260 80 L 320 110 L 300 170 L 280 160 L 280 330 L 120 330 L 120 160 L 100 170 L 80 110Z', a.c || '#f2c218') + tx(200, 250, String(a.n || 23), 70, '#5a2a8a', 'font-weight="900"') + pa('M150 170 c 15 -15 25 10 40 -5 s 25 10 50 -10', 'none', 'stroke="#111" stroke-width="3"'); return { g, box: { x: 80, y: 80, w: 240, h: 250 } };
    case 'baseball': g += ci(200, 200, 90, '#f6f2e6') + pa('M140 130 Q 180 200 140 270', 'none', 'stroke="#c8102e" stroke-width="3" stroke-dasharray="4 5"') + pa('M260 130 Q 220 200 260 270', 'none', 'stroke="#c8102e" stroke-width="3" stroke-dasharray="4 5"') + pa('M165 200 c 10 -15 20 8 30 -6 s 15 10 30 -4', 'none', 'stroke="#1e3f9a" stroke-width="2.5"'); return { g, box: { x: 110, y: 110, w: 180, h: 180 } };
    case 'rock': g += pa('M120 230 Q 110 160 170 140 Q 240 120 280 170 Q 310 220 270 260 Q 220 290 160 275 Q 125 265 120 230Z', a.c || '#4a4a4a') + Array.from({ length: 8 }, (_, i) => el(150 + (i * 31) % 120, 170 + (i * 47) % 80, 10, 6, '#000', 'opacity=".2"')).join('') + (a.graffiti ? pa('M150 200 q 20 -20 40 0 t 40 0', 'none', 'stroke="#ff2bd6" stroke-width="6"') + pa('M160 230 q 20 -10 50 5', 'none', 'stroke="#2bd6ff" stroke-width="5"') : ''); return { g, box: { x: 115, y: 130, w: 190, h: 150 } };
    case 'fossil': g += ci(200, 210, 90, '#b8a888'); for (let i = 0; i < 26; i++) { const an = i * 0.55, r2 = 6 + i * 3.2; g += ln(200 + Math.cos(an) * r2, 210 + Math.sin(an) * r2, 200 + Math.cos(an) * (r2 + 8), 210 + Math.sin(an) * (r2 + 8), '#7a6a4a', 2); } return { g, box: { x: 110, y: 120, w: 180, h: 180 } };
    case 'tooth': g += pa('M170 300 Q 160 200 200 110 Q 230 180 240 300Z', ctx.lin([[0, '#e8dcc0'], [1, '#8a7a5a']])) + Array.from({ length: 10 }, (_, i) => ln(201 + i * 1.5, 120 + i * 18, 206 + i * 1.5, 122 + i * 18, '#6a5a3a', 1)).join(''); return { g, box: { x: 160, y: 110, w: 80, h: 190 } };
    case 'wrappers': for (let i = 0; i < 8; i++) g += rr(110 + i * 8, 130 + i * 10, 150, 90, 4, ['#ff5ca8', '#f2c218', '#2bd6ff', '#fff'][i % 4], `transform="rotate(${-10 + i * 3} 200 200)"`) + tx(180 + i * 8, 180 + i * 10, 'Love is…', 12, '#c8102e', `font-style="italic" transform="rotate(${-10 + i * 3} 200 200)"`); return { g, box: { x: 110, y: 130, w: 220, h: 170 } };
    case 'pogs': for (let i = 0; i < 7; i++) g += el(200, 260 - i * 14, 70, 22, ['#f2c218', '#c8102e', '#2a5bd7', '#2fa36b'][i % 4], 'stroke="#111" stroke-width="2"'); g += el(200, 162, 70, 22, '#ffb02e', 'stroke="#111" stroke-width="2"') + tx(200, 168, 'TAZOS', 14, '#111', 'font-weight="900"'); return { g, box: { x: 130, y: 140, w: 140, h: 142 } };
    case 'kinder': g += el(150, 220, 50, 66, '#f2c218') + el(150, 200, 50, 30, '#f6d65a') + ci(260, 230, 40, '#6a8aa8') + ci(245, 220, 6, '#111') + ci(275, 220, 6, '#111') + el(260, 245, 14, 8, '#d8d8e8'); return { g, box: { x: 100, y: 154, w: 200, h: 132 } };
    case 'poster': g += rr(100, 50, 200, 300, 2, a.c || '#1c1c1c') + ci(200, 160, 50, '#f2c218', 'opacity=".9"') + pa('M130 300 L 200 180 L 270 300Z', '#c8102e') + tx(200, 90, 'STAR WARZ', 22, '#f2c218', 'font-weight="900"'); return { g, box: { x: 100, y: 50, w: 200, h: 300 } };
    case 'pins': g += rr(80, 120, 240, 180, 6, '#2a3a5a'); for (let i = 0; i < 6; i++) g += ci(120 + (i % 3) * 80, 170 + Math.floor(i / 3) * 80, 26, ['#c8102e', '#f2c218', '#2a5bd7'][i % 3], `stroke="${'#d4af37'}" stroke-width="3"`) + tx(120 + (i % 3) * 80, 178 + Math.floor(i / 3) * 80, '80', 14, '#fff', 'font-weight="900"'); return { g, box: { x: 80, y: 120, w: 240, h: 180 } };
    case 'saber': g += rr(80, 260, 70, 22, 6, metal(ctx, 'silver'), 'transform="rotate(-35 115 271)"') + ln(140, 235, 330, 100, '#5af0ff', 14, 'opacity=".55"') + ln(140, 235, 330, 100, '#e8ffff', 6); return { g, box: { x: 80, y: 100, w: 250, h: 190 } };
    case 'ticket': g += rr(80, 150, 240, 100, 8, '#f2ead8') + rr(250, 150, 2, 100, 0, '#999') + tx(160, 195, 'CONCERT 1980', 16, '#c8102e', 'font-weight="900"') + tx(160, 220, 'ROW 3 · SEAT 14', 10, '#333'); return { g, box: { x: 80, y: 150, w: 240, h: 100 } };
    default: g += ci(200, 200, 80, '#aaa'); return { g, box: { x: 120, y: 120, w: 160, h: 160 } };
  }
}

// ---------------------------------------------------------------- instruments
function instruments(ctx) {
  const { a, it } = ctx;
  const key = it.color;
  const c = colorHex(key);
  const body = key === 'sunburst' ? ctx.rad([[0, '#f2b24a'], [0.6, '#a2471a'], [1, '#2a1208']], 0.5, 0.55, 0.6) : key === 'natural' ? ctx.lin([[0, '#e6c08a'], [1, '#b8864a']], 0, 0, 1, 1) : ctx.lin([[0, shade(c, 0.25)], [1, shade(c, -0.25)]], 0, 0, 1, 1);
  let g = '';
  const neck = (x1, y1, x2, y2, w = 16) => ln(x1, y1, x2, y2, '#6b3f1f', w) + ln(x1, y1, x2, y2, '#3a1f0f', w - 6, 'opacity=".4"');
  switch (a.t) {
    case 'strat': case 'tele': case 'bass': case 'lp': case 'sg': case '335': case 'ural': {
      g += neck(220, 170, 345, 40, a.t === 'bass' ? 14 : 16) + rr(330, 22, 40, 24, 6, '#6b3f1f', 'transform="rotate(-45 350 34)"');
      let bp;
      if (a.t === 'lp') bp = 'M120 330 Q 60 320 70 260 Q 80 220 120 215 Q 130 180 170 175 Q 215 175 225 205 Q 250 230 240 270 Q 235 335 160 340Z';
      else if (a.t === 'tele') bp = 'M110 330 Q 70 310 80 260 Q 85 225 120 220 L 150 190 Q 200 170 225 205 Q 245 240 235 280 Q 225 340 150 342Z';
      else if (a.t === 'sg') bp = 'M120 330 Q 70 310 80 250 L 110 200 L 125 230 L 150 190 L 165 215 Q 200 180 230 220 Q 245 270 230 300 Q 200 345 140 340Z';
      else if (a.t === '335') bp = 'M110 330 Q 50 300 75 240 Q 90 200 130 200 Q 150 170 190 175 Q 240 185 245 240 Q 250 320 160 342Z';
      else if (a.t === 'ural') bp = 'M120 330 Q 70 290 100 240 L 90 200 L 140 215 Q 180 170 215 200 L 250 190 L 235 245 Q 250 320 160 342Z';
      else bp = 'M115 335 Q 60 315 75 255 Q 80 225 100 215 L 95 180 Q 130 195 150 210 Q 180 180 205 175 L 215 200 Q 245 235 235 285 Q 225 340 150 345Z';
      g += pa(bp, body, 'stroke="#000" stroke-opacity=".3" stroke-width="2"');
      if (a.t === 'strat' || a.t === 'bass') g += pa('M120 300 Q 110 250 140 230 L 190 220 Q 215 250 200 300Z', '#f4f4f2', 'opacity=".95"');
      if (a.t === '335') g += pa('M120 260 q 8 -20 0 -40', 'none', 'stroke="#111" stroke-width="5"') + pa('M215 265 q 8 -20 0 -40', 'none', 'stroke="#111" stroke-width="5"');
      const pk = a.t === 'lp' || a.t === 'sg' || a.t === '335' ? 2 : a.t === 'bass' ? 2 : 3;
      for (let i = 0; i < pk; i++) g += rr(150 + i * (pk === 2 ? 34 : 22), 245 + i * (pk === 2 ? -18 : -11), pk === 2 ? 30 : 12, pk === 2 ? 16 : 40, 3, pk === 2 ? '#1c1c1c' : '#f4f4f2', `transform="rotate(-38 ${160 + i * 22} ${260 - i * 11})"`);
      g += rr(110, 290, 40, 10, 3, '#c0c0c0', 'transform="rotate(-38 130 295)"');
      for (let i = 0; i < 6; i++) g += ln(130 + i * 2, 300 - i, 352 + i * 2, 36 - i, '#e8e8e8', 0.6, 'opacity=".7"');
      return { g, box: { x: 65, y: 175, w: 185, h: 170 }, clip: pa(bp, '#000') };
    }
    case 'acoustic': case 'ukulele': {
      const s = a.t === 'ukulele' ? 0.65 : 1;
      g += neck(200, 190 - 60 * s, 200, 40, 18 * s) + rr(200 - 14 * s, 26, 28 * s, 40 * s, 6, '#3a1f0f');
      g += el(200, 300 - 40 * (1 - s), 80 * s, 60 * s, body) + el(200, 220 - 20 * (1 - s), 62 * s, 48 * s, body) + ci(200, 240 - 25 * (1 - s), 22 * s, '#1c1208') + ci(200, 240 - 25 * (1 - s), 28 * s, 'none', 'stroke="#3a2a1a" stroke-width="3"') + rr(180, 300 - 40 * (1 - s), 40 * s, 8, 2, '#2a1a10');
      return { g, box: { x: 200 - 80 * s, y: 170, w: 160 * s, h: 190 * s } };
    }
    case 'violin': g += pa('M200 120 Q 250 125 245 180 Q 230 200 245 220 Q 260 280 200 300 Q 140 280 155 220 Q 170 200 155 180 Q 150 125 200 120Z', body) + ln(200, 120, 200, 40, '#1c1208', 14) + ci(200, 34, 9, '#6b3f1f') + pa('M178 200 q 6 15 0 30 M222 200 q -6 15 0 30', 'none', 'stroke="#1c1208" stroke-width="3"') + rr(190, 260, 20, 14, 2, '#1c1208'); return { g, box: { x: 150, y: 120, w: 100, h: 180 } };
    case 'keys': case 'synth': {
      g += rr(40, 170, 320, 110, 10, a.t === 'synth' ? (key === 'natural' ? ctx.lin([[0, '#c9a27a'], [1, '#6b4a2a']]) : '#2a2b2e') : '#1c1c1c');
      if (a.t === 'synth') for (let i = 0; i < 12; i++) g += ci(70 + i * 22, 192, 6, '#d8dadf');
      for (let i = 0; i < 22; i++) g += rr(52 + i * 13.5, 215, 12, 58, 2, '#f8f8f6');
      for (let i = 0; i < 22; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) g += rr(60 + i * 13.5, 215, 8, 34, 1, '#111');
      return { g, box: { x: 40, y: 170, w: 320, h: 110 } };
    }
    case 'drummachine': g += rr(50, 160, 300, 110, 8, '#d8d4cc'); for (let i = 0; i < 16; i++) g += rr(62 + i * 17.5, 240, 14, 18, 2, ['#c8102e', '#ff7a1a', '#f2c218', '#f4f4f2'][Math.floor(i / 4)]); for (let i = 0; i < 12; i++) g += ci(75 + i * 22, 190, 7, '#1c1c1c'); g += tx(300, 222, 'TR‑808', 12, '#c8102e', 'font-weight="900"'); return { g, box: { x: 50, y: 160, w: 300, h: 110 } };
    case 'sax': g += pa('M230 60 Q 240 120 220 200 Q 205 280 160 300 Q 120 310 125 270 Q 135 250 150 255', 'none', `stroke="${metal(ctx, 'gold')}" stroke-width="28" stroke-linecap="round"`) + el(140, 262, 30, 18, metal(ctx, 'gold')) + Array.from({ length: 6 }, (_, i) => ci(218 + (i % 2) * 8, 110 + i * 25, 6, '#f6e7b0', 'stroke="#9b7420"')).join(''); return { g, box: { x: 110, y: 60, w: 140, h: 250 } };
    case 'drums': g += ci(200, 270, 70, c, 'stroke="#ddd" stroke-width="6"') + ci(200, 270, 50, '#f4f4f2') + el(130, 190, 36, 14, c) + el(270, 190, 36, 14, c) + el(90, 140, 50, 6, metal(ctx, 'gold')) + el(310, 140, 50, 6, metal(ctx, 'gold')) + ln(90, 146, 90, 330, '#aaa', 3) + ln(310, 146, 310, 330, '#aaa', 3); return { g, box: { x: 40, y: 130, w: 320, h: 210 } };
    default: g += rr(120, 120, 160, 160, 10, body); return { g, box: { x: 120, y: 120, w: 160, h: 160 } };
  }
}

// ---------------------------------------------------------------- cars
const PROFILES = {
  sedan:   { pts: [[35, 262], [40, 232], [140, 216], [182, 172], [272, 170], [318, 212], [360, 220], [366, 262]], wf: 98, wr: 300, r: 30, win: [2, 3, 4, 5] },
  boxy:    { pts: [[38, 262], [38, 228], [140, 222], [178, 176], [278, 176], [312, 218], [362, 220], [364, 262]], wf: 100, wr: 296, r: 28, win: [2, 3, 4, 5], sharp: true },
  hatch:   { pts: [[40, 262], [44, 234], [130, 218], [175, 172], [292, 168], [348, 222], [356, 262]], wf: 100, wr: 296, r: 30, win: [2, 3, 4, 5] },
  wagon:   { pts: [[35, 262], [40, 232], [135, 216], [178, 170], [330, 168], [356, 214], [362, 262]], wf: 98, wr: 302, r: 30, win: [2, 3, 4, 5] },
  suv:     { pts: [[40, 258], [44, 222], [128, 206], [168, 148], [326, 146], [354, 196], [360, 258]], wf: 104, wr: 298, r: 38, win: [2, 3, 4, 5], high: 14 },
  jeep:    { pts: [[44, 256], [46, 214], [128, 204], [146, 148], [330, 146], [352, 150], [356, 256]], wf: 106, wr: 300, r: 38, win: [2, 3, 4, 5], high: 16, sharp: true },
  coupe:   { pts: [[35, 262], [40, 238], [145, 222], [195, 176], [255, 174], [330, 214], [362, 222], [366, 262]], wf: 100, wr: 300, r: 30, win: [2, 3, 4, 5] },
  sport:   { pts: [[30, 264], [36, 246], [150, 232], [212, 190], [270, 192], [362, 228], [370, 264]], wf: 96, wr: 304, r: 30, win: [2, 3, 4, 5] },
  sport911:{ pts: [[32, 264], [38, 240], [140, 226], [190, 180], [240, 176], [350, 228], [366, 264]], wf: 98, wr: 300, r: 30, win: [2, 3, 4, 4] },
  super:   { pts: [[26, 266], [34, 252], [160, 236], [222, 194], [262, 194], [364, 230], [372, 266]], wf: 96, wr: 306, r: 30, win: [2, 3, 4, 5] },
  pickup:  { pts: [[40, 258], [44, 220], [128, 206], [160, 152], [238, 150], [246, 202], [362, 202], [364, 258]], wf: 104, wr: 302, r: 36, win: [2, 3, 4, 5], high: 12 },
  van:     { pts: [[40, 258], [42, 222], [70, 196], [98, 130], [356, 128], [362, 258]], wf: 100, wr: 300, r: 32, win: [2, 3, 4, 4], high: 6 },
  classic: { pts: [[30, 262], [34, 236], [140, 222], [178, 182], [262, 180], [310, 220], [368, 226], [372, 262]], wf: 96, wr: 300, r: 28, win: [2, 3, 4, 5] },
  muscle:  { pts: [[30, 262], [34, 236], [160, 224], [200, 182], [262, 180], [316, 218], [368, 222], [372, 262]], wf: 96, wr: 302, r: 31, win: [2, 3, 4, 5] },
  micro:   { pts: [[80, 262], [84, 230], [140, 218], [170, 168], [282, 166], [312, 218], [318, 262]], wf: 128, wr: 272, r: 26, win: [2, 3, 4, 5] },
  beetle:  { pts: [[60, 262], [70, 230], [140, 214], [190, 170], [250, 172], [320, 220], [338, 262]], wf: 112, wr: 288, r: 28, win: [2, 3, 4, 5], round: true },
  roadster:{ pts: [[38, 262], [42, 236], [150, 224], [176, 200], [190, 222], [330, 222], [362, 228], [364, 262]], wf: 100, wr: 298, r: 29, win: [2, 3, 3, 4], open: true },
  limo:    { pts: [[25, 262], [30, 230], [130, 214], [170, 166], [300, 164], [336, 210], [372, 216], [376, 262]], wf: 88, wr: 318, r: 32, win: [2, 3, 4, 5] },
  cyber:   { pts: [[34, 256], [38, 222], [210, 140], [362, 196], [366, 256]], wf: 100, wr: 300, r: 36, win: [1, 2, 2, 3], sharp: true, high: 10 },
};
function smooth(pts, sharp) {
  if (sharp) return 'M' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ');
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += ` Q ${pts[i][0]} ${pts[i][1]} ${mx} ${my}`; }
  const l = pts[pts.length - 1];
  return d + ` L ${l[0]} ${l[1]}`;
}
function wheel(ctx, x, y, r, style, flat) {
  const rim = style === 'black' ? '#2a2a2e' : style === 'gold' ? metal(ctx, 'gold') : metal(ctx, 'silver');
  let g = flat ? el(x, y + r * 0.12, r * 1.08, r * 0.88, '#141414') : ci(x, y, r, '#141414');
  g += ci(x, y, r * 0.66, rim) + ci(x, y, r * 0.62, '#3a3b40', 'opacity=".35"');
  const n = style === 'steel' ? 0 : style === 'multi' ? 10 : 5;
  for (let i = 0; i < n; i++) { const an = (i / n) * Math.PI * 2 + 0.3; g += ln(x + Math.cos(an) * r * 0.18, y + Math.sin(an) * r * 0.18, x + Math.cos(an) * r * 0.58, y + Math.sin(an) * r * 0.58, rim, style === 'multi' ? 2.5 : 6); }
  if (style === 'steel') for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2; g += ci(x + Math.cos(an) * r * 0.4, y + Math.sin(an) * r * 0.4, 2.5, '#666'); }
  return g + ci(x, y, r * 0.16, '#2a2b2e') + ci(x, y, r * 0.08, '#999');
}
function cars(ctx) {
  const { a, it, view } = ctx;
  const P = PROFILES[a.body] || PROFILES.sedan;
  const c = ctx.c;
  const lowered = it.tune === 'lowered';
  const ground = 300;
  const r = P.r;
  const cy = ground - r + (lowered ? 4 : 0);
  const lift = (P.high || 0) - (lowered ? 6 : 0);
  const pts = P.pts.map(([x, y]) => [x, y - lift]);
  const bottom = ground - r * 0.55 - lift * 0.4;
  let top = smooth(pts, P.sharp);
  const first = pts[0], last = pts[pts.length - 1];
  const arch = (x) => `L ${x + r + 6} ${bottom} A ${r + 6} ${r + 6} 0 0 0 ${x - r - 6} ${bottom}`;
  const bodyPath = `${top} L ${last[0]} ${bottom} ${arch(P.wr)} ${arch(P.wf)} L ${first[0]} ${bottom} Z`;
  const paint = ctx.lin([[0, shade(c, 0.28)], [0.45, c], [1, shade(c, -0.35)]], 0, 0, 0, 1);
  let g = '';
  const flip = view === 'back';
  // body
  g += pa(bodyPath, it.tune === 'wrap' ? ctx.lin([[0, '#7a2bff'], [1, '#2bd6ff']], 0, 0, 1, 0) : paint);
  if (a.twotone) g += `<g clip-path="${ctx.clip(pa(bodyPath, '#000'))}">` + rr(0, bottom - 30, 400, 60, 0, colorHex(a.twotone)) + '</g>';
  // windows
  const [i1, i2, i3, i4] = P.win;
  const w0 = pts[i1], w1 = pts[i2], w2 = pts[i3], w3 = pts[Math.min(i4, pts.length - 1)];
  if (!P.open) {
    const inset = 6;
    const winPath = `M ${w0[0] + inset * 1.6} ${w0[1] - 2} L ${w1[0] + inset} ${w1[1] + inset} L ${w2[0] - inset * 0.6} ${w2[1] + inset} L ${w3[0] - inset * 1.4} ${w3[1] - 2} Z`;
    g += pa(winPath, it.tune === 'tint' ? '#0b0d12' : ctx.lin([[0, '#9fb6c9'], [1, '#2a3440']], 0, 0, 0, 1), `stroke="${shade(c, -0.5)}" stroke-width="2"`);
    const bx = (w1[0] + w2[0]) / 2 + 4;
    g += ln(bx, w1[1] + 6, bx - 4, w0[1], shade(c, -0.45), 6);
    g += pa(`M ${w1[0] + 14} ${w1[1] + 10} L ${w1[0] + 40} ${w1[1] + 10} L ${w0[0] + 30} ${w0[1] - 6}Z`, '#fff', 'opacity=".22"');
  } else g += ln(w0[0] + 10, w0[1], w1[0] + 6, w1[1] + 6, '#9fb6c9', 4);
  // details: shoulder highlight, door lines, handles, mirror, lights
  g += pa(smooth(pts.map(([x, y]) => [x, y + 16]), P.sharp), 'none', 'stroke="#fff" stroke-width="2" opacity=".25"');
  const doorX = (P.wf + P.wr) / 2;
  g += ln(doorX, (w0[1] + bottom) / 2 - 26, doorX, bottom - 4, shade(c, -0.4), 1.5) + ln(P.wf + r + 18, w0[1] + 2, P.wf + r + 22, bottom - 6, shade(c, -0.4), 1.5);
  if (a.body !== 'van' && a.body !== 'cyber') g += ln(P.wr - r - 12, w3[1] + 4, P.wr - r - 14, bottom - 6, shade(c, -0.4), 1.5);
  g += rr(doorX - 34, w0[1] + 16, 16, 4, 2, shade(c, -0.3)) + rr(doorX + 18, w0[1] + 16, 16, 4, 2, shade(c, -0.3));
  g += pa(`M ${w0[0] + 4} ${w0[1] - 4} l -12 -2 l -2 10 l 14 -2Z`, shade(c, -0.25));
  // headlight / taillight / bumpers
  const hl = a.lights === 'round' || a.lights === 'round2' ? ci(first[0] + 12, first[1] + 16, 9, '#fff8d8', 'stroke="#999" stroke-width="2"') : rr(first[0] + 2, first[1] + 8, 26, 10, 4, '#fff8d8', 'stroke="#888" stroke-width="1.5"');
  g += hl + rr(last[0] - 18, last[1] + 6, 18, 12, 3, '#c8102e');
  g += rr(first[0] - 4, bottom - 18, 44, 16, 6, a.chrome ? metal(ctx, 'silver') : shade(c, -0.55)) + rr(last[0] - 36, bottom - 18, 42, 16, 6, a.chrome ? metal(ctx, 'silver') : shade(c, -0.55));
  if (a.stripes) g += `<g clip-path="${ctx.clip(pa(bodyPath, '#000'))}">` + rr(0, bottom - 34, 400, 6, 0, '#fff', 'opacity=".85"') + rr(0, bottom - 25, 400, 6, 0, '#fff', 'opacity=".85"') + '</g>';
  if (a.spoiler || it.tune === 'spoiler') g += rr(last[0] - 40, last[1] - 8, 40, 6, 2, shade(c, -0.3));
  if (a.wing) g += rr(last[0] - 50, last[1] - 26, 52, 7, 2, '#1c1c1c') + ln(last[0] - 40, last[1] - 20, last[0] - 36, last[1] + 2, '#1c1c1c', 4) + ln(last[0] - 12, last[1] - 20, last[0] - 10, last[1] + 2, '#1c1c1c', 4);
  if (a.ev) g += rr(doorX - 50, bottom - 10, 100, 4, 2, '#2bd6ff', 'opacity=".5"');
  if (a.bread) g += rr(120, 140, 40, 30, 4, '#9fb6c9') + rr(180, 140, 40, 30, 4, '#9fb6c9') + rr(240, 140, 40, 30, 4, '#9fb6c9');
  // wheels
  const rimStyle = it.tune === 'wheels' ? 'black' : a.chrome ? 'multi' : (it.year || 2020) < 1995 ? 'steel' : a.gold ? 'gold' : ctx.rng.chance(0.5) ? 'five' : 'multi';
  const flat = it.defects.some((d) => d.c === 'v_tire');
  g += wheel(ctx, P.wf, cy, r, rimStyle, flat && view === 'front') + wheel(ctx, P.wr, cy, r, rimStyle, flat && view === 'back');
  g = `<g transform="${flip ? 'translate(400 0) scale(-1 1)' : ''}">${g}</g>`;
  const box = { x: first[0], y: Math.min(...pts.map((p) => p[1])), w: last[0] - first[0], h: bottom - Math.min(...pts.map((p) => p[1])) };
  return { g, box, clip: `<g transform="${flip ? 'translate(400 0) scale(-1 1)' : ''}">${pa(bodyPath, '#000')}</g>` };
}

// ---------------------------------------------------------------- bikes
function bikes(ctx) {
  const { a } = ctx;
  const c = ctx.c;
  const fr = ctx.lin([[0, shade(c, 0.25)], [1, shade(c, -0.25)]], 0, 0, 1, 1);
  let g = '';
  const W = (x, y, r, thick = 6, spokes = true) => ci(x, y, r, 'none', `stroke="#141414" stroke-width="${thick}"`) + ci(x, y, r - thick / 2 - 2, 'none', 'stroke="#9aa1aa" stroke-width="2"') + (spokes ? Array.from({ length: 12 }, (_, i) => { const an = (i / 12) * Math.PI * 2; return ln(x, y, x + Math.cos(an) * (r - 4), y + Math.sin(an) * (r - 4), '#c0c4ca', 0.8); }).join('') : ci(x, y, r * 0.45, '#5a5d63')) + ci(x, y, 4, '#666');
  switch (a.t) {
    case 'mtb': case 'road': case 'city': case 'bmx': case 'fold': {
      const r = a.t === 'fold' ? 34 : a.t === 'bmx' ? 42 : 62, y = 300 - r;
      const fx = a.t === 'fold' ? 140 : 100, rx = a.t === 'fold' ? 260 : 300;
      g += W(fx, y, r, a.t === 'mtb' ? 9 : a.t === 'road' ? 4 : 6) + W(rx, y, r, a.t === 'mtb' ? 9 : a.t === 'road' ? 4 : 6);
      const bb = [200, y + 6], seat = [178, y - 80], head = [148, y - 74];
      g += ln(rx, y, bb[0], bb[1], fr, 7) + ln(bb[0], bb[1], seat[0], seat[1], fr, 8) + ln(rx, y, seat[0] + 4, seat[1] + 14, fr, 6) + ln(seat[0], seat[1] + 18, head[0], head[1] + 6, fr, a.t === 'city' ? 0 : 8) + ln(bb[0], bb[1], head[0], head[1] + 20, fr, 8) + ln(head[0], head[1], fx, y, '#333', 6);
      g += rr(seat[0] - 18, seat[1] - 10, 36, 8, 4, '#1c1c1c') + (a.t === 'road' ? pa(`M${head[0]} ${head[1] - 8} q 26 0 22 22`, 'none', 'stroke="#1c1c1c" stroke-width="5"') : ln(head[0] - 14, head[1] - 10, head[0] + 18, head[1] - 14, '#1c1c1c', 5));
      if (a.t === 'city') g += rr(fx - 26, head[1] - 4, 44, 26, 4, 'none', 'stroke="#aaa" stroke-width="3"');
      g += ci(bb[0], bb[1], 12, '#555');
      return { g, box: { x: fx - r, y: seat[1] - 12, w: rx - fx + 2 * r, h: 300 - seat[1] + 12 } };
    }
    case 'scooter': g += W(110, 285, 18, 6, false) + W(300, 285, 18, 6, false) + rr(120, 270, 180, 14, 6, fr) + ln(110, 280, 135, 90, '#2a2a2a', 10) + ln(105, 92, 165, 86, '#1c1c1c', 8); return { g, box: { x: 90, y: 86, w: 230, h: 220 } };
    case 'moped': case 'vespa': g += W(110, 270, 30, 10, false) + W(300, 270, 30, 10, false) + pa('M200 270 Q 200 190 250 180 L 330 190 Q 345 240 320 270Z', fr) + pa('M120 260 L 140 150 L 160 150 L 150 260Z', fr) + rr(230, 165, 80, 16, 8, '#1c1c1c') + ln(140, 150, 150, 120, '#333', 5) + ln(125, 118, 175, 116, '#1c1c1c', 6) + ci(140, 160, 8, '#fff8d8'); return { g, box: { x: 80, y: 116, w: 260, h: 184 } };
    default: {
      // motorcycles
      g += W(105, 262, 40, 14, false) + W(305, 262, 40, 14, false);
      if (a.t === 'sport') g += pa('M110 250 L 160 170 L 250 160 L 330 190 L 300 250 L 190 255Z', fr) + pa('M150 175 L 175 140 L 210 150 L 185 175Z', '#2a3a4a', 'opacity=".8"') + rr(230, 158, 70, 14, 6, '#1c1c1c');
      else if (a.t === 'cruiser' || a.t === 'classic' || a.t === 'sidecar') g += rr(170, 190, 70, 30, 14, fr) + rr(150, 225, 90, 30, 8, metal(ctx, 'silver')) + rr(240, 200, 70, 14, 6, '#1c1c1c') + ln(305, 262, 200, 250, metal(ctx, 'silver'), 6) + ln(130, 180, 105, 262, metal(ctx, 'silver'), 6) + ln(115, 165, 160, 160, '#1c1c1c', 6);
      else g += rr(170, 180, 80, 34, 14, fr) + rr(160, 220, 80, 40, 6, '#3a3b40') + rr(245, 185, 70, 14, 6, '#1c1c1c') + ln(140, 175, 105, 262, '#aaa', 7) + ln(120, 160, 170, 155, '#1c1c1c', 6) + (a.t === 'adv' ? rr(300, 160, 50, 44, 6, '#2a2a2a') : '');
      if (a.t === 'sidecar') g += pa('M250 300 Q 250 250 320 250 L 380 255 L 380 300Z', fr) + W(350, 300, 20, 8, false);
      return { g, box: { x: 65, y: 140, w: 290, h: 162 } };
    }
  }
}

export const DRAW2 = { cards, comics, toys, antiques, art: artDraw, collectibles, instruments, cars, bikes };
