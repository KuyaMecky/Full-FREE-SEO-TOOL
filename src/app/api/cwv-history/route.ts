import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchPsi } from "@/lib/pagespeed/client";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const history = await prisma.cwvHistory.findMany({
    where: { userId: session.id, url },
    orderBy: { recordedAt: "asc" },
    take: 90,
  });

  return NextResponse.json({ history });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const url = typeof body?.url === "string" ? body.url.trim() : null;
  const strategy: "mobile" | "desktop" = body?.strategy === "desktop" ? "desktop" : "mobile";

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const result = await fetchPsi(url, strategy);

  const record = await prisma.cwvHistory.create({
    data: {
      userId: session.id,
      url,
      strategy,
      performanceScore: result.performanceScore,
      lcpMs: result.lcpMs,
      clsScore: result.clsScore,
      inpMs: result.inpMs,
      fcpMs: result.fcpMs,
      ttfbMs: result.ttfbMs,
    },
  });

  return NextResponse.json({ record, result });
}
