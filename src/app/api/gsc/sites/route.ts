import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { listSites } from "@/lib/gsc/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.googleAccount.findUnique({
      where: { userId: session.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "No Google account connected" },
        { status: 404 }
      );
    }

    const accessToken = await getValidAccessToken(session.id);
    const response = await listSites(accessToken);
    const googleSites = response.siteEntry ?? [];

    const existing = await prisma.gscProperty.findMany({
      where: { userId: session.id },
      select: { siteUrl: true },
    });
    const addedUrls = new Set(existing.map((p: { siteUrl: string }) => p.siteUrl));

    const sites = googleSites.map((s) => ({
      siteUrl: s.siteUrl,
      permissionLevel: s.permissionLevel,
      added: addedUrls.has(s.siteUrl),
    }));

    return NextResponse.json({ sites, googleEmail: account.googleEmail });
  } catch (err) {
    console.error("Failed to list sites:", err);
    const message = err instanceof Error ? err.message : "Failed to list sites";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
