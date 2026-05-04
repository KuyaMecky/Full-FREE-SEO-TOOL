export interface AhrefsBacklink {
  url?: string;
  referringUrl?: string;
  anchorText?: string;
  domainRating?: number;
  ahrefs_rank?: number;
  linkType?: 'dofollow' | 'nofollow';
  lastSeen?: string;
  firstSeen?: string;
  trafficValue?: number;
}

export interface LinkQualityScore {
  url: string;
  referringUrl: string;
  anchorText?: string;
  domainRating: number;
  toxicityScore: number; // 0-100, higher = more toxic
  qualityScore: number; // 0-100, higher = better quality
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'keep' | 'monitor' | 'disavow';
  flags: string[];
  reasons: string[];
}

export interface LinkQualityReport {
  totalBacklinks: number;
  averageQuality: number;
  averageToxicity: number;
  healthScore: number; // 0-100
  byRiskLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recommendedDisavows: LinkQualityScore[];
  recommendedMonitor: LinkQualityScore[];
  topQualityLinks: LinkQualityScore[];
}

const SPAM_DOMAINS = [
  'casino', 'poker', 'bet365', 'slots', 'viagra', 'cialis',
  'loan', 'credit', 'mortgage', 'forex', 'trading',
];

const SUSPICIOUS_PATTERNS = [
  /\b(spam|scam|fake|phishing)\b/i,
  /test|demo|example|temp/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP address
];

export function scoreLinkQuality(link: AhrefsBacklink): LinkQualityScore {
  const flags: string[] = [];
  const reasons: string[] = [];
  let toxicity = 0;
  let quality = 100;

  const url = link.url || '';
  const referringUrl = link.referringUrl || '';
  const anchorText = link.anchorText || '';
  const dr = link.domainRating || 0;
  const linkType = link.linkType || 'dofollow';

  // Domain Rating assessment (0-25 points toxicity reduction)
  if (dr < 10) {
    toxicity += 25;
    flags.push('very-low-domain-rating');
    reasons.push(`Domain rating ${dr} indicates low authority`);
  } else if (dr < 20) {
    toxicity += 15;
    flags.push('low-domain-rating');
    reasons.push(`Domain rating ${dr} is below average`);
  } else if (dr >= 50) {
    quality += 10;
    reasons.push(`High domain rating (${dr}) indicates authority`);
  }

  // Nofollow assessment
  if (linkType === 'nofollow') {
    toxicity += 10;
    flags.push('nofollow-link');
    reasons.push('Nofollow links do not pass link equity');
  }

  // Anchor text analysis (0-30 points)
  if (anchorText) {
    const anchorLower = anchorText.toLowerCase();
    const wordCount = anchorText.split(/\s+/).length;

    // Keyword stuffing
    if (wordCount > 10) {
      toxicity += 15;
      flags.push('long-anchor-text');
      reasons.push(`Anchor text is unusually long (${wordCount} words)`);
    }

    // Money keywords
    const moneyKeywords = [
      'buy', 'cheap', 'free', 'best', 'top', 'cheap', 'discount',
    ];
    const hasMoney = moneyKeywords.some((k) => anchorLower.includes(k));
    if (hasMoney && wordCount > 3) {
      toxicity += 12;
      flags.push('money-keyword-anchor');
      reasons.push('Anchor text contains promotional keywords');
    }

    // Special characters in anchor (often indicates spammy content)
    if (anchorText.match(/[!@#$%^&*()_+=\[\]{};':"\\|,.<>?\/]/g)) {
      toxicity += 10;
      flags.push('special-chars-anchor');
      reasons.push('Anchor text contains unusual special characters');
    }

    // Partial match keywords (lower toxicity than exact match)
    if (anchorLower === 'click here' || anchorLower === 'more' ||
        anchorLower === 'read more' || anchorLower === 'here') {
      quality += 5;
      reasons.push('Anchor text is naturally-written');
    }
  }

  // Referring domain analysis (0-25 points)
  if (referringUrl) {
    try {
      const refDomain = new URL(referringUrl).hostname || '';

      // Check for spam domain categories
      if (SPAM_DOMAINS.some((spam) => refDomain.includes(spam))) {
        toxicity += 30;
        flags.push('spam-domain-category');
        reasons.push('Referring domain is in known spam category');
      }

      // Check for suspicious patterns
      if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(refDomain))) {
        toxicity += 20;
        flags.push('suspicious-domain-pattern');
        reasons.push('Domain name matches suspicious patterns');
      }

      // Brand new domains (less than 30 days old)
      if (link.firstSeen) {
        const firstSeenDate = new Date(link.firstSeen).getTime();
        const daysSinceCreation = (Date.now() - firstSeenDate) / (1000 * 60 * 60 * 24);
        if (daysSinceCreation < 30) {
          toxicity += 15;
          flags.push('new-referring-domain');
          reasons.push(`Referring domain is less than ${Math.round(daysSinceCreation)} days old`);
        }
      }

      // Check for private registrant
      if (refDomain.includes('privacy') || refDomain.includes('whois')) {
        toxicity += 8;
        flags.push('private-registrant');
      }
    } catch {
      toxicity += 5;
      reasons.push('Could not fully validate referring domain');
    }
  }

  // Link age (recency assessment)
  if (link.lastSeen) {
    const lastSeenDate = new Date(link.lastSeen).getTime();
    const daysSinceLastSeen = (Date.now() - lastSeenDate) / (1000 * 60 * 60 * 24);

    if (daysSinceLastSeen > 180) {
      toxicity += 5;
      flags.push('stale-link');
      reasons.push('Link has not been seen in over 6 months');
    } else if (daysSinceLastSeen < 7) {
      quality += 5;
      reasons.push('Recently verified link');
    }
  }

  // Traffic value assessment
  if (link.trafficValue && link.trafficValue > 0) {
    if (link.trafficValue > 100) {
      quality += 15;
      reasons.push('Link comes from page with significant traffic');
    } else if (link.trafficValue > 10) {
      quality += 8;
      reasons.push('Link comes from relevant traffic source');
    }
  }

  // Clamp scores
  toxicity = Math.min(100, Math.max(0, toxicity));
  quality = Math.min(100, Math.max(0, quality));

  // Calculate risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (toxicity >= 75) riskLevel = 'critical';
  else if (toxicity >= 50) riskLevel = 'high';
  else if (toxicity >= 30) riskLevel = 'medium';

  // Recommendation
  let recommendation: 'keep' | 'monitor' | 'disavow' = 'keep';
  if (toxicity >= 70) {
    recommendation = 'disavow';
  } else if (toxicity >= 40) {
    recommendation = 'monitor';
  }

  // Adjust quality score based on risk
  const adjustedQuality = quality - toxicity / 2;

  return {
    url,
    referringUrl,
    anchorText,
    domainRating: dr,
    toxicityScore: toxicity,
    qualityScore: Math.max(0, adjustedQuality),
    riskLevel,
    recommendation,
    flags,
    reasons,
  };
}

