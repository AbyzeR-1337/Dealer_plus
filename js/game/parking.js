// Parking: more cars only fit if you have somewhere to put them. What's possible depends on where you live:
//  🚧 a spot in the yard behind the barrier — apartment blocks with a yard; the management company (УК/ОСББ) issues
//     the pass, and if you rent the flat the owner has to sign a consent;
//  🅿️ a space in the underground car park — only new/renovated blocks; rented from a neighbour who owns it;
//  🏚 a garage in a co‑op (ГСК) — not in the city centre; rented from its owner by a power of attorney at a notary,
//     plus the co‑op's monthly dues;
//  🏢 a guarded car park — anywhere, no papers, but pricey;
//  🌳 on the lawn by the entrance — free and illegal: tow trucks and fines;
//  🏗 your own garage on your plot — only in a house you own and live in: a building permit from the authorities,
//     then construction.
// Private owners look at you: a rich renter with a pricey car gets a higher price — the raise grows with your
// net worth (on top of the normal price). Talk them down with arguments, a persuasion mini‑game, or refuse — then
// they may agree to the normal price, meet you halfway, or just say no. Once a month they look again.
// Spots tied to a building end when you move out.
// You can't know from home whether there's room: go and LOOK at the car park (yard, underground, co‑op rows, the
// guarded lot). The plan shows every bay — taken, free to rent, for sale, reserved, or just empty because the
// owner is away. What you saw goes stale: bays get taken while you think, and the picture changes every two days.
// Bays for sale (underground, co‑op garages) can be bought: notarised deed + registration of ownership; an owned
// bay has no rent and no landlord, and can be sold again.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid, clamp } from '../core/util.js';
import { fmt, nicePrice } from '../core/money.js';
import { countryOf, CITY } from '../data/world.js';
import { spend, earn, charge, notify, stat, addXP, netWorth, getItem, canAfford, vehiclesOwned, garage } from './player.js';
import { itemValue } from './items.js';
import { marksCount } from './crime.js';
import { dv } from './difficulty.js';

export const PK = {
  yard: { ic: '🚧', n: ['Место во дворе за шлагбаумом', 'Місце у дворі за шлагбаумом', 'Yard space behind the barrier'], base: 30, slots: 1, owner: false },
  under: { ic: '🅿️', n: ['Машино‑место в подземном паркинге', 'Машиномісце в підземному паркінгу', 'Underground parking space'], base: 110, slots: 1, owner: true },
  gsk: { ic: '🏚', n: ['Гараж в кооперативе (ГСК)', 'Гараж у кооперативі (ГБК)', 'Co‑op garage'], base: 70, slots: 1, owner: true, dues: 4 },
  lot: { ic: '🏢', n: ['Охраняемая стоянка', 'Охоронювана стоянка', 'Guarded car park'], base: 90, slots: 1, owner: false },
  lawn: { ic: '🌳', n: ['На газоне у подъезда', 'На газоні біля підʼїзду', 'On the lawn by the entrance'], base: 0, slots: 1, owner: false },
  build: { ic: '🏗', n: ['Гараж на своём участке', 'Гараж на своїй ділянці', 'A garage on your own plot'], base: 0, slots: 2, owner: false, cost: 6000 },
};
// papers and where you get them (minutes of game time, fee in USD × local wages)
export const PDOCS = {
  consent: { n: ['Согласие хозяина квартиры', 'Згода власника квартири', 'Flat owner’s consent'], ic: '✍️', mins: 30, fee: 0, where: ['хозяин квартиры', 'власник квартири', 'your landlord'] },
  ukpass: { n: ['Пропуск во двор от УК/ОСББ', 'Перепустка у двір від УК/ОСББ', 'Yard pass from the building manager'], ic: '🪪', mins: 240, fee: 4, where: ['УК / ОСББ', 'УК / ОСББ', 'building manager'] },
  contract: { n: ['Договор аренды машино‑места', 'Договір оренди машиномісця', 'Parking lease'], ic: '📄', mins: 60, fee: 0, where: ['с владельцем', 'з власником', 'with the owner'] },
  access: { n: ['Номер в системе доступа паркинга', 'Номер у системі доступу паркінгу', 'Plate added to the barrier system'], ic: '📷', mins: 90, fee: 0, where: ['охрана паркинга', 'охорона паркінгу', 'car park security'] },
  notary: { n: ['Доверенность у нотариуса', 'Довіреність у нотаріуса', 'Notarised power of attorney'], ic: '⚖️', mins: 120, fee: 18, where: ['нотариус', 'нотаріус', 'notary'] },
  gskcard: { n: ['Взнос и пропуск в ГСК', 'Внесок і перепустка в ГБК', 'Co‑op fee and pass'], ic: '🔑', mins: 60, fee: 10, where: ['председатель ГСК', 'голова ГБК', 'co‑op chairman'] },
  deed: { n: ['Договор купли‑продажи у нотариуса', 'Договір купівлі‑продажу в нотаріуса', 'Notarised sale deed'], ic: '⚖️', mins: 120, fee: 25, where: ['нотариус', 'нотаріус', 'notary'] },
  reg: { n: ['Регистрация права собственности', 'Реєстрація права власності', 'Registration of ownership'], ic: '🏛', mins: 2 * 1440, fee: 15, where: ['Госуслуги / реестр', 'Дія / реєстр', 'gov services / land registry'] },
  permit: { n: ['Разрешение на строительство', 'Дозвіл на будівництво', 'Building permit'], ic: '🏛', mins: 3 * 1440, fee: 45, where: ['Госуслуги / архитектура', 'Дія / архітектура', 'gov services / planning'] },
};
const DOCS_FOR = { yard: ['ukpass'], under: ['contract', 'access'], gsk: ['notary', 'gskcard'], lot: [], lawn: [], build: ['permit'] };

