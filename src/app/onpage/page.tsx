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
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  AlertCircle,
  RefreshCw,
  Check,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface Issue {
  severity: "high" | "medium" | "low" | "info";
  category: string;
  message: string;
  detail?: string;
}

interface OnPageReport {
  url: string;
  finalUrl: string;
  statusCode: number;
  responseTimeMs: number;
  contentLengthKb: number;
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  canonical: string;
  robots: string;
  lang: string;
  viewport: string;
  h1: string;
  h1Count: number;
  headingStructure: { level: number; text: string }[];
  wordCount: number;
  readingTimeMin: number;
  fleschReadingEase: number | null;
  linkStats: {
    total: number;
    internal: number;
    external: number;
    nofollow: number;
    missingAnchor: number;
  };
  imageStats: { total: number; missingAlt: number; tinyAlt: number };
  structuredDataTypes: string[];
  socialTags: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: string;
  };
  issues: Issue[];
  score: number;
}

function scoreColor(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function severityBadge(s: Issue["severity"]) {
  const map = {
    high: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    medium:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    low: "bg-muted text-muted-foreground border-border",
    info: "bg-muted text-muted-foreground border-border",
  };
  return map[s];
}

export default function OnPagePage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<OnPageReport | null>(null);
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
      const res = await fetch("/api/tools/onpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (res.ok) setReport(data.report);
      else setError(data.error || "Failed");
    } catch {
      setError("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={Zap}
        title="On-page Analyzer"
        accent="blue"
        description="Fetch any URL and get a full single-page SEO report — metadata, headings, links, images, structured data, social tags, and readability."
      />
      <HelpBanner guideKey="onpage" guide={GUIDES.onpage} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Analyze a URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com/page"
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

      {report && <Report report={report} />}
    </div>
  );
}

function Report({ report }: { report: OnPageReport }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="text-base break-all">
                {report.title || "(no title)"}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <a
                  href={report.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1 truncate"
                >
                  {report.finalUrl}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold tabular-nums ${scoreColor(report.score)}`}>
                {report.score}
              </div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Status" value={`HTTP ${report.statusCode}`} />
            <Stat label="Response" value={`${report.responseTimeMs} ms`} />
            <Stat label="HTML size" value={`${report.contentLengthKb} KB`} />
            <Stat
              label="Word count"
              value={`${report.wordCount.toLocaleString()} · ${report.readingTimeMin} min read`}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Issues ({report.issues.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.issues.length === 0 ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-4 w-4" />
              No issues detected.
            </p>
          ) : (
            <ul className="space-y-3">
              {report.issues.map((issue, i) => (
                <li key={i} className="border-l-2 border-border pl-4">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs font-normal ${severityBadge(issue.severity)}`}
                    >
                      {issue.severity}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-normal">
                      {issue.category}
                    </Badge>
                  </div>
                  <div className="font-medium text-sm mt-1.5">
                    {issue.message}
                  </div>
                  {issue.detail && (
                    <div className="text-sm text-muted-foreground mt-0.5">
                      {issue.detail}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <FieldRow
            label="Title"
            value={report.title || "—"}
            hint={`${report.titleLength} chars`}
          />
          <FieldRow
            label="Description"
            value={report.metaDescription || "—"}
            hint={`${report.metaDescriptionLength} chars`}
          />
          <FieldRow label="H1" value={report.h1 || "—"} hint={`${report.h1Count} H1 tag${report.h1Count === 1 ? "" : "s"}`} />
          <FieldRow label="Canonical" value={report.canonical || "—"} />
          <FieldRow label="Robots" value={report.robots || "(default index,follow)"} />
          <FieldRow label="Lang" value={report.lang || "—"} />
          <FieldRow label="Viewport" value={report.viewport || "—"} />
          <FieldRow
            label="Readability"
            value={
              report.fleschReadingEase != null
                ? `Flesch ${report.fleschReadingEase}`
                : "—"
            }
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Total" value={report.linkStats.total.toString()} />
              <Stat label="Internal" value={report.linkStats.internal.toString()} />
              <Stat label="External" value={report.linkStats.external.toString()} />
              <Stat label="Nofollow" value={report.linkStats.nofollow.toString()} />
              <Stat
                label="Missing anchor"
                value={report.linkStats.missingAnchor.toString()}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Total" value={report.imageStats.total.toString()} />
              <Stat
                label="Missing alt"
                value={report.imageStats.missingAlt.toString()}
              />
              <Stat
                label="Tiny alt (<3 chars)"
                value={report.imageStats.tinyAlt.toString()}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Structured data</CardTitle>
          </CardHeader>
          <CardContent>
            {report.structuredDataTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No JSON-LD detected.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {report.structuredDataTypes.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Social tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <FieldRow label="og:title" value={report.socialTags.ogTitle || "—"} />
            <FieldRow
              label="og:description"
              value={report.socialTags.ogDescription || "—"}
            />
            <FieldRow label="og:image" value={report.socialTags.ogImage || "—"} />
            <FieldRow
              label="twitter:card"
              value={report.socialTags.twitterCard || "—"}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Heading outline</CardTitle>
          <CardDescription>
            First 40 headings in document order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.headingStructure.length === 0 ? (
            <p className="text-sm text-muted-foreground">No headings found.</p>
          ) : (
            <ul className="space-y-1">
              {report.headingStructure.map((h, i) => (
                <li
                  key={i}
                  className="text-sm flex items-start gap-3"
                  style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
                >
                  <span className="text-xs font-mono text-muted-foreground shrink-0 w-6">
                    H{h.level}
                  </span>
                  <span className="truncate">{h.text}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <div className="text-muted-foreground text-xs min-w-[110px]">
        {label}
      </div>
      <div className="flex-1 min-w-0 break-words">{value}</div>
      {hint && (
        <div className="text-xs text-muted-foreground shrink-0">{hint}</div>
      )}
    </div>
  );
}
