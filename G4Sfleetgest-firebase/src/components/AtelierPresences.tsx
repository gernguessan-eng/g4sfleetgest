import { useMemo } from 'react';
import { useVehicles } from '../store/VehicleStore';
import { usePersistedState } from '../hooks/usePersistedState';
import type { PresenceEntry, PresenceStatus } from '../types/atelier';
import { Printer, Download } from 'lucide-react';

const STATUS_COLORS: Record<PresenceStatus, string> = {
  'Présent': 'bg-green-100 text-green-700 border-green-200',
  'Absent': 'bg-red-100 text-red-700 border-red-200',
  'En pause': 'bg-blue-100 text-blue-700 border-blue-200',
};

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toISO(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function AtelierPresences() {
  const { mechanics, presenceEntries, upsertPresenceEntry } = useVehicles();
  const [presenceDate, setPresenceDate] = usePersistedState('fleetgest_presence_date', new Date().toISOString().slice(0, 10));
  const [monthCursor, setMonthCursor] = usePersistedState('fleetgest_presence_month', presenceDate.slice(0, 7));

  const entryFor = (mechanicId: string, date: string): PresenceEntry =>
    presenceEntries.find(e => e.mechanicId === mechanicId && e.date === date) ??
    { id: `${mechanicId}_${date}`, mechanicId, date, status: 'Absent', arrival: '', departure: '' };

  const setStatus = (mechanicId: string, status: PresenceStatus) => {
    const previous = entryFor(mechanicId, presenceDate);
    upsertPresenceEntry({
      ...previous, status,
      arrival: status === 'Absent' ? '' : previous.arrival || '07:45',
      departure: status === 'Absent' ? '' : previous.departure || '17:00',
    });
  };

  const setField = (mechanicId: string, field: 'arrival' | 'departure', value: string) => {
    const previous = entryFor(mechanicId, presenceDate);
    upsertPresenceEntry({ ...previous, [field]: value });
  };

  const dayEntries = useMemo(() => mechanics.map(m => entryFor(m.id, presenceDate)), [mechanics, presenceEntries, presenceDate]);
  const counts = useMemo(() => ({
    presents: dayEntries.filter(e => e.status === 'Présent').length,
    absents: dayEntries.filter(e => e.status === 'Absent').length,
    pauses: dayEntries.filter(e => e.status === 'En pause').length,
  }), [dayEntries]);

  const [year, month] = monthCursor.split('-').map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = lundi
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthLabel = firstOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const calendarCells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setMonthCursor(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  const exportCsv = () => {
    const rows = [['Mécanicien', 'Date', 'Statut', 'Arrivée', 'Départ']];
    mechanics.forEach(m => { const e = entryFor(m.id, presenceDate); rows.push([m.name, e.date, e.status, e.arrival, e.departure]); });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `presences_${presenceDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suivi des présences</p>
          <h2 className="text-2xl font-bold text-slate-900">Présences</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={presenceDate} onChange={e => { setPresenceDate(e.target.value); setMonthCursor(e.target.value.slice(0, 7)); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={exportCsv} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Exporter en CSV"><Download className="h-4 w-4" /></button>
          <button onClick={() => window.print()} className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-50" title="Imprimer"><Printer className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pointage journalier</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => shiftMonth(-1)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">‹</button>
              <span className="text-sm font-semibold capitalize text-slate-700">{monthLabel}</span>
              <button onClick={() => shiftMonth(1)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">›</button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
            {WEEKDAYS.map((d, i) => <div key={i} className="py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((day, i) => {
              if (day === null) return <div key={i} />;
              const iso = toISO(year, month - 1, day);
              const isSelected = iso === presenceDate;
              return (
                <button
                  key={i}
                  onClick={() => setPresenceDate(iso)}
                  className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:w-48">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{counts.presents}</p>
            <p className="text-xs text-green-600">Présents</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{counts.absents}</p>
            <p className="text-xs text-red-600">Absents</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{counts.pauses}</p>
            <p className="text-xs text-blue-600">En pause</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Pointage du {new Date(presenceDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {mechanics.length === 0 ? <p className="p-6 text-sm text-slate-400">Aucun mécanicien enregistré.</p> : mechanics.map(m => {
            const entry = entryFor(m.id, presenceDate);
            return (
              <div key={m.id} className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-slate-700" style={{ background: m.color }}>{m.initials}</span>
                  <div><p className="text-sm font-semibold text-slate-800">{m.name}</p><p className="text-xs text-slate-400">{m.role}</p></div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['Présent', 'En pause', 'Absent'] as PresenceStatus[]).map(s => (
                    <button key={s} onClick={() => setStatus(m.id, s)} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${entry.status === s ? STATUS_COLORS[s] : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>{s}</button>
                  ))}
                  {entry.status !== 'Absent' && (
                    <>
                      <input type="time" value={entry.arrival} onChange={e => setField(m.id, 'arrival', e.target.value)} className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                      <span className="text-xs text-slate-400">→</span>
                      <input type="time" value={entry.departure} onChange={e => setField(m.id, 'departure', e.target.value)} className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
