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
import { noteHotSale } from './hot.js';

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
  noteHotSale(it, p);
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
export const VOL = { 5: 0, 10: 0.01, 20: 0.02, 50: 0.035, 100: 0.05, 200: 0.065 };
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
    const off = r.int(14, 28);
    const unit = Math.round(v * (1 - off / 100) * cnyRate() / 10) * 10; // yuan per phone
    const id = `lot_${day}_${i}`;
    const lot = { id, it, m: m.id, qty: r.int(4, 24), unit, off, seller: r.pick(SUPPLIERS), rating: +(r.float(3.6, 4.9)).toFixed(1), at: day * 1440 + r.int(0, 1300), deal: st.deals[id] || null };
    // how many the seller has in stock: small traders 30–50, big warehouses up to 300
    lot.stock = new RNG(`supx|${s.id}|${id}`).pick([30, 50, 50, 100, 100, 200, 300]);
    lot.sizes = LOT_SIZES.filter((n) => n <= lot.stock);
    return lot;
  }).filter((l) => l.at <= s.t);
}
// ---------------------------------------------------------------- wholesale boxes ("опт‑бокс")
// A sealed box from a Shenzhen trader. You see its price, its theme, how many phones it may hold and what can
// drop (rarity tiers with chances and example models) — never what is actually inside. Order it for yuan
// (no trip needed), it comes by express cargo with customs included, you open it and see what fell out and
// how many. Four new boxes every 5 minutes; an "anything" box can hold literally any phone in the game.
export const BOX_WIN = 300;
export const BOX_DELIVERY = 720; // 12 game hours
export const BOX_THEMES = {
  all: { n: ['Всё подряд', 'Усе підряд', 'Anything goes'], e: '🎲', f: () => true },
  flag: { n: ['Флагманы', 'Флагмани', 'Flagships'], e: '💎', f: (m) => m.price >= 900 },
  budget: { n: ['Бюджетники', 'Бюджетники', 'Budget'], e: '🪙', f: (m) => m.price <= 350 },
  retro: { n: ['Ретро до 2016', 'Ретро до 2016', 'Retro before 2016'], e: '📼', f: (m) => m.year <= 2015 },
  fold: { n: ['Складные', 'Складані', 'Foldables'], e: '📖', f: (m) => m.art?.f === 'fold' || m.art?.f === 'flip' },
  brand: { n: ['Бренд', 'Бренд', 'Brand'], e: '🔖', f: null },
};
export const MIX_KINDS = BOX_THEMES; // reports of older mixed lots
export const BOX_SIZES = { S: { n: [4, 10], k: ['малый', 'малий', 'small'] }, M: { n: [10, 25], k: ['средний', 'середній', 'medium'] }, L: { n: [25, 60], k: ['большой', 'великий', 'large'] } };
export const BOX_TIERS = [
  { k: 'common', n: ['Обычные', 'Звичайні', 'Common'], p: 0.62, col: '#9aa3ad', lo: 0, hi: 0.55 },
  { k: 'good', n: ['Хорошие', 'Хороші', 'Good'], p: 0.27, col: '#4da3ff', lo: 0.55, hi: 0.85 },
  { k: 'top', n: ['Топовые', 'Топові', 'Top'], p: 0.09, col: '#b46bff', lo: 0.85, hi: 0.97 },
  { k: 'jack', n: ['Джекпот', 'Джекпот', 'Jackpot'], p: 0.02, col: '#ffb800', lo: 0.97, hi: 1 },
];
export const boxWindow = () => Math.floor(G.s.t / BOX_WIN);
export const boxRefreshAt = () => (boxWindow() + 1) * BOX_WIN;
const boxUsed = (m) => m.year < 2019; // nobody has sealed boxes of old phones: those come used
function boxItem(rng, m) {
  const used = boxUsed(m);
  const it = makeItem(rng, { model: m.id, quality: used ? 'good' : 'new', fakeMult: 0, lockRate: 0 });
  if (!used) { it.sealed = true; it.cond = 100; it.defects = []; } else { it.sealed = false; delete it.grade; }
  it.fake = 0; it.rar = 0; it.lock = null;
  return it;
}
// what a typical phone of this model is worth at home (sealed if 2019+, used if older)
const valCache = new Map();
function modelVal(m, ref) {
  const k = `${m.id}|${ref}`;
  if (!valCache.has(k)) { const n = boxUsed(m) ? 8 : 1; let v = 0; for (let i = 0; i < n; i++) v += itemValue(boxItem(new RNG(`bv|${m.id}|${i}`), m), ref, 'known'); valCache.set(k, v / n); } // valued as you'll see and sell it
  return valCache.get(k);
}
const boxCache = new Map();
function boxOf(win, i) {
  const s = G.s, id = `box_${win}_${i}`, ref = homeCity(), key = `${s.id}|${id}|${ref}`;
  if (boxCache.has(key)) return boxCache.get(key);
  const r = new RNG(`box|${s.id}|${win}|${i}`);
  const theme = i === 0 || i === 3 ? 'all' : r.pick(['all', 'flag', 'budget', 'retro', 'fold', 'brand']);
  const size = i === 0 ? 'S' : i === 3 ? 'L' : r.pick(['S', 'M', 'M', 'L']);
  let pool = BY_CAT.phones || [], brand = null;
  if (theme === 'brand') { brand = r.pick([...new Set(pool.map((m) => m.brand))].filter((b) => pool.filter((m) => m.brand === b).length >= 8)); pool = pool.filter((m) => m.brand === brand); }
  else pool = pool.filter(BOX_THEMES[theme].f);
  const vals = pool.map((m) => ({ m, v: modelVal(m, ref) })).sort((a, b) => a.v - b.v);
  const N = vals.length;
  let prev = 0;
  const tiers = [];
  for (const [k, t] of BOX_TIERS.entries()) {
    const from = prev, to = k === BOX_TIERS.length - 1 ? N : Math.min(N, Math.max(from + 1, Math.round(t.hi * N)));
    const list = vals.slice(from, to);
    prev = Math.max(prev, to);
    if (!list.length) { if (tiers.length) tiers[tiers.length - 1].p += t.p; continue; }
    tiers.push({ ...t, models: list.map((x) => x.m.id), mean: list.reduce((a, x) => a + x.v, 0) / list.length });
  }
  const evUnit = tiers.reduce((a, t) => a + t.p * t.mean, 0);
  const [a, b] = BOX_SIZES[size].n;
  // the trader's markup varies: some boxes are a better deal than others, nobody tells you which
  const price = Math.max(100, Math.round(((a + b) / 2) * evUnit * r.float(0.82, 0.97) * cnyRate() / 100) * 100);
  const box = { id, win, i, theme, brand, size, nMin: a, nMax: b, price, tiers, seller: r.pick(SUPPLIERS), until: (win + 1) * BOX_WIN };
  boxCache.set(key, box);
  if (boxCache.size > 40) boxCache.delete(boxCache.keys().next().value);
  return box;
}
export const boxes = () => [0, 1, 2, 3].map((i) => boxOf(boxWindow(), i));
export const findBox = (id) => { const m = /^box_(\d+)_(\d)$/.exec(id || ''); return m ? boxOf(+m[1], +m[2]) : null; };
export const boxTitle = (b) => `${BOX_THEMES[b.theme].e} ${L(BOX_THEMES[b.theme].n)}${b.brand ? ` ${b.brand}` : ''} · ${L(BOX_SIZES[b.size].k)}`;
export const myBoxes = () => (supState().boxes ||= []);
export function orderBox(id) {
  const s = G.s, st = supState(), b = findBox(id);
  if (!b || b.win !== boxWindow()) return { ok: false, msg: T('Этот бокс уже разобрали', 'Цей бокс уже розібрали', 'This box is gone') };
  if (myBoxes().some((x) => x.box === id)) return { ok: false, msg: T('Вы уже заказали этот бокс', 'Ви вже замовили цей бокс', 'You already ordered this box') };
  if (st.cny < b.price) return { ok: false, need: b.price - st.cny, msg: T(`Нужно ${b.price.toLocaleString('ru')} ¥, у вас ${st.cny.toLocaleString('ru')} ¥`, `Потрібно ${b.price.toLocaleString('ru')} ¥, у вас ${st.cny.toLocaleString('ru')} ¥`, `Need ${b.price.toLocaleString('ru')} ¥, you have ${st.cny.toLocaleString('ru')} ¥`) };
  st.cny -= b.price;
  const o = { id: uid('ob'), box: id, theme: b.theme, brand: b.brand, size: b.size, price: b.price, usd: b.price / cnyRate(), at: s.t, eta: s.t + BOX_DELIVERY, to: homeCity(), opened: false };
  const list = myBoxes();
  list.unshift(o);
  while (list.length > 12) { const k = list.map((x) => x.opened).lastIndexOf(true); if (k < 0) break; list.splice(k, 1); }
  stat('boxesOrdered');
  emit('sup');
  return { ok: true, o };
}
// opening: how many and which phones is decided right here
export function openBox(oid) {
  const s = G.s, o = myBoxes().find((x) => x.id === oid);
  if (!o || o.opened || s.t < o.eta) return null;
  const b = findBox(o.box);
  if (!b) return null;
  const R = new RNG(`boxopen|${s.id}|${o.id}`);
  const n = R.int(b.nMin, b.nMax);
  const got = [];
  for (let k = 0; k < n; k++) {
    let x = R.next(), t = b.tiers[0];
    for (const tt of b.tiers) { if (x < tt.p) { t = tt; break; } x -= tt.p; }
    const m = MODEL[R.pick(t.models)];
    const it = boxItem(new RNG(`boxi|${o.id}|${k}`), m);
    // the usual surprises of cheap wholesale, rarely
    if (R.chance(0.05)) { it.sealed = false; it.cond = Math.min(it.cond, R.int(82, 92)); it.defects.push({ c: R.pick(PHONE_FIX), x: 0.5, y: 0.5, view: 'front', known: false }); }
    if (R.chance(0.012)) it.fake = 2;
    if (m.brand !== 'Pear' && R.chance(0.03)) it.defects.push({ c: 'cnrom', x: 0.5, y: 0.5, view: 'front', known: false });
    got.push({ it, t: t.k, val: itemValue({ ...it, fake: 0 }, o.to, 'true') });
  }
  const sum = got.reduce((a, x) => a + x.val, 0) || 1;
  for (const g of got) {
    g.it.paid = o.usd * g.val / sum; g.it.loc = o.to; g.it.lot = o.id;
    addItem(g.it, g.it.paid, 'box');
  }
  o.opened = true; o.openedAt = s.t; o.n = n;
  o.value = Math.round(got.reduce((a, g) => a + itemValue(g.it, o.to, 'known'), 0));
  // what the reveal screen shows (light copies, enough to draw the photos)
  o.items = got.map((g) => ({ m: g.it.m, cat: 'phones', seed: g.it.seed, color: g.it.color, v: g.it.v, cond: g.it.cond, sealed: g.it.sealed, defects: [], t: g.t, val: Math.round(itemValue(g.it, o.to, 'known')) }));
  stat('boxesOpened'); addXP(Math.round(10 + n));
  emit('sup'); emit('inv');
  return o;
}
export const findLot = (id) => lots().find((x) => x.id === id);
export const lotTitle = (lot) => (lot.mix ? `${BOX_THEMES[lot.mix].e} ${L(BOX_THEMES[lot.mix].n)}${lot.brand ? ` ${lot.brand}` : ''}` : itemTitle(lot.it));
export function buyYuan(usd) {
  const st = supState();
  if (!spend(usd, 'bank', T('Покупка юаней', 'Купівля юанів', 'Buying yuan'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const cny = Math.floor(usd * cnyRate() * 0.985);
  st.cny += cny; emit('sup');
  return { ok: true, cny };
}
export function sellYuan(cny) { const st = supState(); cny = Math.min(cny, st.cny); st.cny -= cny; const usd = cny / cnyRate() * 0.985; earn(usd, 'bank', T('Продажа юаней', 'Продаж юанів', 'Selling yuan')); emit('sup'); return usd; }
export function setDeal(lot, disc) { const st = supState(); st.deals[lot.id] = { disc, paid: false, qty: lotQty(lot) }; emit('sup'); }
// the size you picked (10 by default); after paying, the size you bought
export const lotQty = (lot) => { const st = supState(); return st.deals[lot.id]?.paid ? st.deals[lot.id].qty || lot.qty : st.picks[lot.id] || (lot.sizes?.includes(10) ? 10 : lot.sizes?.[0] || lot.qty); };
export function pickQty(lot, n) { const st = supState(); if (st.deals[lot.id]?.paid || !lot.sizes.includes(n)) return; st.picks[lot.id] = n; if (st.deals[lot.id]) st.deals[lot.id].qty = n; emit('sup'); }
export const unitFor = (lot, qty = lotQty(lot)) => Math.max(10, Math.round(lot.unit * (1 - (VOL[qty] || 0)) / 10) * 10);
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
  const rep = { id: lot.id, at: s.t, m: lot.m, seller: lot.seller, qty, total, got: qty, short: 0, refund: 0, resort: 0, opened: 0, clones: 0, cn: false };
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
  // a mix-up: an older model of the same brand
  const older = (BY_CAT.phones || []).filter((x) => x.brand === M.brand && x.id !== M.id && x.year < M.year && x.year >= M.year - 4 && x.price < M.price);
  const each = (total - rep.refund) / cnyRate() / rep.got;
  const pin = (it, c) => it.defects.push({ c, x: +R.float(0.3, 0.7).toFixed(3), y: +R.float(0.3, 0.7).toFixed(3), view: 'front', known: false });
  for (let i = 0; i < rep.got; i++) {
    const kind = role.get(i);
    const model = kind === 'resort' && older.length ? R.pick(older).id : lot.m;
    const it = makeItem(new RNG(`${lot.id}|${i}|${s.id}`), { model, quality: 'new', fakeMult: 0, lockRate: 0 });
    if (model === lot.m) it.v = lot.it.v;
    it.sealed = true; it.cond = 100; it.defects = []; it.fake = 0; it.rar = 0; it.paid = each; it.loc = SZX; it.lot = lot.id;
    if (kind === 'clone') it.fake = 2; // a 1:1 replica in an original-looking box
    if (kind === 'opened') { it.sealed = false; it.cond = R.int(84, 93); pin(it, R.pick(PHONE_FIX)); }
    // a few units in any lot are duds or locked
    else if (new RNG(`${lot.id}|q|${i}`).chance(o.dud)) { it.sealed = false; it.cond = 88; if (R.chance(0.5)) it.lock = 'passcode'; else pin(it, R.pick(PHONE_FIX)); }
    if (rep.cn && MODEL[model]?.brand !== 'Pear') pin(it, 'cnrom'); // Chinese firmware: only Android phones
    addItem(it, each, 'supplier');
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
  // boxes that arrived: one message each
  for (const o of myBoxes()) if (!o.notified && s.t >= o.eta) {
    o.notified = true;
    notify('supplier', T('Опт‑бокс доставлен', 'Опт‑бокс доставлено', 'Wholesale box delivered'), T(`${boxTitle(o)} — откройте и посмотрите, что выпало!`, `${boxTitle(o)} — відкрийте й подивіться, що випало!`, `${boxTitle(o)} — open it and see what you got!`), { go: ['supplier', 'obox', { id: o.id }] });
    emit('sup');
  }
  if (s.t % BOX_WIN === 0) {
    const day = Math.floor(s.t / 1440);
    for (const id of Object.keys(st.deals)) {
      const m = /^(lot|mix)_(\d+)_/.exec(id); if (!m) continue;
      if (m[1] === 'mix' || +m[2] < day - 2) { delete st.deals[id]; delete st.picks[id]; }
    }
    for (const id of Object.keys(st.picks)) if (id.startsWith('mix_')) delete st.picks[id];
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
