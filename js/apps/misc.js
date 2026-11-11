// Misc apps: Quests, Upgrades, News, Stats, Rating (leaderboard + friends), Settings.
import { G, emit, save, wipe, exportSave, importSave } from '../core/state.js';
import { T, L, LANGS, setLang, lang, dur } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { fmt } from '../core/money.js';
import { CURRENCIES, COUNTRIES, CITY, countryOf } from '../data/world.js';
import { CATS } from '../data/catalog.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, confirmBox, choose, sheet, resolveSheet, ago, renderHome, refreshAll, UI } from '../ui/shell.js';
import { empty, bar, kv, segbar, sparkline, avatar } from '../ui/comp.js';
import { ensureDaily, questProgress, questText, claimQuest, STORY, ACH, achTier } from '../game/quests.js';
import { UPGRADES, upLevel, upCost, UP_MAX, spend, getStat, netWorth, repScore, addXP } from '../game/player.js';
import { newsText } from '../game/news.js';
import { onlineEnabled, isRegistered, register, leaderboard, offlineBoard, friends, friendRequest, friendRespond, friendRemove, nudge, inbox, errText, submit, serverSource, serverUrl, setServer, clearServer, inviteLink, ping } from '../game/online.js';
import { sfx } from '../ui/sfx.js';

// ---------------------------------------------------------------- QUESTS
function questsMain() {
  const s = G.s;
  const list = ensureDaily();
  const st = STORY[s.quests.story];
  return `<h2 class="sec">${T('Ежедневные', 'Щоденні', 'Daily')}</h2>` + list.map((q) => { const p = questProgress(q); const done = p >= q.target; return `<div class="card ${q.done ? 'hl' : ''}"><div class="row between"><b>${esc(questText(q))}</b><span class="small g">+${fmt(q.reward)} · ${q.xp} XP</span></div>${bar((Math.min(p, q.target) / q.target) * 100)}<div class="row between mt"><span class="small m">${q.money ? fmt(p) : p} / ${q.money ? fmt(q.target) : q.target}</span>${q.done ? `<span class="tag g">✓</span>` : done ? `<button class="btn xs green" data-a="claim" data-v="${q.id}">${T('Забрать', 'Забрати', 'Claim')}</button>` : ''}</div></div>`; }).join('') +
    `<h2 class="sec">${T('Путь к империи', 'Шлях до імперії', 'Road to an empire')} <span class="small m">${s.quests.story}/${STORY.length}</span></h2>` +
    STORY.map((x, i) => `<div class="card ${i < s.quests.story ? 'hl' : i === s.quests.story ? '' : ''}" style="${i > s.quests.story ? 'opacity:.45' : ''}"><div class="row"><div style="width:30px;height:30px;border-radius:50%;display:grid;place-items:center;flex:none;background:${i < s.quests.story ? 'var(--acc)' : 'var(--panel3)'};color:${i < s.quests.story ? '#04170e' : 'var(--text)'};font-weight:800">${i < s.quests.story ? '✓' : i + 1}</div><div class="grow"><b>${esc(L(x.n))}</b>${i === s.quests.story ? `<div class="d">${esc(L(x.d))}</div>` : ''}</div><span class="small m">+${fmt(x.r * countryOf(s.player.city).wage)}</span></div></div>`).join('') +
    `<h2 class="sec">${T('Достижения', 'Досягнення', 'Achievements')}</h2><div class="tiles" style="grid-template-columns:1fr 1fr 1fr;gap:8px">${ACH.map((a) => { const t = achTier(a); return `<div class="stat center" style="${t ? '' : 'opacity:.5'}"><div style="font-size:24px">${['🔒', '🥉', '🥈', '🥇', '💎'][t]}</div><b style="font-size:13px;white-space:normal">${esc(L(a.n))}</b><small>${a.money ? fmt(getStat(a.stat), { short: true }) : Math.floor(getStat(a.stat))}${a.tiers[t] != null ? ' / ' + (a.money ? fmt(a.tiers[t], { short: true }) : a.tiers[t]) : ''}</small></div>`; }).join('')}</div>`;
}
export const questsApp = {
  id: 'quests', glyph: 'trophy', lvl: 1,
  name: ['Задания', 'Завдання', 'Quests'], colors: ['#ffc23d', '#e09400'], glyphColor: '#fff',
  badge: () => ensureDaily().filter((q) => !q.done && questProgress(q) >= q.target).length,
  views: { main: questsMain },
  actions: { claim: (id) => { const q = G.s.quests.list.find((x) => x.id === id); if (claimQuest(q)) { sfx('cash'); toast(`+${fmt(q.reward)}`, 'g'); } rerender(); } },
};

