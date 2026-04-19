import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { inspectUrl } from "@/lib/gsc/client";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sub = await prisma.indexSubmission.findUnique({
    where: { id },
    include: { property: true },
  });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const accessToken = await getValidAccessToken(session.id);
    const result = await inspectUrl(accessToken, sub.property.siteUrl, sub.url);
    const indexStatus = result.inspectionResult?.indexStatusResult;
    const verdict = indexStatus?.verdict;

    let newStatus = sub.status;
    if (verdict === "PASS") newStatus = "indexed";
    else if (verdict === "FAIL") newStatus = "not_indexed";
    // PARTIAL or NEUTRAL → keep whatever status the user had (usually "requested")

    const lastCrawl = indexStatus?.lastCrawlTime
      ? new Date(indexStatus.lastCrawlTime)
      : null;

    const updated = await prisma.indexSubmission.update({
      where: { id },
      data: {
        status: newStatus,
        lastIndexVerdict: verdict ?? null,
        lastCoverageState: indexStatus?.coverageState ?? null,
        lastFetchState: indexStatus?.pageFetchState ?? null,
        lastCrawlTime: lastCrawl,
        lastCheckedAt: new Date(),
      },
    });

    return NextResponse.json({ submission: updated, result });
  } catch (err) {
    console.error("Recheck failed:", err);
    const message = err instanceof Error ? err.message : "Recheck failed";
    // Mark as error so user sees something
    await prisma.indexSubmission
      .update({
        where: { id },
        data: { status: "error", lastCheckedAt: new Date() },
      })
      .catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
