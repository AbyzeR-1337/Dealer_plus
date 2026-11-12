// Shared app-level flows: buying a listing, putting an item up for sale, region-aware app names.
import { G, emit } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { countryOf, CITY } from '../data/world.js';
import { fmt, nicePrice } from '../core/money.js';
import { sheet, choose, askPrice, toast, confirmBox, rerender, resolveSheet, openApp, go } from '../ui/shell.js';
import { playMini } from '../mini/engine.js';
import { buyListing, pickupInfo, deliveryFee, deliveryTime, marketEstimate } from '../game/market.js';
import { listItem, PLATFORMS, pawnSell, glut } from '../game/sell.js';
import { startOwnAuction } from '../game/sources.js';
import { itemValue, itemTitle, isVehicle, knownDefects } from '../game/items.js';
import { getItem, canStore, stat, upLevel } from '../game/player.js';
import { LUXURY_CATS } from '../data/catalog.js';
import { sfx } from '../ui/sfx.js';

export const region = () => countryOf(G.s.player.city);
export const regApp = (k) => region().apps[k];
export const regName = (k) => regApp(k)[0];
export const regColors = (k) => [regApp(k)[1], regApp(k)[2]];
export const cityName = (id = G.s.player.city) => L(CITY[id].name);

export async function buyFlow(l, price = l.price) {
  const pi = pickupInfo(l);
  const fee = deliveryFee(l);
  const eta = deliveryTime(l.city, G.s.player.city, isVehicle(l.item));
  const v = await choose(T('Как забрать?', 'Як забрати?', 'How to get it?'), [
    { v: 'pickup', label: T(`Встреча: ${fmt(price + pi.fare)}`, `Зустріч: ${fmt(price + pi.fare)}`, `Meet up: ${fmt(price + pi.fare)}`), sub: T(`дорога ${fmt(pi.fare)}, −${pi.energy} энергии`, `дорога ${fmt(pi.fare)}, −${pi.energy} енергії`, `fare ${fmt(pi.fare)}, −${pi.energy} energy`), cls: '' },
    { v: 'delivery', label: T(`Доставка: ${fmt(price + fee)}`, `Доставка: ${fmt(price + fee)}`, `Delivery: ${fmt(price + fee)}`), sub: `≈ ${dur(eta)}`, cls: 'dark' },
  ], `${esc(itemTitle(l.item))}`);
  if (!v) return false;
  if (v === 'pickup' && G.s.energy < pi.energy) { toast(T('Нет сил идти — поешьте или поспите', 'Немає сил іти — поїжте або поспіть', 'Too tired — eat or sleep'), 'r'); return false; }
  const r = buyListing(l, v, price);
  if (!r.ok) { toast(r.msg, 'r'); sfx('err'); return false; }
  sfx('cash');
  toast(v === 'pickup' ? T('Куплено! Вещь на складе', 'Куплено! Річ на складі', 'Bought! It’s in storage') : T('Заказ оформлен — ждите доставку', 'Замовлення оформлено — чекайте доставку', 'Ordered — wait for delivery'), 'g');
  emit('inv');
  return true;
}