export function pstate() { const s = G.s; s.park ||= { spots: [], neg: {}, refused: {}, built: {} }; s.park.built ||= {}; return s.park; }
const cityK = (city) => countryOf(city).rent * (CITY[city]?.idx || 1);
const wage = () => Math.max(0.5, countryOf(G.s.player.city).wage);
export const homeKey = () => { const h = G.s.house; if (!h || h.type === 'none') return null; return h.own ? `own:${h.homeId}` : `rent:${h.listing || h.type + ':' + (h.since || 0)}`; };
const H = () => G.s.house || { type: 'none' };
const APARTMENT = ['room', 'studio', 'flat', 'flat2', 'flat3', 'penthouse'];
const DISTRICT = () => (H().district ? H().district[0] : '');

// what your address allows: { ok, why }
export function canHere(kind) {
  const h = H(), key = homeKey();
  const seed = new RNG(`pkh|${key}`);
  const yardHere = seed.chance(DISTRICT() === 'Центр' ? 0.35 : 0.85);
  const underHere = ['euro', 'lux'].includes(h.tier) || DISTRICT() === 'Новый район' || (h.floors || 0) >= 16 || h.type === 'penthouse';
  const no = (why) => ({ ok: false, why });
  if (kind === 'lot') return { ok: true };
  if (!key) return no(T('Сначала нужно жильё — без адреса места не дают', 'Спершу потрібне житло — без адреси місць не дають', 'You need a home first — no address, no spot'));
  if (kind === 'lawn') return h.type === 'hostel' ? no(T('У хостела ставить негде', 'Біля хостелу ставити ніде', 'Nowhere to park at a hostel')) : { ok: true };
  if (kind === 'yard') { if (!APARTMENT.includes(h.type)) return no(T('Только в многоквартирном доме', 'Лише в багатоквартирному будинку', 'Apartment blocks only')); return yardHere ? { ok: true } : no(T('У этого дома нет двора с парковкой', 'У цього будинку немає двору з парковкою', 'This building has no yard parking')); }
  if (kind === 'under') { if (!APARTMENT.includes(h.type) || h.type === 'room') return no(T('Только в новых домах с паркингом', 'Лише в нових будинках із паркінгом', 'Only new blocks with a car park')); return underHere ? { ok: true } : no(T('В этом доме нет подземного паркинга — он есть в новостройках и домах с евроремонтом', 'У цьому будинку немає підземного паркінгу — він є в новобудовах і будинках з євроремонтом', 'No underground car park here — new and renovated blocks have them')); }
  if (kind === 'gsk') return DISTRICT() === 'Центр' ? no(T('В центре гаражных кооперативов нет', 'У центрі гаражних кооперативів немає', 'No garage co‑ops in the centre')) : { ok: true };
  if (kind === 'build') {
    if (!h.own) return no(T('Только в своём доме: купите дом или таунхаус и живите в нём', 'Лише у власному будинку: купіть будинок або таунхаус і живіть у ньому', 'Only in a house you own and live in'));
    if (!['house', 'townhouse', 'villa'].includes(h.kindType || h.type)) return no(T('Нужен дом с участком, а не квартира', 'Потрібен будинок з ділянкою, а не квартира', 'Needs a house with a plot, not a flat'));
    if (pstate().built[h.homeId]) return no(T('Гараж уже построен', 'Гараж уже збудовано', 'Already built'));
    return { ok: true };
  }
  return no('—');
}

