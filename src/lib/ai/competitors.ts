import * as cheerio from "cheerio";
import { generateText } from "./provider";

export interface CompetitorSnapshot {
  domain: string;
  homepageUrl: string;
  title: string;
  metaDescription: string;
  h1: string;
  h2s: string[];
  navLinks: string[]; // text of primary nav links
  bodySample: string; // first ~1500 chars of visible text
  error?: string;
}

export interface CompetitorInsight {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
  themes: string[];
  differentiators: string[];
}

export interface CompetitorReport {
  snapshots: CompetitorSnapshot[];
  insights: CompetitorInsight[];
  gapAnalysis: {
    themesCompetitorsCoverYouDont: string[];
    themesYouCoverCompetitorsDont: string[];
    quickContentWins: {
      title: string;
      format: string;
      rationale: string;
    }[];
    positioningRecommendations: string[];
  };
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  return `https://${trimmed}`;
}

function extractText($: cheerio.CheerioAPI, selector: string): string {
  return $(selector).map((_, el) => $(el).text().trim()).get().filter(Boolean).join(" ");
}

export async function fetchCompetitorSnapshot(
  rawUrl: string
): Promise<CompetitorSnapshot> {
  const url = normalizeUrl(rawUrl);
  const domain = url.replace(/^https?:\/\//, "").split("/")[0];

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "SEO-Audit-Bot/1.0 (competitor analysis; https://github.com/seo-audit-bot)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });

    if (!res.ok) {
      return {
        domain,
        homepageUrl: url,
        title: "",
        metaDescription: "",
        h1: "",
        h2s: [],
        navLinks: [],
        bodySample: "",
        error: `HTTP ${res.status}`,
      };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Strip noise
    $("script, style, noscript, svg, iframe").remove();

    const title = $("title").first().text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() || "";
    const h1 = $("h1").first().text().trim();
    const h2s = $("h2")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 12);
    const navLinks = $("header a, nav a")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t && t.length < 40)
      .slice(0, 20);

    // Grab visible body text
    const bodySample = extractText($, "main, article, section, p, li")
      .replace(/\s+/g, " ")
      .slice(0, 1500);

    return {
      domain,
      homepageUrl: url,
      title,
      metaDescription,
      h1,
      h2s,
      navLinks,
      bodySample,
    };
  } catch (err) {
    return {
      domain,
      homepageUrl: url,
      title: "",
      metaDescription: "",
      h1: "",
      h2s: [],
      navLinks: [],
      bodySample: "",
      error: err instanceof Error ? err.message : "Fetch failed",
    };
  }
}

export async function analyzeCompetitors(input: {
  yourDomain: string;
  yourBusinessType?: string;
  yourGoals?: string[];
  yourSnapshot?: CompetitorSnapshot; // optional, for comparison
  competitors: CompetitorSnapshot[];
}): Promise<CompetitorReport> {
  const { yourDomain, yourBusinessType, yourGoals = [], yourSnapshot, competitors } = input;

  const valid = competitors.filter((c) => !c.error);

  if (valid.length === 0) {
    return {
      snapshots: competitors,
      insights: [],
      gapAnalysis: {
        themesCompetitorsCoverYouDont: [],
        themesYouCoverCompetitorsDont: [],
        quickContentWins: [],
        positioningRecommendations: [
          "No competitor pages could be fetched. Verify the domains are correct and reachable.",
        ],
      },
    };
  }

  const systemPrompt = `You are an SEO and content strategist. Given data scraped from a site and its competitors, produce a concrete competitive gap analysis. Return valid JSON matching the schema — no markdown fences, no commentary.

Rules:
- Ground every claim in the snapshot text. Do not invent facts you cannot see.
- "themes" means content topics the competitor visibly covers (from their H1/H2s/nav).
- "quickContentWins" are specific article or page ideas the user could create to close gaps.
- Be specific and concrete. Avoid SEO platitudes.`;

  const yoursBlock = yourSnapshot
    ? formatSnapshot(yourSnapshot, "YOUR SITE")
    : `YOUR SITE
- Domain: ${yourDomain}
- Business type: ${yourBusinessType || "(not specified)"}
- Goals: ${yourGoals.length ? yourGoals.join(", ") : "(not specified)"}
(Homepage not fetched — rely on context above.)`;

  const userPrompt = `${yoursBlock}

COMPETITORS:
${valid.map((c, i) => formatSnapshot(c, `COMPETITOR ${i + 1}`)).join("\n\n")}

Return JSON with this exact shape:
{
  "insights": [
    {
      "competitor": string,
      "strengths": [ string ],
      "weaknesses": [ string ],
      "themes": [ string ],
      "differentiators": [ string ]
    }
  ],
  "gapAnalysis": {
    "themesCompetitorsCoverYouDont": [ string ],
    "themesYouCoverCompetitorsDont": [ string ],
    "quickContentWins": [
      { "title": string, "format": string, "rationale": string }
    ],
    "positioningRecommendations": [ string ]
  }
}

Give up to 4 strengths/weaknesses/themes/differentiators per competitor. Provide 3-8 items per gapAnalysis array. Return ONLY the JSON object.`;

  const text = await generateText({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 2000,
  });

  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as {
    insights?: CompetitorInsight[];
    gapAnalysis?: CompetitorReport["gapAnalysis"];
  };

  return {
    snapshots: competitors,
    insights: parsed.insights ?? [],
    gapAnalysis: parsed.gapAnalysis ?? {
      themesCompetitorsCoverYouDont: [],
      themesYouCoverCompetitorsDont: [],
      quickContentWins: [],
      positioningRecommendations: [],
    },
  };
}

function formatSnapshot(s: CompetitorSnapshot, label: string): string {
  return `${label}
- Domain: ${s.domain}
- Title: "${s.title}"
- Meta description: "${s.metaDescription}"
- H1: "${s.h1}"
- H2 sample: ${s.h2s.slice(0, 8).map((h) => `"${h}"`).join(", ") || "(none)"}
- Nav: ${s.navLinks.slice(0, 10).join(" / ") || "(none)"}
- Body sample: "${s.bodySample.slice(0, 800)}"`;
}
