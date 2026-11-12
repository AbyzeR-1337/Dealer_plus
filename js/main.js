// Entry point: boot sequence, first-run setup, wiring of events to the UI, service worker.
import { G, on, emit, save, load, newState } from './core/state.js';
import { T, L, setLang, LANGS, lang } from './core/i18n.js';
import { $, esc, sleep } from './core/util.js';
import { COUNTRIES, COUNTRY, CITY, defaultCity, countryOf } from './data/world.js';
import { fmt } from './core/money.js';
import { registerGames } from './mini/engine.js';
import { ITEM_GAMES } from './mini/games_item.js';
import { WORK_GAMES } from './mini/games_work.js';
import { APPS, DOCK } from './apps/index.js';
import { UI, registerApps, initShell, renderHome, renderStatus, liveUpdate, rerender, sheet, resolveSheet, toast, banner, dayNum, refreshAll, appName } from './ui/shell.js';
import { ensurePhone, PHONE } from './game/phone.js';
import { readInvite, sendPendingFriend, errText, startOnline } from './game/online.js';
import { risk, jailed, payBail, crimeName } from './game/crime.js';
import { ensureHousing } from './game/housing.js';
import { initHome } from './ui/home.js';
import { initGalleries } from './ui/comp.js';
import { initWorld, startSim, isPaused } from './game/sim.js';
import { resolveCustoms } from './game/travel.js';
import { log, earn, charge, addXP, addReview, addItem, canStore, spend, stat } from './game/player.js';
import { eventsTick } from './game/events.js';
import { playMini } from './mini/engine.js';
import { MORE_GAMES } from './mini/games_more.js';
import { LAB_GAMES } from './mini/lab.js';
import { LIFE_GAMES } from './mini/life.js';
import { PC_GAMES } from './mini/pcbuild.js';
import { itemSVG } from './ui/art.js';
import { itemTitle, itemSub } from './game/items.js';
import { unlockAudio, sfx } from './ui/sfx.js';

registerGames({ ...ITEM_GAMES, ...WORK_GAMES, ...MORE_GAMES, ...LAB_GAMES, ...LIFE_GAMES, ...PC_GAMES });
window.GR = { G }; // debug handle
registerApps(APPS, DOCK);

