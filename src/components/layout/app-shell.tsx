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
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
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
        <div className="h-14 px-4 flex items-center gap-2 border-b border-sidebar-border">
          <LogoMark />
          <span className="font-semibold text-sm">SEO Audit Pro</span>
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
              className="lg:hidden h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle nav"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
            <div className="flex-1 text-sm text-muted-foreground truncate">
              {getPageTitle(pathname)}
            </div>
            <ThemeToggle />
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="truncate max-w-[160px]">{user.email}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
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
  if (pathname === "/audit/new") return "New Audit";
  if (pathname.startsWith("/audit/")) return "Audit · Detail";
  if (pathname === "/history") return "History";
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
