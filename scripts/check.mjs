// CI sanity check: syntax-check every module and run a headless smoke test of the game data/logic.
import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, acc); else if (p.endsWith('.js') || p.endsWith('.mjs')) acc.push(p);
  }
  return acc;
}
const files = [...walk('js'), 'sw.js', ...walk('scripts')];
let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); }
  catch (e) { bad++; console.error(`✗ ${f}\n${e.stderr?.toString()}`); }
}
if (bad) { console.error(`${bad} file(s) failed syntax check`); process.exit(1); }
console.log(`✓ syntax ok (${files.length} files)`);

const { smoke } = await import('./smoke.mjs');
await smoke();
