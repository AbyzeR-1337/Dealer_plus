// Daily quests, the story path ("from zero to empire"), achievements and collections.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { countryOf } from '../data/world.js';
import { MODEL, MODELS } from '../data/catalog.js';
import { earn, addXP, notify, getStat, netWorth, stat } from './player.js';
import { countriesWithShops } from './business.js';
import { day } from './economy.js';
import { fmt } from '../core/money.js';

const DQ = [
  { stat: 'sold', n: ['Продай {n} вещ.', 'Продай {n} реч.', 'Sell {n} items'], base: [1, 3] },
  { stat: 'bought', n: ['Купи {n} вещ.', 'Купи {n} реч.', 'Buy {n} items'], base: [1, 3] },
  { stat: 'shifts', n: ['Отработай {n} смен(ы)', 'Відпрацюй {n} змін(и)', 'Work {n} shifts'], base: [1, 3] },
  { stat: 'repairs', n: ['Почини {n} вещ.', 'Полагодь {n} реч.', 'Repair {n} items'], base: [1, 2] },
  { stat: 'inspections', n: ['Проведи {n} осмотр(а)', 'Проведи {n} огляд(и)', 'Do {n} inspections'], base: [1, 3] },
  { stat: 'freebies', n: ['Забери {n} бесплатн. вещь', 'Забери {n} безкоштовн. річ', 'Grab {n} free items'], base: [1, 2] },
  { stat: 'listed', n: ['Выставь {n} объявл.', 'Виклади {n} оголош.', 'Post {n} listings'], base: [1, 3] },
  { stat: 'legit', n: ['Проверь подлинность {n} раз', 'Перевір справжність {n} раз', 'Run {n} legit checks'], base: [1, 2], lvl: 2 },
  { stat: 'bids', n: ['Сделай {n} ставк. на аукционе', 'Зроби {n} ставк. на аукціоні', 'Place {n} auction bids'], base: [1, 3], lvl: 3 },
  { stat: 'boxes', n: ['Открой {n} мистери‑бокс', 'Відкрий {n} містері‑бокс', 'Open {n} mystery box'], base: [1, 1], lvl: 2 },
  { stat: 'profitDay', n: ['Заработай {money} прибыли', 'Заробі {money} прибутку', 'Make {money} profit'], money: true },
];
export function ensureDaily() {
  const s = G.s;
  const d = day();
  if (s.quests.day === d) return s.quests.list;
  const rng = new RNG(`${s.id}:dq:${d}`);
  const pool = DQ.filter((q) => !q.lvl || s.level >= q.lvl);
  const picks = rng.sample(pool, 3);
  const wage = countryOf(s.player.city).wage;
  s.quests.list = picks.map((q, i) => {
    const target = q.money ? Math.round(30 * Math.pow(s.level, 1.5) * wage) : rng.int(q.base[0], q.base[1]) + Math.floor(s.level / 4);
    return { id: `${d}_${i}`, stat: q.stat, n: q.n, target, money: !!q.money, reward: Math.round((12 + s.level * 9) * wage * (q.money ? 1.5 : 1)), xp: 20 + s.level * 6, done: false };
  });
  s.quests.day = d;
  return s.quests.list;
}
export function questProgress(q) { return q.stat === 'profitDay' ? Math.max(0, G.s.daily.profit || 0) : G.s.daily[q.stat] || 0; }
export const questText = (q) => L(q.n).replace('{n}', q.target).replace('{money}', fmt(q.target));
export function claimQuest(q) {
  if (q.done || questProgress(q) < q.target) return false;
  q.done = true;
  earn(q.reward, 'quest', T('Задание', 'Завдання', 'Quest'));
  addXP(q.xp);
  stat('quests');
  emit('quests');
  return true;
}

