import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchPsi, PsiStrategy } from "@/lib/pagespeed/client";

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

    const apiKey = process.env.PAGESPEED_API_KEY || undefined;
    const result = await fetchPsi(url, strategy, apiKey);

    return NextResponse.json({ result });
  } catch (err) {
    console.error("PSI one-off failed:", err);
    const message = err instanceof Error ? err.message : "PSI fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
