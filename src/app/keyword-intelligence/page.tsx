"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Lightbulb, TrendingUp, Target } from "lucide-react";

function KeywordIntelligenceContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("auditId");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auditId) return;
    loadData();
  }, [auditId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/intelligence/keywords?auditId=${auditId}`);
      if (!res.ok) throw new Error("Failed to load");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load keyword analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!auditId)
    return <div className="p-8 text-center">No audit selected</div>;

  if (loading)
    return (
      <div className="p-8 text-center">
        <TrendingUp className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Analyzing keyword opportunities...</p>
      </div>
    );

  if (error)
    return <div className="p-8 text-center text-red-600">{error}</div>;

  if (!data) return null;

  const { analysis, opportunities, recommendations } = data;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Lightbulb className="h-10 w-10 text-yellow-600" />
          Keyword Intelligence
        </h1>
        <p className="text-gray-600 mt-2">Find and target high-opportunity keywords</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-gray-600 text-sm mb-2">Total Opportunities</div>
          <div className="text-4xl font-bold">{analysis.totalOpportunities}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-green-700 text-sm mb-2">High Opportunity</div>
          <div className="text-4xl font-bold text-green-600">{analysis.highOpportunity}</div>
          <div className="text-xs text-green-600 mt-1">Quick ranking wins</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-blue-700 text-sm mb-2">Medium Opportunity</div>
          <div className="text-4xl font-bold text-blue-600">{analysis.mediumOpportunity}</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="text-purple-700 text-sm mb-2">Avg Search Volume</div>
          <div className="text-4xl font-bold text-purple-600">{analysis.avgVolume}</div>
          <div className="text-xs text-purple-600 mt-1">monthly searches</div>
        </div>
      </div>

      {/* High Opportunity Keywords */}
      {recommendations[0] && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-6 w-6 text-green-600" />
            {recommendations[0].title}
          </h2>
          <p className="text-gray-600 mb-4">{recommendations[0].reason}</p>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations[0].keywords.map((kw: any, idx: number) => (
              <div
                key={idx}
                className="bg-green-50 p-6 rounded-lg border border-green-200"
              >
                <h3 className="font-bold text-lg mb-3">{kw.keyword}</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-green-700 text-xs">Volume</div>
                    <div className="font-bold">{kw.searchVolume}</div>
                  </div>
                  <div>
                    <div className="text-green-700 text-xs">Difficulty</div>
                    <div className="font-bold">{kw.difficulty}</div>
                  </div>
                  <div>
                    <div className="text-green-700 text-xs">Opportunity</div>
                    <div className="font-bold">{kw.opportunity}</div>
                  </div>
                </div>
                <button className="mt-4 w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700">
                  Create Content
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic Clusters */}
      {recommendations[1] && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Content Clusters</h2>
          <p className="text-gray-600 mb-4">{recommendations[1].reason}</p>
          <div className="space-y-4">
            {recommendations[1].clusters.slice(0, 5).map((cluster: any, idx: number) => (
              <div key={idx} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Pillar: {cluster.pillarKeyword}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {cluster.relatedKeywords.length} related keywords
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Search Volume</div>
                    <div className="text-2xl font-bold">{cluster.totalVolume}</div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Related Keywords:</p>
                  <div className="flex flex-wrap gap-2">
                    {cluster.relatedKeywords.map((kw: string, i: number) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Opportunities Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Keyword Opportunities</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Keyword</th>
                <th className="px-4 py-3 text-center">Volume</th>
                <th className="px-4 py-3 text-center">Difficulty</th>
                <th className="px-4 py-3 text-center">Opportunity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.slice(0, 20).map((kw: any, idx: number) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                  <td className="px-4 py-3 text-center">{kw.searchVolume}</td>
                  <td className="px-4 py-3 text-center">{kw.difficulty}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        kw.opportunity > 70
                          ? "bg-green-100 text-green-700"
                          : kw.opportunity > 40
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {kw.opportunity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {kw.opportunity > 70 ? "Target first" : "Add to backlog"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function KeywordIntelligencePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <KeywordIntelligenceContent />
    </Suspense>
  );
}
