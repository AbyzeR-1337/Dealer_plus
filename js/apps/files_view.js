// "Contents" screen of a device in the Storage app: folders, file previews and what you can do with finds.
import { G } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { fmt } from '../core/money.js';
import { rerender, toast, confirmBox, sheet, resolveSheet, openApp } from '../ui/shell.js';
import { empty } from '../ui/comp.js';
import { getItem } from '../game/player.js';
import { itemTitle } from '../game/items.js';
import { playMini } from '../mini/engine.js';
import { sfx } from '../ui/sfx.js';
import { DEFECTS } from '../data/catalog.js';
import {
  storageKind, deviceFiles, accessOf, LOCKED, connect, wipe, recover, recoverCost, tryWallet, cashWallet, returnToOwner, dashAction, corpAction, rareSell,
  runExe, payRansom, decrypted, pinResult, passResult, passReady, KIND_NAME, resetWord,
} from '../game/files.js';

const walletCtx = { id: null, fid: null };
const ICON = { photo: '🖼', video: '🎞', text: '📝', doc: '📄', music: '🎵', audio: '🎙', exe: '⚙️', wallet: '👛', game: '🎮', save: '💾', archive: '🗜', contact: '👥' };
const DEV_ICON = { usb: '🔌', secure: '🔐', card: '💳', dashcam: '🚗', hdd: '🖴', office: '🗄', nas: '🗄', tape: '📼', floppy: '💾', cd: '💿', dvd: '📀', gamecd: '💿', cassette: '📼', vhs: '📼', ipod: '🎧', dictaphone: '🎙', phone: '📱', tablet: '📱', laptop: '💻', camera: '📷', drone: '🛸', console: '🎮' };
const size = (mb) => (mb >= 1000 ? `${(mb / 1000).toFixed(1)} ${T('ГБ', 'ГБ', 'GB')}` : mb >= 1 ? `${Math.round(mb)} ${T('МБ', 'МБ', 'MB')}` : mb > 0 ? `${Math.max(1, Math.round(mb * 1000))} ${T('КБ', 'КБ', 'KB')}` : '');
const capTxt = (gb) => (gb >= 1000 ? `${+(gb / 1000).toFixed(1)} ${T('ТБ', 'ТБ', 'TB')}` : gb >= 1 ? `${+gb.toFixed(1)} ${T('ГБ', 'ГБ', 'GB')}` : `${+(gb * 1000).toFixed(2)} ${T('МБ', 'МБ', 'MB')}`);
const sceneCard = (sc, big) => `<div class="fv-scene ${big ? 'big' : ''}"><span>${sc[0]}</span><b>${esc(L([sc[1], sc[2], sc[3]]))}</b><small>${T('лица размыты', 'обличчя розмиті', 'faces blurred')}</small></div>`;

