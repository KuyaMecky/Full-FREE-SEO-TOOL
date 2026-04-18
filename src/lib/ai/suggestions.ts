import { QueryRow, PageRow, SnapshotData } from "@/lib/gsc/types";
import { generateText } from "./provider";

export interface RankOpportunity {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface CtrOpportunity {
  query: string;
  position: number;
  impressions: number;
  ctr: number;
  medianCtrForBucket: number;
}

export interface PageOpportunity {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface Opportunities {
  rankOpportunities: RankOpportunity[];
  ctrOpportunities: CtrOpportunity[];
  underOptimizedPages: PageOpportunity[];
}

export interface SuggestionsOutput {
  titleRewrites: {
    query: string;
    targetPage: string;
    currentPosition: number;
    suggestedTitle: string;
    rationale: string;
  }[];
  contentAngles: {
    query: string;
    angle: string;
    rationale: string;
  }[];
  internalLinkIdeas: {
    fromPage: string;
    toPage: string;
    anchorText: string;
    rationale: string;
  }[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function positionBucket(position: number): string {
  if (position <= 3) return "1-3";
  if (position <= 10) return "4-10";
  if (position <= 20) return "11-20";
  return "21+";
}

export function computeOpportunities(snapshot: SnapshotData): Opportunities {
  const { byQuery, byPage } = snapshot;

  const rankOpportunities: RankOpportunity[] = byQuery
    .filter(
      (q) => q.position >= 11 && q.position <= 20 && q.impressions >= 50
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10)
    .map((q) => ({
      query: q.query,
      position: q.position,
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: q.ctr,
    }));

  const byBucket = new Map<string, QueryRow[]>();
  for (const q of byQuery) {
    const b = positionBucket(q.position);
    if (!byBucket.has(b)) byBucket.set(b, []);
    byBucket.get(b)!.push(q);
  }
  const medianCtrByBucket = new Map<string, number>();
  for (const [b, rows] of byBucket) {
    medianCtrByBucket.set(
      b,
      median(rows.filter((r) => r.impressions >= 20).map((r) => r.ctr))
    );
  }

  const ctrOpportunities: CtrOpportunity[] = byQuery
    .filter((q) => q.impressions >= 100 && q.position <= 20)
    .map((q) => {
      const bucket = positionBucket(q.position);
      const medianCtr = medianCtrByBucket.get(bucket) ?? 0;
      return {
        query: q.query,
        position: q.position,
        impressions: q.impressions,
        ctr: q.ctr,
        medianCtrForBucket: medianCtr,
      };
    })
    .filter(
      (q) => q.medianCtrForBucket > 0 && q.ctr <= q.medianCtrForBucket * 0.5
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  const topPages = [...byPage]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);
  const pageCtrMedian = median(topPages.map((p) => p.ctr));

  const underOptimizedPages: PageOpportunity[] = topPages
    .filter((p) => pageCtrMedian > 0 && p.ctr < pageCtrMedian)
    .slice(0, 10)
    .map((p) => ({
      page: p.page,
      impressions: p.impressions,
      clicks: p.clicks,
      ctr: p.ctr,
      position: p.position,
    }));

  return { rankOpportunities, ctrOpportunities, underOptimizedPages };
}

export async function generateSuggestions(
  opportunities: Opportunities,
  propertyUrl: string
): Promise<SuggestionsOutput> {
  const { rankOpportunities, ctrOpportunities, underOptimizedPages } =
    opportunities;

  const systemPrompt = `You are an expert SEO consultant. Given Google Search Console opportunity data for a single site, produce specific, actionable suggestions. Be concrete — rewrite titles, propose content angles, suggest internal link anchors. Do not give generic advice. Always return valid JSON matching the requested schema exactly, with no extra commentary.`;

  const userPrompt = `Property: ${propertyUrl}

RANK OPPORTUNITIES (queries on page 2 — position 11-20 — with real impressions):
${
  rankOpportunities.length === 0
    ? "(none)"
    : rankOpportunities
        .map(
          (q) =>
            `- "${q.query}": position ${q.position.toFixed(1)}, ${q.impressions} impressions, ${q.clicks} clicks, CTR ${(q.ctr * 100).toFixed(2)}%`
        )
        .join("\n")
}

LOW-CTR QUERIES (CTR is ≤50% of median for queries in the same position bucket):
${
  ctrOpportunities.length === 0
    ? "(none)"
    : ctrOpportunities
        .map(
          (q) =>
            `- "${q.query}": position ${q.position.toFixed(1)}, CTR ${(q.ctr * 100).toFixed(2)}% vs ${(q.medianCtrForBucket * 100).toFixed(2)}% median, ${q.impressions} impressions`
        )
        .join("\n")
}

UNDER-OPTIMIZED PAGES (top pages with below-median CTR):
${
  underOptimizedPages.length === 0
    ? "(none)"
    : underOptimizedPages
        .map(
          (p) =>
            `- ${p.page}: ${p.impressions} impressions, CTR ${(p.ctr * 100).toFixed(2)}%, avg position ${p.position.toFixed(1)}`
        )
        .join("\n")
}

Produce JSON with this exact shape:
{
  "titleRewrites": [ { "query": string, "targetPage": string, "currentPosition": number, "suggestedTitle": string, "rationale": string } ],
  "contentAngles": [ { "query": string, "angle": string, "rationale": string } ],
  "internalLinkIdeas": [ { "fromPage": string, "toPage": string, "anchorText": string, "rationale": string } ]
}

Produce up to 5 items per category. For titleRewrites, infer targetPage from the pages list above (pick the most relevant). If there's no data for a category, return an empty array for it. Return ONLY the JSON object.`;

  const text = await generateText({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 2000,
  });

  // Strip ```json fences if present
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as SuggestionsOutput;

  return {
    titleRewrites: parsed.titleRewrites ?? [],
    contentAngles: parsed.contentAngles ?? [],
    internalLinkIdeas: parsed.internalLinkIdeas ?? [],
  };
}
