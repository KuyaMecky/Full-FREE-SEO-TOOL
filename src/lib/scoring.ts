import { CrawlResult, FindingData, ScoreCard } from "@/types/audit";

// Issue weights by severity
const SEVERITY_WEIGHTS = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 2,
};

// Maximum possible score per category
const CATEGORY_MAX_SCORE = 100;

// Number of issues that would result in minimum score for category
const MAX_ISSUES_BEFORE_MIN = 15;

interface IssueCategory {
  type: string;
  category: keyof ScoreCard;
  severity: "critical" | "high" | "medium" | "low";
}

// Map issue types to categories
const ISSUE_CATEGORIES: Record<string, IssueCategory> = {
  // Technical SEO issues
  "missing-robots-txt": { type: "technical", category: "technical", severity: "medium" },
  "robots-missing-sitemap": { type: "technical", category: "technical", severity: "low" },
  "missing-sitemap": { type: "technical", category: "technical", severity: "medium" },
  "empty-sitemap": { type: "technical", category: "technical", severity: "high" },
  "sitemap-too-large": { type: "technical", category: "technical", severity: "medium" },
  "stale-sitemap-urls": { type: "technical", category: "technical", severity: "low" },
  "sitemap-missing-lastmod": { type: "technical", category: "technical", severity: "low" },
  "missing-canonical": { type: "technical", category: "technical", severity: "medium" },
  "canonical-mismatch": { type: "technical", category: "technical", severity: "low" },
  "invalid-canonical": { type: "technical", category: "technical", severity: "medium" },
  "not-https": { type: "technical", category: "technical", severity: "critical" },
  "mixed-content-image": { type: "technical", category: "technical", severity: "high" },
  "mixed-content-script": { type: "technical", category: "technical", severity: "critical" },
  "mixed-content-stylesheet": { type: "technical", category: "technical", severity: "high" },
  "mixed-content-iframe": { type: "technical", category: "technical", severity: "high" },
  "insecure-form": { type: "technical", category: "technical", severity: "critical" },
  "invalid-structured-data": { type: "technical", category: "technical", severity: "medium" },

  // On-page SEO issues
  "missing-title": { type: "on-page", category: "onPage", severity: "critical" },
  "title-too-short": { type: "on-page", category: "onPage", severity: "medium" },
  "title-too-long": { type: "on-page", category: "onPage", severity: "medium" },
  "missing-meta-description": { type: "on-page", category: "onPage", severity: "high" },
  "meta-description-too-short": { type: "on-page", category: "onPage", severity: "low" },
  "meta-description-too-long": { type: "on-page", category: "onPage", severity: "low" },
  "missing-h1": { type: "on-page", category: "onPage", severity: "high" },
  "multiple-h1": { type: "on-page", category: "onPage", severity: "medium" },
  "h1-too-long": { type: "on-page", category: "onPage", severity: "low" },
  "h1-too-short": { type: "on-page", category: "onPage", severity: "low" },
  "skipped-heading-level": { type: "on-page", category: "onPage", severity: "low" },
  "first-heading-not-h1": { type: "on-page", category: "onPage", severity: "medium" },
  "empty-heading": { type: "on-page", category: "onPage", severity: "medium" },
  "no-headings": { type: "on-page", category: "onPage", severity: "high" },
  "missing-viewport": { type: "on-page", category: "onPage", severity: "high" },
  "missing-charset": { type: "on-page", category: "onPage", severity: "medium" },
  "images-without-alt": { type: "on-page", category: "onPage", severity: "high" },
  "empty-alt-text": { type: "on-page", category: "onPage", severity: "medium" },
  "noindex-meta": { type: "on-page", category: "onPage", severity: "low" },
  "empty-link-href": { type: "on-page", category: "onPage", severity: "medium" },
  "no-internal-links": { type: "on-page", category: "onPage", severity: "medium" },
  "too-many-links": { type: "on-page", category: "onPage", severity: "low" },
  "nofollow-internal-links": { type: "on-page", category: "onPage", severity: "low" },
  "generic-link-text": { type: "on-page", category: "onPage", severity: "low" },

  // Content issues
  "no-structured-data": { type: "content", category: "content", severity: "medium" },
  "missing-breadcrumb-structured-data": { type: "content", category: "content", severity: "low" },
  "missing-organization-structured-data": { type: "content", category: "content", severity: "low" },
  "missing-og-title": { type: "content", category: "content", severity: "low" },
  "missing-og-description": { type: "content", category: "content", severity: "low" },
  "missing-og-image": { type: "content", category: "content", severity: "low" },
  "missing-twitter-card": { type: "content", category: "content", severity: "low" },

  // UX/Performance issues
  "slow-response-time": { type: "performance", category: "uxPerformance", severity: "high" },
  "moderate-response-time": { type: "performance", category: "uxPerformance", severity: "medium" },
  "page-too-large": { type: "performance", category: "uxPerformance", severity: "high" },
  "page-large": { type: "performance", category: "uxPerformance", severity: "medium" },
  "too-many-images": { type: "performance", category: "uxPerformance", severity: "medium" },
  "too-many-scripts": { type: "performance", category: "uxPerformance", severity: "medium" },
  "too-many-stylesheets": { type: "performance", category: "uxPerformance", severity: "low" },
  "too-many-inline-scripts": { type: "performance", category: "uxPerformance", severity: "low" },
  "too-many-inline-styles": { type: "performance", category: "uxPerformance", severity: "low" },
  "too-many-style-attributes": { type: "performance", category: "uxPerformance", severity: "low" },
  "iframe-usage": { type: "performance", category: "uxPerformance", severity: "low" },
  "large-html": { type: "performance", category: "uxPerformance", severity: "medium" },
  "render-blocking-scripts": { type: "performance", category: "uxPerformance", severity: "medium" },
  "missing-preconnect": { type: "performance", category: "uxPerformance", severity: "low" },
  "missing-dns-prefetch": { type: "performance", category: "uxPerformance", severity: "low" },
  "missing-image-dimensions": { type: "performance", category: "uxPerformance", severity: "low" },
  "relative-image-path": { type: "performance", category: "uxPerformance", severity: "low" },
  "no-lazy-loading": { type: "performance", category: "uxPerformance", severity: "low" },
  "password-no-autocomplete": { type: "performance", category: "uxPerformance", severity: "low" },
  "unsafe-external-link": { type: "performance", category: "uxPerformance", severity: "medium" },
};

