import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSession } from "@/lib/auth";

interface Issue {
  severity: "high" | "medium" | "low" | "info";
  category: string;
  message: string;
  detail?: string;
}

interface OnPageReport {
  url: string;
  finalUrl: string;
  statusCode: number;
  responseTimeMs: number;
  contentLengthKb: number;
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  canonical: string;
  robots: string;
  lang: string;
  viewport: string;
  h1: string;
  h1Count: number;
  headingStructure: { level: number; text: string }[];
  wordCount: number;
  readingTimeMin: number;
  fleschReadingEase: number | null;
  linkStats: {
    total: number;
    internal: number;
    external: number;
    nofollow: number;
    missingAnchor: number;
  };
  imageStats: {
    total: number;
    missingAlt: number;
    tinyAlt: number; // alt length < 3
  };
  structuredDataTypes: string[];
  socialTags: {
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    twitterCard: string;
  };
  issues: Issue[];
  score: number; // rough out of 100
}

function computeFlesch(text: string): number | null {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
  const words = text.split(/\s+/).filter(Boolean).length;
  if (sentences === 0 || words === 0) return null;
  const syllables = text
    .split(/\s+/)
    .filter(Boolean)
    .reduce((total, w) => total + countSyllables(w), 0);
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.round(score * 10) / 10;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  const matches = word.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;
  if (/e$/.test(word)) count--;
  return Math.max(1, count);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const raw = typeof body?.url === "string" ? body.url.trim() : "";
    if (!raw) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const targetUrl = raw.startsWith("http") ? raw : `https://${raw}`;
    const startedAt = Date.now();

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "SEO-Audit-Bot/1.0 (on-page analyzer; https://github.com/seo-audit-bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });

    const responseTimeMs = Date.now() - startedAt;
    const html = await res.text();
    const contentLengthKb = Math.round(
      (new TextEncoder().encode(html).byteLength / 1024) * 10
    ) / 10;

    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "";
    const canonical = $('link[rel="canonical"]').attr("href")?.trim() || "";
    const robots = $('meta[name="robots"]').attr("content")?.trim() || "";
    const lang = $("html").attr("lang") || "";
    const viewport = $('meta[name="viewport"]').attr("content") || "";

    const h1 = $("h1").first().text().trim();
    const h1Count = $("h1").length;

    const headingStructure: { level: number; text: string }[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const level = parseInt(el.tagName.toLowerCase().replace("h", ""));
      const text = $(el).text().trim();
      if (text) headingStructure.push({ level, text });
    });

    // Body text (strip scripts/styles)
    $("script, style, noscript, svg, iframe").remove();
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const words = bodyText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const readingTimeMin = Math.max(1, Math.round(wordCount / 250));
    const flesch = wordCount > 20 ? computeFlesch(bodyText.slice(0, 8000)) : null;

    // Links
    let internal = 0;
    let external = 0;
    let nofollow = 0;
    let missingAnchor = 0;
    const finalUrlObj = new URL(res.url || targetUrl);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const rel = $(el).attr("rel") || "";
      if (rel.includes("nofollow")) nofollow++;
      const textLen = $(el).text().trim().length;
      if (textLen === 0) missingAnchor++;
      try {
        const u = new URL(href, finalUrlObj);
        if (u.hostname === finalUrlObj.hostname) internal++;
        else external++;
      } catch {
        // skip invalid
      }
    });

    // Images
    let missingAlt = 0;
    let tinyAlt = 0;
    $("img").each((_, el) => {
      const alt = $(el).attr("alt");
      if (alt == null) missingAlt++;
      else if (alt.trim().length < 3) tinyAlt++;
    });
    const imageTotal = $("img").length;

    // Structured data
    const structuredDataTypes = new Set<string>();
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const content = $(el).html() || "";
        const parsed = JSON.parse(content);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item && item["@type"]) {
            if (Array.isArray(item["@type"])) {
              item["@type"].forEach((t: string) => structuredDataTypes.add(t));
            } else {
              structuredDataTypes.add(item["@type"]);
            }
          }
          if (item && Array.isArray(item["@graph"])) {
            for (const g of item["@graph"]) {
              if (g && g["@type"]) structuredDataTypes.add(g["@type"]);
            }
          }
        }
      } catch {
        // skip malformed
      }
    });

    // Social tags
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || "";
    const ogDescription =
      $('meta[property="og:description"]').attr("content")?.trim() || "";
    const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || "";
    const twitterCard =
      $('meta[name="twitter:card"]').attr("content")?.trim() || "";

    // Issues
    const issues: Issue[] = [];
    if (res.status >= 400) {
      issues.push({
        severity: "high",
        category: "status",
        message: `Page returned HTTP ${res.status}`,
      });
    }
    if (!title) {
      issues.push({
        severity: "high",
        category: "meta",
        message: "Missing <title> tag",
      });
    } else if (title.length < 20) {
      issues.push({
        severity: "medium",
        category: "meta",
        message: `Title is short (${title.length} chars)`,
        detail: "Aim for 50-60 characters.",
      });
    } else if (title.length > 65) {
      issues.push({
        severity: "medium",
        category: "meta",
        message: `Title may be truncated in SERPs (${title.length} chars)`,
        detail: "Keep titles under 60-65 characters.",
      });
    }
    if (!metaDescription) {
      issues.push({
        severity: "high",
        category: "meta",
        message: "Missing meta description",
      });
    } else if (metaDescription.length < 50) {
      issues.push({
        severity: "medium",
        category: "meta",
        message: `Meta description is short (${metaDescription.length} chars)`,
      });
    } else if (metaDescription.length > 165) {
      issues.push({
        severity: "low",
        category: "meta",
        message: `Meta description may be truncated (${metaDescription.length} chars)`,
      });
    }
    if (!h1) {
      issues.push({
        severity: "high",
        category: "content",
        message: "Missing H1",
      });
    } else if (h1Count > 1) {
      issues.push({
        severity: "medium",
        category: "content",
        message: `Page has ${h1Count} H1 tags`,
        detail: "Use exactly one H1 per page.",
      });
    }
    if (!canonical) {
      issues.push({
        severity: "low",
        category: "meta",
        message: "No canonical link element",
      });
    }
    if (!viewport) {
      issues.push({
        severity: "high",
        category: "mobile",
        message: "No viewport meta tag",
        detail: "Page may render poorly on mobile.",
      });
    }
    if (robots.includes("noindex")) {
      issues.push({
        severity: "high",
        category: "indexing",
        message: "Page is noindex",
        detail: `robots meta: "${robots}"`,
      });
    }
    if (missingAlt > 0) {
      issues.push({
        severity: missingAlt > 5 ? "medium" : "low",
        category: "accessibility",
        message: `${missingAlt} image${missingAlt === 1 ? "" : "s"} missing alt`,
      });
    }
    if (structuredDataTypes.size === 0) {
      issues.push({
        severity: "low",
        category: "structured-data",
        message: "No JSON-LD structured data",
      });
    }
    if (wordCount < 300) {
      issues.push({
        severity: "medium",
        category: "content",
        message: `Thin content (${wordCount} words)`,
        detail: "Substantive pages should exceed 300-500 words.",
      });
    }
    if (!ogTitle || !ogImage) {
      issues.push({
        severity: "low",
        category: "social",
        message: "Missing Open Graph title or image",
      });
    }
    if (responseTimeMs > 2000) {
      issues.push({
        severity: "medium",
        category: "performance",
        message: `Slow response (${responseTimeMs}ms)`,
      });
    }

    // Crude score: start at 100, subtract weighted deductions
    const weight = { high: 15, medium: 8, low: 3, info: 0 };
    const score = Math.max(
      0,
      100 - issues.reduce((s, i) => s + weight[i.severity], 0)
    );

    const report: OnPageReport = {
      url: targetUrl,
      finalUrl: res.url || targetUrl,
      statusCode: res.status,
      responseTimeMs,
      contentLengthKb,
      title,
      titleLength: title.length,
      metaDescription,
      metaDescriptionLength: metaDescription.length,
      canonical,
      robots,
      lang,
      viewport,
      h1,
      h1Count,
      headingStructure: headingStructure.slice(0, 40),
      wordCount,
      readingTimeMin,
      fleschReadingEase: flesch,
      linkStats: {
        total: internal + external,
        internal,
        external,
        nofollow,
        missingAnchor,
      },
      imageStats: { total: imageTotal, missingAlt, tinyAlt },
      structuredDataTypes: Array.from(structuredDataTypes),
      socialTags: { ogTitle, ogDescription, ogImage, twitterCard },
      issues,
      score,
    };

    return NextResponse.json({ report });
  } catch (err) {
    console.error("On-page analyzer failed:", err);
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
