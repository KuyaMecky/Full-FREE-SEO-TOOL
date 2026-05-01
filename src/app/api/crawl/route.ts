import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crawlWebsite, CrawlProgress } from "@/lib/crawler";
import { activeCrawls } from "@/lib/crawl-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID is required" },
        { status: 400 }
      );
    }

    // Get audit from database
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Update audit status
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "crawling" },
    });

    // Start crawl in background (fire and forget)
    startCrawlBackground(auditId, audit.domain, audit.maxPages).catch(error => {
      console.error("Background crawl error:", error);
    });

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

async function startCrawlBackground(auditId: string, domain: string, maxPages: number) {
  const crawlId = auditId;

  try {
    // Initialize progress tracking
    activeCrawls.set(crawlId, {
      progress: {
        totalPages: maxPages,
        crawledPages: 0,
        currentUrl: "Starting...",
        status: "crawling",
        errors: [],
      },
      abortController: new AbortController(),
    });

    const onProgress = (progress: CrawlProgress) => {
      // Store in memory for local dev
      const crawl = activeCrawls.get(crawlId);
      if (crawl) {
        crawl.progress = progress;
      }

      // Store progress in database asynchronously
      prisma.audit.update({
        where: { id: crawlId },
        data: {
          crawlProgress: JSON.stringify(progress),
        },
      }).catch(err => {
        console.error("Failed to update progress:", err);
      });
    };

    // Use real crawler instead of mock data
    console.log(`Starting real crawl for domain: ${domain}`);
    const { results, errors } = await crawlWebsite(
      domain,
      { maxPages, concurrentRequests: 3, requestDelay: 500 },
      onProgress
    );

    console.log(`Crawl completed: ${results.length} pages, ${errors.length} errors`);

    // Save crawl results to database
    for (const result of results) {
      await prisma.crawlResult.create({
        data: {
          auditId,
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

    // Update audit status to complete before triggering analysis
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "complete" },
    });

    // Trigger analysis
    try {
      const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
      let host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";
      host = host.replace(/^https?:\/\//, "");
      const analysisUrl = `${protocol}://${host}/api/analyze`;

      console.log("Triggering analysis at:", analysisUrl);
      const analysisResponse = await fetch(analysisUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });

      if (!analysisResponse.ok) {
        console.error("Analysis trigger failed:", analysisResponse.status);
      } else {
        console.log("Analysis triggered successfully");
      }
    } catch (err) {
      console.error("Failed to trigger analysis:", err);
    }
  } catch (error) {
    console.error("Crawl failed:", error);
    activeCrawls.delete(crawlId);

    try {
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Crawl failed",
        },
      });
    } catch (dbError) {
      console.error("Failed to update audit error status:", dbError);
    }
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

  // Check if audit exists
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    select: { status: true, crawlProgress: true },
  });

  if (!audit) {
    return NextResponse.json(
      { error: "Audit not found" },
      { status: 404 }
    );
  }

  // Try to get from in-memory store first
  const crawl = activeCrawls.get(auditId);
  if (crawl) {
    return NextResponse.json({ progress: crawl.progress });
  }

  // Fall back to database
  if (audit.crawlProgress && audit.crawlProgress !== "{}") {
    return NextResponse.json({ progress: JSON.parse(audit.crawlProgress) });
  }

  // Return current status
  return NextResponse.json({
    progress: {
      totalPages: 0,
      crawledPages: 0,
      currentUrl: audit.status === "pending" ? "Starting..." : "Complete",
      status: audit.status === "pending" ? "crawling" : audit.status,
      errors: [],
    },
  });
}
