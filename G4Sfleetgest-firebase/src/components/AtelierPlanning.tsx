import { useMemo } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { RepairOrder, OrderStatus } from '../types/atelier';
import { Plus, Printer, Clock } from 'lucide-react';
import { OrderFormModal } from './AtelierOrdres';

const STATUS_COLORS: Record<OrderStatus, string> = {
  'En attente': 'bg-red-100 text-red-700',
  'Planifié': 'bg-slate-100 text-slate-600',
  'En cours': 'bg-amber-100 text-amber-700',
  'À contrôler': 'bg-blue-100 text-blue-700',
  'Terminé': 'bg-green-100 text-green-700',
};

function pad(n: number) { return String(n).padStart(2, '0'); }
function toISO(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

/** Semaine en cours, du lundi au samedi (comme dans l'application d'origine). */
function currentWeekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return { from: toISO(monday), to: toISO(saturday) };
}

export default function AtelierPlanning() {
  const { vehicles, orders, mechanics, stockItems, addOrder, updateOrder, deleteOrder } = useVehicles();
  const [period, setPeriod] = usePersistedState('fleetgest_planning_period', currentWeekRange());
  const [showForm, setShowForm] = usePersistedState('fleetgest_open_planning_form', false);
  const [editOrderId, setEditOrderId] = usePersistedState('fleetgest_editing_planning_ordre_id', '');
  const editOrder = useMemo(() => orders.find(o => o.id === editOrderId), [orders, editOrderId]);

  const days = useMemo(() => {
    const result: string[] = [];
    const start = new Date(period.from);
    const end = new Date(period.to);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return result;
    // Sécurité : on ne rend jamais plus de 14 colonnes (au-delà, ajustez la période).
    for (let d = new Date(start); d <= end && result.length < 14; d.setDate(d.getDate() + 1)) {
      result.push(toISO(d));
    }
    return result;
  }, [period]);

  const ordersByDay = useMemo(() => {
    const map = new Map<string, RepairOrder[]>();
    days.forEach(d => map.set(d, []));
    orders.forEach(o => { if (map.has(o.startDate)) map.get(o.startDate)!.push(o); });
    map.forEach(list => list.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [orders, days]);

  const handleSave = (data: Omit<RepairOrder, 'id'>, id?: string) => {
    if (id) updateOrder({ ...data, id });
    else addOrder({ ...data, id: `OR-${2048 + orders.length + 1}` });
    setShowForm(false);
    setEditOrderId('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cet ordre de réparation ? Cette action est irréversible.')) return;
    deleteOrder(id);
    setShowForm(false);
    setEditOrderId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Planification des interventions</p>
          <h2 className="text-2xl font-bold text-slate-900">Planning atelier</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Du</span>
          <input type="date" value={period.from} onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <span className="text-xs text-slate-400">Au</span>
          <input type="date" value={period.to} onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))} className="rounded-lg border border-slate-300 px-2 py-2 text-sm" />
          <button onClick={() => setPeriod(currentWeekRange())} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Semaine en cours</button>
          <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Imprimer"><Printer className="h-4 w-4" /></button>
          <button onClick={() => { setEditOrderId(''); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nouveau</button>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">Période invalide — vérifiez les dates "Du" / "Au".</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {days.map(day => {
            const list = ordersByDay.get(day) ?? [];
            const label = new Date(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
            return (
              <div key={day} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold capitalize text-slate-800">{label}</p>
                <p className="mb-3 text-[11px] text-slate-400">{list.length} intervention{list.length > 1 ? 's' : ''}</p>
                {list.length === 0 ? (
                  <button onClick={() => { setEditOrderId(''); setShowForm(true); }} className="w-full rounded-lg border border-dashed border-slate-200 py-6 text-xs text-slate-400 hover:border-emerald-300 hover:text-emerald-600">Aucune intervention</button>
                ) : (
                  <div className="space-y-2">
                    {list.map(order => (
                      <button key={order.id} onClick={() => { setEditOrderId(order.id); setShowForm(true); }} className="block w-full rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition hover:border-emerald-300 hover:bg-emerald-50">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-800">{order.id}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-600">{order.vehicleLabel} — {order.plate}</p>
                        <p className="truncate text-[11px] text-slate-400">{order.issue}</p>
                        {order.startTime && <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><Clock className="h-3 w-3" />{order.startTime}{order.endTime ? `–${order.endTime}` : ''}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <OrderFormModal
          order={editOrder}
          vehicles={vehicles}
          mechanics={mechanics}
          stockItems={stockItems}
          onSave={handleSave}
          onDelete={editOrder ? () => handleDelete(editOrder.id) : undefined}
          onClose={() => { setShowForm(false); setEditOrderId(''); }}
        />
      )}
    </div>
  );
}
