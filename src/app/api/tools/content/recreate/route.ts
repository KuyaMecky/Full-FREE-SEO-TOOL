import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeContentForRefresh } from "@/lib/ai/content";

const USER_AGENT = "SEO-Audit-Bot/1.0 (content refresh)";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    const propertyId =
      typeof body?.propertyId === "string" ? body.propertyId : "";

    if (!rawUrl) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

    // Fetch + extract
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `HTTP ${res.status} fetching the URL` },
        { status: 400 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, noscript, svg, iframe").remove();

    const title = $("title").first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "";
    const h1 = $("h1").first().text().trim();
    const headings = $("h1, h2, h3")
      .map((_, el) => {
        const level = el.tagName.toLowerCase();
        const text = $(el).text().trim();
        return text ? `${level.toUpperCase()}: ${text}` : null;
      })
      .get()
      .filter(Boolean);

    const bodySample = ($("article").text() || $("main").text() || $("body").text())
      .replace(/\s+/g, " ")
      .trim();
    const wordCount = bodySample.split(/\s+/).filter(Boolean).length;

    // Optionally attach GSC data for this URL from a connected property
    let gscQueries: Array<{
      query: string;
      impressions: number;
      clicks: number;
      position: number;
    }> = [];
    if (propertyId) {
      const property = await prisma.gscProperty.findUnique({
        where: { id: propertyId },
        include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
      });
      if (property && property.userId === session.id && property.snapshots[0]) {
        try {
          const allQueries = JSON.parse(
            property.snapshots[0].byQuery || "[]"
          ) as Array<{
            query: string;
            impressions: number;
            clicks: number;
            position: number;
          }>;
          // Heuristic: include queries that appear in URL or title
          const urlPath = (() => {
            try {
              return new URL(url).pathname.toLowerCase();
            } catch {
              return "";
            }
          })();
          const titleLower = title.toLowerCase();
          gscQueries = allQueries
            .filter((q) => {
              const qLower = q.query.toLowerCase();
              return (
                urlPath.includes(qLower.replace(/\s+/g, "-")) ||
                titleLower.includes(qLower)
              );
            })
            .slice(0, 10);
        } catch {
          // ignore
        }
      }
    }

    const refresh = await analyzeContentForRefresh({
      url,
      title,
      metaDescription,
      h1,
      headings,
      bodySample: bodySample.slice(0, 3000),
      wordCount,
      gscQueries,
    });

    return NextResponse.json({ refresh });
  } catch (err) {
    console.error("Content recreate failed:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
