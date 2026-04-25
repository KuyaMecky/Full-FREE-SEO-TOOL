import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function fetchPageData(url: string) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? "";
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ?? "";
  const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1]?.trim() ?? "";
  const wordCount = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const internalLinks = (html.match(/href=["']\//g) ?? []).length;
  const externalLinks = (html.match(/href=["']https?:\/\//g) ?? []).length;

  return { title, metaDescription: metaDesc, h1, wordCount, internalLinks, externalLinks };
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? undefined;

  const snaps = await prisma.pageSnapshot.findMany({
    where: { userId: session.id, ...(propertyId ? { propertyId } : {}) },
    orderBy: [{ url: "asc" }, { takenAt: "desc" }],
  });

  // Group by URL, keep latest 2 per URL for diffing
  const grouped: Record<string, typeof snaps> = {};
  for (const s of snaps) {
    if (!grouped[s.url]) grouped[s.url] = [];
    if (grouped[s.url].length < 2) grouped[s.url].push(s);
  }

  return NextResponse.json({ pages: Object.values(grouped) });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const url = typeof body?.url === "string" ? body.url.trim() : null;

  if (!propertyId || !url) return NextResponse.json({ error: "propertyId and url required" }, { status: 400 });

  const property = await prisma.gscProperty.findFirst({ where: { id: propertyId, userId: session.id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const data = await fetchPageData(url);

  const snap = await prisma.pageSnapshot.create({
    data: {
      userId: session.id,
      propertyId,
      url,
      ...data,
      rawData: JSON.stringify(data),
    },
  });

  return NextResponse.json({ snapshot: snap });
}
