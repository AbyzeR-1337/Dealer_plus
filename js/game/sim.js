// Simulation loop: 1 real second = 1 game minute while the app is open.
import { G, emit, save } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { chance } from '../core/util.js';
import { marketTick, feedFor } from './market.js';
import { sellTick, feedbackTick, finishSale } from './sell.js';
import { supportTick } from './support.js';
import { auctionTick, ownAuctionTick } from './sources.js';
import { workshopTick } from './workshop.js';
import { jobsTick } from './jobs.js';
import { travelTick } from './travel.js';
import { needsTick, dailyLife } from './life.js';
import { bankTick, dailyBank, stocksTick, numbersTick, initStocks } from './finance.js';
import { bizHourly, bizDaily } from './business.js';
import { storyTick, ensureDaily } from './quests.js';
import { dailyEconomy, initEconomy } from './economy.js';
import { dailyNews, seedNews } from './news.js';
import { addItem, notify, stat, log, snapshotWorth } from './player.js';
import { itemTitle } from './items.js';
import { onlineTick } from './online.js';

let timer = null;
let paused = false;

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
  timer = setInterval(() => { if (!paused && G.s && !document.hidden) tick(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else G.s && (G.s.lastReal = Date.now()); });
  window.addEventListener('pagehide', save);
}
export const setPaused = (v) => { paused = v; };
export const isPaused = () => paused;

function deliveriesTick() {
  const s = G.s;
  if (!s.deliveries.length) return;
  const due = s.deliveries.filter((d) => d.eta <= s.t);
  if (!due.length) return;
  s.deliveries = s.deliveries.filter((d) => d.eta > s.t);
  s.delivered ||= [];
  for (const d of due) {
    if (d.kind === 'in') {
      const it = d.item;
      it.loc = d.to || s.player.city;
      addItem(it, it.paid ?? d.price, d.ret ? 'return' : 'delivery');
      notify('delivery', T('Посылка доставлена', 'Посилку доставлено', 'Parcel delivered'), itemTitle(it), { go: ['inventory'] });
    } else if (d.kind === 'out') {
      if (chance(0.06 * (1 - (d.sale.packed ?? 0.5)))) d.sale.claimP = Math.max(d.sale.claimP, 0.75);
      finishSale(d.sale);
    }
    s.delivered.unshift({ ...d, item: undefined, img: d.item ? { ...d.item } : null, doneAt: s.t });
    if (s.delivered.length > 30) s.delivered.length = 30;
  }
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
  supportTick();
  deliveriesTick();
  workshopTick();
  auctionTick();
  ownAuctionTick();
  jobsTick();
  travelTick();
  bankTick();
  numbersTick();
  if (s.t % 10 === 0) needsTick();
  if (s.t % 60 === 0) { bizHourly(); stocksTick(); }
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
