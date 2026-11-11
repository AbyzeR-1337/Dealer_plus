// Tri-lingual helper: T(ru, uk, en) picks the string for the current UI language.
let LANG = 'ru';
export const LANGS = [
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
  { id: 'uk', name: 'Українська', flag: '🇺🇦' },
  { id: 'en', name: 'English', flag: '🇬🇧' },
];
export function setLang(l) { LANG = ['ru', 'uk', 'en'].includes(l) ? l : 'en'; if (typeof document !== 'undefined') document.documentElement.lang = LANG; }
export const lang = () => LANG;
export function T(ru, uk, en) { if (LANG === 'uk') return uk ?? ru; if (LANG === 'en') return en ?? ru; return ru; }
export function L(v) { if (v == null) return ''; if (Array.isArray(v)) return T(v[0], v[1], v[2]); if (typeof v === 'object') return v[LANG] ?? v.ru ?? ''; return String(v); }
export function plural(n, ru, uk, en) {
  n = Math.abs(Math.round(n));
  if (LANG === 'en') return n === 1 ? en[0] : en[1];
  const f = LANG === 'uk' ? uk : ru;
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return f[0];
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return f[1];
  return f[2];
}
export function dur(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const H = T('ч', 'год', 'h'), M = T('мин', 'хв', 'min'), S = T('сек', 'сек', 's');
  if (h) return m ? `${h} ${H} ${m} ${M}` : `${h} ${H}`;
  if (m) return s ? `${m} ${M} ${s} ${S}` : `${m} ${M}`;
  return `${s} ${S}`;
}
export const clockDur = (sec) => { sec = Math.max(0, Math.round(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const MONTHS = {
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  uk: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const WD = {
  ru: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  uk: ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'пʼятниця', 'субота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
export const monthName = (m) => MONTHS[LANG][m];
export const weekdayName = (d) => WD[LANG][d];
export const fmtDate = (date, withWd = true) => {
  const s = LANG === 'en' ? `${MONTHS.en[date.getMonth()]} ${date.getDate()}` : `${date.getDate()} ${MONTHS[LANG][date.getMonth()]}`;
  return withWd ? `${WD[LANG][date.getDay()]}, ${s}` : s;
};
