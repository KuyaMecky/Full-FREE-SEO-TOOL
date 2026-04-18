"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { KpiCards } from "@/components/properties/kpi-cards";
import { TrendChart } from "@/components/properties/trend-chart";
import {
  MetricsTable,
  MetricRow,
} from "@/components/properties/metrics-table";
import { SuggestionsList } from "@/components/properties/suggestions-list";
import { RefreshCw, AlertCircle, Sparkles, ChevronLeft } from "lucide-react";
import {
  DateRow,
  QueryRow,
  PageRow,
} from "@/lib/gsc/types";
import { SuggestionsOutput } from "@/lib/ai/suggestions";

interface Snapshot {
  id: string;
  rangeStart: string;
  rangeEnd: string;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
  byDate: DateRow[];
  byQuery: QueryRow[];
  byPage: PageRow[];
  suggestions: SuggestionsOutput | null;
  fetchedAt: string;
}

interface Property {
  id: string;
  siteUrl: string;
  permissionLevel: string;
  addedAt: string;
}

export default function PropertyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const autofetchTriggered = useRef(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (
      !loading &&
      property &&
      !snapshot &&
      searchParams.get("autofetch") === "1" &&
      !autofetchTriggered.current
    ) {
      autofetchTriggered.current = true;
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, property, snapshot, searchParams]);

  const load = async () => {
    try {
      const res = await fetch(`/api/gsc/properties/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProperty(data.property);
        setSnapshot(data.snapshot);
      } else {
        setError("Failed to load property");
      }
    } catch (err) {
      setError("Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch(`/api/gsc/properties/${id}/refresh`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Refresh failed");
      }
      await load();
    } catch (err) {
      setError("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/gsc/properties/${id}/suggestions`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to generate suggestions");
      }
      await load();
    } catch (err) {
      setError("Failed to generate suggestions");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Property not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const queryRows: MetricRow[] = (snapshot?.byQuery ?? []).map((q) => ({
    key: q.query,
    impressions: q.impressions,
    clicks: q.clicks,
    ctr: q.ctr,
    position: q.position,
  }));

  const pageRows: MetricRow[] = (snapshot?.byPage ?? []).map((p) => ({
    key: p.page,
    impressions: p.impressions,
    clicks: p.clicks,
    ctr: p.ctr,
    position: p.position,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2"
        >
          <ChevronLeft className="h-4 w-4" />
          All properties
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold break-all">{property.siteUrl}</h1>
            {snapshot && (
              <p className="text-sm text-gray-600 mt-1">
                Data: {snapshot.rangeStart} to {snapshot.rangeEnd} · refreshed{" "}
                {new Date(snapshot.fetchedAt).toLocaleString()}
              </p>
            )}
          </div>
          <Button onClick={refresh} disabled={refreshing} className="gap-2">
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : snapshot ? "Refresh" : "Fetch data"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!snapshot ? (
        <div className="rounded-md border border-dashed p-12 text-center">
          <p className="text-gray-600 mb-4">
            No data yet. Click <span className="font-medium">Fetch data</span> to pull
            the last 28 days from Search Console.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="queries">
              Queries ({snapshot.byQuery.length})
            </TabsTrigger>
            <TabsTrigger value="pages">
              Pages ({snapshot.byPage.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <KpiCards
              kpis={{
                totalImpressions: snapshot.totalImpressions,
                totalClicks: snapshot.totalClicks,
                avgCtr: snapshot.avgCtr,
                avgPosition: snapshot.avgPosition,
              }}
            />
            <TrendChart byDate={snapshot.byDate} />
          </TabsContent>

          <TabsContent value="queries" className="mt-6">
            <MetricsTable keyLabel="Query" rows={queryRows} />
          </TabsContent>

          <TabsContent value="pages" className="mt-6">
            <MetricsTable keyLabel="Page" rows={pageRows} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            {snapshot.suggestions ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateSuggestions}
                    disabled={generating}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    {generating ? "Regenerating…" : "Regenerate"}
                  </Button>
                </div>
                <SuggestionsList data={snapshot.suggestions} />
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-12 text-center">
                <p className="text-gray-600 mb-4">
                  Generate AI suggestions based on your rank and CTR opportunities.
                </p>
                <Button
                  onClick={generateSuggestions}
                  disabled={generating}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {generating ? "Generating…" : "Generate suggestions"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
