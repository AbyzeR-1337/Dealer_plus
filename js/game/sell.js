// Selling: player listings, buyer chats & offers, shipping, payouts, returns and reviews.
import { G, emit } from '../core/state.js';
import { RNG } from '../core/rng.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rnd, pickR } from '../core/util.js';
import { countryOf, distanceKm } from '../data/world.js';
import { DEFECTS, LUXURY_CATS, CATS } from '../data/catalog.js';
import { itemValue, itemTitle, isVehicle, defectName, fakeLabel } from './items.js';
import { nicePrice, fmt } from '../core/money.js';
import { makeBuyer, TRAITS, PH, say, fill, SCAM_LINKS } from './npc.js';
import { getItem, removeItem, addItem, earn, charge, spend, stat, addXP, upLevel, notify, log, repFactor, addReview, addProfit } from './player.js';
import { demand } from './economy.js';
import { deliveryTime } from './market.js';
import { collectionBonus } from './quests.js';

export const PLATFORMS = {
  classifieds: { fee: 0, rate: 1, n: (c) => c.apps.classifieds[0], lvl: 1 },
  marketplace: { fee: 0.12, rate: 1.7, n: (c) => c.apps.marketplace[0], lvl: 3 },
  lux: { fee: 0.2, rate: 0.9, n: () => 'ReaLux', lvl: 4, bonus: 1.08, cats: [...LUXURY_CATS, 'sneakers', 'cards', 'comics', 'collectibles', 'cars'] },
};
export const myListing = (itemId) => G.s.listings.find((l) => l.itemId === itemId);

// What a buyer believes the item is worth (sees disclosed + visible problems)
export function buyerView(it, l, city) {
  const fakeDisclosed = l?.disclose && it.fake && it.fakeKnown;
  const shadow = { ...it, defects: it.defects.map((d) => ({ ...d, known: d.known && (l?.disclose || DEFECTS[d.c]?.vis === 'visible') })), fakeKnown: fakeDisclosed };
  return itemValue(shadow, city, 'known') * (1 + collectionBonus(it.cat));
}
export function listItem(itemId, platform, price, disclose = true) {
  const s = G.s;
  const it = getItem(itemId);
  if (!it || it.shop) return false;
  const old = myListing(itemId);
  if (old) { old.price = price; old.platform = platform; old.disclose = disclose; emit('listings'); return true; }
  s.listings.unshift({ id: uid('L'), itemId, platform, price, disclose, at: s.t, views: 0, city: s.player.city, offers: 0 });
  it.listed = true;
  stat('listed');
  log('sell', `${itemTitle(it)} — ${fmt(price)}`);
  emit('listings');
  return true;
}
export function unlist(itemId) {
  const s = G.s;
  s.listings = s.listings.filter((l) => l.itemId !== itemId);
  const it = getItem(itemId); if (it) it.listed = false;
  s.chats = s.chats.filter((c) => !(c.kind === 'sell' && c.itemId === itemId && c.st === 'open'));
  emit('listings');
}

