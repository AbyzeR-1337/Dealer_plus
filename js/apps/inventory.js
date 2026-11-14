// Storage app: inventory, item details & actions, collections.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { CATS, CAT_LIST, MODEL } from '../data/catalog.js';
import { CITY } from '../data/world.js';
import { fmt, nicePrice } from '../core/money.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, askPrice, choose, confirmBox, openApp, back } from '../ui/shell.js';
import { img, tags, specs, defectList, empty, row, bar, gallery } from '../ui/comp.js';
import { viewsOf } from '../data/views.js';
import { itemTitle, itemSub, itemValue, isVehicle, sizeUnits } from '../game/items.js';
import { getItem, removeItem, capacity, used, garage, vehiclesOwned, stat } from '../game/player.js';
import { myListing, unlist } from '../game/sell.js';
import { SETS, setProgress, slotsFor, putInCollection, takeFromCollection } from '../game/quests.js';
import { shelf, stockItem } from '../game/business.js';
import { busy } from '../game/workshop.js';
import { sellFlow, inspectFlow, legitFlow, cityName } from './common.js';
import { sfx } from '../ui/sfx.js';
import { hasStorage } from '../game/files.js';
import { filesView, filesActions } from './files_view.js';
import { stockFor, fitAcc, removeAcc, accState } from '../game/phoneacc.js';
import { PHONE_ACC } from '../data/phoneacc.js';
import { playMini } from '../mini/engine.js';
import { HV, HVA, hwName } from './pc_apps.js';
import { openDesktopOn } from './pc_desktop.js';
import { isComputer, specOf } from '../game/pc.js';
import { MARKS, traceOf, catchChance, markLeft, svcPrice, wipeMark, buyWipe, fenceOffer } from '../game/hot.js';
import { vpnActive } from '../game/phone.js';
import { spend } from '../game/player.js';
import { countryOf } from '../data/world.js';

const F = { cat: 'all', sort: 'new' };
const gal = { id: null, i: 0, n: 1 };

function mainView() {
  const s = G.s;
  let items = s.inv.filter((i) => !i.shop);
  const cats = ['all', ...CAT_LIST.filter((c) => items.some((i) => i.cat === c))];
  if (F.cat !== 'all') items = items.filter((i) => i.cat === F.cat);
  const val = (i) => itemValue(i, i.loc || s.player.city, 'known');
  if (F.sort === 'val') items.sort((a, b) => val(b) - val(a));
  if (F.sort === 'profit') items.sort((a, b) => (val(b) - (b.paid || 0)) - (val(a) - (a.paid || 0)));
  const total = items.reduce((a, i) => a + val(i), 0);
  const cap = capacity(), u = used();
  return `<div class="card"><div class="row between"><b>${T('Склад', 'Склад', 'Storage')}: ${u} / ${cap}</b><span class="small m">🚗 ${vehiclesOwned()} / ${garage()}</span></div>${bar((u / cap) * 100, u > cap * 0.9 ? 'var(--red)' : '')}<div class="small m mt">${T('Оценка вещей', 'Оцінка речей', 'Items value')}: <b class="g">${fmt(total)}</b></div></div>
    <div class="chips">${cats.map((c) => `<button class="chip${F.cat === c ? ' on' : ''}" data-a="cat" data-v="${c}">${c === 'all' ? T('Все', 'Усі', 'All') : `${CATS[c].icon} ${esc(L(CATS[c].name))}`}</button>`).join('')}</div>
    <div class="seg"><button class="${F.sort === 'new' ? 'on' : ''}" data-a="sort" data-v="new">${T('Новые', 'Нові', 'New')}</button><button class="${F.sort === 'val' ? 'on' : ''}" data-a="sort" data-v="val">${T('Дороже', 'Дорожче', 'Value')}</button><button class="${F.sort === 'profit' ? 'on' : ''}" data-a="sort" data-v="profit">${T('Профит', 'Профіт', 'Profit')}</button></div>
    ${items.length ? items.map((it) => {
      const v = val(it), pr = v - (it.paid || 0);
      const l = myListing(it.id);
      const st = l ? `<span class="tag b">${T('в продаже', 'у продажу', 'listed')} ${fmt(l.price)}</span>` : it.auction ? `<span class="tag p">${T('аукцион', 'аукціон', 'auction')}</span>` : busy(it.id) ? `<span class="tag y">🔧</span>` : '';
      return row(it, `<div style="text-align:right;flex:none"><b>${fmt(v)}</b><div class="small ${pr >= 0 ? 'g' : 'r'}">${pr >= 0 ? '+' : ''}${fmt(pr)}</div>${st}</div>`, `${esc(itemSub(it))}${it.loc && it.loc !== s.player.city ? ` · 📍${esc(L(CITY[it.loc]?.name || ''))}` : ''}${s.car === it.id ? ' · 🔑' : ''}`);
    }).join('') : `<div class="empty">${icon('archive')}<b>${T('Склад пуст', 'Склад порожній', 'Storage is empty')}</b>${T('Купите вещи в объявлениях или заберите даром.', 'Купіть речі в оголошеннях або заберіть даром.', 'Buy listings or grab freebies.')}<div class="btns" style="justify-content:center"><button class="btn sm" data-a="open" data-v="market">${T('Объявления', 'Оголошення', 'Listings')}</button><button class="btn sm dark" data-a="open" data-v="free">${T('Даром', 'Даром', 'Freebies')}</button></div></div>`}`;
}

