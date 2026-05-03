'use client';

import { useEffect, useState } from 'react';

export type AvailableProviders = {
  google: boolean;
  ahrefs: boolean;
  pagespeed: boolean;
};

export function useProviders() {
  const [providers, setProviders] = useState<AvailableProviders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/providers/status');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please log in');
        } else {
          throw new Error('Failed to fetch providers');
        }
        return;
      }
      const data = await res.json();
      setProviders(data);
      setError('');
    } catch (err) {
      setError('Failed to load provider status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { providers, loading, error, refetch: fetchProviders };
}

export function hasAnyProvider(providers: AvailableProviders | null): boolean {
  if (!providers) return false;
  return providers.google || providers.ahrefs || providers.pagespeed;
}

export function getEnabledProviders(providers: AvailableProviders | null): string[] {
  if (!providers) return [];
  return Object.entries(providers)
    .filter(([_, available]) => available)
    .map(([name]) => name);
}
