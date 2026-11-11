// Local classifieds app (Авитон / ОЛІКС / CraigBoard …): feed, listing, chats & haggling, my listings, seller profile.
import { G, emit, on } from '../core/state.js';
import { T, L, clockDur } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { CATS, CAT_LIST } from '../data/catalog.js';
import { fmt, nicePrice } from '../core/money.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, askPrice, choose, confirmBox, openApp, ago, UI, replace } from '../ui/shell.js';
import { img, tile, tags, specs, defectList, empty, avatar, stars, gallery } from '../ui/comp.js';
import { listingViews } from '../data/views.js';
import { hashStr } from '../core/rng.js';
import { feedFor, feedTimeLeft, findListing, isBelowMarket, marketEstimate, listingDesc, openBuyChat, sellerRespond, DISTRICTS, pickupInfo } from '../game/market.js';
import { chatGreet, chatPersuade, chatCounter, chatAccept, chatDecline, completeSale, scamClick, scamReport, resolveClaim, myListing, unlist, PLATFORMS } from '../game/sell.js';
import { itemTitle, itemSub, isVehicle } from '../game/items.js';
import { getItem, repScore, getStat } from '../game/player.js';
import { traitName, TRAITS } from '../game/npc.js';
import { playMini } from '../mini/engine.js';
import { regName, regColors, cityName, buyFlow, inspectFlow, legitFlow, sellFlow, region } from './common.js';
import { sfx } from '../ui/sfx.js';

const F = { q: '', cat: 'all', sort: 'new' };
const SORTS = { new: ['Сначала новые', 'Спочатку нові', 'Newest first'], cheap: ['Дешевле', 'Дешевше', 'Cheapest'], exp: ['Дороже', 'Дорожче', 'Most expensive'], deal: ['Выгодные', 'Вигідні', 'Best deals'] };
const gal = { id: null, i: 0, n: 1 };
const unreadChats = () => G.s.chats.filter((c) => c.unread && c.st !== 'closed').length;

function feedView() {
  const s = G.s;
  const f = feedFor();
  let items = f.items.filter((l) => !(l.sold && l.buyer === 'me'));
  if (F.cat === 'fav') items = items.filter((l) => s.favs.includes(l.id));
  else if (F.cat !== 'all') items = items.filter((l) => l.item.cat === F.cat);
  if (F.q) { const q = F.q.toLowerCase(); items = items.filter((l) => itemTitle(l.item).toLowerCase().includes(q)); }
  const est = (l) => marketEstimate(l.item, l.city);
  if (F.sort === 'new') items.sort((a, b) => b.posted - a.posted);
  if (F.sort === 'cheap') items.sort((a, b) => a.price - b.price);
  if (F.sort === 'exp') items.sort((a, b) => b.price - a.price);
  if (F.sort === 'deal') items.sort((a, b) => a.price / est(a) - b.price / est(b));
  const cats = ['all', 'fav', ...CAT_LIST.filter((c) => f.items.some((l) => l.item.cat === c))];
  const chips = cats.map((c) => `<button class="chip${F.cat === c ? ' on' : ''}" data-a="cat" data-v="${c}">${c === 'all' ? T('Все', 'Усі', 'All') : c === 'fav' ? T('Избранное', 'Обране', 'Favourites') : `${CATS[c].icon} ${esc(L(CATS[c].name))}`}</button>`).join('');
  return `<div class="search"><label class="box">${icon('search')}<input placeholder="${T('Поиск по объявлениям', 'Пошук оголошень', 'Search listings')}" value="${esc(F.q)}" data-in="q"></label><div class="tmr">${icon('clock')}<span data-cd="${f.refreshAt}">${clockDur(feedTimeLeft())}</span></div></div>
    <div class="chips">${chips}</div>
    <div class="row between mb"><span class="small m">${T('Найдено', 'Знайдено', 'Found')}: ${items.length} · ${esc(cityName())}</span><button class="b bold" data-a="sort" style="font-size:16px">${esc(L(SORTS[F.sort]))} ⇅</button></div>
    ${items.length ? `<div class="tiles">${items.map((l) => tile(l.item, { id: l.id, price: l.price, sub: `${esc(L(DISTRICTS[l.dist]))} · ${ago(l.posted)}`, below: !l.sold && isBelowMarket(l), fav: s.favs.includes(l.id), sold: l.sold ? T('ПРОДАНО', 'ПРОДАНО', 'SOLD') : '' })).join('')}</div>` : empty('search', T('Ничего не найдено', 'Нічого не знайдено', 'Nothing found'), T('Лента обновится по таймеру.', 'Стрічка оновиться за таймером.', 'The feed refreshes on a timer.'))}`;
}

