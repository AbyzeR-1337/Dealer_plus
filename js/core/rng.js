// Deterministic RNG (mulberry32) so items/art regenerate identically from a seed.
export function hashStr(s) {
  let h = 2166136261 >>> 0;
  s = String(s);
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export class RNG {
  constructor(seed) { this.seed = (typeof seed === 'number' ? seed >>> 0 : hashStr(seed)) || 1; this.f = mulberry32(this.seed); }
  next() { return this.f(); }
  float(a = 0, b = 1) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(a + (b - a + 1) * this.f()); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
  chance(p) { return this.f() < p; }
  weighted(arr, w) {
    const ws = arr.map(w); let tot = 0; for (const x of ws) tot += x;
    let r = this.f() * tot;
    for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; }
    return arr[arr.length - 1];
  }
  shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  sample(arr, n) { return this.shuffle(arr).slice(0, n); }
  gauss() { let u = 0; while (!u) u = this.f(); const v = this.f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
}
export const rngFor = (...parts) => new RNG(parts.join('|'));
