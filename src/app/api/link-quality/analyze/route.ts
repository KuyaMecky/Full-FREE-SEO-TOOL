import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAhrefsBacklinks } from "@/lib/ahrefs/client";
import { scoreLinkQuality, generateQualityReport } from "@/lib/link-quality/scorer";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, domain } = await request.json();

    if (!propertyId || !domain) {
      return NextResponse.json(
        { error: "propertyId and domain required" },
        { status: 400 }
      );
    }

    // Verify user owns the property
    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get user settings for Ahrefs API key
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: { ahrefsApiKey: true },
    });

    if (!userSettings?.ahrefsApiKey) {
      return NextResponse.json(
        { error: "Ahrefs API key not configured" },
        { status: 400 }
      );
    }

    // Fetch backlinks from Ahrefs
    let backlinks = [];
    try {
      const result = await getAhrefsBacklinks(
        userSettings.ahrefsApiKey,
        domain
      );
      backlinks = result?.backlinks || [];
    } catch (error) {
      console.error("Failed to fetch Ahrefs backlinks:", error);
      return NextResponse.json(
        { error: "Failed to fetch backlinks from Ahrefs" },
        { status: 500 }
      );
    }

    if (backlinks.length === 0) {
      return NextResponse.json({
        domain,
        report: {
          totalBacklinks: 0,
          averageQuality: 0,
          averageToxicity: 0,
          healthScore: 100,
          byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
          recommendedDisavows: [],
          recommendedMonitor: [],
          topQualityLinks: [],
        },
        links: [],
      });
    }

    // Score each backlink
    const scoredLinks = backlinks.map((link) => scoreLinkQuality(link));

    // Generate quality report
    const report = generateQualityReport(scoredLinks);

    // Return results
    return NextResponse.json({
      domain,
      report,
      links: scoredLinks,
      linksCount: {
        total: scoredLinks.length,
        highQuality: scoredLinks.filter((l) => l.qualityScore >= 70).length,
        needsMonitoring: scoredLinks.filter(
          (l) => l.recommendation === 'monitor'
        ).length,
        shouldDisavow: scoredLinks.filter((l) => l.recommendation === 'disavow')
          .length,
      },
    });
  } catch (error) {
    console.error("Failed to analyze link quality:", error);
    return NextResponse.json(
      { error: "Failed to analyze link quality" },
      { status: 500 }
    );
  }
}
