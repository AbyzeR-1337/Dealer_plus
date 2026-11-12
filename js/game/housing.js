// Real estate like in real life. Listings in your city — to rent (by the day, week or month, paid up front)
// or to buy — with photos, area, floor, metro, district and five kinds of condition: shabby, dated
// ("granny's renovation"), cosmetic, euro renovation, designer. A month is cheapest per day but takes a deposit,
// and agencies charge half a month. Homes you buy can be lived in, rented out to tenants (daily income, late
// payers, wear and tear), renovated to the next level (worth more, rents for more) or sold.
// Everyone starts in a room paid for one week; older saves get that week minus the days already played.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { clamp, uid } from '../core/util.js';
import { CITY, countryOf } from '../data/world.js';
import { HOUSING, houseDef, spend, charge, earn, notify, stat, canAfford, log, addXP } from './player.js';
import { fmt, nicePrice } from '../core/money.js';
import { HOME_PHOTOS } from '../data/home_photos.js';

export const PERIODS = {
  day: { n: ['сутки', 'доба', 'day'], per: ['сутки', 'добу', 'day'], days: 1, k: 1 },
  week: { n: ['неделя', 'тиждень', 'week'], per: ['неделю', 'тиждень', 'week'], days: 7, k: 0.86 },
  month: { n: ['месяц', 'місяць', 'month'], per: ['месяц', 'місяць', 'month'], days: 30, k: 0.72 },
};
export const TIERS = {
  shabby: { n: ['Обшарпанная', 'Обшарпана', 'Run‑down'], rent: 0.6, sale: 0.65, sleep: -0.08, col: '#9a6b4f', d: ['Обои отходят, линолеум протёрт, на потолке разводы, мебель советская. Зато очень дёшево.', 'Шпалери відходять, лінолеум протертий, на стелі розводи, меблі радянські. Зате дуже дешево.', 'Peeling wallpaper, worn lino, stains on the ceiling, Soviet furniture. Dirt cheap, though.'] },
  meh: { n: ['Бабушкин ремонт', 'Бабусин ремонт', 'Dated'], rent: 0.8, sale: 0.82, sleep: -0.03, col: '#b08d57', d: ['Ремонт из девяностых: ковёр на стене, полированная стенка, старый паркет. Чисто, но «такое себе».', 'Ремонт із девʼяностих: килим на стіні, полірована стінка, старий паркет. Чисто, але «таке собі».', 'A 1990s job: a rug on the wall, a lacquered wardrobe, old parquet. Clean, but meh.'] },
  normal: { n: ['Косметический ремонт', 'Косметичний ремонт', 'Cosmetic'], rent: 1, sale: 1, sleep: 0, col: '#4da3ff', d: ['Свежая покраска, ламинат, простая современная мебель. Заезжай и живи.', 'Свіже фарбування, ламінат, проста сучасна меблі. Заїжджай і живи.', 'Fresh paint, laminate, simple modern furniture. Move right in.'] },
  euro: { n: ['Евроремонт', 'Євроремонт', 'Renovated'], rent: 1.25, sale: 1.15, sleep: 0.03, col: '#2ec27e', d: ['Новый ремонт: светлые стены, встроенная кухня, хорошая сантехника.', 'Новий ремонт: світлі стіни, вбудована кухня, хороша сантехніка.', 'Brand‑new renovation: light walls, a fitted kitchen, good plumbing.'] },
  lux: { n: ['Дизайнерская', 'Дизайнерська', 'Designer'], rent: 1.65, sale: 1.45, sleep: 0.06, col: '#c9a227', d: ['Дизайнерский проект: мрамор, дорогая мебель, свет по сценариям.', 'Дизайнерський проєкт: мармур, дорогі меблі, світло за сценаріями.', 'A designer project: marble, pricey furniture, smart lighting.'] },
};
export const TIER_ORDER = ['shabby', 'meh', 'normal', 'euro', 'lux'];
// kinds of homes: housing stats (store/garage/sleep) come from HOUSING by `def`
export const KINDS = {
  hostel: { def: 'hostel', n: ['Койка в хостеле', 'Ліжко в хостелі', 'Hostel bed'], area: [5, 8], m2Day: 1.6, m2Sale: 0, tiers: ['shabby', 'normal'], pool: 'hostel', rent: ['day', 'week', 'month'] },
  room: { def: 'room', n: ['Комната', 'Кімната', 'Room'], area: [10, 19], m2Day: 1.2, m2Sale: 900, tiers: ['shabby', 'meh', 'normal'], pool: 'room', rent: ['day', 'week', 'month'] },
  studio: { def: 'studio', n: ['Студия', 'Студія', 'Studio'], area: [18, 30], m2Day: 1.0, m2Sale: 1300, tiers: TIER_ORDER, pool: 'apt', rent: ['day', 'week', 'month'] },
  flat: { def: 'flat', n: ['1‑комнатная', '1‑кімнатна', 'One‑bed'], area: [30, 45], m2Day: 0.95, m2Sale: 1250, tiers: TIER_ORDER, pool: 'apt', rent: ['week', 'month'] },
  flat2: { def: 'flat2', n: ['2‑комнатная', '2‑кімнатна', 'Two‑bed'], area: [44, 70], m2Day: 0.9, m2Sale: 1200, tiers: TIER_ORDER, pool: 'apt', rent: ['week', 'month'] },
  flat3: { def: 'flat3', n: ['3‑комнатная', '3‑кімнатна', 'Three‑bed'], area: [64, 100], m2Day: 0.85, m2Sale: 1150, tiers: TIER_ORDER, pool: 'apt', rent: ['month'] },
  townhouse: { def: 'townhouse', n: ['Таунхаус', 'Таунхаус', 'Townhouse'], area: [90, 150], m2Day: 0.7, m2Sale: 1000, tiers: ['meh', 'normal', 'euro', 'lux'], pool: 'house', rent: ['month'] },
  house: { def: 'house', n: ['Дом с участком', 'Будинок з ділянкою', 'House with a plot'], area: [80, 220], m2Day: 0.6, m2Sale: 850, tiers: TIER_ORDER, pool: 'house', rent: ['month'] },
  penthouse: { def: 'penthouse', n: ['Пентхаус', 'Пентхаус', 'Penthouse'], area: [140, 280], m2Day: 1.6, m2Sale: 2400, tiers: ['euro', 'lux'], pool: 'pent', rent: ['month'] },
  villa: { def: 'villa', n: ['Вилла', 'Вілла', 'Villa'], area: [280, 600], m2Day: 1.3, m2Sale: 2000, tiers: ['euro', 'lux'], pool: 'villa', rent: ['month'] },
};
const SCENES = { apt: ['room', 'out', 'kitchen', 'bed', 'bath'], room: ['room', 'kitchen', 'bath'], hostel: ['room', 'bath', 'out'], house: ['out', 'room', 'kitchen', 'bath'], pent: ['room', 'terrace', 'kitchen', 'bath'], villa: ['out', 'room', 'bed', 'bath'] };
const HAS = new Set(HOME_PHOTOS);
const DISTRICTS = [['Центр', 'Центр', 'Centre', 1.3], ['Спальный район', 'Спальний район', 'Suburbs', 0.85], ['У вокзала', 'Біля вокзалу', 'By the station', 0.95], ['Старый город', 'Старе місто', 'Old town', 1.15], ['Новый район', 'Новий район', 'New district', 1], ['Промзона', 'Промзона', 'Industrial area', 0.75]];
const cityK = (cityId) => countryOf(cityId).rent * (CITY[cityId]?.idx || 1);
export function photosOf(x, seed = 1) {
  const k = KINDS[x.type]; if (!k) return [];
  const r = new RNG(`ph|${x.id || x.type}|${seed}`);
  const out = [];
  for (const sc of SCENES[k.pool]) { const n = r.int(0, 1); const key = `${k.pool}_${x.tier}_${sc}_${n}`; if (HAS.has(key)) out.push(key); else if (HAS.has(`${k.pool}_${x.tier}_${sc}_${1 - n}`)) out.push(`${k.pool}_${x.tier}_${sc}_${1 - n}`); }
  return out;
}
export const photoUrl = (key) => `assets/homes/${key}.webp`;
export const kindName = (type) => L(KINDS[type]?.n || houseDef(type).n);
export const tierName = (t) => L((TIERS[t] || TIERS.normal).n);
export const tierTag = (l) => tierName(l.tier);
export const sleepOf = (x) => +(houseDef(KINDS[x.type]?.def || x.type).energy + (TIERS[x.tier]?.sleep || 0)).toFixed(2);
export const titleOf = (x) => `${kindName(x.type)}${x.type === 'hostel' ? '' : `, ${x.m2} м²`}${x.floor ? `, ${x.floor}/${x.floors} ${T('эт.', 'пов.', 'fl.')}` : ''}`;
// money: rent per day and the sale price of a concrete place
export function perDayOf(x) { const k = KINDS[x.type]; return (x.type === 'hostel' ? 9 : x.m2 * k.m2Day) * TIERS[x.tier].rent * cityK(x.city) * (x.dk || 1); }
export function saleValue(x) { const k = KINDS[x.type]; return x.m2 * k.m2Sale * TIERS[x.tier].sale * cityK(x.city) * 1.4 * (x.dk || 1); }
export const priceFor = (x, period) => nicePrice(perDayOf(x) * PERIODS[period].days * PERIODS[period].k);

