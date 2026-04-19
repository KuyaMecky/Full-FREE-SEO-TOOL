import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchPsi, PsiStrategy } from "@/lib/pagespeed/client";
import { getPagespeedApiKey } from "@/lib/pagespeed/config";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const urlRaw = typeof body?.url === "string" ? body.url.trim() : "";
    const strategyRaw = body?.strategy === "desktop" ? "desktop" : "mobile";

    if (!urlRaw) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const url = urlRaw.startsWith("http") ? urlRaw : `https://${urlRaw}`;
    const strategy = strategyRaw as PsiStrategy;

    const apiKey = await getPagespeedApiKey();
    const result = await fetchPsi(url, strategy, apiKey);

    return NextResponse.json({ result });
  } catch (err) {
    console.error("PSI one-off failed:", err);
    const message = err instanceof Error ? err.message : "PSI fetch failed";
    if (message.includes("429")) {
      const hasKey = Boolean(await getPagespeedApiKey());
      const hint = hasKey
        ? "PageSpeed Insights daily quota exceeded. Wait a few hours or top up your Google Cloud quota."
        : "PageSpeed Insights rate limit hit. You're using the shared anonymous quota. Add a free API key in Settings → Integrations → PageSpeed Insights to get 25,000 queries/day.";
      return NextResponse.json(
        { error: hint, code: "psi_rate_limit", hasKey },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
