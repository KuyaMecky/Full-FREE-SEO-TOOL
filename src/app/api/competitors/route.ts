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

    // Get all audits for this property to find competitors
    const audits = await prisma.auditResult.findMany({
      where: { propertyId },
      select: { id: true },
    });

    const auditIds = audits.map((a) => a.id);

    // Get unique competitors from all audits
    const competitors = await prisma.competitorData.findMany({
      where: {
        auditId: { in: auditIds },
        userId: session.id,
      },
      select: {
        id: true,
        competitorDomain: true,
        keywords: true,
        estimatedTraffic: true,
        backlinks: true,
      },
      orderBy: { competitorDomain: "asc" },
    });

    return NextResponse.json({ competitors });
  } catch (error) {
    console.error("Failed to fetch competitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch competitors" },
      { status: 500 }
    );
  }
}
