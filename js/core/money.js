// Currency conversion & formatting. Internally all money is USD.
import { G } from './state.js';
import { CURRENCIES, countryOf } from '../data/world.js';
import { lang } from './i18n.js';

export function rate(code) {
  const base = CURRENCIES[code]?.rate ?? 1;
  const drift = G.s?.econ?.fx?.[code] ?? 1;
  return base * drift;
}
export function curCode() {
  const s = G.s;
  if (!s) return 'USD';
  const pref = s.settings?.cur || 'auto';
  if (pref !== 'auto' && CURRENCIES[pref]) return pref;
  return countryOf(s.player.city).cur;
}
export const localCur = (cityId) => countryOf(cityId || G.s?.player.city).cur;
export const toLoc = (usd, code = curCode()) => usd * rate(code);
export const fromLoc = (v, code = curCode()) => v / rate(code);

function group(n) {
  const sep = lang() === 'en' ? ',' : ' ';
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}
export function fmtNum(v, dec = 0) {
  const neg = v < 0; v = Math.abs(v);
  let s;
  if (dec > 0) { const [a, b] = v.toFixed(dec).split('.'); s = group(a) + (lang() === 'en' ? '.' : ',') + b; }
  else s = group(Math.round(v));
  return (neg ? '−' : '') + s;
}
// Format a USD amount in the display currency
export function fmt(usd, o = {}) {
  const code = o.code || curCode();
  const c = CURRENCIES[code] || CURRENCIES.USD;
  let v = usd * rate(code);
  const abs = Math.abs(v);
  let num;
  if (o.short && abs >= 1e6) num = fmtNum(v / 1e6, abs >= 1e8 ? 0 : 1) + (lang() === 'en' ? 'M' : lang() === 'uk' ? ' млн' : ' млн');
  else if (o.short && abs >= 1e4) num = fmtNum(v / 1e3, 0) + (lang() === 'en' ? 'K' : ' тис'.replace('тис', lang() === 'uk' ? 'тис' : 'тыс'));
  else num = fmtNum(v, abs < 10 && abs > 0 && c.rate < 5 ? 2 : 0);
  let sign = '';
  if (o.sign) { if (v > 0.004) sign = '+'; }
  if (num.startsWith('−')) { sign = '−'; num = num.slice(1); }
  return c.before ? `${sign}${c.sym}${num}` : `${sign}${num} ${c.sym}`;
}
export const fmtSigned = (usd, o = {}) => fmt(usd, { ...o, sign: true });
export const symOf = (code = curCode()) => CURRENCIES[code]?.sym || '$';

// A “nice” price in local currency (like real listings: 21 000 ₽, 4 500 ₴, $350), returned in USD
export function nicePrice(usd, code = curCode()) {
  const r = rate(code);
  let v = usd * r;
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1));
  let step = mag;
  if (v / mag > 50) step = mag * 5;
  if (v < 20) step = 1;
  v = Math.max(step, Math.round(v / step) * step);
  return v / r;
}
// Step for price sliders in the current currency (USD)
export function priceStep(usd, code = curCode()) {
  const v = usd * rate(code);
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 2));
  return mag / rate(code);
}
