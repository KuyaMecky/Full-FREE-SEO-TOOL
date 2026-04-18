import { CrawlResult, ScoreCard, FindingData } from "@/types/audit";
import { generateText } from "./provider";

export async function generateAIReport(
  audit: any,
  crawlResults: CrawlResult[],
  scorecard: ScoreCard,
  findings: FindingData[]
): Promise<{
  executiveSummary: {
    overview: string;
    keyFindings: string[];
    topOpportunities: string[];
    riskAreas: string[];
  };
  roadmap: {
    phase: "30-day" | "60-day" | "90-day";
    task: string;
    owner: string;
    priority: "high" | "medium" | "low";
    expectedImpact: string;
  }[];
  kpiPlan: {
    metric: string;
    current: string;
    target30: string;
    target60: string;
    target90: string;
  }[];
  actionItems: {
    rank: number;
    action: string;
    impact: string;
    effort: string;
    owner: string;
  }[];
  stakeholderSummary: string;
  devTaskList: {
    task: string;
    priority: "high" | "medium" | "low";
    effort: string;
    details: string;
  }[];
}> {
  // Prepare data
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const highFindings = findings.filter((f) => f.severity === "high");

  const prompt = `You are an expert SEO analyst. Based on the following audit data, generate a comprehensive SEO analysis report.

AUDIT SUMMARY:
- Domain: ${audit.domain}
- Pages Crawled: ${crawlResults.length}
- Overall Score: ${scorecard.overall}/100
- Technical Score: ${scorecard.technical}/100
- On-Page Score: ${scorecard.onPage}/100
- Content Score: ${scorecard.content}/100
- UX/Performance Score: ${scorecard.uxPerformance}/100

CRITICAL ISSUES (${criticalFindings.length}):
${criticalFindings.map((f) => `- ${f.issue}: ${f.evidence}`).join("\n")}

HIGH PRIORITY ISSUES (${highFindings.length}):
${highFindings.slice(0, 10).map((f) => `- ${f.issue}: ${f.impact}`).join("\n")}

PAGE ANALYSIS SAMPLE:
${crawlResults.slice(0, 5).map((p) =>
`URL: ${p.url}
- Title: "${p.title}" (${p.title.length} chars)
- Meta Description: "${p.metaDescription?.substring(0, 50)}..." (${p.metaDescription.length} chars)
- H1: "${p.h1}"
- Issues: ${p.issues.length}
`).join("\n")}

BUSINESS CONTEXT:
- Business Type: ${audit.businessType || "Not specified"}
- Goals: ${JSON.parse(audit.goals || "[]").join(", ") || "Not specified"}
- CMS/Stack: ${audit.cmsStack || "Not specified"}

Generate the following sections in JSON format:

1. executiveSummary: {
  overview: string (2-3 sentences summarizing the audit),
  keyFindings: string[] (top 5 key findings),
  topOpportunities: string[] (3 biggest improvement opportunities),
  riskAreas: string[] (2-3 areas of concern)
}

2. roadmap: array of 10-15 tasks with {
  phase: "30-day" | "60-day" | "90-day",
  task: string (specific action),
  owner: "dev" | "content" | "marketing",
  priority: "high" | "medium" | "low",
  expectedImpact: string (brief impact description)
}

3. kpiPlan: array of 4-5 metrics with {
  metric: string,
  current: string,
  target30: string,
  target60: string,
  target90: string
}

4. actionItems: array of top 5 actions with {
  rank: number (1-5),
  action: string,
  impact: string,
  effort: "low" | "medium" | "high",
  owner: string
}

5. stakeholderSummary: string (3-4 sentence executive summary)

6. devTaskList: array of dev tasks with {
  task: string,
  priority: "high" | "medium" | "low",
  effort: "low" | "medium" | "high",
  details: string
}

Respond ONLY with valid JSON. No markdown formatting, no code blocks.`;

  const content = await generateText({
    system:
      "You are an expert SEO analyst. Always return valid JSON matching the requested schema, with no extra commentary or markdown.",
    user: prompt,
    maxTokens: 2000,
  });

  // Parse JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const result = JSON.parse(jsonStr);

    return {
      executiveSummary: result.executiveSummary,
      roadmap: result.roadmap,
      kpiPlan: result.kpiPlan,
      actionItems: result.actionItems,
      stakeholderSummary: result.stakeholderSummary,
      devTaskList: result.devTaskList,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("AI response parsing failed");
  }
}