export function filesView(p) {
  const it = getItem(p.id);
  if (!it) return empty('archive', T('Вещи уже нет', 'Речі вже немає', 'Item is gone'));
  const kind = storageKind(it), d = it.data || {};
  if (!kind) return empty('archive', T('Здесь нечего смотреть', 'Тут нічого дивитися', 'Nothing to look at'));
  if (!d.seen) { const n = connect(it); if (n.length) setTimeout(() => toast(T('Проверка при подключении: ', 'Перевірка під час підключення: ', 'Plug‑in check: ') + n.map((c) => L(DEFECTS[c].n).toLowerCase()).join(', '), 'r'), 0); }
  const acc = accessOf(it), f = deviceFiles(it);
  const head = `<div class="fv-head"><span class="fv-ico">${DEV_ICON[kind] || '💾'}</span><div class="grow"><b>${esc(itemTitle(it))}</b><small>${esc(L(KIND_NAME[kind]))} · ${capTxt(f.cap)}</small>${!f.empty && acc.ok ? `<div class="fv-cap"><i style="width:${Math.min(100, Math.max(2, (f.used / f.cap) * 100))}%"></i></div><small>${T('Занято', 'Зайнято', 'Used')} ${capTxt(f.used)} ${T('из', 'з', 'of')} ${capTxt(f.cap)}</small>` : ''}</div></div>`;
  const wipeBtn = `<button class="btn dark block mt" data-a="fwipe" data-v="${it.id}">🧹 ${resetWord(kind)}</button>`;
  if (d.lost) return `${head}<div class="card warn">${T('Данные потеряны безвозвратно. Устройство можно отформатировать и продать как пустое.', 'Дані втрачено безповоротно. Пристрій можна відформатувати й продати як порожній.', 'The data is gone for good. Format it and sell it empty.')}</div>${wipeBtn}`;
  if (!acc.ok) {
    let act = '';
    if (acc.why === 'lock') act = `<button class="btn block mt" data-a="lab" data-v="${it.id}">🔓 Phone Lab</button>`;
    if (acc.why === 'dead' || acc.why === 'click') act = `<button class="btn block mt" data-a="frecover" data-v="${it.id}">🛠 ${T('Сервис восстановления данных', 'Сервіс відновлення даних', 'Data recovery service')} · ${fmt(recoverCost(it))}</button><p class="small m mt">${T('Шанс около 70%. Если не выйдет — деньги не возвращают.', 'Шанс близько 70%. Якщо не вийде — гроші не повертають.', 'About a 70% chance. No refund if it fails.')}</p>`;
    if (acc.why === 'pin') act = `<button class="btn block mt" data-a="fpin" data-v="${it.id}">⌨️ ${T('Подобрать PIN', 'Підібрати PIN', 'Crack the PIN')} · ${3 - (d.pinFails || 0)}/3</button>`;
    if (acc.why === 'pass') act = `<button class="btn block mt" data-a="fpass" data-v="${it.id}" ${passReady(it) ? '' : 'disabled'}>🔑 ${passReady(it) ? T('Подобрать пароль', 'Підібрати пароль', 'Guess the password') : T('Попытка раз в игровой час', 'Спроба раз на ігрову годину', 'One try per game hour')}</button>${wipeBtn.replace('dark block mt', 'dark block mt')}`;
    return `${head}<div class="card warn">${esc(LOCKED[acc.why] ? LOCKED[acc.why]() : '')}</div>${act}`;
  }
  if (f.empty) return `${head}<div class="fv-empty">📭<b>${f.why === 'new' ? T('Новое устройство — пусто', 'Новий пристрій — порожньо', 'Brand new — empty') : f.why === 'wiped' ? T('Вы всё стёрли', 'Ви все стерли', 'You wiped it') : T('Отформатировано прежним владельцем', 'Відформатовано попереднім власником', 'Formatted by the previous owner')}</b><small>${T('Можно продавать спокойно.', 'Можна спокійно продавати.', 'Safe to sell.')}</small></div>`;
  if (d.ransom) return `${head}<div class="card warn">🔒 ${esc(LOCKED.ransom())} ${T('На экране: «Переведите выкуп, иначе файлы будут удалены».', 'На екрані: «Переведіть викуп, інакше файли буде видалено».', 'On screen: “Pay up or your files are deleted”.')}</div>
    <button class="btn block mt" data-a="fransom" data-v="${it.id}">💸 ${T('Заплатить', 'Заплатити', 'Pay')} ${fmt(f.finds.virus?.ransom || 0)}</button><button class="btn dark block mt" data-a="fdecrypt" data-v="${it.id}">🧩 ${T('Подобрать ключ расшифровки', 'Підібрати ключ розшифрування', 'Crack the decryption key')}</button>${wipeBtn}`;
  let h = head;
  if (f.personal && !d.wiped) h += `<div class="card warn small">⚠️ ${T('Здесь чужие личные данные. Сотрите их перед продажей — иначе покупатель может пожаловаться, а за утечку бывают штрафы.', 'Тут чужі особисті дані. Зітріть їх перед продажем — інакше покупець може поскаржитися, а за витік бувають штрафи.', 'Someone’s personal data is on here. Wipe it before selling — buyers complain and leaks get fined.')}</div>`;
  h += f.dirs.map((dd) => `<div class="fv-dir">📁 ${esc(dd.name || '/')}</div>${dd.files.map((x) => `<div class="fv-file ${x.bad ? 'bad' : ''}" data-a="fopen" data-v="${it.id}|${x.id}"><span class="fv-fi">${ICON[x.type] || '📄'}</span><div class="grow"><b>${esc(x.name)}</b><small>${[size(x.size), x.dur, x.date].filter(Boolean).join(' · ')}${x.bad ? ' · ⚠ ' + T('повреждён', 'пошкоджено', 'corrupted') : ''}</small></div>${x.flag && d['seen_' + x.flag] ? '<span class="fv-star">★</span>' : ''}</div>`).join('')}`).join('');
  h += wipeBtn;
  return h;
}

