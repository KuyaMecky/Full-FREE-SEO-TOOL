'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';

interface ContentMetrics {
  url: string;
  wordCount: number;
  readabilityScore: number; // 0-100 (higher is more readable)
  readabilityGrade: string; // Grade level
  h1Count: number;
  h2Count: number;
  h3Count: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  contentScore: number; // Overall 0-100
  issues: {
    title: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
  }[];
}

interface ContentAnalyzerProps {
  auditId: string;
}

export function ContentAnalyzer({ auditId }: ContentAnalyzerProps) {
  const [pages, setPages] = useState<ContentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'score' | 'wordcount' | 'readability'>('score');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch('/api/content/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auditId }),
        });

        if (res.ok) {
          const data = res.json();
          setPages(data.pages || []);
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch content metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [auditId]);

  const sorted = [...pages].sort((a, b) => {
    switch (sortBy) {
      case 'wordcount':
        return b.wordCount - a.wordCount;
      case 'readability':
        return b.readabilityScore - a.readabilityScore;
      default:
        return b.contentScore - a.contentScore;
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      default:
        return 'ℹ️';
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-700 h-48 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Content Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Word Count</p>
            <p className="text-2xl font-bold text-cyan-400">
              {Math.round(stats.avgWordCount)}
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Readability</p>
            <p className="text-2xl font-bold text-blue-400">
              {Math.round(stats.avgReadability)}/100
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Content Score</p>
            <p className="text-2xl font-bold text-green-400">
              {Math.round(stats.avgContentScore)}/100
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Pages Analyzed</p>
            <p className="text-2xl font-bold text-purple-400">
              {pages.length}
            </p>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex gap-2">
        {(['score', 'wordcount', 'readability'] as const).map((sort) => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              sortBy === sort
                ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {sort === 'score' && 'Content Score'}
            {sort === 'wordcount' && 'Word Count'}
            {sort === 'readability' && 'Readability'}
          </button>
        ))}
      </div>

      {/* Content Pages */}
      <div className="space-y-4">
        {sorted.map((page) => (
          <div
            key={page.url}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600"
          >
            {/* URL & Score */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <p className="text-sm text-gray-400 truncate">{page.url}</p>
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(page.contentScore)}`}>
                {page.contentScore}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-3 text-sm mb-3">
              <div>
                <p className="text-gray-500 text-xs">Words</p>
                <p className="text-cyan-400 font-mono font-semibold">
                  {page.wordCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Readability</p>
                <p className="text-blue-400 font-mono font-semibold">
                  {page.readabilityScore}/100
                  <span className="text-gray-500 text-xs block">
                    Grade {page.readabilityGrade}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">H1 / H2 / H3</p>
                <p className="text-green-400 font-mono font-semibold">
                  {page.h1Count} / {page.h2Count} / {page.h3Count}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Links</p>
                <p className="text-purple-400 font-mono font-semibold">
                  {page.internalLinks}
                  <span className="text-gray-500 text-xs block">
                    internal
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Media</p>
                <p className="text-yellow-400 font-mono font-semibold">
                  {page.images} 📷
                </p>
              </div>
            </div>

            {/* Issues */}
            {page.issues.length > 0 && (
              <div className="space-y-2 border-t border-gray-700 pt-3">
                {page.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-xs text-gray-300"
                  >
                    <span>{getSeverityIcon(issue.severity)}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{issue.title}</p>
                      <p className="text-gray-500">{issue.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400 font-semibold mb-2">📊 Content Tips:</p>
        <ul className="text-xs text-blue-400/70 space-y-1">
          <li>• Aim for 1000-2500 words for comprehensive coverage</li>
          <li>• Maintain readability score above 60 (8th grade level)</li>
          <li>• Use proper H1/H2 structure (1 H1, 2-4 H2s)</li>
          <li>• Include 3-5 internal links per page</li>
          <li>• Add relevant images (1 per 300 words)</li>
        </ul>
      </div>
    </div>
  );
}
