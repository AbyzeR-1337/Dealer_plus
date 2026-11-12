// Personal record card (Profile, Government services).
import { G } from '../core/state.js';
import { T, L, dur } from '../core/i18n.js';
import { esc } from '../core/util.js';
import { activeMarks, marksCount, recordMult, paperPenalty, crimeName } from '../game/crime.js';
export function recordCard() {
  const s = G.s, act = activeMarks(), all = (s.record?.marks || []).slice().reverse();
  if (!all.length) return `<div class="card"><h3>📁 ${T('Личное дело', 'Особова справа', 'Personal record')}</h3><div class="d">${T('Чисто. Ни одной пометки.', 'Чисто. Жодної позначки.', 'Clean. Not a single mark.')}</div></div>`;
  return `<div class="card ${act.length ? 'warn' : ''}"><h3>📁 ${T('Личное дело', 'Особова справа', 'Personal record')} · ${act.length}</h3>
    ${act.length ? `<div class="d">${T(`Штрафы и просрочки ×${recordMult().toFixed(1)} · работа, кредиты и документы сложнее на ${Math.round(paperPenalty() * 100)}%${marksCount() >= 2 ? ' · регистрация ИП/компании запрещена' : ''}`, `Штрафи й прострочки ×${recordMult().toFixed(1)} · робота, кредити й документи складніші на ${Math.round(paperPenalty() * 100)}%${marksCount() >= 2 ? ' · реєстрація ФОП/компанії заборонена' : ''}`, `Fines and late fees ×${recordMult().toFixed(1)} · jobs, credit and papers ${Math.round(paperPenalty() * 100)}% harder${marksCount() >= 2 ? ' · business registration banned' : ''}`)}</div>` : ''}
    ${all.slice(0, 8).map((m) => `<div class="kv"><span>${m.until > s.t ? '🔴' : '⚪'} ${esc(crimeName(m.kind))}${m.text ? ` · <small>${esc(m.text)}</small>` : ''}</span><b class="small">${m.until > s.t ? T('погасится через', 'погаситься через', 'clears in') + ' ' + dur(m.until - s.t) : T('погашена', 'погашена', 'cleared')}</b></div>`).join('')}</div>`;
}