// ---------------------------------------------------------------- story path
const W = (x) => netWorth() >= x;
export const STORY = [
  { n: ['Найди первую работу', 'Знайди першу роботу', 'Find your first job'], d: ['Приложение «Работа»: отправь отклик и пройди собеседование.', 'Застосунок «Робота»: надішли відгук і пройди співбесіду.', 'Jobs app: apply and pass the interview.'], ok: () => !!G.s.job.cur || G.s.job.past.length > 0, r: 10 },
  { n: ['Отработай 3 смены', 'Відпрацюй 3 зміни', 'Work 3 shifts'], d: ['Смены — это мини‑игры. Чем лучше результат, тем выше зарплата.', 'Зміни — це міні‑ігри. Що кращий результат, то вища зарплата.', 'Shifts are minigames; better score = better pay.'], ok: () => getStat('shifts') >= 3, r: 15 },
  { n: ['Забери вещь даром', 'Забери річ безкоштовно', 'Grab something for free'], d: ['«Даром»: люди отдают ненужное. Успей раньше других.', '«Даром»: люди віддають непотрібне. Встигни раніше за інших.', 'Freebies app: be faster than others.'], ok: () => getStat('freebies') >= 1, r: 10 },
  { n: ['Купи первую вещь', 'Купи першу річ', 'Buy your first item'], d: ['Ищи метку «Ниже рынка» и торгуйся.', 'Шукай мітку «Нижче ринку» і торгуйся.', 'Look for “Below market” and haggle.'], ok: () => getStat('bought') >= 1, r: 15 },
  { n: ['Почини или почисти вещь', 'Полагодь або почисти річ', 'Repair or clean an item'], d: ['Мастерская: ремонт своими руками дешевле.', 'Майстерня: ремонт своїми руками дешевший.', 'Workshop: DIY repairs are cheaper.'], ok: () => getStat('repairs') + getStat('cleaned') >= 1, r: 20 },
  { n: ['Выставь объявление', 'Виклади оголошення', 'Post a listing'], d: ['Склад → вещь → «Продать».', 'Склад → річ → «Продати».', 'Storage → item → “Sell”.'], ok: () => getStat('listed') >= 1, r: 10 },
  { n: ['Продай с прибылью', 'Продай з прибутком', 'Sell at a profit'], d: ['Торгуйся в чате с покупателями.', 'Торгуйся в чаті з покупцями.', 'Haggle with buyers in chat.'], ok: () => getStat('profit') > 0, r: 25 },
  { n: ['Сними жильё', 'Зніми житло', 'Rent a place'], d: ['«Недвижимость»: жильё даёт склад и нормальный сон.', '«Нерухомість»: житло дає склад і нормальний сон.', 'Real estate: home = storage + proper sleep.'], ok: () => G.s.house.type !== 'none', r: 30 },
  { n: ['Капитал $1 000', 'Капітал $1 000', 'Net worth $1,000'], d: ['Деньги + стоимость вещей.', 'Гроші + вартість речей.', 'Cash + item value.'], ok: () => W(1000), r: 50 },
  { n: ['Найди редкую вещь', 'Знайди рідкісну річ', 'Find a rare item'], d: ['Редкость «Редкий» и выше. Ищи на барахолке, в контейнерах и боксах.', 'Рідкість «Рідкісний» і вище.', 'Rarity Rare or higher.'], ok: () => getStat('rareFound') >= 1, r: 60 },
  { n: ['Зарегистрируй ИП', 'Зареєструй ФОП', 'Register a business'], d: ['«Госуслуги» → налоговый режим.', '«Держпослуги» → податковий режим.', 'Gov app → tax regime.'], ok: () => ['ip', 'company'].includes(G.s.tax.regime), r: 50 },
  { n: ['Открой первый магазин', 'Відкрий перший магазин', 'Open your first store'], d: ['Купи или арендуй точку и открой бизнес.', 'Купи або орендуй точку й відкрий бізнес.', 'Buy or rent a spot and open a store.'], ok: () => G.s.biz.shops.length >= 1, r: 150 },
  { n: ['Найми сотрудника', 'Найми співробітника', 'Hire an employee'], d: ['Продавец работает, пока тебя нет.', 'Продавець працює, поки тебе немає.', 'A clerk sells while you’re away.'], ok: () => getStat('hires') >= 1, r: 100 },
  { n: ['Купи машину', 'Купи авто', 'Get a car'], d: ['Машина ускоряет поездки и открывает работу в такси.', 'Авто прискорює поїздки й відкриває роботу в таксі.', 'A car speeds up trips and unlocks taxi work.'], ok: () => !!G.s.car, r: 120 },
  { n: ['Съезди в другую страну', 'Зʼїзди в іншу країну', 'Travel abroad'], d: ['Покупай там, где дешевле, продавай там, где дороже.', 'Купуй там, де дешевше, продавай там, де дорожче.', 'Buy cheap there, sell high here.'], ok: () => getStat('abroad') >= 1, r: 150 },
  { n: ['Капитал $100 000', 'Капітал $100 000', 'Net worth $100,000'], d: ['Ты уже серьёзный игрок.', 'Ти вже серйозний гравець.', 'You’re a serious player now.'], ok: () => W(100000), r: 1500 },
  { n: ['Магазины в 2 странах', 'Магазини у 2 країнах', 'Stores in 2 countries'], d: ['Международная сеть.', 'Міжнародна мережа.', 'International chain.'], ok: () => countriesWithShops() >= 2, r: 3000 },
  { n: ['Капитал $1 000 000', 'Капітал $1 000 000', 'Net worth $1,000,000'], d: ['Торговая империя построена. Но это не предел!', 'Торгова імперія збудована. Але це не межа!', 'The empire is built. But there’s more!'], ok: () => W(1e6), r: 20000 },
];
export function storyTick() {
  const s = G.s;
  const st = STORY[s.quests.story];
  if (!st) return;
  if (st.ok()) {
    s.quests.story++;
    const r = st.r * countryOf(s.player.city).wage;
    earn(r, 'quest', L(st.n));
    addXP(30 + s.quests.story * 15);
    notify('quests', T('Этап пройден!', 'Етап пройдено!', 'Milestone done!'), `${L(st.n)} → +${fmt(r)}`);
    emit('quests');
  }
}

