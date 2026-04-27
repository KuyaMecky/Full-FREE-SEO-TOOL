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
    const { auditId, keyword, position } = body;

    if (!auditId || !keyword || position === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Get existing rank data
    const rankData = audit.rankTrackingData
      ? JSON.parse(audit.rankTrackingData)
      : [];

    // Create new rank entry
    const newRank = {
      keyword,
      position,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      trend: "stable" as const,
      change: 0,
      source: "manual" as const,
      lastUpdated: new Date().toISOString(),
    };

    rankData.push(newRank);

    // Update audit with new rank data
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        rankTrackingData: JSON.stringify(rankData),
      },
    });

    return NextResponse.json({
      auditId,
      rankData: newRank,
    });
  } catch (error) {
    console.error("Failed to add rank data:", error);
    return NextResponse.json(
      { error: "Failed to add rank data" },
      { status: 500 }
    );
  }
}
