import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateApiKey } from "@/lib/api-key";

async function verifyApiKey(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const key = authHeader.slice(7);
  const result = await validateApiKey(key);
  return result?.userId || null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyApiKey(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Missing or invalid API key" },
        { status: 401 }
      );
    }

    const auditId = params.id;

    if (!auditId) {
      return NextResponse.json(
        { error: "auditId is required" },
        { status: 400 }
      );
    }

    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        crawlResults: true,
        rankKeywords: true,
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: "Audit not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (audit.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: audit.id,
      domain: audit.domain,
      status: audit.status,
      overallScore: audit.overallScore,
      createdAt: audit.createdAt,
      completedAt: audit.updatedAt,
      pagesAnalyzed: audit.crawlResults.length,
      crawlResults: audit.crawlResults.map(r => ({
        url: r.url,
        statusCode: r.statusCode,
        title: r.title,
        metaDescription: r.metaDescription,
        h1: r.h1,
        wordCount: r.contentLength,
        responseTime: r.responseTime,
        issues: r.issues ? JSON.parse(r.issues as string) : [],
      })),
    });
  } catch (error) {
    console.error("Error fetching audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
