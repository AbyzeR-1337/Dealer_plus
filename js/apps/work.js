// Jobs (vacancies, interviews, shifts, gigs) and Freebies (giveaways, dumpster diving).
import { G, emit } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc, clamp, pickR } from '../core/util.js';
import { fmt } from '../core/money.js';
import { icon } from '../ui/icons.js';
import { go, rerender, toast, confirmBox, ago, openApp, choose } from '../ui/shell.js';
import { img, empty, bar, tags } from '../ui/comp.js';
import { JOBS, RANKS, jobById, reqOk, shiftPay, apply, interviewResult, acceptOffer, quitJob, canShift, finishShift, GIGS, finishGig, gigReady, SHIFT_COOLDOWN, wageIdx, shiftGame, DOCS, jobDocs, docState, docReady, docReadyAt, orderDoc, vacancyWindow } from '../game/jobs.js';
import { freeFeed, claimFree, dumpsterLoot, giveTier, freeAlreadyGone, payBait } from '../game/sources.js';
import { gallery } from '../ui/comp.js';
import { viewsOf } from '../data/views.js';
import { itemTitle, itemSub } from '../game/items.js';
import { addItem, canStore, stat, addXP } from '../game/player.js';
import { DISTRICTS } from '../game/market.js';
import { playMini } from '../mini/engine.js';
import { regName, regColors } from './common.js';
import { sfx } from '../ui/sfx.js';
import { useEnergy, hasEnergy } from '../game/needs.js';

