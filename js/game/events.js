// Random life events with quick-time reactions (triggered every few game hours).
import { G, emit } from '../core/state.js';
import { T } from '../core/i18n.js';
import { rint, chance, pickR } from '../core/util.js';
import { RNG } from '../core/rng.js';
import { makeItem, itemValue } from './items.js';
import { maxValForLevel } from './market.js';
import { nicePrice } from '../core/money.js';
import { countryOf } from '../data/world.js';

const POOL = [
  { id: 'pickpocket', w: 3, ok: () => G.s.money > 15 },
  { id: 'hotdeal', w: 3, ok: () => G.s.money > 20 },
  { id: 'wallet', w: 2, ok: () => true },
  { id: 'parcel', w: 2, ok: () => true },
  { id: 'blogger', w: 1.5, ok: () => G.s.listings.length > 0 },
  { id: 'rain', w: 1, ok: () => G.s.inv.length > 0 && G.s.house.type === 'none' },
];
export function eventsTick(blocked) {
  const s = G.s;
  if (!s.nextEvent) s.nextEvent = s.t + rint(150, 300);
  if (s.t < s.nextEvent || blocked || s.travel || s.level < 1) return;
  s.nextEvent = s.t + rint(180, 420);
  const pool = POOL.filter((e) => e.ok());
  if (!pool.length) return;
  const rng = new RNG(`${s.id}:rev:${s.t}`);
  const ev = rng.weighted(pool, (e) => e.w);
  const data = { id: ev.id };
  const wage = countryOf(s.player.city).wage;
  if (ev.id === 'pickpocket') data.loss = Math.min(s.money * 0.12, 80 * wage + s.level * 20);
  if (ev.id === 'wallet') data.cash = rint(8, 40) * wage;
  if (ev.id === 'parcel') data.tip = rint(4, 12) * wage;
  if (ev.id === 'hotdeal') {
    const it = makeItem(rng, { city: s.player.city, quality: 'good', maxVal: Math.min(maxValForLevel(), Math.max(60, s.money * 1.4)), fakeMult: 0.6, lockRate: 0 });
    for (const d of it.defects) d.known = true;
    const v = itemValue(it, s.player.city, 'known');
    data.item = it; data.value = v; data.price = nicePrice(v * rng.float(0.5, 0.72), countryOf(s.player.city).cur);
  }
  emit('lifeEvent', data);
}
