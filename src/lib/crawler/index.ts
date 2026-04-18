import * as cheerio from "cheerio";
import { CrawlOptions, CrawlContext, PageAnalysis, CrawlProgress } from "./types";
import { fetchPage, sleep, checkLinkStatus } from "./fetcher";
import { analyzeMeta } from "./analyzers/meta";
import { analyzeHeadings } from "./analyzers/headings";
import { analyzeLinks, extractLinks } from "./analyzers/links";
import { analyzeImages, extractImages } from "./analyzers/images";
import {
  analyzeStructuredData,
  extractStructuredData,
} from "./analyzers/structured-data";
import { analyzeSecurity } from "./analyzers/security";
import { fetchAndParseRobotsTxt, checkUrlInRobotsTxt } from "./analyzers/robots";
import { analyzeSitemap, discoverSitemapUrls } from "./analyzers/sitemap";
import { analyzePerformance } from "./analyzers/performance";

const DEFAULT_OPTIONS: CrawlOptions = {
  maxPages: 50,
  concurrentRequests: 2,
  requestDelay: 500,
  respectRobotsTxt: true,
  userAgent: "SEO-Audit-Bot/1.0 (https://github.com/seo-audit-bot)",
};

export async function crawlWebsite(
  domain: string,
  options: Partial<CrawlOptions> = {},
  onProgress?: (progress: CrawlProgress) => void
): Promise<{
  results: PageAnalysis[];
  errors: string[];
  robotsData: { sitemaps: string[]; disallowed: string[]; allowed: string[] } | null;
  sitemapUrls: string[];
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Normalize domain
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const urlObj = new URL(baseUrl);

  // Fetch robots.txt
  const robotsData = await fetchAndParseRobotsTxt(baseUrl);

  // Fetch sitemap URLs
  const sitemapUrls = await discoverSitemapUrls(baseUrl);

  // Initialize crawl context
  const context: CrawlContext = {
    baseUrl: urlObj,
    crawledUrls: new Set(),
    urlQueue: [baseUrl, ...sitemapUrls.slice(0, 10)], // Seed queue with base + some sitemap URLs
    options: opts,
    results: [],
    errors: [],
    onProgress,
  };

  // Send initial progress
  onProgress?.({
    totalPages: opts.maxPages,
    crawledPages: 0,
    currentUrl: "Starting...",
    status: "crawling",
    errors: [],
  });

  // Crawl loop
  while (
    context.urlQueue.length > 0 &&
    context.crawledUrls.size < opts.maxPages
  ) {
    const batch = context.urlQueue
      .splice(0, opts.concurrentRequests)
      .filter((url) => {
        // Skip already crawled URLs
        if (context.crawledUrls.has(url)) return false;

        // Check robots.txt if enabled
        if (opts.respectRobotsTxt && robotsData) {
          if (checkUrlInRobotsTxt(url, robotsData.disallowed)) return false;
        }

        return true;
      });

    if (batch.length === 0) continue;

    // Process batch concurrently
    await Promise.all(
      batch.map(async (url) => {
        try {
          onProgress?.({
            totalPages: opts.maxPages,
            crawledPages: context.crawledUrls.size,
            currentUrl: url,
            status: "crawling",
            errors: context.errors,
          });

          const result = await crawlPage(url, context);

          if (result) {
            context.results.push(result);
            context.crawledUrls.add(url);

            // Extract new links for queue
            const newLinks = extractLinksFromPage(result, context);
            for (const link of newLinks) {
              if (
                !context.crawledUrls.has(link) &&
                !context.urlQueue.includes(link) &&
                context.urlQueue.length + context.crawledUrls.size < opts.maxPages
              ) {
                context.urlQueue.push(link);
              }
            }
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          context.errors.push(`${url}: ${errorMsg}`);

          onProgress?.({
            totalPages: opts.maxPages,
            crawledPages: context.crawledUrls.size,
            currentUrl: url,
            status: "crawling",
            errors: context.errors,
          });
        }

        // Rate limiting delay
        await sleep(opts.requestDelay);
      })
    );
  }

  onProgress?.({
    totalPages: opts.maxPages,
    crawledPages: context.crawledUrls.size,
    currentUrl: "Complete",
    status: "complete",
    errors: context.errors,
  });

  return {
    results: context.results,
    errors: context.errors,
    robotsData,
    sitemapUrls,
  };
}

async function crawlPage(
  url: string,
  context: CrawlContext
): Promise<PageAnalysis | null> {
  const { html, statusCode, responseTime, contentLength, error } = await fetchPage(
    url,
    context.options
  );

  if (error || statusCode >= 400 || !html) {
    context.errors.push(`${url}: ${error || `HTTP ${statusCode}`}`);
    return null;
  }

  const $ = cheerio.load(html);

  // Run all analyzers
  const metaIssues = analyzeMeta(html, $, url, context);
  const headingIssues = analyzeHeadings(html, $, url, context);
  const linkIssues = analyzeLinks(html, $, url, context);
  const imageIssues = analyzeImages(html, $, url, context);
  const structuredDataIssues = analyzeStructuredData(html, $, url, context);
  const securityIssues = analyzeSecurity(html, $, url, context);
  const performanceIssues = analyzePerformance(
    html,
    $,
    url,
    responseTime,
    contentLength
  );

  // Get robots meta
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";

  // Combine all issues
  const allIssues = [
    ...metaIssues,
    ...headingIssues,
    ...linkIssues,
    ...imageIssues,
    ...structuredDataIssues,
    ...securityIssues,
    ...performanceIssues,
  ];

  // Extract H1
  const h1 = $("h1").first().text().trim();

  // Extract headings
  const headings = $("h1, h2, h3, h4, h5, h6")
    .map((_, el) => ({
      level: parseInt(el.tagName.toLowerCase().replace("h", "")),
      text: $(el).text().trim(),
    }))
    .get()
    .filter((h) => h.text);

  // Extract links
  const links = extractLinks(html, $, url);

  // Extract images
  const images = extractImages($);

  // Extract structured data
  const structuredData = extractStructuredData($);

  return {
    url,
    statusCode,
    title: $("title").text().trim(),
    metaDescription: $('meta[name="description"]').attr("content")?.trim() || "",
    canonical: $('link[rel="canonical"]').attr("href")?.trim() || "",
    h1,
    headings,
    links,
    images,
    structuredData,
    issues: allIssues,
    responseTime,
    contentLength,
    robotsMeta,
  };
}

function extractLinksFromPage(
  page: PageAnalysis,
  context: CrawlContext
): string[] {
  const newLinks: string[] = [];

  for (const link of page.links) {
    if (link.isInternal) {
      try {
        const normalized = new URL(link.href).href.split("#")[0].replace(/\/$/, "");
        if (!newLinks.includes(normalized)) {
          newLinks.push(normalized);
        }
      } catch {
        // Invalid URL
      }
    }
  }

  return newLinks;
}

export { analyzeSitemap };
export * from "./types";
