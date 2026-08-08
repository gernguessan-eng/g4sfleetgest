import type { ChecklistAnswer, ChecklistItemDef } from '../types/pointage';

interface ChecklistGridProps {
  columns: ChecklistItemDef[][];
  values: Record<string, ChecklistAnswer>;
  onChange: (key: string, value: ChecklistAnswer) => void;
  readOnly?: boolean;
}

const OUI_NON_OPTIONS: ChecklistAnswer[] = ['Oui', 'Non'];
const ETAT_OPTIONS: ChecklistAnswer[] = ['Bon', 'Moyen', 'Mauvais'];

function toneFor(value: ChecklistAnswer, option: ChecklistAnswer): string {
  if (value !== option) return 'border-slate-200 bg-white text-slate-400 hover:border-slate-300';
  if (option === 'Oui' || option === 'Bon') return 'border-green-500 bg-green-500 text-white';
  if (option === 'Moyen') return 'border-amber-500 bg-amber-500 text-white';
  return 'border-red-500 bg-red-500 text-white'; // Non / Mauvais
}

/**
 * Grille de contrôle à 3 colonnes reproduisant la mise en page des fiches papier
 * "Contrôles journaliers" — réutilisée par Pointage Moto et Pointage Voiture.
 */
export default function ChecklistGrid({ columns, values, onChange, readOnly }: ChecklistGridProps) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-1 lg:grid-cols-3">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="space-y-1">
          {col.map((item) => {
            const options = item.kind === 'oui_non' ? OUI_NON_OPTIONS : ETAT_OPTIONS;
            const value = values[item.key] || '';
            return (
              <div key={item.key} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-1.5">
                <span className="text-xs text-slate-700">
                  {item.label}{item.critical && <span className="ml-0.5 text-red-500" title="Défaillance critique : peut entraîner le retrait du véhicule de la circulation">*</span>}
                </span>
                <div className="flex flex-shrink-0 gap-1">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={readOnly}
                      onClick={() => onChange(item.key, value === opt ? '' : opt)}
                      className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${toneFor(value, opt)} ${readOnly ? 'cursor-default opacity-80' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
