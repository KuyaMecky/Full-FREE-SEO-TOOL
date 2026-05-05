"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  ArrowUp,
  Zap,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface Property {
  id: string;
  siteUrl: string;
}

interface Keyword {
  query: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr?: number;
  opportunityScore?: number;
  effortLevel?: string;
  estimatedTrafficGain?: number;
}

export default function KeywordOpportunitiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await fetch("/api/gsc/properties");
      if (res.ok) {
        const result = await res.json();
        setProperties(result.properties || []);
        if (result.properties?.length > 0) {
          setSelectedPropertyId(result.properties[0].id);
          await loadOpportunities(result.properties[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOpportunities = async (propertyId: string) => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/intelligence/keyword-opportunities?propertyId=${propertyId}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setError("Failed to load opportunities");
      }
    } catch (err) {
      setError("Error loading data");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    loadOpportunities(propertyId);
  };

  const getPositionColor = (position: number) => {
    if (position <= 3) return "text-emerald-600 font-bold";
    if (position <= 10) return "text-blue-600";
    if (position <= 20) return "text-amber-600";
    return "text-gray-600";
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Target className="h-10 w-10 text-amber-600" />
            Keyword Opportunities
          </h1>
          <p className="text-muted-foreground">
            Identify keywords you can easily rank for based on current visibility.
          </p>
        </div>
        <button
          onClick={() => loadOpportunities(selectedPropertyId)}
          disabled={refreshing || !selectedPropertyId}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Property Selector */}
      {properties.length > 0 ? (
        <div className="bg-card border border-border rounded-lg p-6">
          <label className="block text-sm font-semibold mb-2">Property</label>
          <select
            value={selectedPropertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-border rounded-lg bg-background"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.siteUrl.replace(/^sc-domain:/, "").replace(/\/$/, "")}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
          <p className="text-amber-800 font-semibold">No properties</p>
          <Link href="/properties" className="text-amber-600 hover:underline text-sm">
            Connect a property →
          </Link>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">Total Queries</p>
              <p className="text-2xl font-bold">{data.stats.totalQueries}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">Top 10</p>
              <p className="text-2xl font-bold">{data.stats.top10Count}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">Impressions</p>
              <p className="text-2xl font-bold">
                {(data.stats.totalImpressions / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground uppercase mb-1">Avg Position</p>
              <p className="text-2xl font-bold">{data.stats.avgPosition}</p>
            </div>
          </div>

          {/* Quick Wins */}
          {data.quickWins.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-600" />
                <h2 className="text-xl font-bold">
                  Quick Wins ({data.quickWins.length})
                </h2>
              </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Keyword</th>
                      <th className="text-right px-4 py-3 font-semibold">Position</th>
                      <th className="text-right px-4 py-3 font-semibold">Impressions</th>
                      <th className="text-right px-4 py-3 font-semibold">Clicks</th>
                      <th className="text-right px-4 py-3 font-semibold">Opportunity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.quickWins.map((kw: Keyword, i: number) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      >
                        <td className="px-4 py-3 font-medium">{kw.query}</td>
                        <td className={`text-right px-4 py-3 ${getPositionColor(kw.position)}`}>
                          #{kw.position}
                        </td>
                        <td className="text-right px-4 py-3">
                          {kw.impressions.toLocaleString()}
                        </td>
                        <td className="text-right px-4 py-3">
                          {kw.clicks.toLocaleString()}
                        </td>
                        <td className="text-right px-4 py-3">
                          <span className="inline-block px-2 py-1 rounded bg-emerald-500/10 text-emerald-700 text-xs font-semibold">
                            +{kw.estimatedTrafficGain} clicks
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Queries */}
          {data.topQueries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-bold">Top Queries</h2>
              </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Keyword</th>
                      <th className="text-right px-4 py-3 font-semibold">Position</th>
                      <th className="text-right px-4 py-3 font-semibold">Impressions</th>
                      <th className="text-right px-4 py-3 font-semibold">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topQueries.slice(0, 20).map((kw: Keyword, i: number) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                      >
                        <td className="px-4 py-3 font-medium">{kw.query}</td>
                        <td className={`text-right px-4 py-3 ${getPositionColor(kw.position)}`}>
                          #{kw.position}
                        </td>
                        <td className="text-right px-4 py-3">
                          {kw.impressions.toLocaleString()}
                        </td>
                        <td className="text-right px-4 py-3">
                          {(
                            (kw.clicks / kw.impressions) *
                            100
                          ).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
