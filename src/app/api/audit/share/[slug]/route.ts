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
    const html = await generateHTMLReport(report.audit, report);

    // Update view count
    await prisma.auditReport.update({
      where: { id: report.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return NextResponse.json({ html, report });
  } catch (err) {
    console.error("Audit fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}
