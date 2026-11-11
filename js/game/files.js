// What the previous owner left on a device: flash drives, memory cards, hard drives, discs, tapes,
// phones, laptops, cameras, consoles. The file tree is rebuilt from the item's seed every time (so it never
// bloats the save); only what the player did with it lives in it.data.
// Finds: a crypto wallet behind a password riddle, family photos to return, a dashcam accident clip,
// a company backup, rare recordings. Risks: viruses (ransomware / card stealer), dead or clicking drives,
// passwords and PIN locks. Selling a device without wiping it can earn you an angry review or a fine.
import { G, emit } from '../core/state.js';
import { T } from '../core/i18n.js';
import { RNG } from '../core/rng.js';
import { MODEL, DEFECTS } from '../data/catalog.js';
import { PHOTO_FILES } from '../data/photos.js';
import { earn, charge, addXP, addReview, notify, log, stat, canAfford } from './player.js';
import { fmt } from '../core/money.js';

const T_KIND = { usb: 'usb', secure: 'secure', sd: 'card', microsd: 'card', cf: 'card', memstick: 'card', dashcam: 'dashcam', hdd: 'hdd', office: 'office', hdd25: 'hdd', ssd: 'hdd', nvme: 'hdd', exthdd: 'hdd', extssd: 'hdd', nas: 'nas', tape: 'tape', zip: 'floppy', cd: 'cd', dvd: 'dvd', gamecd: 'gamecd', floppy: 'floppy', cassette: 'cassette', minidisc: 'cassette', vhs: 'vhs', minidv: 'vhs', ipod: 'ipod', dictaphone: 'dictaphone' };
const CONSOLE_T = ['ps3', 'ps4', 'ps5', 'x360', 'xone', 'xss', 'xsx', 'switch', 'switchlite', 'deck', 'psp', 'ds', 'wii'];
export function storageKind(it) {
  const m = MODEL[it?.m];
  if (!m) return null;
  if (m.cat === 'storage') return T_KIND[m.art?.t] || 'usb';
  if (m.cat === 'misc' && /Флешка/.test(m.name)) return 'usb';
  if (m.cat === 'phones') return 'phone';
  if (m.cat === 'electronics') {
    const t = m.art?.t;
    if (t === 'monitor') return /iMak/.test(m.name) ? 'laptop' : null;
    return { laptop: 'laptop', tablet: 'tablet', camera: 'camera', drone: 'drone', box: 'laptop' }[t] || null;
  }
  if (m.cat === 'consoles') return CONSOLE_T.includes(m.art?.t) ? 'console' : null;
  return null;
}
export const hasStorage = (it) => !!storageKind(it);
const st = (it) => (it.data ||= {});
// how the device presents itself
export const KIND_NAME = {
  usb: ['Флешка', 'Флешка', 'Flash drive'], secure: ['Защищённая флешка', 'Захищена флешка', 'Encrypted flash drive'], card: ['Карта памяти', 'Карта памʼяті', 'Memory card'], dashcam: ['Карта видеорегистратора', 'Карта відеореєстратора', 'Dashcam card'],
  hdd: ['Диск', 'Диск', 'Drive'], office: ['Офисный диск', 'Офісний диск', 'Office drive'], nas: ['Сетевое хранилище', 'Мережеве сховище', 'NAS'], tape: ['Ленточный бэкап', 'Стрічковий бекап', 'Backup tape'],
  floppy: ['Дискета', 'Дискета', 'Floppy'], cd: ['Компакт‑диск', 'Компакт‑диск', 'CD'], dvd: ['DVD', 'DVD', 'DVD'], gamecd: ['Диск с игрой', 'Диск із грою', 'Game disc'], cassette: ['Кассета', 'Касета', 'Tape'],
  vhs: ['Видеокассета', 'Відеокасета', 'Video tape'], ipod: ['Плеер', 'Плеєр', 'Music player'], dictaphone: ['Диктофон', 'Диктофон', 'Voice recorder'], phone: ['Телефон', 'Телефон', 'Phone'], tablet: ['Планшет', 'Планшет', 'Tablet'],
  laptop: ['Компьютер', 'Компʼютер', 'Computer'], camera: ['Фотоаппарат', 'Фотоапарат', 'Camera'], drone: ['Дрон', 'Дрон', 'Drone'], console: ['Приставка', 'Приставка', 'Console'],
};
const RESET_WORD = (k) => (['phone', 'tablet', 'laptop', 'console', 'camera', 'drone'].includes(k) ? T('Сбросить до заводских', 'Скинути до заводських', 'Factory reset') : ['cd', 'dvd', 'gamecd', 'cassette', 'vhs'].includes(k) ? T('Перезаписать', 'Перезаписати', 'Overwrite') : T('Отформатировать', 'Відформатувати', 'Format'));
export const resetWord = RESET_WORD;
export const passReady = (it) => { const t = it.data?.pwAt; return t == null || G.s.t - t >= 60; };

function capacityGB(it, m, kind) {
  const src = `${m.name} ${(m.vars?.[it.v || 0]?.[0]) || ''}`;
  const mm = src.match(/(\d+(?:[.,]\d+)?)\s*(ТБ|TB|ГБ|GB|МБ|MB)/i);
  if (m.fakeCap) return m.fakeCap;
  if (mm) { const n = parseFloat(mm[1].replace(',', '.')); const u = mm[2].toUpperCase(); return u === 'ТБ' || u === 'TB' ? n * 1000 : u === 'ГБ' || u === 'GB' ? n : n / 1000; }
  return { phone: 64, tablet: 128, laptop: 512, camera: 64, drone: 64, console: 500, cd: 0.7, dvd: 4.7, gamecd: 0.7, floppy: 0.00144, cassette: 0.1, vhs: 4, nas: 4000, tape: 1500, dictaphone: 4, ipod: 160 }[kind] || 16;
}

