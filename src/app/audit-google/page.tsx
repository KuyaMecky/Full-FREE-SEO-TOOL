'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useProviders, hasAnyProvider } from '@/lib/hooks/useProviders';

interface Property {
  id: string;
  siteUrl: string;
  permissionLevel: string;
  addedAt: string;
}

interface AuditResult {
  id: string;
  domain: string;
  status: string;
  overallScore: number;
  createdAt: string;
  report?: {
    executiveSummary: string;
    scorecard: string;
    actionItems: string;
  };
}

function AuditGooglePageInner() {
  const searchParams = useSearchParams();
  const paramPropertyId = searchParams.get('propertyId');
  const { providers, loading: providersLoading } = useProviders();
  const [properties, setProperties] = useState<Property[]>([]);
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(paramPropertyId || '');
  const [apiProvider, setApiProvider] = useState<'google' | 'ahrefs'>('google');
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProperties();
    fetchAudits();
  }, [paramPropertyId]);

  useEffect(() => {
    // Set default provider based on what's available
    if (providers && !providers.google && providers.ahrefs) {
      setApiProvider('ahrefs');
    } else {
      setApiProvider('google');
    }
  }, [providers]);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/gsc/properties');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please log in to access audits');
        } else {
          throw new Error('Failed to fetch properties');
        }
        return;
      }
      const data = await res.json();
      const props = data.properties || data;
      setProperties(props);
      if (props.length > 0) {
        // If propertyId is in URL params, use that; otherwise use first property
        const idToSet = paramPropertyId && props.some((p: Property) => p.id === paramPropertyId)
          ? paramPropertyId
          : props[0].id;
        setSelectedPropertyId(idToSet);
      }
    } catch (err) {
      setError('Failed to load properties');
      console.error(err);
    }
  };

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/audit-google');
      if (!res.ok) throw new Error('Failed to fetch audits');
      const data = await res.json();
      setAudits(data);
    } catch (err) {
      console.error('Failed to load audits:', err);
    }
  };

  const runAudit = async () => {
    if (!selectedPropertyId) {
      setError('Please select a property');
      return;
    }

    setAuditLoading(true);
    setError('');

    try {
      const endpoint = apiProvider === 'ahrefs' ? '/api/audit-ahrefs' : '/api/audit-google';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selectedPropertyId }),
      });

      if (!res.ok) throw new Error('Failed to start audit');

      const data = await res.json();

      // Refresh audits after starting
      setTimeout(fetchAudits, 2000);
    } catch (err) {
      setError('Failed to start audit');
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 space-y-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Google-Powered Site Audit</h1>
          <p className="text-slate-400">Analyze your site using Google Search Console, URL Inspection, and PageSpeed Insights data</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Audit Control Panel */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Run New Audit</h2>

          {!hasAnyProvider(providers) && !providersLoading && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
              <p className="text-sm">
                No audit providers configured. Please go to{' '}
                <a href="/settings/integrations" className="underline hover:text-yellow-300">
                  Settings → Integrations
                </a>
                {' '}to connect an API provider (Google Search Console or Ahrefs).
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* API Provider Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Audit Provider
              </label>
              <div className="flex gap-2">
                {providers?.google && (
                  <label className="flex items-center gap-2 px-4 py-2 rounded cursor-pointer border-2"
                    style={{
                      borderColor: apiProvider === 'google' ? '#3b82f6' : '#475569',
                      backgroundColor: apiProvider === 'google' ? '#1e40af20' : '#64748b20'
                    }}>
                    <input
                      type="radio"
                      value="google"
                      checked={apiProvider === 'google'}
                      onChange={(e) => setApiProvider(e.target.value as 'google' | 'ahrefs')}
                      className="cursor-pointer"
                    />
                    <span className="text-white">Google APIs ✓</span>
                  </label>
                )}
                {providers?.ahrefs && (
                  <label className="flex items-center gap-2 px-4 py-2 rounded cursor-pointer border-2"
                    style={{
                      borderColor: apiProvider === 'ahrefs' ? '#3b82f6' : '#475569',
                      backgroundColor: apiProvider === 'ahrefs' ? '#1e40af20' : '#64748b20'
                    }}>
                    <input
                      type="radio"
                      value="ahrefs"
                      checked={apiProvider === 'ahrefs'}
                      onChange={(e) => setApiProvider(e.target.value as 'google' | 'ahrefs')}
                      className="cursor-pointer"
                    />
                    <span className="text-white">Ahrefs API ✓</span>
                  </label>
                )}
                {!providers?.google && !providers?.ahrefs && (
                  <p className="text-slate-400 text-sm py-2">No providers available</p>
                )}
              </div>
            </div>

            {/* Property Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Property
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a property...</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.siteUrl}
                  </option>
                ))}
              </select>
              {properties.length === 0 && (
                <p className="text-sm text-slate-400 mt-2">
                  No properties found. Connect your Google Search Console first.
                </p>
              )}
            </div>

            {/* Run Button */}
            <button
              onClick={runAudit}
              disabled={!selectedPropertyId || auditLoading || !hasAnyProvider(providers)}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded transition-colors"
            >
              {auditLoading ? 'Running Audit...' : !hasAnyProvider(providers) ? 'Configure Provider First' : 'Run Audit'}
            </button>
          </div>
        </div>

        {/* Audit History */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Audit History</h2>

          {audits.length === 0 ? (
            <p className="text-slate-400">No audits yet. Run your first audit to get started.</p>
          ) : (
            <div className="space-y-4">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 hover:border-slate-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium">{audit.domain}</h3>
                      <p className="text-sm text-slate-400">
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`text-3xl font-bold ${
                            audit.overallScore >= 80
                              ? 'text-green-400'
                              : audit.overallScore >= 60
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {audit.overallScore}
                        </div>
                        <p className="text-xs text-slate-400">Overall Score</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                            audit.status === 'complete'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {audit.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {audit.report && (
                    <div className="border-t border-slate-600/50 pt-3 text-sm text-slate-300">
                      {audit.report.executiveSummary && (
                        <p className="mb-2">{audit.report.executiveSummary}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditGooglePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <AuditGooglePageInner />
    </Suspense>
  );
}
