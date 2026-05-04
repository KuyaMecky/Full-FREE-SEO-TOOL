export interface ContentGap {
  keyword: string;
  competitorRank: number;
  yourRank: number | null;
  volume: number;
  competitorDomain: string;
  difficultyScore: number;
  opportunityScore: number;
  category: 'easy_win' | 'moderate' | 'competitive' | 'difficult';
}

export function analyzeGaps(
  yourKeywords: Map<string, number>,
  competitorKeywords: Map<string, { rank: number; domain: string; difficulty?: number }>,
  volumeData?: Map<string, number>
): ContentGap[] {
  const gaps: ContentGap[] = [];

  for (const [keyword, compData] of competitorKeywords) {
    const yourRank = yourKeywords.get(keyword.toLowerCase()) || null;

    if (!yourRank || yourRank > compData.rank + 5) {
      const volume = volumeData?.get(keyword) || 100;
      const difficulty = compData.difficulty || 50;

      const opportunityScore = calculateOpportunityScore(
        volume,
        difficulty,
        yourRank
      );

      gaps.push({
        keyword,
        competitorRank: compData.rank,
        yourRank,
        volume,
        competitorDomain: compData.domain,
        difficultyScore: difficulty,
        opportunityScore,
        category: getGapCategory(opportunityScore),
      });
    }
  }

  return gaps.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function calculateOpportunityScore(
  volume: number,
  difficulty: number,
  yourRank: number | null
): number {
  let score = 0;

  // Volume component (0-40)
  if (volume > 10000) score += 40;
  else if (volume > 1000) score += 30;
  else if (volume > 100) score += 15;

  // Difficulty component (0-30)
  if (difficulty < 30) score += 30;
  else if (difficulty < 60) score += 15;
  else score += 5;

  // Rank component (0-30)
  if (!yourRank) score += 30; // Not ranking
  else if (yourRank > 50) score += 25;
  else if (yourRank > 20) score += 15;
  else score += 5;

  return Math.min(100, score);
}

function getGapCategory(
  score: number
): 'easy_win' | 'moderate' | 'competitive' | 'difficult' {
  if (score >= 75) return 'easy_win';
  if (score >= 50) return 'moderate';
  if (score >= 25) return 'competitive';
  return 'difficult';
}