// ---------------------------------------------------------------- generator
const PETS = [['Барсик', 'barsik'], ['Мурзик', 'murzik'], ['Рыжик', 'ryzhik'], ['Бакс', 'baks'], ['Тузик', 'tuzik'], ['Симба', 'simba'], ['Луна', 'luna'], ['Рекс', 'reks'], ['Персик', 'persik'], ['Джесси', 'jessi']];
const KIDS = [['Маша', 'masha'], ['Даша', 'dasha'], ['Артём', 'artem'], ['Лиза', 'liza'], ['Миша', 'misha'], ['Соня', 'sonya'], ['Ваня', 'vanya'], ['Полина', 'polina']];
const OWNERS = [['Ольга', 'Дима'], ['Ирина', 'Сергей'], ['Наташа', 'Андрей'], ['Катя', 'Макс'], ['Юля', 'Саша'], ['Света', 'Игорь']];
const COMPANIES = ['ООО «СтройИнвестГрупп»', 'ТОВ «Агро‑Трейд»', 'ООО «ЛогистикПро»', 'ЧП «Мебель‑Люкс»', 'ООО «МедТехСнаб»', 'ТОВ «Юг‑Зерно»'];
const ARTISTS = ['Ночные Снайперки', 'Бумбокс‑М', 'Сплин‑2', 'Кино (каверы)', 'Руки Ввверх', 'Скрябин‑бэнд', 'Земфира FM', 'Океан Ельзи (live)', 'Linkin Pork', 'Eminen', 'Rammstain', 'Nirvanna'];
const SONGS = ['Утро', 'Город', 'Последний', 'Звёзды', 'Лето', 'Без тебя', 'Дождь', 'Танцы', 'Домой', 'Ночь', 'Numb (cover)', 'Du Hast (live)'];
const CAMS = { card: ['Canon EOS 600D', 'Nikon D3200', 'Sony a6000', 'Fujifilm X‑T20'], camera: null, drone: ['DJI Mini 2'], phone: ['iPhone 11', 'Galaxy S10', 'Redmi Note 8'], tablet: ['iPad'], laptop: ['iPhone 8'] };
const pad = (n, k = 4) => String(n).padStart(k, '0');

function pickPhoto(r) { const c = PHOTO_FILES.clean || []; return c.length ? `assets/photos/clean/${r.pick(c)}.webp` : ''; }
const WALLS = ['city', 'mountains', 'tokyo', 'waves', 'fog', 'dunes', 'aurora2', 'liquid'];
const SCENES = [['🎂', 'День рождения', 'День народження', 'Birthday'], ['🏖', 'Море', 'Море', 'At the sea'], ['🎄', 'Новый год', 'Новий рік', 'New Year'], ['💍', 'Свадьба', 'Весілля', 'Wedding'], ['🐈', 'Кот', 'Кіт', 'The cat'], ['🎓', 'Выпускной', 'Випускний', 'Graduation'], ['🍢', 'Шашлыки', 'Шашлики', 'Barbecue'], ['👶', 'Малыш', 'Малюк', 'The baby']];

