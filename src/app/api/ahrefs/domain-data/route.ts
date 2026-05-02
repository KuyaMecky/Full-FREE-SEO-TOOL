import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const AHREFS_BASE = "https://api.ahrefs.com/v3";

interface AhrefsDomainData {
  domain_rating?: number;
  referring_domains?: number;
  organic_traffic?: number;
  organic_keywords?: number;
  backlinks?: number;
  traffic_cost?: number;
  ahrefs_rank?: number;
}

async function fetchAhrefsDomainData(domain: string, apiKey: string): Promise<AhrefsDomainData> {
  try {
    const res = await fetch(
      `${AHREFS_BASE}/site-overview?target=${encodeURIComponent(domain)}&mode=domain`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
      }
    );

    if (!res.ok) {
      console.error("Ahrefs API error:", res.status);
      return {};
    }

    const data = await res.json();
    return {
      domain_rating: data.domain_rating,
      referring_domains: data.referring_domains,
      organic_traffic: data.organic_traffic,
      organic_keywords: data.organic_keywords,
      backlinks: data.backlinks,
      traffic_cost: data.traffic_cost,
      ahrefs_rank: data.ahrefs_rank,
    };
  } catch (error) {
    console.error("Failed to fetch Ahrefs domain data:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain required" }, { status: 400 });
    }

    const apiKey = process.env.AHREFS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Ahrefs not configured" }, { status: 400 });
    }

    const data = await fetchAhrefsDomainData(domain, apiKey);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Domain data error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
