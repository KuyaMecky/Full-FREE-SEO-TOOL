"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Plus, Trash2, AlertCircle, Bell, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface Property { id: string; siteUrl: string }
interface AlertRule { id: string; name: string; metric: string; operator: string; threshold: number; enabled: boolean; propertyId: string | null; lastFiredAt: string | null; createdAt: string }

const METRICS = [
  { value: "avg_position", label: "Avg. Position" },
  { value: "ctr", label: "CTR (%)" },
  { value: "impressions", label: "Impressions" },
  { value: "clicks", label: "Clicks" },
  { value: "rank_drop", label: "Rank drop (positions)" },
];

const OPERATORS: Record<string, Array<{ value: string; label: string }>> = {
  avg_position: [{ value: "gt", label: "drops below (rises above #)" }],
  ctr:          [{ value: "lt", label: "falls below (%)" }],
  impressions:  [{ value: "lt", label: "falls below" }, { value: "gt", label: "rises above" }],
  clicks:       [{ value: "lt", label: "falls below" }, { value: "gt", label: "rises above" }],
  rank_drop:    [{ value: "drops_by", label: "drops by more than (positions)" }],
};

export default function AlertsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [metric, setMetric] = useState("avg_position");
  const [operator, setOperator] = useState("gt");
  const [threshold, setThreshold] = useState("");
  const [propertyId, setPropertyId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/gsc/properties").then(r => r.json()),
      fetch("/api/alerts").then(r => r.json()),
    ]).then(([propData, ruleData]) => {
      setProperties(propData.properties ?? []);
      setRules(ruleData.rules ?? []);
    }).finally(() => setLoading(false));
  }, []);

  // Sync operator when metric changes
  useEffect(() => {
    const ops = OPERATORS[metric];
    if (ops && !ops.find(o => o.value === operator)) setOperator(ops[0].value);
  }, [metric]);

  async function addRule(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !threshold) return;
    setAdding(true); setError("");
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), metric, operator, threshold: parseFloat(threshold), propertyId: propertyId || null }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else {
      setRules(prev => [data.rule, ...prev]);
      setName(""); setThreshold("");
    }
    setAdding(false);
  }

  async function deleteRule(id: string) {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    setRules(prev => prev.filter(r => r.id !== id));
  }

  async function toggleRule(rule: AlertRule) {
    const res = await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setRules(prev => prev.map(r => r.id === rule.id ? data.rule : r));
    }
  }

  const metricLabel = (m: string) => METRICS.find(x => x.value === m)?.label ?? m;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Custom Alert Rules" description="Get notified when your SEO metrics cross defined thresholds. Alerts fire via the notification system and email (if configured)." />

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        {/* Add rule form */}
        <div className="space-y-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">New alert rule</p>
          <form onSubmit={addRule} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Rule name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Position drops below 20"
                className="w-full h-9 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Property (optional)</label>
              <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
                className="w-full h-9 rounded border border-border bg-background px-3 text-[13px]">
                <option value="">All properties</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Metric</label>
              <select value={metric} onChange={e => setMetric(e.target.value)}
                className="w-full h-9 rounded border border-border bg-background px-3 text-[13px]">
                {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Condition</label>
              <div className="flex gap-2">
                <select value={operator} onChange={e => setOperator(e.target.value)}
                  className="flex-1 h-9 rounded border border-border bg-background px-3 text-[13px]">
                  {(OPERATORS[metric] ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="number" value={threshold} onChange={e => setThreshold(e.target.value)}
                  placeholder="Value" className="w-24 h-9 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" required />
              </div>
            </div>
            {error && <p className="text-[12px] text-destructive flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {error}</p>}
            <button type="submit" disabled={adding}
              className="w-full h-9 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Adding…" : "Add rule"}
            </button>
          </form>
        </div>

        {/* Rules list */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-3">Active rules</p>
          {loading ? (
            <p className="text-[13px] text-muted-foreground">Loading…</p>
          ) : rules.length === 0 ? (
            <div className="rounded border-2 border-dashed border-border py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[13px] text-muted-foreground">No alert rules yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className={`flex items-center gap-3 p-4 rounded border transition-colors ${rule.enabled ? "border-border bg-card" : "border-border/50 bg-muted/20"}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold ${!rule.enabled && "text-muted-foreground"}`}>{rule.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {metricLabel(rule.metric)} {rule.operator === "lt" ? "<" : rule.operator === "gt" ? ">" : "drops by"} {rule.threshold}
                      {rule.lastFiredAt && ` · Last fired ${new Date(rule.lastFiredAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button onClick={() => toggleRule(rule)} className="text-muted-foreground hover:text-primary transition-colors" title={rule.enabled ? "Disable" : "Enable"}>
                    {rule.enabled ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
