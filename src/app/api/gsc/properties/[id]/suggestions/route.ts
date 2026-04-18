import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  computeOpportunities,
  generateSuggestions,
} from "@/lib/ai/suggestions";
import { SnapshotData } from "@/lib/gsc/types";

export async function POST(
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
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (property.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const latest = property.snapshots[0];
  if (!latest) {
    return NextResponse.json(
      { error: "No snapshot yet — refresh first" },
      { status: 400 }
    );
  }

  try {
    const snapshotData: SnapshotData = {
      rangeStart: latest.rangeStart.toISOString().slice(0, 10),
      rangeEnd: latest.rangeEnd.toISOString().slice(0, 10),
      totalImpressions: latest.totalImpressions,
      totalClicks: latest.totalClicks,
      avgCtr: latest.avgCtr,
      avgPosition: latest.avgPosition,
      byDate: JSON.parse(latest.byDate || "[]"),
      byQuery: JSON.parse(latest.byQuery || "[]"),
      byPage: JSON.parse(latest.byPage || "[]"),
    };

    const opportunities = computeOpportunities(snapshotData);
    const suggestions = await generateSuggestions(
      opportunities,
      property.siteUrl
    );

    await prisma.gscSnapshot.update({
      where: { id: latest.id },
      data: { suggestions: JSON.stringify(suggestions) },
    });

    return NextResponse.json({ opportunities, suggestions });
  } catch (err) {
    console.error("Suggestions generation failed:", err);
    const message =
      err instanceof Error ? err.message : "Suggestions generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
