"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  BarChart3,
  FileText,
  Zap,
  LineChart,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface UserData {
  id: string;
  email: string;
  name: string | null;
}

interface Audit {
  id: string;
  domain: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
}

interface PropertyItem {
  id: string;
  siteUrl: string;
  latestSnapshot: {
    totalImpressions: number;
    totalClicks: number;
    avgCtr: number;
    avgPosition: number;
    fetchedAt: string;
  } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  crawling: "bg-blue-500",
  analyzing: "bg-purple-500",
  complete: "bg-green-500",
  error: "bg-red-500",
};

export default function HomePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        setLoading(false);
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const [auditsRes, propsRes] = await Promise.all([
        fetch("/api/audit"),
        fetch("/api/gsc/properties"),
      ]);
      if (auditsRes.ok) setAudits(await auditsRes.json());
      if (propsRes.ok) {
        const data = await propsRes.json();
        setProperties(data.properties ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    return <MarketingHome />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back{user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-gray-600 mt-1">
          Your audits and Search Console properties at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                Search performance
              </CardTitle>
              <CardDescription>
                Impressions, clicks, and keyword rankings from Google Search
                Console.
              </CardDescription>
            </div>
            <Link href="/properties">
              <Button variant="outline" size="sm" className="gap-1">
                Open
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  No properties connected yet.
                </p>
                <Link href="/properties">
                  <Button className="gap-2">
                    <LineChart className="h-4 w-4" />
                    Connect Google Search Console
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.slice(0, 3).map((p) => (
                  <Link key={p.id} href={`/properties/${p.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{p.siteUrl}</div>
                        {p.latestSnapshot ? (
                          <div className="text-xs text-gray-500 mt-1">
                            {p.latestSnapshot.totalImpressions.toLocaleString()}{" "}
                            impr · {p.latestSnapshot.totalClicks.toLocaleString()}{" "}
                            clicks · pos {p.latestSnapshot.avgPosition.toFixed(1)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 mt-1">
                            No data yet — open to refresh
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-purple-600" />
                Recent audits
              </CardTitle>
              <CardDescription>
                Technical SEO audits with AI-generated reports.
              </CardDescription>
            </div>
            <Link href="/audit/new">
              <Button variant="outline" size="sm" className="gap-1">
                New audit
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {audits.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No audits yet.</p>
                <Link href="/audit/new">
                  <Button className="gap-2">
                    <Search className="h-4 w-4" />
                    Start first audit
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {audits.slice(0, 5).map((a) => (
                  <Link key={a.id} href={`/audit/${a.id}`}>
                    <div className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{a.domain}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(a.createdAt).toLocaleDateString()}
                          {a.overallScore != null &&
                            ` · score ${Math.round(a.overallScore)}/100`}
                        </div>
                      </div>
                      <Badge
                        className={`${statusColors[a.status] || "bg-gray-400"} text-white shrink-0`}
                      >
                        {a.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MarketingHome() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Professional SEO Audit Tool
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Crawl any website, analyze SEO health with AI-powered insights, and
          track real search performance from Google Search Console.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card>
          <CardHeader>
            <LineChart className="h-10 w-10 text-blue-600 mb-2" />
            <CardTitle>Search performance</CardTitle>
            <CardDescription>
              Connect Google Search Console to see impressions, clicks, keyword
              rankings, and per-page metrics.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="h-10 w-10 text-purple-600 mb-2" />
            <CardTitle>Technical audits</CardTitle>
            <CardDescription>
              Rate-limited crawler with specialized analyzers for meta, headings,
              links, images, structured data, security, and more.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="h-10 w-10 text-green-600 mb-2" />
            <CardTitle>AI suggestions</CardTitle>
            <CardDescription>
              Claude reviews your GSC data and audit findings to produce title
              rewrites, content angles, and internal link ideas.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
