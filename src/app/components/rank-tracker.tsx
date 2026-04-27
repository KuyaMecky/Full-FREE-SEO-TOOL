'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Trash2 } from 'lucide-react';

interface RankData {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  source: 'gsc' | 'manual';
  lastUpdated: string;
}

interface RankTrackerProps {
  auditId: string;
}

export function RankTracker({ auditId }: RankTrackerProps) {
  const [keywords, setKeywords] = useState<RankData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<'position' | 'trend' | 'impressions'>(
    'position'
  );

  useEffect(() => {
    const fetchRankData = async () => {
      try {
        const res = await fetch('/api/rank-tracking/get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ auditId }),
        });

        if (res.ok) {
          const data = await res.json();
          setKeywords(data.keywords || []);
        }
      } catch (error) {
        console.error('Failed to fetch rank data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankData();
  }, [auditId]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !newPosition) return;

    try {
      const res = await fetch('/api/rank-tracking/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          keyword: newKeyword,
          position: parseInt(newPosition),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setKeywords([...keywords, data.rankData]);
        setNewKeyword('');
        setNewPosition('');
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to add keyword:', error);
    }
  };

  const handleDeleteKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k.keyword !== keyword));
  };

  const sorted = [...keywords].sort((a, b) => {
    switch (sortBy) {
      case 'trend':
        return a.change - b.change;
      case 'impressions':
        return b.impressions - a.impressions;
      default:
        return a.position - b.position;
    }
  });

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up')
      return (
        <div className="flex items-center gap-1 text-green-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs">+{change}</span>
        </div>
      );
    if (trend === 'down')
      return (
        <div className="flex items-center gap-1 text-red-400">
          <TrendingDown className="w-4 h-4" />
          <span className="text-xs">-{Math.abs(change)}</span>
        </div>
      );
    return (
      <div className="text-yellow-400 text-xs">
        → Stable
      </div>
    );
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-400 font-bold';
    if (position <= 10) return 'text-blue-400 font-bold';
    if (position <= 30) return 'text-yellow-400 font-semibold';
    return 'text-gray-400';
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-700 h-48 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-xs">Keywords Tracked</p>
          <p className="text-2xl font-bold text-cyan-400">{keywords.length}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-xs">Top 3 Keywords</p>
          <p className="text-2xl font-bold text-green-400">
            {keywords.filter((k) => k.position <= 3).length}
          </p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-xs">Avg Position</p>
          <p className="text-2xl font-bold text-blue-400">
            {keywords.length > 0
              ? (
                  keywords.reduce((sum, k) => sum + k.position, 0) /
                  keywords.length
                ).toFixed(1)
              : '-'}
          </p>
        </div>
      </div>

      {/* Add Keyword Form */}
      {showForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Keyword"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-500 text-sm"
            />
            <input
              type="number"
              placeholder="Position"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              min="1"
              max="100"
              className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 text-sm"
            />
            <button
              onClick={handleAddKeyword}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded hover:bg-cyan-500/30 text-sm font-medium"
            >
              Add
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded hover:bg-gray-600 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500 rounded hover:bg-cyan-500/30 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Track New Keyword
        </button>
      )}

      {/* Sort Controls */}
      {keywords.length > 0 && (
        <div className="flex gap-2">
          {(['position', 'trend', 'impressions'] as const).map((sort) => (
            <button
              key={sort}
              onClick={() => setSortBy(sort)}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                sortBy === sort
                  ? 'bg-cyan-500/30 text-cyan-400 border border-cyan-500'
                  : 'bg-gray-800 text-gray-400 border border-gray-700'
              }`}
            >
              {sort === 'position' && 'Position'}
              {sort === 'trend' && 'Trend'}
              {sort === 'impressions' && 'Impressions'}
            </button>
          ))}
        </div>
      )}

      {/* Keywords List */}
      <div className="space-y-3">
        {sorted.length > 0 ? (
          sorted.map((rank) => (
            <div
              key={rank.keyword}
              className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
            >
              <div className="flex items-center justify-between">
                {/* Left: Keyword */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {rank.keyword}
                  </h3>

                  {/* Metrics */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Current Position</p>
                      <p className={`font-mono font-semibold ${getPositionColor(rank.position)}`}>
                        #{rank.position}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Trend</p>
                      {getTrendIcon(rank.trend, rank.change)}
                    </div>
                    {rank.source === 'gsc' && (
                      <>
                        <div>
                          <p className="text-gray-500 text-xs">Impressions</p>
                          <p className="text-blue-400 font-mono font-semibold">
                            {rank.impressions.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">CTR</p>
                          <p className="text-green-400 font-mono font-semibold">
                            {rank.ctr.toFixed(1)}%
                          </p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-gray-500 text-xs">Source</p>
                      <p className="text-xs text-gray-400">
                        {rank.source === 'gsc' ? 'Google Search Console' : 'Manual Track'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Delete button */}
                {rank.source === 'manual' && (
                  <button
                    onClick={() => handleDeleteKeyword(rank.keyword)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No keywords being tracked yet</p>
            <p className="text-sm mt-1">Add keywords manually or connect Google Search Console</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-400 font-semibold mb-2">📈 Tracking Tips:</p>
        <ul className="text-xs text-blue-400/70 space-y-1">
          <li>• Track keywords ranking 11-30 for quick ranking improvements</li>
          <li>• Monitor top keywords to protect your positions</li>
          <li>• Use GSC data for automatic tracking of your best performers</li>
          <li>• Check trends weekly to identify ranking changes</li>
        </ul>
      </div>
    </div>
  );
}
