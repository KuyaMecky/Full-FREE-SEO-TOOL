"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, LineChart, Search, History, Settings,
  LogOut, BarChart3, Menu, X, Zap, KeyRound, Users, Target,
  FileCode, Gauge, FileSearch, Link2, PenLine, FileText,
  ChevronRight, Bell, Sparkles,
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
  color?: string;
}

const NAV: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/properties", label: "Properties", icon: LineChart },
      { href: "/quick-wins", label: "Quick Wins", icon: Target, badge: "Hot" },
    ],
  },
  {
    label: "Research",
    items: [
      { href: "/performance", label: "Performance", icon: Gauge },
      { href: "/keywords", label: "Keywords", icon: KeyRound },
      { href: "/competitors", label: "Competitors", icon: Users },
      { href: "/content", label: "Content Planner", icon: PenLine },
      { href: "/content/drafts", label: "Drafts", icon: FileText },
      { href: "/onpage", label: "On-page", icon: Zap },
      { href: "/indexing", label: "URL Inspection", icon: Search },
      { href: "/schema-check", label: "Schema Check", icon: FileSearch },
      { href: "/schema", label: "Schema Gen", icon: FileCode },
      { href: "/backlinks", label: "Backlinks", icon: Link2 },
    ],
  },
  {
    label: "Audits",
    items: [
      { href: "/audit/new", label: "New Audit", icon: Sparkles },
      { href: "/history", label: "History", icon: History },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

const AUTH_PAGES = new Set(["/login", "/register"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<UserData | null>(null);
  const [userLoading, setUserLoading] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setUser(d.user))
      .finally(() => setUserLoading(false));
  }, []);

  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
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
        <MarketingHeader />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        pathname={pathname}
        user={user}
        mobileOpen={mobileOpen}
        onLogout={handleLogout}
      />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:pl-[240px] min-w-0">
        <TopBar
          pathname={pathname}
          user={user}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen((o) => !o)}
        />
        <main className="flex-1 min-w-0">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────────── */
function Sidebar({ pathname, user, mobileOpen, onLogout }: {
  pathname: string;
  user: UserData | null;
  mobileOpen: boolean;
  onLogout: () => void;
}) {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 w-[240px] flex flex-col transition-transform duration-300 ease-out lg:translate-x-0",
      "bg-sidebar border-r border-sidebar-border",
      mobileOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo */}
      <div className="h-[60px] px-4 flex items-center gap-3 border-b border-sidebar-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30 shrink-0">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[13px] text-sidebar-foreground leading-none tracking-tight">SEO Audit Pro</p>
          <p className="text-[10px] text-sidebar-foreground/40 mt-0.5 font-medium">Enterprise</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto scrollbar-none">
        {NAV.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/35 select-none">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
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
                        "group flex items-center gap-2.5 px-2.5 py-[7px] rounded-[8px] text-[13px] font-medium transition-all duration-150",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <Icon className={cn("h-[15px] w-[15px] shrink-0", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && !active && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary leading-none">
                          {item.badge}
                        </span>
                      )}
                      {active && <ChevronRight className="h-3 w-3 opacity-50 shrink-0" />}
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
        <div className="p-2.5 border-t border-sidebar-border shrink-0 space-y-0.5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] bg-sidebar-accent/60">
            <Avatar name={user.name} email={user.email} size={28} />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-none">{user.name || "User"}</p>
              <p className="text-[10px] text-sidebar-foreground/45 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-[8px] text-[12px] text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-150"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}

/* ── Top bar ──────────────────────────────────────────────────────────────── */
function TopBar({ pathname, user, mobileOpen, onToggleMobile }: {
  pathname: string;
  user: UserData | null;
  mobileOpen: boolean;
  onToggleMobile: () => void;
}) {
  return (
    <header className="h-[60px] border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
      <div className="h-full px-4 lg:px-5 flex items-center gap-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{getPageTitle(pathname)}</p>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="GitHub"
          >
            <GHIcon className="h-4 w-4" />
          </a>
          <button className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
              <Avatar name={user.name} email={user.email} size={30} />
              <div className="hidden sm:block">
                <p className="text-[12px] font-semibold leading-tight">{user.name || "User"}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[110px]">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Marketing header (logged-out) ───────────────────────────────────────── */
function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-[15px] tracking-tight">SEO Audit Pro</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <button className="text-[13px] font-medium text-muted-foreground hover:text-foreground px-3.5 py-2 rounded-lg hover:bg-muted transition-colors">
              Sign in
            </button>
          </Link>
          <Link href="/register">
            <button className="text-[13px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-all shadow-sm shadow-primary/20">
              Get started
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── Footer ───────────────────────────────────────────────────────────────── */
function AppFooter() {
  return (
    <footer className="border-t border-border/40 px-5 py-3 flex items-center justify-between gap-4 text-[11px] text-muted-foreground shrink-0">
      <span>
        Built by{" "}
        <a href="https://github.com/KuyaMecky" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">
          KuyaMecky
        </a>
        {" "}· SEO Audit Pro
      </span>
      <a href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
        <GHIcon className="h-3 w-3" />
        Open source
      </a>
    </footer>
  );
}

/* ── Shared components ────────────────────────────────────────────────────── */
function Avatar({ name, email, size = 32 }: { name: string | null; email: string; size?: number }) {
  const initial = (name || email).charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full bg-gradient-to-br from-primary to-violet-500 text-white font-bold flex items-center justify-center shrink-0 ring-2 ring-background text-[11px]"
      style={{ width: size, height: size }}
    >
      {initial}
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

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname === "/properties") return "Properties";
  if (pathname.startsWith("/properties/connect")) return "Properties · Connect";
  if (pathname.startsWith("/properties/")) return "Properties · Detail";
  if (pathname === "/performance") return "Performance";
  if (pathname === "/keywords") return "Keywords";
  if (pathname === "/competitors") return "Competitors";
  if (pathname === "/quick-wins") return "Quick Wins";
  if (pathname === "/onpage") return "On-page Analyzer";
  if (pathname === "/schema") return "Schema Generator";
  if (pathname === "/schema-check") return "Schema Checker";
  if (pathname === "/indexing") return "URL Inspection";
  if (pathname === "/backlinks") return "Backlinks";
  if (pathname === "/content") return "Content Planner";
  if (pathname === "/content/drafts") return "Content · Drafts";
  if (pathname.startsWith("/content/drafts/")) return "Draft Editor";
  if (pathname === "/audit/new") return "New Audit";
  if (pathname.startsWith("/audit/")) return "Audit Report";
  if (pathname === "/history") return "Audit History";
  if (pathname === "/team") return "Team";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/settings/integrations/google")) return "Settings · Google Search Console";
  if (pathname.startsWith("/settings/integrations/ai")) return "Settings · AI Provider";
  if (pathname.startsWith("/settings/integrations/pagespeed")) return "Settings · PageSpeed";
  if (pathname.startsWith("/settings/integrations/wordpress")) return "Settings · WordPress";
  return "SEO Audit Pro";
}
