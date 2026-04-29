import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
      include: { keywordData: true },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Get seed keywords from audit
    const seedKeywords = JSON.parse(audit.seedKeywords || "[]");

    // Generate keyword opportunities
    const opportunities = generateKeywordOpportunities(seedKeywords);

    // Store keyword data
    await Promise.all(
      opportunities.map((kw) =>
        prisma.keywordData.upsert({
          where: {
            userId_keyword_auditId: {
              userId: session.id,
              keyword: kw.keyword,
              auditId,
            },
          },
          create: {
            userId: session.id,
            auditId,
            keyword: kw.keyword,
            searchVolume: kw.searchVolume,
            difficulty: kw.difficulty,
            intent: kw.intent,
          },
          update: {
            searchVolume: kw.searchVolume,
            difficulty: kw.difficulty,
          },
        })
      )
    );

    return NextResponse.json({
      auditId,
      seedKeywords,
      opportunities: opportunities.sort((a, b) => b.opportunity - a.opportunity),
      analysis: {
        totalOpportunities: opportunities.length,
        highOpportunity: opportunities.filter((k) => k.opportunity > 70).length,
        mediumOpportunity: opportunities.filter((k) => k.opportunity > 40 && k.opportunity <= 70).length,
        lowOpportunity: opportunities.filter((k) => k.opportunity <= 40).length,
        avgVolume: Math.round(opportunities.reduce((sum, k) => sum + k.searchVolume, 0) / opportunities.length),
      },
      recommendations: [
        {
          title: "Target high-opportunity keywords",
          keywords: opportunities.filter((k) => k.opportunity > 70).slice(0, 5),
          reason: "Low difficulty, good search volume - quick ranking wins",
        },
        {
          title: "Build content clusters",
          clusters: generateTopicClusters(opportunities),
          reason: "Group related keywords to create comprehensive content",
        },
      ],
    });
  } catch (error) {
    console.error("Keyword analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze keywords" }, { status: 500 });
  }
}

function generateKeywordOpportunities(seedKeywords: string[]) {
  const opportunities = [];

  // Modifier patterns for keyword expansion
  const modifiers = [
    "best",
    "how to",
    "guide",
    "tips",
    "tutorial",
    "for beginners",
    "free",
    "tools",
    "software",
  ];

  for (const seed of seedKeywords) {
    // Base keyword
    opportunities.push({
      keyword: seed,
      searchVolume: Math.round(Math.random() * 5000 + 1000),
      difficulty: Math.round(Math.random() * 100),
      intent: "commercial",
      opportunity: 0,
    });

    // Long-tail variations
    for (const modifier of modifiers.slice(0, 3)) {
      const keyword = `${modifier} ${seed}`;
      const volume = Math.round(Math.random() * 1000 + 100);
      const difficulty = Math.round(Math.random() * 40 + 10);
      const opportunity = (volume / (difficulty + 1)) * 10;

      opportunities.push({
        keyword,
        searchVolume: volume,
        difficulty,
        intent: "informational",
        opportunity: Math.round(opportunity),
      });
    }
  }

  return opportunities;
}

function generateTopicClusters(keywords: any[]) {
  const clusters = [];
  const grouped: Record<string, any[]> = {};

  // Group by first word (simplistic clustering)
  for (const kw of keywords) {
    const firstWord = kw.keyword.split(" ")[0];
    if (!grouped[firstWord]) grouped[firstWord] = [];
    grouped[firstWord].push(kw);
  }

  // Create clusters
  for (const [topic, kwList] of Object.entries(grouped)) {
    if (kwList.length > 1) {
      clusters.push({
        topic,
        pillarKeyword: kwList.sort((a, b) => b.searchVolume - a.searchVolume)[0].keyword,
        relatedKeywords: kwList.slice(0, 5).map((k) => k.keyword),
        totalVolume: kwList.reduce((sum, k) => sum + k.searchVolume, 0),
      });
    }
  }

  return clusters;
}
