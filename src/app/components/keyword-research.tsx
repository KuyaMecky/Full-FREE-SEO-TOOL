'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Target, AlertCircle } from 'lucide-react';

interface KeywordOpportunity {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  difficulty: number;
  potential: 'quick-win' | 'medium' | 'long-tail' | 'high-volume';
  traffic_potential: number;
  recommendation: string;
}

interface KeywordResearchProps {
  auditId: string;
  onLoad?: (data: any) => void;
}

export function KeywordResearch({ auditId, onLoad }: KeywordResearchProps) {
  const [opportunities, setOpportunities] = useState<KeywordOpportunity[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'quick-win' | 'high-volume' | 'long-tail'>('all');

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const res = await fetch('/api/keywords/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auditId }),
        });

        if (res.ok) {
          const data = await res.json();
          setOpportunities(data.opportunities);
          setSummary(data.summary);
          onLoad?.(data);
        }
      } catch (error) {
        console.error('Failed to fetch keywords:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKeywords();
  }, [auditId, onLoad]);

  const filtered = opportunities.filter(
    (o) => filter === 'all' || o.potential === filter
  );

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'quick-win':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'high-volume':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'long-tail':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPotentialIcon = (potential: string) => {
    switch (potential) {
      case 'quick-win':
        return <Zap className="w-4 h-4" />;
      case 'high-volume':
        return <TrendingUp className="w-4 h-4" />;
      case 'long-tail':
        return <Target className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Total Keywords</p>
            <p className="text-2xl font-bold text-cyan-400">{opportunities.length}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Avg Position</p>
            <p className="text-2xl font-bold text-green-400">{summary.avg_position}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Total Impressions</p>
            <p className="text-2xl font-bold text-blue-400">
              {(summary.total_impressions / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-xs">Potential Traffic</p>
            <p className="text-2xl font-bold text-purple-400">
              +{summary.potential_traffic}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'quick-win', 'high-volume', 'long-tail'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded text-sm font-medium transition-all ${
              filter === f
                ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {f.replace('-', ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Keywords Table */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((opp) => (
            <div
              key={opp.keyword}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Keyword & Stats */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-100 flex-1">
                      {opp.keyword}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getPotentialColor(
                        opp.potential
                      )}`}
                    >
                      {getPotentialIcon(opp.potential)}
                      {opp.potential.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">Position</p>
                      <p className="text-cyan-400 font-mono font-semibold">#
                        {opp.position}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Impressions</p>
                      <p className="text-blue-400 font-mono font-semibold">
                        {opp.impressions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">CTR</p>
                      <p className="text-green-400 font-mono font-semibold">
                        {opp.ctr.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Difficulty</p>
                      <p className={`font-mono font-semibold ${
                        opp.difficulty < 30
                          ? 'text-green-400'
                          : opp.difficulty < 60
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}>
                        {opp.difficulty}/100
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Potential</p>
                      <p className="text-purple-400 font-mono font-semibold">
                        +{opp.traffic_potential}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <p className="text-xs text-gray-400 italic">
                    💡 {opp.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No keywords found in this category</p>
          </div>
        )}
      </div>

      {/* Quick Wins Highlight */}
      {opportunities.filter((o) => o.potential === 'quick-win').length > 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-sm text-green-400 font-semibold">
            🚀 You have{' '}
            <span className="font-bold">
              {opportunities.filter((o) => o.potential === 'quick-win').length}
            </span>{' '}
            quick-win keywords!
          </p>
          <p className="text-xs text-green-400/70 mt-1">
            These keywords are ranking 10-30 and can move to top 3 with content optimization.
          </p>
        </div>
      )}
    </div>
  );
}