// a sheet with our own buttons; resolves with the button value
function ask(html, buttons) {
  return sheet(`${html}<div class="fv-btns">${buttons.map(([v, label, cls = '']) => `<button class="btn block ${cls}" data-r="${esc(v)}">${label}</button>`).join('')}</div>`, { after(el) { el.querySelectorAll('[data-r]').forEach((b) => { b.onclick = () => resolveSheet(b.dataset.r); }); } });
}
function filePreview(it, x) {
  const f = deviceFiles(it), d = it.data || {};
  const top = `<h2 class="fv-title">${ICON[x.type] || '📄'} ${esc(x.name)}</h2>`;
  if (x.bad) return [`${top}<div class="fv-glitch">⚠ ${T('Не удалось прочитать файл: CRC error', 'Не вдалося прочитати файл: CRC error', 'Couldn’t read the file: CRC error')}</div>`, [['x', T('Закрыть', 'Закрити', 'Close'), 'dark']]];
  if (x.type === 'photo') {
    const pic = x.img ? `<img class="fv-img" src="${esc(x.img)}" alt="">` : x.scene ? sceneCard(x.scene, true) : sceneCard(['🖼', 'Фото', 'Фото', 'Photo'], true);
    const owner = x.flag === 'owner' && f.finds.owner && !d.owner;
    return [`${top}${pic}<p class="small m">📷 ${esc(x.cam || '—')} · ${esc(x.date)}</p>${owner ? `<p class="p">${T(`Похоже, это семья: ${f.finds.owner.name}. Наверняка они расстроились, что фото пропали.`, `Схоже, це родина: ${f.finds.owner.name}. Напевно, вони засмутилися, що фото зникли.`, `Looks like a family: ${f.finds.owner.name}. They must miss these photos.`)}</p>` : ''}`, owner ? [['contacts', '👥 ' + T('Найти владельцев в контактах', 'Знайти власників у контактах', 'Find the owners in the contacts')], ['x', T('Закрыть', 'Закрити', 'Close'), 'dark']] : [['x', T('Закрыть', 'Закрити', 'Close'), 'dark']]];
  }
  if (x.type === 'contact') return [top, [['contacts', '👥 ' + T('Открыть контакты', 'Відкрити контакти', 'Open contacts')], ['x', T('Закрыть', 'Закрити', 'Close'), 'dark']]];
  if (x.type === 'wallet') {
    const w = f.finds.wallet;
    if (!w) return [top + `<p class="p">${T('Кошелёк пустой.', 'Гаманець порожній.', 'Empty wallet.')}</p>`, [['x', 'OK', 'dark']]];
    if (d.wallet === 'taken') return [top + `<p class="p">${T('Вы уже вывели всё с этого кошелька.', 'Ви вже вивели все з цього гаманця.', 'You already cashed this wallet out.')}</p>`, [['x', 'OK', 'dark']]];
    if (d.wallet === 'locked') return [top + `<p class="p">🔒 ${T('Кошелёк заблокирован после трёх неверных паролей.', 'Гаманець заблоковано після трьох невірних паролів.', 'Locked after three wrong passwords.')}</p>`, [['x', 'OK', 'dark']]];
    if (d.wallet === 'open') return [top + `<div class="fv-wallet"><small>${w.coin}</small><b>≈ ${fmt(w.usd)}</b></div>`, [['cash', '💸 ' + T('Вывести на карту', 'Вивести на картку', 'Cash out to my card')], ['x', T('Позже', 'Пізніше', 'Later'), 'dark']]];
    return [`${top}<div class="fv-wallet"><small>${w.coin}</small><b>🔒 ${T('Баланс скрыт', 'Баланс приховано', 'Balance hidden')}</b></div><p class="small m">${T('Нужен пароль. Подсказка может найтись в других файлах на устройстве (заметки, фото с датами).', 'Потрібен пароль. Підказка може знайтися в інших файлах (нотатки, фото з датами).', 'Password needed. A hint may hide in other files (notes, dated photos).')} ${T('Попыток', 'Спроб', 'Tries')}: ${3 - (d.walletTries || 0)}</p><input class="input mt" id="fvpass" autocapitalize="off" autocorrect="off" placeholder="${T('Пароль', 'Пароль', 'Password')}">`, [['pass', '🔓 ' + T('Открыть', 'Відкрити', 'Unlock')], ['x', T('Закрыть', 'Закрити', 'Close'), 'dark']]];
  }
  if (x.type === 'exe') return [`${top}<p class="p">${T('Запустить программу с чужого носителя?', 'Запустити програму з чужого носія?', 'Run a program from someone else’s drive?')}</p>`, [['run', '▶ ' + T('Запустить', 'Запустити', 'Run'), 'red'], ['x', T('Не надо', 'Не треба', 'Don’t'), 'dark']]];
  const media = x.type === 'video' ? `<div class="fv-video ${x.dashcam || x.flag === 'dash' ? 'dash' : ''}">${x.scene ? `<span>${x.scene[0]}</span>` : '🎞'}<b>▶ ${esc(x.dur || '')}</b></div>` : x.type === 'music' || x.type === 'audio' ? `<div class="fv-audio">▶ <i></i> ${esc(x.dur || '')}</div>` : '';
  const text = x.text ? `<pre class="fv-text">${esc(x.text)}</pre>` : x.type === 'archive' ? `<p class="p">${T('Архив', 'Архів', 'Archive')} · ${size(x.size)}</p>` : x.type === 'game' ? `<p class="p">${T('Установленная игра', 'Встановлена гра', 'Installed game')} · ${size(x.size)}</p>` : x.type === 'save' ? `<p class="p">${T('Прогресс прежнего владельца', 'Прогрес попереднього власника', 'The previous owner’s progress')}</p>` : '';
  const btn = [];
  if (x.flag === 'dash' && f.finds.dash && !d.dash) btn.push(['police', '🚓 ' + T('Отдать в полицию', 'Віддати в поліцію', 'Hand to the police') + ` · +${fmt(f.finds.dash.police)}`], ['dashsell', '📲 ' + T('Продать в паблик', 'Продати в паблік', 'Sell to a channel') + ` · ${fmt(f.finds.dash.sell)}`, 'dark']);
  if (x.flag === 'corp' || (f.finds.corp && /1CD|BACKUP|база|db/i.test(x.name))) if (f.finds.corp && !d.corp) btn.push(['corpback', '🤝 ' + T(`Вернуть компании · +${fmt(f.finds.corp.back)}`, `Повернути компанії · +${fmt(f.finds.corp.back)}`, `Return it to the company · +${fmt(f.finds.corp.back)}`)], ['corpsell', '🕶 ' + T(`Продать конкурентам · ${fmt(f.finds.corp.sell)} (риск)`, `Продати конкурентам · ${fmt(f.finds.corp.sell)} (ризик)`, `Sell to competitors · ${fmt(f.finds.corp.sell)} (risky)`), 'dark']);
  if (x.flag === 'rare' && f.finds.rare && !d.rare) btn.push(['rare', '🏛 ' + T(`Продать коллекционеру · ${fmt(f.finds.rare.sell)}`, `Продати колекціонеру · ${fmt(f.finds.rare.sell)}`, `Sell to a collector · ${fmt(f.finds.rare.sell)}`)]);
  btn.push(['x', T('Закрыть', 'Закрити', 'Close'), 'dark']);
  return [`${top}${media}${text}<p class="small m">${[size(x.size), x.date].filter(Boolean).join(' · ')}</p>`, btn];
}

