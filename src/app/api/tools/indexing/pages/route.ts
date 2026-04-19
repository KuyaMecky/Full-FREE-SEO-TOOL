import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface PageRow {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = request.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json(
      { error: "propertyId is required" },
      { status: 400 }
    );
  }

  const property = await prisma.gscProperty.findUnique({
    where: { id: propertyId },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (property.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snap = property.snapshots[0];
  if (!snap) {
    return NextResponse.json({
      siteUrl: property.siteUrl,
      pages: [],
      fetchedAt: null,
      note: "No snapshot yet. Open the property and click Refresh first.",
    });
  }

  let rows: PageRow[] = [];
  try {
    rows = JSON.parse(snap.byPage || "[]") as PageRow[];
  } catch {
    rows = [];
  }

  // Annotate each with an "indexed" signal — pages with impressions in the
  // last 28 days were shown to users in Google, i.e. indexed.
  const annotated = rows
    .map((r) => ({
      ...r,
      indexed: r.impressions > 0,
    }))
    .sort((a, b) => b.impressions - a.impressions);

  return NextResponse.json({
    siteUrl: property.siteUrl,
    pages: annotated,
    fetchedAt: snap.fetchedAt,
  });
}
