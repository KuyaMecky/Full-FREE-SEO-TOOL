import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue, LinkInfo } from "../types";

export function analyzeLinks(
  html: string,
  $: CheerioAPI,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];
  const baseUrl = new URL(url);

  const links: LinkInfo[] = [];
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() || "";
    const text = $(el).text().trim();
    const rel = $(el).attr("rel") || "";
    const isNoFollow = rel.toLowerCase().includes("nofollow");

    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
      return;
    }

    try {
      const resolvedUrl = new URL(href, url).href;
      const isInternal = new URL(resolvedUrl).hostname === baseUrl.hostname;

      const link: LinkInfo = {
        href: resolvedUrl,
        text: text || "[no text]",
        isInternal,
        isNoFollow,
      };

      links.push(link);

      if (isInternal) {
        internalLinks.push(resolvedUrl);
      } else {
        externalLinks.push(resolvedUrl);
      }
    } catch {
      // Invalid URL
    }
  });

  // Check for empty links
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href !== undefined && !href.trim()) {
      issues.push({
        type: "empty-link-href",
        severity: "medium",
        message: "Link has empty href attribute",
        details: `Link text: "${$(el).text().trim()}"`,
      });
    }
  });

  // Check for orphan pages (no internal links pointing to them)
  // This would require full site analysis, so we just note internal link count
  const internalLinkCount = internalLinks.length;
  if (internalLinkCount === 0) {
    issues.push({
      type: "no-internal-links",
      severity: "medium",
      message: "Page has no internal links",
      details: "Pages should have internal links for navigation and SEO",
    });
  }

  // Check for too many links
  if (links.length > 150) {
    issues.push({
      type: "too-many-links",
      severity: "low",
      message: `Page has ${links.length} links (may dilute link equity)`,
      details: "Consider reducing the number of links on this page",
    });
  }

  // Check for nofollow on internal links
  const nofollowInternal = internalLinks.filter((_, i) => links.find((l) => l.href === internalLinks[i])?.isNoFollow);
  if (nofollowInternal.length > 0) {
    issues.push({
      type: "nofollow-internal-links",
      severity: "low",
      message: `${nofollowInternal.length} internal links have nofollow attribute`,
      details: "Internal nofollow links prevent link equity flow",
    });
  }

  // Check for generic link text
  const genericTexts = ["click here", "read more", "learn more", "here", "link", "website"];
  links.forEach((link) => {
    if (genericTexts.some((text) => link.text.toLowerCase().includes(text))) {
      issues.push({
        type: "generic-link-text",
        severity: "low",
        message: `Link uses generic text: "${link.text}"`,
        details: `URL: ${link.href}`,
      });
    }
  });

  // Check for broken internal links would require additional requests
  // We'll just note the count for now

  return issues;
}

export function extractLinks(html: string, $: CheerioAPI, baseUrl: string): string[] {
  const links: string[] = [];
  const base = new URL(baseUrl);

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")?.trim() || "";

    if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
      return;
    }

    try {
      const resolvedUrl = new URL(href, baseUrl).href;
      const isInternal = new URL(resolvedUrl).hostname === base.hostname;

      if (isInternal) {
        // Normalize URL
        const normalized = resolvedUrl.split("#")[0].replace(/\/$/, "");
        if (!links.includes(normalized)) {
          links.push(normalized);
        }
      }
    } catch {
      // Invalid URL
    }
  });

  return links;
}
