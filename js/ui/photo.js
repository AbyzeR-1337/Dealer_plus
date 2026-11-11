// Photo staging: every item is shown as if somebody shot it on their phone — on a bed sheet, a kitchen
// table, a car seat, a parking lot… with matching light direction, a real drop shadow, white balance,
// light fall-off and sensor grain.
import { RNG } from '../core/rng.js';

const P = (f, lx, ly, warm, o = {}) => ({ f: `assets/photo/${f}.webp`, lx, ly, warm, ...o });
export const PHOTOS = {
  wood_oak: P('wood_oak', 0.15, 0.1, 0.3), wood_walnut: P('wood_walnut', 0.85, 0.1, 0.5), wood_pine: P('wood_pine', 0.1, 0.5, 0.2),
  laminate: P('laminate', 0.2, 0, 0.1), bedsheet: P('bedsheet', 0.1, 0.1, 0.15), duvet_grey: P('duvet_grey', 0.9, 0.2, -0.1),
  blanket_knit: P('blanket_knit', 0.2, 0.9, 0.35), sofa: P('sofa', 0.8, 0.1, 0.2), carpet: P('carpet', 0.5, -0.1, 0.3),
  carpet_grey: P('carpet_grey', 0.1, 0.3, 0), marble: P('marble', 0.15, 0.05, 0.05), tiles: P('tiles', 0.3, 0.15, -0.15),
  cutting_mat: P('cutting_mat', 0.2, 0.2, 0), car_seat: P('car_seat', 0.7, 0.1, 0.1), cardboard: P('cardboard', 0.3, 0.1, 0.25),
  concrete: P('concrete', 0.5, 0, -0.05),
  lot_day: P('lot_day', 0.2, 0, 0, { scene: true }), yard_snow: P('yard_snow', 0.3, 0.1, -0.25, { scene: true }), garage: P('garage', 0.5, -0.2, 0.35, { scene: true }),
  dacha: P('dacha', 0.8, 0, 0.2, { scene: true }), street_evening: P('street_evening', 0.5, 0.2, 0.6, { scene: true }),
};
const SCENES = ['lot_day', 'yard_snow', 'garage', 'dacha', 'street_evening'];
const SOFT = ['bedsheet', 'duvet_grey', 'blanket_knit', 'sofa'];
const BY_CAT = {
  phones: ['wood_oak', 'wood_walnut', 'bedsheet', 'duvet_grey', 'sofa', 'marble', 'cutting_mat', 'car_seat', 'laminate', 'tiles', 'carpet_grey'],
  electronics: ['wood_oak', 'wood_walnut', 'laminate', 'cutting_mat', 'marble', 'carpet_grey', 'duvet_grey', 'cardboard'],
  consoles: ['carpet', 'carpet_grey', 'laminate', 'wood_oak', 'sofa', 'cardboard', 'concrete'],
  accessories: ['wood_oak', 'bedsheet', 'marble', 'car_seat', 'cutting_mat', 'sofa', 'wood_walnut'],
  sneakers: ['laminate', 'carpet', 'concrete', 'tiles', 'wood_pine', 'cardboard', 'carpet_grey'],
  clothing: ['bedsheet', 'duvet_grey', 'blanket_knit', 'sofa', 'laminate', 'carpet', 'carpet_grey'],
  bags: ['bedsheet', 'marble', 'wood_walnut', 'sofa', 'duvet_grey', 'car_seat', 'laminate'],
  watches: ['wood_walnut', 'marble', 'car_seat', 'cutting_mat', 'bedsheet', 'wood_oak', 'blanket_knit'],
  jewelry: ['marble', 'bedsheet', 'wood_walnut', 'car_seat', 'blanket_knit', 'duvet_grey'],
  perfume: ['marble', 'tiles', 'wood_oak', 'bedsheet', 'wood_walnut'],
  cards: ['cutting_mat', 'wood_oak', 'bedsheet', 'laminate', 'wood_walnut'],
  comics: ['cutting_mat', 'wood_oak', 'carpet', 'bedsheet', 'laminate'],
  toys: ['carpet', 'laminate', 'wood_pine', 'cardboard', 'bedsheet', 'carpet_grey'],
  antiques: ['wood_walnut', 'wood_oak', 'cardboard', 'blanket_knit', 'concrete', 'carpet'],
  art: ['laminate', 'concrete', 'wood_pine', 'carpet'],
  collectibles: ['cutting_mat', 'wood_walnut', 'marble', 'blanket_knit', 'car_seat'],
  instruments: ['laminate', 'carpet', 'sofa', 'wood_pine', 'carpet_grey'],
  gear: ['concrete', 'laminate', 'carpet_grey', 'cardboard', 'car_seat', 'wood_pine'],
  storage: ['wood_oak', 'cutting_mat', 'laminate', 'marble', 'cardboard', 'wood_walnut'],
  misc: ['wood_oak', 'wood_walnut', 'cutting_mat', 'cardboard', 'marble', 'car_seat'],
  cars: SCENES, bikes: [...SCENES, 'concrete'],
};
export const isSoft = (key) => SOFT.includes(key);

