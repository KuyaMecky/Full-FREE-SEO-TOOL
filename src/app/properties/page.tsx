"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectGoogleButton } from "@/components/properties/connect-google-button";
import {
  Plus, AlertCircle, Globe, Eye, MousePointerClick,
  TrendingUp, ArrowRight, CheckCircle, ExternalLink, RotateCcw,
} from "lucide-react";

interface PropertyListItem {
  id: string;
  siteUrl: string;
  permissionLevel: string;
  addedAt: string;
  latestSnapshot: {
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    avgPosition: number;
    fetchedAt: string;
  } | null;
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PropertiesPageInner />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-72" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
      </div>
    </div>
  );
}

function PropertiesPageInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [hasGoogle, setHasGoogle] = useState<boolean | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = async () => {
    try {
      const [pr, ar, cr] = await Promise.all([
        fetch("/api/gsc/properties"),
        fetch("/api/gsc/sites"),
        fetch("/api/settings/google"),
      ]);
      if (pr.ok) setProperties((await pr.json()).properties ?? []);
      setHasGoogle(ar.ok);
      if (cr.ok) setGoogleConfigured(Boolean((await cr.json()).configured));
    } finally { setLoading(false); }
  };

  const handleRefreshAll = async () => {
    if (!properties.length) return;
    setRefreshing(true);
    try {
      await Promise.all(
        properties.map(p =>
          fetch(`/api/gsc/properties/${p.id}/refresh`, { method: "POST" })
        )
      );
      await fetchProperties();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Properties</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Track impressions, clicks, and keyword rankings from Google Search Console.
          </p>
        </div>
        {hasGoogle && (
          <div className="flex items-center gap-2">
            {properties.length > 0 && (
              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            )}
            <Link href="/properties/connect">
              <button className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
                <Plus className="h-3.5 w-3.5" />
                Add property
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-[13px] ${
          error === "google_not_configured"
            ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-400"
            : "bg-destructive/8 border-destructive/20 text-destructive"
        }`}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            {error === "google_not_configured"
              ? "Google OAuth isn't set up yet."
              : `Google connection error: ${error.replace(/_/g, " ")}`}
          </div>
          {error === "google_not_configured" && (
            <Link href="/settings/integrations/google" className="font-semibold hover:underline shrink-0">
              Set up →
            </Link>
          )}
        </div>
      )}

      {/* States */}
      {!hasGoogle ? (
        googleConfigured === false ? <SetupPrompt /> : <ConnectPrompt />
      ) : properties.length === 0 ? (
        <EmptyProperties />
      ) : (
        <>
          <PortfolioStrip properties={properties} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </>
      )}
    </div>
  );
}

function PortfolioStrip({ properties }: { properties: PropertyListItem[] }) {
  const ws = properties.filter(p => p.latestSnapshot);
  if (!ws.length) return null;
  const totalImpr  = ws.reduce((s, p) => s + (p.latestSnapshot?.totalImpressions ?? 0), 0);
  const totalClicks = ws.reduce((s, p) => s + (p.latestSnapshot?.totalClicks ?? 0), 0);
  const avgCtr     = totalImpr > 0 ? totalClicks / totalImpr : 0;
  const avgPos     = totalImpr > 0
    ? ws.reduce((s, p) => s + (p.latestSnapshot?.avgPosition ?? 0) * (p.latestSnapshot?.totalImpressions ?? 0), 0) / totalImpr
    : 0;

  const fmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Impressions", value: fmt(totalImpr),           icon: Eye,              grad: "from-blue-500 to-indigo-500" },
        { label: "Clicks",      value: fmt(totalClicks),          icon: MousePointerClick,grad: "from-emerald-500 to-teal-500" },
        { label: "Avg. CTR",    value: `${(avgCtr*100).toFixed(2)}%`, icon: CheckCircle, grad: "from-violet-500 to-purple-500" },
        { label: "Avg. Pos.",   value: avgPos.toFixed(1),         icon: TrendingUp,       grad: "from-amber-500 to-orange-500" },
      ].map(({ label, value, icon: Icon, grad }) => (
        <div key={label} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm shrink-0`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[19px] font-bold tabular-nums tracking-tight leading-none">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PropertyCard({ property: p }: { property: PropertyListItem }) {
  const domain = p.siteUrl.replace(/^https?:\/\//, "").replace(/^sc-domain:/, "").replace(/\/$/, "");
  const s = p.latestSnapshot;
  const pos = s?.avgPosition ?? 0;
  const posColor = pos <= 3 ? "text-emerald-600 dark:text-emerald-400" : pos <= 10 ? "text-emerald-600 dark:text-emerald-400" : pos <= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";

  return (
    <Link href={`/properties/${p.id}`}>
      <div className="group relative rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 p-5 cursor-pointer overflow-hidden h-full flex flex-col">
        {/* Subtle hover glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

        {/* Site info */}
        <div className="flex items-start gap-3 mb-4 relative">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[13px] truncate leading-none">{domain}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {s ? `Synced ${new Date(s.fetchedAt).toLocaleDateString()}` : "No data yet"}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        {s ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 relative flex-1">
              {[
                { label: "Impressions", value: s.totalImpressions >= 1000 ? `${(s.totalImpressions/1000).toFixed(1)}k` : s.totalImpressions.toLocaleString() },
                { label: "Clicks",      value: s.totalClicks >= 1000 ? `${(s.totalClicks/1000).toFixed(1)}k` : s.totalClicks.toLocaleString() },
                { label: "CTR",         value: `${(s.avgCtr*100).toFixed(2)}%` },
                { label: "Position",    value: s.avgPosition.toFixed(1), valueClass: posColor },
              ].map(({ label, value, valueClass }) => (
                <div key={label}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
                  <p className={`text-[17px] font-bold tabular-nums tracking-tight mt-0.5 ${valueClass ?? ""}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar — CTR visual */}
            <div className="mt-4 pt-3 border-t border-border/60 relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-medium">Click-through rate</span>
                <span className="text-[10px] font-semibold text-foreground">{(s.avgCtr*100).toFixed(2)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500 transition-all duration-700"
                  style={{ width: `${Math.min(s.avgCtr * 100 * 10, 100)}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center py-4 relative">
            <div>
              <p className="text-[12px] text-muted-foreground">No snapshot yet</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Open to refresh data</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function SetupPrompt() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
        <AlertCircle className="h-7 w-7 text-amber-500" />
      </div>
      <h3 className="font-bold text-[16px] mb-2">Finish Google OAuth setup</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
        You need to configure your Google Client ID and Secret before anyone can connect. Takes about 5 minutes.
      </p>
      <Link href="/settings/integrations/google">
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-primary/90 transition-colors">
          Set up Google OAuth
          <ArrowRight className="h-4 w-4" />
        </button>
      </Link>
    </div>
  );
}

function ConnectPrompt() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
        <Globe className="h-7 w-7 text-blue-500" />
      </div>
      <h3 className="font-bold text-[16px] mb-2">Connect Google Search Console</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
        Authorize access to pull impressions, clicks, queries, and page-level metrics from your verified properties.
      </p>
      <div className="flex justify-center">
        <ConnectGoogleButton />
      </div>
    </div>
  );
}

function EmptyProperties() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <Plus className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-bold text-[16px] mb-2">No properties added yet</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
        Pick a verified Search Console site to start tracking impressions, clicks, and keyword rankings.
      </p>
      <Link href="/properties/connect">
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
          <Plus className="h-4 w-4" /> Add property
        </button>
      </Link>
    </div>
  );
}
