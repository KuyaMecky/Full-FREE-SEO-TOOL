import { GscSearchAnalyticsResponse, GscSitesResponse } from "./types";

const GSC_BASE = "https://www.googleapis.com/webmasters/v3";

export interface SearchAnalyticsQuery {
  startDate: string; // YYYY-MM-DD
  endDate: string;
  dimensions?: Array<"date" | "query" | "page" | "country" | "device">;
  rowLimit?: number;
  startRow?: number;
  dataState?: "final" | "all";
  searchType?: "web" | "image" | "video" | "news";
}

export async function listSites(
  accessToken: string
): Promise<GscSitesResponse> {
  const res = await fetch(`${GSC_BASE}/sites`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`listSites failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function searchAnalyticsQuery(
  accessToken: string,
  siteUrl: string,
  body: SearchAnalyticsQuery
): Promise<GscSearchAnalyticsResponse> {
  const encodedSite = encodeURIComponent(siteUrl);
  const res = await fetch(
    `${GSC_BASE}/sites/${encodedSite}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`searchAnalyticsQuery failed: ${res.status} ${text}`);
  }

  return res.json();
}
