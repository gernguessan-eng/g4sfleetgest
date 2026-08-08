import { usePersistedState } from '../hooks/usePersistedState';
import { Car, Bike } from 'lucide-react';
import PointageVoiture from './PointageVoiture';
import PointageMoto from './PointageMoto';

const TABS = [
  { key: 'voiture', label: 'Pointage Voiture', icon: Car },
  { key: 'moto', label: 'Pointage Moto', icon: Bike },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function PointageVehicule() {
  const [tab, setTab] = usePersistedState<TabKey>('fleetgest_pointage_tab', 'voiture');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-white p-1.5 shadow-sm print:hidden">
        {TABS.map(({ key, label, icon: TabIcon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TabIcon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'voiture' && <PointageVoiture />}
      {tab === 'moto' && <PointageMoto />}
    </div>
  );
}
