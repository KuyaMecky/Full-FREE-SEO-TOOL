import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  analyzeCompetitors,
  fetchCompetitorSnapshot,
} from "@/lib/ai/competitors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const audit = await prisma.audit.findUnique({
    where: { id },
    select: { userId: true, competitors: true, competitorReport: true, domain: true },
  });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    competitors: JSON.parse(audit.competitors || "[]"),
    report: audit.competitorReport ? JSON.parse(audit.competitorReport) : null,
    domain: audit.domain,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const audit = await prisma.audit.findUnique({ where: { id } });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let competitors: string[];
  try {
    const body = await request.json();
    if (Array.isArray(body?.competitors)) {
      competitors = body.competitors
        .filter((c: unknown) => typeof c === "string")
        .map((c: string) => c.trim())
        .filter(Boolean);
      await prisma.audit.update({
        where: { id },
        data: { competitors: JSON.stringify(competitors) },
      });
    } else {
      competitors = JSON.parse(audit.competitors || "[]");
    }
  } catch {
    competitors = JSON.parse(audit.competitors || "[]");
  }

  if (competitors.length === 0) {
    return NextResponse.json(
      { error: "Add at least one competitor domain" },
      { status: 400 }
    );
  }

  try {
    // Fetch snapshots in parallel but cap concurrency
    const snapshots = await Promise.all(
      competitors.slice(0, 5).map((c) => fetchCompetitorSnapshot(c))
    );

    // Also snapshot the user's domain for comparison
    const yourSnapshot = await fetchCompetitorSnapshot(audit.domain).catch(
      () => undefined
    );

    const goals = JSON.parse(audit.goals || "[]") as string[];
    const report = await analyzeCompetitors({
      yourDomain: audit.domain,
      yourBusinessType: audit.businessType,
      yourGoals: goals,
      yourSnapshot,
      competitors: snapshots,
    });

    await prisma.audit.update({
      where: { id },
      data: { competitorReport: JSON.stringify(report) },
    });

    return NextResponse.json({ report, competitors });
  } catch (err) {
    console.error("Competitor analysis failed:", err);
    const message =
      err instanceof Error ? err.message : "Competitor analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