export const filesActions = {
  files: (id) => import('../ui/shell.js').then(({ go }) => go('files', { id })),
  fopen: async (v) => {
    const [id, fid] = v.split('|');
    const it = getItem(id); if (!it) return;
    const f = deviceFiles(it);
    const x = f.dirs.flatMap((dd) => dd.files).find((y) => y.id === fid); if (!x) return;
    if (x.flag) (it.data ||= {})['seen_' + x.flag] = true;
    if (x.type === 'wallet') { walletCtx.id = id; walletCtx.fid = fid; }
    const [html, btns] = filePreview(it, x);
    const r = await ask(html, btns);
    const d = it.data;
    if (r === 'cash') { const usd = cashWallet(it); if (usd) { sfx('win'); toast(T(`Выведено ${fmt(usd)}`, `Виведено ${fmt(usd)}`, `Cashed out ${fmt(usd)}`), 'g'); } }
    if (r === 'contacts') {
      const o = f.finds.owner;
      if (!o || d.owner) return toast(T('Вы уже писали им', 'Ви вже писали їм', 'You already wrote to them'));
      const who = await ask(`<h2>👥 ${T('Контакты', 'Контакти', 'Contacts')}</h2><p class="small m">${T('Кто на фото? Подсказка — в названиях семейных снимков. Шанс один: незнакомцы просто не ответят.', 'Хто на фото? Підказка — у назвах сімейних знімків. Шанс один: незнайомці просто не відповідять.', 'Who’s in the photos? The family shots’ names give it away. One shot — strangers won’t answer.')}</p>`, [...o.cand.map(([n], i) => [String(i), '✉️ ' + esc(n)]), ['x', T('Отмена', 'Скасувати', 'Cancel'), 'dark']]);
      if (who == null || who === 'x') return;
      const ok = o.cand[+who][1];
      returnToOwner(it, ok);
      if (ok) { sfx('win'); toast(T(`${o.who}: «Боже, это наши фото! Спасибо!» +${fmt(o.reward)}`, `${o.who}: «Боже, це наші фото! Дякуємо!» +${fmt(o.reward)}`, `${o.who}: “Oh my, our photos! Thank you!” +${fmt(o.reward)}`), 'g'); } else toast(T('Вам не ответили. Видимо, это был не тот человек.', 'Вам не відповіли. Мабуть, це була не та людина.', 'No reply. Probably the wrong person.'), 'r');
    }
    if (r === 'run') {
      const res = runExe(it, x);
      if (res.clean) toast(T('Программа запустилась и ничего не сделала', 'Програма запустилася й нічого не зробила', 'It ran and did nothing'));
      else if (res.stealer) { sfx('err'); toast(T(`Вирус! Троян украл данные карты: −${fmt(res.amt)}`, `Вірус! Троян викрав дані картки: −${fmt(res.amt)}`, `Virus! A trojan stole your card: −${fmt(res.amt)}`), 'r'); }
      else { sfx('err'); toast(T('Вирус‑вымогатель зашифровал файлы!', 'Вірус‑вимагач зашифрував файли!', 'Ransomware encrypted the files!'), 'r'); }
    }
    if (r === 'police' || r === 'dashsell') { const got = dashAction(it, r === 'police' ? 'police' : 'sell'); if (got) { sfx('cash'); toast(`+${fmt(got)}`, 'g'); } }
    if (r === 'corpback' || r === 'corpsell') { const res = corpAction(it, r === 'corpback' ? 'return' : 'sell'); if (res?.caught) { sfx('err'); toast(T(`Это была проверка полиции. Штраф ${fmt(res.fine)}`, `Це була перевірка поліції. Штраф ${fmt(res.fine)}`, `It was a police sting. Fine ${fmt(res.fine)}`), 'r'); } else if (res?.got) { sfx('cash'); toast(`+${fmt(res.got)}`, 'g'); } }
    if (r === 'rare') { const got = rareSell(it); if (got) { sfx('cash'); toast(`+${fmt(got)}`, 'g'); } }
    rerender();
  },
  fwipe: async (id) => {
    const it = getItem(id); if (!it) return;
    if (!(await confirmBox(resetWord(storageKind(it)) + '?', T('Все файлы и находки на устройстве пропадут. Зато продавать будет безопасно.', 'Усі файли й знахідки на пристрої зникнуть. Зате продавати буде безпечно.', 'Every file and find on it is gone for good — but it’s safe to sell.'), T('Стереть', 'Стерти', 'Wipe'), undefined, true))) return;
    wipe(it); sfx('ok'); toast(T('Готово: устройство чистое', 'Готово: пристрій чистий', 'Done: the device is clean'), 'g'); rerender();
  },
  frecover: async (id) => { const it = getItem(id); const r = recover(it); if (r.ok) { sfx('win'); toast(T('Сервис спас данные!', 'Сервіс врятував дані!', 'The lab saved the data!'), 'g'); } else toast(r.msg, 'r'); rerender(); },
  fpin: async (id) => {
    const it = getItem(id);
    const r = await playMini('codelock', { title: T('PIN защищённой флешки', 'PIN захищеної флешки', 'Secure drive PIN'), head: T('Аппаратный PIN', 'Апаратний PIN', 'Hardware PIN'), digits: 4, tries: 7, pass: 1 });
    if (r.quit) return;
    const fails = pinResult(it, r.score >= 1);
    if (r.score >= 1) { sfx('win'); toast(T('PIN подобран!', 'PIN підібрано!', 'PIN cracked!'), 'g'); }
    else toast(fails >= 3 ? T('Защита сработала: данные самоуничтожились', 'Захист спрацював: дані самознищилися', 'Self‑destruct: the data is wiped') : T(`Неверно. Осталось серий: ${3 - fails}`, `Невірно. Залишилося серій: ${3 - fails}`, `Wrong. Rounds left: ${3 - fails}`), 'r');
    rerender();
  },
  fpass: async (id) => {
    const it = getItem(id);
    const r = await playMini('codelock', { title: T('Пароль Windows', 'Пароль Windows', 'Windows password'), head: T('Пароль учётной записи', 'Пароль облікового запису', 'Account password'), digits: 4, tries: 6, pass: 1 });
    if (r.quit) return;
    passResult(it, r.score >= 1);
    if (r.score >= 1) { sfx('win'); toast(T('Вы вошли в систему', 'Ви увійшли в систему', 'You’re in'), 'g'); } else toast(T('Не подошло. Следующая попытка через игровой час.', 'Не підійшло. Наступна спроба через ігрову годину.', 'No luck. Next try in a game hour.'), 'r');
    rerender();
  },
  fransom: async (id) => { const it = getItem(id); const r = payRansom(it); if (!r) return; if (r.msg) return toast(r.msg, 'r'); toast(r.ok ? T('Вымогатели прислали ключ — файлы снова открываются', 'Вимагачі надіслали ключ — файли знову відкриваються', 'They sent the key — files open again') : T('Деньги ушли, ключа нет. Файлы потеряны.', 'Гроші пішли, ключа немає. Файли втрачено.', 'Paid, no key. The files are gone.'), r.ok ? 'g' : 'r'); rerender(); },
  fdecrypt: async (id) => {
    const it = getItem(id);
    const r = await playMini('codelock', { title: T('Ключ расшифровки', 'Ключ розшифрування', 'Decryption key'), head: T('Подбор ключа', 'Підбір ключа', 'Brute‑forcing the key'), digits: 4, tries: 8, pass: 1 });
    if (r.quit) return;
    decrypted(it, r.score >= 1);
    toast(r.score >= 1 ? T('Расшифровано!', 'Розшифровано!', 'Decrypted!') : T('Не вышло — вирус удалил файлы', 'Не вийшло — вірус видалив файли', 'Failed — the virus deleted the files'), r.score >= 1 ? 'g' : 'r');
    rerender();
  },
  lab: (id) => openApp('lab', 'main', { id }),
};
// the wallet password sheet needs the input value before the sheet closes
document.addEventListener('click', (e) => {
  const b = e.target.closest?.('[data-r="pass"]');
  if (!b) return;
  const inp = document.getElementById('fvpass');
  if (!inp) return;
  e.stopImmediatePropagation(); e.preventDefault();
  const v = inp.value;
  const it = getItem(walletCtx.id);
  if (!it) return;
  const r = tryWallet(it, v);
  if (r.ok) { sfx('win'); resolveSheet('x'); toast(T(`Пароль подошёл! ${r.f.coin} ≈ ${fmt(r.f.usd)}`, `Пароль підійшов! ${r.f.coin} ≈ ${fmt(r.f.usd)}`, `Password accepted! ${r.f.coin} ≈ ${fmt(r.f.usd)}`), 'g'); setTimeout(() => filesActions.fopen(`${walletCtx.id}|${walletCtx.fid}`), 350); }
  else if (r.locked) { sfx('err'); resolveSheet('x'); toast(T('Три ошибки — кошелёк заблокирован', 'Три помилки — гаманець заблоковано', 'Three strikes — the wallet locked'), 'r'); }
  else { sfx('err'); inp.value = ''; inp.placeholder = T(`Неверно. Осталось попыток: ${r.left}`, `Невірно. Залишилося спроб: ${r.left}`, `Wrong. Tries left: ${r.left}`); inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); }
  rerender();
}, true);
