// Types du module "Pointage véhicule" : fiches de contrôle journalier remplies par les
// conducteurs (Moto et Voiture), sur le modèle des fiches papier "Fiche de Contrôles...
// et Rapport de défaillances Mécaniques". Les fiches référencent les véhicules existants
// de fleetgest via `vehicleId` — aucune collection de véhicules dupliquée.

export type ChecklistAnswer = 'Oui' | 'Non' | 'Bon' | 'Moyen' | 'Mauvais' | '';

export interface ChecklistItemDef {
  key: string;
  label: string;
  kind: 'oui_non' | 'etat';
  /** Marqué d'un astérisque sur la fiche papier : défaillance pouvant entraîner le retrait du véhicule. */
  critical?: boolean;
}

export interface DefaillanceRow {
  id: string;
  defaillance: string;
  action: string;
  signature: string;
}

export const NIVEAU_CARBURANT_OPTIONS = ['Vide', 'Réserve', '1/4', '1/2', '3/4', 'Plein'] as const;
export type NiveauCarburant = typeof NIVEAU_CARBURANT_OPTIONS[number] | '';

function emptyDefaillances(): DefaillanceRow[] {
  return [
    { id: 'd1', defaillance: '', action: '', signature: '' },
    { id: 'd2', defaillance: '', action: '', signature: '' },
    { id: 'd3', defaillance: '', action: '', signature: '' },
  ];
}

// ────────────────────────────────────────────────────────────────────────
// MOTO — "Fiche de Contrôles de la Moto et Rapport de défaillances Mécaniques"
// ────────────────────────────────────────────────────────────────────────

export const MOTO_CHECKLIST_COLUMNS: ChecklistItemDef[][] = [
  [
    { key: 'compteurs_vitesse', label: 'Compteurs de vitesse', kind: 'oui_non', critical: true },
    { key: 'equipements_urgence', label: "Equipements d'urgence", kind: 'oui_non', critical: true },
    { key: 'casque_combinaison', label: 'Casque et combinaison de protection', kind: 'oui_non', critical: true },
    { key: 'estampilles', label: 'Estampilles fluorescentes / luminescentes - signalétiques', kind: 'oui_non', critical: true },
    { key: 'trousse_secours', label: 'Trousse de secours (Premiers soins)', kind: 'oui_non' },
    { key: 'fuites', label: 'Fuites', kind: 'oui_non', critical: true },
    { key: 'licences', label: "Licences/Autorisations légales à jour (Permis de conduire G4S, Assurance, Carte grise...)", kind: 'oui_non' },
    { key: 'klaxon', label: 'Klaxon', kind: 'oui_non' },
    { key: 'tracking', label: 'Tracking de la moto (GPS)', kind: 'oui_non' },
    { key: 'plaque_immat', label: "Plaque d'immatriculation - conditions", kind: 'oui_non', critical: true },
    { key: 'gilet_securite', label: 'Gilet de sécurité réfléchissant', kind: 'oui_non' },
  ],
  [
    { key: 'suspension', label: 'Suspension', kind: 'etat', critical: true },
    { key: 'pneumatique', label: 'Pneumatique - Conditions', kind: 'etat', critical: true },
    { key: 'levier_vitesse', label: 'Etat du levier de vitesse', kind: 'etat' },
    { key: 'kit_chainage', label: 'Kit de chainage', kind: 'etat', critical: true },
    { key: 'niveaux_huiles', label: 'Niveaux des huiles', kind: 'etat' },
    { key: 'carrosserie', label: 'Etat de la Carrosserie', kind: 'etat' },
    { key: 'rayons', label: 'Etat des rayons', kind: 'etat' },
    { key: 'combinaison_protection', label: 'Etat de la combinaison de protection', kind: 'etat' },
    { key: 'casque', label: 'Etat du casque', kind: 'etat' },
    { key: 'trousse_secours_etat', label: 'Etat de la trousse de secours', kind: 'etat' },
    { key: 'caisse_transport', label: 'Etat de la caisse de transport', kind: 'etat' },
  ],
  [
    { key: 'eclairage', label: 'Eclairage - le phare, réflecteurs', kind: 'etat', critical: true },
    { key: 'retroviseurs', label: 'Rétroviseurs - conditions', kind: 'etat', critical: true },
    { key: 'bequille', label: 'Béquille', kind: 'etat', critical: true },
    { key: 'controles_operations', label: 'Contrôles - opérations', kind: 'etat', critical: true },
    { key: 'clignotants', label: 'Etat des clignotants', kind: 'etat' },
    { key: 'bougies', label: 'Etat des bougies', kind: 'etat' },
    { key: 'scelle', label: 'Etat de la scelle', kind: 'etat', critical: true },
    { key: 'freinage', label: 'Système de freinage - opérations', kind: 'etat', critical: true },
    { key: 'batterie', label: 'Etat de la batterie', kind: 'etat' },
    { key: 'equipements_urgence_etat', label: "Etat des équipements d'urgence", kind: 'etat' },
    { key: 'cadre', label: 'Le cadre - conditions, propreté', kind: 'etat', critical: true },
  ],
];

