"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { ArrowDown, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface Hop { url: string; status: number; location?: string }
interface Result { hops: Hop[]; issues: string[]; finalUrl: string }

const statusColor = (s: number) =>
  s >= 200 && s < 300 ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20" :
  s >= 300 && s < 400 ? "text-amber-600 dark:text-amber-400 bg-amber-500/8 border-amber-500/20" :
  s >= 400 ? "text-red-600 dark:text-red-400 bg-red-500/8 border-red-500/20" :
  "text-muted-foreground bg-muted border-border";

export default function RedirectChainPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch("/api/tools/redirect-chain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}` }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setResult(data);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Redirect Chain Auditor" description="Follow every redirect hop from a URL and flag chains, loops, and wrong status codes." />

      <form onSubmit={check} className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com/old-page"
          className="flex-1 h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <button type="submit" disabled={loading || !url.trim()}
          className="h-10 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Checking…" : "Check"}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Issues */}
          {result.issues.length > 0 ? (
            <div className="space-y-2">
              {result.issues.map((iss, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded border border-amber-500/20 bg-amber-500/8 text-[13px] text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {iss}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded border border-emerald-500/20 bg-emerald-500/8 text-[13px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" /> Clean redirect chain — no issues found
            </div>
          )}

          {/* Chain visualization */}
          <div className="rounded border border-border overflow-hidden bg-card">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {result.hops.length} hop{result.hops.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-4 space-y-2">
              {result.hops.map((hop, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-bold stat-num shrink-0 mt-0.5 ${statusColor(hop.status)}`}>
                      {hop.status || "ERR"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] break-all">{hop.url}</p>
                      {hop.location && hop.status !== (result.hops[result.hops.length - 1]?.status) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">→ {hop.location}</p>
                      )}
                    </div>
                  </div>
                  {i < result.hops.length - 1 && (
                    <div className="ml-[52px] my-1">
                      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
