'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ContentGap {
  keyword: string;
  competitorRank: number;
  yourRank: number | null;
  volume: number;
  competitorDomain: string;
  difficultyScore: number;
  opportunityScore: number;
  category: 'easy_win' | 'moderate' | 'competitive' | 'difficult';
}

interface AnalysisResult {
  competitorDomain: string;
  totalGaps: number;
  gaps: ContentGap[];
  breakdown: {
    easyWins: number;
    moderate: number;
    competitive: number;
    difficult: number;
  };
}

function ContentGapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [properties, setProperties] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [error, setError] = useState('');

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/gsc-properties');
        const data = await res.json();
        if (data.properties) {
          setProperties(data.properties);
          if (propertyId) {
            setSelectedProperty(propertyId);
          } else if (data.properties.length > 0) {
            setSelectedProperty(data.properties[0].id);
          }
        }
      } catch (err) {
        setError('Failed to load properties');
        console.error(err);
      }
    };

    fetchProperties();
  }, [propertyId]);

  // Fetch competitors when property changes
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchCompetitors = async () => {
      try {
        const res = await fetch(`/api/competitors?propertyId=${selectedProperty}`);
        const data = await res.json();
        if (data.competitors) {
          setCompetitors(data.competitors);
          setSelectedCompetitor(data.competitors[0]?.id || '');
        }
      } catch (err) {
        console.error('Failed to load competitors:', err);
        setCompetitors([]);
      }
    };

    fetchCompetitors();
  }, [selectedProperty]);

  const handleAnalyze = async () => {
    if (!selectedProperty || !selectedCompetitor) {
      setError('Please select a property and competitor');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/content-gap/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty,
          competitorId: selectedCompetitor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to analyze gaps');
        return;
      }

      setAnalysis(data);
    } catch (err) {
      setError('Failed to analyze gaps');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredGaps = analysis?.gaps
    ? analysis.gaps.filter((gap) =>
        categoryFilter ? gap.category === categoryFilter : true
      )
    : [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      easy_win: 'bg-green-100 text-green-800 border-green-300',
      moderate: 'bg-blue-100 text-blue-800 border-blue-300',
      competitive: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      difficult: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyLabel = (score: number) => {
    if (score < 30) return 'Easy';
    if (score < 60) return 'Medium';
    return 'Hard';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Content Gap Analysis</h1>
            <p className="text-slate-400">Find keywords your competitors rank for but you don't</p>
          </div>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Controls */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Property
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a property...</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.siteUrl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Competitor
              </label>
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a competitor...</option>
                {competitors.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.competitorDomain}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || !selectedProperty || !selectedCompetitor}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition"
              >
                {loading ? 'Analyzing...' : 'Analyze Gaps'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400">Total Gaps</div>
                <div className="text-3xl font-bold text-white">{analysis.totalGaps}</div>
              </div>

              <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                <div className="text-sm text-green-300">Easy Wins</div>
                <div className="text-3xl font-bold text-green-100">
                  {analysis.breakdown.easyWins}
                </div>
              </div>

              <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
                <div className="text-sm text-blue-300">Moderate</div>
                <div className="text-3xl font-bold text-blue-100">
                  {analysis.breakdown.moderate}
                </div>
              </div>

              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                <div className="text-sm text-yellow-300">Competitive</div>
                <div className="text-3xl font-bold text-yellow-100">
                  {analysis.breakdown.competitive}
                </div>
              </div>

              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="text-sm text-red-300">Difficult</div>
                <div className="text-3xl font-bold text-red-100">
                  {analysis.breakdown.difficult}
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter('')}
                  className={`px-4 py-2 rounded ${
                    categoryFilter === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  All ({filteredGaps.length})
                </button>
                <button
                  onClick={() => setCategoryFilter('easy_win')}
                  className={`px-4 py-2 rounded ${
                    categoryFilter === 'easy_win'
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Easy Wins
                </button>
                <button
                  onClick={() => setCategoryFilter('moderate')}
                  className={`px-4 py-2 rounded ${
                    categoryFilter === 'moderate'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Moderate
                </button>
                <button
                  onClick={() => setCategoryFilter('competitive')}
                  className={`px-4 py-2 rounded ${
                    categoryFilter === 'competitive'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Competitive
                </button>
                <button
                  onClick={() => setCategoryFilter('difficult')}
                  className={`px-4 py-2 rounded ${
                    categoryFilter === 'difficult'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Difficult
                </button>
              </div>
            </div>

            {/* Gaps Table */}
            {filteredGaps.length > 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                        Keyword
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Your Rank
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        {analysis.competitorDomain} Rank
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Volume
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Difficulty
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Score
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredGaps.map((gap) => (
                      <tr
                        key={gap.keyword}
                        className="hover:bg-slate-700 transition"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {gap.keyword}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {gap.yourRank ? (
                            <span className="text-slate-300">#{gap.yourRank}</span>
                          ) : (
                            <span className="text-red-400">Not ranking</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-blue-300">#{gap.competitorRank}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-300">
                          {gap.volume.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-300">
                          {getDifficultyLabel(gap.difficultyScore)} ({gap.difficultyScore})
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-lg font-bold text-blue-400">
                            {gap.opportunityScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(
                              gap.category
                            )}`}
                          >
                            {gap.category.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">No gaps found in this category</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentGapPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ContentGapContent />
    </Suspense>
  );
}
