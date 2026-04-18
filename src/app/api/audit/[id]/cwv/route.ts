import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runCwvForAudit } from "@/lib/pagespeed/runner";

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
    select: { userId: true },
  });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.cwvResult.findMany({
    where: { auditId: id },
    orderBy: [{ url: "asc" }, { strategy: "asc" }],
  });

  const results = rows.map((r: typeof rows[number]) => ({
    id: r.id,
    url: r.url,
    strategy: r.strategy,
    performanceScore: r.performanceScore,
    accessibilityScore: r.accessibilityScore,
    seoScore: r.seoScore,
    bestPracticesScore: r.bestPracticesScore,
    lcpMs: r.lcpMs,
    fcpMs: r.fcpMs,
    clsScore: r.clsScore,
    inpMs: r.inpMs,
    ttfbMs: r.ttfbMs,
    speedIndex: r.speedIndex,
    fieldData: JSON.parse(r.fieldData || "null"),
    topIssues: JSON.parse(r.topIssues || "[]"),
    fetchedAt: r.fetchedAt,
  }));

  return NextResponse.json({ results });
}

export async function POST(
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
    select: { userId: true },
  });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Run in background — client polls GET to see progress
  (async () => {
    try {
      await runCwvForAudit(id);
    } catch (err) {
      console.error("CWV run failed:", err);
    }
  })();

  return NextResponse.json({ started: true });
}
