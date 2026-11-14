// Inspections on the classifieds (Оликс / Авитон) as a bargaining tool.
// Buying: what you find at the inspection and the seller didn't put in the ad becomes your argument — point at
// each flaw and the price comes down (a stubborn seller gives less, and won't go below a floor).
// Selling: when a buyer comes to see your thing in person, show off its strong points — box, papers, battery
// health, a clean history — and push the agreed price up. Claiming what isn't true is a gamble: if the buyer
// checks and catches you, the price drops or they walk away.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { fmt, nicePrice } from '../core/money.js';
import { countryOf } from '../data/world.js';
import { DEFECTS } from '../data/catalog.js';
import { defectName } from './items.js';
import { openBuyChat } from './market.js';
import { stat, addXP } from './player.js';

// ---------------------------------------------------------------- buying: haggle with what you found
// codes = defects that turned up during this inspection (not in the ad)
export function bargainQuote(l, codes) {
  const sev = codes.reduce((a, c) => a + (DEFECTS[c]?.sev || 0.05), 0);
  const flex = clamp(1.25 - (l.minF || 0.85), 0.35, 0.75); // flexible sellers give more
  const pct = clamp(sev * (0.75 + flex * 0.6), 0.03, 0.5);
  return { pct, price: nicePrice(l.price * (1 - pct), countryOf(l.city).cur), sev };
}
export function bargainAfterInspect(l, codes) {
  const s = G.s, c = openBuyChat(l), q = bargainQuote(l, codes);
  const r = new RNG(`insb|${l.id}|${s.t}`);
  const names = codes.map((k) => defectName(k).toLowerCase()).join(', ');
  c.msgs.push({ f: 'me', tx: T(`Посмотрел вживую: ${names}. В объявлении этого не было. Отдадите за ${fmt(q.price)}?`, `Подивився наживо: ${names}. В оголошенні цього не було. Віддасте за ${fmt(q.price)}?`, `Saw it in person: ${names}. That wasn’t in the ad. Would you take ${fmt(q.price)}?`), t: s.t });
  // a stubborn seller meets you halfway; a sensible one agrees
  const stubborn = (l.minF || 0.85) > 0.92 && r.chance(0.6);
  const deal = stubborn ? nicePrice((l.price + q.price) / 2, countryOf(l.city).cur) : q.price;
  c.msgs.push({ f: 'them', tx: stubborn ? T(`Ну не настолько же. Давайте ${fmt(deal)} — и забирайте.`, `Ну не настільки ж. Давайте ${fmt(deal)} — і забирайте.`, `Not that much. ${fmt(deal)} and it’s yours.`) : r.pick([T(`Да, вижу… Ладно, ${fmt(deal)}.`, `Так, бачу… Гаразд, ${fmt(deal)}.`, `Yeah, I see… Fine, ${fmt(deal)}.`), T(`Честно, не замечал(а). Хорошо, отдам за ${fmt(deal)}.`, `Чесно, не помічав(ла). Добре, віддам за ${fmt(deal)}.`, `Honestly hadn’t noticed. Okay, ${fmt(deal)}.`)]), t: s.t });
  c.deal = deal; c.ask = Math.min(c.ask, deal); c.st = 'deal';
  stat('inspectBargains'); addXP(3);
  emit('chats'); emit('market');
  return { deal, from: l.price };
}
// nothing new found — you can still try "a little off for buying today"
export function quickDiscount(l) {
  const s = G.s, c = openBuyChat(l), r = new RNG(`insq|${l.id}|${s.t}`);
  c.msgs.push({ f: 'me', tx: T('Всё как в объявлении. Скинете немного, если заберу прямо сейчас?', 'Усе як в оголошенні. Скинете трохи, якщо заберу просто зараз?', 'All as described. A little off if I take it right now?'), t: s.t });
  if ((l.minF || 0.85) < 0.95 && r.chance(0.6)) {
    const deal = nicePrice(l.price * r.float(0.94, 0.97), countryOf(l.city).cur);
    c.msgs.push({ f: 'them', tx: T(`Ладно, ${fmt(deal)}.`, `Гаразд, ${fmt(deal)}.`, `Okay, ${fmt(deal)}.`), t: s.t });
    c.deal = deal; c.st = 'deal';
    emit('chats'); emit('market');
    return { ok: true, deal };
  }
  c.msgs.push({ f: 'them', tx: T('Нет, цена и так нормальная.', 'Ні, ціна й так нормальна.', 'No, the price is fair as it is.'), t: s.t });
  emit('chats');
  return { ok: false };
}

