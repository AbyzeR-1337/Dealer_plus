// Market economy: regional price levels, category trends, FX drift and market events.
import { G } from '../core/state.js';
import { CITY, COUNTRY, COUNTRIES, CURRENCIES, countryOf } from '../data/world.js';
import { CATS, CAT_LIST } from '../data/catalog.js';
import { hashStr, RNG } from '../core/rng.js';
import { clamp } from '../core/util.js';

export const day = () => Math.floor((G.s?.t || 0) / 1440);

// Regional multiplier for selling/buying prices of a category in a city
// Used cars cost very different money around the world: import duties and recycling fees make them dear in
// Russia, Türkiye, Kazakhstan; Japan and the US are cheap. (Multiplies the usual price level for cars only.)
export const CAR_K = { RU: 1.38, UA: 1.42, BY: 1.3, KZ: 1.3, PL: 1, DE: 0.95, FR: 0.95, IT: 0.97, GB: 0.92, US: 1, JP: 0.82, CN: 1.1, AE: 0.92, TR: 1.75, GE: 1.05, TH: 1.3 };
export function regionMult(cityId, cat) {
  const city = CITY[cityId]; if (!city) return 1;
  const c = countryOf(cityId);
  const d = c.demand?.[cat] ?? 1;
  return city.idx * c.price * d * (cat === 'cars' ? CAR_K[c.id] ?? 1 : 1);
}
export function trend(cat) { return G.s?.econ?.trend?.[cat] ?? 1; }
export function eventMult(cat, cityId) {
  let m = 1;
  const cid = countryOf(cityId).id;
  for (const e of G.s?.events || []) {
    if (e.until < day()) continue;
    if (e.cat && e.cat !== cat) continue;
    if (e.country && e.country !== cid) continue;
    if (e.brand) continue;
    m *= e.mult;
  }
  return m;
}
export function brandMult(brand) {
  let m = 1;
  for (const e of G.s?.events || []) if (e.brand === brand && e.until >= day()) m *= e.mult;
  return m;
}
// stable per-model wobble that changes slowly over game days
export function modelWobble(modelId) {
  const h = hashStr(modelId) % 1000;
  return 1 + 0.07 * Math.sin(day() / 6 + h) + 0.03 * Math.sin(day() / 2.3 + h * 1.7);
}
export function priceFactor(cat, cityId, modelId, brand) {
  return regionMult(cityId, cat) * trend(cat) * eventMult(cat, cityId) * (modelId ? modelWobble(modelId) : 1) * (brand ? brandMult(brand) : 1);
}
// Demand index (how quickly buyers appear) per category/city
export function demand(cat, cityId) {
  const c = countryOf(cityId);
  const size = CITY[cityId]?.size || 1;
  return (c.demand?.[cat] ?? 1) * (0.7 + 0.25 * size) * trend(cat) * eventMult(cat, cityId);
}

export function initEconomy() {
  const s = G.s;
  for (const c of CAT_LIST) if (!s.econ.trend[c]) s.econ.trend[c] = 1;
  for (const code of Object.keys(CURRENCIES)) if (!s.econ.fx[code]) s.econ.fx[code] = 1;
}

