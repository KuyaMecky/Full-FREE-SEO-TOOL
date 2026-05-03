export interface AhrefsDomainMetrics {
  domain: string;
  ahrefs_rank: number;
  domain_rating: number;
  referring_domains: number;
  backlinks: number;
  organic_keywords: number;
  organic_traffic: number;
  paid_keywords?: number;
  paid_traffic?: number;
}

export interface AhrefsBacklinksResponse {
  backlinks: Array<{
    url: string;
    anchor_text: string;
    referring_url: string;
    title: string;
    http_status: number;
    link_type: string;
    domain_rating: number;
  }>;
}

export async function getAhrefsDomainMetrics(
  apiKey: string,
  domain: string
): Promise<AhrefsDomainMetrics | null> {
  try {
    const response = await fetch("https://api.ahrefs.com/v3/domain-metrics", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: domain,
        mode: "domain",
      }),
    });

    if (!response.ok) {
      console.error(`Ahrefs API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      domain,
      ahrefs_rank: data.ahrefs_rank || 0,
      domain_rating: data.domain_rating || 0,
      referring_domains: data.referring_domains || 0,
      backlinks: data.backlinks || 0,
      organic_keywords: data.organic_keywords || 0,
      organic_traffic: data.organic_traffic || 0,
      paid_keywords: data.paid_keywords,
      paid_traffic: data.paid_traffic,
    };
  } catch (error) {
    console.error("Failed to fetch Ahrefs domain metrics:", error);
    return null;
  }
}

export async function getAhrefsBacklinks(
  apiKey: string,
  domain: string,
  limit: number = 20
): Promise<AhrefsBacklinksResponse | null> {
  try {
    const response = await fetch("https://api.ahrefs.com/v3/backlinks", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: domain,
        mode: "domain",
        limit,
        order_by: "domain_rating:desc",
      }),
    });

    if (!response.ok) {
      console.error(`Ahrefs API error: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Ahrefs backlinks:", error);
    return null;
  }
}

export function calculateAhrefsScore(metrics: AhrefsDomainMetrics): number {
  let score = 50; // Base score

  // Domain Rating (0-100) - weight: 30
  if (metrics.domain_rating >= 80) score += 25;
  else if (metrics.domain_rating >= 60) score += 15;
  else if (metrics.domain_rating >= 40) score += 8;

  // Referring Domains - weight: 25
  if (metrics.referring_domains >= 500) score += 20;
  else if (metrics.referring_domains >= 100) score += 12;
  else if (metrics.referring_domains >= 20) score += 6;

  // Organic Keywords - weight: 25
  if (metrics.organic_keywords >= 1000) score += 20;
  else if (metrics.organic_keywords >= 300) score += 12;
  else if (metrics.organic_keywords >= 50) score += 6;

  // Organic Traffic - weight: 20
  if (metrics.organic_traffic >= 10000) score += 15;
  else if (metrics.organic_traffic >= 1000) score += 9;
  else if (metrics.organic_traffic >= 100) score += 4;

  return Math.min(100, score);
}

export function detectAhrefsIssues(metrics: AhrefsDomainMetrics) {
  const issues = [];

  // Low domain authority
  if (metrics.domain_rating < 20) {
    issues.push({
      category: "Authority",
      title: "Low domain authority",
      evidence: `Domain Rating: ${metrics.domain_rating}/100`,
      severity: "medium",
      impact: "High",
      fix: "Build high-quality backlinks from authoritative sites",
      effort: "High",
      priority: 1,
    });
  }

  // Low referring domains
  if (metrics.referring_domains < 20) {
    issues.push({
      category: "Backlinks",
      title: "Limited backlink profile",
      evidence: `Only ${metrics.referring_domains} referring domains`,
      severity: "high",
      impact: "High",
      fix: "Develop a backlink strategy targeting relevant, authoritative domains",
      effort: "High",
      priority: 2,
    });
  }

  // Low keyword visibility
  if (metrics.organic_keywords < 50) {
    issues.push({
      category: "Visibility",
      title: "Low keyword visibility",
      evidence: `Only ranking for ${metrics.organic_keywords} keywords`,
      severity: "high",
      impact: "High",
      fix: "Create optimized content targeting high-intent keywords",
      effort: "High",
      priority: 3,
    });
  }

  // Low organic traffic
  if (metrics.organic_traffic < 100) {
    issues.push({
      category: "Traffic",
      title: "Low organic traffic",
      evidence: `${metrics.organic_traffic} monthly visits from search`,
      severity: "high",
      impact: "Very High",
      fix: "Improve rankings and CTR through content and technical SEO",
      effort: "High",
      priority: 4,
    });
  }

  // No paid presence
  if (!metrics.paid_traffic || metrics.paid_traffic === 0) {
    issues.push({
      category: "Opportunity",
      title: "No paid search presence",
      evidence: "Not running paid search campaigns",
      severity: "low",
      impact: "Medium",
      fix: "Consider supplementing organic with PPC for competitive keywords",
      effort: "Medium",
      priority: 5,
    });
  }

  return issues;
}
