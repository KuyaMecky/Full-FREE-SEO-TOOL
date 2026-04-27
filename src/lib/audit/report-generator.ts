import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { generateDetailedHTMLReport } from "./detailed-report";

export async function generateShareableLink(auditId: string, userId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
  });

  if (!audit || audit.userId !== userId) {
    throw new Error("Audit not found or unauthorized");
  }

  let report = await prisma.auditReport.findUnique({
    where: { auditId },
  });

  if (!report) {
    throw new Error("Audit report not found");
  }

  if (!report.shareSlug) {
    let slug = nanoid(8);
    let existing = await prisma.auditReport.findUnique({ where: { shareSlug: slug } });
    while (existing) {
      slug = nanoid(8);
      existing = await prisma.auditReport.findUnique({ where: { shareSlug: slug } });
    }

    report = await prisma.auditReport.update({
      where: { id: report.id },
      data: { shareSlug: slug, isShared: true },
    });
  }

  return report;
}

export async function disableShareableLink(auditId: string, userId: string) {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
  });

  if (!audit || audit.userId !== userId) {
    throw new Error("Audit not found or unauthorized");
  }

  return await prisma.auditReport.update({
    where: { auditId },
    data: { isShared: false, shareSlug: null },
  });
}

export async function getPublicAuditReport(shareSlug: string) {
  const report = await prisma.auditReport.findUnique({
    where: { shareSlug: shareSlug },
    include: { audit: true },
  });

  if (!report || !report.isShared) {
    return null;
  }

  if (report.expiresAt && report.expiresAt < new Date()) {
    return null;
  }

  await prisma.auditReport.update({
    where: { id: report.id },
    data: {
      viewCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return report;
}

export async function generateHTMLReport(
  audit: any,
  report: any
): Promise<string> {
  const scorecard = JSON.parse(report.scorecard || "{}");
  const actionItems = JSON.parse(report.actionItems || "[]");

  // Convert action items to findings format
  const findings = actionItems.map((item: any) => ({
    severity: item.severity || "medium",
    issue: item.title || item.description || "Unknown issue",
    description: item.description || item.details || "",
    fix: item.fix || item.recommendation || "Review and fix this issue",
    affectedPages: item.affectedPages || 0,
    impact: item.impact || "Could affect SEO performance",
  }));

  const scores = {
    overall: scorecard.overall || 75,
    technical: scorecard.technical || 70,
    onPage: scorecard["on-page"] || 75,
    content: scorecard.content || 80,
    performance: scorecard["ux-performance"] || 65,
  };

  return generateDetailedHTMLReport(
    audit.domain || audit.siteUrl,
    scores,
    findings,
    audit.pagesCrawled || 0,
    new Date()
  );
}
