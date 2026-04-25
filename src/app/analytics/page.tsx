"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, Users, Eye, Clock, TrendingDown, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { downloadCSV, toCSV } from "@/lib/export/csv";

interface Ga4Property { name: string; displayName: string }
interface Ga4Row { date: string; sessions: number; users: number; pageviews: number; bounceRate: number; avgSessionDuration: number }
interface Ga4TopPage { page: string; sessions: number; pageviews: number; bounceRate: number }
interface Totals { sessions?: number; users?: number; pageviews?: number; bounceRate?: number }

function fmtDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AnalyticsPage() {
  const [properties, setProperties] = useState<Ga4Property[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [rows, setRows] = useState<Ga4Row[]>([]);
  const [totals, setTotals] = useState<Totals>({});
  const [topPages, setTopPages] = useState<Ga4TopPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ga4?action=properties")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        const props = d.properties ?? [];
        setProperties(props);
        if (props.length) setSelectedProp(props[0].name);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedProp) return;
    setDataLoading(true);
    Promise.all([
      fetch(`/api/ga4?action=overview&propertyId=${encodeURIComponent(selectedProp)}`).then(r => r.json()),
      fetch(`/api/ga4?action=top-pages&propertyId=${encodeURIComponent(selectedProp)}`).then(r => r.json()),
    ]).then(([overview, pages]) => {
      setRows(overview.rows ?? []);
      setTotals(overview.totals ?? {});
      setTopPages(pages.pages ?? []);
    }).catch(e => setError(e.message))
      .finally(() => setDataLoading(false));
  }, [selectedProp]);

  const chartData = rows.map(r => ({
    date: `${r.date.slice(4, 6)}/${r.date.slice(6)}`,
    sessions: r.sessions,
    users: r.users,
    pageviews: r.pageviews,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Google Analytics 4" description="Session data, user engagement, and top pages to complement your GSC performance data." />

      {loading ? (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading GA4 properties…
        </div>
      ) : error ? (
        <div className="flex items-start gap-2.5 p-4 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-[13px] text-amber-700 dark:text-amber-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Could not load GA4</p>
            <p className="mt-0.5">{error}</p>
            <p className="mt-1 text-[11px]">Make sure you reconnect Google in Settings — the analytics.readonly scope was added and requires a new OAuth consent.</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <div className="rounded border-2 border-dashed border-border py-12 text-center">
          <p className="text-[13px] text-muted-foreground mb-3">No GA4 properties found in your Google account.</p>
          <p className="text-[11px] text-muted-foreground">Make sure Google Analytics is set up for your site and your account has access.</p>
        </div>
      ) : (
        <>
          {/* Property selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={selectedProp} onChange={e => setSelectedProp(e.target.value)}
              className="h-10 rounded border border-border bg-background px-3 text-[13px]">
              {properties.map(p => <option key={p.name} value={p.name}>{p.displayName}</option>)}
            </select>
            {rows.length > 0 && (
              <button onClick={() => downloadCSV(toCSV(rows as unknown as Record<string, unknown>[]), "ga4-data.csv")}
                className="h-10 px-4 rounded border border-border text-[13px] font-medium hover:bg-muted transition-colors">
                Export CSV
              </button>
            )}
          </div>

          {dataLoading ? (
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
            </div>
          ) : (
            <>
              {/* KPI strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Sessions", value: (totals.sessions ?? 0).toLocaleString(), icon: Users },
                  { label: "Users", value: (totals.users ?? 0).toLocaleString(), icon: Users },
                  { label: "Pageviews", value: (totals.pageviews ?? 0).toLocaleString(), icon: Eye },
                  { label: "Avg. Bounce Rate", value: `${((totals.bounceRate ?? 0) * 100).toFixed(1)}%`, icon: TrendingDown },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="stat-num font-bold text-2xl">{value}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="rounded border border-border bg-card p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-4">Sessions & Users — last 28 days</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="sessions" name="Sessions" stroke="oklch(0.50 0.17 145)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="users" name="Users" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top pages */}
              {topPages.length > 0 && (
                <div className="rounded border border-border bg-card overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-[13px]">Top Pages</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          {["Page", "Sessions", "Pageviews", "Bounce Rate"].map(h => (
                            <th key={h} className={`px-4 py-2.5 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px] ${h === "Page" ? "text-left" : "text-right"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {topPages.map((p, i) => (
                          <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-2.5 font-medium max-w-xs truncate">{p.page}</td>
                            <td className="px-4 py-2.5 text-right stat-num">{p.sessions.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right stat-num">{p.pageviews.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-right stat-num">{(p.bounceRate * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
