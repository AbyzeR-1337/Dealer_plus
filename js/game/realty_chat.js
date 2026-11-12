// Writing to a landlord or a seller before you rent or buy. The ad never tells everything: the place may
// already be gone, the owner may never answer, the photos may be a year old, they may only let to families
// or check you with the police, they may haggle or drop the agency fee, a flat for sale may come with a
// utility debt — and some "owners" are scammers who want a booking prepayment and refuse any viewing.
// Replies come after a few game minutes ("печатает…"); the Rent / Buy button opens once they confirm it's free.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { fmt, nicePrice } from '../core/money.js';
import { spend, notify, stat, addXP, canAfford } from './player.js';
import { factsOf, dealOf, findListing, priceFor, perDayOf, tierName } from './housing.js';

const OWNERS = [['Галина Петровна', 'Галина Петрівна', 'Galina'], ['Сергей', 'Сергій', 'Serhiy'], ['Ирина', 'Ірина', 'Iryna'], ['Олег Николаевич', 'Олег Миколайович', 'Oleh'], ['Марина', 'Марина', 'Maryna'], ['Дмитрий', 'Дмитро', 'Dmytro'], ['Тамара Ивановна', 'Тамара Іванівна', 'Tamara'], ['Артём', 'Артем', 'Artem'], ['Наталья', 'Наталія', 'Natalia'], ['Виктор Степанович', 'Віктор Степанович', 'Viktor'], ['Алина', 'Аліна', 'Alina'], ['Рустам', 'Рустам', 'Rustam'], ['Людмила', 'Людмила', 'Liudmyla'], ['Игорь', 'Ігор', 'Ihor']];
const AGENTS = [['Максим', 'Максим', 'Max'], ['Юлия', 'Юлія', 'Yulia'], ['Денис', 'Денис', 'Denys'], ['Кристина', 'Христина', 'Kristina'], ['Антон', 'Антон', 'Anton'], ['Оксана', 'Оксана', 'Oksana'], ['Вадим', 'Вадим', 'Vadym']];
const AGENCIES = ['«Квадратный метр»', '«Ключ‑Сервис»', '«Домострой Плюс»', '«Новосёл»', '«Метры и Ко»', '«Твой Адрес»', '«Жильё Онлайн»'];
const COLORS = ['#ff9a5c', '#4da3ff', '#2ec27e', '#c061cb', '#e8524a', '#c9a227', '#3584e4', '#9141ac', '#26a269'];

export function personOf(l) {
  const f = factsOf(l);
  const name = L((l.agency ? AGENTS : OWNERS)[f.who % (l.agency ? AGENTS : OWNERS).length]);
  return { name, role: l.agency ? `${T('агент', 'агент', 'agent')} ${AGENCIES[f.who % AGENCIES.length]}` : l.kind === 'sale' ? T('продавец, собственник', 'продавець, власник', 'seller, owner') : T('собственник', 'власник', 'owner'), col: COLORS[f.who % COLORS.length], ini: name[0] };
}
const week = () => Math.floor(G.s.t / (1440 * 7));
const chats = () => (G.s.reChats ||= {});
export const chatList = () => Object.values(chats()).filter((c) => c.week === week()).sort((a, b) => (b.last || 0) - (a.last || 0));
// listings you can no longer use: reported or the "owner" blocked you after the prepayment
export const hiddenListing = (id) => ['reported', 'scammed'].includes(dealOf(id)?.st);
export const isWatched = (id) => typeof document !== 'undefined' && !!document.querySelector(`[data-rechat="${id}"]`);

