// Viruses on YOUR computer. They come from devices you plug into the PC: running a suspicious .exe from a found
// flash drive, or simply autorun when you open an infected drive in Explorer.
//  • Winlocker (ransomware): after boot a full‑screen "Your computer is blocked, pay N" — pay (they may not send
//    the code), crack the code, look it up on an antivirus site from your phone, or reinstall Windows from a stick.
//  • Trojan‑miner: a hidden process that eats the CPU — the PC boots slower, windows open with a lag, every job
//    on the PC takes longer, and it burns electricity. You see it only in Task Manager under a fake system name.
//  • Trojan‑stealer: steals a bit of money from your card every few hours until you get rid of it.
// Ending a task is not enough: the file restarts it. End the task, then delete the file. Defender catches only
// some of them. Ending a real system process blue‑screens the PC.
import { G, emit } from '../core/state.js';
import { T } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { uid, clamp } from '../core/util.js';
import { fmt, nicePrice } from '../core/money.js';
import { countryOf } from '../data/world.js';
import { charge, notify, stat } from './player.js';

export function pcv() { const s = G.s; s.pcv ||= { lock: null, procs: [] }; return s.pcv; }
const FAKE_NAMES = {
  miner: [['svch0st.exe', 'C:\\Windows\\Temp\\'], ['WindowsUpdate.exe', 'C:\\Users\\Public\\Libraries\\'], ['csrss .exe', 'C:\\ProgramData\\Microsoft\\Crypto\\'], ['RuntimeBroker32.exe', 'C:\\Users\\%USER%\\AppData\\Roaming\\'], ['AudioHD.exe', 'C:\\Users\\%USER%\\AppData\\Local\\Temp\\'], ['x7f3a1c.exe', 'C:\\Windows\\SysWOW64\\Tasks\\']],
  stealer: [['chrome_update.exe', 'C:\\Users\\%USER%\\AppData\\Roaming\\Google\\'], ['TeIegramUpdater.exe', 'C:\\Users\\%USER%\\AppData\\Local\\'], ['msedge_helper.exe', 'C:\\ProgramData\\'], ['securityhealth32.exe', 'C:\\Users\\Public\\']],
};
const WIN_FAMILIES = [
  { n: ['МВД: ваш компьютер заблокирован', 'Кіберполіція: ваш компʼютер заблоковано', 'Police: your computer is blocked'], why: ['за просмотр запрещённых материалов', 'за перегляд заборонених матеріалів', 'for viewing illegal content'] },
  { n: ['Windows заблокирована', 'Windows заблоковано', 'Windows is blocked'], why: ['лицензия Windows недействительна', 'ліцензія Windows недійсна', 'your Windows licence is invalid'] },
  { n: ['Ваши файлы под угрозой', 'Ваші файли під загрозою', 'Your files are at risk'], why: ['обнаружена вирусная активность', 'виявлено вірусну активність', 'virus activity detected'] },
];
export const lockOf = () => pcv().lock;
export const badProcs = () => pcv().procs.filter((p) => !p.gone);
export const aliveMiners = () => pcv().procs.filter((p) => !p.gone && p.alive && p.kind === 'miner').length;
// how much slower everything on the PC is (boot, windows, installs)
export const slowK = () => 1 + aliveMiners() * 1.5;

