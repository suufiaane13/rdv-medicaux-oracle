import { type FormEvent, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, registerAccount } from "@/lib/api";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from
    ?.pathname;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  function goLoginTab() {
    setMode("login");
    setUsername("demo");
    setPassword("demo");
    setPasswordConfirm("");
  }

  function goRegisterTab() {
    setMode("register");
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "login") {
      const r = await login(username, password);
      setLoading(false);
      if (!r.ok) {
        toast.error(r.error.message);
        return;
      }
      toast.success("Connexion réussie");
      navigate(from && from !== "/login" ? from : "/", { replace: true });
      return;
    }

    if (password !== passwordConfirm) {
      setLoading(false);
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setLoading(false);
      toast.error("Mot de passe : au moins 6 caractères.");
      return;
    }

    const r = await registerAccount({
      username: username.trim(),
      password,
      password_confirm: passwordConfirm,
    });
    setLoading(false);
    if (!r.ok) {
      toast.error(r.error.message);
      return;
    }
    toast.success("Compte créé — vous êtes connecté");
    navigate(from && from !== "/login" ? from : "/", { replace: true });
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="absolute right-5 top-5 z-10 lg:right-8 lg:top-8">
        <ThemeToggle />
      </div>

      <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-teal-700 to-slate-900 text-primary-foreground lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12 lg:text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0%, transparent 45%), radial-gradient(circle at 80% 30%, hsl(173 70% 55%) 0%, transparent 40%)",
          }}
        />
        <div className="relative flex w-full max-w-lg flex-col items-center gap-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-foreground/80">
              Espace professionnel
            </p>
            <h2 className="mx-auto max-w-md text-3xl font-bold leading-tight tracking-tight">
              Rendez-vous et dossiers patients.
            </h2>
            <p className="mx-auto max-w-sm text-sm text-primary-foreground/85">
              Interface sobre — listes et formulaires lisibles.
            </p>
          </div>

          <ul className="w-full max-w-sm space-y-3 text-sm text-primary-foreground/90">
            <li className="flex justify-center gap-2.5 rounded-lg bg-black/15 px-3 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
              Agenda filtré : dates, médecin, statut.
            </li>
            <li className="flex justify-center gap-2.5 rounded-lg bg-black/15 px-3 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
              Oracle + API Flask (Python).
            </li>
            <li className="flex justify-center gap-2.5 rounded-lg bg-black/15 px-3 py-2.5 backdrop-blur-sm ring-1 ring-white/10">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
              Thème clair / sombre.
            </li>
          </ul>
        </div>
      </section>

      <div className="flex flex-col justify-center px-5 py-14 sm:px-10">
        <Card className="mx-auto w-full max-w-md border-0 shadow-2xl ring-1 ring-border/50 dark:ring-border/80">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex rounded-xl bg-muted/80 p-1 ring-1 ring-border/60">
              <button
                type="button"
                onClick={() => goLoginTab()}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
                  mode === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => goRegisterTab()}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors",
                  mode === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Créer un compte
              </button>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Connexion" : "Nouveau compte"}
              </CardTitle>
              <CardDescription className="text-base">
                {mode === "login" ? (
                  <>
                    Compte démo :{" "}
                    <strong className="font-semibold text-foreground">demo</strong> /{" "}
                    <strong className="font-semibold text-foreground">demo</strong>
                  </>
                ) : (
                  "Choisissez un identifiant et un mot de passe (min. 6 caractères)."
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  className="h-11 rounded-lg shadow-sm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="h-11 rounded-lg shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "register" ? 6 : undefined}
                />
              </div>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="password-confirm">Confirmer le mot de passe</Label>
                  <Input
                    id="password-confirm"
                    type="password"
                    autoComplete="new-password"
                    className="h-11 rounded-lg shadow-sm"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}
              <Button
                type="submit"
                className="h-11 w-full rounded-lg text-base"
                disabled={loading}
              >
                {loading
                  ? mode === "login"
                    ? "Connexion…"
                    : "Création…"
                  : mode === "login"
                    ? "Se connecter"
                    : "Créer le compte"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
