"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Activity, TrendingUp, AlertCircle, CheckCircle, Target, AlertTriangle } from "lucide-react";

function SEOHealthContent() {
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
      loadHealthScore();
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

  const loadHealthScore = async () => {
    try {
      setLoading(true);
      setError("");
      // First calculate the health score
      await fetch("/api/intelligence/health-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: selectedAuditId }),
      });

      // Then retrieve it
      const res = await fetch(`/api/intelligence/health-score?auditId=${selectedAuditId}`);
      if (!res.ok) throw new Error("Failed to load");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load health score");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedAuditId) {
    if (loading) {
      return (
        <div className="p-8 text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4">Loading your audits...</p>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Activity className="h-10 w-10 text-blue-600" />
            SEO Health Monitor
          </h1>
          <p className="text-gray-600">Select an audit to monitor your SEO health</p>
        </div>

        {audits.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <p className="text-blue-800 font-semibold">No audits found</p>
            <p className="text-blue-700 mt-2">Run an audit first to check your SEO health</p>
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
                  <div>
                    <h3 className="font-semibold text-gray-900">{audit.domain}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{audit.overallScore}</div>
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
        <Activity className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-4">Calculating SEO health...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  if (!data || !data.current) return null;

  const { current, history } = data;
  const score = current.score;

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-blue-50 border-blue-200";
    if (score >= 40) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Activity className="h-10 w-10 text-blue-600" />
          SEO Health Monitor
        </h1>
        <p className="text-gray-600 mt-2">Track your site's SEO health and improvement progress</p>
      </div>

      {/* Main Health Score Card */}
      <div className={`rounded-lg p-8 border-2 ${getScoreBgColor(score)}`}>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Score Visualization */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-48 w-48">
              <svg className="transform -rotate-90 h-48 w-48" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-gray-200"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={getScoreColor(score)}
                  strokeDasharray={`${(score / 100) * 565.48} 565.48`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                  {score}
                </span>
                <span className="text-sm text-gray-600">Score</span>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <h3 className="font-bold text-lg mb-4">Score Breakdown</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">Issues</span>
                  <span className="text-sm font-bold">{current.breakdown.issues}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${current.breakdown.issues}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">Content</span>
                  <span className="text-sm font-bold">{current.breakdown.content}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${current.breakdown.content}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">Technical</span>
                  <span className="text-sm font-bold">{current.breakdown.technical}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${current.breakdown.technical}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">Performance</span>
                  <span className="text-sm font-bold">{current.breakdown.performance}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${current.breakdown.performance}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold">Keywords</span>
                  <span className="text-sm font-bold">{current.breakdown.keywords}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${current.breakdown.keywords}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <h3 className="font-bold text-lg mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600">Issues Found</p>
                <p className="text-2xl font-bold">{current.metrics.totalIssues}</p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600">Traffic at Risk</p>
                <p className="text-2xl font-bold">
                  +{current.metrics.estimatedTrafficLoss}
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600">Recovery Potential</p>
                <p className="text-2xl font-bold text-green-600">
                  +{current.metrics.estimatedTrafficRecovery}
                </p>
              </div>
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600">Quick Wins</p>
                <p className="text-2xl font-bold text-blue-600">
                  {current.metrics.quickWinsCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Score Trend */}
      {history && history.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Health Score Trend
          </h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {history.reverse().map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-full rounded-t ${
                    item.score >= 80
                      ? "bg-green-500"
                      : item.score >= 60
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`}
                  style={{ height: `${(item.score / 100) * 100}%` }}
                />
                <p className="text-xs text-gray-600">
                  {new Date(item.date).toLocaleDateString()}
                </p>
                <p className="text-sm font-bold">{item.score}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issue Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h3 className="font-bold">Critical Issues</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{current.metrics.critical || 0}</p>
          <p className="text-sm text-red-700 mt-2">
            {current.metrics.critical ? "Need immediate attention" : "None found"}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-yellow-600" />
            <h3 className="font-bold">High Priority</h3>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{current.metrics.high || 0}</p>
          <p className="text-sm text-yellow-700 mt-2">
            Fix these in the next 1-2 weeks
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="font-bold">Quick Wins</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {current.metrics.quickWinsCount}
          </p>
          <p className="text-sm text-green-700 mt-2">
            High impact, low effort fixes
          </p>
        </div>
      </div>

      {/* Implementation Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Implementation Timeline</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-green-100 text-green-700 font-bold flex items-center justify-center text-lg">
                1
              </div>
              <div className="w-1 h-12 bg-gray-200 mt-2" />
            </div>
            <div className="pb-4">
              <h3 className="font-bold text-lg">Week 1-2: Quick Wins</h3>
              <p className="text-gray-600 mt-1">
                Fix {current.metrics.quickWinsCount} high-impact, low-effort items
              </p>
              <p className="text-sm text-green-700 font-semibold mt-2">
                Expected impact: +{Math.round(current.metrics.estimatedTrafficRecovery * 0.4)} clicks/month
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-lg">
                2
              </div>
              <div className="w-1 h-12 bg-gray-200 mt-2" />
            </div>
            <div className="pb-4">
              <h3 className="font-bold text-lg">Week 3-4: High Priority</h3>
              <p className="text-gray-600 mt-1">
                Address {current.metrics.high || 0} high-priority issues
              </p>
              <p className="text-sm text-blue-700 font-semibold mt-2">
                Expected impact: +{Math.round(current.metrics.estimatedTrafficRecovery * 0.3)} clicks/month
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-lg">
                3
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg">Month 2+: Strategic Improvements</h3>
              <p className="text-gray-600 mt-1">
                Implement remaining improvements for long-term growth
              </p>
              <p className="text-sm text-purple-700 font-semibold mt-2">
                Expected impact: +{Math.round(current.metrics.estimatedTrafficRecovery * 0.3)} clicks/month
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Recommended Next Steps</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <span>
              <strong>Run bulk operations</strong> to fix quick wins across multiple pages at once
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <span>
              <strong>Set up webhooks</strong> to get notified of ranking improvements after fixes
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <span>
              <strong>Generate report</strong> to document baseline before implementing fixes
            </span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <span>
              <strong>Monitor progress</strong> with follow-up audits in 30, 60, and 90 days
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function SEOHealthPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SEOHealthContent />
    </Suspense>
  );
}
