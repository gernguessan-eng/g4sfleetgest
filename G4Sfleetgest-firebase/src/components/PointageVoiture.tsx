import { useMemo, useState } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { VoitureFiche, ChecklistAnswer, DefaillanceRow, NiveauCarburant, CrewMember } from '../types/pointage';
import { VOITURE_CHECKLIST_COLUMNS, NIVEAU_CARBURANT_OPTIONS, emptyVoitureFiche } from '../types/pointage';
import ChecklistGrid from './ChecklistGrid';
import DefaillancesTable from './DefaillancesTable';
import SortToggleButton, { type SortDirection } from './SortToggleButton';
import { Plus, Printer, Search, Trash2, Pencil, X, Eye, AlertTriangle } from 'lucide-react';

function fmtDate(d?: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function PointageVoiture() {
  const { vehicles, voitureFiches, addVoitureFiche, updateVoitureFiche, deleteVoitureFiche } = useVehicles();
  const vehicleById = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);
  const voitures = useMemo(() => vehicles.filter((v) => v.genre !== 'Moto'), [vehicles]);

  const [search, setSearch] = usePersistedState('fleetgest_filter_pointage_voiture_search', '');
  const [periodFrom, setPeriodFrom] = usePersistedState('fleetgest_filter_pointage_voiture_from', '');
  const [periodTo, setPeriodTo] = usePersistedState('fleetgest_filter_pointage_voiture_to', '');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [showForm, setShowForm] = usePersistedState('fleetgest_open_pointage_voiture_form', false);
  const [editId, setEditId] = usePersistedState('fleetgest_editing_pointage_voiture_id', '');
  const [viewId, setViewId] = useState('');
  const editFiche = useMemo(() => voitureFiches.find((f) => f.id === editId), [voitureFiches, editId]);
  const viewFiche = useMemo(() => voitureFiches.find((f) => f.id === viewId), [voitureFiches, viewId]);

  const filtered = useMemo(() => voitureFiches.filter((f) => {
    const v = vehicleById.get(f.vehicleId);
    const text = `${f.numero} ${f.pilote.nom} ${f.pilote.matricule} ${f.copilote1.nom} ${f.copilote2.nom} ${v?.numero_immatriculation ?? ''} ${f.date} ${f.periode} ${Object.values(f.reponses).join(' ')} ${f.defaillances.map((d) => d.defaillance).join(' ')}`.toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchFrom = !periodFrom || f.date >= periodFrom;
    const matchTo = !periodTo || f.date <= periodTo;
    return matchSearch && matchFrom && matchTo;
  }).sort((a, b) => (sortDir === 'desc' ? 1 : -1) * (new Date(b.date).getTime() - new Date(a.date).getTime())), [voitureFiches, vehicleById, search, periodFrom, periodTo, sortDir]);

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette fiche de pointage ? Cette action est irréversible.')) return;
    deleteVoitureFiche(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contrôle journalier</p>
          <h2 className="text-lg font-bold text-slate-800">Pointage Voiture</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N°, pilote, matricule, plaque, contrôle…" className="w-72 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none" /></div>
          <input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-xs" />
          <span className="text-xs text-slate-400">→</span>
          <input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-xs" />
          <button onClick={() => { setEditId(''); setShowForm(true); }} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Plus className="h-4 w-4" /> Nouvelle fiche</button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              {['Numéro', 'Date', 'Période', 'Véhicule', 'Pilote', 'État', 'Défaillances', ''].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {h === 'Date' ? <span className="inline-flex items-center gap-2">{h}<SortToggleButton direction={sortDir} onToggle={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))} /></span> : h}
                </th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? <tr><td colSpan={8} className="py-10 text-center text-slate-400">Aucune fiche trouvée</td></tr> : filtered.map((f) => {
                const v = vehicleById.get(f.vehicleId);
                const defCount = f.defaillances.filter((d) => d.defaillance.trim()).length;
                return (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-700">EQUIPAGE-{f.numero}</td>
                    <td className="px-3 py-2 text-xs">{fmtDate(f.date)}</td>
                    <td className="px-3 py-2 text-xs">{f.periode}</td>
                    <td className="px-3 py-2 text-xs font-medium text-emerald-600">{v?.numero_immatriculation || '—'}</td>
                    <td className="px-3 py-2 text-xs">{f.pilote.nom || '—'}</td>
                    <td className="px-3 py-2">
                      {f.etat_roulage ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${f.etat_roulage === 'Oui' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{f.etat_roulage === 'Oui' ? 'Roulant' : 'Hors service'}</span> : <span className="text-xs text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2">{defCount > 0 ? <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><AlertTriangle className="h-3 w-3" />{defCount}</span> : <span className="text-xs text-slate-300">0</span>}</td>
                    <td className="px-3 py-2"><div className="flex justify-end gap-1">
                      <button onClick={() => setViewId(f.id)} className="p-1 text-slate-400 hover:text-blue-600" title="Voir / imprimer"><Eye className="h-3.5 w-3.5" /></button>
                      <button onClick={() => { setEditId(f.id); setShowForm(true); }} className="p-1 text-slate-400 hover:text-amber-600" title="Modifier"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-1 text-slate-400 hover:text-red-600" title="Supprimer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <VoitureFicheFormModal
          fiche={editFiche}
          voitures={voitures}
          onSave={(data, id) => { if (id) updateVoitureFiche(id, data); else addVoitureFiche(data); setShowForm(false); setEditId(''); }}
          onClose={() => { setShowForm(false); setEditId(''); }}
        />
      )}

      {viewFiche && <VoitureFichePrintView fiche={viewFiche} vehicle={vehicleById.get(viewFiche.vehicleId)} onClose={() => setViewId('')} />}
    </div>
  );
}

function CrewFields({ label, value, onChange }: { label: string; value: CrewMember; onChange: (v: CrewMember) => void }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input value={value.nom} onChange={(e) => onChange({ ...value, nom: e.target.value })} placeholder="Nom" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={value.matricule} onChange={(e) => onChange({ ...value, matricule: e.target.value })} placeholder="Matricule" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={value.signature} onChange={(e) => onChange({ ...value, signature: e.target.value })} placeholder="Signature (nom du signataire)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
    </div>
  );
}

function VoitureFicheFormModal({ fiche, voitures, onSave, onClose }: {
  fiche?: VoitureFiche;
  voitures: { id: string; numero_immatriculation: string; marque: string; type_commercial: string }[];
  onSave: (data: Omit<VoitureFiche, 'id' | 'numero' | 'createdAt'>, id?: string) => void;
  onClose: () => void;
}) {
  const [f, setF, clearDraft] = usePersistedState(`fleetgest_draft_pointage_voiture_${fiche?.id ?? 'new'}`, fiche ? { ...fiche } : emptyVoitureFiche(voitures[0]?.id));
  const up = (k: string, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  const setReponse = (key: string, value: ChecklistAnswer) => setF((p) => ({ ...p, reponses: { ...p.reponses, [key]: value } }));
  const setDefaillances = (rows: DefaillanceRow[]) => setF((p) => ({ ...p, defaillances: rows }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.vehicleId) { alert('Veuillez sélectionner un véhicule.'); return; }
    if (!f.pilote.nom.trim()) { alert('Veuillez renseigner le nom du pilote.'); return; }
    clearDraft();
    onSave(f, fiche?.id);
  };
  const handleCancel = () => { clearDraft(); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h3 className="text-lg font-bold">{fiche ? `Modifier la fiche EQUIPAGE-${fiche.numero}` : 'Nouvelle fiche de pointage Voiture'}</h3>
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="block text-xs font-medium text-slate-600">Véhicule
              <select required value={f.vehicleId} onChange={(e) => up('vehicleId', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="" disabled>Sélectionner…</option>
                {voitures.map((v) => <option key={v.id} value={v.id}>{v.numero_immatriculation} — {v.marque} {v.type_commercial}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">Date<input type="date" required value={f.date} onChange={(e) => up('date', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Période
              <select value={f.periode} onChange={(e) => up('periode', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="Matin">Matin</option>
                <option value="Soir">Soir</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-slate-600">Prochaine révision<input type="date" value={f.prochaine_revision} onChange={(e) => up('prochaine_revision', e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Départ<input value={f.depart} onChange={(e) => up('depart', e.target.value)} placeholder="Heure ou lieu" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Retour<input value={f.retour} onChange={(e) => up('retour', e.target.value)} placeholder="Heure ou lieu" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Kilométrage (km)<input type="number" min="0" value={f.kilometrage} onChange={(e) => up('kilometrage', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Conso. carburant (litres)<input type="number" min="0" step="0.1" value={f.conso_carburant} onChange={(e) => up('conso_carburant', Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block text-xs font-medium text-slate-600">Niveau de carburant
              <select value={f.niveau_carburant} onChange={(e) => up('niveau_carburant', e.target.value as NiveauCarburant)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {NIVEAU_CARBURANT_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CrewFields label="Pilote" value={f.pilote} onChange={(v) => up('pilote', v)} />
            <CrewFields label="Copilote" value={f.copilote1} onChange={(v) => up('copilote1', v)} />
            <CrewFields label="Copilote (2)" value={f.copilote2} onChange={(v) => up('copilote2', v)} />
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Contrôles du véhicule — éléments à vérifier avant et pendant la conduite</h4>
            <ChecklistGrid columns={VOITURE_CHECKLIST_COLUMNS} values={f.reponses} onChange={setReponse} />
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            Le véhicule est-il en état de rouler ?
            <span className="ml-auto flex gap-2">
              {(['Oui', 'Non'] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => up('etat_roulage', opt)} className={`rounded-md border px-3 py-1 text-xs font-semibold ${f.etat_roulage === opt ? (opt === 'Oui' ? 'border-green-500 bg-green-500 text-white' : 'border-red-500 bg-red-500 text-white') : 'border-slate-300 bg-white text-slate-500'}`}>{opt}</button>
              ))}
            </span>
          </label>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Rapport défaillances mécaniques</h4>
            <DefaillancesTable rows={f.defaillances} onChange={setDefaillances} />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={handleCancel} className="rounded-lg border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">{fiche ? 'Mettre à jour' : 'Enregistrer la fiche'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VoitureFichePrintView({ fiche, vehicle, onClose }: { fiche: VoitureFiche; vehicle?: { numero_immatriculation: string; marque: string }; onClose: () => void }) {
  const critical = fiche.defaillances.filter((d) => d.defaillance.trim());
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 print:static print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-2xl print:rounded-none print:shadow-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"><Printer className="h-4 w-4" /> Imprimer</button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="mb-4 flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <p className="text-sm font-bold uppercase">Fiche de Contrôles du Véhicule par son Conducteur et Rapport des Défaillances Mécaniques — La Sûreté du Véhicule</p>
            <p className="text-xs text-slate-500">{fiche.periode}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500">Numéro d'Inspection</p>
            <p className="text-lg font-bold">EQUIPAGE : {fiche.numero}</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-4 gap-2 text-xs">
          <div><span className="text-slate-500">Date</span><p className="font-semibold">{fmtDate(fiche.date)}</p></div>
          <div><span className="text-slate-500">Véhicule</span><p className="font-semibold">{vehicle?.numero_immatriculation} — {vehicle?.marque}</p></div>
          <div><span className="text-slate-500">Départ</span><p className="font-semibold">{fiche.depart || '—'}</p></div>
          <div><span className="text-slate-500">Retour</span><p className="font-semibold">{fiche.retour || '—'}</p></div>
          <div><span className="text-slate-500">Kilométrage</span><p className="font-semibold">{fiche.kilometrage.toLocaleString('fr-FR')} km</p></div>
          <div><span className="text-slate-500">Conso. carburant</span><p className="font-semibold">{fiche.conso_carburant} L</p></div>
          <div><span className="text-slate-500">Niveau carburant</span><p className="font-semibold">{fiche.niveau_carburant || '—'}</p></div>
          <div><span className="text-slate-500">Prochaine révision</span><p className="font-semibold">{fmtDate(fiche.prochaine_revision)}</p></div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-3 text-xs">
          {[{ label: 'Pilote', m: fiche.pilote }, { label: 'Copilote', m: fiche.copilote1 }, { label: 'Copilote (2)', m: fiche.copilote2 }].map(({ label, m }) => (
            <div key={label} className="rounded-lg border border-slate-200 p-2">
              <p className="mb-1 text-[10px] font-bold uppercase text-slate-500">{label}</p>
              <p><span className="text-slate-500">Nom :</span> {m.nom || '—'}</p>
              <p><span className="text-slate-500">Matricule :</span> {m.matricule || '—'}</p>
              <p><span className="text-slate-500">Signature :</span> {m.signature || '—'}</p>
            </div>
          ))}
        </div>

        <ChecklistGrid columns={VOITURE_CHECKLIST_COLUMNS} values={fiche.reponses} onChange={() => {}} readOnly />

        <div className="my-3 flex items-center gap-2 text-sm font-semibold">
          Le véhicule est-il en état de rouler ?
          <span className={`rounded-full px-2.5 py-0.5 text-xs ${fiche.etat_roulage === 'Oui' ? 'bg-green-100 text-green-700' : fiche.etat_roulage === 'Non' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>{fiche.etat_roulage || 'Non renseigné'}</span>
        </div>

        <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Rapport défaillances mécaniques</h4>
        <DefaillancesTable rows={critical.length ? critical : fiche.defaillances} onChange={() => {}} readOnly />

        <p className="mt-4 text-[9px] italic text-slate-400">* Si la défaillance peut être la cause d'un accident ou causer des dommages supplémentaires au véhicule et/ou enfreint la législation du Trafic Routier, le véhicule sera retiré de la circulation jusqu'à ce que la défaillance soit réparée.</p>
      </div>
    </div>
  );
}
