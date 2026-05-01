import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  let auditId: string;

  try {
    const body = await request.json();
    auditId = body.auditId;

    if (!auditId) {
      return NextResponse.json({ error: "Audit ID is required" }, { status: 400 });
    }

    console.log(`[${auditId}] Starting analysis`);

    // Get audit with crawl results
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { crawlResults: true },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (audit.crawlResults.length === 0) {
      throw new Error("No crawl results found");
    }

    console.log(`[${auditId}] Found ${audit.crawlResults.length} crawl results`);

    // Parse crawl results
    const crawlResults = audit.crawlResults.map((result) => ({
      ...result,
      issues: JSON.parse(result.issues || "[]"),
      headings: JSON.parse(result.headings || "[]"),
      links: JSON.parse(result.links || "[]"),
      images: JSON.parse(result.images || "[]"),
    }));

    // Calculate simple score (0-100)
    const score = calculateScore(crawlResults);

    console.log(`[${auditId}] Calculated score: ${score}`);

    // Generate findings from issues
    const findings = generateFindings(crawlResults);

    console.log(`[${auditId}] Generated ${findings.length} findings`);

    // Save findings to database
    for (const finding of findings) {
      await prisma.finding.create({
        data: {
          auditId,
          category: finding.category,
          issue: finding.issue,
          evidence: finding.evidence || "",
          affectedUrls: JSON.stringify(finding.affectedUrls || []),
          severity: finding.severity,
          impact: finding.impact,
          recommendedFix: finding.recommendedFix,
          owner: "dev",
          effort: finding.effort,
          priority: finding.priority,
        },
      });
    }

    // Generate simple report
    const report = generateReport(audit, crawlResults, findings, score);

    // Save report
    await prisma.auditReport.create({
      data: {
        auditId,
        executiveSummary: JSON.stringify(report.executiveSummary),
        scorecard: JSON.stringify({ overall: score }),
        roadmap: JSON.stringify(report.roadmap),
        kpiPlan: JSON.stringify(report.kpiPlan),
        actionItems: JSON.stringify(report.actionItems),
        stakeholderSummary: report.stakeholderSummary,
        devTaskList: JSON.stringify(report.devTaskList),
      },
    });

    // Update audit with final score
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "complete",
        overallScore: score,
      },
    });

    console.log(`[${auditId}] Analysis complete!`);

    return NextResponse.json({
      success: true,
      score,
      findingsCount: findings.length,
    });
  } catch (error) {
    console.error(`[${auditId}] Analysis error:`, error);

    if (auditId) {
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Analysis failed",
        },
      }).catch(() => {});
    }

    return NextResponse.json(
      { error: "Analysis failed", details: error instanceof Error ? error.message : "" },
      { status: 500 }
    );
  }
}

function calculateScore(crawlResults: any[]): number {
  let score = 100;

  for (const result of crawlResults) {
    const issues = result.issues || [];
    for (const issue of issues) {
      if (issue.severity === "critical") score -= 10;
      else if (issue.severity === "high") score -= 5;
      else if (issue.severity === "medium") score -= 2;
      else if (issue.severity === "low") score -= 1;
    }
  }

  return Math.max(0, Math.min(100, score));
}

function generateFindings(crawlResults: any[]) {
  const findings: any[] = [];
  const seenIssues = new Set<string>();

  for (const result of crawlResults) {
    const issues = result.issues || [];

    for (const issue of issues) {
      const key = `${issue.type}`;

      if (!seenIssues.has(key)) {
        seenIssues.add(key);

        const severityMap: any = {
          critical: { impact: "High", effort: "Medium" },
          high: { impact: "Medium", effort: "Medium" },
          medium: { impact: "Low", effort: "Low" },
          low: { impact: "Low", effort: "Low" },
        };

        const meta = severityMap[issue.severity] || { impact: "Low", effort: "Low" };

        findings.push({
          category: getCategory(issue.type),
          issue: getIssueTitle(issue.type),
          evidence: `Found on ${getAffectedPages(crawlResults, issue.type).length} pages`,
          affectedUrls: getAffectedPages(crawlResults, issue.type),
          severity: issue.severity,
          impact: meta.impact,
          recommendedFix: getRecommendedFix(issue.type),
          priority: getPriority(issue.severity),
        });
      }
    }
  }

  return findings;
}

