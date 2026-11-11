// Casino table games: one-armed bandit, European roulette, blackjack, dice. All use in-game money only;
// every game has a house edge (slots ~95% return, roulette 97.3%, blackjack ~99% with basic play, dice ~96%).
import { G } from '../core/state.js';
import { T } from '../core/i18n.js';
import { fmt } from '../core/money.js';
import { toast, rerender } from '../ui/shell.js';
import { spend, earn } from '../game/player.js';
import { sfx } from '../ui/sfx.js';

// ---------------------------------------------------------------- slots
const SYM = ['🍒', '🍋', '🍊', '🍉', '🔔', '⭐', '💎', '7️⃣'];
const W8 = [6, 5, 5, 4, 3, 2, 1.5, 1];
const PAY3 = [10, 15, 15, 25, 50, 100, 250, 600];
const pickSym = () => { let r = Math.random() * W8.reduce((a, b) => a + b, 0); for (let i = 0; i < SYM.length; i++) { r -= W8[i]; if (r <= 0) return i; } return 0; };
function slotPay(line) {
  const [a, b, c] = line;
  if (a === b && b === c) return PAY3[a];
  const ch = line.filter((x) => x === 0).length;
  if (ch === 2) return 2.5;
  if (a === b || b === c || a === c) return 0.5;
  return 0;
}
export const CG = { slot: [[0, 1, 2], [3, 4, 5], [6, 7, 0]], spinning: false, rlBet: 'red', rlNum: 17, rlLast: [], bj: null, dice: 'hi', diceLast: null };
const reel = (i) => `<div class="reel" data-r="${i}"><div class="strip">${[0, 1, 2].map((r) => `<div class="sym">${SYM[CG.slot[r][i]]}</div>`).join('')}</div></div>`;
export function slotsView(betBlock) {
  return `<div class="slotm"><div class="slot-top">★ LUCKY 7 ★</div><div class="reels">${[0, 1, 2].map(reel).join('')}<div class="payline"></div></div>
    <div class="slot-pay">${SYM.map((s, i) => `<span>${s}${s}${s} ×${PAY3[i]}</span>`).join('')}<span>🍒🍒 ×2.5</span><span>${T('любая пара', 'будь-яка пара', 'any pair')} ×0.5</span></div></div>
    ${betBlock}<button class="btn block mt slot-lever" style="min-height:60px;font-size:20px;background:linear-gradient(180deg,#ff4f6d,#c4123a)" data-a="slots">🎰 ${T('Крутить', 'Крутити', 'Spin')}</button>`;
}
export async function playSlots(bet, settle) {
  if (CG.spinning) return;
  if (!(bet > 0) || !spend(bet, 'casino', T('Слоты', 'Слоти', 'Slots'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
  CG.spinning = true;
  const res = [[], [], []];
  for (let i = 0; i < 3; i++) for (let r = 0; r < 3; r++) res[r][i] = pickSym();
  const reels = [...document.querySelectorAll('.reels .reel')];
  sfx('tick');
  await Promise.all(reels.map((el, i) => new Promise((done) => {
    const strip = el.querySelector('.strip');
    const n = 18 + i * 7;
    const syms = [];
    for (let k = 0; k < n; k++) syms.push(SYM[pickSym()]);
    syms.push(...[0, 1, 2].map((r) => SYM[res[r][i]]));
    strip.innerHTML = [...[0, 1, 2].map((r) => `<div class="sym">${SYM[CG.slot[r][i]]}</div>`), ...syms.map((s) => `<div class="sym">${s}</div>`)].join('');
    const h = strip.firstElementChild.getBoundingClientRect().height;
    strip.style.transition = 'none'; strip.style.transform = 'translateY(0)';
    strip.getBoundingClientRect();
    strip.style.transition = `transform ${1.1 + i * 0.45}s cubic-bezier(.12,.6,.2,1)`;
    strip.style.transform = `translateY(${-(syms.length) * h}px)`;
    setTimeout(() => { sfx('tap'); done(); }, 1100 + i * 450 + 30);
  })));
  CG.slot = res;
  const line = res[1];
  const mult = slotPay(line);
  CG.spinning = false;
  settle(bet, mult > 0, mult, true);
  sfx(mult >= 10 ? 'win' : mult > 1 ? 'cash' : mult > 0 ? 'tap' : 'lose');
  toast(mult > 0 ? `${line.map((x) => SYM[x]).join('')} ×${mult} → ${fmt(bet * mult)}` : T('Мимо', 'Мимо', 'No win'), mult >= 1 ? 'g' : 'r');
  rerender();
}

// ---------------------------------------------------------------- roulette (European, one zero)
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const colOf = (n) => (n === 0 ? 'z' : RED.has(n) ? 'r' : 'b');
const RL_BETS = {
  red: [T('Красное', 'Червоне', 'Red'), 2, (n) => RED.has(n)], black: [T('Чёрное', 'Чорне', 'Black'), 2, (n) => n > 0 && !RED.has(n)],
  even: [T('Чёт', 'Парне', 'Even'), 2, (n) => n > 0 && n % 2 === 0], odd: [T('Нечет', 'Непарне', 'Odd'), 2, (n) => n % 2 === 1],
  low: ['1–18', 2, (n) => n >= 1 && n <= 18], high: ['19–36', 2, (n) => n >= 19],
  d1: ['1–12', 3, (n) => n >= 1 && n <= 12], d2: ['13–24', 3, (n) => n >= 13 && n <= 24], d3: ['25–36', 3, (n) => n >= 25],
  num: [T('Число', 'Число', 'Number'), 36, (n) => n === CG.rlNum],
};
function wheelSVG() {
  const seg = 360 / WHEEL.length;
  let g = '';
  WHEEL.forEach((n, i) => {
    const a0 = (i * seg - 90 - seg / 2) * Math.PI / 180, a1 = ((i + 1) * seg - 90 - seg / 2) * Math.PI / 180;
    const p = (r, a) => `${(120 + r * Math.cos(a)).toFixed(2)} ${(120 + r * Math.sin(a)).toFixed(2)}`;
    g += `<path d="M${p(112, a0)} A112 112 0 0 1 ${p(112, a1)} L${p(78, a1)} A78 78 0 0 0 ${p(78, a0)}Z" fill="${n === 0 ? '#11a35a' : RED.has(n) ? '#c8102e' : '#161616'}" stroke="#c9a227" stroke-width=".6"/>`;
    const am = (a0 + a1) / 2;
    g += `<text x="${(120 + 96 * Math.cos(am)).toFixed(1)}" y="${(120 + 96 * Math.sin(am)).toFixed(1)}" fill="#fff" font-size="8" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(${(i * seg).toFixed(1)} ${(120 + 96 * Math.cos(am)).toFixed(1)} ${(120 + 96 * Math.sin(am)).toFixed(1)})">${n}</text>`;
  });
  const keep = (deg) => `style="transform-origin:120px 120px;transform:rotate(${((deg % 360) + 360) % 360}deg)"`;
  return `<svg viewBox="0 0 240 240" class="rl-wheel"><circle cx="120" cy="120" r="118" fill="#3b2412" stroke="#c9a227" stroke-width="3"/><g class="rl-rot" ${keep(CG.rlW || 0)}>${g}<circle cx="120" cy="120" r="76" fill="#2a1a0e"/><circle cx="120" cy="120" r="40" fill="#c9a227"/><circle cx="120" cy="120" r="30" fill="#7a5a1a"/></g><g class="rl-ball" ${keep(CG.rlB || 0)}><circle cx="120" cy="18" r="6" fill="#fff" stroke="#bbb"/></g></svg>`;
}
export function rouletteView(betBlock) {
  const last = CG.rlLast.slice(0, 12).map((n) => `<span class="rl-n ${colOf(n)}">${n}</span>`).join('');
  return `<div class="rl">${wheelSVG()}<div class="rl-last">${last || T('Делайте ставки', 'Робіть ставки', 'Place your bets')}</div></div>
    <div class="pad-grid" style="grid-template-columns:repeat(5,1fr);margin:8px 0">${Object.entries(RL_BETS).map(([k, b]) => `<button class="${CG.rlBet === k ? 'ok' : ''} ${k === 'red' ? 'rl-red' : k === 'black' ? 'rl-black' : ''}" data-a="rlb" data-v="${k}">${b[0]}<small style="display:block;opacity:.6">×${b[1]}</small></button>`).join('')}</div>
    ${CG.rlBet === 'num' ? `<div class="rl-grid">${Array.from({ length: 37 }, (_, n) => `<button class="rl-n ${colOf(n)} ${CG.rlNum === n ? 'sel' : ''}" data-a="rln" data-v="${n}">${n}</button>`).join('')}</div>` : ''}
    ${betBlock}<button class="btn block mt" style="min-height:60px;font-size:20px;background:linear-gradient(180deg,#11a35a,#0b6e3c)" data-a="roulette">🎡 ${T('Крутить колесо', 'Крутити колесо', 'Spin the wheel')}</button>`;
}
export async function playRoulette(bet, settle) {
  if (CG.spinning) return;
  if (!(bet > 0) || !spend(bet, 'casino', T('Рулетка', 'Рулетка', 'Roulette'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
  CG.spinning = true;
  const n = Math.floor(Math.random() * 37);
  const idx = WHEEL.indexOf(n);
  const rot = document.querySelector('.rl-rot'), ball = document.querySelector('.rl-ball');
  const seg = 360 / WHEEL.length;
  const from = ((CG.rlW || 0) % 360 + 360) % 360;
  const wheelEnd = from + 360 * 5 + Math.random() * 360;
  // ball lands at the pocket that ends up under the 12 o'clock marker
  const ballEnd = -(360 * 7) + (idx * seg + wheelEnd) % 360;
  CG.rlW = wheelEnd % 360; CG.rlB = ((ballEnd % 360) + 360) % 360;
  if (rot && ball) {
    for (const [el, deg] of [[rot, wheelEnd], [ball, ballEnd]]) { el.style.transformOrigin = '120px 120px'; el.style.transition = 'transform 3.2s cubic-bezier(.1,.65,.12,1)'; requestAnimationFrame(() => (el.style.transform = `rotate(${deg}deg)`)); }
  }
  sfx('tick');
  await new Promise((r) => setTimeout(r, 3300));
  CG.spinning = false;
  CG.rlLast.unshift(n);
  const b = RL_BETS[CG.rlBet];
  const win = b[2](n);
  settle(bet, win, b[1], true);
  sfx(win ? 'win' : 'lose');
  toast(`${n} ${n === 0 ? '🟢' : RED.has(n) ? '🔴' : '⚫'} · ${win ? `+${fmt(bet * b[1] - bet)}` : `−${fmt(bet)}`}`, win ? 'g' : 'r');
  rerender();
}

// ---------------------------------------------------------------- blackjack
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
function deck() { const d = []; for (let k = 0; k < 4; k++) for (const s of SUITS) for (const r of RANKS) d.push({ r, s }); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }
function total(hand) { let t = 0, a = 0; for (const c of hand) { if (c.r === 'A') { a++; t += 11; } else t += ['J', 'Q', 'K'].includes(c.r) ? 10 : +c.r; } while (t > 21 && a) { t -= 10; a--; } return t; }
const cardHTML = (c, hidden) => hidden ? '<div class="pc back"></div>' : `<div class="pc ${c.s === '♥' || c.s === '♦' ? 'red' : ''}"><b>${c.r}</b><span>${c.s}</span></div>`;
export function blackjackView(betBlock) {
  const bj = CG.bj;
  if (!bj || bj.st === 'done') {
    return `<div class="bj-table">${bj ? `<div class="bj-row"><small>${T('Дилер', 'Дилер', 'Dealer')} · ${total(bj.dealer)}</small><div class="hand">${bj.dealer.map((c) => cardHTML(c)).join('')}</div></div><div class="bj-msg">${bj.msg}</div><div class="bj-row"><small>${T('Вы', 'Ви', 'You')} · ${total(bj.player)}</small><div class="hand">${bj.player.map((c) => cardHTML(c)).join('')}</div></div>` : `<div class="bj-msg">${T('Блэкджек платит 3:2. Дилер берёт до 17.', 'Блекджек платить 3:2. Дилер бере до 17.', 'Blackjack pays 3:2. Dealer stands on 17.')}</div>`}</div>
      ${betBlock}<button class="btn block mt" style="min-height:60px;font-size:20px;background:linear-gradient(180deg,#1f7a4d,#0f4f30)" data-a="bjdeal">🃏 ${T('Раздать', 'Роздати', 'Deal')}</button>`;
  }
  return `<div class="bj-table"><div class="bj-row"><small>${T('Дилер', 'Дилер', 'Dealer')}</small><div class="hand">${bj.dealer.map((c, i) => cardHTML(c, i === 1)).join('')}</div></div><div class="bj-msg">${T('Ставка', 'Ставка', 'Bet')} ${fmt(bj.bet)}</div><div class="bj-row"><small>${T('Вы', 'Ви', 'You')} · ${total(bj.player)}</small><div class="hand">${bj.player.map((c) => cardHTML(c)).join('')}</div></div></div>
    <div class="btns"><button class="btn" data-a="bjhit">${T('Ещё', 'Ще', 'Hit')}</button><button class="btn dark" data-a="bjstand">${T('Хватит', 'Досить', 'Stand')}</button>${bj.player.length === 2 && G.s.money >= bj.bet ? `<button class="btn dark" data-a="bjdouble">×2</button>` : ''}</div>`;
}
export function bjDeal(bet, settle) {
  if (!(bet > 0) || !spend(bet, 'casino', T('Блэкджек', 'Блекджек', 'Blackjack'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
  const d = deck();
  CG.bj = { d, bet, player: [d.pop(), d.pop()], dealer: [d.pop(), d.pop()], st: 'play', msg: '' };
  sfx('tap');
  if (total(CG.bj.player) === 21) return bjFinish(settle);
  rerender();
}
export function bjHit(settle) { const bj = CG.bj; if (!bj || bj.st !== 'play') return; bj.player.push(bj.d.pop()); sfx('tap'); if (total(bj.player) >= 21) return bjFinish(settle); rerender(); }
export function bjDouble(settle) { const bj = CG.bj; if (!bj || bj.st !== 'play' || !spend(bj.bet, 'casino', T('Удвоение', 'Подвоєння', 'Double'))) return; bj.bet *= 2; bj.player.push(bj.d.pop()); bjFinish(settle); }
export function bjFinish(settle) {
  const bj = CG.bj;
  const p = total(bj.player);
  const natural = p === 21 && bj.player.length === 2;
  if (p <= 21 && !natural) while (total(bj.dealer) < 17) bj.dealer.push(bj.d.pop());
  const dl = total(bj.dealer);
  let mult = 0, msg;
  if (p > 21) msg = T('Перебор', 'Перебір', 'Bust');
  else if (natural && !(dl === 21 && bj.dealer.length === 2)) { mult = 2.5; msg = T('Блэкджек!', 'Блекджек!', 'Blackjack!'); }
  else if (dl > 21 || p > dl) { mult = 2; msg = T('Вы выиграли', 'Ви виграли', 'You win'); }
  else if (p === dl) { mult = 1; msg = T('Ничья', 'Нічия', 'Push'); }
  else msg = T('Дилер выиграл', 'Дилер виграв', 'Dealer wins');
  bj.st = 'done'; bj.msg = msg;
  settle(bj.bet, mult > 0, mult, true);
  sfx(mult > 1 ? 'win' : mult === 1 ? 'tap' : 'lose');
  toast(mult > 1 ? `${msg} +${fmt(bj.bet * mult - bj.bet)}` : mult === 1 ? msg : `${msg} −${fmt(bj.bet)}`, mult >= 1 ? 'g' : 'r');
  rerender();
}

// ---------------------------------------------------------------- dice
const DICE_BETS = { hi: [T('Больше 7', 'Більше 7', 'Over 7'), 2.3, (a, b) => a + b > 7], lo: [T('Меньше 7', 'Менше 7', 'Under 7'), 2.3, (a, b) => a + b < 7], seven: [T('Ровно 7', 'Рівно 7', 'Exactly 7'), 5.7, (a, b) => a + b === 7], dbl: [T('Дубль', 'Дубль', 'Doubles'), 5.7, (a, b) => a === b] };
const FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
export function diceView(betBlock) {
  const [a, b] = CG.diceLast || [5, 2];
  return `<div class="dice"><span class="die">${FACE[a - 1]}</span><span class="die">${FACE[b - 1]}</span></div><div class="center small m">${CG.diceLast ? T(`Сумма: ${a + b}`, `Сума: ${a + b}`, `Total: ${a + b}`) : T('Угадайте сумму двух кубиков', 'Вгадайте суму двох кубиків', 'Guess the total of two dice')}</div>
    <div class="pad-grid" style="grid-template-columns:repeat(4,1fr);margin:10px 0">${Object.entries(DICE_BETS).map(([k, x]) => `<button class="${CG.dice === k ? 'ok' : ''}" data-a="dcb" data-v="${k}">${x[0]}<small style="display:block;opacity:.6">×${x[1]}</small></button>`).join('')}</div>
    ${betBlock}<button class="btn block mt" style="min-height:60px;font-size:20px;background:linear-gradient(180deg,#ff9a1f,#d1620a)" data-a="dice">🎲 ${T('Бросить', 'Кинути', 'Roll')}</button>`;
}
export async function playDice(bet, settle) {
  if (CG.spinning) return;
  if (!(bet > 0) || !spend(bet, 'casino', T('Кости', 'Кості', 'Dice'))) return toast(T('Не хватает денег', 'Не вистачає грошей', 'Not enough money'), 'r');
  CG.spinning = true;
  const a = 1 + Math.floor(Math.random() * 6), b = 1 + Math.floor(Math.random() * 6);
  const dies = [...document.querySelectorAll('.dice .die')];
  for (let k = 0; k < 10; k++) { dies.forEach((d) => { d.textContent = FACE[Math.floor(Math.random() * 6)]; d.style.transform = `rotate(${Math.random() * 60 - 30}deg)`; }); sfx('tick'); await new Promise((r) => setTimeout(r, 70 + k * 12)); }
  CG.spinning = false;
  CG.diceLast = [a, b];
  const x = DICE_BETS[CG.dice];
  const win = x[2](a, b);
  settle(bet, win, x[1], true);
  sfx(win ? 'win' : 'lose');
  toast(`${FACE[a - 1]} ${FACE[b - 1]} = ${a + b} · ${win ? `+${fmt(bet * x[1] - bet)}` : `−${fmt(bet)}`}`, win ? 'g' : 'r');
  rerender();
}
