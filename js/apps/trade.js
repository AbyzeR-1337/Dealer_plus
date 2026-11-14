// Auctions app and Marketplace app (mystery boxes, wholesale lots, new goods & import).
import { G, emit } from '../core/state.js';
import { T, L, dur, clockDur } from '../core/i18n.js';
import { esc, clamp, uid } from '../core/util.js';
import { RNG } from '../core/rng.js';
import { fmt, nicePrice } from '../core/money.js';
import { CATS, RARITY } from '../data/catalog.js';
import { countryOf } from '../data/world.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, askPrice, confirmBox, sheet, closeSheet, UI, gameDate } from '../ui/shell.js';
import { img, empty, tags, specs, defectList } from '../ui/comp.js';
import { itemTitle, itemSub, itemValue, makeItem, isVehicle, rarityName } from '../game/items.js';
import { auctions, minNext, placeBid, BOXES, rollBox, buyBox, takeBoxPrize, wholesale, buyWholesale } from '../game/sources.js';
import { getItem } from '../game/player.js';
import { canStore, spend, stat, addXP, addItem } from '../game/player.js';
import { deliveryTime } from '../game/market.js';
import { regName, regColors } from './common.js';
import { sfx } from '../ui/sfx.js';
import { itemSVG } from '../ui/art.js';

