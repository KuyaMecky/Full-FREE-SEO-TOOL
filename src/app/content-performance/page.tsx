"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, FileText, AlertTriangle, Zap } from "lucide-react";

function ContentPerformanceContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("auditId");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("wordcount");

  useEffect(() => {
    if (!auditId) return;
    loadData();
  }, [auditId, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/intelligence/content-performance?auditId=${auditId}&sortBy=${sortBy}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load content analysis");
    } finally {
      setLoading(false);
    }
  };

  if (!auditId)
    return <div className="p-8 text-center">No audit selected</div>;

  if (loading)
    return (
      <div className="p-8 text-center">
        <Zap className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Analyzing your content...</p>
      </div>
    );

  if (error)
    return <div className="p-8 text-center text-red-600">{error}</div>;

  if (!data) return null;

  const { analysis, insights, pages } = data;

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <BarChart3 className="h-10 w-10 text-purple-600" />
          Content Performance
        </h1>
        <p className="text-gray-600 mt-2">Optimize content by word count and depth</p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-gray-600 text-sm mb-2">Total Pages</div>
          <div className="text-4xl font-bold">{analysis.totalPages}</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-blue-700 text-sm mb-2">Avg Word Count</div>
          <div className="text-4xl font-bold text-blue-600">{analysis.avgWordCount}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-green-700 text-sm mb-2">Optimal</div>
          <div className="text-4xl font-bold text-green-600">{insights.optimalContent}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <div className="text-yellow-700 text-sm mb-2">Too Short</div>
          <div className="text-4xl font-bold text-yellow-600">{insights.shortContent}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <div className="text-red-700 text-sm mb-2">Too Long</div>
          <div className="text-4xl font-bold text-red-600">{insights.overLength}</div>
        </div>
      </div>

      {analysis.underperforming.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            Needs Expansion
          </h2>
          <div className="space-y-3">
            {analysis.underperforming.slice(0, 10).map((page: any, idx: number) => (
              <div key={idx} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex justify-between mb-2">
                  <div className="font-bold">{page.title}</div>
                  <span className="font-bold text-yellow-700">{page.wordCount} words</span>
                </div>
                <p className="text-sm text-yellow-700">→ {page.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            All Pages
          </h2>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg"
          >
            <option value="wordcount">Word Count</option>
            <option value="readability">Readability</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-center">Words</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 30).map((page: any, idx: number) => {
                let status = "Optimal";
                let statusColor = "bg-green-100 text-green-700";
                if (page.contentLength < 300) {
                  status = "Expand";
                  statusColor = "bg-yellow-100 text-yellow-700";
                } else if (page.contentLength < 1000) {
                  status = "Improve";
                  statusColor = "bg-blue-100 text-blue-700";
                } else if (page.contentLength > 3000) {
                  status = "Split";
                  statusColor = "bg-purple-100 text-purple-700";
                }

                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{page.pageTitle}</td>
                    <td className="px-4 py-3 text-center font-bold">{page.contentLength}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded text-xs font-bold ${statusColor}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {page.contentLength < 1000 ? "Add depth" : page.contentLength > 3000 ? "Break into subtopics" : "Well optimized"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ContentPerformancePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ContentPerformanceContent />
    </Suspense>
  );
}
