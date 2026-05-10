import { History, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  clearHistoriqueSuppressions,
  deleteHistoriqueSuppression,
  listHistoriqueSuppressionsRdv,
} from "@/lib/api";
import { STATUT_LABELS } from "@/lib/statuts";
import type { RdvSuppressionHistorique, StatutRdv } from "@/types/models";

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

function statutLabel(raw: string | null): string {
  if (!raw || !(raw in STATUT_LABELS)) return raw ?? "—";
  return STATUT_LABELS[raw as StatutRdv];
}

export function HistoriqueRdvPage() {
  const [rows, setRows] = useState<RdvSuppressionHistorique[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmRow, setConfirmRow] = useState<RdvSuppressionHistorique | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await listHistoriqueSuppressionsRdv();
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    setRows(r.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDeleteRow() {
    if (!confirmRow) return;
    const id = confirmRow.id;
    const r = await deleteHistoriqueSuppression(id);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Entrée supprimée");
    setConfirmRow(null);
    await load();
  }

  async function handleClearAll() {
    const r = await clearHistoriqueSuppressions();
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Historique vidé");
    setConfirmClearAll(false);
    await load();
  }

  return (
    <>
      <PageShell
        title="Historique des RDV supprimés"
        description="Chaque suppression définitive copie le créneau dans cette table , puis supprime le RDV."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1 font-normal">
              <History className="mr-1.5 inline h-3.5 w-3.5" aria-hidden />
              {rows.length} entrée{rows.length !== 1 ? "s" : ""}
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={loading || rows.length === 0}
              onClick={() => setConfirmClearAll(true)}
            >
              Vider l&apos;historique
            </Button>
          </div>
        }
      >
        <Card className="border-0 bg-card/85 shadow-card backdrop-blur-sm dark:bg-card/70">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Suppressions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : (
              <ScrollArea className="max-h-[min(70vh,560px)] rounded-xl border border-border/80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supprimé le</TableHead>
                      <TableHead>Ancien RDV #</TableHead>
                      <TableHead>Créneau (était)</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Médecin</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Statut (était)</TableHead>
                      <TableHead className="w-[72px] text-right"> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-16 text-center text-muted-foreground">
                          Aucune suppression enregistrée. Les suppressions définitives depuis l’agenda
                          apparaissent ici.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {formatDt(h.supprime_le)}
                          </TableCell>
                          <TableCell className="tabular-nums font-medium">
                            {h.ancien_rdv_id}
                          </TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {formatDt(h.date_heure)}
                          </TableCell>
                          <TableCell>
                            {[h.patient_nom, h.patient_prenom].filter(Boolean).join(" ") || "—"}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{h.medecin_nom ?? "—"}</span>
                            {h.medecin_specialite ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {h.medecin_specialite}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {h.motif ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal">
                              {statutLabel(h.statut)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setConfirmRow(h)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer cette entrée</TooltipContent>
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

      <Dialog open={!!confirmRow} onOpenChange={(o) => !o && setConfirmRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette entrée ?</DialogTitle>
            <DialogDescription>
              Ligne d&apos;historique pour l&apos;ancien RDV #
              {confirmRow ? (
                <span className="font-medium text-foreground"> {confirmRow.ancien_rdv_id}</span>
              ) : null}
              . Cette action est définitive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setConfirmRow(null)}>
              Retour
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => void handleDeleteRow()}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vider tout l&apos;historique ?</DialogTitle>
            <DialogDescription>
              Toutes les entrées (
              <strong className="text-foreground">{rows.length}</strong>) seront supprimées de la table.
              Opération définitive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setConfirmClearAll(false)}>
              Retour
            </Button>
            <Button variant="destructive" className="rounded-full" onClick={() => void handleClearAll()}>
              Tout supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
