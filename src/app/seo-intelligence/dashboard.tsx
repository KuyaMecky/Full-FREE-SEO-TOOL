"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Zap, Target, TrendingUp, Loader } from "lucide-react";

export default function IntelligenceDashboard() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("auditId");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!auditId) {
      setLoading(false);
      return;
    }
    loadIntelligence();
  }, [auditId]);

  const loadIntelligence = async () => {
    try {
      await fetch("/api/intelligence/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId }),
      });

      const res = await fetch(`/api/intelligence/priorities?auditId=${auditId}`);
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!auditId) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
        <p>No audit selected</p>
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