function itemView(p) {
  const s = G.s;
  const it = getItem(p.id);
  if (!it) return empty('archive', T('Вещи уже нет', 'Речі вже немає', 'Item is gone'));
  if (gal.id !== it.id) { gal.id = it.id; gal.i = 0; }
  const photos = viewsOf(it);
  gal.n = photos.length;
  const v = itemValue(it, s.player.city, 'known');
  const l = myListing(it.id);
  const slots = slotsFor(it);
  const shops = s.biz.shops.filter((sh) => sh.city === (it.loc || s.player.city));
  const here = (it.loc || s.player.city) === s.player.city;
  const btn = (a, label, cls = 'dark', dis = false) => `<button class="btn ${cls}${dis ? ' dis' : ''}" data-a="${a}" data-v="${it.id}">${label}</button>`;
  return `${gallery(it, photos, gal.i)}
    <div style="font-size:19px;font-weight:700">${esc(itemTitle(it))}</div><div class="small m">${esc(itemSub(it))}</div>${tags(it)}
    <div class="stats mt"><div class="stat"><small>${T('Оценка рынка', 'Оцінка ринку', 'Market value')}</small><b>${fmt(v)}</b></div><div class="stat"><small>${T('Куплено за', 'Куплено за', 'Paid')}</small><b>${fmt(it.paid || 0)}</b></div></div>
    ${l ? `<div class="card hl mt"><b>${T('В продаже', 'У продажу', 'Listed')}: ${fmt(l.price)}</b><div class="small m">👁 ${l.views} · 💬 ${l.offers} · ${l.disclose ? T('дефекты указаны', 'дефекти вказано', 'issues disclosed') : T('дефекты скрыты', 'дефекти приховано', 'issues hidden')}</div><div class="btns">${btn('reprice', T('Изменить цену', 'Змінити ціну', 'Change price'))}${btn('unlist', T('Снять', 'Зняти', 'Unlist'))}</div></div>` : ''}
    <div class="btns">${!l && !it.auction ? btn('sell', `${icon('tag')} ${T('Продать', 'Продати', 'Sell')}`, '') : ''}${btn('repair', `${icon('wrench')} ${T('Мастерская', 'Майстерня', 'Workshop')}`)}</div>
    <div class="btns">${btn('inspect', `🔍 ${T('Осмотреть', 'Оглянути', 'Inspect')}`)}${btn('legit', `🔎 ${T('Легит‑чек', 'Легіт‑чек', 'Legit check')}`, 'dark', s.level < 2)}</div>
    ${hasStorage(it) ? `<div class="btns">${btn('files', `📂 ${T('Содержимое', 'Вміст', 'Contents')}${it.data?.wiped ? ' · ' + T('чисто', 'чисто', 'clean') : ''}`)}</div>` : ''}
    ${hasStorage(it) || isComputer(it) || specOf(it) ? `<div class="btns">${btn('pcplug', `🖥 ${isComputer(it) ? T('Открыть на своём ПК: файлы, тест, ремонт', 'Відкрити на своєму ПК: файли, тест, ремонт', 'Open on your PC: files, test, repair') : T('Подключить к ПК', 'Підключити до ПК', 'Plug into the PC')}`)}</div>` : ''}
    ${it.cat === 'phones' ? `<div class="btns">${btn('lab', `${icon('lockphone')} Phone Lab${it.lock ? ' 🔒' : ''}`, 'dark', s.level < 2)}</div>` : ''}
    ${hotBlock(it)}
    ${it.cat === 'phones' ? accBlock(it) : ''}
    ${isVehicle(it) ? `<div class="btns">${btn('drive', s.car === it.id ? `🔑 ${T('Основной транспорт', 'Основний транспорт', 'Main vehicle')}` : `🔑 ${T('Ездить на нём', 'Їздити на ньому', 'Use as my ride')}`, s.car === it.id ? 'green' : 'dark')}</div>` : ''}
    ${slots.length ? `<div class="btns">${btn('coll', `🏆 ${T('В коллекцию', 'До колекції', 'Add to collection')}: ${esc(L(slots[0].set.n))}`, 'yel')}</div>` : ''}
    ${shops.length && !l ? `<div class="btns">${btn('toshop', `${icon('store')} ${T('В магазин', 'У магазин', 'Stock in store')}`)}</div>` : ''}
    ${!here ? `<div class="card warn mt small">📍 ${T('Вещь находится в городе', 'Річ знаходиться в місті', 'Item is in')} ${esc(L(CITY[it.loc]?.name || ''))}. ${T('Продажа отсюда — с доставкой между городами.', 'Продаж звідси — з доставкою між містами.', 'Selling from here ships between cities.')}</div>` : ''}
    <h3 class="sub">${T('Состояние', 'Стан', 'Condition')}</h3>${defectList(it)}
    <h3 class="sub">${T('Характеристики', 'Характеристики', 'Specs')}</h3><div class="card">${specs(it)}</div>
    <button class="btn dark block mt" data-a="trash" data-v="${it.id}">🗑 ${T('Выбросить', 'Викинути', 'Throw away')}</button>`;
}

