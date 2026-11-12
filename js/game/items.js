// Item instances: generation, naming, condition and valuation.
import { hasPhoto } from '../ui/real_photo.js';
import { CATS, CAT_LIST, MODELS, MODEL, BY_CAT, DEFECTS, CAT_DEFECTS, LOCKS, RARITY, RARE_TRAITS, COLORS, CAR_COLORS, colorName, colorHex, modelValue, YEAR, LUXURY_CATS, VEHICLE_CATS } from '../data/catalog.js';
import { RNG } from '../core/rng.js';
import { L, T } from '../core/i18n.js';
import { uid, clamp } from '../core/util.js';
import { countryOf, COUNTRY } from '../data/world.js';
import { priceFactor } from './economy.js';
import { G } from '../core/state.js';
import { viewForDefect } from '../data/views.js';

export const isVehicle = (it) => VEHICLE_CATS.includes(it.cat);
export const modelOf = (it) => MODEL[it.m];

// ---------------------------------------------------------------- model picking
const W_CACHE = {};
function modelWeights(cat) {
  if (W_CACHE[cat]) return W_CACHE[cat];
  const list = BY_CAT[cat] || [];
  const w = list.map((m) => Math.pow(modelValue(m), -0.5) * Math.pow(0.32, m.rare || 0) * (m.tier === 'cheap' ? 1.6 : 1) * (m.nogen ? 0 : 1));
  return (W_CACHE[cat] = { list, w });
}
export function pickModel(rng, { cat, maxVal = Infinity, minVal = 0, cats } = {}) {
  const pool = cat ? [cat] : (cats || CAT_LIST);
  for (let tries = 0; tries < 12; tries++) {
    const c = cat || rng.weighted(pool, (x) => (x === 'cars' ? 0.55 : x === 'bikes' ? 0.4 : ['art', 'antiques'].includes(x) ? 0.5 : x === 'phones' ? 1.8 : 1));
    const { list, w } = modelWeights(c);
    if (!list.length) continue;
    let tot = 0;
    const ok = list.map((m, i) => { const v = modelValue(m); const good = v <= maxVal && v >= minVal; const ww = good ? w[i] : 0; tot += ww; return ww; });
    if (tot <= 0) continue;
    let r = rng.next() * tot;
    for (let i = 0; i < list.length; i++) { r -= ok[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  }
  return BY_CAT.phones[5];
}

// ---------------------------------------------------------------- variants & attributes
const SNEAKER_SIZES = ['36', '37', '38', '39', '40', '41', '42', '42.5', '43', '44', '44.5', '45', '46', '47'];
const CLOTH_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export function varsOf(m) {
  if (m.vars) return m.vars;
  return [['', 1]];
}
export function varLabel(it) {
  const m = modelOf(it); const v = varsOf(m)[it.v || 0];
  return v ? L(v[0]) : '';
}
function sizeMult(it) {
  if (it.cat === 'sneakers') { const i = SNEAKER_SIZES.indexOf(it.size); return i < 3 || i > 11 ? 0.85 : i >= 5 && i <= 9 ? 1.05 : 1; }
  if (it.cat === 'clothing') return ['M', 'L'].includes(it.size) ? 1.05 : ['XS', 'XXL'].includes(it.size) ? 0.88 : 1;
  return 1;
}

const RU_PLATE = 'АВЕКМНОРСТУХ';
const LAT = 'ABCDEFGHJKLMNPRSTUVWXYZ';
export function makePlate(rng, country) {
  const d = (n) => Array.from({ length: n }, () => rng.int(0, 9)).join('');
  const l = (n, set = LAT) => Array.from({ length: n }, () => set[rng.int(0, set.length - 1)]).join('');
  switch (COUNTRY[country]?.plate) {
    case 'ru': return `${l(1, RU_PLATE)}${d(3)}${l(2, RU_PLATE)} ${rng.pick(['77', '177', '799', '78', '178', '16', '116', '54', '154', '25', '41', '05', '23', '93', '123'])}`;
    case 'ua': return `${rng.pick(['AA', 'KA', 'BC', 'BH', 'AX', 'AE', 'KE'])} ${d(4)} ${l(2)}`;
    case 'by': return `${d(4)} ${l(2)}-${rng.int(1, 7)}`;
    case 'kz': return `${d(3)} ${l(3)} ${rng.pick(['02', '01', '17'])}`;
    case 'us': return `${rng.int(1, 9)}${l(3)}${d(3)}`;
    case 'gb': return `${l(2)}${d(2)} ${l(3)}`;
    case 'de': return `${rng.pick(['B', 'M', 'HH', 'K', 'F'])}-${l(2)} ${d(4)}`;
    case 'jp': return `${rng.pick(['品川', '横浜', '大阪'])} ${d(3)} ${d(2)}-${d(2)}`;
    case 'cn': return `${rng.pick(['粤B', '沪A', '京A'])}·${l(1)}${d(4)}`;
    case 'ae': return `${l(1)} ${d(5)}`;
    default: return `${l(2)}-${d(3)}-${l(2)}`;
  }
}

// ---------------------------------------------------------------- generation
// quality: any | junk | good | new | mixed
export function makeItem(rng, o = {}) {
  const m = o.model ? (typeof o.model === 'string' ? MODEL[o.model] : o.model) : pickModel(rng, o);
  const cat = m.cat;
  const C = CATS[cat];
  const city = o.city || G.s?.player.city || 'msk';
  const country = countryOf(city);
  const q = o.quality || 'any';
  const it = { id: uid('i'), m: m.id, cat, seed: rng.int(1, 2 ** 30), v: 0, cond: 80, defects: [], fake: 0, rar: m.rare || 0, loc: city, at: G.s?.t || 0, tests: {} };
  // colour
  const colors = m.colors || ['black'];
  if (cat === 'cars') it.color = rng.pick(colors.length ? colors : CAR_COLORS);
  else it.color = rng.pick(colors);
  // models with a real photo come in the colour that is on the photo
  if (hasPhoto(m.id) && colors.length) it.color = colors[0];
  // variant
  const vars = varsOf(m);
  it.v = rng.weighted(vars.map((_, i) => i), (i) => (vars.length > 2 && (i === 0 || i === vars.length - 1) ? 0.6 : 1));
  // year
  if (m.years) it.year = rng.int(m.years[0], Math.min(m.years[1], YEAR));
  // condition
  let cond;
  if (q === 'new') cond = rng.int(95, 100);
  else if (q === 'good') cond = rng.int(68, 97);
  else if (q === 'junk') cond = rng.int(4, 55);
  else cond = clamp(Math.round(90 - Math.abs(rng.gauss()) * 28 + rng.float(-6, 8)), 3, 100);
  if (it.year) { const age = YEAR - it.year; cond = clamp(cond - age * rng.float(0.3, 1.2), 3, 100); }
  it.cond = Math.round(cond);
  // sealed / extras
  const sealable = !['cars', 'bikes', 'art', 'antiques', 'collectibles', 'instruments', 'clothing'].includes(cat);
  if (sealable && (q === 'new' ? rng.chance(0.75) : it.cond >= 96 && rng.chance(0.25))) { it.sealed = true; it.cond = 100; }
  it.box = it.sealed || rng.chance(it.cond / 140 + 0.05);
  it.docs = it.sealed || rng.chance(it.cond / 200 + (LUXURY_CATS.includes(cat) ? 0.15 : 0));
  if (cat === 'sneakers') it.size = rng.pick(SNEAKER_SIZES);
  if (cat === 'clothing') it.size = rng.pick(CLOTH_SIZES);
  if (cat === 'perfume') it.fill = it.sealed ? 100 : rng.int(15, 100);
  if (cat === 'cars') {
    const age = Math.max(0.3, YEAR - it.year);
    it.km = Math.round(age * rng.float(7000, 26000) / 100) * 100;
    it.eng = rng.pick(m.engine || ['2.0']);
    it.tr = rng.pick(m.trans || ['MT']);
    it.owners = clamp(Math.round(age / rng.float(3, 7)) + 1, 1, 9);
    it.plate = makePlate(rng, country.id);
    if (rng.chance(0.18)) it.tune = rng.pick(['wheels', 'lowered', 'tint', 'spoiler', 'wrap', 'exhaust']);
  }
  if (cat === 'bikes') it.km = Math.round(Math.max(0.3, YEAR - m.year) * rng.float(500, 6000) / 100) * 100;
  if ((cat === 'cards' || cat === 'comics') && rng.chance(0.16)) {
    it.grade = rng.weighted([10, 9.5, 9, 8.5, 8, 7, 6, 5], (g) => ({ 10: 0.6, 9.5: 0.6, 9: 1.6, 8.5: 1.2, 8: 1.6, 7: 1.2, 6: 0.8, 5: 0.5 }[g]));
    if (cat === 'cards' && it.grade === 9.5) it.grade = 9;
    it.cond = clamp(Math.round(it.grade * 10), 40, 100);
  }
  // rarity roll
  const boost = o.rareBoost || 0;
  const r = rng.weighted(RARITY.map((_, i) => i), (i) => RARITY[i].w * (i ? Math.pow(1 + boost, i) : 1));
  if (r > it.rar) {
    it.rar = r;
    const traits = RARE_TRAITS[cat] || RARE_TRAITS.default;
    it.trait = rng.int(0, traits.length - 1);
  }
  // defects
  const pool = CAT_DEFECTS[cat] || [];
  if (!it.sealed && pool.length) {
    let n = Math.max(0, Math.round((100 - it.cond) / 24 + rng.float(-0.6, 1.1)));
    if (q === 'junk') n += rng.int(1, 2);
    if (q === 'new') n = 0;
    const chosen = rng.sample(pool, Math.min(n, pool.length, 4));
    for (const code of chosen) {
      const d = DEFECTS[code];
      if (!d) continue;
      if (code === 'faceid' && m.os !== 'pear' && rng.chance(0.5)) continue;
      if (code === 'e_os' && !['laptop', 'box'].includes(m.art?.t) && !/iMak/.test(m.name)) continue;
      const side = d.view === 'any' ? (rng.chance(0.5) ? 'front' : 'back') : d.view;
      const view = d.viz ? viewForDefect(rng, it, side, code) : side;
      const close = view.startsWith('close');
      it.defects.push({ c: code, x: +rng.float(close ? 0.3 : 0.2, close ? 0.7 : 0.8).toFixed(3), y: +rng.float(close ? 0.3 : 0.18, close ? 0.7 : 0.82).toFixed(3), view, known: code === 'e_os' || (d.vis === 'visible' && (view === 'front' || view === 'back')) });
    }
  }
  // fakes
  let fakeRate = (o.fakeRate ?? C.fake * (country.fake / 0.1)) * (m.tier === 'cheap' ? 0.3 : 1) * (o.fakeMult ?? 1);
  if (VEHICLE_CATS.includes(cat) || cat === 'art' && (m.price < 1000)) fakeRate = 0;
  if (rng.chance(clamp(fakeRate, 0, 0.6))) it.fake = rng.chance(0.55) ? 2 : 1;
  // locks (phones)
  if (cat === 'phones' && !it.sealed && rng.chance(o.lockRate ?? 0.06)) {
    const opts = m.os === 'pear' ? ['passcode', 'passcode', 'icloud', 'blacklist', 'bootloop'] : m.os === 'droid' ? ['passcode', 'frp', 'frp', 'blacklist', 'bootloop'] : ['passcode'];
    it.lock = rng.pick(opts);
  }
  if (o.src) it.src = o.src;
  return it;
}

// ---------------------------------------------------------------- naming
export function itemTitle(it, withVar = true) {
  const m = modelOf(it);
  if (!m) return '???';
  if (it.build) return `${T('ПК', 'ПК', 'PC')} · ${it.build.cpu}${it.build.gpu ? ' / ' + it.build.gpu : ''} / ${it.build.ram} ${T('ГБ', 'ГБ', 'GB')}`;
  let t = [m.brand, m.name].filter(Boolean).join(' ');
  if (it.cat === 'cars') return `${t}, ${it.year}`;
  const vl = withVar ? varLabel(it) : '';
  if (vl) t += `, ${vl}`;
  return t;
}
export function colorLabel(it) {
  const m = modelOf(it);
  if (it.color === 'cw') return m?.colorway || '';
  const n = colorName(it.color);
  return L(n);
}
export function itemColorHex(it) { return colorHex(it.color); }
export const GRADES = [
  [96, ['Новый', 'Новий', 'New'], 'g'], [85, ['Как новый', 'Як новий', 'Like new'], 'g'], [70, ['Отличное', 'Відмінний', 'Excellent'], 'b'],
  [55, ['Хорошее', 'Добрий', 'Good'], 'b'], [40, ['Среднее', 'Середній', 'Fair'], 'y'], [20, ['Плохое', 'Поганий', 'Poor'], 'o'], [0, ['На запчасти', 'На запчастини', 'For parts'], 'r'],
];
export function gradeOf(it) {
  if (it.sealed) return { n: T('Новый, запечатан', 'Новий, запечатаний', 'New, sealed'), cls: 'g' };
  if (it.grade) return { n: `${it.cat === 'cards' ? 'PZA' : 'CGS'} ${it.grade}`, cls: it.grade >= 9 ? 'g' : it.grade >= 7 ? 'b' : 'y' };
  const g = GRADES.find((x) => it.cond >= x[0]);
  return { n: L(g[1]), cls: g[2] };
}
export function itemSub(it) {
  const parts = [];
  const c = colorLabel(it); if (c) parts.push(c);
  if (it.size) parts.push(it.cat === 'sneakers' ? `EU ${it.size}` : it.size);
  if (it.cat === 'cars') parts.push(`${fmtKm(it.km)}`, `${it.eng} ${it.tr}`);
  if (it.cat === 'perfume' && it.fill != null) parts.push(`${it.fill}%`);
  parts.push(gradeOf(it).n);
  return parts.join(' · ');
}
export const fmtKm = (km) => `${Math.round(km).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${T('км', 'км', 'km')}`;
export const rarityName = (r) => L(RARITY[r]?.n);
export function traitName(it) {
  if (it.trait == null) return '';
  const traits = RARE_TRAITS[it.cat] || RARE_TRAITS.default;
  return L(traits[it.trait]);
}
export const defectName = (code) => L(DEFECTS[code]?.n || LOCKS[code]?.n || code);
export const lockName = (code) => L(LOCKS[code]?.n || code);
export const knownDefects = (it) => it.defects.filter((d) => d.known);
export const unknownCount = (it) => it.defects.filter((d) => !d.known).length;
export const fakeLabel = (f) => (f === 2 ? T('Реплика 1:1', 'Репліка 1:1', '1:1 replica') : T('Подделка', 'Підробка', 'Fake'));
export const sizeUnits = (it) => (isVehicle(it) ? 0 : CATS[it.cat]?.size || 1);

// ---------------------------------------------------------------- valuation
export function vehicleBase(m, year) {
  const c = CATS[m.cat];
  if (m.fixed) return m.price * (m.hype || 1);
  const age = Math.max(0, YEAR - (year || m.year));
  const retro = m.retro ?? 25;
  let v = m.price * Math.max(m.floor ?? c.floor, Math.pow(1 - (m.dep ?? c.dep), age));
  if ((m.hype || 1) > 1.05 && age > retro) v = Math.max(v, m.price * (0.1 + 0.035 * (age - retro)) * m.hype);
  return Math.max(150, v);
}
const GRADE_MULT = { 10: [3, 7], 9.5: [2.2, 3.5], 9: [1.6, 2.2], 8.5: [1.3, 1.6], 8: [1.15, 1.3], 7: [0.95, 1.0], 6: [0.8, 0.85], 5: [0.65, 0.7] };

// mode: 'true' (real), 'known' (what the player knows)
const OS_MULT = { win11: 1.03, win10: 1.02, macos: 1, linux: 1, win8: 0.97, win7: 0.93 };
export function itemValue(it, cityId, mode = 'true', opts = {}) {
  const m = modelOf(it);
  if (!m) return 0;
  const city = cityId || G.s?.player.city || 'msk';
  let v = it.build ? it.build.base : isVehicle(it) ? vehicleBase(m, it.year) : modelValue(m);
  const vars = varsOf(m);
  v *= vars[it.v || 0]?.[1] ?? 1;
  v *= sizeMult(it);
  // condition
  if (it.sealed) {
    const old = YEAR - m.year;
    v *= m.retro && old > m.retro ? 1.6 + Math.min(40, (old - m.retro) * 2.5) : 1.15;
  } else if (it.grade) {
    const g = GRADE_MULT[it.grade] || [1, 1];
    v *= m.year < 2010 ? g[1] : g[0];
  } else {
    v *= 0.32 + 0.68 * Math.pow(it.cond / 100, 1.35);
  }
  if (it.cat === 'cars') v *= clamp(1.18 - it.km / 380000, 0.5, 1.18) * (it.owners > 3 ? 0.93 : 1);
  // defects
  let dm = 1;
  for (const d of it.defects) {
    if (mode === 'known' && !d.known) continue;
    dm *= 1 - (DEFECTS[d.c]?.sev || 0);
  }
  v *= Math.max(0.12, dm);
  if (it.lock) v *= 1 - (LOCKS[it.lock]?.sev || 0);
  if (it.jb) v *= 1.06;
  const fakeKnown = mode === 'true' || it.fakeKnown;
  if (it.fake && fakeKnown) v *= it.fake === 2 ? 0.16 : 0.07;
  if (it.authOk && !it.fake) v *= 1.06;
  // rarity relative to model baseline
  const base = m.rare || 0;
  if (it.rar > base) v *= RARITY[it.rar].m / RARITY[base].m;
  // extras
  const lux = LUXURY_CATS.includes(it.cat) || it.cat === 'sneakers';
  if (!it.sealed) {
    if (it.box) v *= lux ? 1.07 : 1.03;
    else if (it.cat === 'sneakers') v *= 0.93;
    if (it.docs) v *= lux ? 1.09 : 1.02;
  }
  if (it.cat === 'perfume' && it.fill != null) v *= 0.15 + 0.85 * it.fill / 100;
  if (it.cleaned) v *= 1.03;
  if (it.tune) v *= it.tune === 'wheels' || it.tune === 'exhaust' ? 1.03 : 0.98;
  if (it.data?.wiped && ['phones', 'electronics', 'consoles'].includes(it.cat)) v *= 1.03; // factory reset, ready for the next owner
  if (it.os) v *= OS_MULT[it.os] || 1;
  if (it.refurb) v *= 0.94; // rebuilt from parts
  if (!opts.raw) v *= priceFactor(it.cat, city, m.id, m.brand);
  return Math.max(0.5, v);
}
// what the item would fetch at a pawn shop instantly
export const pawnValue = (it, city) => itemValue(it, city, 'known') * 0.48;

export function catName(cat) { return L(CATS[cat]?.name); }
export const allCats = () => CAT_LIST;
