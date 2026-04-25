"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  Search,
  History,
  Settings,
  LogOut,
  BarChart3,
  Menu,
  X,
  Zap,
  KeyRound,
  Users,
  Target,
  FileCode,
  Gauge,
  FileSearch,
  Link2,
  PenLine,
  FileText,
  ChevronRight,
  Bell,
  HelpCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface UserData {
  id: string;
  email: string;
  name: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: string;
}

const NAV_SECTIONS: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/properties", label: "Properties", icon: LineChart },
      { href: "/quick-wins", label: "Quick Wins", icon: Target },
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
      { href: "/audit/new", label: "New Audit", icon: Search },
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
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // ignore
      } finally {
        setUserLoading(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isAuthPage = AUTH_PAGES.has(pathname);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch {
      // ignore
    }
  };

  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  if (!userLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-bold text-base tracking-tight">SEO Audit Pro</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-muted">
                  Sign in
                </button>
              </Link>
              <Link href="/register">
                <button className="text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg font-medium">
                  Get started
                </button>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0",
          "bg-sidebar border-r border-sidebar-border",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-sidebar-border shrink-0">
          <LogoMark />
          <div className="min-w-0">
            <div className="font-bold text-sm tracking-tight text-sidebar-foreground">SEO Audit Pro</div>
            <div className="text-[10px] text-sidebar-foreground/50 font-medium">Enterprise Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto scrollbar-none">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.label && (
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium shadow-sm"
                          : "text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-150", !isActive && "group-hover:scale-110")} />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="h-3 w-3 opacity-60 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          {user && (
            <div className="space-y-1">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent/40">
                <UserAvatar name={user.name} email={user.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-sidebar-foreground truncate">
                    {user.name || "User"}
                  </div>
                  <div className="text-[10px] text-sidebar-foreground/50 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
          <div className="h-full px-4 lg:px-6 flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle nav"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>

            {/* Breadcrumb title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {getPageTitle(pathname)}
              </h1>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-1.5">
              <a
                href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
                target="_blank"
                rel="noopener noreferrer"
                title="View on GitHub"
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
              <button
                className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <ThemeToggle />
              {user && (
                <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-border">
                  <UserAvatar name={user.name} email={user.email} size="sm" />
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold leading-tight">{user.name || "User"}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">{user.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>

        {/* Footer */}
        <footer className="border-t border-border/60 bg-background/60 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 text-xs text-muted-foreground shrink-0">
          <span>
            Built by{" "}
            <a
              href="https://github.com/KuyaMecky"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              KuyaMecky
            </a>
            {" "}· SEO Audit Pro
          </span>
          <a
            href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GitHubIcon className="h-3.5 w-3.5" />
            Open source
          </a>
        </footer>
      </div>
    </div>
  );
}

function UserAvatar({ name, email, size = "sm" }: { name: string | null; email: string; size?: "sm" | "md" }) {
  const initial = (name || email).charAt(0).toUpperCase();
  const sz = size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold flex items-center justify-center shrink-0 ring-2 ring-background", sz)}>
      {initial}
    </div>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
      <BarChart3 className="h-4 w-4" />
    </div>
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
  if (pathname.startsWith("/content/drafts/")) return "Content · Draft Editor";
  if (pathname === "/audit/new") return "New Audit";
  if (pathname.startsWith("/audit/")) return "Audit · Report";
  if (pathname === "/history") return "Audit History";
  if (pathname === "/team") return "Team";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/settings/integrations/google")) return "Settings · Google Search Console";
  if (pathname.startsWith("/settings/integrations/ai")) return "Settings · AI Provider";
  if (pathname.startsWith("/settings/integrations/pagespeed")) return "Settings · PageSpeed Insights";
  if (pathname.startsWith("/settings/integrations/wordpress")) return "Settings · WordPress";
  if (pathname.startsWith("/settings/")) return "Settings";
  return "SEO Audit Pro";
}
