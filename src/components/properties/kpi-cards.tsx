"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointerClick, Percent, TrendingUp } from "lucide-react";

interface Kpis {
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

function formatPosition(n: number): string {
  return n.toFixed(1);
}

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const items = [
    {
      label: "Impressions",
      value: formatNumber(kpis.totalImpressions),
      icon: Eye,
    },
    {
      label: "Clicks",
      value: formatNumber(kpis.totalClicks),
      icon: MousePointerClick,
    },
    {
      label: "Avg. CTR",
      value: formatPercent(kpis.avgCtr),
      icon: Percent,
    },
    {
      label: "Avg. Position",
      value: formatPosition(kpis.avgPosition),
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground/70" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
