// Item photos as plain bitmaps. The live SVG scene (photo background, cut-out, shadows, filters, grain)
// is expensive for a phone to repaint while scrolling or swiping, so every photo is rendered ONCE into a
// JPEG blob and shown as an ordinary <img>. Rendering happens in a background queue; until a photo is ready
// its slot shows a soft placeholder. Inspection and minigames keep the interactive SVG.
import { renderItem, itemSig, spritePickFor, usesPhoto } from './art.js';
import { realPhoto } from './real_photo.js';
import { SHEETS, SHEET_SCALE } from '../data/sprites.js';
import { spriteFit } from './sprite_art.js';
import { photoSetup } from './photo.js';

const URLS = new Map();          // key -> blob url (LRU by insertion order)
const WAIT = new Map();          // key -> { it, o, size }
const MAX = 220;
const dataCache = new Map();     // asset url -> Promise<dataURL>
const cropCache = new Map();     // sprite id -> Promise<dataURL>
const sheetImgs = {};
let busy = false;
export let bitmapsOK = typeof document !== 'undefined' && !!document.createElement('canvas').getContext;

const blobToData = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
function assetData(url) {
  if (!dataCache.has(url)) dataCache.set(url, fetch(url).then((r) => r.blob()).then(blobToData));
  return dataCache.get(url);
}
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function sheet(n) { return (sheetImgs[n] ||= loadImg(SHEETS[n])); }
function spriteCrop(s) {
  if (!cropCache.has(s.id)) {
    cropCache.set(s.id, sheet(s.sheet).then((img) => {
      const [fx, fy, fw, fh] = spriteFit(s);
      const k = SHEET_SCALE;
      const c = document.createElement('canvas');
      c.width = Math.round(fw * k); c.height = Math.round(fh * k);
      c.getContext('2d').drawImage(img, fx * k, fy * k, fw * k, fh * k, 0, 0, c.width, c.height);
      return c.toDataURL('image/png');
    }));
  }
  return cropCache.get(s.id);
}
async function rasterize(it, o, size) {
  const view = o.view || 'front';
  let embed;
  if (usesPhoto(it, o)) {
    const [photo, grain] = await Promise.all([assetData(realPhoto(it).url), assetData('assets/photo/grain.webp')]);
    embed = { photo, grain };
  } else {
    const pick = spritePickFor(it, view, o);
    const ps = photoSetup(it, view);
    const [bg, grain, sprite] = await Promise.all([assetData(ps.ph.f), assetData('assets/photo/grain.webp'), pick ? spriteCrop(pick.sprite) : null]);
    embed = { bg, grain, sprite };
  }
  const { svg } = renderItem(it, { ...o, embed });
  const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = await loadImg(u);
    const c = document.createElement('canvas');
    c.width = c.height = size;
    c.getContext('2d').drawImage(img, 0, 0, size, size);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
    if (!blob) throw new Error('toBlob');
    return URL.createObjectURL(blob);
  } finally { URL.revokeObjectURL(u); }
}
function remember(key, url) {
  URLS.set(key, url);
  while (URLS.size > MAX) { const [k, v] = URLS.entries().next().value; URLS.delete(k); URL.revokeObjectURL(v); }
  for (const el of document.querySelectorAll(`img[data-bm="${CSS.escape(key)}"]`)) { el.src = url; el.classList.add('ready'); }
}
function pump() {
  if (busy || !WAIT.size) return;
  busy = true;
  const [key, job] = WAIT.entries().next().value;
  WAIT.delete(key);
  // yield to the UI between photos so scrolling stays smooth while the queue drains
  const run = () => rasterize(job.it, job.o, job.size).then((url) => remember(key, url)).catch((e) => { console.warn('bitmap', e); FAILED.add(key); for (const el of document.querySelectorAll(`img[data-bm="${CSS.escape(key)}"]`)) el.replaceWith(fallback(job)); })
    .finally(() => { busy = false; setTimeout(pump, 0); });
  (window.requestIdleCallback || ((f) => setTimeout(f, 16)))(run, { timeout: 120 });
}
const FAILED = new Set();
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
function fallback(job) { const d = document.createElement('div'); d.className = 'bmsvg'; d.innerHTML = renderItem(job.it, job.o).svg; return d; }

// <img> markup for an item photo. size: rendered pixels (thumbnails ~460, full photos ~960)
export function itemBitmap(it, o = {}, size = 460) {
  const key = `${itemSig(it, o)}|${size}`;
  if (FAILED.has(key) || !bitmapsOK) return renderItem(it, o).svg;
  const url = URLS.get(key);
  if (url) { URLS.delete(key); URLS.set(key, url); return `<img class="bm ready" data-bm="${key}" src="${url}" alt="" draggable="false">`; }
  if (!WAIT.has(key)) WAIT.set(key, { it, o, size });
  setTimeout(pump, 0);
  return `<img class="bm" data-bm="${key}" src="${BLANK}" alt="" draggable="false">`;
}
