import { CrawlContext, PageIssue } from "../types";

export async function fetchAndParseRobotsTxt(
  baseUrl: string
): Promise<{ sitemaps: string[]; disallowed: string[]; allowed: string[] } | null> {
  try {
    const urlObj = new URL(baseUrl);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: {
        "User-Agent": "SEO-Audit-Bot/1.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    const content = await response.text();
    return parseRobotsTxt(content);
  } catch {
    return null;
  }
}

export function parseRobotsTxt(content: string): {
  sitemaps: string[];
  disallowed: string[];
  allowed: string[];
} {
  const lines = content.split("\n");
  const sitemaps: string[] = [];
  const disallowed: string[] = [];
  const allowed: string[] = [];

  let currentUserAgent = "*";

  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Parse directives
    if (trimmed.startsWith("user-agent:")) {
      currentUserAgent = trimmed.substring(11).trim();
    } else if (currentUserAgent === "*" || currentUserAgent.includes("bot")) {
      if (trimmed.startsWith("disallow:")) {
        const path = trimmed.substring(9).trim();
        if (path) disallowed.push(path);
      } else if (trimmed.startsWith("allow:")) {
        const path = trimmed.substring(6).trim();
        if (path) allowed.push(path);
      } else if (trimmed.startsWith("sitemap:")) {
        const sitemapUrl = line.trim().substring(8).trim();
        if (sitemapUrl) sitemaps.push(sitemapUrl);
      }
    }
  }

  return { sitemaps, disallowed, allowed };
}

export function analyzeRobotsTxt(
  robotsData: { sitemaps: string[]; disallowed: string[]; allowed: string[] } | null,
  url: string,
  context: CrawlContext
): PageIssue[] {
  const issues: PageIssue[] = [];

  if (!robotsData) {
    issues.push({
      type: "missing-robots-txt",
      severity: "medium",
      message: "robots.txt file not found",
      details: "robots.txt should exist at domain root",
    });
    return issues;
  }

  // Check for sitemap reference
  if (robotsData.sitemaps.length === 0) {
    issues.push({
      type: "robots-missing-sitemap",
      severity: "low",
      message: "robots.txt doesn't reference sitemap",
      details: "Add Sitemap directive to help search engines discover your sitemap",
    });
  }

  // Check if current URL is disallowed
  const urlPath = new URL(url).pathname;
  const isDisallowed = robotsData.disallowed.some((path) =>
    urlPath.startsWith(path)
  );

  if (isDisallowed) {
    issues.push({
      type: "url-disallowed",
      severity: "high",
      message: "Current URL is disallowed in robots.txt",
      details: `Path: ${urlPath}`,
    });
  }

  return issues;
}

export function checkUrlInRobotsTxt(
  url: string,
  disallowedPaths: string[]
): boolean {
  const urlPath = new URL(url).pathname;
  return disallowedPaths.some((path) =>
    urlPath.startsWith(path) || urlPath === path
  );
}
