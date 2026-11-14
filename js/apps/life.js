// Life apps: Profile (needs, sleep, food), Real estate, Travel, City map (flea market) and Pawn shop.
import { G, emit } from '../core/state.js';
import { recordCard } from '../ui/record.js';
import { noNeeds } from '../game/needs.js';
import { T, L, dur, fmtDate } from '../core/i18n.js';
import { esc, clamp, uid } from '../core/util.js';
import { RNG } from '../core/rng.js';
import { fmt, nicePrice } from '../core/money.js';
import { CITY, CITIES, COUNTRY, countryOf, distanceKm, MODES } from '../data/world.js';
import { CATS, CAT_LIST } from '../data/catalog.js';
import { icon } from '../ui/icons.js';
import { go, back, replace, rerender, toast, askPrice, confirmBox, choose, sheet, closeSheet, resolveSheet, openApp, UI, refreshAll, gameDate } from '../ui/shell.js';
import { img, empty, bar, tags, row, kv, stars } from '../ui/comp.js';
import { itemTitle, itemSub, itemValue, makeItem, isVehicle, sizeUnits } from '../game/items.js';
import { HOUSING, houseDef, capacity, used, xpNeed, repScore, getItem, spend, addItem, canStore, stat, addXP, luggageCap, garage, vehiclesOwned, netWorth } from '../game/player.js';
import { FOOD, foodPrice, eat, rentFor, housePrice, rentHouse, buyHouse, leaveHouse, afterSleep, awayFromHome, hotelPrice, isSick } from '../game/life.js';
import { factsOf, dealOf, needsChat, confirmed, reqBlock, salePrice, marketDelta } from '../game/housing.js';
import { personOf, chatList, hiddenListing, questions, qLabel, Q_ICON, ask, goView, viewCost, payPrepay, report, refusedBy, chatBadge, tierHint, nextAskIn } from '../game/realty_chat.js';
import { listings, findListing, priceFor, perDayOf, moveInCost, rentListing, moveOut, prepay, setPeriod, renting, PERIODS, TIERS, KINDS, tierName, kindName, titleOf, sleepOf, homeName, photoUrl, homes, myHome, homeValue, marketRent, buyListing, liveIn, rentOut, stopRent, renoQuote, renovate, sellHome } from '../game/housing.js';
import { PROPS, propPrice, propRent, acquireProp, releaseProp } from '../game/business.js';
import { tripOptions, startTrip, inTransit } from '../game/travel.js';
import { regionMult } from '../game/economy.js';
import { pawnShop, buyPawn } from '../game/sources.js';
import { pawnSell } from '../game/sell.js';
import { advance } from '../game/sim.js';
import { cityName } from './common.js';
import { sfx } from '../ui/sfx.js';
import { playMini } from '../mini/engine.js';
import { PK, PDOCS, ARGS, argLabel, offers, findOffer, canHere, negOf, argue, refuseRaise, agree, take, docState, orderPDoc, startBuild, release, pstate, wealthAsk, parkSlots, builtSlots, week as pkWeek, MAP_KINDS, lotMap, seenOf, lookAt, walkMins, sellSpot, sellPrice } from '../game/parking.js';

