// Painted sprite rendering: picks the best hand-drawn sprite for an item, recolours it when needed and
// places it on a grungy background. Falls back to procedural art when no good sprite exists.
import { SPRITES, SHEETS, SHEET_W, SHEET_H, SHEET_SCALE } from '../data/sprites.js';
import { FIT } from '../data/sprite_fit.js';
import { MODEL, colorHex } from '../data/catalog.js';
import { hashStr } from '../core/rng.js';
import { lum } from '../core/util.js';

// ---------------------------------------------------------------- colour helpers
function hsl(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  const d = mx - mn;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s, l };
}
export function family(hex) {
  const { h, s, l } = hsl(hex);
  if (l < 0.17) return 'black';
  if (s < 0.16) return l > 0.82 ? 'white' : 'silver';
  if (l > 0.86 && s < 0.4) return 'white';
  if (h < 14 || h >= 340) return s < 0.45 && l < 0.4 ? 'brown' : 'red';
  if (h < 40) return l < 0.45 ? 'brown' : s < 0.5 ? 'beige' : 'orange';
  if (h < 68) return s < 0.45 ? 'beige' : 'yellow';
  if (h < 165) return 'green';
  if (h < 255) return 'blue';
  if (h < 300) return 'purple';
  return 'pink';
}
const COLFAM = { black: 'black', white: 'white', silver: 'silver', grey: 'silver', red: 'red', blue: 'blue', navy: 'blue', olive: 'green', green: 'green', khaki: 'green', yellow: 'yellow', orange: 'orange', beige: 'beige', cream: 'white', brown: 'brown', sand: 'beige', pink: 'pink' };

// ---------------------------------------------------------------- category rules
const JEWEL_KIND = { love: 'love', clovers: 'clovers', clover: 'clovers', ring: 'ring', band: 'ring', signet: 'ring', trinity: 'ring', earrings: 'earrings', pearls: 'pearls', pendant: 'necklace', chain: 'necklace', heart: 'necklace', cross: 'necklace', cuff: 'bangle', nail: 'bangle', cuban: 'bracelet', serpent: 'bracelet', charm: 'bracelet' };
const BAG_KIND = { birkin: 'handbag', kelly: 'handbag', flapH: 'handbag', flapC: 'flap', flap: 'flap', lady: 'flap', pochette: 'envelope', baguette: 'envelope', clutch: 'envelope', tote: 'tote', speedy: 'tote', alma: 'tote', bucket: 'tote', saddle: 'saddle', backpack: 'backpack', hobo: 'handbag', mini: 'handbag', puzzle: 'handbag' };
const CAR_BODY = { classic: ['boxy', 'sedan'], truck: ['truck', 'van'], sedan: ['sedan'], wagon: ['sedan'], limo: ['sedan'], coupe: ['coupe', 'sport', 'sedan'], sport: ['sport', 'super'], sport911: ['sport911', 'sport'], super: ['super', 'sport'], muscle: ['muscle', 'sport'], suv: ['suv'], jeep: ['jeep', 'suv'], pickup: ['pickup'], van: ['van'], hatch: ['hatch', 'sedan'], micro: ['hatch'], boxy: ['boxy'], roadster: ['sport'] };
const BIKE_KIND = { sport: ['sport', 'naked'], naked: ['naked', 'sport'], cruiser: ['cruiser'], sidecar: ['cruiser'], adv: ['dirt'], classic: ['classic', 'moped'], moped: ['moped', 'vespa'], vespa: ['vespa', 'moped'], mtb: ['mtb', 'road'], road: ['road', 'mtb'], city: ['city', 'road'], fold: ['city'], bmx: ['mtb'], scooter: ['scooter'] };
const CLOTH_KIND = { tee: 'tee', polo: 'tee', hoodie: 'hoodie', sweat: 'sweat', fleece: 'sweat', knit: 'sweat', track: 'sweat', jacket: 'jacket', coat: 'jacket', parka: 'puffer', puffer: 'puffer', beanie: 'beanie' };

const metalOf = (key) => (['ygold', 'rgold', 'gold', 'goldtop'].includes(key) ? 'gold' : 'silver');
const keyHit = (s, m) => (s.key || []).some((k) => `${m.brand} ${m.name}`.toLowerCase().includes(k.toLowerCase().replace(/‑/g, '-')) || `${m.brand} ${m.name}`.toLowerCase().includes(k.toLowerCase()));