// ---------------------------------------------------------------- the car park plans
const OWNERS = [['Виктор Палыч', 'Віктор Павлович', 'Viktor'], ['Ирина', 'Ірина', 'Iryna'], ['Сергей', 'Сергій', 'Serhiy'], ['Тамара', 'Тамара', 'Tamara'], ['Олег', 'Олег', 'Oleh'], ['Дед Михалыч', 'Дід Михайлович', 'Old Mykhailo'], ['Артур', 'Артур', 'Artur'], ['Наталья', 'Наталія', 'Natalia']];
export const week = () => Math.floor(G.s.t / (1440 * 7));
export const EPOCH = 2880; // the picture changes every two game days
export const epoch = () => Math.floor(G.s.t / EPOCH);
export const MAP_KINDS = ['yard', 'under', 'gsk', 'lot'];
const MAPS = { yard: { cols: 5, rows: 2, walk: 5 }, under: { cols: 6, rows: 4, walk: 5 }, gsk: { cols: 5, rows: 3, walk: 25 }, lot: { cols: 6, rows: 4, walk: 15 } };
export const walkMins = (kind) => MAPS[kind].walk;
const CAR_COLS = ['#d8dadf', '#1c1d21', '#b3121f', '#1d3f8f', '#4a4f57', '#f1f1ee', '#7a7f87', '#16707a', '#cdbb98', '#5e0f1c'];
const SALE_BASE = { under: 14000, gsk: 4500 };
// every bay of a car park right now: busy | away (empty, the owner is out) | resv | rent | sale | mine
export function lotMap(kind) {
  const s = G.s, key = homeKey() || 'nohome', city = s.player.city, k = cityK(city), cur = countryOf(city).cur, ep = epoch();
  const M = MAPS[kind], n = M.cols * M.rows;
  const r = new RNG(`pkm|${s.id}|${key}|${kind}|${ep}`);
  const cells = Array.from({ length: n }, (_, i) => ({ i, no: i + 1, st: 'busy', col: r.pick(CAR_COLS) }));
  const freeIdx = r.sample(cells.map((c) => c.i), n);
  let ptr = 0; const next = () => cells[freeIdx[ptr++]];
  const nRent = { yard: r.pick([0, 0, 1, 1, 2]), under: r.pick([0, 0, 1, 1, 2, 3]), gsk: r.pick([0, 1, 1, 2, 3]), lot: r.pick([0, 1, 2, 3, 4, 5]) }[kind];
  const nSale = { yard: 0, under: r.pick([0, 0, 0, 1, 1, 2]), gsk: r.pick([0, 0, 1, 1, 2]), lot: 0 }[kind];
  const mk = (c, sale) => {
    const id = `${kind}_${key}_${ep}_${c.i}${sale ? 's' : ''}`;
    const base = sale ? nicePrice(SALE_BASE[kind] * k * r.float(0.7, 1.5), cur) : nicePrice(PK[kind].base * k * r.float(0.85, 1.2), cur);
    const o = { id, kind, base, slots: 1, bay: c.no, sale: !!sale, docs: sale ? ['deed', 'reg', ...(kind === 'under' ? ['access'] : ['gskcard'])] : DOCS_FOR[kind].slice() };
    if (PK[kind].owner || sale) Object.assign(o, { who: r.pick(OWNERS), greed: +r.float(0.35, 1.6).toFixed(2), fair: r.chance(0.55), grey: r.chance(0.35) });
    if (kind === 'yard' && !H().own) o.docs.unshift('consent');
    // someone else may take it before the picture changes
    o.goneAt = ep * EPOCH + r.int(500, EPOCH + 1800);
    c.st = sale ? 'sale' : 'rent'; c.offer = o;
  };
  for (let i = 0; i < nRent; i++) mk(next(), false);
  for (let i = 0; i < nSale; i++) mk(next(), true);
  if (kind === 'under' || kind === 'lot') for (let i = 0; i < r.int(1, 2); i++) next().st = 'resv';
  for (let i = 0; i < r.int(1, 3); i++) next().st = 'away';
  // bays that got taken since, and your own
  for (const c of cells) if (c.offer && s.t >= c.offer.goneAt) { c.st = 'busy'; c.taken = true; delete c.offer; }
  for (const sp of pstate().spots) if (sp.kind === kind && sp.bay && (!sp.homeKey || sp.homeKey === key) && cells[sp.bay - 1]) { const c = cells[sp.bay - 1]; c.st = 'mine'; delete c.offer; }
  return { kind, cols: M.cols, rows: M.rows, cells, rent: cells.filter((c) => c.st === 'rent').length, sale: cells.filter((c) => c.st === 'sale').length };
}
// have you been there to look (in the current two‑day picture)?
export const seenOf = (kind) => { const v = pstate().seen?.[`${kind}|${homeKey() || 'nohome'}`]; return v && v.ep === epoch() ? v : null; };
export function lookAt(kind) {
  const st = pstate(); st.seen ||= {};
  const m = lotMap(kind);
  st.seen[`${kind}|${homeKey() || 'nohome'}`] = { ep: epoch(), t: G.s.t, rent: m.rent, sale: m.sale };
  emit('timeSpent', MAPS[kind].walk);
  stat('parkLooks');
  emit('park');
  return m;
}
export function offers() {
  const s = G.s, key = homeKey() || 'nohome', city = s.player.city, k = cityK(city);
  const out = [];
  for (const kind of MAP_KINDS) for (const c of lotMap(kind).cells) if (c.offer) out.push(c.offer);
  const r = new RNG(`pko|${s.id}|${key}|${week()}`);
  out.push({ id: `lawn_${key}_${week()}`, kind: 'lawn', base: 0, slots: 1, docs: [] });
  out.push({ id: `build_${key}`, kind: 'build', base: nicePrice(PK.build.cost * k * r.float(0.85, 1.15), countryOf(city).cur), slots: PK.build.slots, docs: ['permit'] });
  return out;
}
export const findOffer = (id) => offers().find((o) => o.id === id);

