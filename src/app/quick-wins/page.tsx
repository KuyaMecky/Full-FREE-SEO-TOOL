"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Target, ArrowUp, ArrowDown, Search, TrendingUp, FileText, X, RefreshCw } from "lucide-react";

interface QuickWin {
  propertyId: string;
  siteUrl: string;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

interface ContentSuggestion {
  type: "ai-generated" | "competitor-based";
  title: string;
  description: string;
  contentType: string;
  estimatedLength: string;
  priority: string;
  reasoning: string;
}

interface ContentPlan {
  keyword: string;
  currentPosition: number;
  suggestions: ContentSuggestion[];
  contentGapAnalysis: {
    isContentGap: boolean;
    reason: string;
  };
}

type SortKey = "query" | "site" | "impressions" | "clicks" | "ctr" | "position" | "opportunity";
type SortDir = "asc" | "desc";

function opportunityScore(w: QuickWin): number {
  return w.impressions * (21 - w.position);
}

function shortSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function ContentSuggestionsModal({
  win,
  onClose,
}: {
  win: QuickWin;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<ContentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(
          `/api/content-suggestions?keyword=${encodeURIComponent(win.query)}&position=${win.position}&searchVolume=0`
        );
        const data = await res.json();
        setPlan(data);
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [win]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 border border-green-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "ai-generated":
        return "bg-blue-100 text-blue-800";
      case "competitor-based":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = async () => {
    if (!plan) return;
    setExporting(true);
    try {
      const res = await fetch("/api/content-planner/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: win.propertyId,
          keyword: win.query,
          suggestions: plan.suggestions,
        }),
      });
      if (res.ok) {
        alert("Exported to content planner!");
        onClose();
      } else {
        alert("Failed to export");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Error exporting");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Ideas for "{win.query}"</h2>
            <p className="text-gray-600 text-sm mt-1">
              Currently ranking #{win.position} with {win.impressions.toLocaleString()} impressions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="space-y-3">
              <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : plan ? (
            <>
              {/* Content Gap Analysis */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  plan.contentGapAnalysis.isContentGap
                    ? "bg-blue-50 border-blue-300"
                    : "bg-green-50 border-green-300"
                }`}
              >
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm mb-1">
                      {plan.contentGapAnalysis.isContentGap
                        ? "✅ Content Opportunity Detected"
                        : "✓ Already Well Optimized"}
                    </p>
                    <p className="text-sm opacity-90">
                      {plan.contentGapAnalysis.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested Content */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Suggested Content To Create:</h3>
                {plan.suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg hover:border-blue-400 transition"
                  >
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getTypeColor(suggestion.type)}`}>
                        {suggestion.type === "ai-generated" ? "🤖 AI Idea" : "🔍 Competitor Gap"}
                      </span>
                      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${getPriorityColor(suggestion.priority)}`}>
                        {suggestion.priority.toUpperCase()}
                      </span>
                      <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                        {suggestion.contentType}
                      </span>
                      <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                        {suggestion.estimatedLength === "short"
                          ? "500-1500 words"
                          : suggestion.estimatedLength === "medium"
                          ? "1500-3000 words"
                          : "3000+ words"}
                      </span>
                    </div>

                    <h4 className="font-semibold text-base text-gray-900 mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {suggestion.description}
                    </p>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      💡 {suggestion.reasoning}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action CTA */}
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-gray-900 mb-3">
                  Ready to create content? Export these ideas to your content planner.
                </p>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exporting ? "Exporting..." : "Export to Content Planner"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">Failed to load suggestions</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuickWinsPage() {
  const [wins, setWins] = useState<QuickWin[]>([]);
  const [totalProps, setTotalProps] = useState(0);
  const [propsWithData, setPropsWithData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("opportunity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedWin, setSelectedWin] = useState<QuickWin | null>(null);

  const fetchWins = async () => {
    try {
      const res = await fetch("/api/tools/quick-wins");
      if (res.ok) {
        const data = await res.json();
        setWins(data.wins);
        setTotalProps(data.totalProperties);
        setPropsWithData(data.propertiesWithData);
      }
    } catch (error) {
      console.error("Failed to fetch quick wins:", error);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await fetchWins();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchWins();
    } finally {
      setRefreshing(false);
    }
  };

  const sorted = useMemo(() => {
    const filtered = filter
      ? wins.filter(
          (w) =>
            w.query.toLowerCase().includes(filter.toLowerCase()) ||
            w.siteUrl.toLowerCase().includes(filter.toLowerCase())
        )
      : wins;
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "query") {
        av = a.query;
        bv = b.query;
      } else if (sortKey === "site") {
        av = a.siteUrl;
        bv = b.siteUrl;
      } else if (sortKey === "opportunity") {
        av = opportunityScore(a);
        bv = opportunityScore(b);
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return copy;
  }, [wins, filter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir(k === "position" || k === "query" || k === "site" ? "asc" : "desc");
    }
  };

  const H = ({
    label,
    k,
    align = "left",
  }: {
    label: string;
    k: SortKey;
    align?: "left" | "right";
  }) => {
    const active = sortKey === k;
    return (
      <th
        className={`cursor-pointer select-none px-4 py-3 text-sm font-semibold ${
          align === "right" ? "text-right" : ""
        } ${active ? "text-gray-900" : "text-gray-600"}`}
        onClick={() => toggleSort(k)}
      >
        <span className={`inline-flex items-center gap-1`}>
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </span>
      </th>
    );
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3 mb-2 text-gray-900">
              <Target className="h-10 w-10 text-emerald-600" />
              Quick Wins
            </h1>
            <p className="text-gray-600">
              Queries ranking positions 4-20 with real impressions. Fastest opportunities to reach page 1. Click any query to see content ideas.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Refresh quick wins"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : wins.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Target className="h-10 w-10 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-gray-900">No quick wins yet</h3>
            <p className="text-sm text-gray-600 mb-2 max-w-md mx-auto">
              {propsWithData === 0
                ? "Connect a property and click Refresh to fetch GSC data."
                : "No queries found in positions 4-20 with 50+ impressions. Add more properties or refresh existing ones."}
            </p>
            <p className="text-xs text-gray-500">
              {propsWithData}/{totalProps} properties have snapshots.
            </p>
            <div className="mt-4">
              <Link
                href="/properties"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Go to Properties
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search queries or sites..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {sorted.length} result{sorted.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <H label="Query" k="query" />
                    <H label="Site" k="site" />
                    <H label="Position" k="position" align="right" />
                    <H label="Impressions" k="impressions" align="right" />
                    <H label="Clicks" k="clicks" align="right" />
                    <H label="CTR" k="ctr" align="right" />
                    <H label="Opportunity" k="opportunity" align="right" />
                    <th className="text-right px-4 py-3 text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((win, idx) => (
                    <tr
                      key={`${win.propertyId}-${win.query}`}
                      className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{win.query}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {shortSiteUrl(win.siteUrl)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                            win.position <= 10
                              ? "bg-green-100 text-green-800"
                              : win.position <= 15
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          #{win.position}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {win.impressions.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {win.clicks.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {(win.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-blue-600">
                          {Math.round(opportunityScore(win))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedWin(win)}
                          className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          Ideas
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Content Suggestions Modal */}
      {selectedWin && (
        <ContentSuggestionsModal
          win={selectedWin}
          onClose={() => setSelectedWin(null)}
        />
      )}
    </>
  );
}
