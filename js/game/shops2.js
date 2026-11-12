// Car market (own feed of cars and bikes, VIN reports, instant dealer buyout), Yo.Market (new phones with
// "Split" — pay in 4 parts — and an anti-fraud suspicion meter), Supplier (wholesale lots from Shenzhen in
// yuan: haggle → buy yuan → fly there → pay → ship the lot home by cargo or carry it through customs).
// Lots come in sizes from 5 to 200 phones: the bigger the lot, the cheaper each phone, but the more can go
// wrong — rarely: a short count, mixed-up models, opened returns, 1:1 clones, Chinese firmware, a customs
// hold, a crushed box in the cargo. Clones get seized by customs with a fine.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid, clamp } from '../core/util.js';
import { MODEL, BY_CAT, DEFECTS } from '../data/catalog.js';
import { CITY, COUNTRIES, countryOf } from '../data/world.js';
import { makeItem, itemValue, itemTitle, isVehicle } from './items.js';
import { getItem, removeItem, addItem, spend, earn, charge, addXP, notify, stat, canStore, canAfford } from './player.js';
import { makeListing, deliveryTime, marketEstimate } from './market.js';
import { fmt, nicePrice, rate } from '../core/money.js';
import { recordMult, paperPenalty } from './crime.js';

// ---------------------------------------------------------------- car market
export const CAR_CLASSES = [
  ['eco', ['Эконом', 'Економ', 'Budget']], ['comfort', ['Комфорт', 'Комфорт', 'Comfort']], ['biz', ['Бизнес', 'Бізнес', 'Business']], ['prem', ['Премиум', 'Преміум', 'Premium']],
  ['sport', ['Спорт', 'Спорт', 'Sport']], ['suv', ['Внедорожники', 'Позашляховики', 'SUVs']], ['moto', ['Мото', 'Мото', 'Moto']],
];
const SPORT = ['sport', 'super', 'coupe', 'muscle', 'sport911', 'roadster'], OFFROAD = ['suv', 'jeep', 'pickup'];
export function carClass(it) {
  const m = MODEL[it.m];
  if (m.cat === 'bikes') return 'moto';
  const b = m.art?.body;
  if (SPORT.includes(b)) return 'sport';
  if (OFFROAD.includes(b)) return 'suv';
  const v = itemValue(it, G.s.player.city, 'known', { raw: true });
  return v < 8000 ? 'eco' : v < 25000 ? 'comfort' : v < 60000 ? 'biz' : 'prem';
}
export function autoFeed() {
  const s = G.s, key = 'auto:' + s.player.city;
  let f = s.feeds[key];
  if (!f || f.refreshAt <= s.t) {
    const rng = new RNG(`${s.id}:autofeed:${s.player.city}:${s.t}`);
    const items = [];
    const size = CITY[s.player.city]?.size || 1;
    for (let i = 0; i < 14 + size * 6; i++) items.push(makeListing(rng, s.player.city, { cat: rng.chance(0.78) ? 'cars' : 'bikes', maxVal: 2e6 }));
    f = s.feeds[key] = { refreshAt: s.t + 900, items, city: s.player.city, auto: true };
  }
  return f;
}
export const VIN_CODES = ['v_accident', 'v_mileage', 'v_docs', 'v_engine', 'v_gearbox', 'v_electric'];
export const VIN_PRICE = 8;
export function vinReport(it) {
  if (!spend(VIN_PRICE, 'service', T('Отчёт по VIN', 'Звіт за VIN', 'VIN report'))) return null;
  const found = [];
  for (const d of it.defects) if (VIN_CODES.includes(d.c)) { d.known = true; found.push(d.c); }
  it.vin = true;
  stat('vinChecks'); emit('market');
  const r = new RNG(`vin|${it.seed}`);
  return { found, owners: it.owners || 1, km: it.km, realKm: found.includes('v_mileage') ? Math.round((it.km || 0) * r.float(1.6, 2.6) / 1000) * 1000 : it.km, pledge: found.includes('v_docs'), crashes: found.includes('v_accident') ? r.int(1, 3) : 0 };
}
export const buyoutPrice = (it) => nicePrice(itemValue(it, G.s.player.city, 'known') * 0.8);
export function dealerBuyout(it) {
  const p = buyoutPrice(it);
  if (G.s.car === it.id) G.s.car = null;
  removeItem(it.id);
  earn(p, 'sale', T(`Выкуп: ${itemTitle(it)}`, `Викуп: ${itemTitle(it)}`, `Buyout: ${itemTitle(it)}`));
  stat('sold'); addXP(8);
  emit('inv');
  return p;
}

