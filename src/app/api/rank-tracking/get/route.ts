import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get stored rank tracking data
    const rankData = audit.rankTrackingData
      ? JSON.parse(audit.rankTrackingData)
      : [];

    // Simulate GSC data + manual tracked keywords
    const mockGSCData = [
      {
        keyword: "seo audit tool",
        position: 8,
        impressions: 1240,
        clicks: 89,
        ctr: 7.2,
        trend: "up" as const,
        change: 2,
        source: "gsc" as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: "free seo audit",
        position: 12,
        impressions: 890,
        clicks: 45,
        ctr: 5.1,
        trend: "stable" as const,
        change: 0,
        source: "gsc" as const,
        lastUpdated: new Date().toISOString(),
      },
      {
        keyword: "website crawler free",
        position: 5,
        impressions: 2100,
        clicks: 567,
        ctr: 27,
        trend: "up" as const,
        change: 1,
        source: "gsc" as const,
        lastUpdated: new Date().toISOString(),
      },
    ];

    // Combine GSC + manual data
    const allKeywords = [...mockGSCData, ...rankData];

    return NextResponse.json({
      auditId,
      keywords: allKeywords,
      total: allKeywords.length,
      topThree: allKeywords.filter((k) => k.position <= 3).length,
    });
  } catch (error) {
    console.error("Failed to fetch rank data:", error);
    return NextResponse.json(
      { error: "Failed to fetch rank data" },
      { status: 500 }
    );
  }
}
