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

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyApiKey(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Missing or invalid API key. Use: Authorization: Bearer YOUR_API_KEY" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { domain, maxPages = 50 } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "domain is required" },
        { status: 400 }
      );
    }

    // Validate domain
    try {
      new URL(`https://${domain}`);
    } catch {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      );
    }

    if (maxPages < 1 || maxPages > 500) {
      return NextResponse.json(
        { error: "maxPages must be between 1 and 500" },
        { status: 400 }
      );
    }

    // Create audit for the API key's user
    const audit = await prisma.audit.create({
      data: {
        domain,
        maxPages,
        status: "pending",
        userId,
        overallScore: null,
      },
      select: {
        id: true,
        domain: true,
        status: true,
        createdAt: true,
      },
    });

    // Start crawl in background
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/crawl`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auditId: audit.id }),
    }).catch(err => console.error("Background crawl error:", err));

    return NextResponse.json(
      {
        auditId: audit.id,
        domain: audit.domain,
        status: audit.status,
        createdAt: audit.createdAt,
        resultsUrl: `https://${process.env.VERCEL_URL || "localhost:3000"}/api/public/audits/${audit.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Audit creation error:", error);
    return NextResponse.json(
      { error: "Failed to create audit" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