// ---------------------------------------------------------------- buyer generation
export function sellTick() {
  const s = G.s;
  for (const l of s.listings) {
    const it = getItem(l.itemId);
    if (!it) continue;
    const city = s.player.city;
    const pf = PLATFORMS[l.platform] || PLATFORMS.classifieds;
    const val = buyerView(it, l, city) * (pf.bonus || 1) * (1 + upLevel('photo') * 0.03);
    const ratio = val / Math.max(0.01, l.price);
    const attract = clamp(Math.pow(ratio, 3.2), 0.02, 4);
    const rate = (1 / 95) * demand(it.cat, city) * repFactor() * (1 + upLevel('clients') * 0.22) * attract * pf.rate * (l.city === city ? 1 : 0.8);
    if (chance(rate * 0.5)) l.views += 1 + Math.floor(Math.random() * 4);
    const open = s.chats.filter((c) => c.kind === 'sell' && c.itemId === it.id && c.st === 'open').length;
    if (open < 2 && chance(rate)) newBuyerChat(it, l, val);
  }
}
function newBuyerChat(it, l, val) {
  const s = G.s;
  const rng = new RNG(`${s.id}:buyer:${it.id}:${s.t}`);
  const collectible = it.rar >= 2 || ['cards', 'comics', 'collectibles', 'antiques', 'art', 'toys', 'watches'].includes(it.cat);
  const b = makeBuyer(rng, s.player.city, { collectible, noScam: s.level < 2 });
  const tr = TRAITS[b.trait];
  // offer relative to asking price but bounded by their perceived value
  const cap = val * tr.max * (1 + upLevel('haggle') * 0.02);
  let offer = Math.min(l.price * rng.float(tr.offer[0], tr.offer[1]), cap);
  if (b.trait === 'scammer') offer = l.price * rng.float(1.0, 1.1);
  if (offer >= l.price * 0.985) offer = l.price;
  offer = nicePrice(Math.max(1, offer), countryOf(s.player.city).cur);
  const maxPay = b.trait === 'scammer' ? l.price * 1.2 : Math.max(offer, Math.min(cap * rng.float(0.97, 1.06), l.price * 1.02));
  const title = itemTitle(it);
  const c = { id: uid('c'), kind: 'sell', itemId: it.id, listingId: l.id, npc: b, title, offer, maxPay, ask: l.price, round: 0, patience: tr.patience + (b.trait === 'newbie' ? 1 : 0), st: 'open', msgs: [], t: s.t, unread: 1, persuaded: 0 };
  c.msgs.push({ f: 'them', tx: `${say(PH.greet, { item: title }, rng)} ${tr && PH.greetTrait[b.trait] ? L(PH.greetTrait[b.trait]) : ''}`.trim(), t: s.t });
  if (offer < l.price) c.msgs.push({ f: 'them', tx: say(PH.offer, { price: fmt(offer) }, rng), t: s.t });
  else c.msgs.push({ f: 'them', tx: T(`Готов взять за ${fmt(offer)}.`, `Готовий взяти за ${fmt(offer)}.`, `Ready to buy for ${fmt(offer)}.`), t: s.t });
  s.chats.unshift(c);
  l.offers++;
  notify('market', `${b.name} · ${T('покупатель', 'покупець', 'buyer')}`, c.msgs[c.msgs.length - 1].tx, { go: ['market', 'chat', { id: c.id }] });
  emit('chats');
}

