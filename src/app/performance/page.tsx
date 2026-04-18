"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Smartphone,
  Monitor,
  AlertCircle,
  RefreshCw,
  AlertTriangle,
  Badge as BadgeIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PsiResult {
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
}

function scoreColor(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function rate(
  v: number | null,
  good: number,
  needs: number,
  higherIsBetter = false
): { label: string; color: string } {
  if (v == null) return { label: "—", color: "text-muted-foreground" };
  const isGood = higherIsBetter ? v >= good : v <= good;
  const isNeeds = higherIsBetter ? v >= needs : v <= needs;
  if (isGood)
    return {
      label: "Good",
      color: "text-emerald-600 dark:text-emerald-400",
    };
  if (isNeeds)
    return {
      label: "Needs work",
      color: "text-amber-600 dark:text-amber-400",
    };
  return { label: "Poor", color: "text-rose-600 dark:text-rose-400" };
}

export default function PerformancePage() {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [result, setResult] = useState<PsiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, strategy }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.result);
      else setError(data.error || "Failed");
    } catch {
      setError("Failed to fetch PSI");
    } finally {
      setLoading(false);
    }
  };

  const lcp = rate(result?.lcpMs ?? null, 2500, 4000);
  const cls = rate(result?.clsScore ?? null, 0.1, 0.25);
  const inp = rate(result?.inpMs ?? null, 200, 500);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-7 w-7 text-amber-500" />
          Performance
        </h1>
        <p className="text-muted-foreground mt-1">
          Run Google PageSpeed Insights against any URL. See Core Web Vitals,
          Lighthouse category scores, and concrete fixes.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Analyze a URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  run();
                }
              }}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
            <Button onClick={run} disabled={loading} className="gap-2">
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Running (30-60s)…" : "Analyze"}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base break-all">{result.url}</CardTitle>
            <CardDescription>
              {result.strategy === "mobile" ? "Mobile" : "Desktop"} · Lighthouse{" "}
              + field data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Performance", value: result.performanceScore },
                { label: "Accessibility", value: result.accessibilityScore },
                { label: "Best practices", value: result.bestPracticesScore },
                { label: "SEO", value: result.seoScore },
              ].map((s) => (
                <div
                  key={s.label}
                  className="border border-border rounded-md p-3 text-center"
                >
                  <div
                    className={`text-2xl font-bold tabular-nums ${scoreColor(s.value)}`}
                  >
                    {s.value ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Core Web Vitals
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard
                  name="LCP"
                  fullName="Largest Contentful Paint"
                  value={
                    result.lcpMs != null
                      ? `${(result.lcpMs / 1000).toFixed(2)} s`
                      : "—"
                  }
                  rating={lcp}
                />
                <MetricCard
                  name="CLS"
                  fullName="Cumulative Layout Shift"
                  value={
                    result.clsScore != null
                      ? result.clsScore.toFixed(3)
                      : "—"
                  }
                  rating={cls}
                />
                <MetricCard
                  name="INP"
                  fullName="Interaction to Next Paint"
                  value={result.inpMs != null ? `${result.inpMs} ms` : "—"}
                  rating={inp}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  FCP:{" "}
                  <span className="text-foreground">
                    {result.fcpMs != null
                      ? `${(result.fcpMs / 1000).toFixed(2)} s`
                      : "—"}
                  </span>
                </div>
                <div>
                  TTFB:{" "}
                  <span className="text-foreground">
                    {result.ttfbMs != null ? `${result.ttfbMs} ms` : "—"}
                  </span>
                </div>
                <div>
                  Speed Index:{" "}
                  <span className="text-foreground">
                    {result.speedIndex != null
                      ? `${(result.speedIndex / 1000).toFixed(2)} s`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {result.topIssues.length > 0 && (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  What to fix ({result.topIssues.length})
                </div>
                <ul className="space-y-3">
                  {result.topIssues.map((issue) => (
                    <li
                      key={issue.id}
                      className="border-l-2 border-amber-500/60 pl-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium text-sm">
                          {issue.title}
                        </div>
                        {issue.savingsMs && issue.savingsMs > 100 && (
                          <Badge
                            variant="outline"
                            className="font-mono text-xs shrink-0"
                          >
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
      )}
    </div>
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
