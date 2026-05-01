import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { activeCrawls } from "@/lib/crawl-store";
import * as cheerio from "cheerio";

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

    // Start crawl in background
    crawlAudit(auditId, audit.domain, audit.maxPages).catch(error => {
      console.error("Audit crawl failed:", error);
      updateAuditError(auditId, error);
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

// Simple, reliable crawl function
async function crawlAudit(auditId: string, domain: string, maxPages: number) {
  console.log(`[${auditId}] Starting crawl for ${domain}`);

  try {
    // Normalize domain
    const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

    // Initialize progress
    updateProgress(auditId, {
      totalPages: maxPages,
      crawledPages: 0,
      currentUrl: "Starting...",
      status: "crawling",
      errors: [],
    });

    // Fetch homepage
    let htmlContent: string;
    try {
      const response = await fetch(baseUrl, {
        headers: {
          "User-Agent": "SEO-Audit-Bot/1.0",
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      htmlContent = await response.text();
    } catch (fetchError) {
      throw new Error(`Failed to fetch ${baseUrl}: ${fetchError}`);
    }

    // Parse HTML
    const $ = cheerio.load(htmlContent);

    // Extract basic data from homepage
    const crawledPages = [];
    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
    const h1 = $("h1").first().text().trim();

    // Get all links to crawl more pages
    const links = new Set<string>();
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/")) {
        try {
          const url = new URL(href, baseUrl).href;
          if (url.includes(domain)) {
            links.add(url);
          }
        } catch {}
      }
    });

    // Crawl homepage
    const homepageData = {
      url: baseUrl,
      statusCode: 200,
      title,
      metaDescription,
      h1,
      headings: extractHeadings($),
      links: extractLinks($, baseUrl, domain),
      images: extractImages($),
      structuredData: extractStructuredData($),
      issues: detectIssues($, baseUrl),
      responseTime: 0,
      contentLength: htmlContent.length,
      robotsMeta: $('meta[name="robots"]').attr("content") || "",
    };

    crawledPages.push(homepageData);

    // Crawl additional pages (limit to maxPages - 1)
    const urlsToVisit = Array.from(links).slice(0, Math.min(maxPages - 1, 5));

    for (let i = 0; i < urlsToVisit.length; i++) {
      const url = urlsToVisit[i];

      updateProgress(auditId, {
        totalPages: maxPages,
        crawledPages: i + 1,
        currentUrl: url,
        status: "crawling",
        errors: [],
      });

      try {
        const pageResponse = await fetch(url, {
          headers: { "User-Agent": "SEO-Audit-Bot/1.0" },
          signal: AbortSignal.timeout(15000),
        });

        if (!pageResponse.ok) continue;

        const pageHtml = await pageResponse.text();
        const page$ = cheerio.load(pageHtml);

        crawledPages.push({
          url,
          statusCode: pageResponse.status,
          title: page$("title").text().trim(),
          metaDescription: page$('meta[name="description"]').attr("content")?.trim() || "",
          h1: page$("h1").first().text().trim(),
          headings: extractHeadings(page$),
          links: extractLinks(page$, baseUrl, domain),
          images: extractImages(page$),
          structuredData: extractStructuredData(page$),
          issues: detectIssues(page$, url),
          responseTime: 0,
          contentLength: pageHtml.length,
          robotsMeta: page$('meta[name="robots"]').attr("content") || "",
        });
      } catch (pageError) {
        console.log(`[${auditId}] Failed to crawl ${url}:`, pageError);
      }
    }

    console.log(`[${auditId}] Crawled ${crawledPages.length} pages`);

    // Save results to database
    for (const pageData of crawledPages) {
      await prisma.crawlResult.create({
        data: {
          auditId,
          url: pageData.url,
          statusCode: pageData.statusCode,
          title: pageData.title,
          metaDescription: pageData.metaDescription,
          h1: pageData.h1,
          headings: JSON.stringify(pageData.headings),
          links: JSON.stringify(pageData.links),
          images: JSON.stringify(pageData.images),
          structuredData: JSON.stringify(pageData.structuredData),
          issues: JSON.stringify(pageData.issues),
          responseTime: pageData.responseTime,
          contentLength: pageData.contentLength,
          robotsMeta: pageData.robotsMeta,
        },
      });
    }

    // Update progress to complete
    updateProgress(auditId, {
      totalPages: crawledPages.length,
      crawledPages: crawledPages.length,
      currentUrl: "Complete",
      status: "complete",
      errors: [],
    });

    // Update audit status
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: "complete" },
    });

    // Trigger analysis
    await triggerAnalysis(auditId);

  } catch (error) {
    console.error(`[${auditId}] Crawl error:`, error);
    throw error;
  }
}

