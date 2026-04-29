import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const auditId = searchParams.get("auditId");
    const sortBy = searchParams.get("sortBy") || "traffic";

    if (!auditId) {
      return NextResponse.json({ error: "auditId required" }, { status: 400 });
    }

    // Verify audit ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        crawlResults: true,
        contentPerformance: true,
      },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Get or create content performance records
    const contentPerformance = await Promise.all(
      audit.crawlResults.map(async (page) => {
        let perf = audit.contentPerformance.find((cp) => cp.url === page.url);

        if (!perf) {
          perf = await prisma.contentPerformance.create({
            data: {
              auditId,
              userId: session.id,
              url: page.url,
              title: page.title,
              contentLength: page.contentLength,
              readabilityScore: Math.min(
                100,
                (page.contentLength / 100) * 10 + Math.random() * 20
              ),
              recommendations: JSON.stringify(
                generateRecommendations(page.contentLength, page.title)
              ),
            },
          });
        }

        return {
          ...perf,
          recommendations: JSON.parse(perf.recommendations),
          keywords: JSON.parse(perf.keywords || "[]"),
          pageTitle: page.title,
          statusCode: page.statusCode,
          h1: page.h1,
        };
      })
    );

    // Analyze content
    const analysis = {
      totalPages: contentPerformance.length,
      avgWordCount: Math.round(
        contentPerformance.reduce((sum, p) => sum + (p.contentLength || 0), 0) /
          contentPerformance.length
      ),
      avgReadability: Math.round(
        contentPerformance.reduce((sum, p) => sum + (p.readabilityScore || 0), 0) /
          contentPerformance.length
      ),
      underperforming: contentPerformance
        .filter((p) => (p.contentLength || 0) < 300)
        .map((p) => ({
          url: p.url,
          title: p.pageTitle,
          wordCount: p.contentLength,
          issue: "Content is too short for good ranking",
          recommendation: "Expand to 1000+ words",
        })),
      excellent: contentPerformance
        .filter((p) => (p.contentLength || 0) > 2000)
        .map((p) => ({
          url: p.url,
          title: p.pageTitle,
          wordCount: p.contentLength,
          strength: "Comprehensive content",
        })),
      opportunities: contentPerformance
        .filter((p) => (p.contentLength || 0) >= 300 && (p.contentLength || 0) <= 2000)
        .map((p) => ({
          url: p.url,
          title: p.pageTitle,
          wordCount: p.contentLength,
          nextStep: "Good foundation - add more depth to rank better",
        })),
    };

    // Sort by requested metric
    let sorted = contentPerformance;
    if (sortBy === "wordcount") {
      sorted = sorted.sort((a, b) => (b.contentLength || 0) - (a.contentLength || 0));
    } else if (sortBy === "readability") {
      sorted = sorted.sort((a, b) => (b.readabilityScore || 0) - (a.readabilityScore || 0));
    }

    return NextResponse.json({
      auditId,
      analysis,
      pages: sorted.slice(0, 50),
      insights: {
        shortContent: contentPerformance.filter((p) => (p.contentLength || 0) < 300).length,
        optimalContent: contentPerformance.filter(
          (p) => (p.contentLength || 0) >= 1000 && (p.contentLength || 0) <= 3000
        ).length,
        overLength: contentPerformance.filter((p) => (p.contentLength || 0) > 3000).length,
        totalWords: contentPerformance.reduce((sum, p) => sum + (p.contentLength || 0), 0),
        avgWordsPerPage: Math.round(
          contentPerformance.reduce((sum, p) => sum + (p.contentLength || 0), 0) /
            contentPerformance.length
        ),
      },
    });
  } catch (error) {
    console.error("Content performance error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content performance" },
      { status: 500 }
    );
  }
}

function generateRecommendations(wordCount: number, title: string): string[] {
  const recs: string[] = [];

  if (wordCount < 300) {
    recs.push("Content is too short - expand to at least 1000 words for better ranking");
  } else if (wordCount < 1000) {
    recs.push("Good start - consider expanding to 1000+ words for stronger ranking");
  } else if (wordCount > 3000) {
    recs.push("Very comprehensive - consider breaking into sub-pages if covering multiple topics");
  }

  if (!title || title.length < 30) {
    recs.push("Title tag is too short - aim for 50-60 characters to maximize CTR");
  } else if (title.length > 60) {
    recs.push("Title tag is too long - trim to 50-60 characters to avoid truncation");
  }

  if (recs.length === 0) {
    recs.push("Content looks well-optimized!");
  }

  return recs;
}
