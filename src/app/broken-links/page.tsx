"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, CheckCircle, ExternalLink, Link2Off } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/export/csv";

interface BrokenLink { sourceUrl: string; targetUrl: string; statusCode: number; type: "internal" | "external"; anchorText: string }
interface Result { broken: BrokenLink[]; pagesChecked: number; internalBroken: number; externalBroken: number }

export default function BrokenLinksPage() {
  const [siteUrl, setSiteUrl] = useState("");
  const [maxPages, setMaxPages] = useState(30);
  const [checkExternal, setCheckExternal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "internal" | "external">("all");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!siteUrl.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch("/api/tools/broken-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl: siteUrl.trim(), maxPages, checkExternal }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setResult(data);
    setLoading(false);
  }

  const filtered = result?.broken.filter(b => filter === "all" || b.type === filter) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Broken Link Checker" description="Crawl your site and find all internal 404s and broken outbound links." />

      <form onSubmit={run} className="flex flex-wrap gap-2 items-center">
        <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://example.com"
          className="flex-1 min-w-[220px] h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <select value={maxPages} onChange={e => setMaxPages(Number(e.target.value))}
          className="h-10 rounded border border-border bg-background px-3 text-[13px]">
          {[10, 30, 50].map(n => <option key={n} value={n}>{n} pages</option>)}
        </select>
        <label className="flex items-center gap-2 text-[13px] cursor-pointer">
          <input type="checkbox" checked={checkExternal} onChange={e => setCheckExternal(e.target.checked)} className="rounded" />
          Check external
        </label>
        <button type="submit" disabled={loading || !siteUrl.trim()}
          className="h-10 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Crawling…" : "Check links"}
        </button>
        {result && result.broken.length > 0 && (
          <button type="button" onClick={() => downloadCSV(toCSV(result.broken as unknown as Record<string, unknown>[]), "broken-links.csv")}
            className="h-10 px-4 rounded border border-border text-[13px] font-medium hover:bg-muted transition-colors">
            Export CSV
          </button>
        )}
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pages crawled", value: result.pagesChecked },
              { label: "Internal broken", value: result.internalBroken, cls: result.internalBroken > 0 ? "text-red-600 dark:text-red-400" : "" },
              { label: "External broken", value: result.externalBroken, cls: result.externalBroken > 0 ? "text-amber-600 dark:text-amber-400" : "" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded border border-border bg-card p-4">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className={`stat-num font-bold text-xl mt-1 ${cls ?? ""}`}>{value}</p>
              </div>
            ))}
          </div>

          {result.broken.length === 0 ? (
            <div className="flex items-center gap-2.5 p-4 rounded border border-emerald-500/20 bg-emerald-500/8 text-[13px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-5 w-5 shrink-0" />
              No broken links found across {result.pagesChecked} pages.
            </div>
          ) : (
            <>
              {/* Filter tabs */}
              <div className="flex gap-px rounded border border-border overflow-hidden w-fit">
                {(["all", "internal", "external"] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 text-[12px] font-semibold capitalize transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    {f} ({f === "all" ? result.broken.length : result.broken.filter(b => b.type === f).length})
                  </button>
                ))}
              </div>

              <div className="rounded border border-border overflow-hidden bg-card divide-y divide-border">
                {filtered.map((link, i) => (
                  <div key={i} className="px-4 py-3 hover:bg-muted/20">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 ${link.type === "internal" ? "text-red-500" : "text-amber-500"}`}>
                        <Link2Off className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${link.statusCode === 404 ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"}`}>
                            {link.statusCode || "ERR"}
                          </span>
                          <span className="text-[11px] font-medium capitalize text-muted-foreground">{link.type}</span>
                          {link.anchorText && <span className="text-[11px] text-muted-foreground">"{link.anchorText}"</span>}
                        </div>
                        <a href={link.targetUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 break-all">
                          {link.targetUrl} <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <p className="text-[11px] text-muted-foreground">Found on: {link.sourceUrl}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
