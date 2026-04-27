'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { TerminalStatus } from './terminal-loader';

export interface APIStatus {
  google: { available: boolean; label: string };
  ai: { available: boolean; label: string };
  pagespeed: { available: boolean; label: string };
  wordpress: { available: boolean; label: string };
}

interface Props {
  variant?: 'full' | 'compact' | 'inline';
  showRequired?: boolean;
}

export function APIStatusIndicator({ variant = 'full', showRequired = false }: Props) {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const [google, ai, pagespeed, wordpress] = await Promise.all([
        fetch('/api/settings/google').then(r => r.ok ? r.json() : null),
        fetch('/api/settings/ai').then(r => r.ok ? r.json() : null),
        fetch('/api/gsc/sites').then(r => ({ ok: r.ok })),
        fetch('/api/wordpress/connections').then(r => r.ok ? r.json() : null),
      ]);

      setStatus({
        google: {
          available: Boolean(google?.configured) || google?.ok,
          label: 'Google Search Console',
        },
        ai: {
          available: Boolean(ai?.configured),
          label: ai?.provider ? `AI Provider (${ai.provider})` : 'AI Provider',
        },
        pagespeed: {
          available: Boolean(google?.pagespeedConfigured),
          label: 'PageSpeed Insights',
        },
        wordpress: {
          available: Array.isArray(wordpress?.connections) && wordpress.connections.length > 0,
          label: wordpress?.connections?.[0]?.name || 'WordPress',
        },
      });
    } catch (error) {
      console.error('Failed to fetch API status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <TerminalStatus message="Checking API status" />;
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertCircle className="h-4 w-4" />
        Failed to load API status
      </div>
    );
  }

  const apis = Object.entries(status);
  const available = apis.filter(([, s]) => s.available).length;
  const required = ['google', 'ai'];
  const requiredAvailable = required.every(key => status[key as keyof APIStatus].available);

  // Inline variant - just shows count
  if (variant === 'inline') {
    const color = requiredAvailable ? 'text-green-400' : 'text-red-400';
    return (
      <div className={`text-sm font-medium ${color}`}>
        {available}/{apis.length} APIs configured
      </div>
    );
  }

  // Compact variant - small grid
  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {apis.map(([key, api]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            {api.available ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <span className={api.available ? 'text-gray-300' : 'text-gray-500'}>
              {api.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Full variant - detailed display
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
        <div>
          <h3 className="font-semibold text-gray-100">API Integration Status</h3>
          <p className="text-sm text-gray-400 mt-1">
            {available} of {apis.length} API{apis.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-2">
          {requiredAvailable ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              Ready
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Missing Required
            </div>
          )}
        </div>
      </div>

      {/* API List */}
      <div className="space-y-2">
        {apis.map(([key, api]) => {
          const isRequired = required.includes(key);
          return (
            <div
              key={key}
              className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${
                api.available
                  ? 'border-green-700/30 bg-green-900/10'
                  : 'border-red-700/30 bg-red-900/10'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                {api.available ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${api.available ? 'text-green-200' : 'text-red-200'}`}>
                    {api.label}
                  </p>
                  {isRequired && (
                    <p className="text-xs text-gray-400">Required for audits</p>
                  )}
                </div>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                api.available
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {api.available ? 'Connected' : 'Not Set Up'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Warning if missing required */}
      {!requiredAvailable && (
        <div className="rounded-lg border border-yellow-700/30 bg-yellow-900/10 p-4">
          <p className="text-sm text-yellow-200">
            ⚠️ Some required APIs are not configured. Please set up all required integrations before running audits.
          </p>
        </div>
      )}
    </div>
  );
}

// Export status fetcher for use in other components
export async function fetchAPIStatus() {
  try {
    const [google, ai, pagespeed, wordpress] = await Promise.all([
      fetch('/api/settings/google').then(r => r.ok ? r.json() : null),
      fetch('/api/settings/ai').then(r => r.ok ? r.json() : null),
      fetch('/api/gsc/sites').then(r => ({ ok: r.ok })),
      fetch('/api/wordpress/connections').then(r => r.ok ? r.json() : null),
    ]);

    return {
      google: Boolean(google?.configured) || google?.ok,
      ai: Boolean(ai?.configured),
      pagespeed: Boolean(google?.pagespeedConfigured),
      wordpress: Array.isArray(wordpress?.connections) && wordpress.connections.length > 0,
    };
  } catch (error) {
    console.error('Failed to fetch API status:', error);
    return null;
  }
}