// ---------------------------------------------------------------- Yo.Market + Split
export const YM_BRANDS = ['Pear', 'Samsong', 'Xiaomo', 'Gugle', 'OnePlas', 'Honar', 'Huawai', 'Nokla'];
export function ymState() { const s = G.s; s.ym ||= { plans: [], sus: 0, block: 0, lastDay: Math.floor(s.t / 1440) }; return s.ym; }
export function ymFeed() {
  const s = G.s, day = Math.floor(s.t / 1440);
  if (s.ymFeed?.day === day && s.ymFeed.city === s.player.city) return s.ymFeed;
  const r = new RNG(`ym|${s.id}|${day}`);
  const phones = (BY_CAT.phones || []).filter((m) => m.year >= 2020 && YM_BRANDS.includes(m.brand));
  const items = [];
  for (const b of YM_BRANDS) {
    for (const m of r.sample(phones.filter((x) => x.brand === b), 6)) {
      const it = makeItem(new RNG(`ymi|${m.id}|${day}`), { model: m.id, quality: 'new', fakeMult: 0, lockRate: 0 });
      it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.rar = 0;
      const v = itemValue(it, s.player.city, 'true');
      const off = r.chance(0.55) ? r.int(5, 15) : 0;
      items.push({ id: `ym_${m.id}_${it.v || 0}`, it, brand: b, old: nicePrice(v * 1.06), price: nicePrice(v * 1.06 * (1 - off / 100)), off });
    }
  }
  s.ymFeed = { day, city: s.player.city, items };
  return s.ymFeed;
}
export const splitDebt = () => ymState().plans.reduce((a, p) => a + p.left.reduce((x, y) => x + y.amt, 0), 0);
export const splitLimit = () => Math.max(400, (G.s.level || 1) * 220);
export function ymBuy(x, split) {
  const s = G.s, st = ymState();
  if (!canStore(x.it)) return { ok: false, msg: T('Склад переполнен', 'Склад переповнений', 'Storage is full') };
  if (split) {
    if (st.block > s.t) return { ok: false, msg: T('Сплит заблокирован службой безопасности', 'Спліт заблоковано службою безпеки', 'Split is blocked by security') };
    if (splitDebt() + x.price * 0.75 > splitLimit()) return { ok: false, msg: T(`Лимит сплита ${fmt(splitLimit())} исчерпан`, `Ліміт спліту ${fmt(splitLimit())} вичерпано`, `Split limit ${fmt(splitLimit())} reached`) };
  }
  const first = split ? Math.round(x.price * 25) / 100 : x.price;
  if (!spend(first, 'buy', `${T('Ё.Маркет', 'Ё.Маркет', 'Yo.Market')}: ${itemTitle(x.it)}`)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const it = makeItem(new RNG(uid('ym')), { model: x.it.m, quality: 'new', fakeMult: 0, lockRate: 0 });
  it.v = x.it.v; it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.paid = x.price;
  if (split) {
    it.split = true;
    const part = Math.round(x.price * 25) / 100;
    st.plans.push({ id: uid('sp'), title: itemTitle(it), item: it.id, left: [1, 2, 3].map((k) => ({ amt: part, due: s.t + k * 2880 })) });
    // buying several phones on split in a short time looks like reselling
    const recent = st.plans.filter((p) => p.left.length === 3 && p.left[0].due - 2880 > s.t - 4320).length;
    st.sus = clamp(st.sus + 8 + Math.max(0, recent - 1) * 10, 0, 100);
  }
  s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: s.player.city, to: s.player.city, start: s.t, eta: s.t + Math.round(deliveryTime(s.player.city, s.player.city) * 0.8), price: x.price, who: T('Ё.Маркет', 'Ё.Маркет', 'Yo.Market') });
  stat('bought'); addXP(4);
  emit('ym'); emit('deliveries');
  return { ok: true, first };
}
// a split phone sold quickly raises suspicion (called from the sale flow)
export function ymOnSale(it) { if (it?.split) { const st = ymState(); st.sus = clamp(st.sus + 18, 0, 100); emit('ym'); } }
export function ymTick() {
  const s = G.s, st = s.ym;
  if (!st) return;
  const day = Math.floor(s.t / 1440);
  if (day !== st.lastDay) { st.lastDay = day; st.sus = clamp(st.sus - 6, 0, 100); }
  for (const p of st.plans) {
    while (p.left.length && p.left[0].due <= s.t) {
      const pay = p.left.shift();
      const late = !canAfford(pay.amt);
      charge(pay.amt * (late ? 1 + 0.05 * recordMult() : 1), 'loan', T(`Сплит: ${p.title}`, `Спліт: ${p.title}`, `Split: ${p.title}`));
      if (late) { st.sus = clamp(st.sus + 12, 0, 100); notify('ymarket', T('Просрочка по сплиту', 'Прострочка по спліту', 'Late split payment'), T(`${p.title}: штраф 5%`, `${p.title}: штраф 5%`, `${p.title}: 5% penalty`)); }
    }
  }
  st.plans = st.plans.filter((p) => p.left.length);
  if (st.sus >= 100 && st.block <= s.t) {
    const debt = splitDebt();
    if (debt > 0) charge(debt, 'loan', T('Сплит: досрочное взыскание', 'Спліт: дострокове стягнення', 'Split: debt called in'));
    st.plans = []; st.block = s.t + 7 * 1440; st.sus = 60;
    notify('ymarket', T('Сплит заблокирован', 'Спліт заблоковано', 'Split blocked'), T(`Служба безопасности заподозрила перепродажу. Весь долг ${fmt(debt)} списан сразу, сплит недоступен 7 дней.`, `Служба безпеки запідозрила перепродаж. Увесь борг ${fmt(debt)} списано одразу, спліт недоступний 7 днів.`, `Security suspects reselling. The whole debt ${fmt(debt)} was charged at once; Split is off for 7 days.`));
  }
}

