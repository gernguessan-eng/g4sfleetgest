import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { MaintenanceRecord } from '../types';
import { MAINTENANCE_TYPES, MAINTENANCE_STATUTS } from '../types';
import SelectWithOther from './SelectWithOther';
import SortToggleButton, { type SortDirection } from './SortToggleButton';
import {
  Wrench, Plus, Printer, Search, Trash2, Pencil, X, Info,
  Clock, Hammer, AlertTriangle, LayoutGrid, ClipboardList, CalendarDays, Users, Boxes, UserCheck,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import AtelierOrdres from './AtelierOrdres';
import AtelierPlanning from './AtelierPlanning';
import AtelierMecaniciens from './AtelierMecaniciens';
import AtelierStocks from './AtelierStocks';
import AtelierPresences from './AtelierPresences';

function fmtDate(d?: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }
function fmtMoney(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

function daysBetween(start: string, end?: string) {
  if (!start) return 0;
  const e = end ? new Date(end) : new Date();
  return Math.max(0, Math.ceil((e.getTime() - new Date(start).getTime()) / 86400000));
}

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

const STATUT_COLORS: Record<string, string> = {
  'En cours': 'bg-amber-100 text-amber-700',
  'Terminé': 'bg-green-100 text-green-700',
};

const ATELIER_TABS = [
  { key: 'vue', label: "Vue d'ensemble", icon: LayoutGrid },
  { key: 'ordres', label: 'Ordres de réparation', icon: ClipboardList },
  { key: 'planning', label: 'Planning atelier', icon: CalendarDays },
  { key: 'mecaniciens', label: 'Mécaniciens', icon: Users },
  { key: 'stocks', label: 'Stocks', icon: Boxes },
  { key: 'presences', label: 'Présences', icon: UserCheck },
] as const;

type AtelierTabKey = typeof ATELIER_TABS[number]['key'];

export default function Maintenance() {
  const [tab, setTab] = usePersistedState<AtelierTabKey>('fleetgest_maintenance_tab', 'vue');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-white p-1.5 shadow-sm print:hidden">
        {ATELIER_TABS.map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TabIcon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'vue' && <VueEnsembleAtelier />}
      {tab === 'ordres' && <AtelierOrdres />}
      {tab === 'planning' && <AtelierPlanning />}
      {tab === 'mecaniciens' && <AtelierMecaniciens />}
      {tab === 'stocks' && <AtelierStocks />}
      {tab === 'presences' && <AtelierPresences />}
    </div>
  );
}

function VueEnsembleAtelier() {
  // Source unique de vérité : le store central. La liste des véhicules n'est
  // jamais dupliquée ici — on réutilise directement celle du menu Véhicules.
  const { vehicles, maintenanceRecords, addMaintenanceRecord, updateMaintenanceRecord, deleteMaintenanceRecord } = useVehicles();
  const vehicleById = useMemo(() => new Map(vehicles.map(v => [v.id, v])), [vehicles]);

  const [showForm, setShowForm] = usePersistedState('fleetgest_open_maintenance_form', false);
  const [editRecordId, setEditRecordId] = usePersistedState('fleetgest_editing_maintenance_id', '');
  const editRecord = useMemo(() => maintenanceRecords.find(m => m.id === editRecordId), [maintenanceRecords, editRecordId]);

  const [search, setSearch] = usePersistedState('fleetgest_filter_maintenance_search', '');
  const [filterVehicle, setFilterVehicle] = usePersistedState('fleetgest_filter_maintenance_vehicle', '');
  const [filterType, setFilterType] = usePersistedState('fleetgest_filter_maintenance_type', '');
  const [filterStatut, setFilterStatut] = usePersistedState('fleetgest_filter_maintenance_statut', '');
  const [periodFrom, setPeriodFrom] = usePersistedState('fleetgest_filter_maintenance_from', '');
  const [periodTo, setPeriodTo] = usePersistedState('fleetgest_filter_maintenance_to', '');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  // Véhicules actuellement en atelier — le cœur du menu.
  const enAtelier = useMemo(
    () => maintenanceRecords.filter(m => m.statut === 'En cours').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [maintenanceRecords]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return maintenanceRecords.filter(m => {
      const v = vehicleById.get(m.vehicleId);
      const matchSearch = !q || m.type.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || (v?.numero_immatriculation.toLowerCase().includes(q) ?? false);
      const matchVeh = !filterVehicle || m.vehicleId === filterVehicle;
      const matchType = !filterType || m.type === filterType;
      const matchStatut = !filterStatut || (m.statut ?? 'Terminé') === filterStatut;
      const matchFrom = !periodFrom || m.date >= periodFrom;
      const matchTo = !periodTo || m.date <= periodTo;
      return matchSearch && matchVeh && matchType && matchStatut && matchFrom && matchTo;
    }).sort((a, b) => (sortDir === 'desc' ? 1 : -1) * (new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [maintenanceRecords, search, filterVehicle, filterType, filterStatut, periodFrom, periodTo, sortDir, vehicleById]);

  const stats = useMemo(() => {
    const vehiculesEnAtelier = new Set(enAtelier.map(m => m.vehicleId)).size;
    const total = maintenanceRecords.length;
    const coutTotal = maintenanceRecords.reduce((s, m) => s + m.cout, 0);
    const termines = maintenanceRecords.filter(m => (m.statut ?? 'Terminé') === 'Terminé' && m.date_sortie_reelle);
    const dureeMoyenne = termines.length > 0
      ? Math.round(termines.reduce((s, m) => s + daysBetween(m.date, m.date_sortie_reelle), 0) / termines.length)
      : 0;

    const typeCounts: Record<string, number> = {};
    maintenanceRecords.forEach(m => { typeCounts[m.type] = (typeCounts[m.type] || 0) + 1; });
    const typeDistribution = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));

    const monthMap = new Map<string, number>();
    maintenanceRecords.forEach(m => { if (!m.date) return; const key = m.date.slice(0, 7); monthMap.set(key, (monthMap.get(key) || 0) + m.cout); });
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthlyEvolution = Array.from(monthMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
      .map(([key, value]) => { const [y, mo] = key.split('-'); return { name: `${labels[Number(mo) - 1]} ${y.slice(-2)}`, value }; });

    return { vehiculesEnAtelier, total, coutTotal, dureeMoyenne, typeDistribution, monthlyEvolution };
  }, [maintenanceRecords, enAtelier]);

  const handleSave = (data: Omit<MaintenanceRecord, 'id'>, id?: string) => {
    if (id) updateMaintenanceRecord(id, data);
    else addMaintenanceRecord({ ...data, id: 'm' + Date.now() });
    setShowForm(false); setEditRecordId('');
    // Le véhicule concerné passe automatiquement en "En maintenance" tant qu'une
    // intervention est "En cours", et repasse "Actif" une fois "Terminé" (et sans
    // autre dossier actif) — cf. menu Véhicules, mise à jour automatique via le
    // store central, aucune action requise ici.
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette intervention ? Cette action est irréversible.')) return;
    deleteMaintenanceRecord(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-white p-6 shadow-sm print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Maintenance</h2>
          <p className="mt-1 text-sm text-slate-500">Suivi des véhicules en atelier et historique des interventions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditRecordId(''); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"><Plus className="h-4 w-4" /> Nouvelle intervention</button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"><Printer className="h-4 w-4" /> Imprimer</button>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800 print:hidden">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>Un véhicule ayant une intervention « En cours » passe automatiquement au statut <strong>En maintenance</strong> dans le menu Véhicules ; il repasse « Actif » dès que l'intervention est marquée <strong>Terminé</strong> (et qu'aucun autre dossier actif — immobilisation, sinistre — ne le concerne).</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase text-slate-500">Véhicules en atelier</p><p className="mt-1 text-2xl font-bold text-amber-600">{stats.vehiculesEnAtelier}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase text-slate-500">Interventions totales</p><p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase text-slate-500">Durée moy. atelier (jours)</p><p className="mt-1 text-2xl font-bold text-blue-600">{stats.dureeMoyenne}</p></div>
        <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-[10px] uppercase text-slate-500">Coût total</p><p className="mt-1 text-2xl font-bold text-slate-900">{fmtMoney(stats.coutTotal)}</p></div>
      </div>

      {/* Véhicules actuellement en atelier */}
      <div className="rounded-xl border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
          <Hammer className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-bold text-amber-800">Véhicules actuellement en atelier ({enAtelier.length})</h3>
        </div>
        {enAtelier.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-400">Aucun véhicule en atelier actuellement.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {enAtelier.map(m => {
              const v = vehicleById.get(m.vehicleId);
              const jours = daysBetween(m.date, undefined);
              const depassement = m.date_sortie_prevue && new Date() > new Date(m.date_sortie_prevue);
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-4 px-5 py-3">
                  <div className="min-w-[110px]">
                    {v ? <Link to={`/vehicule/${v.id}`} className="font-semibold text-brand-600 hover:text-brand-700">{v.numero_immatriculation}</Link> : <span className="text-slate-400">Supprimé</span>}
                    <p className="text-[10px] text-slate-500">{v?.marque} {v?.type_commercial}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{m.type}</span>
                  <p className="max-w-[240px] flex-1 truncate text-xs text-slate-500" title={m.description}>{m.description || '—'}</p>
                  <div className="flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" /> Entré le {fmtDate(m.date)}</div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${depassement ? 'text-red-600' : 'text-slate-700'}`}>
                    {jours} j en atelier {depassement && <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>
                  {m.date_sortie_prevue && <p className="text-xs text-slate-400">Sortie prévue : {fmtDate(m.date_sortie_prevue)}</p>}
                  <button onClick={() => { setEditRecordId(m.id); setShowForm(true); }} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                    <Pencil className="h-3.5 w-3.5" /> Mettre à jour
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-700">Répartition par type d'intervention</h3>
          {stats.typeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}>
                  {stats.typeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">Aucune intervention</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold text-slate-700">Coût mensuel</h3>
          {stats.monthlyEvolution.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.monthlyEvolution}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v) => fmtMoney(Number(v))} />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 9, fontWeight: 'bold' }} formatter={(v: React.ReactNode) => (Number(v) / 1000).toFixed(0) + 'K'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-400">Aucune intervention</p>}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3 print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher véhicule, type, description…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <label className="block text-xs font-medium text-slate-600">Véhicule
          <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tous</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.numero_immatriculation}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">Type
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tous</option>
            {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">Statut
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Tous</option>
            {MAINTENANCE_STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-600">Du<input type="date" value={periodFrom} onChange={e => setPeriodFrom(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className="block text-xs font-medium text-slate-600">Au<input type="date" value={periodTo} onChange={e => setPeriodTo(e.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50"><tr>
              {['Véhicule', 'Type', 'Description', 'Date', 'Km', 'Coût', 'Statut', ''].map(h => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {h === 'Date' ? <span className="inline-flex items-center gap-2">{h}<SortToggleButton direction={sortDir} onToggle={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} /></span> : h}
                </th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-slate-400">Aucune intervention trouvée</td></tr> :
                filtered.map(m => {
                  const v = vehicleById.get(m.vehicleId);
                  const statut = m.statut ?? 'Terminé';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-semibold text-brand-600">{v ? <Link to={`/vehicule/${v.id}`} className="hover:text-brand-700">{v.numero_immatriculation}</Link> : '—'}</td>
                      <td className="px-3 py-2 text-xs font-medium">{m.type}</td>
                      <td className="px-3 py-2 text-xs max-w-[220px] truncate" title={m.description}>{m.description || '—'}</td>
                      <td className="px-3 py-2 text-xs">{fmtDate(m.date)}</td>
                      <td className="px-3 py-2 text-xs">{m.kilometrage ? m.kilometrage.toLocaleString('fr-FR') + ' km' : '—'}</td>
                      <td className="px-3 py-2 text-xs font-semibold">{fmtMoney(m.cout)}</td>
                      <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUT_COLORS[statut]}`}>{statut}</span></td>
                      <td className="px-3 py-2 print:hidden">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditRecordId(m.id); setShowForm(true); }} className="p-1 text-slate-400 hover:text-blue-600" title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(m.id)} className="p-1 text-slate-400 hover:text-red-600" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <MaintenanceFormModal record={editRecord} vehicles={vehicles} onSave={handleSave} onClose={() => { setShowForm(false); setEditRecordId(''); }} />}
    </div>
  );
}