export function infect(kind, src = '') {
  const s = G.s, st = pcv(), r = new RNG(uid('vir'));
  if (kind === 'winlock') {
    if (st.lock) return;
    const fam = r.int(0, WIN_FAMILIES.length - 1);
    st.lock = { fam, code: String(r.int(1000, 9999)), ask: nicePrice(r.float(20, 70) * Math.max(0.6, countryOf(s.player.city).wage), countryOf(s.player.city).cur), tries: 0, lookAt: 0, at: s.t, src };
  } else {
    const [name, path] = r.pick(FAKE_NAMES[kind]);
    st.procs.push({ id: uid('pr'), kind, name, path: path.replace('%USER%', (s.player.name || 'user').split(' ')[0]), cpu: kind === 'miner' ? r.int(55, 92) : r.int(1, 4), mem: r.int(kind === 'miner' ? 300 : 40, kind === 'miner' ? 900 : 160), alive: true, gone: false, respawn: 0, nextSteal: s.t + r.int(120, 300), src });
  }
  stat('pcInfected');
  emit('pc');
}
// what an infected file does when you run it on the PC
export function runOnPc(kind) {
  if (kind === 'ransom') { infect('winlock'); return 'winlock'; }
  infect('stealer'); infect('miner'); return 'trojan';
}
// autorun: an infected stick can get you just by being opened
export function autorun(it, virus) {
  const d = (it.data ||= {});
  if (!virus || d.virus || d.autorunChecked) return null;
  d.autorunChecked = true;
  if (new RNG(`auto|${it.seed}`).chance(0.35)) { infect('miner', it.id); return 'miner'; }
  return null;
}