// this week's listings in a city: kind 'rent' or 'sale'
export function listings(cityId = G.s.player.city, kind = 'rent') {
  const s = G.s, week = Math.floor(s.t / (1440 * 7));
  const r = new RNG(`flats2|${s.id}|${cityId}|${week}|${kind}`);
  const big = (CITY[cityId]?.size || 1) >= 3;
  const plan = kind === 'rent'
    ? [['hostel', 2], ['room', 3], ['studio', 3], ['flat', 3], ['flat2', 3], ['flat3', 2], ['townhouse', 1], ['house', 2], ['penthouse', 1], ['villa', big ? 1 : 0]]
    : [['room', 2], ['studio', 3], ['flat', 3], ['flat2', 3], ['flat3', 2], ['townhouse', 1], ['house', 3], ['penthouse', 1], ['villa', 1]];
  const out = [];
  for (const [type, n] of plan) for (let i = 0; i < n; i++) {
    const k = KINDS[type];
    const tier = r.pick(k.tiers);
    const d = r.pick(DISTRICTS);
    const flatty = !['house', 'townhouse', 'villa'].includes(type);
    const floors = flatty ? (tier === 'shabby' || tier === 'meh' ? r.pick([5, 5, 9]) : type === 'penthouse' ? r.int(18, 40) : r.pick([9, 12, 16, 17, 25])) : 0;
    const x = { id: `hm_${kind}_${cityId}_${week}_${type}_${i}`, kind, type, tier, m2: r.int(...k.area), floor: flatty ? (type === 'penthouse' ? floors : r.int(1, floors)) : 0, floors, metro: r.int(3, 28), district: d.slice(0, 3), dk: d[3] * r.float(0.94, 1.06), agency: type !== 'hostel' && r.chance(0.55), city: cityId };
    x.photos = photosOf(x, week);
    if (kind === 'rent') { x.perDay = perDayOf(x); x.periods = k.rent; } else x.price = nicePrice(saleValue(x) * r.float(0.92, 1.1));
    out.push(x);
  }
  return out;
}
export const findListing = (id) => listings(G.s.player.city, id.includes('_sale_') ? 'sale' : 'rent').find((x) => x.id === id);
export function moveInCost(l, period) {
  const price = priceFor(l, period);
  const deposit = period === 'month' && l.type !== 'hostel' ? price : 0;
  const fee = l.agency && period === 'month' ? nicePrice(price * 0.5) : 0;
  return { price, deposit, fee, total: price + deposit + fee };
}