function itemView(p) {
  const l = findListing(p.id);
  if (!l) return empty('box', T('Объявление снято', 'Оголошення знято', 'Listing removed'));
  const it = l.item;
  if (gal.id !== l.id) { gal.id = l.id; gal.i = 0; }
  const photos = listingViews(it, hashStr(String(l.id)));
  gal.n = photos.length;
  const est = marketEstimate(it, l.city);
  const pi = pickupInfo(l);
  const sel = l.seller;
  const chat = G.s.chats.find((c) => c.kind === 'buy' && c.ref === l.id);
  const price = chat?.st === 'deal' ? chat.deal : l.price;
  return `${gallery(it, photos, gal.i)}
    <div class="price-big">${fmt(price)}${price !== l.price ? ` <s class="small m">${fmt(l.price)}</s>` : ''}</div>
    <div style="font-size:18px;margin:4px 0">${esc(itemTitle(it))}</div>
    <div class="small m">${esc(itemSub(it))} · ${esc(L(DISTRICTS[l.dist]))} · ${ago(l.posted)} · 👁 ${l.views}</div>
    ${tags(it, { below: isBelowMarket(l) })}
    <div class="card mt"><div class="row between"><span class="m">${T('Рыночная оценка', 'Ринкова оцінка', 'Market estimate')}</span><b>≈ ${fmt(est)}</b></div><div class="small ${price < est ? 'g' : 'r'}">${price < est ? T(`Потенциальная выгода ≈ ${fmt(est - price)}`, `Потенційна вигода ≈ ${fmt(est - price)}`, `Potential margin ≈ ${fmt(est - price)}`) : T('Дороже рынка', 'Дорожче ринку', 'Above market')}</div></div>
    ${l.sold ? `<div class="card warn"><b>${T('Продано', 'Продано', 'Sold')}</b> <span class="m">${esc(l.buyer === 'me' ? T('вам', 'вам', 'to you') : l.buyer)}</span></div>` : `
    <div class="btns"><button class="btn ghost" data-a="chat" data-v="${l.id}">${icon('chat')} ${T('Написать', 'Написати', 'Message')}</button><button class="btn" data-a="buy" data-v="${l.id}">${T('Купить', 'Купити', 'Buy')}</button></div>
    <div class="btns"><button class="btn dark" data-a="inspect" data-v="${l.id}">🔍 ${it.inspected ? T('Осмотрено', 'Оглянуто', 'Inspected') : T('Осмотреть', 'Оглянути', 'Inspect')} <span class="small m">${fmt(pi.fare)}</span></button>${['bags', 'watches', 'sneakers', 'jewelry', 'clothing', 'perfume', 'cards', 'accessories', 'art', 'antiques', 'toys', 'collectibles'].includes(it.cat) && G.s.level >= 2 ? `<button class="btn dark" data-a="legit" data-v="${l.id}">🔎 ${T('Легит‑чек', 'Легіт‑чек', 'Legit')}</button>` : ''}</div>`}
    <h3 class="sub">${T('Продавец', 'Продавець', 'Seller')}</h3>
    <div class="card row">${avatar(sel.name, sel.hue)}<div class="grow"><b>${esc(sel.name)}</b><div class="small m">${esc(traitName(sel.trait))} · ★ ${sel.rating} · ${sel.deals} ${T('сделок', 'угод', 'deals')}</div></div></div>
    <h3 class="sub">${T('Описание', 'Опис', 'Description')}</h3><div class="card">${esc(listingDesc(l))}</div>
    <h3 class="sub">${T('Состояние', 'Стан', 'Condition')}</h3>${defectList(it)}
    <h3 class="sub">${T('Характеристики', 'Характеристики', 'Specs')}</h3><div class="card">${specs(it)}</div>`;
}

