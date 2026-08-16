import { useMemo } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { Mechanic, MechanicState } from '../types/atelier';
import SelectWithOther from './SelectWithOther';
import { Plus, Printer, Search, Trash2, X, Mail, Phone, Calendar } from 'lucide-react';

const STATE_COLORS: Record<MechanicState, string> = {
  'En intervention': 'bg-amber-100 text-amber-700',
  'Disponible': 'bg-green-100 text-green-700',
  'Pause': 'bg-blue-100 text-blue-700',
  'Absent': 'bg-slate-100 text-slate-500',
};

const MECHANIC_STATES: MechanicState[] = ['Disponible', 'En intervention', 'Pause', 'Absent'];
const PALETTE = ['#e7b783', '#a8c2bf', '#c4b5d4', '#e7c7a3', '#b8d4c8', '#f2a6a6', '#a6c8f2', '#d4c4a6'];

function fmtDate(d?: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function AtelierMecaniciens() {
  const { mechanics, orders, addMechanic, updateMechanic, deleteMechanic } = useVehicles();
  const [search, setSearch] = usePersistedState('fleetgest_filter_mecaniciens_search', '');
  const [showForm, setShowForm] = usePersistedState('fleetgest_open_mecanicien_form', false);
  const [editId, setEditId] = usePersistedState('fleetgest_editing_mecanicien_id', '');
  const editMechanic = useMemo(() => mechanics.find(m => m.id === editId), [mechanics, editId]);

  // Nombre d'ordres actifs par mécanicien, pour donner du contexte sur la carte.
  const activeOrdersByMechanic = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => { if (o.status !== 'Terminé' && o.status !== 'Planifié' && o.mechanic !== 'À affecter') map.set(o.mechanic, (map.get(o.mechanic) || 0) + 1); });
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mechanics;
    return mechanics.filter(m => [m.name, m.role, m.email, ...m.specialties].some(f => f.toLowerCase().includes(q)));
  }, [mechanics, search]);

  const handleSave = (data: Omit<Mechanic, 'id'>, id?: string) => {
    if (id) updateMechanic(id, data);
    else addMechanic({ ...data, id: 'M' + String(mechanics.length + 1).padStart(3, '0') + Date.now().toString().slice(-4) });
    setShowForm(false);
    setEditId('');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce mécanicien ? Cette action est irréversible.')) return;
    deleteMechanic(id);
    setShowForm(false);
    setEditId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Gestion des ressources humaines</p>
          <h2 className="text-2xl font-bold text-slate-900">Mécaniciens</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un mécanicien, un rôle, une spécialité…" className="w-72 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          </div>
          <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Imprimer"><Printer className="h-4 w-4" /></button>
          <button onClick={() => { setEditId(''); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"><Plus className="h-4 w-4" /> Nouveau mécanicien</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">Aucun mécanicien ne correspond à votre recherche.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map(m => (
            <div key={m.id} onClick={() => { setEditId(m.id); setShowForm(true); }} className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-brand-300">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-slate-700" style={{ background: m.color }}>{m.initials}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATE_COLORS[m.state]}`}>{m.state}</span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-900">{m.name}</p>
              <p className="text-xs text-slate-500">{m.role}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {m.specialties.map(s => <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{s}</span>)}
              </div>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 flex-shrink-0" />{m.email || '—'}</p>
                <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 flex-shrink-0" />{m.phone || '—'}</p>
                <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3 flex-shrink-0" />Depuis le {fmtDate(m.startDate)}</p>
              </div>
              {(activeOrdersByMechanic.get(m.name) ?? 0) > 0 && (
                <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-center text-[11px] font-medium text-amber-700">{activeOrdersByMechanic.get(m.name)} ordre(s) en cours</p>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <MechanicFormModal
          mechanic={editMechanic}
          onSave={handleSave}
          onDelete={editMechanic ? () => handleDelete(editMechanic.id) : undefined}
          onClose={() => { setShowForm(false); setEditId(''); }}
        />
      )}
    </div>
  );
}

function MechanicFormModal({ mechanic, onSave, onDelete, onClose }: {
  mechanic?: Mechanic;
  onSave: (data: Omit<Mechanic, 'id'>, id?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [f, setF, clearDraft] = usePersistedState<Omit<Mechanic, 'id'> & { specialtiesText: string }>(
    `fleetgest_draft_mecanicien_${mechanic?.id ?? 'new'}`,
    mechanic ? { ...mechanic, specialtiesText: mechanic.specialties.join(', ') } : {
      name: '', role: '', initials: '', color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      state: 'Disponible', email: '', phone: '', specialties: [], specialtiesText: '', startDate: new Date().toISOString().slice(0, 10),
    }
  );
  const up = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    const initials = f.name.trim().split(/\s+/).map(s => s[0]).join('').toUpperCase().slice(0, 2);
    const specialties = f.specialtiesText.split(',').map(s => s.trim()).filter(Boolean);
    clearDraft();
    onSave({ name: f.name, role: f.role, initials, color: f.color, state: f.state, email: f.email, phone: f.phone, specialties, startDate: f.startDate }, mechanic?.id);
  };

  const handleCancel = () => { clearDraft(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">{mechanic ? 'Modifier le mécanicien' : 'Nouveau mécanicien'}</h3>
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          <label className="col-span-2 block text-xs font-medium text-slate-600">Nom complet<input required value={f.name} onChange={e => up('name', e.target.value)} placeholder="Ex. Alex Morel" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Rôle / spécialité principale<input required value={f.role} onChange={e => up('role', e.target.value)} placeholder="Ex. Mécanicien expert" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Statut
            <select value={f.state} onChange={e => up('state', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              {MECHANIC_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">E-mail<input type="email" value={f.email} onChange={e => up('email', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Téléphone<input value={f.phone} onChange={e => up('phone', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="col-span-2 block text-xs font-medium text-slate-600">Spécialités (séparées par des virgules)<input value={f.specialtiesText} onChange={e => up('specialtiesText', e.target.value)} placeholder="Ex. Moteur diesel, Freinage" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Date d'embauche<input type="date" value={f.startDate} onChange={e => up('startDate', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Couleur de l'avatar
            <SelectWithOther value={f.color} onChange={(v) => up('color', v)} options={PALETTE} otherPlaceholder="Code couleur (#rrggbb)…" />
          </label>

          <div className="col-span-2 flex items-center justify-between border-t pt-4">
            {onDelete ? <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Supprimer</button> : <span />}
            <div className="flex gap-3">
              <button type="button" onClick={handleCancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
              <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">{mechanic ? 'Mettre à jour' : 'Enregistrer'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
