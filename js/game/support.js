// Marketplace support: disputes with buyers and sellers, scam reports, review appeals and account
// restrictions. Decisions are made from evidence: the chat log (what you promised), the listing (what
// you disclosed) and the item itself. Lying in chats and selling fakes earns strikes; three strikes
// freeze your listings for two days.
import { G, emit } from '../core/state.js';
import { RNG } from '../core/rng.js';
import { T, L } from '../core/i18n.js';
import { uid, chance, pickR } from '../core/util.js';
import { fmt } from '../core/money.js';
import { DEFECTS } from '../data/catalog.js';
import { AGENTS, SUPPORT, REVIEW_BAD } from '../data/talk_common.js';
import { charge, earn, addReview, removeReview, notify, addXP, stat, getItem, removeItem } from './player.js';
import { itemTitle, defectName } from './items.js';
import { fill } from './talk.js';

export const BAN_STRIKES = 3;
const DAY = 1440;
const sup = () => (G.s.support ||= { tickets: [], strikes: 0, banUntil: 0 });
export const isBanned = () => (G.s.support?.banUntil || 0) > G.s.t;
export const banLeft = () => Math.max(0, (G.s.support?.banUntil || 0) - G.s.t);
export const openTickets = () => sup().tickets.filter((t) => t.st !== 'done').length;

export const TYPES = {
  dispute: ['Спор с покупателем', 'Спір із покупцем', 'Dispute with a buyer'],
  scam: ['Жалоба на мошенника', 'Скарга на шахрая', 'Scam report'],
  review: ['Оспорить отзыв', 'Оскаржити відгук', 'Review appeal'],
  seller: ['Спор с продавцом (гарантия сделки)', 'Спір із продавцем (гарантія угоди)', 'Dispute with a seller (deal protection)'],
  ban: ['Восстановить доступ к объявлениям', 'Відновити доступ до оголошень', 'Restore listing access'],
  question: ['Вопрос в поддержку', 'Питання до підтримки', 'Question for support'],
};

function newTicket(type, title, data, eta) {
  const s = G.s;
  const r = new RNG(`${s.id}:tk:${sup().tickets.length}:${s.t}`);
  const agent = L(r.pick(AGENTS));
  const t = { id: uid('t'), type, title, st: 'open', at: s.t, eta: s.t + eta, mid: s.t + Math.floor(eta / 2), agent, data, msgs: [], unread: 1 };
  t.msgs.push({ f: 'agent', tx: fill(L(r.pick(SUPPORT.ack)), { agent }), t: s.t });
  sup().tickets.unshift(t);
  if (sup().tickets.length > 60) sup().tickets.length = 60;
  emit('support');
  return t;
}
const say = (t, f, tx) => { t.msgs.push({ f, tx, t: G.s.t }); t.unread = 1; };

