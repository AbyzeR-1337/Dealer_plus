// Real photos of items (assets/photos/<variant>/<file>.webp, generated with FLUX by scripts/gen_photos_fal.py):
// one second-hand listing photo per catalogue model, plus worn/dirty and broken versions where available.
// Every item still looks like its own photo: its seed picks the framing, tilt, exposure and white balance,
// dirt and the visible defects are drawn on top, and close-ups are crops of the same shot.
import { PHOTO_FILES } from '../data/photos.js';
import { DEFECTS } from '../data/catalog.js';

const SETS = Object.fromEntries(Object.entries(PHOTO_FILES).map(([k, v]) => [k, new Set(v)]));
export const photoFile = (id) => { let h = 2166136261 >>> 0; for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const FILE = new Map();
const fileOf = (m) => { let f = FILE.get(m); if (!f) { f = photoFile(m); FILE.set(m, f); } return f; };
// photos that failed to load on this device fall back to the drawing
const BROKEN_URL = new Set();
export const photoFailed = (url) => BROKEN_URL.add(url);
export const hasPhoto = (modelId) => { const f = fileOf(modelId); return SETS.clean?.has(f) || SETS.worn?.has(f) || SETS.broken?.has(f); };
const SEVERE = new Set(['crack', 'backcrack', 'broken', 'dent', 'rust', 'tear', 'a_broken', 'bk_wheel', 'bk_dent', 'c_dent', 'c_rust', 'w_crack']);
// which shot to show for this particular item
export function realPhoto(it) {
  if (!it?.m) return null;
  const f = fileOf(it.m);
  const has = (v) => SETS[v]?.has(f);
  if (!has('clean') && !has('worn') && !has('broken')) return null;
  const visible = (it.defects || []).filter((d) => DEFECTS[d.c]?.vis === 'visible');
  const severe = visible.some((d) => SEVERE.has(d.c) || (DEFECTS[d.c]?.sev || 0) >= 0.25) || it.lock === 'bootloop';
  const cond = it.cleaned ? Math.max(it.cond ?? 80, 75) : it.cond ?? 80;
  let v = 'clean';
  if (severe && has('broken')) v = 'broken';
  else if (cond < 58 && has('worn')) v = 'worn';
  if (!has(v)) v = has('clean') ? 'clean' : has('worn') ? 'worn' : 'broken';
  const url = `assets/photos/${v}/${f}.webp`;
  if (BROKEN_URL.has(url)) return null;
  return { v, f, url };
}
export const PHOTO_VIEWS = ['front', 'close', 'close2'];
// framing of the shot for a view: zoom, centre and tilt (deterministic per item)
export function framing(it, view) {
  let s = (it.seed >>> 0) || 1;
  const r = () => { s = (s * 1103515245 + 12345) >>> 0; return ((s >>> 8) & 0xffff) / 0xffff; };
  const tilt = (r() - 0.5) * 3.2;
  if (view === 'front') { const z = 1.04 + r() * 0.1 + Math.abs(tilt) * 0.02; return { z, cx: 200 + (r() - 0.5) * 60 * (z - 1) * 4, cy: 200 + (r() - 0.5) * 60 * (z - 1) * 4, tilt }; }
  r(); r(); r();
  const k = view === 'close' ? 0 : 1;
  for (let i = 0; i < k * 3; i++) r();
  const z = view === 'close' ? 1.75 + r() * 0.25 : 2.3 + r() * 0.3;
  return { z, cx: 130 + r() * 140, cy: 130 + r() * 140, tilt: tilt * 0.5 };
}
// the photographed object is roughly centred: defect overlays use this box
export const PHOTO_BOX = { x: 112, y: 104, w: 176, h: 192 };
