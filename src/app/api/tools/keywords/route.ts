import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateKeywordResearch } from "@/lib/ai/keywords";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const domain = typeof body?.domain === "string" ? body.domain.trim() : "";
    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    const seedKeywords: string[] = Array.isArray(body?.seedKeywords)
      ? body.seedKeywords
          .filter((s: unknown) => typeof s === "string")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];

    const businessType =
      typeof body?.businessType === "string" ? body.businessType : undefined;
    const goals: string[] = Array.isArray(body?.goals)
      ? body.goals.filter((g: unknown) => typeof g === "string")
      : [];

    // Try GSC cross-reference if the user has this domain connected
    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
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
        // ignore
      }
    }

    const report = await generateKeywordResearch({
      domain,
      businessType,
      goals,
      seedKeywords,
      gscQueries,
    });

    return NextResponse.json({ report, gscMatched: Boolean(property) });
  } catch (err) {
    console.error("Keywords one-off failed:", err);
    const message =
      err instanceof Error ? err.message : "Keyword research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
