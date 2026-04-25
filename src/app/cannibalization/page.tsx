"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/export/csv";

interface QueryRow { query: string; impressions: number; clicks: number; position: number }
interface CannibalGroup { topic: string; queries: QueryRow[]; totalImpressions: number; avgPosition: number; risk: "high" | "medium" | "low" }
interface Property { id: string; siteUrl: string }

const RISK_CONFIG = {
  high:   { cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",    dot: "bg-red-500"    },
  medium: { cls: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400", dot: "bg-amber-400" },
  low:    { cls: "bg-muted border-border text-muted-foreground",                                                        dot: "bg-muted-foreground/40" },
};

export default function CannibalizationPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProp, setSelectedProp] = useState("");
  const [groups, setGroups] = useState<CannibalGroup[]>([]);
  const [queryCount, setQueryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/gsc/properties").then(r => r.json()).then(d => {
      const props = d.properties ?? [];
      setProperties(props);
      if (props.length) setSelectedProp(props[0].id);
    });
  }, []);

  async function run() {
    if (!selectedProp) return;
    setLoading(true); setError("");
    const res = await fetch("/api/tools/cannibalization", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selectedProp }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else { setGroups(data.groups ?? []); setQueryCount(data.queryCount ?? 0); }
    setLoading(false);
  }

  function toggleExpand(topic: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Keyword Cannibalization" description="Find topics where multiple queries compete against each other, diluting your rankings." />

      <div className="flex flex-wrap gap-3 items-center">
        {properties.length > 0 && (
          <select value={selectedProp} onChange={e => setSelectedProp(e.target.value)}
            className="h-10 rounded border border-border bg-background px-3 text-[13px]">
            {properties.map(p => <option key={p.id} value={p.id}>{p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</option>)}
          </select>
        )}
        <button onClick={run} disabled={loading || !selectedProp}
          className="h-10 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Analyzing…" : "Detect cannibalization"}
        </button>
        {groups.length > 0 && (
          <button onClick={() => downloadCSV(toCSV(groups.flatMap(g => g.queries.map(q => ({ topic: g.topic, query: q.query, impressions: q.impressions, position: q.position, risk: g.risk })))), "cannibalization.csv")}
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

      {groups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-[13px]">
            <span className="text-muted-foreground">{queryCount.toLocaleString()} queries analyzed</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">{groups.filter(g => g.risk === "high").length} high risk</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold">{groups.filter(g => g.risk === "medium").length} medium</span>
          </div>

          <div className="space-y-2">
            {groups.map(g => {
              const cfg = RISK_CONFIG[g.risk];
              const open = expanded.has(g.topic);
              return (
                <div key={g.topic} className={`rounded border ${cfg.cls} overflow-hidden`}>
                  <button onClick={() => toggleExpand(g.topic)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:opacity-90 transition-opacity">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <span className="font-semibold text-[13px] flex-1">"{g.topic}"</span>
                    <span className="text-[11px] opacity-70">{g.queries.length} queries · {g.totalImpressions.toLocaleString()} impr · pos {g.avgPosition.toFixed(1)}</span>
                    {open ? <ChevronDown className="h-4 w-4 opacity-50" /> : <ChevronRight className="h-4 w-4 opacity-50" />}
                  </button>
                  {open && (
                    <div className="border-t border-current/10 divide-y divide-current/10">
                      {g.queries.map(q => (
                        <div key={q.query} className="flex items-center gap-3 px-4 py-2.5 text-[12px] opacity-80">
                          <span className="flex-1 font-medium">{q.query}</span>
                          <span className="stat-num">{q.impressions.toLocaleString()}</span>
                          <span className="stat-num w-12 text-right">#{q.position.toFixed(1)}</span>
                        </div>
                      ))}
                      <div className="px-4 py-3 text-[12px] opacity-70">
                        <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5" />
                        Consolidate these into one authoritative page, or differentiate the content to serve distinct intents.
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && groups.length === 0 && queryCount > 0 && (
        <p className="text-[13px] text-muted-foreground">No significant cannibalization detected in {queryCount.toLocaleString()} queries.</p>
      )}
    </div>
  );
}
