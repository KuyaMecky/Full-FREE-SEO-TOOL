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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, X, Sparkles, AlertCircle, Users } from "lucide-react";

interface Insight {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  themes: string[];
  differentiators: string[];
}

interface GapAnalysis {
  themesCompetitorsCoverYouDont: string[];
  themesYouCoverCompetitorsDont: string[];
  quickContentWins: {
    title: string;
    format: string;
    rationale: string;
  }[];
  positioningRecommendations: string[];
}

interface Snapshot {
  domain: string;
  homepageUrl: string;
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  error?: string;
}

interface Report {
  snapshots: Snapshot[];
  insights: Insight[];
  gapAnalysis: GapAnalysis;
}

export function CompetitorsTab({ auditId }: { auditId: string }) {
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}/competitors`);
        if (res.ok) {
          const data = await res.json();
          setCompetitors(data.competitors || []);
          setReport(data.report);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [auditId]);

  const addCompetitor = () => {
    const c = newCompetitor.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!c || competitors.includes(c)) return;
    setCompetitors([...competitors, c]);
    setNewCompetitor("");
  };

  const removeCompetitor = (c: string) =>
    setCompetitors(competitors.filter((x) => x !== c));

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch(`/api/audit/${auditId}/competitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitors }),
      });
      const data = await res.json();
      if (res.ok) setReport(data.report);
      else setError(data.error || "Failed to analyze");
    } catch {
      setError("Failed to analyze");
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Competitors
          </CardTitle>
          <CardDescription>
            Add up to 5 competitor domains. We&apos;ll crawl each homepage and
            run gap analysis against your site.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. competitor.com"
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompetitor();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCompetitor}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {competitors.map((c) => (
                <Badge
                  key={c}
                  variant="secondary"
                  className="gap-1 pr-1 font-normal"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCompetitor(c)}
                    className="rounded hover:bg-foreground/10 p-0.5"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <Button
            onClick={run}
            disabled={running || competitors.length === 0}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {running
              ? "Analyzing…"
              : report
                ? "Re-run analysis"
                : "Analyze competitors"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {!report ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Add competitor domains above and click <strong>Analyze</strong> to
            see strengths, weaknesses, and content gaps.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Snapshot warnings */}
          {report.snapshots.some((s) => s.error) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Couldn&apos;t fetch:{" "}
                {report.snapshots
                  .filter((s) => s.error)
                  .map((s) => `${s.domain} (${s.error})`)
                  .join(", ")}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Themes competitors cover you don&apos;t
                </CardTitle>
                <CardDescription>Topic gaps to consider filling.</CardDescription>
              </CardHeader>
              <CardContent>
                {report.gapAnalysis.themesCompetitorsCoverYouDont.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None found.</p>
                ) : (
                  <ul className="space-y-2">
                    {report.gapAnalysis.themesCompetitorsCoverYouDont.map(
                      (t, i) => (
                        <li
                          key={i}
                          className="text-sm border-l-2 border-amber-500/60 pl-4"
                        >
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Themes you cover competitors don&apos;t
                </CardTitle>
                <CardDescription>Your differentiators.</CardDescription>
              </CardHeader>
              <CardContent>
                {report.gapAnalysis.themesYouCoverCompetitorsDont.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None identified.</p>
                ) : (
                  <ul className="space-y-2">
                    {report.gapAnalysis.themesYouCoverCompetitorsDont.map(
                      (t, i) => (
                        <li
                          key={i}
                          className="text-sm border-l-2 border-emerald-500/60 pl-4"
                        >
                          {t}
                        </li>
                      )
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick content wins</CardTitle>
              <CardDescription>
                Specific pages to create to close gaps.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report.gapAnalysis.quickContentWins.length === 0 ? (
                <p className="text-sm text-muted-foreground">None suggested.</p>
              ) : (
                <ul className="space-y-4">
                  {report.gapAnalysis.quickContentWins.map((w, i) => (
                    <li
                      key={i}
                      className="border-l-2 border-purple-500/60 pl-4"
                    >
                      <div className="font-medium">{w.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Format: {w.format}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {w.rationale}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Positioning recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.gapAnalysis.positioningRecommendations.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm border-l-2 border-primary pl-4"
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Per-competitor analysis
            </h3>
            {report.insights.map((insight, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="text-base break-all">
                    {insight.competitor}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InsightList
                    title="Strengths"
                    items={insight.strengths}
                    tone="positive"
                  />
                  <InsightList
                    title="Weaknesses"
                    items={insight.weaknesses}
                    tone="negative"
                  />
                  <InsightList title="Themes covered" items={insight.themes} />
                  <InsightList
                    title="Differentiators"
                    items={insight.differentiators}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InsightList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "positive" | "negative";
}) {
  const borderColor =
    tone === "positive"
      ? "border-emerald-500/60"
      : tone === "negative"
        ? "border-rose-500/60"
        : "border-border";
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        {title}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">—</div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((s, i) => (
            <li key={i} className={`text-sm border-l-2 pl-3 ${borderColor}`}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
