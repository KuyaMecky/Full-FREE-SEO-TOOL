"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Download, Eye } from "lucide-react";

function ReportsContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("auditId");
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [error, setError] = useState("");

  const generateReport = async () => {
    if (!auditId) return;
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/intelligence/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId, format: "html" }),
      });

      if (!res.ok) throw new Error("Failed to generate");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setReportUrl(url);
    } catch (err) {
      setError("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (reportUrl) {
      const a = document.createElement("a");
      a.href = reportUrl;
      a.download = `seo-audit-${auditId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!auditId)
    return (
      <div className="p-8 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p>No audit selected</p>
      </div>
    );

  return (
    <div className="space-y-8 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <FileText className="h-10 w-10 text-blue-600" />
          SEO Audit Reports
        </h1>
        <p className="text-gray-600 mt-2">
          Generate professional reports to share with clients or team members
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="text-center">
          <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Professional SEO Report</h2>
          <p className="text-gray-600 mb-6">
            Generate a comprehensive, client-ready report with all findings,
            recommendations, and ROI projections.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Generating..." : "Generate Report"}
              <FileText className="h-5 w-5" />
            </button>

            {reportUrl && (
              <>
                <a
                  href={reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
                >
                  <Eye className="h-5 w-5" />
                  View Report
                </a>
                <button
                  onClick={downloadReport}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download HTML
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
        <h3 className="text-xl font-bold mb-4">What's Included:</h3>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Executive summary with key metrics</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>All findings organized by severity</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Quick wins (high impact, low effort items)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Top recommendations with ROI metrics</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Content performance analysis</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Implementation roadmap (phases 1-2)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-600 font-bold">✓</span>
            <span>Professional design (print-ready)</span>
          </li>
        </ul>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <h3 className="text-xl font-bold mb-4">How to Use:</h3>
        <ol className="space-y-3 text-gray-700 list-decimal list-inside">
          <li>Click "Generate Report" to create the report</li>
          <li>Use "View Report" to preview in your browser</li>
          <li>Download as HTML or print directly to PDF</li>
          <li>Share with clients or team members</li>
          <li>Use as proposal documentation</li>
        </ol>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