// ---------------------------------------------------------------- JOBS
function jobMain() {
  const s = G.s;
  if (!s.job.cur) return `<div class="hero"><div class="lbl">${T('Вы безработный', 'Ви безробітний', 'You’re unemployed')}</div><div class="big" style="font-size:30px">${T('Найдите работу', 'Знайдіть роботу', 'Find a job')}</div><div class="pills"><span>${T('Отклики', 'Відгуки', 'Applications')}: ${s.job.apps.filter((a) => a.st === 'sent').length}</span></div></div>
    <p class="p">${T('Откликайтесь на вакансии, проходите собеседования и работайте сменами — каждая смена это мини‑игра. Пока работы нет — берите подработки.', 'Відгукуйтеся на вакансії, проходьте співбесіди й працюйте змінами — кожна зміна це міні‑гра.', 'Apply, pass interviews and work shifts — every shift is a minigame. Grab gigs meanwhile.')}</p>
    <div class="btns"><button class="btn" data-a="tab" data-v="vac">${T('Смотреть вакансии', 'Дивитися вакансії', 'Browse jobs')}</button><button class="btn dark" data-a="tab" data-v="gigs">${T('Подработки', 'Підробітки', 'Gigs')}</button></div>`;
  const job = jobById(s.job.cur);
  const rank = RANKS[s.job.rank], next = RANKS[s.job.rank + 1];
  const ready = canShift();
  return `<div class="hero"><div class="lbl">${esc(L(job.co))}</div><div class="big" style="font-size:28px">${job.icon} ${esc(L(job.n))}</div><div class="pills"><span>${esc(L(rank.n))}</span><span>${fmt(shiftPay(job))} / ${T('смена', 'зміна', 'shift')}</span><span>${esc(L(job.sched))}</span></div></div>
    <div class="card"><h3>${T('Смена', 'Зміна', 'Shift')}</h3><div class="d mb">${esc(L(job.d))}</div>
      ${G.s.sick && G.s.sick.until > G.s.t && s.job.cur ? `<button class="btn block dis">🤢 ${T('С расстройством желудка на смену не выйти', 'З розладом шлунка на зміну не вийти', 'Too sick for a shift')}</button>` : ready ? `<button class="btn block" data-a="shift">${T('Начать смену', 'Почати зміну', 'Start shift')} ⚡−14</button>` : s.energy < 12 ? `<button class="btn block dis">${T('Нет сил — поешьте или поспите', 'Немає сил — поїжте або поспіть', 'Too tired — eat or sleep')}</button>` : `<button class="btn block dark dis">${T('Следующая смена через', 'Наступна зміна через', 'Next shift in')} <span data-cd="${s.job.next}" data-fmt="long"></span></button>`}
    </div>
    <div class="card"><h3>${T('Карьера', 'Карʼєра', 'Career')}</h3>${next ? `<div class="d">${T('До повышения', 'До підвищення', 'To promotion')} «${esc(L(next.n))}» (×${next.mult}): ${s.job.good}/${next.need} ${T('хороших смен', 'добрих змін', 'good shifts')}</div>${bar((s.job.good / next.need) * 100)}` : `<div class="d">${T('Максимальная должность', 'Максимальна посада', 'Top rank reached')}</div>`}
      <div class="small mt ${s.job.bad ? 'r' : 'm'}">${T('Плохих смен подряд', 'Поганих змін поспіль', 'Bad shifts in a row')}: ${s.job.bad}/3</div>
      <button class="btn dark sm mt" data-a="quit">${T('Уволиться', 'Звільнитися', 'Quit')}</button></div>`;
}
function docsBlock(j) {
  const list = jobDocs(j);
  const w = vacancyWindow(j);
  const head = w.open ? `<div class="vwin open">✅ ${T('Можно подать заявку прямо сейчас', 'Можна подати заявку просто зараз', 'You can apply right now')}</div>` : `<div class="vwin">⏳ ${T('Следующую заявку можно подать через', 'Наступну заявку можна подати через', 'Next application in')} <b data-cd="${w.at}"></b></div>`;
  return head + `<div class="docs">${list.map((k) => { const d = DOCS[k]; const st = docState(k); return `<div class="doc ${st}"><span>${d.icon} ${esc(L(d.n))}</span>${st === 'ready' ? `<b class="g">✓</b>` : st === 'pending' ? `<b class="o">⏳ <span data-cd="${docReadyAt(k)}"></span></b>` : `<button class="btn xs dark" data-a="doc" data-v="${k}">${T('Оформить', 'Оформити', 'Get it')} · ${d.price ? fmt(d.price) : T('бесплатно', 'безкоштовно', 'free')} · ${dur(d.mins)}</button>`}</div>`; }).join('')}</div>`;
}
function applyBtn(j) {
  const w = vacancyWindow(j);
  const ready = jobDocs(j).every((k) => docReady(k));
  if (!w.open) return `<button class="btn sm dark" disabled>⏳ <span data-cd="${w.at}"></span></button>`;
  if (!ready) return `<button class="btn sm dark" disabled>${T('Сначала документы', 'Спочатку документи', 'Documents first')}</button>`;
  return `<button class="btn sm" data-a="apply" data-v="${j.id}">📨 ${T('Подать документы', 'Подати документи', 'Submit documents')}</button>`;
}
function vacView() {
  const s = G.s;
  return `<h2 class="sec">${T('Вакансии', 'Вакансії', 'Vacancies')}</h2>` + JOBS.map((j) => {
    const miss = reqOk(j);
    const app = s.job.apps.find((a) => a.job === j.id && !['closed', 'rejected', 'failed'].includes(a.st));
    const cur = s.job.cur === j.id;
    return `<div class="card"><div class="row"><div style="font-size:30px">${j.icon}</div><div class="grow"><h3>${esc(L(j.n))}</h3><div class="small m">${esc(L(j.co))} · ${esc(L(j.sched))}</div></div><b class="g">${fmt(shiftPay(j, 0))}</b></div><div class="d mt">${esc(L(j.d))}</div>${miss.length ? `<div class="small r mt">${T('Требования', 'Вимоги', 'Requires')}: ${esc(miss.join(', '))}</div>` : ''}
      ${cur || app ? '' : docsBlock(j)}
      <div class="btns">${cur ? `<span class="tag g">${T('Вы здесь работаете', 'Ви тут працюєте', 'You work here')}</span>` : app ? `<span class="tag b">${T('Документы поданы', 'Документи подано', 'Documents submitted')}</span>` : applyBtn(j)}</div></div>`;
  }).join('');
}
function appsView() {
  const s = G.s;
  const list = s.job.apps.slice(0, 20);
  if (!list.length) return empty('briefcase', T('Нет откликов', 'Немає відгуків', 'No applications'), T('Откликнитесь на вакансии.', 'Відгукніться на вакансії.', 'Apply to some jobs.'));
  const ST = { sent: [T('Рассматривается', 'Розглядається', 'Under review'), 'b'], invite: [T('Приглашение на собеседование!', 'Запрошення на співбесіду!', 'Interview invite!'), 'g'], rejected: [T('Отказ', 'Відмова', 'Rejected'), 'r'], offer: [T('Оффер!', 'Офер!', 'Offer!'), 'g'], failed: [T('Не прошли собеседование', 'Не пройшли співбесіду', 'Interview failed'), 'r'], hired: [T('Приняты', 'Прийняті', 'Hired'), 'g'], closed: [T('Закрыто', 'Закрито', 'Closed'), 'm'] };
  return `<h2 class="sec">${T('Отклики', 'Відгуки', 'Applications')}</h2>` + list.map((a) => {
    const j = jobById(a.job);
    const [st, cls] = ST[a.st];
    return `<div class="card"><div class="row between"><b>${j.icon} ${esc(L(j.n))}</b><span class="tag ${cls}">${st}</span></div><div class="small m">${esc(L(j.co))} · HR: ${esc(a.hr)} · ${ago(a.at)}</div>
      ${a.st === 'invite' ? `<button class="btn block mt" data-a="interview" data-v="${a.id}">${T('Пройти собеседование', 'Пройти співбесіду', 'Take the interview')}</button>` : ''}
      ${a.st === 'offer' ? `<button class="btn green block mt" data-a="accept" data-v="${a.id}">${T('Принять оффер', 'Прийняти офер', 'Accept offer')} · ${fmt(shiftPay(j, 0))}/${T('смена', 'зміна', 'shift')}</button>` : ''}
      ${a.st === 'sent' ? `<div class="small m mt">${T('Ответ придёт в течение', 'Відповідь прийде протягом', 'Reply within')} ~<span data-cd="${a.respond}" data-fmt="long"></span></div>` : ''}</div>`;
  }).join('');
}
function gigsView() {
  return `<h2 class="sec">${T('Подработки', 'Підробітки', 'Gigs')}</h2><p class="p">${T('Разовые задания без трудоустройства. Мало платят, но доступны всегда.', 'Разові завдання без працевлаштування.', 'One‑off tasks, low pay, always available.')}</p>` + GIGS.map((g) => `<div class="card"><div class="row between"><h3>${esc(L(g.n))}</h3><b class="g">≈ ${fmt(g.pay * wageIdx())}</b></div>${gigReady(g) ? `<button class="btn block mt" data-a="gig" data-v="${g.id}">${T('Взяться', 'Взятися', 'Do it')} ⚡−10</button>` : `<button class="btn dark block mt dis">${T('Снова через', 'Знову через', 'Again in')} <span data-cd="${G.s.gigs[g.id]}" data-fmt="long"></span></button>`}</div>`).join('');
}

