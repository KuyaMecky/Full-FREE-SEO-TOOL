"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  accent?: "primary" | "emerald" | "amber" | "rose" | "purple" | "blue";
  actions?: React.ReactNode;
  className?: string;
}

const ACCENT_GRADIENTS: Record<NonNullable<Props["accent"]>, string> = {
  primary:
    "from-primary/20 via-primary/10 to-transparent",
  emerald:
    "from-emerald-500/20 via-emerald-500/10 to-transparent",
  amber:
    "from-amber-500/20 via-amber-500/10 to-transparent",
  rose:
    "from-rose-500/20 via-rose-500/10 to-transparent",
  purple:
    "from-purple-500/20 via-purple-500/10 to-transparent",
  blue:
    "from-blue-500/20 via-blue-500/10 to-transparent",
};

const ACCENT_ICON_COLORS: Record<NonNullable<Props["accent"]>, string> = {
  primary: "text-primary",
  emerald: "text-emerald-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
  purple: "text-purple-500",
  blue: "text-blue-500",
};

export function PageHeader({
  icon: Icon,
  title,
  description,
  accent = "primary",
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative mb-8 overflow-hidden rounded-xl border border-border bg-card",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          ACCENT_GRADIENTS[accent]
        )}
        aria-hidden
      />
      <div className="relative px-6 py-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={cn(
              "h-11 w-11 shrink-0 rounded-lg bg-card border border-border flex items-center justify-center",
              ACCENT_ICON_COLORS[accent]
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
