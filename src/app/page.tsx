"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  BarChart3,
  FileText,
  Zap,
  LineChart,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Plus,
  Eye,
  MousePointerClick,
  Percent,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PortfolioTrendChart } from "@/components/properties/portfolio-trend-chart";

interface UserData {
  id: string;
  email: string;
  name: string | null;
}

interface Audit {
  id: string;
  domain: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
}

interface PropertyItem {
  id: string;
  siteUrl: string;
  latestSnapshot: {
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    avgPosition: number;
    fetchedAt: string;
    byDate?: Array<{
      date: string;
      impressions: number;
      clicks: number;
      ctr: number;
      position: number;
    }>;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  crawling: "bg-blue-500",
  analyzing: "bg-purple-500",
  complete: "bg-green-500",
  error: "bg-red-500",
};

type SortKey = "site" | "impressions" | "clicks" | "ctr" | "position";
type SortDir = "asc" | "desc";

export default function HomePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        setLoading(false);
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const [auditsRes, propsRes] = await Promise.all([
        fetch("/api/audit"),
        fetch("/api/gsc/properties"),
      ]);
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties ?? []);
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
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return <MarketingHome />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            Overview across all connected Search Console properties.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/properties/connect">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add property
            </Button>
          </Link>
          <Link href="/audit/new">
            <Button className="gap-2">
              <Search className="h-4 w-4" />
              New audit
            </Button>
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <PortfolioKpis properties={properties} />
          <PortfolioTrendChart properties={properties} />
          <SitesTable
            properties={properties}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(k) => {
              if (sortKey === k) {
                setSortDir(sortDir === "asc" ? "desc" : "asc");
              } else {
                setSortKey(k);
                setSortDir(k === "position" || k === "site" ? "asc" : "desc");
              }
            }}
          />
        </>
      )}

      {audits.length > 0 && (
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent audits</CardTitle>
              <CardDescription>
                Technical SEO audits with AI-generated reports.
              </CardDescription>
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {audits.slice(0, 5).map((a) => (
                <Link key={a.id} href={`/audit/${a.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-md hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{a.domain}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(a.createdAt).toLocaleDateString()}
                        {a.overallScore != null &&
                          ` · score ${Math.round(a.overallScore)}/100`}
                      </div>
                    </div>
                    <Badge
                      className={`${statusColors[a.status] || "bg-muted"} text-white shrink-0`}
                    >
                      {a.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PortfolioKpis({ properties }: { properties: PropertyItem[] }) {
  const withSnapshot = properties.filter((p) => p.latestSnapshot);

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
    { label: "Impressions", value: totalImpr.toLocaleString(), icon: Eye },
    {
      label: "Clicks",
      value: totalClicks.toLocaleString(),
      icon: MousePointerClick,
    },
    {
      label: "Avg. CTR",
      value: `${(avgCtr * 100).toFixed(2)}%`,
      icon: Percent,
    },
    {
      label: "Avg. Position",
      value: avgPosition.toFixed(1),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Portfolio · last 28 days · {withSnapshot.length}/
          {properties.length} {properties.length === 1 ? "site" : "sites"}{" "}
          with data
        </h2>
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

function SitesTable({
  properties,
  sortKey,
  sortDir,
  onSort,
}: {
  properties: PropertyItem[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const sorted = useMemo(() => {
    const copy = [...properties];
    copy.sort((a, b) => {
      const as = a.latestSnapshot;
      const bs = b.latestSnapshot;
      if (sortKey === "site") {
        return sortDir === "asc"
          ? a.siteUrl.localeCompare(b.siteUrl)
          : b.siteUrl.localeCompare(a.siteUrl);
      }
      if (!as && !bs) return 0;
      if (!as) return 1;
      if (!bs) return -1;
      const av =
        sortKey === "impressions"
          ? as.totalImpressions
          : sortKey === "clicks"
            ? as.totalClicks
            : sortKey === "ctr"
              ? as.avgCtr
              : as.avgPosition;
      const bv =
        sortKey === "impressions"
          ? bs.totalImpressions
          : sortKey === "clicks"
            ? bs.totalClicks
            : sortKey === "ctr"
              ? bs.avgCtr
              : bs.avgPosition;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [properties, sortKey, sortDir]);

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
      <TableHead
        className={`cursor-pointer select-none ${align === "right" ? "text-right" : ""}`}
        onClick={() => onSort(k)}
      >
        <span
          className={`inline-flex items-center gap-1 ${active ? "text-foreground" : ""}`}
        >
          {label}
          {active &&
            (sortDir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            ))}
        </span>
      </TableHead>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <LineChart className="h-4 w-4 text-muted-foreground" />
            Sites
          </CardTitle>
          <CardDescription>
            How each connected property is ranking. Click a row to open its
            dashboard.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <H label="Site" k="site" />
                <H label="Impressions" k="impressions" align="right" />
                <H label="Clicks" k="clicks" align="right" />
                <H label="CTR" k="ctr" align="right" />
                <H label="Avg. position" k="position" align="right" />
                <TableHead className="text-right">Last refreshed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => {
                const s = p.latestSnapshot;
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => {
                      window.location.href = `/properties/${p.id}`;
                    }}
                  >
                    <TableCell className="max-w-xs truncate font-medium">
                      {p.siteUrl}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s ? s.totalImpressions.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s ? s.totalClicks.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s ? `${(s.avgCtr * 100).toFixed(2)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {s ? <PositionBadge position={s.avgPosition} /> : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">
                      {s
                        ? new Date(s.fetchedAt).toLocaleDateString()
                        : "No data"}
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/70 inline" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PositionBadge({ position }: { position: number }) {
  let color = "text-muted-foreground";
  if (position > 0 && position <= 3) {
    color = "text-emerald-600 dark:text-emerald-400 font-semibold";
  } else if (position <= 10) {
    color = "text-emerald-600 dark:text-emerald-400";
  } else if (position <= 20) {
    color = "text-amber-600 dark:text-amber-400";
  }
  return <span className={color}>{position.toFixed(1)}</span>;
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <LineChart className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">
          No properties connected yet
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          Connect Google Search Console to see impressions, clicks, keyword
          rankings, and per-page performance across all your sites.
        </p>
        <Link href="/properties">
          <Button className="gap-2">
            <LineChart className="h-4 w-4" />
            Connect Google Search Console
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function MarketingHome() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Professional SEO Audit Tool</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Crawl any website, analyze SEO health with AI-powered insights, and
          track real search performance from Google Search Console.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <LineChart className="h-10 w-10 text-blue-600 mb-2" />
            <CardTitle>Search performance</CardTitle>
            <CardDescription>
              Connect Google Search Console to see impressions, clicks, keyword
              rankings, and per-page metrics.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Zap className="h-10 w-10 text-purple-600 mb-2" />
            <CardTitle>Technical audits</CardTitle>
            <CardDescription>
              Rate-limited crawler with specialized analyzers for meta,
              headings, links, images, structured data, security, and more.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
            <CardTitle>AI suggestions</CardTitle>
            <CardDescription>
              Claude, Gemini, or OpenAI-powered title rewrites, content angles,
              and internal link ideas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <FileText className="inline h-4 w-4 mr-1" />
        Export professional PDF reports for every audit
      </div>
    </div>
  );
}
