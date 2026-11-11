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
    ${it.cat === 'phones' ? `<div class="btns">${btn('lab', `${icon('lockphone')} Phone Lab${it.lock ? ' 🔒' : ''}`, 'dark', s.level < 2)}</div>` : ''}
    ${isVehicle(it) ? `<div class="btns">${btn('drive', s.car === it.id ? `🔑 ${T('Основной транспорт', 'Основний транспорт', 'Main vehicle')}` : `🔑 ${T('Ездить на нём', 'Їздити на ньому', 'Use as my ride')}`, s.car === it.id ? 'green' : 'dark')}</div>` : ''}
    ${slots.length ? `<div class="btns">${btn('coll', `🏆 ${T('В коллекцию', 'До колекції', 'Add to collection')}: ${esc(L(slots[0].set.n))}`, 'yel')}</div>` : ''}
    ${shops.length && !l ? `<div class="btns">${btn('toshop', `${icon('store')} ${T('В магазин', 'У магазин', 'Stock in store')}`)}</div>` : ''}
    ${!here ? `<div class="card warn mt small">📍 ${T('Вещь находится в городе', 'Річ знаходиться в місті', 'Item is in')} ${esc(L(CITY[it.loc]?.name || ''))}. ${T('Продажа отсюда — с доставкой между городами.', 'Продаж звідси — з доставкою між містами.', 'Selling from here ships between cities.')}</div>` : ''}
    <h3 class="sub">${T('Состояние', 'Стан', 'Condition')}</h3>${defectList(it)}
    <h3 class="sub">${T('Характеристики', 'Характеристики', 'Specs')}</h3><div class="card">${specs(it)}</div>
    <button class="btn dark block mt" data-a="trash" data-v="${it.id}">🗑 ${T('Выбросить', 'Викинути', 'Throw away')}</button>`;
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
  tabOf: (v) => (v === 'item' ? 'main' : v),
  views: { main: mainView, item: itemView, sale: saleView, coll: collView },
  actions: {
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
    trash: async (id) => { if (await confirmBox(T('Выбросить вещь?', 'Викинути річ?', 'Throw it away?'), T('Её не вернуть.', 'Її не повернути.', 'This can’t be undone.'), T('Выбросить', 'Викинути', 'Throw away'), undefined, true)) { unlist(id); removeItem(id); back(); } },
  },
};
