import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const AHREFS_BASE = "https://api.ahrefs.com/v3";

interface CompetitorData {
  domain: string;
  domain_rating?: number;
  referring_domains?: number;
  organic_traffic?: number;
  organic_keywords?: number;
}

async function fetchCompetitorData(domain: string, apiKey: string): Promise<CompetitorData> {
  try {
    const res = await fetch(
      `${AHREFS_BASE}/site-overview?target=${encodeURIComponent(domain)}&mode=domain`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      return { domain };
    }

    const data = await res.json();
    return {
      domain,
      domain_rating: data.domain_rating,
      referring_domains: data.referring_domains,
      organic_traffic: data.organic_traffic,
      organic_keywords: data.organic_keywords,
    };
  } catch (error) {
    console.error("Failed to fetch competitor data:", error);
    return { domain };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { competitors } = body;

    if (!Array.isArray(competitors) || competitors.length === 0) {
      return NextResponse.json({ error: "Competitors array required" }, { status: 400 });
    }

    const apiKey = process.env.AHREFS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Ahrefs not configured" }, { status: 400 });
    }

    // Fetch data for all competitors in parallel
    const competitorData = await Promise.all(
      competitors.map((competitor: string) =>
        fetchCompetitorData(competitor, apiKey)
      )
    );

    return NextResponse.json({ competitors: competitorData });
  } catch (error) {
    console.error("Competitors analysis error:", error);
    return NextResponse.json({ error: "Failed to analyze competitors" }, { status: 500 });
  }
}
