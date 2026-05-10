import { Activity, Calendar, History, Home, Stethoscope, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/agenda", label: "Agenda & RDV", icon: Calendar },
  { to: "/historique-rdv", label: "Historique RDV", icon: History },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/medecins", label: "Médecins", icon: Stethoscope },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[278px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-soft">
      <div className="flex items-center gap-3 px-6 pb-6 pt-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-4 ring-primary/20">
          <Activity className="h-6 w-6" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Cabinet
          </p>
          <p className="truncate text-lg font-bold leading-tight tracking-tight">
            Planning médical
          </p>
        </div>
      </div>

      <Separator className="mx-4 bg-sidebar-border" />

      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="flex flex-col gap-1.5" aria-label="Navigation principale">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-ring/30"
                    : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
                )
              }
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/60 transition-colors group-hover:bg-background",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-6 py-5">
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
          <span>Projet d&apos;étude</span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <a
            href={`${import.meta.env.BASE_URL}mld.html`}
            className="font-semibold text-primary underline-offset-2 hover:text-primary/90 hover:underline"
            target="mld-schema"
            rel="noreferrer"
          >
            Schéma MLD (HTML)
          </a>
        </p>
      </div>
    </aside>
  );
}
