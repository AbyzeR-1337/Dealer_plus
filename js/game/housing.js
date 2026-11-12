// Renting a home like in real life: concrete listings in your city (a hostel bed, a room in a shared flat,
// a studio by the metro, a two-room flat in an old block, a townhouse, a penthouse…), cheap / normal / luxury,
// paid up front by the day, week or month. A month is cheapest per day but takes a deposit (and an agency
// may charge a commission). Auto-renewal, a day of grace when you can't pay, then eviction.
// Everyone starts with a room paid for one week; older saves get the same week minus the days already played.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { CITY, countryOf } from '../data/world.js';
import { HOUSING, houseDef, spend, charge, earn, notify, stat, canAfford, log } from './player.js';
import { fmt, nicePrice } from '../core/money.js';

export const PERIODS = {
  day: { n: ['сутки', 'доба', 'day'], per: ['сутки', 'добу', 'day'], days: 1, k: 1 },
  week: { n: ['неделя', 'тиждень', 'week'], per: ['неделю', 'тиждень', 'week'], days: 7, k: 0.86 },
  month: { n: ['месяц', 'місяць', 'month'], per: ['месяц', 'місяць', 'month'], days: 30, k: 0.72 },
};
const TIERS = {
  cheap: { k: 0.72, sleep: -0.05, tag: ['без ремонта', 'без ремонту', 'needs work'] },
  normal: { k: 1, sleep: 0, tag: ['обычный ремонт', 'звичайний ремонт', 'decent'] },
  lux: { k: 1.45, sleep: 0.05, tag: ['дизайнерский ремонт', 'дизайнерський ремонт', 'designer finish'] },
};
const NAMES = {
  hostel: [['Койка в хостеле «Ночлег»', 'Ліжко в хостелі «Нічліг»', 'Bed in “Nightstay” hostel'], ['Койка в капсульном хостеле', 'Ліжко в капсульному хостелі', 'Capsule hostel bed'], ['Место в общежитии', 'Місце в гуртожитку', 'A dorm bed']],
  room: [['Комната в коммуналке', 'Кімната в комуналці', 'Room in a shared flat'], ['Комната в двушке с хозяйкой', 'Кімната у двокімнатній з господинею', 'Room in a landlady’s flat'], ['Комната у студентов', 'Кімната в студентів', 'Room with students']],
  studio: [['Студия у метро', 'Студія біля метро', 'Studio by the metro'], ['Студия в новостройке', 'Студія в новобудові', 'New‑build studio'], ['Евро‑однушка', 'Євро‑однушка', 'Euro one‑bed']],
  flat: [['1‑комнатная в хрущёвке', '1‑кімнатна в хрущовці', 'One‑bed in an old block'], ['2‑комнатная в новостройке', '2‑кімнатна в новобудові', 'Two‑bed new build'], ['2‑комнатная с балконом', '2‑кімнатна з балконом', 'Two‑bed with a balcony']],
  house: [['Дом с гаражом', 'Будинок з гаражем', 'House with a garage'], ['Таунхаус', 'Таунхаус', 'Townhouse']],
  penthouse: [['Пентхаус с террасой', 'Пентхаус з терасою', 'Penthouse with a terrace']],
  villa: [['Вилла с бассейном', 'Вілла з басейном', 'Villa with a pool']],
};
const AREA = { hostel: [4, 8], room: [10, 18], studio: [19, 32], flat: [33, 68], house: [90, 170], penthouse: [140, 260], villa: [300, 620] };
const DISTRICTS = [['Центр', 'Центр', 'Centre'], ['Спальный район', 'Спальний район', 'Suburbs'], ['У вокзала', 'Біля вокзалу', 'By the station'], ['Старый город', 'Старе місто', 'Old town'], ['Новый район', 'Новий район', 'New district'], ['Промзона', 'Промзона', 'Industrial area']];

