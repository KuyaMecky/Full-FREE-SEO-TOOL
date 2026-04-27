import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface CompetitorData {
  domain: string;
  totalPages: number;
  avgWordCount: number;
  avgReadability: number;
  avgH2Count: number;
  avgInternalLinks: number;
  topKeywords: string[];
  contentGaps: string[];
  strengths: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { auditId, competitors } = body;

    if (!auditId || !competitors || competitors.length === 0) {
      return NextResponse.json(
        { error: "Audit ID and competitors required" },
        { status: 400 }
      );
    }

    // Get audit & verify ownership
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get your domain's metrics
    const yourCrawlResults = await prisma.crawlResult.findMany({
      where: { auditId },
    });

    const yourMetrics = calculateMetrics(yourCrawlResults);

    // Analyze competitors (mock crawl data for now)
    const competitorData: CompetitorData[] = competitors.map((domain: string) => {
      // In production, this would crawl actual competitor sites
      // For now, return simulated data
      const mockPages = 45 + Math.floor(Math.random() * 100);
      const avgWords = 1200 + Math.random() * 1500;
      const avgReadability = 60 + Math.random() * 30;
      const avgH2 = 2 + Math.random() * 3;
      const avgLinks = 3 + Math.random() * 4;

      return {
        domain,
        totalPages: mockPages,
        avgWordCount: avgWords,
        avgReadability: avgReadability,
        avgH2Count: avgH2,
        avgInternalLinks: avgLinks,
        topKeywords: generateMockKeywords(domain),
        contentGaps: generateContentGaps(domain),
        strengths: generateStrengths(avgWords, avgLinks, avgReadability),
      };
    });

    // Store competitor analysis
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        competitorAnalysis: JSON.stringify(competitorData),
      },
    });

    return NextResponse.json({
      auditId,
      yourDomain: audit.domain,
      yourMetrics,
      competitors: competitorData,
    });
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze competitors" },
      { status: 500 }
    );
  }
}

function calculateMetrics(crawlResults: any[]) {
  const totalPages = crawlResults.length;
  const avgWordCount = crawlResults.length > 0 ? 1200 : 0;
  const avgReadability = crawlResults.length > 0 ? 70 : 0;
  const avgH2Count = crawlResults.length > 0 ? 3 : 0;
  const avgInternalLinks = crawlResults.length > 0 ? 4 : 0;

  return {
    totalPages,
    avgWordCount,
    avgReadability,
    avgH2Count,
    avgInternalLinks,
  };
}

function generateMockKeywords(domain: string): string[] {
  const keywords = [
    "seo audit tool",
    "website analyzer",
    "content optimization",
    "keyword research",
    "competitor analysis",
    "ranking tracker",
    "site health check",
    "technical seo audit",
  ];
  return keywords.sort(() => Math.random() - 0.5).slice(0, 5);
}

function generateContentGaps(domain: string): string[] {
  const topics = [
    "Advanced SEO strategies",
    "Video optimization guide",
    "Local SEO best practices",
    "E-E-A-T content framework",
    "AI-powered content creation",
    "Voice search optimization",
    "Mobile-first indexing",
    "Core Web Vitals optimization",
  ];
  return topics.sort(() => Math.random() - 0.5).slice(0, 5);
}

function generateStrengths(
  avgWords: number,
  avgLinks: number,
  avgReadability: number
): string[] {
  const strengths: string[] = [];

  if (avgWords > 1500) {
    strengths.push("Comprehensive content (1500+ words avg)");
  }
  if (avgLinks > 4) {
    strengths.push("Strong internal linking strategy");
  }
  if (avgReadability > 75) {
    strengths.push("Highly readable content");
  }
  if (avgWords > 1200 && avgLinks > 3) {
    strengths.push("Well-structured, linked content");
  }
  if (avgReadability > 80) {
    strengths.push("Clear, accessible writing");
  }

  return strengths.length > 0 ? strengths : ["Consistent content strategy"];
}
