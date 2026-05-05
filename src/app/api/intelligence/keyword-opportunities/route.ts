import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }

    const property = await prisma.gscProperty.findFirst({
      where: { id: propertyId, userId: session.id },
      include: {
        snapshots: {
          orderBy: { fetchedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (!property.snapshots.length) {
      return NextResponse.json({
        property: property.siteUrl,
        quickWins: [],
        topOpportunities: [],
        gainingMomentum: [],
        recommendations: [],
      });
    }

    const snapshot = property.snapshots[0];
    let byQuery = [];
    try {
      byQuery = JSON.parse(snapshot.byQuery || "[]");
    } catch (e) {
      console.error("Failed to parse byQuery:", e);
    }

    // Classify keywords by opportunity type
    const strikingDistance = byQuery.filter(
      (q: any) => q.position >= 4 && q.position <= 20 && q.impressions >= 50
    );
    const topOpportunities = byQuery.filter(
      (q: any) => q.position > 20 && q.position <= 50 && q.impressions >= 100
    );
    const gainingMomentum = byQuery
      .filter((q: any) => q.clicks >= q.impressions * 0.05)
      .slice(0, 10);

    const topQueries = byQuery.sort((a: any, b: any) => b.impressions - a.impressions).slice(0, 20);

    // Calculate opportunity scores
    const scoredOpportunities = strikingDistance.map((q: any) => ({
      ...q,
      opportunityScore: q.impressions * (21 - q.position),
      effortLevel: q.position <= 10 ? "low" : "medium",
      estimatedTrafficGain: Math.round(q.impressions * (q.position >= 10 ? 0.3 : 0.2)),
    }));

    const recommendations = [
      {
        type: "quick_wins",
        count: strikingDistance.length,
        description: "Keywords in positions 4-20 with 50+ monthly impressions",
        action: "Target these keywords with improved content to reach top 3",
      },
      {
        type: "high_volume",
        count: topQueries.length,
        description: "Top performing keywords by search volume",
        action: "Analyze competitors and create comprehensive content",
      },
      {
        type: "momentum",
        count: gainingMomentum.length,
        description: "Keywords with good CTR showing positive trends",
        action: "Double down on these keywords with fresh content",
      },
    ];

    return NextResponse.json({
      property: property.siteUrl,
      lastUpdated: snapshot.fetchedAt,
      stats: {
        totalQueries: byQuery.length,
        top10Count: byQuery.filter((q: any) => q.position <= 10).length,
        top20Count: byQuery.filter((q: any) => q.position <= 20).length,
        avgPosition: (byQuery.reduce((sum: number, q: any) => sum + q.position, 0) / byQuery.length).toFixed(1),
        totalImpressions: byQuery.reduce((sum: number, q: any) => sum + q.impressions, 0),
        totalClicks: byQuery.reduce((sum: number, q: any) => sum + q.clicks, 0),
      },
      quickWins: scoredOpportunities.slice(0, 15),
      topOpportunities: topOpportunities.slice(0, 10),
      gainingMomentum: gainingMomentum,
      topQueries: topQueries,
      recommendations,
    });
  } catch (error) {
    console.error("Keyword opportunities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}
