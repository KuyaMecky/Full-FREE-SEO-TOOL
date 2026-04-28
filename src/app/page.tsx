"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search, BarChart3, LineChart, ArrowRight, ArrowUp, ArrowDown,
  Plus, Eye, MousePointerClick, Percent, TrendingUp, Globe,
  PenLine, Activity, Target, Zap, KeyRound, Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APIStatusIndicator } from "@/app/components/api-status-indicator";
import { PortfolioTrendChart } from "@/components/properties/portfolio-trend-chart";
import LandingPage from "@/app/landing-page";

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
  pending: "bg-amber-400", crawling: "bg-blue-400 animate-pulse",
  analyzing: "bg-primary animate-pulse", complete: "bg-emerald-500", error: "bg-red-500",
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        <Skeleton className="h-7 w-56" />
        <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        <Skeleton className="h-52 rounded-lg" />
      </div>
    );
  }

  if (!user) return <LandingPage />;

  const hour = new Date().getHours();
  const g = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl">
            Good {g}{user.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {properties.length > 0
              ? `${properties.length} propert${properties.length === 1 ? "y" : "ies"} · last 28 days`
              : "Connect a property to get started"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/properties/connect">
            <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded border border-border hover:bg-muted transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add property
            </button>
          </Link>
          <Link href="/audit/new">
            <button className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Search className="h-3.5 w-3.5" /> New audit
            </button>
          </Link>
        </div>
      </div>

      {/* API Status */}
      <APIStatusIndicator variant="inline" />

      {properties.length === 0 ? <EmptyDash /> : (
        <>
          {/* KPIs */}
          <KpiRow properties={properties} />
          <PortfolioTrendChart properties={properties} />
          <SitesTable properties={properties} sortKey={sortKey} sortDir={sortDir}
            onSort={k => {
              if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
              else { setSortKey(k); setSortDir(k === "position" || k === "site" ? "asc" : "desc"); }
            }} />
        </>
      )}

      {/* Quick actions */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">Quick access</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: "/quick-wins", icon: Target, label: "Quick Wins",     sub: "Pos. 4–20 gaps" },
            { href: "/content",    icon: PenLine, label: "Content AI",    sub: "Generate articles" },
            { href: "/indexing",   icon: Search,  label: "URL Inspect",   sub: "Indexing status" },
            { href: "/performance",icon: Activity, label: "Core Web Vitals",sub: "LCP · CLS · INP" },
          ].map(a => (
            <Link key={a.href} href={a.href}>
              <div className="flex items-start gap-3 p-3.5 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/[0.03] transition-all group cursor-pointer">
                <a.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-0.5 transition-colors shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold leading-none">{a.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{a.sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent audits */}
      {audits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Recent audits</p>
            <Link href="/history" className="text-[12px] text-primary hover:underline">View all</Link>
          </div>
          <div className="rounded-lg border border-border overflow-hidden divide-y divide-border bg-card">
            {audits.slice(0, 5).map(a => (
              <Link key={a.id} href={`/audit/${a.id}`}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? "bg-muted-foreground"}`} />
                    <p className="text-[13px] font-medium truncate">{a.domain}</p>
                    <p className="text-[11px] text-muted-foreground hidden sm:block">
                      {new Date(a.createdAt).toLocaleDateString()}
                      {a.overallScore != null && ` · ${Math.round(a.overallScore)}/100`}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function KpiRow({ properties }: { properties: PropertyItem[] }) {
  const ws = properties.filter(p => p.latestSnapshot);
  const ti = ws.reduce((s, p) => s + (p.latestSnapshot?.totalImpressions ?? 0), 0);
  const tc = ws.reduce((s, p) => s + (p.latestSnapshot?.totalClicks ?? 0), 0);
  const ctr = ti > 0 ? tc / ti : 0;
  const pos = ti > 0 ? ws.reduce((s, p) => s + (p.latestSnapshot?.avgPosition ?? 0) * (p.latestSnapshot?.totalImpressions ?? 0), 0) / ti : 0;
  const fmt = (n: number) => n >= 1_000_000 ? `${(n/1e6).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Impressions", value: fmt(ti),           icon: Eye,              accent: "text-blue-600 dark:text-blue-400" },
        { label: "Clicks",      value: fmt(tc),           icon: MousePointerClick, accent: "text-primary" },
        { label: "Avg. CTR",    value: `${(ctr*100).toFixed(2)}%`, icon: Percent, accent: "text-violet-600 dark:text-violet-400" },
        { label: "Avg. Pos.",   value: pos.toFixed(1),    icon: TrendingUp,       accent: "text-amber-600 dark:text-amber-400" },
      ].map(({ label, value, icon: Icon, accent }) => (
        <div key={label} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <Icon className={`h-3.5 w-3.5 ${accent}`} />
          </div>
          <p className="stat-num text-2xl font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
}

function SitesTable({ properties, sortKey, sortDir, onSort }: {
  properties: PropertyItem[]; sortKey: SortKey; sortDir: SortDir; onSort: (k: SortKey) => void;
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
      <TableHead className={`cursor-pointer select-none ${right ? "text-right" : ""}`} onClick={() => onSort(k)}>
        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </span>
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="font-semibold text-[13px]">Sites</p>
        <span className="text-[11px] text-muted-foreground">{properties.length} connected</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
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
            {sorted.map(p => {
              const s = p.latestSnapshot;
              const domain = p.siteUrl.replace(/^https?:\/\//, "").replace(/^sc-domain:/, "").replace(/\/$/, "");
              const pos = s?.avgPosition ?? 0;
              const pc = pos <= 3 ? "text-emerald-600 dark:text-emerald-400 font-bold" : pos <= 10 ? "text-emerald-600 dark:text-emerald-400" : pos <= 20 ? "text-amber-600 dark:text-amber-400" : "";
              return (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/25 border-border group" onClick={() => { window.location.href = `/properties/${p.id}`; }}>
                  <TableCell className="font-medium py-3">
                    <span className="text-[13px] truncate block max-w-[220px]">{domain}</span>
                  </TableCell>
                  <TableCell className="text-right stat-num text-[13px]">{s ? s.totalImpressions.toLocaleString() : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right stat-num text-[13px]">{s ? s.totalClicks.toLocaleString() : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right stat-num text-[13px]">{s ? `${(s.avgCtr*100).toFixed(2)}%` : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className={`text-right stat-num text-[13px] ${pc}`}>{s ? s.avgPosition.toFixed(1) : <span className="text-muted-foreground/40">—</span>}</TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground">{s ? new Date(s.fetchedAt).toLocaleDateString() : "—"}</TableCell>
                  <TableCell className="pr-3"><ArrowRight className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-primary transition-colors ml-auto" /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EmptyDash() {
  return (
    <div className="rounded-lg border-2 border-dashed border-border py-16 text-center">
      <LineChart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-display font-bold text-lg mb-2">No properties yet</h3>
      <p className="text-[13px] text-muted-foreground mb-6 max-w-xs mx-auto">Connect Google Search Console to start tracking your sites.</p>
      <div className="flex gap-2 justify-center">
        <Link href="/properties">
          <button className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded text-[13px] hover:bg-primary/90 transition-colors">
            <LineChart className="h-3.5 w-3.5" /> Connect GSC
          </button>
        </Link>
        <Link href="/audit/new">
          <button className="flex items-center gap-2 border border-border text-[13px] font-medium px-4 py-2 rounded hover:bg-muted transition-colors">
            <Search className="h-3.5 w-3.5" /> Quick audit
          </button>
        </Link>
      </div>
    </div>
  );
}
