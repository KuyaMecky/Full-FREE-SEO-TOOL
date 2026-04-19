"use client";

import * as React from "react";
import { BookOpen, ChevronDown, Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guide } from "@/lib/guides";

interface Props {
  guideKey: string; // used for localStorage persistence
  guide: Guide;
  className?: string;
}

const STORAGE_PREFIX = "guide_dismissed_";

export function HelpBanner({ guideKey, guide, className }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    const saved =
      typeof window !== "undefined"
        ? window.localStorage.getItem(`${STORAGE_PREFIX}${guideKey}`)
        : null;
    if (saved === "1") setDismissed(true);
  }, [guideKey]);

  // Hide entirely before mount to avoid SSR flicker
  if (!mounted || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${guideKey}`, "1");
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent mb-6",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left"
      >
        <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <BookOpen className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">How this works</div>
          <div className="text-xs text-muted-foreground truncate">
            {open ? "Click to collapse" : "Click to see a 3-step walkthrough"}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground shrink-0 transition-transform",
            open ? "rotate-180" : ""
          )}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-border/60">
          <p className="text-sm text-foreground/80 leading-relaxed mb-4">
            {guide.summary}
          </p>

          <ol className="space-y-3 mb-4">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="h-6 w-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {guide.tip && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-foreground/80">
                <strong className="text-foreground">Tip:</strong> {guide.tip}
              </span>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Don&apos;t show this again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
