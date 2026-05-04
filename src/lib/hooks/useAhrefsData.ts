import { useState, useEffect } from 'react';

export interface AhrefsData {
  domain_rating?: number;
  referring_domains?: number;
  organic_traffic?: number;
  organic_keywords?: number;
  backlinks?: number;
  traffic_cost?: number;
}

export function useAhrefsData(domain: string) {
  const [data, setData] = useState<AhrefsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ahrefs/domain-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain }),
        });

        if (!res.ok) {
          setError('Failed to fetch Ahrefs data');
          return;
        }

        const result = await res.json();
        setData(result);
      } catch (err) {
        setError('Error fetching Ahrefs data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [domain]);

  return { data, loading, error };
}

export function useCompetitorAhrefsData(competitors: string[]) {
  const [data, setData] = useState<Array<{ domain: string; metrics: AhrefsData }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!competitors || competitors.length === 0) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/ahrefs/competitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ competitors }),
        });

        if (!res.ok) {
          setError('Failed to fetch competitor data');
          return;
        }

        const result = await res.json();
        setData(
          result.competitors.map((comp: any) => ({
            domain: comp.domain,
            metrics: comp,
          }))
        );
      } catch (err) {
        setError('Error fetching competitor data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [competitors]);

  return { data, loading, error };
}