// ---------------------------------------------------------------- PROFILE
function profMain() {
  const s = G.s;
  const h = houseDef();
  const car = s.car ? getItem(s.car) : null;
  return `<div class="card"><div class="levelrow"><div class="lv">${s.level}</div><div class="grow"><b style="font-size:19px">${esc(s.player.name)}</b><div class="small m">${countryOf(s.player.city).flag} ${esc(cityName())} · ★ ${repScore() ? repScore().toFixed(2) : '—'} (${s.rep.n})</div>${bar((s.xp / xpNeed(s.level)) * 100, 'var(--acc2)')}<div class="tiny m">XP ${s.xp} / ${xpNeed(s.level)}</div></div></div></div>
    ${noNeeds() ? `<div class="card small">🍔⚡ ${T('Еда и энергия выключены в настройках: голода и усталости нет, действия занимают игровое время.', 'Їжа та енергія вимкнені в налаштуваннях: голоду й утоми немає, дії займають ігровий час.', 'Food & energy are off in Settings: no hunger or tiredness, actions take game time.')}</div>` : ''}
    <div class="stats"><div class="stat"><small>⚡ ${T('Энергия', 'Енергія', 'Energy')}</small><b data-live="energy">${Math.round(s.energy)}</b>${bar(s.energy, s.energy < 25 ? 'var(--red)' : '')}</div><div class="stat"><small>🍔 ${T('Сытость', 'Ситість', 'Food')}</small><b data-live="food">${Math.round(s.food)}</b>${bar(s.food, 'var(--yel)')}</div></div>
    <div class="btns"><button class="btn" data-a="eatMenu">🍔 ${T('Поесть', 'Поїсти', 'Eat')}</button><button class="btn dark" data-a="sleepMenu">🌙 ${T('Спать', 'Спати', 'Sleep')}</button></div>
    ${s.food < 12 ? `<div class="card warn small">${T('Вы голодны — энергия тает быстрее.', 'Ви голодні — енергія тане швидше.', 'You’re hungry — energy drains faster.')}</div>` : ''}
    ${isSick() ? `<div class="card warn small">🤢 ${T('Расстройство желудка: энергия тает быстрее, еда усваивается вдвое хуже, на смену не выйти. Пройдёт через', 'Розлад шлунка: енергія тане швидше, їжа засвоюється вдвічі гірше, на зміну не вийти. Мине через', 'Upset stomach: energy drains faster, food does half, no shifts. Clears in')} <span data-cd="${s.sick.until}" data-fmt="long"></span>. ${T('Таблетки — в «Поесть → Аптека».', 'Пігулки — у «Поїсти → Аптека».', 'Pills: Eat → Pharmacy.')}</div>` : (s.junk || 0) > 2.5 ? `<div class="card small">🍔 ${T('Многовато фастфуда — желудок может не выдержать. Поешьте нормально.', 'Забагато фастфуду — шлунок може не витримати. Поїжте нормально.', 'Lots of junk food lately — your stomach may give up. Eat properly.')}</div>` : ''}
    ${recordCard()}
    <h3 class="sub">${T('Жизнь', 'Життя', 'Life')}</h3>
    <div class="card">${kv(T('Жильё', 'Житло', 'Home'), `${esc(s.house.type === 'none' ? L(h.n) : homeName())}${s.house.type !== 'none' ? ` · ${esc(L(CITY[s.house.city]?.name || ''))}` : ''}${renting() ? ` · ${T('оплачено ещё', 'оплачено ще', 'paid for')} <span data-cd="${s.house.paidUntil}" data-fmt="long"></span>` : ''}`)}${kv(T('Склад', 'Склад', 'Storage'), `${used()} / ${capacity()}`)}${kv(T('Транспорт', 'Транспорт', 'Vehicle'), car ? esc(itemTitle(car)) : T('пешком', 'пішки', 'on foot'))}${kv(T('Гараж', 'Гараж', 'Garage'), `${vehiclesOwned()} / ${garage()}`)}${kv(T('Капитал', 'Капітал', 'Net worth'), fmt(netWorth()), 'g')}</div>
    <div class="btns"><button class="btn dark" data-a="open" data-v="realty">${icon('home')} ${T('Недвижимость', 'Нерухомість', 'Real estate')}</button><button class="btn dark" data-a="open" data-v="travel">${icon('plane')} ${T('Поездки', 'Поїздки', 'Travel')}</button></div>`;
}
export const profileApp = {
  id: 'profile', glyph: 'user', lvl: 1,
  name: ['Профиль', 'Профіль', 'Profile'], colors: ['#ff6a4d', '#d63a2a'],
  views: { main: profMain },
  actions: {
    eatMenu: async () => {
      const v = await choose(T('Поесть', 'Поїсти', 'Eat'), FOOD.filter((f) => !f.meds || isSick()).map((f) => ({ v: f.id, label: `${f.icon} ${L(f.n)} · ${fmt(foodPrice(f))}`, sub: f.meds ? T('снимает расстройство', 'знімає розлад', 'settles your stomach') : `+${f.food} 🍔${f.energy ? ` +${f.energy} ⚡` : ''}${f.junk >= 0.7 ? ' · ' + T('вредно', 'шкідливо', 'junk') : f.healthy ? ' · ' + T('полезно', 'корисно', 'healthy') : ''}` })));
      if (!v) return;
      const f0 = FOOD.find((f) => f.id === v);
      let cookQ = null;
      if (f0.home && G.s.house.type !== 'none') { const rc = await playMini('pancake', { title: T('Готовим дома', 'Готуємо вдома', 'Cooking at home'), pass: 0.6 }); if (!rc.quit) cookQ = rc.score; }
      const r = eat(f0);
      if (r.ok && cookQ != null) G.s.food = Math.max(0, Math.min(100, G.s.food + Math.round((cookQ - 0.5) * 16)));
      if (r.ok) { sfx('ok'); toast(r.meds ? T('Полегчало', 'Полегшало', 'Feeling better') : T('Вкусно!', 'Смачно!', 'Yum!'), 'g'); } else toast(r.msg, 'r');
      refreshAll();
    },
    sleepMenu: async () => {
      const s = G.s;
      const home = s.house.type !== 'none' && s.house.city === s.player.city;
      const opts = [];
      if (home) opts.push({ v: 'home', label: `🏠 ${T('Дома, 8 часов', 'Вдома, 8 годин', 'At home, 8 hours')}`, cls: '' });
      else {
        opts.push({ v: 'hotel', label: `🏨 ${T('Хостел/отель', 'Хостел/готель', 'Hostel/hotel')} · ${fmt(hotelPrice())}`, sub: T('нормальный сон', 'нормальний сон', 'proper sleep') });
        opts.push({ v: 'street', label: `🚉 ${T('На вокзале', 'На вокзалі', 'At the station')} · ${T('бесплатно', 'безкоштовно', 'free')}`, sub: T('плохой сон, могут обокрасть', 'поганий сон, можуть обікрасти', 'poor sleep, theft risk') });
      }
      opts.push({ v: 'nap', label: `😴 ${T('Вздремнуть 2 часа', 'Подрімати 2 години', 'Nap 2 hours')}`, cls: 'dark' });
      const v = await choose(T('Сон', 'Сон', 'Sleep'), opts, T('Время пролетит быстро: сделки, доставки и аренда продолжатся.', 'Час пролетить швидко: угоди, доставки й оренда продовжаться.', 'Time skips ahead: deliveries, rent and deals continue.'));
      if (!v) return;
      if (v === 'hotel') { if (!spend(hotelPrice(), 'rent', T('Отель', 'Готель', 'Hotel'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r'); s.hotelNight = true; }
      const hours = v === 'nap' ? 2 : 8;
      // counting sheep: a calm mind sleeps better (bonus energy), a restless one a bit worse
      let sleepQ = 0.6;
      if (v !== 'nap') { const r = await playMini('sheep', { title: T('Считаем овец', 'Рахуємо овець', 'Counting sheep'), pass: 1 }); sleepQ = r.quit ? 0.6 : r.score; }
      await sheet(`<div class="center" style="padding:30px 0"><div style="font-size:64px" class="pulse">💤</div><h2>${T('Спим…', 'Спимо…', 'Sleeping…')}</h2><p class="p">${hours} ${T('ч', 'год', 'h')}</p></div>`, { modal: true, after() { setTimeout(() => { advance(hours * 60); afterSleep(hours); s.energy = Math.max(0, Math.min(100, s.energy + Math.round((sleepQ - 0.6) * 20))); resolveSheet('ok'); }, 900); } });
      sfx('ok'); toast(T('Выспались!', 'Виспалися!', 'Rested!'), 'g');
      refreshAll();
    },
  },
};

// ---------------------------------------------------------------- REAL ESTATE
// rent / buy listings with photos, your homes (live, rent out, renovate, sell), commercial property
const R = { tab: 'rent', per: '', type: '' };
const gal = (photos, cls = '') => `<div class="re-gal ${cls}">${(photos || []).map((k) => `<img src="${photoUrl(k)}" loading="lazy" alt="">`).join('') || '<div class="re-noph">🏠</div>'}</div>`;
const tierBadge = (t) => `<span class="re-tier" style="--c:${TIERS[t]?.col || '#888'}">${esc(tierName(t))}</span>`;
function curCard() {
  const s = G.s, H = s.house, cur = houseDef();
  let h = `<div class="card hl re-cur">${H.photos?.length ? `<img class="re-curimg" src="${photoUrl(H.photos[0])}" alt="">` : ''}<div class="grow"><div class="small m">${T('Вы живёте', 'Ви живете', 'You live in')}</div><b>${esc(homeName())}</b>`;
  if (H.type === 'none') return h + `<div class="small m">${T('Без жилья: сон хуже, ночью могут стащить вещь, склад маленький.', 'Без житла: сон гірший, уночі можуть поцупити річ, склад маленький.', 'Homeless: poor sleep, things get stolen at night, tiny storage.')}</div></div></div>`;
  h += `<div class="small m">${H.tier ? tierBadge(H.tier) + ' ' : ''}${esc(L(CITY[H.city]?.name || ''))}${H.district ? ' · ' + esc(L(H.district)) : ''} · 📦 ${cur.store} · 🚗 ${cur.garage}</div>`;
  if (H.own) h += `<div class="small g">${T('своё жильё', 'власне житло', 'your own home')}</div>`;
  else h += `<div class="rt-paid ${H.late ? 'late' : ''}">${H.late ? `⚠️ ${T('Просрочка! Выселение через', 'Прострочка! Виселення через', 'Overdue! Eviction in')} <span data-cd="${H.graceUntil}" data-fmt="long"></span>` : `${T('Оплачено до', 'Оплачено до', 'Paid until')} <b>${esc(fmtDate(gameDate(H.paidUntil)))}</b> <small class="m">· ${T('ещё', 'ще', 'in')} <span data-cd="${H.paidUntil}" data-fmt="long"></span></small>`}</div>
      <div class="small m">${fmt(H.price)} / ${L(PERIODS[H.period].per)}${H.deposit ? ` · ${T('залог', 'застава', 'deposit')} ${fmt(H.deposit)}` : ''}${H.starter ? ' · ' + T('первая неделя в подарок', 'перший тиждень у подарунок', 'first week on the house') : ''}</div>
      <div class="btns"><button class="btn xs" data-a="hpay">${T('Продлить', 'Продовжити', 'Renew')} · ${fmt(H.price)}</button><button class="btn xs dark" data-a="hperiod">${L(PERIODS[H.period].n)}</button><button class="btn xs dark" data-a="hauto">${H.auto ? '✅' : '⬜'} ${T('авто', 'авто', 'auto')}</button></div>`;
  return h + `<button class="btn xs dark mt" data-a="leave">${H.own ? T('Переехать отсюда', 'Переїхати звідси', 'Move out') : T('Съехать', 'Зʼїхати', 'Move out')}</button></div></div>`;
}
const typeChips = (kind) => `<div class="chips wrap">${[['', T('Все', 'Усі', 'All')], ...Object.keys(KINDS).filter((k) => kind === 'rent' || KINDS[k].m2Sale).map((k) => [k, kindName(k)])].map(([k, n]) => `<button class="chip${R.type === k ? ' on' : ''}" data-a="htype" data-v="${k}">${esc(n)}</button>`).join('')}</div>`;
const stBadge = (id) => { const b = chatBadge(id); return b ? `<span class="re-st ${b[2]}">${b[0]} ${esc(b[1])}</span>` : ''; };
const hhmm = (t) => `${String(Math.floor((t % 1440) / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const deltaTag = (x) => { const d = Math.round(marketDelta(x) * 100); return Math.abs(d) < 4 ? `<span class="tag">${T('по рынку', 'за ринком', 'market price')}</span>` : `<span class="tag ${d < 0 ? 'g' : 'o'}">${d > 0 ? '+' : '−'}${Math.abs(d)}% ${T('к рынку', 'до ринку', 'vs market')}</span>`; };
// the person behind the ad: tap to write
function contactCard(x) {
  if (!needsChat(x)) return `<div class="re-contact"><span class="re-ava" style="background:#26a269">🛏</span><div class="grow"><b>${T('Бронирование онлайн', 'Бронювання онлайн', 'Online booking')}</b><small>${T('Хостел: писать не нужно, места есть всегда.', 'Хостел: писати не треба, місця є завжди.', 'A hostel: no need to write, there are always beds.')}</small></div></div>`;
  const p = personOf(x), b = chatBadge(x.id), c = dealOf(x.id), last = c?.msgs[c.msgs.length - 1];
  return `<div class="re-contact" data-a="rchat" data-v="${x.id}"><span class="re-ava" style="background:${p.col}">${esc(p.ini)}</span><div class="grow"><b>${esc(p.name)}</b><small>${esc(p.role)}</small>${last ? `<small class="re-last">${last.f === 'me' ? T('Вы: ', 'Ви: ', 'You: ') : ''}${esc(last.tx)}</small>` : ''}</div>${b ? `<span class="tag ${b[2]}">${b[0]} ${esc(b[1])}</span>` : `<span class="btn xs">💬 ${T('Написать', 'Написати', 'Message')}</span>`}</div>`;
}
// what stands between you and the keys
function gateHTML(x) {
  if (confirmed(x)) return '';
  const c = dealOf(x.id);
  if (c && ['taken', 'dead'].includes(c.st)) return `<button class="btn block mt" disabled>${c.st === 'taken' ? (x.kind === 'sale' ? T('Уже продана', 'Вже продана', 'Already sold') : T('Уже сдана', 'Вже здана', 'Already let')) : T('Хозяин не отвечает', 'Господар не відповідає', 'The owner isn’t answering')}</button>`;
  return `<button class="btn block mt" data-a="rchat" data-v="${x.id}">💬 ${x.kind === 'sale' ? T('Написать продавцу', 'Написати продавцю', 'Message the seller') : T('Написать хозяину', 'Написати господарю', 'Message the landlord')}</button><p class="tiny m center">${x.kind === 'sale' ? T('Сначала узнайте, продаётся ли ещё, — потом можно покупать.', 'Спершу дізнайтеся, чи ще продається, — потім можна купувати.', 'First check it’s still for sale — then you can buy.') : T('Сначала узнайте, сдаётся ли ещё и кому сдают, — потом можно снять.', 'Спершу дізнайтеся, чи ще здається і кому здають, — потім можна зняти.', 'First check it’s still free and who they let to — then you can rent.')}</p>`;
}
function notes(x) {
  const c = dealOf(x.id), out = [];
  const real = tierHint(x);
  if (real) out.push(`⚠️ ${T('На деле состояние хуже фото:', 'Насправді стан гірший за фото:', 'Really worse than the photos:')} «${esc(tierName(real))}»`);
  if (c?.knowReq && x.kind === 'rent') { const no = reqBlock(x, x.periods.includes('month') ? 'month' : x.periods[0]); if (no) out.push(`🚫 ${esc(no)}`); }
  if (c?.disc && x.kind === 'rent') out.push(`🤝 ${T('Скидка на месяц', 'Знижка на місяць', 'Monthly discount')} −${Math.round(c.disc * 100)}%`);
  if (c?.feeK != null && c.feeK < 1 && x.agency) out.push(`💼 ${c.feeK ? T('Комиссия вдвое меньше', 'Комісія вдвічі менша', 'Half the fee') : T('Без комиссии', 'Без комісії', 'No fee')}`);
  if (c?.held) out.push(`🔒 ${T('Задаток', 'Завдаток', 'Holding deposit')} ${fmt(c.held)} ${T('— зачтут в оплату', '— зарахують в оплату', '— counts towards rent')}`);
  return out.length ? `<div class="re-notes">${out.map((t) => `<div>${t}</div>`).join('')}</div>` : '';
}
function listCard(x) {
  const price = x.kind === 'rent' ? `${fmt(priceFor(x, x.periods.includes('month') ? 'month' : 'week'))}<small>/${L(PERIODS[x.periods.includes('month') ? 'month' : 'week'].per)}</small>` : `${fmt(x.price, { short: true })}`;
  return `<div class="re-card" data-a="hopen" data-v="${x.id}"><div class="re-hero">${x.photos?.length ? `<img src="${photoUrl(x.photos[0])}" loading="lazy" alt="">` : '<div class="re-noph">🏠</div>'}${tierBadge(x.tier)}<span class="re-cnt">📷 ${x.photos?.length || 0}</span>${stBadge(x.id)}</div>
    <div class="re-body"><b class="re-price">${price}</b><span>${esc(titleOf(x))}</span><small>${esc(L(x.district))} · 🚇 ${x.metro} ${T('мин', 'хв', 'min')} · ${x.agency ? T('агентство', 'агентство', 'agency') : T('собственник', 'власник', 'owner')}</small></div></div>`;
}
function homeCard(h) {
  const st = h.reno ? `🛠 ${T('ремонт до', 'ремонт до', 'renovating until')} ${esc(fmtDate(gameDate(h.reno.until)))}` : h.mode === 'live' ? `🏠 ${T('вы здесь живёте', 'ви тут живете', 'you live here')}` : h.mode === 'rent' ? (h.tenant ? `🔑 ${esc(L(h.tenant.who))} · ${fmt(h.tenant.perDay * 30)}/${T('мес', 'міс', 'mo')}` : `🔎 ${T('ищем жильцов', 'шукаємо мешканців', 'looking for tenants')}`) : `💤 ${T('пустует', 'порожня', 'empty')}`;
  return `<div class="re-card" data-a="hmine" data-v="${h.id}"><div class="re-hero">${h.photos?.length ? `<img src="${photoUrl(h.photos[0])}" loading="lazy" alt="">` : '<div class="re-noph">🏠</div>'}${tierBadge(h.tier)}</div><div class="re-body"><b class="re-price">${fmt(homeValue(h), { short: true })}</b><span>${esc(titleOf(h))}</span><small>${esc(L(CITY[h.city]?.name || ''))} · ${st}</small></div></div>`;
}
function realtyMain() {
  const s = G.s;
  const tabs = `<div class="chips wrap re-tabs">${[['rent', T('Снять', 'Зняти', 'Rent')], ['buy', T('Купить', 'Купити', 'Buy')], ['chats', `💬 ${T('Переписка', 'Листування', 'Chats')}${chatList().length ? ` (${chatList().length})` : ''}`], ['homes', `${T('Мои дома', 'Мої будинки', 'My homes')} (${homes().length})`], ['park', `🅿️ ${T('Парковка', 'Паркування', 'Parking')}`], ['biz', T('Коммерция', 'Комерція', 'Commercial')], ['mine', `${T('Моя коммерция', 'Моя комерція', 'My commercial')} (${s.props.length})`]].map(([k, n]) => `<button class="chip${R.tab === k ? ' on' : ''}" data-a="rt" data-v="${k}">${n}</button>`).join('')}</div>`;
  if (R.tab === 'rent' || R.tab === 'buy') {
    const kind = R.tab === 'rent' ? 'rent' : 'sale';
    let ls = listings(s.player.city, kind).filter((x) => (!R.type || x.type === R.type) && !hiddenListing(x.id));
    ls = kind === 'rent' ? ls.sort((a, b) => a.perDay - b.perDay) : ls.sort((a, b) => a.price - b.price);
    const intro = kind === 'rent' ? T('Платите вперёд за сутки, неделю или месяц. Месяц дешевле в пересчёте на день, но нужен залог, а агентство берёт половину месяца.', 'Платите наперед за добу, тиждень або місяць. Місяць дешевший у перерахунку на день, але потрібна застава, а агентство бере половину місяця.', 'Pay up front for a day, week or month. A month is cheaper per day but needs a deposit; agencies take half a month.') : T('Купленное жильё можно занять самому, сдавать жильцам, отремонтировать (дороже продать и сдать) или перепродать. Объявления обновляются каждую неделю.', 'Куплене житло можна зайняти самому, здавати мешканцям, відремонтувати (дорожче продати й здати) або перепродати. Оголошення оновлюються щотижня.', 'A home you buy can be lived in, rented out, renovated (worth and rents more) or resold. Listings refresh weekly.');
    return tabs + (kind === 'rent' ? curCard() : '') + `<p class="p">${intro}</p>` + typeChips(kind) + `<div class="re-grid">${ls.map(listCard).join('')}</div>`;
  }
  if (R.tab === 'chats') {
    const cs = chatList().map((c) => [c, findListing(c.id)]).filter(([, x]) => x);
    return tabs + (cs.length ? cs.map(([c, x]) => { const p = personOf(x), b = chatBadge(c.id), last = c.msgs[c.msgs.length - 1]; return `<div class="ms-row" data-a="rchat" data-v="${c.id}"><span class="ms-ava" style="background:${p.col}">${esc(p.ini)}</span><div class="grow"><b>${esc(p.name)}</b> <span class="small m">${esc(titleOf(x))}</span><small class="m">${last ? (last.f === 'me' ? T('Вы: ', 'Ви: ', 'You: ') : '') + esc(last.tx) : ''}</small></div>${b ? `<span class="tag ${b[2]}">${b[0]}</span>` : ''}</div>`; }).join('') : `<div class="pc-empty">💬 ${T('Переписок пока нет. Откройте объявление и напишите хозяину.', 'Листувань поки немає. Відкрийте оголошення й напишіть господарю.', 'No chats yet. Open a listing and message the owner.')}</div>`);
  }
  if (R.tab === 'homes') {
    const hs = homes();
    const income = hs.reduce((a, h) => a + (h.tenant ? h.tenant.perDay * 30 : 0), 0);
    return tabs + curCard() + (hs.length ? `<div class="card"><div class="kv"><span>${T('Стоимость', 'Вартість', 'Value')}</span><b>${fmt(hs.reduce((a, h) => a + homeValue(h), 0), { short: true })}</b></div><div class="kv"><span>${T('Аренда от жильцов', 'Оренда від мешканців', 'Rent from tenants')}</span><b class="g">${fmt(income)}/${T('мес', 'міс', 'mo')}</b></div></div><div class="re-grid">${hs.map(homeCard).join('')}</div>` : `<div class="pc-empty">🏠 ${T('Своего жилья пока нет. Загляните во вкладку «Купить».', 'Власного житла поки немає. Зазирніть у вкладку «Купити».', 'No homes yet. Check the Buy tab.')}</div>`);
  }
  if (R.tab === 'park') return tabs + parkTab();
  if (R.tab === 'biz') return tabs + `<p class="p">${T('Точки продаж, склады и квартиры под сдачу в городе', 'Точки продажу, склади й квартири під здачу в місті', 'Stores, warehouses and rentals in')} ${esc(cityName())}. ${T('Аренда — первые 3 дня сразу.', 'Оренда — перші 3 дні одразу.', 'Rent: first 3 days up front.')}</p>` + PROPS.map((p) => `<div class="card"><div class="row"><div style="font-size:30px">${p.icon}</div><div class="grow"><h3>${esc(L(p.n))}</h3><div class="small m">${p.slots ? `${T('полок', 'полиць', 'slots')}: ${p.slots} · ${T('трафик', 'трафік', 'traffic')} ${p.traffic}` : p.cap ? `${T('вместимость', 'місткість', 'capacity')} +${p.cap}` : `${T('доход', 'дохід', 'income')} ≈ ${fmt(propPrice(p) * p.income)}/${T('день', 'день', 'day')}`}</div></div></div><div class="btns">${p.rent ? `<button class="btn sm" data-a="prent" data-v="${p.id}">${T('Аренда', 'Оренда', 'Rent')} ${fmt(propRent(p))}/${T('д', 'д', 'd')}</button>` : ''}<button class="btn sm dark" data-a="pbuy" data-v="${p.id}">${T('Купить', 'Купити', 'Buy')} ${fmt(propPrice(p), { short: true })}</button></div></div>`).join('');
  return tabs + (s.props.length ? s.props.map((p) => { const d = PROPS.find((x) => x.id === p.def); const shop = s.biz.shops.find((x) => x.propId === p.id); return `<div class="card"><div class="row between"><h3>${d.icon} ${esc(L(d.n))}</h3><span class="tag ${p.own ? 'g' : 'b'}">${p.own ? T('собственность', 'власність', 'owned') : T('аренда', 'оренда', 'rented')}</span></div><div class="small m">${esc(L(CITY[p.city].name))}${shop ? ` · 🏪 ${esc(shop.name)}` : ''}${!p.own ? ` · ${fmt(p.rent)}/${T('день', 'день', 'day')}` : ` · ${T('стоимость', 'вартість', 'value')} ${fmt(p.value)}`}</div><div class="btns">${d.kind === 'shop' || d.kind === 'showroom' ? `<button class="btn sm" data-a="open" data-v="business">${shop ? T('Управлять', 'Керувати', 'Manage') : T('Открыть магазин', 'Відкрити магазин', 'Open a store')}</button>` : ''}<button class="btn sm dark" data-a="release" data-v="${p.id}">${p.own ? T('Продать', 'Продати', 'Sell') : T('Расторгнуть', 'Розірвати', 'End lease')}</button></div></div>`; }).join('') : empty('home', T('Нет недвижимости', 'Немає нерухомості', 'No property')));
}
// ---------------------------------------------------------------- parking
const pkName = (k) => `${PK[k].ic} ${esc(L(PK[k].n))}`;
const per = () => T('мес', 'міс', 'mo');
function docRow(sp, d) {
  const st = docState(sp, d), D = PDOCS[d];
  const right = st === 'ready' ? `<b class="g">✔</b>` : st === 'pending' ? `<span class="small m">⏳ <span data-cd="${sp.docs[d]}"></span></span>` : st === 'refused' ? `<b class="r">${T('отказ', 'відмова', 'refused')}</b>` : `<button class="btn xs" data-a="pkdoc" data-v="${sp.id}" data-w="${d}">${T('Оформить', 'Оформити', 'Apply')}${D.fee ? ' · ' + fmt(nicePrice(D.fee * Math.max(0.5, countryOf(G.s.player.city).wage))) : ''}</button>`;
  return `<div class="pk-doc"><span>${D.ic} ${esc(L(D.n))}<small>${esc(L(D.where))} · ${D.mins >= 1440 ? Math.round(D.mins / 1440) + ' ' + T('дн.', 'дн.', 'd') : D.mins >= 60 ? Math.round(D.mins / 60) + ' ' + T('ч', 'год', 'h') : D.mins + ' ' + T('мин', 'хв', 'min')}</small></span>${right}</div>`;
}
function spotCard(sp) {
  const s = G.s;
  let st = '';
  if (sp.st === 'active') st = sp.kind === 'build' ? `<span class="tag g">✔ ${T('построен', 'збудовано', 'built')} · +${sp.slots} 🚗</span>` : `<span class="tag g">✔ +${sp.slots} 🚗</span>`;
  else if (sp.st === 'building') st = `<span class="tag y">🏗 <span data-cd="${sp.buildUntil}"></span></span>`;
  else st = `<span class="tag y">📑 ${T('оформление', 'оформлення', 'paperwork')}</span>`;
  const rv = pstate().reviews?.[sp.id];
  let h = `<div class="card pk-spot"><div class="row between"><b>${pkName(sp.kind)}</b>${st}</div>`;
  if (sp.who) h += `<div class="small m">${T('Владелец', 'Власник', 'Owner')}: ${esc(sp.who)}${sp.bay ? ` · №${sp.bay}` : ''}</div>`;
  if (sp.own) h += `<div class="kv"><span>🔑 ${T('В собственности', 'У власності', 'Owned')}${sp.bay ? ` · №${sp.bay}` : ''}</span><b>${T('куплено за', 'куплено за', 'bought for')} ${fmt(sp.paid || 0)}</b></div>${sp.dues ? `<div class="kv"><span>${T('Взносы ГСК', 'Внески ГБК', 'Co‑op dues')}</span><b>${fmt(sp.dues)}/${per()}</b></div>` : ''}`;
  else if (sp.kind !== 'build' && sp.kind !== 'lawn') h += `<div class="kv"><span>${T('Аренда', 'Оренда', 'Rent')}</span><b>${fmt(sp.price)}/${per()}${sp.dues ? ` + ${fmt(sp.dues)} ${T('взносы', 'внески', 'dues')}` : ''}</b></div><div class="kv"><span>${T('Оплачено до', 'Сплачено до', 'Paid until')}</span><b>${esc(fmtDate(gameDate(sp.paidUntil)))}${sp.late ? ` · <span class="r">${T('долг', 'борг', 'overdue')}</span>` : ''}</b></div>`;
  if (sp.kind === 'lawn') h += `<div class="small o">⚠ ${T('Незаконно: каждое утро может приехать эвакуатор (штраф + штрафстоянка).', 'Незаконно: щоранку може приїхати евакуатор (штраф + штрафмайданчик).', 'Illegal: a tow truck may come any morning (fine + impound).')}</div>`;
  if (Object.keys(sp.docs || {}).length && sp.st !== 'active' && sp.st !== 'building') h += `<div class="pk-docs">${Object.keys(sp.docs).map((d) => docRow(sp, d)).join('')}</div>`;
  if (sp.kind === 'build' && sp.st === 'docs' && docState(sp, 'permit') === 'ready') h += `<button class="btn block mt" data-a="pkbuild" data-v="${sp.id}">🏗 ${T('Строить гараж', 'Будувати гараж', 'Build the garage')} · ${fmt(sp.cost)} · 2 ${T('дн.', 'дн.', 'd')}</button>`;
  if (rv) h += `<div class="card warn small mt">📈 ${T('Владелец хочет поднять цену', 'Власник хоче підняти ціну', 'The owner wants a raise')} · ${T('ответить до', 'відповісти до', 'reply by')} <span data-cd="${rv.until}"></span><button class="btn xs mt" data-a="pkneg" data-v="${rv.o.id}">💬 ${T('Ответить', 'Відповісти', 'Reply')}</button></div>`;
  if (sp.own && sp.st === 'active') h += `<button class="btn xs dark mt" data-a="pksell" data-v="${sp.id}">💰 ${T('Продать за', 'Продати за', 'Sell for')} ${fmt(sellPrice(sp))}</button>`;
  else if (sp.kind !== 'build' && !sp.own) h += `<button class="btn xs dark mt" data-a="pkrel" data-v="${sp.id}">${T('Освободить место', 'Звільнити місце', 'Give it up')}</button>`;
  return h + '</div>';
}
function parkTab() {
  const s = G.s, st = pstate();
  const own = vehiclesOwned(), cap = garage();
  const homeG = houseDef().garage;
  let h = `<div class="card pk-sum"><div class="row between"><b>🚗 ${T('Машин', 'Машин', 'Cars')}: ${own} / ${cap} ${T('мест', 'місць', 'spaces')}</b>${own > cap ? `<span class="tag r">${T('лишние', 'зайві', 'too many')}: ${own - cap}</span>` : ''}</div>
    <div class="pk-break"><span>🏠 ${T('жильё', 'житло', 'home')} ${homeG}</span><span>🛣 ${T('у дома', 'біля дому', 'street')} 1</span><span>🅿️ ${T('аренда', 'оренда', 'rented')} ${parkSlots()}</span><span>🏗 ${T('свой гараж', 'свій гараж', 'own garage')} ${builtSlots()}</span></div>
    ${own > cap ? `<div class="small r mt">${T('Лишние машины стоят где попало — эвакуатор может увезти любую утром.', 'Зайві машини стоять де заманеться — евакуатор може забрати будь‑яку вранці.', 'Extra cars are parked anywhere — a tow truck may take one any morning.')}</div>` : ''}
    <div class="small m mt">${T('Что можно взять, зависит от того, где вы живёте: двор, подземный паркинг, гараж в кооперативе, стоянка, свой гараж на участке.', 'Що можна взяти, залежить від того, де ви живете: двір, підземний паркінг, гараж у кооперативі, стоянка, свій гараж на ділянці.', 'What you can get depends on where you live: yard, underground car park, co‑op garage, guarded car park, your own garage.')}</div></div>`;
  if (st.spots.length) h += `<h3 class="sub">${T('Мои места', 'Мої місця', 'My spaces')}</h3>` + st.spots.map(spotCard).join('');
  h += `<h3 class="sub">${T('Где можно поставить', 'Де можна поставити', 'Where you could park')}</h3>`;
  const os = offers();
  const ago = (t) => { const m = s.t - t; return m < 60 ? `${m} ${T('мин', 'хв', 'min')}` : `${Math.round(m / 60)} ${T('ч', 'год', 'h')}`; };
  const DESC = { yard: T('Места распределяет УК/ОСББ. Свободные бывают не всегда.', 'Місця розподіляє УК/ОСББ. Вільні бувають не завжди.', 'The building manager hands them out. There isn’t always a free one.'), under: T('Места сдают и продают соседи‑собственники. Спуститесь и посмотрите таблички.', 'Місця здають і продають сусіди‑власники. Спустіться й подивіться таблички.', 'Neighbours rent out and sell their bays. Go down and read the signs.'), gsk: T('Гаражи сдают и продают их хозяева — объявления на воротах.', 'Гаражі здають і продають їхні господарі — оголошення на воротах.', 'Owners rent out and sell garages — notices are on the doors.'), lot: T('Платная стоянка с охраной: есть ли места, знает только сторож.', 'Платна стоянка з охороною: чи є місця, знає тільки сторож.', 'A paid guarded lot: only the watchman knows if there’s room.') };
  for (const kind of MAP_KINDS) {
    const ch = canHere(kind);
    if (!ch.ok) { h += `<div class="card pk-off off"><b>${pkName(kind)}</b><div class="small m">✖ ${esc(ch.why)}</div></div>`; continue; }
    const seen = seenOf(kind);
    h += `<div class="card pk-off"><b>${pkName(kind)}</b><div class="small m">${esc(DESC[kind])}</div>
      ${seen ? `<div class="pk-seen"><span class="${seen.rent ? 'g' : 'm'}">🟢 ${T('в аренду', 'в оренду', 'to rent')}: ${seen.rent}</span>${['under', 'gsk'].includes(kind) ? `<span class="${seen.sale ? 'y' : 'm'}">🟡 ${T('продаётся', 'продається', 'for sale')}: ${seen.sale}</span>` : ''}<span class="m">${T('смотрели', 'дивилися', 'checked')} ${ago(seen.t)} ${T('назад', 'тому', 'ago')}</span></div><button class="btn sm mt" data-a="pkmap" data-v="${kind}">🗺 ${T('Схема мест', 'Схема місць', 'Bay plan')}</button>`
        : `<div class="small o mt">❔ ${T('Есть ли свободные места — неизвестно. Нужно сходить и посмотреть.', 'Чи є вільні місця — невідомо. Треба сходити й подивитися.', 'No idea if there’s room. You have to go and look.')}</div><button class="btn sm mt" data-a="pklook" data-v="${kind}">👀 ${T('Сходить посмотреть', 'Сходити подивитися', 'Go and look')} · ${walkMins(kind)} ${T('мин', 'хв', 'min')}</button>`}</div>`;
  }
  for (const kind of ['lawn', 'build']) {
    const ch = canHere(kind), o = os.find((x) => x.kind === kind);
    if (!ch.ok) { h += `<div class="card pk-off off"><b>${pkName(kind)}</b><div class="small m">✖ ${esc(ch.why)}</div></div>`; continue; }
    if (st.spots.some((x) => (kind === 'lawn' && x.kind === 'lawn') || (kind === 'build' && x.kind === 'build' && x.home === s.house.homeId))) continue;
    h += `<div class="card pk-off"><div class="row between"><b>${pkName(kind)}</b><b>${kind === 'build' ? `${T('стройка', 'будівництво', 'construction')} ${fmt(o.base)}` : T('бесплатно', 'безкоштовно', 'free')}</b></div>
      <div class="small m">+${o.slots} 🚗${kind === 'lawn' ? ` · ⚠ ${T('эвакуатор и штрафы', 'евакуатор і штрафи', 'tow trucks and fines')}` : ''}</div>
      ${o.docs.length ? `<div class="pk-need">${o.docs.map((d) => `<span>${PDOCS[d].ic} ${esc(L(PDOCS[d].n))}</span>`).join('')}</div>` : ''}
      <button class="btn sm mt" data-a="pktake" data-v="${o.id}">${kind === 'build' ? `🏛 ${T('Подать на разрешение', 'Подати на дозвіл', 'Apply for a permit')}` : T('Ставить на газон', 'Ставити на газон', 'Park on the lawn')}</button></div>`;
  }
  return h;
}
// the plan of a car park: every bay as you saw it
const P = { sel: null };
function mapView(p) {
  const kind = p.kind, s = G.s, st = pstate();
  if (!MAP_KINDS.includes(kind) || !canHere(kind).ok) return empty('home', T('Сюда не попасть', 'Сюди не потрапити', 'You can’t get in here'));
  if (!seenOf(kind)) return `<div class="card"><b>${pkName(kind)}</b><div class="small m mt">${T('То, что вы видели, уже устарело: машины приезжают и уезжают, места занимают.', 'Те, що ви бачили, вже застаріло: машини приїжджають і їдуть, місця займають.', 'What you saw is out of date: cars come and go, bays get taken.')}</div><button class="btn block mt" data-a="pklook" data-v="${kind}">👀 ${T('Сходить посмотреть ещё раз', 'Сходити подивитися ще раз', 'Go and look again')} · ${walkMins(kind)} ${T('мин', 'хв', 'min')}</button></div>`;
  const m = lotMap(kind);
  const bay = (c) => {
    const lab = { rent: T('АРЕНДА', 'ОРЕНДА', 'TO LET'), sale: T('ПРОДАЖА', 'ПРОДАЖ', 'FOR SALE'), mine: T('МОЁ', 'МОЄ', 'MINE'), resv: kind === 'under' ? '♿' : '🚫', away: '', busy: '' }[c.st];
    const car = c.st === 'busy' ? `<i class="pm-car" style="background:${c.col}"></i>` : '';
    const act = c.offer ? `data-a="pkbay" data-v="${c.offer.id}"` : '';
    return `<button class="pm-bay ${c.st} ${P.sel === c.offer?.id ? 'sel' : ''}" ${act}><small>${c.no}</small>${car}${lab ? `<b>${lab}</b>` : ''}</button>`;
  };
  const rows = [];
  for (let r = 0; r < m.rows; r++) { rows.push(`<div class="pm-row" style="grid-template-columns:repeat(${m.cols},1fr)">${m.cells.slice(r * m.cols, (r + 1) * m.cols).map(bay).join('')}</div>`); if (r % 2 === 0 && r < m.rows - 1) rows.push(`<div class="pm-lane">${kind === 'gsk' ? '' : '⇠ ⇠ ⇠'}</div>`); }
  const list = m.cells.filter((c) => c.offer);
  const sel = list.find((c) => c.offer.id === P.sel)?.offer || null;
  const refused = (o) => st.refused[o.id] === pkWeek();
  const offerCard = (o) => {
    const n = st.neg[o.id];
    const price = o.sale ? `${T('от', 'від', 'from')} ${fmt(o.base)}` : PK[kind].owner ? `${T('от', 'від', 'from')} ${fmt(o.base)}/${per()}` : `${fmt(o.base)}/${per()}`;
    return `<div class="card pk-off ${P.sel === o.id ? 'hl' : ''}"><div class="row between"><b>№${o.bay} · ${o.sale ? `🟡 ${T('продаётся', 'продається', 'for sale')}` : `🟢 ${T('аренда', 'оренда', 'to let')}`}</b><b>${price}</b></div>
      <div class="small m">${o.who ? `${T('Владелец', 'Власник', 'Owner')}: ${esc(L(o.who))}` : kind === 'yard' ? T('Распределяет УК/ОСББ', 'Розподіляє УК/ОСББ', 'Assigned by the building manager') : T('Оформляет сторож', 'Оформлює сторож', 'The watchman signs you up')}${kind === 'gsk' ? ` · ${T('плюс взносы ГСК', 'плюс внески ГБК', 'plus co‑op dues')}` : ''}</div>
      <div class="pk-need">${o.docs.length ? o.docs.map((d) => `<span>${PDOCS[d].ic} ${esc(L(PDOCS[d].n))}</span>`).join('') : `<span>✔ ${T('без документов', 'без документів', 'no paperwork')}</span>`}</div>
      ${refused(o) ? `<div class="small r mt">✖ ${T('Владелец отказал.', 'Власник відмовив.', 'The owner said no.')}</div>` : o.who ? `<button class="btn sm mt" data-a="pkneg" data-v="${o.id}">💬 ${n ? T('Продолжить разговор', 'Продовжити розмову', 'Continue the talk') : o.sale ? T('Позвонить продавцу', 'Подзвонити продавцю', 'Call the seller') : T('Позвонить владельцу', 'Подзвонити власнику', 'Call the owner')}</button>` : `<button class="btn sm mt" data-a="pktake" data-v="${o.id}">${T('Оформить', 'Оформити', 'Sign up')}</button>`}</div>`;
  };
  return `<div class="pm pm-${kind}"><div class="pm-title">${pkName(kind)}<small>${T('занято', 'зайнято', 'taken')} ${m.cells.filter((c) => c.st === 'busy' || c.st === 'mine').length}/${m.cells.length}</small></div>${rows.join('')}
      <div class="pm-legend"><span><i class="l-rent"></i>${T('сдаётся', 'здається', 'to let')}</span><span><i class="l-sale"></i>${T('продаётся', 'продається', 'for sale')}</span><span><i class="l-away"></i>${T('пусто — хозяин в отъезде', 'порожньо — господар у відʼїзді', 'empty — owner away')}</span><span><i class="l-busy"></i>${T('занято', 'зайнято', 'taken')}</span></div></div>
    ${list.length ? (sel ? offerCard(sel) : '') + list.filter((c) => c.offer.id !== P.sel).map((c) => offerCard(c.offer)).join('') : `<div class="card warn">😕 ${T('Свободных мест нет: ни в аренду, ни на продажу. Пустые места — чьи‑то, хозяева просто уехали. Загляните через пару дней.', 'Вільних місць немає: ні в оренду, ні на продаж. Порожні місця — чиїсь, господарі просто поїхали. Зазирніть за пару днів.', 'No bays to rent or buy. The empty ones belong to people who are away. Check back in a couple of days.')}</div>`}
    <p class="tiny m">${T('Картина меняется: места занимают другие, а раз в два дня всё обновляется.', 'Картина змінюється: місця займають інші, а раз на два дні все оновлюється.', 'It changes: others take bays, and everything refreshes every two days.')}</p>`;
}
function negView(p) {
  const st = pstate();
  const rv = Object.values(st.reviews || {}).find((x) => x.o.id === p.id);
  const o = rv ? rv.o : findOffer(p.id);
  if (!o) return empty('home', T('Предложение уже неактуально', 'Пропозиція вже неактуальна', 'This offer is gone'));
  const n = negOf(o, rv ? { spotId: rv.o.id.slice(4), price: o.base, ask: st.neg[o.id]?.ask } : null);
  const msgs = n.msgs.map((m) => `<div class="msg ${m.f}">${esc(m.tx)}</div>`).join('');
  let opts = '';
  if (n.st === 'open') {
    opts += `<button class="opt solid" data-a="pkagree" data-v="${o.id}">✅ ${T('Согласиться', 'Погодитися', 'Agree')} · ${fmt(n.ask)}${o.sale ? '' : '/' + per()}</button>`;
    for (const k of Object.keys(ARGS)) if (!n.used.includes(k)) opts += `<button class="opt" data-a="pkarg" data-v="${o.id}" data-w="${k}">${ARGS[k].ic} ${esc(argLabel(o, k))}</button>`;
    if (n.ask > n.base) opts += `<button class="opt red" data-a="pkrefuse" data-v="${o.id}">✋ ${T('Не платить повышенную — только', 'Не платити підвищену — тільки', 'No raise — only')} ${fmt(n.base)}</button>`;
  } else if (n.st === 'agreed' && !n.review) {
    const months = 1 + (n.prepay || 0);
    opts += o.sale ? `<button class="opt solid" data-a="pksign" data-v="${o.id}">🔑 ${T('Купить место', 'Купити місце', 'Buy the bay')} · ${fmt(n.ask)}</button>` : `<button class="opt solid" data-a="pksign" data-v="${o.id}">✍️ ${T('Подписать', 'Підписати', 'Sign')} · ${fmt(n.ask * months)}${months > 1 ? ` (${months} ${per()})` : ''}</button>`;
  }
  const wa = wealthAsk(o);
  const head = `<div class="card"><div class="row between"><b>${pkName(o.kind)}${o.bay ? ` · №${o.bay}` : ''}</b><b>${fmt(n.ask)}${o.sale ? '' : '/' + per()}</b></div><div class="small m">${o.who ? esc(L(o.who)) + ' · ' : ''}${T('обычная цена', 'звичайна ціна', 'normal price')} ${fmt(n.base)} · ${T('терпение', 'терпіння', 'patience')} ${'●'.repeat(Math.max(0, n.patience))}${'○'.repeat(Math.max(0, 3 - n.patience))}</div>${wa.k > 0.05 && n.st === 'open' ? `<div class="small o">👀 ${T('Владелец видит, что у вас есть деньги — и накручивает цену', 'Власник бачить, що у вас є гроші, — і накручує ціну', 'The owner can tell you have money — and is padding the price')}</div>` : ''}</div>`;
  return `${head}<div class="msgs">${msgs}</div>${opts ? `<div class="opts">${opts}</div>` : `<div class="msg sys" style="margin:10px auto">${n.st === 'refused' ? T('Разговор окончен', 'Розмову завершено', 'Conversation over') : T('Договорились', 'Домовилися', 'Agreed')}</div>`}`;
}
function flatView(p) {
  const x = findListing(p.id);
  if (!x) return empty('home', T('Объявление снято', 'Оголошення знято', 'Listing removed'));
  const h = houseDef(KINDS[x.type].def);
  const facts = [[T('Площадь', 'Площа', 'Area'), x.type === 'hostel' ? T('койка', 'ліжко', 'a bed') : `${x.m2} м²`], ...(x.floor ? [[T('Этаж', 'Поверх', 'Floor'), `${x.floor} / ${x.floors}`]] : []), [T('До метро', 'До метро', 'Metro'), `${x.metro} ${T('мин', 'хв', 'min')}`], [T('Район', 'Район', 'District'), L(x.district)], [T('Склад', 'Склад', 'Storage'), `📦 ${h.store}`], [T('Гараж', 'Гараж', 'Garage'), `🚗 ${h.garage}`], [T('Сон', 'Сон', 'Sleep'), `💤 ×${sleepOf(x)}`], [T('Сдаёт', 'Здає', 'Listed by'), x.agency ? T('агентство', 'агентство', 'agency') : T('собственник', 'власник', 'owner')]];
  let body = `${gal(x.photos)}<div class="re-dhead">${tierBadge(x.tier)}<h2>${esc(titleOf(x))}</h2><small class="m">${esc(L(CITY[x.city].name))} · ${esc(L(x.district))}</small></div><p class="p">${esc(L(TIERS[x.tier].d))}</p><div class="re-facts">${facts.map(([k, v]) => `<div><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join('')}</div>`;
  body += contactCard(x) + notes(x);
  if (x.kind === 'rent') body += `<div class="rt-prices">${x.periods.map((per) => `<span><small>${L(PERIODS[per].n)}</small><b>${fmt(priceFor(x, per))}</b></span>`).join('')}</div><div class="row between mt"><span class="small m">${T('Цена', 'Ціна', 'Price')}</span>${deltaTag(x)}</div>${confirmed(x) ? `<button class="btn block mt" data-a="hrent" data-v="${x.id}">🔑 ${T('Снять', 'Зняти', 'Rent it')}</button>` : gateHTML(x)}`;
  else {
    const rentMo = perDayOf(x) * 30;
    body += `<div class="card mt"><div class="kv"><span>${T('Цена', 'Ціна', 'Price')} ${deltaTag(x)}</span><b>${salePrice(x) < x.price ? `<s class="m">${fmt(x.price)}</s> ` : ''}${fmt(salePrice(x))}</b></div><div class="kv"><span>${T('Сдавать можно за', 'Здавати можна за', 'Could rent for')}</span><b class="g">≈ ${fmt(rentMo)}/${T('мес', 'міс', 'mo')}</b></div><div class="kv"><span>${T('Окупаемость', 'Окупність', 'Payback')}</span><b>≈ ${Math.round(x.price / Math.max(1, rentMo))} ${T('мес', 'міс', 'mo')}</b></div>${renoQuote({ ...x }) ? `<div class="kv"><span>${T('Ремонт до', 'Ремонт до', 'Renovate to')} «${esc(tierName(renoQuote(x).next))}»</span><b>${fmt(renoQuote(x).cost)}</b></div>` : ''}</div>${confirmed(x) ? `<button class="btn block mt" data-a="hbuy" data-v="${x.id}">${T('Купить', 'Купити', 'Buy')} · ${fmt(salePrice(x))}</button>` : gateHTML(x)}`;
  }
  return body;
}
function chatView(p) {
  const x = findListing(p.id);
  if (!x) return empty('chat', T('Объявление снято — переписка закрыта', 'Оголошення знято — листування закрито', 'The ad is gone — chat closed'));
  const per = personOf(x), c = dealOf(x.id), f = factsOf(x);
  const price = x.kind === 'rent' ? `${fmt(priceFor(x, x.periods.includes('month') ? 'month' : 'week'))}/${L(PERIODS[x.periods.includes('month') ? 'month' : 'week'].per)}` : fmt(salePrice(x));
  const top = `<div class="chat-top re-ctop" data-a="hopen" data-v="${x.id}"><div class="th">${x.photos?.length ? `<img src="${photoUrl(x.photos[0])}" alt="">` : ''}</div><div class="grow"><b style="font-size:17px">${price}</b><div class="small m">${esc(titleOf(x))} · ${esc(tierName(x.tier))}</div></div></div>
    <div class="re-who"><span class="re-ava" style="background:${per.col}">${esc(per.ini)}</span><div class="grow"><b>${esc(per.name)}</b><small>${esc(per.role)}</small></div>${chatBadge(x.id) ? `<span class="tag ${chatBadge(x.id)[2]}">${chatBadge(x.id)[0]} ${esc(chatBadge(x.id)[1])}</span>` : ''}</div>`;
  const msgs = (c?.msgs || []).map((m) => `<div class="msg ${m.f}">${esc(m.tx)}${m.f === 'sys' ? '' : `<span class="tm">${hhmm(m.t)}</span>`}</div>`).join('');
  const typing = c?.wait ? (f.avail === 'ghost' ? `<div class="msg sys">✓✓ ${T('доставлено', 'доставлено', 'delivered')}</div>` : `<div class="msg them re-typing"><i></i><i></i><i></i></div>`) : '';
  let opts = questions(x).map((k) => `<button class="opt" data-a="rask" data-v="${x.id}" data-k="${k}">${Q_ICON[k]} ${esc(qLabel(x, k))}</button>`).join('');
  if (c && !c.wait) {
    if (c.st === 'bait' && c.scamAsk) opts += `<button class="opt red" data-a="rpay" data-v="${x.id}">💸 ${T('Перевести предоплату', 'Переказати передоплату', 'Send the prepayment')} ${fmt(c.scamAsk)}</button>`;
    if (c.st === 'ok' && c.holdAsk && !c.held && c.holdUntil) opts += `<button class="opt" data-a="rpay" data-v="${x.id}">💸 ${T('Внести задаток', 'Внести завдаток', 'Pay the holding deposit')} ${fmt(c.holdAsk)}</button>`;
    if (c.st === 'bait' || (c.st === 'ok' && c.holdAsk && !c.held)) opts += `<button class="opt" data-a="rreport" data-v="${x.id}">🛡 ${T('Пожаловаться — это развод', 'Поскаржитися — це розвод', 'Report — it’s a scam')}</button>`;
    if (c.viewOk && !c.viewed && c.st === 'ok') opts += `<button class="opt" data-a="rview" data-v="${x.id}">🚕 ${T('Съездить на просмотр', 'Зʼїздити на перегляд', 'Go to the viewing')} · ${fmt(viewCost(x))}</button>`;
    if (c.st === 'ok') opts += x.kind === 'rent' ? `<button class="opt solid" data-a="hrent" data-v="${x.id}">🔑 ${T('Снять', 'Зняти', 'Rent it')}</button>` : `<button class="opt solid" data-a="hbuy" data-v="${x.id}">🏠 ${T('Купить', 'Купити', 'Buy')} · ${fmt(salePrice(x))}</button>`;
  }
  const again = nextAskIn(x);
  if (again && !c?.wait) opts += `<div class="re-again">⏳ ${T('Спросить снова можно через', 'Запитати знову можна через', 'You can ask again in')} <span data-cd="${G.s.t + again}"></span></div>`;
  const end = !opts && !c?.wait ? `<div class="msg sys" style="margin:10px auto">${c?.st === 'done' ? T('Сделка состоялась', 'Угода відбулася', 'Deal done') : T('Диалог завершён', 'Діалог завершено', 'Conversation closed')}</div>` : '';
  return `<div class="re-chat" data-rechat="${x.id}">${top}${notes(x)}<div class="msgs">${msgs || `<div class="msg sys">${T('Напишите, чтобы узнать, актуально ли объявление', 'Напишіть, щоб дізнатися, чи актуальне оголошення', 'Write to find out if the ad is still live')}</div>`}${typing}</div>${opts ? `<div class="opts">${opts}</div>` : end}</div>`;
}
function homeView(p) {
  const h = myHome(p.id);
  if (!h) return empty('home', T('Уже продано', 'Вже продано', 'Already sold'));
  const q = renoQuote(h), v = homeValue(h);
  const st = h.reno ? `🛠 ${T('Ремонт: будет', 'Ремонт: буде', 'Renovating to')} «${esc(tierName(h.reno.to))}» · <span data-cd="${h.reno.until}" data-fmt="long"></span>` : h.mode === 'live' ? `🏠 ${T('Вы здесь живёте', 'Ви тут живете', 'You live here')}` : h.mode === 'rent' ? (h.tenant ? `🔑 ${esc(L(h.tenant.who))} · ${fmt(h.tenant.perDay * 30)}/${T('мес', 'міс', 'mo')} · ${T('съедут', 'зʼїдуть', 'leave')} ${esc(fmtDate(gameDate(h.tenant.until)))}` : `🔎 ${T('Ищем жильцов', 'Шукаємо мешканців', 'Looking for tenants')} · ${T('цена', 'ціна', 'price')} ${fmt(marketRent(h) * h.rentK * 30)}/${T('мес', 'міс', 'mo')}`) : `💤 ${T('Пустует', 'Порожня', 'Empty')}`;
  return `${gal(h.photos)}<div class="re-dhead">${tierBadge(h.tier)}<h2>${esc(titleOf(h))}</h2><small class="m">${esc(L(CITY[h.city]?.name || ''))} · ${esc(L(h.district || ['', '', '']))}</small></div>
    <div class="card"><div class="kv"><span>${T('Статус', 'Статус', 'Status')}</span><b>${st}</b></div><div class="kv"><span>${T('Стоимость сейчас', 'Вартість зараз', 'Worth now')}</span><b>${fmt(v)}</b></div><div class="kv"><span>${T('Куплено за', 'Куплено за', 'Bought for')}</span><b>${fmt(h.paid || 0)}${h.spent ? ` + ${T('ремонт', 'ремонт', 'reno')} ${fmt(h.spent)}` : ''}</b></div><div class="kv"><span>${T('Заработано на аренде', 'Зароблено на оренді', 'Earned from rent')}</span><b class="g">${fmt(h.earned || 0)}</b></div>${h.wear ? `<div class="kv"><span>${T('Износ после жильцов', 'Знос після мешканців', 'Wear from tenants')}</span><b class="r">−${Math.round(h.wear * 100)}%</b></div>` : ''}</div>
    ${h.reno ? '' : `<div class="btns"><button class="btn" data-a="hlive" data-v="${h.id}" ${h.mode === 'live' ? 'disabled' : ''}>🏠 ${T('Жить здесь', 'Жити тут', 'Live here')}</button>${h.mode === 'rent' ? `<button class="btn dark" data-a="hstop" data-v="${h.id}">${T('Перестать сдавать', 'Перестати здавати', 'Stop renting')}</button>` : `<button class="btn dark" data-a="hlet" data-v="${h.id}">🔑 ${T('Сдавать', 'Здавати', 'Rent out')}</button>`}</div>
    ${q ? `<button class="btn dark block mt" data-a="hreno" data-v="${h.id}">🛠 ${T('Ремонт до', 'Ремонт до', 'Renovate to')} «${esc(tierName(q.next))}» · ${fmt(q.cost)} · ${q.days} ${T('дн.', 'дн.', 'days')}</button>` : ''}`}
    <button class="btn red block mt" data-a="hsell" data-v="${h.id}">${T('Продать', 'Продати', 'Sell')} · ${fmt(v * 0.95)}</button><p class="tiny m">${T('Агентство берёт 5% при продаже.', 'Агентство бере 5% при продажу.', 'The agency takes 5% on a sale.')}</p>`;
}
export const realtyApp = {
  id: 'realty', glyph: 'home', lvl: 1,
  name: ['Недвижимость', 'Нерухомість', 'Real estate'], colors: ['#ff9a5c', '#e2622a'],
  views: { main: realtyMain, flat: flatView, home: homeView, chat: chatView, pneg: negView, pmap: mapView },
  actions: {
    pkneg: (id) => go('pneg', { id }),
    pklook: (kind) => { const m = lookAt(kind); P.sel = null; sfx('tap'); toast(m.rent + m.sale ? T(`Нашлись места: в аренду ${m.rent}${m.sale ? `, продаётся ${m.sale}` : ''}`, `Знайшлися місця: в оренду ${m.rent}${m.sale ? `, продається ${m.sale}` : ''}`, `Found bays: ${m.rent} to let${m.sale ? `, ${m.sale} for sale` : ''}`) : T('Свободных мест нет', 'Вільних місць немає', 'No free bays'), m.rent + m.sale ? 'g' : 'r'); if (UI.view === 'pmap') rerender(); else go('pmap', { kind }); },
    pkmap: (kind) => { P.sel = null; go('pmap', { kind }); },
    pkbay: (id) => { P.sel = P.sel === id ? null : id; sfx('tap'); rerender(); },
    pksell: async (spId) => { const sp = pstate().spots.find((x) => x.id === spId); if (!sp) return; if (!(await confirmBox(T('Продать место?', 'Продати місце?', 'Sell the bay?'), `${fmt(sellPrice(sp))} · ${T('куплено за', 'куплено за', 'bought for')} ${fmt(sp.paid || 0)}`, T('Продать', 'Продати', 'Sell')))) return; const r = sellSpot(spId); if (r.ok) { sfx('cash'); toast(`+${fmt(r.v)}`, 'g'); } rerender(); },
    pkagree: (id) => { const st = pstate(); const rv = Object.values(st.reviews || {}).find((x) => x.o.id === id); const o = rv ? rv.o : findOffer(id); if (!o) return; agree(o, negOf(o)); sfx('tap'); rerender(); },
    pkarg: async (id, el) => {
      const st = pstate(); const rv = Object.values(st.reviews || {}).find((x) => x.o.id === id); const o = rv ? rv.o : findOffer(id); if (!o) return;
      const k = el.dataset.w; let pitch = 0;
      if (k === 'pitch') { const r = await playMini('timing', { title: T('Убеждаем владельца', 'Переконуємо власника', 'Persuading the owner'), rounds: 2, label: T('Попадите в зелёную зону — аргумент сработает', 'Влучте в зелену зону — аргумент спрацює', 'Hit the green zone to land your argument') }); if (r.quit) return; pitch = r.score; }
      const n = argue(o, negOf(o), k, pitch); sfx(n.st === 'refused' ? 'lose' : 'tap'); rerender();
    },
    pkrefuse: (id) => { const st = pstate(); const rv = Object.values(st.reviews || {}).find((x) => x.o.id === id); const o = rv ? rv.o : findOffer(id); if (!o) return; const n = refuseRaise(o, negOf(o)); sfx(n.st === 'refused' ? 'lose' : n.st === 'agreed' ? 'win' : 'tap'); rerender(); },
    pksign: (id) => { const o = findOffer(id); if (!o) { toast(T('Пока вы думали, место заняли', 'Поки ви думали, місце зайняли', 'Someone took the bay while you were thinking'), 'r'); back(); return; } const r = take(o); if (r.ok) { sfx('cash'); toast(o.sale ? T('Куплено — осталось оформить документы', 'Куплено — лишилося оформити документи', 'Bought — now the paperwork') : T('Договор подписан — осталось оформить документы', 'Договір підписано — лишилося оформити документи', 'Signed — now the paperwork'), 'g'); R.tab = 'park'; UI.stack.length = 1; replace('main'); } else { toast(r.msg || '—', 'r'); if (r.gone) back(); } },
    pktake: async (id) => {
      const o = findOffer(id); if (!o) return;
      const msg = o.kind === 'build' ? T(`Подать заявление на разрешение? Пошлина ${fmt(nicePrice(PDOCS.permit.fee * Math.max(0.5, countryOf(G.s.player.city).wage)))}, рассмотрение ~3 дня. Потом стройка ${fmt(o.base)}.`, `Подати заяву на дозвіл? Мито ${fmt(nicePrice(PDOCS.permit.fee * Math.max(0.5, countryOf(G.s.player.city).wage)))}, розгляд ~3 дні. Потім будівництво ${fmt(o.base)}.`, `Apply for a permit? Fee ${fmt(nicePrice(PDOCS.permit.fee * Math.max(0.5, countryOf(G.s.player.city).wage)))}, ~3 days. Then construction ${fmt(o.base)}.`) : o.kind === 'lawn' ? T('Это незаконно: по утрам ездят эвакуаторы, штраф + штрафстоянка.', 'Це незаконно: зранку їздять евакуатори, штраф + штрафмайданчик.', 'It’s illegal: tow trucks come in the mornings, fine + impound.') : T(`Первый месяц ${fmt(o.base)} сразу.`, `Перший місяць ${fmt(o.base)} одразу.`, `First month ${fmt(o.base)} now.`);
      if (!(await confirmBox(L(PK[o.kind].n), msg, o.kind === 'build' ? T('Подать', 'Подати', 'Apply') : T('Оформить', 'Оформити', 'Sign up')))) return;
      const r = take(o);
      if (!r.ok) return toast(r.msg || '—', 'r');
      if (o.kind === 'build') orderPDoc(r.sp.id, 'permit');
      if (MAP_KINDS.includes(o.kind)) { R.tab = 'park'; UI.stack.length = 1; replace('main'); }
      sfx('cash'); toast(r.sp.st === 'active' ? T(`Готово: +${r.sp.slots} место`, `Готово: +${r.sp.slots} місце`, `Done: +${r.sp.slots} space`) : T('Оформите документы, чтобы начать пользоваться', 'Оформіть документи, щоб почати користуватися', 'Do the paperwork to start using it'), 'g'); rerender();
    },
    pkdoc: (spId, el) => { const r = orderPDoc(spId, el.dataset.w); if (r.refused) { sfx('lose'); toast(r.msg, 'r'); } else if (r.ok) { sfx('ok'); toast(T('Документ оформляется', 'Документ оформлюється', 'In progress'), 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    pkbuild: (spId) => { const r = startBuild(spId); if (r.ok) { sfx('ok'); toast(T('Бригада начала стройку', 'Бригада почала будівництво', 'The crew started building'), 'g'); } else toast(r.msg || '—', 'r'); rerender(); },
    pkrel: async (spId) => { if (await confirmBox(T('Освободить место?', 'Звільнити місце?', 'Give up the space?'), T('Оплаченный месяц не возвращается.', 'Сплачений місяць не повертається.', 'The paid month isn’t refunded.'), T('Освободить', 'Звільнити', 'Give up'), undefined, true)) { release(spId); rerender(); } },
    rt: (v) => { R.tab = v; R.type = ''; rerender(); },
    htype: (v) => { R.type = v; rerender(); },
    hopen: (id) => go('flat', { id }),
    rchat: (id) => go('chat', { id }),
    rask: (id, el) => { const r = ask(id, el.dataset.k); if (r.ok) sfx('tap'); rerender(); },
    rview: (id) => { const r = goView(id); if (r.ok) { sfx(r.old ? 'err' : 'ok'); toast(r.old ? T('В жизни хуже, чем на фото', 'Наживо гірше, ніж на фото', 'Worse than the photos') : T('Всё как на фото', 'Усе як на фото', 'Just like the photos'), r.old ? 'r' : 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    rpay: async (id) => {
      const c = dealOf(id), x = findListing(id); if (!c || !x) return;
      const sum = c.st === 'bait' ? c.scamAsk : c.holdAsk;
      if (!(await confirmBox(T('Перевести деньги?', 'Переказати гроші?', 'Send the money?'), esc(`${fmt(sum)} → ${personOf(x).name}. ${T('Вернуть перевод на карту нельзя.', 'Повернути переказ на картку не можна.', 'A card transfer can’t be undone.')}`), T('Перевести', 'Переказати', 'Send')))) return;
      const r = payPrepay(id);
      if (!r.ok) toast(r.msg || T('Не получилось', 'Не вийшло', 'Didn’t work'), 'r');
      else if (r.scam) { sfx('lose'); toast(T('Вас развели: «хозяин» пропал', 'Вас ошукали: «господар» зник', 'Scammed: the “owner” vanished'), 'r'); }
      else { sfx('cash'); toast(T('Задаток внесён — жильё держат за вами', 'Завдаток внесено — житло тримають за вами', 'Deposit paid — it’s held for you'), 'g'); }
      rerender();
    },
    rreport: async (id) => {
      if (!(await confirmBox(T('Пожаловаться на объявление?', 'Поскаржитися на оголошення?', 'Report this ad?'), T('Если это честный хозяин — он обидится и перестанет отвечать.', 'Якщо це чесний господар — він образиться й перестане відповідати.', 'If the owner is honest, they’ll be offended and stop replying.'), T('Пожаловаться', 'Поскаржитися', 'Report'), undefined, true))) return;
      const r = report(id);
      if (r.ok) { sfx(r.right ? 'win' : 'err'); toast(r.right ? T('Мошенник пойман! +опыт', 'Шахрая спіймано! +досвід', 'Scammer caught! +XP') : T('Объявление оказалось честным…', 'Оголошення виявилося чесним…', 'The ad was genuine…'), r.right ? 'g' : 'r'); }
      rerender();
    },
    hmine: (id) => go('home', { id }),
    hrent: async (id) => {
      const l = findListing(id); if (!l) return;
      if (!confirmed(l)) { go('chat', { id }); return; }
      const pers = factsOf(l).req === 'long' && dealOf(id)?.knowReq && l.periods.includes('month') ? ['month'] : l.periods;
      const p = await choose(titleOf(l), pers.map((per) => { const c = moveInCost(l, per); return { v: per, label: `${L(PERIODS[per].n)} · ${fmt(c.price)}`, sub: [c.deposit ? T(`залог ${fmt(c.deposit)}`, `застава ${fmt(c.deposit)}`, `deposit ${fmt(c.deposit)}`) : '', c.fee ? T(`комиссия ${fmt(c.fee)}`, `комісія ${fmt(c.fee)}`, `fee ${fmt(c.fee)}`) : '', c.held ? T(`задаток −${fmt(c.held)}`, `завдаток −${fmt(c.held)}`, `deposit paid −${fmt(c.held)}`) : '', T(`сразу ${fmt(c.total)}`, `одразу ${fmt(c.total)}`, `now ${fmt(c.total)}`)].filter(Boolean).join(' · ') }; }), renting() ? T('Старое жильё освободится: залог вернут, оплаченные дни — нет.', 'Старе житло звільниться: заставу повернуть, оплачені дні — ні.', 'Your old place is released: the deposit comes back, prepaid days don’t.') : '');
      if (!p) return;
      const r = rentListing(l, p);
      if (r.ok) {
        sfx('win'); toast(T('Переезд!', 'Переїзд!', 'Moved in!') + (r.back ? T(` Залог вернули: ${fmt(r.back)}`, ` Заставу повернули: ${fmt(r.back)}`, ` Deposit back: ${fmt(r.back)}`) : ''), 'g'); R.tab = 'rent'; go('main');
        if (r.surprise) setTimeout(() => toast(T(`Фото были старые: на деле «${tierName(r.surprise)}»`, `Фото були старі: насправді «${tierName(r.surprise)}»`, `The photos were old: it’s really “${tierName(r.surprise)}”`), 'r'), 1400);
      } else { if (r.refused) { refusedBy(id, r.msg); go('chat', { id }); } toast(r.msg, 'r'); }
    },
    hbuy: async (id) => {
      const l = findListing(id); if (!l) return;
      if (!confirmed(l)) { go('chat', { id }); return; }
      const pr = salePrice(l);
      if (!(await confirmBox(titleOf(l), T(`${fmt(pr)} + госпошлина 1%. Жильё станет вашим: живите, сдавайте, ремонтируйте или перепродайте.`, `${fmt(pr)} + держмито 1%. Житло стане вашим: живіть, здавайте, ремонтуйте або перепродайте.`, `${fmt(pr)} + 1% fee. It’s yours: live in, rent out, renovate or resell.`), T('Купить', 'Купити', 'Buy')))) return;
      const r = buyListing(l);
      if (r.ok) {
        sfx('win'); toast(T('Поздравляем с покупкой!', 'Вітаємо з покупкою!', 'Congratulations!'), 'g'); R.tab = 'homes'; go('home', { id: r.h.id });
        if (r.surprise) setTimeout(() => toast(T(`Фото были старые: на деле «${tierName(r.surprise)}»`, `Фото були старі: насправді «${tierName(r.surprise)}»`, `The photos were old: it’s really “${tierName(r.surprise)}”`), 'r'), 1400);
      } else toast(r.msg, 'r');
    },
    hlive: async (id) => { const r = liveIn(id); if (r.ok) { sfx('ok'); toast(T('Переехали в своё жильё', 'Переїхали у власне житло', 'Moved into your home'), 'g'); } else toast(r.msg, 'r'); rerender(); },
    hlet: async (id) => {
      const h = myHome(id); if (!h) return;
      const m = marketRent(h) * 30;
      const v = await choose(T('Цена аренды', 'Ціна оренди', 'Rent price'), [[0.8, T('Ниже рынка — найдут за день', 'Нижче ринку — знайдуть за день', 'Below market — found in a day')], [1, T('По рынку', 'За ринком', 'Market price')], [1.2, T('Выше рынка — искать дольше', 'Вище ринку — шукати довше', 'Above market — takes longer')], [1.45, T('Сильно выше — могут искать неделями', 'Значно вище — можуть шукати тижнями', 'Way above — could take weeks')]].map(([k, sub]) => ({ v: String(k), label: `${fmt(m * k)}/${T('мес', 'міс', 'mo')}`, sub })));
      if (!v) return;
      const r = rentOut(id, +v); if (r.ok) { sfx('ok'); toast(T('Объявление о сдаче размещено', 'Оголошення про здачу розміщено', 'Listed for rent'), 'g'); } else toast(r.msg, 'r'); rerender();
    },
    hstop: async (id) => { if (await confirmBox(T('Перестать сдавать?', 'Перестати здавати?', 'Stop renting?'), T('Жильцы съедут.', 'Мешканці зʼїдуть.', 'The tenants will leave.'), T('Да', 'Так', 'Yes'))) { stopRent(id); rerender(); } },
    hreno: async (id) => { const h = myHome(id); const q = h && renoQuote(h); if (!q) return; if (!(await confirmBox(T(`Ремонт до «${tierName(q.next)}»`, `Ремонт до «${tierName(q.next)}»`, `Renovate to “${tierName(q.next)}”`), T(`${fmt(q.cost)}, ${q.days} дн. Пока идёт ремонт, жить и сдавать нельзя. Стоимость и аренда вырастут.`, `${fmt(q.cost)}, ${q.days} дн. Поки триває ремонт, жити й здавати не можна. Вартість і оренда зростуть.`, `${fmt(q.cost)}, ${q.days} days. No living or renting while it runs. Value and rent go up.`), T('Начать', 'Почати', 'Start')))) return; const r = renovate(id); if (r.ok) { h.spent = (h.spent || 0) + q.cost; sfx('ok'); toast(T('Бригада приступила', 'Бригада почала', 'The crew started'), 'g'); } else toast(r.msg, 'r'); rerender(); },
    hsell: async (id) => { const h = myHome(id); if (!h) return; if (!(await confirmBox(T('Продать?', 'Продати?', 'Sell?'), `${titleOf(h)} · ${fmt(homeValue(h) * 0.95)}`, T('Продать', 'Продати', 'Sell'), undefined, true))) return; const r = sellHome(id); if (r.ok) { sfx('cash'); toast(T(`Продано: ${fmt(r.v)} (${r.profit >= 0 ? '+' : ''}${fmt(r.profit)})`, `Продано: ${fmt(r.v)} (${r.profit >= 0 ? '+' : ''}${fmt(r.profit)})`, `Sold: ${fmt(r.v)} (${r.profit >= 0 ? '+' : ''}${fmt(r.profit)})`), 'g'); go('main'); } },
    hpay: async () => { const r = prepay(1); if (r.ok) { sfx('cash'); toast(T('Аренда продлена', 'Оренду продовжено', 'Rent extended'), 'g'); } else toast(r.msg, 'r'); rerender(); },
    hperiod: async () => { const H = G.s.house; const v = await choose(T('Платить за', 'Платити за', 'Pay per'), Object.keys(PERIODS).map((k) => ({ v: k, label: `${L(PERIODS[k].n)} · ${fmt(Math.round((H.perDay || 0) * PERIODS[k].days * PERIODS[k].k))}`, sub: T('со следующего платежа', 'з наступного платежу', 'from the next payment') }))); if (v) { setPeriod(v); rerender(); } },
    hauto: () => { G.s.house.auto = !G.s.house.auto; rerender(); },
    leave: async () => { if (await confirmBox(T('Съехать?', 'Зʼїхати?', 'Move out?'), G.s.house.own ? T('Жильё останется вашим, просто будет пустовать.', 'Житло залишиться вашим, просто буде порожнім.', 'It stays yours, just empty.') : T('Залог вернут, оплаченные дни сгорят.', 'Заставу повернуть, оплачені дні згорять.', 'The deposit comes back, prepaid days are lost.'), T('Да', 'Так', 'Yes'), undefined, true)) { const b = moveOut(); if (b) toast(T(`Залог вернули: ${fmt(b)}`, `Заставу повернули: ${fmt(b)}`, `Deposit back: ${fmt(b)}`), 'g'); rerender(); } },
    prent: async (id) => { const r = acquireProp(id, false); toast(r.ok ? T('Помещение арендовано', 'Приміщення орендовано', 'Leased') : r.msg, r.ok ? 'g' : 'r'); rerender(); },
    pbuy: async (id) => { const p = PROPS.find((x) => x.id === id); if (!(await confirmBox(L(p.n), fmt(propPrice(p)), T('Купить', 'Купити', 'Buy')))) return; const r = acquireProp(id, true); toast(r.ok ? T('Куплено!', 'Куплено!', 'Purchased!') : r.msg, r.ok ? 'g' : 'r'); rerender(); },
    release: async (id) => { if (await confirmBox(T('Вы уверены?', 'Ви впевнені?', 'Are you sure?'), T('Магазин на этой точке закроется.', 'Магазин на цій точці закриється.', 'Any store here will close.'), T('Да', 'Так', 'Yes'), undefined, true)) { releaseProp(id); rerender(); } },
  },
};

// ---------------------------------------------------------------- TRAVEL
const TV = { sort: 'near', cat: 'phones' };
function travelMain() {
  const s = G.s;
  if (s.travel) {
    const tr = s.travel;
    return `<div class="card center" style="padding:24px"><div style="font-size:60px" class="pulse">${MODES[tr.mode][3]}</div><h3>${esc(L(CITY[tr.from].name))} → ${esc(L(CITY[tr.to].name))}</h3><div class="small m">${T('Прибытие через', 'Прибуття через', 'Arriving in')} <b data-cd="${tr.eta}" data-fmt="long"></b></div><div class="bar mt"><i data-bar-from="${tr.start}" data-bar-to="${tr.eta}"></i></div><div class="small m mt">${T('В багаже', 'У багажі', 'Luggage')}: ${tr.carry.length}</div></div>`;
  }
  const here = s.player.city;
  const myIdx = regionMult(here, TV.cat);
  let cities = CITIES.filter((c) => c.id !== here).map((c) => ({ c, km: distanceKm(here, c.id), idx: regionMult(c.id, TV.cat) / myIdx }));
  if (TV.sort === 'near') cities.sort((a, b) => a.km - b.km);
  if (TV.sort === 'exp') cities.sort((a, b) => b.idx - a.idx);
  if (TV.sort === 'cheap') cities.sort((a, b) => a.idx - b.idx);
  const curIdx = regionMult(here, TV.cat);
  const label = (x) => (x > 1.08 ? T('дорогой рынок', 'дорогий ринок', 'expensive market') : x < 0.92 ? T('дешёвый рынок', 'дешевий ринок', 'cheap market') : T('обычный рынок', 'звичайний ринок', 'average market'));
  return `<div class="card"><div class="small m">${T('Вы находитесь в городе', 'Ви перебуваєте в місті', 'You are in')}</div><h3 style="font-size:24px">${countryOf(here).flag} ${esc(cityName())}</h3><div class="d">${T('Цены на', 'Ціни на', 'Prices for')} ${esc(L(CATS[TV.cat].name).toLowerCase())} ×${curIdx.toFixed(2)} · ${label(curIdx)}. ${T('Лента объявлений и оценка ваших вещей зависят от города.', 'Стрічка оголошень і оцінка речей залежать від міста.', 'Listings and valuations depend on the city.')}</div></div>
    <p class="p">${T('Покупайте там, где цены ниже, и продавайте там, где выше. Самолёт быстрее, поезд дешевле. С собой берите до', 'Купуйте там, де дешевше, продавайте там, де дорожче. Із собою беріть до', 'Buy where it’s cheap, sell where it’s pricey. Carry up to')} ${luggageCap()} ${T('мест багажа.', 'місць багажу.', 'luggage units.')}</p>
    <div class="chips">${CAT_LIST.map((c) => `<button class="chip${TV.cat === c ? ' on' : ''}" data-a="tcat" data-v="${c}">${CATS[c].icon} ${esc(L(CATS[c].name))}</button>`).join('')}</div>
    <div class="chips wrap"><button class="chip${TV.sort === 'near' ? ' on' : ''}" data-a="tsort" data-v="near">${T('Ближайшие', 'Найближчі', 'Nearest')}</button><button class="chip${TV.sort === 'exp' ? ' on' : ''}" data-a="tsort" data-v="exp">${T('Дороже цены', 'Дорожчі ціни', 'Higher prices')}</button><button class="chip${TV.sort === 'cheap' ? ' on' : ''}" data-a="tsort" data-v="cheap">${T('Дешевле цены', 'Дешевші ціни', 'Lower prices')}</button></div>
    ${cities.map(({ c, km, idx }) => { const opts = tripOptions(c.id); const pct = Math.round((idx - 1) * 100); return `<div class="card"><div class="row between"><div><h3>${countryOf(c.id).flag} ${esc(L(c.name))}</h3><div class="small m">${km} ${T('км', 'км', 'km')} · ${label(regionMult(c.id, TV.cat))}</div></div><span class="tag ${pct > 0 ? 'g' : pct < 0 ? 'r' : ''}">${T('цены', 'ціни', 'prices')} ${pct > 0 ? '+' : ''}${pct}%</span></div><div class="btns">${opts.map((o) => `<button class="btn dark sm" data-a="trip" data-v="${c.id}" data-w="${o.mode}" style="flex-direction:column;gap:0;min-height:52px"><b>${MODES[o.mode][3]} ${esc(L(MODES[o.mode]))}</b><span class="small m">${fmt(o.price)} · ${dur(o.time)}</span></button>`).join('') || `<span class="small m">${T('Нет маршрута', 'Немає маршруту', 'No route')}</span>`}</div></div>`; }).join('')}`;
}
export const travelApp = {
  id: 'travel', glyph: 'plane', lvl: 4,
  name: ['Путешествие', 'Подорожі', 'Travel'], colors: ['#36a3ff', '#1a6ad4'],
  views: { main: travelMain },
  actions: {
    tcat: (v) => { TV.cat = v; rerender(); },
    tsort: (v) => { TV.sort = v; rerender(); },
    trip: async (to, el) => {
      const s = G.s; const mode = el.dataset.w;
      const here = s.inv.filter((i) => (i.loc || s.player.city) === s.player.city && !isVehicle(i) && !i.shop && !i.listed);
      let picked = [];
      if (here.length && mode !== 'car') {
        const cap = luggageCap();
        const res = await sheet(`<h2>${T('Что взять с собой?', 'Що взяти з собою?', 'What to bring?')}</h2><p class="p">${T('Багаж', 'Багаж', 'Luggage')}: <b class="lu">0</b> / ${cap}. ${T('Остальное останется на складе здесь.', 'Решта залишиться на складі тут.', 'The rest stays in storage here.')}</p>${here.map((it) => `<label class="list-item" style="cursor:pointer"><input type="checkbox" value="${it.id}" data-u="${sizeUnits(it)}" style="width:22px;height:22px"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${sizeUnits(it)} ${T('мест', 'місць', 'units')} · ${fmt(itemValue(it, to, 'known'))} ${T('там', 'там', 'there')}</div></div></label>`).join('')}<button class="btn block mt go">${T('В путь', 'У дорогу', 'Go')}</button>`, {
          after(el2) {
            const upd = () => { const sum = [...el2.querySelectorAll('input:checked')].reduce((a, x) => a + +x.dataset.u, 0); el2.querySelector('.lu').textContent = sum; el2.querySelector('.lu').className = sum > cap ? 'r' : ''; };
            el2.addEventListener('change', upd);
            el2.querySelector('.go').onclick = () => resolveSheet([...el2.querySelectorAll('input:checked')].map((x) => x.value).join(',') || '-');
          },
        });
        if (!res) return;
        picked = res === '-' ? [] : res.split(',');
      } else if (!(await confirmBox(T('Отправиться?', 'Вирушити?', 'Depart?'), `${L(CITY[to].name)} · ${L(MODES[mode])}`))) return;
      const r = startTrip(to, mode, picked);
      if (r.ok) { sfx('ok'); toast(T('Счастливого пути!', 'Щасливої дороги!', 'Bon voyage!'), 'g'); } else toast(r.msg || T('Не удалось', 'Не вдалося', 'Failed'), 'r');
      refreshAll();
    },
  },
};

// ---------------------------------------------------------------- CITY MAP + FLEA MARKET
function fleaFeed() {
  const s = G.s;
  if (!s.flea || s.flea.refreshAt <= s.t || s.flea.city !== s.player.city) {
    const rng = new RNG(`${s.id}:flea:${s.t}`);
    const items = [];
    for (let i = 0; i < 7; i++) {
      const it = makeItem(rng, { city: s.player.city, quality: rng.chance(0.5) ? 'junk' : 'any', cats: ['antiques', 'collectibles', 'comics', 'toys', 'clothing', 'accessories', 'consoles', 'phones', 'art', 'instruments', 'cards', 'jewelry'], maxVal: 1200 + s.level * 300, rareBoost: 0.6 });
      if (isVehicle(it)) continue;
      const seen = itemValue(it, s.player.city, 'known');
      items.push({ id: uid('fm'), item: it, price: nicePrice(seen * rng.float(0.45, 0.95)), sold: false, haggled: false });
    }
    s.flea = { refreshAt: s.t + 720, city: s.player.city, items };
  }
  return s.flea;
}
const POIS = [
  { id: 'flea', x: 22, y: 30, e: '🧺', n: ['Барахолка', 'Барахолка', 'Flea market'] },
  { id: 'pawn', x: 60, y: 22, e: '💍', n: ['Ломбард', 'Ломбард', 'Pawn shop'], app: 'pawn' },
  { id: 'dump', x: 80, y: 62, e: '🗑️', n: ['Мусорки', 'Смітники', 'Dumpsters'], app: 'free' },
  { id: 'mall', x: 46, y: 52, e: '🛍', n: ['ТЦ', 'ТЦ', 'Mall'], app: 'shop' },
  { id: 'auc', x: 70, y: 40, e: '🔨', n: ['Аукционный дом', 'Аукціонний дім', 'Auction house'], app: 'auction' },
  { id: 'work', x: 30, y: 70, e: '💼', n: ['Центр занятости', 'Центр зайнятості', 'Job center'], app: 'jobs' },
  { id: 'fix', x: 14, y: 52, e: '🔧', n: ['Мастерская', 'Майстерня', 'Workshop'], app: 'repair' },
  { id: 'bank', x: 52, y: 80, e: '🏦', n: ['Банк', 'Банк', 'Bank'], app: 'bank' },
  { id: 'station', x: 86, y: 86, e: '🚉', n: ['Вокзал / аэропорт', 'Вокзал / аеропорт', 'Station / airport'], app: 'travel' },
  { id: 'home', x: 12, y: 86, e: '🏠', n: ['Дом', 'Дім', 'Home'], app: 'profile' },
  { id: 'realty', x: 88, y: 18, e: '🏢', n: ['Агентство недвижимости', 'Агенція нерухомості', 'Realty agency'], app: 'realty' },
];
function mapMain() {
  const s = G.s;
  const cid = s.player.city;
  const rng = new RNG('map' + cid);
  let roads = '';
  for (let i = 0; i < 7; i++) roads += `<path d="M0 ${rng.int(0, 100)} Q ${rng.int(20, 80)} ${rng.int(0, 100)} 100 ${rng.int(0, 100)}" stroke="#24344a" stroke-width="${rng.int(2, 4)}" fill="none"/>`;
  for (let i = 0; i < 5; i++) roads += `<path d="M${rng.int(0, 100)} 0 Q ${rng.int(0, 100)} ${rng.int(30, 70)} ${rng.int(0, 100)} 100" stroke="#24344a" stroke-width="${rng.int(2, 3)}" fill="none"/>`;
  const river = `<path d="M-5 ${rng.int(40, 60)} C 30 ${rng.int(20, 80)}, 70 ${rng.int(20, 80)}, 105 ${rng.int(40, 60)}" stroke="#123a5a" stroke-width="7" fill="none" opacity=".8"/>`;
  const blocks = Array.from({ length: 26 }, () => `<rect x="${rng.int(0, 95)}" y="${rng.int(0, 95)}" width="${rng.int(4, 10)}" height="${rng.int(4, 9)}" rx="1" fill="#16222f"/>`).join('');
  return `<div class="mapwrap scanlines"><svg viewBox="0 0 100 100">${blocks}${river}${roads}${POIS.map((p) => `<g class="poi" data-a="poi" data-v="${p.id}"><circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#0b1018" stroke="#2ef2a0" stroke-width=".6"/><text x="${p.x}" y="${p.y + 2}" font-size="5.5" text-anchor="middle">${p.e}</text></g>`).join('')}<circle cx="50" cy="50" r="1.6" fill="#4da3ff"><animate attributeName="r" values="1.4;2.6;1.4" dur="1.6s" repeatCount="indefinite"/></circle></svg></div>
    <div class="small m mt mb">📍 ${countryOf(cid).flag} ${esc(cityName())}</div>
    ${POIS.map((p) => `<div class="list-item" data-a="poi" data-v="${p.id}"><div style="font-size:28px;width:44px;text-align:center">${p.e}</div><div class="grow"><div class="t">${esc(L(p.n))}</div></div>${icon('back', 'style="width:18px;transform:rotate(180deg);color:var(--mute)"')}</div>`).join('')}`;
}
function fleaView() {
  const f = fleaFeed();
  return `<p class="p">${T('На барахолке всё дешевле, а продавцы любят поторговаться. Иногда среди хлама попадаются сокровища.', 'На барахолці все дешевше, а продавці люблять поторгуватися.', 'Everything’s cheaper here and sellers love to haggle. Treasures hide among junk.')} ⟳ <span data-cd="${f.refreshAt}"></span></p>` + f.items.filter((x) => !x.sold).map((x) => `<div class="card"><div class="row"><div class="th" style="width:84px;height:84px;border-radius:14px;overflow:hidden;flex:none">${img(x.item, { tilt: true })}</div><div class="grow"><b>${esc(itemTitle(x.item))}</b><div class="small m">${esc(itemSub(x.item))}</div>${tags(x.item)}<div class="price-big" style="font-size:22px">${fmt(x.price)}</div></div></div><div class="btns">${!x.haggled ? `<button class="btn dark sm" data-a="haggle" data-v="${x.id}">🎯 ${T('Торговаться', 'Торгуватися', 'Haggle')}</button>` : ''}<button class="btn sm" data-a="fbuy" data-v="${x.id}">${T('Купить', 'Купити', 'Buy')}</button></div></div>`).join('');
}
export const mapApp = {
  id: 'map', glyph: 'map', lvl: 1,
  name: ['Карта', 'Мапа', 'Map'], colors: ['#2fbf71', '#16804a'],
  views: { main: mapMain, flea: fleaView },
  title: (v) => (v === 'flea' ? T('Барахолка', 'Барахолка', 'Flea market') : T('Карта города', 'Мапа міста', 'City map')),
  actions: {
    poi: (v) => { const p = POIS.find((x) => x.id === v); if (p.id === 'flea') go('flea'); else openApp(p.app); },
    haggle: async (id) => {
      const x = fleaFeed().items.find((y) => y.id === id);
      const { playMini } = await import('../mini/engine.js');
      const r = await playMini('haggle', { title: T('Торг на барахолке', 'Торг на барахолці', 'Flea market haggle'), item: x.item, pass: 0.4 });
      if (r.quit) return;
      x.haggled = true;
      const disc = Math.round(r.disc ?? r.score * 30);
      x.price = nicePrice(x.price * (1 - disc / 100));
      toast(disc ? T(`Скинули ${disc}%!`, `Скинули ${disc}%!`, `${disc}% off!`) : T('Продавец не уступил', 'Продавець не поступився', 'No discount'), disc ? 'g' : '');
      rerender();
    },
    fbuy: (id) => {
      const x = fleaFeed().items.find((y) => y.id === id);
      if (!canStore(x.item)) return toast(T('Нет места', 'Немає місця', 'No space'), 'r');
      if (!spend(x.price, 'buy', itemTitle(x.item))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
      x.sold = true; addItem(x.item, x.price, 'flea'); stat('bought'); addXP(4); sfx('cash'); toast(T('Куплено!', 'Куплено!', 'Bought!'), 'g'); rerender();
    },
  },
};

// ---------------------------------------------------------------- PAWN SHOP
const PW = { tab: 'buy' };
function pawnMain() {
  const s = G.s;
  const tabs = `<div class="seg"><button class="${PW.tab === 'buy' ? 'on' : ''}" data-a="pt" data-v="buy">${T('Купить', 'Купити', 'Buy')}</button><button class="${PW.tab === 'sell' ? 'on' : ''}" data-a="pt" data-v="sell">${T('Сдать', 'Здати', 'Pawn')}</button></div>`;
  if (PW.tab === 'buy') {
    const p = pawnShop();
    return tabs + `<p class="p">${T('Невыкупленные вещи. Ломбард сам всё проверил — дефекты указаны честно.', 'Невикуплені речі. Ломбард усе перевірив — дефекти вказано чесно.', 'Unredeemed items, all defects disclosed.')} ⟳ <span data-cd="${p.refreshAt}"></span></p><div class="tiles">${p.items.filter((x) => !x.sold).map((x) => `<div class="tile" data-a="pbuy2" data-v="${x.id}"><div class="img">${img(x.item, { tilt: true })}</div><div class="pr">${fmt(x.price)}</div><div class="nm">${esc(itemTitle(x.item))}</div><div class="ct">${esc(itemSub(x.item))}</div>${tags(x.item)}</div>`).join('')}</div>`;
  }
  const items = s.inv.filter((i) => !i.shop && !i.listed);
  return tabs + `<p class="p">${T('Мгновенные деньги: ломбард платит около половины рыночной цены.', 'Миттєві гроші: ломбард платить близько половини ринкової ціни.', 'Instant cash at about half market value.')}</p>` + (items.length ? items.map((it) => row(it, `<button class="btn xs" data-a="psell" data-v="${it.id}">${fmt(itemValue(it, s.player.city, 'known') * 0.48)}</button>`, esc(itemSub(it)), '', '')).join('') : empty('archive', T('Нечего сдать', 'Нічого здати', 'Nothing to pawn')));
}
export const pawnApp = {
  id: 'pawn', glyph: 'coin', lvl: 1,
  name: ['Ломбард', 'Ломбард', 'Pawn shop'], colors: ['#d4a017', '#8a6a0a'],
  views: { main: pawnMain },
  actions: {
    pt: (v) => { PW.tab = v; rerender(); },
    pbuy2: async (id) => { const x = pawnShop().items.find((y) => y.id === id); if (!x || !(await confirmBox(itemTitle(x.item), fmt(x.price), T('Купить', 'Купити', 'Buy')))) return; const r = buyPawn(x); toast(r.ok ? T('Куплено!', 'Куплено!', 'Bought!') : r.msg, r.ok ? 'g' : 'r'); if (r.ok) sfx('cash'); rerender(); },
    psell: async (id, el, ev) => { ev.stopPropagation(); const it = getItem(id); if (!(await confirmBox(T('Сдать в ломбард?', 'Здати в ломбард?', 'Pawn it?'), esc(itemTitle(it))))) return; const v = pawnSell(id); sfx('cash'); toast(`+${fmt(v)}`, 'g'); rerender(); },
  },
};
