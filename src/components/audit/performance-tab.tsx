"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Smartphone,
  Monitor,
  RefreshCw,
  Zap,
  AlertTriangle,
} from "lucide-react";

export interface CwvRow {
  id: string;
  url: string;
  strategy: "mobile" | "desktop";
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  bestPracticesScore: number | null;
  lcpMs: number | null;
  fcpMs: number | null;
  clsScore: number | null;
  inpMs: number | null;
  ttfbMs: number | null;
  speedIndex: number | null;
  topIssues: Array<{
    id: string;
    title: string;
    description: string;
    savingsMs?: number;
  }>;
  fetchedAt: string;
}

function scoreColor(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function lcpRating(ms: number | null): { label: string; color: string } {
  if (ms == null) return { label: "—", color: "text-muted-foreground" };
  if (ms <= 2500) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  if (ms <= 4000) return { label: "Needs work", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Poor", color: "text-rose-600 dark:text-rose-400" };
}

function clsRating(v: number | null): { label: string; color: string } {
  if (v == null) return { label: "—", color: "text-muted-foreground" };
  if (v <= 0.1) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  if (v <= 0.25) return { label: "Needs work", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Poor", color: "text-rose-600 dark:text-rose-400" };
}

function inpRating(ms: number | null): { label: string; color: string } {
  if (ms == null) return { label: "—", color: "text-muted-foreground" };
  if (ms <= 200) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400" };
  if (ms <= 500) return { label: "Needs work", color: "text-amber-600 dark:text-amber-400" };
  return { label: "Poor", color: "text-rose-600 dark:text-rose-400" };
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname === "/" ? u.host : `${u.host}${u.pathname}`;
  } catch {
    return url;
  }
}

export function PerformanceTab({ auditId }: { auditId: string }) {
  const [rows, setRows] = useState<CwvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const res = await fetch(`/api/audit/${auditId}/cwv`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.results);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [auditId]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(load, 6000);
    return () => clearInterval(t);
  }, [running]);

  const start = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch(`/api/audit/${auditId}/cwv`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to start");
        setRunning(false);
      }
    } catch {
      setError("Failed to start");
      setRunning(false);
    }
  };

  const filtered = rows.filter((r) => r.strategy === strategy);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading performance data…</div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No performance data yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Run Google&apos;s PageSpeed Insights against your homepage and priority
            pages to get Core Web Vitals, accessibility, SEO, and
            best-practices scores.
          </p>
          <Button onClick={start} disabled={running} className="gap-2">
            <RefreshCw
              className={`h-4 w-4 ${running ? "animate-spin" : ""}`}
            />
            {running ? "Running (may take 1-2 min)…" : "Run PageSpeed Insights"}
          </Button>
          {error && (
            <p className="text-sm text-rose-600 dark:text-rose-400 mt-3">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs
          value={strategy}
          onValueChange={(v) => setStrategy(v as "mobile" | "desktop")}
        >
          <TabsList>
            <TabsTrigger value="mobile" className="gap-1.5">
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="desktop" className="gap-1.5">
              <Monitor className="h-3.5 w-3.5" />
              Desktop
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          onClick={start}
          disabled={running}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${running ? "animate-spin" : ""}`}
          />
          {running ? "Running…" : "Refresh"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {strategy} data yet.
        </p>
      ) : (
        filtered.map((r) => <PageCard key={r.id} row={r} />)
      )}
    </div>
  );
}

function PageCard({ row }: { row: CwvRow }) {
  const lcp = lcpRating(row.lcpMs);
  const cls = clsRating(row.clsScore);
  const inp = inpRating(row.inpMs);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base break-all">
          {shortUrl(row.url)}
        </CardTitle>
        <CardDescription>
          Fetched {new Date(row.fetchedAt).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lighthouse category scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Performance", value: row.performanceScore },
            { label: "Accessibility", value: row.accessibilityScore },
            { label: "Best practices", value: row.bestPracticesScore },
            { label: "SEO", value: row.seoScore },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-border rounded-md p-3 text-center"
            >
              <div className={`text-2xl font-bold tabular-nums ${scoreColor(s.value)}`}>
                {s.value ?? "—"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Core Web Vitals */}
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Core Web Vitals
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              name="LCP"
              fullName="Largest Contentful Paint"
              value={
                row.lcpMs != null
                  ? `${(row.lcpMs / 1000).toFixed(2)} s`
                  : "—"
              }
              rating={lcp}
            />
            <MetricCard
              name="CLS"
              fullName="Cumulative Layout Shift"
              value={row.clsScore != null ? row.clsScore.toFixed(3) : "—"}
              rating={cls}
            />
            <MetricCard
              name="INP"
              fullName="Interaction to Next Paint"
              value={row.inpMs != null ? `${row.inpMs} ms` : "—"}
              rating={inp}
            />
          </div>
          <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              FCP:{" "}
              <span className="text-foreground">
                {row.fcpMs != null ? `${(row.fcpMs / 1000).toFixed(2)} s` : "—"}
              </span>
            </div>
            <div>
              TTFB:{" "}
              <span className="text-foreground">
                {row.ttfbMs != null ? `${row.ttfbMs} ms` : "—"}
              </span>
            </div>
            <div>
              Speed Index:{" "}
              <span className="text-foreground">
                {row.speedIndex != null
                  ? `${(row.speedIndex / 1000).toFixed(2)} s`
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Top issues to fix */}
        {row.topIssues.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              What to fix ({row.topIssues.length})
            </div>
            <ul className="space-y-3">
              {row.topIssues.map((issue) => (
                <li
                  key={issue.id}
                  className="border-l-2 border-amber-500/60 pl-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-sm">{issue.title}</div>
                    {issue.savingsMs && issue.savingsMs > 100 && (
                      <Badge variant="outline" className="font-mono text-xs shrink-0">
                        -{(issue.savingsMs / 1000).toFixed(2)}s
                      </Badge>
                    )}
                  </div>
                  {issue.description && (
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {issue.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  name,
  fullName,
  value,
  rating,
}: {
  name: string;
  fullName: string;
  value: string;
  rating: { label: string; color: string };
}) {
  return (
    <div className="border border-border rounded-md p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-wide">{name}</div>
          <div className="text-xs text-muted-foreground">{fullName}</div>
        </div>
        <div className={`text-xs font-medium ${rating.color}`}>
          {rating.label}
        </div>
      </div>
      <div className="text-xl font-bold tabular-nums mt-2">{value}</div>
    </div>
  );
}
