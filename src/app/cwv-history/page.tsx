"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { downloadCSV, toCSV } from "@/lib/export/csv";

interface CwvRecord {
  id: string; url: string; strategy: string;
  performanceScore: number | null; lcpMs: number | null;
  clsScore: number | null; inpMs: number | null; fcpMs: number | null;
  ttfbMs: number | null; recordedAt: string;
}

const METRICS = [
  { key: "performanceScore", label: "Performance", unit: "", multiply: 100, decimals: 0, good: 90, bad: 50, color: "#16a34a" },
  { key: "lcpMs", label: "LCP (ms)", unit: "ms", multiply: 1, decimals: 0, good: 2500, bad: 4000, color: "#2563eb", lowerBetter: true },
  { key: "clsScore", label: "CLS", unit: "", multiply: 1000, decimals: 1, good: 100, bad: 250, color: "#d97706", lowerBetter: true },
  { key: "inpMs", label: "INP (ms)", unit: "ms", multiply: 1, decimals: 0, good: 200, bad: 500, color: "#7c3aed", lowerBetter: true },
  { key: "ttfbMs", label: "TTFB (ms)", unit: "ms", multiply: 1, decimals: 0, good: 800, bad: 1800, color: "#0891b2", lowerBetter: true },
];

export default function CwvHistoryPage() {
  const [url, setUrl] = useState("");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [history, setHistory] = useState<CwvRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!url.trim()) return;
    setLoading(true); setError("");
    const res = await fetch(`/api/cwv-history?url=${encodeURIComponent(url.trim())}`);
    const data = await res.json();
    setHistory(data.history ?? []);
    setLoading(false);
  }

  async function record() {
    if (!url.trim()) return;
    setRecording(true); setError("");
    const res = await fetch("/api/cwv-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), strategy }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else await load();
    setRecording(false);
  }

  const chartData = history.map(h => ({
    date: new Date(h.recordedAt).toLocaleDateString("en", { month: "short", day: "numeric" }),
    perf: h.performanceScore != null ? Math.round(h.performanceScore * 100) : null,
    lcp: h.lcpMs,
    cls: h.clsScore != null ? +(h.clsScore * 1000).toFixed(1) : null,
    inp: h.inpMs,
    ttfb: h.ttfbMs,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Core Web Vitals History" description="Track LCP, CLS, INP, and performance scores over time. Record a new snapshot at any time." />

      <div className="flex flex-wrap gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && load()}
          placeholder="https://example.com/page"
          className="flex-1 min-w-[240px] h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <div className="flex gap-1 rounded border border-border overflow-hidden h-10">
          {(["mobile", "desktop"] as const).map(s => (
            <button key={s} onClick={() => setStrategy(s)}
              className={`px-3 text-[12px] font-semibold capitalize transition-colors ${strategy === s ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              {s}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading || !url.trim()}
          className="h-10 px-4 rounded border border-border text-[13px] font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Load history
        </button>
        <button onClick={record} disabled={recording || !url.trim()}
          className="h-10 px-4 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {recording ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          {recording ? "Recording…" : "Record now"}
        </button>
        {history.length > 0 && (
          <button onClick={() => downloadCSV(toCSV(history as unknown as Record<string, unknown>[]), "cwv-history.csv")}
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

      {history.length > 0 && (
        <div className="space-y-6">
          {/* Latest snapshot cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {METRICS.map(m => {
              const latest = history[history.length - 1];
              const raw = latest[m.key as keyof CwvRecord] as number | null;
              const val = raw != null ? (raw * m.multiply) : null;
              const display = val != null ? val.toFixed(m.decimals) : "—";
              const isGood = val == null ? null : m.lowerBetter ? val <= m.good : val >= m.good;
              const isBad = val == null ? null : m.lowerBetter ? val >= m.bad : val <= m.bad;
              const cls = isGood ? "text-emerald-600 dark:text-emerald-400" : isBad ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400";
              return (
                <div key={m.key} className="rounded border border-border bg-card p-4">
                  <p className="text-[11px] text-muted-foreground font-medium">{m.label}</p>
                  <p className={`stat-num font-bold text-xl mt-1 ${val != null ? cls : ""}`}>{display}</p>
                </div>
              );
            })}
          </div>

          {/* Chart — performance score */}
          {chartData.length > 1 && (
            <div className="rounded border border-border bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-4">Performance Score over time</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }} />
                  <Line type="monotone" dataKey="perf" name="Perf. Score" stroke="#16a34a" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* LCP + INP chart */}
          {chartData.length > 1 && (
            <div className="rounded border border-border bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-4">LCP · INP · TTFB (ms)</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid var(--border)", background: "var(--card)" }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="lcp" name="LCP" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="inp" name="INP" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ttfb" name="TTFB" stroke="#0891b2" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History table */}
          <div className="rounded border border-border overflow-hidden bg-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-semibold text-[13px]">All snapshots ({history.length})</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Date", "Perf.", "LCP", "CLS", "INP", "TTFB"].map(h => (
                      <th key={h} className="text-left px-4 py-2 font-semibold uppercase tracking-[0.06em] text-muted-foreground text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h, i) => (
                    <tr key={h.id} className={`border-b border-border/60 last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-4 py-2.5 text-muted-foreground">{new Date(h.recordedAt).toLocaleString()}</td>
                      <td className="px-4 py-2.5 stat-num font-medium">{h.performanceScore != null ? Math.round(h.performanceScore * 100) : "—"}</td>
                      <td className="px-4 py-2.5 stat-num">{h.lcpMs ?? "—"}</td>
                      <td className="px-4 py-2.5 stat-num">{h.clsScore != null ? (h.clsScore * 1000).toFixed(1) : "—"}</td>
                      <td className="px-4 py-2.5 stat-num">{h.inpMs ?? "—"}</td>
                      <td className="px-4 py-2.5 stat-num">{h.ttfbMs ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
