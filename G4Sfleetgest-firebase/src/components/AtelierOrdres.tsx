import { useMemo, useState } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { RepairOrder, OrderStatus } from '../types/atelier';
import { ORDER_STATUSES, ORDER_PRIORITIES, minutesBetween, durationLabel } from '../types/atelier';
import SortToggleButton, { type SortDirection } from './SortToggleButton';
import { Plus, Printer, Search, Trash2, X, Clock } from 'lucide-react';

function fmtMoney(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }
function fmtDate(d?: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }

const STATUS_COLORS: Record<OrderStatus, string> = {
  'En attente': 'bg-red-100 text-red-700',
  'Planifié': 'bg-slate-100 text-slate-600',
  'En cours': 'bg-amber-100 text-amber-700',
  'À contrôler': 'bg-blue-100 text-blue-700',
  'Terminé': 'bg-green-100 text-green-700',
};

export default function AtelierOrdres() {
  const { vehicles, orders, mechanics, stockItems, addOrder, updateOrder, deleteOrder } = useVehicles();

  const [search, setSearch] = usePersistedState('fleetgest_filter_ordres_search', '');
  const [periodFrom, setPeriodFrom] = usePersistedState('fleetgest_filter_ordres_from', '');
  const [periodTo, setPeriodTo] = usePersistedState('fleetgest_filter_ordres_to', '');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [showForm, setShowForm] = usePersistedState('fleetgest_open_ordre_form', false);
  const [editOrderId, setEditOrderId] = usePersistedState('fleetgest_editing_ordre_id', '');
  const editOrder = useMemo(() => orders.find(o => o.id === editOrderId), [orders, editOrderId]);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [o.id, o.vehicleLabel, o.plate, o.issue, o.mechanic, o.status].some(f => f.toLowerCase().includes(q));
    const matchFrom = !periodFrom || o.startDate >= periodFrom;
    const matchTo = !periodTo || o.startDate <= periodTo;
    return matchSearch && matchFrom && matchTo;
  }).sort((a, b) => (sortDir === 'desc' ? 1 : -1) * (new Date(b.startDate).getTime() - new Date(a.startDate).getTime())), [orders, search, periodFrom, periodTo, sortDir]);

  const handleSave = (data: Omit<RepairOrder, 'id'>, id?: string) => {
    if (id) updateOrder({ ...data, id });
    else addOrder({ ...data, id: `OR-${2048 + orders.length + 1}` });
    setShowForm(false);
    setEditOrderId('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cet ordre de réparation ? Cette action est irréversible.')) return;
    deleteOrder(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gestion des interventions</p>
          <h2 className="text-2xl font-bold text-slate-900">Ordres de réparation</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un ordre, un véhicule, un mécanicien…" className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <span className="text-xs text-slate-400">au</span>
          <input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Imprimer"><Printer className="h-4 w-4" /></button>
          <button onClick={() => { setEditOrderId(''); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"><Plus className="h-4 w-4" /> Nouvel ordre</button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              {['Ordre / Véhicule', 'Intervention', 'Mécanicien', 'Période', 'Temps', 'Statut', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {h === 'Période' ? <span className="inline-flex items-center gap-2">{h}<SortToggleButton direction={sortDir} onToggle={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} /></span> : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? <tr><td colSpan={7} className="py-10 text-center text-slate-400">Aucun ordre ne correspond à votre recherche.</td></tr> :
              filtered.map(order => {
                const minutes = minutesBetween(order.startTime, order.endTime);
                return (
                  <tr key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => { setEditOrderId(order.id); setShowForm(true); }}>
                    <td className="px-4 py-3"><p className="text-sm font-bold text-slate-800">{order.id}</p><p className="text-xs text-slate-500">{order.vehicleLabel} — {order.plate}</p></td>
                    <td className="px-4 py-3 text-sm text-slate-700">{order.issue}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${order.initials === '--' ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-700'}`}>{order.initials}</span><span className="text-sm text-slate-600">{order.mechanic}</span></div></td>
                    <td className="px-4 py-3 text-sm text-slate-600">{fmtDate(order.startDate)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-400" />{minutes ? durationLabel(minutes) : 'À estimer'}</span></td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>{order.status}</span></td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{order.cost > 0 ? fmtMoney(order.cost) : '—'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <OrderFormModal
          order={editOrder}
          vehicles={vehicles}
          mechanics={mechanics}
          stockItems={stockItems}
          onSave={handleSave}
          onDelete={editOrder ? () => { handleDelete(editOrder.id); setShowForm(false); setEditOrderId(''); } : undefined}
          onClose={() => { setShowForm(false); setEditOrderId(''); }}
        />
      )}
    </div>
  );
}

export function OrderFormModal({ order, vehicles, mechanics, stockItems, onSave, onDelete, onClose }: {
  order?: RepairOrder;
  vehicles: { id: string; numero_immatriculation: string; marque: string; type_commercial: string }[];
  mechanics: { id: string; name: string; state: string }[];
  stockItems: { id: string; name: string; ref: string; quantity: number }[];
  onSave: (data: Omit<RepairOrder, 'id'>, id?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const draftKey = `fleetgest_draft_ordre_${order?.id ?? 'new'}`;
  const [f, setF, clearDraft] = usePersistedState<Omit<RepairOrder, 'id'>>(draftKey, order ? { ...order } : {
    vehicleId: vehicles[0]?.id || '', vehicleLabel: vehicles[0] ? `${vehicles[0].marque} ${vehicles[0].type_commercial}` : '', plate: vehicles[0]?.numero_immatriculation || '',
    issue: '', mechanic: 'À affecter', initials: '--', priority: 'Normale',
    startDate: new Date().toISOString().slice(0, 10), endDate: new Date().toISOString().slice(0, 10), startTime: '', endTime: '',
    status: 'En attente', cost: 0, parts: [],
  });
  const [addPartId, setAddPartId] = useState('');
  const [addPartQty, setAddPartQty] = useState(1);
  const up = (k: string, v: unknown) => setF(p => ({ ...p, [k]: v }));

  const handleVehicleChange = (vehicleId: string) => {
    const v = vehicles.find(x => x.id === vehicleId);
    setF(p => ({ ...p, vehicleId, vehicleLabel: v ? `${v.marque} ${v.type_commercial}` : p.vehicleLabel, plate: v?.numero_immatriculation || p.plate }));
  };

  const handleMechanicChange = (name: string) => {
    const initials = name === 'À affecter' ? '--' : name.split(' ').map(s => s[0]).join('').toUpperCase();
    setF(p => ({ ...p, mechanic: name, initials }));
  };

  const addPart = () => {
    const item = stockItems.find(s => s.id === addPartId);
    if (!item) return;
    if (item.quantity <= 0) { alert(`${item.name} est en rupture de stock.`); return; }
    setF(p => {
      const idx = p.parts.findIndex(part => part.itemId === addPartId);
      if (idx >= 0) {
        const next = [...p.parts];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + addPartQty };
        return { ...p, parts: next };
      }
      return { ...p, parts: [...p.parts, { itemId: addPartId, itemName: item.name, quantity: addPartQty }] };
    });
    setAddPartId('');
    setAddPartQty(1);
  };

  const removePart = (idx: number) => setF(p => ({ ...p, parts: p.parts.filter((_, i) => i !== idx) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.vehicleId || !f.issue.trim()) return;
    const minutes = minutesBetween(f.startTime, f.endTime);
    clearDraft();
    onSave({ ...f, }, order?.id);
    // duration is derived on the fly (minutesBetween) so nothing else to persist here
    void minutes;
  };

  const handleCancel = () => { clearDraft(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div><p className="text-xs font-semibold uppercase text-slate-400">{order ? 'Fiche détaillée' : 'Nouvelle intervention'}</p><h3 className="text-lg font-bold text-slate-900">{order ? order.id : 'Créer un ordre de réparation'}</h3></div>
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          <label className="block text-xs font-medium text-slate-600">Véhicule
            <select required value={f.vehicleId} onChange={e => handleVehicleChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="" disabled>Sélectionnez un véhicule</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.numero_immatriculation} — {v.marque} {v.type_commercial}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Mécanicien
            <select value={f.mechanic} onChange={e => handleMechanicChange(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="À affecter">À affecter</option>
              {mechanics.filter(m => m.state === 'Disponible' || m.name === f.mechanic).map(m => <option key={m.id} value={m.name}>{m.name}{m.state !== 'Disponible' ? ` (${m.state})` : ''}</option>)}
            </select>
          </label>
          <label className="col-span-2 block text-xs font-medium text-slate-600">Motif de l'intervention<input required value={f.issue} onChange={e => up('issue', e.target.value)} placeholder="Ex. Révision, panne, contrôle…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Coût (FCFA)<input type="number" min="0" value={f.cost} onChange={e => up('cost', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Priorité
            <select value={f.priority} onChange={e => up('priority', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              {ORDER_PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Date de début<input type="date" required value={f.startDate} onChange={e => up('startDate', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Date de fin<input type="date" required value={f.endDate} onChange={e => up('endDate', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Heure de début<input type="time" value={f.startTime} onChange={e => up('startTime', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Statut
            <select value={f.status} onChange={e => up('status', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          {f.status === 'Terminé' && (
            <label className="block text-xs font-medium text-slate-600">Heure de fin<input type="time" value={f.endTime} onChange={e => up('endTime', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          )}

          <div className="col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 flex items-center justify-between text-xs font-bold uppercase text-slate-500">Pièces à prélever du stock <span className="font-normal normal-case text-slate-400">défalquées à l'enregistrement</span></h4>
            <div className="space-y-1.5">
              {f.parts.map((part, idx) => {
                const item = stockItems.find(s => s.id === part.itemId);
                return (
                  <div key={`${part.itemId}-${idx}`} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                    <span className="flex-1"><code className="text-xs text-slate-400">{item?.ref ?? '—'}</code> <strong>{part.itemName}</strong> <em className="text-xs not-italic text-slate-400">Stock : {item?.quantity ?? 0}</em></span>
                    <span className="text-slate-500">× {part.quantity}</span>
                    <button type="button" onClick={() => removePart(idx)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
              {f.parts.length === 0 && <p className="text-xs text-slate-400">Aucune pièce ajoutée.</p>}
            </div>
            <div className="mt-2 flex gap-2">
              <select value={addPartId} onChange={e => setAddPartId(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs">
                <option value="">Ajouter une pièce…</option>
                {stockItems.filter(s => s.quantity > 0).map(s => <option key={s.id} value={s.id}>{s.ref} — {s.name} ({s.quantity} dispo.)</option>)}
              </select>
              <input type="number" min="1" value={addPartQty} onChange={e => setAddPartQty(Math.max(1, Number(e.target.value)))} className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
              <button type="button" onClick={addPart} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100">Ajouter</button>
            </div>
          </div>

          <div className="col-span-2 flex items-center justify-between border-t pt-4">
            {onDelete ? <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer</button> : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={handleCancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">{order ? 'Mettre à jour' : "Créer l'ordre"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
