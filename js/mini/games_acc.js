// Sticking a screen protector: wipe every speck of dust off the screen, then lay the glass on straight.
// Dust left under it or a crooked glass = bubbles (or a ruined glass).
import { T } from '../core/i18n.js';
import { clamp } from '../core/util.js';

const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
function glass(api, { time = 18 }) {
  api.setTime(time, () => finish());
  const n = ri(5, 8);
  const dust = Array.from({ length: n }, () => ({ x: ri(16, 84), y: ri(12, 88), r: ri(5, 9) }));
  api.body.innerHTML = `<div class="mhint ga-hint">${T('Протрите экран: нажмите на каждую пылинку', 'Протріть екран: натисніть на кожну порошинку', 'Wipe the screen: tap every speck of dust')}<small class="ga-left"></small></div>
    <div class="mstage ga-stage"><div class="ga-phone"><div class="ga-screen">${dust.map((d, i) => `<i class="ga-dust" data-i="${i}" style="left:${d.x}%;top:${d.y}%;width:${d.r * 2}px;height:${d.r * 2}px"></i>`).join('')}</div><span class="ga-cam"></span></div><div class="ga-glass hidden" style="left:${ri(50, 64)}%;top:${ri(46, 60)}%;transform:rotate(${ri(-12, 12)}deg)"></div></div>
    <button class="btn block ga-btn">${T('Экран чистый →', 'Екран чистий →', 'Screen is clean →')}</button>`;
  const st = api.body.querySelector('.ga-stage'), scr = api.body.querySelector('.ga-screen'), gl = api.body.querySelector('.ga-glass'), btn = api.body.querySelector('.ga-btn'), left = api.body.querySelector('.ga-left');
  let phase = 'wipe', removed = 0;
  const upd = () => { left.textContent = phase === 'wipe' ? ` · ${n - removed}` : ''; };
  upd();
  api.body.querySelectorAll('.ga-dust').forEach((d) => d.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (phase !== 'wipe' || d.classList.contains('gone')) return; d.classList.add('gone'); removed++; api.sfx('tap'); upd(); if (removed >= n) toGlass(); }));
  function toGlass() {
    if (phase !== 'wipe') return;
    phase = 'lay';
    api.body.querySelector('.ga-hint').firstChild.textContent = T('Положите стекло ровно на экран и нажмите «Приклеить»', 'Покладіть скло рівно на екран і натисніть «Приклеїти»', 'Lay the glass exactly over the screen and tap “Stick”');
    gl.classList.remove('hidden');
    const sr = scr.getBoundingClientRect(); gl.style.width = sr.width + 'px'; gl.style.height = sr.height + 'px'; gl.style.aspectRatio = 'auto';
    btn.textContent = T('Приклеить', 'Приклеїти', 'Stick');
    upd();
  }
  let drag = null;
  gl.addEventListener('pointerdown', (e) => { const r = gl.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; gl.setPointerCapture(e.pointerId); });
  gl.addEventListener('pointermove', (e) => { if (!drag) return; const s = st.getBoundingClientRect(); gl.style.left = ((e.clientX - s.left - drag.dx) / s.width) * 100 + '%'; gl.style.top = ((e.clientY - s.top - drag.dy) / s.height) * 100 + '%'; });
  gl.addEventListener('pointerup', () => { drag = null; gl.style.transition = 'transform .2s'; gl.style.transform = 'rotate(0deg)'; });
  btn.addEventListener('click', () => { if (phase === 'wipe') toGlass(); else finish(); });
  function finish() {
    if (api.ended) return;
    const dirt = n - removed;
    if (phase === 'wipe') return api.end({ score: 0, text: T('Не успели — пыль осталась, стекло легло криво', 'Не встигли — пил залишився, скло лягло криво', 'Too slow — dust everywhere, the glass went on crooked') });
    const a = gl.getBoundingClientRect(), b = scr.getBoundingClientRect();
    const d = Math.hypot(a.left - b.left, a.top - b.top) / b.width;
    const tilt = /rotate\(0deg\)/.test(gl.style.transform) ? 0 : 0.2;
    const score = clamp(1 - d * 2.4 - tilt - dirt * 0.12, 0, 1);
    api.end({ score, emoji: score >= 0.6 ? '✨' : score >= 0.3 ? '🫧' : '💥', title: score >= 0.6 ? T('Идеально ровно', 'Ідеально рівно', 'Perfectly straight') : score >= 0.3 ? T('Есть пузырьки', 'Є бульбашки', 'A few bubbles') : T('Стекло испорчено', 'Скло зіпсовано', 'Glass ruined'), text: score >= 0.6 ? T('Ни одного пузырька — телефон выглядит как новый.', 'Жодної бульбашки — телефон виглядає як новий.', 'Not a single bubble — the phone looks brand new.') : score >= 0.3 ? T('Держится, но пузырьки видно — прибавка к цене меньше.', 'Тримається, але бульбашки видно — надбавка до ціни менша.', 'It holds, but the bubbles show — less of a price bump.') : T('Стекло легло криво, переклеить нельзя.', 'Скло лягло криво, переклеїти не можна.', 'It went on crooked and can’t be re‑stuck.') });
  }
}
export const ACC_GAMES = { glass };
