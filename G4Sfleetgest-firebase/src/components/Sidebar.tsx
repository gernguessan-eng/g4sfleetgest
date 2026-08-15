import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import g4sLogo from '../assets/g4s-logo.png';
import {
  LayoutDashboard, Car, BarChart3, Receipt,
  GripVertical, MapPin, Fuel, Users, Eye, EyeOff, PackageX,
  AlertTriangle, Wrench, ParkingCircle, BookUser, Package, Hammer, ClipboardCheck, Settings,
} from 'lucide-react';

export type NavItemDef = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const defaultNavItems: NavItemDef[] = [
  { path: '/',               label: 'Tableau de bord',           icon: LayoutDashboard },
  { path: '/vehicules',      label: 'Véhicules',                 icon: Car },
  { path: '/maintenance',    label: 'Maintenance',               icon: Hammer },
  { path: '/pointage',       label: 'Pointage véhicule',          icon: ClipboardCheck },
  { path: '/chauffeurs',     label: 'Gestion des chauffeurs',    icon: Users },
  { path: '/depenses',       label: 'Dépenses',                  icon: Receipt },
  { path: '/carburant',      label: 'Gestion des carburants',    icon: Fuel },
  { path: '/pneumatique',    label: 'Pneumatique',               icon: Wrench },
  { path: '/sinistres',      label: 'Gestion des sinistres',     icon: AlertTriangle },
  { path: '/immobilisations',label: 'Suivi des immobilisations', icon: ParkingCircle },
  { path: '/catalogue',      label: 'Catalogue des pièces',      icon: Package },
  { path: '/contacts',       label: "Carnet d'adresses",         icon: BookUser },
  { path: '/geoloc',         label: 'Géolocalisation et trajectoires', icon: MapPin },
  { path: '/graphiques',     label: 'Graphiques et analyses',    icon: BarChart3 },
  { path: '/reforme',        label: 'Plan de réforme',           icon: PackageX },
  { path: '/parametres',     label: 'Paramètres',                icon: Settings },
];

const STORAGE_ORDER_KEY = 'parc_auto_nav_order';
const STORAGE_HIDDEN_KEY = 'parc_auto_nav_hidden';

function getStoredOrder(): NavItemDef[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_ORDER_KEY);
    if (!raw) return null;
    const paths = JSON.parse(raw) as string[];
    const ordered: NavItemDef[] = [];
    paths.forEach((p) => {
      const found = defaultNavItems.find((item) => item.path === p);
      if (found) ordered.push(found);
    });
    defaultNavItems.forEach((item) => {
      if (!ordered.find((o) => o.path === item.path)) ordered.push(item);
    });
    return ordered;
  } catch {
    return null;
  }
}

function saveOrder(items: NavItemDef[]) {
  localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(items.map((i) => i.path)));
}

function getStoredHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_HIDDEN_KEY);
    if (!raw) return new Set();
    const paths = JSON.parse(raw) as string[];
    const allowed = new Set(defaultNavItems.map((item) => item.path));
    return new Set(paths.filter((path) => allowed.has(path)));
  } catch {
    return new Set();
  }
}

function saveHidden(hidden: Set<string>) {
  localStorage.setItem(STORAGE_HIDDEN_KEY, JSON.stringify(Array.from(hidden)));
}

export default function Sidebar() {
  const location = useLocation();
  const [items, setItems] = useState<NavItemDef[]>(() => getStoredOrder() ?? defaultNavItems);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(() => getStoredHidden());

  useEffect(() => { saveOrder(items); }, [items]);
  useEffect(() => { saveHidden(hiddenItems); }, [hiddenItems]);

  const handleDragStart = useCallback((index: number) => setDragIndex(index), []);
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  }, [dragIndex]);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => { setDragIndex(null); setDragOverIndex(null); }, []);
  const resetOrder = () => { setItems([...defaultNavItems]); setHiddenItems(new Set()); };
  const toggleHidden = (path: string) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white shadow-xl">
      <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white p-1">
          <img src={g4sLogo} alt="G4S" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-sm font-bold leading-tight">Parc Auto</h1>
          <p className="text-[10px] text-slate-400">Gestion de flotte</p>
        </div>
      </div>

      <div className="px-3 pt-3">
        <button
          onClick={() => setEditMode(!editMode)}
          className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            editMode ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                     : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
        >
          {editMode ? '✓ Terminer le réagencement' : '↕ Réorganiser les onglets'}
        </button>
        {editMode && (
          <button onClick={resetOrder} className="mt-1 w-full rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 transition">
            ↺ Réinitialiser l'ordre et l'affichage
          </button>
        )}
        {editMode && <p className="mt-2 px-1 text-[10px] leading-relaxed text-slate-500">Glissez pour déplacer. Cliquez sur l'œil pour masquer ou afficher un onglet.</p>}
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto px-3 ${editMode ? 'py-2' : 'py-4'}`}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isDragOver = dragOverIndex === index && dragIndex !== index;
          const isHidden = hiddenItems.has(item.path);
          if (!editMode && isHidden) return null;
          return (
            <div
              key={item.path}
              draggable={editMode}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 rounded-lg transition-all ${isDragOver ? 'border-2 border-dashed border-emerald-400 bg-emerald-500/10' : ''} ${editMode ? 'cursor-move' : ''} ${isHidden ? 'opacity-45' : ''}`}
            >
              {editMode && <div className="flex-shrink-0 pl-1 text-slate-500"><GripVertical className="h-4 w-4" /></div>}
              <NavLink
                to={item.path}
                className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}
                onClick={(e) => { if (editMode) e.preventDefault(); }}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1 leading-tight">{item.label}</span>
                {editMode && isHidden && <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] text-slate-300">masqué</span>}
              </NavLink>
              {editMode && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleHidden(item.path); }}
                  className="mr-1 rounded-md p-1.5 text-slate-500 hover:bg-slate-700/60 hover:text-white"
                  title={isHidden ? 'Afficher cet onglet' : 'Masquer cet onglet'}
                >
                  {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