// stolen goods: traces, how to wipe them, the risk left
const CHECKABLE = ['phones', 'electronics', 'consoles', 'watches', 'jewelry', 'bikes', 'cars', 'bags'];
const checkPrice = () => nicePrice(3, countryOf(G.s.player.city).cur);
function hotBlock(it) {
  if (!it.hot?.known) return CHECKABLE.includes(it.cat) && !it.checked ? `<div class="btns"><button class="btn dark" data-a="hotcheck" data-v="${it.id}">🔎 ${T('Пробить по базе розыска', 'Пробити за базою розшуку', 'Run it through the stolen database')} · ${fmt(checkPrice())}</button></div>` : '';
  const left = markLeft(it), t = traceOf(it);
  const vpn = vpnActive();
  const btnFor = (k) => { const m = MARKS[k]; if (m.fix === 'svc') return `<button class="btn xs ${vpn ? '' : 'dark'}" data-a="hotsvc" data-v="${it.id}" data-k="${k}">${esc(L(m.how))} · ${fmt(svcPrice(it, k))}</button>`; return `<button class="btn xs" data-a="hotdiy" data-v="${it.id}" data-k="${k}">${m.fix === 'diy' ? '✋ ' : ''}${esc(L(m.how))}</button>`; };
  return `<div class="card hot-card"><div class="row between"><b>🚨 ${T('Краденое — следы', 'Крадене — сліди', 'Stolen — traces')}</b><b class="${t > 40 ? 'r' : t > 15 ? 'o' : 'g'}">${t}%</b></div><div class="hot-bar"><i style="width:${t}%;background:${t > 60 ? '#ff5468' : t > 30 ? '#ffb020' : '#2ef2a0'}"></i></div>
    <div class="small m">${T(`Шанс, что найдут при проверке: ~${Math.round(catchChance(it) * 100)}%. Полиция проверит ещё несколько раз в ближайшие дни, а покупатель — после продажи. Каждый след снижает цену: покупатели тоже проверяют.`, `Шанс, що знайдуть під час перевірки: ~${Math.round(catchChance(it) * 100)}%. Поліція перевірить ще кілька разів найближчими днями, а покупець — після продажу. Кожен слід знижує ціну: покупці теж перевіряють.`, `Chance of being traced at a check: ~${Math.round(catchChance(it) * 100)}%. The police check a few more times in the coming days, and the buyer after a sale. Every trace lowers the price: buyers check too.`)}</div>
    ${it.hot.marks.map((k) => `<div class="hot-row ${it.hot.done.includes(k) ? 'done' : ''}"><span>${MARKS[k].ic} ${esc(L(MARKS[k].n))}</span>${it.hot.done.includes(k) ? `<small>✔ ${T('убрано, но видна перебивка', 'прибрано, але видно перебивку', 'wiped, tampering shows')}</small>` : btnFor(k)}</div>`).join('')}
    ${left.some((k) => MARKS[k].fix === 'svc') && !vpn ? `<div class="small o mt">🔒 ${T('Услуги «мастеров» — только через VPN (Тень).', 'Послуги «майстрів» — лише через VPN (Тінь).', 'Shadow services need a VPN.')}</div>` : ''}
    <div class="btns"><button class="btn dark sm" data-a="open" data-v="dark">🕶 ${T('Скупщику', 'Скупнику', 'To the fence')} · ${fmt(fenceOffer(it))}</button></div></div>`;
}
// glass & case for this exact model
function accBlock(it) {
  const a = it.acc || {}, g = stockFor(it.m, 'glass'), c = stockFor(it.m, 'case');
  const go = accState().orders.filter((o) => o.m === it.m).length;
  const line = (kind, have, stock, fit, off) => `<div class="acc-row"><span>${kind === 'glass' ? '🛡' : '📱'} ${have ? `<b>${esc(L(PHONE_ACC[kind][have].n))}</b> <small class="g">+${+((PHONE_ACC[kind][have].mult - 1) * 100).toFixed(1)}%</small>` : `<span class="m">${kind === 'glass' ? T('Без стекла', 'Без скла', 'No glass') : T('Без чехла', 'Без чохла', 'No case')}</span>`}</span>${have ? `<button class="btn xs dark" data-a="${off}" data-v="${it.id}">${kind === 'glass' ? T('Снять', 'Зняти', 'Peel off') : T('Снять', 'Зняти', 'Take off')}</button>` : stock.length ? `<button class="btn xs" data-a="${fit}" data-v="${it.id}">${kind === 'glass' ? T('Наклеить', 'Наклеїти', 'Stick on') : T('Надеть', 'Вдягнути', 'Put on')} · ${stock.reduce((x, y) => x + y.n, 0)}</button>` : ''}</div>`;
  const need = (!a.glass && !g.length) || (!a.case && !c.length);
  return `<div class="card acc-card"><b>${T('Стекло и чехол', 'Скло й чохол', 'Glass & case')}</b>${line('glass', a.glass, g, 'accglass', 'accunglass')}${line('case', a.case, c, 'acccase', 'accuncase')}${need ? `<button class="btn sm dark mt" data-a="accshop" data-v="${it.id}">🛒 ${T(`Купить в «${hwName()}» для ${MODEL[it.m].name}`, `Купити в «${hwName()}» для ${MODEL[it.m].name}`, `Buy at ${hwName()} for the ${MODEL[it.m].name}`)}</button>` : ''}${go ? `<div class="small m mt">🛵 ${T('Курьер уже везёт аксессуары', 'Курʼєр уже везе аксесуари', 'A courier is bringing accessories')}</div>` : ''}</div>`;
}
async function pickTier(it, kind) {
  const st = stockFor(it.m, kind);
  if (st.length === 1) return st[0].t;
  return choose(kind === 'glass' ? T('Какое стекло?', 'Яке скло?', 'Which glass?') : T('Какой чехол?', 'Який чохол?', 'Which case?'), st.map((x) => ({ v: x.t, label: `${L(PHONE_ACC[kind][x.t].n)} · ${x.n} ${T('шт.', 'шт.', 'pcs')}` })));
}
function saleView() {
  const s = G.s;
  const ls = s.listings.map((l) => ({ l, it: getItem(l.itemId) })).filter((x) => x.it);
  const shopItems = s.inv.filter((i) => i.shop);
  return `<h2 class="sec">${T('В продаже', 'У продажу', 'For sale')}</h2>${ls.length ? ls.map(({ l, it }) => row(it, `<b style="flex:none">${fmt(l.price)}</b>`, `👁 ${l.views} · 💬 ${l.offers}`)).join('') : `<p class="p">${T('Нет объявлений.', 'Немає оголошень.', 'No listings.')}</p>`}
    ${shopItems.length ? `<h3 class="sub">${T('На полках магазинов', 'На полицях магазинів', 'On store shelves')}</h3>` + shopItems.map((it) => row(it, `<b style="flex:none">${fmt(it.shopPrice)}</b>`, esc(s.biz.shops.find((x) => x.id === it.shop)?.name || ''), 'open', 'business')).join('') : ''}`;
}