const RERENDER_ON = ['pc', 'tg', 'ym', 'sup', 'chats', 'inv', 'market', 'listings', 'deliveries', 'jobs', 'biz', 'bank', 'travel', 'needs', 'quests', 'house', 'tax', 'stocks', 'numbers', 'online', 'news', 'support', 'parts', 'apps'];
// which background events each app actually shows; anything else is ignored while it is open
const WATCH = {
  market: ['market', 'chats', 'listings', 'support', 'inv', 'online'], inventory: ['inv', 'listings', 'deliveries', 'chats'], delivery: ['deliveries'],
  auto: ['market', 'inv'], ymarket: ['ym', 'deliveries'], supplier: ['sup', 'inv', 'travel'], msgs: ['badges', 'log'], tg: ['tg', 'inv'], hw: ['deliveries'], build: ['pc', 'inv'], computer: ['inv', 'pc'], bank: ['bank', 'online'], stocks: ['stocks'], jobs: ['jobs', 'needs'], free: ['market', 'needs'], business: ['biz', 'inv'], realty: ['house'], travel: ['travel'],
  gov: ['tax'], quests: ['quests'], numbers: ['numbers'], rating: ['online'], news: ['news'], profile: ['needs', 'house', 'quests'], repair: ['inv', 'parts'],
  appstore: ['apps'], vpn: ['apps'], dark: ['apps', 'inv'],
  shop: ['needs', 'inv'], auction: ['market', 'inv'], legit: ['inv'], lab: ['inv'], pawn: ['inv'], map: ['travel'], stats: [], settings: ['online'], upgrades: [], casino: [],
};
function safeRerender(ev) {
  if (!UI.app) return;
  const w = UI.app.watch || WATCH[UI.app.id];
  if (ev && w && !w.includes(ev)) return;
  if ($('#mini-layer').children.length) return;
  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae.closest('#appwin')) return;
  rerender();
}
let homeTick = 0;
function wire() {
  for (const ev of RERENDER_ON) on(ev, () => safeRerender(ev));
  on('apps', () => { if (!UI.app) renderHome(); });
  on('tick', () => {
    renderStatus();
    liveUpdate();
    if (UI.app && UI.app.live) safeRerender();
    if (!UI.app && ++homeTick % 2 === 0) renderHome();
    eventsTick(!!($('#mini-layer').children.length || $('#sheet-layer').children.length || $('#boot').classList.contains('on')));
  });
  on('lifeEvent', lifeEvent);
  on('log', () => { if (!UI.app) renderHome(); });
  on('day', () => { toast(T(`☀ День ${dayNum()}`, `☀ День ${dayNum()}`, `☀ Day ${dayNum()}`)); refreshAll(); });
  on('customs', async (c) => {
    await sleep(400);
    const v = await sheet(`<h2>🛃 ${T('Таможня', 'Митниця', 'Customs')}</h2><p class="p">${T(`Вы везёте вещей на ${fmt(c.value)}. Пошлина при декларировании: ${fmt(c.duty)}.`, `Ви везете речей на ${fmt(c.value)}. Мито: ${fmt(c.duty)}.`, `You carry ${fmt(c.value)} of goods. Duty if declared: ${fmt(c.duty)}.`)}${c.fakes.length ? ' ' + T('Подделки при декларировании конфискуют.', 'Підробки під час декларування конфіскують.', 'Declared fakes get confiscated.') : ''}</p><div class="btns col"><button class="btn block" data-a="resolve" data-v="declare">${T('Задекларировать и заплатить', 'Задекларувати й заплатити', 'Declare and pay')}</button><button class="btn red block" data-a="resolve" data-v="risk">${T('Пройти по зелёному коридору (риск 30%)', 'Пройти зеленим коридором (ризик 30%)', 'Green channel (30% risk)')}</button></div>`, { modal: true });
    const r = resolveCustoms(v === 'risk' ? 'risk' : 'declare');
    if (!r) return;
    if (r.caught) { sfx('lose'); toast(T(`Попались! Штраф ${fmt(r.fine)}`, `Попалися! Штраф ${fmt(r.fine)}`, `Caught! Fine ${fmt(r.fine)}`), 'r'); }
    else if (r.paid != null) toast(T(`Пошлина ${fmt(r.paid)}`, `Мито ${fmt(r.paid)}`, `Duty ${fmt(r.paid)}`) + (r.confiscated ? ` · ${T('конфисковано', 'конфісковано', 'confiscated')}: ${r.confiscated}` : ''));
    else { sfx('win'); toast(T('Проскочили!', 'Проскочили!', 'Got through!'), 'g'); }
    refreshAll();
  });
  document.addEventListener('pointerdown', unlockAudio, { once: true });
}

function startGame() {
  setLang(G.s.player.lang);
  initWorld();
  ensureHousing();
  ensurePhone(APPS);
  const inv = readInvite();
  if (inv?.friend) {
    (G.s.online ||= {}).pendingFriend = inv.friend;
    // already on the leaderboard: the request goes out right away
    sendPendingFriend().then((ok) => ok && toast(T('Заявка в друзья отправлена', 'Заявку в друзі надіслано', 'Friend request sent'), 'g'), (e) => toast(errText(e), 'r'));
  }
  PHONE.nameOf = (id) => (UI.apps[id] ? appName(UI.apps[id]) : id);
  initShell();
  initHome();
  initGalleries();
  wire();
  startOnline();
  on('jail', renderJail);
  renderJail();
  renderStatus();
  renderHome();
  startSim();
  $('#boot').classList.remove('on');
  save();
}