// ---------------------------------------------------------------- player actions in a sell chat
export function chatGreet(c) {
  if (c.greeted) return;
  c.greeted = true;
  c.msgs.push({ f: 'me', tx: T('Здравствуйте! Да, ещё продаётся.', 'Добрий день! Так, ще продається.', 'Hello! Yes, still available.'), t: G.s.t });
  c.maxPay *= 1.02; c.patience += 0.5;
  if (c.npc.trait === 'scammer') return scamFollowup(c);
  emit('chats');
}
export function chatPersuade(c, score) {
  // score 0..1 from the QTE
  c.persuaded++;
  const bump = score >= 0.95 ? 0.07 : score >= 0.6 ? 0.04 : -0.02;
  c.maxPay *= 1 + bump;
  if (bump > 0) c.offer = nicePrice(Math.min(c.maxPay, c.offer * (1 + bump * 0.8)), countryOf(G.s.player.city).cur);
  c.msgs.push({ f: 'me', tx: pickR([T('Посмотрите, состояние отличное, такого больше не найдёте.', 'Подивіться, стан відмінний, такого більше не знайдете.', 'Look at the condition — you won’t find another like it.'), T('За эти деньги — лучший вариант на рынке.', 'За ці гроші — найкращий варіант на ринку.', 'Best deal on the market for this money.'), T('У меня уже есть ещё один покупатель…', 'У мене вже є ще один покупець…', 'I have another buyer lined up…')]), t: G.s.t });
  if (bump > 0) c.msgs.push({ f: 'them', tx: T(`Ладно, убедили. ${fmt(c.offer)}?`, `Гаразд, переконали. ${fmt(c.offer)}?`, `Okay, you convinced me. ${fmt(c.offer)}?`), t: G.s.t });
  else { c.patience -= 1; c.msgs.push({ f: 'them', tx: T('Не надо меня уговаривать.', 'Не треба мене вмовляти.', 'Don’t push me.'), t: G.s.t }); }
  if (c.patience <= 0) leave(c);
  emit('chats');
}
export function chatCounter(c, price) {
  const s = G.s;
  const rng = new RNG(c.id + ':ctr:' + c.round);
  c.round++;
  c.msgs.push({ f: 'me', tx: T(`Могу отдать за ${fmt(price)}.`, `Можу віддати за ${fmt(price)}.`, `I can let it go for ${fmt(price)}.`), t: s.t });
  if (c.npc.trait === 'scammer') return scamFollowup(c);
  if (price <= c.maxPay) {
    c.offer = price;
    c.msgs.push({ f: 'them', tx: say(PH.accept, {}, rng), t: s.t });
    c.st = 'agreed';
  } else {
    c.patience -= 1;
    if (c.patience <= 0) return leave(c);
    const mid = nicePrice(Math.min(c.maxPay, (c.offer + price) / 2 + (c.maxPay - c.offer) * 0.3), countryOf(s.player.city).cur);
    if (mid > c.offer) c.offer = mid;
    c.msgs.push({ f: 'them', tx: say(PH.counter, { price: fmt(c.offer) }, rng), t: s.t });
  }
  emit('chats');
}
export function chatAccept(c) {
  c.msgs.push({ f: 'me', tx: T(`Согласен, продам за ${fmt(c.offer)}`, `Згоден, продам за ${fmt(c.offer)}`, `Deal, ${fmt(c.offer)} it is`), t: G.s.t });
  if (c.npc.trait === 'scammer') return scamFollowup(c);
  c.st = 'agreed';
  emit('chats');
}
export function chatDecline(c) {
  c.msgs.push({ f: 'me', tx: T('Нет, спасибо', 'Ні, дякую', 'No, thanks'), t: G.s.t });
  c.st = 'closed';
  emit('chats');
}
function leave(c) {
  c.msgs.push({ f: 'them', tx: c.npc.trait === 'angry' ? L(PH.angryLeave) : say(PH.decline, {}), t: G.s.t });
  c.st = 'closed';
  emit('chats');
}
function scamFollowup(c) {
  const link = pickR(SCAM_LINKS);
  c.scam = link; c.st = 'scam';
  c.msgs.push({ f: 'them', tx: fill(L(PH.scamLink), { link }), t: G.s.t, link });
  emit('chats');
}
export function scamClick(c) {
  const s = G.s;
  const loss = Math.min(Math.max(0, s.money), Math.max(20, c.offer * 0.6));
  charge(loss, 'scam', T('Мошенники', 'Шахраї', 'Scammers'));
  c.msgs.push({ f: 'sys', tx: T(`⚠ С карты списано ${fmt(loss)}. Это был фишинг.`, `⚠ З картки списано ${fmt(loss)}. Це був фішинг.`, `⚠ ${fmt(loss)} stolen from your card. Phishing!`), t: s.t });
  c.st = 'closed';
  stat('scammed');
  emit('chats');
  return loss;
}
export function scamReport(c) {
  c.msgs.push({ f: 'me', tx: T('Это развод. Пожаловался в поддержку.', 'Це розвод. Поскаржився в підтримку.', 'That’s a scam. Reported.'), t: G.s.t });
  c.msgs.push({ f: 'sys', tx: T('Аккаунт мошенника заблокирован. +опыт', 'Акаунт шахрая заблоковано. +досвід', 'Scammer banned. +XP'), t: G.s.t });
  c.st = 'closed';
  addXP(15); stat('scamsCaught');
  emit('chats');
}

