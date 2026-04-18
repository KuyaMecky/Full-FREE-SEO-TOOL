import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  analyzeCompetitors,
  fetchCompetitorSnapshot,
} from "@/lib/ai/competitors";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const yourDomain =
      typeof body?.yourDomain === "string" ? body.yourDomain.trim() : "";
    const competitors: string[] = Array.isArray(body?.competitors)
      ? body.competitors
          .filter((c: unknown) => typeof c === "string")
          .map((c: string) => c.trim())
          .filter(Boolean)
      : [];

    if (!yourDomain) {
      return NextResponse.json(
        { error: "yourDomain is required" },
        { status: 400 }
      );
    }
    if (competitors.length === 0) {
      return NextResponse.json(
        { error: "Add at least one competitor" },
        { status: 400 }
      );
    }

    const businessType =
      typeof body?.businessType === "string" ? body.businessType : undefined;
    const goals: string[] = Array.isArray(body?.goals)
      ? body.goals.filter((g: unknown) => typeof g === "string")
      : [];

    const [yourSnapshot, ...competitorSnapshots] = await Promise.all([
      fetchCompetitorSnapshot(yourDomain).catch(() => undefined),
      ...competitors.slice(0, 5).map((c) => fetchCompetitorSnapshot(c)),
    ]);

    const report = await analyzeCompetitors({
      yourDomain,
      yourBusinessType: businessType,
      yourGoals: goals,
      yourSnapshot,
      competitors: competitorSnapshots,
    });

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Competitors one-off failed:", err);
    const message =
      err instanceof Error ? err.message : "Competitor analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