export function calculateScores(crawlResults: CrawlResult[]): ScoreCard {
  // Collect all issues
  const allIssues: { type: string; category: keyof ScoreCard; severity: "critical" | "high" | "medium" | "low" }[] = [];

  for (const result of crawlResults) {
    for (const issue of result.issues) {
      const mapping = ISSUE_CATEGORIES[issue.type];
      if (mapping) {
        allIssues.push({
          type: issue.type,
          category: mapping.category,
          severity: issue.severity,
        });
      }
    }
  }

  // Count issues per category
  const issuesByCategory = {
    technical: allIssues.filter((i) => i.category === "technical"),
    onPage: allIssues.filter((i) => i.category === "onPage"),
    content: allIssues.filter((i) => i.category === "content"),
    uxPerformance: allIssues.filter((i) => i.category === "uxPerformance"),
  };

  // Calculate scores for each category
  const technical = calculateCategoryScore(issuesByCategory.technical);
  const onPage = calculateCategoryScore(issuesByCategory.onPage);
  const content = calculateCategoryScore(issuesByCategory.content);
  const uxPerformance = calculateCategoryScore(issuesByCategory.uxPerformance);

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (technical * 0.3 + onPage * 0.3 + content * 0.2 + uxPerformance * 0.2)
  );

  return {
    overall,
    technical,
    onPage,
    content,
    uxPerformance,
  };
}

function calculateCategoryScore(
  issues: { severity: "critical" | "high" | "medium" | "low" }[]
): number {
  if (issues.length === 0) {
    return 100;
  }

  // Calculate total penalty
  let totalPenalty = 0;
  for (const issue of issues) {
    totalPenalty += SEVERITY_WEIGHTS[issue.severity];
  }

  // Apply diminishing returns for many issues
  const uniqueIssueTypes = new Set(issues.map((i) => i.severity)).size;
  const penaltyMultiplier = Math.min(1 + (issues.length - uniqueIssueTypes) * 0.1, 2);

  const adjustedPenalty = totalPenalty * penaltyMultiplier;

  // Calculate score
  const score = Math.max(
    10, // Minimum score of 10
    CATEGORY_MAX_SCORE - (adjustedPenalty / MAX_ISSUES_BEFORE_MIN) * CATEGORY_MAX_SCORE
  );

  return Math.round(score);
}

