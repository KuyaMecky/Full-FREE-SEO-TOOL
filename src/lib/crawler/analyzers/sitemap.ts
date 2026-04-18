import { CrawlContext, PageIssue } from "../types";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function fetchAndParseSitemap(
  sitemapUrl: string
): Promise<SitemapUrl[] | null> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "SEO-Audit-Bot/1.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const content = await response.text();
    return parseSitemap(content);
  } catch {
    return null;
  }
}

export function parseSitemap(content: string): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  // Basic XML parsing for sitemap
  const urlMatches = content.matchAll(/\u003curl\u003e([\s\S]*?)\u003c\/url\u003e/g);

  for (const match of urlMatches) {
    const urlBlock = match[1];
    const loc = urlBlock.match(/\u003cloc\u003e(.*?)\u003c\/loc\u003e/)?.[1] || "";
    const lastmod = urlBlock.match(/\u003clastmod\u003e(.*?)\u003c\/lastmod\u003e/)?.[1];
    const changefreq = urlBlock.match(/\u003cchangefreq\u003e(.*?)\u003c\/changefreq\u003e/)?.[1];
    const priority = urlBlock.match(/\u003cpriority\u003e(.*?)\u003c\/priority\u003e/)?.[1];

    if (loc) {
      urls.push({ loc, lastmod, changefreq, priority });
    }
  }

  return urls;
}

export async function analyzeSitemap(
  baseUrl: string,
  context: CrawlContext
): Promise<PageIssue[]> {
  const issues: PageIssue[] = [];

  // Try common sitemap locations
  const urlObj = new URL(baseUrl);
  const possibleSitemaps = [
    `${urlObj.protocol}//${urlObj.host}/sitemap.xml`,
    `${urlObj.protocol}//${urlObj.host}/sitemap_index.xml`,
    `${urlObj.protocol}//${urlObj.host}/sitemap-index.xml`,
  ];

  let foundSitemap = false;
  let sitemapUrls: SitemapUrl[] = [];

  for (const sitemapUrl of possibleSitemaps) {
    const urls = await fetchAndParseSitemap(sitemapUrl);
    if (urls) {
      foundSitemap = true;
      sitemapUrls = urls;
      break;
    }
  }

  if (!foundSitemap) {
    issues.push({
      type: "missing-sitemap",
      severity: "medium",
      message: "XML sitemap not found",
      details: "Create and submit an XML sitemap to help search engines discover your pages",
    });
    return issues;
  }

  // Analyze sitemap content
  if (sitemapUrls.length === 0) {
    issues.push({
      type: "empty-sitemap",
      severity: "high",
      message: "Sitemap exists but contains no URLs",
      details: "Sitemap file is empty or malformed",
    });
  } else if (sitemapUrls.length > 50000) {
    issues.push({
      type: "sitemap-too-large",
      severity: "medium",
      message: `Sitemap contains ${sitemapUrls.length} URLs (max recommended: 50,000)`,
      details: "Consider splitting into multiple sitemaps",
    });
  }

  // Check for old lastmod dates
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const oldUrls = sitemapUrls.filter((url) => {
    if (!url.lastmod) return false;
    const lastmodDate = new Date(url.lastmod);
    return lastmodDate < oneYearAgo;
  });

  if (oldUrls.length > 0) {
    issues.push({
      type: "stale-sitemap-urls",
      severity: "low",
      message: `${oldUrls.length} URLs haven't been updated in over a year`,
      details: "Consider updating content or removing outdated URLs",
    });
  }

  // Check for URLs without lastmod
  const urlsWithoutLastmod = sitemapUrls.filter((url) => !url.lastmod).length;
  if (urlsWithoutLastmod > 0) {
    issues.push({
      type: "sitemap-missing-lastmod",
      severity: "low",
      message: `${urlsWithoutLastmod} URLs are missing lastmod dates`,
      details: "Adding lastmod helps search engines prioritize crawling",
    });
  }

  return issues;
}

export async function discoverSitemapUrls(baseUrl: string): Promise<string[]> {
  const urlObj = new URL(baseUrl);
  const possibleSitemaps = [
    `${urlObj.protocol}//${urlObj.host}/sitemap.xml`,
    `${urlObj.protocol}//${urlObj.host}/sitemap_index.xml`,
    `${urlObj.protocol}//${urlObj.host}/sitemap-index.xml`,
  ];

  for (const sitemapUrl of possibleSitemaps) {
    const urls = await fetchAndParseSitemap(sitemapUrl);
    if (urls && urls.length > 0) {
      return urls.map((u) => u.loc);
    }
  }

  return [];
}
