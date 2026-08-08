import { Plus, Trash2 } from 'lucide-react';
import type { DefaillanceRow } from '../types/pointage';

interface DefaillancesTableProps {
  rows: DefaillanceRow[];
  onChange: (rows: DefaillanceRow[]) => void;
  readOnly?: boolean;
}

/** Table "Rapport Défaillances Mécaniques" — commune aux fiches Moto et Voiture. */
export default function DefaillancesTable({ rows, onChange, readOnly }: DefaillancesTableProps) {
  const update = (id: string, field: keyof DefaillanceRow, value: string) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };
  const addRow = () => onChange([...rows, { id: 'd' + Date.now(), defaillance: '', action: '', signature: '' }]);
  const removeRow = (id: string) => onChange(rows.filter((r) => r.id !== id));

  return (
    <div>
      <div className="grid grid-cols-[2.5rem_1fr_1fr_8rem_auto] gap-2 border-b border-slate-200 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <span>N°</span><span>Défaillances</span><span>Action(s) menée(s)</span><span>Signature</span><span />
      </div>
      {rows.map((row, idx) => (
        <div key={row.id} className="grid grid-cols-[2.5rem_1fr_1fr_8rem_auto] items-center gap-2 border-b border-slate-100 py-1.5">
          <span className="text-xs text-slate-500">{idx + 1}</span>
          <input disabled={readOnly} value={row.defaillance} onChange={(e) => update(row.id, 'defaillance', e.target.value)} placeholder="—" className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:bg-transparent disabled:border-transparent" />
          <input disabled={readOnly} value={row.action} onChange={(e) => update(row.id, 'action', e.target.value)} placeholder="—" className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:bg-transparent disabled:border-transparent" />
          <input disabled={readOnly} value={row.signature} onChange={(e) => update(row.id, 'signature', e.target.value)} placeholder="—" className="rounded-md border border-slate-200 px-2 py-1 text-xs disabled:bg-transparent disabled:border-transparent" />
          {!readOnly && rows.length > 1 && (
            <button type="button" onClick={() => removeRow(row.id)} className="p-1 text-slate-300 hover:text-red-600 print:hidden"><Trash2 className="h-3.5 w-3.5" /></button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button type="button" onClick={addRow} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 print:hidden">
          <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
        </button>
      )}
    </div>
  );
}
