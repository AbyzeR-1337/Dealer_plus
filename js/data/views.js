// Camera angles for every item: what a seller can photograph and what a buyer can look at in person.
import { MODEL } from './catalog.js';
import { hasPhoto, PHOTO_VIEWS } from '../ui/real_photo.js';
export const VIEW_NAMES = {
  front: ['Спереди', 'Спереду', 'Front'], back: ['Сзади', 'Ззаду', 'Back'],
  left: ['Слева', 'Зліва', 'Left'], right: ['Справа', 'Справа', 'Right'],
  bottom: ['Снизу', 'Знизу', 'Bottom'], close: ['Крупно', 'Крупно', 'Close‑up'], close2: ['Детали', 'Деталі', 'Details'],
  screen: ['Экран', 'Екран', 'Screen'], overview: ['Общий план', 'Загальний план', 'Overview'], side: ['Борт', 'Борт', 'Side'], side2: ['Другой борт', 'Інший борт', 'Other side'],
};
const PHONE = ['front', 'back', 'left', 'right', 'bottom'];
const VEH = ['front', 'back', 'close', 'close2'];
const FLAT = ['front', 'back', 'left', 'right', 'close'];
const SMALL = ['front', 'back', 'close', 'close2'];
export const VIEWS = {
  phones: PHONE, cars: VEH, bikes: VEH, jewelry: SMALL, watches: FLAT, cards: ['front', 'back', 'close', 'close2'], comics: ['front', 'back', 'close'],
};
const RETRO = ['retro', 'slider', 'flipold', 'qwerty'];
// items with a real photo: the whole shot plus close-ups; the hands-on inspection of a phone keeps every side
export const viewsOf = (it, o = {}) => {
  if (hasPhoto(it.m) && !(o.inspect && it.cat === 'phones')) return PHOTO_VIEWS;
  if (it.cat === 'phones') return RETRO.includes(MODEL[it.m]?.art?.f) ? FLAT : PHONE;
  if (it.cat === 'cars' || it.cat === 'bikes') return VEH;
  return VIEWS[it.cat] || FLAT;
};
export const viewLabel = (it, v) => {
  if (v === 'front' && hasPhoto(it.m)) return VIEW_NAMES.overview;
  if (it.cat === 'phones' && v === 'front') return VIEW_NAMES.screen;
  if ((it.cat === 'cars' || it.cat === 'bikes') && v === 'front') return VIEW_NAMES.side;
  if ((it.cat === 'cars' || it.cat === 'bikes') && v === 'back') return VIEW_NAMES.side2;
  return VIEW_NAMES[v] || [v, v, v];
};
// where a defect of a given drawn side can show up
export function viewForDefect(rng, it, side, code) {
  const vs = viewsOf(it);
  if (it.cat === 'phones') {
    if (code === 'bent' || code === 'scratches') return rng.pick(['left', 'right', 'back']);
    return side;
  }
  if (!vs.includes(side)) side = vs.includes('close2') ? 'close2' : vs[vs.length - 1];
  const pool = side === 'back' ? vs.filter((v) => v === 'back' || v.startsWith('close')) : vs.filter((v) => v !== 'back');
  // most defects are on the main photo; some need a closer look from another angle
  return rng.chance(0.5) ? side : rng.pick(pool.length ? pool : [side]);
}
// photos a seller puts in a listing (always the main shot; others at random)
export function listingViews(it, seed) {
  const vs = viewsOf(it);
  let s = seed >>> 0;
  const out = ['front'];
  for (const v of vs) { if (v === 'front') continue; s = (s * 1103515245 + 12345) >>> 0; if ((s >>> 16) % 100 < 55) out.push(v); }
  return out.length < 2 && vs.length > 1 ? ['front', vs[1]] : out;
}
// the angle a stored defect is drawn on (older saves may point at an angle this item no longer has)
export function defectView(it, d, vs = viewsOf(it)) {
  if (d.view === 'any' || vs.includes(d.view)) return d.view;
  return vs.includes('close2') ? 'close2' : 'close';
}