// ---------------------------------------------------------------- UPGRADES
function upMain() {
  return `<p class="p">${T('Улучшения навсегда. Больше клиентов — покупатели пишут чаще. Больше места на складе позволит держать больше вещей.', 'Покращення назавжди. Більше клієнтів — покупці пишуть частіше.', 'Permanent upgrades. More buyers, faster delivery, more storage.')}</p>` + UPGRADES.map((u) => {
    const l = upLevel(u.id);
    const max = l >= UP_MAX;
    const cost = upCost(u, l);
    return `<div class="card"><div class="row"><div style="width:58px;height:58px;border-radius:16px;display:grid;place-items:center;flex:none;background:linear-gradient(160deg,${u.color[0]},${u.color[1]})">${icon(u.icon, 'style="width:28px;height:28px;color:#fff"')}</div><div class="grow"><h3>${esc(L(u.n))}</h3><div class="d">${esc(L(u.d))}</div></div><b class="m">${l} / ${UP_MAX}</b></div>${segbar(l, UP_MAX)}${kv(T('Сейчас', 'Зараз', 'Now'), l ? u.eff(l) : '—')}${!max ? kv(T('Следующий уровень', 'Наступний рівень', 'Next level'), `<span class="g">${u.eff(l + 1)}</span>`) : ''}${max ? `<div class="tag g mt">MAX</div>` : `<button class="btn block mt ${G.s.money < cost ? 'black' : ''}" data-a="buy" data-v="${u.id}">${T('Улучшить за', 'Покращити за', 'Upgrade for')} ${fmt(cost)}</button>`}</div>`;
  }).join('');
}
export const upgradesApp = {
  id: 'upgrades', glyph: 'trend', lvl: 1,
  name: ['Улучшения', 'Покращення', 'Upgrades'], colors: ['#8b5cff', '#6a3ae0'], accent: '#6a3ae0',
  views: { main: upMain },
  actions: { buy: (id) => { const u = UPGRADES.find((x) => x.id === id); const l = upLevel(id); if (l >= UP_MAX) return; if (!spend(upCost(u, l), 'upgrade', L(u.n))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); G.s.up[id] = l + 1; addXP(15); sfx('win'); toast(`${L(u.n)}: ${l + 1}/${UP_MAX}`, 'g'); rerender(); } },
};

// ---------------------------------------------------------------- NEWS
const NEWS_ICON = { market: '📈', rival: '🦈', world: '🌍', tip: '💡' };
function newsMain() {
  const s = G.s;
  const active = s.events.filter((e) => e.until >= Math.floor(s.t / 1440));
  return (active.length ? `<h3 class="sub">${T('Активные события рынка', 'Активні події ринку', 'Active market events')}</h3>` + active.map((e) => `<div class="card ${e.mult > 1 ? 'hl' : 'warn'}"><b>${e.mult > 1 ? '▲' : '▼'} ${esc(newsText({ ev: e }))}</b><div class="small m">${T('ещё', 'ще', 'for')} ${e.until - Math.floor(s.t / 1440) + 1} ${T('дн.', 'дн.', 'd')}</div></div>`).join('') : '') +
    `<h3 class="sub">${T('Лента', 'Стрічка', 'Feed')}</h3>` + (s.news.map((n) => `<div class="list-item"><div style="font-size:24px">${NEWS_ICON[n.kind] || '📰'}</div><div class="grow"><div>${esc(newsText(n))}</div><div class="tiny m">${ago(n.t)}</div></div></div>`).join('') || empty('news', T('Новостей нет', 'Новин немає', 'No news')));
}
export const newsApp = {
  id: 'news', glyph: 'news', lvl: 1,
  name: ['Новости', 'Новини', 'News'], colors: ['#ff5468', '#c42035'],
  views: { main: newsMain },
};

