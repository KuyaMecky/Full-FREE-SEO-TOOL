import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateHTMLReport } from "@/lib/audit/report-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;

  try {
    const report = await prisma.auditReport.findUnique({
      where: { shareSlug: slug },
      include: { audit: true },
    });

    if (!report || !report.isShared) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Check if expired
    if (report.expiresAt && report.expiresAt < new Date()) {
      return NextResponse.json({ error: "Report expired" }, { status: 410 });
    }

    // Generate HTML
    let html: string;
    try {
      html = await generateHTMLReport(report.audit, report);
    } catch (htmlErr) {
      console.error("HTML generation failed:", htmlErr);
      // Return a simple fallback report
      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>SEO Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; background: #f5f5f5; }
    .container { background: white; padding: 30px; border-radius: 8px; max-width: 900px; margin: 0 auto; }
    h1 { color: #0066cc; }
    .score { font-size: 48px; font-weight: bold; color: #0066cc; }
    .meta { color: #666; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SEO Audit Report</h1>
    <p><strong>Domain:</strong> ${report.audit?.domain || "Unknown"}</p>
    <div class="meta">Report generated on ${new Date().toLocaleDateString()}</div>
    <p>View the full report in your audit dashboard.</p>
  </div>
</body>
</html>`;
    }

    // Update view count
    try {
      await prisma.auditReport.update({
        where: { id: report.id },
        data: {
          viewCount: { increment: 1 },
          lastViewedAt: new Date(),
        },
      });
    } catch (updateErr) {
      console.error("Failed to update view count:", updateErr);
      // Don't fail the request if view count update fails
    }

    return NextResponse.json({ html, report });
  } catch (err) {
    console.error("Audit fetch error:", err);
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch audit";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
