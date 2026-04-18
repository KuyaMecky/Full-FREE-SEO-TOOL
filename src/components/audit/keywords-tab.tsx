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
import {
  Sparkles,
  AlertCircle,
  Target,
  TrendingUp,
  Lightbulb,
  Layers,
  X,
} from "lucide-react";

interface KeywordOpportunity {
  keyword: string;
  intent: string;
  difficulty: string;
  searchVolumeTier: string;
  contentAngle: string;
  suggestedPage?: string;
  rationale: string;
}

interface KeywordCluster {
  theme: string;
  keywords: string[];
  pillarRecommendation: string;
}

interface KeywordReport {
  primaryTargets: KeywordOpportunity[];
  longTailOpportunities: KeywordOpportunity[];
  clusters: KeywordCluster[];
  quickWins: KeywordOpportunity[];
  gaps: string[];
}

function difficultyColor(d: string): string {
  if (d === "low") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (d === "medium") return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  if (d === "high") return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
  return "";
}

export function KeywordsTab({ auditId }: { auditId: string }) {
  const [seeds, setSeeds] = useState<string[]>([]);
  const [newSeed, setNewSeed] = useState("");
  const [report, setReport] = useState<KeywordReport | null>(null);
  const [gscMatched, setGscMatched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/audit/${auditId}/keywords`);
        if (res.ok) {
          const data = await res.json();
          setSeeds(data.seedKeywords || []);
          setReport(data.report);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [auditId]);

  const addSeed = () => {
    const k = newSeed.trim();
    if (!k || seeds.includes(k)) return;
    setSeeds([...seeds, k]);
    setNewSeed("");
  };

  const removeSeed = (k: string) => setSeeds(seeds.filter((s) => s !== k));

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/audit/${auditId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedKeywords: seeds }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        setGscMatched(Boolean(data.gscMatched));
      } else {
        setError(data.error || "Failed to generate");
      }
    } catch {
      setError("Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seed keywords</CardTitle>
          <CardDescription>
            Add topics you want to rank for. We&apos;ll expand them into a
            keyword plan — and cross-reference with Search Console if you have
            this domain connected under Properties.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. best running shoes for wide feet"
              value={newSeed}
              onChange={(e) => setNewSeed(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSeed();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addSeed}>
              Add
            </Button>
          </div>
          {seeds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {seeds.map((k) => (
                <Badge
                  key={k}
                  variant="secondary"
                  className="gap-1 pr-1 font-normal"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => removeSeed(k)}
                    className="rounded hover:bg-foreground/10 p-0.5"
                    aria-label={`Remove ${k}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              onClick={generate}
              disabled={generating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {generating ? "Generating…" : report ? "Regenerate plan" : "Generate keyword plan"}
            </Button>
            {gscMatched && (
              <Badge variant="outline" className="text-xs">
                GSC data attached
              </Badge>
            )}
          </div>
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
            Add seed keywords above and click <strong>Generate</strong> to get
            your keyword research plan.
          </CardContent>
        </Card>
      ) : (
        <>
          {report.quickWins.length > 0 && (
            <OpportunitySection
              title="Quick wins"
              icon={<TrendingUp className="h-4 w-4" />}
              description="Queries already ranking in positions 4-20 that could move to page 1 with focused work."
              items={report.quickWins}
              highlight
            />
          )}

          <OpportunitySection
            title="Primary targets"
            icon={<Target className="h-4 w-4" />}
            description="Top recommendations based on your seed keywords and site context."
            items={report.primaryTargets}
          />

          <OpportunitySection
            title="Long-tail opportunities"
            icon={<Lightbulb className="h-4 w-4" />}
            description="Lower-competition terms that build topical authority."
            items={report.longTailOpportunities}
          />

          {report.clusters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Topic clusters ({report.clusters.length})
                </CardTitle>
                <CardDescription>
                  Group these into content pillars with supporting subpages.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {report.clusters.map((c, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-md p-4"
                  >
                    <div className="font-medium">{c.theme}</div>
                    <div className="flex flex-wrap gap-1.5 my-2">
                      {c.keywords.map((k) => (
                        <Badge key={k} variant="outline">
                          {k}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {c.pillarRecommendation}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {report.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Topic gaps</CardTitle>
                <CardDescription>
                  Themes likely covered by competitors that your site
                  doesn&apos;t address yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {report.gaps.map((g, i) => (
                    <li
                      key={i}
                      className="text-sm border-l-2 border-purple-500/60 pl-4"
                    >
                      {g}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function OpportunitySection({
  title,
  icon,
  description,
  items,
  highlight,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  items: KeywordOpportunity[];
  highlight?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <Card className={highlight ? "border-emerald-500/30" : ""}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title} ({items.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {items.map((k, i) => (
            <li key={i} className="border-l-2 border-primary/50 pl-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="font-medium">{k.keyword}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="font-normal text-xs">
                    {k.intent}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`font-normal text-xs ${difficultyColor(k.difficulty)}`}
                  >
                    {k.difficulty} difficulty
                  </Badge>
                  <Badge variant="outline" className="font-normal text-xs">
                    {k.searchVolumeTier} volume
                  </Badge>
                </div>
              </div>
              <div className="text-sm mt-1">
                <span className="text-muted-foreground">Angle: </span>
                {k.contentAngle}
              </div>
              {k.suggestedPage && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Suggested page: {k.suggestedPage}
                </div>
              )}
              {k.rationale && (
                <div className="text-sm text-muted-foreground mt-1">
                  {k.rationale}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
