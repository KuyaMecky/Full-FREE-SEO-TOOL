import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface ContentMetrics {
  url: string;
  wordCount: number;
  readabilityScore: number;
  readabilityGrade: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  contentScore: number;
  issues: {
    title: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { auditId } = body;

    if (!auditId) {
      return NextResponse.json(
        { error: "Audit ID required" },
        { status: 400 }
      );
    }

    // Get audit & crawl results
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const crawlResults = await prisma.crawlResult.findMany({
      where: { auditId },
    });

    // Analyze each page
    const pages: ContentMetrics[] = crawlResults.map((result) => {
      // Parse structured data
      const headings = result.headings ? JSON.parse(result.headings) : { h1: 0, h2: 0, h3: 0 };
      const links = result.links ? JSON.parse(result.links) : { internal: 0, external: 0 };
      const images = result.images ? JSON.parse(result.images) : [];
      const issues = result.issues ? JSON.parse(result.issues) : [];

      // Extract text from HTML (mock - in production, extract from content)
      const estimatedWords = Math.max(300 + Math.random() * 2000, 100);

      // Calculate readability score
      const readability = calculateReadability(estimatedWords);
      const contentScore = calculateContentScore({
        wordCount: estimatedWords,
        h1Count: headings.h1 || 0,
        h2Count: headings.h2 || 0,
        readabilityScore: readability.score,
        internalLinks: links.internal || 0,
        images: images.length || 0,
      });

      // Identify issues
      const contentIssues: ContentMetrics['issues'] = [];

      if (headings.h1 !== 1) {
        contentIssues.push({
          title: 'H1 Structure Issue',
          severity: 'critical',
          description: `Found ${headings.h1 || 0} H1 tags. Should have exactly 1.`,
        });
      }

      if (estimatedWords < 600) {
        contentIssues.push({
          title: 'Low Word Count',
          severity: 'warning',
          description: `Only ${Math.round(estimatedWords)} words. Aim for 1000+ for better SEO.`,
        });
      }

      if (readability.score < 50) {
        contentIssues.push({
          title: 'Poor Readability',
          severity: 'warning',
          description: `Readability is ${readability.score}/100. Simplify sentences and use shorter paragraphs.`,
        });
      }

      if (links.internal < 2) {
        contentIssues.push({
          title: 'Low Internal Links',
          severity: 'info',
          description: `Only ${links.internal || 0} internal links. Consider adding 3-5 relevant internal links.`,
        });
      }

      if (images.length === 0) {
        contentIssues.push({
          title: 'No Images',
          severity: 'info',
          description: 'Add relevant images to improve engagement and visual appeal.',
        });
      }

      return {
        url: result.url,
        wordCount: Math.round(estimatedWords),
        readabilityScore: readability.score,
        readabilityGrade: readability.grade,
        h1Count: headings.h1 || 0,
        h2Count: headings.h2 || 0,
        h3Count: headings.h3 || 0,
        internalLinks: links.internal || 0,
        externalLinks: links.external || 0,
        images: images.length || 0,
        contentScore: Math.round(contentScore),
        issues: contentIssues,
      };
    });

    // Calculate aggregate stats
    const stats = {
      avgWordCount: pages.reduce((sum, p) => sum + p.wordCount, 0) / pages.length,
      avgReadability: pages.reduce((sum, p) => sum + p.readabilityScore, 0) / pages.length,
      avgContentScore: pages.reduce((sum, p) => sum + p.contentScore, 0) / pages.length,
      totalPages: pages.length,
      pagesWithIssues: pages.filter((p) => p.issues.length > 0).length,
    };

    // Store in audit record
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        contentMetrics: JSON.stringify(pages),
      },
    });

    return NextResponse.json({
      auditId,
      pages,
      stats,
    });
  } catch (error) {
    console.error("Content analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}

// Flesch-Kincaid Readability Score (0-100)
function calculateReadability(wordCount: number): {
  score: number;
  grade: string;
} {
  // Simplified calculation
  // In production, analyze actual sentence/syllable counts
  const baseScore = Math.min(100, 50 + Math.random() * 40);

  const grade =
    baseScore >= 90 ? '3-4'
      : baseScore >= 80 ? '5-6'
        : baseScore >= 70 ? '7-8'
          : baseScore >= 60 ? '9-10'
            : baseScore >= 50 ? '11-12'
              : '13+';

  return {
    score: Math.round(baseScore),
    grade,
  };
}

// Calculate overall content score (0-100)
function calculateContentScore(data: {
  wordCount: number;
  h1Count: number;
  h2Count: number;
  readabilityScore: number;
  internalLinks: number;
  images: number;
}): number {
  let score = 0;

  // Word count (max 30 points)
  if (data.wordCount >= 1000) score += 30;
  else if (data.wordCount >= 600) score += 20;
  else if (data.wordCount >= 300) score += 10;

  // H1 structure (max 15 points)
  if (data.h1Count === 1) score += 15;
  else if (data.h1Count > 0) score += 5;

  // H2 usage (max 15 points)
  if (data.h2Count >= 2 && data.h2Count <= 5) score += 15;
  else if (data.h2Count > 0) score += 10;

  // Readability (max 20 points)
  score += Math.min((data.readabilityScore / 100) * 20, 20);

  // Internal links (max 10 points)
  if (data.internalLinks >= 3) score += 10;
  else if (data.internalLinks >= 1) score += 5;

  // Images (max 10 points)
  if (data.images >= 3) score += 10;
  else if (data.images >= 1) score += 5;

  return Math.min(score, 100);
}
