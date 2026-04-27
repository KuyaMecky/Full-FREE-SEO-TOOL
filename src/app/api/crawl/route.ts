import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crawlWebsite, CrawlProgress } from "@/lib/crawler";
import { activeCrawls } from "@/lib/crawl-store";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID is required" },
        { status: 400 }
      );
    }

    // Get audit from database and verify ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    if (audit.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update audit status
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "crawling" },
    });

    // Start crawl in background
    (async () => {
      try {
        const abortController = new AbortController();
        const crawlId = auditId;

        // Initialize progress tracking
        activeCrawls.set(crawlId, {
          progress: {
            totalPages: audit.maxPages,
            crawledPages: 0,
            currentUrl: "Starting...",
            status: "crawling",
            errors: [],
          },
          abortController,
        });

        const onProgress = (progress: CrawlProgress) => {
          const crawl = activeCrawls.get(crawlId);
          if (crawl) {
            crawl.progress = progress;
          }
        };

        // Run the crawl
        const { results, errors, robotsData, sitemapUrls } = await crawlWebsite(
          audit.domain,
          {
            maxPages: audit.maxPages,
            concurrentRequests: 2,
            requestDelay: 500,
            respectRobotsTxt: true,
          },
          onProgress
        );

        // Save crawl results to database
        for (const result of results) {
          await prisma.crawlResult.create({
            data: {
              auditId: audit.id,
              url: result.url,
              statusCode: result.statusCode,
              title: result.title,
              metaDescription: result.metaDescription,
              canonical: result.canonical,
              h1: result.h1,
              headings: JSON.stringify(result.headings),
              links: JSON.stringify(result.links),
              images: JSON.stringify(result.images),
              structuredData: JSON.stringify(result.structuredData),
              issues: JSON.stringify(result.issues),
              responseTime: result.responseTime,
              contentLength: result.contentLength,
              robotsMeta: result.robotsMeta,
            },
          });
        }

        // Clean up active crawl
        activeCrawls.delete(crawlId);

        // Update audit status
        await prisma.audit.update({
          where: { id: auditId },
          data: { status: "analyzing" },
        });

        // Trigger analysis
        try {
          const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
          const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";
          const analysisUrl = `${protocol}://${host}/api/analyze`;

          console.log("Triggering analysis at:", analysisUrl);

          const analysisResponse = await fetch(analysisUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auditId }),
          });

          if (!analysisResponse.ok) {
            console.error("Analysis trigger failed:", analysisResponse.status, analysisResponse.statusText);
          } else {
            console.log("Analysis triggered successfully");
          }
        } catch (err) {
          console.error("Failed to trigger analysis:", err);
        }
      } catch (error) {
        console.error("Crawl failed:", error);

        // Update audit with error
        await prisma.audit.update({
          where: { id: auditId },
          data: {
            status: "error",
            errorMessage:
              error instanceof Error ? error.message : "Crawl failed",
          },
        });

        activeCrawls.delete(auditId);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Crawl started",
    });
  } catch (error) {
    console.error("Failed to start crawl:", error);
    return NextResponse.json(
      { error: "Failed to start crawl" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const auditId = searchParams.get("auditId");

  if (!auditId) {
    return NextResponse.json(
      { error: "Audit ID is required" },
      { status: 400 }
    );
  }

  const crawl = activeCrawls.get(auditId);
  if (!crawl) {
    // Check if audit exists and is complete
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: { status: true },
    });

    if (audit?.status === "analyzing" || audit?.status === "complete") {
      return NextResponse.json({
        progress: {
          totalPages: 0,
          crawledPages: 0,
          currentUrl: "Crawl complete",
          status: "complete",
          errors: [],
        },
      });
    }

    return NextResponse.json(
      { error: "Crawl not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ progress: crawl.progress });
}
