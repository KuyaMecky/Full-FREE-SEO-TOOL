import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function verifyApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = verifyApiKey(request);
    if (!apiKey) {
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
