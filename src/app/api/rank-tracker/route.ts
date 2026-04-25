import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { searchAnalyticsQuery } from "@/lib/gsc/client";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? undefined;

  const keywords = await prisma.rankKeyword.findMany({
    where: { userId: session.id, ...(propertyId ? { propertyId } : {}) },
    include: {
      snapshots: { orderBy: { date: "desc" }, take: 30 },
      property: { select: { siteUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ keywords });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const keywords: string[] = Array.isArray(body?.keywords)
    ? body.keywords.map((k: unknown) => String(k).trim().toLowerCase()).filter(Boolean)
    : [];

  if (!propertyId || !keywords.length) {
    return NextResponse.json({ error: "propertyId and keywords[] required" }, { status: 400 });
  }

  const property = await prisma.gscProperty.findFirst({
    where: { id: propertyId, userId: session.id },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const created: string[] = [];
  for (const kw of keywords.slice(0, 50)) {
    try {
      await prisma.rankKeyword.create({
        data: { userId: session.id, propertyId, keyword: kw },
      });
      created.push(kw);
    } catch { /* duplicate — skip */ }
  }

  // Fetch initial positions from GSC (best-effort)
  try {
    const token = await getValidAccessToken(session.id);
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

    const result = await searchAnalyticsQuery(token, property.siteUrl, {
      startDate: start,
      endDate: end,
      dimensions: ["query"],
      rowLimit: 5000,
    });

    for (const kw of created) {
      const row = (result.rows ?? []).find((r: { keys?: string[]; position?: number; impressions?: number; clicks?: number; ctr?: number }) =>
        r.keys?.[0]?.toLowerCase() === kw
      );
      if (row) {
        const kwRecord = await prisma.rankKeyword.findFirst({ where: { propertyId, keyword: kw } });
        if (kwRecord) {
          await prisma.rankSnapshot.upsert({
            where: { keywordId_date: { keywordId: kwRecord.id, date: new Date(end) } },
            create: { keywordId: kwRecord.id, date: new Date(end), position: row.position ?? 0, impressions: row.impressions ?? 0, clicks: row.clicks ?? 0, ctr: row.ctr ?? 0 },
            update: { position: row.position ?? 0, impressions: row.impressions ?? 0, clicks: row.clicks ?? 0 },
          });
        }
      }
    }
  } catch { /* GSC fetch is best-effort */ }

  return NextResponse.json({ created });
}
