// Jobs: vacancies, applications, interviews, shifts with minigames and career growth.
import { G, emit } from '../core/state.js';
import { spend as spendMoney } from './player.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rint, pickR } from '../core/util.js';
import { countryOf } from '../data/world.js';
import { earn, stat, addXP, upLevel, notify, log, getStat, repScore } from './player.js';
import { fmt } from '../core/money.js';
import { npcName } from './npc.js';
import { RNG } from '../core/rng.js';

// pay: USD per shift at wage index 1 (scaled by country wage index)
export const JOBS = [
  { id: 'flyers', n: ['Промоутер (листовки)', 'Промоутер (листівки)', 'Flyer promoter'], co: ['Агентство «Флаер»', 'Агенція «Флаєр»', 'Flyer Agency'], pay: 10, game: 'flyers', req: {}, icon: '📄', d: ['Раздавай листовки заинтересованным прохожим.', 'Роздавай листівки зацікавленим перехожим.', 'Hand flyers to interested passers‑by.'], sched: ['Гибкий график', 'Гнучкий графік', 'Flexible'] },
  { id: 'courier', n: ['Пеший курьер', 'Піший курʼєр', 'Foot courier'], co: ['Доставка «Быстро»', 'Доставка «Швидко»', 'Rapid Delivery'], pay: 15, game: 'courier', req: {}, icon: '🛵', d: ['Доставляй заказы по точкам за отведённое время.', 'Доставляй замовлення по точках вчасно.', 'Deliver orders to all points in time.'], sched: ['2/2', '2/2', '2/2'] },
  { id: 'loader', n: ['Грузчик', 'Вантажник', 'Loader'], co: ['Склад «Логист»', 'Склад «Логіст»', 'Logist Warehouse'], pay: 16, game: 'rhythm', req: {}, icon: '📦', d: ['Поднимай коробки в ритм — не урони!', 'Піднімай коробки в ритм — не впусти!', 'Lift boxes in rhythm — don’t drop them!'], sched: ['Сменный', 'Змінний', 'Shifts'] },
  { id: 'cashier', n: ['Кассир', 'Касир', 'Cashier'], co: ['Супермаркет «Пятёрочка+»', 'Супермаркет «Сільпо+»', 'MegaMart'], pay: 18, game: 'cashier', req: {}, icon: '🧾', d: ['Выдавай сдачу точно и быстро.', 'Видавай решту точно й швидко.', 'Give exact change, fast.'], sched: ['5/2', '5/2', '5/2'] },
  { id: 'barista', n: ['Бариста', 'Бариста', 'Barista'], co: ['Кофейня «Зерно»', 'Кавʼярня «Зерно»', 'Bean Café'], pay: 17, game: 'recipe', req: {}, icon: '☕', d: ['Запомни заказ и собери напиток.', 'Запамʼятай замовлення й збери напій.', 'Memorize the order and make the drink.'], sched: ['2/2', '2/2', '2/2'] },
  { id: 'sorter', n: ['Сортировщик маркетплейса', 'Сортувальник маркетплейсу', 'Marketplace sorter'], co: ['Склад маркетплейса', 'Склад маркетплейсу', 'Marketplace hub'], pay: 20, game: 'sort', req: { level: 2 }, icon: '🏷', d: ['Раскидывай посылки по зонам.', 'Розкидай посилки по зонах.', 'Sort parcels into the right zones.'], sched: ['Ночные смены', 'Нічні зміни', 'Night shifts'] },
  { id: 'guard', n: ['Охранник ТЦ', 'Охоронець ТЦ', 'Mall security'], co: ['ЧОП «Щит»', 'ЧОП «Щит»', 'Shield Security'], pay: 21, game: 'guard', req: { level: 2 }, icon: '🛡', d: ['Лови воров на камерах.', 'Лови злодіїв на камерах.', 'Catch shoplifters on CCTV.'], sched: ['Сутки/трое', 'Доба/три', '24/72'] },
  { id: 'tech', n: ['Мастер по ремонту телефонов', 'Майстер з ремонту телефонів', 'Phone repair tech'], co: ['Сервис «Смарт‑Док»', 'Сервіс «Смарт‑Док»', 'SmartDoc Service'], pay: 34, game: 'screws', req: { level: 3, repairs: 5 }, icon: '🔧', d: ['Чини телефоны клиентов. Опыт ремонта обязателен.', 'Лагодь телефони клієнтів. Досвід ремонту обовʼязковий.', 'Fix customer phones. Repair experience required.'], sched: ['5/2', '5/2', '5/2'] },
  { id: 'appraiser', n: ['Оценщик в ломбарде', 'Оцінювач у ломбарді', 'Pawn shop appraiser'], co: ['Ломбард «Золотой»', 'Ломбард «Золотий»', 'Golden Pawn'], pay: 38, game: 'appraise', req: { level: 4, sold: 10 }, icon: '💍', d: ['Оценивай вещи клиентов точно.', 'Оцінюй речі клієнтів точно.', 'Appraise customers’ items accurately.'], sched: ['5/2', '5/2', '5/2'] },
  { id: 'taxi', n: ['Водитель такси', 'Водій таксі', 'Taxi driver'], co: ['Такси «Шашечки»', 'Таксі «Шашечки»', 'Checker Cabs'], pay: 45, game: 'taxi', req: { level: 3, car: true }, icon: '🚕', d: ['Нужна своя машина. Вези пассажиров без аварий.', 'Потрібне своє авто. Вези пасажирів без аварій.', 'Own car required. Drive without crashes.'], sched: ['Свободный', 'Вільний', 'Free'] },
  { id: 'dev', n: ['Junior‑разработчик', 'Junior‑розробник', 'Junior developer'], co: ['IT‑студия «Байт»', 'IT‑студія «Байт»', 'Byte Studio'], pay: 60, game: 'code', req: { level: 5 }, icon: '💻', d: ['Находи баги в коде. Удалёнка.', 'Знаходь баги в коді. Віддалено.', 'Find bugs in code. Remote.'], sched: ['Удалённо', 'Віддалено', 'Remote'] },
  { id: 'legit', n: ['Легит‑чекер ресейл‑бутика', 'Легіт‑чекер ресейл‑бутика', 'Resale legit checker'], co: ['Бутик «Original Only»', 'Бутик «Original Only»', 'Original Only'], pay: 70, game: 'legit', req: { level: 5, legit: 8 }, icon: '🔍', d: ['Отличай оригиналы от подделок.', 'Відрізняй оригінали від підробок.', 'Tell real from fake.'], sched: ['5/2', '5/2', '5/2'] },
  { id: 'auctioneer', n: ['Помощник аукциониста', 'Помічник аукціоніста', 'Auction assistant'], co: ['Аукционный дом', 'Аукціонний дім', 'Auction house'], pay: 85, game: 'tapRace', req: { level: 7, auctionsWon: 3 }, icon: '🔨', d: ['Веди торги в нужном темпе.', 'Веди торги в потрібному темпі.', 'Keep the bidding pace.'], sched: ['По событиям', 'За подіями', 'Event days'] },
  { id: 'manager', n: ['Управляющий магазином', 'Керуючий магазином', 'Store manager'], co: ['Сеть «Электромир»', 'Мережа «Електросвіт»', 'ElectroWorld'], pay: 120, game: 'sort', req: { level: 9, rep: 4.3 }, icon: '👔', d: ['Нужна репутация продавца 4.3+.', 'Потрібна репутація продавця 4.3+.', 'Seller rating 4.3+ required.'], sched: ['5/2', '5/2', '5/2'] },
];
export const RANKS = [
  { n: ['Стажёр', 'Стажер', 'Trainee'], mult: 1, need: 0 },
  { n: ['Сотрудник', 'Співробітник', 'Employee'], mult: 1.3, need: 4 },
  { n: ['Старший', 'Старший', 'Senior'], mult: 1.7, need: 12 },
  { n: ['Руководитель', 'Керівник', 'Lead'], mult: 2.3, need: 28 },
  { n: ['Директор направления', 'Директор напряму', 'Head of unit'], mult: 3.2, need: 55 },
];
export const SHIFT_COOLDOWN = 150; // game minutes
// every shift picks one of the job's tasks, so the same job doesn't always play the same minigame
const JOB_GAMES = { flyers: ['flyers', 'whack'], courier: ['courier', 'route', 'swipe'], loader: ['rhythm', 'catch'], cashier: ['cashier', 'change'], barista: ['recipe', 'pancake'], sorter: ['sort', 'swipe'], guard: ['guard', 'whack'], tech: ['code', 'simon'], appraiser: ['appraise', 'scale', 'spot'], taxi: ['taxi'], dev: ['code', 'compose', 'simon'], legit: ['spot', 'appraise'], auctioneer: ['memory', 'change'], manager: ['memory', 'change', 'swipe'] };
export const shiftGame = (job) => { const l = JOB_GAMES[job.id] || [job.game]; return l[Math.floor(Math.random() * l.length)] || job.game; };
export const jobById = (id) => JOBS.find((j) => j.id === id);
export const wageIdx = () => countryOf(G.s.player.city).wage;

