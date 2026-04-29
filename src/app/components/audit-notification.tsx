"use client";

import { useEffect, useState } from "react";
import { X, Loader, CheckCircle, AlertCircle } from "lucide-react";

interface AuditStatus {
  auditId: string;
  domain: string;
  status: "crawling" | "analyzing" | "complete" | "error";
  crawledPages?: number;
  totalPages?: number;
  progress?: number;
  errorMessage?: string;
}

export function AuditNotification() {
  const [audits, setAudits] = useState<AuditStatus[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Check for active audits every 2 seconds
    const checkAudits = async () => {
      try {
        // Get all audits for the user
        const res = await fetch("/api/audit");
        if (!res.ok) return;

        const allAudits = await res.json();

        // Filter for audits that are in progress
        const activeAudits = allAudits.filter(
          (audit: any) =>
            audit.status === "pending" ||
            audit.status === "crawling" ||
            audit.status === "analyzing"
        );

        if (activeAudits.length > 0) {
          // Get progress for each active audit
          const updatedAudits = await Promise.all(
            activeAudits.map(async (audit: any) => {
              try {
                const progressRes = await fetch(
                  `/api/crawl/progress?auditId=${audit.id}`
                );
                if (!progressRes.ok) {
                  return {
                    auditId: audit.id,
                    domain: audit.domain,
                    status: audit.status,
                  };
                }

                // Get last event from SSE (just check current status)
                return {
                  auditId: audit.id,
                  domain: audit.domain,
                  status: audit.status,
                };
              } catch {
                return {
                  auditId: audit.id,
                  domain: audit.domain,
                  status: audit.status,
                };
              }
            })
          );

          setAudits(updatedAudits);
        } else {
          // No active audits
          setAudits([]);
        }
      } catch (error) {
        console.error("Failed to check audits:", error);
      }
    };

    checkAudits();
    const interval = setInterval(checkAudits, 2000);

    return () => clearInterval(interval);
  }, []);

  const visibleAudits = audits.filter((a) => !dismissed.has(a.auditId));

  if (visibleAudits.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 space-y-3 max-w-sm">
      {visibleAudits.map((audit) => (
        <div
          key={audit.auditId}
          className={`rounded-lg border p-4 shadow-lg ${
            audit.status === "complete"
              ? "bg-green-50 border-green-200"
              : audit.status === "error"
              ? "bg-red-50 border-red-200"
              : "bg-blue-50 border-blue-200 animate-pulse"
          }`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div>
              {audit.status === "complete" ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : audit.status === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              ) : (
                <Loader className="h-5 w-5 text-blue-600 animate-spin mt-0.5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                {audit.status === "complete"
                  ? "✅ Audit Complete"
                  : audit.status === "error"
                  ? "❌ Audit Failed"
                  : "🔄 Audit in Progress"}
              </p>
              <p className="text-xs text-gray-600 truncate">{audit.domain}</p>
              {audit.status !== "complete" && audit.status !== "error" && (
                <p className="text-xs text-gray-500 mt-1">
                  {audit.status === "crawling"
                    ? "Crawling pages..."
                    : "Analyzing results..."}
                </p>
              )}
              {audit.status === "complete" && (
                <a
                  href={`/audit/${audit.auditId}`}
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  View results →
                </a>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setDismissed((prev) => new Set([...prev, audit.auditId]));
              }}
              className="p-1 hover:bg-black/10 rounded transition-colors shrink-0"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
