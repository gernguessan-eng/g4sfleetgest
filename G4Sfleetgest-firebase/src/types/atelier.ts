// Types du module "Maintenance" (gestion d'atelier interne) : Ordres de réparation,
// Planning atelier, Mécaniciens, Stocks & pièces, Présences.
//
// Important : ce module référence les véhicules existants de fleetgest via
// `vehicleId` (Vehicle.id du store principal) — il n'a pas sa propre collection de
// véhicules, pour ne jamais dupliquer le menu "Véhicules".

export type OrderStatus = 'En cours' | 'À contrôler' | 'En attente' | 'Planifié' | 'Terminé';
export const ORDER_STATUSES: OrderStatus[] = ['En attente', 'Planifié', 'En cours', 'À contrôler', 'Terminé'];

export type OrderPriority = 'Normale' | 'Urgente' | 'À planifier';
export const ORDER_PRIORITIES: OrderPriority[] = ['Normale', 'Urgente', 'À planifier'];

export type OrderPart = { itemId: string; itemName: string; quantity: number };

export interface RepairOrder {
  id: string;
  vehicleId: string;
  /** Libellés mis en cache pour un affichage rapide (recalculés à chaque changement de véhicule). */
  vehicleLabel: string;
  plate: string;
  issue: string;
  /** Nom du mécanicien affecté, ou "À affecter". */
  mechanic: string;
  initials: string;
  priority: OrderPriority;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: OrderStatus;
  cost: number;
  parts: OrderPart[];
}

export const orderStatusTone = (status: OrderStatus): 'orange' | 'blue' | 'red' | 'slate' | 'green' =>
  status === 'En cours' ? 'orange' : status === 'À contrôler' ? 'blue' : status === 'En attente' ? 'red' : status === 'Terminé' ? 'green' : 'slate';

export type MechanicState = 'En intervention' | 'Disponible' | 'Pause' | 'Absent';

export interface Mechanic {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  state: MechanicState;
  email: string;
  phone: string;
  specialties: string[];
  startDate: string;
}

export const mechanicStateTone = (state: MechanicState): 'working' | 'available' | 'pause' | 'absent' =>
  state === 'En intervention' ? 'working' : state === 'Disponible' ? 'available' : state === 'Pause' ? 'pause' : 'absent';

export type StockLevel = 'critique' | 'bas' | 'normal';

export interface StockItem {
  id: string;
  name: string;
  ref: string;
  category: string;
  quantity: number;
  minLevel: number;
  unitPrice: number;
  supplier: string;
  location: string;
  lastEntry: string;
}

export const stockLevelOf = (quantity: number, minLevel: number): StockLevel =>
  quantity <= minLevel * 0.5 ? 'critique' : quantity <= minLevel ? 'bas' : 'normal';
export const stockPercentOf = (quantity: number, minLevel: number): number =>
  Math.min((quantity / Math.max(minLevel * 2, 1)) * 100, 100);
export const stockTotalValue = (item: StockItem): number => item.quantity * item.unitPrice;

export type ExitReason = 'Ordre atelier' | 'Sortie manuelle' | 'Casse / Perte' | 'Retour fournisseur' | 'Ajustement inventaire';
export const EXIT_REASONS: ExitReason[] = ['Ordre atelier', 'Sortie manuelle', 'Casse / Perte', 'Retour fournisseur', 'Ajustement inventaire'];

export interface StockExit {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  quantity: number;
  reason: ExitReason;
  targetVehiclePlate?: string;
  targetOrderId?: string;
  notes: string;
}

export type PresenceStatus = 'Présent' | 'Absent' | 'En pause';
export interface PresenceEntry {
  id: string; // `${mechanicId}_${date}`
  mechanicId: string;
  date: string;
  status: PresenceStatus;
  arrival: string;
  departure: string;
}

export const presenceStatusTone = (status: PresenceStatus): 'working' | 'pause' | 'absent' =>
  status === 'Présent' ? 'working' : status === 'En pause' ? 'pause' : 'absent';

