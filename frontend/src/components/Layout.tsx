import { ChevronDown, LogOut, Sparkles } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { getMe, logout } from "@/lib/api";

export function Layout() {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const syncScrollbarWidth = () => {
      const y = main.offsetWidth - main.clientWidth;
      document.documentElement.style.setProperty(
        "--layout-main-scrollbar-y",
        `${Math.max(0, y)}px`,
      );
    };

    syncScrollbarWidth();
    const ro = new ResizeObserver(syncScrollbarWidth);
    ro.observe(main);
    window.addEventListener("resize", syncScrollbarWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncScrollbarWidth);
      document.documentElement.style.removeProperty("--layout-main-scrollbar-y");
    };
  }, []);

  useEffect(() => {
    void getMe().then((r) => {
      if (r.ok) setUsername(r.data.username);
    });
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="flex min-h-screen mesh-bg">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/75 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="truncate">Vue métier</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Separator orientation="vertical" className="hidden h-8 sm:block" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 gap-2 rounded-full border-border/80 pl-1.5 pr-3 shadow-sm"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-[120px] truncate text-sm font-medium sm:inline">
                    {username || "…"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-semibold">Session active</p>
                  <p className="truncate text-xs text-muted-foreground">{username}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => void handleLogout()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1400px] px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
