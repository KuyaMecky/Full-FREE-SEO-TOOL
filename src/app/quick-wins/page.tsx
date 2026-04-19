"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  ArrowUp,
  ArrowDown,
  Search,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { HelpBanner } from "@/components/help-banner";
import { GUIDES } from "@/lib/guides";

interface QuickWin {
  propertyId: string;
  siteUrl: string;
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

type SortKey = "query" | "site" | "impressions" | "clicks" | "ctr" | "position" | "opportunity";
type SortDir = "asc" | "desc";

function opportunityScore(w: QuickWin): number {
  return w.impressions * (21 - w.position);
}

function shortSiteUrl(siteUrl: string): string {
  return siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export default function QuickWinsPage() {
  const [wins, setWins] = useState<QuickWin[]>([]);
  const [totalProps, setTotalProps] = useState(0);
  const [propsWithData, setPropsWithData] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("opportunity");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tools/quick-wins");
        if (res.ok) {
          const data = await res.json();
          setWins(data.wins);
          setTotalProps(data.totalProperties);
          setPropsWithData(data.propertiesWithData);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const filtered = filter
      ? wins.filter(
          (w) =>
            w.query.toLowerCase().includes(filter.toLowerCase()) ||
            w.siteUrl.toLowerCase().includes(filter.toLowerCase())
        )
      : wins;
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: number | string;
      let bv: number | string;
      if (sortKey === "query") {
        av = a.query;
        bv = b.query;
      } else if (sortKey === "site") {
        av = a.siteUrl;
        bv = b.siteUrl;
      } else if (sortKey === "opportunity") {
        av = opportunityScore(a);
        bv = opportunityScore(b);
      } else {
        av = a[sortKey];
        bv = b[sortKey];
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
    return copy;
  }, [wins, filter, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(k);
      setSortDir(k === "position" || k === "query" || k === "site" ? "asc" : "desc");
    }
  };

  const H = ({
    label,
    k,
    align = "left",
  }: {
    label: string;
    k: SortKey;
    align?: "left" | "right";
  }) => {
    const active = sortKey === k;
    return (
      <TableHead
        className={`cursor-pointer select-none ${align === "right" ? "text-right" : ""}`}
        onClick={() => toggleSort(k)}
      >
        <span className={`inline-flex items-center gap-1 ${active ? "text-foreground" : ""}`}>
          {label}
          {active && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </span>
      </TableHead>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        icon={Target}
        title="Quick Wins"
        accent="emerald"
        description="Queries ranking positions 4-20 with real impressions across every connected property. Your fastest opportunities to move onto page 1."
      />
      <HelpBanner guideKey="quickWins" guide={GUIDES.quickWins} />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : wins.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No quick wins yet</h3>
            <p className="text-sm text-muted-foreground mb-2 max-w-md mx-auto">
              {propsWithData === 0
                ? "Connect a property and click Refresh to fetch GSC data."
                : "No queries found in positions 4-20 with 50+ impressions. Add more properties or refresh existing ones."}
            </p>
            <p className="text-xs text-muted-foreground">
              {propsWithData}/{totalProps} properties have snapshots.
            </p>
            <div className="mt-4">
              <Link
                href="/properties"
                className="text-sm text-primary hover:underline"
              >
                Go to Properties →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {wins.length} opportunities across {propsWithData} properties
            </CardTitle>
            <CardDescription>
              Sorted by opportunity score (impressions × proximity to page 1).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="px-6 pb-3">
              <div className="relative max-w-sm">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Filter by query or site…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="border-t border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <H label="Query" k="query" />
                    <H label="Site" k="site" />
                    <H label="Impr." k="impressions" align="right" />
                    <H label="Clicks" k="clicks" align="right" />
                    <H label="CTR" k="ctr" align="right" />
                    <H label="Position" k="position" align="right" />
                    <H label="Opportunity" k="opportunity" align="right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.slice(0, 500).map((w, i) => (
                    <TableRow key={`${w.propertyId}-${w.query}-${i}`}>
                      <TableCell className="max-w-xs truncate font-medium">
                        {w.query}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/properties/${w.propertyId}`}
                          className="text-xs text-muted-foreground hover:text-foreground truncate max-w-[180px] inline-block align-middle"
                        >
                          {shortSiteUrl(w.siteUrl)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {w.impressions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {w.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(w.ctr * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Badge
                          variant="outline"
                          className={
                            w.position <= 10
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          }
                        >
                          {w.position.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {Math.round(opportunityScore(w)).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {sorted.length > 500 && (
              <div className="p-4 text-sm text-muted-foreground">
                Showing first 500 of {sorted.length} rows. Use the filter to narrow.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