// what you can ask right now
export function questions(l) {
  const c = dealOf(l.id), sale = l.kind === 'sale';
  const asked = c?.asked || [];
  if (!c || !asked.includes('avail')) return ['avail'];
  if (!['ok', 'bait'].includes(c.st) || c.wait) return [];
  const q = sale ? ['haggle', 'docs', 'photo', 'view'] : ['req', 'photo', 'haggle', ...(l.agency ? ['fee'] : []), 'view'];
  return q.filter((k) => !asked.includes(k));
}
export function qLabel(l, k) {
  const sale = l.kind === 'sale';
  return {
    avail: sale ? T('Здравствуйте! Ещё продаётся?', 'Добрий день! Ще продається?', 'Hi! Is it still for sale?') : T('Здравствуйте! Ещё сдаётся?', 'Добрий день! Ще здається?', 'Hi! Is it still available?'),
    req: T('Можно мне заселиться одному? Какие требования к жильцам?', 'Можна мені заселитися самому? Які вимоги до мешканців?', 'Can I move in on my own? Any requirements for tenants?'),
    photo: T('Фото актуальные? Состояние как на снимках?', 'Фото актуальні? Стан як на знімках?', 'Are the photos current? Is it like in the pictures?'),
    haggle: sale ? T('Торг уместен?', 'Торг доречний?', 'Is the price negotiable?') : T('Скинете немного, если сниму на месяц?', 'Скинете трохи, якщо зніму на місяць?', 'Any discount if I take it for a month?'),
    fee: T('А можно без комиссии или хотя бы поменьше?', 'А можна без комісії або хоча б меншу?', 'Could we skip the fee, or at least cut it?'),
    docs: T('Документы в порядке? Долгов по коммуналке нет?', 'Документи в порядку? Боргів за комуналку немає?', 'Are the papers in order? Any unpaid utility bills?'),
    view: T('Можно приехать посмотреть?', 'Можна приїхати подивитися?', 'Can I come and see it?'),
  }[k];
}
export const Q_ICON = { avail: '👋', req: '🙋', photo: '📷', haggle: '🤝', fee: '💼', docs: '📄', view: '👀' };

function push(c, f, tx) { c.msgs.push({ f, tx, t: G.s.t }); c.last = G.s.t; }
export function ask(id, k) {
  const s = G.s, l = findListing(id);
  if (!l) return { ok: false };
  const c = (chats()[id] ||= { id, kind: l.kind, week: week(), msgs: [], asked: [], st: 'new', wait: null, disc: 0, feeK: 1, held: 0 });
  if (c.wait || c.asked.includes(k) || !questions(l).includes(k)) return { ok: false };
  push(c, 'me', qLabel(l, k));
  c.asked.push(k);
  const f = factsOf(l);
  const r = new RNG(`rq|${id}|${k}|${s.t}`);
  // agents answer fast, owners whenever they look at the phone; a "ghost" never answers
  const delay = f.avail === 'ghost' ? 9 : l.agency ? r.int(1, 3) : r.int(2, 6);
  c.wait = { at: s.t + delay, q: k };
  if (c.st === 'new') c.st = 'wait';
  emit('house');
  return { ok: true };
}

