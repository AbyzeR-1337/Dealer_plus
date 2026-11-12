// Multi-step "procedures": a minigame is a short chain of smart puzzle steps, each with a header
// (step N of M), a short instruction, a stage, controls and a terminal-style log — you do the real
// thing step by step instead of mashing one button. Optional rival bar: someone else is racing you,
// every mistake costs time.
import { T } from '../core/i18n.js';
import { esc, clamp } from '../core/util.js';

export function procedure(api, { steps, theme = '', rival = null, head = '', onEnd = null, data = {} }) {
  api.body.innerHTML = `<div class="proc ${theme}">
    ${head ? `<div class="phead">${head}</div>` : ''}
    ${rival ? `<div class="prival"><div class="prow"><span>${T('Вы', 'Ви', 'You')}</span><div class="bar"><i class="pr-me"></i></div></div><div class="prow"><span>${esc(rival.label)}</span><div class="bar rv"><i class="pr-rv"></i></div></div></div>` : ''}
    <div class="phd"><h3 class="pttl"></h3><p class="pdesc"></p></div>
    <div class="pstage"></div>
    <div class="pctl"></div>
    <div class="plog mono"></div>
  </div>`;
  const $ = (s) => api.body.querySelector(s);
  const logEl = $('.plog');
  let stepTicks = [];
  let rv = 0, done = 0;
  const P = {
    api, mistakes: 0, i: 0, n: steps.length, data,
    get root() { return $('.proc'); },
    stage(html, cls = '') { const s = $('.pstage'); s.className = 'pstage ' + cls; s.innerHTML = html; return s; },
    ctl(html, cls = '') { const c = $('.pctl'); c.className = 'pctl ' + cls; c.innerHTML = html; return c; },
    desc(t) { $('.pdesc').innerHTML = t; },
    log(t, k = '') {
      const d = document.createElement('div');
      d.className = k;
      d.innerHTML = (k === 'ok' ? '✓ ' : k === 'err' ? '× ' : k === 'cmd' ? '&gt; ' : k === 'warn' ? '! ' : '') + t;
      logEl.appendChild(d);
      while (logEl.children.length > 60) logEl.firstChild.remove();
      logEl.scrollTop = logEl.scrollHeight;
    },
    wait(ms) { return new Promise((r) => setTimeout(() => { if (!api.ended) r(); }, ms)); },
    timer(sec, cb) { api.setTime(sec, () => { if (!api.ended) cb(); }, { optional: true }); },
    stopTimer() { api.clearTime(); },
    tick(fn) { stepTicks.push(fn); },
    mistake(t, penalty = 1) {
      P.mistakes++;
      if (t) P.log(t, 'err');
      api.sfx('err');
      api.shake($('.pstage'));
      if (rival) { rv += penalty * (rival.penalty ?? 3); P.log(T(`Потеряно время: +${Math.round(penalty * (rival.penalty ?? 3))} с сопернику`, `Втрачено час: +${Math.round(penalty * (rival.penalty ?? 3))} с супернику`, `Time lost: +${Math.round(penalty * (rival.penalty ?? 3))}s to the rival`), 'dim'); }
    },
    good(t) { if (t) P.log(t, 'ok'); api.sfx('ok'); },
    // wire a click/tap handler on every [data-*] button inside an element
    on(root, sel, fn, ev = 'click') { root.querySelectorAll(sel).forEach((b) => b.addEventListener(ev, (e) => { if (!api.ended && !b.disabled) fn(b, e); })); },
  };
  api.onTick((dt, now) => {
    if (api.ended) return;
    for (const f of stepTicks.slice()) f(dt, now);
    if (rival) {
      rv += dt;
      const me = $('.pr-me'), them = $('.pr-rv');
      if (me) me.style.width = (done / steps.length) * 100 + '%';
      if (them) them.style.width = clamp(rv / rival.eta, 0, 1) * 100 + '%';
      if (rv >= rival.eta) {
        api.end({ score: clamp(done / steps.length * 0.5, 0, 0.59), won: false, emoji: rival.emoji || '🐢', title: rival.lost || T('Соперник успел первым', 'Суперник встиг першим', 'The rival got there first'), text: rival.lostText || '' });
      }
    }
  });
  (async () => {
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (api.ended) return;
      stepTicks = []; P.i = i;
      $('.pttl').innerHTML = `${T('Шаг', 'Крок', 'Step')} ${i + 1} ${T('из', 'з', 'of')} ${steps.length} · ${esc(s.name)}`;
      P.desc(s.desc || ''); P.stage(''); P.ctl('');
      let ok = false;
      try { ok = await s.run(P); } catch (e) { console.error(e); ok = false; }
      P.stopTimer(); stepTicks = [];
      if (api.ended) return;
      if (ok) done++;
      else if (!s.soft) break;
      await P.wait(ok ? 700 : 1000);
    }
    if (api.ended) return;
    const won = done === steps.length;
    const res = { score: done / steps.length, won, passed: done, total: steps.length, mistakes: P.mistakes };
    api.end(onEnd ? { ...res, ...onEnd(res, P) } : res);
  })();
  return P;
}

// small shared helpers for steps
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const shuf = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const ri = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
export const hex2 = () => ri(0, 255).toString(16).toUpperCase().padStart(2, '0');
// a promise you resolve from event handlers; a second call is ignored
export function gate() { let f; const p = new Promise((r) => (f = r)); let used = false; p.done = (v) => { if (!used) { used = true; f(v); } }; return p; }
// numeric keypad markup
export const keypad = (extra = ['⌫', '0', '✓']) => `<div class="pkeys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', ...extra].map((k) => `<button data-k="${k}" class="${k === '✓' ? 'go' : ''}">${k}</button>`).join('')}</div>`;