// ---------------------------------------------------------------- achievements
export const ACH = [
  { stat: 'sold', tiers: [1, 10, 100, 1000], n: ['Продавец', 'Продавець', 'Seller'] },
  { stat: 'profit', tiers: [100, 10000, 1e6, 1e8], n: ['Прибыль', 'Прибуток', 'Profit'], money: true },
  { stat: 'repairs', tiers: [1, 25, 150, 600], n: ['Мастер на все руки', 'Майстер на всі руки', 'Handyman'] },
  { stat: 'freebies', tiers: [1, 15, 80, 300], n: ['Халявщик', 'Халявник', 'Freebie hunter'] },
  { stat: 'legit', tiers: [1, 20, 100, 500], n: ['Детектор фейков', 'Детектор фейків', 'Fake detector'] },
  { stat: 'shifts', tiers: [1, 20, 120, 500], n: ['Трудоголик', 'Трудоголік', 'Workaholic'] },
  { stat: 'auctionsWon', tiers: [1, 10, 50, 200], n: ['Молоток', 'Молоток', 'Gavel'] },
  { stat: 'boxes', tiers: [1, 20, 100, 500], n: ['Азарт', 'Азарт', 'Thrill seeker'] },
  { stat: 'scamsCaught', tiers: [1, 5, 25, 100], n: ['Антифрод', 'Антифрод', 'Anti‑fraud'] },
  { stat: 'abroad', tiers: [1, 5, 25, 100], n: ['Путешественник', 'Мандрівник', 'Globetrotter'] },
  { stat: 'shopSales', tiers: [1, 50, 500, 5000], n: ['Ритейлер', 'Ритейлер', 'Retailer'] },
  { stat: 'rareFound', tiers: [1, 5, 25, 100], n: ['Охотник за редкостями', 'Мисливець за рідкостями', 'Rarity hunter'] },
];
export function achTier(a) { const v = getStat(a.stat); let t = 0; for (const x of a.tiers) if (v >= x) t++; return t; }