const BAD_CUTS = ['j1_pendblue', 'w2_sweat', 'p3_bleu', 'm3_delivery', 'a2_capny2', 'a2_capnike'];
// returns { sprite, tint } or null
export function pickSprite(it) {
  const m = MODEL[it.m];
  if (!m) return null;
  if (m.art?.sprite) { const s = SPRITES.find((x) => x.id === m.art.sprite); return s ? { sprite: s, tint: null } : null; }
  // cut-outs the segmentation could not separate from the painted background
  const BAD = BAD_CUTS;
  if (it.grade) return null; // graded slabs keep the procedural slab
  const cat = it.cat;
  const a = m.art || {};
  const hex = colorHex(it.color);
  const fam = it.color === 'cw' ? null : family(hex);
  let pool = SPRITES.filter((s) => s.cat === cat && !BAD.includes(s.id));
  if (!pool.length) return null;
  let need = null; // required kind(s)
  let requireKey = false;
  switch (cat) {
    case 'watches': if (!['round', 'cushion', 'pilot'].includes(a.t)) return null; break;
    case 'jewelry': need = [JEWEL_KIND[a.t]]; break;
    case 'perfume': if (['kremlin', 'flask'].includes(a.t)) return null; break;
    case 'bags': need = BAG_KIND[a.t] ? [BAG_KIND[a.t]] : null; if (!need) return null; break;
    case 'cars': need = CAR_BODY[a.body]; if (!need) return null; break;
    case 'bikes': need = BIKE_KIND[a.t]; if (!need) return null; break;
    case 'clothing': need = CLOTH_KIND[a.t] ? [CLOTH_KIND[a.t]] : null; if (!need) return null; break;
    case 'accessories': need = { cap: ['cap'], headphones: ['headphones'], buds: ['buds'] }[a.t]; if (!need) return null; if (a.t === 'buds' && m.brand !== 'Pear') return null; break;
    case 'collectibles': if (a.t === 'coin') need = ['coin']; else if (a.t === 'pins') { pool = SPRITES.filter((s) => s.kind === 'medal' && !BAD.includes(s.id)); } else return null; break;
    case 'antiques': if (a.t !== 'pocketwatch') return null; need = ['pocketwatch']; break;
    case 'cards': case 'comics': requireKey = true; break;
    default: break;
  }
  if (need) pool = pool.filter((s) => need.includes(s.kind || s.body));
  if (!pool.length) return null;
  let best = null, bestScore = -1e9;
  const seed = hashStr(it.id || String(it.seed));
  for (const s of pool) {
    let sc = 0;
    const kh = keyHit(s, m);
    if (kh) sc += 12;
    if (requireKey && !kh) continue;
    if (need && (s.kind || s.body) === need[0]) sc += 3;
    if (cat === 'watches') {
      const strap = ['leather', 'nato', 'rubber', 'resin'].includes(a.strap) ? 'leather' : 'bracelet';
      if (s.strap === strap) sc += 4;
      const metal = a.metal === 'two' ? 'two' : a.metal === 'gold' || a.metal === 'rose' ? 'gold' : 'steel';
      if (s.metal === metal) sc += 4; else if (metal === 'two' && s.metal === 'gold') sc += 1;
      const dialFam = family(a.dial || '#111111');
      const sd = s.dial === 'gold' ? 'yellow' : s.dial === 'grey' ? 'silver' : s.dial;
      if (sd === dialFam || (dialFam === 'white' && sd === 'silver') || (dialFam === 'silver' && sd === 'white')) sc += 3;
      if (!!a.sub === !!s.chrono) sc += 2;
    }
    if (cat === 'jewelry' && s.metal === metalOf(it.color)) sc += 4;
    if (cat === 'collectibles' && a.t === 'coin') sc += (a.metal === 'gold' || a.metal === 'brass') === (s.metal === 'gold') ? 4 : 0;
    if (cat === 'perfume') {
      const lf = family(a.liquid || '#f1d27a');
      const lmap = { amber: ['yellow', 'orange', 'beige', 'brown'], dark: ['black', 'blue', 'brown'], red: ['red', 'pink', 'orange'], clear: ['white', 'silver', 'blue'], pink: ['pink', 'red'], gold: ['yellow', 'orange'] };
      if ((lmap[s.liquid] || []).includes(lf)) sc += 3;
    }
    if (fam && s.col) {
      const sf = COLFAM[s.col] || s.col;
      if (sf === fam) sc += 5;
      else if (s.neutral && ['cars', 'clothing', 'bikes'].includes(cat)) sc += 2.5;
    }
    sc += ((seed ^ hashStr(s.id)) % 1000) / 1000; // deterministic tie-break / variety
    if (sc > bestScore) { bestScore = sc; best = s; }
  }
  if (!best) return null;
  // recolour neutral sprites when the colour family differs
  let tint = null;
  const sf = COLFAM[best.col] || best.col;
  if (fam && best.neutral && sf !== fam && !['black'].includes(fam) && ['cars', 'clothing', 'bikes', 'bags'].includes(cat)) tint = hex;
  return { sprite: best, tint };
}

