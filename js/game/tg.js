// "Telega" — a messenger with channels: private paid channels with below-market (and risky) goods,
// a repair channel, a local flea channel, a wholesale channel, plus members' requests ("Orders").
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid } from '../core/util.js';
import { MODEL, DEFECTS } from '../data/catalog.js';
import { CITY, countryOf } from '../data/world.js';
import { makeItem, itemValue, itemTitle, knownDefects } from './items.js';
import { getItem, removeItem, addItem, spend, earn, charge, addXP, notify, stat, canStore, addReview } from './player.js';
import { deliveryTime } from './market.js';
import { fmt, nicePrice } from '../core/money.js';
import { makeHot, watchHot } from './hot.js';
import { arrest } from './crime.js';

export const CHANNELS = [
  { id: 'garage', name: ['Тёмный гараж', 'Темний гараж', 'Dark Garage'], ic: '🚗', col: '#7f1d1d', fee: 55, members: 5, about: ['Машины и техника без вопросов. Только для своих.', 'Машини й техніка без питань. Лише для своїх.', 'Cars and tech, no questions asked. Members only.'], cats: ['phones', 'electronics', 'consoles', 'cars', 'watches'], price: [0.35, 0.6], stolen: 0.3, scam: 0.1, lock: 0.12, handle: ['@tihiy_garage', '@bez_voprosov', '@noch_shop'] },
  { id: 'repair', name: ['Ремонт‑зона', 'Ремонт‑зона', 'Repair Zone'], ic: '🔧', col: '#1e3a8a', fee: 20, members: 3400, about: ['Телефоны после ремонта: дёшево, работают. Иногда не всё оригинальное.', 'Телефони після ремонту: дешево, працюють. Іноді не все оригінальне.', 'Phones after repair: cheap and working. Not always all original.'], cats: ['phones', 'electronics'], price: [0.5, 0.72], stolen: 0, scam: 0.03, hidden: 0.55, handle: ['@remont_zone', '@master_sergey', '@fixit_pro'] },
  { id: 'flea', name: ['Барахолка {city}', 'Барахолка {city}', '{city} Flea'], ic: '🏷', col: '#166534', fee: 0, members: 12800, about: ['Отдаю за копейки, самовывоз.', 'Віддаю за копійки, самовивіз.', 'Going cheap, pick up only.'], cats: ['clothing', 'sneakers', 'toys', 'misc', 'storage', 'gear', 'accessories', 'comics'], price: [0.6, 0.85], stolen: 0, scam: 0.02, handle: ['@baraholka_chat', '@otdam_deshevo', '@pereezd_sale'] },
  { id: 'opt', name: ['Опт и Китай', 'Опт і Китай', 'Wholesale & China'], ic: '📦', col: '#9a3412', fee: 0, members: 41000, about: ['Новости поставщиков, партии из Шэньчжэня, курсы юаня.', 'Новини постачальників, партії з Шеньчжені, курси юаня.', 'Supplier news, Shenzhen lots, yuan rates.'], news: true },
];
export const chName = (c) => L(c.name).replace('{city}', L(CITY[G.s.player.city]?.name || ['', '', '']));
export function tgState() { const s = G.s; s.tg ||= { joined: {}, sold: {}, police: [], reqDone: {}, seen: {} }; return s.tg; }
export const joined = (c) => !c.fee || !!tgState().joined[c.id];
export const entryFee = (c) => c.fee * Math.max(0.6, countryOf(G.s.player.city).wage);
export function join(c) {
  if (joined(c)) return { ok: true };
  if (!spend(entryFee(c), 'service', T(`Вход в «${chName(c)}»`, `Вхід у «${chName(c)}»`, `Joining ${chName(c)}`))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  tgState().joined[c.id] = true; stat('tgJoined'); emit('tg');
  return { ok: true };
}
const WINDOW = 180; // posts refresh every 3 game hours
export function postsOf(c) {
  const s = G.s, st = tgState();
  if (c.news) return newsPosts(c);
  const w = Math.floor(s.t / WINDOW);
  const out = [];
  for (const k of [w, w - 1]) {
    const r = new RNG(`tg|${s.id}|${c.id}|${k}|${s.player.city}`);
    const n = r.int(2, 4);
    for (let i = 0; i < n; i++) {
      const id = `${c.id}_${k}_${i}`;
      const it = makeItem(new RNG(`tgi|${id}|${s.id}`), { city: s.player.city, cats: c.cats, quality: c.id === 'garage' ? r.pick(['good', 'any']) : 'any', maxVal: c.id === 'flea' ? 160 : 4000, lockRate: c.lock ?? 0.03 });
      const v = itemValue(it, s.player.city, 'true');
      const price = nicePrice(v * r.float(c.price[0], c.price[1]));
      const mkt = nicePrice(itemValue(it, s.player.city, 'known') * 1.05);
      const risky = { stolen: r.chance(c.stolen || 0), scam: r.chance(c.scam || 0), hidden: r.chance(c.hidden || 0) };
      out.push({ id, ch: c.id, it, price, mkt, risky, handle: r.pick(c.handle), at: k * WINDOW + r.int(0, WINDOW - 1), views: r.int(180, 9800), note: r.pick(c.id === 'repair' ? [T('Был в ремонте, сейчас работает', 'Був у ремонті, зараз працює', 'Was repaired, works now'), T('Меняли экран, всё ок', 'Міняли екран, усе ок', 'Screen replaced, all good')] : c.id === 'garage' ? [T('Без коробки и документов, вопросов не задавать', 'Без коробки й документів, питань не ставити', 'No box, no papers, no questions'), T('Срочно, сегодня', 'Терміново, сьогодні', 'Urgent, today only')] : [T('Самовывоз, торг', 'Самовивіз, торг', 'Pick up, negotiable'), T('Переезжаю, отдам дёшево', 'Переїжджаю, віддам дешево', 'Moving, going cheap')]), sold: !!st.sold[id] });
    }
  }
  return out.filter((p) => p.at <= s.t).sort((a, b) => b.at - a.at);
}
function newsPosts(c) {
  const s = G.s, w = Math.floor(s.t / WINDOW);
  const L3 = [
    [T('Появилась оптовая сделка на {n} телефонов! Смотрите в «Поставщике».', 'Зʼявилася оптова угода на {n} телефонів! Дивіться в «Постачальнику».', 'A wholesale deal for {n} phones just dropped! Check the Supplier app.'), 'supplier'],
    [T('Юань сегодня {r} — самое время закупаться.', 'Юань сьогодні {r} — саме час закуповуватися.', 'Yuan today {r} — time to stock up.'), null],
    [T('Таможня ужесточила проверки на ввоз партий телефонов. Декларируйте!', 'Митниця посилила перевірки на ввезення партій телефонів. Декларуйте!', 'Customs is tightening checks on phone lots. Declare them!'), 'travel'],
    [T('В «Неделю железа» видеокарты на −45%. Сборщики, налетайте.', 'У «Тиждень заліза» відеокарти на −45%. Збирачі, налітайте.', 'GPUs −45% during Hardware week. Builders, go.'), 'hw'],
  ];
  return [w, w - 1, w - 2].map((k) => { const r = new RNG(`tgn|${k}`); const [tx, go] = r.pick(L3); return { id: `opt_${k}`, ch: c.id, news: tx.replace('{n}', r.int(6, 30)).replace('{r}', (r.float(11.8, 13.4)).toFixed(2) + ' ₽'), go, at: k * WINDOW + 20, views: r.int(3000, 40000) }; }).filter((p) => p.at <= s.t);
}
// buying from a post: meet in person (inspect, pay on the spot) or prepay to the card (cheaper, may vanish)
export function buyPost(p, mode) {
  const s = G.s, st = tgState();
  if (st.sold[p.id]) return { ok: false, msg: T('Уже продано', 'Вже продано', 'Already sold') };
  if (!canStore(p.it)) return { ok: false, msg: T('Склад переполнен', 'Склад переповнений', 'Storage is full') };
  const price = mode === 'prepay' ? nicePrice(p.price * 0.95) : p.price;
  if (!spend(price, 'buy', T(`Телега: ${itemTitle(p.it)}`, `Телега: ${itemTitle(p.it)}`, `Telega: ${itemTitle(p.it)}`))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  st.sold[p.id] = true;
  stat('bought');
  if (mode === 'prepay' && p.risky.scam) {
    notify('tg', p.handle, T('Пользователь удалил аккаунт. Деньги не вернуть.', 'Користувач видалив акаунт. Гроші не повернути.', 'The user deleted their account. The money is gone.'));
    stat('scammed');
    emit('tg');
    return { ok: true, scam: true, price };
  }
  const it = p.it; it.paid = price; it.src = 'tg';
  if (p.risky.stolen) { makeHot(it, new RNG(`tgh|${p.id}`), { known: false, src: 'tg' }); watchHot(it); }
  if (mode === 'meet') { addItem(it, price, 'tg'); addXP(4); }
  else s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: s.player.city, to: s.player.city, start: s.t, eta: s.t + deliveryTime(s.player.city, s.player.city), price, who: p.handle });
  emit('tg'); emit('inv');
  return { ok: true, price };
}
// stolen goods: the police come for them
export function tgTick() {
  const s = G.s, st = s.tg;
  if (!st?.police?.length) return;
  const due = st.police.filter((x) => x.at <= s.t);
  if (!due.length) return;
  st.police = st.police.filter((x) => x.at > s.t);
  for (const x of due) {
    const it = getItem(x.id);
    if (it) {
      removeItem(it.id);
      const fine = Math.round(x.val * 0.25 + 20);
      arrest('stolen', { fine: x.val * 0.1, text: x.title });
      notify('gov', T('Полиция', 'Поліція', 'Police'), T(`${x.title} оказался в розыске — изъят. Штраф ${fmt(fine)}.`, `${x.title} виявився в розшуку — вилучено. Штраф ${fmt(fine)}.`, `${x.title} was reported stolen — seized. Fine ${fmt(fine)}.`));
    } else if (new RNG(x.id).chance(0.5)) {
      const fine = Math.round(x.val * 0.15 + 15);
      charge(fine, 'fine', T('Штраф: сбыт краденого', 'Штраф: збут краденого', 'Fine: fencing stolen goods'));
      notify('gov', T('Полиция', 'Поліція', 'Police'), T(`Вы продали краденый ${x.title}. Штраф ${fmt(fine)}.`, `Ви продали крадений ${x.title}. Штраф ${fmt(fine)}.`, `You sold a stolen ${x.title}. Fine ${fmt(fine)}.`));
    }
  }
  emit('tg');
}
// members' requests: "looking for X up to N" — fulfil from your storage
export function requests() {
  const s = G.s, st = tgState();
  const w = Math.floor(s.t / 120);
  const r = new RNG(`tgr|${s.id}|${w}|${s.player.city}`);
  const NAMES = ['Дима', 'Аня', 'Рустам', 'Оля', 'Павел', 'Ксюша', 'Егор', 'Мила', 'Сеня', 'Вика'];
  return Array.from({ length: 4 }, (_, i) => {
    const it = makeItem(new RNG(`tgrq|${s.id}|${w}|${i}`), { city: s.player.city, cats: ['phones', 'consoles', 'electronics', 'sneakers', 'watches', 'storage', 'pcparts'], maxVal: 2500 });
    const m = MODEL[it.m];
    const v = itemValue({ ...it, defects: [], cond: 85 }, s.player.city, 'true');
    const id = `rq_${w}_${i}`;
    return { id, who: r.pick(NAMES), m: m.id, cat: m.cat, title: itemTitle(it, false), budget: nicePrice(v * r.float(0.9, 1.3)), done: !!st.reqDone[id] };
  });
}
export const matchesFor = (rq) => G.s.inv.filter((it) => it.m === rq.m && !it.listed && !it.shop);
export function fulfil(rq, itemId) {
  const it = getItem(itemId), st = tgState();
  if (!it || st.reqDone[rq.id]) return { ok: false };
  removeItem(it.id);
  st.reqDone[rq.id] = true;
  earn(rq.budget, 'sale', T(`Телега: ${rq.title} для ${rq.who}`, `Телега: ${rq.title} для ${rq.who}`, `Telega: ${rq.title} for ${rq.who}`));
  stat('sold'); addXP(10);
  addReview(5, T('Быстро нашёл то, что я искал. Респект!', 'Швидко знайшов те, що я шукав. Респект!', 'Found exactly what I was after, fast. Respect!'), { buyer: rq.who });
  emit('tg'); emit('inv');
  return { ok: true };
}
