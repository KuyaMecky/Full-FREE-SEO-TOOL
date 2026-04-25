import { NextRequest, NextResponse } from "next/server";

interface HreflangTag { lang: string; href: string }
interface HreflangIssue { severity: "error" | "warning"; message: string }

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  const canonical = url.startsWith("http") ? url : `https://${url}`;

  let html = "";
  try {
    const res = await fetch(canonical, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SEOAuditBot/1.0)" },
    });
    if (!res.ok) return NextResponse.json({ error: `Page returned HTTP ${res.status}` }, { status: 400 });
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fetch failed" }, { status: 400 });
  }

  // Parse hreflang tags from <head>
  const tags: HreflangTag[] = [];
  const linkRe = /<link[^>]+rel=["']alternate["'][^>]*>/gi;
  const hreflangRe = /hreflang=["']([^"']+)["']/i;
  const hrefRe = /href=["']([^"']+)["']/i;

  for (const match of html.matchAll(linkRe)) {
    const tag = match[0];
    const langM = tag.match(hreflangRe);
    const hrefM = tag.match(hrefRe);
    if (langM && hrefM) tags.push({ lang: langM[1], href: hrefM[1] });
  }

  const issues: HreflangIssue[] = [];

  if (tags.length === 0) {
    issues.push({ severity: "warning", message: "No hreflang tags found on this page" });
    return NextResponse.json({ tags, issues, reciprocalChecks: [] });
  }

  // Check for x-default
  if (!tags.some(t => t.lang === "x-default")) {
    issues.push({ severity: "warning", message: 'Missing x-default hreflang tag — recommended for users in unspecified regions' });
  }

  // Check for self-referential tag
  const selfRef = tags.find(t => {
    try { return new URL(t.href).pathname === new URL(canonical).pathname && new URL(t.href).host === new URL(canonical).host; } catch { return false; }
  });
  if (!selfRef) {
    issues.push({ severity: "error", message: "Page does not include a self-referential hreflang tag" });
  }

  // Validate lang codes (basic BCP-47 check)
  for (const tag of tags) {
    if (tag.lang !== "x-default" && !/^[a-z]{2}(-[A-Z]{2})?$/.test(tag.lang)) {
      issues.push({ severity: "error", message: `Invalid language code: "${tag.lang}" — use BCP-47 format (e.g. en, en-GB)` });
    }
  }

  // Check reciprocal links (sample first 5)
  const reciprocalChecks: Array<{ url: string; lang: string; hasReciprocal: boolean; error?: string }> = [];
  for (const tag of tags.filter(t => t.lang !== "x-default").slice(0, 5)) {
    try {
      const res = await fetch(tag.href, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0" } });
      if (!res.ok) { reciprocalChecks.push({ url: tag.href, lang: tag.lang, hasReciprocal: false, error: `HTTP ${res.status}` }); continue; }
      const h = await res.text();
      const hasReciprocal = h.includes(canonical) || h.includes(new URL(canonical).pathname);
      if (!hasReciprocal) {
        issues.push({ severity: "error", message: `${tag.lang} page (${tag.href}) does not link back to this page` });
      }
      reciprocalChecks.push({ url: tag.href, lang: tag.lang, hasReciprocal });
    } catch (e) {
      reciprocalChecks.push({ url: tag.href, lang: tag.lang, hasReciprocal: false, error: e instanceof Error ? e.message : "Fetch failed" });
    }
  }

  return NextResponse.json({ tags, issues, reciprocalChecks });
}
