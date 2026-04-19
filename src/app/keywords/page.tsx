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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  KeyRound,
  Sparkles,
  AlertCircle,
  Target,
  TrendingUp,
  Lightbulb,
  Layers,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

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
  if (d === "low")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
  if (d === "medium")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  if (d === "high")
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
  return "";
}

export default function KeywordsPage() {
  const [domain, setDomain] = useState("");
  const [seeds, setSeeds] = useState<string[]>([]);
  const [newSeed, setNewSeed] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [report, setReport] = useState<KeywordReport | null>(null);
  const [gscMatched, setGscMatched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSeed = () => {
    const k = newSeed.trim();
    if (!k || seeds.includes(k)) return;
    setSeeds([...seeds, k]);
    setNewSeed("");
  };

  const removeSeed = (k: string) => setSeeds(seeds.filter((s) => s !== k));

  const run = async () => {
    const d = domain.trim();
    if (!d) {
      setError("Domain is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: d,
          businessType: businessType.trim() || undefined,
          seedKeywords: seeds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
        setGscMatched(Boolean(data.gscMatched));
      } else {
        setError(data.error || "Failed");
      }
    } catch {
      setError("Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={KeyRound}
        title="Keyword research"
        accent="primary"
        description="Expand seed keywords into a keyword plan. Cross-referenced with Search Console data if the domain matches a connected property."
      />
      <HelpBanner guideKey="keywords" guide={GUIDES.keywords} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="businessType">Business type (optional)</Label>
              <Input
                id="businessType"
                placeholder="e.g. e-commerce, SaaS, local bakery"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Seed keywords</Label>
            <div className="flex gap-2 mt-1">
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
              <div className="flex flex-wrap gap-1.5 mt-3">
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
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={run} disabled={loading} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {loading ? "Generating…" : "Generate keyword plan"}
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

      {report && (
        <div className="space-y-6">
          {report.quickWins.length > 0 && (
            <OpportunitySection
              title="Quick wins"
              icon={<TrendingUp className="h-4 w-4" />}
              description="Queries already ranking positions 4-20."
              items={report.quickWins}
              highlight
            />
          )}
          <OpportunitySection
            title="Primary targets"
            icon={<Target className="h-4 w-4" />}
            description="Top recommendations."
            items={report.primaryTargets}
          />
          <OpportunitySection
            title="Long-tail opportunities"
            icon={<Lightbulb className="h-4 w-4" />}
            description="Lower-competition terms."
            items={report.longTailOpportunities}
          />
          {report.clusters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Topic clusters ({report.clusters.length})
                </CardTitle>
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
        </div>
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
                    {k.difficulty}
                  </Badge>
                  <Badge variant="outline" className="font-normal text-xs">
                    {k.searchVolumeTier} vol
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
