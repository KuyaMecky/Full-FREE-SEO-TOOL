"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, CheckCircle, AlertCircle, Loader } from "lucide-react";

function BulkOperationsContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("auditId");
  const [issues, setIssues] = useState<any[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [selectedOperation, setSelectedOperation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [operationData, setOperationData] = useState<Record<string, any>>({});

  const operationTypes = [
    {
      id: "update-meta-title",
      label: "Update Meta Titles",
      description: "Update page titles to improve CTR",
      icon: "📝",
    },
    {
      id: "update-meta-description",
      label: "Update Meta Descriptions",
      description: "Add compelling meta descriptions",
      icon: "✏️",
    },
    {
      id: "add-schema-markup",
      label: "Add Schema Markup",
      description: "Add JSON-LD schema to pages",
      icon: "🔗",
    },
    {
      id: "add-internal-link",
      label: "Add Internal Links",
      description: "Link to high-value pages",
      icon: "🔀",
    },
    {
      id: "fix-redirect",
      label: "Fix Redirect Chains",
      description: "Clean up broken redirects",
      icon: "➡️",
    },
    {
      id: "add-header-tag",
      label: "Add Header Tags",
      description: "Improve content structure",
      icon: "📋",
    },
  ];

  useEffect(() => {
    if (!auditId) return;
    loadIssues();
  }, [auditId]);

  const loadIssues = async () => {
    try {
      // Load issues from the audit findings
      // This would fetch actual audit findings grouped by type
      setIssues([
        {
          type: "missing-meta-title",
          label: "Missing Meta Titles",
          count: 12,
          pages: ["page1.html", "page2.html", "page3.html"],
        },
        {
          type: "short-meta-description",
          label: "Meta Descriptions < 120 chars",
          count: 24,
          pages: ["page4.html", "page5.html"],
        },
        {
          type: "missing-h1",
          label: "Missing H1 Tags",
          count: 8,
          pages: ["page6.html", "page7.html"],
        },
        {
          type: "missing-schema",
          label: "Missing Schema Markup",
          count: 15,
          pages: ["page8.html", "page9.html"],
        },
      ]);
    } catch (err) {
      setError("Failed to load issues");
    }
  };

  const handleSelectPages = (pages: string[]) => {
    setSelectedPages(new Set(pages));
  };

  const handleSelectAllPages = () => {
    const allPages = new Set<string>();
    issues.forEach((issue) => {
      issue.pages.forEach((page: string) => allPages.add(page));
    });
    setSelectedPages(allPages);
  };

  const handleExecuteOperation = async () => {
    if (!selectedOperation || selectedPages.size === 0) {
      setError("Please select an operation and at least one page");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/intelligence/bulk-operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditId,
          operationType: selectedOperation,
          selectedPages: Array.from(selectedPages),
          fixData: operationData,
        }),
      });

      if (!res.ok) throw new Error("Failed to execute operation");

      const result = await res.json();
      setResults(result);
      setCompleted(true);
    } catch (err) {
      setError("Failed to execute bulk operation");
    } finally {
      setLoading(false);
    }
  };

  if (!auditId) {
    return <div className="p-8 text-center">No audit selected</div>;
  }

  if (completed && results) {
    return (
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <CheckCircle className="h-10 w-10 text-green-600" />
            Operation Complete
          </h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <div>
              <div className="text-sm text-green-700 mb-1">Total Pages</div>
              <div className="text-3xl font-bold">{results.summary.totalPages}</div>
            </div>
            <div>
              <div className="text-sm text-green-700 mb-1">Successful</div>
              <div className="text-3xl font-bold text-green-600">
                {results.summary.successful}
              </div>
            </div>
            <div>
              <div className="text-sm text-green-700 mb-1">Failed</div>
              <div className="text-3xl font-bold text-red-600">
                {results.summary.failed}
              </div>
            </div>
            <div>
              <div className="text-sm text-green-700 mb-1">Estimated Impact</div>
              <div className="text-3xl font-bold">
                +{results.summary.estimatedTrafficGain}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg">
            <h3 className="font-bold mb-4">Details</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Operation:</span>{" "}
                {results.operation}
              </p>
              <p>
                <span className="font-semibold">Time to Implement:</span>{" "}
                {results.summary.timeToImplement}
              </p>
              <p>
                <span className="font-semibold">Traffic Potential:</span> +
                {results.summary.estimatedTrafficGain} clicks/month
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setCompleted(false);
            setSelectedPages(new Set());
            setSelectedOperation("");
            setResults(null);
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Perform Another Operation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <Zap className="h-10 w-10 text-blue-600" />
          Bulk Operations
        </h1>
        <p className="text-gray-600 mt-2">
          Fix issues across multiple pages at once to save time
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Issues Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        {issues.map((issue) => (
          <div
            key={issue.type}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold">{issue.label}</h3>
                <p className="text-sm text-gray-600">
                  {issue.count} page{issue.count !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {issue.count}
              </span>
            </div>
            <button
              onClick={() => handleSelectPages(issue.pages)}
              className="w-full text-sm px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-semibold"
            >
              Select These Pages
            </button>
          </div>
        ))}
      </div>

      {/* Selected Pages Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Selected Pages</h3>
          <span className="text-2xl font-bold text-blue-600">
            {selectedPages.size}
          </span>
        </div>
        {selectedPages.size > 0 && (
          <>
            <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
              {Array.from(selectedPages).slice(0, 10).map((page) => (
                <div key={page} className="text-sm text-blue-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {page}
                </div>
              ))}
              {selectedPages.size > 10 && (
                <p className="text-sm text-blue-700 font-semibold">
                  +{selectedPages.size - 10} more pages
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedPages(new Set())}
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
            >
              Clear Selection
            </button>
          </>
        )}
      </div>

      {/* Operation Selection */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Select Operation</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {operationTypes.map((op) => (
            <button
              key={op.id}
              onClick={() => {
                setSelectedOperation(op.id);
                setOperationData({});
              }}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedOperation === op.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-3xl mb-2">{op.icon}</div>
              <h3 className="font-bold text-left">{op.label}</h3>
              <p className="text-sm text-gray-600 text-left mt-1">
                {op.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Operation Data Input */}
      {selectedOperation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-bold mb-4">Operation Details</h3>
          <div className="space-y-4">
            {selectedOperation === "update-meta-title" && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Meta Title Template
                </label>
                <input
                  type="text"
                  placeholder="e.g., {title} | My Brand"
                  value={operationData.title || ""}
                  onChange={(e) =>
                    setOperationData({ ...operationData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}

            {selectedOperation === "update-meta-description" && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Meta Description Template
                </label>
                <textarea
                  placeholder="e.g., Learn about {topic}. {description}"
                  value={operationData.description || ""}
                  onChange={(e) =>
                    setOperationData({
                      ...operationData,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
            )}

            {selectedOperation === "add-schema-markup" && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Schema Type
                </label>
                <select
                  value={operationData.schemaType || ""}
                  onChange={(e) =>
                    setOperationData({
                      ...operationData,
                      schemaType: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>Select schema type...</option>
                  <option value="Article">Article</option>
                  <option value="Product">Product</option>
                  <option value="Organization">Organization</option>
                  <option value="LocalBusiness">Local Business</option>
                  <option value="FAQ">FAQ</option>
                </select>
              </div>
            )}

            {selectedOperation === "add-internal-link" && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Anchor Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Learn more about..."
                    value={operationData.anchorText || ""}
                    onChange={(e) =>
                      setOperationData({
                        ...operationData,
                        anchorText: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Target URL
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., /high-value-page/"
                    value={operationData.targetUrl || ""}
                    onChange={(e) =>
                      setOperationData({
                        ...operationData,
                        targetUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </>
            )}

            {selectedOperation === "add-header-tag" && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Header Level
                  </label>
                  <select
                    value={operationData.headerLevel || ""}
                    onChange={(e) =>
                      setOperationData({
                        ...operationData,
                        headerLevel: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option>Select level...</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                    <option value="h4">H4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Header Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Key Benefits"
                    value={operationData.text || ""}
                    onChange={(e) =>
                      setOperationData({ ...operationData, text: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </>
            )}

            {selectedOperation === "fix-redirect" && (
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Target URL
                </label>
                <input
                  type="text"
                  placeholder="e.g., /new-page-url/"
                  value={operationData.targetUrl || ""}
                  onChange={(e) =>
                    setOperationData({
                      ...operationData,
                      targetUrl: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Execute Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSelectAllPages}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
        >
          Select All Pages
        </button>
        <button
          onClick={handleExecuteOperation}
          disabled={loading || selectedPages.size === 0 || !selectedOperation}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Execute Operation
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function BulkOperationsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <BulkOperationsContent />
    </Suspense>
  );
}
