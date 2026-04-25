"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, LineChart, Search, History, Settings,
  LogOut, BarChart3, Menu, X, Zap, KeyRound, Users, Target,
  FileCode, Gauge, FileSearch, Link2, PenLine, FileText,
  Bell, Sparkles, TrendingUp, ArrowLeftRight, ShieldCheck, Layers,
  Activity, Link2 as LinkIcon, MonitorCheck, Eye, LayoutGrid, User,
  BarChart2, AlertTriangle, AlertCircle, Languages, Bell as BellIcon, BookOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface UserData { id: string; email: string; name: string | null }

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
}

const NAV: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [
      { href: "/",           label: "Dashboard",   icon: LayoutDashboard, exact: true },
      { href: "/properties", label: "Properties",  icon: LineChart },
      { href: "/quick-wins", label: "Quick Wins",  icon: Target },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/performance",    label: "Performance",    icon: Gauge },
      { href: "/keywords",       label: "Keywords",       icon: KeyRound },
      { href: "/competitors",    label: "Competitors",    icon: Users },
      { href: "/onpage",         label: "On-page",        icon: Zap },
      { href: "/indexing",       label: "URL Inspection", icon: Search },
      { href: "/schema-check",   label: "Schema Check",   icon: FileSearch },
      { href: "/schema",           label: "Schema Gen",       icon: FileCode },
      { href: "/backlinks",        label: "Backlinks",        icon: Link2 },
      { href: "/rank-tracker",     label: "Rank Tracker",     icon: TrendingUp },
      { href: "/cwv-history",      label: "CWV History",      icon: Activity },
      { href: "/redirect-chain",   label: "Redirect Chain",   icon: ArrowLeftRight },
      { href: "/robots-validator", label: "Robots & Sitemap", icon: ShieldCheck },
      { href: "/bulk-inspect",     label: "Bulk Inspect",     icon: Layers },
      { href: "/internal-links",   label: "Internal Links",   icon: LinkIcon },
      { href: "/page-monitor",     label: "Page Monitor",     icon: MonitorCheck },
      { href: "/serp-preview",     label: "SERP Preview",     icon: Eye },
      { href: "/cannibalization",  label: "Cannibalization",  icon: AlertTriangle },
      { href: "/broken-links",     label: "Broken Links",     icon: AlertCircle },
      { href: "/hreflang",         label: "Hreflang",         icon: Languages },
      { href: "/analytics",        label: "GA4 Analytics",    icon: BarChart2 },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/content",          label: "Content Planner",  icon: PenLine },
      { href: "/content/drafts",   label: "Drafts",           icon: FileText },
      { href: "/content/calendar", label: "Calendar",         icon: LayoutGrid },
    ],
  },
  {
    label: "Audits",
    items: [
      { href: "/audit/new", label: "New Audit", icon: Sparkles },
      { href: "/history",   label: "History",   icon: History },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/team",              label: "Team",            icon: Users },
      { href: "/alerts",            label: "Alert Rules",     icon: BellIcon },
      { href: "/settings",          label: "Settings",        icon: Settings },
      { href: "/settings/account",  label: "My Account",      icon: User },
    ],
  },
];

