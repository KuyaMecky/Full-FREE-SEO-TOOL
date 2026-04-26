import { generateText } from "./provider";

export interface ContentIdea {
  title: string;
  targetKeyword: string;
  intent: "informational" | "commercial" | "transactional" | "navigational" | string;
  difficulty: "low" | "medium" | "high" | string;
  outline: string[]; // section titles
  rationale: string;
  estimatedWordCount: number;
  suggestedSlug: string;
  internalLinkTargets?: string[];
}

export interface ContentPlan {
  summary: string;
  quickWinIdeas: ContentIdea[]; // based on GSC striking-distance queries
  topicExpansions: ContentIdea[]; // related topics to existing content
  newPillarIdeas: ContentIdea[]; // brand-new topic pillars
  gaps: string[]; // general content gaps not yet as ideas
}

export interface ContentRefresh {
  urlAnalyzed: string;
  currentTitle: string;
  currentWordCount: number;
  summary: string;
  issues: Array<{
    severity: "high" | "medium" | "low" | string;
    issue: string;
    fix: string;
  }>;
  rewriteRecommendations: {
    newTitle?: string;
    newMetaDescription?: string;
    newH1?: string;
  };
  addSections: Array<{ heading: string; purpose: string; approxWords: number }>;
  removeOrConsolidate: Array<{ section: string; reason: string }>;
  updateOpportunities: string[]; // outdated facts / stats to refresh
  internalLinksToAdd: Array<{ anchor: string; suggestedTargetTopic: string }>;
  keywordTargets: string[]; // keywords to emphasize in the refresh
}

// ─── Generation ───────────────────────────────────────────

export async function generateContentIdeas(input: {
  domain: string;
  businessType?: string;
  seedTopics?: string[];
  existingUrls: string[]; // from sitemap — for dedup context
  gscQueries?: Array<{
    query: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
  gscTopPages?: Array<{
    page: string;
    impressions: number;
    clicks: number;
  }>;
}): Promise<ContentPlan> {
  const {
    domain,
    businessType,
    seedTopics = [],
    existingUrls,
    gscQueries = [],
    gscTopPages = [],
  } = input;

  const strikingDistance = gscQueries
    .filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= 50)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  const topQueries = gscQueries
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20);

  // Take a sample of existing URLs — shorten to save tokens
  const urlSample = existingUrls
    .slice(0, 40)
    .map((u) => {
      try {
        return new URL(u).pathname;
      } catch {
        return u;
      }
    });

  const systemPrompt = `You are a senior SEO content strategist. Produce a concrete content plan based on the site's existing URLs, Search Console data, and seed topics.

Rules:
- Never duplicate existing URLs/topics. If the site already covers a topic, suggest an *expansion* angle instead of a replacement.
- Striking-distance queries (positions 4-20) are the fastest wins — prioritize them.
- Be specific. Avoid generic advice like "write more content."
- Always return valid JSON. No markdown fences. No preamble.`;

  const userPrompt = `Domain: ${domain}
Business type: ${businessType || "(not specified)"}
Seed topics: ${seedTopics.length ? seedTopics.join(", ") : "(none — infer from domain + GSC data)"}

EXISTING URL SAMPLE (${urlSample.length} of ${existingUrls.length}):
${urlSample.map((u) => `- ${u}`).join("\n") || "(no sitemap data)"}

STRIKING-DISTANCE QUERIES (pos 4-20, 50+ impressions):
${
  strikingDistance.length
    ? strikingDistance
        .map(
          (q) =>
            `- "${q.query}" · pos ${q.position.toFixed(1)} · ${q.impressions} impr`
        )
        .join("\n")
    : "(none)"
}

TOP QUERIES BY IMPRESSIONS:
${
  topQueries.length
    ? topQueries
        .slice(0, 10)
        .map(
          (q) =>
            `- "${q.query}" · ${q.impressions} impr · pos ${q.position.toFixed(1)}`
        )
        .join("\n")
    : "(none)"
}

TOP PAGES:
${
  gscTopPages.length
    ? gscTopPages
        .slice(0, 8)
        .map((p) => {
          try {
            return `- ${new URL(p.page).pathname} · ${p.impressions} impr`;
          } catch {
            return `- ${p.page}`;
          }
        })
        .join("\n")
    : "(none)"
}

Return JSON with this exact shape. An idea shape is:
{
  "title": string,
  "targetKeyword": string,
  "intent": "informational" | "commercial" | "transactional" | "navigational",
  "difficulty": "low" | "medium" | "high",
  "outline": [ string ],
  "rationale": string,
  "estimatedWordCount": number,
  "suggestedSlug": string,
  "internalLinkTargets": [ string ]
}

Plan shape:
{
  "summary": string,
  "quickWinIdeas": [ idea ],  // 3-5 ideas derived from striking-distance queries (ONLY if such queries exist; otherwise [])
  "topicExpansions": [ idea ], // 3-5 ideas that expand or support existing URLs
  "newPillarIdeas": [ idea ],  // 2-3 brand-new topic pillars the site could own
  "gaps": [ string ]           // 3-6 unclaimed topics, not yet as full ideas
}

Return ONLY the JSON object.`;

  const text = await generateText({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 1400,
  });
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<ContentPlan>;
  return {
    summary: parsed.summary ?? "",
    quickWinIdeas: parsed.quickWinIdeas ?? [],
    topicExpansions: parsed.topicExpansions ?? [],
    newPillarIdeas: parsed.newPillarIdeas ?? [],
    gaps: parsed.gaps ?? [],
  };
}

