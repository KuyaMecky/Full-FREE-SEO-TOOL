'use client';

import { useState, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeywordResearch } from '@/app/components/keyword-research';
import { ContentAnalyzer } from '@/app/components/content-analyzer';
import { CompetitorAnalysis } from '@/app/components/competitor-analysis';
import { RankTracker } from '@/app/components/rank-tracker';
import { useSearchParams } from 'next/navigation';

function SEOIntelligenceContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get('auditId') || '';
  const domain = searchParams.get('domain') || '';
  const competitors = searchParams.get('competitors')
    ? JSON.parse(decodeURIComponent(searchParams.get('competitors') || '[]'))
    : [];

  return <SEOIntelligencePageContent auditId={auditId} domain={domain} competitors={competitors} />;
}

function SEOIntelligencePageContent({ auditId, domain, competitors }: { auditId: string; domain: string; competitors: string[] }) {

  const [activeTab, setActiveTab] = useState('keywords');

  if (!auditId || !domain) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-400">No audit selected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            SEO Intelligence Dashboard
          </h1>
          <p className="text-gray-400">
            Complete SEO analysis for <span className="font-semibold">{domain}</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-4 gap-4 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
            <TabsTrigger
              value="keywords"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Keyword Research
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Content Analysis
            </TabsTrigger>
            <TabsTrigger
              value="competitors"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Competitors
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
            >
              Rank Tracking
            </TabsTrigger>
          </TabsList>

          {/* Keyword Research Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Keyword Research & Opportunities
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Identify high-potential keywords from Google Search Console data.
                Find quick-win opportunities that can move to the top 3 positions.
              </p>
              <KeywordResearch auditId={auditId} />
            </div>
          </TabsContent>

          {/* Content Analysis Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Content Performance & Readability
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Analyze word count, readability score, H1/H2 structure, and
                internal linking across your content.
              </p>
              <ContentAnalyzer auditId={auditId} />
            </div>
          </TabsContent>

          {/* Competitor Analysis Tab */}
          <TabsContent value="competitors" className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Competitor Analysis
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Compare your website with competitors. Identify content gaps and
                learn from their strategies.
              </p>
              <CompetitorAnalysis
                auditId={auditId}
                yourDomain={domain}
                competitors={competitors}
              />
            </div>
          </TabsContent>

          {/* Rank Tracking Tab */}
          <TabsContent value="ranking" className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-2">
                Keyword Rank Tracking
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Monitor keyword positions and ranking trends. Automatically sync
                with Google Search Console data.
              </p>
              <RankTracker auditId={auditId} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-100 mb-2">💡 Tips</h4>
              <p className="text-gray-400">
                Focus on quick-win keywords ranking 10-30 for fastest results.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-100 mb-2">📊 Updates</h4>
              <p className="text-gray-400">
                Data updates weekly from Google Search Console and your crawl results.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-100 mb-2">🚀 Next Steps</h4>
              <p className="text-gray-400">
                Optimize top content for quick wins, then scale to competitive keywords.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SEOIntelligencePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-700 rounded w-1/3" />
            <div className="h-96 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    }>
      <SEOIntelligenceContent />
    </Suspense>
  );
}