// Task Manager: the real processes plus whatever is hiding among them
const SYS = [
  ['System', 'C:\\Windows\\System32\\ntoskrnl.exe', true], ['Registry', 'C:\\Windows\\System32\\', true], ['smss.exe', 'C:\\Windows\\System32\\', true], ['csrss.exe', 'C:\\Windows\\System32\\', true],
  ['wininit.exe', 'C:\\Windows\\System32\\', true], ['services.exe', 'C:\\Windows\\System32\\', true], ['lsass.exe', 'C:\\Windows\\System32\\', true], ['svchost.exe', 'C:\\Windows\\System32\\', false],
  ['svchost.exe', 'C:\\Windows\\System32\\', false], ['svchost.exe', 'C:\\Windows\\System32\\', false], ['dwm.exe', 'C:\\Windows\\System32\\', true], ['explorer.exe', 'C:\\Windows\\', false],
  ['RuntimeBroker.exe', 'C:\\Windows\\System32\\', false], ['audiodg.exe', 'C:\\Windows\\System32\\', false], ['MsMpEng.exe', 'C:\\ProgramData\\Microsoft\\Windows Defender\\', false],
];
export function processList(open = [], legitMiner = false) {
  const r = new RNG(`tm|${Math.floor(G.s.t / 3)}`);
  const list = SYS.map(([n, path, crit], i) => ({ id: 'sys' + i, name: n, path, pub: 'Microsoft Corporation', cpu: n === 'System' ? r.int(0, 2) : r.chance(0.25) ? 1 : 0, mem: r.int(4, n === 'explorer.exe' ? 120 : n === 'MsMpEng.exe' ? 180 : 40), crit, sys: true }));
  for (const w of open) list.push({ id: 'app_' + w, name: { term: 'cmd.exe', notepad: 'notepad.exe', browser: 'browser.exe', explorer: 'explorer.exe', mines: 'Minesweeper.exe', diag: 'aido64.exe', mine: 'NiceMiner.exe', service: 'pcservice.exe', defender: 'SecurityHealth.exe', thispc: 'explorer.exe', taskmgr: 'Taskmgr.exe', trash: 'explorer.exe' }[w] || 'app.exe', path: 'C:\\Program Files\\', pub: 'Microsoft Corporation', cpu: w === 'diag' ? r.int(30, 60) : r.int(0, 3), mem: r.int(20, 160), app: w });
  if (legitMiner) list.push({ id: 'nicem', name: 'NiceMiner.exe', path: 'C:\\Program Files\\NiceMiner\\', pub: 'NiceMiner Ltd', cpu: r.int(70, 90), mem: 420, legit: true });
  for (const p of badProcs()) if (p.alive) list.push({ id: p.id, name: p.name, path: p.path, pub: T('Неизвестно', 'Невідомо', 'Unknown'), cpu: clamp(p.cpu + r.int(-6, 6), 1, 99), mem: p.mem, bad: true });
  return list;
}
// "End task": malware dies (and comes back unless its file is gone); a critical system process = blue screen
export function endTask(id) {
  const st = pcv();
  if (id.startsWith('sys')) {
    const p = SYS[+id.slice(3)];
    if (p?.[2]) { stat('bsod'); return { bsod: true }; }
    return { ok: true, sys: true };
  }
  const p = st.procs.find((x) => x.id === id);
  if (!p) return { ok: true };
  p.alive = false;
  p.respawn = G.s.t + new RNG(uid('rs')).int(45, 120);
  emit('pc');
  return { ok: true, bad: true };
}
export function deleteFile(id) {
  const p = pcv().procs.find((x) => x.id === id);
  if (!p) return { ok: false };
  if (p.alive) return { ok: false, msg: T('Файл используется другим процессом — сначала снимите задачу', 'Файл використовується іншим процесом — спершу зніміть задачу', 'The file is in use — end the task first') };
  p.gone = true;
  stat('virusRemoved');
  emit('pc');
  return { ok: true };
}
// Defender: catches roughly half of what's running
export function defenderCatch() {
  const out = [];
  for (const p of badProcs()) if (p.alive && Math.random() < 0.55) { p.alive = false; p.gone = true; out.push(p.name); }
  if (out.length) { stat('virusRemoved', out.length); emit('pc'); }
  return out;
}
// winlocker
export function tryCode(code) {
  const L0 = lockOf(); if (!L0) return { ok: true };
  if (String(code).trim() === L0.code) { pcv().lock = null; emit('pc'); return { ok: true }; }
  L0.tries++;
  return { ok: false };
}
export function payLocker() {
  const L0 = lockOf(); if (!L0) return { ok: false };
  if (G.s.money < L0.ask) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  charge(L0.ask, 'scam', T('Перевод «за разблокировку»', 'Переказ «за розблокування»', 'Payment “to unlock”'));
  if (Math.random() < 0.55) { pcv().lock = null; emit('pc'); return { ok: true, honest: true, code: L0.code }; }
  L0.ask = nicePrice(L0.ask * 1.5, countryOf(G.s.player.city).cur);
  return { ok: true, honest: false };
}
// antivirus sites keep a list of unlock codes for known lockers; once per game hour
export function lookupCode() {
  const L0 = lockOf(); if (!L0) return { ok: false };
  if (G.s.t - (L0.lookAt || 0) < 60) return { ok: false, wait: 60 - (G.s.t - L0.lookAt) };
  L0.lookAt = G.s.t;
  if (Math.random() < 0.45) return { ok: true, code: L0.code };
  return { ok: true, code: null };
}
export function cureAll() { const st = pcv(); st.lock = null; for (const p of st.procs) { p.alive = false; p.gone = true; } emit('pc'); }
export const lockText = () => { const L0 = lockOf(); return L0 ? WIN_FAMILIES[L0.fam] : null; };

// every game minute: killed malware restarts from its file, stealers steal, miners burn power
export function pcvTick() {
  const s = G.s, st = s.pcv;
  if (!st?.procs?.length) return;
  for (const p of st.procs) {
    if (p.gone) continue;
    if (!p.alive && p.respawn && s.t >= p.respawn) { p.alive = true; p.respawn = 0; }
    if (p.alive && p.kind === 'stealer' && s.t >= p.nextSteal) {
      const amt = clamp(s.money * 0.008, 2, 35);
      if (s.money > amt) {
        charge(amt, 'scam', T('Списание: онлайн‑сервис', 'Списання: онлайн‑сервіс', 'Charge: online service'));
        notify('bank', T('Подозрительное списание', 'Підозріле списання', 'Suspicious charge'), `−${fmt(amt)} · ${T('онлайн‑сервис', 'онлайн‑сервіс', 'online service')}`);
      }
      p.nextSteal = s.t + new RNG(uid('st')).int(240, 480);
    }
  }
  if (s.t % 60 === 0 && aliveMiners()) charge(0.05 * aliveMiners(), 'service', T('Электричество', 'Електрика', 'Electricity'));
  st.procs = st.procs.filter((p) => !p.gone);
}