export interface MotoFiche {
  id: string;
  /** Numéro d'inspection séquentiel, affiché "LYNX : 0107309" sur la fiche imprimée. */
  numero: string;
  date: string;
  vehicleId: string;
  kilometrage: number;
  depart: string;
  retour: string;
  conso_carburant: number;
  conso_huiles: number;
  niveau_carburant: NiveauCarburant;
  nom: string;
  matricule: string;
  signature: string;
  reponses: Record<string, ChecklistAnswer>;
  etat_fonctionnement: 'Oui' | 'Non' | '';
  defaillances: DefaillanceRow[];
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────────────
// VOITURE — "Fiche de Contrôles du Véhicule par son Conducteur et Rapport
// des Défaillances mécaniques - La Sûreté du Véhicule"
// ────────────────────────────────────────────────────────────────────────

export const VOITURE_CHECKLIST_COLUMNS: ChecklistItemDef[][] = [
  [
    { key: 'anomalie_tableau_bord', label: 'Anomalie du tableau de bord', kind: 'oui_non' },
    { key: 'fuites', label: 'Fuites', kind: 'oui_non', critical: true },
    { key: 'licence', label: "Licence/Autorisations Légales (Permis de conduire G4S, les pièces afférentes)", kind: 'oui_non', critical: true },
    { key: 'batterie_fixation', label: 'Etat et fixation de la batterie', kind: 'oui_non' },
    { key: 'trousse_secours', label: 'Trousse de secours (premiers soins)', kind: 'oui_non' },
    { key: 'equipements_urgence', label: "Equipements d'urgence (extincteurs, triangle de sécurité, kit de cric et roue)", kind: 'oui_non' },
    { key: 'proprete', label: 'Propreté du véhicule (INT/EXT)', kind: 'oui_non' },
    { key: 'klaxon', label: 'Klaxon - Autres techniques d\'alerte', kind: 'oui_non', critical: true },
  ],
  [
    { key: 'communications', label: 'Communications (Radio)', kind: 'etat' },
    { key: 'niveaux_huiles', label: 'Niveaux des huiles', kind: 'etat' },
    { key: 'pneumatique', label: 'Pneumatique - Conditions/Sûreté de la direction', kind: 'etat', critical: true },
    { key: 'carrosserie', label: 'Etat de la Carrosserie - condition', kind: 'etat' },
    { key: 'entree_arriere', label: "Entrée arrière de camionnette (pick-up) / Portières arrières camion (truck)", kind: 'etat', critical: true },
    { key: 'plaque_immat', label: "Etat de plaque d'Immatriculation - condition", kind: 'etat' },
    { key: 'tracking', label: 'Tracking du véhicule (GPS)', kind: 'etat', critical: true },
  ],
  [
    { key: 'eclairage', label: 'Eclairage - phares - clignotants - panneaux réflecteurs', kind: 'etat', critical: true },
    { key: 'retroviseurs', label: 'Rétroviseurs - conditions', kind: 'etat', critical: true },
    { key: 'essuie_glaces', label: 'Etat des essuies-glaces / Nettoyeurs - opérations', kind: 'etat', critical: true },
    { key: 'controles_direction', label: 'Contrôles de la direction - opérations', kind: 'etat', critical: true },
    { key: 'pedale_accelerateur', label: "Etat de la pédale d'accélérateur", kind: 'etat' },
    { key: 'freinage', label: 'Système de freinage - opérations', kind: 'etat', critical: true },
    { key: 'ceintures', label: 'Etat des ceintures de sécurité', kind: 'etat' },
    { key: 'trousse_secours_etat', label: 'Etat de la trousse de secours (premiers soins)', kind: 'etat' },
  ],
];

export interface CrewMember {
  nom: string;
  matricule: string;
  signature: string;
}

function emptyCrewMember(): CrewMember {
  return { nom: '', matricule: '', signature: '' };
}

export interface VoitureFiche {
  id: string;
  /** Numéro d'inspection séquentiel, affiché "Equipage : 0106638" sur la fiche imprimée. */
  numero: string;
  periode: 'Matin' | 'Soir';
  date: string;
  vehicleId: string;
  kilometrage: number;
  depart: string;
  retour: string;
  conso_carburant: number;
  prochaine_revision: string;
  niveau_carburant: NiveauCarburant;
  pilote: CrewMember;
  copilote1: CrewMember;
  copilote2: CrewMember;
  reponses: Record<string, ChecklistAnswer>;
  etat_roulage: 'Oui' | 'Non' | '';
  defaillances: DefaillanceRow[];
  createdAt: string;
}

export function emptyMotoFiche(vehicleId = ''): Omit<MotoFiche, 'id' | 'numero' | 'createdAt'> {
  return {
    date: new Date().toISOString().slice(0, 10), vehicleId, kilometrage: 0, depart: '', retour: '',
    conso_carburant: 0, conso_huiles: 0, niveau_carburant: '', nom: '', matricule: '', signature: '',
    reponses: {}, etat_fonctionnement: '', defaillances: emptyDefaillances(),
  };
}

export function emptyVoitureFiche(vehicleId = ''): Omit<VoitureFiche, 'id' | 'numero' | 'createdAt'> {
  return {
    periode: 'Matin', date: new Date().toISOString().slice(0, 10), vehicleId, kilometrage: 0, depart: '', retour: '',
    conso_carburant: 0, prochaine_revision: '', niveau_carburant: '',
    pilote: emptyCrewMember(), copilote1: emptyCrewMember(), copilote2: emptyCrewMember(),
    reponses: {}, etat_roulage: '', defaillances: emptyDefaillances(),
  };
}

/** Numéro séquentiel à 7 chiffres, chronologique, à partir du dernier numéro connu. */
export function nextNumero(existingNumeros: string[], base = 100000): string {
  const max = existingNumeros.reduce((m, n) => {
    const digits = n.replace(/\D/g, '');
    const value = digits ? parseInt(digits, 10) : 0;
    return Math.max(m, value);
  }, base);
  return String(max + 1).padStart(7, '0');
}