// ---------------------------------------------------------------- random life events (QTE)
function timedChoice(title, html, opts, secs) {
  return sheet(`<h2>${title}</h2>${html}<div class="bar" style="height:8px;margin:10px 0"><i class="qt" style="width:100%;background:var(--yel);transition:width ${secs}s linear"></i></div><div class="btns col">${opts.map((o) => `<button class="btn block ${o.cls || ''}" data-a="resolve" data-v="${o.v}">${esc(o.label)}</button>`).join('')}</div>`, {
    modal: true,
    after(el) { requestAnimationFrame(() => requestAnimationFrame(() => { el.querySelector('.qt').style.width = '0%'; })); setTimeout(() => { if (el.isConnected) resolveSheet('timeout'); }, secs * 1000); },
  });
}
async function lifeEvent(e) {
  sfx('note');
  if (e.id === 'pickpocket') {
    const v = await timedChoice('🚨 ' + T('Карманник!', 'Кишеньковий злодій!', 'Pickpocket!'), `<p class="p">${T('Кто‑то тянет руку к вашему кошельку! Быстрее!', 'Хтось тягнеться до вашого гаманця! Швидше!', 'Someone’s reaching for your wallet! Quick!')}</p>`, [{ v: 'catch', label: T('Схватить вора!', 'Схопити злодія!', 'Grab the thief!'), cls: 'red' }, { v: 'let', label: T('Ничего не делать', 'Нічого не робити', 'Do nothing'), cls: 'dark' }], 5);
    let won = false;
    if (v === 'catch') { const r = await playMini('thief', { title: T('Держи вора!', 'Тримай злодія!', 'Stop, thief!'), pass: 1 }); won = !!r.won; }
    if (won) { earn(e.loss * 0.4, 'other', T('Награда за поимку', 'Винагорода', 'Reward')); addXP(12); toast(T(`Поймали! Награда ${fmt(e.loss * 0.4)}`, `Спіймали! Винагорода ${fmt(e.loss * 0.4)}`, `Caught! Reward ${fmt(e.loss * 0.4)}`), 'g'); }
    else {
      // cash in the wallet is gone; the card can still be blocked before the thief spends it all
      const cash = e.loss * 0.4, card = e.loss - cash;
      charge(cash, 'theft', T('Карманник: наличные', 'Кишеньковий злодій: готівка', 'Pickpocket: cash'));
      sfx('lose');
      const r = await playMini('cardblock', { title: T('Срочно заблокируй карту', 'Терміново заблокуй картку', 'Block the card now'), amount: card, pass: 0.6 });
      const spent = r.quit ? card : Math.min(card, r.spent ?? card);
      if (spent > 0.01) charge(spent, 'theft', T('Покупки вора по вашей карте', 'Покупки злодія вашою карткою', 'Thief’s purchases on your card'));
      toast(T(`Украли ${fmt(cash + spent)}`, `Вкрали ${fmt(cash + spent)}`, `Stolen: ${fmt(cash + spent)}`), 'r');
    }
  } else if (e.id === 'hotdeal') {
    const v = await timedChoice('⚡ ' + T('Горячая сделка', 'Гаряча угода', 'Hot deal'), `<div class="card row"><div style="width:84px;height:84px;border-radius:12px;overflow:hidden;flex:none">${itemSVG(e.item, { tilt: true })}</div><div class="grow"><b>${esc(itemTitle(e.item))}</b><div class="small m">${esc(itemSub(e.item))}</div><div class="g bold">${fmt(e.price)}</div><div class="small m">${T('рынок', 'ринок', 'market')} ≈ ${fmt(e.value)}</div></div></div><p class="p">${T('Знакомый срочно сливает вещь. 10 секунд на решение!', 'Знайомий терміново зливає річ. 10 секунд на рішення!', 'A contact is dumping it fast. 10 seconds to decide!')}</p>`, [{ v: 'buy', label: T(`Беру за ${fmt(e.price)}`, `Беру за ${fmt(e.price)}`, `Buy for ${fmt(e.price)}`), cls: 'green' }, { v: 'no', label: T('Пропустить', 'Пропустити', 'Skip'), cls: 'dark' }], 10);
    if (v === 'buy') {
      if (!canStore(e.item)) toast(T('Нет места на складе', 'Немає місця', 'No storage space'), 'r');
      else if (!spend(e.price, 'buy', itemTitle(e.item))) toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      else { addItem(e.item, e.price, 'deal'); stat('bought'); addXP(8); sfx('cash'); toast(T('Сделка!', 'Угода!', 'Deal!'), 'g'); }
    } else if (v === 'timeout') toast(T('Сделка ушла другому', 'Угода пішла іншому', 'The deal went to someone else'));
  } else if (e.id === 'wallet') {
    const v = await timedChoice('👛 ' + T('Найден кошелёк', 'Знайдено гаманець', 'Found a wallet'), `<p class="p">${T(`Внутри ${fmt(e.cash)} и визитка владельца.`, `Усередині ${fmt(e.cash)} і візитка власника.`, `${fmt(e.cash)} inside and the owner’s card.`)}</p>`, [{ v: 'return', label: T('Вернуть владельцу', 'Повернути власнику', 'Return it'), cls: 'green' }, { v: 'keep', label: T('Оставить себе', 'Залишити собі', 'Keep it'), cls: 'dark' }], 12);
    if (v === 'return') {
      const r = await playMini('owner', { title: T('Вернуть кошелёк', 'Повернути гаманець', 'Return the wallet'), cash: e.cash, pass: 1 });
      if (r.won) { addXP(30); addReview(5, T('Вернул мне кошелёк! Честный человек.', 'Повернув мені гаманець! Чесна людина.', 'Returned my wallet! Honest person.')); earn(e.cash * 0.2, 'other', T('Благодарность', 'Подяка', 'Thank‑you gift')); toast(T('Владелец благодарит! +репутация', 'Власник дякує! +репутація', 'The owner thanks you! +reputation'), 'g'); }
      else { addXP(5); toast(T('Кошелёк ушёл не тому человеку…', 'Гаманець пішов не тій людині…', 'The wallet went to the wrong person…'), 'r'); }
    }
    else if (v === 'keep') { earn(e.cash, 'other', T('Находка', 'Знахідка', 'Found')); if (risk('wallet', 0.025, { fine: e.cash, text: T('Кошелёк нашли по камерам', 'Гаманець знайшли по камерах', 'Caught on camera with the wallet') })) toast(T('Вас нашли по камерам! Обезьянник и штраф', 'Вас знайшли по камерах! Мавпятник і штраф', 'Caught on camera! Holding cell and a fine'), 'r'); else toast(`+${fmt(e.cash)}`); }
  } else if (e.id === 'parcel') {
    const v = await timedChoice('📦 ' + T('Курьер роняет коробку!', 'Курʼєр впускає коробку!', 'A courier drops a box!'), `<p class="p">${T('Успейте поймать — получите чаевые.', 'Встигніть піймати — отримаєте чайові.', 'Catch it for a tip.')}</p>`, [{ v: 'go', label: T('Ловить!', 'Ловити!', 'Catch!'), cls: 'yel' }], 4);
    if (v === 'go') { const r = await playMini('timing', { title: T('Поймай коробку', 'Спіймай коробку', 'Catch the box'), rounds: 1, speed: 1.8 }); if (r.score > 0.5) { earn(e.tip, 'tip', T('Чаевые', 'Чайові', 'Tip')); toast(`+${fmt(e.tip)}`, 'g'); } }
  } else if (e.id === 'blogger') {
    const v = await timedChoice('📸 ' + T('Блогер хочет обзор', 'Блогер хоче огляд', 'A blogger wants a review'), `<p class="p">${T('Покажет ваши объявления подписчикам — покупатели будут писать в 2 раза чаще.', 'Покаже ваші оголошення підписникам — покупці писатимуть удвічі частіше.', 'They’ll show your listings — twice as many buyers for a while.')}</p>`, [{ v: 'yes', label: T('Согласиться', 'Погодитися', 'Agree'), cls: 'green' }, { v: 'no', label: T('Отказаться', 'Відмовитися', 'Decline'), cls: 'dark' }], 10);
    if (v === 'yes') { G.s.boostUntil = G.s.t + 240; toast(T('Ваши объявления в тренде!', 'Ваші оголошення в тренді!', 'Your listings are trending!'), 'g'); }
  } else if (e.id === 'rain') {
    const v = await timedChoice('🌧 ' + T('Ливень!', 'Злива!', 'Downpour!'), `<p class="p">${T('У вас нет жилья, вещи могут промокнуть. Спрятать?', 'У вас немає житла, речі можуть промокнути. Сховати?', 'No home — your stuff may get soaked. Shelter?')}</p>`, [{ v: 'hide', label: T('Спрятаться под навес', 'Сховатися під навіс', 'Find shelter') }], 5);
    if (v !== 'hide') { const it = G.s.inv[0]; if (it) { it.cond = Math.max(1, it.cond - 8); toast(T('Вещь промокла (−состояние)', 'Річ промокла', 'An item got wet'), 'r'); } } else toast(T('Успели!', 'Встигли!', 'Made it!'), 'g');
  }
  refreshAll();
}

