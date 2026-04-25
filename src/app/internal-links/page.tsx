"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/export/csv";

interface LinkResult { source: string; targets: string[]; incomingCount: number }
interface Result { results: LinkResult[]; orphans: string[]; pageCount: number }

export default function InternalLinksPage() {
  const [siteUrl, setSiteUrl] = useState("");
  const [maxPages, setMaxPages] = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"table" | "orphans">("table");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    if (!siteUrl.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch("/api/tools/internal-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl: siteUrl.trim(), maxPages }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setResult(data);
    setLoading(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Internal Linking Map" description="Crawl your site and map all internal links. Find orphaned pages, hub pages, and link equity distribution." />

      <form onSubmit={run} className="flex flex-wrap gap-2">
        <input value={siteUrl} onChange={e => setSiteUrl(e.target.value)} placeholder="https://example.com"
          className="flex-1 min-w-[240px] h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <select value={maxPages} onChange={e => setMaxPages(Number(e.target.value))}
          className="h-10 rounded border border-border bg-background px-3 text-[13px]">
          {[25, 50, 100].map(n => <option key={n} value={n}>Max {n} pages</option>)}
        </select>
        <button type="submit" disabled={loading || !siteUrl.trim()}
          className="h-10 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Crawling…" : "Build map"}
        </button>
        {result && (
          <button type="button"
            onClick={() => downloadCSV(toCSV(result.results.map(r => ({ url: r.source, outgoing_links: r.targets.length, incoming_links: r.incomingCount }))), "internal-links.csv")}
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
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Pages crawled", value: result.pageCount },
              { label: "Orphaned pages", value: result.orphans.length },
              { label: "Total links", value: result.results.reduce((s, r) => s + r.targets.length, 0).toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded border border-border bg-card p-4">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="stat-num font-bold text-xl mt-1">{value}</p>
              </div>
            ))}
          </div>

          {/* Tab toggle */}
          <div className="flex gap-px rounded border border-border overflow-hidden w-fit">
            {(["table", "orphans"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 text-[12px] font-semibold capitalize transition-colors ${view === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {v === "orphans" ? `Orphans (${result.orphans.length})` : "Link table"}
              </button>
            ))}
          </div>

          {view === "table" ? (
            <div className="rounded border border-border overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">Page</th>
                      <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">Outgoing</th>
                      <th className="text-right px-4 py-2.5 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">Incoming</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r, i) => {
                      const domain = new URL(r.source).pathname || "/";
                      return (
                        <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-2.5 max-w-[380px]">
                            <a href={r.source} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline truncate block">{domain}</a>
                          </td>
                          <td className="px-4 py-2.5 text-right stat-num">{r.targets.length}</td>
                          <td className="px-4 py-2.5 text-right stat-num">
                            <span className={r.incomingCount === 0 ? "text-amber-600 dark:text-amber-400" : ""}>{r.incomingCount}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {result.orphans.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No orphaned pages found.</p>
              ) : result.orphans.map((url, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded border border-amber-500/20 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary hover:underline truncate">{url}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
