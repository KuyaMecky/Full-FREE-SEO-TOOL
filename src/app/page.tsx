"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, BarChart3, FileText, Zap, LineChart, ArrowRight,
  ArrowUp, ArrowDown, Plus, Eye, MousePointerClick, Percent,
  TrendingUp, Sparkles, Shield, Users, Target, Globe,
  KeyRound, PenLine, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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

type SortKey = "site" | "impressions" | "clicks" | "ctr" | "position";
type SortDir = "asc" | "desc";

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400",
  crawling: "bg-blue-400 animate-pulse",
  analyzing: "bg-violet-400 animate-pulse",
  complete: "bg-emerald-400",
  error: "bg-red-400",
};

export default function HomePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (!me.ok) return;
        setUser((await me.json()).user);
        const [ar, pr] = await Promise.all([fetch("/api/audit"), fetch("/api/gsc/properties")]);
        if (ar.ok) setAudits(await ar.json());
        if (pr.ok) setProperties((await pr.json()).properties ?? []);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="space-y-2"><Skeleton className="h-7 w-64" /><Skeleton className="h-4 w-40" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (!user) return <MarketingHome />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length > 0
              ? `Monitoring ${properties.length} propert${properties.length === 1 ? "y" : "ies"} · last 28 days`
              : "Connect your first property to start"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/properties/connect">
            <button className="inline-flex items-center gap-1.5 text-[13px] font-medium px-3.5 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Add property
            </button>
          </Link>
          <Link href="/audit/new">
            <button className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
              <Search className="h-3.5 w-3.5" />
              New audit
            </button>
          </Link>
        </div>
      </div>

      {properties.length === 0 ? <EmptyState /> : (
        <>
          <KpiGrid properties={properties} />
          <PortfolioTrendChart properties={properties} />
          <PropertiesTable
            properties={properties}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(k) => {
              if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
              else { setSortKey(k); setSortDir(k === "position" || k === "site" ? "asc" : "desc"); }
            }}
          />
        </>
      )}

      {/* Quick actions */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/quick-wins", icon: Target, label: "Quick Wins", sub: "Page 4–20 gaps", from: "from-emerald-500/15", to: "to-emerald-500/5", icon_cls: "text-emerald-600 dark:text-emerald-400" },
            { href: "/content", icon: PenLine, label: "Content AI", sub: "Generate articles", from: "from-violet-500/15", to: "to-violet-500/5", icon_cls: "text-violet-600 dark:text-violet-400" },
            { href: "/indexing", icon: Search, label: "URL Inspect", sub: "Check indexing", from: "from-blue-500/15", to: "to-blue-500/5", icon_cls: "text-blue-600 dark:text-blue-400" },
            { href: "/performance", icon: Activity, label: "Core Web Vitals", sub: "LCP · CLS · INP", from: "from-amber-500/15", to: "to-amber-500/5", icon_cls: "text-amber-600 dark:text-amber-400" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={`group relative rounded-2xl border border-border bg-gradient-to-br ${a.from} ${a.to} hover:border-primary/30 hover:shadow-md transition-all duration-200 p-5 cursor-pointer overflow-hidden`}>
                <a.icon className={`h-5 w-5 ${a.icon_cls} mb-3 group-hover:scale-110 transition-transform duration-200`} />
                <p className="font-semibold text-[13px]">{a.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent audits */}
      {audits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Recent Audits</p>
            <Link href="/history" className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border/60 bg-card">
            {audits.slice(0, 5).map((a) => (
              <Link key={a.id} href={`/audit/${a.id}`}>
                <div className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? "bg-muted-foreground"}`} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{a.domain}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                        {a.overallScore != null && ` · Score ${Math.round(a.overallScore)}/100`}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KpiGrid({ properties }: { properties: PropertyItem[] }) {
  const ws = properties.filter((p) => p.latestSnapshot);
  const totalImpr = ws.reduce((s, p) => s + (p.latestSnapshot?.totalImpressions ?? 0), 0);
  const totalClicks = ws.reduce((s, p) => s + (p.latestSnapshot?.totalClicks ?? 0), 0);
  const avgCtr = totalImpr > 0 ? totalClicks / totalImpr : 0;
  const avgPos = totalImpr > 0
    ? ws.reduce((s, p) => s + (p.latestSnapshot?.avgPosition ?? 0) * (p.latestSnapshot?.totalImpressions ?? 0), 0) / totalImpr
    : 0;

  const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString();

  const items = [
    { label: "Impressions", value: fmt(totalImpr), icon: Eye, grad: "from-blue-500 to-indigo-500", bg: "bg-blue-500/8 dark:bg-blue-500/10" },
    { label: "Clicks", value: fmt(totalClicks), icon: MousePointerClick, grad: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/8 dark:bg-emerald-500/10" },
    { label: "Avg. CTR", value: `${(avgCtr * 100).toFixed(2)}%`, icon: Percent, grad: "from-violet-500 to-purple-500", bg: "bg-violet-500/8 dark:bg-violet-500/10" },
    { label: "Avg. Position", value: avgPos.toFixed(1), icon: TrendingUp, grad: "from-amber-500 to-orange-500", bg: "bg-amber-500/8 dark:bg-amber-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`relative rounded-2xl border border-border ${item.bg} p-5 overflow-hidden group hover:shadow-md hover:border-border/80 transition-all duration-200`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">{item.label}</p>
              <div className={`h-8 w-8 rounded-xl bg-gradient-to-br ${item.grad} flex items-center justify-center shadow-sm`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight">{item.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1.5">Last 28 days</p>
          </div>
        );
      })}
    </div>
  );
}

function PropertiesTable({ properties, sortKey, sortDir, onSort }: {
  properties: PropertyItem[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const sorted = useMemo(() => {
    const c = [...properties];
    c.sort((a, b) => {
      const as = a.latestSnapshot, bs = b.latestSnapshot;
      if (sortKey === "site") return sortDir === "asc" ? a.siteUrl.localeCompare(b.siteUrl) : b.siteUrl.localeCompare(a.siteUrl);
      if (!as && !bs) return 0; if (!as) return 1; if (!bs) return -1;
      const av = sortKey === "impressions" ? as.totalImpressions : sortKey === "clicks" ? as.totalClicks : sortKey === "ctr" ? as.avgCtr : as.avgPosition;
      const bv = sortKey === "impressions" ? bs.totalImpressions : sortKey === "clicks" ? bs.totalClicks : sortKey === "ctr" ? bs.avgCtr : bs.avgPosition;
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return c;
  }, [properties, sortKey, sortDir]);

  const SH = ({ label, k, right }: { label: string; k: SortKey; right?: boolean }) => {
    const active = sortKey === k;
    return (
      <TableHead className={`cursor-pointer select-none text-[11px] font-semibold uppercase tracking-[0.06em] ${right ? "text-right" : ""}`} onClick={() => onSort(k)}>
        <span className={`inline-flex items-center gap-1 transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </span>
      </TableHead>
    );
  };

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[14px]">Connected Properties</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Click any row to open its full dashboard</p>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{properties.length} sites</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <SH label="Site" k="site" />
              <SH label="Impressions" k="impressions" right />
              <SH label="Clicks" k="clicks" right />
              <SH label="CTR" k="ctr" right />
              <SH label="Position" k="position" right />
              <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">Synced</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => {
              const s = p.latestSnapshot;
              const domain = p.siteUrl.replace(/^https?:\/\//, "").replace(/^sc-domain:/, "").replace(/\/$/, "");
              return (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30 border-border/40 group transition-colors" onClick={() => { window.location.href = `/properties/${p.id}`; }}>
                  <TableCell className="font-medium py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-[13px] truncate max-w-[200px]">{domain}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-[13px]">{s ? s.totalImpressions.toLocaleString() : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right tabular-nums text-[13px]">{s ? s.totalClicks.toLocaleString() : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right tabular-nums text-[13px]">{s ? `${(s.avgCtr * 100).toFixed(2)}%` : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right tabular-nums text-[13px]">{s ? <PosBadge pos={s.avgPosition} /> : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right text-[12px] text-muted-foreground">{s ? new Date(s.fetchedAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="text-right pr-4">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all inline" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PosBadge({ pos }: { pos: number }) {
  const cls = pos <= 3 ? "text-emerald-600 dark:text-emerald-400 font-bold" : pos <= 10 ? "text-emerald-600 dark:text-emerald-400" : pos <= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";
  return <span className={cls}>{pos.toFixed(1)}</span>;
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
        <LineChart className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-xl font-bold mb-2">No properties connected</h3>
      <p className="text-[13px] text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
        Connect Google Search Console to see impressions, clicks, keyword rankings, and per-page performance.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/properties">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-xl text-[13px] hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20">
            <LineChart className="h-4 w-4" /> Connect Search Console
          </button>
        </Link>
        <Link href="/audit/new">
          <button className="inline-flex items-center gap-2 border border-border text-[13px] font-medium px-5 py-2.5 rounded-xl hover:bg-muted transition-colors">
            <Search className="h-4 w-4" /> Run a quick audit
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Landing page ─────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: LineChart, grad: "from-blue-500 to-indigo-500", bg: "bg-blue-500/8 dark:bg-blue-500/12 border-blue-500/15", title: "Search Analytics", body: "Live impressions, clicks, CTR & position from Google Search Console with trend charts and sortable tables." },
  { icon: Zap, grad: "from-amber-500 to-orange-500", bg: "bg-amber-500/8 dark:bg-amber-500/12 border-amber-500/15", title: "Technical Audits", body: "Crawl up to 500 pages with 9 analyzers covering meta, headings, links, schema, security, and Core Web Vitals." },
  { icon: Sparkles, grad: "from-violet-500 to-purple-500", bg: "bg-violet-500/8 dark:bg-violet-500/12 border-violet-500/15", title: "AI Content Engine", body: "Full article generation from GSC ranking signals. Publishes directly to WordPress with Yoast & Rank Math support." },
  { icon: Target, grad: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/8 dark:bg-emerald-500/12 border-emerald-500/15", title: "Quick Wins", body: "Portfolio-wide table of keywords ranking positions 4–20 with real impressions — your fastest path to page one." },
  { icon: KeyRound, grad: "from-rose-500 to-pink-500", bg: "bg-rose-500/8 dark:bg-rose-500/12 border-rose-500/15", title: "Keyword Research", body: "GSC-powered keyword discovery with striking-distance filters, semantic clustering, and competitor gap analysis." },
  { icon: Users, grad: "from-indigo-500 to-cyan-500", bg: "bg-indigo-500/8 dark:bg-indigo-500/12 border-indigo-500/15", title: "Team Collaboration", body: "Invite members, assign properties, create tasks with priorities and due dates. Full role-based access control." },
];

function MarketingHome() {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex items-center isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.55_0.22_264/18%),transparent)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,oklch(0.65_0.20_310/12%),transparent)]" />
        {/* Dot grid */}
        <div className="absolute inset-0 -z-10 opacity-[0.35] dark:opacity-[0.15]"
          style={{ backgroundImage: "radial-gradient(circle, oklch(0.55 0.22 264 / 35%) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 w-full">
          <div className="max-w-4xl mx-auto text-center">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[12px] font-semibold text-primary mb-8 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              100% Free · Open Source · No subscriptions
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.04] mb-6">
              The SEO platform that<br />
              <span className="text-gradient">pays nothing.</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Replace Ahrefs, Semrush, and Surfer SEO with one self-hosted tool. Powered entirely by Google's free APIs and the AI of your choice.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
              <Link href="/register">
                <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-xl text-[15px] hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 duration-200">
                  Start for free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="inline-flex items-center gap-2 border border-border bg-background/80 backdrop-blur font-semibold px-7 py-3.5 rounded-xl text-[15px] hover:bg-muted transition-all duration-200">
                  Sign in
                </button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="inline-flex flex-wrap items-center justify-center gap-px rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
              {[
                { value: "9", label: "Audit analyzers" },
                { value: "4", label: "AI providers" },
                { value: "100%", label: "Free APIs" },
                { value: "∞", label: "Properties" },
              ].map((s, i) => (
                <div key={s.label} className={`px-7 py-4 text-center ${i < 3 ? "border-r border-border" : ""}`}>
                  <p className="text-2xl font-extrabold tabular-nums text-primary">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary mb-3">Platform</p>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">One tool. Zero compromise.</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed">Everything a paid SEO stack gives you — without the subscription.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`group relative rounded-2xl border ${f.bg} p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.grad} flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-[15px] mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-[13px] leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="py-24 border-t border-border/60 bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">Built on principles, not pricing.</h2>
            <p className="text-muted-foreground text-[15px]">No vendor lock-in. No data harvesting. Just software you control.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Your data, your server", body: "Self-hosted. Nothing leaves your infrastructure. No third-party analytics, no data sharing with anyone." },
              { icon: Globe, title: "All Google APIs. Free.", body: "Search Console, PageSpeed Insights, URL Inspection, Indexing API — official, free, fully integrated." },
              { icon: Sparkles, title: "Any AI you choose", body: "Anthropic Claude, OpenAI, Google Gemini, or OpenRouter. Swap providers any time — no lock-in." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="text-center space-y-3">
                <div className="h-13 w-13 h-[52px] w-[52px] rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-[16px]">{title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 overflow-hidden border-t border-border/60 isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,oklch(0.55_0.22_264/12%),transparent)]" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[12px] font-semibold text-primary mb-8">
            <FileText className="h-3.5 w-3.5" />
            No credit card required
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            Ready to own your<br />SEO workflow?
          </h2>
          <p className="text-muted-foreground text-[15px] mb-10 leading-relaxed max-w-lg mx-auto">
            Create an account, connect Search Console, run your first audit. Takes under 5 minutes.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register">
              <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-4 rounded-xl text-[15px] hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 duration-200">
                Get started free <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border bg-background font-semibold px-8 py-4 rounded-xl text-[15px] hover:bg-muted transition-all duration-200">
              <GHIcon className="h-4 w-4" /> View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-muted/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <BarChart3 className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-[14px]">SEO Audit Pro</span>
              <span className="text-muted-foreground text-[12px] ml-2">by KuyaMecky</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <GHIcon className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function GHIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}