export function reqOk(job) {
  const s = G.s, r = job.req || {};
  const miss = [];
  if (r.level && s.level < r.level) miss.push(T(`уровень ${r.level}+`, `рівень ${r.level}+`, `level ${r.level}+`));
  if (r.repairs && getStat('repairs') < r.repairs) miss.push(T(`ремонтов: ${r.repairs}+`, `ремонтів: ${r.repairs}+`, `${r.repairs}+ repairs`));
  if (r.sold && getStat('sold') < r.sold) miss.push(T(`продаж: ${r.sold}+`, `продажів: ${r.sold}+`, `${r.sold}+ sales`));
  if (r.legit && getStat('legit') < r.legit) miss.push(T(`легит‑чеков: ${r.legit}+`, `легіт‑чеків: ${r.legit}+`, `${r.legit}+ legit checks`));
  if (r.auctionsWon && getStat('auctionsWon') < r.auctionsWon) miss.push(T(`побед на аукционах: ${r.auctionsWon}+`, `перемог на аукціонах: ${r.auctionsWon}+`, `${r.auctionsWon}+ auction wins`));
  if (r.car && !s.car) miss.push(T('своя машина', 'своє авто', 'own car'));
  if (r.rep && repScore() < r.rep) miss.push(T(`рейтинг ${r.rep}+`, `рейтинг ${r.rep}+`, `rating ${r.rep}+`));
  return miss;
}
export const shiftPay = (job, rank = G.s.job.rank) => job.pay * wageIdx() * RANKS[rank].mult * (1 + upLevel('charisma') * 0.06);

