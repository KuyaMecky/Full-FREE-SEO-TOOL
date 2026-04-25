export interface ReadabilityResult {
  score: number; // 0–100, higher = more readable
  grade: string; // "Easy" | "Standard" | "Difficult"
  fleschKincaid: number;
  avgSentenceLength: number;
  avgSyllablesPerWord: number;
  passiveVoicePercent: number;
  keywordDensity: number;
  wordCount: number;
  sentenceCount: number;
  issues: string[];
  suggestions: string[];
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const PASSIVE_PATTERNS = /\b(was|were|is|are|been|being|be|am)\s+\w+ed\b/gi;

export function scoreReadability(htmlContent: string, focusKeyword = ""): ReadabilityResult {
  const text = stripHtml(htmlContent);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;

  // Sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);
  const avgSentenceLength = wordCount / sentenceCount;

  // Syllables
  const totalSyllables = words.reduce((s, w) => s + countSyllables(w), 0);
  const avgSyllablesPerWord = totalSyllables / Math.max(1, wordCount);

  // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
  const fleschKincaid = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  const clampedFK = Math.max(0, Math.min(100, fleschKincaid));

  // Passive voice
  const passiveMatches = (text.match(PASSIVE_PATTERNS) ?? []).length;
  const passiveVoicePercent = (passiveMatches / sentenceCount) * 100;

  // Keyword density
  let keywordDensity = 0;
  if (focusKeyword && wordCount > 0) {
    const kwWords = focusKeyword.toLowerCase().split(/\s+/).length;
    const regex = new RegExp(focusKeyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    const matches = (text.toLowerCase().match(regex) ?? []).length;
    keywordDensity = (matches * kwWords) / wordCount * 100;
  }

  // Score (0-100)
  const score = Math.round(clampedFK);
  const grade = score >= 70 ? "Easy" : score >= 50 ? "Standard" : "Difficult";

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (avgSentenceLength > 25) {
    issues.push(`Average sentence length is ${avgSentenceLength.toFixed(1)} words (aim for <20)`);
    suggestions.push("Break long sentences into two shorter ones");
  }
  if (passiveVoicePercent > 20) {
    issues.push(`${passiveVoicePercent.toFixed(0)}% of sentences use passive voice (aim for <10%)`);
    suggestions.push("Rewrite passive sentences in active voice");
  }
  if (focusKeyword && keywordDensity < 0.5) {
    issues.push(`Keyword density is ${keywordDensity.toFixed(2)}% — too low (aim for 0.5%–2%)`);
    suggestions.push(`Use "${focusKeyword}" more naturally throughout the content`);
  }
  if (focusKeyword && keywordDensity > 3) {
    issues.push(`Keyword density is ${keywordDensity.toFixed(2)}% — possible keyword stuffing (aim for <2%)`);
    suggestions.push("Reduce repetition of the focus keyword");
  }
  if (wordCount < 600) {
    issues.push(`Content is only ${wordCount} words — aim for at least 800 for competitive topics`);
    suggestions.push("Expand thin sections with examples, FAQs, or supporting detail");
  }
  if (avgSyllablesPerWord > 2) {
    issues.push("High proportion of complex words — simplify vocabulary where possible");
    suggestions.push("Replace jargon with plain language equivalents");
  }

  return {
    score,
    grade,
    fleschKincaid: Math.round(clampedFK * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
    passiveVoicePercent: Math.round(passiveVoicePercent * 10) / 10,
    keywordDensity: Math.round(keywordDensity * 100) / 100,
    wordCount,
    sentenceCount,
    issues,
    suggestions,
  };
}
