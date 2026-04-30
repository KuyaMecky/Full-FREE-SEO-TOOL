import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // Get or create default system user
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

    const audit = await prisma.audit.create({
      data: {
        userId: systemUser.id,
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
    const systemUser = await prisma.user.findUnique({
      where: { email: "system@audit.local" },
    });

    const audits = await prisma.audit.findMany({
      where: { userId: systemUser?.id || "" },
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
