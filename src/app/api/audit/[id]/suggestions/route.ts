import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DEFAULT_SUGGESTIONS = [
  {
    id: "default-1",
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
    id: "default-2",
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
    id: "default-3",
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      console.log("No session found");
      return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
    }

    console.log("Loading suggestions for audit:", params.id);

    // Get audit data
    let audit;
    try {
      audit = await prisma.audit.findUnique({
        where: { id: params.id },
        include: {
          findings: true,
          crawlResults: true,
        },
      });
    } catch (dbError) {
      console.error("Database error loading audit:", dbError);
      return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
    }

    if (!audit) {
      console.log("Audit not found:", params.id);
      return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
    }

    if (audit.userId !== session.id) {
      console.log("Unauthorized access to audit");
      return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
    }

    console.log("Audit found:", {
      status: audit.status,
      findingsCount: audit.findings?.length || 0,
      crawlResultsCount: audit.crawlResults?.length || 0,
    });

    // Extract findings
    const quickWins = (audit.findings || [])
      .filter((f: any) => f?.severity === "high")
      .slice(0, 5);

    console.log("Quick wins extracted:", quickWins.length);

    // Create suggestions from findings
    if (quickWins.length > 0) {
      const findingsSuggestions = quickWins.slice(0, 3).map((finding: any, i: number) => ({
        id: `suggestion-${i}`,
        title: `Fix: ${finding.issue || "Issue"}`,
        keyword: finding.issue?.toLowerCase() || "fix",
        difficulty: "medium",
        intent: "informational",
        outline: ["Overview", "Impact", "Solution"],
        rationale: finding.description || `Address this finding: ${finding.issue}`,
        wordCount: 1200,
        slug: (finding.issue || "issue").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        linkedQuickWin: finding.issue || null,
      }));

      console.log("Returning findings-based suggestions:", findingsSuggestions.length);
      return NextResponse.json({ suggestions: findingsSuggestions });
    }

    // No findings, return defaults
    console.log("No findings, returning default suggestions");
    return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
  } catch (error) {
    console.error("Suggestions endpoint error:", error instanceof Error ? error.message : error);
    console.error("Full error:", error);
    // Always return success with defaults
    return NextResponse.json({ suggestions: DEFAULT_SUGGESTIONS });
  }
}