// ---------------------------------------------------------------- collections
const rx = (r) => (m) => r.test(m.id);
const named = (...parts) => (m) => parts.some((p) => m.id.includes(p));
export const SETS = [
  { id: 'ifone', n: ['Эволюция iFone', 'Еволюція iFone', 'iFone evolution'], cat: 'phones', slots: ['ifone_4', 'ifone_5s', 'ifone_6', 'ifone_7', 'ifone_8', 'ifone_x', 'ifone_11', 'ifone_12', 'ifone_13', 'ifone_14', 'ifone_15', 'ifone_16'], bonus: 0.05 },
  { id: 'retro', n: ['Ретро‑телефоны', 'Ретро‑телефони', 'Retro phones'], cat: 'phones', slots: ['nokla_3310', 'nokla_8800', 'nokla_n95', 'motorolla_raze_v3', 'blackberri_bold'], bonus: 0.06 },
  { id: 'aj1', n: ['Коллекция Air Jordon 1', 'Колекція Air Jordon 1', 'Air Jordon 1 collection'], cat: 'sneakers', slots: ['air_jordon_1_high_og_chicago', 'air_jordon_1_high_og_bred', 'air_jordon_1_high_og_university', 'air_jordon_1_high_og_dark_mocha', 'air_jordon_1_high_og_shadow', 'air_jordon_1_high_og_royal'], bonus: 0.06 },
  { id: 'watches', n: ['Часы‑легенды', 'Годинники‑легенди', 'Legendary watches'], cat: 'watches', slots: ['submarine_date', 'daytrona', 'speedmeister_moonwatch', 'nautilos', 'royal_oaker_15500', 'santo'], bonus: 0.05 },
  { id: 'ps', n: ['Все PlayStatien', 'Усі PlayStatien', 'Every PlayStatien'], cat: 'consoles', slots: ['playstatien_1', 'playstatien_2_fat', 'playstatien_3_fat', 'playstatien_4', 'playstatien_5'], bonus: 0.06 },
  { id: 'nin', n: ['Ретро Nintendu', 'Ретро Nintendu', 'Retro Nintendu'], cat: 'consoles', slots: ['nintendu_nes', 'super_nes', 'n64', 'gamecub', 'gameboi_1989', 'gameboi_color'], bonus: 0.06 },
  { id: 'base', n: ['Base Set Pocketmon', 'Base Set Pocketmon', 'Pocketmon Base Set'], cat: 'cards', slots: ['charizzard_holo_base_set', 'blastoize', 'venusaurr', 'mewtoo', 'raichoo', 'gyaradoss', 'pikachoo_жёлтые'], bonus: 0.08 },
  { id: 'ussr', n: ['Советская классика', 'Радянська класика', 'Soviet classics'], cat: 'cars', slots: ['2101', '2106', '2107', 'газ_21', 'москвичок', 'запорожик'], bonus: 0.05 },
  { id: 'bags', n: ['Сумки мечты', 'Сумки мрії', 'Dream bags'], cat: 'bags', slots: ['birkan', 'kelli', 'classic_flap', 'speedi', 'saddle'], bonus: 0.05 },
  { id: 'sw', n: ['Брики Star Warz', 'Брики Star Warz', 'Star Warz bricks'], cat: 'toys', slots: ['75192', '10179', '75159', '75313'], bonus: 0.07 },
  { id: 'golden', n: ['Золотой век комиксов', 'Золота доба коміксів', 'Golden age comics'], cat: 'comics', slots: ['action_comix_1', 'detective_comix_27', 'batmann_1', 'wonder_womann_1'], bonus: 0.1 },
  { id: 'nostalgia', n: ['Ностальгия 90‑х', 'Ностальгія 90‑х', '90s nostalgia'], cat: 'collectibles', cats: ['toys', 'collectibles', 'consoles'], slots: ['tamagochi', 'fyrby', 'love_is', 'tazos', 'киндер', 'денди'], bonus: 0.08 },
];
export function slotMatch(slot, modelId) { return modelId.includes(slot); }
export function setProgress(set) {
  const s = G.s;
  const filled = s.coll[set.id] || {};
  return { filled, n: Object.keys(filled).length, total: set.slots.length, done: Object.keys(filled).length >= set.slots.length };
}
export function slotsFor(it) {
  const out = [];
  for (const set of SETS) {
    if (!(set.cats || [set.cat]).includes(it.cat)) continue;
    for (const slot of set.slots) if (slotMatch(slot, it.m) && !(G.s.coll[set.id] || {})[slot]) out.push({ set, slot });
  }
  return out;
}
export function putInCollection(it, set, slot) {
  const s = G.s;
  (s.coll[set.id] ||= {})[slot] = { ...it, coll: set.id };
  s.inv = s.inv.filter((x) => x.id !== it.id);
  const p = setProgress(set);
  if (p.done && !s.quests.claimed['set_' + set.id]) {
    s.quests.claimed['set_' + set.id] = true;
    addXP(300);
    notify('collections', T('Коллекция собрана!', 'Колекцію зібрано!', 'Collection complete!'), `${L(set.n)}: +${Math.round(set.bonus * 100)}%`);
  }
  emit('inv');
}
export function takeFromCollection(set, slot) {
  const s = G.s;
  const it = s.coll[set.id]?.[slot];
  if (!it) return;
  delete s.coll[set.id][slot];
  delete it.coll;
  s.inv.unshift(it);
  emit('inv');
}
export function collectionBonus(cat) {
  let b = 0;
  for (const set of SETS) if ((set.cats || [set.cat]).includes(cat) && setProgress(set).done) b += set.bonus;
  return b;
}
