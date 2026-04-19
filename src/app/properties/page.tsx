"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectGoogleButton } from "@/components/properties/connect-google-button";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";
import {
  Plus,
  AlertCircle,
  LineChart as LineChartIcon,
  Eye,
  MousePointerClick,
  Percent,
  TrendingUp,
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
    <Suspense fallback={null}>
      <PropertiesPageInner />
    </Suspense>
  );
}

function PropertiesPageInner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [hasGoogleAccount, setHasGoogleAccount] = useState<boolean | null>(null);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [propsRes, accountRes, configRes] = await Promise.all([
        fetch("/api/gsc/properties"),
        fetch("/api/gsc/sites"),
        fetch("/api/settings/google"),
      ]);
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties);
      }
      setHasGoogleAccount(accountRes.ok);
      if (configRes.ok) {
        const cfg = await configRes.json();
        setGoogleConfigured(Boolean(cfg.configured));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={LineChartIcon}
        title="Properties"
        accent="blue"
        description="Track impressions, clicks, and keyword rankings from Google Search Console."
        actions={
          hasGoogleAccount ? (
            <Link href="/properties/connect">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add property
              </Button>
            </Link>
          ) : null
        }
      />
      <HelpBanner guideKey="properties" guide={GUIDES.properties} />

      {error === "google_not_configured" ? (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
            <span>
              Google OAuth isn&apos;t set up yet. Add your Client ID and Secret in
              Settings to enable the Connect button.
            </span>
            <Link href="/settings/integrations/google">
              <Button size="sm">Set up Google</Button>
            </Link>
          </AlertDescription>
        </Alert>
      ) : error ? (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Google connection error: {error.replace(/_/g, " ")}
          </AlertDescription>
        </Alert>
      ) : null}

      {!hasGoogleAccount ? (
        googleConfigured === false ? (
          <Card>
            <CardHeader>
              <CardTitle>Finish Google setup first</CardTitle>
              <CardDescription>
                The app needs a one-time Google OAuth setup before anyone can
                connect. It takes about 5 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/settings/integrations/google">
                <Button size="lg">Set up Google OAuth</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Connect Google Search Console</CardTitle>
              <CardDescription>
                Authorize access to your Search Console properties to pull impressions,
                clicks, queries, and page-level metrics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectGoogleButton />
            </CardContent>
          </Card>
        )
      ) : properties.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No properties added yet</CardTitle>
            <CardDescription>
              Pick a verified Search Console site to start tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/properties/connect">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add property
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <PortfolioSummary properties={properties} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Link key={p.id} href={`/properties/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base break-all">
                    <LineChartIcon className="h-5 w-5 text-blue-600 shrink-0" />
                    {p.siteUrl}
                  </CardTitle>
                  <CardDescription>
                    {p.latestSnapshot
                      ? `Last refreshed ${new Date(p.latestSnapshot.fetchedAt).toLocaleString()}`
                      : "No snapshot yet — open to refresh"}
                  </CardDescription>
                </CardHeader>
                {p.latestSnapshot && (
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs">Impressions</div>
                        <div className="font-semibold">
                          {p.latestSnapshot.totalImpressions.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Clicks</div>
                        <div className="font-semibold">
                          {p.latestSnapshot.totalClicks.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">CTR</div>
                        <div className="font-semibold">
                          {(p.latestSnapshot.avgCtr * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Avg. Position</div>
                        <div className="font-semibold">
                          {p.latestSnapshot.avgPosition.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
          </div>
        </>
      )}
    </div>
  );
}

function PortfolioSummary({ properties }: { properties: PropertyListItem[] }) {
  const withSnapshot = properties.filter((p) => p.latestSnapshot);
  if (withSnapshot.length === 0) return null;

  const totalImpr = withSnapshot.reduce(
    (s, p) => s + (p.latestSnapshot?.totalImpressions ?? 0),
    0
  );
  const totalClicks = withSnapshot.reduce(
    (s, p) => s + (p.latestSnapshot?.totalClicks ?? 0),
    0
  );
  const avgCtr = totalImpr > 0 ? totalClicks / totalImpr : 0;
  const avgPosition =
    totalImpr > 0
      ? withSnapshot.reduce(
          (s, p) =>
            s +
            (p.latestSnapshot?.avgPosition ?? 0) *
              (p.latestSnapshot?.totalImpressions ?? 0),
          0
        ) / totalImpr
      : 0;

  const items = [
    {
      label: "Total impressions",
      value: totalImpr.toLocaleString(),
      icon: Eye,
    },
    {
      label: "Total clicks",
      value: totalClicks.toLocaleString(),
      icon: MousePointerClick,
    },
    {
      label: "Weighted avg. CTR",
      value: `${(avgCtr * 100).toFixed(2)}%`,
      icon: Percent,
    },
    {
      label: "Weighted avg. position",
      value: avgPosition.toFixed(1),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Portfolio · {withSnapshot.length}{" "}
          {withSnapshot.length === 1 ? "property" : "properties"}
        </h2>
        {withSnapshot.length < properties.length && (
          <div className="text-xs text-muted-foreground">
            {properties.length - withSnapshot.length} without data
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {item.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground/70" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">
                  {item.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
