import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseBacklinkCSV, compareBacklinks, getBacklinkMetrics } from "@/lib/backlink-trends/analyzer";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const propertyId = formData.get("propertyId") as string;

    if (!file || !propertyId) {
      return NextResponse.json(
        { error: "File and propertyId required" },
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

    const csvContent = await file.text();
    const records = parseBacklinkCSV(csvContent);

    if (records.length === 0) {
      return NextResponse.json(
        { error: "No valid backlink records found in CSV" },
        { status: 400 }
      );
    }

    // Get previous snapshot for comparison
    const previousSnapshot = await prisma.backlinkSnapshot.findFirst({
      where: { propertyId },
      orderBy: { date: "desc" },
      take: 1,
    });

    const uploadDate = new Date();
    const comparison = previousSnapshot
      ? compareBacklinks(
          JSON.parse(previousSnapshot.records || "[]"),
          records
        )
      : { gained: records, lost: [], maintained: [], changed: [] };

    const metrics = getBacklinkMetrics(records);

    // Store new snapshot
    const newSnapshot = await prisma.backlinkSnapshot.create({
      data: {
        propertyId,
        date: uploadDate,
        uploadedAt: uploadDate,
        records: JSON.stringify(records),
        totalBacklinks: metrics.totalBacklinks,
        referringDomains: metrics.referringDomains,
        topReferrers: JSON.stringify(metrics.topReferrers),
        gainedCount: comparison.gained.length,
        lostCount: comparison.lost.length,
      },
    });

    return NextResponse.json({
      success: true,
      snapshot: {
        id: newSnapshot.id,
        date: newSnapshot.date,
        metrics,
        comparison: {
          gained: comparison.gained.length,
          lost: comparison.lost.length,
          maintained: comparison.maintained.length,
          changed: comparison.changed.length,
        },
      },
    });
  } catch (error) {
    console.error("Failed to upload backlinks:", error);
    return NextResponse.json(
      { error: "Failed to upload backlinks" },
      { status: 500 }
    );
  }
}