const pct = (x) => `${Math.round(x * 100)}%`;
const bestPeriod = (l) => (l.periods?.includes('month') ? 'month' : 'week');
function answer(c, l) {
  const f = factsOf(l), k = c.wait.q, sale = l.kind === 'sale', v = f.style;
  const scam = f.avail === 'scam';
  c.wait = null;
  const say = (tx) => push(c, 'them', tx);
  if (k === 'avail') {
    if (f.avail === 'ghost') { push(c, 'sys', T('Хозяин так и не ответил — похоже, объявление неактуально.', 'Господар так і не відповів — схоже, оголошення неактуальне.', 'No reply at all — the ad looks dead.')); c.st = 'dead'; return; }
    if (f.avail === 'taken') {
      say(sale ? [T('Уже продали, извините.', 'Вже продали, вибачте.', 'Already sold, sorry.'), T('Квартира под задатком, сделка на следующей неделе.', 'Квартира під завдатком, угода наступного тижня.', 'There’s a deposit on it, the deal closes next week.')][v % 2]
        : [T('Извините, уже сдали.', 'Вибачте, вже здали.', 'Sorry, it’s already let.'), T('Ой, вчера заселились жильцы, объявление забыли снять.', 'Ой, учора заселилися мешканці, оголошення забули зняти.', 'Oh, tenants moved in yesterday, forgot to take the ad down.'), T('Уже внесли задаток, простите.', 'Вже внесли завдаток, вибачте.', 'Someone already paid a deposit, sorry.')][v % 3]);
      c.st = 'taken'; return;
    }
    if (scam) {
      c.scamAsk = nicePrice(sale ? l.price * 0.05 : priceFor(l, bestPeriod(l)) * 0.5);
      say(sale ? T(`Да! Продаю срочно, поэтому дёшево. Внесите задаток ${fmt(c.scamAsk)} на карту — иначе завтра заберут.`, `Так! Продаю терміново, тому дешево. Внесіть завдаток ${fmt(c.scamAsk)} на картку — інакше завтра заберуть.`, `Yes! Selling fast, hence the price. Send a ${fmt(c.scamAsk)} deposit to my card or it’s gone tomorrow.`)
        : T(`Да, свободна! Но желающих очень много. Чтобы забронировать за вами, переведите предоплату ${fmt(c.scamAsk)} на карту — и я сниму объявление.`, `Так, вільна! Але бажаючих дуже багато. Щоб забронювати за вами, перекажіть передоплату ${fmt(c.scamAsk)} на картку — і я зніму оголошення.`, `Yes, it’s free! But lots of people want it. Send a ${fmt(c.scamAsk)} prepayment to my card to book it and I’ll take the ad down.`));
      c.st = 'bait'; return;
    }
    say(l.agency ? [T('Добрый день! Да, объект свободен, можем показать хоть сегодня.', 'Добрий день! Так, обʼєкт вільний, можемо показати хоч сьогодні.', 'Good afternoon! Yes, it’s available, we can show it today.'), T('Здравствуйте! Актуально. Задавайте вопросы.', 'Вітаю! Актуально. Ставте запитання.', 'Hello! Still available. Ask away.')][v % 2]
      : sale ? [T('Да, продаётся.', 'Так, продається.', 'Yes, still for sale.'), T('Здравствуйте! Да, ещё в продаже.', 'Вітаю! Так, ще в продажу.', 'Hello! Yes, still on the market.')][v % 2]
        : [T('Да, свободна! Когда хотели бы заехать?', 'Так, вільна! Коли хотіли б заїхати?', 'Yes, it’s free! When would you like to move in?'), T('Здравствуйте, да, ещё сдаётся.', 'Вітаю, так, ще здається.', 'Hello, yes, still available.'), T('Актуально. Пишите, если есть вопросы.', 'Актуально. Пишіть, якщо є питання.', 'Still available. Ask if you have questions.')][v % 3]);
    c.st = 'ok';
    if (f.hold) {
      c.holdAsk = nicePrice(priceFor(l, bestPeriod(l)) * 0.15);
      c.holdUntil = G.s.t + 180;
      say(T(`Если нужно — придержу за вами за задаток ${fmt(c.holdAsk)}, он пойдёт в счёт оплаты. Иначе сдам первому, кто приедет.`, `Якщо треба — притримаю за вами за завдаток ${fmt(c.holdAsk)}, він піде в рахунок оплати. Інакше здам першому, хто приїде.`, `If you like, I’ll hold it for a ${fmt(c.holdAsk)} deposit that counts towards the rent. Otherwise it goes to whoever shows up first.`));
    }
    return;
  }
  if (k === 'req') {
    if (scam) { say(T('Да всё можно, главное — бронируйте быстрее!', 'Та все можна, головне — бронюйте швидше!', 'Anything goes, just book it quick!')); return; }
    c.knowReq = true;
    say({
      none: [T('Можно, конечно. Главное — платить вовремя и без шумных вечеринок.', 'Можна, звісно. Головне — платити вчасно й без гучних вечірок.', 'Of course. Just pay on time and no loud parties.'), T('Без проблем, одному даже лучше.', 'Без проблем, одному навіть краще.', 'No problem, one person is even better.')][v % 2],
      family: T('Извините, сдаём только семейной паре.', 'Вибачте, здаємо лише сімейній парі.', 'Sorry, we only let to a married couple.'),
      long: T('Можно, но только на долгий срок — от месяца.', 'Можна, але лише на довгий термін — від місяця.', 'Yes, but long‑term only — a month or more.'),
      clean: T(`Можно. Но мы проверяем жильцов: если были проблемы с полицией — не сдадим.`, 'Можна. Але ми перевіряємо мешканців: якщо були проблеми з поліцією — не здамо.', 'Yes. But we check tenants: any trouble with the police and it’s a no.'),
      income: T('Можно, но покажите выписку: на счету должно быть хотя бы на три платежа.', 'Можна, але покажіть виписку: на рахунку має бути хоча б на три платежі.', 'Yes, but show a bank statement with at least three payments’ worth.'),
    }[f.req]);
    return;
  }
  if (k === 'photo') {
    if (scam) { say(T('Да-да, всё как на фото, даже лучше!', 'Так-так, усе як на фото, навіть краще!', 'Yes, yes, just like the photos, even better!')); return; }
    c.knowTier = true;
    say(f.oldPhotos ? T(`Честно? Фото прошлогодние, сейчас там попроще — «${tierName(f.realTier)}».`, `Чесно? Фото торішні, зараз там простіше — «${tierName(f.realTier)}».`, `Honestly? The photos are a year old, it’s plainer now — “${tierName(f.realTier)}”.`)
      : [T('Фото свежие, всё как на снимках.', 'Фото свіжі, усе як на знімках.', 'Fresh photos, it’s exactly like that.'), T('Снимали на прошлой неделе, ничего не поменялось.', 'Знімали минулого тижня, нічого не змінилося.', 'Taken last week, nothing’s changed.')][v % 2]);
    return;
  }
  if (k === 'haggle') {
    if (scam) { say(T('Цена и так ниже рынка, торг неуместен. Бронируйте, пока свободно!', 'Ціна й так нижча за ринок, торг недоречний. Бронюйте, поки вільно!', 'It’s already below market, no haggling. Book it while you can!')); return; }
    if (!f.disc) { say([T('Цена окончательная, торга нет.', 'Ціна остаточна, торгу немає.', 'The price is final.'), T('Нет, и так недорого.', 'Ні, і так недорого.', 'No, it’s cheap as it is.')][v % 2]); return; }
    c.disc = f.disc;
    say(sale ? T(`Небольшой торг есть: отдам за ${fmt(nicePrice(l.price * (1 - f.disc)))}.`, `Невеликий торг є: віддам за ${fmt(nicePrice(l.price * (1 - f.disc)))}.`, `A little room: I’ll let it go for ${fmt(nicePrice(l.price * (1 - f.disc)))}.`)
      : l.periods.includes('month') ? T(`Если заедете на месяц — скину ${pct(f.disc)}.`, `Якщо заїдете на місяць — скину ${pct(f.disc)}.`, `Take it for a month and I’ll knock off ${pct(f.disc)}.`)
        : T('Скидок не даю, но и цену не подниму.', 'Знижок не даю, але й ціну не підніму.', 'No discounts, but I won’t raise it either.'));
    return;
  }
  if (k === 'fee') {
    c.feeK = f.feeK;
    say(f.feeK === 0 ? T('Ладно, для вас — без комиссии.', 'Гаразд, для вас — без комісії.', 'Fine, no fee for you.') : f.feeK < 1 ? T('Могу скинуть комиссию вдвое.', 'Можу зменшити комісію вдвічі.', 'I can halve the fee.') : T('Комиссия фиксированная, без неё никак.', 'Комісія фіксована, без неї ніяк.', 'The fee is fixed, sorry.'));
    return;
  }
  if (k === 'docs') {
    if (scam) { say(T('Документы у нотариуса, покажу после задатка.', 'Документи в нотаріуса, покажу після завдатку.', 'The papers are with the notary, I’ll show them after the deposit.')); return; }
    c.knowDebt = true;
    say(f.debtK ? T(`Есть долг по коммуналке — ${fmt(nicePrice(l.price * f.debtK))}. Погашу сам перед сделкой.`, `Є борг за комуналку — ${fmt(nicePrice(l.price * f.debtK))}. Погашу сам перед угодою.`, `There’s a ${fmt(nicePrice(l.price * f.debtK))} utility debt. I’ll clear it before the deal.`)
      : T('Всё чисто: один собственник, без долгов и обременений.', 'Усе чисто: один власник, без боргів і обтяжень.', 'All clean: one owner, no debts, no liens.'));
    return;
  }
  if (k === 'view') {
    if (scam) { c.noView = true; say(T('Показать сейчас не могу — я в другом городе. Бронь только по предоплате, ключи передаст соседка.', 'Показати зараз не можу — я в іншому місті. Бронь лише за передоплатою, ключі передасть сусідка.', 'Can’t show it now, I’m out of town. Booking only with a prepayment, the neighbour will hand over the keys.')); return; }
    c.viewOk = true;
    say([T('Конечно, приезжайте — адрес скину.', 'Звісно, приїжджайте — адресу скину.', 'Sure, come over — I’ll send the address.'), T('Да, сегодня до вечера я на месте.', 'Так, сьогодні до вечора я на місці.', 'Yes, I’m there until this evening.')][v % 2]);
  }
}

