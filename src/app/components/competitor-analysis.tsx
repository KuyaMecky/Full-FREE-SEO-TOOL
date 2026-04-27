'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface CompetitorData {
  domain: string;
  totalPages: number;
  avgWordCount: number;
  avgReadability: number;
  avgH2Count: number;
  avgInternalLinks: number;
  topKeywords: string[];
  contentGaps: string[];
  strengths: string[];
}

interface CompetitorAnalysisProps {
  auditId: string;
  yourDomain: string;
  competitors: string[];
}

export function CompetitorAnalysis({
  auditId,
  yourDomain,
  competitors,
}: CompetitorAnalysisProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch('/api/competitors/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auditId, competitors }),
        });

        if (res.ok) {
          const data = await res.json();
          setAnalysis(data);
          if (data.competitors.length > 0) {
            setSelectedCompetitor(data.competitors[0].domain);
          }
        }
      } catch (error) {
        console.error('Failed to fetch competitor analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    if (competitors.length > 0) {
      fetchAnalysis();
    } else {
      setLoading(false);
    }
  }, [auditId, competitors]);

  if (loading) {
    return <div className="animate-pulse bg-gray-700 h-48 rounded-lg" />;
  }

  if (!analysis || competitors.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">No competitors added to analysis</p>
        <p className="text-sm text-gray-500 mt-1">Add competitor domains in the audit form</p>
      </div>
    );
  }

  const yourMetrics = analysis.yourMetrics;
  const competitor = analysis.competitors.find(
    (c: CompetitorData) => c.domain === selectedCompetitor
  );

  const getComparison = (your: number, their: number) => {
    const diff = their - your;
    const percent = your > 0 ? ((diff / your) * 100).toFixed(0) : 0;
    return { diff, percent };
  };

  return (
    <div className="space-y-6">
      {/* Your Domain Summary */}
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-green-400 mb-3">📊 Your Domain</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs">Pages</p>
            <p className="text-green-400 font-semibold">{yourMetrics.totalPages}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Avg Words</p>
            <p className="text-green-400 font-semibold">
              {Math.round(yourMetrics.avgWordCount)}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Readability</p>
            <p className="text-green-400 font-semibold">
              {Math.round(yourMetrics.avgReadability)}/100
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Internal Links</p>
            <p className="text-green-400 font-semibold">
              {Math.round(yourMetrics.avgInternalLinks)}
            </p>
          </div>
        </div>
      </div>

      {/* Competitor Selector */}
      {analysis.competitors.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {analysis.competitors.map((c: CompetitorData) => (
            <button
              key={c.domain}
              onClick={() => setSelectedCompetitor(c.domain)}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                selectedCompetitor === c.domain
                  ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {c.domain}
            </button>
          ))}
        </div>
      )}

      {/* Competitor Comparison */}
      {competitor && (
        <>
          {/* Metrics Comparison */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">
              How you compare to {competitor.domain}
            </h3>

            {/* Pages */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300">Pages Indexed</p>
                <span className="text-xs text-gray-500">
                  {yourMetrics.totalPages} vs {competitor.totalPages}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-8 bg-green-500/20 rounded flex items-center px-2">
                  <p className="text-green-400 text-sm font-semibold">
                    {yourMetrics.totalPages}
                  </p>
                </div>
                <div className="flex-1 h-8 bg-blue-500/20 rounded flex items-center px-2">
                  <p className="text-blue-400 text-sm font-semibold">
                    {competitor.totalPages}
                  </p>
                </div>
              </div>
              {yourMetrics.totalPages < competitor.totalPages && (
                <p className="text-xs text-yellow-400 mt-2">
                  ⚠️ Competitor has {competitor.totalPages - yourMetrics.totalPages} more pages
                </p>
              )}
            </div>

            {/* Word Count */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300">Avg Word Count</p>
                <span className="text-xs text-gray-500">
                  {Math.round(yourMetrics.avgWordCount)} vs{' '}
                  {Math.round(competitor.avgWordCount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {getComparison(yourMetrics.avgWordCount, competitor.avgWordCount)
                  .percent > 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                )}
                <p className="text-sm text-gray-400">
                  {getComparison(yourMetrics.avgWordCount, competitor.avgWordCount)
                    .percent > 0 ? '+' : ''}
                  {getComparison(yourMetrics.avgWordCount, competitor.avgWordCount)
                    .percent}
                  % vs competitor
                </p>
              </div>
            </div>

            {/* Readability */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300">Content Readability</p>
                <span className="text-xs text-gray-500">
                  {Math.round(yourMetrics.avgReadability)} vs{' '}
                  {Math.round(competitor.avgReadability)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {yourMetrics.avgReadability < competitor.avgReadability ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                )}
                <p className="text-sm text-gray-400">
                  {yourMetrics.avgReadability < competitor.avgReadability
                    ? '⚠️ Your content is harder to read'
                    : '✅ Your content is more readable'}
                </p>
              </div>
            </div>

            {/* Internal Links */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-300">Avg Internal Links</p>
                <span className="text-xs text-gray-500">
                  {Math.round(yourMetrics.avgInternalLinks)} vs{' '}
                  {Math.round(competitor.avgInternalLinks)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {yourMetrics.avgInternalLinks < competitor.avgInternalLinks ? (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                )}
                <p className="text-sm text-gray-400">
                  {yourMetrics.avgInternalLinks < competitor.avgInternalLinks
                    ? '⚠️ Add more internal links'
                    : '✅ Better internal linking'}
                </p>
              </div>
            </div>
          </div>

          {/* Content Gaps */}
          {competitor.contentGaps && competitor.contentGaps.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-400 mb-3">
                📝 Content Gaps (Topics They Cover)
              </h4>
              <div className="space-y-2">
                {competitor.contentGaps.slice(0, 5).map((topic, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-400">•</span>
                    <span className="text-gray-300">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitor Strengths */}
          {competitor.strengths && competitor.strengths.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-3">
                💪 Competitor Strengths
              </h4>
              <div className="space-y-2">
                {competitor.strengths.slice(0, 5).map((strength, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <span className="text-blue-400">•</span>
                    <span className="text-gray-300">{strength}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