function generateReport(audit: any, crawlResults: any[], findings: any[], score: number) {
  const domain = audit.domain;
  const totalPages = crawlResults.length;

  return {
    executiveSummary: {
      overview: `SEO audit of ${domain} reveals a score of ${score}/100 across ${totalPages} pages.`,
      keyFindings: findings.slice(0, 5).map((f) => f.issue),
      topOpportunities: findings
        .filter((f) => f.severity === "critical" || f.severity === "high")
        .slice(0, 3)
        .map((f) => f.recommendedFix),
      riskAreas: findings.length > 5 ? [`${findings.length} issues found`] : ["Site is in good condition"],
    },
    roadmap: [
      {
        phase: "Immediate",
        task: "Fix critical issues",
        priority: "high",
        expectedImpact: "Improve rankings",
      },
      {
        phase: "Week 1-2",
        task: "Resolve high-priority items",
        priority: "high",
        expectedImpact: "Better crawlability",
      },
      {
        phase: "Month 1",
        task: "Address medium-priority issues",
        priority: "medium",
        expectedImpact: "Improved UX",
      },
    ],
    kpiPlan: [
      {
        metric: "SEO Score",
        current: `${score}/100`,
        target30: `${Math.min(score + 15, 100)}/100`,
        target60: `${Math.min(score + 30, 100)}/100`,
        target90: `${Math.min(score + 40, 100)}/100`,
      },
    ],
    actionItems: findings.slice(0, 5).map((f, i) => ({
      rank: i + 1,
      action: f.issue,
      impact: f.impact,
      effort: f.effort,
      owner: "dev",
    })),
    stakeholderSummary: `The audit identified ${findings.length} optimization opportunities. Priority should be given to critical issues for immediate improvement.`,
    devTaskList: findings
      .filter((f) => f.severity === "critical" || f.severity === "high")
      .slice(0, 5)
      .map((f) => ({
        task: f.issue,
        priority: f.severity === "critical" ? "high" : "medium",
        effort: f.effort,
        details: f.recommendedFix,
      })),
  };
}

function getCategory(issueType: string): string {
  if (issueType.includes("title") || issueType.includes("description")) return "Meta Tags";
  if (issueType.includes("h1") || issueType.includes("heading")) return "Structure";
  if (issueType.includes("alt")) return "Images";
  if (issueType.includes("canonical")) return "Technical";
  if (issueType.includes("https")) return "Security";
  return "SEO";
}

function getIssueTitle(issueType: string): string {
  const titles: any = {
    missing_title: "Missing page title",
    short_title: "Title too short",
    long_title: "Title too long",
    missing_meta_description: "Missing meta description",
    short_meta_description: "Meta description too short",
    long_meta_description: "Meta description too long",
    missing_h1: "Missing H1 tag",
    multiple_h1: "Multiple H1 tags",
    missing_alt_text: "Missing image alt text",
    missing_canonical: "Missing canonical tag",
    not_https: "Not using HTTPS",
  };
  return titles[issueType] || "SEO issue";
}

function getRecommendedFix(issueType: string): string {
  const fixes: any = {
    missing_title: "Add a descriptive title tag (30-60 characters)",
    short_title: "Expand title to 30-60 characters",
    long_title: "Shorten title to under 60 characters",
    missing_meta_description: "Add meta description (50-160 characters)",
    short_meta_description: "Expand meta description to 50+ characters",
    long_meta_description: "Shorten meta description to under 160 characters",
    missing_h1: "Add one H1 tag per page",
    multiple_h1: "Keep only one H1 tag per page",
    missing_alt_text: "Add descriptive alt text to all images",
    missing_canonical: "Add canonical tag to avoid duplicate content",
    not_https: "Enable HTTPS/SSL for your domain",
  };
  return fixes[issueType] || "Review and fix this issue";
}

function getPriority(severity: string): number {
  const priorities: any = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };
  return priorities[severity] || 5;
}

function getAffectedPages(crawlResults: any[], issueType: string): string[] {
  return crawlResults
    .filter((r) => (r.issues || []).some((i: any) => i.type === issueType))
    .map((r) => r.url)
    .slice(0, 5);
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