function chatsView() {
  const list = G.s.chats.slice().sort((a, b) => (b.msgs[b.msgs.length - 1]?.t || b.t) - (a.msgs[a.msgs.length - 1]?.t || a.t));
  if (!list.length) return `<h2 class="sec">${T('Сообщения', 'Повідомлення', 'Messages')}</h2><p class="p">${T('Здесь и продавцы, у которых вы покупаете, и покупатели ваших вещей. Переписка с продавцами пропадает, когда лента обновляется.', 'Тут і продавці, у яких ви купуєте, і покупці ваших речей. Листування з продавцями зникає після оновлення стрічки.', 'Sellers you buy from and buyers of your items. Seller chats vanish when the feed refreshes.')}</p>` + empty('chat', T('Пока пусто', 'Поки порожньо', 'Nothing yet'), T('Выставьте вещь на продажу — покупатели напишут.', 'Виставте річ на продаж — покупці напишуть.', 'List an item and buyers will write.'));
  return `<h2 class="sec">${T('Сообщения', 'Повідомлення', 'Messages')}</h2>` + list.map((c) => {
    const last = c.msgs[c.msgs.length - 1];
    const role = c.kind === 'buy' ? T('продаёт', 'продає', 'selling') : c.kind === 'claim' ? T('претензия', 'претензія', 'complaint') : T('покупает', 'купує', 'buying');
    const tr = c.npc.trait ? ` · ${traitName(c.npc.trait)}` : '';
    return `<div class="list-item" data-a="go" data-v="chat" data-id="${c.id}" style="${c.st === 'closed' ? 'opacity:.55' : ''}">${avatar(c.npc.name, c.npc.hue)}<div class="grow"><div class="t">${esc(c.npc.name)} <span class="${c.kind === 'claim' ? 'r' : 'g'} small">${role}${esc(tr)}</span></div><div class="s">${esc(c.title)}</div><div class="s" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(last?.tx || '')}</div></div>${c.unread ? '<span class="tag r">●</span>' : ''}</div>`;
  }).join('');
}

