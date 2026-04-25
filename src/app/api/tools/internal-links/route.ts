import { NextRequest, NextResponse } from "next/server";

interface LinkResult {
  source: string;
  targets: string[];
  incomingCount: number;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const siteUrl = typeof body?.siteUrl === "string" ? body.siteUrl.trim() : "";
  const maxPages = Math.min(typeof body?.maxPages === "number" ? body.maxPages : 50, 100);

  if (!siteUrl) return NextResponse.json({ error: "siteUrl required" }, { status: 400 });

  const base = siteUrl.replace(/\/$/, "");
  const baseHost = new URL(base.startsWith("http") ? base : `https://${base}`).host;

  const visited = new Set<string>();
  const queue: string[] = [base.startsWith("http") ? base : `https://${base}`];
  const linkMap: Record<string, Set<string>> = {};

  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
      });
      if (!res.ok) continue;
      const html = await res.text();

      const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map(m => m[1]);
      const internal: string[] = [];

      for (const href of hrefs) {
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
        try {
          const resolved = new URL(href, url).toString().split("#")[0].split("?")[0];
          const resolvedHost = new URL(resolved).host;
          if (resolvedHost === baseHost && !visited.has(resolved)) {
            queue.push(resolved);
            internal.push(resolved);
          }
        } catch { /* invalid URL */ }
      }

      linkMap[url] = new Set(internal);
    } catch { /* skip on error */ }

    await new Promise(r => setTimeout(r, 150));
  }

  // Build incoming count map
  const incomingCount: Record<string, number> = {};
  for (const [, targets] of Object.entries(linkMap)) {
    for (const t of targets) {
      incomingCount[t] = (incomingCount[t] ?? 0) + 1;
    }
  }

  const results: LinkResult[] = Object.entries(linkMap).map(([source, targets]) => ({
    source,
    targets: [...targets],
    incomingCount: incomingCount[source] ?? 0,
  })).sort((a, b) => b.targets.length - a.targets.length);

  // Find orphans (no incoming links and not the homepage)
  const allTargets = new Set(Object.values(linkMap).flatMap(s => [...s]));
  const orphans = results.filter(r => !allTargets.has(r.source) && r.source !== queue[0]).map(r => r.source);

  return NextResponse.json({ results, orphans, pageCount: visited.size });
}
