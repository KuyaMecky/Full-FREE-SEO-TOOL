import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId, competitors = [] } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: "auditId required" }, { status: 400 });
    }

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: { keywordData: true },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Parse competitor domains from audit or use provided
    const competitorDomains =
      competitors.length > 0
        ? competitors
        : JSON.parse(audit.competitors || "[]");

    // Generate gap analysis
    const gaps = findCompetitorGaps(
      audit.keywordData,
      competitorDomains,
      audit.domain
    );

    // Store competitor data
    await Promise.all(
      competitorDomains.map((domain) =>
        prisma.competitorData.upsert({
          where: {
            auditId_competitorDomain: {
              auditId,
              competitorDomain: domain,
            },
          },
          create: {
            auditId,
            userId: session.id,
            competitorDomain: domain,
            keywords: JSON.stringify(gaps.competitorKeywords[domain] || []),
            contentGaps: JSON.stringify(gaps.gaps.filter((g) => g.source === domain)),
            dominatingTopics: JSON.stringify(
              gaps.gaps
                .filter((g) => g.source === domain)
                .slice(0, 5)
                .map((g) => g.keyword)
            ),
          },
          update: {
            keywords: JSON.stringify(gaps.competitorKeywords[domain] || []),
            contentGaps: JSON.stringify(gaps.gaps.filter((g) => g.source === domain)),
          },
        })
      )
    );

    return NextResponse.json({
      auditId,
      domain: audit.domain,
      competitors: competitorDomains,
      gaps: gaps.gaps,
      analysis: {
        totalGaps: gaps.gaps.length,
        highPriority: gaps.gaps.filter((g) => g.opportunity > 70).length,
        mediumPriority: gaps.gaps.filter((g) => g.opportunity > 40 && g.opportunity <= 70)
          .length,
        lowPriority: gaps.gaps.filter((g) => g.opportunity <= 40).length,
      },
      topicClusters: generateTopicClusters(gaps.gaps),
      recommendations: {
        contentToCreate: gaps.gaps
          .filter((g) => g.opportunity > 60)
          .slice(0, 10)
          .map((g) => ({
            keyword: g.keyword,
            opportunity: g.opportunity,
            volume: g.volume,
            difficulty: g.difficulty,
            reason: `Competitors rank for this (${g.source}) but you don't`,
          })),
        strategicFocus: findStrategicFocus(gaps.gaps),
      },
    });
  } catch (error) {
    console.error("Competitor gap error:", error);
    return NextResponse.json(
      { error: "Failed to analyze competitor gaps" },
      { status: 500 }
    );
  }
}

function findCompetitorGaps(
  ownKeywords: any[],
  competitors: string[],
  domain: string
) {
  const ownKeywordSet = new Set(ownKeywords.map((k) => k.keyword.toLowerCase()));

  // Simulate competitor keywords (in real app, would crawl/analyze competitors)
  const competitorKeywords: Record<string, any[]> = {};
  const gaps: any[] = [];

  for (const competitor of competitors) {
    const competitorKws = generateCompetitorKeywords(competitor);
    competitorKeywords[competitor] = competitorKws;

    // Find gaps (they have, you don't)
    for (const kw of competitorKws) {
      if (!ownKeywordSet.has(kw.keyword.toLowerCase())) {
        gaps.push({
          keyword: kw.keyword,
          volume: kw.searchVolume,
          difficulty: kw.difficulty,
          opportunity: (kw.searchVolume / (kw.difficulty + 1)) * 10,
          source: competitor,
          reason: `${competitor} ranks for this`,
        });
      }
    }
  }

  // Sort by opportunity
  gaps.sort((a, b) => b.opportunity - a.opportunity);

  return { gaps: gaps.slice(0, 50), competitorKeywords };
}

function generateCompetitorKeywords(domain: string) {
  // Simulate competitor keyword analysis
  const baseKeywords = [
    "best seo tools",
    "seo software",
    "seo audit",
    "keyword research",
    "rank tracking",
    "competitor analysis",
    "seo checker",
    "website audit",
  ];

  return baseKeywords.map((kw) => ({
    keyword: kw,
    searchVolume: Math.round(Math.random() * 5000 + 500),
    difficulty: Math.round(Math.random() * 100),
  }));
}

function generateTopicClusters(gaps: any[]) {
  const clusters: Record<string, any> = {};

  for (const gap of gaps.slice(0, 20)) {
    const firstWord = gap.keyword.split(" ")[0].toLowerCase();
    if (!clusters[firstWord]) {
      clusters[firstWord] = {
        topic: firstWord,
        keywords: [],
        totalVolume: 0,
        avgDifficulty: 0,
      };
    }
    clusters[firstWord].keywords.push(gap.keyword);
    clusters[firstWord].totalVolume += gap.volume;
  }

  return Object.values(clusters)
    .sort((a: any, b: any) => b.totalVolume - a.totalVolume)
    .slice(0, 5);
}

function findStrategicFocus(gaps: any[]) {
  // Group by difficulty level
  const easy = gaps.filter((g) => g.difficulty < 30);
  const medium = gaps.filter((g) => g.difficulty >= 30 && g.difficulty < 60);
  const hard = gaps.filter((g) => g.difficulty >= 60);

  return {
    quickWins: easy.slice(0, 3).map((g) => ({
      keyword: g.keyword,
      reason: "Low difficulty, good volume - quick ranking wins",
    })),
    mediumTerm: medium.slice(0, 3).map((g) => ({
      keyword: g.keyword,
      reason: "Medium effort, good payoff - 4-8 week targets",
    })),
    longTerm: hard.slice(0, 3).map((g) => ({
      keyword: g.keyword,
      reason: "Higher difficulty - build authority first",
    })),
  };
}