export const jobsApp = {
  id: 'jobs', glyph: 'briefcase', lvl: 1,
  name: () => regName('jobs'), colors: () => regColors('jobs'),
  tabs: [
    { v: 'main', label: ['Работа', 'Робота', 'Job'], icon: 'briefcase' },
    { v: 'vac', label: ['Вакансии', 'Вакансії', 'Jobs'], icon: 'search' },
    { v: 'apps', label: ['Отклики', 'Відгуки', 'Applied'], icon: 'mail', badge: () => G.s.job.apps.filter((a) => a.st === 'invite' || a.st === 'offer').length },
    { v: 'gigs', label: ['Подработки', 'Підробітки', 'Gigs'], icon: 'bolt' },
  ],
  views: { main: jobMain, vac: vacView, apps: appsView, gigs: gigsView },
  actions: {
    apply: (id) => { if (apply(id)) { sfx('ok'); toast(T('Документы поданы — ждите ответа HR. Следующая заявка через 3 минуты', 'Документи подано — чекайте відповіді HR. Наступна заявка через 3 хвилини', 'Submitted — wait for HR. Next application in 3 minutes'), 'g'); rerender(); } else toast(vacancyWindow().open ? T('Не хватает документов', 'Бракує документів', 'Documents missing') : T('Подождите перед следующей заявкой', 'Зачекайте перед наступною заявкою', 'Wait before the next application'), 'r'); },
    doc: (k) => { const r = orderDoc(k); if (r.ok) { sfx('ok'); toast(T(`Оформляется: ${L(DOCS[k].n)}`, `Оформлюється: ${L(DOCS[k].n)}`, `In progress: ${L(DOCS[k].n)}`), 'g'); } else if (r.msg) toast(r.msg, 'r'); rerender(); },
    interview: async (id) => { const r = await playMini('interview', { title: T('Собеседование', 'Співбесіда', 'Interview'), pass: 0.55 }); if (r.quit) return; const ok = interviewResult(id, r.score); toast(ok ? T('Вам сделали оффер!', 'Вам зробили офер!', 'You got an offer!') : T('Увы, отказ', 'На жаль, відмова', 'Sorry, rejected'), ok ? 'g' : 'r'); rerender(); },
    accept: async (id) => { if (G.s.job.cur && !(await confirmBox(T('Сменить работу?', 'Змінити роботу?', 'Switch jobs?'), T('Текущая должность будет потеряна.', 'Поточна посада буде втрачена.', 'You’ll lose your current rank.')))) return; acceptOffer(id); sfx('win'); go('main'); },
    quit: async () => { if (await confirmBox(T('Уволиться?', 'Звільнитися?', 'Quit?'), '', T('Уволиться', 'Звільнитися', 'Quit'), undefined, true)) { quitJob(); rerender(); } },
    shift: async () => {
      if (!canShift()) return;
      const job = jobById(G.s.job.cur);
      const r = await playMini(shiftGame(job), { title: `${job.icon} ${L(job.n)}`, item: G.s.inv[0], pass: 0.6 });
      if (r.quit) return;
      const { pay, event } = finishShift(r.score);
      sfx('cash'); toast(`+${fmt(pay)}${event === 'promo' ? ' · ' + T('Повышение!', 'Підвищення!', 'Promotion!') : ''}`, 'g');
      rerender();
    },
    gig: async (id) => {
      const g = GIGS.find((x) => x.id === id);
      if (!hasEnergy(10)) return toast(T('Нет сил', 'Немає сил', 'Too tired'), 'r');
      const r = await playMini(g.game, { title: L(g.n) });
      if (r.quit) return;
      const pay = finishGig(g, r.score);
      sfx('cash'); toast(`+${fmt(pay)}`, 'g'); rerender();
    },
  },
};

