import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  calculateIssueImpact,
  generateRecommendation,
  findQuickWins,
  analyzeContentPerformance,
} from "@/lib/seo-intelligence";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId } = await request.json();

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        findings: true,
        crawlResults: true,
        recommendations: true,
      },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Calculate impact scores for each finding
    const findingsWithImpact = audit.findings.map((finding) => {
      const impact = calculateIssueImpact(
        finding.category,
        finding.affectedUrls ? JSON.parse(finding.affectedUrls).length : 1,
        finding.severity as "critical" | "high" | "medium" | "low"
      );

      return {
        ...finding,
        impact,
      };
    });

    // Sort by priority
    findingsWithImpact.sort((a, b) => b.impact.priority - a.impact.priority);

    // Find quick wins
    const quickWins = findQuickWins(
      audit.findings.map((f) => ({
        type: f.category,
        affectedPages: f.affectedUrls ? JSON.parse(f.affectedUrls).length : 1,
        severity: f.severity as "critical" | "high" | "medium" | "low",
      }))
    );

    // Generate recommendations for top findings
    const recommendations = await Promise.all(
      findingsWithImpact.slice(0, 10).map(async (finding) => {
        const rec = generateRecommendation(
          finding.category,
          finding.affectedUrls ? JSON.parse(finding.affectedUrls).length : 1,
          finding.impact
        );

        // Check if recommendation already exists
        const existing = await prisma.sEORecommendation.findFirst({
          where: {
            auditId,
            findingId: finding.id,
          },
        });

        if (existing) {
          return existing;
        }

        // Create new recommendation
        return await prisma.sEORecommendation.create({
          data: {
            auditId,
            findingId: finding.id,
            category: finding.category,
            title: rec.title,
            description: rec.description,
            actionPlan: rec.actionPlan,
            estimatedImpact: rec.estimatedImpact,
            impactMetric: rec.impactMetric,
            timeInvestment: rec.timeInvestment,
            priority: finding.impact.priority,
            relatedKeywords: JSON.stringify([]), // Will be filled by keyword analysis
          },
        });
      })
    );

    // Analyze content performance
    const contentAnalysis = analyzeContentPerformance(
      auditId,
      audit.crawlResults.map((cr) => ({
        url: cr.url,
        title: cr.title,
        contentLength: cr.contentLength,
      }))
    );

    // Create content performance records
    await Promise.all(
      contentAnalysis.map((content) =>
        prisma.contentPerformance.upsert({
          where: { auditId_url: { auditId, url: content.url } },
          create: {
            auditId,
            userId: session.id,
            url: content.url,
            title: content.title,
            contentLength: content.contentLength,
            readabilityScore: content.readabilityScore,
            recommendations: JSON.stringify(content.recommendations),
            performanceScore: content.performanceScore,
          },
          update: {
            title: content.title,
            contentLength: content.contentLength,
            readabilityScore: content.readabilityScore,
            recommendations: JSON.stringify(content.recommendations),
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalFindings: audit.findings.length,
        criticalIssues: audit.findings.filter((f) => f.severity === "critical").length,
        quickWins: quickWins.length,
        estimatedTrafficRecovery: quickWins.reduce((sum, win) => sum + win.estimatedTraffic, 0),
        timeToImplement: `${quickWins.reduce((sum, win) => sum + (win.fixComplexity * 0.5), 0)} hours for quick wins`,
      },
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        category: rec.category,
        priority: rec.priority,
        estimatedImpact: rec.estimatedImpact,
        impactMetric: rec.impactMetric,
        timeInvestment: rec.timeInvestment,
        actionPlan: rec.actionPlan,
      })),
      quickWins: quickWins.map((win) => ({
        type: win.type,
        priority: win.priority,
        affectedPages: win.affectedPages,
        estimatedImpact: `+${win.estimatedTraffic} clicks/month`,
        timeRequired: `${Math.round(win.fixComplexity * 0.5)} hours`,
      })),
      contentInsights: {
        analyzed: contentAnalysis.length,
        avgReadabilityScore: Math.round(
          contentAnalysis.reduce((sum, c) => sum + c.readabilityScore, 0) / contentAnalysis.length
        ),
        avgWordCount: Math.round(
          contentAnalysis.reduce((sum, c) => sum + c.contentLength, 0) / contentAnalysis.length
        ),
        needsExpansion: contentAnalysis.filter((c) => c.contentLength < 300).length,
      },
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
