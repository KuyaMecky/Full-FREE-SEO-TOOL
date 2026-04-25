import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { searchAnalyticsQuery } from "@/lib/gsc/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const kw = await prisma.rankKeyword.findUnique({ where: { id } });
  if (!kw || kw.userId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.rankKeyword.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const kw = await prisma.rankKeyword.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!kw || kw.userId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await getValidAccessToken(session.id);
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const result = await searchAnalyticsQuery(token, kw.property.siteUrl, {
    startDate: start,
    endDate: end,
    dimensions: ["date", "query"],
    rowLimit: 5000,
  });

  type GscRow = { keys?: string[]; position?: number; impressions?: number; clicks?: number; ctr?: number };
  const rows = (result.rows ?? []).filter((r: GscRow) =>
    r.keys?.[1]?.toLowerCase() === kw.keyword
  );

  let count = 0;
  for (const row of rows as GscRow[]) {
    if (!row.keys?.[0]) continue;
    const date = new Date(row.keys[0]);
    await prisma.rankSnapshot.upsert({
      where: { keywordId_date: { keywordId: id, date } },
      create: { keywordId: id, date, position: row.position ?? 0, impressions: row.impressions ?? 0, clicks: row.clicks ?? 0, ctr: row.ctr ?? 0 },
      update: { position: row.position ?? 0, impressions: row.impressions ?? 0, clicks: row.clicks ?? 0 },
    });
    count++;
  }

  return NextResponse.json({ snapshots: count, keyword: kw.keyword });
}