// Events that can hit the market. text: [ru, uk, en] with {cat} {country} {brand}
const EVENT_TPL = [
  { kind: 'cat', mult: [1.15, 1.35], text: ['Ажиотаж: спрос на {cat} вырос — цены +{p}%', 'Ажіотаж: попит на {cat} зріс — ціни +{p}%', 'Hype: demand for {cat} is up — prices +{p}%'] },
  { kind: 'cat', mult: [0.75, 0.9], text: ['Рынок {cat} перенасыщен — цены −{p}%', 'Ринок {cat} перенасичений — ціни −{p}%', '{cat} market is flooded — prices −{p}%'] },
  { kind: 'country', mult: [1.15, 1.3], text: ['{country}: ввели пошлины на импорт {cat} — цены +{p}%', '{country}: запровадили мита на імпорт {cat} — ціни +{p}%', '{country}: new import duties on {cat} — prices +{p}%'] },
  { kind: 'country', mult: [0.78, 0.9], text: ['{country}: распродажа складов {cat} — цены −{p}%', '{country}: розпродаж складів {cat} — ціни −{p}%', '{country}: warehouse sell‑off of {cat} — prices −{p}%'] },
  { kind: 'brand', mult: [1.15, 1.45], text: ['Блогер‑миллионник показал {brand} — спрос взлетел +{p}%', 'Блогер‑мільйонник показав {brand} — попит злетів +{p}%', 'A mega‑influencer flexed {brand} — demand +{p}%'] },
  { kind: 'brand', mult: [0.75, 0.9], text: ['Скандал вокруг {brand}: вещи бренда дешевеют −{p}%', 'Скандал навколо {brand}: речі бренду дешевшають −{p}%', '{brand} scandal: resale prices −{p}%'] },
  { kind: 'brand', mult: [0.8, 0.92], text: ['Вышла новая модель {brand} — старые дешевеют −{p}%', 'Вийшла нова модель {brand} — старі дешевшають −{p}%', 'New {brand} model launched — older ones −{p}%'] },
];
const EVENT_BRANDS = ['Pear', 'Samsong', 'Xiaomo', 'Nikey', 'Adibas', 'Rolecks', 'Shanel', 'Louis Vuittan', 'Hermez', 'Sonny', 'Nintendu', 'LEGGO', 'Pocketmon TCG', 'Supremo', 'Toyoda', 'BMV', 'Merzedes', 'Porshe', 'Pop Marte', 'Cartie', 'Omego', 'Gucchi', 'Nvidio', 'DGI'];

export function makeEvent(rng) {
  const tpl = rng.pick(EVENT_TPL);
  const mult = rng.float(tpl.mult[0], tpl.mult[1]);
  const len = rng.int(2, 6);
  const e = { id: 'ev' + day() + '_' + rng.int(0, 99999), mult, until: day() + len, from: day(), kind: tpl.kind, tpl: EVENT_TPL.indexOf(tpl) };
  if (tpl.kind === 'cat') e.cat = rng.pick(CAT_LIST);
  if (tpl.kind === 'country') { e.cat = rng.pick(CAT_LIST); e.country = rng.pick(COUNTRIES).id; }
  if (tpl.kind === 'brand') e.brand = rng.pick(EVENT_BRANDS);
  return e;
}
export function eventText(e, Lfn) {
  const tpl = EVENT_TPL[e.tpl];
  if (!tpl) return '';
  const p = Math.round(Math.abs(e.mult - 1) * 100);
  return Lfn(tpl.text).replace('{p}', p).replace('{cat}', e.cat ? Lfn(CATS[e.cat].name).toLowerCase() : '').replace('{country}', e.country ? Lfn(COUNTRY[e.country].name) : '').replace('{brand}', e.brand || '');
}

// Called at every new game day
export function dailyEconomy() {
  const s = G.s;
  const d = day();
  const rng = new RNG(s.id + ':econ:' + d);
  for (const c of CAT_LIST) {
    const cur = s.econ.trend[c] || 1;
    s.econ.trend[c] = clamp(cur * (1 + rng.gauss() * 0.025) + (1 - cur) * 0.08, 0.8, 1.25);
  }
  for (const code of Object.keys(CURRENCIES)) {
    if (code === 'USD') continue;
    const cur = s.econ.fx[code] || 1;
    const vol = ['RUB', 'UAH', 'TRY', 'KZT'].includes(code) ? 0.008 : 0.003;
    s.econ.fx[code] = clamp(cur * (1 + rng.gauss() * vol) + (1 - cur) * 0.03, 0.85, 1.2);
  }
  s.econ.gold = clamp((s.econ.gold || 1) * (1 + rng.gauss() * 0.01) + 0.0005, 0.85, 1.4);
  s.events = s.events.filter((e) => e.until >= d);
  const newEvents = [];
  const n = rng.chance(0.75) ? (rng.chance(0.35) ? 2 : 1) : 0;
  for (let i = 0; i < n; i++) { const e = makeEvent(rng); s.events.push(e); newEvents.push(e); }
  return newEvents;
}