// ---------------------------------------------------------------- first run
const SETUP = { lang: null, country: null, city: null, name: '' };
function guessLang() { const l = (navigator.language || 'ru').slice(0, 2); return l === 'uk' ? 'uk' : l === 'ru' || l === 'be' || l === 'kk' ? 'ru' : 'en'; }
function setupHTML() {
  const c = COUNTRY[SETUP.country];
  return `<div class="boot-form">
    <label>&gt; ${T('ЯЗЫК', 'МОВА', 'LANGUAGE')}</label><div class="opt-grid" style="grid-template-columns:repeat(3,1fr)">${LANGS.map((l) => `<button class="${SETUP.lang === l.id ? 'on' : ''}" data-s="lang" data-v="${l.id}">${l.flag} ${l.name}</button>`).join('')}</div>
    <label>&gt; ${T('СТРАНА · валюта и местные сервисы', 'КРАЇНА · валюта й місцеві сервіси', 'COUNTRY · currency & local services')}</label><div class="opt-grid">${COUNTRIES.map((x) => `<button class="${SETUP.country === x.id ? 'on' : ''}" data-s="country" data-v="${x.id}">${x.flag} ${esc(L(x.name))}<small>${x.cur} · ${esc(x.apps.classifieds[0])}</small></button>`).join('')}</div>
    <label>&gt; ${T('ГОРОД', 'МІСТО', 'CITY')} · ${c.cities.length}</label><div class="opt-grid cities">${c.cities.map((x) => `<button class="${SETUP.city === x.id ? 'on' : ''}" data-s="city" data-v="${x.id}">${esc(L(x.name))}<small>${T('цены', 'ціни', 'prices')} ×${(x.idx * c.price).toFixed(2)}</small></button>`).join('')}</div>
    <label>&gt; ${T('ИМЯ', 'ІМʼЯ', 'NAME')}</label><input class="input" id="su-name" maxlength="20" placeholder="${T('Как вас зовут?', 'Як вас звати?', 'Your name?')}" value="${esc(SETUP.name)}">
    <div class="card mt" style="background:#07120d;border-color:#1d3a2e"><div class="small" style="color:#9ff5cf">${T('Вы начинаете с нуля: 0 денег, нет жилья, нет работы. Найдите работу, заберите вещи даром, перепродайте — и постройте международную торговую империю.', 'Ви починаєте з нуля: 0 грошей, немає житла й роботи. Знайдіть роботу, заберіть речі даром, перепродайте — і збудуйте торгову імперію.', 'You start from zero: no money, no home, no job. Get a job, grab freebies, flip them — and build a global trading empire.')}</div></div>
    <button class="btn block mt" id="su-go" style="min-height:56px;font-size:18px;background:var(--acc);color:#04170e">▶ ${T('Начать игру', 'Почати гру', 'Start game')}</button>
    <div style="height:40px"></div></div>`;
}
async function bootScreen() {
  const boot = $('#boot');
  boot.classList.add('on');
  SETUP.lang = guessLang();
  setLang(SETUP.lang);
  SETUP.country = SETUP.lang === 'uk' ? 'UA' : SETUP.lang === 'ru' ? 'RU' : 'US';
  SETUP.city = defaultCity(SETUP.country);
  boot.innerHTML = `<div class="boot-in scanlines" style="position:relative"><div class="boot-log" id="bl"></div><div id="bf"></div></div>`;
  const bl = $('#bl');
  const lines = [
    ['GR‑OS 4.2 bootloader', ''], [T('проверка памяти', 'перевірка памʼяті', 'memory check') + ' ........ ', 'OK'], [T('загрузка рынков', 'завантаження ринків', 'loading markets') + ' 16/16 ........ ', 'OK'],
    [T('каталог', 'каталог', 'catalog') + ': 1100+ ' + T('моделей', 'моделей', 'models') + ' ........ ', 'OK'], [T('подключение к сети перекупщиков', 'підключення до мережі перекупників', 'connecting to reseller net') + ' ... ', window.GR_CONFIG?.supabaseUrl ? 'ONLINE' : 'OFFLINE'],
  ];
  for (const [a, b] of lines) { bl.insertAdjacentHTML('beforeend', `<div>&gt; ${esc(a)}<span class="${b === 'OFFLINE' ? 'w' : 'ok'}">${esc(b)}</span></div>`); await sleep(170); }
  bl.insertAdjacentHTML('beforeend', `<div class="boot-logo">GLOBAL <span>RESELLER</span></div><div style="color:#6b8f80">${T('симулятор перекупщика', 'симулятор перекупника', 'reseller life simulator')}</div>`);
  const bf = $('#bf');
  const draw = () => { bf.innerHTML = setupHTML(); bind(); };
  function bind() {
    bf.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
      SETUP.name = $('#su-name').value;
      const k = b.dataset.s, v = b.dataset.v;
      if (k === 'lang') { SETUP.lang = v; setLang(v); }
      if (k === 'country') { SETUP.country = v; SETUP.city = defaultCity(v); }
      if (k === 'city') SETUP.city = v;
      draw();
    }));
    $('#su-go').addEventListener('click', () => {
      const name = $('#su-name').value.trim() || T('Перекупщик', 'Перекупник', 'Reseller');
      G.s = newState({ name, lang: SETUP.lang, country: SETUP.country, city: SETUP.city });
      unlockAudio(); sfx('win');
      startGame();
      log('sys', T('Добро пожаловать! Начните с «Работы» и «Даром».', 'Ласкаво просимо! Почніть із «Роботи» і «Даром».', 'Welcome! Start with Jobs and Freebies.'));
      setTimeout(() => banner({ app: 'quests', title: T('Первое задание', 'Перше завдання', 'First quest'), text: T('Скачайте «Работу» в App Market и найдите вакансию', 'Завантажте «Роботу» в App Market і знайдіть вакансію', 'Get the Jobs app from App Market and find a vacancy'), go: ['appstore', 'app', { id: 'jobs' }] }), 1200);
    });
  }
  draw();
}