// ---------------------------------------------------------------- STATS
function statsMain() {
  const s = G.s;
  const w = s.hist.map((h) => h.w).concat([Math.round(netWorth())]);
  const S = (k) => getStat(k);
  const tile = (label, v, cls = '') => `<div class="stat"><small>${label}</small><b class="${cls}">${v}</b></div>`;
  return `<div class="card"><div class="small m">${T('Капитал', 'Капітал', 'Net worth')}</div><div class="price-big">${fmt(netWorth())}</div>${sparkline(w, 320, 140, 'auto')}<div class="small m">${T('по игровым дням', 'за ігровими днями', 'by game day')}</div></div>
    <div class="stats">${tile(T('Дней в игре', 'Днів у грі', 'Days played'), Math.floor(s.t / 1440) + 1)}${tile(T('Время в игре', 'Час у грі', 'Play time'), dur(s.playSec))}${tile(T('Продано', 'Продано', 'Sold'), S('sold'))}${tile(T('Куплено', 'Куплено', 'Bought'), S('bought'))}${tile(T('Выручка', 'Виручка', 'Revenue'), fmt(S('revenue'), { short: true }))}${tile(T('Прибыль', 'Прибуток', 'Profit'), fmt(S('profit'), { short: true }), S('profit') >= 0 ? 'g' : 'r')}${tile(T('Лучшая сделка', 'Найкраща угода', 'Best flip'), fmt(s.stats.bestFlip || 0, { short: true }))}${tile(T('Смен отработано', 'Змін відпрацьовано', 'Shifts worked'), S('shifts'))}${tile(T('Ремонтов', 'Ремонтів', 'Repairs'), S('repairs'))}${tile(T('Осмотров', 'Оглядів', 'Inspections'), S('inspections'))}${tile(T('Легит‑чеков', 'Легіт‑чеків', 'Legit checks'), S('legit'))}${tile(T('Бесплатных вещей', 'Безкоштовних речей', 'Freebies'), S('freebies'))}${tile(T('Побед на аукционах', 'Перемог на аукціонах', 'Auctions won'), S('auctionsWon'))}${tile(T('Боксов открыто', 'Боксів відкрито', 'Boxes opened'), S('boxes'))}${tile(T('Поездок', 'Поїздок', 'Trips'), S('trips'))}${tile(T('Редких находок', 'Рідкісних знахідок', 'Rare finds'), S('rareFound'))}${tile(T('Мошенников поймано', 'Шахраїв спіймано', 'Scammers caught'), S('scamsCaught'))}${tile(T('Обманули вас', 'Обдурили вас', 'Got scammed'), S('scammed'))}${tile(T('Казино: итог', 'Казино: підсумок', 'Casino net'), fmt(S('casino'), { short: true }), S('casino') >= 0 ? 'g' : 'r')}${tile(T('Налогов уплачено', 'Податків сплачено', 'Taxes paid'), fmt(S('taxPaid'), { short: true }))}</div>`;
}
export const statsApp = {
  id: 'stats', glyph: 'stats', lvl: 1,
  name: ['Статистика', 'Статистика', 'Stats'], colors: ['#4da3ff', '#2a63ff'],
  views: { main: statsMain },
};

