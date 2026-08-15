import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VehicleList from './components/VehicleList';
import VehicleDetail from './components/VehicleDetail';
import Analytics from './components/Analytics';
import Expenses from './components/Expenses';
import Maintenance from './components/Maintenance';
import PointageVehicule from './components/PointageVehicule';
import Settings from './components/Settings';
import GeolocTrajets from './components/GeolocTrajets';
import FuelManagement from './components/FuelManagement';
import DriverManagement from './components/DriverManagement';
import VehicleReform from './components/VehicleReform';
import Pneumatique from './components/Pneumatique';
import Sinistres from './components/Sinistres';
import Immobilisations from './components/Immobilisations';
import Catalogue from './components/Catalogue';
import AddressBook from './components/AddressBook';
import AccessGate, { DemoBanner } from './components/AccessGate';
import Login from './components/Login';
import { observeAuth, logout, type UserProfile } from './authService';
import { VehicleProvider } from './store/VehicleStore';
import { DriverProvider } from './store/DriverStore';
import g4sLogo from './assets/g4s-logo.png';

function AppContent({ profile, onLogout }: { profile: UserProfile; onLogout: () => void }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <DemoBanner />
      <div className="flex items-center justify-end gap-3 bg-slate-900 px-4 py-1.5 text-xs text-slate-300 print:hidden">
        <span>{profile.displayName || profile.email} · {profile.role}</span>
        <button onClick={onLogout} className="rounded bg-slate-700 px-2.5 py-1 font-semibold text-white hover:bg-slate-600">
          Se déconnecter
        </button>
      </div>
      <div className="flex flex-1">
        <Sidebar />
        {/* Filigrane G4S — visible en fond derrière le contenu de tous les menus, sans
            gêner la lecture ni les clics, et masqué à l'impression. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-center bg-no-repeat opacity-[0.06] print:hidden"
          style={{ backgroundImage: `url(${g4sLogo})`, backgroundSize: '480px' }}
        />
        <main className="relative z-10 ml-64 flex-1 p-6 print:ml-0 print:p-0">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/vehicules"    element={<VehicleList />} />
            <Route path="/vehicule/:id" element={<VehicleDetail />} />
            <Route path="/maintenance"  element={<Maintenance />} />
            <Route path="/pointage"     element={<PointageVehicule />} />
            <Route path="/parametres"   element={<Settings />} />
            <Route path="/chauffeurs"   element={<DriverManagement />} />
            <Route path="/depenses"     element={<Expenses />} />
            <Route path="/carburant"    element={<FuelManagement />} />
            <Route path="/pneumatique"  element={<Pneumatique />} />
            <Route path="/sinistres"    element={<Sinistres />} />
            <Route path="/immobilisations" element={<Immobilisations />} />
            <Route path="/catalogue"     element={<Catalogue />} />
            <Route path="/contacts"      element={<AddressBook />} />
            <Route path="/geoloc"       element={<GeolocTrajets />} />
            <Route path="/graphiques"   element={<Analytics />} />
            <Route path="/reforme"      element={<VehicleReform />} />
            <Route path="/impression"   element={<Navigate to="/vehicules" replace />} />
            <Route path="/impression/:id" element={<Navigate to="/vehicules" replace />} />
            <Route path="/apercu"       element={<Navigate to="/vehicules" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuth((p) => {
      setProfile(p);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">Chargement…</div>;
  }

  if (!profile) {
    return <Login onLogin={setProfile} />;
  }

  return (
    <AccessGate>
      <VehicleProvider>
        <DriverProvider>
          <BrowserRouter>
            <AppContent profile={profile} onLogout={() => logout(profile).then(() => setProfile(null))} />
          </BrowserRouter>
        </DriverProvider>
      </VehicleProvider>
    </AccessGate>
  );
}
