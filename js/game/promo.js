// Promo codes (Settings → Promo code). Each code works once per save; the bonus is paid in the currency of
// the country you play in ("Штуцер" = 30 000 ₽ in Russia, 30 000 ₴ in Ukraine, $30,000 in the US…).
import { G, emit, save } from '../core/state.js';
import { T } from '../core/i18n.js';
import { fromLoc, fmt } from '../core/money.js';
import { countryOf } from '../data/world.js';
import { earn, notify } from './player.js';

const CODES = {
  штуцер: { amount: 30000, name: 'Штуцер' },
  серьожабосс: { amount: 500000, name: 'СерьожаБОСС' },
};
// how the player may type it: any case, spaces, ё/е, the "серёжа"/"сережа" spellings
const ALIAS = { серёжабосс: 'серьожабосс', сережабосс: 'серьожабосс', серьёжабосс: 'серьожабосс' };
const norm = (code) => { const k = String(code || '').toLowerCase().replace(/[\s_\-.,!«»"']/g, ''); return ALIAS[k] || k; };

export const usedPromos = () => (G.s.promos ||= []);
export function redeem(code) {
  const k = norm(code);
  if (!k) return { ok: false, msg: T('Введите промокод', 'Введіть промокод', 'Enter a code') };
  const c = CODES[k];
  if (!c) return { ok: false, msg: T('Такого промокода нет', 'Такого промокоду немає', 'No such promo code') };
  if (usedPromos().includes(k)) return { ok: false, msg: T('Этот промокод уже активирован', 'Цей промокод уже активовано', 'This code was already used') };
  const usd = fromLoc(c.amount, countryOf(G.s.player.city).cur);
  usedPromos().push(k);
  earn(usd, 'bonus', T(`Промокод «${c.name}»`, `Промокод «${c.name}»`, `Promo code “${c.name}”`));
  notify('bank', T('Промокод активирован', 'Промокод активовано', 'Promo code redeemed'), `«${c.name}»: +${fmt(usd)}`, { silent: true });
  emit('bank'); save();
  return { ok: true, usd, name: c.name };
}