// ---------------------------------------------------------------- selling: the viewing
const OPENED = ['nonorig', 'battery', 'faceid'];
// what you can show; `ok` = it's true, `lie` = you can claim it but it's false (the buyer may check)
export function showPoints(it) {
  const hidden = (codes) => it.defects.some((d) => codes.includes(d.c));
  const knownBad = (codes) => it.defects.some((d) => codes.includes(d.c) && d.known);
  const pts = [
    { k: 'box', ic: '📦', n: T('Показать коробку и комплект', 'Показати коробку й комплект', 'Show the box and accessories'), up: 0.02, ok: !!it.box },
    { k: 'docs', ic: '🧾', n: T('Показать чек и документы', 'Показати чек і документи', 'Show the receipt and papers'), up: 0.025, ok: !!it.docs },
    { k: 'clean', ic: '🧽', n: T('Вещь вымыта и выглядит свежо', 'Річ вимита й виглядає свіжо', 'Cleaned, looks fresh'), up: 0.012, ok: !!it.cleaned || it.cond >= 92 },
    { k: 'acc', ic: '🛡', n: T('Стекло и чехол — в подарок', 'Скло й чохол — у подарунок', 'Glass and case thrown in'), up: 0.012, ok: !!(it.acc?.glass || it.acc?.case) },
  ];
  if (['phones', 'electronics', 'consoles'].includes(it.cat)) {
    // you may not know the truth here: a hidden flaw makes the claim false without you knowing
    pts.push({ k: 'battery', ic: '🔋', n: T('Показать здоровье батареи', 'Показати здоровʼя батареї', 'Show the battery health'), up: 0.02, ok: !hidden(['battery']), claim: true, warn: knownBad(['battery']), codes: ['battery'] });
    pts.push({ k: 'sealed', ic: '🔩', n: T('«Ни разу не вскрывался»', '«Жодного разу не розкривався»', '“Never been opened”'), up: 0.025, ok: !hidden(OPENED), claim: true, warn: knownBad(OPENED), codes: OPENED });
  }
  pts.push({ k: 'test', ic: '🧪', n: T('Дать всё проверить на месте', 'Дати все перевірити на місці', 'Let them test everything'), up: 0.015, ok: true, risky: true });
  return pts.map((p) => ({ ...p, can: p.ok || !!p.claim }));
}
// chosen: keys; pitch: 0..1 from the persuasion mini‑game (or null)
export function applyShow(c, it, chosen, pitch = null) {
  const s = G.s, r = new RNG(`show|${c.id}|${s.t}`);
  const pts = showPoints(it).filter((p) => chosen.includes(p.k) && p.can);
  let up = 0; const lines = []; let caught = null;
  for (const p of pts) {
    if (p.ok) { up += p.up; lines.push(`✔ ${p.n}`); continue; }
    // a false claim: the buyer checks it half the time
    if (r.chance(0.5)) { caught = p; break; }
    up += p.up; lines.push(`✔ ${p.n}`);
  }
  // letting them test everything: confident sellers get paid for it, but hidden flaws come out
  let found = [];
  if (!caught && chosen.includes('test')) found = it.defects.filter((d) => !d.known && DEFECTS[d.c]?.vis !== 'visible' && r.chance(0.55));
  if (pitch != null) up += pitch >= 0.95 ? 0.03 : pitch >= 0.6 ? 0.015 : -0.01;
  const cur = countryOf(s.player.city).cur;
  const before = c.offer;
  if (caught) {
    const leave = r.chance(0.4);
    c.msgs.push({ f: 'them', tx: leave ? T(`Вы сказали «${caught.n.replace(/[«»"“”]/g, '')}», а это неправда. Нет, спасибо, не возьму.`, `Ви сказали «${caught.n.replace(/[«»"“”]/g, '')}», а це неправда. Ні, дякую, не візьму.`, `You said “${caught.n.replace(/[«»"“”]/g, '')}”, but it isn’t true. No thanks, I’ll pass.`) : T('Проверил(а) — вы приукрасили. Беру, но минус 15%.', 'Перевірив(ла) — ви прикрасили. Беру, але мінус 15%.', 'Checked — you oversold it. I’ll take it, minus 15%.'), t: s.t });
    for (const code of caught.codes || []) { const d = it.defects.find((x) => x.c === code); if (d) d.known = true; }
    if (leave) { c.st = 'closed'; emit('chats'); return { ok: false, left: true }; }
    c.offer = nicePrice(c.offer * 0.85, cur);
    emit('chats');
    return { ok: true, caught: true, before, after: c.offer };
  }
  let down = 0;
  for (const d of found) { d.known = true; down += (DEFECTS[d.c]?.sev || 0.05) * 0.8; }
  up = clamp(up, -0.02, 0.14);
  c.offer = nicePrice(Math.max(1, c.offer * (1 + up - down)), cur);
  c.maxPay = Math.max(c.maxPay || 0, c.offer);
  c.msgs.push({ f: 'them', tx: found.length ? T(`Нашёл(ла) при проверке: ${found.map((d) => defectName(d.c).toLowerCase()).join(', ')}. Тогда ${fmt(c.offer)}.`, `Знайшов(ла) під час перевірки: ${found.map((d) => defectName(d.c).toLowerCase()).join(', ')}. Тоді ${fmt(c.offer)}.`, `Found while testing: ${found.map((d) => defectName(d.c).toLowerCase()).join(', ')}. Then ${fmt(c.offer)}.`) : up > 0.005 ? T(`Всё отлично, видно, что вещь берегли. Дам ${fmt(c.offer)}.`, `Усе чудово, видно, що річ берегли. Дам ${fmt(c.offer)}.`, `All great, clearly well kept. I’ll give ${fmt(c.offer)}.`) : T(`Хорошо, как договаривались — ${fmt(c.offer)}.`, `Добре, як домовлялися — ${fmt(c.offer)}.`, `Fine, as agreed — ${fmt(c.offer)}.`), t: s.t });
  stat('viewings'); if (up > 0.02) addXP(4);
  emit('chats');
  return { ok: true, before, after: c.offer, lines, found: found.map((d) => d.c) };
}
