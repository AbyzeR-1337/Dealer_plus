// Business: commercial property, shops, interior, staff, pricing and hourly sales simulation.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rnd, rint, pickR } from '../core/util.js';
import { RNG } from '../core/rng.js';
import { CITY, countryOf } from '../data/world.js';
import { CATS, CAT_LIST, LUXURY_CATS } from '../data/catalog.js';
import { earn, spend, charge, stat, addXP, notify, log, getItem, removeItem, addItem, repFactor, addProfit, upLevel } from './player.js';
import { itemValue, itemTitle, isVehicle } from './items.js';
import { fmt, nicePrice } from '../core/money.js';
import { npcName } from './npc.js';
import { feedFor, isBelowMarket } from './market.js';
import { DEFECTS } from '../data/catalog.js';

export const PROPS = [
  { id: 'kiosk', n: ['Киоск', 'Кіоск', 'Kiosk'], price: 9000, rent: 14, slots: 6, traffic: 3, kind: 'shop', icon: '🏪' },
  { id: 'pavilion', n: ['Павильон на рынке', 'Павільйон на ринку', 'Market stall'], price: 22000, rent: 28, slots: 12, traffic: 5, kind: 'shop', icon: '⛺' },
  { id: 'street', n: ['Магазин у дома', 'Магазин біля дому', 'Street shop'], price: 70000, rent: 70, slots: 24, traffic: 8, kind: 'shop', icon: '🏬' },
  { id: 'mall', n: ['Отдел в ТЦ', 'Відділ у ТЦ', 'Mall store'], price: 160000, rent: 160, slots: 36, traffic: 14, kind: 'shop', icon: '🛍' },
  { id: 'boutique', n: ['Бутик в центре', 'Бутик у центрі', 'Downtown boutique'], price: 420000, rent: 380, slots: 20, traffic: 9, kind: 'shop', lux: 1.25, icon: '💎' },
  { id: 'showroom', n: ['Автосалон', 'Автосалон', 'Car showroom'], price: 600000, rent: 520, slots: 8, traffic: 5, kind: 'showroom', cars: true, icon: '🚘' },
  { id: 'warehouse', n: ['Склад 150 м²', 'Склад 150 м²', 'Warehouse 150 m²'], price: 60000, rent: 45, slots: 0, cap: 150, traffic: 0, kind: 'warehouse', icon: '🏭' },
  { id: 'apartment', n: ['Квартира под сдачу', 'Квартира під здачу', 'Rental flat'], price: 110000, rent: 0, slots: 0, traffic: 0, kind: 'rental', income: 0.0028, icon: '🏢' },
  { id: 'house_rental', n: ['Дом под сдачу', 'Будинок під здачу', 'Rental house'], price: 300000, rent: 0, slots: 0, traffic: 0, kind: 'rental', income: 0.0026, icon: '🏡' },
];
export const RENO = [
  { n: ['Голые стены', 'Голі стіни', 'Bare walls'], cost: 0, mult: 0.6 },
  { n: ['Косметика', 'Косметичний', 'Basic'], cost: 0.08, mult: 1 },
  { n: ['Хороший ремонт', 'Гарний ремонт', 'Good'], cost: 0.2, mult: 1.3 },
  { n: ['Дизайнерский', 'Дизайнерський', 'Designer'], cost: 0.45, mult: 1.65 },
];
export const STYLES = [
  { id: 'minimal', n: ['Минимализм', 'Мінімалізм', 'Minimal'], cats: ['phones', 'electronics', 'accessories', 'perfume'], c: ['#f2f2f2', '#d0d4da'] },
  { id: 'loft', n: ['Лофт', 'Лофт', 'Loft'], cats: ['sneakers', 'clothing', 'bikes', 'instruments'], c: ['#8a5a3a', '#2a2a2a'] },
  { id: 'neon', n: ['Неон / кибер', 'Неон / кібер', 'Neon / cyber'], cats: ['consoles', 'electronics', 'toys', 'cards', 'comics'], c: ['#ff2bd6', '#2bf2ff'] },
  { id: 'luxury', n: ['Люкс', 'Люкс', 'Luxury'], cats: ['watches', 'bags', 'jewelry', 'perfume', 'cars'], c: ['#d4af37', '#141414'] },
  { id: 'vintage', n: ['Винтаж', 'Вінтаж', 'Vintage'], cats: ['antiques', 'art', 'collectibles', 'comics', 'instruments'], c: ['#b08968', '#3a2a1a'] },
];
export const ROLES = {
  seller: { n: ['Продавец', 'Продавець', 'Sales clerk'], wage: 22, icon: '🧑‍💼' },
  tech: { n: ['Мастер', 'Майстер', 'Technician'], wage: 30, icon: '🔧' },
  buyer: { n: ['Закупщик', 'Закупник', 'Buyer'], wage: 35, icon: '🛒' },
  manager: { n: ['Управляющий', 'Керуючий', 'Manager'], wage: 55, icon: '👔' },
  guard: { n: ['Охранник', 'Охоронець', 'Guard'], wage: 18, icon: '🛡' },
};
const STAFF_TRAITS = {
  honest: ['Честный', 'Чесний', 'Honest'], star: ['Звезда продаж', 'Зірка продажів', 'Sales star'], lazy: ['Ленивый', 'Лінивий', 'Lazy'],
  thief: ['Подозрительный', 'Підозрілий', 'Shady'], fast: ['Шустрый', 'Швидкий', 'Quick'], rookie: ['Новичок', 'Новачок', 'Rookie'],
};
export const staffTrait = (k) => L(STAFF_TRAITS[k]);

