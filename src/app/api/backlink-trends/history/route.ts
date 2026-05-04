import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId required" },
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

    const snapshots = await prisma.backlinkSnapshot.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        uploadedAt: true,
        totalBacklinks: true,
        referringDomains: true,
        gainedCount: true,
        lostCount: true,
        topReferrers: true,
      },
    });

    // Build timeline data
    const timeline = snapshots.map((snapshot) => ({
      id: snapshot.id,
      date: snapshot.date,
      uploadedAt: snapshot.uploadedAt,
      totalBacklinks: snapshot.totalBacklinks || 0,
      referringDomains: snapshot.referringDomains || 0,
      gainedCount: snapshot.gainedCount || 0,
      lostCount: snapshot.lostCount || 0,
      topReferrers: snapshot.topReferrers
        ? JSON.parse(snapshot.topReferrers)
        : [],
    }));

    // Calculate trends
    const trends = {
      totalBacklinks: timeline.length > 0 ? timeline[0].totalBacklinks : 0,
      previousTotal:
        timeline.length > 1 ? timeline[1].totalBacklinks : null,
      totalChange:
        timeline.length > 1
          ? timeline[0].totalBacklinks - timeline[1].totalBacklinks
          : null,
      recentGained: timeline.length > 0 ? timeline[0].gainedCount : 0,
      recentLost: timeline.length > 0 ? timeline[0].lostCount : 0,
      referringDomains:
        timeline.length > 0 ? timeline[0].referringDomains : 0,
    };

    return NextResponse.json({
      propertyId,
      timeline,
      trends,
      totalSnapshots: snapshots.length,
    });
  } catch (error) {
    console.error("Failed to fetch backlink history:", error);
    return NextResponse.json(
      { error: "Failed to fetch backlink history" },
      { status: 500 }
    );
  }
}
