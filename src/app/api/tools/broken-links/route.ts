import { NextRequest, NextResponse } from "next/server";

export interface BrokenLink {
  sourceUrl: string;
  targetUrl: string;
  statusCode: number;
  type: "internal" | "external";
  anchorText: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const siteUrl = typeof body?.siteUrl === "string" ? body.siteUrl.trim() : "";
  const maxPages = Math.min(typeof body?.maxPages === "number" ? body.maxPages : 30, 50);
  const checkExternal = body?.checkExternal !== false;

  if (!siteUrl) return NextResponse.json({ error: "siteUrl required" }, { status: 400 });

  const base = siteUrl.startsWith("http") ? siteUrl.replace(/\/$/, "") : `https://${siteUrl}`;
  let baseHost: string;
  try { baseHost = new URL(base).host; }
  catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

  const visited = new Set<string>();
  const queue = [base];
  const broken: BrokenLink[] = [];
  const checkedExternal = new Set<string>();

  while (queue.length > 0 && visited.size < maxPages) {
    const pageUrl = queue.shift()!;
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);

    let html = "";
    try {
      const res = await fetch(pageUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
      });
      if (!res.ok) continue;
      html = await res.text();
    } catch { continue; }

    // Extract all links
    const linkMatches = [...html.matchAll(/<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];

    for (const [, href, rawAnchor] of linkMatches) {
      if (!href) continue;
      const anchorText = rawAnchor.replace(/<[^>]+>/g, "").trim().slice(0, 80);

      let resolved: string;
      let isExternal = false;
      try {
        const url = new URL(href, pageUrl);
        if (url.protocol !== "http:" && url.protocol !== "https:") continue;
        resolved = url.toString().split("#")[0];
        isExternal = url.host !== baseHost;
      } catch { continue; }

      if (!isExternal) {
        // Internal link — crawl it and check status
        if (!visited.has(resolved)) queue.push(resolved);

        try {
          const r = await fetch(resolved, {
            method: "HEAD",
            signal: AbortSignal.timeout(6000),
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
            redirect: "follow",
          });
          if (r.status === 404 || r.status >= 400) {
            broken.push({ sourceUrl: pageUrl, targetUrl: resolved, statusCode: r.status, type: "internal", anchorText });
          }
        } catch {
          broken.push({ sourceUrl: pageUrl, targetUrl: resolved, statusCode: 0, type: "internal", anchorText });
        }
      } else if (checkExternal && !checkedExternal.has(resolved)) {
        checkedExternal.add(resolved);
        try {
          const r = await fetch(resolved, {
            method: "HEAD",
            signal: AbortSignal.timeout(6000),
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
            redirect: "follow",
          });
          if (r.status === 404 || r.status >= 400) {
            broken.push({ sourceUrl: pageUrl, targetUrl: resolved, statusCode: r.status, type: "external", anchorText });
          }
        } catch { /* skip external errors */ }
      }
    }

    await new Promise(r => setTimeout(r, 100));
  }

  return NextResponse.json({
    broken,
    pagesChecked: visited.size,
    internalBroken: broken.filter(b => b.type === "internal").length,
    externalBroken: broken.filter(b => b.type === "external").length,
  });
}
