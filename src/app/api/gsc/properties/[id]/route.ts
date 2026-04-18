import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.gscProperty.findUnique({
    where: { id },
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

  const latest = property.snapshots[0];
  const snapshot = latest
    ? {
        id: latest.id,
        rangeStart: latest.rangeStart,
        rangeEnd: latest.rangeEnd,
        totalImpressions: latest.totalImpressions,
        totalClicks: latest.totalClicks,
        avgCtr: latest.avgCtr,
        avgPosition: latest.avgPosition,
        byDate: JSON.parse(latest.byDate || "[]"),
        byQuery: JSON.parse(latest.byQuery || "[]"),
        byPage: JSON.parse(latest.byPage || "[]"),
        suggestions: JSON.parse(latest.suggestions || "null"),
        fetchedAt: latest.fetchedAt,
      }
    : null;

  return NextResponse.json({
    property: {
      id: property.id,
      siteUrl: property.siteUrl,
      permissionLevel: property.permissionLevel,
      addedAt: property.addedAt,
    },
    snapshot,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.gscProperty.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (property.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.gscProperty.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