// how much more a private owner wants from someone like you: grows with your net worth (and your car)
export function wealthAsk(o) {
  const w = Math.max(0, netWorth());
  const carId = G.s.car; const car = carId && getItem(carId);
  const carV = car ? itemValue(car, G.s.player.city, 'true') : 0;
  let k = o.sale ? o.greed * Math.log10(1 + w / (o.base * 6)) * 0.22 + (carV > 40000 ? 0.05 * o.greed : 0)
    : o.greed * Math.log10(1 + w / (o.base * 120)) * 0.6 + (carV > 40000 ? 0.15 * o.greed : 0);
  k = clamp(k, 0, o.sale ? 0.5 : 1.8);
  return { ask: nicePrice(o.base * (1 + k), countryOf(G.s.player.city).cur), k, carV, w };
}
export const argLabel = (o, k) => (o.sale && k === 'long' ? T('«Плачу всю сумму сегодня, без рассрочки»', '«Плачу всю суму сьогодні, без розстрочки»', '“I pay the whole sum today, no instalments”') : o.sale && k === 'official' ? T('«Оформим сделку официально, на полную сумму»', '«Оформимо угоду офіційно, на повну суму»', '“Let’s do the deal officially, for the full amount”') : L(ARGS[k].n));
export const ARGS = {
  market: { ic: '📊', n: ['«Рыночная цена — вот похожие объявления»', '«Ринкова ціна — ось схожі оголошення»', '“That’s the market rate — here are similar ads”'] },
  long: { ic: '📅', n: ['«Сниму надолго и заплачу за 2 месяца вперёд»', '«Зніму надовго й заплачу за 2 місяці наперед»', '“I’ll take it long‑term and pay 2 months up front”'] },
  poor: { ic: '🤷', n: ['«Машины не мои — я их перепродаю, денег впритык»', '«Машини не мої — я їх перепродаю, грошей впритул»', '“The cars aren’t mine — I resell them, money’s tight”'] },
  official: { ic: '📝', n: ['«Оформим официальный договор — всё прозрачно»', '«Оформимо офіційний договір — усе прозоро»', '“Let’s sign an official lease — all above board”'] },
  pitch: { ic: '🗣', n: ['Убедить (мини‑игра)', 'Переконати (міні‑гра)', 'Persuade (mini‑game)'] },
};
// start (or continue) talking to a private owner
export function negOf(o, review = null) {
  const st = pstate();
  if (!st.neg[o.id]) {
    const wa = wealthAsk(o);
    const say = o.sale ? (wa.k > 0.06 ? T(`Продаю. Соседи брали за ${fmt(o.base)}, но место хорошее, у лифта — ${fmt(wa.ask)}.`, `Продаю. Сусіди брали за ${fmt(o.base)}, але місце гарне, біля ліфта — ${fmt(wa.ask)}.`, `It’s for sale. Neighbours paid ${fmt(o.base)}, but it’s a good bay by the lift — ${fmt(wa.ask)}.`) : T(`Продаю за ${fmt(wa.ask)}.`, `Продаю за ${fmt(wa.ask)}.`, `Selling for ${fmt(wa.ask)}.`)) : wa.carV > 40000 ? T(`Вижу, вы на хорошей машине… ${PK[o.kind].n[0].toLowerCase()} у меня ${fmt(o.base)}, но вам — ${fmt(wa.ask)}.`, `Бачу, ви на гарній машині… ${PK[o.kind].n[1].toLowerCase()} у мене ${fmt(o.base)}, але вам — ${fmt(wa.ask)}.`, `Nice car you’ve got… it’s normally ${fmt(o.base)}, but for you — ${fmt(wa.ask)}.`)
      : wa.k > 0.25 ? T(`Вообще сдаю за ${fmt(o.base)}. Но люди сейчас при деньгах — давайте ${fmt(wa.ask)}.`, `Взагалі здаю за ${fmt(o.base)}. Але люди зараз при грошах — давайте ${fmt(wa.ask)}.`, `I usually let it for ${fmt(o.base)}. But people have money these days — let’s say ${fmt(wa.ask)}.`)
        : T(`Сдаю за ${fmt(wa.ask)} в месяц.`, `Здаю за ${fmt(wa.ask)} на місяць.`, `It’s ${fmt(wa.ask)} a month.`);
    st.neg[o.id] = { id: o.id, base: review ? review.price : o.base, ask: review ? review.ask : wa.ask, used: [], good: 0, bad: 0, patience: 3, st: 'open', prepay: 0, msgs: [{ f: 'them', tx: review ? T(`Цены растут, да и вы, смотрю, неплохо зарабатываете. С нового месяца — ${fmt(review.ask)} вместо ${fmt(review.price)}.`, `Ціни ростуть, та й ви, бачу, непогано заробляєте. З нового місяця — ${fmt(review.ask)} замість ${fmt(review.price)}.`, `Prices are going up, and you seem to be doing well. From next month it’s ${fmt(review.ask)}, not ${fmt(review.price)}.`) : say }], review: review?.spotId || null };
  }
  return st.neg[o.id];
}
const push = (n, f, tx) => n.msgs.push({ f, tx });
// an argument; pitch = mini‑game score for 'pitch'
export function argue(o, n, key, pitch = 0) {
  if (n.st !== 'open' || n.used.includes(key)) return n;
  n.used.push(key);
  const r = new RNG(`arg|${o.id}|${key}|${G.s.t}|${Math.random()}`);
  const raise = n.ask - n.base;
  const cur = countryOf(G.s.player.city).cur;
  const down = (f) => { n.ask = Math.max(n.base, nicePrice(n.base + raise * f, cur)); n.good++; };
  const fail = (tx) => { n.patience--; n.bad++; push(n, 'them', tx); };
  push(n, 'me', argLabel(o, key));
  if (key === 'market') { if (r.chance(o.fair ? 0.65 : 0.35) && raise > 0) { down(0.4); push(n, 'them', T(`Ну да, по рынку так. Ладно, ${fmt(n.ask)}.`, `Ну так, по ринку так. Гаразд, ${fmt(n.ask)}.`, `Fair enough, that’s the market. Fine, ${fmt(n.ask)}.`)); } else fail(T('Мне эти объявления не указ. Моё место — моя цена.', 'Мені ці оголошення не указ. Моє місце — моя ціна.', 'Those ads mean nothing to me. My space, my price.')); }
  if (key === 'long' && o.sale) { if (r.chance(0.6)) { down(0.45); push(n, 'them', T(`Деньги сразу — это аргумент. ${fmt(n.ask)}.`, `Гроші одразу — це аргумент. ${fmt(n.ask)}.`, `Cash today is an argument. ${fmt(n.ask)}.`)); } else fail(T('Мне не к спеху, покупатель найдётся.', 'Мені не до поспіху, покупець знайдеться.', 'I’m in no hurry, a buyer will turn up.')); }
  else if (key === 'long') { if (r.chance(0.75)) { down(0.35); n.prepay = 2; push(n, 'them', T(`Вперёд за два месяца? Это разговор. ${fmt(n.ask)} — и по рукам.`, `Наперед за два місяці? Це розмова. ${fmt(n.ask)} — і по руках.`, `Two months up front? Now we’re talking. ${fmt(n.ask)} and it’s a deal.`)); } else fail(T('Надолго — это хорошо, но цена та же.', 'Надовго — це добре, але ціна та сама.', 'Long‑term is nice, but the price stays.')); }
  if (key === 'poor') {
    if (o.greed > 1.1 && r.chance(0.5)) { n.ask = nicePrice(n.ask + Math.max(raise, n.base * 0.1) * 0.25, cur); n.patience--; n.bad++; push(n, 'them', T(`А, так у вас бизнес на машинах! Тогда тем более — ${fmt(n.ask)}.`, `А, то у вас бізнес на машинах! Тоді тим паче — ${fmt(n.ask)}.`, `Oh, a car business! All the more reason — ${fmt(n.ask)}.`)); }
    else if (r.chance(0.55)) { down(0.5); push(n, 'them', T(`Понимаю, сам когда‑то начинал. ${fmt(n.ask)}.`, `Розумію, сам колись починав. ${fmt(n.ask)}.`, `I get it, I started out once too. ${fmt(n.ask)}.`)); }
    else fail(T('У всех денег впритык. Не мои проблемы.', 'У всіх грошей впритул. Не мої проблеми.', 'Everyone’s money is tight. Not my problem.'));
  }
  if (key === 'official') {
    if (o.grey) { n.patience--; n.bad++; n.ask = nicePrice(n.ask * 1.05, cur); push(n, 'them', T(`Какой ещё договор? Мне налоги платить из‑за вас? Тогда ${fmt(n.ask)}.`, `Який ще договір? Мені податки платити через вас? Тоді ${fmt(n.ask)}.`, `What lease? So I pay taxes because of you? Then it’s ${fmt(n.ask)}.`)); }
    else if (r.chance(0.6)) { down(0.7); n.official = true; push(n, 'them', T(`Договор — это правильно, люблю порядок. ${fmt(n.ask)}.`, `Договір — це правильно, люблю порядок. ${fmt(n.ask)}.`, `A proper lease, I like order. ${fmt(n.ask)}.`)); }
    else fail(T('Договор и так будет. Цена не меняется.', 'Договір і так буде. Ціна не змінюється.', 'There’ll be a lease anyway. The price stays.'));
  }
  if (key === 'pitch') {
    if (pitch >= 0.95) { down(0.3); push(n, 'them', T(`Умеете вы уговаривать… ${fmt(n.ask)}.`, `Умієте ви вмовляти… ${fmt(n.ask)}.`, `You’re a smooth talker… ${fmt(n.ask)}.`)); }
    else if (pitch >= 0.6) { down(0.65); push(n, 'them', T(`Ладно, немного уступлю: ${fmt(n.ask)}.`, `Гаразд, трохи поступлюся: ${fmt(n.ask)}.`, `Alright, I’ll give a little: ${fmt(n.ask)}.`)); }
    else fail(T('Не убедили.', 'Не переконали.', 'Not convinced.'));
  }
  if (n.patience <= 0) { n.st = 'refused'; push(n, 'them', T('Всё, мне надоело торговаться. Ищите другое место.', 'Все, мені набридло торгуватися. Шукайте інше місце.', 'That’s it, I’m tired of haggling. Find another spot.')); pstate().refused[o.id] = week(); }
  emit('park');
  return n;
}
// "I won't pay the raise — only the normal price"
export function refuseRaise(o, n) {
  if (n.st !== 'open') return n;
  push(n, 'me', T(`Нет, повышенную платить не буду — только ${fmt(n.base)}.`, `Ні, підвищену платити не буду — тільки ${fmt(n.base)}.`, `No, I won’t pay extra — only ${fmt(n.base)}.`));
  if (n.ask <= n.base * 1.03) { n.ask = n.base; push(n, 'them', T('Договорились.', 'Домовилися.', 'Deal.')); n.st = 'agreed'; emit('park'); return n; }
  const r = new RNG(`ref|${o.id}|${G.s.t}|${Math.random()}`);
  const p = clamp((o.fair ? 0.5 : 0.25) + n.good * 0.12 - n.bad * 0.12 - (o.greed - 1) * 0.15, 0.05, 0.85);
  if (r.chance(p)) { n.ask = n.base; n.st = 'agreed'; push(n, 'them', T(`Ладно, ${fmt(n.base)} так ${fmt(n.base)}. Только платите вовремя.`, `Гаразд, ${fmt(n.base)} то ${fmt(n.base)}. Тільки платіть вчасно.`, `Fine, ${fmt(n.base)} it is. Just pay on time.`)); }
  else if (!n.half && r.chance(0.45)) { n.half = true; n.ask = nicePrice((n.ask + n.base) / 2, countryOf(G.s.player.city).cur); push(n, 'them', T(`Давайте посередине — ${fmt(n.ask)}. Последнее слово.`, `Давайте посередині — ${fmt(n.ask)}. Останнє слово.`, `Let’s meet halfway — ${fmt(n.ask)}. Final offer.`)); }
  else { n.st = 'refused'; pstate().refused[o.id] = week(); push(n, 'them', n.review ? T('Тогда освобождайте место до конца месяца.', 'Тоді звільняйте місце до кінця місяця.', 'Then free the space by the end of the month.') : T('Тогда ищите другое место.', 'Тоді шукайте інше місце.', 'Then find another spot.')); }
  emit('park');
  return n;
}
export function agree(o, n) { if (n.st === 'open') { n.st = 'agreed'; push(n, 'me', T(`Хорошо, ${fmt(n.ask)}.`, `Добре, ${fmt(n.ask)}.`, `OK, ${fmt(n.ask)}.`)); emit('park'); } return n; }

