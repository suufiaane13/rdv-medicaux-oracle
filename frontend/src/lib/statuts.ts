import type { StatutRdv } from "@/types/models";

export const STATUT_LABELS: Record<StatutRdv, string> = {
  planifie: "Planifié",
  confirme: "Confirmé",
  annule: "Annulé",
  termine: "Terminé",
};

export const STATUT_OPTIONS: { value: StatutRdv; label: string }[] = [
  { value: "planifie", label: "Planifié" },
  { value: "confirme", label: "Confirmé" },
  { value: "annule", label: "Annulé" },
  { value: "termine", label: "Terminé" },
];