function chatView(p) {
  const c = G.s.chats.find((x) => x.id === p.id);
  if (!c) return empty('chat', T('Чат не найден', 'Чат не знайдено', 'Chat not found'));
  c.unread = 0;
  const l = c.kind === 'buy' ? findListing(c.ref) : null;
  const it = c.kind === 'sell' ? getItem(c.itemId) : c.kind === 'buy' ? l?.item || c.itemSnap : c.sale?.itemSnap;
  const top = it ? `<div class="chat-top"><div class="th">${img(it)}</div><div class="grow"><b style="font-size:18px">${c.kind === 'sell' ? T('Ваша цена', 'Ваша ціна', 'Your price') : T('Цена', 'Ціна', 'Price')}: ${fmt(c.kind === 'sell' ? c.ask : c.kind === 'buy' ? (c.deal || c.ask) : c.sale.price)}</b><div class="small m">${esc(c.title)}</div></div></div>` : '';
  const msgs = c.msgs.map((m) => `<div class="msg ${m.f}">${m.link ? esc(m.tx).replace(esc(m.link), `<a class="link">${esc(m.link)}</a>`) : esc(m.tx)}<span class="tm">${new Date(0, 0, 0, Math.floor((m.t % 1440) / 60), m.t % 60).toTimeString().slice(0, 5)}</span></div>`).join('');
  let opts = '';
  const O = (a, label, cls = '') => `<button class="opt ${cls}" data-a="${a}" data-v="${c.id}">${label}</button>`;
  if (c.kind === 'sell' && c.st === 'open') {
    if (!c.greeted) opts += O('greet', T('Здравствуйте! Да, ещё продаётся.', 'Добрий день! Так, ще продається.', 'Hello! Yes, still available.'));
    opts += O('accept', T(`Согласен, продам за ${fmt(c.offer)}`, `Згоден, продам за ${fmt(c.offer)}`, `Deal, I’ll sell for ${fmt(c.offer)}`), 'solid');
    opts += O('counter', T('Предложить свою цену', 'Запропонувати свою ціну', 'Counter‑offer'));
    if (c.persuaded < 2) opts += O('persuade', `🎯 ${T('Убедить (торг)', 'Переконати (торг)', 'Persuade (haggle)')}`);
    opts += O('decline', T('Нет, спасибо', 'Ні, дякую', 'No, thanks'));
  } else if (c.kind === 'sell' && c.st === 'agreed') {
    opts += O('ship', `📦 ${T('Упаковать и отправить', 'Запакувати й відправити', 'Pack & ship')}`, 'solid');
    if (it && (it.loc || G.s.player.city) === G.s.player.city) opts += O('meet', `🤝 ${T('Встретиться лично (деньги сразу)', 'Зустрітися особисто (гроші одразу)', 'Meet in person (cash now)')}`);
  } else if (c.st === 'scam') {
    opts += O('scamclick', `🔗 ${T('Перейти по ссылке', 'Перейти за посиланням', 'Open the link')}`, 'red');
    opts += O('scamreport', `🛡 ${T('Это развод — пожаловаться', 'Це розвод — поскаржитися', 'It’s a scam — report')}`, 'solid');
  } else if (c.kind === 'claim' && c.st === 'claim') {
    opts += O('refund', T('Вернуть деньги (вещь вернётся)', 'Повернути гроші (річ повернеться)', 'Refund (item comes back)'), 'solid');
    opts += O('partial', T('Предложить компенсацию', 'Запропонувати компенсацію', 'Offer partial compensation'));
    opts += O('refuse', T('Отказать', 'Відмовити', 'Refuse'), 'red');
  } else if (c.kind === 'buy' && (c.st === 'open' || c.st === 'deal') && l && !l.sold) {
    if (!c.msgs.length) opts += O('bhello', T('Здравствуйте! Ещё актуально?', 'Добрий день! Ще актуально?', 'Hi! Still available?'));
    if (c.st === 'deal') opts += O('bbuy', T(`Беру за ${fmt(c.deal)}`, `Беру за ${fmt(c.deal)}`, `I’ll take it for ${fmt(c.deal)}`), 'solid');
    else { opts += O('boffer', T('Предложить цену', 'Запропонувати ціну', 'Make an offer')); opts += O('bbuy', T(`Купить за ${fmt(c.ask)}`, `Купити за ${fmt(c.ask)}`, `Buy for ${fmt(c.ask)}`), 'solid'); }
  }
  return `${top}<div class="msgs">${msgs || `<div class="msg sys">${T('Начните диалог', 'Почніть діалог', 'Start the conversation')}</div>`}</div>${opts ? `<div class="opts">${opts}</div>` : `<div class="msg sys" style="margin:10px auto">${T('Диалог завершён', 'Діалог завершено', 'Conversation closed')}</div>`}`;
}

