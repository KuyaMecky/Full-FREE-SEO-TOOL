"use client";

import { cn } from "@/lib/utils";

interface SerpPreviewProps {
  title: string;
  description: string;
  url: string;
  className?: string;
}

const TITLE_LIMIT = 60;
const DESC_LIMIT = 158;

export function SerpPreview({ title, description, url, className }: SerpPreviewProps) {
  const titleTrunc = title.length > TITLE_LIMIT ? title.slice(0, TITLE_LIMIT) + "…" : title;
  const descTrunc = description.length > DESC_LIMIT ? description.slice(0, DESC_LIMIT) + "…" : description;

  const breadcrumb = (() => {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      const parts = [u.hostname, ...u.pathname.split("/").filter(Boolean)];
      return parts.join(" › ");
    } catch { return url; }
  })();

  return (
    <div className={cn("rounded border border-border bg-card p-4 font-sans", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-3">Google SERP preview</p>
      <div className="max-w-[600px] space-y-0.5">
        {/* Favicon + breadcrumb */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full bg-muted border border-border" />
          <p className="text-[13px] text-foreground/80 truncate">{breadcrumb || "your-site.com"}</p>
        </div>

        {/* Title */}
        <p className={cn(
          "text-[20px] leading-snug font-normal cursor-pointer hover:underline",
          "text-[oklch(0.40_0.18_264)] dark:text-[oklch(0.70_0.15_264)]",
          title.length > TITLE_LIMIT && "text-amber-600 dark:text-amber-400"
        )}>
          {titleTrunc || <span className="text-muted-foreground/50 italic">Page title…</span>}
        </p>

        {/* Description */}
        <p className={cn(
          "text-[14px] leading-relaxed",
          "text-[oklch(0.30_0.01_264)] dark:text-[oklch(0.70_0.01_264)]",
          description.length > DESC_LIMIT && "text-amber-600 dark:text-amber-400"
        )}>
          {descTrunc || <span className="text-muted-foreground/50 italic">Meta description…</span>}
        </p>
      </div>

      {/* Char counters */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-border">
        <div>
          <span className={cn("text-[11px] font-semibold", title.length > TITLE_LIMIT ? "text-red-600" : title.length > 50 ? "text-amber-600" : "text-emerald-600")}>
            {title.length}/{TITLE_LIMIT}
          </span>
          <span className="text-[11px] text-muted-foreground ml-1">title chars</span>
        </div>
        <div>
          <span className={cn("text-[11px] font-semibold", description.length > DESC_LIMIT ? "text-red-600" : description.length < 120 ? "text-amber-600" : "text-emerald-600")}>
            {description.length}/{DESC_LIMIT}
          </span>
          <span className="text-[11px] text-muted-foreground ml-1">desc chars</span>
        </div>
      </div>
    </div>
  );
}
