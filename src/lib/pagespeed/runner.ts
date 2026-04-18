import { prisma } from "@/lib/db";
import { fetchPsi, PsiStrategy } from "./client";

/**
 * Fetch CWV for the audit's priority pages + homepage.
 * Runs sequentially to avoid hammering PSI's rate limits.
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

  const apiKey = process.env.PAGESPEED_API_KEY || undefined;

  const baseUrl = audit.domain.startsWith("http")
    ? audit.domain.replace(/\/$/, "")
    : `https://${audit.domain.replace(/\/$/, "")}`;

  const priorityPaths = (() => {
    try {
      return JSON.parse(audit.priorityPages || "[]") as string[];
    } catch {
      return [];
    }
  })();

  const targets = new Set<string>();
  targets.add(baseUrl);
  for (const p of priorityPaths.slice(0, 4)) {
    if (!p) continue;
    const normalized = p.startsWith("http")
      ? p
      : `${baseUrl}${p.startsWith("/") ? p : `/${p}`}`;
    targets.add(normalized);
  }

  const strategies: PsiStrategy[] = ["mobile", "desktop"];

  for (const url of targets) {
    for (const strategy of strategies) {
      try {
        const result = await fetchPsi(url, strategy, apiKey);
        await prisma.cwvResult.upsert({
          where: {
            auditId_url_strategy: {
              auditId,
              url,
              strategy,
            },
          },
          create: {
            auditId,
            url,
            strategy,
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
          },
          update: {
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
            fetchedAt: new Date(),
          },
        });
      } catch (err) {
        console.error(`PSI failed for ${url} (${strategy}):`, err);
        // Continue — a single failure shouldn't abort the whole run
      }
    }
  }
}
