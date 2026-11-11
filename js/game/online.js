// Online layer (Supabase RPC over plain fetch). Leaderboards + friends. No money/item transfers exist,
// so friends or alt accounts cannot be used to farm money. Score growth is validated server-side.
import { G, emit, save } from '../core/state.js';
import { T } from '../core/i18n.js';
import { netWorth, earn, charge, notify } from './player.js';
import { countryOf } from '../data/world.js';
import { fmt } from '../core/money.js';

// server config: from the GitHub build (secrets) or entered in Settings / opened via an invite link
const SRV_KEY = 'gr_server';
function stored() { try { return JSON.parse(localStorage.getItem(SRV_KEY) || 'null') || {}; } catch { return {}; } }
const cfg = () => {
  const b = (typeof window !== 'undefined' && window.GR_CONFIG) || {};
  if (b.supabaseUrl && b.supabaseKey) return b;
  const st = stored();
  return { supabaseUrl: st.url, supabaseKey: st.key };
};
export const onlineEnabled = () => !!(cfg().supabaseUrl && cfg().supabaseKey);
export const serverSource = () => { const b = (typeof window !== 'undefined' && window.GR_CONFIG) || {}; return b.supabaseUrl && b.supabaseKey ? 'build' : stored().url ? 'manual' : 'none'; };
export const serverUrl = () => cfg().supabaseUrl || '';
export function setServer(url, key) {
  url = String(url || '').trim().replace(/\/+$/, '');
  key = String(key || '').trim();
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(url) || key.length < 20) return false;
  try { localStorage.setItem(SRV_KEY, JSON.stringify({ url, key })); } catch { return false; }
  return true;
}
export function clearServer() { try { localStorage.removeItem(SRV_KEY); } catch {} }
// invite links carry the server so friends land on the same leaderboard: #srv=<url>&k=<anon key>&f=<friend code>
export function readInvite() {
  // a build with the server baked in shares short links: #f=<friend code>
  if (typeof location === 'undefined' || !/(^|[#&])(srv|f)=/.test(location.hash)) return null;
  const q = new URLSearchParams(location.hash.slice(1));
  const ok = q.get('srv') && q.get('k') && serverSource() !== 'build' ? setServer(q.get('srv'), q.get('k')) : false;
  history.replaceState(null, '', location.pathname + location.search);
  return { ok, friend: q.get('f') || '' };
}
export function inviteLink() {
  const base = location.origin + location.pathname;
  const c = cfg();
  const code = G.s?.online?.code ? `&f=${encodeURIComponent(G.s.online.code)}` : '';
  return serverSource() === 'build' ? `${base}#f=${encodeURIComponent(G.s?.online?.code || '')}` : `${base}#srv=${encodeURIComponent(c.supabaseUrl)}&k=${encodeURIComponent(c.supabaseKey)}${code}`;
}
export async function ping() {
  if (!onlineEnabled()) return false;
  try { await rpc('gr_leaderboard', { p_scope: 'global' }); return true; } catch { return false; }
}
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
    // legacy anon keys are JWTs and go in Authorization too; new sb_publishable_ keys only in apikey
    headers: { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}), 'Content-Type': 'application/json' },
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
  if (m.includes('Failed to fetch') || m.includes('Load failed') || m.includes('NetworkError')) return T('Нет соединения', 'Немає зʼєднання', 'No connection');
  const E = {
    session_moved: ['Аккаунт открыт на другом устройстве', 'Акаунт відкрито на іншому пристрої', 'Your account is active on another device'],
    resync: ['Банк обновляет выписку, повторите', 'Банк оновлює виписку, повторіть', 'The bank is syncing, try again'],
    bad_amount: ['Минимум 1 $', 'Мінімум 1 $', 'Minimum is $1'],
    not_friends: ['Переводить можно только друзьям', 'Переказувати можна лише друзям', 'You can only send to friends'],
    friends_too_new: ['Вы друзья меньше 10 минут — банк проверяет новых получателей', 'Ви друзі менше 10 хвилин — банк перевіряє нових отримувачів', 'Friends for under 10 minutes — the bank checks new payees'],
    same_device: ['Перевод на свой же аккаунт с этого устройства запрещён', 'Переказ на свій же акаунт із цього пристрою заборонено', 'Transfers between accounts on one device are blocked'],
    receiver_blocked: ['Счёт получателя заблокирован', 'Рахунок отримувача заблоковано', 'The payee’s account is blocked'],
    limit_flagged: ['Счёт заблокирован службой безопасности', 'Рахунок заблоковано службою безпеки', 'Account blocked by security'],
    limit_new_account: ['Новый онлайн‑аккаунт: переводы через 20 минут', 'Новий онлайн‑акаунт: перекази через 20 хвилин', 'New online account: transfers unlock in 20 minutes'],
    limit_low_level: ['Переводы доступны с 3 уровня', 'Перекази доступні з 3 рівня', 'Transfers unlock at level 3'],
    limit_daily_count: ['Лимит: 10 переводов в сутки', 'Ліміт: 10 переказів на добу', 'Limit: 10 transfers a day'],
    limit_cooldown: ['Не чаще одного перевода в минуту', 'Не частіше одного переказу на хвилину', 'One transfer per minute'],
    limit_send: ['Превышен суточный лимит отправки', 'Перевищено добовий ліміт відправлення', 'Over your daily sending limit'],
    limit_receive: ['Получатель достиг лимита зачислений', 'Отримувач досяг ліміту зарахувань', 'The payee hit their receiving limit'],
    too_late: ['Перевод уже доставлен — отменить нельзя', 'Переказ уже доставлено — скасувати не можна', 'Already delivered — can’t cancel'],
    no_money: ['Недостаточно средств', 'Недостатньо коштів', 'Insufficient funds'],
  };
  for (const k in E) if (m.includes(k)) return T(...E[k]);
  return m.slice(0, 120);
}
export async function register(nick) {
  const res = await rpc('gr_register', { p_nick: nick, p_region: countryOf(G.s.player.city).id, p_device: deviceId() });
  const r = Array.isArray(res) ? res[0] : res;
  G.s.online = { ...G.s.online, id: r.id, secret: r.secret, code: r.code, nick, last: 0, seq: 0 };
  save();
  await link().catch(() => {});
  await submit(true).catch(() => {});
  // opened the game through a friend's invite link: send them a friend request right away
  await sendPendingFriend();
  emit('online');
  return r;
}
// opened a friend's invite link: send them a friend request (now, or right after registering)
export async function sendPendingFriend() {
  const o = G.s?.online;
  if (!o?.pendingFriend || !o.id || !onlineEnabled()) return false;
  const code = o.pendingFriend;
  delete o.pendingFriend; save();
  if (code.toUpperCase() === String(o.code || '').toUpperCase()) return false; // own link
  await friendRequest(code);
  emit('online');
  return true;
}
let lastSubmitTry = 0;
export async function submit(force = false) {
  const s = G.s;
  if (!onlineEnabled() || !s.online.id) return null;
  const now = Date.now();
  if (!force && now - lastSubmitTry < 90000) return null;
  lastSubmitTry = now;
  const res = await rpc('gr_submit2', {
    p_id: s.online.id, p_secret: s.online.secret, p_seq: s.online.seq || 0, p_worth: Math.max(0, Math.round(netWorth())), p_level: s.level,
    p_playtime: s.playSec, p_region: countryOf(s.player.city).id,
    p_stats: { sold: s.stats.sold || 0, profit: Math.round(s.stats.profit || 0), shops: s.biz.shops.length, rep: s.rep.n ? +(s.rep.sum / s.rep.n).toFixed(2) : 0 },
  });
  const r = Array.isArray(res) ? res[0] : res;
  if (r?.reason === 'resync') { sync().catch(() => {}); return r; }
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

// ---------------------------------------------------------------- fast home screen + money transfers
// One request (gr_home) returns the boards, friends, nudges and the bank's transfer data; the last answer is
// cached (memory + localStorage) so the Leaderboard opens instantly and refreshes in the background.
const HOME_KEY = 'gr_home';
export const HOME = { data: null, at: 0, busy: null, err: '' };
try { const c = JSON.parse(localStorage.getItem(HOME_KEY) || 'null'); if (c?.data) { HOME.data = c.data; HOME.at = 0; HOME.owner = c.owner; } } catch {}
const homeFor = () => (HOME.data && HOME.owner === (G.s?.online?.id || '') ? HOME.data : HOME.data && !HOME.owner ? HOME.data : null);
export const homeData = () => homeFor();
// device session for money operations (kept outside the save: an imported save on another phone must link again)
const SESS_KEY = 'gr_sess';
function sess() { try { const v = JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); return v && v.id === G.s?.online?.id ? v.token : null; } catch { return null; } }
export async function link() {
  const o = G.s.online;
  const r = await rpc('gr_link', { p_id: o.id, p_secret: o.secret, p_device: deviceId() });
  try { localStorage.setItem(SESS_KEY, JSON.stringify({ id: o.id, token: r.session })); } catch {}
  return r;
}
export const moneyState = () => { const m = homeFor()?.money; return !isRegistered() ? 'unregistered' : !m ? 'unknown' : m.active ? 'active' : 'moved'; };
const ruNote = (e) => {
  const i = e.info || {};
  if (e.kind === 'send') return T(`Перевод другу ${e.other}`, `Переказ другу ${e.other}`, `Transfer to ${e.other}`) + (i.note ? ` · «${i.note}»` : '');
  if (e.kind === 'recv') return T(`Перевод от ${e.other}`, `Переказ від ${e.other}`, `Transfer from ${e.other}`) + (i.tax > 0 ? T(` · налог ${fmt(+i.tax)} удержан`, ` · податок ${fmt(+i.tax)} утримано`, ` · tax ${fmt(+i.tax)} withheld`) : '');
  return i.reason === 'unclaimed' ? T(`Возврат: ${e.other} не забрал перевод`, `Повернення: ${e.other} не забрав переказ`, `Returned: ${e.other} never collected`) : T(`Отмена перевода ${e.other}`, `Скасування переказу ${e.other}`, `Cancelled transfer to ${e.other}`);
};
// apply ledger events the game hasn't seen (after a rollback they come back and are applied again)
function applyEvents(events) {
  const o = G.s.online;
  let n = 0;
  for (const e of (events || []).slice().sort((a, b) => a.seq - b.seq)) {
    if (e.seq <= (o.seq || 0)) continue;
    const d = +e.delta;
    if (d < 0) charge(-d, 'p2p', ruNote(e)); else earn(d, 'p2p', ruNote(e));
    if (e.kind === 'recv') {
      if (e.info?.tax > 0) G.s.tax.paid = (G.s.tax.paid || 0) + +e.info.tax;
      notify('bank', T('Перевод от друга', 'Переказ від друга', 'Money from a friend'), `${e.other}: +${fmt(d)}${e.info?.note ? ` «${e.info.note}»` : ''}`);
    }
    if (e.kind === 'refund') notify('bank', T('Деньги вернулись', 'Гроші повернулися', 'Money returned'), ruNote(e), { noBadge: true });
    o.seq = e.seq; n++;
  }
  if (n) { save(); emit('money'); }
  return n;
}
// sync with the server: one round trip, deduped while in flight
export function sync() {
  if (!onlineEnabled()) return Promise.resolve(null);
  if (HOME.busy) return HOME.busy;
  const s = G.s, reg = isRegistered();
  HOME.busy = (async () => {
    try {
      if (reg && !sess()) await link().catch(() => {});
      const d = await rpc('gr_home', { p_id: reg ? s.online.id : null, p_secret: reg ? s.online.secret : null, p_session: reg ? sess() : null, p_seq: s.online?.seq || 0, p_region: countryOf(s.player.city).id });
      if (d?.money?.active) applyEvents(d.money.events);
      if (d?.money && !d.money.active && (d.money.events || []).length) { /* another device owns the account: show, don't apply */ }
      const sig = JSON.stringify({ ...d, now: 0 }) + (reg ? s.online.id : '');
      const changed = sig !== HOME.sig || HOME.errShown;
      HOME.data = d; HOME.at = Date.now(); HOME.err = ''; HOME.errShown = false; HOME.owner = reg ? s.online.id : ''; HOME.sig = sig;
      try { localStorage.setItem(HOME_KEY, JSON.stringify({ data: d, owner: HOME.owner })); } catch {}
      if (changed) emit('online');
      return d;
    } catch (e) { HOME.err = errText(e); HOME.errShown = true; emit('online'); throw e; } finally { HOME.busy = null; }
  })();
  return HOME.busy;
}
// take the account over on this device (the other one loses money operations)
export async function relink() { await link(); return sync(); }
// fee + tax preview, same formulas as the server
export function quote(amount, friend) {
  const myReg = countryOf(G.s.player.city).id;
  const abroad = (friend?.region || myReg) !== myReg;
  const fee = Math.round(Math.max(0.1, amount * (abroad ? 0.025 : 0.01)) * 100) / 100;
  const rate = countryRate(friend?.region);
  const tax = Math.round((amount - fee) * rate * 100) / 100;
  const holdMin = 2 + Math.min(43, Math.floor(amount / 2000));
  return { fee, tax, net: amount - fee - tax, rate, abroad, holdMin };
}
const TAX_RATE = { RU: 0.13, UA: 0.18, BY: 0.13, KZ: 0.1, PL: 0.12, DE: 0.25, FR: 0.25, IT: 0.23, GB: 0.2, US: 0.22, JP: 0.2, CN: 0.2, AE: 0, TR: 0.15, GE: 0.01, TH: 0.1 };
export const countryRate = (r) => TAX_RATE[String(r || '').toUpperCase()] ?? 0.13;
export async function sendMoney(friendId, amount, note = '') {
  const s = G.s;
  amount = Math.round(amount * 100) / 100;
  if (!(amount >= 1)) throw new Error('bad_amount');
  if (amount > s.money) throw new Error('no_money');
  if (!sess()) await link();
  const call = () => rpc('gr_transfer', { p_id: s.online.id, p_secret: s.online.secret, p_session: sess(), p_seq: s.online.seq || 0, p_to: friendId, p_amount: amount, p_note: note || null });
  let r;
  try { r = await call(); } catch (e) {
    if (!String(e.message).includes('resync')) throw e;
    await sync(); // missed events first (e.g. the save was rolled back), then try again
    if (amount > s.money) throw new Error('no_money');
    r = await call();
  }
  applyEvents(r.events);
  sync().catch(() => {});
  return r;
}
export async function cancelTx(id) {
  const s = G.s;
  const r = await rpc('gr_tx_cancel', { p_id: s.online.id, p_secret: s.online.secret, p_session: sess(), p_tx: id });
  await sync();
  return r;
}
// background refresh: right after start (so menus open instantly) and every 45 s while the game is visible
let timer = null;
export function startOnline() {
  if (timer || !onlineEnabled()) return;
  setTimeout(() => sync().catch(() => {}), 1200);
  timer = setInterval(() => { if (document.visibilityState === 'visible' && isRegistered()) sync().catch(() => {}); }, 45000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isRegistered() && Date.now() - HOME.at > 15000) sync().catch(() => {}); });
}