// ---------------------------------------------------------------- documents & application windows
// every document takes real (game) time to get; vacancies only accept documents until their daily deadline
export const DOCS = {
  resume: { n: ['Резюме', 'Резюме', 'CV'], mins: 20, price: 0, icon: '📄', d: ['Заполнить анкету и описать опыт.', 'Заповнити анкету й описати досвід.', 'Fill in the form and your experience.'] },
  medbook: { n: ['Медкнижка', 'Медкнижка', 'Health certificate'], mins: 360, price: 25, icon: '🩺', d: ['Анализы и печать терапевта. Нужна для работы с едой и людьми.', 'Аналізи й печатка терапевта. Потрібна для роботи з їжею та людьми.', 'Tests and a doctor’s stamp. Needed for food and customer jobs.'] },
  criminal: { n: ['Справка о несудимости', 'Довідка про несудимість', 'Criminal record check'], mins: 720, price: 5, icon: '🏛', d: ['Запрос через госуслуги, ответ за полдня.', 'Запит через держпослуги, відповідь за пів дня.', 'Request via gov services, ready in half a day.'] },
  license: { n: ['Водительские права', 'Посвідчення водія', 'Driving licence'], mins: 1440, price: 60, icon: '🚗', d: ['Экзамен в автошколе и выдача прав.', 'Іспит в автошколі й видача прав.', 'Driving test and licence issue.'] },
  course: { n: ['Сертификат курсов', 'Сертифікат курсів', 'Course certificate'], mins: 480, price: 40, icon: '🎓', d: ['Онлайн-курс с экзаменом.', 'Онлайн-курс з іспитом.', 'Online course with an exam.'] },
};
const JOB_DOCS = { flyers: ['resume'], courier: ['resume'], loader: ['resume'], cashier: ['resume', 'medbook'], barista: ['resume', 'medbook'], sorter: ['resume'], guard: ['resume', 'criminal'], tech: ['resume', 'course'], appraiser: ['resume', 'criminal'], taxi: ['resume', 'license', 'criminal'], dev: ['resume', 'course'], legit: ['resume', 'course'], auctioneer: ['resume', 'criminal'], manager: ['resume', 'criminal', 'medbook'] };
export const jobDocs = (job) => JOB_DOCS[job.id] || ['resume'];
const docs = () => (G.s.docs ||= {});
export const docState = (k) => { const d = docs()[k]; if (!d) return 'none'; return d.ready <= G.s.t ? 'ready' : 'pending'; };
export const docReady = (k) => docState(k) === 'ready';
export const docReadyAt = (k) => docs()[k]?.ready || 0;
export function orderDoc(k) {
  const d = DOCS[k];
  if (docState(k) !== 'none') return { ok: false };
  if (d.price && !spendMoney(d.price, 'gov', L(d.n))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  docs()[k] = { at: G.s.t, ready: G.s.t + d.mins };
  emit('jobs');
  return { ok: true };
}
// daily window: from 08:00 until the job's own deadline hour
export function vacancyWindow(job) {
  const t = G.s.t;
  const day = Math.floor(t / 1440) * 1440;
  const h = 12 + (job.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 9); // 12:00–20:00
  const open = day + 8 * 60, close = day + h * 60;
  if (t < open) return { open: false, at: open };
  if (t >= close) return { open: false, at: open + 1440 };
  return { open: true, until: close };
}

export function apply(jobId) {
  const s = G.s;
  if (s.job.apps.some((a) => a.job === jobId && a.st !== 'closed')) return false;
  const job = jobById(jobId);
  if (!vacancyWindow(job).open) return false;
  if (jobDocs(job).some((k) => !docReady(k))) return false;
  const miss = reqOk(job);
  const rng = new RNG(`${s.id}:app:${jobId}:${s.t}`);
  const hr = npcName(rng, s.player.city).name;
  s.job.apps.unshift({ id: uid('a'), job: jobId, st: 'sent', at: s.t, respond: s.t + rint(25, 90), ok: miss.length === 0 && rng.chance(0.85 + upLevel('charisma') * 0.03), hr });
  stat('applications');
  emit('jobs');
  return true;
}
export function jobsTick() {
  const s = G.s;
  for (const a of s.job.apps) {
    if (a.st !== 'sent' || a.respond > s.t) continue;
    const job = jobById(a.job);
    if (a.ok) { a.st = 'invite'; notify('jobs', L(job.co), T(`${a.hr}: приглашаем на собеседование!`, `${a.hr}: запрошуємо на співбесіду!`, `${a.hr}: we’d like to interview you!`), { go: ['jobs', 'apps'] }); }
    else { a.st = 'rejected'; notify('jobs', L(job.co), T('К сожалению, вы нам не подходите.', 'На жаль, ви нам не підходите.', 'Unfortunately, you’re not a fit.'), { go: ['jobs', 'apps'] }); }
  }
  emit('jobs');
}
export function interviewResult(appId, score) {
  const s = G.s;
  const a = s.job.apps.find((x) => x.id === appId);
  if (!a) return false;
  const pass = score >= 0.55 - upLevel('charisma') * 0.04;
  a.st = pass ? 'offer' : 'failed';
  stat('interviews');
  emit('jobs');
  return pass;
}
export function acceptOffer(appId) {
  const s = G.s;
  const a = s.job.apps.find((x) => x.id === appId);
  if (!a || a.st !== 'offer') return;
  if (s.job.cur) s.job.past.push({ job: s.job.cur, shifts: s.job.shifts, rank: s.job.rank });
  s.job.cur = a.job; s.job.rank = 0; s.job.shifts = 0; s.job.good = 0; s.job.bad = 0; s.job.next = 0;
  a.st = 'hired';
  for (const o of s.job.apps) if (o !== a && o.st === 'offer') o.st = 'closed';
  log('job', L(jobById(a.job).n));
  emit('jobs');
}
export function quitJob() {
  const s = G.s;
  if (!s.job.cur) return;
  s.job.past.push({ job: s.job.cur, shifts: s.job.shifts, rank: s.job.rank });
  s.job.cur = null;
  emit('jobs');
}
export const canShift = () => { const s = G.s; return s.job.cur && s.t >= s.job.next && s.energy >= 12; };
export function finishShift(score) {
  const s = G.s;
  const job = jobById(s.job.cur);
  const pay = shiftPay(job) * (0.45 + score * 0.75);
  earn(pay, 'job', L(job.n));
  s.energy = clamp(s.energy - 14, 0, 100);
  s.food = clamp(s.food - 8, 0, 100);
  s.job.next = s.t + SHIFT_COOLDOWN;
  s.job.shifts++;
  stat('shifts');
  addXP(8 + score * 10);
  let event = null;
  if (score >= 0.6) { s.job.good++; s.job.bad = 0; } else { s.job.bad++; }
  const next = RANKS[s.job.rank + 1];
  if (next && s.job.good >= next.need) { s.job.rank++; event = 'promo'; notify('jobs', T('Повышение!', 'Підвищення!', 'Promotion!'), L(next.n)); }
  if (s.job.bad >= 3) { event = 'fired'; notify('jobs', T('Вас уволили', 'Вас звільнили', 'You were fired'), L(job.co)); quitJob(); }
  emit('jobs');
  return { pay, event };
}
// one-off gigs available without a job
export const GIGS = [
  { id: 'move', n: ['Помочь с переездом', 'Допомогти з переїздом', 'Help someone move'], pay: 12, game: 'rhythm', cd: 240 },
  { id: 'flyer', n: ['Раздать листовки у метро', 'Роздати листівки біля метро', 'Hand out flyers at the metro'], pay: 7, game: 'flyers', cd: 180 },
  { id: 'deliver', n: ['Разовая доставка', 'Разова доставка', 'One‑off delivery'], pay: 9, game: 'courier', cd: 200 },
  { id: 'truck', n: ['Разгрузить фуру', 'Розвантажити фуру', 'Unload a truck'], pay: 14, game: 'catch', cd: 260 },
  { id: 'till', n: ['Подменить кассира на рынке', 'Підмінити касира на ринку', 'Cover a market till'], pay: 10, game: 'change', cd: 220 },
  { id: 'parcels', n: ['Сортировка посылок в ночную', 'Сортування посилок у нічну', 'Night parcel sorting'], pay: 12, game: 'swipe', cd: 240 },
  { id: 'concert', n: ['Охрана на концерте', 'Охорона на концерті', 'Concert security'], pay: 16, game: 'whack', cd: 300 },
  { id: 'audit', n: ['Инвентаризация в магазине', 'Інвентаризація в магазині', 'Store stock count'], pay: 11, game: 'memory', cd: 260 },
  { id: 'lock', n: ['Помочь соседу с замком', 'Допомогти сусідові із замком', 'Help a neighbour with a lock'], pay: 8, game: 'lockpick', cd: 300 },
  { id: 'pancakes', n: ['Смена на блинной точке', 'Зміна на млинцевій точці', 'Pancake stall shift'], pay: 9, game: 'pancake', cd: 220 },
  { id: 'ads', n: ['Написать объявления для соседей', 'Написати оголошення для сусідів', 'Write ads for neighbours'], pay: 7, game: 'compose', cd: 200 },
];
export function finishGig(gig, score) {
  const s = G.s;
  const pay = gig.pay * wageIdx() * (0.4 + score * 0.8);
  earn(pay, 'job', L(gig.n));
  s.energy = clamp(s.energy - 10, 0, 100);
  s.gigs ||= {}; s.gigs[gig.id] = s.t + gig.cd;
  stat('gigs'); addXP(6 + score * 6);
  return pay;
}
export const gigReady = (gig) => (G.s.gigs?.[gig.id] || 0) <= G.s.t;