// SVG markup for a cut-out sprite placed inside the 400×400 item canvas (object space).
// The sheets carry alpha, so the object sits directly on whatever photo background is used.
// Filters use explicit user-space regions: a nested <svg> reports the bbox of the whole sheet image.
const MAX_UPSCALE = 3.4; // sheet px (1x) → canvas units; beyond that small sprites turn mushy
export function spriteMarkup(ctx, pick, o = {}) {
  const s = pick.sprite;
  const f = FIT[s.id];
  const [fx, fy, fw, fh] = f || [s.x, s.y, s.w, s.h];
  const P = ctx.P;
  const veh = s.cat === 'cars' || s.cat === 'bikes';
  const wide = fw / fh > 1.25;
  const maxW = veh ? 372 : wide ? 320 : 270, maxH = veh ? 235 : wide ? 250 : 290;
  const sc = Math.min(maxW / fw, maxH / fh, MAX_UPSCALE) * (o.closeup || 1);
  const tw = fw * sc, th = fh * sc;
  const tx = 200 - tw / 2;
  const ty = veh ? 322 - th : 205 - th / 2; // vehicles stand on the ground line of the scene
  const href = SHEETS[s.sheet];
  const k = SHEET_SCALE;
  const id = `${P}sp`;
  const R = (v) => v.toFixed(1);
  const rect = `x="${R(tx)}" y="${R(ty)}" width="${R(tw)}" height="${R(th)}"`;
  // gentle lift so dark paintings read on a phone screen
  let filt = `<feComponentTransfer in="SourceGraphic" result="lift"><feFuncR type="gamma" amplitude="1.06" exponent="0.9"/><feFuncG type="gamma" amplitude="1.06" exponent="0.9"/><feFuncB type="gamma" amplitude="1.06" exponent="0.9"/></feComponentTransfer>`;
  if (pick.tint) {
    filt += `<feColorMatrix in="lift" type="saturate" values="0" result="g"/><feFlood flood-color="${pick.tint}" result="c"/><feBlend in="c" in2="g" mode="multiply" result="m"/><feComponentTransfer in="g" result="hi"><feFuncR type="gamma" amplitude="0.75" exponent="6"/><feFuncG type="gamma" amplitude="0.75" exponent="6"/><feFuncB type="gamma" amplitude="0.75" exponent="6"/></feComponentTransfer><feComposite in="m" in2="hi" operator="arithmetic" k2="${lum(pick.tint) < 0.35 ? 1.6 : 1.3}" k3="1" result="o"/><feComposite in="o" in2="SourceGraphic" operator="in"/>`;
  }
  ctx.defs.push(`<filter id="${id}t" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" ${rect}>${filt}</filter>`);
  const img = `<svg ${rect} viewBox="${fx * k} ${fy * k} ${fw * k} ${fh * k}" preserveAspectRatio="none"><image href="${href}" xlink:href="${href}" width="${SHEET_W * k}" height="${SHEET_H * k}"/></svg>`;
  const g = `<g filter="url(#${id}t)">${img}</g>`;
  const box = { x: tx, y: ty, w: tw, h: th };
  return { g, box, bottom: ty + th };
}
