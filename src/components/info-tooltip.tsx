"use client";

import * as React from "react";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  content: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}

/**
 * Wrap any label with this to add a small (i) icon with a hover tooltip.
 * If no children provided, just shows the icon.
 */
export function InfoTooltip({ content, className, children, side = "top" }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {children}
      <Tooltip>
        <TooltipTrigger
          className="inline-flex items-center justify-center rounded-full text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-help"
          aria-label="More info"
        >
          <Info className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs text-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

export const METRIC_DEFINITIONS: Record<string, string> = {
  impressions:
    "How many times a result from your site appeared in Google search.",
  clicks: "How many times a searcher clicked a result to your site.",
  ctr: "Click-through rate = clicks ÷ impressions. Higher is better.",
  position:
    "Average ranking position in Google search. Lower is better (1 = first result).",
  lcp: "Largest Contentful Paint — time until the main content is visible. Target ≤ 2.5s.",
  fcp: "First Contentful Paint — time until anything is painted on screen.",
  cls: "Cumulative Layout Shift — how much things jump around as the page loads. Target ≤ 0.1.",
  inp: "Interaction to Next Paint — how fast the page responds to clicks/taps. Target ≤ 200ms.",
  ttfb: "Time to First Byte — how fast the server responds.",
  speedIndex:
    "Speed Index — how quickly content is visually displayed during page load.",
  flesch:
    "Flesch Reading Ease — higher is easier to read. 60-70 = plain English, 90+ = very easy.",
  nofollow:
    'Links with rel="nofollow" — Google doesn\'t pass ranking signals through them.',
  canonical:
    "The canonical URL tells Google which version of a page is the primary one when duplicates exist.",
};
