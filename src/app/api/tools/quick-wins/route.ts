import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface QueryRow {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface QuickWin extends QueryRow {
  propertyId: string;
  siteUrl: string;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const properties = await prisma.gscProperty.findMany({
    where: { userId: session.id },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: { byQuery: true, fetchedAt: true },
      },
    },
  });

  const quickWins: QuickWin[] = [];

  for (const p of properties) {
    const snap = p.snapshots[0];
    if (!snap) continue;
    try {
      const rows = JSON.parse(snap.byQuery || "[]") as QueryRow[];
      for (const r of rows) {
        if (
          r.position >= 4 &&
          r.position <= 20 &&
          r.impressions >= 50
        ) {
          quickWins.push({
            ...r,
            propertyId: p.id,
            siteUrl: p.siteUrl,
          });
        }
      }
    } catch {
      // skip malformed
    }
  }

  // Sort by opportunity score — impressions weighted by how close to top 10
  quickWins.sort((a, b) => {
    const scoreA = a.impressions * (21 - a.position);
    const scoreB = b.impressions * (21 - b.position);
    return scoreB - scoreA;
  });

  return NextResponse.json({
    wins: quickWins,
    totalProperties: properties.length,
    propertiesWithData: properties.filter((p) => p.snapshots[0]).length,
  });
}
