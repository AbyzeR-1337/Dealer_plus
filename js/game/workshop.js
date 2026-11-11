// Workshop: repairs (DIY minigames or paid master), cleaning, diagnostics, authentication, grading, phone lab.
import { G, emit } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { uid, clamp, chance, rnd } from '../core/util.js';
import { DEFECTS, LOCKS, MODEL } from '../data/catalog.js';
import { itemValue, itemTitle, modelOf, defectName } from './items.js';
import { getItem, spend, stat, addXP, upLevel, notify, log } from './player.js';
import { fmt } from '../core/money.js';
import { modelValue } from '../data/catalog.js';

const base = (it) => modelValue(modelOf(it));
export function repairQuote(it, code) {
  const d = DEFECTS[code];
  if (!d?.fix) return null;
  const k = 1 - upLevel('hands') * 0.12;
  const parts = Math.max(2, base(it) * d.fix[1] * k);
  return { game: d.fix[0], parts, master: parts * 1.7 + 5, time: Math.round(d.fix[2] * k) };
}
export const busy = (itemId) => G.s.repairs.some((r) => r.itemId === itemId);

// DIY repair right now after a minigame; quality 0..1
export function diyRepair(it, code, quality) {
  const q = repairQuote(it, code);
  if (!q) return { ok: false };
  if (!spend(q.parts, 'repair', T('Запчасти', 'Запчастини', 'Parts'))) return { ok: false, msg: T('Не хватает денег на запчасти', 'Не вистачає грошей на запчастини', 'Not enough money for parts') };
  stat('repairs');
  if (quality < 0.35) {
    // botched: part wasted, condition drops a bit
    it.cond = clamp(it.cond - 4, 1, 100);
    addXP(3);
    return { ok: false, botched: true, msg: T('Не получилось — запчасть испорчена', 'Не вийшло — запчастину зіпсовано', 'Botched — the part is ruined') };
  }
  fixDefect(it, code, quality);
  addXP(10 + q.parts / 20);
  return { ok: true };
}
export function fixDefect(it, code, quality = 1) {
  const i = it.defects.findIndex((d) => d.c === code);
  if (i < 0) return;
  const sev = DEFECTS[code]?.sev || 0.1;
  it.defects.splice(i, 1);
  it.cond = clamp(Math.round(it.cond + sev * 40 * (0.5 + quality * 0.5)), 1, 99);
  it.repaired = (it.repaired || 0) + 1;
  log('repair', `${itemTitle(it)}: ${defectName(code)}`);
  emit('inv');
}
export function masterRepair(it, code) {
  const q = repairQuote(it, code);
  if (!q || busy(it.id)) return { ok: false };
  if (!spend(q.master, 'repair', T('Мастерская', 'Майстерня', 'Workshop'))) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  G.s.repairs.push({ id: uid('r'), itemId: it.id, kind: 'fix', code, done: G.s.t + q.time, start: G.s.t });
  stat('repairs');
  addXP(5);
  return { ok: true };
}
export function cleanItem(it, score) {
  if (it.cleaned) return false;
  it.cleaned = true;
  it.cond = clamp(Math.round(it.cond + 3 + score * 9), 1, 99);
  stat('cleaned'); addXP(4);
  emit('inv');
  return true;
}
export const diagCost = (it) => Math.max(3, base(it) * 0.015);
export function diagnose(it) {
  if (!spend(diagCost(it), 'service', T('Диагностика', 'Діагностика', 'Diagnostics'))) return false;
  for (const d of it.defects) d.known = true;
  it.diag = true;
  stat('inspections');
  emit('inv');
  return true;
}
export const authCost = (it) => Math.max(5, itemValue(it, G.s.player.city, 'known') * 0.05);
export function paidAuth(it) {
  if (!spend(authCost(it), 'service', T('Экспертиза', 'Експертиза', 'Authentication'))) return false;
  it.fakeKnown = true;
  if (!it.fake) it.authOk = true;
  stat('legit');
  emit('inv');
  return true;
}
// result of the legit-check minigame: score 0..1; returns verdict 'orig'|'fake'|'unsure'
export function legitVerdict(it, score) {
  const acc = clamp(0.45 + score * 0.5 + upLevel('expert') * 0.06, 0, 0.98);
  stat('legit'); addXP(6);
  if (chance(acc)) {
    it.fakeKnown = true;
    if (!it.fake) it.authOk = score > 0.8;
    emit('inv');
    return it.fake ? 'fake' : 'orig';
  }
  return 'unsure';
}
export const gradeCost = (it) => 25 + itemValue(it, G.s.player.city, 'known') * 0.02;
export function sendToGrading(it) {
  if (it.grade || it.sealed || busy(it.id)) return { ok: false };
  if (!spend(gradeCost(it), 'service', it.cat === 'cards' ? 'PZA' : 'CGS')) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  G.s.repairs.push({ id: uid('r'), itemId: it.id, kind: 'grade', done: G.s.t + 600, start: G.s.t });
  return { ok: true };
}
function computeGrade(it) {
  let g = it.cond / 10 + rnd(-0.8, 0.6);
  for (const d of it.defects) g -= (DEFECTS[d.c]?.sev || 0) * 6;
  if (it.fake) return 1;
  g = clamp(g, 1, 10);
  return g >= 9.75 ? 10 : g >= 9.25 && it.cat === 'comics' ? 9.5 : Math.max(1, Math.floor(g * 2) / 2 >= 9 ? 9 : Math.floor(g));
}
export function workshopTick() {
  const s = G.s;
  const done = s.repairs.filter((r) => r.done <= s.t);
  if (!done.length) return;
  s.repairs = s.repairs.filter((r) => r.done > s.t);
  for (const r of done) {
    const it = getItem(r.itemId);
    if (!it) continue;
    if (r.kind === 'fix') { fixDefect(it, r.code, 1); notify('repair', T('Ремонт готов', 'Ремонт готовий', 'Repair done'), `${itemTitle(it)}: ${defectName(r.code)}`); }
    if (r.kind === 'grade') {
      const g = computeGrade(it);
      it.grade = g; it.fakeKnown = true; if (!it.fake) it.authOk = true;
      notify('repair', T('Грейдинг завершён', 'Грейдинг завершено', 'Grading complete'), `${itemTitle(it)}: ${it.cat === 'cards' ? 'PZA' : 'CGS'} ${g}`);
    }
  }
  emit('inv');
}

// ---------------------------------------------------------------- phone lab
export function reflash(it, success) {
  stat('reflash');
  if (!success) { addXP(2); return 'fail'; }
  if (['passcode', 'frp', 'bootloop'].includes(it.lock)) { const was = it.lock; it.lock = null; addXP(18); emit('inv'); return was; }
  if (it.lock) return 'hopeless';
  return 'nothing';
}
export function jailbreak(it, success) {
  stat('jailbreaks');
  if (it.lock) return 'locked';
  if (it.jb) return 'already';
  if (success) { it.jb = true; addXP(14); emit('inv'); return 'ok'; }
  it.lock = 'bootloop'; emit('inv');
  return 'bootloop';
}
