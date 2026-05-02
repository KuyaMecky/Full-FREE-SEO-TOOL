// Utility functions to enrich intelligence reports with Ahrefs data

export interface AhrefsMetrics {
  domain_rating?: number;
  referring_domains?: number;
  organic_traffic?: number;
  organic_keywords?: number;
  backlinks?: number;
  traffic_cost?: number;
  ahrefs_rank?: number;
}

/**
 * Fetch Ahrefs data for a domain
 */
export async function getAhrefsDomainMetrics(domain: string): Promise<AhrefsMetrics> {
  try {
    const res = await fetch("/api/ahrefs/domain-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });

    if (!res.ok) return {};
    return res.json();
  } catch (error) {
    console.error("Failed to fetch Ahrefs metrics:", error);
    return {};
  }
}

/**
 * Fetch Ahrefs data for multiple competitors
 */
export async function getCompetitorMetrics(competitors: string[]): Promise<AhrefsMetrics[]> {
  try {
    const res = await fetch("/api/ahrefs/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competitors }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.competitors || [];
  } catch (error) {
    console.error("Failed to fetch competitor metrics:", error);
    return [];
  }
}

/**
 * Generate Ahrefs insights for intelligence reports
 */
export function generateAhrefsInsights(metrics: AhrefsMetrics) {
  const insights = [];

  if (metrics.domain_rating !== undefined) {
    if (metrics.domain_rating < 20) {
      insights.push({
        title: "Low domain authority",
        description: `Domain Rating is ${metrics.domain_rating}/100. Build backlinks to improve authority.`,
        priority: "high",
        category: "authority",
      });
    } else if (metrics.domain_rating < 50) {
      insights.push({
        title: "Moderate domain authority",
        description: `Domain Rating is ${metrics.domain_rating}/100. Continue building quality backlinks.`,
        priority: "medium",
        category: "authority",
      });
    } else {
      insights.push({
        title: "Strong domain authority",
        description: `Domain Rating is ${metrics.domain_rating}/100. Good foundation for organic growth.`,
        priority: "low",
        category: "authority",
      });
    }
  }

  if (metrics.referring_domains !== undefined && metrics.referring_domains < 10) {
    insights.push({
      title: "Few referring domains",
      description: `Only ${metrics.referring_domains} unique domains linking to you. Opportunity for backlink building.`,
      priority: "high",
      category: "backlinks",
    });
  }

  if (metrics.organic_traffic !== undefined && metrics.organic_traffic < 100) {
    insights.push({
      title: "Low organic traffic",
      description: `Estimated monthly organic traffic: ${metrics.organic_traffic}. Improve content and rankings.`,
      priority: "high",
      category: "traffic",
    });
  }

  if (metrics.traffic_cost !== undefined && metrics.traffic_cost > 0) {
    insights.push({
      title: "Traffic monetization potential",
      description: `Your organic traffic is worth ~$${Math.round(metrics.traffic_cost)}/month if paid.`,
      priority: "low",
      category: "opportunity",
    });
  }

  return insights;
}

/**
 * Compare your metrics with competitors
 */
export function compareWithCompetitors(
  yourMetrics: AhrefsMetrics,
  competitorMetrics: AhrefsMetrics[]
) {
  if (competitorMetrics.length === 0) return [];

  const gaps = [];

  // Compare domain rating
  const yourDR = yourMetrics.domain_rating || 0;
  const avgCompetitorDR =
    competitorMetrics.reduce((sum, m) => sum + (m.domain_rating || 0), 0) /
    competitorMetrics.length;

  if (yourDR < avgCompetitorDR) {
    gaps.push({
      metric: "Domain Authority",
      yours: yourDR,
      competitors: Math.round(avgCompetitorDR),
      gap: Math.round(avgCompetitorDR - yourDR),
      recommendation: "Build more high-quality backlinks to catch up",
    });
  }

  // Compare organic traffic
  const yourTraffic = yourMetrics.organic_traffic || 0;
  const avgCompetitorTraffic =
    competitorMetrics.reduce((sum, m) => sum + (m.organic_traffic || 0), 0) /
    competitorMetrics.length;

  if (yourTraffic < avgCompetitorTraffic) {
    gaps.push({
      metric: "Organic Traffic",
      yours: Math.round(yourTraffic),
      competitors: Math.round(avgCompetitorTraffic),
      gap: Math.round(avgCompetitorTraffic - yourTraffic),
      recommendation: "Improve rankings for target keywords",
    });
  }

  // Compare keywords
  const yourKeywords = yourMetrics.organic_keywords || 0;
  const avgCompetitorKeywords =
    competitorMetrics.reduce((sum, m) => sum + (m.organic_keywords || 0), 0) /
    competitorMetrics.length;

  if (yourKeywords < avgCompetitorKeywords) {
    gaps.push({
      metric: "Ranking Keywords",
      yours: yourKeywords,
      competitors: Math.round(avgCompetitorKeywords),
      gap: Math.round(avgCompetitorKeywords - yourKeywords),
      recommendation: "Target more keywords and improve content",
    });
  }

  return gaps;
}