export const propPrice = (p, city = G.s.player.city) => p.price * countryOf(city).rent * (CITY[city]?.idx || 1) * 1.15;
export const propRent = (p, city = G.s.player.city) => p.rent * countryOf(city).rent * (CITY[city]?.idx || 1);
export const shopById = (id) => G.s.biz.shops.find((x) => x.id === id);
export const propById = (id) => G.s.props.find((x) => x.id === id);

export function acquireProp(defId, own) {
  const s = G.s;
  const p = PROPS.find((x) => x.id === defId);
  const cost = own ? propPrice(p) : propRent(p) * 3;
  if (!spend(cost, own ? 'realty' : 'rent', L(p.n))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const prop = { id: uid('pr'), def: p.id, kind: p.kind, city: s.player.city, own, value: own ? propPrice(p) * 0.9 : 0, rent: own ? 0 : propRent(p), cap: p.cap, at: s.t, prepaid: own ? 0 : 2 };
  s.props.push(prop);
  stat('props'); addXP(own ? 50 : 20);
  log('realty', L(p.n));
  emit('biz');
  return { ok: true, prop };
}
export function releaseProp(id) {
  const s = G.s;
  const prop = propById(id);
  if (!prop) return;
  const shop = s.biz.shops.find((x) => x.propId === id);
  if (shop) closeShop(shop.id);
  if (prop.own) earn(prop.value * 0.95, 'realty', T('Продажа недвижимости', 'Продаж нерухомості', 'Property sale'));
  s.props = s.props.filter((x) => x !== prop);
  emit('biz');
}
export function openShop(propId, name, cat) {
  const s = G.s;
  const prop = propById(propId);
  if (!prop || s.biz.shops.some((x) => x.propId === propId)) return false;
  const def = PROPS.find((x) => x.id === prop.def);
  const shop = { id: uid('sh'), propId, name: name || s.biz.name || T('Мой магазин', 'Мій магазин', 'My store'), city: prop.city, cat: cat || 'mix', reno: 0, style: 'minimal', staff: [], slots: def.slots, open: true, rev: 0, sold: 0, log: [], ads: 0, budget: 0, at: s.t, def: def.id };
  s.biz.shops.push(shop);
  if (!s.biz.founded) s.biz.founded = s.t;
  stat('shops'); addXP(60);
  emit('biz');
  return shop;
}
export function closeShop(id) {
  const s = G.s;
  const shop = shopById(id);
  if (!shop) return;
  for (const it of s.inv) if (it.shop === id) { delete it.shop; delete it.shopPrice; }
  s.biz.shops = s.biz.shops.filter((x) => x !== shop);
  emit('biz');
}
export const shelf = (shop) => G.s.inv.filter((i) => i.shop === shop.id);
export function stockItem(shop, itemId, price) {
  const it = getItem(itemId);
  if (!it || it.listed || shelf(shop).length >= shop.slots) return false;
  if (isVehicle(it) && shop.def !== 'showroom') return false;
  it.shop = shop.id; it.shopPrice = price;
  it.loc = shop.city;
  emit('biz');
  return true;
}
export function unstock(itemId) { const it = getItem(itemId); if (it) { delete it.shop; delete it.shopPrice; emit('biz'); } }
export function renovate(shop, lvl) {
  const prop = propById(shop.propId);
  const def = PROPS.find((x) => x.id === prop.def);
  const cost = propPrice(def, shop.city) * RENO[lvl].cost;
  if (!spend(cost, 'biz', L(RENO[lvl].n))) return false;
  shop.reno = lvl; addXP(20);
  emit('biz');
  return true;
}
export const renoCost = (shop, lvl) => { const def = PROPS.find((x) => x.id === shop.def); return propPrice(def, shop.city) * RENO[lvl].cost; };
export const styleCost = (shop) => renoCost(shop, 1) * 0.5 + 200;
export function setStyle(shop, styleId) { if (!spend(styleCost(shop), 'biz', 'interior')) return false; shop.style = styleId; emit('biz'); return true; }

export function candidates() {
  const s = G.s;
  if (!s.biz.cand || s.biz.candAt <= s.t) {
    const rng = new RNG(`${s.id}:cand:${s.t}`);
    s.biz.cand = [];
    for (let i = 0; i < 6; i++) {
      const role = rng.pick(Object.keys(ROLES));
      const skill = rng.weighted([1, 2, 3, 4, 5], (k) => [3, 3, 2, 1, 0.4][k - 1]);
      const trait = rng.weighted(Object.keys(STAFF_TRAITS), (k) => ({ honest: 3, star: 0.7, lazy: 1, thief: 0.8, fast: 1, rookie: 1.5 }[k]));
      const wage = ROLES[role].wage * countryOf(s.player.city).wage * (0.7 + skill * 0.22) * (trait === 'star' ? 1.4 : 1);
      s.biz.cand.push({ id: uid('st'), name: npcName(rng, s.player.city).name, role, skill, trait, wage, hue: rng.int(0, 359) });
    }
    s.biz.candAt = s.t + 720;
  }
  return s.biz.cand;
}
export function hire(shop, candId) {
  const s = G.s;
  const c = s.biz.cand.find((x) => x.id === candId);
  if (!c) return false;
  if (!spend(c.wage, 'biz', T('Аванс сотруднику', 'Аванс співробітнику', 'Hiring advance'))) return false;
  shop.staff.push({ ...c, hired: s.t });
  s.biz.cand = s.biz.cand.filter((x) => x !== c);
  stat('hires'); addXP(15);
  emit('biz');
  return true;
}
export function fire(shop, staffId) { shop.staff = shop.staff.filter((x) => x.id !== staffId); emit('biz'); }
export const hasRole = (shop, role) => shop.staff.some((x) => x.role === role);
const skillOf = (shop, role) => Math.max(0, ...shop.staff.filter((x) => x.role === role).map((x) => x.skill + (x.trait === 'star' ? 1.5 : 0) - (x.trait === 'lazy' ? 1 : 0)));

export function shopTraffic(shop) {
  const prop = propById(shop.propId);
  const def = PROPS.find((x) => x.id === prop?.def);
  if (!def) return 0;
  const style = STYLES.find((x) => x.id === shop.style);
  const items = shelf(shop);
  const matching = items.length ? items.filter((i) => style?.cats.includes(i.cat)).length / items.length : 0;
  const size = CITY[shop.city]?.size || 1;
  return def.traffic * RENO[shop.reno].mult * (0.85 + matching * 0.35) * (0.7 + size * 0.2) * repFactor() * (1 + shop.ads * 0.25) * (hasRole(shop, 'manager') ? 1.12 : 1);
}
// hourly simulation (every 60 game minutes)
export function bizHourly() {
  const s = G.s;
  const hour = Math.floor((s.t % 1440) / 60);
  for (const shop of s.biz.shops) {
    if (!shop.open) continue;
    const staffed = hasRole(shop, 'seller') || s.player.city === shop.city;
    if (!staffed || hour < 9 || hour > 21) continue;
    const items = shelf(shop);
    if (!items.length) continue;
    const visitors = Math.round(shopTraffic(shop) * rnd(0.5, 1.5));
    const sellSkill = skillOf(shop, 'seller');
    const def = PROPS.find((x) => x.id === shop.def);
    for (let v = 0; v < visitors; v++) {
      const pool = shelf(shop);
      if (!pool.length) break;
      const it = pickR(pool);
      const val = itemValue(it, shop.city, 'known') * (def?.lux && LUXURY_CATS.includes(it.cat) ? def.lux : 1);
      const ratio = it.shopPrice / Math.max(1, val);
      const p = clamp(1.25 - ratio * 0.95, 0.01, 0.7) * (0.75 + sellSkill * 0.08);
      if (chance(p * 0.35)) sellFromShop(shop, it);
    }
    // technician fixes one defect occasionally
    if (hasRole(shop, 'tech') && chance(0.25)) {
      const broken = items.filter((i) => i.defects.some((d) => d.known && DEFECTS[d.c]?.fix));
      if (broken.length) { const it = pickR(broken); const d = it.defects.find((x) => x.known && DEFECTS[x.c]?.fix); it.defects = it.defects.filter((x) => x !== d); it.cond = clamp(it.cond + 6, 1, 99); shop.log.unshift({ t: s.t, tx: `🔧 ${itemTitle(it)}` }); }
    }
    // buyer purchases underpriced local stock into the shop
    if (hasRole(shop, 'buyer') && shop.budget > 0 && chance(0.2) && shelf(shop).length < shop.slots) {
      const f = feedFor(shop.city);
      const deals = f.items.filter((l) => !l.sold && isBelowMarket(l) && !isVehicle(l.item) && l.price <= shop.budget);
      if (deals.length) {
        const l = pickR(deals);
        l.sold = true; l.buyer = shop.name;
        shop.budget -= l.price;
        const it = l.item; it.paid = l.price; it.src = 'staff';
        addItem(it, l.price, 'staff');
        it.shop = shop.id; it.shopPrice = nicePrice(itemValue(it, shop.city, 'known') * 1.05, countryOf(shop.city).cur);
        shop.log.unshift({ t: s.t, tx: `🛒 ${itemTitle(it)} ${fmt(l.price)}` });
      }
    }
    // theft
    const thief = shop.staff.find((x) => x.trait === 'thief');
    const guard = hasRole(shop, 'guard');
    if ((thief && chance(0.02)) || (!guard && chance(0.006))) {
      const pool = shelf(shop);
      if (pool.length) { const it = pickR(pool); removeItem(it.id); shop.log.unshift({ t: s.t, tx: `🚨 ${T('Кража', 'Крадіжка', 'Theft')}: ${itemTitle(it)}` }); notify('business', T('Кража в магазине', 'Крадіжка в магазині', 'Store theft'), `${shop.name}: ${itemTitle(it)}`); }
    }
    if (shop.log.length > 40) shop.log.length = 40;
  }
  emit('biz');
}
function sellFromShop(shop, it) {
  const s = G.s;
  const price = it.shopPrice;
  removeItem(it.id);
  earn(price, 'biz', `${shop.name}: ${itemTitle(it)}`);
  addProfit(0); // business revenue is taxed via 'biz' kind already
  shop.rev += price; shop.sold++;
  stat('sold'); stat('shopSales'); stat('revenue', price); stat('profit', price - (it.paid || 0));
  addXP(6 + (price - (it.paid || 0)) / 25);
  shop.log.unshift({ t: s.t, tx: `💸 ${itemTitle(it)} — ${fmt(price)}` });
  if (chance(0.15)) notify('business', shop.name, `${T('Продано', 'Продано', 'Sold')}: ${itemTitle(it)} — ${fmt(price)}`, { noBadge: true });
}
export function bizDaily() {
  const s = G.s;
  let wages = 0, rents = 0, income = 0;
  for (const shop of s.biz.shops) {
    const mgr = hasRole(shop, 'manager') ? 0.92 : 1;
    for (const st of shop.staff) wages += st.wage * mgr;
    shop.ads = Math.max(0, shop.ads - 1);
  }
  for (const p of s.props) {
    if (!p.own) { if (p.prepaid > 0) p.prepaid--; else rents += p.rent; }
    if (p.kind === 'rental' && p.own) {
      const def = PROPS.find((x) => x.id === p.def);
      income += p.value * def.income;
    }
  }
  if (wages) charge(wages, 'biz', T('Зарплаты сотрудникам', 'Зарплати співробітникам', 'Staff wages'));
  if (rents) charge(rents, 'rent', T('Аренда помещений', 'Оренда приміщень', 'Commercial rent'));
  if (income) earn(income, 'rent', T('Доход от аренды', 'Дохід від оренди', 'Rental income'));
  return { wages, rents, income };
}
export function runAds(shop) {
  const cost = 40 * countryOf(shop.city).wage * (1 + shop.reno);
  if (!spend(cost, 'biz', T('Реклама', 'Реклама', 'Advertising'))) return false;
  shop.ads = Math.min(5, shop.ads + 3);
  emit('biz');
  return true;
}
export const adsCost = (shop) => 40 * countryOf(shop.city).wage * (1 + shop.reno);
export const countriesWithShops = () => new Set(G.s.biz.shops.map((sh) => countryOf(sh.city).id)).size;