function MaintenanceFormModal({ record, vehicles, onSave, onClose }: {
  record?: MaintenanceRecord;
  vehicles: { id: string; numero_immatriculation: string }[];
  onSave: (data: Omit<MaintenanceRecord, 'id'>, id?: string) => void;
  onClose: () => void;
}) {
  const [f, setF, clearDraft] = usePersistedState(`fleetgest_draft_maintenance_${record?.id ?? 'new'}`, {
    vehicleId: record?.vehicleId || vehicles[0]?.id || '',
    date: record?.date || new Date().toISOString().slice(0, 10),
    type: record?.type || MAINTENANCE_TYPES[0],
    description: record?.description || '',
    cout: record?.cout || 0,
    kilometrage: record?.kilometrage || 0,
    statut: (record?.statut || 'En cours') as MaintenanceRecord['statut'],
    date_sortie_prevue: record?.date_sortie_prevue || '',
    date_sortie_reelle: record?.date_sortie_reelle || '',
  });
  const up = (k: string, v: string | number) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearDraft();
    onSave(f, record?.id);
  };

  const handleCancel = () => { clearDraft(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="flex items-center gap-2 text-lg font-bold"><Wrench className="h-5 w-5 text-brand-600" /> {record ? "Modifier l'intervention" : 'Nouvelle intervention'}</h3>
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 p-6">
          <label className="block text-xs font-medium text-slate-600">Véhicule
            <select value={f.vehicleId} onChange={e => up('vehicleId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.numero_immatriculation}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Type d'intervention
            <SelectWithOther
              value={f.type}
              onChange={(v) => up('type', v)}
              options={MAINTENANCE_TYPES.filter(t => t !== 'Autre')}
              otherPlaceholder="Préciser le type d'intervention…"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">Date d'entrée en atelier<input type="date" required value={f.date} onChange={e => up('date', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Kilométrage<input type="number" min="0" value={f.kilometrage} onChange={e => up('kilometrage', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="col-span-2 block text-xs font-medium text-slate-600">Description<textarea value={f.description} onChange={e => up('description', e.target.value)} rows={2} placeholder="Détail des travaux…" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Statut
            <select value={f.statut} onChange={e => up('statut', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
              {MAINTENANCE_STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">Coût (FCFA)<input type="number" min="0" value={f.cout} onChange={e => up('cout', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Date de sortie prévue<input type="date" value={f.date_sortie_prevue} onChange={e => up('date_sortie_prevue', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <label className="block text-xs font-medium text-slate-600">Date de sortie réelle<input type="date" value={f.date_sortie_reelle} onChange={e => up('date_sortie_reelle', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" /></label>
          <div className="col-span-2 flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={handleCancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700">{record ? 'Mettre à jour' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
