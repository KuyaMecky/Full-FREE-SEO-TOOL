'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Share2, AlertCircle, CheckCircle } from 'lucide-react';

interface AuditDetail {
  id: string;
  domain: string;
  status: string;
  overallScore: number;
  createdAt: string;
  report?: {
    executiveSummary: string;
    scorecard: any;
    actionItems: any;
    issues?: any[];
    recommendations?: any[];
  };
}

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        const res = await fetch(`/api/audit-results/${auditId}`);
        if (!res.ok) {
          throw new Error('Failed to load audit');
        }
        const data = await res.json();
        setAudit(data);
      } catch (err) {
        setError('Could not load audit details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [auditId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link href="/audit-google" className="text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-2 font-medium">
          <ArrowLeft size={18} />
          Back to Audits
        </Link>
        <div className="bg-red-50 border border-red-300 rounded-lg p-6 text-red-800">
          <AlertCircle className="inline mr-2" size={20} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/audit-google" className="text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-2 font-medium">
            <ArrowLeft size={18} />
            Back to Audits
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{audit.domain}</h1>
              <p className="text-gray-600">
                Audit from {new Date(audit.createdAt).toLocaleDateString()} at {new Date(audit.createdAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="text-right">
              <div
                className={`text-5xl font-bold mb-2 ${
                  audit.overallScore >= 80
                    ? 'text-green-600'
                    : audit.overallScore >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {audit.overallScore}
              </div>
              <p className="text-gray-600 text-sm">Overall Score</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium">
              <Download size={18} />
              Export PDF
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition font-medium">
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        {audit.report?.executiveSummary && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
            <p className="text-gray-700 leading-relaxed">
              {audit.report.executiveSummary}
            </p>
          </div>
        )}

        {/* Scorecard */}
        {audit.report?.scorecard && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Scorecard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {typeof audit.report.scorecard === 'object' ? (
                Object.entries(audit.report.scorecard).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-600 text-sm mb-2">{key}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof value === 'number' ? value : JSON.stringify(value).substring(0, 50)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No scorecard data available</p>
              )}
            </div>
          </div>
        )}

        {/* Issues */}
        {audit.report?.issues && audit.report.issues.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-red-600" />
              Issues Found ({audit.report.issues.length})
            </h2>
            <div className="space-y-3">
              {audit.report.issues.slice(0, 10).map((issue: any, idx: number) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">{issue.title || issue.name || `Issue ${idx + 1}`}</p>
                  <p className="text-red-700 text-sm mt-1">
                    {issue.description || issue.message || 'No description available'}
                  </p>
                </div>
              ))}
              {audit.report.issues.length > 10 && (
                <p className="text-gray-600 text-sm">
                  ... and {audit.report.issues.length - 10} more issues
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {audit.report?.recommendations && audit.report.recommendations.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" />
              Recommendations ({audit.report.recommendations.length})
            </h2>
            <div className="space-y-3">
              {audit.report.recommendations.slice(0, 10).map((rec: any, idx: number) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-900 font-medium">{rec.title || rec.name || `Recommendation ${idx + 1}`}</p>
                  <p className="text-green-700 text-sm mt-1">
                    {rec.description || rec.message || 'No description available'}
                  </p>
                </div>
              ))}
              {audit.report.recommendations.length > 10 && (
                <p className="text-gray-600 text-sm">
                  ... and {audit.report.recommendations.length - 10} more recommendations
                </p>
              )}
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!audit.report?.issues && !audit.report?.recommendations && !audit.report?.scorecard && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-gray-600">
              Full audit report data not available. Check back soon or run a new audit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