// ---------------------------------------------------------------- FREEBIES
const HYPE = { cheap: '', mid: '👀', good: '🔥 ' , jackpot: '🔥🔥 ' };
function freeCard(g) {
  const hot = g.tier === 'good' || g.tier === 'jackpot';
  return `<div class="card ${hot ? 'hot' : ''}" data-key="${g.id}"><div class="row" data-a="go" data-v="fitem" data-id="${g.id}"><div class="th" style="width:84px;height:84px;border-radius:14px;overflow:hidden;flex:none">${img(g.item)}</div><div class="grow"><b>${HYPE[g.tier] || ''}${esc(itemTitle(g.item))}</b><div class="small m">${esc(L(g.reason))}</div><div class="small m">📍 ${esc(L(DISTRICTS[g.dist]))} · 👥 ${g.claimers} ${T('желающих', 'охочих', 'want it')}</div><div class="small ${hot ? 'r' : 'm'}">⏳ ${T('разберут через', 'розберуть через', 'gone in')} ~<span data-cd="${g.until}"></span></div></div></div><button class="btn block mt" data-a="claim" data-v="${g.id}">${T('Забрать', 'Забрати', 'Grab it')} ⚡−6</button></div>`;
}
function freeItem(p) {
  const g = (G.s.free.items || []).find((x) => x.id === p.id);
  if (!g || g.taken) return empty('gift', T('Уже забрали', 'Вже забрали', 'Already taken'));
  return `${gallery(g.item, viewsOf(g.item).slice(0, 3), 0)}
    <div style="font-size:20px;font-weight:800;margin:6px 0 2px">${T('Даром', 'Даром', 'Free')}</div><div style="font-size:18px">${esc(itemTitle(g.item))}</div>
    <div class="small m">${esc(itemSub(g.item))} · 📍 ${esc(L(DISTRICTS[g.dist]))} · ${esc(g.who)}</div>
    <div class="card mt">${esc(L(g.reason))}</div>
    <div class="card"><div class="row between"><span>👥 ${T('Желающих', 'Охочих', 'Takers')}</span><b>${g.claimers}</b></div><div class="row between"><span>⏳ ${T('Разберут через', 'Розберуть через', 'Gone in')}</span><b><span data-cd="${g.until}"></span></b></div></div>${tags(g.item)}
    <button class="btn block mt" data-a="claim" data-v="${g.id}">${T('Забрать', 'Забрати', 'Grab it')} ⚡−6</button>`;
}
function freeMain() {
  const s = G.s;
  const f = freeFeed();
  const can = (s.dumpAt || 0) <= s.t;
  return `<div class="card hl"><div class="row"><div style="font-size:34px">🗑️</div><div class="grow"><h3>${T('Порыться в мусорке', 'Покопатися в смітнику', 'Dumpster dive')}</h3><div class="d">${T('Иногда люди выбрасывают ценное. Энергия −8.', 'Іноді люди викидають цінне. Енергія −8.', 'People toss valuables sometimes. Energy −8.')}</div></div></div>${can ? `<button class="btn block mt" data-a="dig">${T('Искать', 'Шукати', 'Search')}</button>` : `<button class="btn dark block mt dis">${T('Снова через', 'Знову через', 'Again in')} <span data-cd="${s.dumpAt}" data-fmt="long"></span></button>`}</div>
    <div class="row between"><h2 class="sec">${T('Отдам даром', 'Віддам безкоштовно', 'Free to take')}</h2><span class="small m">⟳ <span data-cd="${f.refreshAt}"></span></span></div>
    <p class="small m">${T('Почти всё здесь — дешёвый хлам. Ценное появляется редко, его разбирают за минуты, а часть «подарков» — развод.', 'Майже все тут — дешевий мотлох. Цінне зʼявляється рідко, його розбирають за хвилини, а частина «подарунків» — розвод.', 'Almost everything here is cheap junk. Valuables are rare, gone in minutes, and some “gifts” are scams.')}</p>
    ${f.items.filter((g) => !g.taken).map((g) => freeCard(g)).join('') || empty('gift', T('Всё разобрали', 'Усе розібрали', 'All taken'), T('Новые объявления скоро появятся.', 'Нові оголошення скоро зʼявляться.', 'New ones soon.'))}`;
}
export const freeApp = {
  id: 'free', glyph: 'gift', lvl: 1,
  name: ['Даром', 'Даром', 'Freebies'], colors: ['#2ec27e', '#0f7a4a'],
  badge: () => 0,
  views: { main: freeMain, fitem: freeItem },
  tabOf: () => 'main',
  actions: {
    claim: async (id) => {
      const s = G.s;
      const g = s.free.items.find((x) => x.id === id);
      if (!g || g.taken) return;
      if (!hasEnergy(6)) return toast(T('Нет сил', 'Немає сил', 'Too tired'), 'r');
      if (!canStore(g.item)) return toast(T('Нет места на складе', 'Немає місця на складі', 'No storage space'), 'r');
      // bait: "free, just pay delivery"
      if (g.bait) {
        const v = await choose(T('Сообщение от дарителя', 'Повідомлення від дарувальника', 'Message from the giver'), [{ v: 'pay', label: T('Оплатить «доставку» по ссылке', 'Оплатити «доставку» за посиланням', 'Pay the “delivery” via link'), cls: 'red' }, { v: 'no', label: T('Это развод, пропустить', 'Це розвод, пропустити', 'It’s a scam, skip'), cls: 'dark' }], T('«Вещь ваша! Я в другом городе, отправлю курьером — оплатите только доставку по ссылке 👇»', '«Річ ваша! Я в іншому місті, відправлю курʼєром — оплатіть лише доставку за посиланням 👇»', '“It’s yours! I’m in another city, I’ll send it by courier — just pay delivery via the link 👇”'));
        if (v === 'pay') { const loss = payBait(g); sfx('lose'); toast(T(`Развод: −${fmt(loss)}, вещи не будет`, `Розвод: −${fmt(loss)}, речі не буде`, `Scam: −${fmt(loss)}, no item`), 'r'); }
        else if (v === 'no') { g.taken = true; sfx('ok'); toast(T('Правильно — это была ловушка', 'Правильно — це була пастка', 'Right — it was a trap'), 'g'); }
        rerender(); return;
      }
      useEnergy(3);
      // while you were on the way someone else may already have taken it
      if (freeAlreadyGone(g)) { g.taken = true; sfx('lose'); toast(T('Пока вы ехали — уже забрали', 'Поки ви їхали — вже забрали', 'Gone before you got there'), 'r'); rerender(); return; }
      // the trip itself: message the giver, route, entrance, intercom, the right bag — while another taker races you
      const r = await playMini('pickup', { title: `${T('Даром', 'Даром', 'Free')} · ${itemTitle(g.item)}`, tier: g.tier, claimers: g.claimers, pass: 1 });
      if (r.quit) { rerender(); return; }
      const res = claimFree(g, !!r.won);
      if (res.ok) { sfx('win'); toast(T('Забрали!', 'Забрали!', 'Got it!'), 'g'); }
      else if (res.msg) toast(res.msg, 'r');
      else toast(T('Опередили…', 'Випередили…', 'Someone was faster…'), 'r');
      rerender();
    },
    dig: async () => {
      const s = G.s;
      if (!hasEnergy(8)) return toast(T('Нет сил', 'Немає сил', 'Too tired'), 'r');
      useEnergy(8);
      s.dumpAt = s.t + 60;
      const r = await playMini('dig', { title: T('Мусорка', 'Смітник', 'Dumpster'), pass: 0.4 });
      if (r.quit) return;
      let bonus = 0;
      if (Math.random() < 0.18) {
        // a locked toolbox / suitcase in the trash: pick the lock for a better find
        const lp = Math.random() < 0.5
          ? await playMini('codelock', { title: T('Кодовый ящик в мусорке', 'Кодова скриня у смітнику', 'A combination box in the trash'), digits: 3, tries: 6, pass: 1 })
          : await playMini('lockpick', { title: T('Запертый ящик в мусорке', 'Замкнена скриня у смітнику', 'A locked box in the trash'), pins: 3, pass: 1 });
        if (!lp.quit && lp.score >= 1) bonus = 0.35;
      }
      const loot = dumpsterLoot(Math.min(1, r.score + bonus));
      let got = 0;
      for (const it of loot) if (canStore(it)) { addItem(it, 0, 'dump'); got++; }
      stat('dumpster'); stat('freebies', got); addXP(4);
      toast(got ? T(`Нашли: ${loot.map((i) => itemTitle(i)).join(', ')}`, `Знайшли: ${loot.map((i) => itemTitle(i)).join(', ')}`, `Found: ${loot.map((i) => itemTitle(i)).join(', ')}`) : T('Ничего полезного', 'Нічого корисного', 'Nothing useful'), got ? 'g' : '');
      rerender();
    },
  },
};
