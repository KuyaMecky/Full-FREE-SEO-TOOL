"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Loader2, AlertCircle, CheckCircle, XCircle, Globe } from "lucide-react";

interface HreflangTag { lang: string; href: string }
interface HreflangIssue { severity: "error" | "warning"; message: string }
interface RecipCheck { url: string; lang: string; hasReciprocal: boolean; error?: string }
interface Result { tags: HreflangTag[]; issues: HreflangIssue[]; reciprocalChecks: RecipCheck[] }

export default function HreflangPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch("/api/tools/hreflang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Failed");
    else setResult(data);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader title="Hreflang Validator" description="Check hreflang tags for correct lang codes, self-referential tags, x-default, and reciprocal links." />

      <form onSubmit={check} className="flex gap-2">
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/en/"
          className="flex-1 h-10 rounded border border-border bg-background px-3 text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none" />
        <button type="submit" disabled={loading || !url.trim()}
          className="h-10 px-5 rounded bg-primary text-primary-foreground text-[13px] font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {loading ? "Checking…" : "Validate"}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded border border-destructive/20 bg-destructive/8 text-[13px] text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Issues */}
          {result.issues.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded border border-emerald-500/20 bg-emerald-500/8 text-[13px] text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" /> All hreflang tags look valid
            </div>
          ) : (
            <div className="space-y-2">
              {result.issues.map((iss, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-3 rounded border text-[13px] ${
                  iss.severity === "error"
                    ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                }`}>
                  {iss.severity === "error" ? <XCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  {iss.message}
                </div>
              ))}
            </div>
          )}

          {/* Tag list */}
          {result.tags.length > 0 && (
            <div className="rounded border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="font-semibold text-[13px]">{result.tags.length} hreflang tags found</p>
              </div>
              <div className="divide-y divide-border">
                {result.tags.map((tag, i) => {
                  const reciprocal = result.reciprocalChecks.find(r => r.lang === tag.lang);
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold bg-muted px-2 py-0.5 rounded font-mono">{tag.lang}</span>
                          <a href={tag.href} target="_blank" rel="noopener noreferrer"
                            className="text-[12px] text-primary hover:underline truncate">{tag.href}</a>
                        </div>
                      </div>
                      {reciprocal && (
                        <div title={!reciprocal.hasReciprocal ? reciprocal.error ?? "No reciprocal" : undefined}>
                          {reciprocal.hasReciprocal
                            ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                            : <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          }
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