function mineView() {
  const s = G.s;
  const list = s.listings.map((l) => ({ l, it: getItem(l.itemId) })).filter((x) => x.it);
  const auc = s.inv.filter((i) => i.auction);
  return `<h2 class="sec">${T('Мои объявления', 'Мої оголошення', 'My listings')}</h2><p class="p">${T('Склад', 'Склад', 'Storage')}: ${s.inv.filter((i) => !i.shop).length} ${T('вещей', 'речей', 'items')}. ${T('Выставить новую вещь можно из «Склада».', 'Виставити нову річ можна зі «Складу».', 'List new items from Storage.')}</p>
    <button class="btn block mb" data-a="open" data-v="inventory">${icon('archive')} ${T('Открыть склад', 'Відкрити склад', 'Open storage')}</button>
    ${list.length ? list.map(({ l, it }) => `<div class="list-item" data-a="open" data-v="inventory" data-w="item" data-p='${JSON.stringify({ id: it.id })}'><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${fmt(l.price)} · ${esc(PLATFORMS[l.platform]?.n(region()) || '')} · 👁 ${l.views} · 💬 ${l.offers}</div><div class="s">${l.disclose ? T('дефекты указаны', 'дефекти вказано', 'issues disclosed') : `<span class="o">${T('дефекты скрыты', 'дефекти приховано', 'issues hidden')}</span>`}</div></div><button class="btn xs dark" data-a="unlist" data-v="${it.id}">✕</button></div>`).join('') : empty('tag', T('Нет активных объявлений', 'Немає активних оголошень', 'No active listings'))}
    ${auc.length ? `<h3 class="sub">${T('На аукционе', 'На аукціоні', 'At auction')}</h3>` + auc.map((it) => `<div class="list-item"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${T('Ставка', 'Ставка', 'Bid')}: ${it.auction.bid ? fmt(it.auction.bid) : '—'} · ${it.auction.bids} · <span data-cd="${it.auction.end}"></span></div></div></div>`).join('') : ''}`;
}

function profileView() {
  const s = G.s;
  const r = s.rep;
  const sc = repScore();
  return `<div class="card center"><div class="avatar" style="width:72px;height:72px;font-size:30px;margin:0 auto 8px;background:hsl(${s.player.avatar} 40% 20%);color:hsl(${s.player.avatar} 80% 70%)">${esc(s.player.name[0])}</div><h3>${esc(s.player.name)}</h3><div class="y" style="font-size:22px">${r.n ? stars(sc) : '☆☆☆☆☆'}</div><div class="small m">${r.n ? `${sc.toFixed(2)} · ${r.n} ${T('отзывов', 'відгуків', 'reviews')}` : T('Пока нет отзывов', 'Поки немає відгуків', 'No reviews yet')}</div></div>
    <div class="stats"><div class="stat"><small>${T('Продано', 'Продано', 'Sold')}</small><b>${getStat('sold')}</b></div><div class="stat"><small>${T('Куплено', 'Куплено', 'Bought')}</small><b>${getStat('bought')}</b></div><div class="stat"><small>${T('Прибыль', 'Прибуток', 'Profit')}</small><b class="g">${fmt(getStat('profit'))}</b></div><div class="stat"><small>${T('Лучшая сделка', 'Найкраща угода', 'Best flip')}</small><b>${fmt(s.stats.bestFlip || 0)}</b></div></div>
    <h3 class="sub">${T('Отзывы', 'Відгуки', 'Reviews')}</h3>${(r.reviews || []).map((x) => `<div class="card"><div class="y">${stars(x.stars)}</div><div>${esc(x.text)}</div><div class="tiny m">${ago(x.t)}</div></div>`).join('') || `<p class="p">${T('Продавайте честно — и отзывы будут хорошими.', 'Продавайте чесно — і відгуки будуть добрими.', 'Sell honestly to earn good reviews.')}</p>`}`;
}

