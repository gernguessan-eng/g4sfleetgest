import { useMemo } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { StockItem, StockExit } from '../types/atelier';
import { EXIT_REASONS, stockLevelOf, stockTotalValue } from '../types/atelier';
import SelectWithOther from './SelectWithOther';
import { Plus, Printer, Search, Trash2, X, AlertTriangle, History } from 'lucide-react';

function fmtMoney(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }
function fmtDate(d?: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }

const LEVEL_COLORS: Record<string, string> = {
  critique: 'bg-red-100 text-red-700',
  bas: 'bg-amber-100 text-amber-700',
  normal: 'bg-green-100 text-green-700',
};

export default function AtelierStocks() {
  const { vehicles, orders, stockItems, stockExits, addStockItem, updateStockItem, deleteStockItem, receiveStock, addStockExit } = useVehicles();
  const [search, setSearch] = usePersistedState('fleetgest_filter_stocks_search', '');
  const [alertsOnly, setAlertsOnly] = usePersistedState('fleetgest_filter_stocks_alerts', false);
  const [showForm, setShowForm] = usePersistedState('fleetgest_open_stock_form', false);
  const [editId, setEditId] = usePersistedState('fleetgest_editing_stock_id', '');
  const editItem = useMemo(() => stockItems.find(s => s.id === editId), [stockItems, editId]);
  const [exitItemId, setExitItemId] = usePersistedState('fleetgest_open_stock_exit_id', '');
  const exitItem = useMemo(() => stockItems.find(s => s.id === exitItemId), [stockItems, exitItemId]);

  const totalValue = useMemo(() => stockItems.reduce((sum, s) => sum + stockTotalValue(s), 0), [stockItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stockItems.filter(s => {
      const matchSearch = !q || [s.ref, s.name, s.supplier, s.category].some(f => f.toLowerCase().includes(q));
      const matchAlert = !alertsOnly || stockLevelOf(s.quantity, s.minLevel) !== 'normal';
      return matchSearch && matchAlert;
    });
  }, [stockItems, search, alertsOnly]);

  const handleSave = (data: Omit<StockItem, 'id'>, id?: string) => {
    if (id) updateStockItem(id, data);
    else addStockItem({ ...data, id: 'P' + String(stockItems.length + 1).padStart(3, '0') + Date.now().toString().slice(-4) });
    setShowForm(false);
    setEditId('');
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette pièce du catalogue de stock ? Cette action est irréversible.")) return;
    deleteStockItem(id);
    setShowForm(false);
    setEditId('');
  };

  const recentExits = useMemo(() => [...stockExits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8), [stockExits]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow-sm print:hidden">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Gestion du Stock &amp; Pièces</h2>
            <p className="text-xs text-slate-400">Cliquez sur une ligne pour voir les détails · actions rapides d'entrée et de sortie</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Imprimer"><Printer className="h-4 w-4" /></button>
            <button onClick={() => { setEditId(''); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nouvelle pièce</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par SKU, désignation, fournisseur…" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          </div>
          <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">VALEUR DES PIÈCES EN STOCK <span className="text-emerald-600">{fmtMoney(totalValue)}</span></span>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <input type="checkbox" checked={alertsOnly} onChange={e => setAlertsOnly(e.target.checked)} /> Afficher uniquement les alertes
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>{['SKU', 'Désignation', 'Stock', 'Min.', 'Prix', 'Fournisseur', 'Entrée', 'Sortie'].map(h => <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-slate-400">Aucune pièce ne correspond à votre recherche.</td></tr> :
              filtered.map(item => {
                const level = stockLevelOf(item.quantity, item.minLevel);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="cursor-pointer px-3 py-3 text-xs font-mono text-slate-500" onClick={() => { setEditId(item.id); setShowForm(true); }}>{item.ref}</td>
                    <td className="cursor-pointer px-3 py-3" onClick={() => { setEditId(item.id); setShowForm(true); }}>
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-[11px] text-slate-400">{item.category}</p>
                    </td>
                    <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${LEVEL_COLORS[level]}`}>{item.quantity}</span></td>
                    <td className="px-3 py-3 text-sm text-slate-500">{item.minLevel}</td>
                    <td className="px-3 py-3 text-sm text-slate-700">{fmtMoney(item.unitPrice)}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{item.supplier}</td>
                    <td className="px-3 py-3"><button onClick={() => receiveStock(item.id, 5)} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">Commander (+5)</button></td>
                    <td className="px-3 py-3"><button onClick={() => setExitItemId(item.id)} disabled={item.quantity <= 0} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sortie de stock</button></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><History className="h-3.5 w-3.5" /> Dernières sorties de stock</h3>
        {recentExits.length === 0 ? <p className="text-sm text-slate-400">Aucune sortie enregistrée.</p> : (
          <div className="space-y-1.5">
            {recentExits.map(exit => (
              <div key={exit.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="flex-1 truncate"><strong>{exit.itemName}</strong> × {exit.quantity} — {exit.reason}{exit.targetVehiclePlate ? ` · ${exit.targetVehiclePlate}` : ''}{exit.targetOrderId ? ` · ${exit.targetOrderId}` : ''}</span>
                <span className="text-slate-400">{fmtDate(exit.date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <StockItemFormModal
          item={editItem}
          onSave={handleSave}
          onDelete={editItem ? () => handleDelete(editItem.id) : undefined}
          onClose={() => { setShowForm(false); setEditId(''); }}
        />
      )}

      {exitItem && (
        <StockExitFormModal
          item={exitItem}
          vehicles={vehicles}
          orders={orders}
          onSave={(exit) => { addStockExit(exit); setExitItemId(''); }}
          onClose={() => setExitItemId('')}
        />
      )}
    </div>
  );
}

function StockItemFormModal({ item, onSave, onDelete, onClose }: {
  item?: StockItem;
  onSave: (data: Omit<StockItem, 'id'>, id?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [f, setF, clearDraft] = usePersistedState<Omit<StockItem, 'id'>>(`fleetgest_draft_piece_${item?.id ?? 'new'}`, item ? { ...item } : {
    name: '', ref: '', category: '', quantity: 0, minLevel: 1, unitPrice: 0, supplier: '', location: '', lastEntry: new Date().toISOString().slice(0, 10),
  });
  const up = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.ref.trim()) return;
    clearDraft();
    onSave(f, item?.id);
  };
  const handleCancel = () => { clearDraft(); onClose(); };
  const level = stockLevelOf(Number(f.quantity), Number(f.minLevel));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{item ? 'Modifier la pièce' : 'Nouvelle pièce'}</h3>
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          <label className="col-span-2 block text-xs font-medium text-slate-600">Désignation<input required value={f.name} onChange={e => up('name', e.target.value)} placeholder="Ex. Filtre à huile" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Référence (SKU)<input required value={f.ref} onChange={e => up('ref', e.target.value)} placeholder="Ex. FH-204" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Catégorie
            <SelectWithOther value={f.category} onChange={(v) => up('category', v)} options={['Filtration', 'Freinage', 'Lubrifiants', 'Pneumatiques', 'Électricité', 'Carrosserie', 'Moteur']} otherPlaceholder="Préciser la catégorie…" />
          </label>
          <label className="block text-xs font-medium text-slate-600">Quantité en stock<input type="number" min="0" required value={f.quantity} onChange={e => up('quantity', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Seuil minimum<input type="number" min="0" required value={f.minLevel} onChange={e => up('minLevel', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Prix unitaire (FCFA)<input type="number" min="0" required value={f.unitPrice} onChange={e => up('unitPrice', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Fournisseur<input value={f.supplier} onChange={e => up('supplier', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Emplacement<input value={f.location} onChange={e => up('location', e.target.value)} placeholder="Ex. Étagère A-12" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <div className="col-span-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <AlertTriangle className={`h-4 w-4 ${level === 'critique' ? 'text-red-500' : level === 'bas' ? 'text-amber-500' : 'text-green-500'}`} />
            Niveau calculé automatiquement : <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LEVEL_COLORS[level]}`}>{level}</span>
          </div>

          <div className="col-span-2 flex items-center justify-between border-t pt-4">
            {onDelete ? <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer</button> : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={handleCancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{item ? 'Mettre à jour' : 'Enregistrer'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockExitFormModal({ item, vehicles, orders, onSave, onClose }: {
  item: StockItem;
  vehicles: { id: string; numero_immatriculation: string }[];
  orders: { id: string; status: string }[];
  onSave: (exit: StockExit) => void;
  onClose: () => void;
}) {
  const [f, setF, clearDraft] = usePersistedState(`fleetgest_draft_sortie_${item.id}`, {
    quantity: 1, reason: 'Sortie manuelle' as StockExit['reason'], targetVehiclePlate: '', targetOrderId: '', notes: '', date: new Date().toISOString().slice(0, 10),
  });
  const up = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.quantity || f.quantity > item.quantity) { alert(`La quantité doit être comprise entre 1 et ${item.quantity}.`); return; }
    clearDraft();
    onSave({
      id: 'S' + Date.now().toString().slice(-8), itemId: item.id, itemName: item.name, date: f.date, quantity: f.quantity,
      reason: f.reason, targetVehiclePlate: f.targetVehiclePlate || undefined, targetOrderId: f.targetOrderId || undefined, notes: f.notes,
    });
  };
  const handleCancel = () => { clearDraft(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">Sortie de stock — {item.name}</h3>
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 p-6">
          <p className="text-xs text-slate-400">Disponible : <strong className="text-slate-600">{item.quantity}</strong></p>
          <label className="block text-xs font-medium text-slate-600">Quantité<input type="number" min="1" max={item.quantity} required value={f.quantity} onChange={e => up('quantity', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Date<input type="date" required value={f.date} onChange={e => up('date', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Motif
            <select value={f.reason} onChange={e => up('reason', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {EXIT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Véhicule concerné (optionnel)
            <select value={f.targetVehiclePlate} onChange={e => up('targetVehiclePlate', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Aucun</option>
              {vehicles.map(v => <option key={v.id} value={v.numero_immatriculation}>{v.numero_immatriculation}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Ordre de réparation lié (optionnel)
            <select value={f.targetOrderId} onChange={e => up('targetOrderId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500">
              <option value="">Aucun</option>
              {orders.filter(o => o.status !== 'Terminé').map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Notes<textarea value={f.notes} onChange={e => up('notes', e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" /></label>
          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={handleCancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Confirmer la sortie</button>
          </div>
        </form>
      </div>
    </div>
  );
}