// the trip to see the place: the photos can't lie to your face
export const viewCost = (l) => nicePrice(Math.max(3, perDayOf(l) * 0.15));
export function goView(id) {
  const l = findListing(id), c = dealOf(id);
  if (!l || !c?.viewOk || c.viewed) return { ok: false };
  if (!spend(viewCost(l), 'travel', T('Такси на просмотр', 'Таксі на перегляд', 'Taxi to a viewing'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  const f = factsOf(l);
  c.viewed = true; c.knowTier = true;
  push(c, 'sys', f.oldPhotos ? T(`Вы съездили на просмотр: в жизни хуже, чем на фото — «${tierName(f.realTier)}».`, `Ви зʼїздили на перегляд: наживо гірше, ніж на фото — «${tierName(f.realTier)}».`, `You went to the viewing: it’s worse than the photos — “${tierName(f.realTier)}”.`) : T('Вы съездили на просмотр: всё как на фото.', 'Ви зʼїздили на перегляд: усе як на фото.', 'You went to the viewing: just like the photos.'));
  emit('house');
  return { ok: true, old: f.oldPhotos };
}
// paying a booking deposit: a real owner holds the place (it counts towards the rent), a scammer vanishes
export function payPrepay(id) {
  const l = findListing(id), c = dealOf(id);
  if (!l || !c) return { ok: false };
  const scam = c.st === 'bait';
  const sum = scam ? c.scamAsk : c.holdAsk;
  if (!sum || (!scam && c.held)) return { ok: false };
  if (!canAfford(sum) || !spend(sum, scam ? 'scam' : 'rent', scam ? T('Предоплата за бронь', 'Передоплата за бронь', 'Booking prepayment') : T('Задаток за жильё', 'Завдаток за житло', 'Holding deposit'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  push(c, 'me', T(`Отправил(а) ${fmt(sum)}.`, `Надіслав(ла) ${fmt(sum)}.`, `Sent ${fmt(sum)}.`));
  if (scam) {
    push(c, 'sys', T('Сообщение не доставлено: пользователь заблокировал вас. Объявление удалено.', 'Повідомлення не доставлено: користувач заблокував вас. Оголошення видалено.', 'Message not delivered: the user blocked you. The ad is gone.'));
    c.st = 'scammed'; stat('scammed');
    notify('realty', T('Вас развели', 'Вас ошукали', 'You got scammed'), T(`«Хозяин» взял ${fmt(sum)} и пропал. Настоящие хозяева не боятся показа.`, `«Господар» узяв ${fmt(sum)} і зник. Справжні господарі не бояться показу.`, `The “owner” took ${fmt(sum)} and vanished. Real owners don’t dodge viewings.`), { noBadge: true, silent: true });
  } else {
    c.held = sum; c.holdUntil = null;
    push(c, 'them', T('Получено, держу за вами. Задаток зачту в оплату.', 'Отримано, тримаю за вами. Завдаток зарахую в оплату.', 'Got it, it’s yours. The deposit counts towards the rent.'));
  }
  emit('house');
  return { ok: true, scam };
}
// reporting the ad: right about a scammer — it's taken down; wrong about an honest owner — they stop talking to you
export function report(id) {
  const c = dealOf(id);
  if (!c || c.st === 'done') return { ok: false };
  if (c.st === 'bait') {
    c.st = 'reported'; stat('scamsCaught'); addXP(15);
    push(c, 'sys', T('Модерация проверила: мошенник. Объявление удалено, спасибо!', 'Модерація перевірила: шахрай. Оголошення видалено, дякуємо!', 'Moderators confirmed a scammer. The ad is removed, thanks!'));
    emit('house');
    return { ok: true, right: true };
  }
  c.st = 'dead';
  push(c, 'sys', T('Модерация проверила: объявление настоящее. Хозяин обиделся и больше не отвечает.', 'Модерація перевірила: оголошення справжнє. Господар образився й більше не відповідає.', 'Moderators found the ad genuine. The owner is offended and stopped replying.'));
  emit('house');
  return { ok: true, right: false };
}
// when the landlord's rules say no at the moment you try to move in
export function refusedBy(id, msg) {
  const c = dealOf(id); if (!c) return;
  push(c, 'them', msg); c.knowReq = true;
  emit('house');
}

// every game minute
export function reChatTick() {
  const s = G.s, all = s.reChats;
  if (!all) return;
  const wk = week();
  for (const id in all) {
    const c = all[id];
    if (c.week !== wk) { delete all[id]; continue; }
    if (c.wait && s.t >= c.wait.at) {
      const l = findListing(id);
      if (!l) { delete all[id]; continue; }
      answer(c, l);
      const lastThem = [...c.msgs].reverse().find((m) => m.f !== 'me');
      if (!isWatched(id) && lastThem) notify('realty', personOf(l).name, lastThem.tx, { go: ['realty', 'chat', { id }] });
      emit('house');
    }
    // an owner offered to hold the place and you didn't pay: someone else may have moved in
    if (c.st === 'ok' && c.holdUntil && !c.held && s.t >= c.holdUntil) {
      c.holdUntil = null;
      if (new RNG(`hold|${id}`).chance(0.55)) {
        push(c, 'them', T('Извините, сдали другим — вы не внесли задаток.', 'Вибачте, здали іншим — ви не внесли завдаток.', 'Sorry, it went to someone else — you didn’t pay the deposit.'));
        c.st = 'taken';
        if (!isWatched(id)) { const l = findListing(id); if (l) notify('realty', personOf(l).name, T('Сдали другим', 'Здали іншим', 'Let to someone else'), { go: ['realty', 'chat', { id }] }); }
        emit('house');
      }
    }
  }
}
// a short status for the listing card and the ad page
export function chatBadge(id) {
  const c = dealOf(id);
  if (!c) return null;
  if (c.wait) return ['⏳', T('ждём ответа', 'чекаємо відповіді', 'awaiting reply'), ''];
  return {
    wait: ['⏳', T('ждём ответа', 'чекаємо відповіді', 'awaiting reply'), ''],
    ok: ['✅', c.held ? T('за вами', 'за вами', 'held for you') : T('свободна', 'вільна', 'available'), 'g'],
    taken: ['❌', l2(c.kind), 'r'],
    dead: ['🔇', T('не отвечает', 'не відповідає', 'no reply'), 'r'],
    bait: ['💬', T('просят предоплату', 'просять передоплату', 'wants a prepayment'), 'o'],
    done: ['🔑', c.kind === 'sale' ? T('куплено', 'куплено', 'bought') : T('вы сняли', 'ви зняли', 'you rented it'), 'g'],
  }[c.st] || null;
}
const l2 = (kind) => (kind === 'sale' ? T('уже продана', 'вже продана', 'already sold') : T('уже сдана', 'вже здана', 'already let'));
export const tierHint = (l) => { const c = dealOf(l.id); const f = factsOf(l); return c?.knowTier && f.oldPhotos ? f.realTier : null; };