export function deviceFiles(it) {
  const kind = storageKind(it);
  if (!kind) return null;
  const m = MODEL[it.m], d = st(it);
  const r = new RNG(`files|${it.seed || 1}|${it.m}`);
  const cap = capacityGB(it, m, kind);
  const year = Math.min(2025, it.year || m.year || 2015);
  const base = { kind, cap, year, dirs: [], used: 0, finds: {}, personal: false };
  if (d.wiped || it.sealed) return { ...base, empty: true, why: d.wiped ? 'wiped' : 'new' };
  const emptyP = { secure: 0, office: 0.04, tape: 0.04, nas: 0.08, phone: 0.32, laptop: 0.28, tablet: 0.38, console: 0.2, camera: 0.22, drone: 0.3, gamecd: 0, ipod: 0.1, cd: 0, dvd: 0, vhs: 0, cassette: 0, dictaphone: 0.15, dashcam: 0.05 }[kind] ?? 0.22;
  if (r.chance(emptyP)) return { ...base, empty: true, why: 'formatted' };
  let fid = 0;
  const F = (name, type, size, o = {}) => ({ id: 'f' + fid++, name, type, size, date: o.date || `${pad(r.int(1, 28), 2)}.${pad(r.int(1, 12), 2)}.${o.year || r.int(Math.max(1990, year - 2), year)}`, ...o });
  const dir = (name, files) => (files.length ? base.dirs.push({ name, files }) : 0);
  // what this device hides (rolled once, deterministic)
  const oldBtc = (kind === 'hdd' || kind === 'laptop' || kind === 'usb') && year >= 2009 && year <= 2016;
  const pWallet = { usb: 0.03, secure: 0.3, hdd: oldBtc ? 0.045 : 0.018, laptop: oldBtc ? 0.04 : 0.025, nas: 0.02, phone: 0.012, tablet: 0.008, card: 0.004, office: 0.01 }[kind] || 0;
  const pOwner = { phone: 0.4, camera: 0.38, card: 0.28, laptop: 0.25, tablet: 0.3, drone: 0.15, usb: 0.1, hdd: 0.1, nas: 0.35, dvd: 0.45, vhs: 0.4, cassette: 0.08, dictaphone: 0.12 }[kind] || 0;
  const pCorp = { office: 0.5, tape: 0.75, nas: 0.08, hdd: 0.05, laptop: 0.07, usb: 0.05, dictaphone: 0.2 }[kind] || 0;
  const pDash = { dashcam: 0.45, drone: 0.05, camera: 0.02 }[kind] || 0;
  const pRare = { cassette: 0.05, vhs: 0.04, floppy: 0.04, gamecd: 0.12, minidv: 0.03, ipod: 0.05 }[kind] || 0;
  const pVirus = { usb: 0.13, cd: 0.1, floppy: 0.07, office: 0.1, hdd: 0.05, laptop: 0.06, card: 0.02, gamecd: 0.04, phone: 0.02 }[kind] || 0;
  const pet = r.pick(r.chance(0.6) ? PETS : KIDS), petYear = r.int(Math.max(2005, year - 9), Math.max(2006, year - 1));
  const couple = r.pick(OWNERS);
  const firm = r.pick(COMPANIES);
  const wallet = r.chance(pWallet), owner = r.chance(pOwner), corp = !wallet && r.chance(pCorp), dash = r.chance(pDash), rare = r.chance(pRare), virus = r.chance(pVirus);
  const photos = (n, prefix, cam, o = {}) => Array.from({ length: n }, (_, i) => {
    const kindOf = r.next() < (o.things ?? 0.45) ? 'thing' : r.chance(0.5) ? 'wall' : 'scene';
    const sc = r.pick(SCENES);
    return F(`${prefix}${pad(r.int(1000, 9999))}.JPG`, 'photo', +(r.float(2, 9)).toFixed(1), { cam, img: kindOf === 'thing' ? pickPhoto(r) : kindOf === 'wall' ? `assets/walls/${r.pick(WALLS)}.jpg` : '', scene: kindOf === 'scene' ? sc : null, personal: kindOf === 'scene' });
  });
  const tracks = (n, artist) => Array.from({ length: n }, (_, i) => F(`${pad(i + 1, 2)} - ${artist || r.pick(ARTISTS)} - ${r.pick(SONGS)}.mp3`, 'music', +(r.float(3, 9)).toFixed(1), { dur: `${r.int(2, 5)}:${pad(r.int(0, 59), 2)}` }));
  const docs = () => r.sample([
    F(T('Курсовая_финал_ФИНАЛ2.docx', 'Курсова_фінал_ФІНАЛ2.docx', 'Essay_final_FINAL2.docx'), 'doc', 0.4, { text: T('Тема: «Экономика малого бизнеса». Введение… (дальше 40 страниц копипасты)', 'Тема: «Економіка малого бізнесу». Вступ… (далі 40 сторінок копіпасти)', 'Topic: “Small business economics”. Introduction… (40 pages of copy‑paste follow)') }),
    F(T('Резюме.pdf', 'Резюме.pdf', 'CV.pdf'), 'doc', 0.2, { text: T(`${couple[1]}, 34 года. Опыт: менеджер по продажам 6 лет. Навыки: Excel, переговоры, водительские права B.`, `${couple[1]}, 34 роки. Досвід: менеджер з продажу 6 років. Навички: Excel, переговори, права B.`, `${couple[1]}, 34. Sales manager for 6 years. Skills: Excel, negotiation, driving licence.`), personal: true }),
    F(T('Список покупок.txt', 'Список покупок.txt', 'Shopping list.txt'), 'text', 0.001, { text: T('молоко, хлеб, корм коту, батарейки АА, подарок маме!!!', 'молоко, хліб, корм коту, батарейки АА, подарунок мамі!!!', 'milk, bread, cat food, AA batteries, gift for mum!!!') }),
    F(T('Договор аренды.pdf', 'Договір оренди.pdf', 'Lease.pdf'), 'doc', 0.6, { text: T('Договор найма жилого помещения… Арендатор обязуется… (паспортные данные внутри)', 'Договір найму житла… Орендар зобовʼязується… (паспортні дані всередині)', 'Residential lease… The tenant agrees… (passport details inside)'), personal: true }),
    F(T('Сканы паспорта.pdf', 'Скани паспорта.pdf', 'Passport scans.pdf'), 'doc', 1.8, { text: T('Скан паспорта, ИНН и СНИЛС. Такое лучше не оставлять на флешке…', 'Скан паспорта, ІПН. Таке краще не залишати на флешці…', 'Passport and tax ID scans. Not something to leave on a drive…'), personal: true }),
    F(T('Рецепты бабушки.doc', 'Рецепти бабусі.doc', 'Grandma recipes.doc'), 'doc', 0.1, { text: T('Борщ: свёкла, капуста, мясо на косточке… «главное — не жалей чеснока».', 'Борщ: буряк, капуста, мʼясо на кісточці… «головне — не шкодуй часнику».', 'Borscht: beetroot, cabbage, meat on the bone… “don’t spare the garlic”.') }),
    F(T('Стихи.txt', 'Вірші.txt', 'Poems.txt'), 'text', 0.01, { text: T('«Ты ушла, а флешка осталась…» — дальше лучше не читать.', '«Ти пішла, а флешка лишилась…» — далі краще не читати.', '“You left, the flash drive stayed…” — better not read on.') }),
    F(T('Налоговая 2019.xlsx', 'Податкова 2019.xlsx', 'Taxes 2019.xlsx'), 'doc', 0.3, { text: T('Доходы, расходы, вычеты. Кто-то очень старался.', 'Доходи, витрати, відрахування. Хтось дуже старався.', 'Income, expenses, deductions. Someone tried hard.'), personal: true }),
  ], r.int(1, 4));
  // the wallet riddle: password = pet/kid name + the year it shows up
  const walletFiles = () => {
    const coin = oldBtc && r.chance(0.7) ? 'BTC' : r.pick(['ETH', 'USDT', 'BTC']);
    const tier = r.next();
    const usd = Math.round(tier < 0.6 ? r.float(20, 160) : tier < 0.93 ? r.float(200, 1200) : r.float(2000, oldBtc ? 9000 : 4000));
    base.finds.wallet = { coin, usd, pass: [pet[0].toLowerCase() + petYear, pet[1] + petYear], hint: pet };
    const isPet = PETS.includes(pet);
    return [
      F(coin === 'BTC' ? 'wallet.dat' : T('кошелёк_keystore.json', 'гаманець_keystore.json', 'wallet_keystore.json'), 'wallet', 0.1, { flag: 'wallet' }),
      F(T('напоминалка.txt', 'нагадування.txt', 'reminder.txt'), 'text', 0.001, { text: isPet ? T('пароль от кошелька — как зовут кота + год, когда мы его взяли', 'пароль від гаманця — як звати кота + рік, коли ми його взяли', 'wallet password — the cat’s name + the year we got him') : T('пароль от кошелька — имя ребёнка + год рождения (латиницей или как удобно)', 'пароль від гаманця — імʼя дитини + рік народження', 'wallet password — the kid’s name + birth year'), flag: 'hint' }),
      F(`${pet[0]}_${isPet ? T('первый день', 'перший день', 'first day') : T('роддом', 'пологовий', 'hospital')}.jpg`, 'photo', 3.1, { date: `${pad(r.int(1, 28), 2)}.${pad(r.int(1, 12), 2)}.${petYear}`, year: petYear, scene: isPet ? SCENES[4] : SCENES[7], personal: true, cam: 'iPhone' }),
    ];
  };
  // ---------------------------------------------------------------- layouts per kind
  const cam = (CAMS[kind] || null) ? r.pick(CAMS[kind]) : kind === 'camera' ? `${m.brand} ${m.name}` : 'Camera';
  if (kind === 'usb' || kind === 'secure' || kind === 'floppy' && year > 1999) {
    if (r.chance(0.6)) dir(T('Документы', 'Документи', 'Documents'), docs());
    if (r.chance(0.5)) dir(T('Фото', 'Фото', 'Photos'), photos(r.int(2, 8), 'IMG_', r.pick(['iPhone 7', 'Galaxy S8', 'Canon'])));
    if (r.chance(0.35)) dir(T('Музыка', 'Музика', 'Music'), tracks(r.int(3, 9)));
    if (r.chance(0.3)) dir(T('Новая папка (2)', 'Нова папка (2)', 'New folder (2)'), [F('IMG_' + pad(r.int(1000, 9999)) + '.JPG', 'photo', 2.2, { img: pickPhoto(r) }), F('desktop.ini', 'text', 0.001, { text: '[.ShellClassInfo]' })]);
  } else if (kind === 'card' || kind === 'camera' || kind === 'drone') {
    const n = kind === 'drone' ? r.int(3, 7) : r.int(6, 18);
    dir(`DCIM/100${(cam || 'CAM').split(' ')[0].toUpperCase().slice(0, 5)}`, photos(n, kind === 'drone' ? 'DJI_' : r.pick(['IMG_', 'DSC_', '_MG_']), cam, { things: 0.25 }).concat(kind === 'drone' || r.chance(0.4) ? [F(`MVI_${pad(r.int(1000, 9999))}.MP4`, 'video', +(r.float(80, 900)).toFixed(0), { dur: `${r.int(0, 4)}:${pad(r.int(5, 59), 2)}` })] : []));
  } else if (kind === 'dashcam') {
    dir('Normal', Array.from({ length: r.int(6, 14) }, () => F(`${year}${pad(r.int(101, 1231))}_${pad(r.int(0, 2359))}.MP4`, 'video', +(r.float(90, 180)).toFixed(0), { dur: '3:00', dashcam: true })));
  } else if (kind === 'hdd' || kind === 'nas') {
    dir(T(`Фото ${year - 6}–${year}`, `Фото ${year - 6}–${year}`, `Photos ${year - 6}–${year}`), photos(r.int(6, 14), 'IMG_', r.pick(['Canon EOS 450D', 'Nikon D90', 'iPhone 4S'])));
    if (r.chance(0.6)) dir(T('Фильмы', 'Фільми', 'Movies'), Array.from({ length: r.int(2, 6) }, () => F(`${r.pick(['Бригада', 'Матрица', 'Брат 2', 'Шрек', 'Аватар', 'Интерстеллар', 'Ирония судьбы'])} (${r.int(1998, 2014)}) BDRip.avi`, 'video', r.int(700, 4400), { dur: `${r.int(1, 2)}:${pad(r.int(0, 59), 2)}:00` })));
    if (r.chance(0.5)) dir(T('Документы', 'Документи', 'Documents'), docs());
    if (r.chance(0.4)) dir(T('Музыка', 'Музика', 'Music'), tracks(r.int(5, 12)));
    if (r.chance(0.35)) dir(T('Игры', 'Ігри', 'Games'), [F(`${r.pick(['Сталкер', 'GTA San Andreas', 'Counter‑Strike 1.6', 'Героes III', 'NFS Most Wanted'])}/`, 'game', r.int(600, 9000))]);
  } else if (kind === 'office' || kind === 'tape') {
    dir(kind === 'tape' ? `BACKUP_${year}_Q${r.int(1, 4)}` : T('Бухгалтерия', 'Бухгалтерія', 'Accounting'), [F(T('1С_база_предприятия.1CD', '1С_база_підприємства.1CD', 'company_db.1CD'), 'doc', r.int(300, 2400), { text: T(`База учёта ${firm}: клиенты, счета, зарплаты.`, `База обліку ${firm}: клієнти, рахунки, зарплати.`, `${firm} accounting database: clients, invoices, salaries.`) }), F(T('Договоры_2019.zip', 'Договори_2019.zip', 'Contracts_2019.zip'), 'archive', r.int(40, 400)), F(T('Зарплаты.xlsx', 'Зарплати.xlsx', 'Salaries.xlsx'), 'doc', 0.4, { text: T('Список сотрудников с окладами и «конвертами».', 'Список працівників з окладами й «конвертами».', 'Staff list with salaries and cash bonuses.'), personal: true })]);
    if (kind === 'office') dir(T('Рабочий стол', 'Робочий стіл', 'Desktop'), [F(T('пароли от всего.txt', 'паролі від усього.txt', 'all passwords.txt'), 'text', 0.001, { text: 'admin / admin123\nbuh / Buh2019!\nwifi: Office_5G / 12345678' }), ...docs().slice(0, 2)]);
  } else if (kind === 'cd') {
    if (r.chance(0.55)) dir(T('Сборник', 'Збірка', 'Mix'), tracks(r.int(10, 16)));
    else if (r.chance(0.6)) dir(T('Фото с выпускного', 'Фото з випускного', 'Prom photos'), photos(r.int(8, 16), 'DSC', 'Kodak', { things: 0.1 }));
    else dir('', [F('Windows_XP_SP3_Zver_Edition.iso', 'archive', 690), F('autorun.inf', 'text', 0.001, { text: '[autorun]\nopen=setup.exe' })]);
  } else if (kind === 'dvd' || kind === 'vhs') {
    const ev = r.pick([[T('Свадьба', 'Весілля', 'Wedding'), SCENES[3]], [T('Выпускной', 'Випускний', 'Graduation'), SCENES[5]], [T('День рождения', 'День народження', 'Birthday'), SCENES[0]], [T('Новый год у бабушки', 'Новий рік у бабусі', 'New Year at grandma’s'), SCENES[2]]]);
    dir(kind === 'dvd' ? 'VIDEO_TS' : T('Сторона А', 'Сторона А', 'Side A'), [F(`${ev[0]} ${couple[0]} ${year}.${kind === 'dvd' ? 'VOB' : 'vhs'}`, 'video', kind === 'dvd' ? r.int(900, 4200) : 0, { dur: `${r.int(0, 2)}:${pad(r.int(10, 59), 2)}:00`, scene: ev[1], personal: true })]);
  } else if (kind === 'gamecd') {
    dir('', [F('setup.exe', 'exe', 1.2), F('autorun.inf', 'text', 0.001, { text: '[autorun]\nopen=setup.exe' }), F(T('Наклейка с CD‑ключом', 'Наліпка з CD‑ключем', 'CD key sticker'), 'text', 0, { text: `${pad(r.int(1000, 9999))}-${pad(r.int(1000, 9999))}-${pad(r.int(1000, 9999))}-${pad(r.int(1000, 9999))}` })]);
  } else if (kind === 'cassette') {
    dir(T('Сторона А', 'Сторона А', 'Side A'), tracks(r.int(5, 8), r.pick(ARTISTS)).map((x) => ({ ...x, name: x.name.replace('.mp3', ''), size: 0 })));
    dir(T('Сторона Б', 'Сторона Б', 'Side B'), tracks(r.int(4, 8)).map((x) => ({ ...x, name: x.name.replace('.mp3', ''), size: 0 })));
  } else if (kind === 'ipod') {
    dir(T('Музыка', 'Музика', 'Music'), tracks(r.int(14, 24)));
    dir(T('Плейлисты', 'Плейлисти', 'Playlists'), [F(T('В дорогу', 'У дорогу', 'Road trip'), 'text', 0, { text: T('32 трека · 2 ч 4 мин', '32 треки · 2 год 4 хв', '32 tracks · 2 h 4 min') }), F(T('Спортзал', 'Спортзал', 'Gym'), 'text', 0, { text: T('18 треков', '18 треків', '18 tracks') })]);
  } else if (kind === 'dictaphone') {
    dir('VOICE', Array.from({ length: r.int(3, 9) }, (_, i) => F(`VN${pad(i + 1, 3)}.WAV`, 'audio', +(r.float(1, 40)).toFixed(1), { dur: `${r.int(0, 25)}:${pad(r.int(0, 59), 2)}`, text: r.pick([T('…лекция по матанализу, слышно, как кто-то хрустит чипсами.', '…лекція з матаналізу, чути, як хтось хрумтить чипсами.', '…a calculus lecture, someone is crunching chips.'), T('…«купить хлеб, забрать посылку, позвонить маме».', '…«купити хліб, забрати посилку, подзвонити мамі».', '…“buy bread, pick up the parcel, call mum”.'), T('…репетиция группы в гараже.', '…репетиція гурту в гаражі.', '…a band rehearsing in a garage.')]) })));
  } else if (kind === 'phone' || kind === 'tablet') {
    dir(T('Фото', 'Фото', 'Photos'), photos(r.int(8, 20), 'IMG_', cam, { things: 0.35 }));
    dir('WhatsApp', [F(T('Голосовое 0:47.opus', 'Голосове 0:47.opus', 'Voice note 0:47.opus'), 'audio', 0.1, { dur: '0:47', text: T('«Ты где? Мы уже у подъезда!»', '«Ти де? Ми вже біля підʼїзду!»', '“Where are you? We’re outside!”'), personal: true }), F('IMG-WA0012.jpg', 'photo', 0.4, { img: pickPhoto(r) })]);
    dir(T('Заметки', 'Нотатки', 'Notes'), [F(T('Заметка.txt', 'Нотатка.txt', 'Note.txt'), 'text', 0.001, { text: r.pick([T('Код домофона 45К1234. Пароль от Wi‑Fi у тёщи: 87654321', 'Код домофона 45К1234. Пароль від Wi‑Fi у тещі: 87654321', 'Intercom 45K1234. Mother‑in‑law Wi‑Fi: 87654321'), T('Сдать отчёт до пятницы!!', 'Здати звіт до пʼятниці!!', 'Report due Friday!!')]), personal: true })]);
  } else if (kind === 'laptop') {
    dir(T('Рабочий стол', 'Робочий стіл', 'Desktop'), [...docs(), F(T('Новый текстовый документ.txt', 'Новий текстовий документ.txt', 'New Text Document.txt'), 'text', 0.001, { text: r.pick(['asdfgh', T('позвонить в банк', 'подзвонити в банк', 'call the bank')]) })]);
    dir(T('Загрузки', 'Завантаження', 'Downloads'), [F(r.pick(['KMSAuto_Net.exe', 'Photoshop_crack.exe', 'driver_setup.exe']), 'exe', 4.2), F('IMG_' + pad(r.int(1000, 9999)) + '.jpg', 'photo', 2.1, { img: pickPhoto(r) })]);
    dir(T('Изображения', 'Зображення', 'Pictures'), photos(r.int(4, 10), 'IMG_', 'iPhone'));
  } else if (kind === 'console') {
    const games = r.sample(['Grand Theft Avto V', 'Red Ded Redemption 2', 'FEFA 23', 'The Last of Uss', 'God of Wor', 'Spider‑Mann', 'Zelda: Breath of the Wilt', 'Mario Kart 8', 'Call of Duti', 'Fortnait'], r.int(2, 6));
    dir(T('Игры', 'Ігри', 'Games'), games.map((g) => F(g, 'game', r.int(8000, 90000))));
    dir(T('Сохранения', 'Збереження', 'Saves'), games.slice(0, 3).map((g) => F(`${g} — ${r.int(12, 100)}%`, 'save', 2)));
    dir(T('Аккаунт', 'Акаунт', 'Account'), [F(`${couple[1].toLowerCase()}_${r.int(80, 99)}`, 'text', 0, { text: T('Профиль прежнего владельца всё ещё привязан. Лучше сбросить приставку.', 'Профіль попереднього власника досі привязаний. Краще скинути приставку.', 'The previous owner’s profile is still linked. Better reset the console.'), personal: true })]);
  } else {
    dir('', docs());
  }
  // finds
  if (wallet) dir(kind === 'phone' ? 'Trust Wallett' : T('Важное', 'Важливе', 'Important'), walletFiles());
  if (owner) {
    const sc = r.pick(SCENES);
    const other = r.pick(OWNERS.filter((x) => x !== couple));
    const cand = r.shuffle([[couple[0], true], [other[0], false], [other[1], false], [T('Мама', 'Мама', 'Mum'), false]]);
    base.finds.owner = { name: `${couple[0]} ${T('и', 'і', '&')} ${couple[1]}`, who: couple[0], cand, reward: Math.round(r.float(10, 60)) };
    dir(T('Семейное', 'Сімейне', 'Family'), [F(`${sc[1]} ${couple[0]} ${T('и', 'і', '&')} ${couple[1]}.jpg`, 'photo', 3.4, { scene: sc, personal: true, flag: 'owner', cam }), F(T('Контакты.vcf', 'Контакти.vcf', 'Contacts.vcf'), 'contact', 0.01, { personal: true, flag: 'owner' })]);
  }
  if (corp && kind !== 'office' && kind !== 'tape') dir(T('Работа', 'Робота', 'Work'), [F(T(`Клиентская база ${firm}.xlsx`, `Клієнтська база ${firm}.xlsx`, `${firm} clients.xlsx`), 'doc', 2.4, { text: T('Тысячи клиентов с телефонами и суммами заказов.', 'Тисячі клієнтів з телефонами й сумами замовлень.', 'Thousands of clients with phones and order totals.'), flag: 'corp' })]);
  if (corp || kind === 'office' || kind === 'tape') base.finds.corp = { firm, back: Math.round(r.float(80, 400)), sell: Math.round(r.float(300, 1300)) };
  if (dash) { base.finds.dash = { sell: Math.round(r.float(60, 260)), police: Math.round(r.float(20, 60)) }; dir('Event', [F(`${year}${pad(r.int(101, 1231))}_EVENT.MP4`, 'video', 120, { dur: '1:00', flag: 'dash', text: T('Резкий удар, вылетевшая на встречку машина, номер хорошо виден.', 'Різкий удар, машина вилетіла на зустрічну, номер добре видно.', 'A sudden crash, a car swerves into oncoming traffic, plate clearly visible.') })]); }
  if (rare) {
    const what = { cassette: T('Неизданная репетиция группы (1994)', 'Невидана репетиція гурту (1994)', 'Unreleased band rehearsal (1994)'), vhs: T('Эфир местного ТВ 1996 года', 'Ефір місцевого ТБ 1996 року', 'Local TV broadcast from 1996'), floppy: T('Исходники игры 1992 года', 'Вихідники гри 1992 року', 'Source code of a 1992 game'), gamecd: T('Неактивированный CD‑ключ коллекционного издания', 'Неактивований CD‑ключ колекційного видання', 'Unused collector’s edition CD key'), ipod: T('Демо‑записи музыканта', 'Демо‑записи музиканта', 'A musician’s demo recordings') }[kind] || T('Редкая запись', 'Рідкісний запис', 'Rare recording');
    base.finds.rare = { what, sell: Math.round(r.float(80, 600)) };
    dir(T('Ценное', 'Цінне', 'Valuable'), [F(what, kind === 'floppy' ? 'archive' : 'audio', 1.4, { flag: 'rare', dur: kind === 'floppy' ? null : `${r.int(12, 58)}:00` })]);
  }
  if (virus) {
    base.finds.virus = { kind: r.chance(0.6) ? 'ransom' : 'stealer', ransom: Math.round(r.float(25, 160)), steal: Math.round(r.float(15, 140)) };
    const ex = kind === 'cd' || kind === 'gamecd' ? 'setup.exe' : r.pick([T('Фото_с_корпоратива.exe', 'Фото_з_корпоративу.exe', 'Party_photos.exe'), 'crack_keygen.exe', T('Документы.scr', 'Документи.scr', 'Documents.scr'), 'Install_flash_player.exe']);
    const d0 = base.dirs[0] || (dir('', []), base.dirs[0]);
    if (d0) { const ex0 = d0.files.find((x) => x.type === 'exe'); if (ex0) ex0.flag = 'virus'; else d0.files.push(F(ex, 'exe', 0.6, { flag: 'virus' })); }
    else dir('', [F(ex, 'exe', 0.6, { flag: 'virus' })]);
  }
  // damaged drive: some files unreadable
  const bad = (it.defects || []).some((x) => x.c === 's_bad') || (['cd', 'dvd', 'floppy', 'vhs', 'cassette'].includes(kind) && (it.cond || 80) < 35);
  for (const dd of base.dirs) for (const f of dd.files) { if (bad && !f.flag && r.chance(0.3)) f.bad = true; base.used += f.size || 0; if (f.personal) base.personal = true; }
  if (owner || kind === 'phone' || kind === 'tablet' || kind === 'laptop' || kind === 'console') base.personal = true;
  base.used = Math.min(cap, +(base.used / 1000).toFixed(2));
  return base;
}