function collView() {
  return `<h2 class="sec">${T('Коллекции', 'Колекції', 'Collections')}</h2><p class="p">${T('Собранная коллекция даёт постоянный бонус к цене продажи в категории. Вещи в коллекции не продаются, но входят в капитал.', 'Зібрана колекція дає постійний бонус до ціни продажу в категорії.', 'A complete set gives a permanent sell‑price bonus for its category.')}</p>` + SETS.map((set) => {
    const p = setProgress(set);
    return `<div class="card ${p.done ? 'hl' : ''}"><div class="row between"><h3>${esc(L(set.n))}</h3><span class="tag ${p.done ? 'g' : ''}">${p.n}/${p.total}</span></div><div class="small m">${CATS[set.cat].icon} +${Math.round(set.bonus * 100)}% ${T('к цене', 'до ціни', 'price')} · ${esc(L(CATS[set.cat].name))}</div>${bar((p.n / p.total) * 100, 'var(--yel)')}
      <div class="tiles mt" style="grid-template-columns:repeat(3,1fr);gap:8px">${set.slots.map((slot) => { const it = p.filled[slot]; const m = Object.values(MODEL).find((x) => x.id.includes(slot) && (set.cats || [set.cat]).includes(x.cat)); return `<div class="tile" ${it ? `data-a="uncoll" data-v="${set.id}" data-w="${slot}"` : ''}><div class="img" style="${it ? '' : 'opacity:.25;filter:grayscale(1)'}">${it ? img(it) : ''}</div><div class="tiny" style="margin-top:4px">${esc(m ? m.name : slot)}</div></div>`; }).join('')}</div></div>`;
  }).join('');
}

