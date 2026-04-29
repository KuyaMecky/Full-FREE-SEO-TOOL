import { prisma } from "@/lib/prisma";

// Impact scoring for issues
export function calculateIssueImpact(
  issueType: string,
  affectedPages: number,
  severity: "critical" | "high" | "medium" | "low"
): {
  impactScore: number;
  estimatedTraffic: number;
  fixComplexity: number;
  priority: number;
} {
  const severityScores = {
    critical: 9,
    high: 7,
    medium: 4,
    low: 2,
  };

  const severityScore = severityScores[severity];

  // Higher impact for common issues affecting many pages
  const pageImpact = Math.min(affectedPages / 100, 1) * 10;

  // Issue type multipliers based on typical SEO impact
  const typeMultipliers: Record<string, number> = {
    "missing-meta-description": 0.4,
    "duplicate-meta-description": 0.3,
    "missing-title": 0.9,
    "duplicate-title": 0.7,
    "missing-h1": 0.6,
    "broken-links": 0.5,
    "slow-page-speed": 0.8,
    "mobile-usability": 0.7,
    "missing-alt-text": 0.3,
    "redirect-chain": 0.6,
    "duplicate-content": 0.85,
    "missing-schema": 0.4,
    "indexing-issues": 0.95,
    "crawlability-issues": 0.9,
    default: 0.5,
  };

  const multiplier = typeMultipliers[issueType] || typeMultipliers.default;
  const impactScore = (severityScore * multiplier + pageImpact) / 2;

  // Estimate traffic impact (very conservative)
  const estimatedTraffic = Math.round(
    (affectedPages * (impactScore / 10) * multiplier) / 10
  );

  // Fix complexity based on issue type
  const complexityMap: Record<string, number> = {
    "missing-meta-description": 1,
    "duplicate-meta-description": 2,
    "missing-title": 1,
    "duplicate-title": 2,
    "missing-h1": 2,
    "broken-links": 3,
    "slow-page-speed": 7,
    "mobile-usability": 6,
    "missing-alt-text": 2,
    "redirect-chain": 4,
    "duplicate-content": 6,
    "missing-schema": 3,
    "indexing-issues": 8,
    "crawlability-issues": 7,
  };

  const fixComplexity = complexityMap[issueType] || 4;

  // Priority = impact + urgency - complexity
  const priority = Math.round((impactScore * 2 + severityScore - fixComplexity * 0.5) / 2);

  return {
    impactScore: Math.min(Math.round(impactScore * 10) / 10, 10),
    estimatedTraffic,
    fixComplexity: Math.min(fixComplexity, 10),
    priority: Math.min(Math.max(priority, 1), 10),
  };
}