// ---------------------------------------------------------------- RATING (online)
const RT = { scope: 'global', rows: null, loading: false, err: '', fr: null, inbox: null };
async function loadBoard() {
  RT.loading = true; RT.err = ''; rerender();
  try {
    if (onlineEnabled() && isRegistered()) await submit(true).catch(() => {});
    RT.rows = onlineEnabled() ? await leaderboard(RT.scope) : offlineBoard();
    if (onlineEnabled() && isRegistered()) { RT.fr = await friends(); RT.inbox = await inbox().catch(() => []); }
  } catch (e) { RT.err = errText(e); RT.rows = offlineBoard(); }
  RT.loading = false; rerender();
}
function ratingMain() {
  const s = G.s;
  if (!RT.rows && !RT.loading) setTimeout(loadBoard, 0);
  const on = onlineEnabled();
  let h = '';
  if (!on) h += `<div class="card warn small" data-a="open" data-v="settings">${T('Офлайн‑режим: сервер рейтинга не подключён, вы соревнуетесь с перекупщиками‑ботами. Владелец игры может подключить онлайн (см. README).', 'Офлайн‑режим: сервер рейтингу не підключено, ви змагаєтеся з ботами.', 'Offline: no leaderboard server configured, you compete with bots. The owner can enable online (see README).')}</div>`;
  else if (!isRegistered()) h += `<div class="card"><h3>${T('Войти в онлайн‑рейтинг', 'Увійти в онлайн‑рейтинг', 'Join the online leaderboard')}</h3><div class="d">${T('Ник виден всем игрокам. Переводы денег и вещей между игроками невозможны — накрутить через друзей или второй аккаунт нельзя, а рост капитала проверяет сервер.', 'Нік бачать усі. Перекази грошей і речей між гравцями неможливі.', 'Your nickname is public. Money/item transfers between players don’t exist, and the server validates growth.')}</div><input class="input mt" id="nick" maxlength="20" value="${esc(s.player.name)}"><button class="btn block mt" data-a="reg">${T('Участвовать', 'Брати участь', 'Join')}</button></div>`;
  h += `<div class="seg"><button class="${RT.scope === 'global' ? 'on' : ''}" data-a="scope" data-v="global">${T('Мир', 'Світ', 'World')}</button><button class="${RT.scope === 'region' ? 'on' : ''}" data-a="scope" data-v="region">${countryOf(s.player.city).flag} ${T('Страна', 'Країна', 'Country')}</button><button class="${RT.scope === 'friends' ? 'on' : ''}" data-a="scope" data-v="friends">${T('Друзья', 'Друзі', 'Friends')}</button></div>`;
  if (RT.err) h += `<div class="small r mb">${esc(RT.err)}</div>`;
  if (RT.loading && !RT.rows) h += `<div class="empty">⏳</div>`;
  if (RT.rows) h += RT.rows.slice(0, 100).map((r, i) => `<div class="lb-row ${r.me ? 'me' : ''}"><div class="pos ${i < 3 ? 'p' + (i + 1) : ''}">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</div>${avatar(r.nick, (r.nick.charCodeAt(0) * 37) % 360)}<div class="grow"><b>${esc(r.nick)}</b><div class="small m">${T('ур.', 'рів.', 'lvl')} ${r.level} · ${esc(r.region || '')}</div></div><b class="g">${fmt(r.worth, { short: true })}</b></div>`).join('');
  if (on && isRegistered()) {
    const fr = RT.fr || { friends: [], incoming: [], outgoing: [] };
    h += `<h2 class="sec">${T('Друзья', 'Друзі', 'Friends')}</h2><div class="card"><div class="small m">${T('Ваш код друга', 'Ваш код друга', 'Your friend code')}</div><div class="row between"><b class="mono" style="font-size:24px;letter-spacing:3px">${esc(s.online.code)}</b><button class="btn xs dark" data-a="copy">${T('Копировать', 'Копіювати', 'Copy')}</button></div><div class="row mt" style="gap:8px"><input class="input" id="fcode" placeholder="${T('Код друга', 'Код друга', 'Friend code')}" style="text-transform:uppercase"><button class="btn" data-a="addf">+</button></div></div>`;
    if (fr.incoming?.length) h += `<h3 class="sub">${T('Заявки', 'Заявки', 'Requests')}</h3>` + fr.incoming.map((x) => `<div class="list-item">${avatar(x.nick)}<div class="grow"><b>${esc(x.nick)}</b></div><button class="btn xs green" data-a="facc" data-v="${x.id}">✓</button><button class="btn xs dark" data-a="fdec" data-v="${x.id}">✕</button></div>`).join('');
    h += (fr.friends || []).map((x) => `<div class="list-item">${avatar(x.nick)}<div class="grow"><b>${esc(x.nick)}</b><div class="small m">${T('ур.', 'рів.', 'lvl')} ${x.level} · ${fmt(x.worth, { short: true })} · ${T('продаж', 'продажів', 'sales')} ${x.stats?.sold ?? 0}</div></div><button class="btn xs dark" data-a="nudge" data-v="${x.id}">👋</button></div>`).join('') || `<p class="p">${T('Добавьте друзей по коду, чтобы соревноваться.', 'Додайте друзів за кодом, щоб змагатися.', 'Add friends by code to compete.')}</p>`;
    if (RT.inbox?.length) h += `<h3 class="sub">${T('Вам прислали', 'Вам надіслали', 'Received')}</h3>` + RT.inbox.slice(0, 8).map((n) => `<div class="kv"><span>${esc(n.nick)}</span><b>${esc(n.emoji)}</b></div>`).join('');
    h += `<p class="tiny m">${T('Друзья могут только соревноваться и обмениваться эмодзи — никаких переводов.', 'Друзі можуть лише змагатися й обмінюватися емодзі.', 'Friends can only compete and send emoji — no transfers.')}</p>`;
  }
  h += `<button class="btn dark block mt" data-a="reload">${icon('refresh')} ${T('Обновить', 'Оновити', 'Refresh')}</button>`;
  return h;
}
export const ratingApp = {
  id: 'rating', glyph: 'crown', lvl: 1,
  name: ['Рейтинг', 'Рейтинг', 'Leaderboard'], colors: ['#ffb02e', '#d47a00'], glyphColor: '#fff',
  views: { main: ratingMain },
  onOpen: () => { RT.rows = null; },
  actions: {
    scope: (v) => { RT.scope = v; RT.rows = null; rerender(); },
    reload: () => { RT.rows = null; loadBoard(); },
    reg: async () => { const nick = document.getElementById('nick').value.trim(); try { await register(nick); sfx('win'); toast(T('Вы в рейтинге!', 'Ви в рейтингу!', 'You’re on the board!'), 'g'); RT.rows = null; rerender(); } catch (e) { toast(errText(e), 'r'); } },
    copy: () => { try { navigator.clipboard.writeText(G.s.online.code); toast(T('Скопировано', 'Скопійовано', 'Copied')); } catch { toast(G.s.online.code); } },
    addf: async () => { const c = document.getElementById('fcode').value; if (!c) return; try { const r = await friendRequest(c); toast(r?.status === 'accepted' ? T('Теперь вы друзья!', 'Тепер ви друзі!', 'Now friends!') : T('Заявка отправлена', 'Заявку надіслано', 'Request sent'), 'g'); loadBoard(); } catch (e) { toast(errText(e), 'r'); } },
    facc: async (id) => { try { await friendRespond(id, true); loadBoard(); } catch (e) { toast(errText(e), 'r'); } },
    fdec: async (id) => { try { await friendRespond(id, false); loadBoard(); } catch (e) { toast(errText(e), 'r'); } },
    nudge: async (id) => { const e = await choose(T('Отправить', 'Надіслати', 'Send'), ['👋', '🔥', '💸', '👑', '😎', '🤝'].map((x) => ({ v: x, label: x }))); if (!e) return; try { await nudge(id, e); toast(T('Отправлено', 'Надіслано', 'Sent'), 'g'); } catch (er) { toast(errText(er), 'r'); } },
  },
};

