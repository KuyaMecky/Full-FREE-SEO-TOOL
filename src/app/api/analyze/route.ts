import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateScores, generateFindings } from "@/lib/scoring";
import { generateAIReport } from "@/lib/ai/analysis";
import {
  ScoreCard,
  FindingData,
  ExecutiveSummary,
  RoadmapItem,
  KpiTarget,
  ActionItem,
} from "@/types/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID is required" },
        { status: 400 }
      );
    }

    // Get audit with crawl results
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { crawlResults: true },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (audit.crawlResults.length === 0) {
      return NextResponse.json(
        { error: "No crawl results found" },
        { status: 400 }
      );
    }

    // Parse crawl results
    const crawlResults = audit.crawlResults.map((result) => ({
      ...result,
      headings: JSON.parse(result.headings || "[]"),
      links: JSON.parse(result.links || "[]"),
      images: JSON.parse(result.images || "[]"),
      structuredData: JSON.parse(result.structuredData || "[]"),
      issues: JSON.parse(result.issues || "[]"),
    }));

    // Calculate scores
    const scorecard = calculateScores(crawlResults);

    // Generate findings
    const findings = generateFindings(crawlResults);

    // Save findings to database
    for (const finding of findings) {
      await prisma.finding.create({
        data: {
          auditId,
          category: finding.category,
          issue: finding.issue,
          evidence: finding.evidence,
          affectedUrls: JSON.stringify(finding.affectedUrls),
          severity: finding.severity,
          impact: finding.impact,
          recommendedFix: finding.recommendedFix,
          owner: finding.owner,
          effort: finding.effort,
          priority: finding.priority,
        },
      });
    }

    // Try AI analysis if API key is available
    let reportData: {
      executiveSummary: ExecutiveSummary;
      roadmap: RoadmapItem[];
      kpiPlan: KpiTarget[];
      actionItems: ActionItem[];
      stakeholderSummary: string;
      devTaskList: { task: string; priority: "high" | "medium" | "low"; effort: string; details: string }[];
    } | null = null;

    try {
      reportData = await generateAIReport(
        audit,
        crawlResults,
        scorecard,
        findings
      );
    } catch (error) {
      console.error("AI analysis failed, using rule-based fallback:", error);
      reportData = generateRuleBasedReport(
        audit,
        crawlResults,
        scorecard,
        findings
      );
    }

    // Save report
    await prisma.auditReport.create({
      data: {
        auditId,
        executiveSummary: JSON.stringify(reportData.executiveSummary),
        scorecard: JSON.stringify(scorecard),
        roadmap: JSON.stringify(reportData.roadmap),
        kpiPlan: JSON.stringify(reportData.kpiPlan),
        actionItems: JSON.stringify(reportData.actionItems),
        stakeholderSummary: reportData.stakeholderSummary,
        devTaskList: JSON.stringify(reportData.devTaskList),
      },
    });

    // Update audit with final scores and status
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "complete",
        overallScore: scorecard.overall,
      },
    });

    return NextResponse.json({
      success: true,
      scorecard,
      findingsCount: findings.length,
    });
  } catch (error) {
    console.error("Analysis failed:", error);

    // Update audit with error
    await prisma.audit.update({
      where: { id: (await request.json()).auditId },
      data: {
        status: "error",
        errorMessage:
          error instanceof Error ? error.message : "Analysis failed",
      },
    });

    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

function generateRuleBasedReport(
  audit: any,
  crawlResults: any[],
  scorecard: ScoreCard,
  findings: FindingData[]
): {
  executiveSummary: ExecutiveSummary;
  roadmap: RoadmapItem[];
  kpiPlan: KpiTarget[];
  actionItems: ActionItem[];
  stakeholderSummary: string;
  devTaskList: { task: string; priority: "high" | "medium" | "low"; effort: string; details: string }[];
} {
  const domain = audit.domain;
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;

  // Executive summary
  const executiveSummary: ExecutiveSummary = {
    overview: `SEO audit of ${domain} reveals an overall health score of ${scorecard.overall}/100. The site was analyzed across ${crawlResults.length} pages, identifying ${findings.length} optimization opportunities.`,
    keyFindings: findings.slice(0, 5).map((f) => f.issue),
    topOpportunities: findings
      .filter((f) => f.severity === "critical" || f.severity === "high")
      .slice(0, 3)
      .map((f) => f.recommendedFix),
    riskAreas:
      criticalCount > 0
        ? [
            `${criticalCount} critical issues requiring immediate attention`,
            "Technical SEO foundation needs strengthening",
          ]
        : ["Limited risk areas identified"],
  };

  // Generate roadmap
  const roadmap: RoadmapItem[] = [];

  // 30-day items (critical + high priority)
  findings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5)
    .forEach((f) => {
      roadmap.push({
        phase: "30-day",
        task: f.issue,
        owner: f.owner,
        priority: f.severity === "critical" ? "high" : "medium",
        expectedImpact: f.impact,
      });
    });

  // 60-day items (medium priority)
  findings
    .filter((f) => f.severity === "medium")
    .slice(0, 5)
    .forEach((f) => {
      roadmap.push({
        phase: "60-day",
        task: f.issue,
        owner: f.owner,
        priority: "medium",
        expectedImpact: f.impact,
      });
    });

  // 90-day items (low priority + optimization)
  findings
    .filter((f) => f.severity === "low")
    .slice(0, 5)
    .forEach((f) => {
      roadmap.push({
        phase: "90-day",
        task: f.issue,
        owner: f.owner,
        priority: "low",
        expectedImpact: f.impact,
      });
    });

  // KPI Plan
  const kpiPlan: KpiTarget[] = [
    {
      metric: "Overall SEO Score",
      current: `${scorecard.overall}/100`,
      target30: `${Math.min(scorecard.overall + 15, 100)}/100`,
      target60: `${Math.min(scorecard.overall + 30, 100)}/100`,
      target90: `${Math.min(scorecard.overall + 40, 90)}/100`,
    },
    {
      metric: "Technical Health",
      current: `${scorecard.technical}/100`,
      target30: `${Math.min(scorecard.technical + 20, 100)}/100`,
      target60: `${Math.min(scorecard.technical + 30, 100)}/100`,
      target90: `${Math.min(scorecard.technical + 35, 95)}/100`,
    },
    {
      metric: "On-Page Optimization",
      current: `${scorecard.onPage}/100`,
      target30: `${Math.min(scorecard.onPage + 15, 100)}/100`,
      target60: `${Math.min(scorecard.onPage + 25, 100)}/100`,
      target90: `${Math.min(scorecard.onPage + 30, 95)}/100`,
    },
    {
      metric: "Content Quality",
      current: `${scorecard.content}/100`,
      target30: `${Math.min(scorecard.content + 10, 100)}/100`,
      target60: `${Math.min(scorecard.content + 20, 100)}/100`,
      target90: `${Math.min(scorecard.content + 30, 95)}/100`,
    },
  ];

  // Top 5 Actions
  const actionItems: ActionItem[] = findings.slice(0, 5).map((f, i) => ({
    rank: i + 1,
    action: f.issue,
    impact: f.impact,
    effort: f.effort,
    owner: f.owner,
  }));

  // Stakeholder summary
  const stakeholderSummary = `The SEO audit of ${domain} has identified ${findings.length} optimization opportunities across ${crawlResults.length} crawled pages. With an overall score of ${scorecard.overall}/100, ${criticalCount > 0 ? `there are ${criticalCount} critical issues requiring immediate attention` : "the site has a solid foundation with room for improvement"}. Priority should be given to addressing technical SEO issues and on-page optimization opportunities to improve search visibility.`;

  // Dev task list
  const devTaskList = findings
    .filter((f) => f.owner === "dev")
    .slice(0, 10)
    .map((f) => ({
      task: f.issue,
      priority: (f.severity === "critical" ? "high" : f.severity) as "high" | "medium" | "low",
      effort: f.effort,
      details: f.recommendedFix,
    }));

  return {
    executiveSummary,
    roadmap,
    kpiPlan,
    actionItems,
    stakeholderSummary,
    devTaskList,
  };
}
