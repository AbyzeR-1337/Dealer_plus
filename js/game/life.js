// Life sim: energy, food, sleeping, housing & rent, taxes and the daily rollover.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, pickR } from '../core/util.js';
import { countryOf, CITY } from '../data/world.js';
import { earn, spend, charge, stat, addXP, notify, log, houseDef, HOUSING, snapshotWorth, getItem, removeItem, repScore } from './player.js';
import { fmt } from '../core/money.js';
import { itemTitle, isVehicle } from './items.js';
import { day } from './economy.js';

export const FOOD = [
  { id: 'shawarma', n: ['Шаурма у метро', 'Шаурма біля метро', 'Street shawarma'], price: 3, food: 30, energy: 0, icon: '🌯' },
  { id: 'canteen', n: ['Столовая', 'Їдальня', 'Canteen meal'], price: 6, food: 50, energy: 3, icon: '🍲' },
  { id: 'groceries', n: ['Продукты домой', 'Продукти додому', 'Groceries'], price: 12, food: 75, energy: 2, icon: '🛒', home: true },
  { id: 'cafe', n: ['Кафе', 'Кафе', 'Café'], price: 14, food: 60, energy: 8, icon: '🍝' },
  { id: 'energy', n: ['Энергетик', 'Енергетик', 'Energy drink'], price: 2, food: 5, energy: 15, icon: '⚡', limit: true },
  { id: 'rest', n: ['Ресторан', 'Ресторан', 'Restaurant'], price: 55, food: 100, energy: 15, icon: '🍷' },
];
export const foodPrice = (f) => f.price * countryOf(G.s.player.city).wage * 0.9 + f.price * 0.1;
export function eat(f) {
  const s = G.s;
  if (f.home && s.house.type === 'none') return { ok: false, msg: T('Негде готовить — нужно жильё', 'Ніде готувати — потрібне житло', 'Nowhere to cook — get a home') };
  if (f.limit && (s.daily.energyDrinks || 0) >= 3) return { ok: false, msg: T('Хватит энергетиков на сегодня', 'Досить енергетиків на сьогодні', 'Enough energy drinks for today') };
  if (!spend(foodPrice(f), 'food', L(f.n))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  s.food = clamp(s.food + f.food, 0, 100);
  s.energy = clamp(s.energy + f.energy, 0, 100);
  if (f.limit) s.daily.energyDrinks = (s.daily.energyDrinks || 0) + 1;
  emit('needs');
  return { ok: true };
}
// Hotels are needed when away from your own home
export const awayFromHome = () => G.s.house.type !== 'none' && G.s.house.city !== G.s.player.city;
export const hotelPrice = () => 22 * countryOf(G.s.player.city).rent + 8;

// passive drain every 10 game minutes
export function needsTick() {
  const s = G.s;
  s.food = clamp(s.food - 0.55, 0, 100);
  s.energy = clamp(s.energy - (s.food < 12 ? 0.8 : 0.22), 0, 100);
  emit('needs');
}

export function rentFor(h = houseDef(), cityId = G.s.house.city || G.s.player.city) { return h.rent * countryOf(cityId).rent * (CITY[cityId]?.idx || 1); }
export function housePrice(h, cityId = G.s.player.city) { return h.price * countryOf(cityId).rent * (CITY[cityId]?.idx || 1) * 1.2; }
export function rentHouse(id) {
  const s = G.s;
  const h = HOUSING.find((x) => x.id === id);
  const first = rentFor(h, s.player.city);
  if (!spend(first, 'rent', L(h.n))) return { ok: false, msg: T('Не хватает на первый день аренды', 'Не вистачає на перший день оренди', 'Can’t afford the first day') };
  if (s.house.own) sellHouseSilently();
  s.house = { type: id, own: false, city: s.player.city, since: s.t };
  log('house', L(h.n));
  emit('house');
  return { ok: true };
}
export function buyHouse(id) {
  const s = G.s;
  const h = HOUSING.find((x) => x.id === id);
  const p = housePrice(h);
  if (!spend(p, 'realty', L(h.n))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  if (s.house.own) sellHouseSilently();
  s.house = { type: id, own: true, city: s.player.city, since: s.t, paid: p };
  stat('housesBought'); addXP(40);
  emit('house');
  return { ok: true };
}
function sellHouseSilently() {
  const s = G.s;
  const h = houseDef();
  const v = housePrice(h, s.house.city) * 0.9;
  earn(v, 'realty', L(h.n));
}
export function leaveHouse() {
  const s = G.s;
  if (s.house.own) sellHouseSilently();
  s.house = { type: 'none', own: false, city: s.player.city };
  emit('house');
}

// Sleep: skips game time (handled by sim.advance) and restores energy depending on housing
export function sleepGain(hours = 8) {
  const s = G.s;
  const h = houseDef();
  const home = s.house.type !== 'none' && s.house.city === s.player.city;
  const k = home ? h.energy : awayFromHome() || s.house.type === 'none' ? (s.hotelNight ? 0.85 : 0.45) : 0.45;
  return clamp(hours * 12 * k, 10, 100);
}
export function afterSleep(hours) {
  const s = G.s;
  s.energy = clamp(s.energy + sleepGain(hours), 0, 100);
  s.food = clamp(s.food - hours * 1.2, 0, 100);
  // homeless: chance of losing a small item at night
  if (s.house.type === 'none' && !s.hotelNight && chance(0.18)) {
    const small = s.inv.filter((i) => !isVehicle(i) && !i.shop && !i.listed);
    if (small.length) {
      const it = pickR(small);
      removeItem(it.id);
      notify('profile', T('Ночью обокрали', 'Вночі обікрали', 'Robbed at night'), itemTitle(it));
    }
  }
  s.hotelNight = false;
  emit('needs');
}

// ---------------------------------------------------------------- taxes
export const REGIMES = {
  none: { n: ['Без регистрации', 'Без реєстрації', 'Unregistered'], base: 0, rate: 0, reg: 0, d: ['Налоги не платишь, но налоговая может оштрафовать при больших доходах.', 'Податки не платиш, але податкова може оштрафувати за великі доходи.', 'No taxes, but big earnings can trigger audits and fines.'] },
  self: { n: ['Самозанятый', 'ФОП 1 група', 'Sole trader'], base: 1, rate: 0.5, reg: 10, d: ['Низкий налог. Доступ к маркетплейсу.', 'Низький податок. Доступ до маркетплейсу.', 'Low tax. Unlocks the marketplace.'] },
  ip: { n: ['ИП', 'ФОП 3 група', 'Business (LLP)'], base: 6, rate: 0.85, reg: 60, d: ['Можно открывать магазины.', 'Можна відкривати магазини.', 'Required to open stores.'] },
  company: { n: ['ООО / Компания', 'ТОВ / Компанія', 'Company (Ltd)'], base: 30, rate: 1.05, reg: 600, d: ['Международная сеть, люкс‑площадка, крупные кредиты.', 'Міжнародна мережа, люкс‑майданчик, великі кредити.', 'International chain, luxury platform, bigger loans.'] },
};
export const taxRate = () => { const r = REGIMES[G.s.tax.regime]; return r.rate * Math.max(0.06, countryOf(G.s.player.city).tax); };
export const taxBase = () => REGIMES[G.s.tax.regime].base * countryOf(G.s.player.city).wage;
export function taxDue() {
  const t = G.s.tax;
  if (t.regime === 'none') return 0;
  return Math.max(0, taxBase() + t.income * taxRate() - t.paid);
}
export function payTax() {
  const s = G.s;
  const due = taxDue() + s.tax.debt;
  if (due <= 0) return true;
  if (!spend(due, 'tax', T('Налоги', 'Податки', 'Taxes'))) return false;
  s.tax.paid += due - s.tax.debt; s.tax.debt = 0; s.tax.daysLate = 0;
  stat('taxPaid', due);
  emit('tax');
  return true;
}
export function register(regime) {
  const s = G.s;
  const r = REGIMES[regime];
  const fee = r.reg * countryOf(s.player.city).wage;
  if (!spend(fee, 'gov', L(r.n))) return false;
  s.tax.regime = regime;
  addXP(20);
  emit('tax');
  return true;
}

// ---------------------------------------------------------------- daily rollover (called by sim at midnight)
export function dailyLife(prevDay) {
  const s = G.s;
  const out = [];
  // taxes for the day that just ended
  if (s.tax.regime !== 'none') {
    const due = taxDue();
    if (due > 0) {
      if (s.settings.autoTax && s.money >= due) { payTax(); out.push(T(`Налог списан: ${fmt(due)}`, `Податок списано: ${fmt(due)}`, `Tax auto‑paid: ${fmt(due)}`)); }
      else { s.tax.debt += due * 1.1; s.tax.daysLate++; s.bank.credit = clamp(s.bank.credit - 15, 300, 850); notify('gov', T('Налоговый долг', 'Податковий борг', 'Tax debt'), `${fmt(s.tax.debt)}`); }
    }
  } else if (s.tax.income > 250 * countryOf(s.player.city).wage && chance(0.22)) {
    const fine = s.tax.income * 0.2;
    s.tax.debt += fine;
    notify('gov', T('Проверка налоговой', 'Перевірка податкової', 'Tax audit'), T(`Незаконная предпринимательская деятельность. Штраф ${fmt(fine)}`, `Незаконна підприємницька діяльність. Штраф ${fmt(fine)}`, `Unregistered trading. Fine ${fmt(fine)}`));
  }
  if (s.tax.debt > 0 && s.tax.daysLate > 3 && s.money > 0) {
    const take = Math.min(s.money, s.tax.debt);
    charge(take, 'tax', T('Принудительное взыскание', 'Примусове стягнення', 'Forced collection'));
    s.tax.debt -= take;
  }
  s.tax.lastIncome = s.tax.income;
  s.tax.income = 0; s.tax.paid = 0; s.tax.day = day();
  // rent / hotel
  if (s.house.type !== 'none' && !s.house.own) {
    const r = rentFor();
    if (s.money >= r) { charge(r, 'rent', L(houseDef().n)); s.house.late = 0; }
    else {
      s.house.late = (s.house.late || 0) + 1;
      notify('realty', T('Просрочка аренды', 'Прострочка оренди', 'Rent overdue'), fmt(r));
      if (s.house.late >= 2) { s.house = { type: 'none', own: false, city: s.player.city }; notify('realty', T('Вас выселили', 'Вас виселили', 'Evicted'), T('Нечем платить аренду', 'Нічим платити оренду', 'Couldn’t pay rent')); }
    }
  }
  s.daily = {};
  snapshotWorth();
  return out;
}
