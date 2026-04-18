import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue } from "../types";

export function analyzeMeta(
  html: string,
  $: CheerioAPI,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];

  // Title analysis
  const title = $("title").text().trim();
  if (!title) {
    issues.push({
      type: "missing-title",
      severity: "critical",
      message: "Page is missing a title tag",
      details: url,
    });
  } else {
    const titleLength = title.length;
    if (titleLength < 30) {
      issues.push({
        type: "title-too-short",
        severity: "medium",
        message: `Title is too short (${titleLength} chars)`,
        details: `Title: "${title}"`,
      });
    } else if (titleLength > 60) {
      issues.push({
        type: "title-too-long",
        severity: "medium",
        message: `Title may be truncated in search results (${titleLength} chars)`,
        details: `Title: "${title}"`,
      });
    }
  }

  // Meta description analysis
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || "";
  if (!metaDescription) {
    issues.push({
      type: "missing-meta-description",
      severity: "high",
      message: "Page is missing meta description",
      details: url,
    });
  } else {
    const descLength = metaDescription.length;
    if (descLength < 70) {
      issues.push({
        type: "meta-description-too-short",
        severity: "low",
        message: `Meta description is too short (${descLength} chars)`,
        details: `Description: "${metaDescription.substring(0, 100)}..."`,
      });
    } else if (descLength > 160) {
      issues.push({
        type: "meta-description-too-long",
        severity: "low",
        message: `Meta description may be truncated (${descLength} chars)`,
        details: `Description: "${metaDescription.substring(0, 100)}..."`,
      });
    }
  }

  // Canonical tag analysis
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || "";
  if (!canonical) {
    issues.push({
      type: "missing-canonical",
      severity: "medium",
      message: "Page is missing canonical tag",
      details: url,
    });
  } else {
    // Check if canonical points to different URL
    try {
      const canonicalUrl = new URL(canonical, url).href;
      if (canonicalUrl !== url) {
        issues.push({
          type: "canonical-mismatch",
          severity: "low",
          message: "Canonical URL differs from current page",
          details: `Current: ${url}\nCanonical: ${canonicalUrl}`,
        });
      }
    } catch {
      issues.push({
        type: "invalid-canonical",
        severity: "medium",
        message: "Canonical tag contains invalid URL",
        details: `Canonical: ${canonical}`,
      });
    }
  }

  // Viewport meta tag (mobile)
  const viewport = $('meta[name="viewport"]').attr("content");
  if (!viewport) {
    issues.push({
      type: "missing-viewport",
      severity: "high",
      message: "Page is missing viewport meta tag (not mobile-friendly)",
      details: url,
    });
  }

  // Charset
  const charset = $('meta[charset]').attr("charset") || $('meta[http-equiv="content-type"]').attr("content");
  if (!charset) {
    issues.push({
      type: "missing-charset",
      severity: "medium",
      message: "Page is missing charset declaration",
      details: url,
    });
  }

  // Robots meta
  const robotsMeta = $('meta[name="robots"]').attr("content") || "";
  if (robotsMeta.includes("noindex")) {
    issues.push({
      type: "noindex-meta",
      severity: "low",
      message: "Page has noindex meta tag",
      details: `Robots: ${robotsMeta}`,
    });
  }

  return issues;
}
