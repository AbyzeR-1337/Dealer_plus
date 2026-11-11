// Minimal keyed DOM patcher: updates an existing tree to match new HTML, touching only what changed.
// Elements with data-id / data-key are matched by key (so a new listing at the top of a feed does not
// rebuild every tile below it); everything else is matched by position and tag. Whole <svg> subtrees are
// swapped only when they differ (item photos are heavy to repaint).
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-key') || n.getAttribute('data-id') : null);

function syncAttrs(a, b) {
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for (const at of b.attributes) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
}
function patch(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.isEqualNode(b)) return;
  if (a.namespaceURI === 'http://www.w3.org/2000/svg' && a.tagName.toLowerCase() === 'svg') { a.replaceWith(b.cloneNode(true)); return; }
  syncAttrs(a, b);
  if ((a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') && a !== document.activeElement) a.value = b.value;
  morphChildren(a, b);
}
const compatible = (a, b) => a && a.nodeType === b.nodeType && a.nodeName === b.nodeName && keyOf(a) === keyOf(b);

export function morphChildren(from, to) {
  const keyed = new Map();
  for (const c of from.childNodes) { const k = keyOf(c); if (k) keyed.set(k, c); }
  let cur = from.firstChild;
  for (const nb of [...to.childNodes]) {
    const k = keyOf(nb);
    if (k && keyed.has(k)) {
      const old = keyed.get(k);
      keyed.delete(k);
      if (old !== cur) from.insertBefore(old, cur);
      else cur = cur.nextSibling;
      patch(old, nb);
      continue;
    }
    if (!k && compatible(cur, nb)) { const next = cur.nextSibling; patch(cur, nb); cur = next; continue; }
    from.insertBefore(nb.cloneNode(true), cur);
  }
  while (cur) { const next = cur.nextSibling; cur.remove(); cur = next; }
}
const tpl = document.createElement('template');
export function morphHTML(el, html) {
  tpl.innerHTML = html;
  morphChildren(el, tpl.content);
  tpl.innerHTML = '';
}
