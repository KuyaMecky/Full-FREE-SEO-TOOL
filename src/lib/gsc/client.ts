import { GscSearchAnalyticsResponse, GscSitesResponse } from "./types";

const GSC_BASE = "https://www.googleapis.com/webmasters/v3";
const SC_BASE = "https://searchconsole.googleapis.com/v1";

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

export interface UrlInspectionResult {
  inspectionResult?: {
    inspectionResultLink?: string;
    indexStatusResult?: {
      verdict?: string; // PASS | PARTIAL | FAIL | NEUTRAL
      coverageState?: string;
      robotsTxtState?: string;
      indexingState?: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
      googleCanonical?: string;
      userCanonical?: string;
      sitemap?: string[];
      referringUrls?: string[];
      crawledAs?: string;
    };
    mobileUsabilityResult?: {
      verdict?: string;
      issues?: Array<{ issueType?: string; severity?: string; message?: string }>;
    };
    richResultsResult?: {
      verdict?: string;
      detectedItems?: Array<{
        richResultType?: string;
        items?: Array<{
          name?: string;
          issues?: Array<{ issueMessage?: string; severity?: string }>;
        }>;
      }>;
    };
  };
}

export async function inspectUrl(
  accessToken: string,
  siteUrl: string,
  inspectionUrl: string,
  languageCode = "en-US"
): Promise<UrlInspectionResult> {
  const res = await fetch(`${SC_BASE}/urlInspection/index:inspect`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inspectionUrl,
      siteUrl,
      languageCode,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`URL inspection failed: ${res.status} ${text.slice(0, 300)}`);
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