function updateProgress(auditId: string, progress: any) {
  activeCrawls.set(auditId, { progress, abortController: new AbortController() });
  prisma.audit.update({
    where: { id: auditId },
    data: { crawlProgress: JSON.stringify(progress) },
  }).catch(() => {});
}

async function updateAuditError(auditId: string, error: any) {
  await prisma.audit.update({
    where: { id: auditId },
    data: {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    },
  }).catch(() => {});
}

async function triggerAnalysis(auditId: string) {
  try {
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    let host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || "localhost:3000";
    host = host.replace(/^https?:\/\//, "");

    const analysisUrl = `${protocol}://${host}/api/analyze`;
    console.log(`[${auditId}] Triggering analysis at: ${analysisUrl}`);

    const response = await fetch(analysisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId }),
    });

    if (!response.ok) {
      console.error(`[${auditId}] Analysis trigger failed:`, response.status);
    }
  } catch (error) {
    console.error(`[${auditId}] Failed to trigger analysis:`, error);
  }
}

// Helper functions
function extractHeadings($: any) {
  const headings: any[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt($(el)[0].name[1]);
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });
  return headings;
}

function extractLinks($: any, baseUrl: string, domain: string) {
  const links: any[] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    const text = $(el).text().trim();
    if (!href) return;

    try {
      const url = new URL(href, baseUrl).href;
      const isInternal = url.includes(domain);
      const isNoFollow = $(el).attr("rel")?.includes("nofollow") || false;
      links.push({ href: url, text, isInternal, isNoFollow });
    } catch {}
  });
  return links;
}

function extractImages($: any) {
  const images: any[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || "";
    const alt = $(el).attr("alt") || "";
    images.push({ src, alt, hasAlt: !!alt });
  });
  return images;
}

function extractStructuredData($: any) {
  const structured: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "{}");
      structured.push(data);
    } catch {}
  });
  return structured;
}

function detectIssues($: any, url: string) {
  const issues: any[] = [];

  // Check title
  const title = $("title").text().trim();
  if (!title) issues.push({ type: "missing_title", severity: "critical" });
  else if (title.length < 30) issues.push({ type: "short_title", severity: "high" });
  else if (title.length > 60) issues.push({ type: "long_title", severity: "medium" });

  // Check meta description
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  if (!metaDesc) issues.push({ type: "missing_meta_description", severity: "high" });
  else if (metaDesc.length < 50) issues.push({ type: "short_meta_description", severity: "medium" });
  else if (metaDesc.length > 160) issues.push({ type: "long_meta_description", severity: "low" });

  // Check H1
  const h1Count = $("h1").length;
  if (h1Count === 0) issues.push({ type: "missing_h1", severity: "critical" });
  else if (h1Count > 1) issues.push({ type: "multiple_h1", severity: "high" });

  // Check images without alt
  const imagesWithoutAlt = $("img:not([alt])").length;
  if (imagesWithoutAlt > 0) issues.push({ type: "missing_alt_text", severity: "medium", count: imagesWithoutAlt });

  // Check HTTPS
  if (url.startsWith("http://")) issues.push({ type: "not_https", severity: "critical" });

  // Check canonical
  const canonical = $('link[rel="canonical"]').attr("href");
  if (!canonical) issues.push({ type: "missing_canonical", severity: "low" });

  return issues;
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

    let results: any[] = [];
    let errors: string[] = [];

    try {
      const crawlResult = await crawlWebsite(
        domain,
        { maxPages: Math.min(maxPages, 10), concurrentRequests: 2, requestDelay: 800 },
        onProgress
      );
      results = crawlResult.results;
      errors = crawlResult.errors;

      console.log(`Crawl completed: ${results.length} pages, ${errors.length} errors`);

      if (results.length === 0) {
        throw new Error(`Failed to crawl domain. No pages found. Errors: ${errors.slice(0, 3).join("; ")}`);
      }
    } catch (crawlError) {
      console.error("Crawl failed:", crawlError);
      throw crawlError;
    }

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
    return NextResponse.json({ error: "Audit ID is required" }, { status: 400 });
  }

  try {
    // Check in-memory first (active crawl)
    const crawl = activeCrawls.get(auditId);
    if (crawl) {
      return NextResponse.json({ progress: crawl.progress });
    }

    // Check database
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: { status: true, crawlProgress: true },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Return database progress
    if (audit.crawlProgress && audit.crawlProgress !== "{}") {
      return NextResponse.json({ progress: JSON.parse(audit.crawlProgress) });
    }

    // Return status-based progress
    return NextResponse.json({
      progress: {
        totalPages: 0,
        crawledPages: 0,
        currentUrl: "Starting...",
        status: audit.status,
        errors: [],
      },
    });
  } catch (error) {
    console.error("Error getting progress:", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}
