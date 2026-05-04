'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, AlertCircle, Shield, Download } from 'lucide-react';

interface LinkQualityScore {
  url: string;
  referringUrl: string;
  anchorText?: string;
  domainRating: number;
  toxicityScore: number;
  qualityScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'keep' | 'monitor' | 'disavow';
  flags: string[];
  reasons: string[];
}

interface LinkQualityReport {
  totalBacklinks: number;
  averageQuality: number;
  averageToxicity: number;
  healthScore: number;
  byRiskLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  recommendedDisavows: LinkQualityScore[];
  recommendedMonitor: LinkQualityScore[];
  topQualityLinks: LinkQualityScore[];
}

interface AnalysisResult {
  domain: string;
  report: LinkQualityReport;
  links: LinkQualityScore[];
  linksCount: {
    total: number;
    highQuality: number;
    needsMonitoring: number;
    shouldDisavow: number;
  };
}

export default function LinkQualityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [domain, setDomain] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'disavow' | 'monitor' | 'quality'>('disavow');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await fetch('/api/gsc-properties');
        const data = await res.json();
        if (data.properties) {
          setProperties(data.properties);
          if (propertyId) {
            setSelectedProperty(propertyId);
            if (data.properties.length > 0 && !domain) {
              const mainProp = data.properties.find((p: any) => p.id === propertyId);
              if (mainProp) {
                setDomain(mainProp.siteUrl.replace(/https?:\/\//, '').replace(/\/$/, ''));
              }
            }
          }
        }
      } catch (err) {
        setError('Failed to load properties');
        console.error(err);
      }
    };

    fetchProperties();
  }, [propertyId]);

  const handleAnalyze = async () => {
    if (!selectedProperty || !domain) {
      setError('Please select a property and enter a domain');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/link-quality/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedProperty,
          domain: domain.replace(/https?:\/\//, '').replace(/\/$/, ''),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to analyze links');
        return;
      }

      setAnalysis(data);
    } catch (err) {
      setError('Failed to analyze links');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800 border-green-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      critical: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[risk] || 'bg-gray-100 text-gray-800';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const renderLinkRow = (link: LinkQualityScore) => (
    <tr key={`${link.referringUrl}-${link.url}`} className="hover:bg-slate-700 transition">
      <td className="px-6 py-4">
        <a
          href={link.referringUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 truncate block"
          title={link.referringUrl}
        >
          {link.referringUrl.replace(/^https?:\/\//, '').substring(0, 50)}
        </a>
      </td>
      <td className="px-6 py-4 text-sm text-slate-300">
        {link.anchorText ? (
          <span className="truncate block">{link.anchorText.substring(0, 40)}</span>
        ) : (
          <span className="text-slate-500">—</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <span className="font-semibold text-blue-300">{link.domainRating}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-20 bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                link.qualityScore >= 70
                  ? 'bg-green-500'
                  : link.qualityScore >= 40
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${link.qualityScore}%` }}
            />
          </div>
          <span className="w-8 text-right text-sm font-semibold text-slate-300">
            {Math.round(link.qualityScore)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(
            link.riskLevel
          )}`}
        >
          {link.riskLevel}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <span
          className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
            link.recommendation === 'keep'
              ? 'bg-green-900 text-green-100'
              : link.recommendation === 'monitor'
              ? 'bg-yellow-900 text-yellow-100'
              : 'bg-red-900 text-red-100'
          }`}
        >
          {link.recommendation}
        </span>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Link Quality Scoring</h1>
            <p className="text-slate-400">Analyze your backlinks for toxicity and quality</p>
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
                Domain to Analyze
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleAnalyze}
                disabled={loading || !selectedProperty || !domain}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition"
              >
                {loading ? 'Analyzing...' : 'Analyze Links'}
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-400">Health Score</div>
                    <div className={`text-4xl font-bold mt-2 ${getHealthColor(analysis.report.healthScore)}`}>
                      {Math.round(analysis.report.healthScore)}
                    </div>
                  </div>
                  <Shield size={40} className={getHealthColor(analysis.report.healthScore)} />
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400">Total Backlinks</div>
                <div className="text-3xl font-bold text-white mt-2">
                  {analysis.linksCount.total}
                </div>
              </div>

              <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                <div className="text-sm text-green-300">High Quality</div>
                <div className="text-3xl font-bold text-green-100 mt-2">
                  {analysis.linksCount.highQuality}
                </div>
              </div>

              <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                <div className="text-sm text-yellow-300">Monitor</div>
                <div className="text-3xl font-bold text-yellow-100 mt-2">
                  {analysis.linksCount.needsMonitoring}
                </div>
              </div>

              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="text-sm text-red-300">Should Disavow</div>
                <div className="text-3xl font-bold text-red-100 mt-2">
                  {analysis.linksCount.shouldDisavow}
                </div>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Risk Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded p-4">
                  <div className="text-2xl font-bold text-green-100">
                    {analysis.report.byRiskLevel.low}
                  </div>
                  <div className="text-sm text-green-300">Low Risk</div>
                </div>
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded p-4">
                  <div className="text-2xl font-bold text-yellow-100">
                    {analysis.report.byRiskLevel.medium}
                  </div>
                  <div className="text-sm text-yellow-300">Medium Risk</div>
                </div>
                <div className="bg-orange-900 bg-opacity-30 border border-orange-700 rounded p-4">
                  <div className="text-2xl font-bold text-orange-100">
                    {analysis.report.byRiskLevel.high}
                  </div>
                  <div className="text-sm text-orange-300">High Risk</div>
                </div>
                <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded p-4">
                  <div className="text-2xl font-bold text-red-100">
                    {analysis.report.byRiskLevel.critical}
                  </div>
                  <div className="text-sm text-red-300">Critical</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              <div className="border-b border-slate-700 flex">
                <button
                  onClick={() => setActiveTab('disavow')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                    activeTab === 'disavow'
                      ? 'bg-red-600 text-white border-b-2 border-red-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="inline mr-2" size={16} />
                  Disavow ({analysis.report.recommendedDisavows.length})
                </button>
                <button
                  onClick={() => setActiveTab('monitor')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                    activeTab === 'monitor'
                      ? 'bg-yellow-600 text-white border-b-2 border-yellow-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertCircle className="inline mr-2" size={16} />
                  Monitor ({analysis.report.recommendedMonitor.length})
                </button>
                <button
                  onClick={() => setActiveTab('quality')}
                  className={`flex-1 px-6 py-4 text-sm font-semibold transition ${
                    activeTab === 'quality'
                      ? 'bg-green-600 text-white border-b-2 border-green-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CheckCircle className="inline mr-2" size={16} />
                  High Quality ({analysis.report.topQualityLinks.length})
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                        Referring Domain
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                        Anchor Text
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        DR
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Quality
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Risk
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {activeTab === 'disavow'
                      ? analysis.report.recommendedDisavows.map(renderLinkRow)
                      : activeTab === 'monitor'
                      ? analysis.report.recommendedMonitor.map(renderLinkRow)
                      : analysis.report.topQualityLinks.map(renderLinkRow)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
