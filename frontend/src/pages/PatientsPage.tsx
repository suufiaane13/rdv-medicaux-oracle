import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
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
import {
  createPatient,
  deletePatient,
  listPatients,
  patchPatient,
} from "@/lib/api";
import type { Patient } from "@/types/models";

const CIN_PATTERN = /^[A-Z]{1,2}[0-9]{5,6}$/;

function parseCinOptional(raw: string): string | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  const u = s.toUpperCase();
  if (!CIN_PATTERN.test(u)) return undefined;
  return u;
}

export function PatientsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [rows, setRows] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [cin, setCin] = useState("");

  const [edit, setEdit] = useState<Patient | null>(null);
  const [editNom, setEditNom] = useState("");
  const [editPrenom, setEditPrenom] = useState("");
  const [editTel, setEditTel] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCin, setEditCin] = useState("");

  const [confirmDelete, setConfirmDelete] = useState<Patient | null>(null);

  async function load(p = page, search = q) {
    setLoading(true);
    const r = await listPatients(search || undefined, p, pageSize);
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    setRows(r.data);
    setTotal(r.meta?.total ?? r.data.length);
  }

  useEffect(() => {
    void load(1, "");
    setPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    await load(1, q);
  }

  async function handleCreate() {
    if (!nom.trim() || !prenom.trim()) {
      toast.error("Nom et prénom obligatoires.");
      return;
    }
    if (cin.trim()) {
      const ok = parseCinOptional(cin);
      if (!ok) {
        toast.error(
          "CIN invalide : 1 ou 2 lettres puis 5 ou 6 chiffres (ex. AB123456).",
        );
        return;
      }
    }
    const r = await createPatient({
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: tel.trim() || undefined,
      email: email.trim() || undefined,
      cin: parseCinOptional(cin),
    });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Patient enregistré");
    setOpen(false);
    setNom("");
    setPrenom("");
    setTel("");
    setEmail("");
    setCin("");
    await load(page, q);
  }

  function openEdit(p: Patient) {
    setEdit(p);
    setEditNom(p.nom);
    setEditPrenom(p.prenom);
    setEditTel(p.telephone ?? "");
    setEditEmail(p.email ?? "");
    setEditCin(p.cin ?? "");
  }

  async function handleSaveEdit() {
    if (!edit) return;
    if (!editNom.trim() || !editPrenom.trim()) {
      toast.error("Nom et prénom obligatoires.");
      return;
    }
    if (editCin.trim()) {
      const ok = parseCinOptional(editCin);
      if (!ok) {
        toast.error(
          "CIN invalide : 1 ou 2 lettres puis 5 ou 6 chiffres (ex. AB123456).",
        );
        return;
      }
    }
    const r = await patchPatient(edit.id, {
      nom: editNom.trim(),
      prenom: editPrenom.trim(),
      telephone: editTel.trim() || null,
      email: editEmail.trim() || null,
      cin: editCin.trim() ? parseCinOptional(editCin) : null,
    });
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Fiche patient mise à jour");
    setEdit(null);
    await load(page, q);
  }

  async function handleConfirmDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    const r = await deletePatient(id);
    if (!r.ok) {
      toast.error(r.error.message, { duration: 9000 });
      return;
    }
    toast.success("Patient supprimé");
    setConfirmDelete(null);
    if (edit?.id === id) setEdit(null);
    await load(page, q);
  }

  return (
    <>
      <PageShell
        title="Patients"
        description="Recherche par nom, prénom, téléphone ou CIN — pagination intégrée."
        actions={
          <Button size="sm" className="rounded-full shadow-sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau patient
          </Button>
        }
      >
        <Card className="border-0 bg-card/85 shadow-card backdrop-blur-sm dark:bg-card/70">
          <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Annuaire</CardTitle>
              <CardDescription>{total} fiche(s) au total</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <form
              onSubmit={(e) => void handleSearch(e)}
              className="flex max-w-2xl flex-wrap items-end gap-3"
            >
              <div className="grid min-w-[200px] flex-1 gap-2">
                <Label htmlFor="search">Recherche</Label>
                <Input
                  id="search"
                  placeholder="Nom, prénom, téléphone, CIN…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-11 rounded-lg shadow-sm"
                />
              </div>
              <Button type="submit" variant="secondary" className="rounded-full" disabled={loading}>
                Rechercher
              </Button>
            </form>

            {loading && rows.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : (
              <ScrollArea className="h-[min(480px,55vh)] rounded-xl border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nom</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>CIN</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-16 text-center text-muted-foreground">
                          Aucun résultat pour cette recherche.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.nom}</TableCell>
                          <TableCell>{p.prenom}</TableCell>
                          <TableCell className="font-mono tabular-nums text-muted-foreground">
                            {p.cin ?? "—"}
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {p.telephone ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.email ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full"
                                  onClick={() => openEdit(p)}
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
                                  onClick={() => setConfirmDelete(p)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Supprimer</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
              <p className="text-sm text-muted-foreground">
                Page <strong className="text-foreground">{page}</strong> sur{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    const np = page - 1;
                    setPage(np);
                    void load(np, q);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page >= totalPages || loading}
                  onClick={() => {
                    const np = page + 1;
                    setPage(np);
                    void load(np, q);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </PageShell>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau patient</DialogTitle>
            <DialogDescription>Coordonnées pour la fiche secrétariat.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-1 sm:grid-cols-2 sm:gap-x-4">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                className="h-11 rounded-lg"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                className="h-11 rounded-lg"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="cin">CIN</Label>
              <Input
                id="cin"
                className="h-11 rounded-lg font-mono uppercase"
                placeholder="ex. AB123456"
                autoCapitalize="characters"
                maxLength={8}
                value={cin}
                onChange={(e) => setCin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optionnel. Format : 1 ou 2 lettres puis 5 ou 6 chiffres.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input
                id="tel"
                className="h-11 rounded-lg"
                value={tel}
                onChange={(e) => setTel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                className="h-11 rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
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
            <DialogTitle>Modifier le patient</DialogTitle>
            <DialogDescription>Mettre à jour la fiche dans l’annuaire.</DialogDescription>
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
              <Label htmlFor="eprenom">Prénom</Label>
              <Input
                id="eprenom"
                className="h-11 rounded-lg"
                value={editPrenom}
                onChange={(e) => setEditPrenom(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="ecin">CIN</Label>
              <Input
                id="ecin"
                className="h-11 rounded-lg font-mono uppercase"
                placeholder="ex. AB123456"
                maxLength={8}
                value={editCin}
                onChange={(e) => setEditCin(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Laisser vide pour retirer le CIN. Sinon : 1 ou 2 lettres puis 5 ou 6 chiffres.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="etel">Téléphone</Label>
              <Input
                id="etel"
                className="h-11 rounded-lg"
                value={editTel}
                onChange={(e) => setEditTel(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="eemail">Email</Label>
              <Input
                id="eemail"
                type="email"
                className="h-11 rounded-lg"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
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
            <DialogTitle>Supprimer ce patient ?</DialogTitle>
            {confirmDelete ? (
              <DialogDescription asChild>
                <div className="space-y-4 pt-1 text-foreground">
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-border/80 bg-muted/35 px-4 py-4 text-center">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <User className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0 max-w-full space-y-0.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Patient
                      </p>
                      <p className="break-words text-base font-semibold leading-snug tracking-tight">
                        {confirmDelete.nom} {confirmDelete.prenom}
                      </p>
                      {confirmDelete.cin ? (
                        <p className="font-mono text-xs tabular-nums text-muted-foreground">
                          {confirmDelete.cin}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5 dark:bg-amber-500/[0.08]">
                    <p className="text-sm font-semibold text-foreground">Condition</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      La suppression n&apos;est possible que lorsqu&apos;
                      <strong className="font-medium text-foreground"> aucun rendez-vous </strong>
                      ne référence encore ce patient.
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
