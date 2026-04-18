import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        crawlResults: {
          orderBy: { createdAt: "asc" },
        },
        findings: {
          orderBy: [{ severity: "asc" }, { priority: "desc" }],
        },
        report: true,
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    if (audit.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse JSON fields
    const parsedAudit = {
      ...audit,
      goals: JSON.parse(audit.goals || "[]"),
      priorityPages: JSON.parse(audit.priorityPages || "[]"),
      competitors: JSON.parse(audit.competitors || "[]"),
      crawlResults: audit.crawlResults.map((result) => ({
        ...result,
        headings: JSON.parse(result.headings || "[]"),
        links: JSON.parse(result.links || "[]"),
        images: JSON.parse(result.images || "[]"),
        structuredData: JSON.parse(result.structuredData || "[]"),
        issues: JSON.parse(result.issues || "[]"),
      })),
      findings: audit.findings.map((finding) => ({
        ...finding,
        affectedUrls: JSON.parse(finding.affectedUrls || "[]"),
      })),
      report: audit.report
        ? {
            ...audit.report,
            executiveSummary: JSON.parse(audit.report.executiveSummary || "{}"),
            scorecard: JSON.parse(audit.report.scorecard || "{}"),
            roadmap: JSON.parse(audit.report.roadmap || "[]"),
            kpiPlan: JSON.parse(audit.report.kpiPlan || "[]"),
            actionItems: JSON.parse(audit.report.actionItems || "[]"),
            devTaskList: JSON.parse(audit.report.devTaskList || "[]"),
          }
        : null,
    };

    return NextResponse.json(parsedAudit);
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const audit = await prisma.audit.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!audit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (audit.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.audit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete audit:", error);
    return NextResponse.json(
      { error: "Failed to delete audit" },
      { status: 500 }
    );
  }
}
