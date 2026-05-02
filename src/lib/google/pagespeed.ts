// PageSpeed Insights API integration
const PSI_BASE = "https://www.googleapis.com/pagespeedonline/v5";

export interface PageSpeedResult {
  lighthouseResult?: {
    scores?: {
      performance?: number;
      accessibility?: number;
      bestPractices?: number;
      seo?: number;
    };
    audits?: {
      "metrics"?: { details?: { items?: Array<any> } };
      "cumulative-layout-shift"?: { score?: number };
      "largest-contentful-paint"?: { score?: number };
      "first-input-delay"?: { score?: number };
    };
  };
}

export async function analyzePageSpeed(
  apiKey: string,
  url: string,
  strategy: "mobile" | "desktop" = "mobile"
): Promise<PageSpeedResult> {
  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy,
    category: "performance",
    category: "seo",
    category: "accessibility",
    category: "best-practices",
  });

  try {
    const res = await fetch(`${PSI_BASE}/runPagespeed?${params}`, {
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      console.error("PageSpeed API error:", res.status);
      return {};
    }

    return res.json();
  } catch (error) {
    console.error("PageSpeed API failed:", error);
    return {};
  }
}

export function extractCoreWebVitals(result: PageSpeedResult) {
  const metrics = result.lighthouseResult?.audits?.["metrics"]?.details?.items?.[0];
  const cwv = {
    lcp: metrics?.largest_contentful_paint_ms || 0,
    fid: metrics?.first_input_delay_ms || 0,
    cls: metrics?.cumulative_layout_shift_score || 0,
  };
  return cwv;
}

export function getSeoScore(result: PageSpeedResult): number {
  return (result.lighthouseResult?.scores?.seo || 0) * 100;
}

export function getPerformanceScore(result: PageSpeedResult): number {
  return (result.lighthouseResult?.scores?.performance || 0) * 100;
}