export function generateFindings(crawlResults: CrawlResult[]): FindingData[] {
  const findings: Map<string, FindingData> = new Map();

  for (const result of crawlResults) {
    for (const issue of result.issues) {
      const mapping = ISSUE_CATEGORIES[issue.type];
      if (!mapping) continue;

      const existing = findings.get(issue.type);
      if (existing) {
        // Add URL to affected list
        if (!existing.affectedUrls.includes(result.url)) {
          existing.affectedUrls.push(result.url);
        }
      } else {
        // Create new finding
        findings.set(issue.type, {
          category: mapping.category,
          issue: formatIssueName(issue.type),
          evidence: issue.details || issue.message,
          affectedUrls: [result.url],
          severity: issue.severity,
          impact: getIssueImpact(issue.type, issue.severity),
          recommendedFix: getIssueFix(issue.type),
          owner: getIssueOwner(issue.type),
          effort: getIssueEffort(issue.type),
          priority: SEVERITY_WEIGHTS[issue.severity],
        });
      }
    }
  }

  // Sort by priority (descending)
  return Array.from(findings.values()).sort((a, b) => b.priority - a.priority);
}

function formatIssueName(type: string): string {
  return type
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function getIssueImpact(type: string, severity: string): string {
  const impacts: Record<string, string> = {
    critical: "Significant negative impact on search visibility and user experience",
    high: "Major impact on SEO performance or user accessibility",
    medium: "Moderate impact that should be addressed",
    low: "Minor optimization opportunity",
  };

  return impacts[severity] || "Unknown impact";
}

function getIssueFix(type: string): string {
  const fixes: Record<string, string> = {
    "missing-title": "Add a descriptive title tag (50-60 characters) to all pages",
    "title-too-short": "Expand title to be at least 30 characters",
    "title-too-long": "Shorten title to under 60 characters to prevent truncation",
    "missing-meta-description": "Add a compelling meta description (150-160 characters)",
    "meta-description-too-short": "Expand description to at least 70 characters",
    "meta-description-too-long": "Shorten description to under 160 characters",
    "missing-h1": "Add an H1 heading that describes the page content",
    "multiple-h1": "Consolidate to a single H1 per page",
    "missing-canonical": "Add a canonical tag to prevent duplicate content issues",
    "images-without-alt": "Add descriptive alt text to all images for accessibility and SEO",
    "missing-robots-txt": "Create and upload a robots.txt file to the domain root",
    "missing-sitemap": "Create and submit an XML sitemap to search engines",
    "not-https": "Migrate site to HTTPS using an SSL certificate",
    "missing-viewport": "Add viewport meta tag for mobile responsiveness",
    "slow-response-time": "Optimize server response time through caching or infrastructure improvements",
    "page-too-large": "Compress images, minify CSS/JS, and remove unused code",
    "no-structured-data": "Add Schema.org JSON-LD structured data markup",
  };

  return fixes[type] || "Review and fix according to SEO best practices";
}

function getIssueOwner(type: string): string {
  const owners: Record<string, string> = {
    "missing-title": "marketing",
    "missing-meta-description": "marketing",
    "missing-h1": "marketing",
    "images-without-alt": "content",
    "missing-robots-txt": "dev",
    "missing-sitemap": "dev",
    "not-https": "dev",
    "missing-viewport": "dev",
    "slow-response-time": "dev",
    "page-too-large": "dev",
    "no-structured-data": "dev",
  };

  return owners[type] || "dev";
}

function getIssueEffort(type: string): string {
  const efforts: Record<string, string> = {
    "missing-title": "low",
    "missing-meta-description": "low",
    "missing-h1": "low",
    "images-without-alt": "medium",
    "missing-robots-txt": "low",
    "missing-sitemap": "low",
    "not-https": "high",
    "missing-viewport": "low",
    "slow-response-time": "high",
    "page-too-large": "medium",
    "no-structured-data": "medium",
  };

  return efforts[type] || "medium";
}
