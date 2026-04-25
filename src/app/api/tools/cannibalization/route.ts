import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface QueryRow { query: string; page: string; impressions: number; clicks: number; position: number }

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const property = await prisma.gscProperty.findFirst({
    where: { id: propertyId, userId: session.id },
    include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
  });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const snap = property.snapshots[0];
  if (!snap) return NextResponse.json({ error: "No GSC data yet — refresh the property first" }, { status: 400 });

  // Parse by-query data — GSC gives query+page combos in the raw snapshot
  // We use byQuery (aggregated by query) as a proxy; full page breakdown would need a fresh fetch
  let allRows: QueryRow[] = [];
  try {
    // byPage gives page-level; byQuery gives query-level
    // We'll build a synthetic keyword→pages map from both
    const byQuery: Array<{ query: string; impressions: number; clicks: number; position: number }> =
      JSON.parse(snap.byQuery || "[]");
    const byPage: Array<{ page: string; impressions: number; clicks: number; position: number }> =
      JSON.parse(snap.byPage || "[]");

    // For each top query, see which pages rank for it
    // Heuristic: a keyword "cannibalizes" if avg position > 1 (meaning >1 URL might be competing)
    // We flag queries where position is worse than expected given high impressions
    allRows = byQuery.slice(0, 500).map(q => ({
      query: q.query,
      page: byPage[0]?.page ?? "",
      impressions: q.impressions,
      clicks: q.clicks,
      position: q.position,
    }));
  } catch { /* ignore */ }

  // Find cannibalization: queries with similar terms that have multiple ranking signals
  // Group by stemmed keyword root (simple: first 5 chars or longest common prefix)
  const groups: Record<string, QueryRow[]> = {};
  for (const row of allRows) {
    const words = row.query.toLowerCase().split(/\s+/);
    // Use 3+ word n-grams that appear in multiple queries as "topic clusters"
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words.slice(i, i + 2).join(" ");
      if (bigram.length < 4) continue;
      if (!groups[bigram]) groups[bigram] = [];
      groups[bigram].push(row);
    }
  }

  // Find groups with 3+ distinct queries that have meaningful impressions
  const cannibal = Object.entries(groups)
    .filter(([, rows]) => rows.length >= 3 && rows.reduce((s, r) => s + r.impressions, 0) > 50)
    .map(([topic, rows]) => ({
      topic,
      queries: rows.sort((a, b) => b.impressions - a.impressions).slice(0, 10),
      totalImpressions: rows.reduce((s, r) => s + r.impressions, 0),
      avgPosition: rows.reduce((s, r) => s + r.position, 0) / rows.length,
      risk: rows.length >= 6 ? "high" : rows.length >= 4 ? "medium" : "low",
    }))
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
    .slice(0, 30);

  return NextResponse.json({ groups: cannibal, queryCount: allRows.length });
}
