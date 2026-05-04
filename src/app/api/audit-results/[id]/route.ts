import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const audit = await prisma.auditResult.findUnique({
      where: { id },
      include: {
        findings: true,
        competitorData: true,
      },
    });

    if (!audit) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Verify user owns this audit
    const property = await prisma.gscProperty.findUnique({
      where: { id: audit.propertyId },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Parse report if it's JSON string
    let report = null;
    try {
      report = typeof audit.report === "string" ? JSON.parse(audit.report) : audit.report;
    } catch (e) {
      console.error("Failed to parse report:", e);
    }

    return NextResponse.json({
      id: audit.id,
      domain: audit.domain,
      status: audit.status,
      overallScore: audit.overallScore,
      createdAt: audit.createdAt,
      report,
      findings: audit.findings,
      competitors: audit.competitorData,
    });
  } catch (error) {
    console.error("Failed to fetch audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}
