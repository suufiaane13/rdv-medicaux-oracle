import { ArrowRight, Calendar, Stethoscope, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAccueilProchainsRdv, getAccueilResume } from "@/lib/api";
import { STATUT_LABELS } from "@/lib/statuts";
import type { AccueilResume, ProchainRdvAccueil, StatutRdv } from "@/types/models";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("fr-FR");

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

function StatCard({
  title,
  value,
  icon: Icon,
  className,
}: {
  title: string;
  value: number;
  icon: typeof Users;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums tracking-tight">{nf.format(value)}</p>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const [data, setData] = useState<AccueilResume | null>(null);
  const [prochains, setProchains] = useState<ProchainRdvAccueil[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [rResume, rProchains] = await Promise.all([
        getAccueilResume(),
        getAccueilProchainsRdv(50),
      ]);
      if (cancelled) return;
      setLoading(false);
      if (!rResume.ok) {
        toast.error(rResume.error.message);
      } else {
        setData(rResume.data);
      }
      if (!rProchains.ok) {
        toast.error(rProchains.error.message);
        setProchains([]);
      } else {
        setProchains(rProchains.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell
      title="Accueil"
      description="Totaux du cabinet et liste des rendez-vous planifiés ou confirmés."
      actions={
        <Button asChild className="rounded-full shadow-sm">
          <Link to="/agenda">
            Agenda &amp; RDV
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          {loading ? (
            <>
              {[1, 2, 3].map((k) => (
                <Card key={k} className="border-border/70">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-28" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-9 w-20" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : data ? (
            <>
              <StatCard title="Patients" value={data.nb_patients} icon={Users} />
              <StatCard title="Médecins" value={data.nb_medecins} icon={Stethoscope} />
              <StatCard title="Rendez-vous" value={data.nb_rdv} icon={Calendar} />
            </>
          ) : null}
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Rendez-vous actifs</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {loading ? (
              <div className="space-y-2 px-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <ScrollArea className="w-full whitespace-nowrap">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[9rem]">Date et heure</TableHead>
                      <TableHead className="min-w-[10rem]">Patient</TableHead>
                      <TableHead className="min-w-[8rem]">Médecin</TableHead>
                      <TableHead className="min-w-[8rem]">Motif</TableHead>
                      <TableHead className="min-w-[7rem] text-right">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prochains.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Aucun rendez-vous planifié ou confirmé. Les statuts annulé / terminé sont exclus.
                        </TableCell>
                      </TableRow>
                    ) : (
                      prochains.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium tabular-nums text-foreground">
                            {formatDt(row.date_heure)}
                          </TableCell>
                          <TableCell>
                            {[row.patient_nom, row.patient_prenom].filter(Boolean).join(" ") ||
                              "—"}
                          </TableCell>
                          <TableCell>
                            <span className="block truncate">{row.medecin_nom ?? "—"}</span>
                            {row.medecin_specialite ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {row.medecin_specialite}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell className="max-w-[14rem] truncate text-muted-foreground">
                            {row.motif?.trim() ? row.motif : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={badgeVariantForStatut(row.statut)}>
                              {STATUT_LABELS[row.statut] ?? row.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
