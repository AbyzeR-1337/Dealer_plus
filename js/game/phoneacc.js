// Glass and cases from the hardware store (Розетко in Ukraine, ДНК in Russia…). You buy them for one exact phone
// model; the courier brings them in under an hour; then you stick the glass (a small mini‑game: wipe the dust,
// lay it straight — a crooked one gets bubbles) or snap the case on in the phone's page. A fitted glass/case lifts
// the price: worth it on a pricey phone, a waste of money on a cheap one.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid, clamp } from '../core/util.js';
import { MODEL, BY_CAT, modelValue } from '../data/catalog.js';
import { PHONE_ACC } from '../data/phoneacc.js';
import { spend, notify, stat, addXP, getItem } from './player.js';
import { nicePrice } from '../core/money.js';
import { countryOf } from '../data/world.js';

export function accState() { const s = G.s; s.pacc ||= { stock: {}, orders: [] }; return s.pacc; }
export const accKey = (m, kind, tier) => `${m}|${kind}|${tier}`;
export const accStock = (m, kind, tier) => accState().stock[accKey(m, kind, tier)] || 0;
export const stockFor = (m, kind) => Object.keys(PHONE_ACC[kind]).filter((t) => PHONE_ACC[kind][t].price).map((t) => ({ t, n: accStock(m, kind, t) })).filter((x) => x.n > 0);
export function accPrice(m, kind, tier) {
  const p = PHONE_ACC[kind]?.[tier]?.price; const mm = MODEL[m];
  if (!p || !mm) return 0;
  const v = modelValue(mm);
  // a little cheaper on old models (last season's stock), rounded like a shop price
  const old = mm.year < 2020 ? 0.85 : 1;
  return nicePrice(clamp(p[0] + v * p[1], p[0], p[2]) * old, countryOf(G.s.player.city).cur);
}
// what the store has for a model (rating/reviews are cosmetic and stable per model)
export function accOffers(m) {
  const r = new RNG(`acc|${m}`);
  const out = [];
  for (const kind of ['glass', 'case']) for (const [tier, d] of Object.entries(PHONE_ACC[kind])) {
    if (!d.price) continue;
    out.push({ m, kind, tier, n: d.n, price: accPrice(m, kind, tier), mult: d.mult, rating: +r.float(4.2, 4.9).toFixed(1), reviews: r.int(12, 2400), color: r.pick(['#1c1d21', '#2b3a55', '#5b2a86', '#b3121f', '#3f6b4f', '#d8dadf']) });
  }
  return out;
}
export function buyAcc(m, kind, tier, qty = 1) {
  const s = G.s, price = accPrice(m, kind, tier) * qty;
  if (!price) return { ok: false };
  const name = `${L(PHONE_ACC[kind][tier].n)} · ${MODEL[m].brand} ${MODEL[m].name}`;
  if (!spend(price, 'buy', name)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  accState().orders.push({ id: uid('pa'), m, kind, tier, qty, eta: s.t + new RNG(uid('pae')).int(25, 70) });
  stat('accBought');
  emit('pacc');
  return { ok: true };
}
export function accTick() {
  const s = G.s, st = s.pacc;
  if (!st?.orders?.length) return;
  const due = st.orders.filter((o) => o.eta <= s.t);
  if (!due.length) return;
  st.orders = st.orders.filter((o) => o.eta > s.t);
  for (const o of due) {
    const k = accKey(o.m, o.kind, o.tier);
    st.stock[k] = (st.stock[k] || 0) + o.qty;
  }
  const first = due[0];
  notify('hw', T('Курьер привёз заказ', 'Курʼєр привіз замовлення', 'Your order arrived'), due.length > 1 ? T(`Аксессуаров: ${due.length}`, `Аксесуарів: ${due.length}`, `${due.length} accessories`) : `${L(PHONE_ACC[first.kind][first.tier].n)} · ${MODEL[first.m].brand} ${MODEL[first.m].name}`, { silent: true });
  emit('pacc'); emit('inv');
}
// fit a glass/case from stock onto a phone; for glass `quality` (0..1) comes from the mini‑game
export function fitAcc(itemId, kind, tier, quality = 1) {
  const it = getItem(itemId);
  if (!it || it.cat !== 'phones') return { ok: false };
  if (accStock(it.m, kind, tier) <= 0) return { ok: false, msg: T('Нет такого аксессуара для этой модели', 'Немає такого аксесуара для цієї моделі', 'No such accessory for this model') };
  accState().stock[accKey(it.m, kind, tier)]--;
  it.acc ||= {};
  let res = tier;
  if (kind === 'glass') {
    if (quality < 0.3) { res = 'ruined'; delete it.acc.glass; emit('inv'); return { ok: true, res }; }
    if (quality < 0.6) res = 'bubble';
  }
  it.acc[kind] = res;
  stat('accFitted'); addXP(2);
  emit('inv');
  return { ok: true, res };
}
export function removeAcc(itemId, kind) {
  const it = getItem(itemId);
  if (!it?.acc?.[kind]) return false;
  // a case comes off and goes back to the stock; a glass is single‑use
  if (kind === 'case') { const k = accKey(it.m, 'case', it.acc.case); accState().stock[k] = (accState().stock[k] || 0) + 1; }
  delete it.acc[kind];
  emit('inv');
  return true;
}
// phone models to offer in the store: your phones first, then by brand
export const myPhoneModels = () => [...new Set(G.s.inv.filter((it) => it.cat === 'phones').map((it) => it.m))].filter((m) => MODEL[m]);
export const phoneBrands = () => [...new Set((BY_CAT.phones || []).map((m) => m.brand))];
export const brandModels = (b) => (BY_CAT.phones || []).filter((m) => m.brand === b).slice().sort((a, b2) => b2.year - a.year);
