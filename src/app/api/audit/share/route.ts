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
      const shareLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/share/audit/${report.shareSlug}`;
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
