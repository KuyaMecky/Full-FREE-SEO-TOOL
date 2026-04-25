import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { inspectUrl } from "@/lib/gsc/client";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const urls: string[] = Array.isArray(body?.urls)
    ? body.urls.filter((u: unknown) => typeof u === "string" && (u as string).trim()).slice(0, 20)
    : [];

  if (!propertyId || !urls.length) {
    return NextResponse.json({ error: "propertyId and urls[] required (max 20)" }, { status: 400 });
  }

  const property = await prisma.gscProperty.findFirst({
    where: { id: propertyId, userId: session.id },
  });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const token = await getValidAccessToken(session.id);
  const results = [];

  for (const url of urls) {
    try {
      const result = await inspectUrl(token, property.siteUrl, url);
      const ir = result.inspectionResult;
      const isr = ir?.indexStatusResult;
      results.push({
        url,
        verdict: isr?.verdict ?? "UNKNOWN",
        coverageState: isr?.coverageState ?? "",
        indexingState: isr?.indexingState ?? "",
        lastCrawlTime: isr?.lastCrawlTime ?? null,
        pageFetchState: isr?.pageFetchState ?? "",
        robotsTxtState: isr?.robotsTxtState ?? "",
        googleCanonical: isr?.googleCanonical ?? "",
        userCanonical: isr?.userCanonical ?? "",
        mobileVerdict: ir?.mobileUsabilityResult?.verdict ?? "",
        error: null,
      });
    } catch (e) {
      results.push({
        url, verdict: "ERROR", error: e instanceof Error ? e.message : "Failed",
        coverageState: "", indexingState: "", lastCrawlTime: null,
        pageFetchState: "", robotsTxtState: "", googleCanonical: "", userCanonical: "", mobileVerdict: "",
      });
    }
    await new Promise(r => setTimeout(r, 200));
  }

  return NextResponse.json({ results });
}