// ─── Recreation / refresh ─────────────────────────────────

export async function analyzeContentForRefresh(input: {
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  headings: string[];
  bodySample: string; // first ~3000 chars of visible text
  wordCount: number;
  gscQueries?: Array<{
    query: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
}): Promise<ContentRefresh> {
  const {
    url,
    title,
    metaDescription,
    h1,
    headings,
    bodySample,
    wordCount,
    gscQueries = [],
  } = input;

  const relevantQueries = gscQueries.slice(0, 10);

  const systemPrompt = `You are a senior SEO editor. Given the current state of a page and its Search Console data, produce a concrete refresh plan — what to add, cut, and rewrite. Be specific; avoid generic SEO advice.

Always return valid JSON matching the requested schema. No markdown, no commentary.`;

  const userPrompt = `URL: ${url}
Current title: "${title}" (${title.length} chars)
Current meta description: "${metaDescription}" (${metaDescription.length} chars)
Current H1: "${h1}"
Word count: ${wordCount}

Heading outline:
${headings.slice(0, 25).map((h) => `- ${h}`).join("\n") || "(no headings)"}

First ~3000 chars of body:
"""
${bodySample.slice(0, 3000)}
"""

GSC queries this page ranks for:
${
  relevantQueries.length
    ? relevantQueries
        .map(
          (q) =>
            `- "${q.query}" · pos ${q.position.toFixed(1)} · ${q.impressions} impr · ${q.clicks} clicks`
        )
        .join("\n")
    : "(no GSC data attached)"
}

Return JSON matching this exact shape:
{
  "urlAnalyzed": string,
  "currentTitle": string,
  "currentWordCount": number,
  "summary": string,
  "issues": [ { "severity": "high" | "medium" | "low", "issue": string, "fix": string } ],
  "rewriteRecommendations": {
    "newTitle": string,
    "newMetaDescription": string,
    "newH1": string
  },
  "addSections": [ { "heading": string, "purpose": string, "approxWords": number } ],
  "removeOrConsolidate": [ { "section": string, "reason": string } ],
  "updateOpportunities": [ string ],
  "internalLinksToAdd": [ { "anchor": string, "suggestedTargetTopic": string } ],
  "keywordTargets": [ string ]
}

Produce 3-6 items in each array section. Return ONLY the JSON object.`;

  const text = await generateText({
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 1400,
  });
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as Partial<ContentRefresh>;
  return {
    urlAnalyzed: parsed.urlAnalyzed ?? url,
    currentTitle: parsed.currentTitle ?? title,
    currentWordCount: parsed.currentWordCount ?? wordCount,
    summary: parsed.summary ?? "",
    issues: parsed.issues ?? [],
    rewriteRecommendations: parsed.rewriteRecommendations ?? {},
    addSections: parsed.addSections ?? [],
    removeOrConsolidate: parsed.removeOrConsolidate ?? [],
    updateOpportunities: parsed.updateOpportunities ?? [],
    internalLinksToAdd: parsed.internalLinksToAdd ?? [],
    keywordTargets: parsed.keywordTargets ?? [],
  };
}
