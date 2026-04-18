import { CheerioAPI } from "cheerio";
import { CrawlContext, PageIssue } from "../types";

export function analyzeSecurity(
  html: string,
  $: CheerioAPI,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];
  const urlObj = new URL(url);

  // HTTPS check
  if (urlObj.protocol !== "https:") {
    issues.push({
      type: "not-https",
      severity: "high",
      message: "Page is not served over HTTPS",
      details: `Protocol: ${urlObj.protocol}`,
    });
  }

  // Check for mixed content (HTTP resources on HTTPS page)
  if (urlObj.protocol === "https:") {
    // Check for HTTP images
    $("img[src^='http://']").each((_, el) => {
      const src = $(el).attr("src") || "";
      issues.push({
        type: "mixed-content-image",
        severity: "high",
        message: "Image loaded over HTTP on HTTPS page",
        details: `Image src: ${src}`,
      });
    });

    // Check for HTTP scripts
    $("script[src^='http://']").each((_, el) => {
      const src = $(el).attr("src") || "";
      issues.push({
        type: "mixed-content-script",
        severity: "critical",
        message: "Script loaded over HTTP on HTTPS page",
        details: `Script src: ${src}`,
      });
    });

    // Check for HTTP stylesheets
    $("link[rel='stylesheet'][href^='http://']").each((_, el) => {
      const href = $(el).attr("href") || "";
      issues.push({
        type: "mixed-content-stylesheet",
        severity: "high",
        message: "Stylesheet loaded over HTTP on HTTPS page",
        details: `Stylesheet href: ${href}`,
      });
    });

    // Check for HTTP iframes
    $("iframe[src^='http://']").each((_, el) => {
      const src = $(el).attr("src") || "";
      issues.push({
        type: "mixed-content-iframe",
        severity: "high",
        message: "Iframe loaded over HTTP on HTTPS page",
        details: `Iframe src: ${src}`,
      });
    });
  }

  // Security headers check (can't actually check headers in client-side crawling,
  // but we can check for meta tags)

  // Content Security Policy meta tag
  const csp = $('meta[http-equiv="Content-Security-Policy"]').attr("content");
  if (!csp) {
    // Not flagging this as an issue since CSP is typically set via headers
    // which we can't check in this context
  }

  // X-Frame-Options check (can't check headers, but note for reference)
  // Would require server-side header inspection

  // Check for insecure forms
  $("form[action^='http://']").each((_, el) => {
    const action = $(el).attr("action") || "";
    issues.push({
      type: "insecure-form",
      severity: "critical",
      message: "Form submits to HTTP endpoint",
      details: `Form action: ${action}`,
    });
  });

  // Check for password fields without autocomplete
  $("input[type='password']").each((_, el) => {
    const autocomplete = $(el).attr("autocomplete");
    if (!autocomplete) {
      issues.push({
        type: "password-no-autocomplete",
        severity: "low",
        message: "Password field missing autocomplete attribute",
        details: "Add autocomplete='current-password' or 'new-password'",
      });
    }
  });

  // Check for external links without rel="noopener noreferrer"
  $("a[target='_blank']").each((_, el) => {
    const rel = $(el).attr("rel") || "";
    if (!rel.includes("noopener")) {
      const href = $(el).attr("href") || "";
      issues.push({
        type: "unsafe-external-link",
        severity: "medium",
        message: "External link without noopener attribute",
        details: `Link: ${href}`,
      });
    }
  });

  return issues;
}
