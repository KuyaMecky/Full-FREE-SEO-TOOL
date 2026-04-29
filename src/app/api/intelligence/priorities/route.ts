import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateIssueImpact } from "@/lib/seo-intelligence";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const auditId = searchParams.get("auditId");

    if (!auditId) {
      return NextResponse.json({ error: "auditId required" }, { status: 400 });
    }

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        findings: true,
        issueImpactScores: true,
        recommendations: {
          orderBy: { priority: "desc" },
          take: 5,
        },
      },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Calculate impact scores for all findings
    const prioritizedIssues = audit.findings
      .map((finding) => {
        const impact = calculateIssueImpact(
          finding.category,
          finding.affectedUrls ? JSON.parse(finding.affectedUrls).length : 1,
          finding.severity as "critical" | "high" | "medium" | "low"
        );

        return {
          id: finding.id,
          type: finding.category,
          severity: finding.severity,
          affectedUrls: finding.affectedUrls ? JSON.parse(finding.affectedUrls) : [],
          affectedPages: finding.affectedUrls ? JSON.parse(finding.affectedUrls).length : 1,
          description: finding.issue,
          evidence: finding.evidence,
          ...impact,
          trafficRisk: impact.estimatedTraffic > 50 ? "high" : impact.estimatedTraffic > 10 ? "medium" : "low",
        };
      })
      .sort((a, b) => b.priority - a.priority);

    // Categorize by severity and impact
    const bySeverity = {
      critical: prioritizedIssues.filter((i) => i.severity === "critical"),
      high: prioritizedIssues.filter((i) => i.severity === "high"),
      medium: prioritizedIssues.filter((i) => i.severity === "medium"),
      low: prioritizedIssues.filter((i) => i.severity === "low"),
    };

    // Quick wins: high impact, low complexity
    const quickWins = prioritizedIssues
      .filter((i) => i.priority >= 7 && i.fixComplexity <= 3)
      .slice(0, 5);

    // Strategic priorities: high impact, medium complexity
    const strategic = prioritizedIssues
      .filter((i) => i.priority >= 6 && i.fixComplexity > 3 && i.fixComplexity <= 7)
      .slice(0, 5);

    // Calculate totals
    const totalTrafficRisk = prioritizedIssues.reduce((sum, i) => sum + i.estimatedTraffic, 0);
    const totalFixTime = Math.round(
      prioritizedIssues.reduce((sum, i) => sum + i.fixComplexity * 0.5, 0)
    );

    // ROI calculation: focus on quick wins first
    const roiData = {
      immediateOpportunity: quickWins.reduce((sum, i) => sum + i.estimatedTraffic, 0),
      immediateTimeRequired: Math.round(quickWins.reduce((sum, i) => sum + i.fixComplexity * 0.5, 0)),
      strategicOpportunity: strategic.reduce((sum, i) => sum + i.estimatedTraffic, 0),
      strategicTimeRequired: Math.round(strategic.reduce((sum, i) => sum + i.fixComplexity * 0.5, 0)),
    };

    return NextResponse.json({
      auditId,
      totalIssues: prioritizedIssues.length,
      totalTrafficRisk,
      totalFixTime,
      prioritizedIssues: prioritizedIssues.slice(0, 20),
      bySeverity,
      quickWins,
      strategic,
      roiAnalysis: {
        phase1: {
          focus: "Quick Wins",
          issues: quickWins.length,
          estimatedImpact: `+${roiData.immediateOpportunity} clicks/month`,
          timeRequired: `${roiData.immediateTimeRequired} hours`,
          roi: Math.round((roiData.immediateOpportunity / Math.max(roiData.immediateTimeRequired, 1)) * 100) / 100,
        },
        phase2: {
          focus: "Strategic Improvements",
          issues: strategic.length,
          estimatedImpact: `+${roiData.strategicOpportunity} clicks/month`,
          timeRequired: `${roiData.strategicTimeRequired} hours`,
          roi: Math.round((roiData.strategicOpportunity / Math.max(roiData.strategicTimeRequired, 1)) * 100) / 100,
        },
        phase3: {
          focus: "Long-term Optimization",
          issues: prioritizedIssues.filter((i) => i.priority < 6).length,
          estimatedImpact: `+${Math.round(totalTrafficRisk - roiData.immediateOpportunity - roiData.strategicOpportunity)} clicks/month`,
          timeRequired: `${totalFixTime - roiData.immediateTimeRequired - roiData.strategicTimeRequired} hours`,
        },
      },
      recommendations: audit.recommendations.map((r) => ({
        id: r.id,
        title: r.title,
        priority: r.priority,
        estimatedImpact: r.estimatedImpact,
        impactMetric: r.impactMetric,
        timeInvestment: r.timeInvestment,
      })),
    });
  } catch (error) {
    console.error("Priority analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze priorities" },
      { status: 500 }
    );
  }
}
