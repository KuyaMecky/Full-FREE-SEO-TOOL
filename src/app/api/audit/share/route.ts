import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateShareableLink, disableShareableLink } from "@/lib/audit/report-generator";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const auditId = body.auditId;
  const action = body.action; // "create" or "delete"

  if (!auditId) {
    return NextResponse.json({ error: "auditId required" }, { status: 400 });
  }

  try {
    if (action === "delete") {
      const report = await disableShareableLink(auditId, session.id);
      return NextResponse.json({ report, shareLink: null });
    } else {
      const report = await generateShareableLink(auditId, session.id);
      // Get base URL from request headers
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
      const baseUrl = `${protocol}://${host}`;
      const shareLink = `${baseUrl}/share/audit/${report.shareSlug}`;
      return NextResponse.json({ report, shareLink });
    }
  } catch (err) {
    console.error("Share error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to share" },
      { status: 500 }
    );
  }
}
