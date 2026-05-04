"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lightbulb, TrendingUp, Target, AlertTriangle, ArrowLeft } from "lucide-react";

function KeywordIntelligenceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = searchParams.get("auditId");
  const [data, setData] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState(auditId || "");

  useEffect(() => {
    if (!selectedAuditId) {
      fetchAudits();
    } else {
      loadData();
    }
  }, [selectedAuditId]);

  const fetchAudits = async () => {
    try {
      const res = await fetch("/api/audit-google");
      if (res.ok) {
        const auditData = await res.json();
        setAudits(auditData);
      }
    } catch (err) {
      console.error("Failed to fetch audits:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/intelligence/keywords?auditId=${selectedAuditId}`);
      if (!res.ok) throw new Error("Failed to load");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load keyword analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAuditId) {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <TrendingUp className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4">Loading your audits...</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Lightbulb className="h-10 w-10 text-yellow-600" />
            Keyword Opportunities
          </h1>
          <p className="text-gray-600">Select an audit to view keyword analysis</p>
        </div>

        {audits.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <p className="text-yellow-800 font-semibold">No audits found</p>
            <p className="text-yellow-700 mt-2">Run an audit first to view keyword opportunities</p>
            <button
              onClick={() => router.push('/audit-google')}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Run Audit
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">Your recent audits:</p>
            {audits.map((audit) => (
              <button
                key={audit.id}
                onClick={() => setSelectedAuditId(audit.id)}
                className="w-full text-left p-6 border border-gray-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{audit.domain}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-600">{audit.overallScore}</div>
                    <p className="text-xs text-gray-500">Score</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

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