// Generate AI recommendations
export function generateRecommendation(
  issue: string,
  affectedPages: number,
  impact: {
    impactScore: number;
    estimatedTraffic: number;
    fixComplexity: number;
    priority: number;
  }
): {
  title: string;
  description: string;
  actionPlan: string;
  estimatedImpact: string;
  impactMetric: string;
  timeInvestment: string;
} {
  const recommendations: Record<
    string,
    {
      title: string;
      description: string;
      actionPlan: string;
      timePerPage: number;
    }
  > = {
    "missing-meta-description": {
      title: "Add meta descriptions to improve CTR",
      description:
        "Meta descriptions appear in search results and significantly impact click-through rate. Average CTR improvement: 5-10%.",
      actionPlan: `1. Identify all pages missing meta descriptions
2. Write unique, compelling descriptions (120-160 chars)
3. Include primary keyword naturally
4. Ensure each description is unique
5. Test updated descriptions in Search Console
6. Monitor CTR changes weekly`,
      timePerPage: 2,
    },
    "missing-title": {
      title: "Create optimized title tags",
      description:
        "Title tags are crucial for SEO and CTR. Missing titles hurt both ranking and click-through rate.",
      actionPlan: `1. Audit all pages for missing title tags
2. Create titles 50-60 characters
3. Include primary keyword at start if natural
4. Make titles compelling and unique
5. Follow format: [Keyword] | [Benefit] | [Brand]
6. Update in your CMS/platform
7. Test in Search Console`,
      timePerPage: 3,
    },
    "broken-links": {
      title: "Fix broken internal links",
      description:
        "Broken links hurt user experience and waste crawl budget. They also pass no authority.",
      actionPlan: `1. Extract list of broken links
2. For each link:
   - If page deleted: Remove link or add redirect
   - If page moved: Update link to new URL
   - If page still exists: Fix typo in URL
3. Check anchor text is descriptive
4. Retest all links
5. Update your crawl monitoring`,
      timePerPage: 5,
    },
    "slow-page-speed": {
      title: "Improve Core Web Vitals & Page Speed",
      description:
        "Page speed is a ranking factor and affects conversion rates. Fast pages convert 3-5% better.",
      actionPlan: `1. Run PageSpeed Insights on slow pages
2. Implement top recommendations:
   - Compress images (use WebP format)
   - Enable GZIP compression
   - Minimize CSS/JS
   - Leverage browser caching
3. Consider CDN for assets
4. Reduce server response time
5. Defer non-critical JavaScript
6. Retest and monitor monthly`,
      timePerPage: 10,
    },
    "duplicate-content": {
      title: "Consolidate or canonicalize duplicate content",
      description:
        "Duplicate content dilutes authority across pages and confuses search engines about which version to rank.",
      actionPlan: `1. Identify canonical version of each duplicate
2. Choose canonical based on:
   - Most authoritative version
   - Better optimized for keywords
   - Preferred URL structure
3. Add canonical tag to duplicate versions
4. Set preferred domain in Search Console
5. Consolidate internal linking to canonical
6. Monitor ranking recovery (2-4 weeks)`,
      timePerPage: 8,
    },
    "missing-schema": {
      title: "Add structured data markup",
      description:
        "Schema.org markup helps search engines understand content. Can result in rich snippets and 5-10% CTR increase.",
      actionPlan: `1. Identify content type (Article, Product, FAQ, etc.)
2. Choose Schema.org vocabulary
3. Add JSON-LD structured data:
   - Use tool like schema.org/vocalbulary
   - Validate with Google's Rich Results Test
4. Implement in template or CMS
5. Test with Structured Data Testing Tool
6. Monitor for rich snippet eligibility`,
      timePerPage: 4,
    },
    default: {
      title: "Resolve SEO issue to improve rankings",
      description: `This issue affects ${affectedPages} page(s) and impacts your site's search visibility.`,
      actionPlan: `1. Analyze root cause of issue
2. Develop fix strategy
3. Implement fix across affected pages
4. Test and validate fixes
5. Monitor for improvement`,
      timePerPage: 5,
    },
  };

  const rec = recommendations[issue] || recommendations.default;
  const totalTime = Math.round(affectedPages * (rec.timePerPage / 60) * 10) / 10;

  const estimatedImpact = getImpactLevel(impact.impactScore);
  const impactMetric = `+${impact.estimatedTraffic}-${Math.round(impact.estimatedTraffic * 1.5)} organic clicks/month`;
  const timeInvestment = `${totalTime} hours`;

  return {
    title: rec.title,
    description: rec.description,
    actionPlan: rec.actionPlan,
    estimatedImpact,
    impactMetric,
    timeInvestment,
  };
}

function getImpactLevel(score: number): string {
  if (score >= 8) return "high";
  if (score >= 5) return "medium";
  return "low";
}

// Get actionable quick wins (high impact, low effort)
export function findQuickWins(issues: Array<{
  type: string;
  affectedPages: number;
  severity: "critical" | "high" | "medium" | "low";
}>) {
  return issues
    .map((issue) => {
      const impact = calculateIssueImpact(issue.type, issue.affectedPages, issue.severity);
      return { ...issue, ...impact, roiScore: impact.priority - impact.fixComplexity * 0.3 };
    })
    .sort((a, b) => b.roiScore - a.roiScore)
    .slice(0, 5); // Top 5 quick wins
}

// Content performance analysis
export async function analyzeContentPerformance(
  auditId: string,
  crawlResults: Array<{
    url: string;
    title: string;
    contentLength: number;
  }>
) {
  const analyzed = crawlResults.map((page) => {
    // Readability score (Flesch Reading Ease approximation)
    const wordCount = Math.max(page.contentLength / 5, 100); // Rough estimate
    const readabilityScore = Math.min(100, (wordCount / 3000) * 100);

    // Content recommendations
    const recommendations: string[] = [];
    if (wordCount < 300)
      recommendations.push("Consider adding more content - 1000+ words typically ranks better");
    if (wordCount > 3000)
      recommendations.push("Consider breaking into sub-pages - users may not read all");
    if (!page.title || page.title.length < 30)
      recommendations.push("Expand title tag for better CTR and keyword coverage");

    return {
      url: page.url,
      title: page.title,
      contentLength: page.contentLength,
      readabilityScore: Math.round(readabilityScore),
      recommendations,
      performanceScore: 0, // Will be filled with PageSpeed data
      keywords: [], // Will be filled with ranking data
    };
  });

  return analyzed;
}

// Keyword opportunity finder
export function findKeywordOpportunities(
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    ranking?: number;
  }>
) {
  // Find keywords with high volume, low difficulty, not yet ranking
  return keywords
    .filter((k) => k.searchVolume > 100 && k.difficulty < 40 && (!k.ranking || k.ranking > 50))
    .sort((a, b) => (b.searchVolume / (b.difficulty + 1)) - (a.searchVolume / (a.difficulty + 1)))
    .slice(0, 20);
}
