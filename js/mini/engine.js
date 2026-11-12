// Minigame engine: fullscreen overlay, timer, result screen. Games are registered as functions(api, opts).
import { T } from '../core/i18n.js';
import { dv } from '../game/difficulty.js';
import { esc, clamp } from '../core/util.js';
import { icon } from '../ui/icons.js';
import { sfx } from '../ui/sfx.js';
import { setPaused } from '../game/sim.js';

const GAMES = {};
export function registerGames(map) { Object.assign(GAMES, map); }

export function playMini(name, opts = {}) {
  return new Promise((resolve) => {
    const layer = document.getElementById('mini-layer');
    const root = document.createElement('div');
    root.className = 'mini';
    root.innerHTML = `<div class="mhead"><button class="x">${icon('x')}</button><h2>${esc(opts.title || '')}</h2><span class="tm hidden"></span></div><div class="mbody"></div>`;
    layer.innerHTML = '';
    layer.appendChild(root);
    document.body.classList.add('in-mini');
    setPaused(true);
    const body = root.querySelector('.mbody');
    const tmEl = root.querySelector('.tm');
    let ended = false, timeLeft = null, last = performance.now(), raf = 0;
    const tickFns = [];
    let onTimeout = null;
    const api = {
      root, body, opts,
      setTitle(t) { root.querySelector('h2').textContent = t; },
      setTime(sec, cb, o = {}) {
        const d = dv();
        if (d.id === 'relaxed') { if (o.optional) { this.clearTime(); return; } sec *= d.timer; timeLeft = sec; onTimeout = cb || null; tmEl.classList.add('hidden'); return; }
        timeLeft = sec * d.timer; onTimeout = cb || null; tmEl.classList.remove('hidden');
      },
      clearTime() { timeLeft = null; onTimeout = null; tmEl.classList.add('hidden'); tmEl.classList.remove('low'); },
      addTime(sec) { if (timeLeft != null) timeLeft = Math.max(0, timeLeft + sec); },
      get time() { return timeLeft; },
      onTick(fn) { tickFns.push(fn); },
      sfx,
      flash(ok) { body.classList.remove('flash-g', 'flash-r'); void body.offsetWidth; body.classList.add(ok ? 'flash-g' : 'flash-r'); },
      shake(el = body) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); },
      end(res) { if (ended) return; ended = true; finish(res); },
      get ended() { return ended; },
    };
    function loop(now) {
      if (ended) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (timeLeft != null) {
        timeLeft -= dt;
        tmEl.textContent = `${Math.max(0, Math.ceil(timeLeft))} ${T('с', 'с', 's')}`;
        tmEl.classList.toggle('low', timeLeft < 5);
        if (timeLeft <= 0) { timeLeft = 0; const cb = onTimeout; if (cb) { timeLeft = null; onTimeout = null; tmEl.classList.add('hidden'); cb(); } else api.end({ score: 0, timeout: true }); }
      }
      for (const f of tickFns) f(dt, now);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    root.querySelector('.x').addEventListener('click', () => api.end({ score: 0, quit: true }));
    function finish(res) {
      cancelAnimationFrame(raf);
      res = { score: 0, ...res };
      res.score = clamp(res.score || 0, 0, 1);
      if (res.quit && !opts.showQuit) return close(res);
      const good = res.score >= (opts.pass ?? 0.6);
      sfx(good ? 'win' : 'lose');
      const panel = document.createElement('div');
      panel.className = 'mres';
      panel.innerHTML = `<div class="big">${res.emoji || (good ? '✅' : res.score > 0.3 ? '😐' : '❌')}</div><h2>${esc(res.title || (good ? T('Отлично!', 'Чудово!', 'Great!') : res.score > 0.3 ? T('Неплохо', 'Непогано', 'Not bad') : T('Не вышло', 'Не вийшло', 'Failed')))}</h2><p>${res.text || `${T('Результат', 'Результат', 'Score')}: ${Math.round(res.score * 100)}%`}</p><button class="btn block" style="margin-top:14px;max-width:280px">${T('Продолжить', 'Продовжити', 'Continue')}</button>`;
      body.appendChild(panel);
      panel.querySelector('button').addEventListener('click', () => close(res));
    }
    function close(res) {
      setPaused(false);
      document.body.classList.remove('in-mini');
      root.remove();
      resolve(res);
    }
    const g = GAMES[name];
    if (!g) { api.end({ score: 1 }); return; }
    try { g(api, opts); } catch (e) { console.error(e); api.end({ score: 0.5, text: String(e.message) }); }
  });
}

// helpers for games
export function svgPoint(svg, ev) {
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  return pt.matrixTransform(svg.getScreenCTM().inverse());
}
export function h(tag, cls, html = '') { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