const AUTH_PAGES = new Set(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [userLoading, setUserLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUser(d.user))
      .finally(() => setUserLoading(false));
  }, []);

  React.useEffect(() => { setOpen(false); }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (AUTH_PAGES.has(pathname)) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicHeader />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-[220px] flex flex-col",
        "bg-sidebar border-r border-sidebar-border",
        "transition-transform duration-200 ease-out lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-sidebar-border shrink-0">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
            <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-[13px] text-sidebar-foreground leading-none">SEO Audit Pro</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-none space-y-4">
          {NAV.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/35 select-none">
                  {section.label}
                </p>
              )}
              <ul className="space-y-px">
                {section.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-[13px] transition-colors duration-100 relative",
                          active
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                        )}
                      >
                        {/* Left accent bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary" />
                        )}
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-sidebar-foreground/45")} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary leading-none">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        {user && (
          <div className="p-2 border-t border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
              <Ava name={user.name} email={user.email} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-none">{user.name || "User"}</p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate mt-0.5">{user.email}</p>
              </div>
              <button onClick={logout} className="p-1.5 rounded hover:bg-sidebar-accent transition-colors shrink-0" title="Sign out">
                <LogOut className="h-3.5 w-3.5 text-sidebar-foreground/40 hover:text-sidebar-foreground" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col lg:pl-[220px] min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-background sticky top-0 z-20 shrink-0">
          <div className="h-full px-4 lg:px-5 flex items-center gap-3">
            <button onClick={() => setOpen(o => !o)} className="lg:hidden h-8 w-8 rounded flex items-center justify-center hover:bg-muted transition-colors">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <p className="flex-1 text-[13px] font-semibold truncate">{getTitle(pathname)}</p>
            <div className="flex items-center gap-1">
              <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer"
                className="h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="GitHub">
                <GH className="h-4 w-4" />
              </a>
              <NotificationBell />
              <span className="w-px h-4 bg-border mx-1" />
              <ThemeToggle />
              {user && (
                <div className="ml-2 pl-2 border-l border-border flex items-center gap-2">
                  <Ava name={user.name} email={user.email} size={26} />
                  <span className="hidden sm:block text-[12px] font-medium truncate max-w-[120px]">{user.name || user.email}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>

        <footer className="border-t border-border px-5 py-2.5 flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
          <span>
            Built by <a href="https://github.com/KuyaMecky" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">KuyaMecky</a>
          </span>
          <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
            <GH className="h-3 w-3" /> Open source
          </a>
        </footer>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [unread, setUnread] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Array<{ id: string; title: string; body: string; read: boolean; createdAt: string; link?: string }>>([]);

  React.useEffect(() => {
    fetch("/api/notifications")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setUnread(d.unreadCount ?? 0); setNotifications(d.notifications ?? []); } })
      .catch(() => {});
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative h-8 w-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="font-semibold text-[13px]">Notifications</p>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <p className="text-[12px] text-muted-foreground text-center py-6">No notifications</p>
              ) : notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 ${n.read ? "" : "bg-primary/5"}`}>
                  <p className={`text-[12px] font-medium ${n.read ? "text-muted-foreground" : "text-foreground"}`}>{n.title}</p>
                  {n.body && <p className="text-[11px] text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-background">
      <div className="max-w-6xl mx-auto px-5 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
            <BarChart3 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-[14px]">SEO Audit Pro</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link href="/login" className="text-[13px] font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded hover:bg-muted transition-colors">Sign in</Link>
          <Link href="/register" className="text-[13px] font-semibold bg-primary text-primary-foreground px-3.5 py-1.5 rounded hover:bg-primary/90 transition-colors">Get started</Link>
        </div>
      </div>
    </header>
  );
}

function Ava({ name, email, size = 28 }: { name: string | null; email: string; size?: number }) {
  const c = (name || email).charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size }}
      className="rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0 text-[11px] ring-1 ring-primary/20">
      {c}
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

function getTitle(p: string): string {
  if (p === "/") return "Dashboard";
  if (p === "/properties") return "Properties";
  if (p.startsWith("/properties/connect")) return "Properties · Connect";
  if (p.startsWith("/properties/")) return "Properties · Detail";
  if (p === "/performance") return "Performance";
  if (p === "/keywords") return "Keywords";
  if (p === "/competitors") return "Competitors";
  if (p === "/quick-wins") return "Quick Wins";
  if (p === "/onpage") return "On-page Analyzer";
  if (p === "/schema") return "Schema Generator";
  if (p === "/schema-check") return "Schema Checker";
  if (p === "/indexing") return "URL Inspection";
  if (p === "/backlinks") return "Backlinks";
  if (p === "/content") return "Content Planner";
  if (p === "/content/drafts") return "Content · Drafts";
  if (p.startsWith("/content/drafts/")) return "Draft Editor";
  if (p === "/audit/new") return "New Audit";
  if (p.startsWith("/audit/")) return "Audit Report";
  if (p === "/history") return "Audit History";
  if (p === "/rank-tracker")       return "Rank Tracker";
  if (p === "/cwv-history")        return "Core Web Vitals History";
  if (p === "/redirect-chain")     return "Redirect Chain Auditor";
  if (p === "/robots-validator")   return "Robots & Sitemap Validator";
  if (p === "/bulk-inspect")       return "Bulk URL Inspector";
  if (p === "/internal-links")     return "Internal Linking Map";
  if (p === "/page-monitor")       return "Page Change Monitor";
  if (p === "/serp-preview")       return "SERP Snippet Preview";
  if (p === "/content/calendar")   return "Content Calendar";
  if (p === "/settings/account")   return "Account Settings";
  if (p === "/cannibalization")    return "Keyword Cannibalization";
  if (p === "/broken-links")       return "Broken Link Checker";
  if (p === "/hreflang")           return "Hreflang Validator";
  if (p === "/analytics")          return "Google Analytics 4";
  if (p === "/alerts")             return "Alert Rules";
  if (p === "/team") return "Team";
  if (p === "/settings") return "Settings";
  if (p.startsWith("/settings/")) return "Settings";
  return "SEO Audit Pro";
}
