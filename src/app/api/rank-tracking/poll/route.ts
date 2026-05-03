import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchAnalyticsQuery } from "@/lib/gsc/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }

    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
      include: { googleAccount: true },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!property.googleAccount?.accessToken) {
      return NextResponse.json({ error: "Google not connected" }, { status: 400 });
    }

    // Get all tracked keywords for this property
    const trackedKeywords = await prisma.rankKeyword.findMany({
      where: { propertyId },
    });

    if (trackedKeywords.length === 0) {
      return NextResponse.json({ message: "No keywords to track", updates: 0 });
    }

    // Poll GSC for ranking data
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const gscData = await searchAnalyticsQuery(
      property.googleAccount.accessToken,
      property.siteUrl,
      {
        startDate: yesterday.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        dimensions: ["query"],
        rowLimit: 10000,
      }
    );

    const rows = gscData.rows || [];
    let updateCount = 0;

    // Save snapshots for tracked keywords
    for (const trackedKeyword of trackedKeywords) {
      const row = rows.find((r: any) => r.keys?.[0]?.toLowerCase() === trackedKeyword.keyword.toLowerCase());

      if (row) {
        await prisma.rankSnapshot.create({
          data: {
            keywordId: trackedKeyword.id,
            date: today,
            position: Math.round(row.position || 0),
            impressions: row.impressions || 0,
            clicks: row.clicks || 0,
            ctr: row.ctr || 0,
          },
        });
        updateCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updateCount} keywords`,
      updates: updateCount,
    });
  } catch (error) {
    console.error("Failed to poll rankings:", error);
    return NextResponse.json({ error: "Failed to poll rankings" }, { status: 500 });
  }
}
