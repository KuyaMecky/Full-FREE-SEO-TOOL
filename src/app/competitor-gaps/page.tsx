"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Target, TrendingUp, Zap, AlertTriangle } from "lucide-react";

function CompetitorGapsContent() {
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
      const res = await fetch("/api/intelligence/competitor-gaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: selectedAuditId }),
      });
      if (!res.ok) throw new Error("Failed to load");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load competitor analysis");
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
            <Target className="h-10 w-10 text-green-600" />
            Competitor Gap Analysis
          </h1>
          <p className="text-gray-600">Select an audit to analyze competitor gaps</p>
        </div>

        {audits.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-green-800 font-semibold">No audits found</p>
            <p className="text-green-700 mt-2">Run an audit first to analyze competitor gaps</p>
            <button
              onClick={() => router.push('/audit-google')}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                className="w-full text-left p-6 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{audit.domain}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{audit.overallScore}</div>
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
        <p className="mt-4">Analyzing competitor gaps...</p>
      </div>
    );

  if (error)
    return <div className="p-8 text-center text-red-600">{error}</div>;

  if (!data) return null;

  const { analysis, gaps, recommendations, topicClusters } = data;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Target className="h-10 w-10 text-blue-600" />
          Competitor Gap Analysis
        </h1>
        <p className="text-gray-600 mt-2">
          Find what competitors rank for that you don't
        </p>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-gray-600 text-sm mb-2">Total Gaps Found</div>
          <div className="text-4xl font-bold">{analysis.totalGaps}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-green-700 text-sm mb-2">High Priority</div>
          <div className="text-4xl font-bold text-green-600">
            {analysis.highPriority}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Opportunity &gt; 70
          </div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-blue-700 text-sm mb-2">Medium Priority</div>
          <div className="text-4xl font-bold text-blue-600">
            {analysis.mediumPriority}
          </div>
          <div className="text-xs text-blue-600 mt-1">Opportunity 40-70</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="text-purple-700 text-sm mb-2">Low Priority</div>
          <div className="text-4xl font-bold text-purple-600">
            {analysis.lowPriority}
          </div>
        </div>
      </div>

      {/* Competitors */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-bold mb-4">Competitors Analyzed</h2>
        <div className="flex flex-wrap gap-3">
          {data.competitors.map((domain: string) => (
            <div
              key={domain}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium"
            >
              {domain}
            </div>
          ))}
        </div>
      </div>

      {/* Content to Create - High Priority */}
      {recommendations.contentToCreate && recommendations.contentToCreate.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-600" />
            Content to Create (High Opportunity)
          </h2>
          <p className="text-gray-600 mb-4">
            These keywords are ranked by competitors but you don't have content
            for them. Target these first for quick ranking wins.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.contentToCreate.map((item: any, idx: number) => (
              <div
                key={idx}
                className="bg-yellow-50 p-6 rounded-lg border border-yellow-200"
              >
                <h3 className="font-bold text-lg mb-3">{item.keyword}</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Search Volume:</span>
                    <span className="font-bold">{item.volume}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-bold">{item.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Opportunity:</span>
                    <span className="font-bold text-yellow-600">
                      {item.opportunity}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-4">{item.reason}</p>
                <button className="w-full bg-yellow-600 text-white py-2 rounded font-semibold hover:bg-yellow-700">
                  Create Content
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Focus */}
      {recommendations.strategicFocus && (
        <div className="grid md:grid-cols-3 gap-4">
          {/* Quick Wins */}
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="font-bold text-lg mb-4 text-green-700">
              Quick Wins (Low Difficulty)
            </h3>
            <div className="space-y-3">
              {recommendations.strategicFocus.quickWins.map(
                (win: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <p className="font-semibold text-sm mb-1">{win.keyword}</p>
                    <p className="text-xs text-gray-600">{win.reason}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Medium Term */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-bold text-lg mb-4 text-blue-700">
              Medium Term (4-8 weeks)
            </h3>
            <div className="space-y-3">
              {recommendations.strategicFocus.mediumTerm.map(
                (item: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <p className="font-semibold text-sm mb-1">{item.keyword}</p>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Long Term */}
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="font-bold text-lg mb-4 text-purple-700">
              Long Term (Authority Building)
            </h3>
            <div className="space-y-3">
              {recommendations.strategicFocus.longTerm.map(
                (item: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <p className="font-semibold text-sm mb-1">{item.keyword}</p>
                    <p className="text-xs text-gray-600">{item.reason}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Topic Clusters */}
      {topicClusters && topicClusters.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Topical Clusters</h2>
          <p className="text-gray-600 mb-4">
            Group related keywords together to create pillar content
          </p>
          <div className="space-y-4">
            {topicClusters.map((cluster: any, idx: number) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{cluster.topic}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {cluster.keywords.length} related opportunities
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Total Volume</div>
                    <div className="text-2xl font-bold">
                      {cluster.totalVolume}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Keywords:</p>
                  <div className="flex flex-wrap gap-2">
                    {cluster.keywords.map((kw: string, i: number) => (
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

      {/* All Gaps Table */}
      <div>
        <h2 className="text-2xl font-bold mb-4">All Competitor Gaps</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Keyword</th>
                <th className="px-4 py-3 text-center">Volume</th>
                <th className="px-4 py-3 text-center">Difficulty</th>
                <th className="px-4 py-3 text-center">Opportunity</th>
                <th className="px-4 py-3 text-left">Competitor</th>
              </tr>
            </thead>
            <tbody>
              {gaps.slice(0, 50).map((gap: any, idx: number) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{gap.keyword}</td>
                  <td className="px-4 py-3 text-center">{gap.volume}</td>
                  <td className="px-4 py-3 text-center">{gap.difficulty}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        gap.opportunity > 70
                          ? "bg-green-100 text-green-700"
                          : gap.opportunity > 40
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {gap.opportunity}
                    </span>
                  </td>
                  <td className="px-4 py-3">{gap.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CompetitorGapsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <CompetitorGapsContent />
    </Suspense>
  );
}
