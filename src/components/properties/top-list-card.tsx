"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export interface TopRow {
  key: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface Props {
  title: string;
  description?: string;
  keyLabel: string;
  rows: TopRow[];
  onViewAll?: () => void;
  viewAllLabel?: string;
  limit?: number;
}

export function TopListCard({
  title,
  description,
  keyLabel,
  rows,
  onViewAll,
  viewAllLabel = "View all",
  limit = 10,
}: Props) {
  const sorted = [...rows]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
          >
            {viewAllLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <div className="px-6 pb-6 text-sm text-muted-foreground">
            No data yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              <div>{keyLabel}</div>
              <div className="text-right">Impressions</div>
              <div className="text-right">Clicks</div>
              <div className="text-right">Pos</div>
            </div>
            {sorted.map((r) => (
              <div
                key={r.key}
                className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-2.5 text-sm items-center"
              >
                <div className="truncate font-medium" title={r.key}>
                  {r.key}
                </div>
                <div className="text-right tabular-nums">
                  {r.impressions.toLocaleString()}
                </div>
                <div className="text-right tabular-nums">
                  {r.clicks.toLocaleString()}
                </div>
                <div className="text-right tabular-nums text-muted-foreground">
                  {r.position.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
