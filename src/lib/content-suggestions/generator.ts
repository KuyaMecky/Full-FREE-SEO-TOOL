export interface ContentSuggestion {
  type: 'ai-generated' | 'competitor-based';
  title: string;
  description: string;
  contentType: 'blog-post' | 'guide' | 'comparison' | 'how-to' | 'case-study' | 'tool' | 'resource';
  estimatedLength: 'short' | 'medium' | 'long'; // 500-1500 | 1500-3000 | 3000+
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  competitors?: string[];
}

export interface ContentPlan {
  keyword: string;
  currentPosition: number;
  searchVolume?: number;
  suggestions: ContentSuggestion[];
  contentGapAnalysis: {
    isContentGap: boolean;
    reason: string;
  };
}

// AI-based content idea generation
export function generateAIContentIdeas(
  keyword: string,
  currentPosition: number,
  searchVolume: number = 0
): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  const keywordLower = keyword.toLowerCase();

  // Determine content priority based on position
  const priority = currentPosition <= 10 ? 'high' : currentPosition <= 20 ? 'medium' : 'low';

  // Type 1: "How to" content (evergreen, high conversion)
  if (!keywordLower.includes('how to') && !keywordLower.includes('guide')) {
    suggestions.push({
      type: 'ai-generated',
      title: `How to ${keyword}: Complete Guide`,
      description: `A comprehensive guide covering everything you need to know about "${keyword}". Include step-by-step instructions, best practices, and common mistakes to avoid.`,
      contentType: 'how-to',
      estimatedLength: 'long',
      priority: priority === 'high' ? 'high' : 'medium',
      reasoning: `"How to" content ranks well for informational queries and builds authority. Currently ranking #${currentPosition}. Detailed guide can improve ranking.`,
    });
  }

  // Type 2: Comparison/Analysis (high intent)
  if (searchVolume > 100 && !keywordLower.includes('vs') && !keywordLower.includes('comparison')) {
    suggestions.push({
      type: 'ai-generated',
      title: `${keyword} Comparison: Options & Analysis`,
      description: `Compare different options, tools, or approaches for "${keyword}". Include pros/cons, pricing, features, and a recommendation matrix.`,
      contentType: 'comparison',
      estimatedLength: 'medium',
      priority,
      reasoning: `High-volume keyword (${searchVolume}+ searches). Comparison content captures users at decision stage. Position #${currentPosition} shows opportunity to move to top 3.`,
    });
  }

  // Type 3: Beginner's Guide (low position + high search volume)
  if (currentPosition > 15 && searchVolume > 200) {
    suggestions.push({
      type: 'ai-generated',
      title: `Beginner's Guide to ${keyword}`,
      description: `Start from the basics. Explain what "${keyword}" is, why it matters, who needs it, and how to get started. Include definitions, terminology, and first steps.`,
      contentType: 'guide',
      estimatedLength: 'long',
      priority: 'high',
      reasoning: `Lower position (#${currentPosition}) with high search intent. Beginner-focused content fills awareness gap and ranks for long-tail variations.`,
    });
  }

  // Type 4: Case Study / Real-world examples
  if (currentPosition > 10) {
    suggestions.push({
      type: 'ai-generated',
      title: `${keyword} in Action: Real-World Case Studies`,
      description: `Show 3-5 real examples of "${keyword}" working in practice. Include before/after, metrics, lessons learned, and what made them successful.`,
      contentType: 'case-study',
      estimatedLength: 'long',
      priority: 'high',
      reasoning: `Case studies build credibility and address "show me it works" objections. Differentiates from competitor content and improves rankings.`,
    });
  }

  // Type 5: Quick Reference / Checklist (if not already ranking well)
  if (currentPosition > 8) {
    suggestions.push({
      type: 'ai-generated',
      title: `${keyword} Checklist & Quick Reference`,
      description: `Create an actionable checklist or quick reference guide for "${keyword}". Make it downloadable and easy to follow.`,
      contentType: 'resource',
      estimatedLength: 'short',
      priority: 'medium',
      reasoning: `Checklists are highly shareable and rank well. Low effort, high conversion. Good complement to longer-form content.`,
    });
  }

  // Type 6: Best Practices / Tips (position 11-20)
  if (currentPosition >= 11 && currentPosition <= 20) {
    suggestions.push({
      type: 'ai-generated',
      title: `${keyword}: Top Tips & Best Practices`,
      description: `Share 5-10 actionable tips and best practices for "${keyword}". Focus on what works, common pitfalls, and pro tips.`,
      contentType: 'blog-post',
      estimatedLength: 'medium',
      priority: 'high',
      reasoning: `Position #${currentPosition} (page 2) is ideal target. Valuable tips content often ranks well and can push you to page 1 within 30 days.`,
    });
  }

  return suggestions;
}

