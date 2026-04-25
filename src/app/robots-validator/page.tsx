"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { AlertCircle, CheckCircle, Loader2, Globe, FileText } from "lucide-react";

interface RobotsResult {
  robotsUrl: string;
  content: string | null;
  issues: string[];
  sitemapUrls: string[];
  disallowedPaths: string[];
  hasSitemapRef: boolean;
  fetchError?: string;
}

interface SitemapResult {
  url: string;
  reachable: boolean;
  urlCount: number;
  issues: string[];
  fetchError?: string;
}

interface Result {
  robots: RobotsResult;
  sitemaps: SitemapResult[];
}

export default function RobotsValidatorPage() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch("/api/tools/robots-validator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domain.trim() }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setResult(data);
    setLoading(false);
  }

  const allIssues = result
    ? [...result.robots.issues, ...result.sitemaps.flatMap(s => s.issues)]
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Robots & Sitemap Validator" description="Fetch and validate robots.txt and XML sitemaps. Flags blocking rules, missing directives, and malformed entries." />

      <form onSubmit={check} className="flex gap-2">
        <input value={domain} onChange={e => setDomain(e.target.value)}
          placeholder="example.com"
          className="flex-1 h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <button type="submit" disabled={loading || !domain.trim()}
          className="h-10 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Checking…" : "Validate"}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Summary */}
          {allIssues.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded border border-emerald-500/20 bg-emerald-500/8 text-[13px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" /> No issues found — robots.txt and sitemap look healthy
            </div>
          ) : (
            <div className="space-y-2">
              {allIssues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded border border-amber-500/20 bg-amber-500/8 text-[13px] text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {iss}
                </div>
              ))}
            </div>
          )}

          {/* Robots.txt */}
          <div className="rounded border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-[13px]">robots.txt</p>
              <span className="ml-auto text-[11px] text-muted-foreground">{result.robots.robotsUrl}</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Sitemap ref", value: result.robots.hasSitemapRef ? "Yes" : "Missing", ok: result.robots.hasSitemapRef },
                  { label: "Sitemaps found", value: String(result.robots.sitemapUrls.length) },
                  { label: "Disallowed paths", value: String(result.robots.disallowedPaths.length) },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="rounded border border-border p-3">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className={`font-semibold text-[14px] mt-0.5 ${ok === false ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</p>
                  </div>
                ))}
              </div>
              {result.robots.content && (
                <pre className="text-[11px] bg-muted rounded p-3 overflow-auto max-h-48 font-mono leading-relaxed">
                  {result.robots.content.slice(0, 2000)}
                  {result.robots.content.length > 2000 && "\n… (truncated)"}
                </pre>
              )}
            </div>
          </div>

          {/* Sitemaps */}
          {result.sitemaps.map((s, i) => (
            <div key={i} className="rounded border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-[13px]">Sitemap</p>
                <div className={`ml-2 h-1.5 w-1.5 rounded-full ${s.reachable ? "bg-emerald-500" : "bg-red-500"}`} />
                <span className="ml-1 text-[11px] text-muted-foreground truncate">{s.url}</span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Reachable", value: s.reachable ? "Yes" : "No", ok: s.reachable },
                  { label: "URLs indexed", value: s.urlCount.toLocaleString() },
                  { label: "Issues", value: String(s.issues.length), ok: s.issues.length === 0 },
                ].map(({ label, value, ok }) => (
                  <div key={label} className="rounded border border-border p-3">
                    <p className="text-[11px] text-muted-foreground">{label}</p>
                    <p className={`font-semibold text-[14px] mt-0.5 ${ok === false ? "text-red-600 dark:text-red-400" : ""}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
