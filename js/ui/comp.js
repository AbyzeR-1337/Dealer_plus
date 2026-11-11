// Reusable HTML builders for items, listings, prices and small widgets.
import { G } from '../core/state.js';
import { T, L } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';
import { fmt } from '../core/money.js';
import { itemSVG } from './art.js';
import { itemTitle, itemSub, gradeOf, rarityName, traitName, knownDefects, unknownCount, defectName, fakeLabel, lockName, itemValue, isVehicle, fmtKm } from '../game/items.js';
import { DEFECTS, LOCKS, CATS, TESTS } from '../data/catalog.js';
import { icon } from './icons.js';
import { CITY } from '../data/world.js';
import { viewLabel } from '../data/views.js';

export const img = (it, o = {}) => itemSVG(it, o);
// photo carousel: views = camera angles shown (a seller posts only some of them)
export function gallery(it, views, idx, o = {}) {
  const i = Math.max(0, Math.min(idx || 0, views.length - 1));
  const v = views[i];
  return `<div class="gallery"><div class="gimg">${itemSVG(it, { view: v, ...o })}</div>${views.length > 1 ? '<button class="gnav l" data-a="gal" data-v="-1"></button><button class="gnav r" data-a="gal" data-v="1"></button>' : ''}<div class="gcount">${i + 1} / ${views.length} · ${esc(L(viewLabel(it, v)))}</div><div class="gdots">${views.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div></div>`;
}
export function tags(it, o = {}) {
  const t = [];
  if (o.below) t.push(`<span class="tag g">${T('Ниже рынка', 'Нижче ринку', 'Below market')}</span>`);
  if (it.rar >= 1) t.push(`<span class="tag ${['', 'g', 'b', 'p', 'y', 'r'][it.rar]}">◆ ${esc(rarityName(it.rar))}</span>`);
  if (it.lock) t.push(`<span class="tag r">🔒 ${esc(lockName(it.lock))}</span>`);
  if (it.jb) t.push(`<span class="tag p">${it.cat === 'phones' && /Pear/.test(it.m) ? 'Jailbreak' : 'Root'} +6%</span>`);
  if (it.fake && it.fakeKnown) t.push(`<span class="tag r">${esc(fakeLabel(it.fake))}</span>`);
  if (it.authOk) t.push(`<span class="tag g">✓ ${T('Оригинал', 'Оригінал', 'Authentic')}</span>`);
  if (it.sealed) t.push(`<span class="tag b">${T('Запечатан', 'Запечатаний', 'Sealed')}</span>`);
  if (it.grade) t.push(`<span class="tag y">${it.cat === 'cards' ? 'PZA' : 'CGS'} ${it.grade}</span>`);
  if (o.defects !== false) { const k = knownDefects(it).length; if (k) t.push(`<span class="tag o">⚠ ${k}</span>`); }
  return t.length ? `<div class="tags">${t.join('')}</div>` : '';
}
export function tile(it, o = {}) {
  return `<div class="tile" data-a="${o.a || 'go'}" data-v="${o.v || 'item'}" data-id="${esc(o.id || it.id)}">
    <div class="img">${img(it, { tilt: true })}${o.fav != null ? `<button class="fav${o.fav ? ' on' : ''}" data-a="fav" data-v="${esc(o.id)}">${icon('heart', o.fav ? 'fill="currentColor"' : '')}</button>` : ''}${it.lock ? `<span class="lockmark">🔒</span>` : ''}${o.sold ? `<div class="sold">${esc(o.sold)}</div>` : ''}</div>
    <div class="pr">${o.price != null ? fmt(o.price) : ''}</div>
    <div class="nm">${esc(itemTitle(it))}</div>
    <div class="ct">${esc(o.sub || '')}</div>
    ${tags(it, { below: o.below, defects: false })}
  </div>`;
}
export function row(it, right = '', sub = '', a = 'go', v = 'item', id = it.id) {
  return `<div class="list-item" data-a="${a}" data-v="${v}" data-id="${esc(id)}"><div class="th">${img(it)}</div><div class="grow"><div class="t">${esc(itemTitle(it))}</div><div class="s">${sub || esc(itemSub(it))}</div>${tags(it)}</div>${right}</div>`;
}
export function defectList(it, showUnknown = true) {
  let h = '';
  for (const d of it.defects) {
    if (!d.known) continue;
    const D = DEFECTS[d.c];
    h += `<div class="defect r">⚠ ${esc(defectName(d.c))}<span class="sv">−${Math.round((D?.sev || 0) * 100)}%</span></div>`;
  }
  if (it.lock) h += `<div class="defect r">🔒 ${esc(lockName(it.lock))}<span class="sv">−${Math.round(LOCKS[it.lock].sev * 100)}%</span></div>`;
  if (it.fake && it.fakeKnown) h += `<div class="defect r">✕ ${esc(fakeLabel(it.fake))}<span class="sv">−${it.fake === 2 ? 84 : 93}%</span></div>`;
  const u = unknownCount(it);
  if (showUnknown && u && !it.diag) h += `<div class="defect">❓ ${T('Возможны скрытые дефекты — осмотрите вещь', 'Можливі приховані дефекти — огляньте річ', 'Hidden issues possible — inspect it')}</div>`;
  if (!h) h = `<div class="defect" style="background:rgba(46,242,160,.08);color:var(--acc)">✓ ${T('Известных дефектов нет', 'Відомих дефектів немає', 'No known defects')}</div>`;
  return h;
}
export function specs(it) {
  const rows = [];
  rows.push([T('Категория', 'Категорія', 'Category'), L(CATS[it.cat].name)]);
  rows.push([T('Состояние', 'Стан', 'Condition'), `<span class="${gradeOf(it).cls}">${esc(gradeOf(it).n)}</span> · ${it.cond}/100`]);
  if (it.size) rows.push([T('Размер', 'Розмір', 'Size'), it.cat === 'sneakers' ? 'EU ' + it.size : it.size]);
  if (it.cat === 'cars') { rows.push([T('Год', 'Рік', 'Year'), it.year], [T('Пробег', 'Пробіг', 'Mileage'), fmtKm(it.km)], [T('Двигатель', 'Двигун', 'Engine'), `${it.eng} · ${it.tr}`], [T('Владельцев', 'Власників', 'Owners'), it.owners], [T('Госномер', 'Номер', 'Plate'), `<span class="plate">${esc(it.plate || '')}</span>`]); if (it.tune) rows.push([T('Тюнинг', 'Тюнінг', 'Tuning'), it.tune]); }
  if (it.cat === 'bikes' && it.km) rows.push([T('Пробег', 'Пробіг', 'Mileage'), fmtKm(it.km)]);
  if (it.fill != null) rows.push([T('Остаток', 'Залишок', 'Fill'), it.fill + '%']);
  rows.push([T('Комплект', 'Комплект', 'Extras'), [it.box && T('коробка', 'коробка', 'box'), it.docs && T('документы', 'документи', 'papers')].filter(Boolean).join(', ') || '—']);
  if (it.trait != null) rows.push([T('Особенность', 'Особливість', 'Special'), `<span class="pu">${esc(traitName(it))}</span>`]);
  if (it.loc && G.s && it.loc !== G.s.player.city && CITY[it.loc]) rows.push([T('Находится', 'Знаходиться', 'Located in'), esc(L(CITY[it.loc].name))]);
  return rows.map(([k, v]) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('');
}
export const empty = (ic, title, text = '', extra = '') => `<div class="empty">${icon(ic)}<b>${esc(title)}</b>${text}${extra}</div>`;
export const bar = (pct, color) => `<div class="bar"><i style="width:${clamp(pct, 0, 100)}%;${color ? `background:${color}` : ''}"></i></div>`;
export const segbar = (lvl, max) => `<div class="segbar">${Array.from({ length: max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</div>`;
export const kv = (k, v, cls = '') => `<div class="kv"><span>${k}</span><b class="${cls}">${v}</b></div>`;
export function sparkline(values, w = 300, h = 120, color = 'var(--acc)') {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 6 - ((v - min) / span) * (h - 12)}`).join(' ');
  const up = values[values.length - 1] >= values[0];
  const c = color === 'auto' ? (up ? '#2ef2a0' : '#ff5468') : color;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:${h}px"><polyline points="0,${h} ${pts} ${w},${h}" fill="${c}" fill-opacity=".12" stroke="none"/><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="2.2" vector-effect="non-scaling-stroke"/></svg>`;
}
export const avatar = (name, hue = 210) => `<div class="avatar" style="background:hsl(${hue} 30% 16%);color:hsl(${hue} 80% 65%)">${esc((name || '?')[0])}</div>`;
export const stars = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
export const testName = (k) => (TESTS[k] ? `${TESTS[k][3]} ${L(TESTS[k])}` : k);
