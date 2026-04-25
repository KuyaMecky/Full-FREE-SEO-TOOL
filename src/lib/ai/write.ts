import { generateText } from "./provider";

export interface WriteArticleInput {
  title: string;
  targetKeyword: string;
  outline: string[];
  intent: string;
  estimatedWordCount: number;
  domain: string;
  internalLinkTargets?: string[];
  gscQueries?: Array<{ query: string; impressions: number; position: number }>;
  competingUrls?: string[];
}

export interface WriteArticleOutput {
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  schemaMarkup: string;
  imageSuggestions: Array<{ placement: string; altText: string; description: string }>;
  internalLinks: Array<{ anchor: string; targetUrl: string }>;
}

export async function writeArticle(input: WriteArticleInput): Promise<WriteArticleOutput> {
  const outlineText = input.outline.map((h, i) => `${i + 1}. ${h}`).join("\n");
  const internalTargets = input.internalLinkTargets?.slice(0, 8).join(", ") ?? "none provided";
  const topQueries = input.gscQueries
    ?.slice(0, 10)
    .map((q) => `"${q.query}" (pos ${q.position.toFixed(1)}, ${q.impressions} impr)`)
    .join(", ") ?? "";

  const system = `You are an expert SEO content writer. Write highly optimized, human-like long-form articles.
Rules:
- Use proper HTML headings (h2, h3) — never h1 (reserved for the post title)
- Naturally integrate focus keyword and semantic variations in headings and body
- Write conversationally, vary sentence length, avoid AI-detection patterns
- Add internal links using anchor text from the provided targets
- Structure content to match SERP intent: answer questions early, elaborate later
- Do NOT include the main title (h1) in the content body`;

  const user = `Write a complete, SEO-optimized article for this brief. Return ONLY valid JSON.

Brief:
- Title (h1): ${input.title}
- Focus keyword: ${input.targetKeyword}
- Search intent: ${input.intent}
- Target word count: ~${input.estimatedWordCount} words
- Domain: ${input.domain}
- Outline to follow:
${outlineText}
- Internal link targets: ${internalTargets}
- GSC ranking queries: ${topQueries || "none"}

Return JSON with this exact shape:
{
  "content": "<HTML article body — h2/h3 headings, paragraphs, no h1>",
  "metaTitle": "SEO title under 60 chars",
  "metaDescription": "Compelling meta description 120-158 chars with focus keyword",
  "slug": "url-slug-lowercase-hyphenated",
  "schemaMarkup": "<script type='application/ld+json'>{ ... Article schema ... }</script>",
  "imageSuggestions": [
    { "placement": "above intro", "altText": "descriptive alt", "description": "what to show" }
  ],
  "internalLinks": [
    { "anchor": "anchor text used in content", "targetUrl": "relative or absolute URL" }
  ]
}`;

  const raw = await generateText({ system, user, maxTokens: 2000, temperature: 0.7 });

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");

  const parsed = JSON.parse(jsonMatch[0]) as WriteArticleOutput;
  return parsed;
}
