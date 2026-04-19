import { prisma } from "@/lib/db";
import { fetchPsi, PsiStrategy, PsiResult } from "./client";
import { getPagespeedApiKey } from "./config";

const SLEEP_BETWEEN_CALLS_MS = 2000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch CWV for the audit. Keeps API usage minimal: homepage × mobile by default.
 * PSI's anonymous quota is very tight — set PAGESPEED_API_KEY for the 25k/day limit.
 */
export async function runCwvForAudit(auditId: string): Promise<void> {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    select: {
      id: true,
      domain: true,
      priorityPages: true,
    },
  });
  if (!audit) throw new Error("Audit not found");

  const apiKey = await getPagespeedApiKey();

  const baseUrl = audit.domain.startsWith("http")
    ? audit.domain.replace(/\/$/, "")
    : `https://${audit.domain.replace(/\/$/, "")}`;

  // Only fetch the homepage in the default run. Users can manually
  // re-run for other URLs via the standalone /performance tool.
  const targets: string[] = [baseUrl];

  // Only mobile — Google's Core Web Vitals rank factor is mobile-based.
  const strategies: PsiStrategy[] = ["mobile"];

  for (const url of targets) {
    for (const strategy of strategies) {
      const result = await fetchWithRetry(url, strategy, apiKey);
      if (!result) continue;
      await prisma.cwvResult.upsert({
        where: {
          auditId_url_strategy: { auditId, url, strategy },
        },
        create: {
          auditId,
          url,
          strategy,
          ...resultColumns(result),
        },
        update: {
          ...resultColumns(result),
          fetchedAt: new Date(),
        },
      });
      await sleep(SLEEP_BETWEEN_CALLS_MS);
    }
  }
}

function resultColumns(result: PsiResult) {
  return {
    performanceScore: result.performanceScore,
    accessibilityScore: result.accessibilityScore,
    seoScore: result.seoScore,
    bestPracticesScore: result.bestPracticesScore,
    lcpMs: result.lcpMs,
    fcpMs: result.fcpMs,
    clsScore: result.clsScore,
    inpMs: result.inpMs,
    ttfbMs: result.ttfbMs,
    speedIndex: result.speedIndex,
    fieldData: JSON.stringify(result.fieldData),
    topIssues: JSON.stringify(result.topIssues),
  };
}

async function fetchWithRetry(
  url: string,
  strategy: PsiStrategy,
  apiKey: string | undefined,
  attempt = 0
): Promise<PsiResult | null> {
  try {
    return await fetchPsi(url, strategy, apiKey);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("429") && attempt < 2) {
      await sleep(10_000 * (attempt + 1));
      return fetchWithRetry(url, strategy, apiKey, attempt + 1);
    }
    console.error(`PSI failed for ${url} (${strategy}):`, msg);
    return null;
  }
}
