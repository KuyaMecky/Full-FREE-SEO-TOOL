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
  Sparkles,
  Shield,
  Users,
  Target,
  Globe,
  CheckCircle,
  KeyRound,
  PenLine,
  Activity,
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

interface UserData { id: string; email: string; name: string | null }
interface Audit { id: string; domain: string; status: string; overallScore: number | null; createdAt: string }
interface PropertyItem {
  id: string;
  siteUrl: string;
  latestSnapshot: {
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    avgPosition: number;
    fetchedAt: string;
    byDate?: Array<{ date: string; impressions: number; clicks: number; ctr: number; position: number }>;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  pending:   { label: "Pending",   dot: "bg-yellow-500" },
  crawling:  { label: "Crawling",  dot: "bg-blue-500 animate-pulse" },
  analyzing: { label: "Analyzing", dot: "bg-purple-500 animate-pulse" },
  complete:  { label: "Complete",  dot: "bg-emerald-500" },
  error:     { label: "Error",     dot: "bg-red-500" },
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

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) { setLoading(false); return; }
      const meData = await meRes.json();
      setUser(meData.user);
      const [auditsRes, propsRes] = await Promise.all([
        fetch("/api/audit"),
        fetch("/api/gsc/properties"),
      ]);
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (propsRes.ok) { const d = await propsRes.json(); setProperties(d.properties ?? []); }
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) return <MarketingHome />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties.length > 0
              ? `Tracking ${properties.length} propert${properties.length === 1 ? "y" : "ies"} · last 28 days`
              : "Connect a property to get started"}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href="/properties/connect">
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Plus className="h-3.5 w-3.5" />
              Add property
            </Button>
          </Link>
          <Link href="/audit/new">
            <Button size="sm" className="gap-2 h-9">
              <Search className="h-3.5 w-3.5" />
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
              if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
              else { setSortKey(k); setSortDir(k === "position" || k === "site" ? "asc" : "desc"); }
            }}
          />
        </>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/quick-wins", icon: Target, label: "Quick Wins", desc: "Page 4–20 keywords", color: "text-emerald-500 bg-emerald-500/10" },
            { href: "/content", icon: PenLine, label: "Content Planner", desc: "Generate articles", color: "text-purple-500 bg-purple-500/10" },
            { href: "/indexing", icon: Search, label: "URL Inspect", desc: "Check indexing", color: "text-blue-500 bg-blue-500/10" },
            { href: "/performance", icon: Activity, label: "Performance", desc: "Core Web Vitals", color: "text-amber-500 bg-amber-500/10" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 p-4 cursor-pointer overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/20 group-hover:to-primary/5 transition-colors" />
                <div className="relative">
                  <div className={`h-9 w-9 rounded-lg ${a.color} flex items-center justify-center mb-3`}>
                    <a.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                  </div>
                  <p className="font-semibold text-sm">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent audits */}
      {audits.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Recent Audits</CardTitle>
              <CardDescription className="text-xs mt-0.5">AI-generated technical SEO reports</CardDescription>
            </div>
            <Link href="/history">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {audits.slice(0, 5).map((a) => {
                const cfg = STATUS_CONFIG[a.status] ?? { label: a.status, dot: "bg-muted" };
                return (
                  <Link key={a.id} href={`/audit/${a.id}`}>
                    <div className="flex items-center justify-between px-6 py-3.5 hover:bg-muted/40 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{a.domain}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString()}
                            {a.overallScore != null && ` · Score ${Math.round(a.overallScore)}/100`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground capitalize">{cfg.label}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PortfolioKpis({ properties }: { properties: PropertyItem[] }) {
  const ws = properties.filter((p) => p.latestSnapshot);
  const totalImpr = ws.reduce((s, p) => s + (p.latestSnapshot?.totalImpressions ?? 0), 0);
  const totalClicks = ws.reduce((s, p) => s + (p.latestSnapshot?.totalClicks ?? 0), 0);
  const avgCtr = totalImpr > 0 ? totalClicks / totalImpr : 0;
  const avgPos = totalImpr > 0
    ? ws.reduce((s, p) => s + (p.latestSnapshot?.avgPosition ?? 0) * (p.latestSnapshot?.totalImpressions ?? 0), 0) / totalImpr
    : 0;

  const items = [
    { label: "Total Impressions", value: totalImpr >= 1000 ? `${(totalImpr / 1000).toFixed(1)}k` : totalImpr.toLocaleString(), icon: Eye, trend: null, color: "text-blue-500 bg-blue-500/10" },
    { label: "Total Clicks", value: totalClicks >= 1000 ? `${(totalClicks / 1000).toFixed(1)}k` : totalClicks.toLocaleString(), icon: MousePointerClick, trend: null, color: "text-emerald-500 bg-emerald-500/10" },
    { label: "Avg. CTR", value: `${(avgCtr * 100).toFixed(2)}%`, icon: Percent, trend: null, color: "text-purple-500 bg-purple-500/10" },
    { label: "Avg. Position", value: avgPos.toFixed(1), icon: TrendingUp, trend: null, color: "text-amber-500 bg-amber-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-border/80 hover:border-border hover:shadow-sm transition-all duration-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tabular-nums tracking-tight">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">Last 28 days</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SitesTable({ properties, sortKey, sortDir, onSort }: {
  properties: PropertyItem[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const sorted = useMemo(() => {
    const copy = [...properties];
    copy.sort((a, b) => {
      const as = a.latestSnapshot, bs = b.latestSnapshot;
      if (sortKey === "site") return sortDir === "asc" ? a.siteUrl.localeCompare(b.siteUrl) : b.siteUrl.localeCompare(a.siteUrl);
      if (!as && !bs) return 0;
      if (!as) return 1;
      if (!bs) return -1;
      const av = sortKey === "impressions" ? as.totalImpressions : sortKey === "clicks" ? as.totalClicks : sortKey === "ctr" ? as.avgCtr : as.avgPosition;
      const bv = sortKey === "impressions" ? bs.totalImpressions : sortKey === "clicks" ? bs.totalClicks : sortKey === "ctr" ? bs.avgCtr : bs.avgPosition;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return copy;
  }, [properties, sortKey, sortDir]);

  const SortHead = ({ label, k, align = "left" }: { label: string; k: SortKey; align?: "left" | "right" }) => {
    const active = sortKey === k;
    return (
      <TableHead className={`cursor-pointer select-none group ${align === "right" ? "text-right" : ""}`} onClick={() => onSort(k)}>
        <span className={`inline-flex items-center gap-1 transition-colors ${active ? "text-foreground font-semibold" : "group-hover:text-foreground"}`}>
          {label}
          {active ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : null}
        </span>
      </TableHead>
    );
  };

  return (
    <Card className="border-border/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Connected Properties
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">Click a row to open its full dashboard</CardDescription>
        </div>
        <Badge variant="secondary" className="text-xs">{properties.length} {properties.length === 1 ? "site" : "sites"}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border/60">
                <SortHead label="Site" k="site" />
                <SortHead label="Impressions" k="impressions" align="right" />
                <SortHead label="Clicks" k="clicks" align="right" />
                <SortHead label="CTR" k="ctr" align="right" />
                <SortHead label="Position" k="position" align="right" />
                <TableHead className="text-right text-xs">Last synced</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((p) => {
                const s = p.latestSnapshot;
                return (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/40 border-border/40 group transition-colors"
                    onClick={() => { window.location.href = `/properties/${p.id}`; }}
                  >
                    <TableCell className="font-medium max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <span className="truncate text-sm">{p.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s ? s.totalImpressions.toLocaleString() : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s ? s.totalClicks.toLocaleString() : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s ? `${(s.avgCtr * 100).toFixed(2)}%` : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{s ? <PositionBadge position={s.avgPosition} /> : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{s ? new Date(s.fetchedAt).toLocaleDateString() : "No data"}</TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors inline" />
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
  const cls = position <= 3 ? "text-emerald-600 dark:text-emerald-400 font-bold"
    : position <= 10 ? "text-emerald-600 dark:text-emerald-400"
    : position <= 20 ? "text-amber-600 dark:text-amber-400"
    : "text-muted-foreground";
  return <span className={cls}>{position.toFixed(1)}</span>;
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-border/60">
      <CardContent className="py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <LineChart className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold mb-2">No properties connected</h3>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
          Connect Google Search Console to see impressions, clicks, keyword rankings, and per-page performance across all your sites.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/properties">
            <Button className="gap-2">
              <LineChart className="h-4 w-4" />
              Connect Search Console
            </Button>
          </Link>
          <Link href="/audit/new">
            <Button variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              Run a quick audit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Marketing landing page ───────────────────────────────────────────────────

const FEATURES = [
  { icon: LineChart, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", title: "Search Analytics", body: "Impressions, clicks, CTR, and position from Google Search Console with trend charts and sortable per-query/per-page tables." },
  { icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", title: "Technical Audits", body: "Crawl up to 500 pages with 9 specialized analyzers covering meta, headings, links, images, schema, security, and performance." },
  { icon: Sparkles, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", title: "AI Content Engine", body: "Full article generation using your GSC ranking signals. Publishes directly to WordPress with Yoast & Rank Math support." },
  { icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", title: "Quick Wins", body: "Portfolio-wide table of queries ranking positions 4–20. Filter by impressions and act on your fastest path to page one." },
  { icon: KeyRound, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", title: "Keyword Research", body: "GSC-powered keyword discovery with striking-distance filters, semantic clustering, and competitor gap analysis built in." },
  { icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "border-indigo-500/20", title: "Team Collaboration", body: "Invite team members, assign properties, create tasks with priorities and due dates, and manage roles across your workspace." },
];

const STATS = [
  { value: "9", label: "Audit analyzers" },
  { value: "4", label: "AI providers" },
  { value: "100%", label: "Free APIs" },
  { value: "∞", label: "Properties" },
];

function MarketingHome() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-900" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-purple-500/15 blur-[100px]" />
          <div className="absolute top-[40%] left-[60%] h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-[80px]" />
        </div>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h1v80H0V0zm80 0v1H0V0h80zm0 79v1H0v-1h80zM1 1h78v78H1V1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 w-full">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur text-xs font-medium text-white/80 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              100% Free · Built on Google APIs · Open Source
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.04] text-white mb-6">
              Enterprise SEO.
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Zero subscription.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl leading-relaxed mb-10">
              A self-hosted SEO platform that replaces Ahrefs, Semrush, and Surfer SEO. Powered entirely by Google's free APIs and the LLM of your choice.
            </p>

            <div className="flex gap-4 flex-wrap mb-14">
              <Link href="/register">
                <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 text-sm">
                  Start for free
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 text-sm backdrop-blur">
                  Sign in
                </button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur-sm">
                  <div className="text-2xl font-extrabold text-white tabular-nums">{s.value}</div>
                  <div className="text-xs text-white/45 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-background py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
              <div className="h-px w-8 bg-primary" />
              Platform Features
              <div className="h-px w-8 bg-primary" />
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">Everything you need. Nothing you don&apos;t.</h2>
            <p className="text-muted-foreground text-lg">Replace your entire SEO tool stack with one open-source platform you control.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`group relative rounded-2xl border ${f.border} bg-card p-6 hover:shadow-lg transition-all duration-300 overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/30 group-hover:to-primary/5 transition-colors duration-300" />
                  <div className="relative">
                    <div className={`h-12 w-12 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social proof / trust */}
      <section className="bg-muted/30 border-y border-border py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: Shield, title: "Your data stays yours", body: "Self-hosted on your infrastructure. No third-party tracking, no data sharing, no vendor lock-in." },
              { icon: Globe, title: "All Google APIs. Free.", body: "Search Console, PageSpeed Insights, URL Inspection, Indexing API — all official, all free, all integrated." },
              { icon: Sparkles, title: "Multi-provider AI", body: "Anthropic Claude, OpenAI, Google Gemini, or OpenRouter. Use whichever fits your budget and use case." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-purple-600 py-24">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">
            Ready to take back your SEO workflow?
          </h2>
          <p className="text-white/75 text-lg mb-10 leading-relaxed">
            Create your free account, connect Google Search Console, and run your first audit in under 5 minutes.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register">
              <button className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-white/95 transition-colors text-sm shadow-xl">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a
              href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors text-sm backdrop-blur"
            >
              View on GitHub
            </a>
          </div>
          <p className="text-white/40 text-xs mt-8">No credit card · No trial · Just the tool.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/80 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">SEO Audit Pro</span>
              <span className="text-white/30 text-xs ml-2">Built by KuyaMecky</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <Link href="/login" className="hover:text-white/70 transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-white/70 transition-colors">Register</Link>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
