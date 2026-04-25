const GA4_BASE = "https://analyticsdata.googleapis.com/v1beta";

export interface Ga4MetricRow {
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface Ga4TopPage {
  page: string;
  sessions: number;
  pageviews: number;
  bounceRate: number;
}

export async function listGa4Properties(accessToken: string): Promise<Array<{ name: string; displayName: string }>> {
  const res = await fetch("https://analyticsadmin.googleapis.com/v1beta/properties?pageSize=50", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.properties ?? []).map((p: { name: string; displayName: string }) => ({
    name: p.name,
    displayName: p.displayName,
  }));
}

export async function getGa4Overview(
  accessToken: string,
  propertyId: string, // format: "properties/123456789"
  startDate = "28daysAgo",
  endDate = "today"
): Promise<{ rows: Ga4MetricRow[]; totals: Partial<Ga4MetricRow> }> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
      { name: "averageSessionDuration" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  };

  const res = await fetch(`${GA4_BASE}/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GA4 API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const rows: Ga4MetricRow[] = (data.rows ?? []).map((r: { dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }) => ({
    date: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value) || 0,
    users: parseInt(r.metricValues[1].value) || 0,
    pageviews: parseInt(r.metricValues[2].value) || 0,
    bounceRate: parseFloat(r.metricValues[3].value) || 0,
    avgSessionDuration: parseFloat(r.metricValues[4].value) || 0,
  }));

  const totals: Partial<Ga4MetricRow> = {
    sessions: rows.reduce((s, r) => s + r.sessions, 0),
    users: rows.reduce((s, r) => s + r.users, 0),
    pageviews: rows.reduce((s, r) => s + r.pageviews, 0),
    bounceRate: rows.length > 0 ? rows.reduce((s, r) => s + r.bounceRate, 0) / rows.length : 0,
  };

  return { rows, totals };
}

export async function getGa4TopPages(
  accessToken: string,
  propertyId: string,
  startDate = "28daysAgo",
  endDate = "today",
  limit = 20
): Promise<Ga4TopPage[]> {
  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "pagePath" }],
    metrics: [
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "bounceRate" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit,
  };

  const res = await fetch(`${GA4_BASE}/${propertyId}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.rows ?? []).map((r: { dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }) => ({
    page: r.dimensionValues[0].value,
    sessions: parseInt(r.metricValues[0].value) || 0,
    pageviews: parseInt(r.metricValues[1].value) || 0,
    bounceRate: parseFloat(r.metricValues[2].value) || 0,
  }));
}
