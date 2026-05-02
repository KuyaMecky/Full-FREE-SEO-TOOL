import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { searchAnalyticsQuery, inspectUrl } from "@/lib/gsc/client";
import { analyzePageSpeed, getSeoScore, getPerformanceScore } from "@/lib/google/pagespeed";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 });
    }

    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
      include: { googleAccount: true, user: true },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!property.googleAccount?.accessToken) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    runAudit(propertyId, property.siteUrl, property.googleAccount.accessToken, session.id).catch(
      (error) => console.error("Audit failed:", error)
    );

    return NextResponse.json({
      success: true,
      message: "Audit started",
      propertyId,
    });
  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json({ error: "Failed to start audit" }, { status: 500 });
  }
}

async function runAudit(propertyId: string, siteUrl: string, accessToken: string, userId: string) {
  try {
    console.log(`[${propertyId}] Starting Google audit for ${siteUrl}`);

    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const gscData = await searchAnalyticsQuery(accessToken, siteUrl, {
      startDate: thirtyDaysAgo.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
      dimensions: ["page", "query"],
      rowLimit: 100,
    });

    const topPages = gscData.rows?.slice(0, 5).map((r: any) => r.keys?.[0]) || [];
    const homepage = topPages[0] || siteUrl;

    const inspection = await inspectUrl(accessToken, siteUrl, homepage);

    const psi = await analyzePageSpeed(process.env.GOOGLE_API_KEY || "", homepage, "mobile");

    const issues = detectIssues(inspection, gscData, psi);
    const score = calculateScore(issues, psi);

    console.log(`[${propertyId}] Audit complete: score=${score}, issues=${issues.length}`);

    const audit = await prisma.audit.create({
      data: {
        userId,
        domain: siteUrl,
        status: "complete",
        overallScore: score,
      },
    });

    for (const issue of issues) {
      await prisma.finding.create({
        data: {
          auditId: audit.id,
          category: issue.category,
          issue: issue.title,
          evidence: issue.evidence,
          affectedUrls: JSON.stringify([homepage]),
          severity: issue.severity,
          impact: issue.impact,
          recommendedFix: issue.fix,
          owner: "dev",
          effort: issue.effort,
          priority: issue.priority,
        },
      });
    }

    const report = generateReport(siteUrl, score, issues, inspection, gscData);
    await prisma.auditReport.create({
      data: {
        auditId: audit.id,
        executiveSummary: JSON.stringify(report.summary),
        scorecard: JSON.stringify({ overall: score }),
        roadmap: JSON.stringify(report.roadmap),
        kpiPlan: JSON.stringify(report.kpi),
        actionItems: JSON.stringify(report.actions),
        stakeholderSummary: report.stakeholder,
        devTaskList: JSON.stringify(report.tasks),
      },
    });
  } catch (error) {
    console.error(`Audit failed:`, error);
  }
}

function detectIssues(inspection: any, gscData: any, psi: any) {
  const issues = [];

  const verdict = inspection.inspectionResult?.indexStatusResult?.verdict;
  if (verdict === "FAIL") {
    issues.push({
      category: "Indexing",
      title: "Pages not indexed",
      evidence: "Google cannot index your pages",
      severity: "critical",
      impact: "Very High",
      fix: "Check robots.txt, sitemap.xml, and fix crawl errors in GSC",
      effort: "Medium",
      priority: 1,
    });
  }

  const mobileVerdict = inspection.inspectionResult?.mobileUsabilityResult?.verdict;
  if (mobileVerdict === "FAIL") {
    issues.push({
      category: "Mobile",
      title: "Mobile usability issues",
      evidence: "Your site has mobile usability problems",
      severity: "high",
      impact: "High",
      fix: "Fix mobile usability issues reported in GSC",
      effort: "Medium",
      priority: 2,
    });
  }

  const perfScore = getPerformanceScore(psi);
  if (perfScore < 50) {
    issues.push({
      category: "Performance",
      title: "Poor page performance",
      evidence: `Performance score: ${Math.round(perfScore)}/100`,
      severity: "high",
      impact: "High",
      fix: "Optimize images, enable compression, minimize JavaScript",
      effort: "High",
      priority: 3,
    });
  } else if (perfScore < 90) {
    issues.push({
      category: "Performance",
      title: "Performance could be better",
      evidence: `Performance score: ${Math.round(perfScore)}/100`,
      severity: "medium",
      impact: "Medium",
      fix: "Implement suggested optimizations in PageSpeed Insights",
      effort: "Medium",
      priority: 4,
    });
  }

  const seoScore = getSeoScore(psi);
  if (seoScore < 80) {
    issues.push({
      category: "SEO",
      title: "SEO issues found",
      evidence: `SEO score: ${Math.round(seoScore)}/100`,
      severity: "medium",
      impact: "Medium",
      fix: "Review SEO recommendations in PageSpeed Insights",
      effort: "Low",
      priority: 5,
    });
  }

  const clicks = gscData.rows?.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0) || 0;
  if (clicks < 10) {
    issues.push({
      category: "Visibility",
      title: "Low organic visibility",
      evidence: `Only ${clicks} clicks in last 30 days`,
      severity: "medium",
      impact: "High",
      fix: "Improve rankings through content and technical SEO",
      effort: "High",
      priority: 6,
    });
  }

  return issues;
}

function calculateScore(issues: any[], psi: any): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "critical") score -= 25;
    else if (issue.severity === "high") score -= 10;
    else if (issue.severity === "medium") score -= 5;
  }

  const perfScore = getPerformanceScore(psi);
  if (perfScore >= 90) score += 10;

  return Math.max(0, Math.min(100, score));
}

function generateReport(siteUrl: string, score: number, issues: any[], inspection: any, gscData: any) {
  return {
    summary: {
      overview: `Google audit of ${siteUrl}: ${score}/100`,
      keyFindings: issues.slice(0, 3).map((i) => i.title),
      topOpportunities: issues.slice(0, 3).map((i) => i.fix),
      riskAreas: issues.filter((i) => i.severity === "critical").map((i) => i.title),
    },
    roadmap: [
      {
        phase: "Week 1",
        task: "Fix critical indexing issues",
        priority: "high",
      },
      {
        phase: "Week 2-3",
        task: "Optimize page performance",
        priority: "high",
      },
      {
        phase: "Month 1",
        task: "Improve content and SEO",
        priority: "medium",
      },
    ],
    kpi: [
      {
        metric: "SEO Score",
        current: `${score}/100`,
        target30: `${Math.min(score + 15, 100)}/100`,
        target60: `${Math.min(score + 25, 100)}/100`,
        target90: `${Math.min(score + 35, 100)}/100`,
      },
    ],
    actions: issues.slice(0, 5).map((i, idx) => ({
      rank: idx + 1,
      action: i.title,
      impact: i.impact,
      effort: i.effort,
      owner: "dev",
    })),
    stakeholder: `Audit found ${issues.length} opportunities. Focus on critical issues first.`,
    tasks: issues
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 5)
      .map((i) => ({
        task: i.title,
        priority: i.severity === "critical" ? "high" : "medium",
        effort: i.effort,
        details: i.fix,
      })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const audits = await prisma.audit.findMany({
      where: { userId: session.id },
      include: { report: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(audits);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audits" }, { status: 500 });
  }
}
