// Car market (own feed of cars and bikes, VIN reports, instant dealer buyout), Yo.Market (new phones with
// "Split" — pay in 4 parts — and an anti-fraud suspicion meter), Supplier (wholesale lots from Shenzhen in
// yuan: haggle → buy yuan → fly there → pay → ship the lot home by cargo or carry it through customs).
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
export function supState() { const s = G.s; s.sup ||= { cny: 0, deals: {}, notified: 0 }; return s.sup; }
export const cnyRate = () => rate('CNY');
export function lots() {
  const s = G.s, day = Math.floor(s.t / 1440), st = supState();
  const r = new RNG(`sup|${s.id}|${day}`);
  const phones = (BY_CAT.phones || []).filter((m) => m.year >= 2021);
  return Array.from({ length: 8 }, (_, i) => {
    const m = r.pick(phones);
    const it = makeItem(new RNG(`supi|${s.id}|${day}|${i}`), { model: m.id, quality: 'new', fakeMult: 0, lockRate: 0 });
    it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.rar = 0;
    const v = itemValue(it, s.player.city, 'true');
    const off = r.int(20, 40);
    const unit = Math.round(v * (1 - off / 100) * cnyRate() / 10) * 10; // yuan per phone
    const id = `lot_${day}_${i}`;
    return { id, it, m: m.id, qty: r.int(4, 24), unit, off, seller: r.pick(SUPPLIERS), rating: +(r.float(3.6, 4.9)).toFixed(1), at: day * 1440 + r.int(0, 1300), deal: st.deals[id] || null };
  }).filter((l) => l.at <= s.t);
}
export function buyYuan(usd) {
  const st = supState();
  if (!spend(usd, 'bank', T('Покупка юаней', 'Купівля юанів', 'Buying yuan'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const cny = Math.floor(usd * cnyRate() * 0.985);
  st.cny += cny; emit('sup');
  return { ok: true, cny };
}
export function sellYuan(cny) { const st = supState(); cny = Math.min(cny, st.cny); st.cny -= cny; const usd = cny / cnyRate() * 0.985; earn(usd, 'bank', T('Продажа юаней', 'Продаж юанів', 'Selling yuan')); emit('sup'); return usd; }
export function setDeal(lot, disc) { supState().deals[lot.id] = { disc, paid: false }; emit('sup'); }
export const lotTotal = (lot) => Math.round(lot.unit * lot.qty * (1 - (lot.deal?.disc || 0) / 100));
export function payLot(lot) {
  const s = G.s, st = supState();
  if (s.player.city !== SZX) return { ok: false, msg: T('Платить нужно лично — летите в Шэньчжэнь', 'Платити треба особисто — летіть у Шеньчжень', 'Pay in person — fly to Shenzhen') };
  const total = lotTotal(lot);
  if (st.cny < total) return { ok: false, msg: T(`Нужно ${total} ¥, у вас ${st.cny} ¥`, `Потрібно ${total} ¥, у вас ${st.cny} ¥`, `Need ${total} ¥, you have ${st.cny} ¥`) };
  st.cny -= total;
  const each = total / cnyRate() / lot.qty;
  for (let i = 0; i < lot.qty; i++) {
    const it = makeItem(new RNG(`${lot.id}|${i}|${s.id}`), { model: lot.m, quality: 'new', fakeMult: 0, lockRate: 0 });
    it.v = lot.it.v; it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.paid = each; it.loc = SZX; it.lot = lot.id;
    // a few units in every lot turn out refurbished or locked
    if (new RNG(`${lot.id}|q|${i}`).chance(0.08)) { it.sealed = false; it.cond = 88; it.lock = 'passcode'; }
    addItem(it, each, 'supplier');
  }
  st.deals[lot.id] = { ...(st.deals[lot.id] || {}), paid: true };
  stat('lotsBought'); addXP(25);
  emit('sup'); emit('inv');
  return { ok: true, total };
}
export const inShenzhen = () => G.s.inv.filter((it) => it.loc === SZX);
// cargo "door to door": slower, customs included
export function cargoHome() {
  const s = G.s, items = inShenzhen();
  if (!items.length) return { ok: false };
  const home = s.player.city !== SZX ? s.player.city : s.house?.city && s.house.city !== SZX ? s.house.city : (COUNTRIES.find((c) => c.id === s.player.country)?.cities[0].id || 'msk');
  const value = items.reduce((a, it) => a + itemValue(it, home, 'true'), 0);
  const fee = Math.round(value * 0.12 + 15);
  if (!spend(fee, 'customs', T('Карго «под ключ» из Шэньчжэня', 'Карго «під ключ» із Шеньчжені', 'Door‑to‑door cargo from Shenzhen'))) return { ok: false, msg: T(`Нужно ${fmt(fee)}`, `Потрібно ${fmt(fee)}`, `Need ${fmt(fee)}`) };
  for (const it of items) { removeItem(it.id); s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: SZX, to: home, start: s.t, eta: s.t + 2 * 1440, price: it.paid, who: 'Cargo SZX' }); }
  emit('inv'); emit('deliveries');
  return { ok: true, fee, n: items.length };
}
// "a wholesale deal for N phones" notifications
export function supTick() {
  const s = G.s, st = supState();
  if (s.t % 30) return;
  const ls = lots();
  const fresh = ls.filter((l) => l.at > st.notified);
  if (fresh.length && (s.installed || []).includes('supplier')) {
    const l = fresh[fresh.length - 1];
    notify('supplier', T('Опт', 'Опт', 'Wholesale'), T(`Появилась оптовая сделка на ${l.qty} телефонов!`, `Зʼявилася оптова угода на ${l.qty} телефонів!`, `A wholesale deal for ${l.qty} phones just dropped!`), { go: ['supplier'] });
    st.notified = Math.max(...fresh.map((x) => x.at));
  }
}
