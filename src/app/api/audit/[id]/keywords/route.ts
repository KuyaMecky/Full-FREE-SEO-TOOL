import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateKeywordResearch } from "@/lib/ai/keywords";

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
    select: {
      userId: true,
      seedKeywords: true,
      keywordReport: true,
      domain: true,
    },
  });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    seedKeywords: JSON.parse(audit.seedKeywords || "[]"),
    report: audit.keywordReport ? JSON.parse(audit.keywordReport) : null,
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
  const audit = await prisma.audit.findUnique({
    where: { id },
  });
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (audit.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Accept optional updated seed keywords in the body
  let seedKeywords: string[];
  try {
    const body = await request.json();
    if (Array.isArray(body?.seedKeywords)) {
      seedKeywords = body.seedKeywords
        .filter((k: unknown) => typeof k === "string")
        .map((k: string) => k.trim())
        .filter(Boolean);
      await prisma.audit.update({
        where: { id },
        data: { seedKeywords: JSON.stringify(seedKeywords) },
      });
    } else {
      seedKeywords = JSON.parse(audit.seedKeywords || "[]");
    }
  } catch {
    seedKeywords = JSON.parse(audit.seedKeywords || "[]");
  }

  // Pull matching GSC queries if this user has a property for this domain
  const normalizedDomain = audit.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const property = await prisma.gscProperty.findFirst({
    where: {
      userId: session.id,
      OR: [
        { siteUrl: `sc-domain:${normalizedDomain}` },
        { siteUrl: `https://${normalizedDomain}/` },
        { siteUrl: `https://${normalizedDomain}` },
        { siteUrl: `http://${normalizedDomain}/` },
      ],
    },
    include: {
      snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
    },
  });

  let gscQueries: Array<{ query: string; impressions: number; position: number }> = [];
  if (property?.snapshots[0]) {
    try {
      const byQuery = JSON.parse(property.snapshots[0].byQuery || "[]") as Array<{
        query: string;
        impressions: number;
        position: number;
      }>;
      gscQueries = byQuery.slice(0, 50);
    } catch {
      // ignore parse errors
    }
  }

  try {
    const goals = JSON.parse(audit.goals || "[]") as string[];
    const report = await generateKeywordResearch({
      domain: audit.domain,
      businessType: audit.businessType,
      goals,
      seedKeywords,
      gscQueries,
    });

    await prisma.audit.update({
      where: { id },
      data: { keywordReport: JSON.stringify(report) },
    });

    return NextResponse.json({
      report,
      seedKeywords,
      gscMatched: Boolean(property),
    });
  } catch (err) {
    console.error("Keyword research failed:", err);
    const message =
      err instanceof Error ? err.message : "Keyword research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
