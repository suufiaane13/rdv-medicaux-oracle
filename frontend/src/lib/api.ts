/**
 * Client HTTP vers l'API Flask (cookies session — credentials inclus).
 * Base : variable VITE_API_URL (ex. http://127.0.0.1:5000).
 */

import type {
  AccueilResume,
  ApiErrorBody,
  ApiListMeta,
  Medecin,
  Patient,
  ProchainRdvAccueil,
  RdvSuppressionHistorique,
  RendezVous,
} from "@/types/models";

const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!BASE) return p;
  return `${BASE}${p}`;
}

export type ApiResult<T> =
  | { ok: true; data: T; meta?: ApiListMeta }
  | { ok: false; error: ApiErrorBody };

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const url = apiUrl(path);
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.method &&
      options.method !== "GET" &&
      !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const json = (await parseJson(res)) as Record<string, unknown>;
  if (json && typeof json === "object" && "ok" in json && json.ok === true) {
    return {
      ok: true,
      data: json.data as T,
      meta: json.meta as ApiListMeta | undefined,
    };
  }
  if (json && typeof json === "object" && json.ok === false) {
    const err = json as { error?: ApiErrorBody };
    return {
      ok: false,
      error:
        err.error ??
        ({
          code: "UNKNOWN",
          message: "Réponse invalide",
        } as ApiErrorBody),
    };
  }
  return {
    ok: false,
    error: {
      code: `HTTP_${res.status}`,
      message: res.statusText || "Erreur réseau ou réponse non JSON",
    },
  };
}

export async function login(username: string, password: string) {
  return request<{ id: number; username: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function registerAccount(body: {
  username: string;
  password: string;
  password_confirm: string;
}) {
  return request<{ id: number; username: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function logout() {
  return request<{ logged_out: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe() {
  return request<{ id: number; username: string }>("/api/auth/me");
}

export async function getAccueilResume() {
  return request<AccueilResume>("/api/accueil");
}

export async function getAccueilProchainsRdv(limit = 50) {
  const q = limit !== 50 ? `?limit=${encodeURIComponent(String(limit))}` : "";
  return request<ProchainRdvAccueil[]>(`/api/accueil/prochains-rdv${q}`);
}

export async function listRendezVous(params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") q.set(k, v);
  });
  const qs = q.toString();
  return request<RendezVous[]>(
    `/api/rendez-vous${qs ? `?${qs}` : ""}`,
  );
}

export async function createRendezVous(body: {
  patient_id: number;
  medecin_id: number;
  date_heure: string;
  motif?: string;
  statut?: string;
  duree_minutes?: number;
}) {
  return request<RendezVous>("/api/rendez-vous", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchRendezVous(
  id: number,
  body: Record<string, unknown>,
) {
  return request<RendezVous>(`/api/rendez-vous/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteRendezVous(id: number) {
  return request<{ deleted_id: number }>(`/api/rendez-vous/${id}`, {
    method: "DELETE",
  });
}

export async function listHistoriqueSuppressionsRdv() {
  return request<RdvSuppressionHistorique[]>(
    "/api/rendez-vous/historique/suppressions",
  );
}

export async function listPatients(q?: string, page = 1, pageSize = 20) {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (q) qs.set("q", q);
  return request<Patient[]>(`/api/patients?${qs.toString()}`);
}

export async function createPatient(body: {
  nom: string;
  prenom: string;
  telephone?: string;
  email?: string;
  cin?: string | null;
}) {
  return request<Patient>("/api/patients", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchPatient(id: number, body: Record<string, unknown>) {
  return request<Patient>(`/api/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePatient(id: number) {
  return request<{ deleted_id: number }>(`/api/patients/${id}`, {
    method: "DELETE",
  });
}

export async function listMedecins() {
  return request<Medecin[]>("/api/medecins");
}

export async function createMedecin(body: { nom: string; specialite: string }) {
  return request<Medecin>("/api/medecins", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchMedecin(
  id: number,
  body: Record<string, unknown>,
) {
  return request<Medecin>(`/api/medecins/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteMedecin(id: number) {
  return request<{ deleted_id: number }>(`/api/medecins/${id}`, {
    method: "DELETE",
  });
}

export async function deleteHistoriqueSuppression(id: number) {
  return request<{ deleted_id: number }>(
    `/api/rendez-vous/historique/suppressions/${id}`,
    { method: "DELETE" },
  );
}

export async function clearHistoriqueSuppressions() {
  return request<{ cleared: boolean }>(
    "/api/rendez-vous/historique/suppressions",
    { method: "DELETE" },
  );
}
