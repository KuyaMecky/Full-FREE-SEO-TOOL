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
  User,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      { href: "/content", label: "Content", icon: PenLine },
      { href: "/content/drafts", label: "Drafts", icon: FileText },
      { href: "/onpage", label: "On-page", icon: Zap },
      { href: "/indexing", label: "Indexing", icon: Search },
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
    label: "System",
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

  // Minimal shell for login/register
  if (isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-background">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <LogoMark />
              <span>SEO Audit Pro</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Logged-out: full-width marketing shell with minimal top bar
  if (!userLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <LogoMark />
              <span>SEO Audit Pro</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Authenticated: sidebar + top bar shell
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-sidebar text-sidebar-foreground flex flex-col transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 px-4 flex items-center gap-2.5 border-b border-sidebar-border">
          <LogoMark />
          <div>
            <span className="font-bold text-sm tracking-tight">SEO Audit Pro</span>
            <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Pro</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          {NAV_SECTIONS.map((section, i) => (
            <div key={i}>
              {section.label && (
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-sidebar-accent/60 transition-colors text-left">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {user.name || "User"}
                    </div>
                    <div className="text-xs text-sidebar-foreground/60 truncate">
                      {user.email}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col lg:pl-60 min-w-0">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-20">
          <div className="h-full px-4 lg:px-6 flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle nav"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1 text-sm font-medium text-foreground truncate">
              {getPageTitle(pathname)}
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href="https://github.com/KuyaMecky/Full-FREE-SEO-TOOL"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="View on GitHub"
              >
                <GitHubIcon className="h-4 w-4" />
              </a>
              <ThemeToggle />
              {user && (
                <div className="hidden sm:flex items-center gap-2 ml-1 pl-3 border-l border-border">
                  <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
        <footer className="border-t border-border bg-background/60 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>
            Built by{" "}
            <a
              href="https://github.com/KuyaMecky"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
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

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center">
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
  if (pathname.startsWith("/settings/integrations/wordpress")) return "Settings · WordPress";
  if (pathname === "/audit/new") return "New Audit";
  if (pathname.startsWith("/audit/")) return "Audit · Detail";
  if (pathname === "/history") return "History";
  if (pathname === "/team") return "Team";
  if (pathname === "/settings") return "Settings";
  if (pathname.startsWith("/settings/integrations/google"))
    return "Settings · Google Search Console";
  if (pathname.startsWith("/settings/integrations/ai"))
    return "Settings · AI Provider";
  if (pathname.startsWith("/settings/integrations/pagespeed"))
    return "Settings · PageSpeed Insights";
  if (pathname.startsWith("/settings/")) return "Settings";
  return "";
}
