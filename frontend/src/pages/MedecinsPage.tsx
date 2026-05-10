import { Calendar, Pencil, Plus, Stethoscope, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
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
import { createMedecin, deleteMedecin, listMedecins, patchMedecin } from "@/lib/api";
import type { Medecin } from "@/types/models";

export function MedecinsPage() {
  const [rows, setRows] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(false);

  const [openNew, setOpenNew] = useState(false);
  const [nom, setNom] = useState("");
  const [specialite, setSpecialite] = useState("");

  const [edit, setEdit] = useState<Medecin | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editSpec, setEditSpec] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Medecin | null>(null);

  async function load() {
    setLoading(true);
    const r = await listMedecins();
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    setRows(r.data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreate() {
    if (!nom.trim() || !specialite.trim()) {
      toast.error("Nom et spécialité obligatoires.");
      return;
    }
    const r = await createMedecin({ nom: nom.trim(), specialite: specialite.trim() });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Médecin ajouté");
    setOpenNew(false);
    setNom("");
    setSpecialite("");
    await load();
  }

  function openEdit(m: Medecin) {
    setEdit(m);
    setEditNom(m.nom);
    setEditSpec(m.specialite);
  }

  async function handleSaveEdit() {
    if (!edit) return;
    const r = await patchMedecin(edit.id, {
      nom: editNom.trim(),
      specialite: editSpec.trim(),
    });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Fiche médecin mise à jour");
    setEdit(null);
    await load();
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    const r = await deleteMedecin(id);
    if (!r.ok) {
      toast.error(r.error.message, { duration: 9000 });
      return;
    }
    toast.success("Médecin supprimé");
    setConfirmDelete(null);
    if (edit?.id === id) setEdit(null);
    await load();
  }

  return (
    <>
      <PageShell
        title="Médecins"
        description="Équipe médicale du cabinet — utilisée pour les rendez-vous et les filtres agenda."
        actions={
          <Button size="sm" className="rounded-full shadow-sm" onClick={() => setOpenNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        }
      >
      <Card className="border-0 bg-card/85 shadow-card backdrop-blur-sm dark:bg-card/70">
        <CardHeader className="border-b border-border/60 pb-6">
          <CardTitle className="text-lg">Équipe médicale</CardTitle>
          <CardDescription>
            {loading ? "Chargement…" : `${rows.length} médecin(s) référencé(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {loading && rows.length === 0 ? (
            <div className="space-y-3 p-6">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <ScrollArea className="h-[min(520px,58vh)] rounded-xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nom</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-semibold">{m.nom}</TableCell>
                      <TableCell className="text-muted-foreground">{m.specialite}</TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => openEdit(m)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setConfirmDelete(m)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
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
            <DialogTitle>Nouveau médecin</DialogTitle>
            <DialogDescription>Nom et spécialité visibles dans les listes et les RDV.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2 sm:gap-x-4">
            <div className="grid gap-2">
              <Label htmlFor="mnom">Nom</Label>
              <Input
                id="mnom"
                className="h-11 rounded-lg"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mspec">Spécialité</Label>
              <Input
                id="mspec"
                className="h-11 rounded-lg"
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setOpenNew(false)}>
              Fermer
            </Button>
            <Button className="rounded-full" onClick={() => void handleCreate()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le médecin</DialogTitle>
            <DialogDescription>Mise à jour pour les prochains rendez-vous.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2 sm:gap-x-4">
            <div className="grid gap-2">
              <Label htmlFor="enom">Nom</Label>
              <Input
                id="enom"
                className="h-11 rounded-lg"
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="espec">Spécialité</Label>
              <Input
                id="espec"
                className="h-11 rounded-lg"
                value={editSpec}
                onChange={(e) => setEditSpec(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setEdit(null)}>
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
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle>Supprimer ce médecin ?</DialogTitle>
            {confirmDelete ? (
              <DialogDescription asChild>
                <div className="space-y-4 pt-1 text-foreground">
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-muted/35 px-4 py-4 text-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 max-w-full space-y-0.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Médecin
                      </p>
                      <p className="break-words text-base font-semibold leading-snug tracking-tight">
                        {confirmDelete.nom}
                      </p>
                      <p className="text-sm text-muted-foreground">{confirmDelete.specialite}</p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5 dark:bg-amber-500/[0.08]">
                    <p className="text-sm font-semibold text-foreground">Condition</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      La suppression n&apos;est possible que lorsqu&apos;
                      <strong className="font-medium text-foreground"> aucun rendez-vous </strong>
                      ne référence encore ce médecin.
                    </p>
                    <div className="flex gap-2.5 text-sm leading-snug text-muted-foreground">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/80 text-xs font-bold text-primary ring-1 ring-border"
                        aria-hidden
                      >
                        1
                      </span>
                      <span>
                        Ouvrez{" "}
                        <Link
                          to="/agenda"
                          className="inline-flex items-center gap-1 font-semibold text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                        >
                          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Agenda &amp; RDV
                        </Link>
                      </span>
                    </div>
                    <div className="flex gap-2.5 text-sm leading-snug text-muted-foreground">
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background/80 text-xs font-bold text-primary ring-1 ring-border"
                        aria-hidden
                      >
                        2
                      </span>
                      <span>Supprimez ou modifiez chaque créneau concerné, puis revenez ici.</span>
                    </div>
                  </div>
                </div>
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setConfirmDelete(null)}>
              Retour
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => void handleConfirmDelete()}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
