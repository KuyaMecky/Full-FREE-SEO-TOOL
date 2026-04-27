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

        // Simulate crawl data for testing
        // TODO: Replace with real crawlWebsite() once working
        const results = generateMockCrawlResults(audit.domain, audit.maxPages);
        const errors = [];

        // Simulate progress updates
        for (let i = 0; i < results.length; i++) {
          onProgress({
            totalPages: results.length,
            crawledPages: i + 1,
            currentUrl: results[i].url,
            status: "crawling",
            errors: [],
          });
          // Simulate crawl delay
          await new Promise(resolve => setTimeout(resolve, 100));
        }

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
        try {
          await prisma.audit.update({
            where: { id: auditId },
            data: {
              status: "error",
            },
          });
        } catch (dbError) {
          console.error("Failed to update audit status:", dbError);
        }

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

// Mock crawl data generation (replace with real crawlWebsite when available)
function generateMockCrawlResults(domain: string, maxPages: number) {
  const pages = Math.min(maxPages, Math.floor(Math.random() * 30) + 10);
  const results = [];

  const baseUrl = domain.startsWith('http') ? domain : `https://${domain}`;
  const paths = ['/', '/about', '/contact', '/services', '/blog', '/products', '/pricing', '/faq', '/team', '/careers', '/case-studies', '/testimonials', '/privacy', '/terms', '/sitemap'];

  for (let i = 0; i < pages; i++) {
    const path = i < paths.length ? paths[i] : `/page-${i}`;
    results.push({
      url: `${baseUrl}${path}`,
      statusCode: 200,
      title: `Page ${i + 1}`,
      metaDescription: `This is page ${i + 1}`,
      canonical: `${baseUrl}${path}`,
      h1: `Main Heading ${i + 1}`,
      headings: { h1: 1, h2: 3, h3: 5 },
      links: { internal: Math.floor(Math.random() * 5) + 2, external: Math.floor(Math.random() * 3) + 1 },
      images: Array(Math.floor(Math.random() * 5) + 1).fill(null).map((_, idx) => `image-${idx}.jpg`),
      structuredData: [],
      issues: Math.random() > 0.7 ? ['Missing meta description'] : [],
      responseTime: Math.floor(Math.random() * 1000) + 100,
      contentLength: Math.floor(Math.random() * 50000) + 5000,
      robotsMeta: 'index, follow',
    });
  }

  return results;
}
