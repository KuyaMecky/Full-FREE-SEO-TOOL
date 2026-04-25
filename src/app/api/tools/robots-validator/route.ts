import { NextRequest, NextResponse } from "next/server";

interface RobotsResult {
  robotsUrl: string;
  content: string | null;
  issues: string[];
  sitemapUrls: string[];
  disallowedPaths: string[];
  hasSitemapRef: boolean;
  fetchError?: string;
}

interface SitemapResult {
  url: string;
  reachable: boolean;
  urlCount: number;
  issues: string[];
  fetchError?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const domain = typeof body?.domain === "string" ? body.domain.trim() : "";

  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 });

  const base = domain.startsWith("http") ? domain.replace(/\/$/, "") : `https://${domain}`;

  // ── Robots.txt ──────────────────────────────────────────────────────────
  const robotsUrl = `${base}/robots.txt`;
  const robotsResult: RobotsResult = {
    robotsUrl,
    content: null,
    issues: [],
    sitemapUrls: [],
    disallowedPaths: [],
    hasSitemapRef: false,
  };

  try {
    const res = await fetch(robotsUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
    });

    if (!res.ok) {
      robotsResult.issues.push(`robots.txt returned HTTP ${res.status}`);
      if (res.status === 404) robotsResult.issues.push("No robots.txt found — search engines crawl everything by default");
    } else {
      robotsResult.content = await res.text();
      const lines = robotsResult.content.split("\n").map(l => l.trim());

      const sitemapLines = lines.filter(l => l.toLowerCase().startsWith("sitemap:"));
      robotsResult.sitemapUrls = sitemapLines.map(l => l.split(/:\s*/, 2)[1]?.trim()).filter(Boolean) as string[];
      robotsResult.hasSitemapRef = sitemapLines.length > 0;

      const disallow = lines.filter(l => l.toLowerCase().startsWith("disallow:"));
      robotsResult.disallowedPaths = disallow.map(l => l.split(/:\s*/, 2)[1]?.trim()).filter(Boolean) as string[];

      if (!robotsResult.hasSitemapRef) robotsResult.issues.push("No Sitemap: directive in robots.txt — add one for better discoverability");
      if (robotsResult.disallowedPaths.includes("/")) robotsResult.issues.push("Disallow: / blocks all crawlers from the entire site");
      if (robotsResult.content.length > 500_000) robotsResult.issues.push("robots.txt is very large (>500KB) — may cause parsing issues");
    }
  } catch (e) {
    robotsResult.fetchError = e instanceof Error ? e.message : "Fetch failed";
    robotsResult.issues.push(`Could not fetch robots.txt: ${robotsResult.fetchError}`);
  }

  // ── Sitemap ──────────────────────────────────────────────────────────────
  const sitemapUrls = robotsResult.sitemapUrls.length > 0
    ? robotsResult.sitemapUrls.slice(0, 3)
    : [`${base}/sitemap.xml`];

  const sitemapResults: SitemapResult[] = [];

  for (const sitemapUrl of sitemapUrls) {
    const r: SitemapResult = { url: sitemapUrl, reachable: false, urlCount: 0, issues: [] };
    try {
      const res = await fetch(sitemapUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
      });
      if (!res.ok) {
        r.issues.push(`Returned HTTP ${res.status}`);
      } else {
        r.reachable = true;
        const text = await res.text();
        const urlMatches = text.match(/<loc>/g);
        r.urlCount = urlMatches?.length ?? 0;
        if (r.urlCount === 0) r.issues.push("No <loc> entries found — sitemap may be empty or malformed");
        if (r.urlCount > 50000) r.issues.push(`${r.urlCount.toLocaleString()} URLs exceeds the 50,000 limit — split into multiple sitemaps`);
        if (!text.includes("<?xml")) r.issues.push("Missing XML declaration");
        if (!text.includes("<urlset") && !text.includes("<sitemapindex")) r.issues.push("Not a valid sitemap format");
      }
    } catch (e) {
      r.fetchError = e instanceof Error ? e.message : "Fetch failed";
      r.issues.push(`Could not fetch: ${r.fetchError}`);
    }
    sitemapResults.push(r);
  }

  return NextResponse.json({ robots: robotsResult, sitemaps: sitemapResults });
}
