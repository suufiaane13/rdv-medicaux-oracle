import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { Skeleton } from "@/components/ui/skeleton";
import { getMe } from "@/lib/api";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await getMe();
      if (cancelled) return;
      setState(r.ok ? "in" : "out");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="mesh-bg flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-8 backdrop-blur-md">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </header>
        <div className="flex flex-1 gap-6 p-8">
          <Skeleton className="hidden h-auto w-64 rounded-2xl lg:block" />
          <div className="flex flex-1 flex-col gap-6">
            <Skeleton className="h-10 max-w-md rounded-lg" />
            <Skeleton className="h-48 flex-1 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (state === "out") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
