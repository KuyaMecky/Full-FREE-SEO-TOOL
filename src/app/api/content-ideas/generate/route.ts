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
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }

    const property = await prisma.gscProperty.findFirst({
      where: { id: propertyId, userId: session.id },
      include: {
        snapshots: {
          orderBy: { fetchedAt: "desc" },
          take: 1,
          select: { byQuery: true, byPage: true },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Fetch sitemap
    const sitemapData = await fetchSitemapForProperty(property.siteUrl);
    const existingUrls = sitemapData.entries.map((e) => e.url);

    // Parse GSC snapshot data
    let gscQueries: any[] = [];
    let gscTopPages: any[] = [];

    if (property.snapshots.length > 0) {
      const snapshot = property.snapshots[0];
      try {
        gscQueries = JSON.parse(snapshot.byQuery || "[]")
          .slice(0, 50)
          .map((q: any) => ({
            query: q.query,
            impressions: q.impressions || 0,
            clicks: q.clicks || 0,
            position: q.position || 0,
          }));
        gscTopPages = JSON.parse(snapshot.byPage || "[]")
          .slice(0, 20)
          .map((p: any) => ({
            page: p.page,
            impressions: p.impressions || 0,
            clicks: p.clicks || 0,
          }));
      } catch (e) {
        console.error("Failed to parse GSC data:", e);
      }
    }

    // Extract domain
    const domain = property.siteUrl
      .replace(/^sc-domain:/, "")
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    // Generate ideas using AI
    const contentPlan = await generateContentIdeas({
      domain,
      businessType: "",
      existingUrls,
      gscQueries,
      gscTopPages,
    });

    // Save ideas to database as ContentDraft items
    const savedIdeas = [];
    for (const idea of contentPlan.quickWinIdeas) {
      const draft = await prisma.contentDraft.create({
        data: {
          userId: session.id,
          propertyId: propertyId,
          title: idea.title,
          slug: idea.suggestedSlug,
          metaTitle: idea.title,
          metaDescription: idea.rationale.substring(0, 155),
          focusKeyword: idea.targetKeyword,
          content: `# ${idea.title}\n\n## Outline\n${idea.outline.map((s) => `- ${s}`).join("\n")}\n\n## Rationale\n${idea.rationale}`,
          status: "draft",
        },
      });
      savedIdeas.push(draft);
    }

    return NextResponse.json({
      success: true,
      contentPlan: {
        summary: contentPlan.summary,
        quickWinsGenerated: contentPlan.quickWinIdeas.length,
        topicExpansions: contentPlan.topicExpansions.length,
        newPillars: contentPlan.newPillarIdeas.length,
        ideas: contentPlan.quickWinIdeas,
      },
      savedIdeasCount: savedIdeas.length,
      sitemapInfo: {
        entriesFetched: sitemapData.entries.length,
        sitemapsFound: sitemapData.sitemapUrls.length,
        errors: sitemapData.errors,
      },
      gscData: {
        queriesFetched: gscQueries.length,
        topPagesFetched: gscTopPages.length,
      },
    });
  } catch (error) {
    console.error("Content ideas generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate ideas", details: String(error) },
      { status: 500 }
    );
  }
}