// ---------------------------------------------------------------- where you live
export const renting = () => { const h = G.s.house; return h && h.type !== 'none' && !h.own; };
export const paidLeft = () => (renting() ? G.s.house.paidUntil - G.s.t : 0);
const snap = (x) => ({ type: x.type, tier: x.tier, m2: x.m2, floor: x.floor, floors: x.floors, metro: x.metro, district: x.district, dk: x.dk, city: x.city, photos: x.photos || photosOf(x) });
export function rentListing(l, period) {
  const s = G.s, c = moveInCost(l, period);
  if (!canAfford(c.total)) return { ok: false, msg: T(`Нужно ${fmt(c.total)}`, `Потрібно ${fmt(c.total)}`, `You need ${fmt(c.total)}`) };
  const back = moveOut(true);
  spend(c.price, 'rent', `${titleOf(l)} · ${L(PERIODS[period].per)}`);
  if (c.deposit) spend(c.deposit, 'rent', T('Залог за квартиру', 'Застава за квартиру', 'Rental deposit'));
  if (c.fee) spend(c.fee, 'service', T('Комиссия агентства', 'Комісія агентства', 'Agency commission'));
  s.house = { v: 3, ...snap(l), type: KINDS[l.type].def, kindType: l.type, own: false, since: s.t, period, price: c.price, perDay: l.perDay, deposit: c.deposit, paidUntil: s.t + PERIODS[period].days * 1440, listing: l.id, auto: true, late: 0 };
  stat('moves'); log('house', titleOf(l));
  emit('house');
  return { ok: true, back, cost: c };
}
// leaving a rented place: the deposit comes back (if you’re not behind), prepaid days don’t; an owned home just becomes empty
export function moveOut(silent = false) {
  const s = G.s, h = s.house;
  if (!h || h.type === 'none') return 0;
  if (h.own) { const home = myHome(h.homeId); if (home && home.mode === 'live') home.mode = 'empty'; s.house = { v: 3, type: 'none', own: false, city: s.player.city }; if (!silent) emit('house'); return 0; }
  const back = h.deposit && !h.late ? h.deposit : 0;
  if (back) earn(back, 'refund', T('Возврат залога', 'Повернення застави', 'Deposit returned'));
  s.house = { v: 3, type: 'none', own: false, city: s.player.city };
  if (!silent) emit('house');
  return back;
}
export function prepay(periods = 1) {
  const s = G.s, h = s.house;
  if (!renting()) return { ok: false };
  const sum = h.price * periods;
  if (!spend(sum, 'rent', `${homeName()} · ${periods} × ${L(PERIODS[h.period].per)}`)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  h.paidUntil = Math.max(h.paidUntil, s.t) + PERIODS[h.period].days * 1440 * periods;
  h.late = 0;
  emit('house');
  return { ok: true, sum };
}
export function setPeriod(period) {
  const h = G.s.house; if (!renting() || !PERIODS[period]) return;
  h.period = period; h.price = nicePrice((h.perDay || 0) * PERIODS[period].days * PERIODS[period].k);
  emit('house');
}
export const homeName = () => { const h = G.s.house; if (!h || h.type === 'none') return L(houseDef('none').n); return h.m2 ? titleOf({ ...h, type: h.kindType || h.type }) : h.name ? L(h.name) : L(houseDef(h.type).n); };

// ---------------------------------------------------------------- homes you own
export const homes = () => (G.s.homes ||= []);
export const myHome = (id) => homes().find((x) => x.id === id);
export const homeValue = (h) => saleValue(h) * (h.wear ? 1 - h.wear : 1);
export const marketRent = (h) => perDayOf(h);
export function buyListing(l) {
  const s = G.s;
  if (!spend(l.price, 'realty', titleOf(l))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const fee = nicePrice(l.price * 0.01);
  charge(fee, 'gov', T('Госпошлина и регистрация сделки', 'Держмито й реєстрація угоди', 'Registration fee'));
  const h = { id: uid('home'), ...snap(l), paid: l.price, bought: s.t, mode: 'empty', rentK: 1, wear: 0 };
  homes().push(h);
  stat('homesBought'); addXP(40);
  emit('house');
  return { ok: true, h };
}
export function liveIn(id) {
  const s = G.s, h = myHome(id);
  if (!h || h.reno) return { ok: false, msg: T('Сейчас там ремонт', 'Зараз там ремонт', 'It’s under renovation') };
  if (h.mode === 'rent' && h.tenant) return { ok: false, msg: T('Там живут жильцы', 'Там живуть мешканці', 'Tenants live there') };
  const back = moveOut(true);
  for (const x of homes()) if (x.mode === 'live') x.mode = 'empty';
  h.mode = 'live';
  s.house = { v: 3, ...snap(h), type: KINDS[h.type].def, kindType: h.type, own: true, homeId: h.id, since: s.t };
  emit('house');
  return { ok: true, back };
}
export function rentOut(id, k = 1) {
  const s = G.s, h = myHome(id);
  if (!h || h.reno) return { ok: false, msg: T('Сейчас там ремонт', 'Зараз там ремонт', 'It’s under renovation') };
  if (h.mode === 'live') moveOut(true);
  h.mode = 'rent'; h.rentK = clamp(k, 0.6, 1.6);
  if (!h.tenant) h.findAt = s.t + Math.round(1440 * (0.4 + Math.max(0, h.rentK - 0.85) * 6) * new RNG(`tn|${h.id}|${s.t}`).float(0.6, 1.6));
  emit('house');
  return { ok: true };
}
export function stopRent(id) { const h = myHome(id); if (!h) return; if (h.tenant) notify('realty', T('Жильцы съехали', 'Мешканці зʼїхали', 'Tenants moved out'), titleOf(h)); h.tenant = null; h.mode = 'empty'; h.findAt = 0; emit('house'); }
export const RENO_COST = { shabby: 150, meh: 250, normal: 400, euro: 900 }; // per m², before the city factor
export function renoQuote(h) {
  const i = TIER_ORDER.indexOf(h.tier); if (i < 0 || i >= TIER_ORDER.length - 1) return null;
  const next = TIER_ORDER[i + 1];
  if (!KINDS[h.type].tiers.includes(next)) return null;
  return { next, cost: nicePrice(h.m2 * RENO_COST[h.tier] * cityK(h.city)), days: Math.max(2, Math.round(h.m2 / 25) + i) };
}
export function renovate(id) {
  const s = G.s, h = myHome(id), q = h && renoQuote(h);
  if (!q) return { ok: false };
  if (h.mode === 'rent' && h.tenant) return { ok: false, msg: T('Сначала попросите жильцов съехать', 'Спершу попросіть мешканців зʼїхати', 'Ask the tenants to leave first') };
  if (!spend(q.cost, 'repair', T(`Ремонт: ${titleOf(h)}`, `Ремонт: ${titleOf(h)}`, `Renovation: ${titleOf(h)}`))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  if (h.mode === 'live') moveOut(true);
  h.mode = 'empty'; h.reno = { to: q.next, until: s.t + q.days * 1440 };
  stat('renovations');
  emit('house');
  return { ok: true, q };
}
export function sellHome(id) {
  const s = G.s, h = myHome(id);
  if (!h) return { ok: false };
  if (h.mode === 'live') moveOut(true);
  const v = nicePrice(homeValue(h) * 0.95); // agency 5%
  s.homes = homes().filter((x) => x !== h);
  earn(v, 'realty', T(`Продажа: ${titleOf(h)}`, `Продаж: ${titleOf(h)}`, `Sold: ${titleOf(h)}`));
  addXP(20); stat('homesSold');
  emit('house');
  return { ok: true, v, profit: v - (h.paid || 0) - (h.spent || 0) };
}
const TENANTS = ['Семья с ребёнком', 'Студенты', 'Молодая пара', 'Айтишник', 'Пенсионерка', 'Командировочный', 'Девушка с котом', 'Двое строителей'];
const TENANTS_UK = ['Родина з дитиною', 'Студенти', 'Молода пара', 'Айтівець', 'Пенсіонерка', 'Відрядженець', 'Дівчина з котом', 'Двоє будівельників'];
const TENANTS_EN = ['A family with a kid', 'Students', 'A young couple', 'An IT guy', 'A pensioner', 'A business traveller', 'A girl with a cat', 'Two builders'];
function homesTick() {
  const s = G.s;
  for (const h of homes()) {
    if (h.reno && s.t >= h.reno.until) { h.tier = h.reno.to; h.reno = null; h.wear = 0; h.photos = photosOf({ ...h, id: h.id }, s.t); notify('realty', T('Ремонт готов', 'Ремонт готовий', 'Renovation done'), `${titleOf(h)} · ${tierName(h.tier)}`); emit('house'); }
    if (h.mode !== 'rent') continue;
    if (!h.tenant && h.findAt && s.t >= h.findAt) {
      const r = new RNG(`tenant|${h.id}|${s.t}`);
      const i = r.int(0, TENANTS.length - 1);
      h.tenant = { who: [TENANTS[i], TENANTS_UK[i], TENANTS_EN[i]], perDay: marketRent(h) * h.rentK, since: s.t, until: s.t + r.int(20, 90) * 1440, nextPay: s.t + 1440, late: 0 };
      notify('realty', T('Нашлись жильцы', 'Знайшлися мешканці', 'Tenants found'), `${titleOf(h)}: ${L(h.tenant.who)} · ${fmt(h.tenant.perDay * 30)}/${T('мес', 'міс', 'mo')}`);
      emit('house');
    }
    const tn = h.tenant;
    if (!tn) continue;
    if (s.t >= tn.nextPay) {
      tn.nextPay += 1440;
      const r = new RNG(`pay|${h.id}|${s.t}`);
      if (r.chance(0.03)) { tn.late++; if (tn.late === 1) notify('realty', T('Жильцы задерживают оплату', 'Мешканці затримують оплату', 'Tenants are late'), titleOf(h)); }
      else { const due = tn.perDay * (1 + tn.late); tn.late = 0; earn(due, 'rent', T(`Аренда: ${titleOf(h)}`, `Оренда: ${titleOf(h)}`, `Rent: ${titleOf(h)}`)); h.earned = (h.earned || 0) + due; }
      if (r.chance(0.004)) { h.wear = Math.min(0.25, (h.wear || 0) + 0.06); notify('realty', T('Жильцы что-то сломали', 'Мешканці щось зламали', 'Tenants broke something'), T(`${titleOf(h)}: стоимость чуть упала, ремонт исправит`, `${titleOf(h)}: вартість трохи впала, ремонт виправить`, `${titleOf(h)}: value dipped a bit, a renovation fixes it`)); }
    }
    if (s.t >= tn.until) { h.tenant = null; h.findAt = s.t + 1440; notify('realty', T('Жильцы съехали', 'Мешканці зʼїхали', 'Tenants moved out'), T(`${titleOf(h)} — ищем новых`, `${titleOf(h)} — шукаємо нових`, `${titleOf(h)} — looking for new ones`)); emit('house'); }
  }
}

// ---------------------------------------------------------------- the clock (every game minute)
export function rentTick() {
  const s = G.s, h = s.house;
  if (s.homes?.length && s.t % 10 === 0) homesTick();
  if (!h || h.type === 'none' || h.own || !h.paidUntil) return;
  if (s.t < h.paidUntil) {
    if (!h.warned && h.paidUntil - s.t <= 720 && !(h.auto && canAfford(h.price))) { h.warned = true; notify('realty', T('Аренда заканчивается', 'Оренда закінчується', 'Rent runs out soon'), T(`Оплачено ещё на 12 ч. Следующий платёж ${fmt(h.price)}.`, `Оплачено ще на 12 год. Наступний платіж ${fmt(h.price)}.`, `Paid for 12 more hours. Next payment ${fmt(h.price)}.`)); }
    return;
  }
  if (h.auto && canAfford(h.price)) {
    charge(h.price, 'rent', `${homeName()} · ${L(PERIODS[h.period].per)}`);
    h.paidUntil += PERIODS[h.period].days * 1440; h.late = 0; h.warned = false;
    notify('realty', T('Аренда продлена', 'Оренду продовжено', 'Rent renewed'), `${fmt(h.price)} · ${L(PERIODS[h.period].per)}`, { noBadge: true });
    emit('house');
    return;
  }
  if (!h.late) { h.late = 1; h.graceUntil = s.t + 1440; notify('realty', T('Просрочка аренды', 'Прострочка оренди', 'Rent overdue'), T(`Хозяин ждёт ${fmt(h.price)} до завтра — иначе выселение.`, `Господар чекає ${fmt(h.price)} до завтра — інакше виселення.`, `The landlord wants ${fmt(h.price)} by tomorrow or you’re out.`)); emit('house'); return; }
  if (s.t >= h.graceUntil) {
    const lost = h.deposit || 0;
    s.house = { v: 3, type: 'none', own: false, city: s.player.city };
    notify('realty', T('Вас выселили', 'Вас виселили', 'Evicted'), lost ? T(`Залог ${fmt(lost)} пошёл в счёт долга.`, `Заставу ${fmt(lost)} зараховано в борг.`, `The ${fmt(lost)} deposit covered the debt.`) : T('Нечем было платить за жильё.', 'Нічим було платити за житло.', 'You couldn’t pay the rent.'));
    stat('evicted');
    emit('house');
  }
}

// ---------------------------------------------------------------- new games and older saves
const OLD_TIER = { cheap: 'meh', normal: 'normal', lux: 'euro' };
export function ensureHousing() {
  const s = G.s;
  homes();
  if (s.house?.v === 3) return;
  const city = s.player.city;
  // v2 (rent listings without photos): keep the deal, add photos and the new condition names
  if (s.house?.v === 2) {
    const h = s.house;
    if (h.type !== 'none' && !h.own) { h.tier = OLD_TIER[h.tier] || h.tier || 'normal'; h.kindType = h.type; if (!h.m2) h.m2 = KINDS[h.type] ? KINDS[h.type].area[0] : 20; h.photos = photosOf({ ...h, id: h.listing || h.type }); }
    if (h.own) { const home = { id: uid('home'), type: KINDS[h.type] ? h.type : 'flat', tier: 'normal', m2: KINDS[h.type]?.area[1] || 40, floor: 3, floors: 9, metro: 10, district: ['Новый район', 'Новий район', 'New district'], dk: 1, city: h.city || city, paid: h.paid || 0, bought: h.since || 0, mode: 'live', rentK: 1, wear: 0 }; home.photos = photosOf(home); homes().push(home); s.house = { v: 3, ...snap(home), type: KINDS[home.type].def, kindType: home.type, own: true, homeId: home.id, since: home.bought }; return; }
    h.v = 3; return;
  }
  const played = Math.floor(s.t / 1440);
  const left = Math.max(0, 7 - played);
  if (s.house?.own) { s.house.v = 2; return ensureHousing(); }
  const ls = listings(city, 'rent');
  if (s.house && s.house.type !== 'none') {
    // was renting by the day: the same kind of place on a weekly plan; the free week minus played days is prepaid
    const t = KINDS[s.house.type] ? s.house.type : 'room';
    const l = ls.find((x) => x.type === t) || ls.find((x) => x.type === 'room');
    const until = left > 0 ? s.t + left * 1440 : s.t + (1440 - (s.t % 1440));
    s.house = { v: 3, ...snap(l), type: KINDS[t].def, kindType: t, own: false, since: s.house.since || 0, period: 'week', perDay: l.perDay, price: priceFor(l, 'week'), deposit: 0, paidUntil: until, listing: l.id, auto: true, late: 0 };
    return;
  }
  if (left <= 0) { s.house = { v: 3, type: 'none', own: false, city }; return; }
  const room = ls.filter((x) => x.type === 'room').sort((a, b) => a.perDay - b.perDay)[0];
  s.house = { v: 3, ...snap(room), type: 'room', kindType: 'room', own: false, since: s.t, period: 'week', perDay: room.perDay, price: priceFor(room, 'week'), deposit: 0, paidUntil: s.t + left * 1440, listing: room.id, auto: true, late: 0, starter: true };
  if (played === 0) notify('realty', T('Жильё на первую неделю', 'Житло на перший тиждень', 'A home for your first week'), T(`${titleOf(room)} — оплачено на 7 дней. Дальше продлевайте или переезжайте в «Недвижимости».`, `${titleOf(room)} — оплачено на 7 днів. Далі продовжуйте або переїжджайте в «Нерухомості».`, `${titleOf(room)} — paid for 7 days. Then renew or move in Real estate.`), { noBadge: true });
}
