import { prisma } from "@/lib/db";
import { getValidAccessToken } from "./tokens";
import { searchAnalyticsQuery } from "./client";
import {
  DateRow,
  QueryRow,
  PageRow,
  SnapshotData,
  GscRow,
} from "./types";

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForLastNDays(days: number): { start: string; end: string } {
  // GSC has ~2-3 day latency; use yesterday as end and go back N days
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start: formatDate(start), end: formatDate(end) };
}

function toDateRow(r: GscRow): DateRow {
  return {
    date: r.keys?.[0] ?? "",
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
  };
}

function toQueryRow(r: GscRow): QueryRow {
  return {
    query: r.keys?.[0] ?? "",
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
  };
}

function toPageRow(r: GscRow): PageRow {
  return {
    page: r.keys?.[0] ?? "",
    impressions: r.impressions,
    clicks: r.clicks,
    ctr: r.ctr,
    position: r.position,
  };
}

export async function createSnapshot(propertyId: string): Promise<SnapshotData> {
  const property = await prisma.gscProperty.findUnique({
    where: { id: propertyId },
    include: { googleAccount: true },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  const accessToken = await getValidAccessToken(property.userId);
  const { start, end } = rangeForLastNDays(28);

  const common = {
    startDate: start,
    endDate: end,
    rowLimit: 1000,
    dataState: "final" as const,
  };

  const [byDateRes, byQueryRes, byPageRes] = await Promise.all([
    searchAnalyticsQuery(accessToken, property.siteUrl, {
      ...common,
      dimensions: ["date"],
    }),
    searchAnalyticsQuery(accessToken, property.siteUrl, {
      ...common,
      dimensions: ["query"],
    }),
    searchAnalyticsQuery(accessToken, property.siteUrl, {
      ...common,
      dimensions: ["page"],
    }),
  ]);

  const byDate = (byDateRes.rows ?? []).map(toDateRow);
  const byQuery = (byQueryRes.rows ?? []).map(toQueryRow);
  const byPage = (byPageRes.rows ?? []).map(toPageRow);

  const totalImpressions = byDate.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = byDate.reduce((s, r) => s + r.clicks, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition =
    byDate.length > 0
      ? byDate.reduce((s, r) => s + r.position * r.impressions, 0) /
        Math.max(totalImpressions, 1)
      : 0;

  const snapshot: SnapshotData = {
    rangeStart: start,
    rangeEnd: end,
    totalImpressions,
    totalClicks,
    avgCtr,
    avgPosition,
    byDate,
    byQuery,
    byPage,
  };

  await prisma.gscSnapshot.create({
    data: {
      propertyId,
      rangeStart: new Date(start),
      rangeEnd: new Date(end),
      totalImpressions,
      totalClicks,
      avgCtr,
      avgPosition,
      byDate: JSON.stringify(byDate),
      byQuery: JSON.stringify(byQuery),
      byPage: JSON.stringify(byPage),
    },
  });

  return snapshot;
}

export async function getLatestSnapshot(propertyId: string) {
  return prisma.gscSnapshot.findFirst({
    where: { propertyId },
    orderBy: { fetchedAt: "desc" },
  });
}