export default {
  id: 'inventory', glyph: 'archive', lvl: 1,
  name: ['Склад', 'Склад', 'Storage'], colors: ['#3a4252', '#1d222c'], accent: '#4da3ff', dark: true,
  tabs: [
    { v: 'main', label: ['Вещи', 'Речі', 'Items'], icon: 'archive' },
    { v: 'sale', label: ['В продаже', 'У продажу', 'For sale'], icon: 'tag' },
    { v: 'coll', label: ['Коллекции', 'Колекції', 'Collections'], icon: 'trophy' },
  ],
  tabOf: (v) => (v === 'item' || v === 'files' ? 'main' : v),
  views: { main: mainView, item: itemView, sale: saleView, coll: collView, files: filesView },
  actions: {
    ...filesActions,
    cat: (v) => { F.cat = v; rerender(); },
    sort: (v) => { F.sort = v; rerender(); },
    gal: (v) => { gal.i = (gal.i + +v + gal.n) % gal.n; rerender(); },
    sell: async (id) => { if (await sellFlow(id)) rerender(); },
    reprice: async (id) => { const l = myListing(id); const p = await askPrice({ title: T('Новая цена', 'Нова ціна', 'New price'), value: l.price, min: 1, max: l.price * 3 }); if (p) { l.price = p; toast(T('Цена обновлена', 'Ціну оновлено', 'Price updated')); rerender(); } },
    unlist: (id) => { unlist(id); rerender(); },
    repair: (id) => openApp('repair', 'item', { id }),
    lab: (id) => openApp('lab', 'main', { id }),
    inspect: async (id) => { const it = getItem(id); await inspectFlow(it, itemTitle(it)); },
    legit: async (id) => { const it = getItem(id); await legitFlow(it, itemTitle(it)); },
    drive: (id) => { G.s.car = G.s.car === id ? null : id; sfx('ok'); toast(G.s.car ? T('Теперь вы ездите на этой машине', 'Тепер ви їздите цим авто', 'This is now your ride') : T('Транспорт снят', 'Транспорт знято', 'Ride unset')); rerender(); },
    coll: async (id) => { const it = getItem(id); const sl = slotsFor(it); if (!sl.length) return; if (await confirmBox(T('Положить в коллекцию?', 'Покласти до колекції?', 'Add to collection?'), esc(L(sl[0].set.n)))) { if (myListing(id)) unlist(id); putInCollection(it, sl[0].set, sl[0].slot); sfx('win'); back(); } },
    uncoll: async (setId, el) => { const set = SETS.find((x) => x.id === setId); if (await confirmBox(T('Достать из коллекции?', 'Дістати з колекції?', 'Take out of collection?'), T('Бонус коллекции пропадёт.', 'Бонус колекції зникне.', 'You’ll lose the set bonus.'))) { takeFromCollection(set, el.dataset.w); rerender(); } },
    toshop: async (id) => {
      const s = G.s; const it = getItem(id);
      const shops = s.biz.shops.filter((sh) => sh.city === (it.loc || s.player.city));
      const sid = shops.length === 1 ? shops[0].id : await choose(T('Какой магазин?', 'Який магазин?', 'Which store?'), shops.map((sh) => ({ v: sh.id, label: `${sh.name} (${shelf(sh).length}/${sh.slots})` })));
      if (!sid) return;
      const sh = shops.find((x) => x.id === sid);
      const price = await askPrice({ title: T('Цена на полке', 'Ціна на полиці', 'Shelf price'), value: nicePrice(itemValue(it, s.player.city, 'known') * 1.08), min: 1, max: itemValue(it, s.player.city, 'known') * 3 });
      if (!price) return;
      if (!stockItem(sh, id, price)) return toast(T('Нет места на полке', 'Немає місця на полиці', 'Shelf is full'), 'r');
      toast(T('Выставлено в магазине', 'Виставлено в магазині', 'Stocked'), 'g'); back();
    },
    hotcheck: (id) => {
      const it = getItem(id); if (!it) return;
      if (!spend(checkPrice(), 'service', T('Проверка по базе розыска', 'Перевірка за базою розшуку', 'Stolen‑goods check'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      it.checked = true;
      if (it.hot) { it.hot.known = true; sfx('lose'); toast(T('🚨 Вещь числится в розыске!', '🚨 Річ у розшуку!', '🚨 This item is reported stolen!'), 'r'); }
      else { sfx('ok'); toast(T('✓ Чисто — в розыске не числится', '✓ Чисто — у розшуку не значиться', '✓ Clean — not reported stolen'), 'g'); }
      rerender();
    },
    hotsvc: async (id, el) => {
      const k = el?.dataset?.k, it = getItem(id); if (!it || !k) return;
      if (!vpnActive()) return toast(T('Нужен VPN — «мастера» сидят в Тени', 'Потрібен VPN — «майстри» сидять у Тіні', 'You need a VPN — the masters are in the Shade'), 'r');
      if (!(await confirmBox(L(MARKS[k].how), `${esc(itemTitle(it))} · ${fmt(svcPrice(it, k))}<br><small>${T('Иногда «мастер» халтурит или пропадает с деньгами.', 'Іноді «майстер» халтурить або зникає з грошима.', 'Sometimes the master botches it or vanishes with the money.')}</small>`, T('Заказать', 'Замовити', 'Order')))) return;
      const r = buyWipe(id, k);
      if (!r.ok) return toast(r.msg || '—', 'r');
      sfx(r.res === 'clean' ? 'win' : 'lose');
      toast(r.res === 'clean' ? T('Готово — след убран', 'Готово — слід прибрано', 'Done — trace wiped') : r.res === 'rough' ? T('Сделано грубо — след стал меньше, но не так, как хотелось', 'Зроблено грубо — слід менший, але не так, як хотілося', 'Rough job — the trace is smaller, but not by much') : r.res === 'botched' ? T('Халтура — след стал только заметнее', 'Халтура — слід став тільки помітнішим', 'Botched — the trace is now more obvious') : T('«Мастер» пропал с деньгами', '«Майстер» зник із грошима', 'The “master” vanished with the money'), r.res === 'clean' ? 'g' : 'r');
      rerender();
    },
    hotdiy: async (id, el) => {
      const k = el?.dataset?.k, it = getItem(id); if (!it || !k) return;
      const m = MARKS[k];
      let q = 1;
      if (m.fix === 'diy') {
        const r = await playMini(m.game, { title: L(m.how), item: it, label: k === 'serial' ? T('Наклейте новую наклейку с серийником ровно на место старой', 'Наклейте нову наклейку із серійником рівно на місце старої', 'Put the new serial sticker exactly where the old one was') : k === 'engrave' ? T('Сполируйте гравировку целиком', 'Сполíруйте гравіювання повністю', 'Polish the engraving off completely') : T('Срежьте и ототрите всё лишнее', 'Зріжте й відітріть усе зайве', 'Cut off and rub away everything'), pass: 0.7 });
        if (r.quit) return;
        q = r.score;
      } else if (!(await confirmBox(L(m.how), esc(itemTitle(it)), T('Сделать', 'Зробити', 'Do it')))) return;
      const res = wipeMark(it, k, q);
      sfx(res.res === 'clean' ? 'win' : 'lose');
      toast(res.res === 'clean' ? T('След убран', 'Слід прибрано', 'Trace wiped') : res.res === 'rough' ? T('Убрано не до конца', 'Прибрано не до кінця', 'Partly wiped') : T('Испортили — след стал заметнее', 'Зіпсували — слід став помітнішим', 'Botched — the trace is more obvious now'), res.res === 'clean' ? 'g' : 'r');
      rerender();
    },
    pcplug: (id) => openDesktopOn(id),
    accshop: (id) => { const it = getItem(id); HV.cat = 'phacc'; HVA.m = it?.m || null; openApp('hw'); },
    accglass: async (id) => {
      const it = getItem(id); if (!it) return;
      const tier = await pickTier(it, 'glass'); if (!tier) return;
      const r = await playMini('glass', { title: T('Клеим стекло', 'Клеїмо скло', 'Sticking the glass'), pass: 0.6 });
      if (r.quit) return;
      const f = fitAcc(id, 'glass', tier, r.score);
      if (!f.ok) return toast(f.msg || '—', 'r');
      toast(f.res === 'ruined' ? T('Стекло испорчено', 'Скло зіпсовано', 'The glass is ruined') : f.res === 'bubble' ? T('Наклеено, но с пузырями', 'Наклеєно, але з бульбашками', 'Stuck on, with bubbles') : T('Стекло наклеено идеально', 'Скло наклеєно ідеально', 'Glass applied perfectly'), f.res === 'ruined' ? 'r' : 'g');
      rerender();
    },
    acccase: async (id) => { const it = getItem(id); if (!it) return; const tier = await pickTier(it, 'case'); if (!tier) return; const f = fitAcc(id, 'case', tier); if (f.ok) { sfx('ok'); toast(T('Чехол надет', 'Чохол вдягнено', 'Case on'), 'g'); } else toast(f.msg || '—', 'r'); rerender(); },
    accunglass: async (id) => { if (await confirmBox(T('Снять стекло?', 'Зняти скло?', 'Peel the glass off?'), T('Стекло одноразовое — после снятия его только выбросить.', 'Скло одноразове — після зняття його тільки викинути.', 'Glass is single‑use — it goes in the bin.'), T('Снять', 'Зняти', 'Peel off'))) { removeAcc(id, 'glass'); rerender(); } },
    accuncase: (id) => { removeAcc(id, 'case'); toast(T('Чехол снят и лежит на складе', 'Чохол знято, він на складі', 'Case off, back in stock'), 'g'); rerender(); },
    trash: async (id) => { if (await confirmBox(T('Выбросить вещь?', 'Викинути річ?', 'Throw it away?'), T('Её не вернуть.', 'Її не повернути.', 'This can’t be undone.'), T('Выбросить', 'Викинути', 'Throw away'), undefined, true)) { unlist(id); removeItem(id); back(); } },
  },
};
