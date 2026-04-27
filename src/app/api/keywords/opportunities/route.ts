import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface KeywordData {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

interface KeywordOpportunity extends KeywordData {
  difficulty: number; // Estimated 0-100
  potential: "quick-win" | "medium" | "long-tail" | "high-volume";
  traffic_potential: number; // Est. traffic if rank #1
  recommendation: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID required" },
        { status: 400 }
      );
    }

    // Get audit to verify ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get GSC data from environment or stored config
    // For now, return mock data structure
    const opportunities: KeywordOpportunity[] = [];

    // Simulated GSC keywords (in production, fetch from Google Search Console)
    const sampleKeywords: KeywordData[] = [
      {
        keyword: "seo audit tool",
        position: 15,
        impressions: 340,
        clicks: 12,
        ctr: 3.5,
      },
      {
        keyword: "free seo audit",
        position: 22,
        impressions: 280,
        clicks: 5,
        ctr: 1.8,
      },
      {
        keyword: "website crawler",
        position: 8,
        impressions: 450,
        clicks: 82,
        ctr: 18.2,
      },
      {
        keyword: "seo technical audit",
        position: 35,
        impressions: 120,
        clicks: 0,
        ctr: 0,
      },
      {
        keyword: "page speed checker",
        position: 5,
        impressions: 890,
        clicks: 267,
        ctr: 30,
      },
    ];

    // Analyze keywords and identify opportunities
    for (const kw of sampleKeywords) {
      const difficulty = estimateDifficulty(kw.keyword);
      let potential: "quick-win" | "medium" | "long-tail" | "high-volume";
      let recommendation: string;

      // Quick wins: ranking 10-30, can move to top 3
      if (kw.position >= 10 && kw.position <= 30 && kw.impressions > 100) {
        potential = "quick-win";
        recommendation = `Optimize for this keyword - you're close! Content update could move this to top 3.`;
      }
      // High volume keywords with potential
      else if (kw.impressions > 500 && kw.position < 50) {
        potential = "high-volume";
        recommendation = `High visibility keyword - optimize to increase CTR.`;
      }
      // Long tail / low difficulty
      else if (kw.position > 30 && difficulty < 30) {
        potential = "long-tail";
        recommendation = `Low difficulty - can rank quickly with focused content.`;
      }
      // Medium opportunities
      else {
        potential = "medium";
        recommendation = `Build relevant content to capture this search intent.`;
      }

      // Calculate traffic potential (if ranked #1)
      const traffic_potential = Math.round(kw.impressions * (kw.ctr / 10) * 3);

      opportunities.push({
        ...kw,
        difficulty,
        potential,
        traffic_potential,
        recommendation,
      });
    }

    // Sort by opportunity score
    opportunities.sort((a, b) => {
      const scoreA = calculateOpportunityScore(a);
      const scoreB = calculateOpportunityScore(b);
      return scoreB - scoreA;
    });

    // Store opportunities for this audit
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        keywordOpportunities: JSON.stringify(opportunities),
      },
    });

    return NextResponse.json({
      auditId,
      total_keywords: sampleKeywords.length,
      quick_wins: opportunities.filter((o) => o.potential === "quick-win").length,
      opportunities,
      summary: {
        total_impressions: sampleKeywords.reduce((sum, k) => sum + k.impressions, 0),
        total_clicks: sampleKeywords.reduce((sum, k) => sum + k.clicks, 0),
        avg_position: (
          sampleKeywords.reduce((sum, k) => sum + k.position, 0) /
          sampleKeywords.length
        ).toFixed(1),
        potential_traffic: opportunities.reduce((sum, o) => sum + o.traffic_potential, 0),
      },
    });
  } catch (error) {
    console.error("Keyword analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze keywords" },
      { status: 500 }
    );
  }
}

// Estimate keyword difficulty 0-100 (free heuristic)
function estimateDifficulty(keyword: string): number {
  // Simple heuristic based on keyword characteristics
  const baseScore = 30;

  // Long-tail (3+ words) = lower difficulty
  const wordCount = keyword.split(" ").length;
  if (wordCount >= 3) return Math.max(baseScore - 15, 15);

  // Brand keywords = very low difficulty
  if (keyword.includes("free") || keyword.includes("best"))
    return Math.min(baseScore + 15, 100);

  return baseScore;
}

// Calculate opportunity score (0-100)
function calculateOpportunityScore(opp: KeywordOpportunity): number {
  let score = 0;

  // Quick win bonus
  if (opp.potential === "quick-win") score += 40;
  else if (opp.potential === "high-volume") score += 30;
  else if (opp.potential === "long-tail") score += 20;

  // Position score (closer to top = better)
  if (opp.position <= 10) score += 20;
  else if (opp.position <= 20) score += 15;
  else if (opp.position <= 30) score += 10;

  // Impressions score
  score += Math.min((opp.impressions / 1000) * 20, 20);

  // Difficulty score (lower is better)
  score += Math.max(20 - (opp.difficulty / 5), 0);

  return Math.min(score, 100);
}
