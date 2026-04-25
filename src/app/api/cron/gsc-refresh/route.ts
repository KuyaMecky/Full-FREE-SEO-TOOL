import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSnapshot } from "@/lib/gsc/snapshot";

// Called by Vercel Cron or any external scheduler.
// Add to vercel.json: { "crons": [{ "path": "/api/cron/gsc-refresh", "schedule": "0 6 * * *" }] }
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const properties = await prisma.gscProperty.findMany({
    where: { autoRefresh: true },
  });

  const results: Array<{ propertyId: string; siteUrl: string; ok: boolean; error?: string }> = [];

  for (const prop of properties) {
    try {
      await createSnapshot(prop.id);
      await prisma.gscProperty.update({
        where: { id: prop.id },
        data: { lastAutoRefresh: new Date() },
      });
      results.push({ propertyId: prop.id, siteUrl: prop.siteUrl, ok: true });
    } catch (e) {
      results.push({ propertyId: prop.id, siteUrl: prop.siteUrl, ok: false, error: e instanceof Error ? e.message : "Failed" });
    }
  }

  return NextResponse.json({ refreshed: results.length, results });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const enabled = Boolean(body?.enabled);
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const updated = await prisma.gscProperty.update({
    where: { id: propertyId },
    data: { autoRefresh: enabled },
    select: { id: true, siteUrl: true, autoRefresh: true },
  });

  return NextResponse.json({ property: updated });
}