// ---------------------------------------------------------------- the buyer escalates a refused claim
export function openDispute(claimChat) {
  const sale = claimChat.sale;
  const t = newTicket('dispute', `${L(TYPES.dispute)}: ${sale.title}`, { chatId: claimChat.id, claim: claimChat.claim, lie: !!claimChat.lie, saleId: sale.id }, 90 + Math.floor(Math.random() * 120));
  say(t, 'sys', T(`Покупатель ${sale.buyer.name} открыл спор. Сумма: ${fmt(sale.price)}.`, `Покупець ${sale.buyer.name} відкрив спір. Сума: ${fmt(sale.price)}.`, `${sale.buyer.name} opened a dispute. Amount: ${fmt(sale.price)}.`));
  claimChat.st = 'dispute';
  claimChat.ticket = t.id;
  notify('market', L(TYPES.dispute), sale.title, { go: ['market', 'ticket', { id: t.id }] });
  return t;
}
// ---------------------------------------------------------------- I report a scammer from a chat
export function reportScam(chat) {
  const t = newTicket('scam', `${L(TYPES.scam)}: ${chat.npc.name}`, { chatId: chat.id, kind: chat.scamKind || 'link' }, 20 + Math.floor(Math.random() * 40));
  say(t, 'me', T('Покупатель присылает фишинговую ссылку / просит код. Прошу заблокировать.', 'Покупець надсилає фішингове посилання / просить код. Прошу заблокувати.', 'The buyer sends a phishing link / asks for a code. Please ban them.'));
  return t;
}
// ---------------------------------------------------------------- appeal a review
export function appealReview(reviewId) {
  const r = (G.s.rep.reviews || []).find((x) => x.id === reviewId);
  if (!r || r.appealed) return null;
  r.appealed = true;
  const t = newTicket('review', `${L(TYPES.review)}: ${'★'.repeat(r.stars)}`, { reviewId }, 60 + Math.floor(Math.random() * 120));
  say(t, 'me', T(`Отзыв «${r.text}» не соответствует сделке. Прошу проверить.`, `Відгук «${r.text}» не відповідає угоді. Прошу перевірити.`, `The review “${r.text}” doesn’t match the deal. Please check.`));
  return t;
}
// ---------------------------------------------------------------- I bought something that isn't as described
export function sellerDisputeInfo(it) {
  const b = it?.bought;
  if (!b) return { ok: false, why: T('Куплено не через площадку', 'Куплено не через майданчик', 'Not bought on the platform') };
  if (!b.safe) return { ok: false, why: T('Сделка была при встрече — гарантия не действует', 'Угода була при зустрічі — гарантія не діє', 'Met in person — no deal protection') };
  if (G.s.t - b.at > 3 * DAY) return { ok: false, why: T('Прошло больше 3 дней после покупки', 'Минуло понад 3 дні після покупки', 'More than 3 days since purchase') };
  if (b.disputed) return { ok: false, why: T('Спор уже открыт', 'Спір уже відкрито', 'Already disputed') };
  const hidden = it.defects.filter((d) => d.known && !b.knownAt.includes(d.c) && DEFECTS[d.c]?.vis !== 'visible');
  const fake = it.fake && it.fakeKnown && !b.fakeKnownAt;
  return { ok: true, hidden, fake };
}
export function disputeSeller(it) {
  const info = sellerDisputeInfo(it);
  if (!info.ok) return null;
  it.bought.disputed = true;
  const issues = [...info.hidden.map((d) => defectName(d.c).toLowerCase()), ...(info.fake ? [T('подделка', 'підробка', 'fake')] : [])];
  const t = newTicket('seller', `${L(TYPES.seller)}: ${itemTitle(it)}`, { itemId: it.id, issues, lies: it.bought.lies || [], strong: info.hidden.length > 0 || info.fake }, 120 + Math.floor(Math.random() * 120));
  say(t, 'me', issues.length ? T(`Товар не соответствует описанию: ${issues.join(', ')}. Прошу вернуть деньги.`, `Товар не відповідає опису: ${issues.join(', ')}. Прошу повернути гроші.`, `The item isn’t as described: ${issues.join(', ')}. I want a refund.`) : T('Товар мне не подошёл, хочу вернуть деньги.', 'Товар мені не підійшов, хочу повернути гроші.', 'The item doesn’t suit me, I want my money back.'));
  return t;
}
// ---------------------------------------------------------------- restore access after a ban
export function appealBan() {
  if (!isBanned()) return null;
  const t = newTicket('ban', L(TYPES.ban), { strikes: sup().strikes }, 60);
  say(t, 'me', T('Прошу восстановить доступ, нарушений больше не будет.', 'Прошу відновити доступ, порушень більше не буде.', 'Please restore access, it won’t happen again.'));
  return t;
}
export function askQuestion(text) {
  const t = newTicket('question', L(TYPES.question), {}, 15);
  say(t, 'me', text);
  return t;
}
export function strike(reason) {
  const st = sup();
  st.strikes++;
  notify('market', T('Предупреждение от площадки', 'Попередження від майданчика', 'Platform warning'), `${reason} (${st.strikes}/${BAN_STRIKES})`);
  if (st.strikes >= BAN_STRIKES) {
    st.banUntil = G.s.t + 2 * DAY; st.strikes = 0;
    notify('market', T('Объявления заморожены', 'Оголошення заморожено', 'Listings frozen'), T('На 2 дня за нарушения правил. Можно подать апелляцию в поддержку.', 'На 2 дні за порушення правил. Можна подати апеляцію до підтримки.', 'For 2 days for rule breaking. You can appeal to support.'));
    for (const l of G.s.listings) l.frozen = true;
  }
  emit('support');
}

