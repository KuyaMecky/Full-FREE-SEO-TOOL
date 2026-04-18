import { generateText } from "./provider";

export interface KeywordOpportunity {
  keyword: string;
  intent: "informational" | "navigational" | "commercial" | "transactional" | string;
  difficulty: "low" | "medium" | "high" | string;
  searchVolumeTier: "low" | "medium" | "high" | string;
  contentAngle: string;
  suggestedPage?: string;
  rationale: string;
}

export interface KeywordCluster {
  theme: string;
  keywords: string[];
  pillarRecommendation: string;
}

export interface KeywordReport {
  primaryTargets: KeywordOpportunity[]; // top recommendations
  longTailOpportunities: KeywordOpportunity[]; // supporting keywords
  clusters: KeywordCluster[]; // topic groupings for content planning
  quickWins: KeywordOpportunity[]; // queries already ranking 4-20 in GSC, if available
  gaps: string[]; // themes competitors likely cover
}

export async function generateKeywordResearch(input: {
  domain: string;
  businessType?: string;
  goals?: string[];
  seedKeywords: string[];
  gscQueries?: Array<{ query: string; impressions: number; position: number }>;
}): Promise<KeywordReport> {
  const {
    domain,
    businessType,
    goals = [],
    seedKeywords,
    gscQueries = [],
  } = input;

  const gscBlock = gscQueries.length
    ? `\n\nEXISTING GSC QUERIES (last 28 days, top by impressions):\n${gscQueries
        .slice(0, 30)
        .map(
          (q) =>
            `- "${q.query}" · ${q.impressions} impressions · avg pos ${q.position.toFixed(1)}`
        )
        .join("\n")}`
    : "\n\n(No GSC data available for this domain — suggest opportunities without cross-reference.)";

  const systemPrompt = `You are an SEO strategist. Given a domain's context and seed keywords, produce a concrete keyword research plan. Always return valid JSON that matches the requested schema. Do not include markdown fences or commentary — just the JSON object.

Guidance:
- Prefer long-tail, high-intent keywords over broad head terms.
- Assign "difficulty" based on term specificity and typical SERP competition. Be honest.
- "searchVolumeTier" is your best-effort categorization (low / medium / high) — say low when unsure.
- Cluster keywords into topic themes for content pillar planning.
- For quickWins, only include queries that appear in the GSC data at positions 4-20 — those are real opportunities to move to page 1.`;

  const userPrompt = `Domain: ${domain}
Business type: ${businessType || "(not specified)"}
Goals: ${goals.length ? goals.join(", ") : "(not specified)"}

Seed keywords: ${
    seedKeywords.length
      ? seedKeywords.map((k) => `"${k}"`).join(", ")
      : "(none — infer from domain and business type)"
  }${gscBlock}

Return JSON with this exact shape:
{
  "primaryTargets": [
    {
      "keyword": string,
      "intent": "informational" | "navigational" | "commercial" | "transactional",
      "difficulty": "low" | "medium" | "high",
      "searchVolumeTier": "low" | "medium" | "high",
      "contentAngle": string,
      "suggestedPage": string,
      "rationale": string
    }
  ],
  "longTailOpportunities": [ { same shape } ],
  "clusters": [
    { "theme": string, "keywords": string[], "pillarRecommendation": string }
  ],
  "quickWins": [ { same shape as primaryTargets } ],
  "gaps": [ string ]
}

Produce 5-8 primaryTargets, 8-12 longTailOpportunities, 3-5 clusters, up to 5 quickWins (only if GSC data supports them), and 3-6 gaps. Return ONLY the JSON object.`;

  const text = await generateText({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 2000,
  });

  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<KeywordReport>;

  return {
    primaryTargets: parsed.primaryTargets ?? [],
    longTailOpportunities: parsed.longTailOpportunities ?? [],
    clusters: parsed.clusters ?? [],
    quickWins: parsed.quickWins ?? [],
    gaps: parsed.gaps ?? [],
  };
}
