export interface AhrefsKeywordData {
  keyword: string;
  difficulty: number;
  volume: number;
  cpc: number;
  clicks: number;
  intent: 'commercial' | 'informational' | 'navigational' | 'transactional' | 'unknown';
}

export async function getAhrefsKeywordData(
  apiKey: string,
  keywords: string[]
): Promise<AhrefsKeywordData[]> {
  if (!keywords.length) return [];

  try {
    const results: AhrefsKeywordData[] = [];

    for (const keyword of keywords.slice(0, 100)) {
      try {
        const response = await fetch('https://api.ahrefs.com/v3/keywords-explorer', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            country: 'US',
          }),
        });

        if (!response.ok) continue;

        const data = await response.json();

        results.push({
          keyword,
          difficulty: data.keyword_difficulty || 0,
          volume: data.search_volume || 0,
          cpc: data.cpc || 0,
          clicks: data.clicks || 0,
          intent: data.search_intent || 'unknown',
        });
      } catch (error) {
        console.error(`Failed to fetch keyword ${keyword}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to fetch Ahrefs keyword data:', error);
    return [];
  }
}

export function calculateOpportunityScore(
  difficulty: number,
  volume: number,
  currentRank?: number
): number {
  let score = 0;

  // Difficulty component (0-30)
  if (difficulty < 10) score += 30;
  else if (difficulty < 30) score += 20;
  else if (difficulty < 60) score += 10;

  // Volume component (0-40)
  if (volume > 10000) score += 40;
  else if (volume > 1000) score += 30;
  else if (volume > 100) score += 15;
  else if (volume > 10) score += 5;

  // Rank component (0-30, if available)
  if (currentRank) {
    if (currentRank < 3) score += 0; // Already ranking well
    else if (currentRank < 11) score += 15;
    else if (currentRank < 21) score += 25;
    else score += 30; // Easy opportunity
  }

  return Math.min(100, score);
}

export function getIntentIcon(intent: string): string {
  switch (intent) {
    case 'commercial':
      return '💰';
    case 'transactional':
      return '🛒';
    case 'informational':
      return '📚';
    case 'navigational':
      return '🧭';
    default:
      return '❓';
  }
}
