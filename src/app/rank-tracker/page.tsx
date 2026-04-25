"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Plus, Trash2, RefreshCw,
  Loader2, AlertCircle, Minus,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

interface Property { id: string; siteUrl: string }
interface Snapshot { id: string; date: string; position: number; impressions: number; clicks: number }
interface RankKeyword {
  id: string;
  keyword: string;
  property: { siteUrl: string };
  snapshots: Snapshot[];
}

function posColor(pos: number) {
  if (pos <= 3) return "text-emerald-600 dark:text-emerald-400";
  if (pos <= 10) return "text-emerald-600 dark:text-emerald-400";
  if (pos <= 20) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function trend(snaps: Snapshot[]) {
  if (snaps.length < 2) return null;
  const sorted = [...snaps].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return sorted[sorted.length - 1].position - sorted[0].position; // negative = improved
}

export default function RankTrackerPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [keywords, setKeywords] = useState<RankKeyword[]>([]);
  const [selected, setSelected] = useState<RankKeyword | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [newKws, setNewKws] = useState("");
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
    fetch(`/api/rank-tracker?propertyId=${selectedProp}`)
      .then(r => r.json())
      .then(d => { setKeywords(d.keywords ?? []); setSelected(null); })
      .finally(() => setLoading(false));
  }, [selectedProp]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newKws.trim() || !selectedProp) return;
    setAdding(true); setError("");
    const kwList = newKws.split(/[\n,]+/).map(k => k.trim()).filter(Boolean);
    const res = await fetch("/api/rank-tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selectedProp, keywords: kwList }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else {
      setNewKws("");
      const refreshed = await fetch(`/api/rank-tracker?propertyId=${selectedProp}`).then(r => r.json());
      setKeywords(refreshed.keywords ?? []);
    }
    setAdding(false);
  }

  async function handleRefresh(id: string) {
    setRefreshingId(id);
    await fetch(`/api/rank-tracker/${id}`, { method: "POST" });
    const refreshed = await fetch(`/api/rank-tracker?propertyId=${selectedProp}`).then(r => r.json());
    const kws = refreshed.keywords ?? [];
    setKeywords(kws);
    setSelected(kws.find((k: RankKeyword) => k.id === id) ?? null);
    setRefreshingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this keyword?")) return;
    await fetch(`/api/rank-tracker/${id}`, { method: "DELETE" });
    setKeywords(prev => prev.filter(k => k.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  const chartData = selected
    ? [...selected.snapshots]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(s => ({ date: new Date(s.date).toLocaleDateString("en", { month: "short", day: "numeric" }), pos: +s.position.toFixed(1), impr: s.impressions, clicks: s.clicks }))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Rank Tracker" description="Track keyword positions over time using Google Search Console data." />

      {/* Property selector */}
      {properties.length > 1 && (
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Property</label>
          <select value={selectedProp} onChange={e => setSelectedProp(e.target.value)}
            className="h-9 rounded border border-border bg-background px-3 text-[13px]">
            {properties.map(p => <option key={p.id} value={p.id}>{p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</option>)}
          </select>
        </div>
      )}

      <div className="grid lg:grid-cols-[300px_1fr] gap-6">
        {/* Keyword list + add form */}
        <div className="space-y-4">
          <form onSubmit={handleAdd} className="space-y-2">
            <label className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground block">Add keywords</label>
            <textarea value={newKws} onChange={e => setNewKws(e.target.value)}
              placeholder={"seo audit tool\nkeyword research\nsite crawl checker"}
              rows={4} className="w-full rounded border border-border bg-background px-3 py-2 text-[13px] resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
            <p className="text-[11px] text-muted-foreground">One per line or comma-separated · max 50</p>
            {error && <p className="text-[12px] text-destructive flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" />{error}</p>}
            <button type="submit" disabled={adding || !newKws.trim()}
              className="w-full h-9 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Adding…" : "Track keywords"}
            </button>
          </form>

          <div className="rounded border border-border overflow-hidden bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-[13px]">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
              </div>
            ) : keywords.length === 0 ? (
              <p className="text-[13px] text-muted-foreground text-center py-8">No keywords tracked yet</p>
            ) : keywords.map((kw, i) => {
              const latest = kw.snapshots[0];
              const t = trend(kw.snapshots);
              const isSelected = selected?.id === kw.id;
              return (
                <div key={kw.id} onClick={() => setSelected(kw)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-t first:border-t-0 border-border transition-colors ${isSelected ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{kw.keyword}</p>
                    {latest && (
                      <p className={`text-[11px] font-bold stat-num ${posColor(latest.position)}`}>
                        #{latest.position.toFixed(1)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {t !== null && (
                      t < 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" /> :
                      t > 0 ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> :
                      <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <button onClick={e => { e.stopPropagation(); handleRefresh(kw.id); }} disabled={refreshingId === kw.id}
                      className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                      <RefreshCw className={`h-3 w-3 ${refreshingId === kw.id ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(kw.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart panel */}
        <div className="rounded border border-border bg-card overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-[13px] text-muted-foreground">
              Select a keyword to view its position history
            </div>
          ) : (
            <div>
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-[14px]">{selected.keyword}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{selected.snapshots.length} data points · {selected.property.siteUrl.replace(/^https?:\/\//, "")}</p>
                </div>
                {selected.snapshots[0] && (
                  <div className="text-right">
                    <p className={`font-display font-bold text-2xl stat-num ${posColor(selected.snapshots[0].position)}`}>
                      #{selected.snapshots[0].position.toFixed(1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">latest position</p>
                  </div>
                )}
              </div>

              {chartData.length < 2 ? (
                <div className="flex items-center justify-center h-48 text-[13px] text-muted-foreground">
                  <div className="text-center">
                    <p>Not enough data to chart.</p>
                    <button onClick={() => handleRefresh(selected.id)} disabled={refreshingId === selected.id}
                      className="mt-3 flex items-center gap-2 mx-auto text-primary hover:underline text-[12px]">
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshingId === selected.id ? "animate-spin" : ""}`} />
                      Fetch 90-day history
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-3">Position (lower = better)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis reversed tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }}
                        formatter={(v: unknown) => [`#${v}`, "Position"]}
                      />
                      <ReferenceLine y={10} stroke="oklch(0.50 0.17 145)" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Line type="monotone" dataKey="pos" stroke="oklch(0.50 0.17 145)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                    {[
                      { label: "Best", value: `#${Math.min(...chartData.map(d => d.pos)).toFixed(1)}` },
                      { label: "Avg.", value: `#${(chartData.reduce((s, d) => s + d.pos, 0) / chartData.length).toFixed(1)}` },
                      { label: "Latest", value: `#${chartData[chartData.length - 1]?.pos.toFixed(1)}` },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="stat-num font-bold text-lg">{s.value}</p>
                        <p className="text-[11px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