// ---------------------------------------------------------------- can it be read right now?
export const LOCKED = {
  lock: () => T('Устройство заблокировано — сначала снимите блокировку в Phone Lab.', 'Пристрій заблоковано — спершу зніміть блокування в Phone Lab.', 'The device is locked — remove the lock in Phone Lab first.'),
  dead: () => T('Устройство не определяется. Можно попробовать сервис восстановления данных.', 'Пристрій не визначається. Можна спробувати сервіс відновлення даних.', 'The device isn’t detected. A data recovery service might help.'),
  click: () => T('Диск щёлкает и не читается — нужен сервис восстановления данных.', 'Диск клацає й не читається — потрібен сервіс відновлення даних.', 'The drive is clicking and won’t read — it needs a data recovery service.'),
  pin: () => T('Аппаратное шифрование: нужен PIN. После трёх неудачных серий данные самоуничтожатся.', 'Апаратне шифрування: потрібен PIN. Після трьох невдалих серій дані самознищаться.', 'Hardware encryption: a PIN is required. Three failed rounds wipe the data.'),
  pass: () => T('На входе пароль учётной записи.', 'На вході пароль облікового запису.', 'An account password protects the login.'),
  ransom: () => T('Файлы зашифрованы вирусом‑вымогателем.', 'Файли зашифровано вірусом‑вимагачем.', 'Files are encrypted by ransomware.'),
};
export function accessOf(it) {
  const kind = storageKind(it), d = st(it);
  if (!kind) return { ok: false, why: 'none' };
  if (d.lost) return { ok: false, why: 'lost' };
  if (it.lock && (kind === 'phone' || kind === 'tablet')) return { ok: false, why: 'lock' };
  const codes = (it.defects || []).map((x) => x.c);
  const dead = codes.some((c) => c === 's_dead' || c === 'e_dead' || c === 'c_dead');
  if (dead && !d.recovered) return { ok: false, why: 'dead', fix: recoverCost(it) };
  if (codes.includes('s_click') && !d.recovered) return { ok: false, why: 'click', fix: recoverCost(it) };
  if (kind === 'secure' && !d.unlocked && !d.wiped) return { ok: false, why: 'pin' };
  if (kind === 'laptop' && !d.unlocked && !d.wiped && new RNG(`pw|${it.seed}`).chance(0.35)) return { ok: false, why: 'pass' };
  return { ok: true };
}
export const recoverCost = (it) => Math.round({ hdd: 90, nas: 140, office: 70, laptop: 110, phone: 120, tablet: 110, usb: 45, secure: 60, card: 40, dashcam: 35, console: 80, camera: 60, drone: 70 }[storageKind(it)] || 50);
// plugging it in is a test: hidden storage faults become known
export function connect(it) {
  const d = st(it);
  const found = [];
  for (const x of it.defects || []) if (!x.known && ['s_dead', 's_click', 's_bad', 's_slow'].includes(x.c)) { x.known = true; found.push(x.c); }
  if (!d.seen) { d.seen = true; stat('devicesOpened'); }
  emit('inv');
  return found;
}

