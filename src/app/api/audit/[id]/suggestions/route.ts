import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateContentIdeas } from "@/lib/ai/content";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  console.log("Loading suggestions for audit:", params.id);

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: {
      findings: true,
      crawlResults: true,
    },
  });

  console.log("Audit found:", !!audit, "Status:", audit?.status);
  console.log("Findings count:", audit?.findings?.length || 0);
  console.log("CrawlResults count:", audit?.crawlResults?.length || 0);

  if (!audit || audit.userId !== session.id) {
    console.log("Audit not found or unauthorized");
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  try {
    // Extract high-priority findings as quick wins
    const quickWins = (audit.findings || [])
      .filter((f: any) => f?.severity === "high")
      .slice(0, 5);

    // Get existing page URLs from crawl results
    const existingUrls = (audit.crawlResults || [])
      .map((r: any) => r?.url)
      .filter(Boolean)
      .slice(0, 10);

    // Get seed topics from crawl result titles and H1s
    const seedTopics = (audit.crawlResults || [])
      .slice(0, 5)
      .map((r: any) => r?.title || r?.h1)
      .filter(Boolean);

    // Return suggestions based on audit findings
    console.log("Returning suggestions based on findings:", quickWins.length);

    // Create default suggestions if no findings
    const defaultSuggestions = [
      {
        id: "suggestion-1",
        title: "Create Content for High-Intent Keywords",
        keyword: "target keywords",
        difficulty: "medium",
        intent: "commercial",
        outline: ["Research", "Strategy", "Implementation"],
        rationale: "Target keywords with commercial intent to drive conversions",
        wordCount: 2000,
        slug: "create-content-high-intent-keywords",
        linkedQuickWin: null,
      },
      {
        id: "suggestion-2",
        title: "Optimize Existing Top Pages",
        keyword: "page optimization",
        difficulty: "low",
        intent: "informational",
        outline: ["Analysis", "Optimization", "Monitoring"],
        rationale: "Your top-performing pages have room for improvement",
        wordCount: 1500,
        slug: "optimize-existing-top-pages",
        linkedQuickWin: null,
      },
      {
        id: "suggestion-3",
        title: "Address Content Gaps",
        keyword: "content gaps",
        difficulty: "high",
        intent: "informational",
        outline: ["Gap Analysis", "Content Planning", "Implementation"],
        rationale: "Fill missing content opportunities identified in the audit",
        wordCount: 2500,
        slug: "address-content-gaps",
        linkedQuickWin: null,
      },
    ];

    // If we have findings, create suggestions from them
    const findingsSuggestions = quickWins.slice(0, 3).map((finding, i) => ({
      id: `suggestion-finding-${i}`,
      title: `Fix: ${finding.issue}`,
      keyword: finding.issue.toLowerCase(),
      difficulty: "medium" as const,
      intent: "informational" as const,
      outline: ["Overview", "Problem Analysis", "Solution"],
      rationale: `Address this finding: ${finding.description || ""}`,
      wordCount: 1200,
      slug: finding.issue.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      linkedQuickWin: finding.issue,
    }));

    const suggestions = findingsSuggestions.length > 0 ? findingsSuggestions : defaultSuggestions;

    console.log("Returning", suggestions.length, "suggestions");
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Failed to load suggestions:", error);
    // Always return a response with at least basic suggestions
    return NextResponse.json(
      {
        suggestions: [
          {
            id: "fallback-1",
            title: "Improve Technical SEO",
            keyword: "technical seo",
            difficulty: "medium",
            intent: "informational",
            outline: ["Overview", "Best Practices", "Implementation"],
            rationale: "Address technical issues found in your audit",
            wordCount: 1500,
            slug: "improve-technical-seo",
            linkedQuickWin: null,
          },
          {
            id: "fallback-2",
            title: "Optimize On-Page Elements",
            keyword: "on-page optimization",
            difficulty: "low",
            intent: "informational",
            outline: ["Introduction", "Key Elements", "Action Plan"],
            rationale: "Enhance meta tags, headings, and content structure",
            wordCount: 1200,
            slug: "optimize-on-page-elements",
            linkedQuickWin: null,
          },
        ],
      },
      { status: 200 }
    );
  }
}
