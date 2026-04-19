import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSession } from "@/lib/auth";

interface SchemaIssue {
  severity: "error" | "warning" | "info";
  type: string;
  field?: string;
  message: string;
}

interface SchemaBlock {
  index: number;
  raw: string; // the original text (truncated)
  parsed: unknown | null;
  parseError?: string;
  types: string[];
  issues: SchemaIssue[];
}

interface SchemaReport {
  url: string;
  finalUrl: string;
  statusCode: number;
  totalBlocks: number;
  totalTypes: number;
  totalIssues: number;
  blocks: SchemaBlock[];
  missingRecommendedTypes: string[]; // e.g. suggest Organization on root pages
  microdataTypes: string[];
  rdfaTypes: string[];
}

// Required fields per common schema.org type (simplified; covers Google-required)
const REQUIRED: Record<string, { required: string[]; recommended: string[] }> = {
  Article: {
    required: ["headline", "author", "datePublished"],
    recommended: ["image", "dateModified", "publisher", "mainEntityOfPage"],
  },
  NewsArticle: {
    required: ["headline", "author", "datePublished"],
    recommended: ["image", "dateModified", "publisher"],
  },
  BlogPosting: {
    required: ["headline", "author", "datePublished"],
    recommended: ["image", "dateModified", "publisher"],
  },
  Product: {
    required: ["name"],
    recommended: ["image", "description", "offers", "brand", "sku", "aggregateRating", "review"],
  },
  LocalBusiness: {
    required: ["name", "address"],
    recommended: ["telephone", "url", "image", "priceRange", "openingHours"],
  },
  Organization: {
    required: ["name"],
    recommended: ["url", "logo", "sameAs", "contactPoint"],
  },
  BreadcrumbList: {
    required: ["itemListElement"],
    recommended: [],
  },
  FAQPage: {
    required: ["mainEntity"],
    recommended: [],
  },
  Recipe: {
    required: ["name", "recipeIngredient", "recipeInstructions"],
    recommended: ["image", "totalTime", "nutrition", "author", "datePublished"],
  },
  Event: {
    required: ["name", "startDate", "location"],
    recommended: ["endDate", "image", "description", "offers", "performer"],
  },
  VideoObject: {
    required: ["name", "thumbnailUrl", "uploadDate"],
    recommended: ["description", "contentUrl", "embedUrl", "duration"],
  },
  Person: {
    required: ["name"],
    recommended: ["jobTitle", "image", "url", "sameAs"],
  },
  WebSite: {
    required: ["name", "url"],
    recommended: ["potentialAction"],
  },
  WebPage: {
    required: [],
    recommended: ["name", "url", "description"],
  },
};

function normalizeTypes(type: unknown): string[] {
  if (!type) return [];
  if (Array.isArray(type)) return type.map(String);
  return [String(type)];
}

function checkFieldsFor(
  data: Record<string, unknown>,
  typeName: string,
  issues: SchemaIssue[]
) {
  const spec = REQUIRED[typeName];
  if (!spec) return;
  for (const f of spec.required) {
    if (data[f] == null || data[f] === "") {
      issues.push({
        severity: "error",
        type: typeName,
        field: f,
        message: `${typeName} is missing required field "${f}"`,
      });
    }
  }
  for (const f of spec.recommended) {
    if (data[f] == null || data[f] === "") {
      issues.push({
        severity: "warning",
        type: typeName,
        field: f,
        message: `${typeName} is missing recommended field "${f}"`,
      });
    }
  }
  // Spot checks on nested structure
  if (typeName === "Article" || typeName === "NewsArticle" || typeName === "BlogPosting") {
    const author = data.author;
    if (author && typeof author === "object" && !Array.isArray(author)) {
      const authorName = (author as Record<string, unknown>).name;
      if (!authorName) {
        issues.push({
          severity: "error",
          type: typeName,
          field: "author.name",
          message: `Article author is present but missing "name"`,
        });
      }
    }
  }
  if (typeName === "Product") {
    const offers = data.offers;
    if (offers && typeof offers === "object" && !Array.isArray(offers)) {
      const o = offers as Record<string, unknown>;
      if (!o.price && !o.priceSpecification) {
        issues.push({
          severity: "warning",
          type: typeName,
          field: "offers.price",
          message: `Product has offers but no price`,
        });
      }
      if (!o.priceCurrency) {
        issues.push({
          severity: "warning",
          type: typeName,
          field: "offers.priceCurrency",
          message: `Product offers missing "priceCurrency"`,
        });
      }
    }
  }
  if (typeName === "FAQPage") {
    const items = data.mainEntity;
    if (Array.isArray(items)) {
      items.forEach((q: unknown, i: number) => {
        if (!q || typeof q !== "object") return;
        const qObj = q as Record<string, unknown>;
        if (!qObj.name) {
          issues.push({
            severity: "error",
            type: typeName,
            field: `mainEntity[${i}].name`,
            message: `FAQ question #${i + 1} missing "name"`,
          });
        }
        const answer = qObj.acceptedAnswer;
        if (!answer) {
          issues.push({
            severity: "error",
            type: typeName,
            field: `mainEntity[${i}].acceptedAnswer`,
            message: `FAQ question #${i + 1} missing "acceptedAnswer"`,
          });
        } else if (typeof answer === "object") {
          const aObj = answer as Record<string, unknown>;
          if (!aObj.text) {
            issues.push({
              severity: "error",
              type: typeName,
              field: `mainEntity[${i}].acceptedAnswer.text`,
              message: `FAQ answer #${i + 1} missing "text"`,
            });
          }
        }
      });
    }
  }
}