export function generateQualityReport(links: LinkQualityScore[]): LinkQualityReport {
  if (links.length === 0) {
    return {
      totalBacklinks: 0,
      averageQuality: 0,
      averageToxicity: 0,
      healthScore: 100,
      byRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      recommendedDisavows: [],
      recommendedMonitor: [],
      topQualityLinks: [],
    };
  }

  const averageToxicity =
    links.reduce((sum, l) => sum + l.toxicityScore, 0) / links.length;
  const averageQuality =
    links.reduce((sum, l) => sum + l.qualityScore, 0) / links.length;

  const byRiskLevel = {
    low: links.filter((l) => l.riskLevel === 'low').length,
    medium: links.filter((l) => l.riskLevel === 'medium').length,
    high: links.filter((l) => l.riskLevel === 'high').length,
    critical: links.filter((l) => l.riskLevel === 'critical').length,
  };

  const healthScore = Math.max(0, 100 - averageToxicity);

  const recommendedDisavows = links
    .filter((l) => l.recommendation === 'disavow')
    .sort((a, b) => b.toxicityScore - a.toxicityScore)
    .slice(0, 20);

  const recommendedMonitor = links
    .filter((l) => l.recommendation === 'monitor')
    .sort((a, b) => b.toxicityScore - a.toxicityScore)
    .slice(0, 20);

  const topQualityLinks = links
    .filter((l) => l.recommendation === 'keep')
    .sort((a, b) => b.qualityScore - a.qualityScore)
    .slice(0, 20);

  return {
    totalBacklinks: links.length,
    averageQuality,
    averageToxicity,
    healthScore,
    byRiskLevel,
    recommendedDisavows,
    recommendedMonitor,
    topQualityLinks,
  };
}
