// Tiny WebAudio synth for UI feedback (no audio files needed).
import { G } from '../core/state.js';
let ctx = null;
function ac() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function tone(freq, t0, len, type = 'sine', vol = 0.06) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + t0);
  g.gain.setValueAtTime(0.0001, c.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + len);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + len + 0.02);
}
const SOUNDS = {
  tap: () => tone(880, 0, 0.04, 'sine', 0.025),
  note: () => { tone(1046, 0, 0.09, 'sine', 0.04); tone(1568, 0.08, 0.12, 'sine', 0.035); },
  ok: () => { tone(660, 0, 0.08, 'triangle'); tone(990, 0.07, 0.12, 'triangle'); },
  err: () => { tone(220, 0, 0.12, 'square', 0.03); tone(180, 0.1, 0.15, 'square', 0.03); },
  cash: () => { tone(1318, 0, 0.06, 'triangle'); tone(1760, 0.06, 0.06, 'triangle'); tone(2093, 0.12, 0.14, 'triangle'); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.16, 'triangle', 0.05)); },
  lose: () => { [392, 330, 262].forEach((f, i) => tone(f, i * 0.12, 0.18, 'sawtooth', 0.025)); },
  tick: () => tone(1200, 0, 0.02, 'square', 0.015),
  hit: () => tone(520, 0, 0.05, 'square', 0.03),
};
export function sfx(name) { if (G.s && G.s.settings && G.s.settings.sound === false) return; try { SOUNDS[name]?.(); } catch {} }
export function unlockAudio() { ac(); }
