import { Ban, CalendarClock, Pencil, Plus, Stethoscope, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createRendezVous,
  deleteRendezVous,
  listMedecins,
  listPatients,
  listRendezVous,
  patchRendezVous,
} from "@/lib/api";
import { nativeSelectClassName } from "@/lib/form-styles";
import { STATUT_LABELS, STATUT_OPTIONS } from "@/lib/statuts";
import type { Medecin, Patient, RendezVous, StatutRdv } from "@/types/models";

function badgeVariantForStatut(
  s: StatutRdv,
): "default" | "success" | "danger" | "secondary" {
  switch (s) {
    case "confirme":
      return "success";
    case "annule":
      return "danger";
    case "termine":
      return "secondary";
    case "planifie":
    default:
      return "default";
  }
}

function formatDt(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

/** Date locale yyyy-mm-dd (évite le décalage UTC de toISOString sur les `<input type="date">`). */
function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd: string, delta: number): string {
  const parts = ymd.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export function AgendaPage() {
  const { duDefault, auDefault, todayYmd } = useMemo(() => {
    const t = todayLocalYmd();
    return {
      duDefault: addDaysYmd(t, -365),
      auDefault: addDaysYmd(t, 365),
      todayYmd: t,
    };
  }, []);
  const [du, setDu] = useState(duDefault);
  const [au, setAu] = useState(auDefault);
  const [medecinId, setMedecinId] = useState<string>("");
  const [statut, setStatut] = useState<string>("");

  const [rows, setRows] = useState<RendezVous[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const [openNew, setOpenNew] = useState(false);
  const [newPatientId, setNewPatientId] = useState("");
  const [newMedecinId, setNewMedecinId] = useState("");
  const [newDh, setNewDh] = useState(`${todayYmd}T09:00`);
  const [newMotif, setNewMotif] = useState("");
  const [newDur, setNewDur] = useState("30");

  const [editRow, setEditRow] = useState<RendezVous | null>(null);
  const [editDh, setEditDh] = useState("");
  const [editMotif, setEditMotif] = useState("");
  const [editStatut, setEditStatut] = useState<StatutRdv>("planifie");
  const [editDur, setEditDur] = useState("30");

  const [confirmDelete, setConfirmDelete] = useState<RendezVous | null>(null);

  const queryParams = useMemo(() => {
    let date_debut: string | undefined;
    let date_fin: string | undefined;
    if (du) {
      date_debut = `${du}T00:00:00`;
    }
    if (au) {
      const end = new Date(au + "T00:00:00");
      end.setDate(end.getDate() + 1);
      date_fin = end.toISOString().slice(0, 19);
    }
    return {
      date_debut,
      date_fin,
      medecin_id: medecinId || undefined,
      statut: statut || undefined,
    };
  }, [du, au, medecinId, statut]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await listRendezVous(queryParams);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    setRows(r.data);
  }, [queryParams]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      const m = await listMedecins();
      if (m.ok) setMedecins(m.data);
      const p = await listPatients(undefined, 1, 200);
      if (p.ok) setPatients(p.data);
    })();
  }, []);

  async function handleCreate() {
    const pid = Number(newPatientId);
    const mid = Number(newMedecinId);
    if (!pid || !mid || !newDh) {
      toast.error("Patient, médecin et date/heure sont obligatoires.");
      return;
    }
    const iso = new Date(newDh).toISOString().slice(0, 19);
    const r = await createRendezVous({
      patient_id: pid,
      medecin_id: mid,
      date_heure: iso,
      motif: newMotif || undefined,
      duree_minutes: Number(newDur) || 30,
    });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Rendez-vous créé");
    setOpenNew(false);
    setNewMotif("");
    await load();
  }

  function openEdit(row: RendezVous) {
    setEditRow(row);
    const raw = row.date_heure.slice(0, 16);
    setEditDh(raw.includes("T") ? raw : `${raw.slice(0, 10)}T09:00`);
    setEditMotif(row.motif ?? "");
    setEditStatut(row.statut);
    setEditDur(String(row.duree_minutes ?? 30));
  }

  async function handleSaveEdit() {
    if (!editRow) return;
    const iso = new Date(editDh).toISOString().slice(0, 19);
    const r = await patchRendezVous(editRow.id, {
      date_heure: iso,
      motif: editMotif,
      statut: editStatut,
      duree_minutes: Number(editDur) || 30,
    });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Rendez-vous mis à jour");
    setEditRow(null);
    await load();
  }

  async function handleAnnuler(row: RendezVous) {
    const r = await patchRendezVous(row.id, { statut: "annule" });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Rendez-vous annulé");
    await load();
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    const r = await deleteRendezVous(id);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Rendez-vous supprimé");
    if (editRow?.id === id) setEditRow(null);
    setConfirmDelete(null);
    await load();
  }

  return (
    <>
      <PageShell
        title="Agenda"
        description="Vue liste des créneaux — filtres par période, médecin et statut. Fuseau affiché selon le navigateur."
        descriptionClassName="max-w-none whitespace-nowrap"
        actions={
          <Button size="sm" className="rounded-full shadow-sm" onClick={() => setOpenNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau RDV
          </Button>
        }
      >
      <Card className="border-0 bg-card/85 shadow-card backdrop-blur-sm dark:bg-card/70">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="inline-flex max-w-full flex-wrap items-end gap-x-5 gap-y-4">
            <div className="grid min-w-[15rem] gap-2">
              <Label htmlFor="du">Du</Label>
              <Input
                id="du"
                type="date"
                className="date-input-icon-end h-11 w-full rounded-lg shadow-sm"
                value={du}
                onChange={(e) => setDu(e.target.value)}
              />
            </div>
            <div className="grid min-w-[15rem] gap-2">
              <Label htmlFor="au">Au</Label>
              <Input
                id="au"
                type="date"
                className="date-input-icon-end h-11 w-full rounded-lg shadow-sm"
                value={au}
                onChange={(e) => setAu(e.target.value)}
              />
            </div>
            <div className="grid min-w-[280px] gap-2">
              <Label htmlFor="med">Médecin</Label>
              <select
                id="med"
                className={nativeSelectClassName}
                value={medecinId}
                onChange={(e) => setMedecinId(e.target.value)}
              >
                <option value="">Tous</option>
                {medecins.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.nom} — {m.specialite}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid min-w-[240px] gap-2">
              <Label htmlFor="st">Statut</Label>
              <select
                id="st"
                className={nativeSelectClassName}
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
              >
                <option value="">Tous</option>
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                type="button"
                className="rounded-full"
                onClick={() => void load()}
                disabled={loading}
              >
                Actualiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 bg-card/85 shadow-card backdrop-blur-sm dark:bg-card/70">
        <CardHeader>
          <CardTitle className="text-lg">Rendez-vous</CardTitle>
          <CardDescription>
            {loading ? "Chargement des données…" : `${rows.length} résultat(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading && rows.length === 0 ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (
            <ScrollArea className="h-[min(560px,62vh)] rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date / heure</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Médecin</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                        Aucun rendez-vous pour cette période et ces filtres. Élargissez Du / Au, vérifiez
                        médecin ou statut, ou créez un RDV.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} className="group">
                        <TableCell className="tabular-nums font-medium">
                          {formatDt(r.date_heure)}
                        </TableCell>
                        <TableCell>
                          {r.patient_nom} {r.patient_prenom}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{r.medecin_nom}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {r.medecin_specialite}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[240px] truncate text-muted-foreground">
                          {r.motif ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeVariantForStatut(r.statut)} className="font-semibold">
                            {STATUT_LABELS[r.statut]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => openEdit(r)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Modifier</TooltipContent>
                          </Tooltip>
                          {r.statut !== "annule" ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => void handleAnnuler(r)}
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Annuler le RDV</TooltipContent>
                            </Tooltip>
                          ) : null}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setConfirmDelete(r)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Supprimer définitivement</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      </PageShell>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
            <DialogDescription>
              Sélectionnez un patient et un médecin, puis définissez le créneau.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2 sm:gap-x-4">
            <div className="grid gap-2">
              <Label htmlFor="np">Patient</Label>
              <select
                id="np"
                className={nativeSelectClassName}
                value={newPatientId}
                onChange={(e) => setNewPatientId(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {patients.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.nom} {p.prenom}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nm">Médecin</Label>
              <select
                id="nm"
                className={nativeSelectClassName}
                value={newMedecinId}
                onChange={(e) => setNewMedecinId(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {medecins.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.nom} — {m.specialite}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ndh">Date et heure</Label>
              <Input
                id="ndh"
                type="datetime-local"
                className="datetime-local-icon-end h-11 rounded-lg"
                value={newDh}
                onChange={(e) => setNewDh(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ndur">Durée (minutes)</Label>
              <Input
                id="ndur"
                type="number"
                min={5}
                step={5}
                className="h-11 rounded-lg"
                value={newDur}
                onChange={(e) => setNewDur(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="nmot">Motif</Label>
              <Input
                id="nmot"
                className="h-11 rounded-lg"
                value={newMotif}
                onChange={(e) => setNewMotif(e.target.value)}
                placeholder="Ex. Contrôle tension"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setOpenNew(false)}>
              Fermer
            </Button>
            <Button className="rounded-full" onClick={() => void handleCreate()}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRow} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
            <DialogDescription>
              Créneau, motif, durée ou statut — annulation possible via le statut « Annulé ».
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2 sm:gap-x-4">
            <div className="grid gap-2">
              <Label htmlFor="edh">Date et heure</Label>
              <Input
                id="edh"
                type="datetime-local"
                className="datetime-local-icon-end h-11 rounded-lg"
                value={editDh}
                onChange={(e) => setEditDh(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edur">Durée (minutes)</Label>
              <Input
                id="edur"
                type="number"
                min={5}
                step={5}
                className="h-11 rounded-lg"
                value={editDur}
                onChange={(e) => setEditDur(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="emot">Motif</Label>
              <Input
                id="emot"
                className="h-11 rounded-lg"
                value={editMotif}
                onChange={(e) => setEditMotif(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="est">Statut</Label>
              <select
                id="est"
                className={nativeSelectClassName}
                value={editStatut}
                onChange={(e) => setEditStatut(e.target.value as StatutRdv)}
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEditRow(null)}>
              Annuler
            </Button>
            <Button className="rounded-full" onClick={() => void handleSaveEdit()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce rendez-vous ?</DialogTitle>
            <DialogDescription>
              Le rendez-vous sera retiré de l’agenda. Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          {confirmDelete ? (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-muted/45 to-muted/15 shadow-sm">
              <div className="border-b border-border/50 bg-background/40 px-4 py-4">
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 max-w-full">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Patient
                    </p>
                    <p className="break-words text-base font-semibold leading-snug tracking-tight">
                      {confirmDelete.patient_nom} {confirmDelete.patient_prenom}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-px bg-border/40 sm:grid-cols-2">
                <div className="flex gap-3 bg-background/55 px-4 py-3">
                  <CalendarClock
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Créneau</p>
                    <p className="text-sm font-medium tabular-nums">
                      {formatDt(confirmDelete.date_heure)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 bg-background/55 px-4 py-3">
                  <Stethoscope
                    className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Médecin</p>
                    <p className="truncate text-sm font-medium">{confirmDelete.medecin_nom}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setConfirmDelete(null)}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => void handleConfirmDelete()}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
