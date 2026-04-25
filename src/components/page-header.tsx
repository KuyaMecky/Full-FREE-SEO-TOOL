"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  accent?: "primary" | "emerald" | "amber" | "rose" | "purple" | "blue";
  actions?: React.ReactNode;
  className?: string;
  badge?: string;
}

export function PageHeader({ title, description, actions, className, badge }: Props) {
  return (
    <div className={cn("flex items-start justify-between gap-6 mb-8", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-[22px] font-bold tracking-tight leading-none">{title}</h1>
          {badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 mt-0.5">{actions}</div>
      )}
    </div>
  );
}