// ---------------------------------------------------------------- SETTINGS
function setMain() {
  const s = G.s;
  return `<div class="card"><h3>${T('Язык', 'Мова', 'Language')}</h3><div class="opt-grid mt">${LANGS.map((l) => `<button class="${lang() === l.id ? 'on' : ''}" data-a="lang" data-v="${l.id}">${l.flag} ${l.name}</button>`).join('')}</div></div>
    <div class="card"><h3>${T('Валюта отображения', 'Валюта відображення', 'Display currency')}</h3><div class="d">${T('«Местная» — валюта страны, где вы сейчас.', '«Місцева» — валюта країни, де ви зараз.', '“Local” follows the country you’re in.')}</div><div class="chips wrap mt"><button class="chip${s.settings.cur === 'auto' ? ' on' : ''}" data-a="cur" data-v="auto">${T('Местная', 'Місцева', 'Local')}</button>${Object.keys(CURRENCIES).map((c) => `<button class="chip${s.settings.cur === c ? ' on' : ''}" data-a="cur" data-v="${c}">${c} ${CURRENCIES[c].sym}</button>`).join('')}</div></div>
    <div class="card"><h3>${T('Звук', 'Звук', 'Sound')}</h3><div class="seg mt"><button class="${s.settings.sound !== false ? 'on' : ''}" data-a="snd" data-v="1">${T('Вкл', 'Увімк', 'On')}</button><button class="${s.settings.sound === false ? 'on' : ''}" data-a="snd" data-v="0">${T('Выкл', 'Вимк', 'Off')}</button></div></div>
    <div class="card"><h3>${T('Профиль', 'Профіль', 'Profile')}</h3>${kv(T('Имя', 'Імʼя', 'Name'), esc(s.player.name))}${kv(T('Родина', 'Батьківщина', 'Home country'), `${countryOf(s.player.city).flag} ${esc(L(COUNTRIES.find((c) => c.id === s.player.country)?.name || ''))}`)}<button class="btn dark sm mt" data-a="rename">${T('Сменить имя', 'Змінити імʼя', 'Rename')}</button></div>
    <div class="card"><h3>${T('Сохранение', 'Збереження', 'Save data')}</h3><div class="d">${T('Игра сохраняется автоматически в этом браузере. Сделайте резервную копию, чтобы перенести прогресс.', 'Гра зберігається автоматично в цьому браузері.', 'Auto‑saved in this browser. Back it up to move devices.')}</div><div class="btns"><button class="btn dark sm" data-a="export">${T('Экспорт', 'Експорт', 'Export')}</button><button class="btn dark sm" data-a="import">${T('Импорт', 'Імпорт', 'Import')}</button></div><button class="btn red block mt" data-a="reset">${T('Начать заново', 'Почати заново', 'Start over')}</button></div>
    <div class="card"><h3>🌐 ${T('Мультиплеер', 'Мультиплеєр', 'Multiplayer')}</h3>${onlineEnabled() ? `<div class="d">${T('Сервер подключён', 'Сервер підключено', 'Server connected')} ${serverSource() === 'build' ? T('(встроен в сайт)', '(вбудований у сайт)', '(built into the site)') : ''}: <span class="mono small">${esc(serverUrl().replace('https://', ''))}</span></div><div class="btns"><button class="btn sm" data-a="open" data-v="rating">${T('Рейтинг и друзья', 'Рейтинг і друзі', 'Leaderboard & friends')}</button><button class="btn sm dark" data-a="invite">${T('Пригласить друга', 'Запросити друга', 'Invite a friend')}</button></div>${serverSource() === 'manual' ? `<button class="btn xs dark mt" data-a="srvoff">${T('Отключить сервер', 'Відключити сервер', 'Disconnect')}</button>` : ''}` : `<div class="d">${T('Онлайн‑рейтинг и друзья работают через бесплатный сервер Supabase. Владелец сайта добавляет его один раз (см. README), либо вставьте адрес и ключ здесь.', 'Онлайн‑рейтинг і друзі працюють через безкоштовний сервер Supabase. Власник сайту додає його один раз (див. README), або вставте адресу й ключ тут.', 'The online leaderboard and friends run on a free Supabase server. The site owner adds it once (see README), or paste the URL and key here.')}</div><button class="btn sm mt" data-a="srvset">${T('Подключить сервер', 'Підключити сервер', 'Connect a server')}</button>`}</div>
    <div class="card"><h3>📲 ${T('Как установить на iPhone', 'Як встановити на iPhone', 'Install on iPhone')}</h3><div class="d">${T('Safari → «Поделиться» → «На экран Домой». Игра откроется во весь экран и будет работать офлайн.', 'Safari → «Поділитися» → «На екран Додому».', 'Safari → Share → “Add to Home Screen”. Runs fullscreen and offline.')}</div></div>
    <p class="tiny m center">Global Reseller · build ${esc(window.GR_CONFIG?.build || 'dev')}</p>`;
}
export const settingsApp = {
  id: 'settings', glyph: 'gear', lvl: 1,
  name: ['Настройки', 'Налаштування', 'Settings'], colors: ['#8a94a6', '#5d6677'],
  views: { main: setMain },
  actions: {
    lang: (v) => { G.s.player.lang = v; setLang(v); save(); refreshAll(); },
    cur: (v) => { G.s.settings.cur = v; save(); refreshAll(); },
    snd: (v) => { G.s.settings.sound = v === '1'; rerender(); },
    srvset: async () => {
      const v = await sheet(`<h2>${T('Сервер мультиплеера', 'Сервер мультиплеєра', 'Multiplayer server')}</h2><p class="p">${T('Supabase → Project Settings → API: Project URL и anon public key.', 'Supabase → Project Settings → API: Project URL і anon public key.', 'Supabase → Project Settings → API: Project URL and anon public key.')}</p><input class="input" id="su" placeholder="https://xxxx.supabase.co" autocapitalize="off" autocorrect="off"><input class="input mt" id="sk" placeholder="anon key (eyJ...)" autocapitalize="off" autocorrect="off"><button class="btn block mt" id="sok">${T('Подключить', 'Підключити', 'Connect')}</button>`, { after(el) { el.querySelector('#sok').onclick = () => resolveSheet(JSON.stringify([el.querySelector('#su').value, el.querySelector('#sk').value])); } });
      if (!v) return;
      const [u, k] = JSON.parse(v);
      if (!setServer(u, k)) return toast(T('Проверьте адрес и ключ', 'Перевірте адресу й ключ', 'Check the URL and key'), 'r');
      toast(T('Проверяем соединение…', 'Перевіряємо зʼєднання…', 'Checking the connection…'));
      if (await ping()) { sfx('win'); toast(T('Сервер подключён!', 'Сервер підключено!', 'Server connected!'), 'g'); } else { clearServer(); toast(T('Сервер не отвечает или схема не установлена', 'Сервер не відповідає або схему не встановлено', 'Server unreachable or schema missing'), 'r'); }
      rerender();
    },
    srvoff: () => { clearServer(); toast(T('Сервер отключён', 'Сервер відключено', 'Disconnected')); rerender(); },
    invite: async () => { const link = inviteLink(); try { if (navigator.share) await navigator.share({ title: 'Global Reseller', text: T('Погнали перекупать! Мой код друга: ', 'Погнали перекуповувати! Мій код друга: ', 'Let’s flip stuff! My friend code: ') + (G.s.online?.code || ''), url: link }); else { await navigator.clipboard.writeText(link); toast(T('Ссылка скопирована', 'Посилання скопійовано', 'Link copied'), 'g'); } } catch { await sheet(`<h2>${T('Ссылка', 'Посилання', 'Link')}</h2><textarea class="input" style="height:120px">${esc(link)}</textarea>`); } },
    rename: async () => { const v = await sheet(`<h2>${T('Имя', 'Імʼя', 'Name')}</h2><input class="input" id="nn" maxlength="20" value="${esc(G.s.player.name)}"><button class="btn block mt" id="nnok">OK</button>`, { after(el) { el.querySelector('#nnok').onclick = () => resolveSheet(el.querySelector('#nn').value.trim()); } }); if (v) { G.s.player.name = v; rerender(); } },
    export: async () => { const code = exportSave(); try { await navigator.clipboard.writeText(code); toast(T('Скопировано в буфер', 'Скопійовано в буфер', 'Copied to clipboard'), 'g'); } catch { await sheet(`<h2>${T('Код сохранения', 'Код збереження', 'Save code')}</h2><textarea class="input" style="height:200px">${esc(code)}</textarea>`); } },
    import: async () => { const v = await sheet(`<h2>${T('Вставьте код', 'Вставте код', 'Paste code')}</h2><textarea class="input" id="imp" style="height:180px"></textarea><button class="btn block mt" id="impok">${T('Загрузить', 'Завантажити', 'Load')}</button>`, { after(el) { el.querySelector('#impok').onclick = () => resolveSheet(el.querySelector('#imp').value); } }); if (!v) return; try { importSave(v); location.reload(); } catch { toast(T('Неверный код', 'Невірний код', 'Invalid code'), 'r'); } },
    reset: async () => { if (await confirmBox(T('Удалить прогресс?', 'Видалити прогрес?', 'Delete progress?'), T('Это нельзя отменить.', 'Це не можна скасувати.', 'This can’t be undone.'), T('Удалить', 'Видалити', 'Delete'), undefined, true)) { wipe(); location.reload(); } },
  },
};
