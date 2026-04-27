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

  if (!user) return <Landing />;

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

/* ─── Landing page ─────────────────────────────────────────────────────── */

function Landing() {
  return (
    <div>
      {/* Hero — full bleed dark, left-aligned, editorial */}
      <section className="bg-[oklch(0.09_0.008_264)] text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary mb-6">
              Open source · Self-hosted · Free forever
            </p>
            <h1 className="font-display font-bold text-5xl sm:text-6xl leading-[1.04] tracking-tight mb-6">
              The SEO platform<br />
              <span className="text-gradient">you actually own.</span>
            </h1>
            <p className="text-white/55 text-[16px] leading-relaxed mb-10 max-w-xl">
              Replace Ahrefs, Semrush, and Surfer with one self-hosted tool.
              Real Google Search Console data, AI content generation, technical audits —
              built on free APIs, zero subscription cost.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/register">
                <button className="font-display font-semibold bg-primary text-primary-foreground px-6 py-3 rounded text-[14px] hover:bg-primary/90 transition-colors flex items-center gap-2">
                  Get started free <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="font-medium text-white/60 hover:text-white text-[14px] px-4 py-3 transition-colors">
                  Sign in →
                </button>
              </Link>
            </div>
          </div>

          {/* Data preview — right side, visible on lg */}
          <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-[380px]">
            <DataPreview />
          </div>
        </div>

        {/* Bottom stat strip */}
        <div className="border-t border-white/8">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-px">
            {[
              { n: "9",    label: "Audit analyzers" },
              { n: "4",    label: "AI providers" },
              { n: "100%", label: "Free APIs" },
              { n: "∞",    label: "Properties" },
            ].map(s => (
              <div key={s.label} className="py-2 sm:py-0 sm:px-6 first:pl-0">
                <p className="font-display font-bold text-2xl text-white stat-num">{s.n}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — editorial two-column list */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="grid lg:grid-cols-[280px_1fr] gap-16">
          <div>
            <h2 className="font-display font-bold text-3xl leading-tight mb-4">
              Every tool a serious SEO needs.
            </h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Built for practitioners who want data, not dashboards. No fluff, no upsells.
            </p>
            <Link href="/register">
              <button className="mt-8 font-semibold text-[13px] text-primary hover:underline flex items-center gap-1">
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {[
              { icon: LineChart, label: "GSC Analytics",    body: "Live impressions, clicks, CTR, and position from Google Search Console. Per-query and per-page tables." },
              { icon: Zap,       label: "Technical Audits", body: "Crawl up to 500 pages. 9 analyzers: meta, headings, links, images, schema, security, robots, sitemaps, performance." },
              { icon: BarChart3, label: "AI Content Engine",body: "Full article generation using your GSC signals. Publishes to WordPress with Yoast and Rank Math support." },
              { icon: Target,    label: "Quick Wins",       body: "Queries ranking positions 4–20 with real impressions. Your fastest path from page two to page one." },
              { icon: KeyRound,  label: "Keyword Research", body: "GSC-powered discovery with striking-distance filters, semantic clustering, and competitor gap analysis." },
              { icon: Users,     label: "Team & Tasks",     body: "Invite members, assign properties, create prioritized tasks with due dates. Full role-based access control." },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-display font-semibold text-[14px]">{f.label}</p>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Divider strip */}
      <div className="border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid sm:grid-cols-3 gap-8">
          {[
            { label: "Your data, your server",   body: "Self-hosted. Nothing leaves your infrastructure." },
            { label: "All Google APIs. Free.",   body: "Search Console, PageSpeed, URL Inspection, Indexing API." },
            { label: "Any AI you choose",        body: "Claude, GPT-4, Gemini, or OpenRouter. Swap any time." },
          ].map(({ label, body }) => (
            <div key={label}>
              <p className="font-display font-semibold text-[14px] mb-1.5">{label}</p>
              <p className="text-[13px] text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div>
            <h2 className="font-display font-bold text-3xl mb-2">Ready to get started?</h2>
            <p className="text-[14px] text-muted-foreground">Free account. No credit card. Up in 5 minutes.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/register">
              <button className="font-display font-semibold bg-primary text-primary-foreground px-6 py-3 rounded text-[14px] hover:bg-primary/90 transition-colors">
                Create account
              </button>
            </Link>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer"
              className="font-medium text-[14px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 border border-border px-4 py-3 rounded hover:bg-muted">
              <GH className="h-4 w-4" /> GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-[13px]">SEO Audit Pro</span>
            <span className="text-muted-foreground text-[12px] ml-1">by KuyaMecky</span>
          </div>
          <div className="flex items-center gap-5 text-[12px] text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* Mini data preview widget — hand-crafted, not a template */
function DataPreview() {
  const rows = [
    { query: "seo audit tool",       pos: "4.2",  impr: "8.4k", ctr: "12.1%" },
    { query: "free seo checker",     pos: "6.8",  impr: "5.1k", ctr: "8.4%"  },
    { query: "google search console",pos: "11.3", impr: "3.7k", ctr: "5.2%"  },
    { query: "technical seo audit",  pos: "3.1",  impr: "2.9k", ctr: "18.3%" },
    { query: "keyword ranking tool",  pos: "8.6",  impr: "2.1k", ctr: "7.6%"  },
  ];
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.1em]">Quick Wins · Pos 4–20</p>
        <span className="text-[10px] text-white/30">28 days</span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/8">
            {["Query","Pos.","Impr.","CTR"].map(h => (
              <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              <td className="px-4 py-2.5 text-[12px] text-white/70 truncate max-w-[140px]">{r.query}</td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-primary">{r.pos}</td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-white/50">{r.impr}</td>
              <td className="px-4 py-2.5 text-[12px] font-mono text-white/50">{r.ctr}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2.5 bg-primary/10 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[11px] text-primary/80">5 quick wins identified</span>
      </div>
    </div>
  );
}

function GH({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}
