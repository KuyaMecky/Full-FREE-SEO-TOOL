import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchSitemapForProperty } from "@/lib/content/sitemap";
import { generateContentIdeas } from "@/lib/ai/content";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const propertyId =
      typeof body?.propertyId === "string" ? body.propertyId : "";
    const seedTopics: string[] = Array.isArray(body?.seedTopics)
      ? body.seedTopics
          .filter((s: unknown) => typeof s === "string")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [];
    const businessType =
      typeof body?.businessType === "string" ? body.businessType : undefined;

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
      include: {
        snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 },
      },
    });
    if (!property) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (property.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse latest GSC snapshot
    const snap = property.snapshots[0];
    let gscQueries: Array<{
      query: string;
      impressions: number;
      clicks: number;
      position: number;
    }> = [];
    let gscTopPages: Array<{
      page: string;
      impressions: number;
      clicks: number;
    }> = [];
    if (snap) {
      try {
        gscQueries = JSON.parse(snap.byQuery || "[]");
        gscTopPages = JSON.parse(snap.byPage || "[]");
      } catch {
        // ignore
      }
    }

    // Fetch sitemap URLs
    const sitemap = await fetchSitemapForProperty(property.siteUrl);
    const existingUrls = sitemap.entries.map((e) => e.url);

    // Domain for prompt context
    const domain = property.siteUrl
      .replace(/^sc-domain:/, "")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    const plan = await generateContentIdeas({
      domain,
      businessType,
      seedTopics,
      existingUrls,
      gscQueries,
      gscTopPages,
    });

    return NextResponse.json({
      plan,
      stats: {
        sitemapUrlCount: existingUrls.length,
        sitemapFiles: sitemap.sitemapUrls,
        sitemapErrors: sitemap.errors,
        gscQueryCount: gscQueries.length,
        hadGscSnapshot: Boolean(snap),
      },
    });
  } catch (err) {
    console.error("Content generate failed:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
