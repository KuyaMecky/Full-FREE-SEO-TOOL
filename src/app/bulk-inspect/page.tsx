"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, CheckCircle, XCircle, Minus, ExternalLink } from "lucide-react";

interface Property { id: string; siteUrl: string }
interface InspectResult {
  url: string; verdict: string; coverageState: string;
  indexingState: string; lastCrawlTime: string | null;
  pageFetchState: string; robotsTxtState: string;
  googleCanonical: string; userCanonical: string;
  mobileVerdict: string; error: string | null;
}

const VERDICT_CONFIG: Record<string, { icon: typeof CheckCircle; cls: string; label: string }> = {
  PASS:    { icon: CheckCircle, cls: "text-emerald-600 dark:text-emerald-400", label: "Indexed" },
  PARTIAL: { icon: AlertCircle, cls: "text-amber-600 dark:text-amber-400",    label: "Partial" },
  FAIL:    { icon: XCircle,     cls: "text-red-600 dark:text-red-400",         label: "Not indexed" },
  NEUTRAL: { icon: Minus,       cls: "text-muted-foreground",                  label: "Neutral" },
  ERROR:   { icon: XCircle,     cls: "text-red-600 dark:text-red-400",         label: "Error" },
  UNKNOWN: { icon: Minus,       cls: "text-muted-foreground",                  label: "Unknown" },
};

export default function BulkInspectPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [urlsText, setUrlsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<InspectResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/gsc/properties").then(r => r.json()).then(d => {
      const props = d.properties ?? [];
      setProperties(props);
      if (props.length) setSelectedProp(props[0].id);
    });
  }, []);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const urls = urlsText.split("\n").map(u => u.trim()).filter(Boolean).slice(0, 20);
    if (!urls.length || !selectedProp) return;
    setLoading(true); setError(""); setResults([]);
    const res = await fetch("/api/tools/bulk-inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selectedProp, urls }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setResults(data.results ?? []);
    setLoading(false);
  }

  const passCount = results.filter(r => r.verdict === "PASS").length;
  const failCount = results.filter(r => r.verdict === "FAIL" || r.verdict === "ERROR").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Bulk URL Inspector" description="Check indexing status, canonical URLs, mobile usability, and crawl state for up to 20 URLs at once." />

      <div className="grid sm:grid-cols-[1fr_auto] gap-4">
        {properties.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground shrink-0">Property</label>
            <select value={selectedProp} onChange={e => setSelectedProp(e.target.value)}
              className="h-9 rounded border border-border bg-background px-3 text-[13px] flex-1">
              {properties.map(p => <option key={p.id} value={p.id}>{p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</option>)}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={run} className="space-y-3">
        <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground block">URLs to inspect</label>
        <textarea value={urlsText} onChange={e => setUrlsText(e.target.value)}
          rows={6} placeholder={"https://example.com/\nhttps://example.com/blog/\nhttps://example.com/product/"}
          className="w-full rounded border border-border bg-background px-3 py-2.5 text-[13px] font-mono resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">One URL per line · max 20 · ~200ms per URL (GSC rate limit)</p>
          <button type="submit" disabled={loading || !urlsText.trim() || !selectedProp}
            className="h-9 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {loading ? "Inspecting…" : "Inspect all"}
          </button>
        </div>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{passCount} indexed</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">{failCount} not indexed / error</span>
            <span className="text-muted-foreground">{results.length - passCount - failCount} other</span>
          </div>

          <div className="rounded border border-border overflow-hidden bg-card">
            {results.map((r, i) => {
              const cfg = VERDICT_CONFIG[r.verdict] ?? VERDICT_CONFIG.UNKNOWN;
              const Icon = cfg.icon;
              return (
                <div key={i} className="border-b border-border last:border-b-0 px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 ${cfg.cls} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <p className="text-[13px] font-medium break-all">{r.url}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[11px] font-semibold ${cfg.cls}`}>{cfg.label}</span>
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                      {r.error ? (
                        <p className="text-[11px] text-destructive mt-1">{r.error}</p>
                      ) : (
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-muted-foreground">
                          {r.coverageState && <span>{r.coverageState}</span>}
                          {r.robotsTxtState && <span>robots: {r.robotsTxtState}</span>}
                          {r.lastCrawlTime && <span>crawled {new Date(r.lastCrawlTime).toLocaleDateString()}</span>}
                          {r.mobileVerdict && r.mobileVerdict !== "PASS" && (
                            <span className="text-amber-600 dark:text-amber-400">mobile: {r.mobileVerdict}</span>
                          )}
                          {r.googleCanonical && r.googleCanonical !== r.userCanonical && (
                            <span className="text-amber-600 dark:text-amber-400">canonical mismatch</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
