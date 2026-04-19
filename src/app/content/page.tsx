"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plus,
  X,
  PenLine,
  TrendingUp,
  Layers,
  Lightbulb,
  FileText,
  ArrowRight,
} from "lucide-react";

interface Property {
  id: string;
  siteUrl: string;
}

interface ContentIdea {
  title: string;
  targetKeyword: string;
  intent: string;
  difficulty: string;
  outline: string[];
  rationale: string;
  estimatedWordCount: number;
  suggestedSlug: string;
  internalLinkTargets?: string[];
}

interface ContentPlan {
  summary: string;
  quickWinIdeas: ContentIdea[];
  topicExpansions: ContentIdea[];
  newPillarIdeas: ContentIdea[];
  gaps: string[];
}

interface GenerateStats {
  sitemapUrlCount: number;
  sitemapFiles: string[];
  sitemapErrors: string[];
  gscQueryCount: number;
  hadGscSnapshot: boolean;
}

interface RefreshIssue {
  severity: string;
  issue: string;
  fix: string;
}

interface ContentRefresh {
  urlAnalyzed: string;
  currentTitle: string;
  currentWordCount: number;
  summary: string;
  issues: RefreshIssue[];
  rewriteRecommendations: {
    newTitle?: string;
    newMetaDescription?: string;
    newH1?: string;
  };
  addSections: Array<{ heading: string; purpose: string; approxWords: number }>;
  removeOrConsolidate: Array<{ section: string; reason: string }>;
  updateOpportunities: string[];
  internalLinksToAdd: Array<{ anchor: string; suggestedTargetTopic: string }>;
  keywordTargets: string[];
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

function severityColor(s: string): string {
  if (s === "high")
    return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30";
  if (s === "medium")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

export default function ContentPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [propsLoading, setPropsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/gsc/properties");
        if (res.ok) {
          const data = await res.json();
          setProperties(data.properties);
          if (data.properties.length > 0) setPropertyId(data.properties[0].id);
        }
      } finally {
        setPropsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={PenLine}
        title="Content Planner"
        accent="purple"
        description="Generate new content ideas from your sitemap + Search Console data, or get concrete refresh plans for existing posts."
      />
      <HelpBanner guideKey="content" guide={GUIDES.content} />

      <Tabs defaultValue="generate">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="generate">Generate new</TabsTrigger>
          <TabsTrigger value="recreate">Recreate existing</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6">
          <GenerateTab
            properties={properties}
            propertyId={propertyId}
            setPropertyId={setPropertyId}
            propsLoading={propsLoading}
          />
        </TabsContent>

        <TabsContent value="recreate" className="mt-6">
          <RecreateTab
            properties={properties}
            defaultPropertyId={propertyId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Generate Tab ──────────────────────────────────────────

function GenerateTab({
  properties,
  propertyId,
  setPropertyId,
  propsLoading,
}: {
  properties: Property[];
  propertyId: string;
  setPropertyId: (id: string) => void;
  propsLoading: boolean;
}) {
  const [seeds, setSeeds] = useState<string[]>([]);
  const [newSeed, setNewSeed] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [stats, setStats] = useState<GenerateStats | null>(null);
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
    if (!propertyId) {
      setError("Pick a property first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          seedTopics: seeds,
          businessType: businessType.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPlan(data.plan);
        setStats(data.stats);
      } else {
        setError(data.error || "Failed");
      }
    } catch {
      setError("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!propsLoading && properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Connect a Search Console property first.
          </p>
          <Link href="/properties">
            <Button>Go to Properties</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Setup</CardTitle>
          <CardDescription>
            We&apos;ll pull your sitemap + GSC data automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="property">Property</Label>
            <select
              id="property"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.siteUrl}
                </option>
              ))}
            </select>
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

          <div>
            <Label>Seed topics (optional)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="e.g. beginner running tips"
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
              <div className="flex flex-wrap gap-1.5 mt-2">
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

          <Button onClick={run} disabled={loading || !propertyId} className="gap-2">
            <Sparkles className="h-4 w-4" />
            {loading ? "Generating…" : "Generate content plan"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {stats && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <Badge variant="outline">
            {stats.sitemapUrlCount} sitemap URLs
          </Badge>
          <Badge variant="outline">{stats.gscQueryCount} GSC queries</Badge>
          {stats.sitemapErrors.length > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
            >
              Sitemap issues: {stats.sitemapErrors.length}
            </Badge>
          )}
        </div>
      )}

      {plan && (
        <>
          {plan.summary && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {plan.summary}
                </p>
              </CardContent>
            </Card>
          )}

          <IdeaSection
            title="Quick wins"
            description="Derived from queries you already rank for (positions 4-20)."
            icon={<TrendingUp className="h-4 w-4" />}
            ideas={plan.quickWinIdeas}
            highlight
          />

          <IdeaSection
            title="Topic expansions"
            description="Build on content you already have."
            icon={<Layers className="h-4 w-4" />}
            ideas={plan.topicExpansions}
          />

          <IdeaSection
            title="New pillar ideas"
            description="Brand-new topic areas you could own."
            icon={<Lightbulb className="h-4 w-4" />}
            ideas={plan.newPillarIdeas}
          />

          {plan.gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Topic gaps</CardTitle>
                <CardDescription>
                  Areas not yet developed into ideas — consider these as future
                  pillars.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.gaps.map((g, i) => (
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

function IdeaSection({
  title,
  description,
  icon,
  ideas,
  highlight,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  ideas: ContentIdea[];
  highlight?: boolean;
}) {
  if (ideas.length === 0) return null;
  return (
    <Card className={highlight ? "border-emerald-500/30" : ""}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title} ({ideas.length})
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-5">
          {ideas.map((idea, i) => (
            <li key={i} className="border-l-2 border-primary/50 pl-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="font-medium">{idea.title}</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className="font-normal text-xs">
                    {idea.intent}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`font-normal text-xs ${difficultyColor(idea.difficulty)}`}
                  >
                    {idea.difficulty}
                  </Badge>
                  <Badge variant="outline" className="font-normal text-xs">
                    {idea.estimatedWordCount}w
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                <div>
                  <span className="font-medium">Target:</span>{" "}
                  <code className="font-mono">{idea.targetKeyword}</code>
                </div>
                <div>
                  <span className="font-medium">Slug:</span>{" "}
                  <code className="font-mono">{idea.suggestedSlug}</code>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {idea.rationale}
              </div>
              {idea.outline.length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    Show outline ({idea.outline.length} sections)
                  </summary>
                  <ol className="mt-2 space-y-0.5 text-sm">
                    {idea.outline.map((h, j) => (
                      <li
                        key={j}
                        className="text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-xs font-mono tabular-nums w-6">
                          {j + 1}.
                        </span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {idea.internalLinkTargets && idea.internalLinkTargets.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Link to: </span>
                  {idea.internalLinkTargets.join(", ")}
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// ─── Recreate Tab ──────────────────────────────────────────

function RecreateTab({
  properties,
  defaultPropertyId,
}: {
  properties: Property[];
  defaultPropertyId: string;
}) {
  const [url, setUrl] = useState("");
  const [attachPropertyId, setAttachPropertyId] =
    useState(defaultPropertyId);
  const [refresh, setRefresh] = useState<ContentRefresh | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultPropertyId) setAttachPropertyId(defaultPropertyId);
  }, [defaultPropertyId]);

  const run = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tools/content/recreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: trimmed,
          propertyId: attachPropertyId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) setRefresh(data.refresh);
      else setError(data.error || "Failed");
    } catch {
      setError("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Analyze an existing post
          </CardTitle>
          <CardDescription>
            We fetch the page, extract its structure, and produce a concrete
            refresh plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="r-url">Post URL</Label>
            <Input
              id="r-url"
              placeholder="https://example.com/blog/some-post"
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
          {properties.length > 0 && (
            <div>
              <Label htmlFor="r-prop">
                Attach GSC data (optional)
              </Label>
              <select
                id="r-prop"
                value={attachPropertyId}
                onChange={(e) => setAttachPropertyId(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">No property — skip GSC data</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.siteUrl}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                If the URL lives on a connected property, we&apos;ll attach
                queries this page ranks for to sharpen the refresh plan.
              </p>
            </div>
          )}
          <Button onClick={run} disabled={loading} className="gap-2">
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Analyzing…" : "Analyze"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {refresh && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base break-all">
                {refresh.currentTitle || "(untitled)"}
              </CardTitle>
              <CardDescription className="break-all">
                {refresh.urlAnalyzed} · {refresh.currentWordCount} words
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {refresh.summary}
              </p>
            </CardContent>
          </Card>

          {refresh.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {refresh.issues.map((issue, i) => (
                    <li key={i} className="border-l-2 border-border pl-4">
                      <Badge
                        variant="outline"
                        className={`text-xs font-normal mb-1.5 ${severityColor(issue.severity)}`}
                      >
                        {issue.severity}
                      </Badge>
                      <div className="font-medium text-sm">{issue.issue}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        <span className="font-medium">Fix:</span> {issue.fix}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {(refresh.rewriteRecommendations.newTitle ||
            refresh.rewriteRecommendations.newH1 ||
            refresh.rewriteRecommendations.newMetaDescription) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rewrite suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {refresh.rewriteRecommendations.newTitle && (
                  <Rewrite
                    label="Title"
                    value={refresh.rewriteRecommendations.newTitle}
                  />
                )}
                {refresh.rewriteRecommendations.newH1 && (
                  <Rewrite
                    label="H1"
                    value={refresh.rewriteRecommendations.newH1}
                  />
                )}
                {refresh.rewriteRecommendations.newMetaDescription && (
                  <Rewrite
                    label="Meta description"
                    value={refresh.rewriteRecommendations.newMetaDescription}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {refresh.addSections.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Sections to add ({refresh.addSections.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {refresh.addSections.map((s, i) => (
                    <li key={i} className="border-l-2 border-emerald-500/60 pl-4">
                      <div className="font-medium">{s.heading}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ~{s.approxWords} words
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {s.purpose}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {refresh.removeOrConsolidate.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <X className="h-4 w-4" />
                  Remove or consolidate ({refresh.removeOrConsolidate.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {refresh.removeOrConsolidate.map((s, i) => (
                    <li key={i} className="border-l-2 border-rose-500/60 pl-4">
                      <div className="font-medium">{s.section}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {s.reason}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {refresh.updateOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update opportunities</CardTitle>
                <CardDescription>
                  Outdated facts, stats, or examples worth refreshing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {refresh.updateOpportunities.map((u, i) => (
                    <li
                      key={i}
                      className="text-sm border-l-2 border-amber-500/60 pl-4"
                    >
                      {u}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {refresh.internalLinksToAdd.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Internal links to add
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {refresh.internalLinksToAdd.map((l, i) => (
                    <li key={i} className="border-l-2 border-primary/50 pl-4">
                      <span className="font-medium">&quot;{l.anchor}&quot;</span>
                      <span className="text-muted-foreground">
                        {" "}
                        → {l.suggestedTargetTopic}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {refresh.keywordTargets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keyword targets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {refresh.keywordTargets.map((k) => (
                    <Badge key={k} variant="outline">
                      {k}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Rewrite({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="border border-border rounded-md p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={copy}
          className="text-xs h-7"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}
