'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, TrendingUp, TrendingDown, Link2 } from 'lucide-react';

interface TimelineEntry {
  id: string;
  date: string;
  uploadedAt: string;
  totalBacklinks: number;
  referringDomains: number;
  gainedCount: number;
  lostCount: number;
  topReferrers: Array<{
    domain: string;
    count: number;
    avgDR: number;
  }>;
}

interface BacklinkHistory {
  propertyId: string;
  timeline: TimelineEntry[];
  trends: {
    totalBacklinks: number;
    previousTotal: number | null;
    totalChange: number | null;
    recentGained: number;
    recentLost: number;
    referringDomains: number;
  };
  totalSnapshots: number;
}

export default function BacklinkTrendsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');

  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId || '');
  const [history, setHistory] = useState<BacklinkHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);

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

  // Fetch history when property changes
  useEffect(() => {
    if (!selectedProperty) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/backlink-trends/history?propertyId=${selectedProperty}`
        );
        const data = await res.json();
        if (res.ok) {
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedProperty]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProperty) {
      setError('Please select a file and property');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', selectedProperty);

      const res = await fetch('/api/backlink-trends/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload');
        return;
      }

      setFile(null);
      // Refresh history
      const historyRes = await fetch(
        `/api/backlink-trends/history?propertyId=${selectedProperty}`
      );
      const historyData = await historyRes.json();
      setHistory(historyData);
    } catch (err) {
      setError('Failed to upload backlinks');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getTrendColor = (value: number | null) => {
    if (value === null) return 'text-gray-400';
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Backlink Trends Tracker
            </h1>
            <p className="text-slate-400">
              Upload and track your backlink changes over time
            </p>
          </div>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Upload Section */}
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
                CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleUpload}
                disabled={uploading || !file || !selectedProperty}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4">
            📋 CSV Format: url, referring_url, anchor_text, domain_rating, link_type
          </p>
        </div>

        {/* Summary Cards */}
        {history && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400">Total Backlinks</div>
                <div className="text-3xl font-bold text-white mt-2">
                  {history.trends.totalBacklinks.toLocaleString()}
                </div>
                {history.trends.totalChange !== null && (
                  <div
                    className={`text-sm mt-2 flex items-center gap-1 ${getTrendColor(
                      history.trends.totalChange
                    )}`}
                  >
                    {history.trends.totalChange > 0 ? (
                      <TrendingUp size={16} />
                    ) : (
                      <TrendingDown size={16} />
                    )}
                    {history.trends.totalChange > 0 ? '+' : ''}
                    {history.trends.totalChange}
                  </div>
                )}
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400">Referring Domains</div>
                <div className="text-3xl font-bold text-white mt-2">
                  {history.trends.referringDomains}
                </div>
              </div>

              <div className="bg-green-900 border border-green-700 rounded-lg p-4">
                <div className="text-sm text-green-300">Recently Gained</div>
                <div className="text-3xl font-bold text-green-100 mt-2">
                  {history.trends.recentGained}
                </div>
              </div>

              <div className="bg-red-900 border border-red-700 rounded-lg p-4">
                <div className="text-sm text-red-300">Recently Lost</div>
                <div className="text-3xl font-bold text-red-100 mt-2">
                  {history.trends.recentLost}
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="text-sm text-slate-400">Total Uploads</div>
                <div className="text-3xl font-bold text-white mt-2">
                  {history.totalSnapshots}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {history.timeline.length > 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                          Upload Date
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                          Total Backlinks
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                          Referring Domains
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                          Gained
                        </th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-300">
                          Lost
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                          Top Referrer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {history.timeline.map((entry) => {
                        const topReferrer = entry.topReferrers[0];
                        return (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-700 transition"
                          >
                            <td className="px-6 py-4">
                              <div className="text-white font-medium">
                                {new Date(entry.uploadedAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(entry.uploadedAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-blue-300 font-semibold">
                                {entry.totalBacklinks.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-300">
                              {entry.referringDomains}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-green-400">
                                +{entry.gainedCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-red-400">
                                -{entry.lostCount}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {topReferrer ? (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Link2 size={14} />
                                  <div>
                                    <div className="font-medium">
                                      {topReferrer.domain}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                      {topReferrer.count} links (DR:{' '}
                                      {topReferrer.avgDR})
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                <p className="text-slate-400">
                  No backlink data yet. Upload a CSV to get started.
                </p>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
}