// ---------------------------------------------------------------- actions
export function wipe(it) { const d = st(it); d.wiped = true; d.ransom = false; emit('inv'); log('files', T('Данные стёрты', 'Дані стерто', 'Data wiped')); }
export function recover(it) {
  const cost = recoverCost(it);
  if (!canAfford(cost)) return { ok: false, msg: T('Не хватает денег на сервис', 'Не вистачає грошей на сервіс', 'Can’t afford the service') };
  charge(cost, 'service', T('Восстановление данных', 'Відновлення даних', 'Data recovery'));
  const r = new RNG(`rec|${it.seed}|${G.s.t}`);
  if (r.chance(0.72)) { st(it).recovered = true; emit('inv'); return { ok: true }; }
  st(it).lost = true; emit('inv');
  return { ok: false, msg: T('Сервис не смог спасти данные — пластины повреждены.', 'Сервіс не зміг врятувати дані — пластини пошкоджені.', 'The lab couldn’t save the data — the platters are damaged.') };
}
// the wallet riddle: 3 attempts
export function tryWallet(it, guess) {
  const f = deviceFiles(it).finds.wallet, d = st(it);
  if (!f || d.wallet) return { ok: false };
  const g = String(guess || '').toLowerCase().replace(/[\s_\-.]/g, '').replace(/ё/g, 'е');
  if (f.pass.some((p) => p.replace(/ё/g, 'е') === g)) { d.wallet = 'open'; emit('inv'); return { ok: true, f }; }
  d.walletTries = (d.walletTries || 0) + 1;
  if (d.walletTries >= 3) { d.wallet = 'locked'; emit('inv'); return { ok: false, locked: true }; }
  emit('inv');
  return { ok: false, left: 3 - d.walletTries };
}
export function cashWallet(it) {
  const f = deviceFiles(it).finds.wallet, d = st(it);
  if (!f || d.wallet !== 'open') return 0;
  d.wallet = 'taken';
  earn(f.usd, 'stock', T(`Вывод ${f.coin} с найденного кошелька`, `Виведення ${f.coin} зі знайденого гаманця`, `Cashed out ${f.coin} from a found wallet`));
  addXP(25); stat('walletsFound');
  notify('bank', T('Криптокошелёк', 'Криптогаманець', 'Crypto wallet'), `+${fmt(f.usd)}`, { noBadge: true });
  return f.usd;
}
export function returnToOwner(it, ok) {
  const f = deviceFiles(it).finds.owner, d = st(it);
  if (!f || d.owner) return null;
  d.owner = ok ? 'returned' : 'missed';
  if (ok) {
    earn(f.reward, 'other', T('Благодарность за семейные фото', 'Подяка за сімейні фото', 'Thank‑you for the family photos'));
    addXP(20);
    addReview(5, T('Вернул нам семейные фото! Золотой человек.', 'Повернув нам сімейні фото! Золота людина.', 'Got our family photos back to us! A gem.'), { buyer: f.who });
  }
  emit('inv');
  return f;
}
export function dashAction(it, how) {
  const f = deviceFiles(it).finds.dash, d = st(it);
  if (!f || d.dash) return 0;
  d.dash = how;
  if (how === 'police') { earn(f.police, 'other', T('Вознаграждение за видео ДТП', 'Винагорода за відео ДТП', 'Reward for crash footage')); addXP(25); return f.police; }
  earn(f.sell, 'other', T('Продал видео ДТП в паблик', 'Продав відео ДТП у паблік', 'Sold crash footage to a channel')); addXP(5); return f.sell;
}
export function corpAction(it, how) {
  const f = deviceFiles(it).finds.corp, d = st(it);
  if (!f || d.corp) return null;
  d.corp = how;
  if (how === 'return') { earn(f.back, 'other', T(`${f.firm}: вознаграждение`, `${f.firm}: винагорода`, `${f.firm}: reward`)); addXP(30); addReview(5, T('Вернул нашу базу, не стал сливать. Респект.', 'Повернув нашу базу, не став зливати. Респект.', 'Returned our database instead of leaking it. Respect.'), { buyer: f.firm }); return { got: f.back }; }
  // selling it to competitors: easy money, but it might be a sting
  const caught = new RNG(`corp|${it.seed}|${G.s.t}`).chance(0.35);
  if (caught) { const fine = Math.round(f.sell * 1.6); charge(fine, 'fine', T('Штраф: торговля чужими базами данных', 'Штраф: торгівля чужими базами даних', 'Fine: selling stolen databases')); addReview(1, T('Слил нашу клиентскую базу. Обходите стороной.', 'Злив нашу клієнтську базу. Обходьте стороною.', 'Leaked our client database. Stay away.'), { buyer: f.firm }); return { caught: true, fine }; }
  earn(f.sell, 'other', T('Продал клиентскую базу', 'Продав клієнтську базу', 'Sold a client database'));
  return { got: f.sell };
}
export function rareSell(it) {
  const f = deviceFiles(it).finds.rare, d = st(it);
  if (!f || d.rare) return 0;
  d.rare = 'sold';
  earn(f.sell, 'sale', T(`Коллекционеру: ${f.what}`, `Колекціонеру: ${f.what}`, `To a collector: ${f.what}`)); addXP(15);
  return f.sell;
}
// running an .exe: the virus fires
export function runExe(it, file) {
  const f = deviceFiles(it).finds.virus, d = st(it);
  if (file.flag !== 'virus' || !f || d.virus) return { clean: true };
  d.virus = f.kind;
  if (f.kind === 'stealer') {
    charge(f.steal, 'scam', T('Троян украл данные карты', 'Троян викрав дані картки', 'A trojan stole your card details'));
    notify('bank', T('Подозрительное списание', 'Підозріле списання', 'Suspicious charge'), `−${fmt(f.steal)}`);
    emit('inv');
    return { stealer: true, amt: f.steal };
  }
  d.ransom = true; emit('inv');
  return { ransom: true, amt: f.ransom };
}
export function payRansom(it) {
  const f = deviceFiles(it).finds.virus, d = st(it);
  if (!f || !d.ransom) return null;
  if (!canAfford(f.ransom)) return { ok: false, msg: T('Не хватает денег', 'Не вистачає грошей', 'Not enough money') };
  charge(f.ransom, 'scam', T('Выкуп вымогателям', 'Викуп вимагачам', 'Ransom payment'));
  const honest = new RNG(`ransom|${it.seed}`).chance(0.65);
  if (honest) d.ransom = false; else { d.lost = true; d.ransom = false; }
  emit('inv');
  return { ok: honest };
}
export function decrypted(it, ok) { const d = st(it); if (ok) d.ransom = false; else { d.lost = true; d.ransom = false; } emit('inv'); }
export function pinResult(it, ok) {
  const d = st(it);
  if (ok) d.unlocked = true;
  else { d.pinFails = (d.pinFails || 0) + 1; if (d.pinFails >= 3) d.wiped = true; }
  emit('inv');
  return d.pinFails || 0;
}
export function passResult(it, ok) { if (ok) st(it).unlocked = true; else st(it).pwAt = G.s.t; emit('inv'); }
// selling a device with someone's data on it
export function leaksData(it) {
  if (!hasStorage(it)) return false;
  const d = it.data || {};
  if (d.wiped || d.lost || it.sealed) return false;
  const f = deviceFiles(it);
  return !!(f && !f.empty && f.personal);
}
