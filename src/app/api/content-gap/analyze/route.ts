import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeGaps } from "@/lib/content-gap/analyzer";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, competitorId } = await request.json();

    if (!propertyId || !competitorId) {
      return NextResponse.json(
        { error: "propertyId and competitorId required" },
        { status: 400 }
      );
    }

    // Verify user owns the property
    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get competitor data
    const competitor = await prisma.competitorData.findUnique({
      where: { id: competitorId },
    });

    if (!competitor || competitor.userId !== session.id) {
      return NextResponse.json(
        { error: "Competitor not found" },
        { status: 404 }
      );
    }

    // Get user's tracked keywords with latest positions
    const userKeywords = await prisma.rankKeyword.findMany({
      where: { propertyId, userId: session.id },
      include: {
        snapshots: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    // Build user keywords map: keyword -> position
    const yourKeywords = new Map<string, number>();
    for (const keyword of userKeywords) {
      const latestSnapshot = keyword.snapshots[0];
      if (latestSnapshot) {
        yourKeywords.set(keyword.keyword.toLowerCase(), latestSnapshot.position);
      }
    }

    // Parse competitor keywords from JSON
    let competitorKeywords = new Map<
      string,
      { rank: number; domain: string; difficulty?: number }
    >();

    try {
      const keywordData = JSON.parse(competitor.keywords || "[]");
      if (Array.isArray(keywordData)) {
        for (const kw of keywordData) {
          competitorKeywords.set(kw.keyword?.toLowerCase() || "", {
            rank: kw.position || kw.rank || 999,
            domain: competitor.competitorDomain,
            difficulty: kw.difficulty,
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse competitor keywords:", e);
    }

    if (competitorKeywords.size === 0) {
      return NextResponse.json({
        gaps: [],
        message: "No competitor keywords found",
      });
    }

    // Analyze gaps
    const gaps = analyzeGaps(yourKeywords, competitorKeywords);

    return NextResponse.json({
      competitorDomain: competitor.competitorDomain,
      totalGaps: gaps.length,
      gaps,
      breakdown: {
        easyWins: gaps.filter((g) => g.category === "easy_win").length,
        moderate: gaps.filter((g) => g.category === "moderate").length,
        competitive: gaps.filter((g) => g.category === "competitive").length,
        difficult: gaps.filter((g) => g.category === "difficult").length,
      },
    });
  } catch (error) {
    console.error("Failed to analyze content gaps:", error);
    return NextResponse.json(
      { error: "Failed to analyze content gaps" },
      { status: 500 }
    );
  }
}
