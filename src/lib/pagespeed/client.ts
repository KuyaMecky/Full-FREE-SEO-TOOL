export type PsiStrategy = "mobile" | "desktop";

export interface PsiTopIssue {
  id: string;
  title: string;
  description: string;
  savingsMs?: number;
  score?: number | null;
}

export interface PsiResult {
  url: string;
  strategy: PsiStrategy;
  performanceScore: number | null;
  accessibilityScore: number | null;
  seoScore: number | null;
  bestPracticesScore: number | null;
  lcpMs: number | null;
  fcpMs: number | null;
  clsScore: number | null;
  inpMs: number | null;
  ttfbMs: number | null;
  speedIndex: number | null;
  fieldData: unknown | null;
  topIssues: PsiTopIssue[];
}

function msFromAudit(val: unknown): number | null {
  if (typeof val !== "number") return null;
  return Math.round(val);
}

function cent(val: unknown): number | null {
  if (typeof val !== "number") return null;
  return Math.round(val * 100);
}

function pickAudits(lighthouseResult: Record<string, unknown>, ids: string[]) {
  const audits = (lighthouseResult.audits as Record<string, { numericValue?: number; displayValue?: string }>) ?? {};
  const out: Record<string, number | undefined> = {};
  for (const id of ids) {
    out[id] = audits[id]?.numericValue;
  }
  return out;
}

function topOpportunities(
  lighthouseResult: Record<string, unknown>,
  limit = 8
): PsiTopIssue[] {
  const audits =
    (lighthouseResult.audits as Record<
      string,
      {
        id?: string;
        title?: string;
        description?: string;
        score?: number | null;
        details?: { overallSavingsMs?: number; type?: string };
      }
    >) ?? {};

  const categories =
    (lighthouseResult.categories as Record<
      string,
      { auditRefs?: Array<{ id: string; group?: string; weight?: number }> }
    >) ?? {};

  const perfRefs = categories.performance?.auditRefs ?? [];
  const relevantIds = new Set(
    perfRefs
      .filter((r) => r.group === "diagnostics" || r.group === "load-opportunities")
      .map((r) => r.id)
  );

  const list: PsiTopIssue[] = [];

  for (const id of relevantIds) {
    const a = audits[id];
    if (!a) continue;
    // Skip passed audits (score >= 0.9) unless they have big savings
    const savings = a.details?.overallSavingsMs ?? 0;
    if ((a.score == null || a.score >= 0.9) && savings < 100) continue;
    list.push({
      id,
      title: a.title ?? id,
      description: (a.description ?? "").split("[Learn")[0].trim(),
      savingsMs: savings || undefined,
      score: a.score ?? null,
    });
  }

  list.sort((a, b) => (b.savingsMs ?? 0) - (a.savingsMs ?? 0));
  return list.slice(0, limit);
}

export async function fetchPsi(
  url: string,
  strategy: PsiStrategy,
  apiKey?: string
): Promise<PsiResult> {
  const params = new URLSearchParams({
    url,
    strategy,
  });
  params.append("category", "performance");
  params.append("category", "accessibility");
  params.append("category", "seo");
  params.append("category", "best-practices");
  if (apiKey) params.set("key", apiKey);

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

  const res = await fetch(endpoint, {
    // PSI can take 20-40s for a complex page
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PSI ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    lighthouseResult?: Record<string, unknown>;
    loadingExperience?: unknown;
    originLoadingExperience?: unknown;
  };

  const lh = data.lighthouseResult ?? {};
  const categories =
    (lh.categories as Record<string, { score?: number | null }>) ?? {};

  const metrics = pickAudits(lh, [
    "largest-contentful-paint",
    "first-contentful-paint",
    "cumulative-layout-shift",
    "interaction-to-next-paint",
    "total-blocking-time",
    "server-response-time",
    "speed-index",
  ]);

  return {
    url,
    strategy,
    performanceScore: cent(categories.performance?.score),
    accessibilityScore: cent(categories.accessibility?.score),
    seoScore: cent(categories.seo?.score),
    bestPracticesScore: cent(categories["best-practices"]?.score),
    lcpMs: msFromAudit(metrics["largest-contentful-paint"]),
    fcpMs: msFromAudit(metrics["first-contentful-paint"]),
    clsScore:
      typeof metrics["cumulative-layout-shift"] === "number"
        ? Number(metrics["cumulative-layout-shift"].toFixed(3))
        : null,
    // Prefer field INP, fall back to TBT (lab proxy)
    inpMs:
      msFromAudit(metrics["interaction-to-next-paint"]) ??
      msFromAudit(metrics["total-blocking-time"]),
    ttfbMs: msFromAudit(metrics["server-response-time"]),
    speedIndex: msFromAudit(metrics["speed-index"]),
    fieldData: data.loadingExperience ?? data.originLoadingExperience ?? null,
    topIssues: topOpportunities(lh),
  };
}