// ---------------------------------------------------------------- ticking: decisions
export function supportTick() {
  const s = G.s;
  if (!s.support?.tickets?.length) return;
  for (const t of s.support.tickets) {
    if (t.st === 'done') continue;
    const r = new RNG(t.id);
    if (t.st === 'open' && s.t >= t.mid) { t.st = 'review'; say(t, 'agent', L(r.pick(SUPPORT.wait))); emit('support'); }
    if (s.t < t.eta) continue;
    resolve(t, r);
    t.st = 'done';
    notify('market', T('Поддержка ответила', 'Підтримка відповіла', 'Support replied'), t.title, { go: ['market', 'ticket', { id: t.id }] });
    emit('support');
  }
  if (s.support.banUntil && s.support.banUntil <= s.t) { s.support.banUntil = 0; for (const l of s.listings) l.frozen = false; }
}
function resolve(t, r) {
  const s = G.s;
  const win = (tx) => { t.outcome = 'win'; say(t, 'agent', L(r.pick(SUPPORT.win)) + (tx ? ' ' + tx : '')); };
  const lose = (tx, head) => { t.outcome = 'lose'; say(t, 'agent', (head || L(r.pick(SUPPORT.lose))) + (tx ? ' ' + tx : '')); };
  if (t.type === 'dispute') {
    const c = s.chats.find((x) => x.id === t.data.chatId);
    const sale = c?.sale;
    if (!sale) return lose();
    if (t.data.claim === 'bogus') {
      win(T('Претензия покупателя не подтвердилась, деньги остаются у вас.', 'Претензія покупця не підтвердилася, гроші лишаються у вас.', 'The buyer’s claim wasn’t confirmed; you keep the money.'));
      addXP(10); stat('disputesWon');
    } else {
      // the buyer was right: forced refund plus a platform fee, item comes back
      const fee = sale.price * 0.1;
      charge(sale.payout + fee, 'refund', T(`Возврат по решению поддержки: ${sale.title}`, `Повернення за рішенням підтримки: ${sale.title}`, `Refund by support decision: ${sale.title}`));
      const it = sale.itemSnap; it.listed = false; it.paid = sale.paid;
      s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: s.player.city, to: s.player.city, start: s.t, eta: s.t + 120, price: 0, who: c.npc.name, ret: true });
      const why = t.data.claim === 'fake' ? T('Товар оказался подделкой.', 'Товар виявився підробкою.', 'The item turned out to be fake.') : t.data.lie ? T('В переписке вы скрыли дефект — это нарушение правил.', 'У листуванні ви приховали дефект — це порушення правил.', 'You hid a defect in the chat — that breaks the rules.') : T('Дефект не был указан в объявлении.', 'Дефект не був зазначений в оголошенні.', 'The defect wasn’t in the listing.');
      lose(`${why} ${T(`Возврат ${fmt(sale.payout)} + сбор ${fmt(fee)}.`, `Повернення ${fmt(sale.payout)} + збір ${fmt(fee)}.`, `Refund ${fmt(sale.payout)} + fee ${fmt(fee)}.`)}`, T('Решение принято в пользу покупателя.', 'Рішення ухвалено на користь покупця.', 'Decision in the buyer’s favour.'));
      addReview(1, L(r.pick(REVIEW_BAD)), { buyer: c.npc.name, fair: true });
      if (t.data.lie || t.data.claim === 'fake') strike(t.data.claim === 'fake' ? T('Продажа подделки', 'Продаж підробки', 'Selling a fake') : T('Обман в переписке', 'Обман у листуванні', 'Lying in a chat'));
      stat('disputesLost');
    }
    if (c) c.st = 'closed';
  } else if (t.type === 'scam') {
    const bonus = 5 + Math.floor(r.float(0, 20));
    win(T(`Аккаунт мошенника заблокирован. Спасибо! Бонус за бдительность: ${fmt(bonus)}.`, `Акаунт шахрая заблоковано. Дякуємо! Бонус за пильність: ${fmt(bonus)}.`, `The scammer is banned. Thanks! Vigilance bonus: ${fmt(bonus)}.`));
    earn(bonus, 'bonus', T('Бонус поддержки', 'Бонус підтримки', 'Support bonus'));
    addXP(15); stat('scamsCaught');
  } else if (t.type === 'review') {
    const rv = (s.rep.reviews || []).find((x) => x.id === t.data.reviewId);
    if (rv && !rv.fair) { removeReview(rv.id); win(T('Отзыв нарушал правила и удалён.', 'Відгук порушував правила і видалений.', 'The review broke the rules and was removed.')); }
    else lose(T('Отзыв соответствует сделке и останется.', 'Відгук відповідає угоді й залишиться.', 'The review matches the deal and stays.'));
  } else if (t.type === 'seller') {
    const it = getItem(t.data.itemId);
    if (it && t.data.strong) {
      const price = it.bought?.price || it.paid || 0;
      removeItem(it.id);
      earn(price, 'refund', T(`Возврат от продавца: ${itemTitle(it)}`, `Повернення від продавця: ${itemTitle(it)}`, `Refund from seller: ${itemTitle(it)}`));
      win(T(`Продавец скрыл: ${t.data.issues.join(', ')}. Возвращаем ${fmt(price)}, товар уедет обратно.`, `Продавець приховав: ${t.data.issues.join(', ')}. Повертаємо ${fmt(price)}, товар поїде назад.`, `The seller hid: ${t.data.issues.join(', ')}. Refunding ${fmt(price)}, the item goes back.`));
      stat('disputesWon');
    } else lose(T('Товар соответствует объявлению. «Не подошло» — не основание для возврата.', 'Товар відповідає оголошенню. «Не підійшло» — не підстава для повернення.', 'The item matches the listing. “Didn’t suit me” isn’t grounds for a refund.'));
  } else if (t.type === 'ban') {
    if (chance(0.6)) { s.support.banUntil = Math.min(s.support.banUntil, s.t + 120); win(T('Доступ восстановим через 2 часа. Пожалуйста, не нарушайте правила.', 'Доступ відновимо за 2 години. Будь ласка, не порушуйте правил.', 'Access restored in 2 hours. Please follow the rules.')); }
    else lose(T('Ограничение снимется автоматически по окончании срока.', 'Обмеження зніметься автоматично після закінчення строку.', 'The restriction lifts automatically when it ends.'));
  } else {
    t.outcome = 'win';
    say(t, 'agent', pickR([T('Спасибо за вопрос! Совет: указывайте все дефекты в объявлении — так споры решаются в вашу пользу.', 'Дякуємо за питання! Порада: вказуйте всі дефекти в оголошенні — так спори вирішуються на вашу користь.', 'Thanks for asking! Tip: list every defect — disputes then go your way.'), T('Никогда не переходите по ссылкам из чата и не сообщайте коды из СМС.', 'Ніколи не переходьте за посиланнями з чату й не повідомляйте коди з СМС.', 'Never open links from chats and never share SMS codes.'), T('Покупки с доставкой защищены 3 дня: если товар не как в описании — открывайте спор.', 'Покупки з доставкою захищені 3 дні: якщо товар не як в описі — відкривайте спір.', 'Delivered purchases are protected for 3 days: open a dispute if it’s not as described.')]));
  }
}
