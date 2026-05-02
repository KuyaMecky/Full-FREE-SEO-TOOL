import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const AHREFS_BASE = "https://api.ahrefs.com/v3";

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

    if (!process.env.AHREFS_API_KEY) {
      return NextResponse.json({ error: "Ahrefs API not configured" }, { status: 400 });
    }

    runAhrefsAudit(propertyId, property.siteUrl, session.id).catch(
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

async function runAhrefsAudit(propertyId: string, siteUrl: string, userId: string) {
  try {
    console.log(`[${propertyId}] Starting Ahrefs audit for ${siteUrl}`);

    const apiKey = process.env.AHREFS_API_KEY || "";
    const domain = new URL(siteUrl).hostname;

    const siteData = await fetchAhrefsSiteMetrics(domain, apiKey);
    const issues = detectAhrefsIssues(siteData);
    const score = calculateAhrefsScore(siteData, issues);

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

    const report = generateAhrefsReport(siteUrl, score, siteData, issues);
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
    console.error(`Ahrefs audit failed:`, error);
  }
}

async function fetchAhrefsSiteMetrics(domain: string, apiKey: string) {
  try {
    const res = await fetch(`${AHREFS_BASE}/site-overview?target=${domain}&mode=domain`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.error("Ahrefs API error:", res.status);
      return {};
    }

    return res.json();
  } catch (error) {
    console.error("Failed to fetch Ahrefs metrics:", error);
    return {};
  }
}

interface AhrefsSiteData {
  domain_rating?: number;
  referring_domains?: number;
  organic_traffic?: number;
  organic_keywords?: number;
  backlinks?: number;
  [key: string]: any;
}

function detectAhrefsIssues(siteData: AhrefsSiteData) {
  const issues = [];

  const domainRating = siteData.domain_rating || 0;
  if (domainRating < 20) {
    issues.push({
      category: "Authority",
      title: "Low domain authority",
      evidence: `Domain Rating: ${domainRating}/100`,
      severity: "high",
      impact: "High",
      fix: "Build more high-quality backlinks from relevant domains",
      effort: "High",
      priority: 1,
    });
  }

  const trafficEstimate = siteData.organic_traffic || 0;
  if (trafficEstimate < 100) {
    issues.push({
      category: "Visibility",
      title: "Low organic traffic estimate",
      evidence: `Estimated monthly traffic: ${trafficEstimate}`,
      severity: "high",
      impact: "High",
      fix: "Improve content relevance and keyword targeting",
      effort: "High",
      priority: 2,
    });
  }

  const refDomains = siteData.referring_domains || 0;
  if (refDomains < 10) {
    issues.push({
      category: "Backlinks",
      title: "Few referring domains",
      evidence: `Referring domains: ${refDomains}`,
      severity: "medium",
      impact: "High",
      fix: "Conduct outreach and content marketing to build backlinks",
      effort: "High",
      priority: 3,
    });
  }

  return issues;
}

function calculateAhrefsScore(siteData: AhrefsSiteData, issues: any[]): number {
  let score = 50;

  const dr = siteData.domain_rating || 0;
  score += (dr / 100) * 25;

  const traffic = Math.min((siteData.organic_traffic || 0) / 10000 * 25, 25);
  score += traffic;

  for (const issue of issues) {
    if (issue.severity === "high") score -= 5;
    else if (issue.severity === "medium") score -= 3;
  }

  return Math.max(0, Math.min(100, score));
}

function generateAhrefsReport(siteUrl: string, score: number, siteData: AhrefsSiteData, issues: any[]) {
  return {
    summary: {
      overview: `Ahrefs audit of ${siteUrl}: ${score}/100`,
      keyFindings: issues.slice(0, 3).map((i) => i.title),
      topOpportunities: issues.slice(0, 3).map((i) => i.fix),
      riskAreas: issues.filter((i) => i.severity === "high").map((i) => i.title),
      metrics: {
        domainRating: siteData.domain_rating || 0,
        referringDomains: siteData.referring_domains || 0,
        organicTraffic: siteData.organic_traffic || 0,
        organicKeywords: siteData.organic_keywords || 0,
      },
    },
    roadmap: [
      {
        phase: "Week 1-2",
        task: "Audit backlink profile and identify link building opportunities",
        priority: "high",
      },
      {
        phase: "Week 3-4",
        task: "Create and promote high-quality content",
        priority: "high",
      },
      {
        phase: "Month 2+",
        task: "Build backlinks through outreach and partnerships",
        priority: "medium",
      },
    ],
    kpi: [
      {
        metric: "Domain Rating",
        current: `${siteData.domain_rating || 0}/100`,
        target30: `${Math.min((siteData.domain_rating || 0) + 3, 100)}/100`,
        target60: `${Math.min((siteData.domain_rating || 0) + 7, 100)}/100`,
        target90: `${Math.min((siteData.domain_rating || 0) + 12, 100)}/100`,
      },
      {
        metric: "Organic Traffic",
        current: `${siteData.organic_traffic || 0}/month`,
        target30: `${Math.round((siteData.organic_traffic || 0) * 1.2)}/month`,
        target60: `${Math.round((siteData.organic_traffic || 0) * 1.5)}/month`,
        target90: `${Math.round((siteData.organic_traffic || 0) * 2)}/month`,
      },
    ],
    actions: issues.slice(0, 5).map((i, idx) => ({
      rank: idx + 1,
      action: i.title,
      impact: i.impact,
      effort: i.effort,
      owner: "dev",
    })),
    stakeholder: `Ahrefs analysis found ${issues.length} opportunities. Focus on building domain authority and backlinks.`,
    tasks: issues
      .filter((i) => i.severity === "high")
      .slice(0, 5)
      .map((i) => ({
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
