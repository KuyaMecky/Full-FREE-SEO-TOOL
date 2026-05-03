import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  getAhrefsDomainMetrics,
  getAhrefsBacklinks,
  calculateAhrefsScore,
  detectAhrefsIssues,
} from "@/lib/ahrefs/client";

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
      include: { user: true },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
    });

    if (!settings?.ahrefsApiKey) {
      return NextResponse.json({ error: "Ahrefs API key not configured" }, { status: 400 });
    }

    runAhrefsAudit(propertyId, property.siteUrl, settings.ahrefsApiKey, session.id).catch(
      (error) => console.error("Ahrefs audit failed:", error)
    );

    return NextResponse.json({
      success: true,
      message: "Ahrefs audit started",
      propertyId,
    });
  } catch (error) {
    console.error("Audit error:", error);
    return NextResponse.json({ error: "Failed to start audit" }, { status: 500 });
  }
}

async function runAhrefsAudit(
  propertyId: string,
  siteUrl: string,
  ahrefsApiKey: string,
  userId: string
) {
  try {
    console.log(`[${propertyId}] Starting Ahrefs audit for ${siteUrl}`);

    const domain = new URL(siteUrl).hostname;

    const metrics = await getAhrefsDomainMetrics(ahrefsApiKey, domain);
    if (!metrics) {
      console.error(`[${propertyId}] Failed to fetch Ahrefs metrics`);
      return;
    }

    const backlinksData = await getAhrefsBacklinks(ahrefsApiKey, domain, 50);
    const issues = detectAhrefsIssues(metrics);
    const score = calculateAhrefsScore(metrics);

    console.log(`[${propertyId}] Ahrefs audit complete: score=${score}, issues=${issues.length}`);

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
          affectedUrls: JSON.stringify([siteUrl]),
          severity: issue.severity,
          impact: issue.impact,
          recommendedFix: issue.fix,
          owner: "dev",
          effort: issue.effort,
          priority: issue.priority,
        },
      });
    }

    const report = generateAhrefsReport(siteUrl, score, metrics, issues, backlinksData);
    await prisma.auditReport.create({
      data: {
        auditId: audit.id,
        executiveSummary: JSON.stringify(report.summary),
        scorecard: JSON.stringify(report.scorecard),
        roadmap: JSON.stringify(report.roadmap),
        kpiPlan: JSON.stringify(report.kpi),
        actionItems: JSON.stringify(report.actions),
        stakeholderSummary: report.stakeholder,
        devTaskList: JSON.stringify(report.tasks),
      },
    });
  } catch (error) {
    console.error(`[${propertyId}] Ahrefs audit failed:`, error);
  }
}

function generateAhrefsReport(
  siteUrl: string,
  score: number,
  metrics: any,
  issues: any[],
  backlinksData: any
) {
  const topBacklinks = backlinksData?.backlinks?.slice(0, 5) || [];

  return {
    summary: {
      overview: `Ahrefs audit of ${siteUrl}: ${score}/100`,
      keyFindings: [
        `Domain Rating: ${metrics.domain_rating}/100`,
        `Referring Domains: ${metrics.referring_domains}`,
        `Organic Keywords Ranking: ${metrics.organic_keywords}`,
        `Organic Traffic: ${metrics.organic_traffic}/month`,
      ],
      topOpportunities: issues.slice(0, 3).map((i: any) => i.fix),
      riskAreas: issues.filter((i: any) => i.severity === "high").map((i: any) => i.title),
      topBacklinks: topBacklinks.map((b: any) => ({
        domain: new URL(b.referring_url).hostname,
        anchorText: b.anchor_text,
        domainRating: b.domain_rating,
      })),
    },
    scorecard: {
      overall: score,
      domainRating: metrics.domain_rating,
      referringDomains: metrics.referring_domains,
      backlinks: metrics.backlinks,
      organicKeywords: metrics.organic_keywords,
      organicTraffic: metrics.organic_traffic,
    },
    roadmap: [
      {
        phase: "Week 1-2",
        task: "Analyze current backlink profile and identify low-quality links",
        priority: "high",
      },
      {
        phase: "Week 3-4",
        task: "Develop backlink strategy targeting high-DR domains",
        priority: "high",
      },
      {
        phase: "Month 2",
        task: "Build authoritative backlinks and monitor progress",
        priority: "high",
      },
      {
        phase: "Month 3+",
        task: "Scale successful link-building campaigns",
        priority: "medium",
      },
    ],
    kpi: [
      {
        metric: "Domain Rating",
        current: `${metrics.domain_rating}/100`,
        target30: `${Math.min(metrics.domain_rating + 5, 100)}/100`,
        target60: `${Math.min(metrics.domain_rating + 10, 100)}/100`,
        target90: `${Math.min(metrics.domain_rating + 15, 100)}/100`,
      },
      {
        metric: "Referring Domains",
        current: `${metrics.referring_domains}`,
        target30: `${Math.round(metrics.referring_domains * 1.2)}`,
        target60: `${Math.round(metrics.referring_domains * 1.5)}`,
        target90: `${Math.round(metrics.referring_domains * 2)}`,
      },
      {
        metric: "Organic Keywords",
        current: `${metrics.organic_keywords}`,
        target30: `${Math.round(metrics.organic_keywords * 1.15)}`,
        target60: `${Math.round(metrics.organic_keywords * 1.35)}`,
        target90: `${Math.round(metrics.organic_keywords * 1.6)}`,
      },
    ],
    actions: issues.slice(0, 5).map((i: any, idx: number) => ({
      rank: idx + 1,
      action: i.title,
      impact: i.impact,
      effort: i.effort,
      owner: "dev",
    })),
    stakeholder: `Ahrefs audit found ${issues.length} opportunities. Focus on building quality backlinks and improving domain authority to drive organic growth.`,
    tasks: issues
      .filter((i: any) => i.severity === "high")
      .slice(0, 5)
      .map((i: any) => ({
        task: i.title,
        priority: "high",
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
