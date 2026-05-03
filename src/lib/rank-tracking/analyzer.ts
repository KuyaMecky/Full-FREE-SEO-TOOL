export interface RankSnapshot {
  date: Date;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface RankTrend {
  keyword: string;
  currentPosition: number;
  previousPosition: number | null;
  change: number;
  trend: "improving" | "declining" | "stable";
  impressions: number;
  clicks: number;
  ctr: number;
  weeklyChange: number;
  monthlyChange: number;
}

export function calculateTrend(snapshots: RankSnapshot[]): RankTrend | null {
  if (snapshots.length === 0) return null;

  const sorted = [...snapshots].sort((a, b) => b.date.getTime() - a.date.getTime());
  const current = sorted[0];
  const previous = sorted[1] || null;
  const weekAgo = sorted.find((s) => {
    const days = Math.floor((current.date.getTime() - s.date.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 6 && days <= 8;
  });
  const monthAgo = sorted.find((s) => {
    const days = Math.floor((current.date.getTime() - s.date.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 28 && days <= 32;
  });

  const change = previous ? current.position - previous.position : 0;
  const weeklyChange = weekAgo ? current.position - weekAgo.position : 0;
  const monthlyChange = monthAgo ? current.position - monthAgo.position : 0;

  let trend: "improving" | "declining" | "stable" = "stable";
  if (change < -0.5) trend = "improving"; // Lower position = better
  if (change > 0.5) trend = "declining";

  return {
    keyword: "",
    currentPosition: current.position,
    previousPosition: previous?.position || null,
    change,
    trend,
    impressions: current.impressions,
    clicks: current.clicks,
    ctr: current.ctr,
    weeklyChange,
    monthlyChange,
  };
}

export function getPositionCategory(position: number): string {
  if (position < 3) return "Top 3";
  if (position < 11) return "Top 10";
  if (position < 21) return "Top 20";
  if (position < 51) return "Top 50";
  return "Outside Top 50";
}

export function calculateOpportunityScore(snapshots: RankSnapshot[]): number {
  if (snapshots.length === 0) return 0;

  const current = snapshots[0];
  const avgClicks = snapshots.slice(0, 7).reduce((sum, s) => sum + s.clicks, 0) / Math.min(7, snapshots.length);

  // Score based on: position (lower is better), clicks (higher is better), trend (improving is better)
  let score = 50;

  // Position scoring (0-35)
  if (current.position <= 3) score += 35;
  else if (current.position <= 10) score += 25;
  else if (current.position <= 20) score += 15;
  else if (current.position <= 50) score += 5;

  // Click volume (0-15)
  if (avgClicks > 10) score += 15;
  else if (avgClicks > 5) score += 10;
  else if (avgClicks > 1) score += 5;

  // Trending (0-50, but only if improving)
  if (snapshots.length > 1) {
    const trend = calculateTrend(snapshots);
    if (trend?.trend === "improving") score += 50;
  }

  return Math.min(100, score);
}
