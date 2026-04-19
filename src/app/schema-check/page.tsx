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
  AlertCircle,
  Check,
  RefreshCw,
  FileSearch,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface SchemaIssue {
  severity: "error" | "warning" | "info";
  type: string;
  field?: string;
  message: string;
}

interface SchemaBlock {
  index: number;
  raw: string;
  parsed: unknown | null;
  parseError?: string;
  types: string[];
  issues: SchemaIssue[];
}

interface SchemaReport {
  url: string;
  finalUrl: string;
  statusCode: number;
  totalBlocks: number;
  totalTypes: number;
  totalIssues: number;
  blocks: SchemaBlock[];
  missingRecommendedTypes: string[];
  microdataTypes: string[];
  rdfaTypes: string[];
}

function severityBadge(s: SchemaIssue["severity"]) {
  const map = {
    error: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    info: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={`text-xs font-normal ${map[s]}`}>
      {s}
    </Badge>
  );
}

export default function SchemaCheckPage() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<SchemaReport | null>(null);
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
      const res = await fetch("/api/tools/schema-check", {
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

  const errorCount =
    report?.blocks.reduce(
      (s, b) => s + b.issues.filter((i) => i.severity === "error").length,
      0
    ) ?? 0;
  const warningCount =
    report?.blocks.reduce(
      (s, b) => s + b.issues.filter((i) => i.severity === "warning").length,
      0
    ) ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={FileSearch}
        title="Schema Checker"
        accent="purple"
        description="Fetch any URL, extract its JSON-LD structured data, and validate required + recommended fields for common schema.org types."
      />
      <HelpBanner guideKey="schemaCheck" guide={GUIDES.schemaCheck} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Check a URL</CardTitle>
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
            {loading ? "Checking…" : "Check schema"}
          </Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base break-all">
                <a
                  href={report.finalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {report.finalUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardTitle>
              <CardDescription>HTTP {report.statusCode}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Stat
                  label="JSON-LD blocks"
                  value={report.totalBlocks.toString()}
                />
                <Stat label="Types" value={report.totalTypes.toString()} />
                <Stat
                  label="Errors"
                  value={errorCount.toString()}
                  tone={errorCount > 0 ? "error" : undefined}
                />
                <Stat
                  label="Warnings"
                  value={warningCount.toString()}
                  tone={warningCount > 0 ? "warning" : undefined}
                />
              </div>
              {(report.microdataTypes.length > 0 ||
                report.rdfaTypes.length > 0) && (
                <div className="mt-4 text-xs text-muted-foreground">
                  Also detected:
                  {report.microdataTypes.length > 0 && (
                    <span className="ml-2">
                      microdata [{report.microdataTypes.join(", ")}]
                    </span>
                  )}
                  {report.rdfaTypes.length > 0 && (
                    <span className="ml-2">
                      RDFa [{report.rdfaTypes.join(", ")}]
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {report.missingRecommendedTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Recommended additions
                </CardTitle>
                <CardDescription>
                  Schema types that are commonly expected on this kind of page
                  but weren&apos;t found.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {report.missingRecommendedTypes.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {report.blocks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No JSON-LD blocks detected on this page.
                </p>
              </CardContent>
            </Card>
          ) : (
            report.blocks.map((block) => (
              <Card key={block.index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base">
                        Block #{block.index + 1}
                      </CardTitle>
                      <CardDescription>
                        {block.types.length > 0
                          ? block.types.join(", ")
                          : "(no @type)"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {block.issues.some((i) => i.severity === "error") ? (
                        <Badge
                          variant="outline"
                          className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        >
                          {block.issues.filter((i) => i.severity === "error").length}{" "}
                          errors
                        </Badge>
                      ) : block.issues.some((i) => i.severity === "warning") ? (
                        <Badge
                          variant="outline"
                          className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        >
                          {
                            block.issues.filter((i) => i.severity === "warning")
                              .length
                          }{" "}
                          warnings
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {block.issues.length > 0 && (
                    <ul className="space-y-2">
                      {block.issues.map((issue, i) => (
                        <li
                          key={i}
                          className="border-l-2 border-border pl-4 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {severityBadge(issue.severity)}
                            <span className="text-xs text-muted-foreground font-mono">
                              {issue.type}
                            </span>
                          </div>
                          <div className="mt-1">{issue.message}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                  {block.parsed && (
                    <details>
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        Show raw JSON-LD
                      </summary>
                      <pre className="mt-3 bg-muted/40 border border-border rounded-md p-3 text-xs overflow-x-auto font-mono leading-relaxed">
                        {JSON.stringify(block.parsed, null, 2)}
                      </pre>
                    </details>
                  )}
                  {block.parseError && (
                    <pre className="bg-muted/40 border border-rose-500/30 rounded-md p-3 text-xs overflow-x-auto font-mono leading-relaxed">
                      {block.raw}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "error" | "warning";
}) {
  const color =
    tone === "error"
      ? "text-rose-600 dark:text-rose-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "";
  return (
    <div className="border border-border rounded-md p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