// ---------------------------------------------------------------- AUCTIONS
function lotCard(lot) {
  const s = G.s;
  const title = lot.container ? T(`Контейнер · ${lot.items.length} вещей`, `Контейнер · ${lot.items.length} речей`, `Storage unit · ${lot.items.length} items`) : itemTitle(lot.item);
  const pic = lot.container ? `<div style="width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(160deg,#5a5040,#2a2418);font-size:54px">📦<div class="tiny m" style="position:absolute;bottom:8px">${lot.hint.map((c) => CATS[c].icon).join(' ')} …</div></div>` : img(lot.item, { tilt: true });
  return `<div class="tile" data-a="go" data-v="lot" data-id="${lot.id}"><div class="img" style="position:relative">${pic}${lot.done ? `<div class="sold">${lot.won ? T('ВАШ', 'ВАШ', 'WON') : T('ЗАКРЫТ', 'ЗАКРИТО', 'CLOSED')}</div>` : ''}</div><div class="pr">${fmt(lot.bid)}</div><div class="nm">${esc(title)}</div><div class="ct">${lot.done ? '—' : `⏱ <span data-cd="${lot.end}"></span>`} · ${lot.mine ? `<span class="g">${T('ваша ставка', 'ваша ставка', 'your bid')}</span>` : esc(lot.bidder || T('нет ставок', 'немає ставок', 'no bids'))}</div></div>`;
}
function aucMain() {
  const A = auctions();
  const lots = A.lots.filter((l) => !l.done || l.mine);
  return `<button class="dr-tab" data-a="audrawer">📋<small>${drCount()}</small></button><p class="p">${T('Торги идут в реальном времени. Ставка в последние секунды продлевает аукцион. «Контейнеры» — кот в мешке: внутри может быть хлам или сокровище.', 'Торги йдуть у реальному часі. Ставка в останні секунди подовжує аукціон.', 'Live bidding. Last‑second bids extend the timer. Storage units are a gamble.')}</p><div class="tiles">${lots.map(lotCard).join('')}</div>`;
}
function lotView(p) {
  const A = auctions();
  const lot = A.lots.find((l) => l.id === p.id);
  if (!lot) return empty('gavel', T('Лот не найден', 'Лот не знайдено', 'Lot not found'));
  const s = G.s;
  const next = minNext(lot);
  const head = lot.container ? `<div class="card center" style="background:linear-gradient(160deg,#5a5040,#2a2418)"><div style="font-size:80px">📦</div><b>${T('Контейнер с неизвестным содержимым', 'Контейнер з невідомим вмістом', 'Unknown storage unit')}</b><div class="small m">${T('Видно', 'Видно', 'Visible')}: ${lot.hint.map((c) => `${CATS[c].icon} ${L(CATS[c].name)}`).join(', ')} · ${T('мест на складе', 'місць на складі', 'storage units')}: ${lot.units}</div></div>` : `<div class="gallery"><div class="gimg">${img(lot.item)}</div></div><div style="font-size:18px;font-weight:700">${esc(itemTitle(lot.item))}</div><div class="small m">${esc(itemSub(lot.item))}</div>${tags(lot.item)}`;
  return `${head}
    <div class="card mt"><div class="row between"><span class="m">${T('Текущая ставка', 'Поточна ставка', 'Current bid')}</span><b style="font-size:24px">${fmt(lot.bid)}</b></div><div class="row between"><span class="m">${T('Лидер', 'Лідер', 'Leader')}</span><b class="${lot.mine ? 'g' : ''}">${esc(lot.mine ? T('Вы', 'Ви', 'You') : lot.bidder || '—')}</b></div><div class="row between"><span class="m">${T('До конца', 'До кінця', 'Ends in')}</span><b class="mono" data-cd="${lot.end}" data-done="${T('завершён', 'завершено', 'ended')}"></b></div></div>
    ${lot.done ? `<div class="card ${lot.won ? 'hl' : 'warn'}">${lot.won ? T('Вы выиграли! Вещи на складе.', 'Ви виграли! Речі на складі.', 'You won! Items are in storage.') : lot.failed ? T('Лот аннулирован (нет денег/места)', 'Лот анульовано', 'Cancelled (no money/space)') : T('Аукцион завершён', 'Аукціон завершено', 'Auction ended')}</div>` : `<div class="btns"><button class="btn" data-a="bid" data-v="${lot.id}" data-w="${next}">${T('Ставка', 'Ставка', 'Bid')} ${fmt(next)}</button><button class="btn dark" data-a="bidc" data-v="${lot.id}">${T('Своя', 'Своя', 'Custom')}</button></div><div class="small m mt">${T('Баланс', 'Баланс', 'Balance')}: ${fmt(s.money)}</div>`}
    ${!lot.container ? `<h3 class="sub">${T('Состояние', 'Стан', 'Condition')}</h3>${defectList(lot.item, false)}<div class="card mt">${specs(lot.item)}</div>` : ''}`;
}
// ---------------------------------------------------------------- "My lots" panel on the right: your bids, your own
// items on auction, the bid history of each lot, current prices and how the finished ones went
const hm = (t) => `${String(Math.floor((t % 1440) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const lotTitle = (lot) => (lot.container ? T(`Контейнер · ${lot.items.length} вещей`, `Контейнер · ${lot.items.length} речей`, `Storage unit · ${lot.items.length} items`) : itemTitle(lot.item));
function histHTML(h) {
  if (!h?.length) return `<div class="dr-h m">${T('Ставок ещё нет', 'Ставок ще немає', 'No bids yet')}</div>`;
  return h.slice(-6).reverse().map((x, i) => `<div class="dr-h ${x.me ? 'me' : ''} ${i === 0 ? 'top' : ''}"><span>${hm(x.t)}</span><span>${esc(x.me ? T('Вы', 'Ви', 'You') : x.who)}</span><b>${fmt(x.amt)}</b></div>`).join('');
}
const myLots = () => auctions().lots.filter((l) => l.touched && !l.done);
const myOwn = () => (G.s.ownAuctions || []).filter((a) => !a.done && getItem(a.itemId));
function drawerHTML() {
  const s = G.s, mine = myLots(), own = myOwn(), log = s.aucLog || [];
  const frozen = mine.filter((l) => l.mine).reduce((a, l) => a + l.bid, 0);
  let h = `<div class="dr-sum"><div><small>${T('Лидирую', 'Лідирую', 'Leading')}</small><b class="g">${mine.filter((l) => l.mine).length}</b></div><div><small>${T('Перебили', 'Перебили', 'Outbid')}</small><b class="r">${mine.filter((l) => !l.mine).length}</b></div><div><small>${T('В ставках', 'У ставках', 'In bids')}</small><b>${fmt(frozen)}</b></div></div>`;
  h += `<div class="dr-sec">🔨 ${T('Мои ставки', 'Мої ставки', 'My bids')}</div>` + (mine.length ? mine.map((l) => `<div class="dr-card ${l.mine ? 'lead' : 'out'}" data-a="drgo" data-v="${l.id}"><div class="row between"><b>${esc(lotTitle(l))}</b><span class="tag ${l.mine ? 'g' : 'r'}">${l.mine ? T('лидирую', 'лідирую', 'leading') : T('перебили', 'перебили', 'outbid')}</span></div>
      <div class="dr-kv"><span>${T('Текущая', 'Поточна', 'Current')}</span><b>${fmt(l.bid)}</b></div><div class="dr-kv"><span>${T('Моя ставка', 'Моя ставка', 'My bid')}</span><b>${fmt(l.myBid || 0)}</b></div><div class="dr-kv"><span>${T('До конца', 'До кінця', 'Ends in')}</span><b class="mono" data-cd="${l.end}"></b></div>
      ${histHTML(l.hist)}${!l.mine ? `<button class="btn xs mt" data-a="bid" data-v="${l.id}" data-w="${minNext(l)}">${T('Перебить', 'Перебити', 'Outbid')} ${fmt(minNext(l))}</button>` : ''}</div>`).join('') : `<div class="dr-empty">${T('Вы пока ни на что не ставили', 'Ви поки ні на що не ставили', 'You haven’t bid on anything yet')}</div>`);
  h += `<div class="dr-sec">🏷 ${T('Мои вещи на аукционе', 'Мої речі на аукціоні', 'My items on auction')}</div>` + (own.length ? own.map((a) => { const it = getItem(a.itemId); const au = it.auction || {}; return `<div class="dr-card"><div class="row between"><b>${esc(itemTitle(it))}</b><span class="tag ${au.bids ? 'g' : ''}">${au.bids || 0} ${T('ставок', 'ставок', 'bids')}</span></div><div class="dr-kv"><span>${T('Старт', 'Старт', 'Start')}</span><b>${fmt(a.start)}</b></div><div class="dr-kv"><span>${T('Сейчас', 'Зараз', 'Now')}</span><b class="${au.bid ? 'g' : 'm'}">${au.bid ? fmt(au.bid) : '—'}</b></div><div class="dr-kv"><span>${T('Вам после комиссии 8%', 'Вам після комісії 8%', 'You get after 8% fee')}</span><b>${au.bid ? fmt(au.bid * 0.92) : '—'}</b></div><div class="dr-kv"><span>${T('До конца', 'До кінця', 'Ends in')}</span><b class="mono" data-cd="${a.end}"></b></div>${histHTML(a.hist)}</div>`; }).join('') : `<div class="dr-empty">${T('Выставить вещь: Склад → вещь → Продать → Аукцион', 'Виставити річ: Склад → річ → Продати → Аукціон', 'List one: Storage → item → Sell → Auction')}</div>`);
  const KIND = { won: ['🏆', T('Выиграл', 'Виграв', 'Won'), 'g'], lost: ['💨', T('Упустил', 'Упустив', 'Lost'), 'r'], sold: ['💰', T('Продал', 'Продав', 'Sold'), 'g'], nobid: ['🙈', T('Без ставок', 'Без ставок', 'No bids'), 'm'], failed: ['⛔', T('Аннулирован', 'Анульовано', 'Cancelled'), 'r'] };
  h += `<div class="dr-sec">🕘 ${T('История', 'Історія', 'History')}</div>` + (log.length ? log.slice(0, 20).map((e) => { const k = KIND[e.kind] || KIND.lost; return `<div class="dr-log"><span>${k[0]}</span><div class="grow"><b>${esc(e.title)}</b><small>${esc(k[1])}${e.kind === 'lost' && e.my ? ` · ${T('моя', 'моя', 'mine')} ${fmt(e.my)} → ${esc(e.who || '')}` : ''}${e.kind === 'sold' ? ` · ${e.bids || 0} ${T('ставок', 'ставок', 'bids')}` : ''} · ${hm(e.t)}</small></div><b class="${k[2]}">${fmt(e.net || e.price || 0)}</b></div>`; }).join('') : `<div class="dr-empty">${T('Пока пусто', 'Поки порожньо', 'Nothing yet')}</div>`);
  return h;
}
let drTimer = 0;
async function openDrawer() {
  clearInterval(drTimer);
  const p = sheet(`<div class="dr-head"><b>📋 ${T('Мои лоты', 'Мої лоти', 'My lots')}</b><button class="dr-x" data-a="closeSheet">✕</button></div><div class="dr-body">${drawerHTML()}</div>`, { cls: 'drawer-r' });
  // live: prices, leaders and timers move while the panel is open
  drTimer = setInterval(() => { const b = document.querySelector('.sheet.drawer-r .dr-body'); if (!b) { clearInterval(drTimer); return; } const top = b.scrollTop; b.innerHTML = drawerHTML(); b.scrollTop = top; }, 1000);
  await p; clearInterval(drTimer);
}
const drCount = () => myLots().length + myOwn().length;
export const auctionApp = {
  id: 'auction', glyph: 'gavel', lvl: 3,
  name: () => regName('auction'), colors: () => regColors('auction'),
  views: { main: aucMain, lot: lotView },
  live: true,
  right: () => `<button class="pill dr-open" data-a="audrawer">☰ ${T('Мои лоты', 'Мої лоти', 'My lots')}${drCount() ? ` · ${drCount()}` : ''}</button>`,
  actions: {
    audrawer: () => openDrawer(),
    drgo: (id, el, ev) => { if (ev?.target?.closest('[data-a="bid"]')) return; closeSheet(); go('lot', { id }); },
    bid: (id, el) => { const lot = auctions().lots.find((l) => l.id === id); const r = placeBid(lot, +el.dataset.w); if (r.ok) { sfx('hit'); toast(T('Ставка принята', 'Ставку прийнято', 'Bid placed'), 'g'); } else toast(r.msg || T('Не удалось', 'Не вдалося', 'Failed'), 'r'); rerender(); },
    bidc: async (id) => { const lot = auctions().lots.find((l) => l.id === id); const v = await askPrice({ title: T('Ваша ставка', 'Ваша ставка', 'Your bid'), value: minNext(lot), min: minNext(lot), max: Math.max(G.s.money, minNext(lot)) }); if (!v) return; const r = placeBid(lot, v); toast(r.ok ? T('Ставка принята', 'Ставку прийнято', 'Bid placed') : r.msg, r.ok ? 'g' : 'r'); rerender(); },
  },
};

// ---------------------------------------------------------------- MARKETPLACE
const M = { tab: 'boxes' };
function storeFeed() {
  const s = G.s;
  if (!s.store || s.store.refreshAt <= s.t || s.store.city !== s.player.city) {
    const rng = new RNG(`${s.id}:store:${s.t}`);
    const items = [];
    for (let i = 0; i < 10; i++) {
      const it = makeItem(rng, { city: s.player.city, quality: 'new', cats: ['phones', 'electronics', 'consoles', 'accessories', 'sneakers', 'clothing', 'perfume', 'toys'], maxVal: 2500, fakeMult: 0, lockRate: 0 });
      if (it.year && it.year < 2024) continue;
      it.sealed = true; it.cond = 100; it.defects = [];
      const imp = rng.chance(0.4);
      const v = itemValue(it, s.player.city, 'true');
      items.push({ id: uid('st'), item: it, imp, price: nicePrice(v * (imp ? rng.float(0.62, 0.8) : rng.float(0.95, 1.12))), sold: false });
    }
    s.store = { refreshAt: s.t + 600, city: s.player.city, items };
  }
  return s.store;
}
function shopMain() {
  const s = G.s;
  const tabs = `<div class="seg"><button class="${M.tab === 'boxes' ? 'on' : ''}" data-a="mt" data-v="boxes">${T('Боксы', 'Бокси', 'Boxes')}</button><button class="${M.tab === 'store' ? 'on' : ''}" data-a="mt" data-v="store">${T('Новое', 'Нове', 'New')}</button><button class="${M.tab === 'whole' ? 'on' : ''}" data-a="mt" data-v="whole">${T('Опт', 'Опт', 'Bulk')}</button></div>`;
  if (M.tab === 'boxes') return tabs + `<p class="p">${T('Мистери‑боксы: внутри случайная вещь. Чем дороже бокс — тем ценнее содержимое. Можно выбить джекпот.', 'Містері‑бокси: всередині випадкова річ. Можна вибити джекпот.', 'Mystery boxes: random contents, chance of a jackpot.')}</p>` + BOXES.map((b) => `<div class="card" style="border-left:4px solid ${b.color}"><div class="row"><div style="font-size:40px">🎁</div><div class="grow"><h3>${esc(L(b.n))}</h3><div class="small m">${b.cats ? b.cats.map((c) => CATS[c].icon).join(' ') : T('всё подряд', 'усе підряд', 'anything')}${s.level < b.lvl ? ` · 🔒 ${T('ур.', 'рів.', 'lvl')} ${b.lvl}` : ''}</div></div><button class="btn sm" data-a="box" data-v="${b.id}" ${s.level < b.lvl ? 'disabled' : ''}>${fmt(b.price)}</button></div></div>`).join('');
  if (M.tab === 'store') {
    const st = storeFeed();
    return tabs + `<p class="p">${T('Новые запечатанные товары. «Импорт» дешевле, но едет долго.', 'Нові запечатані товари. «Імпорт» дешевший, але їде довго.', 'New sealed goods. Imports are cheaper but slow.')} ⟳ <span data-cd="${st.refreshAt}"></span></p><div class="tiles">${st.items.filter((x) => !x.sold).map((x) => `<div class="tile" data-a="buystore" data-v="${x.id}"><div class="img">${img(x.item, { tilt: true })}</div><div class="pr">${fmt(x.price)}</div><div class="nm">${esc(itemTitle(x.item))}</div><div class="ct">${x.imp ? `🚢 ${T('Импорт', 'Імпорт', 'Import')} · ${dur(deliveryTime('szx', s.player.city) * 2)}` : `🚚 ${dur(deliveryTime(s.player.city, s.player.city))}`}</div>${tags(x.item)}</div>`).join('')}</div>`;
  }
  const w = wholesale();
  return tabs + `<p class="p">${T('Оптовые партии дешевле поштучной покупки, но внутри бывают сломанные и заблокированные вещи.', 'Оптові партії дешевші, але всередині бувають зламані речі.', 'Bulk lots are cheaper, but contain broken and locked items.')}</p>` + w.deals.filter((d) => !d.sold).map((d) => `<div class="card"><div class="row between"><h3>${CATS[d.cat].icon} ${esc(L(d.name))}</h3><span class="tag">${d.items.length} ${T('шт', 'шт', 'pcs')}</span></div><div class="row" style="gap:6px;overflow:hidden;margin:8px 0">${d.items.slice(0, 5).map((it) => `<div style="width:56px;height:56px;border-radius:10px;overflow:hidden;flex:none">${img(it)}</div>`).join('')}</div><div class="row between"><span class="small m">${T('≈ за штуку', '≈ за штуку', '≈ each')} ${fmt(d.price / d.items.length)}</span><button class="btn sm" data-a="whole" data-v="${d.id}">${fmt(d.price)}</button></div></div>`).join('');
}
async function spinBox(box) {
  if (!buyBox(box)) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
  const { strip, win, winIndex } = rollBox(box);
  const rc = (t) => ['#8a94a6', '#5fd38d', '#4da3ff', '#b07cff', '#ffb02e', '#ff4d8d'][t];
  await sheet(`<h2>${esc(L(box.n))}</h2><div class="roulette"><div class="mark"></div><div class="strip">${strip.map((x) => `<div class="cell" style="--rc:${rc(x.tier)}">${itemSVG(x.it)}</div>`).join('')}</div></div><div class="center mt prize" style="min-height:70px"></div><button class="btn block take hidden">${T('Забрать', 'Забрати', 'Take it')}</button>`, {
    modal: true,
    after(el) {
      const stripEl = el.querySelector('.strip');
      const cellW = 108;
      const target = winIndex * cellW - el.querySelector('.roulette').clientWidth / 2 + 50 + (Math.random() * 60 - 30);
      stripEl.style.transition = 'transform 4.2s cubic-bezier(.12,.6,.1,1)';
      requestAnimationFrame(() => { stripEl.style.transform = `translateX(${-target}px)`; });
      let ticks = 0; const tk = setInterval(() => { ticks++; sfx('tick'); if (ticks > 28) clearInterval(tk); }, 140);
      setTimeout(() => {
        sfx(win.tier >= 3 ? 'win' : 'ok');
        el.querySelector('.prize').innerHTML = `<b style="font-size:18px">${esc(itemTitle(win.it))}</b><div class="small" style="color:${rc(win.tier)}">◆ ${T('ценность', 'цінність', 'value')} ≈ ${fmt(win.v)}</div>`;
        const b = el.querySelector('.take'); b.classList.remove('hidden');
        b.onclick = () => { if (!takeBoxPrize(win)) { toast(T('Нет места — приз продан за 50%', 'Немає місця — приз продано за 50%', 'No space — prize sold for 50%'), 'r'); import('../game/player.js').then((p) => p.earn(win.v * 0.5, 'sale', 'box')); } closeSheet(); rerender(); };
      }, 4400);
    },
  });
}
export const shopApp = {
  id: 'shop', glyph: 'cart', lvl: 3,
  name: () => regName('marketplace'), colors: () => regColors('marketplace'),
  views: { main: shopMain },
  actions: {
    mt: (v) => { M.tab = v; rerender(); },
    box: async (id) => { const b = BOXES.find((x) => x.id === id); if (await confirmBox(L(b.n), T(`Открыть за ${fmt(b.price)}?`, `Відкрити за ${fmt(b.price)}?`, `Open for ${fmt(b.price)}?`), T('Открыть', 'Відкрити', 'Open'))) await spinBox(b); },
    whole: async (id) => { const d = wholesale().deals.find((x) => x.id === id); if (!(await confirmBox(L(d.name), `${d.items.length} ${T('шт', 'шт', 'pcs')} · ${fmt(d.price)}`, T('Купить партию', 'Купити партію', 'Buy lot')))) return; const r = buyWholesale(d); toast(r.ok ? T('Партия на складе!', 'Партія на складі!', 'Lot in storage!') : r.msg, r.ok ? 'g' : 'r'); if (r.ok) sfx('cash'); rerender(); },
    buystore: async (id) => {
      const s = G.s; const x = storeFeed().items.find((y) => y.id === id); if (!x || x.sold) return;
      if (!(await confirmBox(itemTitle(x.item), `${fmt(x.price)}${x.imp ? ' · ' + T('импорт, пошлина 15% при получении', 'імпорт, мито 15%', 'import, 15% duty on arrival') : ''}`, T('Купить', 'Купити', 'Buy')))) return;
      const cost = x.price * (x.imp ? 1.15 : 1);
      if (!spend(cost, 'buy', itemTitle(x.item))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      x.sold = true; x.item.paid = cost;
      s.deliveries.push({ id: uid('d'), kind: 'in', item: x.item, from: x.imp ? 'szx' : s.player.city, to: s.player.city, start: s.t, eta: s.t + deliveryTime(x.imp ? 'szx' : s.player.city, s.player.city) * (x.imp ? 2 : 1), price: cost, who: regName('marketplace') });
      stat('bought'); addXP(5); sfx('cash'); toast(T('Заказ оформлен', 'Замовлення оформлено', 'Ordered'), 'g'); rerender();
    },
  },
};
