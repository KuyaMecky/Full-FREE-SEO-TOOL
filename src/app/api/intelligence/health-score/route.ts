import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId } = await request.json();

    if (!auditId) {
      return NextResponse.json(
        { error: "auditId required" },
        { status: 400 }
      );
    }

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        findings: true,
        contentPerformance: true,
        issueImpactScores: true,
      },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Calculate health score
    const healthScore = calculateHealthScore(audit);

    // Store health score record
    const stored = await prisma.sEOHealthScore.create({
      data: {
        auditId,
        userId: session.id,
        overallScore: healthScore.overall,
        issueScore: healthScore.issueScore,
        contentScore: healthScore.contentScore,
        technicalScore: healthScore.technicalScore,
        performanceScore: healthScore.performanceScore,
        keywordScore: healthScore.keywordScore,
        issueCount: healthScore.issueCount,
        criticalIssues: healthScore.criticalIssues,
        highIssues: healthScore.highIssues,
        mediumIssues: healthScore.mediumIssues,
        estimatedTrafficLoss: healthScore.estimatedTrafficLoss,
        estimatedFixes: healthScore.estimatedFixes,
        quickWinsAvailable: healthScore.quickWins,
        averageFixTime: healthScore.avgFixTime,
        reasoning: healthScore.reasoning,
        recordedAt: new Date(),
      },
    });

    return NextResponse.json({
      score: stored.overallScore,
      breakdown: {
        issues: stored.issueScore,
        content: stored.contentScore,
        technical: stored.technicalScore,
        performance: stored.performanceScore,
        keywords: stored.keywordScore,
      },
      metrics: {
        totalIssues: stored.issueCount,
        critical: stored.criticalIssues,
        high: stored.highIssues,
        medium: stored.mediumIssues,
        estimatedTrafficLoss: stored.estimatedTrafficLoss,
        estimatedTrafficRecovery: stored.estimatedFixes,
        quickWinsCount: stored.quickWinsAvailable,
        avgTimeToFix: stored.averageFixTime,
      },
      analysis: stored.reasoning,
    });
  } catch (error) {
    console.error("Health score error:", error);
    return NextResponse.json(
      { error: "Failed to calculate health score" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get("auditId");

    if (!auditId) {
      return NextResponse.json(
        { error: "auditId required" },
        { status: 400 }
      );
    }

    // Get latest health score
    const latestScore = await prisma.sEOHealthScore.findFirst({
      where: {
        auditId,
        userId: session.id,
      },
      orderBy: { recordedAt: "desc" },
    });

    if (!latestScore) {
      return NextResponse.json(
        { error: "No health score found" },
        { status: 404 }
      );
    }

    // Get health score history (last 10)
    const history = await prisma.sEOHealthScore.findMany({
      where: {
        auditId,
        userId: session.id,
      },
      orderBy: { recordedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      current: {
        score: latestScore.overallScore,
        breakdown: {
          issues: latestScore.issueScore,
          content: latestScore.contentScore,
          technical: latestScore.technicalScore,
          performance: latestScore.performanceScore,
          keywords: latestScore.keywordScore,
        },
        metrics: {
          totalIssues: latestScore.issueCount,
          estimatedTrafficLoss: latestScore.estimatedTrafficLoss,
          estimatedRecovery: latestScore.estimatedFixes,
          quickWins: latestScore.quickWinsAvailable,
        },
      },
      history: history.map((h) => ({
        score: h.overallScore,
        date: h.recordedAt,
        issues: h.issueCount,
        traffic: h.estimatedTrafficLoss,
      })),
    });
  } catch (error) {
    console.error("Get health score error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve health score" },
      { status: 500 }
    );
  }
}

interface HealthScoreResult {
  overall: number;
  issueScore: number;
  contentScore: number;
  technicalScore: number;
  performanceScore: number;
  keywordScore: number;
  issueCount: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  estimatedTrafficLoss: number;
  estimatedFixes: number;
  quickWins: number;
  avgFixTime: number;
  reasoning: string;
}

function calculateHealthScore(audit: any): HealthScoreResult {
  const findings = audit.findings || [];
  const contentPerformance = audit.contentPerformance || [];
  const impactScores = audit.issueImpactScores || [];

  // Count issues by severity
  const criticalIssues = findings.filter(
    (f: any) => f.severity === "critical"
  ).length;
  const highIssues = findings.filter((f: any) => f.severity === "high").length;
  const mediumIssues = findings.filter(
    (f: any) => f.severity === "medium"
  ).length;
  const issueCount = findings.length;

  // Calculate issue score (100 if no issues, 0 if many critical)
  const issueScore = Math.max(
    0,
    100 - criticalIssues * 10 - highIssues * 5 - mediumIssues * 2
  );

  // Calculate content score (based on word count and readability)
  const optimalContent = contentPerformance.filter(
    (cp: any) => cp.contentLength >= 1000 && cp.contentLength <= 3000
  ).length;
  const totalPages = contentPerformance.length;
  const contentScore =
    totalPages > 0
      ? (optimalContent / totalPages) * 100
      : 50;

  // Calculate technical score (100 minus penalty for critical/high issues)
  const technicalScore = Math.max(0, 100 - criticalIssues * 15 - highIssues * 8);

  // Calculate performance score (from CWV metrics or default)
  const performanceScore = 75; // Placeholder - would use actual Core Web Vitals

  // Calculate keyword score (based on keyword rankings)
  const keywordScore = 65; // Placeholder - would use rank tracker data

  // Calculate weighted overall score
  const overall =
    issueScore * 0.3 +
    contentScore * 0.2 +
    technicalScore * 0.25 +
    performanceScore * 0.15 +
    keywordScore * 0.1;

  // Estimate traffic loss and recovery potential
  const estimatedTrafficLoss = impactScores.reduce(
    (sum: number, score: any) => sum + (score.estimatedTraffic || 0),
    0
  );

  // Quick wins are issues with high priority but low complexity
  const quickWins = impactScores.filter(
    (score: any) => score.priorityScore > 7 && score.fixComplexity < 5
  ).length;

  // Average fix time in hours
  const avgFixTime = impactScores.length
    ? Math.round(
        impactScores.reduce(
          (sum: number, score: any) =>
            sum + (score.fixComplexity * 2),
          0
        ) / impactScores.length
      )
    : 0;

  // Estimated recovery is 60% of traffic loss (conservative estimate)
  const estimatedFixes = Math.round(estimatedTrafficLoss * 0.6);

  // Generate reasoning
  const reasoning = generateReasoning({
    overall: Math.round(overall),
    issueCount,
    criticalIssues,
    highIssues,
    estimatedTrafficLoss,
    quickWins,
  });

  return {
    overall: Math.round(overall),
    issueScore: Math.round(issueScore),
    contentScore: Math.round(contentScore),
    technicalScore: Math.round(technicalScore),
    performanceScore: Math.round(performanceScore),
    keywordScore: Math.round(keywordScore),
    issueCount,
    criticalIssues,
    highIssues,
    mediumIssues,
    estimatedTrafficLoss,
    estimatedFixes,
    quickWins,
    avgFixTime,
    reasoning,
  };
}

function generateReasoning(metrics: {
  overall: number;
  issueCount: number;
  criticalIssues: number;
  highIssues: number;
  estimatedTrafficLoss: number;
  quickWins: number;
}): string {
  const { overall, issueCount, criticalIssues, estimatedTrafficLoss, quickWins } =
    metrics;

  let reasoning = `Your SEO health score is ${overall}/100. `;

  if (overall >= 80) {
    reasoning += "Your site is in excellent condition. ";
  } else if (overall >= 60) {
    reasoning += "Your site has some issues but is generally healthy. ";
  } else {
    reasoning += "Your site needs significant improvements. ";
  }

  reasoning += `You have ${issueCount} issues found, including ${criticalIssues} critical issues. `;
  reasoning += `These issues are estimated to cost you ${estimatedTrafficLoss} clicks/month. `;
  reasoning += `There are ${quickWins} quick wins available that can be fixed in 1-2 weeks for maximum impact.`;

  return reasoning;
}
