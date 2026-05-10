export type StatutRdv = "planifie" | "confirme" | "annule" | "termine";

export interface Patient {
  id: number;
  nom: string;
  prenom: string;
  telephone: string | null;
  email: string | null;
  /** CIN : 1–2 lettres A–Z puis 5–6 chiffres (ex. AB123456) */
  cin: string | null;
}

export interface Medecin {
  id: number;
  nom: string;
  specialite: string;
}

export interface RendezVous {
  id: number;
  patient_id: number;
  medecin_id: number;
  date_heure: string;
  motif: string | null;
  statut: StatutRdv;
  duree_minutes?: number | null;
  patient_nom?: string;
  patient_prenom?: string;
  medecin_nom?: string;
  medecin_specialite?: string;
}

/** Ligne issue de rdv_suppressions_historique (remplie lors d’une suppression définitive). */
export interface RdvSuppressionHistorique {
  id: number;
  ancien_rdv_id: number;
  patient_id: number;
  medecin_id: number;
  date_heure: string;
  motif: string | null;
  statut: string | null;
  duree_minutes: number | null;
  supprime_le: string;
  patient_nom?: string | null;
  patient_prenom?: string | null;
  medecin_nom?: string | null;
  medecin_specialite?: string | null;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string | undefined>;
}

export interface ApiListMeta {
  page: number;
  page_size: number;
  total: number;
}

/** Une ligne de la vue Oracle `v_accueil_resume` (GET /api/accueil). */
export interface AccueilResume {
  nb_patients: number;
  nb_medecins: number;
  nb_rdv: number;
}

/** Ligne de la vue Oracle `v_prochains_rdv` (GET /api/accueil/prochains-rdv). */
export interface ProchainRdvAccueil {
  id: number;
  date_heure: string;
  motif: string | null;
  statut: StatutRdv;
  duree_minutes: number | null;
  patient_nom?: string;
  patient_prenom?: string;
  medecin_nom?: string;
  medecin_specialite?: string;
}