// ---------------------------------------------------------------- closing the sale
// mode: 'ship' | 'meet'; packed: 0..1 quality of packing minigame
export function completeSale(c, mode = 'ship', packed = 0.5) {
  const s = G.s;
  const it = getItem(c.itemId);
  if (!it) { c.st = 'closed'; return false; }
  const l = s.listings.find((x) => x.itemId === it.id);
  const pf = PLATFORMS[l?.platform] || PLATFORMS.classifieds;
  const price = c.offer;
  const fee = price * pf.fee;
  const payout = price - fee;
  const disclose = l ? l.disclose : true;
  unlist(it.id);
  removeItem(it.id);
  c.st = 'deal';
  const city = s.player.city;
  // which hidden issues the buyer might discover
  const undisclosed = it.defects.filter((d) => !(d.known && disclose) && DEFECTS[d.c]?.vis !== 'visible');
  let claimP = 1;
  for (const d of undisclosed) claimP *= 1 - Math.min(0.85, (DEFECTS[d.c]?.sev || 0.1) * 2.6);
  claimP = 1 - claimP;
  let fakeClaim = 0;
  if (it.fake && !(disclose && it.fakeKnown)) fakeClaim = it.fake === 2 ? 0.45 : 0.85;
  if (it.lock && !disclose) claimP = Math.max(claimP, 0.9);
  const sale = { id: uid('S'), itemSnap: it, title: itemTitle(it), price, fee, payout, paid: it.paid || 0, buyer: c.npc, claimP, fakeClaim, chatId: c.id, packed };
  if (mode === 'meet' && (it.loc || city) === city) {
    finishSale(sale, true);
    c.msgs.push({ f: 'sys', tx: T(`Встретились лично. Получено ${fmt(payout)}.`, `Зустрілися особисто. Отримано ${fmt(payout)}.`, `Met in person. Received ${fmt(payout)}.`), t: s.t });
  } else {
    const from = it.loc || city;
    const eta = s.t + deliveryTime(from, city, isVehicle(it));
    s.deliveries.push({ id: uid('d'), kind: 'out', sale, from, to: city, start: s.t, eta, who: c.npc.name, title: sale.title, item: it });
    c.msgs.push({ f: 'sys', tx: T('Посылка отправлена. Деньги придут после получения.', 'Посилку відправлено. Гроші прийдуть після отримання.', 'Parcel shipped. You’ll be paid on delivery.'), t: s.t });
  }
  // close other chats for this item
  for (const o of s.chats) if (o !== c && o.kind === 'sell' && o.itemId === it.id && o.st === 'open') { o.st = 'closed'; o.msgs.push({ f: 'sys', tx: T('Товар продан другому покупателю', 'Товар продано іншому покупцю', 'Sold to someone else'), t: s.t }); }
  emit('chats'); emit('inv');
  return true;
}
export function finishSale(sale, instant = false) {
  const s = G.s;
  earn(sale.payout, 'sale', sale.title);
  const profit = sale.payout - sale.paid;
  addProfit(profit);
  stat('sold'); stat('revenue', sale.payout); stat('profit', profit);
  if (profit > (s.stats.bestFlip || 0)) s.stats.bestFlip = profit;
  addXP(10 + Math.max(0, profit) / 15);
  log('sold', `${sale.title} +${fmt(profit)}`);
  // after some time: review or claim
  s.pendingFeedback ||= [];
  const claim = chance(sale.fakeClaim) ? 'fake' : chance(sale.claimP) ? 'defect' : null;
  s.pendingFeedback.push({ sale, at: s.t + 40 + Math.floor(Math.random() * 120), claim });
  notify('bank', T('Оплата получена', 'Оплату отримано', 'Payment received'), `${sale.title}: ${fmt(sale.payout)} (${profit >= 0 ? '+' : ''}${fmt(profit)})`);
  emit('money');
}
export function feedbackTick() {
  const s = G.s;
  if (!s.pendingFeedback?.length) return;
  const due = s.pendingFeedback.filter((f) => f.at <= s.t);
  if (!due.length) return;
  s.pendingFeedback = s.pendingFeedback.filter((f) => f.at > s.t);
  for (const f of due) {
    const sale = f.sale;
    if (!f.claim) {
      const stars = sale.packed > 0.7 ? 5 : chance(0.7) ? 5 : 4;
      addReview(stars, L(PH.thanks));
      notify('market', T('Новый отзыв', 'Новий відгук', 'New review'), `${'★'.repeat(stars)} ${sale.buyer.name}`);
      continue;
    }
    const it = sale.itemSnap;
    const d = it.defects.find((x) => !x.known || true);
    const tx = f.claim === 'fake' ? L(PH.claimFake) : fill(L(PH.claim), { defect: d ? defectName(d.c).toLowerCase() : T('скрытый дефект', 'прихований дефект', 'hidden defect') });
    const c = { id: uid('c'), kind: 'claim', npc: sale.buyer, title: sale.title, sale, claim: f.claim, msgs: [{ f: 'them', tx, t: s.t }], st: 'claim', t: s.t, unread: 1 };
    s.chats.unshift(c);
    notify('market', T('Претензия покупателя', 'Претензія покупця', 'Buyer complaint'), tx, { go: ['market', 'chat', { id: c.id }] });
  }
  emit('chats');
}
// resolve: 'refund' | 'partial' | 'refuse'
export function resolveClaim(c, how) {
  const s = G.s;
  const sale = c.sale;
  if (how === 'refund') {
    charge(sale.payout, 'refund', sale.title);
    const it = sale.itemSnap; it.listed = false; it.paid = sale.paid;
    // item is shipped back
    s.deliveries.push({ id: uid('d'), kind: 'in', item: it, from: s.player.city, to: s.player.city, start: s.t, eta: s.t + 120, price: 0, who: c.npc.name, ret: true });
    addReview(3, T('Вернул деньги, но осадок остался.', 'Повернув гроші, але осад лишився.', 'Refunded, but not great.'));
    c.msgs.push({ f: 'me', tx: T('Хорошо, верну деньги — отправьте вещь обратно.', 'Добре, поверну гроші — надішліть річ назад.', 'OK, I’ll refund — send it back.'), t: s.t });
  } else if (how === 'partial') {
    const amt = sale.payout * (c.claim === 'fake' ? 0.5 : 0.25);
    charge(amt, 'refund', sale.title);
    addReview(c.claim === 'fake' ? 2 : 4, T('Продавец компенсировал часть стоимости.', 'Продавець компенсував частину вартості.', 'Seller compensated part of the price.'));
    c.msgs.push({ f: 'me', tx: T(`Предлагаю компенсацию ${fmt(amt)}.`, `Пропоную компенсацію ${fmt(amt)}.`, `I can compensate ${fmt(amt)}.`), t: s.t });
  } else {
    addReview(1, c.claim === 'fake' ? T('Продаёт подделки! Не связывайтесь.', 'Продає підробки! Не звʼязуйтеся.', 'Sells fakes! Avoid.') : T('Скрыл дефект и отказался вернуть деньги.', 'Приховав дефект і відмовився повернути гроші.', 'Hid a defect and refused a refund.'));
    c.msgs.push({ f: 'me', tx: T('Претензии не принимаются.', 'Претензії не приймаються.', 'No refunds.'), t: s.t });
    if (c.claim === 'fake' && chance(0.35)) {
      const fine = Math.max(50, sale.price * 0.5);
      charge(fine, 'fine', T('Штраф за продажу подделки', 'Штраф за продаж підробки', 'Fine for selling a fake'));
      notify('gov', T('Штраф', 'Штраф', 'Fine'), T(`Штраф за продажу контрафакта: ${fmt(fine)}`, `Штраф за продаж контрафакту: ${fmt(fine)}`, `Fine for counterfeit sale: ${fmt(fine)}`));
    }
  }
  c.st = 'closed';
  emit('chats');
}

// Instant sale to a pawn shop
export function pawnSell(itemId) {
  const it = getItem(itemId);
  if (!it) return 0;
  const v = itemValue(it, G.s.player.city, 'known') * 0.48 * (it.fake && !it.fakeKnown ? 0.15 : 1);
  unlist(itemId);
  removeItem(itemId);
  earn(v, 'sale', itemTitle(it));
  addProfit(v - (it.paid || 0));
  stat('sold'); stat('pawned');
  addXP(3);
  return v;
}
