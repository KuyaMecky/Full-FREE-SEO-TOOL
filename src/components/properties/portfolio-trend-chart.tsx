"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DatePoint {
  date: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface PropertyLike {
  id: string;
  siteUrl: string;
  latestSnapshot:
    | {
        byDate?: DatePoint[];
      }
    | null;
}

type Metric = "impressions" | "clicks" | "position";

const LINE_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#ca8a04", // amber
  "#db2777", // pink
  "#65a30d", // lime
  "#7c3aed", // violet
  "#059669", // emerald
  "#c026d3", // fuchsia
];

// Strip protocol + trailing slash for display
function shortLabel(siteUrl: string): string {
  return siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

// Keys must be safe as recharts dataKey — use property id, not URL
export function PortfolioTrendChart({
  properties,
}: {
  properties: PropertyLike[];
}) {
  const [metric, setMetric] = useState<Metric>("impressions");

  const { data, sitesWithData } = useMemo(() => {
    const sitesWithData = properties.filter(
      (p) => (p.latestSnapshot?.byDate ?? []).length > 0
    );

    // Collect all unique dates across all sites
    const allDates = new Set<string>();
    for (const p of sitesWithData) {
      for (const r of p.latestSnapshot?.byDate ?? []) {
        if (r.date) allDates.add(r.date);
      }
    }
    const sortedDates = Array.from(allDates).sort();

    // Build a row per date with each site as a column (keyed by property id)
    const data = sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      for (const p of sitesWithData) {
        const match = (p.latestSnapshot?.byDate ?? []).find(
          (r) => r.date === date
        );
        row[p.id] = match ? match[metric] : 0;
      }
      return row;
    });

    return { data, sitesWithData };
  }, [properties, metric]);

  if (sitesWithData.length === 0) {
    return null;
  }

  const axisLabel =
    metric === "impressions"
      ? "Impressions"
      : metric === "clicks"
        ? "Clicks"
        : "Avg. Position";

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
        <div>
          <CardTitle className="text-base">Traction by site · 28 days</CardTitle>
          <CardDescription>
            Per-site trend. Hover to compare, click a legend item to hide a
            line.
          </CardDescription>
        </div>
        <div className="inline-flex rounded-md border border-border p-0.5 bg-muted/40">
          {(["impressions", "clicks", "position"] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`px-3 py-1 text-xs rounded-sm transition-colors capitalize ${
                metric === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "position" ? "Avg. position" : m}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-border"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(d) => (typeof d === "string" ? d.slice(5) : "")}
                stroke="currentColor"
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="currentColor"
                className="text-muted-foreground"
                reversed={metric === "position"}
                label={{
                  value: axisLabel,
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 11,
                  fill: "currentColor",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--popover-foreground)" }}
                formatter={(value: number) =>
                  metric === "position"
                    ? value.toFixed(1)
                    : value.toLocaleString()
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="line"
              />
              {sitesWithData.map((p, i) => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.id}
                  name={shortLabel(p.siteUrl)}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
