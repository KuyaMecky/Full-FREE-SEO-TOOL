import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }

    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const keywords = await prisma.rankKeyword.findMany({
      where: { propertyId, userId: session.id },
      include: {
        snapshots: {
          orderBy: { date: "desc" },
          take: 90, // Last 90 days
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("Failed to fetch keywords:", error);
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { propertyId, keyword } = await request.json();

    if (!propertyId || !keyword) {
      return NextResponse.json(
        { error: "propertyId and keyword required" },
        { status: 400 }
      );
    }

    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if already tracking
    const existing = await prisma.rankKeyword.findUnique({
      where: {
        propertyId_keyword: {
          propertyId,
          keyword,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already tracking this keyword" },
        { status: 400 }
      );
    }

    const rankKeyword = await prisma.rankKeyword.create({
      data: {
        userId: session.id,
        propertyId,
        keyword,
      },
    });

    return NextResponse.json({ rankKeyword });
  } catch (error) {
    console.error("Failed to add keyword:", error);
    return NextResponse.json({ error: "Failed to add keyword" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keywordId = request.nextUrl.searchParams.get("keywordId");
    if (!keywordId) {
      return NextResponse.json({ error: "keywordId required" }, { status: 400 });
    }

    const rankKeyword = await prisma.rankKeyword.findUnique({
      where: { id: keywordId },
    });

    if (!rankKeyword || rankKeyword.userId !== session.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.rankKeyword.delete({
      where: { id: keywordId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete keyword:", error);
    return NextResponse.json({ error: "Failed to delete keyword" }, { status: 500 });
  }
}
