'use client';

import { useState, useCallback } from 'react';

export interface KeywordDifficulty {
  keyword: string;
  difficulty: number;
  volume: number;
  cpc: number;
  intent: string;
  opportunityScore: number;
}

export function useAhrefsKeywordData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywordData = useCallback(async (keywords: string[]): Promise<KeywordDifficulty[]> => {
    if (!keywords.length) return [];

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/keywords/ahrefs-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch keyword data');
      }

      const data = await res.json();
      return data.keywords || [];
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchKeywordData, loading, error };
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty < 20) return 'bg-green-100 text-green-800';
  if (difficulty < 40) return 'bg-blue-100 text-blue-800';
  if (difficulty < 60) return 'bg-yellow-100 text-yellow-800';
  if (difficulty < 80) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty < 20) return 'Easy';
  if (difficulty < 40) return 'Moderate';
  if (difficulty < 60) return 'Medium';
  if (difficulty < 80) return 'Hard';
  return 'Very Hard';
}