export const baseDay = (type, cityId) => { const h = HOUSING.find((x) => x.id === type); return h.rent * countryOf(cityId).rent * (CITY[cityId]?.idx || 1); };
export function priceFor(l, period) { return nicePrice(l.perDay * PERIODS[period].days * PERIODS[period].k); }
// this week's listings in a city
export function listings(cityId = G.s.player.city) {
  const s = G.s, week = Math.floor(s.t / (1440 * 7));
  const r = new RNG(`flats|${s.id}|${cityId}|${week}`);
  const out = [];
  const plan = [['hostel', 2], ['room', 3], ['studio', 3], ['flat', 3], ['house', 2], ['penthouse', 1], ['villa', (CITY[cityId]?.size || 1) >= 3 ? 1 : 0]];
  for (const [type, n] of plan) {
    for (let i = 0; i < n; i++) {
      const tier = type === 'hostel' ? 'normal' : r.pick(['cheap', 'normal', 'normal', 'lux']);
      const name = r.pick(NAMES[type]);
      const m2 = r.int(...AREA[type]);
      const perDay = baseDay(type, cityId) * TIERS[tier].k * r.float(0.92, 1.08);
      const agency = type !== 'hostel' && r.chance(0.55);
      const periods = type === 'hostel' ? ['day', 'week', 'month'] : type === 'room' || type === 'studio' ? ['day', 'week', 'month'] : ['week', 'month'];
      out.push({ id: `fl_${cityId}_${week}_${type}_${i}`, type, tier, name, m2, floor: type === 'house' || type === 'villa' ? 0 : r.int(1, type === 'penthouse' ? 30 : 16), metro: r.int(3, 25), district: r.pick(DISTRICTS), perDay, agency, periods, city: cityId });
    }
  }
  return out;
}
export const tierTag = (l) => L(TIERS[l.tier].tag);
export const sleepOf = (l) => +(houseDef(l.type).energy + TIERS[l.tier].sleep).toFixed(2);
// what moving in costs now: first period + deposit (a month for monthly rents) + agency commission (half a month)
export function moveInCost(l, period) {
  const price = priceFor(l, period);
  const deposit = period === 'month' && l.type !== 'hostel' ? price : 0;
  const fee = l.agency && period === 'month' ? nicePrice(price * 0.5) : 0;
  return { price, deposit, fee, total: price + deposit + fee };
}
export const renting = () => { const h = G.s.house; return h && h.type !== 'none' && !h.own; };
export const paidLeft = () => (renting() ? G.s.house.paidUntil - G.s.t : 0);
export function rentListing(l, period) {
  const s = G.s, c = moveInCost(l, period);
  if (!canAfford(c.total)) return { ok: false, msg: T(`Нужно ${fmt(c.total)}`, `Потрібно ${fmt(c.total)}`, `You need ${fmt(c.total)}`) };
  // moving out of the old place first: the deposit comes back, unused prepaid days don't
  const back = moveOut(true);
  if (s.house.own) return { ok: false, msg: T('Сначала продайте своё жильё', 'Спершу продайте своє житло', 'Sell your own home first') };
  spend(c.price, 'rent', `${L(l.name)} · ${L(PERIODS[period].per)}`);
  if (c.deposit) spend(c.deposit, 'rent', T('Залог за квартиру', 'Застава за квартиру', 'Rental deposit'));
  if (c.fee) spend(c.fee, 'service', T('Комиссия агентства', 'Комісія агентства', 'Agency commission'));
  s.house = { v: 2, type: l.type, own: false, city: l.city, since: s.t, period, price: c.price, perDay: l.perDay, deposit: c.deposit, paidUntil: s.t + PERIODS[period].days * 1440, name: l.name, m2: l.m2, tier: l.tier, district: l.district, listing: l.id, auto: true, late: 0 };
  stat('moves'); log('house', L(l.name));
  emit('house');
  return { ok: true, back, cost: c };
}
// leaving: deposit returned (if not behind on rent), prepaid days are lost
export function moveOut(silent = false) {
  const s = G.s, h = s.house;
  if (!h || h.type === 'none' || h.own) return 0;
  const back = h.deposit && !h.late ? h.deposit : 0;
  if (back) earn(back, 'refund', T('Возврат залога', 'Повернення застави', 'Deposit returned'));
  s.house = { v: 2, type: 'none', own: false, city: s.player.city };
  if (!silent) emit('house');
  return back;
}
export function prepay(periods = 1) {
  const s = G.s, h = s.house;
  if (!renting()) return { ok: false };
  const sum = h.price * periods;
  if (!spend(sum, 'rent', `${L(h.name || houseDef().n)} · ${periods} × ${L(PERIODS[h.period].per)}`)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  h.paidUntil = Math.max(h.paidUntil, s.t) + PERIODS[h.period].days * 1440 * periods;
  h.late = 0;
  emit('house');
  return { ok: true, sum };
}
export function setPeriod(period) {
  const h = G.s.house; if (!renting() || !PERIODS[period]) return;
  h.period = period; h.price = nicePrice((h.perDay || baseDay(h.type, h.city)) * PERIODS[period].days * PERIODS[period].k);
  emit('house');
}
// called every game minute by the sim
export function rentTick() {
  const s = G.s, h = s.house;
  if (!h || h.type === 'none' || h.own || !h.paidUntil) return;
  if (s.t < h.paidUntil) {
    if (!h.warned && h.paidUntil - s.t <= 720 && !(h.auto && canAfford(h.price))) { h.warned = true; notify('realty', T('Аренда заканчивается', 'Оренда закінчується', 'Rent runs out soon'), T(`Оплачено ещё на 12 ч. Следующий платёж ${fmt(h.price)}.`, `Оплачено ще на 12 год. Наступний платіж ${fmt(h.price)}.`, `Paid for 12 more hours. Next payment ${fmt(h.price)}.`)); }
    return;
  }
  if (h.auto && canAfford(h.price)) {
    charge(h.price, 'rent', `${L(h.name || houseDef().n)} · ${L(PERIODS[h.period].per)}`);
    h.paidUntil += PERIODS[h.period].days * 1440; h.late = 0; h.warned = false;
    notify('realty', T('Аренда продлена', 'Оренду продовжено', 'Rent renewed'), `${fmt(h.price)} · ${L(PERIODS[h.period].per)}`, { noBadge: true });
    emit('house');
    return;
  }
  if (!h.late) { h.late = 1; h.graceUntil = s.t + 1440; notify('realty', T('Просрочка аренды', 'Прострочка оренди', 'Rent overdue'), T(`Хозяин ждёт ${fmt(h.price)} до завтра — иначе выселение.`, `Господар чекає ${fmt(h.price)} до завтра — інакше виселення.`, `The landlord wants ${fmt(h.price)} by tomorrow or you’re out.`)); emit('house'); return; }
  if (s.t >= h.graceUntil) {
    const lost = h.deposit || 0;
    s.house = { v: 2, type: 'none', own: false, city: s.player.city };
    notify('realty', T('Вас выселили', 'Вас виселили', 'Evicted'), lost ? T(`Залог ${fmt(lost)} пошёл в счёт долга.`, `Заставу ${fmt(lost)} зараховано в борг.`, `The ${fmt(lost)} deposit covered the debt.`) : T('Нечем было платить за жильё.', 'Нічим було платити за житло.', 'You couldn’t pay the rent.'));
    stat('evicted');
    emit('house');
  }
}
// new games and saves from before monthly rents: a room paid for a week (minus the days already played)
export function ensureHousing() {
  const s = G.s;
  if (s.house?.v === 2) return;
  const played = Math.floor(s.t / 1440);
  const left = Math.max(0, 7 - played);
  const city = s.player.city;
  if (s.house?.own) { s.house.v = 2; return; }
  const ls = listings(city);
  if (s.house && s.house.type !== 'none') {
    // was renting by the day: keep the same kind of place on a weekly plan; the free week minus played days is prepaid
    const l = ls.find((x) => x.type === s.house.type) || ls[0];
    const until = left > 0 ? s.t + left * 1440 : s.t + (1440 - (s.t % 1440));
    s.house = { v: 2, type: s.house.type, own: false, city: s.house.city || city, since: s.house.since || 0, period: 'week', perDay: baseDay(s.house.type, s.house.city || city), price: nicePrice(baseDay(s.house.type, s.house.city || city) * 7 * PERIODS.week.k), deposit: 0, paidUntil: until, name: l.type === s.house.type ? l.name : houseDef(s.house.type).n, m2: l.m2, tier: 'normal', district: l.district, auto: true, late: 0 };
    return;
  }
  if (left <= 0) { s.house = { v: 2, type: 'none', own: false, city }; return; }
  const room = ls.filter((x) => x.type === 'room').sort((a, b) => a.perDay - b.perDay)[0];
  s.house = { v: 2, type: 'room', own: false, city, since: s.t, period: 'week', perDay: room.perDay, price: priceFor(room, 'week'), deposit: 0, paidUntil: s.t + left * 1440, name: room.name, m2: room.m2, tier: room.tier, district: room.district, listing: room.id, auto: true, late: 0, starter: true };
  if (played === 0) notify('realty', T('Жильё на первую неделю', 'Житло на перший тиждень', 'A home for your first week'), T(`${L(room.name)} оплачена на 7 дней. Дальше — продлевайте или переезжайте в «Недвижимости».`, `${L(room.name)} оплачена на 7 днів. Далі — продовжуйте або переїжджайте в «Нерухомості».`, `${L(room.name)} is paid for 7 days. Then renew or move in Real estate.`), { noBadge: true });
}
export const homeName = () => { const h = G.s.house; return h.name ? L(h.name) : L(houseDef(h.type).n); };
