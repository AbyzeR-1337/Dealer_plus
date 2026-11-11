// Online layer (Supabase RPC over plain fetch). Leaderboards + friends. No money/item transfers exist,
// so friends or alt accounts cannot be used to farm money. Score growth is validated server-side.
import { G, emit, save } from '../core/state.js';
import { T } from '../core/i18n.js';
import { netWorth } from './player.js';
import { countryOf } from '../data/world.js';

const cfg = () => (typeof window !== 'undefined' && window.GR_CONFIG) || {};
export const onlineEnabled = () => !!(cfg().supabaseUrl && cfg().supabaseKey);
export const isRegistered = () => !!G.s?.online?.id;

function deviceId() {
  try {
    let d = localStorage.getItem('gr_device');
    if (!d) { d = 'dv_' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('gr_device', d); }
    return d;
  } catch { return 'dv_anon'; }
}
async function rpc(fn, body) {
  const { supabaseUrl: url, supabaseKey: key } = cfg();
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) {
    const msg = (data && (data.message || data.hint)) || text || r.statusText;
    throw new Error(msg);
  }
  return data;
}
export function errText(e) {
  const m = String(e?.message || e);
  if (m.includes('bad_nick')) return T('Ник: 3–20 символов', 'Нік: 3–20 символів', 'Nickname: 3–20 characters');
  if (m.includes('duplicate') || m.includes('unique')) return T('Ник уже занят', 'Нік уже зайнятий', 'Nickname taken');
  if (m.includes('too_many')) return T('Слишком много аккаунтов с этой сети', 'Забагато акаунтів з цієї мережі', 'Too many accounts from this network');
  if (m.includes('not_found')) return T('Код не найден', 'Код не знайдено', 'Code not found');
  if (m.includes('self')) return T('Это ваш код', 'Це ваш код', 'That’s your own code');
  if (m.includes('Failed to fetch')) return T('Нет соединения', 'Немає зʼєднання', 'No connection');
  return m.slice(0, 120);
}
export async function register(nick) {
  const res = await rpc('gr_register', { p_nick: nick, p_region: countryOf(G.s.player.city).id, p_device: deviceId() });
  const r = Array.isArray(res) ? res[0] : res;
  G.s.online = { ...G.s.online, id: r.id, secret: r.secret, code: r.code, nick, last: 0 };
  save();
  await submit(true).catch(() => {});
  emit('online');
  return r;
}
let lastSubmitTry = 0;
export async function submit(force = false) {
  const s = G.s;
  if (!onlineEnabled() || !s.online.id) return null;
  const now = Date.now();
  if (!force && now - lastSubmitTry < 90000) return null;
  lastSubmitTry = now;
  const res = await rpc('gr_submit', {
    p_id: s.online.id, p_secret: s.online.secret, p_worth: Math.max(0, Math.round(netWorth())), p_level: s.level,
    p_playtime: s.playSec, p_region: countryOf(s.player.city).id,
    p_stats: { sold: s.stats.sold || 0, profit: Math.round(s.stats.profit || 0), shops: s.biz.shops.length, rep: s.rep.n ? +(s.rep.sum / s.rep.n).toFixed(2) : 0 },
  });
  const r = Array.isArray(res) ? res[0] : res;
  s.online.last = now; s.online.accepted = r?.accepted;
  emit('online');
  return r;
}
export function onlineTick() {
  if (!onlineEnabled() || !G.s?.online?.id) return;
  if (G.s.t % 120 === 0) submit().catch(() => {});
}
export async function leaderboard(scope) {
  const s = G.s;
  if (!onlineEnabled()) return offlineBoard(scope);
  const rows = await rpc('gr_leaderboard', { p_scope: scope, p_id: s.online.id || null, p_region: countryOf(s.player.city).id });
  return (rows || []).map((r) => ({ nick: r.nick, worth: +r.worth, level: r.level, region: r.region, me: r.is_me }));
}
export function offlineBoard() {
  const s = G.s;
  const rows = s.rivals.map((r) => ({ nick: r.name, worth: r.worth, level: Math.max(1, Math.round(Math.log2(r.worth / 50))), region: '—', me: false }));
  rows.push({ nick: s.player.name, worth: netWorth(), level: s.level, region: countryOf(s.player.city).id, me: true });
  return rows.sort((a, b) => b.worth - a.worth);
}
export async function friends() {
  const s = G.s;
  if (!onlineEnabled() || !s.online.id) return { friends: [], incoming: [], outgoing: [] };
  const r = await rpc('gr_friends', { p_id: s.online.id, p_secret: s.online.secret });
  return r || { friends: [], incoming: [], outgoing: [] };
}
export const friendRequest = (code) => rpc('gr_friend_request', { p_id: G.s.online.id, p_secret: G.s.online.secret, p_code: code.trim().toUpperCase() });
export const friendRespond = (from, accept) => rpc('gr_friend_respond', { p_id: G.s.online.id, p_secret: G.s.online.secret, p_from: from, p_accept: accept });
export const friendRemove = (other) => rpc('gr_friend_remove', { p_id: G.s.online.id, p_secret: G.s.online.secret, p_other: other });
export const nudge = (to, emoji) => rpc('gr_nudge', { p_id: G.s.online.id, p_secret: G.s.online.secret, p_to: to, p_emoji: emoji });
export const inbox = () => rpc('gr_inbox', { p_id: G.s.online.id, p_secret: G.s.online.secret });
