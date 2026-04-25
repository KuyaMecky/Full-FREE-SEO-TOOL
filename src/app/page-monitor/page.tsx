"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Plus, RefreshCw, Loader2, AlertCircle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/export/csv";

interface Property { id: string; siteUrl: string }
interface Snap { id: string; url: string; title: string; metaDescription: string; h1: string; wordCount: number; internalLinks: number; takenAt: string }
interface PageGroup { url: string; snapshots: Snap[] }

function diff(a: number, b: number) {
  const d = b - a;
  if (d === 0) return null;
  return d;
}

function DiffBadge({ d, invert = false }: { d: number | null; invert?: boolean }) {
  if (d === null) return <span className="text-muted-foreground/40">—</span>;
  const positive = invert ? d < 0 : d > 0;
  const cls = positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
  const Icon = positive ? TrendingUp : TrendingDown;
  return <span className={`flex items-center gap-0.5 ${cls} text-[11px] font-semibold`}><Icon className="h-3 w-3" />{d > 0 ? "+" : ""}{d}</span>;
}

export default function PageMonitorPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [pages, setPages] = useState<PageGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUrl, setAddUrl] = useState("");
  const [snapping, setSnapping] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/gsc/properties").then(r => r.json()).then(d => {
      const props = d.properties ?? [];
      setProperties(props);
      if (props.length) setSelectedProp(props[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProp) return;
    setLoading(true);
    fetch(`/api/tools/page-monitor?propertyId=${selectedProp}`)
      .then(r => r.json())
      .then(d => setPages(d.pages ?? []))
      .finally(() => setLoading(false));
  }, [selectedProp]);

  async function takeSnapshot(e: React.FormEvent) {
    e.preventDefault();
    if (!addUrl.trim() || !selectedProp) return;
    setSnapping(true); setError("");
    const res = await fetch("/api/tools/page-monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selectedProp, url: addUrl.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed"); setSnapping(false); return; }
    setAddUrl("");
    const refreshed = await fetch(`/api/tools/page-monitor?propertyId=${selectedProp}`).then(r => r.json());
    setPages(refreshed.pages ?? []);
    setSnapping(false);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Page Change Monitor" description="Snapshot pages over time and diff title, meta, H1, and word count to catch SEO regressions after deployments." />

      <div className="flex flex-wrap gap-2 items-center">
        {properties.length > 1 && (
          <select value={selectedProp} onChange={e => setSelectedProp(e.target.value)}
            className="h-10 rounded border border-border bg-background px-3 text-[13px]">
            {properties.map(p => <option key={p.id} value={p.id}>{p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</option>)}
          </select>
        )}
        <form onSubmit={takeSnapshot} className="flex gap-2 flex-1 min-w-[280px]">
          <input value={addUrl} onChange={e => setAddUrl(e.target.value)} placeholder="https://example.com/page"
            className="flex-1 h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
          <button type="submit" disabled={snapping || !addUrl.trim()}
            className="h-10 px-4 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
            {snapping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Snapshot
          </button>
        </form>
        {pages.length > 0 && (
          <button onClick={() => downloadCSV(toCSV(pages.flatMap(g => g.snapshots.map(s => ({ url: s.url, title: s.title, h1: s.h1, wordCount: s.wordCount, takenAt: s.takenAt })))), "page-snapshots.csv")}
            className="h-10 px-4 rounded border border-border text-[13px] font-medium hover:bg-muted transition-colors">
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <p className="text-[13px] text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
      ) : pages.length === 0 ? (
        <div className="rounded border-2 border-dashed border-border py-12 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-display font-bold text-base mb-1">No pages monitored yet</p>
          <p className="text-[13px] text-muted-foreground">Enter a URL above and click Snapshot to begin tracking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map(group => {
            const [latest, prev] = group.snapshots;
            const hasDiff = !!prev;
            const url = group.url;
            const domain = (() => { try { return new URL(url).pathname || "/"; } catch { return url; } })();

            return (
              <div key={url} className="rounded border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-primary hover:underline truncate">{domain}</a>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-muted-foreground">
                    {hasDiff && <span className="text-amber-600 dark:text-amber-400 font-medium">Changed</span>}
                    <span>Snapped {new Date(latest.takenAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left px-4 py-2 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px] w-28">Field</th>
                        <th className="text-left px-4 py-2 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">Current</th>
                        {hasDiff && <th className="text-left px-4 py-2 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">Previous</th>}
                        {hasDiff && <th className="text-left px-4 py-2 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">Change</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { field: "Title", curr: latest.title, prev: prev?.title, numeric: false },
                        { field: "H1", curr: latest.h1, prev: prev?.h1, numeric: false },
                        { field: "Meta desc", curr: latest.metaDescription?.slice(0, 80) + (latest.metaDescription?.length > 80 ? "…" : ""), prev: prev?.metaDescription?.slice(0, 80), numeric: false },
                        { field: "Word count", curr: String(latest.wordCount), prev: String(prev?.wordCount ?? ""), numeric: true, numCurr: latest.wordCount, numPrev: prev?.wordCount },
                        { field: "Int. links", curr: String(latest.internalLinks), prev: String(prev?.internalLinks ?? ""), numeric: true, numCurr: latest.internalLinks, numPrev: prev?.internalLinks },
                      ].map(({ field, curr, prev: p, numeric, numCurr, numPrev }) => {
                        const changed = hasDiff && curr !== p;
                        return (
                          <tr key={field} className={`border-b border-border/60 last:border-0 ${changed ? "bg-amber-500/5" : ""}`}>
                            <td className="px-4 py-2.5 font-medium text-muted-foreground">{field}</td>
                            <td className={`px-4 py-2.5 ${numeric ? "stat-num" : ""} ${changed ? "font-semibold" : ""}`}>{curr || "—"}</td>
                            {hasDiff && <td className={`px-4 py-2.5 text-muted-foreground ${numeric ? "stat-num" : ""}`}>{p || "—"}</td>}
                            {hasDiff && (
                              <td className="px-4 py-2.5">
                                {numeric && numCurr != null && numPrev != null
                                  ? <DiffBadge d={diff(numPrev, numCurr)} />
                                  : changed ? <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">Changed</span> : <Minus className="h-3 w-3 text-muted-foreground/40" />
                                }
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
