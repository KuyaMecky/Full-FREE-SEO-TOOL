"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LineChart, ArrowRight, Sparkles, Gauge, Globe, Settings as SettingsIcon,
  CheckCircle, Circle, ExternalLink, Cpu, Shield, Zap, User, Bell,
} from "lucide-react";

interface IntegrationStatus {
  google: boolean;
  ai: boolean;
  pagespeed: boolean;
  wordpress: boolean;
}

const INTEGRATIONS = [
  {
    key: "google" as const,
    href: "/settings/integrations/google",
    icon: LineChart,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    label: "Google Search Console",
    description: "OAuth access to impressions, clicks, rankings, and URL inspection across all your verified properties.",
    tag: "Required",
    tagClass: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20",
  },
  {
    key: "ai" as const,
    href: "/settings/integrations/ai",
    icon: Sparkles,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    label: "AI Provider",
    description: "Anthropic Claude, OpenAI GPT, Google Gemini, or OpenRouter. Powers content generation, audit reports, and suggestions.",
    tag: "Required",
    tagClass: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20",
  },
  {
    key: "wordpress" as const,
    href: "/settings/integrations/wordpress",
    icon: Globe,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600 dark:text-sky-400",
    label: "WordPress",
    description: "Publish AI-generated articles directly to WordPress as drafts or live posts. Compatible with Yoast SEO and Rank Math.",
    tag: "Publishing",
    tagClass: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20",
  },
  {
    key: "pagespeed" as const,
    href: "/settings/integrations/pagespeed",
    icon: Gauge,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    label: "PageSpeed Insights",
    description: "Add a free API key for 25,000 Core Web Vitals queries per day — LCP, CLS, INP, FCP, TTFB and full Lighthouse scores.",
    tag: "Optional",
    tagClass: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20",
  },
];

const QUICK_LINKS = [
  { href: "/team",             icon: Shield, label: "Team & Access",    sub: "Members, roles, property assignments" },
  { href: "/history",          icon: Zap,    label: "Audit History",    sub: "All technical SEO audit reports" },
  { href: "/content/drafts",   icon: Cpu,    label: "Content Drafts",   sub: "AI-generated articles and publishing queue" },
  { href: "/settings/account", icon: User,   label: "Account Settings", sub: "Personal API keys and email alerts" },
  { href: "/content/calendar", icon: Bell,   label: "Content Calendar", sub: "Kanban board for your content pipeline" },
];

export default function SettingsPage() {
  const [status, setStatus] = useState<IntegrationStatus>({ google: false, ai: false, pagespeed: false, wordpress: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/google").then(r => r.ok ? r.json() : null),
      fetch("/api/settings/ai").then(r => r.ok ? r.json() : null),
      fetch("/api/wordpress/connections").then(r => r.ok ? r.json() : null),
      fetch("/api/gsc/sites").then(r => ({ ok: r.ok })),
    ]).then(([google, ai, wp, gsc]) => {
      setStatus({
        google: Boolean(google?.configured) || gsc.ok,
        ai: Boolean(ai?.configured),
        pagespeed: Boolean(google?.pagespeedConfigured),
        wordpress: Array.isArray(wp?.connections) && wp.connections.length > 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const connectedCount = Object.values(status).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Settings</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Configure integrations, API keys, and workspace preferences.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground bg-muted/60 border border-border rounded-xl px-3.5 py-2 shrink-0">
          <span className={`h-2 w-2 rounded-full ${connectedCount >= 2 ? "bg-emerald-500" : "bg-amber-400"}`} />
          {loading ? "Checking…" : `${connectedCount} of ${INTEGRATIONS.length} connected`}
        </div>
      </div>

      {/* Integrations */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Integrations</p>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2">
          {INTEGRATIONS.map((intg) => {
            const Icon = intg.icon;
            const connected = !loading && status[intg.key];
            return (
              <Link key={intg.key} href={intg.href}>
                <div className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-sm transition-all duration-200 cursor-pointer">
                  {/* Icon */}
                  <div className={`h-10 w-10 rounded-xl ${intg.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${intg.iconColor}`} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[13px]">{intg.label}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${intg.tagClass}`}>
                        {intg.tag}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-1">
                      {intg.description}
                    </p>
                  </div>

                  {/* Status + arrow */}
                  <div className="flex items-center gap-3 shrink-0">
                    {loading ? (
                      <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                    ) : connected ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        Connected
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <Circle className="h-4 w-4" />
                        Not set up
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Quick links */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Workspace</p>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {QUICK_LINKS.map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}>
              <div className="group flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 cursor-pointer">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[13px] truncate">{label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="rounded-2xl border border-border bg-muted/30 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-[14px]">SEO Audit Pro</p>
            <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed max-w-lg">
              A self-hosted, open-source SEO platform built on Google's free APIs. Technical audits, GSC analytics, AI content generation, and team collaboration — all in one tool.
            </p>
            <p className="text-[11px] text-muted-foreground mt-3">
              Built by{" "}
              <a href="https://github.com/KuyaMecky" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">
                KuyaMecky
              </a>
            </p>
          </div>
          <a
            href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 border border-border rounded-lg px-3 py-2 hover:bg-muted"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
