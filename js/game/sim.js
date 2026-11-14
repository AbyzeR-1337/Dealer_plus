// Simulation loop: 1 real second = 1 game minute. When the game was closed, in the background or the phone
// was locked, the missed time is caught up on return (up to CATCHUP_MAX real seconds), so deliveries arrive,
// rent is paid, tenants pay, timers run out — as if the game had kept going.
import { G, emit, save } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { chance } from '../core/util.js';
import { marketTick, feedFor } from './market.js';
import { sellTick, feedbackTick, finishSale } from './sell.js';
import { supportTick } from './support.js';
import { phoneTick } from './phone.js';
import { auctionTick, ownAuctionTick } from './sources.js';
import { workshopTick } from './workshop.js';
import { jobsTick } from './jobs.js';
import { travelTick } from './travel.js';
import { needsTick, dailyLife, taxRemindTick } from './life.js';
import { bankTick, dailyBank, stocksTick, numbersTick, initStocks } from './finance.js';
import { pcTick, mineHourly } from './pc.js';
import { accTick } from './phoneacc.js';
import { hotTick } from './hot.js';
import { pcvTick } from './pcvirus.js';
import { jailTick } from './crime.js';
import { rentTick } from './housing.js';
import { reChatTick } from './realty_chat.js';
import { dv } from './difficulty.js';
import { tgTick } from './tg.js';
import { ymTick, supTick, cargoArrived } from './shops2.js';
import { bizHourly, bizDaily } from './business.js';
import { storyTick, ensureDaily } from './quests.js';
import { dailyEconomy, initEconomy } from './economy.js';
import { dailyNews, seedNews } from './news.js';
import { addItem, notify, stat, log, snapshotWorth } from './player.js';
import { itemTitle } from './items.js';
import { onlineTick } from './online.js';

let timer = null;
let paused = false;
let catching = false, lastBeat = Date.now();
export const CATCHUP_MAX = 12 * 3600; // real seconds
export const catchingUp = () => catching;

export function initWorld() {
  initEconomy();
  initStocks();
  seedNews();
  ensureDaily();
  feedFor(G.s.player.city);
  if (!G.s.hist.length) snapshotWorth();
}
export function startSim() {
  if (timer) return;
  let n = 0;
  timer = setInterval(() => {
    const now = Date.now(), gap = (now - lastBeat) / 1000; lastBeat = now;
    if (paused || !G.s || document.hidden || catching) return;
    // the page was frozen (phone locked, app switched) without a visibility event: catch up the gap
    if (gap > 8) { emit('away', gap - 1); return; }
    tick(); if (dv().fast && ++n % 4 === 0) tick();
  }, 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { save(); return; }
    lastBeat = Date.now();
    const gap = G.s?.lastReal ? (Date.now() - G.s.lastReal) / 1000 : 0;
    if (G.s && !paused && gap > 8) emit('away', gap);
  });
  window.addEventListener('pagehide', save);
}
export const setPaused = (v) => { paused = v; };
// run the missed game minutes in chunks (the UI shows progress), then report what happened meanwhile
export async function catchUp(sec, onProgress) {
  const s = G.s;
  if (!s || catching || paused) return null;
  const real = Math.min(sec, CATCHUP_MAX);
  const mins = Math.floor(real * (dv().fast ? 1.25 : 1));
  if (mins < 5) return null;
  catching = true; G.catchup = true;
  const before = { money: s.money, t: s.t, ids: new Set((s.inbox || []).map((m) => m.id)), sold: s.stats.sold || 0, profit: s.stats.profit || 0, inv: s.inv.length };
  try {
    let done = 0;
    while (done < mins) {
      const n = Math.min(480, mins - done);
      for (let i = 0; i < n; i++) tick(true);
      done += n;
      onProgress?.(done / mins);
      await new Promise((r) => setTimeout(r, 0));
    }
  } finally { catching = false; G.catchup = false; lastBeat = Date.now(); }
  for (const ev of ['tick', 'market', 'inv', 'badges', 'deliveries', 'chats', 'house', 'sup', 'needs']) emit(ev);
  save();
  return { sec, real, mins, capped: sec > CATCHUP_MAX, money: s.money - before.money, sold: (s.stats.sold || 0) - before.sold, profit: (s.stats.profit || 0) - before.profit, news: (s.inbox || []).filter((m) => !before.ids.has(m.id)) };
}
export const isPaused = () => paused;

function deliveriesTick() {
  const s = G.s;
  if (!s.deliveries.length) return;
  const due = s.deliveries.filter((d) => d.eta <= s.t);
  if (!due.length) return;
  s.deliveries = s.deliveries.filter((d) => d.eta > s.t);
  s.delivered ||= [];
  const batches = new Set();
  for (const d of due) {
    if (d.kind === 'in') {
      const it = d.item;
      it.loc = d.to || s.player.city;
      addItem(it, it.paid ?? d.price, d.ret ? 'return' : 'delivery');
      if (d.batch) batches.add(d.batch);
      else notify('delivery', T('Посылка доставлена', 'Посилку доставлено', 'Parcel delivered'), itemTitle(it), { go: ['inventory'] });
    } else if (d.kind === 'out') {
      if (chance(0.06 * (1 - (d.sale.packed ?? 0.5)))) d.sale.claimP = Math.max(d.sale.claimP, 0.75);
      finishSale(d.sale);
    }
    s.delivered.unshift({ ...d, item: undefined, img: d.item ? { ...d.item } : null, doneAt: s.t });
    if (s.delivered.length > 30) s.delivered.length = 30;
  }
  for (const b of batches) cargoArrived(b);
  emit('deliveries');
}

export function tick(fast = false) {
  const s = G.s;
  if (!s) return;
  const prevDay = Math.floor(s.t / 1440);
  s.t++;
  if (!fast) s.playSec++;
  marketTick();
  sellTick();
  feedbackTick();
  pcTick();
  accTick();
  hotTick();
  pcvTick();
  taxRemindTick();
  jailTick();
  rentTick();
  reChatTick();
  tgTick();
  ymTick();
  supTick();
  supportTick();
  phoneTick();
  deliveriesTick();
  workshopTick();
  auctionTick();
  ownAuctionTick();
  jobsTick();
  travelTick();
  bankTick();
  numbersTick();
  if (s.t % 10 === 0 && !catching) needsTick();
  if (s.t % 60 === 0) { bizHourly(); stocksTick(); mineHourly(); }
  if (s.t % 15 === 0) storyTick();
  const d = Math.floor(s.t / 1440);
  if (d !== prevDay) dailyRollover();
  if (!fast) {
    emit('tick');
    if (s.t % 10 === 0) save();
    onlineTick();
  }
}
export function advance(minutes) {
  for (let i = 0; i < minutes; i++) tick(true);
  emit('tick'); emit('market'); emit('inv');
  save();
}
function dailyRollover() {
  const s = G.s;
  const events = dailyEconomy();
  dailyNews(events);
  dailyLife();
  dailyBank();
  const b = bizDaily();
  ensureDaily();
  stat('days');
  if (events.length) notify('news', T('Новости рынка', 'Новини ринку', 'Market news'), T(`${events.length} новых событий`, `${events.length} нових подій`, `${events.length} new events`), { silent: true });
  emit('day', { b });
}
