'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Trash2, Plus, AlertCircle, CheckCircle } from 'lucide-react';

interface RankKeyword {
  id: string;
  keyword: string;
  snapshots: Array<{
    date: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
  }>;
}

export default function RankTrackerPage() {
  const [keywords, setKeywords] = useState<RankKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string>('');
  const [newKeyword, setNewKeyword] = useState('');
  const [adding, setAdding] = useState(false);
  const [polling, setPolling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    if (propertyId) loadKeywords();
  }, [propertyId]);

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/gsc/properties');
      if (res.ok) {
        const data = await res.json();
        if (data.properties?.length > 0) setPropertyId(data.properties[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadKeywords = async () => {
    try {
      const res = await fetch(`/api/rank-tracking/keywords?propertyId=${selectedProperty}`);
      if (res.ok) {
        const data = await res.json();
        setKeywords(data.keywords || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAdding(true);
    setMessage(null);
    try {
      const res = await fetch('/api/rank-tracking/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, keyword: newKeyword.trim() }),
      });
      if (res.ok) {
        setNewKeyword('');
        setMessage({ type: 'success', text: 'Keyword added' });
        loadKeywords();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error });
      }
    } finally {
      setAdding(false);
    }
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm('Remove keyword?')) return;
    try {
      await fetch(`/api/rank-tracking/keywords?keywordId=${id}`, { method: 'DELETE' });
      loadKeywords();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };

  const pollRankings = async () => {
    setPolling(true);
    setMessage(null);
    try {
      const res = await fetch('/api/rank-tracking/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: `Updated ${data.updates} keywords` });
        loadKeywords();
      }
    } finally {
      setPolling(false);
    }
  };

  const getPositionBadge = (position: number) => {
    if (position < 3) return <Badge className='bg-green-600'>Top 3</Badge>;
    if (position < 11) return <Badge className='bg-blue-600'>Top 10</Badge>;
    if (position < 21) return <Badge className='bg-amber-600'>Top 20</Badge>;
    return <Badge variant='outline'>Outside Top 20</Badge>;
  };

  if (loading) return <div className='p-8'><div className='h-64 bg-gray-200' /></div>;

  return (
    <div className='max-w-7xl mx-auto p-8 space-y-8'>
      <div>
        <h1 className='text-3xl font-bold'>Rank Tracker</h1>
        <p className='text-gray-500'>Monitor keyword rankings from Google Search Console</p>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          {message.type === 'error' ? <AlertCircle className='h-4 w-4' /> : <CheckCircle className='h-4 w-4' />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add Keywords to Track</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex gap-2'>
            <Input
              placeholder='e.g., best seo tools'
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button onClick={addKeyword} disabled={adding} className='gap-2'>
              <Plus className='h-4 w-4' />
            </Button>
          </div>
          <Button onClick={pollRankings} disabled={polling || !keywords.length} variant='outline' className='w-full'>
            {polling ? 'Polling...' : 'Update Rankings Now'}
          </Button>
        </CardContent>
      </Card>

      {keywords.length > 0 ? (
        <div className='space-y-4'>
          <h2 className='text-xl font-bold'>Tracked Keywords ({keywords.length})</h2>
          {keywords.map((kw) => {
            const current = kw.snapshots[0];
            const prev = kw.snapshots[1];
            return (
              <Card key={kw.id}>
                <CardContent className='pt-6'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='font-semibold'>{kw.keyword}</h3>
                      {current && (
                        <div className='flex gap-6 mt-2 text-sm'>
                          <div>
                            <span className='text-gray-500'>Position</span>
                            <div className='flex items-center gap-2 mt-1'>
                              {getPositionBadge(current.position)}
                              <span className='font-bold'>#{current.position}</span>
                              {prev && (current.position < prev.position ? <TrendingUp className='h-4 w-4 text-green-600' /> : <TrendingDown className='h-4 w-4 text-red-600' />)}
                            </div>
                          </div>
                          <div>
                            <span className='text-gray-500'>Clicks (30d)</span>
                            <p className='font-bold'>{Math.round(kw.snapshots.slice(0, 30).reduce((s, x) => s + x.clicks, 0) / Math.min(30, kw.snapshots.length))}</p>
                          </div>
                          <div>
                            <span className='text-gray-500'>Impressions (30d)</span>
                            <p className='font-bold'>{Math.round(kw.snapshots.slice(0, 30).reduce((s, x) => s + x.impressions, 0) / Math.min(30, kw.snapshots.length))}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant='ghost' size='sm' onClick={() => deleteKeyword(kw.id)} className='text-red-600'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className='text-center py-12'>
            <p className='text-gray-500'>No keywords tracked yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
