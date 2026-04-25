import { NextRequest, NextResponse } from "next/server";

export interface RedirectHop {
  url: string;
  status: number;
  location?: string;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url.trim() : "";

  if (!url || !url.startsWith("http")) {
    return NextResponse.json({ error: "A valid URL is required" }, { status: 400 });
  }

  const hops: RedirectHop[] = [];
  let current = url;
  const maxHops = 15;

  while (hops.length < maxHops) {
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)",
        },
      });
    } catch (e) {
      hops.push({ url: current, status: 0, location: `Error: ${e instanceof Error ? e.message : "fetch failed"}` });
      break;
    }

    const location = res.headers.get("location") ?? undefined;

    hops.push({ url: current, status: res.status, location });

    if (res.status >= 200 && res.status < 300) break;
    if (!location) break;

    // Resolve relative redirects
    try {
      current = new URL(location, current).toString();
    } catch {
      break;
    }
  }

  const issues: string[] = [];
  if (hops.length > 3) issues.push(`Long redirect chain (${hops.length} hops) — aim for ≤2`);
  if (hops.some(h => h.status === 302 || h.status === 307)) issues.push("Temporary redirect (302/307) found — use 301 for SEO");
  if (hops.length >= maxHops) issues.push("Possible redirect loop detected");
  const finalStatus = hops[hops.length - 1]?.status ?? 0;
  if (finalStatus === 404) issues.push("Final destination returns 404");

  return NextResponse.json({ hops, issues, finalUrl: hops[hops.length - 1]?.url ?? url });
}