// Competitor-based content suggestions
export function generateCompetitorBasedSuggestions(
  keyword: string,
  competitorTitles: string[],
  competitorDescriptions: string[],
  currentPosition: number
): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  const keywordLower = keyword.toLowerCase();

  // Analyze competitor content patterns
  const allCompetitorContent = [...competitorTitles, ...competitorDescriptions].join(' ').toLowerCase();

  // If competitors have comprehensive guides, suggest you make yours better
  if (
    allCompetitorContent.includes('guide') ||
    allCompetitorContent.includes('ultimate') ||
    allCompetitorContent.includes('complete')
  ) {
    suggestions.push({
      type: 'competitor-based',
      title: `${keyword}: The Ultimate ${new Date().getFullYear()} Guide`,
      description: `Create a more comprehensive, updated version than competitor content. Include latest trends, new tools, and recent case studies that aren't in competitor content.`,
      contentType: 'guide',
      estimatedLength: 'long',
      priority: 'high',
      reasoning: `Competitors rank with guide-format content. Create a superior, more current version to outrank them. Currently at position #${currentPosition}.`,
      competitors: competitorTitles.slice(0, 3),
    });
  }

  // If competitors focus on theory, suggest practical/how-to content
  if (
    allCompetitorContent.includes('definition') ||
    allCompetitorContent.includes('what is') ||
    allCompetitorContent.includes('overview')
  ) {
    suggestions.push({
      type: 'competitor-based',
      title: `How to ${keyword} (Practical, Step-by-Step)`,
      description: `Competitors explain "what it is" but don't show "how to do it". Fill this gap with practical, actionable instructions. Include screenshots, tools, and real examples.`,
      contentType: 'how-to',
      estimatedLength: 'long',
      priority: 'high',
      reasoning: `Content gap: competitors provide theory, users need practice. Step-by-step content differentiates you and captures high-intent users.`,
      competitors: competitorTitles.slice(0, 3),
    });
  }

  // If competitors have comparison content, suggest tools/resources
  if (allCompetitorContent.includes('comparison') || allCompetitorContent.includes('vs')) {
    suggestions.push({
      type: 'competitor-based',
      title: `${keyword} Tools & Resources Directory`,
      description: `Create a curated directory of the best tools, software, or resources for "${keyword}". Include ratings, pricing, features comparison, and free vs paid options.`,
      contentType: 'resource',
      estimatedLength: 'medium',
      priority: 'medium',
      reasoning: `Complement comparison content with actionable tools list. Users searching for recommendations will find value and link to your resource.`,
      competitors: competitorTitles.slice(0, 3),
    });
  }

  // Check for content freshness angle
  const year = new Date().getFullYear();
  if (!allCompetitorContent.includes(year.toString())) {
    suggestions.push({
      type: 'competitor-based',
      title: `${keyword}: What's Changed in ${year}`,
      description: `Create "what's new" content covering 2024-2025 changes, trends, and updates relevant to "${keyword}". Highlight how things have evolved since older content.`,
      contentType: 'blog-post',
      estimatedLength: 'medium',
      priority: currentPosition > 10 ? 'high' : 'medium',
      reasoning: `Competitors' content is outdated. Fresh, current content ranks better. Highlight ${year} updates and trends they're missing.`,
      competitors: competitorTitles.slice(0, 2),
    });
  }

  return suggestions;
}

export function analyzeContentGap(
  keyword: string,
  currentPosition: number,
  hasExistingContent: boolean,
  searchVolume: number = 0
): { isGap: boolean; reason: string } {
  if (!hasExistingContent && currentPosition < 100) {
    return {
      isGap: true,
      reason: `You're ranking #${currentPosition} without content specifically for "${keyword}". Creating dedicated content can boost ranking 3-5 positions.`,
    };
  }

  if (currentPosition > 10 && searchVolume > 100) {
    return {
      isGap: true,
      reason: `High search volume (${searchVolume}+ monthly) + position #${currentPosition} = major opportunity. Quality content can move you to page 1.`,
    };
  }

  if (currentPosition >= 11 && currentPosition <= 20) {
    return {
      isGap: true,
      reason: `Position #${currentPosition} is the "next page 1" sweet spot. One good content update can push you into top 10.`,
    };
  }

  return {
    isGap: false,
    reason: 'Already ranking well. Consider updating existing content instead of creating new.',
  };
}

export function buildContentPlan(
  keyword: string,
  currentPosition: number,
  searchVolume: number = 0,
  competitorTitles: string[] = [],
  hasExistingContent: boolean = false
): ContentPlan {
  const aiSuggestions = generateAIContentIdeas(keyword, currentPosition, searchVolume);
  const competitorSuggestions = generateCompetitorBasedSuggestions(
    keyword,
    competitorTitles,
    [],
    currentPosition
  );

  const contentGap = analyzeContentGap(keyword, currentPosition, hasExistingContent, searchVolume);

  const suggestions = [...aiSuggestions, ...competitorSuggestions]
    .filter((s, i, arr) => arr.findIndex((x) => x.title === s.title) === i) // Remove duplicates
    .sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority];
    });

  return {
    keyword,
    currentPosition,
    searchVolume,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    contentGapAnalysis: contentGap,
  };
}