export function minutesBetween(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const result = eh * 60 + em - sh * 60 - sm;
  return result > 0 ? result : 0;
}
export function durationLabel(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}`;
}

// ── Données de démonstration ──
export const SAMPLE_MECHANICS: Mechanic[] = [
  { id: 'M001', name: 'Alex Morel', role: 'Mécanicien expert', initials: 'AM', color: '#e7b783', state: 'En intervention', email: 'a.morel@entreprise.fr', phone: '06 12 34 56 78', specialties: ['Moteur diesel', 'Freinage'], startDate: '2020-03-15' },
  { id: 'M002', name: 'Sofia Benali', role: 'Diagnostic électronique', initials: 'SB', color: '#a8c2bf', state: 'En intervention', email: 's.benali@entreprise.fr', phone: '06 23 45 67 89', specialties: ['Électronique', 'Injection'], startDate: '2021-06-01' },
  { id: 'M003', name: 'Thomas Roy', role: 'Mécanicien polyvalent', initials: 'TR', color: '#c4b5d4', state: 'Pause', email: 't.roy@entreprise.fr', phone: '06 34 56 78 90', specialties: ['Mécanique générale', 'Climatisation'], startDate: '2019-09-10' },
  { id: 'M004', name: 'Nina Garcia', role: 'Pneumatiques & freinage', initials: 'NG', color: '#e7c7a3', state: 'Disponible', email: 'n.garcia@entreprise.fr', phone: '06 45 67 89 01', specialties: ['Pneumatiques', 'Freinage', 'Suspension'], startDate: '2022-01-20' },
  { id: 'M005', name: 'Karim Diallo', role: 'Carrosserie', initials: 'KD', color: '#b8d4c8', state: 'Absent', email: 'k.diallo@entreprise.fr', phone: '06 56 78 90 12', specialties: ['Carrosserie', 'Peinture'], startDate: '2018-11-05' },
];

export const SAMPLE_STOCK: StockItem[] = [
  { id: 'P001', name: 'Filtre à huile', ref: 'FH-204', category: 'Filtration', quantity: 7, minLevel: 5, unitPrice: 10168, supplier: 'Mann Filter', location: 'Étagère A-12', lastEntry: '2026-07-15' },
  { id: 'P002', name: 'Plaquettes frein AV', ref: 'PF-118', category: 'Freinage', quantity: 5, minLevel: 8, unitPrice: 81338, supplier: 'Brembo', location: 'Étagère B-03', lastEntry: '2026-07-20' },
  { id: 'P003', name: 'Huile moteur 5W30', ref: 'HL-530', category: 'Lubrifiants', quantity: 42, minLevel: 60, unitPrice: 7872, supplier: 'Total', location: 'Zone C-05', lastEntry: '2026-07-10' },
  { id: 'P004', name: 'Pneus 215/75R16', ref: 'PN-21575', category: 'Pneumatiques', quantity: 43, minLevel: 4, unitPrice: 95114, supplier: 'Michelin', location: 'Rack D-01', lastEntry: '2026-07-28' },
  { id: 'P005', name: 'Batterie 12V 100Ah', ref: 'BT-100', category: 'Électricité', quantity: 1, minLevel: 3, unitPrice: 123978, supplier: 'Varta', location: 'Étagère E-08', lastEntry: '2026-07-05' },
];

// Ordres de démonstration, rattachés à de vrais véhicules du parc (v1 = DM-137-MV,
// v2 = GW-174-RN, v3 = VL-211-RA, v4 = RP-248-GD) — jamais de véhicule fictif.
export const SAMPLE_ORDERS: RepairOrder[] = [
  { id: 'OR-2048', vehicleId: 'v1', vehicleLabel: 'TOYOTA', plate: 'DM-137-MV', issue: 'Révision freinage', mechanic: 'Alex Morel', initials: 'AM', priority: 'Normale', startDate: '2026-07-20', endDate: '2026-07-20', startTime: '08:10', endTime: '09:30', status: 'En cours', cost: 295000, parts: [{ itemId: 'P002', itemName: 'Plaquettes frein AV', quantity: 1 }] },
  { id: 'OR-2046', vehicleId: 'v2', vehicleLabel: 'TOYOTA', plate: 'GW-174-RN', issue: 'Voyant moteur', mechanic: 'Sofia Benali', initials: 'SB', priority: 'Urgente', startDate: '2026-07-18', endDate: '2026-07-19', startTime: '08:00', endTime: '11:45', status: 'À contrôler', cost: 183500, parts: [{ itemId: 'P003', itemName: 'Huile moteur 5W30', quantity: 4 }] },
  { id: 'OR-2044', vehicleId: 'v3', vehicleLabel: 'TOYOTA', plate: 'VL-211-RA', issue: 'Vidange + filtres', mechanic: 'Thomas Roy', initials: 'TR', priority: 'Normale', startDate: '2026-07-22', endDate: '2026-07-22', startTime: '10:00', endTime: '10:50', status: 'En attente', cost: 78700, parts: [{ itemId: 'P001', itemName: 'Filtre à huile', quantity: 1 }, { itemId: 'P003', itemName: 'Huile moteur 5W30', quantity: 5 }] },
  { id: 'OR-2041', vehicleId: 'v4', vehicleLabel: 'NISSAN', plate: 'RP-248-GD', issue: 'Pneumatiques', mechanic: 'Nina Garcia', initials: 'NG', priority: 'À planifier', startDate: '2026-07-25', endDate: '2026-07-25', startTime: '08:30', endTime: '10:00', status: 'Planifié', cost: 446000, parts: [{ itemId: 'P004', itemName: 'Pneus 215/75R16', quantity: 2 }] },
];

export const SAMPLE_STOCK_EXITS: StockExit[] = [
  { id: 'S001', itemId: 'P002', itemName: 'Plaquettes frein AV', date: '2026-07-20', quantity: 1, reason: 'Ordre atelier', targetVehiclePlate: 'DM-137-MV', targetOrderId: 'OR-2048', notes: 'Sortie atelier pour OR-2048' },
  { id: 'S002', itemId: 'P003', itemName: 'Huile moteur 5W30', date: '2026-07-19', quantity: 4, reason: 'Ordre atelier', targetVehiclePlate: 'GW-174-RN', targetOrderId: 'OR-2046', notes: 'Sortie atelier pour OR-2046' },
];

export const SAMPLE_PRESENCE: PresenceEntry[] = [];
