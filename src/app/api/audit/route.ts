import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      domain,
      country,
      language,
      businessType,
      goals,
      priorityPages,
      competitors,
      cmsStack,
      maxPages,
    } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json(
        { error: "Domain is required" },
        { status: 400 }
      );
    }

    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    // Get authenticated user or fall back to system user
    let userId: string;
    const session = await getSession();

    if (session?.id) {
      userId = session.id;
    } else {
      // Get or create default system user for unauthenticated requests
      let systemUser = await prisma.user.findUnique({
        where: { email: "system@audit.local" },
      });

      if (!systemUser) {
        systemUser = await prisma.user.create({
          data: {
            email: "system@audit.local",
            name: "System",
          },
        });
      }
      userId = systemUser.id;
    }

    // Check if domain is connected to GCS (Google Cloud Storage/Search Console)
    const gcsProperty = await prisma.gscProperty.findFirst({
      where: {
        userId,
        siteUrl: {
          contains: normalizedDomain,
        },
      },
    });

    if (!gcsProperty) {
      return NextResponse.json(
        { error: "Domain must be connected to Google Search Console first" },
        { status: 403 }
      );
    }

    const audit = await prisma.audit.create({
      data: {
        userId,
        domain: normalizedDomain,
        country: country || "US",
        language: language || "en",
        businessType: businessType || "",
        goals: JSON.stringify(goals || []),
        priorityPages: JSON.stringify(priorityPages || []),
        competitors: JSON.stringify(competitors || []),
        cmsStack: cmsStack || "",
        maxPages: maxPages || 50,
        status: "pending",
      },
    });

    return NextResponse.json({ id: audit.id, domain: audit.domain });
  } catch (error) {
    console.error("Failed to create audit:", error);
    return NextResponse.json(
      { error: "Failed to create audit" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    let userId: string | null = null;

    if (session?.id) {
      userId = session.id;
    } else {
      // For unauthenticated users, get system user's audits
      const systemUser = await prisma.user.findUnique({
        where: { email: "system@audit.local" },
      });
      userId = systemUser?.id || null;
    }

    if (!userId) {
      return NextResponse.json([]);
    }

    const audits = await prisma.audit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        domain: true,
        status: true,
        overallScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error("Failed to fetch audits:", error);
    return NextResponse.json(
      { error: "Failed to fetch audits" },
      { status: 500 }
    );
  }
}