// signing: first month (+ prepaid months) now; then the papers
export function take(o, price) {
  const s = G.s, st = pstate();
  const ch = canHere(o.kind); if (!ch.ok) return { ok: false, msg: ch.why };
  const n = st.neg[o.id];
  // what you saw may be gone by now
  if (MAP_KINDS.includes(o.kind) && (!findOffer(o.id) || s.t >= o.goneAt)) { delete st.neg[o.id]; emit('park'); return { ok: false, gone: true, msg: T('Пока вы думали, место заняли', 'Поки ви думали, місце зайняли', 'Someone took the bay while you were thinking') }; }
  if (PK[o.kind].owner || o.sale) { if (!n || n.st !== 'agreed') return { ok: false }; price = n.ask; }
  else price = o.base;
  if (o.sale) {
    if (!spend(price, 'buy', `${L(PK[o.kind].n)} · №${o.bay}`)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
    const sp = { id: uid('pk'), kind: o.kind, offer: o.id, bay: o.bay, own: true, who: null, price: 0, paid: price, value: o.base, slots: o.slots, st: 'docs', docs: Object.fromEntries(o.docs.map((d) => [d, null])), homeKey: null, city: s.player.city, since: s.t };
    if (o.kind === 'gsk') { sp.dues = nicePrice(PK.gsk.dues * wage(), countryOf(s.player.city).cur); sp.paidUntil = s.t + 30 * 1440; }
    st.spots.push(sp); delete st.neg[o.id];
    stat('parkBought');
    emit('park'); emit('inv');
    return { ok: true, sp };
  }
  if (o.kind === 'build') {
    const sp = { id: uid('pk'), kind: 'build', who: null, price: 0, slots: PK.build.slots, st: 'docs', docs: { permit: null }, home: G.s.house.homeId, homeKey: homeKey(), since: s.t, cost: o.base };
    st.spots.push(sp); emit('park'); return { ok: true, sp };
  }
  const months = 1 + (n?.prepay || 0);
  if (o.kind !== 'lawn' && !spend(price * months, 'rent', `${L(PK[o.kind].n)}${months > 1 ? ` · ${months} ${T('мес.', 'міс.', 'mo')}` : ''}`)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const sp = { id: uid('pk'), kind: o.kind, offer: o.id, bay: o.bay || null, who: o.who ? L(o.who) : null, price, base: o.base, slots: o.slots, st: o.docs.length ? 'docs' : 'active', docs: Object.fromEntries(o.docs.map((d) => [d, null])), homeKey: ['yard', 'under', 'lawn'].includes(o.kind) ? homeKey() : null, city: s.player.city, since: s.t, paidUntil: s.t + months * 30 * 1440, greed: o.greed, fair: o.fair, grey: o.grey, nextReview: s.t + 30 * 1440, late: 0 };
  if (o.kind === 'gsk') sp.dues = nicePrice(PK.gsk.dues * wage(), countryOf(s.player.city).cur);
  st.spots.push(sp);
  if (n) delete st.neg[o.id];
  stat('parkTaken');
  emit('park'); emit('inv');
  return { ok: true, sp };
}
// papers: one at a time, each takes game time and a fee
export function docState(sp, d) { const v = sp.docs[d]; if (v == null) return 'none'; if (v === 'refused') return 'refused'; return v <= G.s.t ? 'ready' : 'pending'; }
export function orderPDoc(spId, d) {
  const s = G.s, sp = pstate().spots.find((x) => x.id === spId), D = PDOCS[d];
  if (!sp || !(d in sp.docs) || ['ready', 'pending'].includes(docState(sp, d))) return { ok: false };
  const fee = nicePrice(D.fee * wage() * (1 + marksCount() * 0.25), countryOf(s.player.city).cur);
  if (D.fee && !spend(fee, 'gov', L(D.n))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  // the landlord may say no to a parking pass; the planning office may refuse a permit (worse with a police record)
  if (d === 'consent' && new RNG(`cons|${sp.homeKey}`).chance(0.15 + marksCount() * 0.2)) { sp.docs[d] = 'refused'; emit('park'); return { ok: true, refused: true, msg: T('Хозяин квартиры отказался подписать согласие', 'Власник квартири відмовився підписати згоду', 'The landlord refused to sign') }; }
  sp.docs[d] = s.t + Math.round(D.mins * (d === 'permit' ? 1 + marksCount() * 0.3 : 1));
  if (d === 'permit') sp.permitRoll = Math.random() < clamp(0.12 + marksCount() * 0.15, 0, 0.7) ? 'no' : 'yes';
  stat('parkDocs');
  emit('park');
  return { ok: true, fee };
}
export const buildDays = 2;
export function startBuild(spId) {
  const s = G.s, sp = pstate().spots.find((x) => x.id === spId);
  if (!sp || sp.kind !== 'build' || docState(sp, 'permit') !== 'ready' || sp.buildUntil) return { ok: false };
  if (!spend(sp.cost, 'repair', T('Строительство гаража', 'Будівництво гаража', 'Garage construction'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  sp.buildUntil = s.t + buildDays * 1440; sp.st = 'building';
  emit('park');
  return { ok: true };
}
export function release(spId) {
  const st = pstate(), sp = st.spots.find((x) => x.id === spId);
  if (!sp || sp.kind === 'build') return false;
  st.spots = st.spots.filter((x) => x !== sp);
  emit('park'); emit('inv');
  return true;
}
export const sellPrice = (sp) => nicePrice((sp.value || 0) * 0.85, countryOf(G.s.player.city).cur);
export function sellSpot(spId) {
  const st = pstate(), sp = st.spots.find((x) => x.id === spId);
  if (!sp?.own || sp.st !== 'active') return { ok: false };
  const v = sellPrice(sp);
  st.spots = st.spots.filter((x) => x !== sp);
  earn(v, 'sale', `${L(PK[sp.kind].n)} · №${sp.bay || ''}`);
  emit('park'); emit('inv');
  return { ok: true, v };
}
export const parkSlots = () => (G.s.park?.spots || []).filter((x) => x.st === 'active' && x.kind !== 'build').reduce((a, x) => a + x.slots, 0);
export const builtSlots = () => (G.s.house?.own && G.s.park?.built?.[G.s.house.homeId] ? 2 : 0);

// once a minute: papers coming in, rent, moving out, the monthly price review, tow trucks
export function parkTick() {
  const s = G.s, st = s.park;
  if (!st?.spots?.length && !(vehiclesOwned() > garage())) return;
  const key = homeKey();
  for (const sp of st?.spots || []) {
    // moved out: spots tied to the old building end
    if (sp.homeKey && sp.homeKey !== key && sp.kind !== 'build') { sp.gone = true; notify('realty', T('Место для машины', 'Місце для машини', 'Parking'), T(`Вы переехали — ${L(PK[sp.kind].n).toLowerCase()} больше не ваше.`, `Ви переїхали — ${L(PK[sp.kind].n).toLowerCase()} більше не ваше.`, `You moved — the ${L(PK[sp.kind].n).toLowerCase()} is no longer yours.`)); continue; }
    if (sp.st === 'docs') {
      if (sp.kind === 'build' && docState(sp, 'permit') === 'ready' && sp.permitRoll === 'no') { sp.docs.permit = null; sp.permitRoll = null; notify('gov', T('Отказ в разрешении', 'Відмова в дозволі', 'Permit refused'), T('Архитектура отказала: замечания к проекту. Можно подать заново.', 'Архітектура відмовила: зауваження до проєкту. Можна подати знову.', 'Planning refused it: issues with the plan. You can reapply.')); continue; }
      if (Object.keys(sp.docs).every((d) => docState(sp, d) === 'ready')) {
        if (sp.kind === 'build') { if (!sp.permitNotified) { sp.permitNotified = true; notify('gov', T('Разрешение выдано', 'Дозвіл видано', 'Permit granted'), T('Можно строить гараж на участке.', 'Можна будувати гараж на ділянці.', 'You can build the garage now.'), { go: ['realty'] }); } }
        else { sp.st = 'active'; notify('realty', sp.own ? T('Место в собственности', 'Місце у власності', 'The bay is yours') : T('Место оформлено', 'Місце оформлено', 'Spot ready'), `${PK[sp.kind].ic} ${L(PK[sp.kind].n)} · +${sp.slots} 🚗`, { go: ['realty'] }); emit('inv'); }
      }
    }
    if (sp.st === 'building' && s.t >= sp.buildUntil) { sp.st = 'active'; st.built[sp.home] = true; addXP(30); notify('realty', T('Гараж построен', 'Гараж збудовано', 'Garage built'), `+${sp.slots} 🚗`, { go: ['realty'] }); emit('inv'); }
    // rent
    if (sp.kind !== 'build' && sp.kind !== 'lawn' && sp.paidUntil && s.t >= sp.paidUntil) {
      const due = (sp.own ? 0 : sp.price) + (sp.dues || 0);
      if (canAfford(due)) { charge(due, 'rent', `${L(PK[sp.kind].n)}${sp.dues ? ' + ' + T('взносы ГСК', 'внески ГБК', 'co‑op dues') : ''}`); sp.paidUntil += 30 * 1440; sp.late = 0; }
      else if (!sp.late) { sp.late = s.t; notify('realty', T('Долг за место', 'Борг за місце', 'Parking rent overdue'), T(`Нужно ${fmt(due)} — через 2 дня место заберут.`, `Потрібно ${fmt(due)} — через 2 дні місце заберуть.`, `${fmt(due)} due — in 2 days you lose the spot.`)); }
      else if (s.t - sp.late > 2 * 1440) { sp.gone = true; notify('realty', T('Место забрали', 'Місце забрали', 'Spot taken back'), L(PK[sp.kind].n)); }
    }
    // the owner looks at your money again once a month
    if (PK[sp.kind].owner && !sp.own && sp.st === 'active' && s.t >= sp.nextReview) {
      sp.nextReview = s.t + 30 * 1440;
      const wa = wealthAsk({ base: sp.base, greed: sp.greed });
      if (wa.ask > sp.price * 1.15) {
        const o = { id: `rev_${sp.id}`, kind: sp.kind, base: sp.price, greed: sp.greed, fair: sp.fair, grey: sp.grey, who: sp.who };
        st.reviews ||= {}; st.reviews[sp.id] = { o, until: s.t + 2 * 1440 };
        delete st.neg[o.id];
        negOf(o, { spotId: sp.id, price: sp.price, ask: wa.ask });
        notify('realty', sp.who || T('Владелец места', 'Власник місця', 'Space owner'), T(`Хочет поднять аренду до ${fmt(wa.ask)}. Ответьте в «Недвижимости» → «Парковка».`, `Хоче підняти оренду до ${fmt(wa.ask)}. Відповідайте в «Нерухомості» → «Паркування».`, `Wants to raise the rent to ${fmt(wa.ask)}. Reply in Real estate → Parking.`), { go: ['realty'] });
      }
    }
  }
  if (st?.spots) st.spots = st.spots.filter((x) => !x.gone);
  // unanswered reviews: the raise applies or the owner ends it
  for (const [spId, rv] of Object.entries(st?.reviews || {})) {
    const sp = st.spots.find((x) => x.id === spId), n = st.neg[rv.o.id];
    if (!sp) { delete st.reviews[spId]; continue; }
    if (n?.st === 'agreed') { sp.price = n.ask; delete st.reviews[spId]; delete st.neg[rv.o.id]; notify('realty', T('Новая цена места', 'Нова ціна місця', 'New parking price'), fmt(sp.price), { noBadge: true }); continue; }
    if (n?.st === 'refused') { sp.gone = true; delete st.reviews[spId]; notify('realty', T('Владелец расторг аренду', 'Власник розірвав оренду', 'The owner ended the lease'), L(PK[sp.kind].n)); continue; }
    if (s.t >= rv.until) { delete st.reviews[spId]; if (Math.random() < 0.5) { sp.price = rv.o.base + (n ? n.ask - n.base : 0); notify('realty', T('Аренда места подорожала', 'Оренда місця подорожчала', 'Parking rent went up'), fmt(sp.price)); } else { sp.gone = true; notify('realty', T('Вы не ответили — владелец сдал место другому', 'Ви не відповіли — власник здав місце іншому', 'No reply — the owner let it to someone else'), L(PK[sp.kind].n)); } }
  }
  if (st?.spots) st.spots = st.spots.filter((x) => !x.gone);
  // every morning: cars on the lawn and cars with nowhere to stand attract tow trucks
  if (s.t % 1440 === 7 * 60) {
    const lawn = (st?.spots || []).filter((x) => x.kind === 'lawn' && x.st === 'active').length;
    const extra = Math.max(0, vehiclesOwned() - garage());
    const risky = lawn + extra * 2;
    for (let i = 0; i < risky; i++) {
      if (Math.random() < 0.12 * dv().crime) {
        const fine = nicePrice((25 + 20) * wage(), countryOf(s.player.city).cur);
        charge(fine, 'fine', T('Эвакуатор и штрафстоянка', 'Евакуатор і штрафмайданчик', 'Tow truck and impound'));
        notify('gov', T('Машину увёз эвакуатор', 'Машину забрав евакуатор', 'Your car was towed'), T(`Парковка на газоне/в неположенном месте. Штраф и штрафстоянка: ${fmt(fine)}.`, `Паркування на газоні/в недозволеному місці. Штраф і штрафмайданчик: ${fmt(fine)}.`, `Parking on the lawn / illegally. Fine and impound: ${fmt(fine)}.`));
        stat('towed');
      }
    }
  }
}
