// Energy as a cost. Normally actions burn energy (and you eat and sleep to get it back). With "Food & energy"
// switched off in Settings there is no hunger and no tiredness: whatever cost energy takes game time instead
// (6 game minutes per point — a shift ≈ 1.5 h, a meet‑up ≈ 40 min). The clock is moved forward by main.js.
import { G, emit } from '../core/state.js';
import { clamp } from '../core/util.js';

export const noNeeds = () => !!G.s?.settings?.noNeeds;
export const MIN_PER_ENERGY = 6;
export const hasEnergy = (n) => noNeeds() || (G.s?.energy ?? 0) >= n;
let queued = 0;
export function useEnergy(n) {
  const s = G.s;
  if (!noNeeds()) { s.energy = clamp(s.energy - n, 0, 100); return 0; }
  const m = Math.round(n * MIN_PER_ENERGY);
  if (!queued) setTimeout(() => { const q = queued; queued = 0; if (q) emit('timeSpent', q); }, 0);
  queued += m;
  return m;
}