// ---------------------------------------------------------------- the holding cell: the phone is confiscated
function renderJail() {
  let el = document.getElementById('jail-layer');
  if (!jailed()) { if (el) el.remove(); document.body.classList.remove('in-jail'); return; }
  const j = G.s.jail;
  if (!el) { el = document.createElement('div'); el.id = 'jail-layer'; document.body.appendChild(el); }
  document.body.classList.add('in-jail');
  el.innerHTML = `<div class="jl-box"><div class="jl-ico">📵</div><h2>${T('Телефон изъят', 'Телефон вилучено', 'Phone confiscated')}</h2><p>${T('Вы в обезьяннике', 'Ви в мавпятнику', 'You’re in the holding cell')} · ${esc(crimeName(j.kind))}${j.text ? ` · ${esc(j.text)}` : ''}</p>
    <div class="jl-time"><span data-cd="${j.until}" data-fmt="long"></span></div><small>${T('до освобождения', 'до звільнення', 'until release')}</small>
    <div class="jl-row"><span>${T('Штраф списан', 'Штраф списано', 'Fine charged')}</span><b>${fmt(j.fine)}</b></div><div class="jl-row"><span>${T('Пометка в личном деле', 'Позначка в особовій справі', 'Record mark')}</span><b>+1</b></div>
    <button class="btn block mt" id="jl-bail">${T('Внести залог', 'Внести заставу', 'Post bail')} · ${fmt(j.bail)}</button><p class="tiny">${T('С пометками в деле штрафы и просрочки дороже, а документы, кредиты и работа — сложнее.', 'З позначками у справі штрафи й прострочки дорожчі, а документи, кредити й робота — складніші.', 'With record marks fines and late fees cost more; papers, credit and jobs get harder.')}</p></div>`;
  el.querySelector('#jl-bail').onclick = () => { const r = payBail(); if (r.ok) { sfx('ok'); toast(T('Вы на свободе', 'Ви на волі', 'You’re free'), 'g'); } else toast(r.msg, 'r'); renderJail(); refreshAll(); };
  liveUpdate();
}

// ---------------------------------------------------------------- boot
(async function main() {
  const saved = load();
  if (saved) { G.s = saved; startGame(); }
  else await bootScreen();
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