export default {
  id: 'market', glyph: 'tag', lvl: 1,
  name: () => regName('classifieds'), colors: () => regColors('classifieds'), accent: '#4b8dff',
  dark: () => true,
  tabs: [
    { v: 'main', label: ['Объявления', 'Оголошення', 'Listings'], icon: 'grid' },
    { v: 'chats', label: ['Сообщения', 'Повідомлення', 'Messages'], icon: 'chat', badge: unreadChats },
    { v: 'mine', label: ['Мои', 'Мої', 'Mine'], icon: 'tag' },
    { v: 'profile', label: ['Профиль', 'Профіль', 'Profile'], icon: 'user' },
  ],
  tabOf: (v) => (v === 'item' ? 'main' : v === 'chat' ? 'chats' : v),
  badge: unreadChats,
  title: (v) => (v === 'chat' ? (G.s.chats.find((c) => c.id === UI.params.id)?.npc.name || '') : regName('classifieds')),
  sub: (v) => { if (v !== 'chat') return ''; const c = G.s.chats.find((x) => x.id === UI.params.id); return c ? `${c.kind === 'buy' ? T('Продавец', 'Продавець', 'Seller') : T('Покупатель', 'Покупець', 'Buyer')}${c.npc.trait ? ' · ' + esc(traitName(c.npc.trait)) : ''}` : ''; },
  views: { main: feedView, item: itemView, chats: chatsView, chat: chatView, mine: mineView, profile: profileView },
  inputs: { q: (v) => { F.q = v; clearTimeout(F._t); F._t = setTimeout(() => { const el = document.activeElement; rerender(); setTimeout(() => { const i = document.querySelector('[data-in="q"]'); if (i && el?.dataset?.in === 'q') { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 30); }, 350); } },
  actions: {
    cat: (v) => { F.cat = v; rerender(); },
    sort: async () => { const v = await choose(T('Сортировка', 'Сортування', 'Sort'), Object.entries(SORTS).map(([k, n]) => ({ v: k, label: L(n), cls: k === F.sort ? '' : 'dark' }))); if (v) { F.sort = v; rerender(); } },
    fav: (v, el, ev) => { ev.stopPropagation(); const f = G.s.favs; const i = f.indexOf(v); if (i >= 0) f.splice(i, 1); else f.push(v); sfx('tap'); rerender(); },
    gal: (v) => { gal.i = (gal.i + +v + gal.n) % gal.n; rerender(); },
    buy: async (v) => { const l = findListing(v); if (!l) return; const c = G.s.chats.find((x) => x.kind === 'buy' && x.ref === l.id && x.st === 'deal'); if (await buyFlow(l, c ? c.deal : l.price)) { if (c) c.st = 'closed'; rerender(); } },
    chat: (v) => { const l = findListing(v); if (!l) return; const c = openBuyChat(l); go('chat', { id: c.id }); },
    inspect: async (v) => {
      const l = findListing(v); if (!l || l.sold) return;
      const pi = pickupInfo(l);
      if (!l.item.inspected) {
        if (G.s.energy < pi.energy) return toast(T('Нет сил — отдохните', 'Немає сил — відпочиньте', 'Too tired — rest first'), 'r');
        const { spend } = await import('../game/player.js');
        if (!spend(pi.fare, 'travel', T('Дорога на осмотр', 'Дорога на огляд', 'Trip to inspect'))) return toast(T('Не хватает на дорогу', 'Не вистачає на дорогу', 'Can’t afford the fare'), 'r');
        G.s.energy = clamp(G.s.energy - pi.energy, 0, 100);
      }
      await inspectFlow(l.item, itemTitle(l.item));
    },
    legit: async (v) => { const l = findListing(v); if (l) await legitFlow(l.item, itemTitle(l.item)); },
    unlist: (v, el, ev) => { ev.stopPropagation(); unlist(v); toast(T('Снято с продажи', 'Знято з продажу', 'Unlisted')); rerender(); },
    // sell-side chat
    greet: (id) => { chatGreet(chat(id)); sfx('tap'); rerender(); },
    accept: (id) => { chatAccept(chat(id)); rerender(); },
    decline: (id) => { chatDecline(chat(id)); rerender(); },
    counter: async (id) => { const c = chat(id); const p = await askPrice({ title: T('Ваша цена', 'Ваша ціна', 'Your price'), value: nicePrice((c.offer + c.ask) / 2), min: 1, max: c.ask * 1.5 }); if (p) { chatCounter(c, p); sfx('tap'); rerender(); } },
    persuade: async (id) => { const c = chat(id); const r = await playMini('timing', { title: T('Торг: убеждение', 'Торг: переконання', 'Haggle: persuade'), rounds: 2, label: T('Попадите в зелёную зону — аргумент сработает', 'Влучте в зелену зону — аргумент спрацює', 'Hit the green zone to land your argument') }); if (!r.quit) chatPersuade(c, r.score); rerender(); },
    ship: async (id) => { const c = chat(id); const r = await playMini('pack', { title: T('Упаковка', 'Пакування', 'Packing'), pass: 0.5 }); completeSale(c, 'ship', r.quit ? 0.3 : r.score); sfx('ok'); toast(T('Отправлено! Деньги придут после доставки', 'Відправлено! Гроші прийдуть після доставки', 'Shipped! Paid on delivery'), 'g'); rerender(); },
    meet: (id) => { completeSale(chat(id), 'meet'); sfx('cash'); rerender(); },
    scamclick: (id) => { const loss = scamClick(chat(id)); toast(`−${fmt(loss)}`, 'r'); sfx('lose'); rerender(); },
    scamreport: (id) => { scamReport(chat(id)); sfx('win'); rerender(); },
    refund: (id) => { resolveClaim(chat(id), 'refund'); rerender(); },
    partial: (id) => { resolveClaim(chat(id), 'partial'); rerender(); },
    refuse: async (id) => { if (await confirmBox(T('Отказать в возврате?', 'Відмовити в поверненні?', 'Refuse the refund?'), T('Покупатель оставит плохой отзыв, а за подделки может прийти штраф.', 'Покупець залишить поганий відгук, а за підробки може бути штраф.', 'Expect a bad review; fakes can bring fines.'), T('Отказать', 'Відмовити', 'Refuse'), undefined, true)) { resolveClaim(chat(id), 'refuse'); rerender(); } },
    // buy-side chat
    bhello: (id) => { const c = chat(id); const l = findListing(c.ref); c.msgs.push({ f: 'me', tx: T('Здравствуйте! Ещё актуально?', 'Добрий день! Ще актуально?', 'Hi! Still available?'), t: G.s.t }); if (l) c.msgs.push({ f: 'them', tx: l.sold ? T('Уже продано', 'Вже продано', 'Already sold') : T(`Да, актуально. ${fmt(c.ask)}.`, `Так, актуально. ${fmt(c.ask)}.`, `Yes. ${fmt(c.ask)}.`), t: G.s.t }); rerender(); },
    boffer: async (id) => { const c = chat(id); const l = findListing(c.ref); if (!l) return; const p = await askPrice({ title: T('Ваше предложение', 'Ваша пропозиція', 'Your offer'), value: nicePrice(c.ask * 0.85), min: 1, max: c.ask }); if (!p) return; c.msgs.push({ f: 'me', tx: T(`Отдадите за ${fmt(p)}?`, `Віддасте за ${fmt(p)}?`, `Would you take ${fmt(p)}?`), t: G.s.t }); const r = sellerRespond(c, l, p); sfx(r === 'yes' ? 'ok' : 'tap'); rerender(); },
    bbuy: async (id) => { const c = chat(id); const l = findListing(c.ref); if (!l) return; if (await buyFlow(l, c.st === 'deal' ? c.deal : c.ask)) { c.st = 'closed'; c.msgs.push({ f: 'sys', tx: T('Сделка состоялась', 'Угода відбулася', 'Deal done'), t: G.s.t }); rerender(); } },
  },
};
const chat = (id) => G.s.chats.find((c) => c.id === id);
