import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue } from "../types";

export function analyzePerformance(
  html: string,
  $: CheerioAPI,
  url: string,
  responseTime: number,
  contentLength: number
): PageIssue[] {
  const issues: PageIssue[] = [];

  // Response time check
  if (responseTime > 3000) {
    issues.push({
      type: "slow-response-time",
      severity: "high",
      message: `Page took ${responseTime}ms to load`,
      details: "Server response time should be under 200ms, total under 3s",
    });
  } else if (responseTime > 1000) {
    issues.push({
      type: "moderate-response-time",
      severity: "medium",
      message: `Page took ${responseTime}ms to load`,
      details: "Consider optimizing server response time",
    });
  }

  // Page size check
  const sizeKB = contentLength / 1024;
  if (sizeKB > 5000) {
    issues.push({
      type: "page-too-large",
      severity: "high",
      message: `Page size is ${Math.round(sizeKB)}KB`,
      details: "Large pages load slowly, especially on mobile connections",
    });
  } else if (sizeKB > 2000) {
    issues.push({
      type: "page-large",
      severity: "medium",
      message: `Page size is ${Math.round(sizeKB)}KB`,
      details: "Consider optimizing images and code",
    });
  }

  // Count resources
  const imageCount = $("img").length;
  const scriptCount = $("script").length;
  const stylesheetCount = $("link[rel='stylesheet']").length;
  const iframeCount = $("iframe").length;

  // Image count
  if (imageCount > 50) {
    issues.push({
      type: "too-many-images",
      severity: "medium",
      message: `Page has ${imageCount} images`,
      details: "Consider lazy loading or optimizing images",
    });
  }

  // Script count
  if (scriptCount > 30) {
    issues.push({
      type: "too-many-scripts",
      severity: "medium",
      message: `Page has ${scriptCount} script tags`,
      details: "Too many scripts can slow down page load",
    });
  }

  // Stylesheet count
  if (stylesheetCount > 10) {
    issues.push({
      type: "too-many-stylesheets",
      severity: "low",
      message: `Page has ${stylesheetCount} stylesheets`,
      details: "Consider combining CSS files",
    });
  }

  // Inline scripts
  const inlineScripts = $("script:not([src])").length;
  if (inlineScripts > 10) {
    issues.push({
      type: "too-many-inline-scripts",
      severity: "low",
      message: `${inlineScripts} inline scripts found`,
      details: "Consider externalizing scripts for caching",
    });
  }

  // Inline styles
  const inlineStyles = $("style").length;
  const elementsWithStyleAttr = $("[style]").length;
  if (inlineStyles > 5) {
    issues.push({
      type: "too-many-inline-styles",
      severity: "low",
      message: `${inlineStyles} inline \u003cstyle\u003e blocks found`,
      details: "Move styles to external CSS files",
    });
  }
  if (elementsWithStyleAttr > 20) {
    issues.push({
      type: "too-many-style-attributes",
      severity: "low",
      message: `${elementsWithStyleAttr} elements have inline style attributes`,
      details: "Use CSS classes instead of inline styles",
    });
  }

  // Iframe usage
  if (iframeCount > 0) {
    issues.push({
      type: "iframe-usage",
      severity: "low",
      message: `Page contains ${iframeCount} iframe(s)`,
      details: "iframes can impact performance and SEO",
    });
  }

  // HTML size without resources
  if (html.length > 100000) {
    issues.push({
      type: "large-html",
      severity: "medium",
      message: `HTML is ${(html.length / 1024).toFixed(1)}KB`,
      details: "Large HTML files increase Time to First Byte",
    });
  }

  // Check for render-blocking resources (basic check)
  const renderBlockingScripts = $("script:not([defer]):not([async])").length;
  if (renderBlockingScripts > 5) {
    issues.push({
      type: "render-blocking-scripts",
      severity: "medium",
      message: `${renderBlockingScripts} render-blocking scripts found`,
      details: "Add defer or async attributes to scripts",
    });
  }

  // Check for preconnect hints
  const hasPreconnect = $("link[rel='preconnect']").length > 0;
  if (!hasPreconnect) {
    issues.push({
      type: "missing-preconnect",
      severity: "low",
      message: "No preconnect hints found",
      details: "Use \u003clink rel='preconnect'\u003e for external domains to improve load times",
    });
  }

  // Check for DNS prefetch
  const hasDnsPrefetch = $("link[rel='dns-prefetch']").length > 0;
  if (!hasDnsPrefetch) {
    issues.push({
      type: "missing-dns-prefetch",
      severity: "low",
      message: "No DNS prefetch hints found",
      details: "Use \u003clink rel='dns-prefetch'\u003e to pre-resolve DNS",
    });
  }

  return issues;
}
