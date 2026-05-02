import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compareWithCompetitors, generateAhrefsInsights } from "@/lib/ahrefs/enrichment";

const AHREFS_BASE = "https://api.ahrefs.com/v3";

async function fetchAhrefsDomainData(domain: string, apiKey: string) {
  try {
    const res = await fetch(
      `${AHREFS_BASE}/site-overview?target=${encodeURIComponent(domain)}&mode=domain`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) return {};
    return res.json();
  } catch (error) {
    console.error("Failed to fetch Ahrefs data:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { auditId, competitors = [] } = await request.json();

    if (!auditId) {
      return NextResponse.json({ error: "auditId required" }, { status: 400 });
    }

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
    });

    if (!audit || audit.userId !== session.id) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    const competitorDomains =
      competitors.length > 0
        ? competitors
        : JSON.parse(audit.competitors || "[]");

    // Check if Ahrefs is configured
    const apiKey = process.env.AHREFS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Ahrefs not configured" }, { status: 400 });
    }

    // Fetch Ahrefs data for your domain
    const yourDomain = new URL(audit.domain).hostname;
    const yourData = await fetchAhrefsDomainData(yourDomain, apiKey);
    const yourMetrics = {
      domain_rating: yourData.domain_rating,
      referring_domains: yourData.referring_domains,
      organic_traffic: yourData.organic_traffic,
      organic_keywords: yourData.organic_keywords,
    };

    // Fetch Ahrefs data for competitors
    const competitorDataPromises = competitorDomains.map((domain: string) =>
      fetchAhrefsDomainData(domain, apiKey)
    );
    const competitorDataList = await Promise.all(competitorDataPromises);

    const competitorMetrics = competitorDataList.map((data, idx) => ({
      domain: competitorDomains[idx],
      domain_rating: data.domain_rating,
      referring_domains: data.referring_domains,
      organic_traffic: data.organic_traffic,
      organic_keywords: data.organic_keywords,
    }));

    // Generate comparison
    const gaps = compareWithCompetitors(yourMetrics, competitorMetrics);

    // Generate insights
    const yourInsights = generateAhrefsInsights(yourMetrics);

    // Store competitor data in database
    await Promise.all(
      competitorMetrics.map((competitor) =>
        prisma.competitorData.upsert({
          where: {
            auditId_competitorDomain: {
              auditId,
              competitorDomain: competitor.domain,
            },
          },
          create: {
            auditId,
            userId: session.id,
            competitorDomain: competitor.domain,
            analysisData: JSON.stringify(competitor),
            dominatingDomains: JSON.stringify([]),
            contentGaps: JSON.stringify(
              gaps
                .filter((g) => {
                  // Find gaps where this competitor is better
                  const competitorData = competitorMetrics.find(
                    (c) => c.domain === competitor.domain
                  );
                  return competitorData && g.competitors > g.yours;
                })
                .map((g) => ({
                  metric: g.metric,
                  recommendation: g.recommendation,
                }))
            ),
          },
          update: {
            analysisData: JSON.stringify(competitor),
            contentGaps: JSON.stringify(
              gaps
                .filter((g) => {
                  const competitorData = competitorMetrics.find(
                    (c) => c.domain === competitor.domain
                  );
                  return competitorData && g.competitors > g.yours;
                })
                .map((g) => ({
                  metric: g.metric,
                  recommendation: g.recommendation,
                }))
            ),
          },
        })
      )
    );

    return NextResponse.json({
      auditId,
      domain: audit.domain,
      competitors: competitorMetrics,
      yourMetrics,
      gaps,
      insights: yourInsights,
      ahrefs: {
        enabled: true,
        domainRating: yourMetrics.domain_rating,
        referringDomains: yourMetrics.referring_domains,
        organicTraffic: yourMetrics.organic_traffic,
        organicKeywords: yourMetrics.organic_keywords,
      },
    });
  } catch (error) {
    console.error("Ahrefs competitor gaps error:", error);
    return NextResponse.json({ error: "Failed to analyze competitors" }, { status: 500 });
  }
}
