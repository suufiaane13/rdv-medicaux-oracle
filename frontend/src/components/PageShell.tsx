import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  descriptionClassName,
  actions,
  children,
}: {
  title: string;
  description?: string;
  descriptionClassName?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {title}
          </h1>
          {description ? (
            <div className="min-w-0 overflow-x-auto">
              <p
                className={cn(
                  "text-base text-muted-foreground",
                  descriptionClassName ?? "max-w-2xl",
                )}
              >
                {description}
              </p>
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children != null ? (
        <div className="space-y-8">{children}</div>
      ) : null}
    </div>
  );
}
