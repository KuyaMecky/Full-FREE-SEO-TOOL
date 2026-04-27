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

  const audit = await prisma.audit.findUnique({
    where: { id: params.id },
    include: {
      findings: true,
      crawlResults: true,
    },
  });

  if (!audit || audit.userId !== session.id) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  try {
    // Extract high-priority findings as quick wins
    const quickWins = audit.findings
      .filter(f => f.severity === "high")
      .slice(0, 5);

    // Get existing page URLs from crawl results
    const existingUrls = audit.crawlResults
      .map(r => r.url)
      .filter(Boolean)
      .slice(0, 10);

    // Get seed topics from crawl result titles and H1s
    const seedTopics = audit.crawlResults
      .slice(0, 5)
      .map(r => r.title || r.h1)
      .filter(Boolean);

    // Generate content ideas
    try {
      const ideas = await generateContentIdeas({
        domain: audit.domain,
        businessType: audit.businessType || "General",
        seedTopics: seedTopics.length > 0 ? seedTopics : undefined,
        existingUrls: existingUrls.length > 0 ? existingUrls : [""],
      });

      return NextResponse.json({
        suggestions: ideas.quickWinIdeas.slice(0, 5).map((idea, i) => ({
          id: `suggestion-${i}`,
          title: idea.title,
          keyword: idea.targetKeyword,
          difficulty: idea.difficulty,
          intent: idea.intent,
          outline: idea.outline,
          rationale: idea.rationale,
          wordCount: idea.estimatedWordCount,
          slug: idea.suggestedSlug,
          linkedQuickWin: quickWins[i]?.issue || null,
        })),
      });
    } catch (aiError) {
      console.error("AI content generation failed:", aiError);
      // Return fallback suggestions based on findings
      return NextResponse.json({
        suggestions: quickWins.slice(0, 5).map((finding, i) => ({
          id: `suggestion-${i}`,
          title: `Fix: ${finding.issue}`,
          keyword: finding.issue.toLowerCase(),
          difficulty: "medium",
          intent: "informational",
          outline: ["Overview", "Solution", "Implementation"],
          rationale: `Address this finding: ${finding.description}`,
          wordCount: 1500,
          slug: finding.issue.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          linkedQuickWin: finding.issue,
        })),
      });
    }
  } catch (error) {
    console.error("Failed to load suggestions:", error);
    return NextResponse.json(
      { error: "Failed to load suggestions", suggestions: [] },
      { status: 200 }
    );
  }
}
