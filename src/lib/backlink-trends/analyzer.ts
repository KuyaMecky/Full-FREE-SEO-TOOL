export interface BacklinkRecord {
  url: string;
  referringUrl: string;
  anchorText?: string;
  domainRating?: number;
  linkType?: 'dofollow' | 'nofollow';
  lastCrawled?: string;
}

export interface BacklinkComparison {
  gained: BacklinkRecord[];
  lost: BacklinkRecord[];
  maintained: BacklinkRecord[];
  changed: Array<{
    url: string;
    referringUrl: string;
    previousDR?: number;
    currentDR?: number;
  }>;
}

export interface BacklinkTrend {
  date: Date;
  totalBacklinks: number;
  doFollowCount: number;
  referringDomains: number;
  topReferrers: Array<{ domain: string; count: number; avgDR: number }>;
}

export interface ToxicityScore {
  url: string;
  referringUrl: string;
  score: number; // 0-100, higher = more toxic
  flags: string[];
  recommendation: 'keep' | 'monitor' | 'disavow';
}

export function parseBacklinkCSV(csvContent: string): BacklinkRecord[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map((h) => h.trim());

  const urlIndex = headers.findIndex((h) => h.includes('url'));
  const referringIndex = headers.findIndex(
    (h) => h.includes('referring') || h.includes('source')
  );
  const anchorIndex = headers.findIndex((h) => h.includes('anchor'));
  const drIndex = headers.findIndex((h) => h.includes('dr') || h.includes('rating'));
  const typeIndex = headers.findIndex((h) => h.includes('type') || h.includes('follow'));

  if (urlIndex === -1 || referringIndex === -1) {
    throw new Error('CSV must contain "url" and "referring_url" columns');
  }

  const records: BacklinkRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cells = line.split(',').map((c) => c.trim());

    records.push({
      url: cells[urlIndex] || '',
      referringUrl: cells[referringIndex] || '',
      anchorText: anchorIndex >= 0 ? cells[anchorIndex] : undefined,
      domainRating: drIndex >= 0 ? parseInt(cells[drIndex]) || undefined : undefined,
      linkType:
        typeIndex >= 0
          ? cells[typeIndex].toLowerCase().includes('dofollow')
            ? 'dofollow'
            : 'nofollow'
          : undefined,
    });
  }

  return records;
}

export function compareBacklinks(
  previous: BacklinkRecord[],
  current: BacklinkRecord[]
): BacklinkComparison {
  const previousMap = new Map(
    previous.map((b) => [`${b.url}||${b.referringUrl}`, b])
  );
  const currentMap = new Map(
    current.map((b) => [`${b.url}||${b.referringUrl}`, b])
  );

  const gained: BacklinkRecord[] = [];
  const lost: BacklinkRecord[] = [];
  const maintained: BacklinkRecord[] = [];
  const changed: BacklinkComparison['changed'] = [];

  // Find gained and maintained
  for (const [key, currentRecord] of currentMap) {
    const previousRecord = previousMap.get(key);
    if (!previousRecord) {
      gained.push(currentRecord);
    } else {
      maintained.push(currentRecord);

      // Check if DR changed
      if (
        currentRecord.domainRating &&
        previousRecord.domainRating &&
        currentRecord.domainRating !== previousRecord.domainRating
      ) {
        changed.push({
          url: currentRecord.url,
          referringUrl: currentRecord.referringUrl,
          previousDR: previousRecord.domainRating,
          currentDR: currentRecord.domainRating,
        });
      }
    }
  }

  // Find lost
  for (const [key, previousRecord] of previousMap) {
    if (!currentMap.has(key)) {
      lost.push(previousRecord);
    }
  }

  return { gained, lost, maintained, changed };
}

export function scoreToxicity(record: BacklinkRecord): ToxicityScore {
  let score = 0;
  const flags: string[] = [];

  // Check domain rating (low DR = higher toxicity risk)
  if (!record.domainRating || record.domainRating < 10) {
    score += 25;
    flags.push('low-domain-rating');
  } else if (record.domainRating < 30) {
    score += 10;
    flags.push('moderate-domain-rating');
  }

  // Check nofollow
  if (record.linkType === 'nofollow') {
    score += 5;
    flags.push('nofollow');
  }

  // Check anchor text patterns
  if (record.anchorText) {
    const anchor = record.anchorText.toLowerCase();

    // Keyword stuffing indicators
    if (anchor.split(' ').length > 10) {
      score += 20;
      flags.push('long-anchor-text');
    }

    // Exact match money keywords
    const moneyKeywords = [
      'best',
      'cheap',
      'free',
      'casino',
      'poker',
      'slots',
      'viagra',
      'loans',
    ];
    if (moneyKeywords.some((k) => anchor.includes(k))) {
      score += 15;
      flags.push('money-keyword-anchor');
    }

    // Over-optimized patterns
    if (anchor.match(/[^a-z0-9\s]/i) && anchor.length > 20) {
      score += 10;
      flags.push('special-characters-anchor');
    }
  }

  // Check referring URL patterns
  if (record.referringUrl) {
    const referringDomain = new URL(record.referringUrl).hostname;

    // Check for spam indicators in domain
    if (
      referringDomain.includes('casino') ||
      referringDomain.includes('poker') ||
      referringDomain.includes('bet')
    ) {
      score += 30;
      flags.push('spam-domain-category');
    }

    // Check for generic/placeholder domains
    if (referringDomain.match(/^test|^demo|^example|^localhost/i)) {
      score += 15;
      flags.push('test-domain');
    }
  }

  score = Math.min(100, score);

  let recommendation: 'keep' | 'monitor' | 'disavow' = 'keep';
  if (score >= 70) {
    recommendation = 'disavow';
  } else if (score >= 40) {
    recommendation = 'monitor';
  }

  return {
    url: record.url,
    referringUrl: record.referringUrl,
    score,
    flags,
    recommendation,
  };
}

export function getBacklinkMetrics(records: BacklinkRecord[]) {
  const domains = new Set(
    records.map((b) => {
      try {
        return new URL(b.referringUrl).hostname;
      } catch {
        return '';
      }
    })
  );

  const topReferrers = new Map<
    string,
    { count: number; drSum: number; drCount: number }
  >();

  for (const record of records) {
    try {
      const domain = new URL(record.referringUrl).hostname || '';
      if (!domain) continue;

      const current = topReferrers.get(domain) || {
        count: 0,
        drSum: 0,
        drCount: 0,
      };

      current.count++;
      if (record.domainRating) {
        current.drSum += record.domainRating;
        current.drCount++;
      }

      topReferrers.set(domain, current);
    } catch {
      // Skip invalid URLs
    }
  }

  const sortedReferrers = Array.from(topReferrers.entries())
    .map(([domain, data]) => ({
      domain,
      count: data.count,
      avgDR: data.drCount > 0 ? Math.round(data.drSum / data.drCount) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const doFollowCount = records.filter((b) => b.linkType === 'dofollow').length;

  return {
    totalBacklinks: records.length,
    referringDomains: domains.size - 1, // Exclude empty strings
    doFollowCount,
    noFollowCount: records.length - doFollowCount,
    topReferrers: sortedReferrers,
  };
}