// one photo setup per item + view (the seller shot every angle in the same place)
export function photoSetup(it, view = 'front') {
  const r = new RNG((it.seed || 1) * 31 + 7);
  const list = BY_CAT[it.cat] || BY_CAT.misc;
  const key = r.pick(list);
  const ph = PHOTOS[key];
  const vr = new RNG((it.seed || 1) * 13 + view.length * 101 + view.charCodeAt(0));
  const rot = ph.scene ? 0 : r.pick([0, 90, 180, 270]);
  const flipBg = ph.scene ? r.chance(0.5) : false;
  let lx = ph.lx, ly = ph.ly;
  for (let k = 0; k < rot / 90; k++) [lx, ly] = [1 - ly, lx];
  if (flipBg) lx = 1 - lx;
  // daylight vs. evening lamp vs. phone flash
  const mode = ph.scene ? 'day' : r.pick(['day', 'day', 'lamp', 'flash', 'day']);
  const warm = ph.warm + (mode === 'lamp' ? 0.45 : mode === 'flash' ? -0.15 : 0);
  // light comes from (lx, ly): shadow falls the other way
  const dx = 0.5 - lx, dy = 0.5 - ly, len = Math.hypot(dx, dy) || 1;
  const sd = mode === 'flash' ? 4 : 11;
  return {
    key, ph, rot, flipBg, lx, ly, mode, warm, scene: !!ph.scene,
    sdx: (dx / len) * sd, sdy: (dy / len) * sd + 2, soft: isSoft(key),
    jitter: { x: vr.float(-10, 10), y: vr.float(-8, 8), rot: ph.scene ? 0 : vr.float(-7, 7), scale: vr.float(0.86, 1.0) },
  };
}

// <image> background + vignette layers. ctx: art context (P prefix, rad()).
// ctx.o.embed (bitmap rendering): assets come in as data URLs so the SVG can be rasterized as an image
export const hrefAttr = (ctx, url, embedded) => (embedded ? `xlink:href="${embedded}"` : `href="${url}" xlink:href="${url}"`);
export function photoBackground(ctx, ps) {
  const t = ps.flipBg ? 'translate(400 0) scale(-1 1)' : `rotate(${ps.rot} 200 200)`;
  return `<image ${hrefAttr(ctx, ps.ph.f, ctx.o.embed?.bg)} x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice" transform="${t}"/>`;
}

// drop shadow (soft + contact) following the light; applied through <use> of the object group
export function shadowDefs(ctx, ps) {
  const id = `${ctx.P}sh`;
  const k = ps.soft ? 1.25 : 1;
  ctx.defs.push(`<filter id="${id}" filterUnits="userSpaceOnUse" x="-50" y="-50" width="500" height="500" color-interpolation-filters="sRGB">`
    + `<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.015  0 0 0 0 0.01  0 0 0 ${ps.mode === 'flash' ? 0.5 : 0.62} 0" result="a"/>`
    + `<feGaussianBlur in="a" stdDeviation="${(ps.mode === 'flash' ? 5 : 10) * k}" result="b1"/><feOffset in="b1" dx="${ps.sdx.toFixed(1)}" dy="${ps.sdy.toFixed(1)}" result="s1"/>`
    + `<feGaussianBlur in="a" stdDeviation="${2.4 * k}" result="b2"/><feOffset in="b2" dx="${(ps.sdx * 0.2).toFixed(1)}" dy="${(ps.sdy * 0.2 + 1).toFixed(1)}" result="s2"/>`
    + `<feMerge><feMergeNode in="s1"/><feMergeNode in="s2"/></feMerge></filter>`);
  return `url(#${id})`;
}

// ground shadow for vehicles standing in a scene: squashed silhouette + dark contact strip
export function groundShadow(ctx, objId, bottom, box) {
  const id = `${ctx.P}gs`;
  ctx.defs.push(`<filter id="${id}" filterUnits="userSpaceOnUse" x="-50" y="0" width="500" height="420" color-interpolation-filters="sRGB"><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.75 0" result="a"/><feGaussianBlur in="a" stdDeviation="5 2.5"/></filter>`);
  const g = ctx.rad([[0, '#000', 0.55], [0.6, '#000', 0.25], [1, '#000', 0]]);
  return `<ellipse cx="${(box.x + box.w / 2).toFixed(1)}" cy="${(bottom - 2).toFixed(1)}" rx="${(box.w * 0.56).toFixed(1)}" ry="${Math.max(8, box.h * 0.07).toFixed(1)}" fill="${g}"/>`
    + `<use href="#${objId}" xlink:href="#${objId}" transform="matrix(1 0 0 0.1 0 ${(bottom * 0.9).toFixed(1)})" filter="url(#${id})"/>`;
}

// camera look on top of everything: light fall-off, white balance, flash hotspot, grain, vignette
export function photoPost(ctx, ps) {
  const id = `${ctx.P}gr`;
  ctx.defs.push(`<pattern id="${id}" width="128" height="128" patternUnits="userSpaceOnUse"><image ${hrefAttr(ctx, 'assets/photo/grain.webp', ctx.o.embed?.grain)} width="128" height="128"/></pattern>`);
  const fall = ctx.rad([[0, '#000', 0], [0.55, '#000', 0.08], [1, '#000', 0.4]], ps.lx, ps.ly, 1.05);
  const vg = ctx.rad([[0, '#000', 0], [0.72, '#000', 0.06], [1, '#000', 0.4]], 0.5, 0.5, 0.72);
  const wb = ps.warm > 0.05 ? `<rect width="400" height="400" fill="#ff9a3c" opacity="${Math.min(0.13, ps.warm * 0.12).toFixed(3)}"/>` : ps.warm < -0.05 ? `<rect width="400" height="400" fill="#4a8cff" opacity="${Math.min(0.1, -ps.warm * 0.1).toFixed(3)}"/>` : '';
  const flash = ps.mode === 'flash' ? `<ellipse cx="200" cy="190" rx="150" ry="140" fill="${ctx.rad([[0, '#fff', 0.16], [1, '#fff', 0]])}"/>` : '';
  return `<g style="pointer-events:none"><rect width="400" height="400" fill="${fall}"/>${wb}${flash}<rect width="400" height="400" fill="${vg}"/><rect width="400" height="400" fill="url(#${id})" opacity="0.55"/></g>`;
}