// Put an item up for sale: choose platform, price and disclosure
export async function sellFlow(itemId) {
  const it = getItem(itemId);
  if (!it) return;
  const s = G.s;
  const val = itemValue(it, s.player.city, 'known');
  const c = region();
  const lux = PLATFORMS.lux.cats.includes(it.cat);
  const opts = [
    { v: 'classifieds', label: `${c.apps.classifieds[0]} · ${T('без комиссии', 'без комісії', 'no fee')}`, sub: T('частные покупатели, торг', 'приватні покупці, торг', 'private buyers, haggling') },
    { v: 'marketplace', label: `${c.apps.marketplace[0]} · −12%`, sub: s.level < 3 ? T('с 3 уровня', 'з 3 рівня', 'level 3+') : T('больше покупателей', 'більше покупців', 'more buyers'), dis: s.level < 3 || s.tax.regime === 'none' && s.level >= 3 && false },
  ];
  if (lux) opts.push({ v: 'lux', label: `ReaLux · −20%`, sub: s.level < 4 ? T('с 4 уровня', 'з 4 рівня', 'level 4+') : T('коллекционеры платят больше', 'колекціонери платять більше', 'collectors pay more'), dis: s.level < 4 });
  opts.push({ v: 'auction', label: T('Аукцион · −8%', 'Аукціон · −8%', 'Auction · −8%'), sub: s.level < 3 ? T('с 3 уровня', 'з 3 рівня', 'level 3+') : T('ставки 4 минуты', 'ставки 4 хвилини', 'bids for 4 minutes'), dis: s.level < 3 });
  opts.push({ v: 'pawn', label: T(`Ломбард сразу: ${fmt(val * 0.48)}`, `Ломбард одразу: ${fmt(val * 0.48)}`, `Pawn now: ${fmt(val * 0.48)}`), sub: T('мгновенно, но дёшево', 'миттєво, але дешево', 'instant but cheap'), cls: 'dark' });
  const p = await choose(T('Где продать?', 'Де продати?', 'Where to sell?'), opts.map((o) => ({ ...o, cls: o.cls || 'dark' })), `${esc(itemTitle(it))} · ${T('оценка', 'оцінка', 'estimate')} ≈ ${fmt(val)}`);
  if (!p) return false;
  if (p === 'pawn') {
    if (!(await confirmBox(T('Сдать в ломбард?', 'Здати в ломбард?', 'Pawn it?'), `${esc(itemTitle(it))} → ${fmt(val * 0.48)}`))) return false;
    const got = pawnSell(itemId);
    toast(`+${fmt(got)}`, 'g'); sfx('cash');
    return true;
  }
  if (p === 'auction') {
    const start = await askPrice({ title: T('Стартовая цена', 'Стартова ціна', 'Starting price'), value: nicePrice(val * 0.5), min: 1, max: val * 2, hint: T('Покупатели будут повышать ставки. Комиссия 8%.', 'Покупці підвищуватимуть ставки. Комісія 8%.', 'Buyers will bid up. 8% fee.') });
    if (!start) return false;
    startOwnAuction(itemId, start, 240);
    toast(T('Лот выставлен', 'Лот виставлено', 'Lot listed'), 'g');
    stat('listed');
    return true;
  }
  // the city is flooded with this model: buyers come slower and pay less
  const gl = glut(it);
  const rec = nicePrice(val * gl.valK * (p === 'lux' ? 1.12 : 1.05));
  const glNote = gl.valK < 0.97 ? ` · ⚠️ ${T(`рынок завален: ${gl.same} таких объявлений${gl.flood ? `, недавно продано ${gl.flood}` : ''} — платят на ${Math.round((1 - gl.valK) * 100)}% меньше`, `ринок завалений: ${gl.same} таких оголошень${gl.flood ? `, нещодавно продано ${gl.flood}` : ''} — платять на ${Math.round((1 - gl.valK) * 100)}% менше`, `market flooded: ${gl.same} such ads${gl.flood ? `, ${gl.flood} sold lately` : ''} — buyers pay ${Math.round((1 - gl.valK) * 100)}% less`)}` : '';
  const hasKnown = knownDefects(it).length || it.lock || (it.fake && it.fakeKnown);
  const price = await askPrice({ title: T('Цена продажи', 'Ціна продажу', 'Asking price'), sub: T(`Рекомендуем ≈ ${fmt(rec)}`, `Рекомендуємо ≈ ${fmt(rec)}`, `Suggested ≈ ${fmt(rec)}`) + glNote, value: rec, min: 1, max: Math.max(rec * 3, 10), hint: T('Чем выше цена — тем реже пишут и сильнее торгуются.', 'Що вища ціна — то рідше пишуть і сильніше торгуються.', 'Higher price = fewer buyers and harder haggling.') });
  if (!price) return false;
  let disclose = true;
  if (hasKnown || it.defects.some((d) => !d.known)) {
    const d = await choose(T('Описание', 'Опис', 'Description'), [
      { v: 'yes', label: T('Честно указать все известные дефекты', 'Чесно вказати всі відомі дефекти', 'Disclose all known issues'), sub: T('меньше претензий', 'менше претензій', 'fewer complaints'), cls: '' },
      { v: 'no', label: T('Промолчать о дефектах', 'Промовчати про дефекти', 'Stay quiet about issues'), sub: T('дороже, но риск возвратов и плохих отзывов', 'дорожче, але ризик повернень', 'pricier, but risk of returns'), cls: 'dark' },
    ]);
    if (!d) return false;
    disclose = d === 'yes';
  }
  // optional: shoot photos and write the text yourself — a good listing draws more buyers
  const how = await choose(T('Оформление объявления', 'Оформлення оголошення', 'Listing setup'), [
    { v: 'pro', label: T('📸 Сфотографировать и написать текст', '📸 Сфотографувати й написати текст', '📸 Take photos and write the text'), sub: T('больше просмотров', 'більше переглядів', 'more views'), cls: '' },
    { v: 'quick', label: T('Быстро: одно фото с телефона', 'Швидко: одне фото з телефону', 'Quick: one phone snap'), cls: 'dark' },
  ]);
  if (!how) return false;
  let q = 0.35;
  if (how === 'pro') {
    const r1 = await playMini('photo', { title: T('Фото для объявления', 'Фото для оголошення', 'Listing photos'), item: it, pass: 0.6 });
    const r2 = r1.quit ? { score: 0 } : await playMini('compose', { title: T('Текст объявления', 'Текст оголошення', 'Listing text'), pass: 0.6, rounds: 1 });
    q = (r1.score || 0) * 0.65 + (r2.score || 0) * 0.35;
  }
  listItem(itemId, p, price, disclose);
  const lst = G.s.listings.find((x) => x.itemId === itemId);
  if (lst) lst.photoQ = +q.toFixed(2);
  sfx('ok');
  toast(T('Объявление опубликовано', 'Оголошення опубліковано', 'Listing published'), 'g');
  return true;
}

// Run an inspection minigame on an item (listing or own)
export async function inspectFlow(item, title) {
  const r = await playMini('inspect', { title: `${T('Осмотр', 'Огляд', 'Inspect')}: ${title}`, item, time: 30 });
  item.inspected = true;
  emit('inv'); rerender();
  return r;
}
export async function legitFlow(item, title) {
  const { legitVerdict } = await import('../game/workshop.js');
  const r = await playMini('legit', { title: `${T('Легит‑чек', 'Легіт‑чек', 'Legit check')}: ${title}`, item });
  if (r.quit) return null;
  const v = legitVerdict(item, r.score);
  const msg = v === 'fake' ? T('Вердикт: ПОДДЕЛКА', 'Вердикт: ПІДРОБКА', 'Verdict: FAKE') : v === 'orig' ? T('Вердикт: оригинал ✓', 'Вердикт: оригінал ✓', 'Verdict: authentic ✓') : T('Не удалось определить', 'Не вдалося визначити', 'Inconclusive');
  toast(msg, v === 'fake' ? 'r' : v === 'orig' ? 'g' : '');
  rerender();
  return v;
}