// ---------------------------------------------------------------- Supplier (Shenzhen wholesale in yuan)
export const SZX = 'szx';
const SUPPLIERS = ['MobileLink Гуанчжоу', 'Huaqiang Trade', 'ShenPhone Ltd', 'SZ Unicom Opt', 'Longgang Mobile', 'GreatWall Gadgets'];
export function supState() { const s = G.s; s.sup ||= { cny: 0, deals: {}, notified: 0 }; s.sup.picks ||= {}; s.sup.reports ||= []; s.sup.batches ||= {}; return s.sup; }
// lot sizes and the wholesale discount per phone
export const LOT_SIZES = [5, 10, 20, 50, 100, 200];
export const VOL = { 5: 0, 10: 0.02, 20: 0.04, 50: 0.07, 100: 0.1, 200: 0.12 };
export const cnyRate = () => rate('CNY');
export function lots() {
  const s = G.s, day = Math.floor(s.t / 1440), st = supState();
  const r = new RNG(`sup|${s.id}|${day}`);
  const phones = (BY_CAT.phones || []).filter((m) => m.year >= 2021);
  const ref = homeCity();
  return Array.from({ length: 8 }, (_, i) => {
    const m = r.pick(phones);
    const it = makeItem(new RNG(`supi|${s.id}|${day}|${i}`), { model: m.id, quality: 'new', fakeMult: 0, lockRate: 0 });
    it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.rar = 0;
    const v = itemValue(it, ref, 'true');
    const off = r.int(20, 40);
    const unit = Math.round(v * (1 - off / 100) * cnyRate() / 10) * 10; // yuan per phone
    const id = `lot_${day}_${i}`;
    const lot = { id, it, m: m.id, qty: r.int(4, 24), unit, off, seller: r.pick(SUPPLIERS), rating: +(r.float(3.6, 4.9)).toFixed(1), at: day * 1440 + r.int(0, 1300), deal: st.deals[id] || null };
    // how many the seller has in stock: small traders 30–50, big warehouses up to 300
    lot.stock = new RNG(`supx|${s.id}|${id}`).pick([30, 50, 50, 100, 100, 200, 300]);
    lot.sizes = LOT_SIZES.filter((n) => n <= lot.stock);
    return lot;
  }).filter((l) => l.at <= s.t);
}
// ---------------------------------------------------------------- mixed lots ("микс"): any phone at all
// Three new mixes every 5 minutes (300 game minutes). A mix can hold literally any phone in the catalogue —
// a 2007 iFone next to a Xiaomo 18 Fold and a 99‑dollar Redmo. The manifest lists what is inside; sizes,
// wholesale discount and the rare problems work like single‑model lots. A haggled mix stays yours for a day.
export const MIX_WIN = 300;
export const MIX_KINDS = {
  all: { n: ['Микс: любые телефоны', 'Мікс: будь-які телефони', 'Mix: any phones'], e: '🎲', f: () => true },
  flag: { n: ['Микс флагманов', 'Мікс флагманів', 'Flagship mix'], e: '💎', f: (m) => m.price >= 900 },
  budget: { n: ['Бюджетный микс', 'Бюджетний мікс', 'Budget mix'], e: '🪙', f: (m) => m.price <= 350 },
  retro: { n: ['Ретро‑микс (до 2016)', 'Ретро‑мікс (до 2016)', 'Retro mix (before 2016)'], e: '📼', f: (m) => m.year <= 2015 },
  fold: { n: ['Микс складных', 'Мікс складаних', 'Foldables mix'], e: '📖', f: (m) => m.art?.f === 'fold' || m.art?.f === 'flip' },
  brand: { n: ['Микс бренда', 'Мікс бренду', 'Brand mix'], e: '🏷', f: null },
};
export const mixWindow = () => Math.floor(G.s.t / MIX_WIN);
export const mixRefreshAt = () => (mixWindow() + 1) * MIX_WIN;
const mixCache = new Map();
function mixLot(win, i) {
  const s = G.s, st = supState(), id = `mix_${win}_${i}`, ref = homeCity();
  const key = `${s.id}|${id}|${ref}`;
  let base = mixCache.get(key);
  if (!base) {
    const r = new RNG(`mix|${s.id}|${win}|${i}`);
    const kind = i === 0 ? 'all' : r.pick(['all', 'all', 'flag', 'budget', 'retro', 'fold', 'brand']);
    let pool = BY_CAT.phones || [], brand = null;
    if (kind === 'brand') { brand = r.pick([...new Set(pool.map((m) => m.brand))].filter((b) => pool.filter((m) => m.brand === b).length >= 6)); pool = pool.filter((m) => m.brand === brand); }
    else pool = pool.filter(MIX_KINDS[kind].f);
    const units = [];
    for (let k = 0; k < 200; k++) {
      const m = r.pick(pool);
      // phones older than 2019 come used (nobody has sealed boxes of those), newer ones sealed
      const used = m.year < 2019;
      const it = makeItem(new RNG(`mixi|${s.id}|${id}|${k}`), { model: m.id, quality: used ? 'good' : 'new', fakeMult: 0, lockRate: 0 });
      if (!used) { it.sealed = true; it.cond = 100; it.defects = []; }
      it.fake = 0; it.rar = 0; it.lock = null;
      units.push({ m: m.id, used, val: itemValue(it, ref, 'true'), it });
    }
    const stock = r.pick([30, 50, 100, 100, 200, 200]);
    base = { id, mix: kind, brand, units, win, off: r.int(25, 45), seller: r.pick(SUPPLIERS), rating: +(r.float(3.5, 4.9)).toFixed(1), at: win * MIX_WIN, until: (win + 1) * MIX_WIN, stock, sizes: LOT_SIZES.filter((n) => n <= stock), it: units[0].it, qty: 10 };
    mixCache.set(key, base);
    if (mixCache.size > 40) mixCache.delete(mixCache.keys().next().value);
  }
  return { ...base, deal: st.deals[id] || null };
}
// this window's three mixes + the ones you haggled for that are still held for you
export function mixLots() {
  const s = G.s, st = supState(), w = mixWindow();
  const out = [0, 1, 2].map((i) => mixLot(w, i));
  for (const [id, d] of Object.entries(st.deals)) {
    const m = /^mix_(\d+)_(\d)$/.exec(id);
    if (!m || +m[1] === w || d.paid || !(d.until > s.t)) continue;
    out.push(mixLot(+m[1], +m[2]));
  }
  return out;
}
export const findLot = (id) => (id.startsWith('mix_') ? mixLots() : lots()).find((x) => x.id === id);
export const lotTitle = (lot) => (lot.mix ? `${MIX_KINDS[lot.mix].e} ${L(MIX_KINDS[lot.mix].n)}${lot.brand ? ` ${lot.brand}` : ''}` : itemTitle(lot.it));
// the manifest for a size: models with counts, most valuable first
export function mixManifest(lot, qty = lotQty(lot)) {
  const g = new Map();
  for (const u of lot.units.slice(0, qty)) { const x = g.get(u.m) || { m: u.m, n: 0, val: 0, it: u.it, used: u.used }; x.n++; x.val += u.val; g.set(u.m, x); }
  return [...g.values()].sort((a, b) => b.val / b.n - a.val / a.n);
}
export const mixValue = (lot, qty = lotQty(lot)) => lot.units.slice(0, qty).reduce((a, u) => a + u.val, 0);
export function buyYuan(usd) {
  const st = supState();
  if (!spend(usd, 'bank', T('Покупка юаней', 'Купівля юанів', 'Buying yuan'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const cny = Math.floor(usd * cnyRate() * 0.985);
  st.cny += cny; emit('sup');
  return { ok: true, cny };
}
export function sellYuan(cny) { const st = supState(); cny = Math.min(cny, st.cny); st.cny -= cny; const usd = cny / cnyRate() * 0.985; earn(usd, 'bank', T('Продажа юаней', 'Продаж юанів', 'Selling yuan')); emit('sup'); return usd; }
export function setDeal(lot, disc) { const st = supState(); st.deals[lot.id] = { disc, paid: false, qty: lotQty(lot), ...(lot.mix ? { until: G.s.t + 1440 } : {}) }; emit('sup'); }
// the size you picked (10 by default); after paying, the size you bought
export const lotQty = (lot) => { const st = supState(); return st.deals[lot.id]?.paid ? st.deals[lot.id].qty || lot.qty : st.picks[lot.id] || (lot.sizes?.includes(10) ? 10 : lot.sizes?.[0] || lot.qty); };
export function pickQty(lot, n) { const st = supState(); if (st.deals[lot.id]?.paid || !lot.sizes.includes(n)) return; st.picks[lot.id] = n; if (st.deals[lot.id]) st.deals[lot.id].qty = n; emit('sup'); }
// a mix is priced by what is inside: the average value of its phones, minus the seller's discount
const baseUnit = (lot, qty) => (lot.mix ? mixValue(lot, qty) / qty * (1 - lot.off / 100) * cnyRate() : lot.unit);
export const unitFor = (lot, qty = lotQty(lot)) => Math.max(10, Math.round(baseUnit(lot, qty) * (1 - (VOL[qty] || 0)) / 10) * 10);
export const lotTotal = (lot, qty = lotQty(lot)) => Math.round(unitFor(lot, qty) * qty * (1 - (lot.deal?.disc || 0) / 100));
// rough odds that something goes wrong with this lot (for the card): grows with size, falls with the rating
export function lotOdds(lot, qty = lotQty(lot)) {
  const f = qty / 100, bad = clamp((4.9 - lot.rating) / 1.3, 0, 1);
  return { short: 0.015 + 0.02 * f + 0.02 * bad, resort: 0.01 + 0.02 * f + 0.015 * bad, opened: 0.01 + 0.015 * f + 0.01 * bad, clones: 0.008 + 0.012 * f + 0.03 * bad, cn: 0.01 + 0.012 * f + 0.01 * bad, dud: 0.03 + 0.03 * bad };
}
export function lotRisk(lot, qty = lotQty(lot)) {
  const o = lotOdds(lot, qty);
  const p = 1 - ['short', 'resort', 'opened', 'clones', 'cn'].reduce((a, k) => a * (1 - o[k]), 1);
  return { p, level: p < 0.1 ? 0 : p < 0.18 ? 1 : 2 };
}
const PHONE_FIX = ['battery', 'deadpix', 'speaker', 'port', 'button', 'faceid'];
export function payLot(lot) {
  const s = G.s, st = supState();
  if (s.player.city !== SZX) return { ok: false, msg: T('Платить нужно лично — летите в Шэньчжэнь', 'Платити треба особисто — летіть у Шеньчжень', 'Pay in person — fly to Shenzhen') };
  if (st.deals[lot.id]?.paid) return { ok: false, msg: T('Эта партия уже ваша', 'Ця партія вже ваша', 'This lot is already yours') };
  const qty = lotQty(lot), total = lotTotal(lot, qty);
  if (st.cny < total) return { ok: false, msg: T(`Нужно ${total} ¥, у вас ${st.cny} ¥`, `Потрібно ${total} ¥, у вас ${st.cny} ¥`, `Need ${total} ¥, you have ${st.cny} ¥`) };
  st.cny -= total;
  // what can go wrong — rare, more likely with big lots and low‑rated sellers
  const R = new RNG(`${lot.id}|risk|${qty}|${s.id}`);
  const o = lotOdds(lot, qty);
  const rep = { id: lot.id, at: s.t, m: lot.m || null, mix: lot.mix || null, brand: lot.brand || null, seller: lot.seller, qty, total, got: qty, short: 0, refund: 0, resort: 0, opened: 0, clones: 0, cn: false };
  if (R.chance(o.short)) {
    rep.short = Math.max(1, Math.round(qty * R.float(0.02, 0.06))); rep.got -= rep.short;
    if (lot.rating >= 4.3) { rep.refund = Math.round(total / qty * rep.short); st.cny += rep.refund; } // honest sellers give the money back
  }
  if (R.chance(o.resort)) rep.resort = Math.max(1, Math.round(rep.got * R.float(0.05, 0.15)));
  if (R.chance(o.opened)) rep.opened = Math.max(1, Math.round(rep.got * R.float(0.15, 0.35)));
  if (R.chance(o.clones)) rep.clones = Math.max(1, Math.round(rep.got * R.float(0.03, 0.1)));
  rep.cn = R.chance(o.cn);
  // which boxes are which
  const order = R.shuffle([...Array(rep.got).keys()]);
  const role = new Map();
  order.slice(0, rep.resort).forEach((i) => role.set(i, 'resort'));
  order.slice(rep.resort, rep.resort + rep.clones).forEach((i) => role.set(i, 'clone'));
  order.slice(rep.resort + rep.clones, rep.resort + rep.clones + rep.opened).forEach((i) => role.set(i, 'opened'));
  const M = MODEL[lot.m];
  // a mix-up: an older model of the same brand; in a mix the manifest doesn't match — cheap phones instead
  const older = lot.mix ? (BY_CAT.phones || []).filter((x) => x.price <= 200 && x.year >= 2019) : (BY_CAT.phones || []).filter((x) => x.brand === M.brand && x.id !== M.id && x.year < M.year && x.year >= M.year - 4 && x.price < M.price);
  const paidUsd = (total - rep.refund) / cnyRate();
  const shares = lot.mix ? lot.units.slice(0, rep.got).map((u) => u.val) : null;
  const shareSum = shares ? shares.reduce((a, b) => a + b, 0) : 0;
  const each = paidUsd / rep.got;
  const pin = (it, c) => it.defects.push({ c, x: +R.float(0.3, 0.7).toFixed(3), y: +R.float(0.3, 0.7).toFixed(3), view: 'front', known: false });
  for (let i = 0; i < rep.got; i++) {
    const kind = role.get(i);
    const want = lot.mix ? lot.units[i].m : lot.m;
    const model = kind === 'resort' && older.length ? R.pick(older).id : want;
    let it;
    // a mix delivers exactly the phone from the manifest (colour, memory, condition)
    if (lot.mix && model === want) { it = JSON.parse(JSON.stringify(lot.units[i].it)); it.id = uid('i'); it.tests = {}; }
    else {
      it = makeItem(new RNG(`${lot.id}|${i}|${s.id}`), { model, quality: 'new', fakeMult: 0, lockRate: 0 });
      if (model === want && !lot.mix) it.v = lot.it.v;
      it.sealed = true; it.cond = 100; it.defects = [];
    }
    // in a mix every phone carries its share of the price by value
    const cost = lot.mix ? paidUsd * shares[i] / shareSum : each;
    it.fake = 0; it.rar = 0; it.paid = cost; it.loc = SZX; it.lot = lot.id;
    if (kind === 'clone') it.fake = 2; // a 1:1 replica in an original-looking box
    if (kind === 'opened') { it.sealed = false; it.cond = R.int(84, 93); pin(it, R.pick(PHONE_FIX)); }
    // a few units in any lot are duds or locked
    else if (new RNG(`${lot.id}|q|${i}`).chance(o.dud)) { it.sealed = false; it.cond = 88; if (R.chance(0.5)) it.lock = 'passcode'; else pin(it, R.pick(PHONE_FIX)); }
    if (rep.cn && MODEL[model]?.brand !== 'Pear') pin(it, 'cnrom'); // Chinese firmware: only Android phones
    addItem(it, cost, 'supplier');
  }
  st.deals[lot.id] = { ...(st.deals[lot.id] || {}), paid: true, qty };
  st.reports.unshift(rep); if (st.reports.length > 12) st.reports.length = 12;
  stat('lotsBought'); addXP(Math.round(15 + 10 * Math.sqrt(qty / 10)));
  emit('sup'); emit('inv');
  return { ok: true, total, rep };
}
export const inShenzhen = () => G.s.inv.filter((it) => it.loc === SZX);
// where the goods go and whose market prices count: the city you live in (not Shenzhen)
export function homeCity() {
  const s = G.s;
  return s.player.city !== SZX ? s.player.city : s.house?.city && s.house.city !== SZX ? s.house.city : (COUNTRIES.find((c) => c.id === s.player.country)?.cities[0].id || 'msk');
}
// cargo "door to door": slower, customs included
export function cargoHome() {
  const s = G.s, items = inShenzhen();
  if (!items.length) return { ok: false };
  const home = homeCity();
  const value = items.reduce((a, it) => a + itemValue(it, home, 'true'), 0);
  const fee = Math.round(value * 0.12 + 15);
  if (!spend(fee, 'customs', T('Карго «под ключ» из Шэньчжэня', 'Карго «під ключ» із Шеньчжені', 'Door‑to‑door cargo from Shenzhen'))) return { ok: false, msg: T(`Нужно ${fmt(fee)}`, `Потрібно ${fmt(fee)}`, `Need ${fmt(fee)}`) };
  // the road home: rarely a customs hold (extra duty, a few days), clones seized with a fine, a crushed box
  const n = items.length, f = n / 100, R = new RNG(`cargo|${s.id}|${s.t}`);
  const b = { id: uid('cg'), n, at: s.t, eta: s.t + 2 * 1440, to: home, hold: 0, duty: 0, seized: 0, fine: 0, crushed: 0 };
  if (R.chance(0.015 + 0.03 * f)) { b.hold = R.int(2, 5); b.eta += b.hold * 1440; b.duty = Math.round(value * R.float(0.05, 0.1)); }
  let ship = items;
  const clones = items.filter((it) => it.fake);
  if (clones.length && R.chance(Math.min(0.8, 0.3 + 0.1 * f + clones.length * 0.02))) {
    b.seized = clones.length; b.fine = Math.round(clones.reduce((a, it) => a + itemValue({ ...it, fake: 0 }, home, 'true'), 0) * 0.3 + 30);
    for (const it of clones) removeItem(it.id);
    ship = items.filter((it) => !it.fake);
  }
  if (ship.length && R.chance(0.015 + 0.025 * f)) {
    b.crushed = Math.max(1, Math.round(ship.length * R.float(0.05, 0.12)));
    for (const it of R.sample(ship, b.crushed)) { it.sealed = false; it.cond = Math.min(it.cond, R.int(60, 75)); it.defects.push({ c: 'crack', x: 0.5, y: 0.42, view: 'front', known: true }); }
  }
  for (const it of ship) { removeItem(it.id); s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: SZX, to: home, start: s.t, eta: b.eta, price: it.paid, who: 'Cargo SZX', batch: b.id }); }
  b.n = ship.length;
  supState().batches[b.id] = b;
  emit('inv'); emit('deliveries');
  return { ok: true, fee, n: items.length, hold: b.hold, eta: b.eta };
}
// a cargo shipment arrived (called once per batch by the delivery clock): one message, the surprises paid
export function cargoArrived(id) {
  const st = supState(), b = st.batches[id];
  if (!b || b.done) return;
  b.done = true;
  const lines = [T(`Доставлено ${b.n} шт.`, `Доставлено ${b.n} шт.`, `${b.n} pcs delivered.`)];
  if (b.hold) { charge(b.duty, 'customs', T('Доначисление таможни за крупную партию', 'Донарахування митниці за велику партію', 'Extra customs duty on a large lot')); lines.push(T(`Таможня задержала груз на ${b.hold} дн. и доначислила ${fmt(b.duty)}.`, `Митниця затримала вантаж на ${b.hold} дн. і донарахувала ${fmt(b.duty)}.`, `Customs held it ${b.hold} days and charged ${fmt(b.duty)} more.`)); }
  if (b.seized) { charge(b.fine, 'customs', T('Штраф: контрафакт в партии', 'Штраф: контрафакт у партії', 'Fine: counterfeits in the lot')); stat('seized', b.seized); lines.push(T(`Изъято ${b.seized} шт как контрафакт (клоны в партии), штраф ${fmt(b.fine)}.`, `Вилучено ${b.seized} шт як контрафакт (клони в партії), штраф ${fmt(b.fine)}.`, `${b.seized} pcs seized as counterfeit (clones in the lot), fine ${fmt(b.fine)}.`)); }
  if (b.crushed) lines.push(T(`Одну коробку помяли: ${b.crushed} шт с разбитым экраном.`, `Одну коробку помʼяли: ${b.crushed} шт з розбитим екраном.`, `A box got crushed: ${b.crushed} pcs with cracked screens.`));
  notify('supplier', b.hold || b.seized || b.crushed ? T('Карго прибыло — с сюрпризами', 'Карго прибуло — із сюрпризами', 'Cargo arrived — with surprises') : T('Карго прибыло', 'Карго прибуло', 'Cargo arrived'), lines.join(' '), { go: ['inventory'] });
  for (const k of Object.keys(st.batches)) if (st.batches[k].done && G.s.t - st.batches[k].at > 20 * 1440) delete st.batches[k];
  emit('sup');
}
// "a wholesale deal for N phones" notifications
export function supTick() {
  const s = G.s, st = supState();
  if (s.t % 30) return;
  if (s.t % MIX_WIN === 0) {
    // a new set of mixes: say so only when one holds something special
    const inst = (s.installed || []).includes('supplier');
    if (inst) {
      let best = null;
      for (const l of mixLots().filter((x) => x.win === mixWindow())) for (const u of l.units.slice(0, 50)) if (!best || u.val > best.u.val) best = { l, u };
      if (best && best.u.val >= 1300) notify('supplier', T('Микс‑партия', 'Мікс‑партія', 'Mixed lot'), T(`В микс попался ${itemTitle(best.u.it)}! Обновление через 5 минут.`, `У мікс потрапив ${itemTitle(best.u.it)}! Оновлення через 5 хвилин.`, `A mix has a ${itemTitle(best.u.it)} in it! Refreshes in 5 minutes.`), { go: ['supplier', 'lot', { id: best.l.id }] });
    }
    const day = Math.floor(s.t / 1440), w = mixWindow();
    for (const id of Object.keys(st.deals)) {
      const m = /^(lot|mix)_(\d+)_/.exec(id); if (!m) continue;
      const old = m[1] === 'lot' ? +m[2] < day - 2 : +m[2] < w - 1 && !(st.deals[id].until > s.t && !st.deals[id].paid);
      if (old) { delete st.deals[id]; delete st.picks[id]; }
    }
    for (const id of Object.keys(st.picks)) { const m = /^mix_(\d+)_/.exec(id); if (m && +m[1] < w - 1 && !st.deals[id]) delete st.picks[id]; }
    emit('sup');
  }
  const ls = lots();
  const fresh = ls.filter((l) => l.at > st.notified);
  if (fresh.length && (s.installed || []).includes('supplier')) {
    const l = fresh[fresh.length - 1];
    notify('supplier', T('Опт', 'Опт', 'Wholesale'), T(`Новая оптовая партия: ${itemTitle(l.it)}, до ${l.stock} шт`, `Нова оптова партія: ${itemTitle(l.it)}, до ${l.stock} шт`, `New wholesale lot: ${itemTitle(l.it)}, up to ${l.stock} pcs`), { go: ['supplier'] });
    st.notified = Math.max(...fresh.map((x) => x.at));
  }
}
