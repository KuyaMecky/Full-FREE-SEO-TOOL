"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, Zap, Target, TrendingUp, Loader, FileText } from "lucide-react";

export default function IntelligenceDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const auditId = searchParams.get("auditId");
  const [data, setData] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAuditId, setSelectedAuditId] = useState<string>(auditId || "");

  useEffect(() => {
    if (selectedAuditId) {
      loadIntelligence();
    } else {
      fetchAudits();
    }
  }, [selectedAuditId]);

  const fetchAudits = async () => {
    try {
      const res = await fetch("/api/audit-google");
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (err) {
      console.error("Failed to fetch audits:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadIntelligence = async () => {
    try {
      setLoading(true);
      setError("");
      await fetch("/api/intelligence/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: selectedAuditId }),
      });

      const res = await fetch(`/api/intelligence/priorities?auditId=${selectedAuditId}`);
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Error loading intelligence:", err);
      setError("Failed to load analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAuditId) {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4">Loading your audits...</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <TrendingUp className="h-10 w-10 text-blue-600" />
            SEO Intelligence Report
          </h1>
          <p className="text-gray-600">Select an audit to view detailed analysis</p>
        </div>

        {audits.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <p className="text-yellow-800 font-semibold">No audits found</p>
            <p className="text-yellow-700 mt-2">Run an audit first to view intelligence reports</p>
            <button
              onClick={() => router.push('/audit-google')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                className="w-full text-left p-6 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{audit.domain}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(audit.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        audit.overallScore >= 80
                          ? 'text-green-600'
                          : audit.overallScore >= 60
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {audit.overallScore}
                    </div>
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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Analyzing your SEO opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <TrendingUp className="h-10 w-10 text-blue-600" />
          SEO Intelligence Report
        </h1>
        <p className="text-gray-600 mt-2">Prioritized roadmap to maximize your organic traffic</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-gray-600 text-sm mb-2">Total Issues</div>
          <div className="text-4xl font-bold">{data.totalIssues}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="text-red-700 text-sm mb-2 font-semibold">Traffic at Risk</div>
          <div className="text-4xl font-bold text-red-600">+{data.totalTrafficRisk}</div>
          <div className="text-xs text-red-600 mt-1">clicks/month</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-green-700 text-sm mb-2 font-semibold">Quick Win Potential</div>
          <div className="text-4xl font-bold text-green-600">{data.roiAnalysis?.phase1?.issues || 0}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-gray-600 text-sm mb-2">Implementation Time</div>
          <div className="text-4xl font-bold">{data.totalFixTime}h</div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Zap className="h-6 w-6 text-green-600" />
          Quick Wins
        </h2>
        {data.quickWins?.length > 0 ? (
          <div className="space-y-4">
            {data.quickWins.map((win: any, idx: number) => (
              <div key={win.id} className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-green-100 text-green-700 font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="text-lg font-bold">{win.type}</h3>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div><span className="text-gray-600 text-sm">+{win.estimatedTraffic}</span> <span className="font-bold">clicks/month</span></div>
                  <div><span className="text-gray-600 text-sm">{Math.round(win.fixComplexity * 0.5)}</span> <span className="font-bold">hours</span></div>
                  <div><span className="text-gray-600 text-sm">Priority:</span> <span className="font-bold">{win.priority}/10</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 p-8 rounded-lg text-center">
            <p className="text-green-700">No quick wins! Great job!</p>
          </div>
        )}
      </div>

      {data.recommendations?.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-6 w-6" />
            Top Recommendations
          </h2>
          <div className="space-y-4">
            {data.recommendations.slice(0, 5).map((rec: any) => (
              <div key={rec.id} className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="font-bold mb-2">{rec.title}</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div><span className="text-gray-600">Impact:</span> <span className="font-bold">{rec.estimatedImpact}</span></div>
                  <div><span className="text-gray-600">Time:</span> <span className="font-bold">{rec.timeInvestment}</span></div>
                  <div><span className="text-gray-600">ROI:</span> <span className="font-bold">{rec.impactMetric}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
