import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue, StructuredDataItem } from "../types";

export function analyzeStructuredData(
  html: string,
  $: CheerioAPI,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];

  // Extract JSON-LD structured data
  const structuredData: StructuredDataItem[] = [];
  $("script[type='application/ld+json']").each((_, el) => {
    const content = $(el).html() || "";
    try {
      const data = JSON.parse(content);
      const type = data["@type"] || data["@graph"]?.[0]?.["@type"] || "Unknown";
      structuredData.push({ type, data });
    } catch {
      issues.push({
        type: "invalid-structured-data",
        severity: "medium",
        message: "Invalid JSON-LD structured data found",
        details: content.substring(0, 200),
      });
    }
  });

  // Check for common structured data types
  const hasBreadcrumb = structuredData.some(
    (item) =>
      item.type === "BreadcrumbList" ||
      (Array.isArray(item.data["@graph"]) &&
        item.data["@graph"].some((g: { "@type": string }) => g["@type"] === "BreadcrumbList"))
  );

  const hasOrganization = structuredData.some(
    (item) =>
      item.type === "Organization" ||
      item.type === "WebSite" ||
      (Array.isArray(item.data["@graph"]) &&
        item.data["@graph"].some(
          (g: { "@type": string }) =>
            g["@type"] === "Organization" || g["@type"] === "WebSite"
        ))
  );

  const hasWebPage = structuredData.some(
    (item) =>
      item.type === "WebPage" ||
      (Array.isArray(item.data["@graph"]) &&
        item.data["@graph"].some((g: { "@type": string }) => g["@type"] === "WebPage"))
  );

  // Check for structured data presence
  if (structuredData.length === 0) {
    issues.push({
      type: "no-structured-data",
      severity: "medium",
      message: "No JSON-LD structured data found",
      details: "Consider adding Schema.org markup for better search visibility",
    });
  }

  // Recommend breadcrumb if not present
  if (!hasBreadcrumb) {
    issues.push({
      type: "missing-breadcrumb-structured-data",
      severity: "low",
      message: "No BreadcrumbList structured data found",
      details: "Breadcrumb structured data helps search engines understand site hierarchy",
    });
  }

  // Recommend Organization/WebSite if not present
  if (!hasOrganization) {
    issues.push({
      type: "missing-organization-structured-data",
      severity: "low",
      message: "No Organization/WebSite structured data found",
      details: "Organization structured data helps with brand knowledge panel",
    });
  }

  // Check for Open Graph tags
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const ogDescription = $('meta[property="og:description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");

  if (!ogTitle) {
    issues.push({
      type: "missing-og-title",
      severity: "low",
      message: "Missing Open Graph title tag",
      details: "og:title helps social sharing",
    });
  }

  if (!ogDescription) {
    issues.push({
      type: "missing-og-description",
      severity: "low",
      message: "Missing Open Graph description tag",
      details: "og:description helps social sharing",
    });
  }

  if (!ogImage) {
    issues.push({
      type: "missing-og-image",
      severity: "low",
      message: "Missing Open Graph image tag",
      details: "og:image is important for social media sharing",
    });
  }

  // Check for Twitter Card tags
  const twitterCard = $('meta[name="twitter:card"]').attr("content");
  if (!twitterCard) {
    issues.push({
      type: "missing-twitter-card",
      severity: "low",
      message: "Missing Twitter Card meta tag",
      details: "twitter:card enables Twitter rich snippets",
    });
  }

  return issues;
}

export function extractStructuredData($: CheerioAPI): StructuredDataItem[] {
  const items: StructuredDataItem[] = [];

  $("script[type='application/ld+json']").each((_, el) => {
    const content = $(el).html() || "";
    try {
      const data = JSON.parse(content);
      const type = data["@type"] || "Unknown";
      items.push({ type, data });
    } catch {
      // Invalid JSON-LD
    }
  });

  return items;
}