function walkAndCheck(node: unknown, issues: SchemaIssue[], allTypes: Set<string>) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const n of node) walkAndCheck(n, issues, allTypes);
    return;
  }
  const obj = node as Record<string, unknown>;
  const types = normalizeTypes(obj["@type"]);
  types.forEach((t) => allTypes.add(t));
  for (const t of types) {
    checkFieldsFor(obj, t, issues);
  }
  // Walk nested @graph arrays
  if (Array.isArray(obj["@graph"])) {
    walkAndCheck(obj["@graph"], issues, allTypes);
  }
  // Walk other object fields
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") walkAndCheck(v, issues, allTypes);
  }
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
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "SEO-Audit-Bot/1.0 (schema checker; https://github.com/seo-audit-bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const blocks: SchemaBlock[] = [];
    const allTypes = new Set<string>();

    $('script[type="application/ld+json"]').each((i, el) => {
      const content = $(el).html() || "";
      const block: SchemaBlock = {
        index: i,
        raw: content.trim().slice(0, 2000),
        parsed: null,
        types: [],
        issues: [],
      };
      try {
        const parsed = JSON.parse(content);
        block.parsed = parsed;
        const localIssues: SchemaIssue[] = [];
        const localTypes = new Set<string>();
        walkAndCheck(parsed, localIssues, localTypes);
        block.issues = localIssues;
        block.types = Array.from(localTypes);
        localTypes.forEach((t) => allTypes.add(t));
        if (localTypes.size === 0) {
          block.issues.push({
            severity: "warning",
            type: "(none)",
            message: 'No "@type" found in this block',
          });
        }
      } catch (err) {
        block.parseError =
          err instanceof Error ? err.message : "Invalid JSON";
        block.issues.push({
          severity: "error",
          type: "(invalid)",
          message: `Block is not valid JSON-LD: ${block.parseError}`,
        });
      }
      blocks.push(block);
    });

    // Detect microdata + RDFa presence
    const microdataTypes = new Set<string>();
    $("[itemtype]").each((_, el) => {
      const itemtype = $(el).attr("itemtype") || "";
      const match = itemtype.match(/schema\.org\/(\w+)/);
      if (match) microdataTypes.add(match[1]);
    });
    const rdfaTypes = new Set<string>();
    $("[typeof]").each((_, el) => {
      const t = $(el).attr("typeof") || "";
      t.split(/\s+/).forEach((x) => {
        if (x) rdfaTypes.add(x);
      });
    });

    // Suggest missing recommended types (simple heuristic)
    const missingRecommendedTypes: string[] = [];
    const hasTop = (name: string) =>
      Array.from(allTypes).some((t) => t === name);
    // Homepage-ish heuristics
    try {
      const finalUrl = new URL(res.url || targetUrl);
      if (finalUrl.pathname === "/" || finalUrl.pathname === "") {
        if (!hasTop("Organization") && !hasTop("LocalBusiness")) {
          missingRecommendedTypes.push("Organization");
        }
        if (!hasTop("WebSite")) missingRecommendedTypes.push("WebSite");
      }
      // Almost every page benefits from breadcrumbs
      if (!hasTop("BreadcrumbList")) {
        missingRecommendedTypes.push("BreadcrumbList");
      }
    } catch {
      // ignore
    }

    const totalIssues = blocks.reduce((s, b) => s + b.issues.length, 0);

    const report: SchemaReport = {
      url: targetUrl,
      finalUrl: res.url || targetUrl,
      statusCode: res.status,
      totalBlocks: blocks.length,
      totalTypes: allTypes.size,
      totalIssues,
      blocks,
      missingRecommendedTypes,
      microdataTypes: Array.from(microdataTypes),
      rdfaTypes: Array.from(rdfaTypes),
    };

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Schema check failed:", err);
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
