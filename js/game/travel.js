// Travel between cities with luggage, customs checks and arrival handling.
import { cardEffects } from './cards.js';
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { clamp, chance } from '../core/util.js';
import { CITY, countryOf, routes, distanceKm, MODES } from '../data/world.js';
import { spend, charge, stat, addXP, notify, log, getItem, removeItem, luggageCap } from './player.js';
import { itemValue, itemTitle, isVehicle, sizeUnits } from './items.js';
import { fmt } from '../core/money.js';
import { regionMult } from './economy.js';

export function tripOptions(to) {
  const s = G.s;
  const hasCar = !!s.car && !!getItem(s.car);
  const disc = 1 - cardEffects().travel;
  return routes(s.player.city, to, hasCar).map((r) => ({ ...r, price: r.price * disc }));
}
export function cityPriceIndex(cityId, cat = 'phones') { return regionMult(cityId, cat); }
export const inTransit = () => !!G.s.travel;

export function startTrip(to, mode, carryIds = []) {
  const s = G.s;
  if (s.travel) return { ok: false };
  const opt = tripOptions(to).find((o) => o.mode === mode);
  if (!opt) return { ok: false };
  const units = carryIds.reduce((a, id) => a + sizeUnits(getItem(id) || {}), 0);
  if (units > luggageCap() && mode !== 'car') return { ok: false, msg: T('Слишком много вещей для багажа', 'Забагато речей для багажу', 'Too much luggage') };
  if (!spend(opt.price, 'travel', `${L(CITY[s.player.city].name)} → ${L(CITY[to].name)}`)) return { ok: false, msg: T('Не хватает на билет', 'Не вистачає на квиток', 'Can’t afford the ticket') };
  const carry = [...carryIds];
  if (mode === 'car' && s.car) carry.push(s.car);
  for (const id of carry) { const it = getItem(id); if (it) it.loc = 'transit'; }
  s.travel = { from: s.player.city, to, mode, start: s.t, eta: s.t + opt.time, carry };
  s.energy = clamp(s.energy - 8, 0, 100);
  log('travel', `${L(MODES[mode])} → ${L(CITY[to].name)}`);
  emit('travel');
  return { ok: true };
}
export function travelTick() {
  const s = G.s;
  const tr = s.travel;
  if (!tr || tr.eta > s.t) return;
  const crossed = countryOf(tr.from).id !== countryOf(tr.to).id;
  s.player.city = tr.to;
  for (const id of tr.carry) { const it = getItem(id); if (it) it.loc = tr.to; }
  s.travel = null;
  stat('trips'); addXP(10);
  if (crossed) {
    stat('abroad');
    const carried = tr.carry.map(getItem).filter((x) => x && !isVehicle(x));
    const value = carried.reduce((a, it) => a + itemValue(it, tr.to, 'known'), 0);
    const fakes = carried.filter((it) => it.fake);
    if (value > 1500 || fakes.length) {
      s.customs = { value, items: carried.map((i) => i.id), duty: Math.max(0, value - 1500) * countryOf(tr.to).customs, fakes: fakes.map((i) => i.id) };
      emit('customs', s.customs);
    }
  }
  notify('travel', T('Прибытие', 'Прибуття', 'Arrived'), `${L(countryOf(tr.to).name)}, ${L(CITY[tr.to].name)}`);
  emit('travel'); emit('market');
}
// choice: 'declare' | 'risk'
export function resolveCustoms(choice) {
  const s = G.s;
  const c = s.customs;
  if (!c) return null;
  s.customs = null;
  if (choice === 'declare') {
    charge(c.duty, 'customs', T('Таможенная пошлина', 'Митне мито', 'Customs duty'));
    let conf = 0;
    for (const id of c.fakes) { if (getItem(id)) { removeItem(id); conf++; } }
    return { paid: c.duty, confiscated: conf };
  }
  // risk: 30% chance of inspection
  if (chance(0.3)) {
    const fine = c.duty * 2 + 50;
    charge(fine, 'customs', T('Штраф таможни', 'Штраф митниці', 'Customs fine'));
    let conf = 0;
    for (const id of c.fakes) { if (getItem(id)) { removeItem(id); conf++; } }
    return { caught: true, fine, confiscated: conf };
  }
  addXP(5);
  return { caught: false };
}
