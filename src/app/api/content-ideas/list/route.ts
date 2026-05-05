import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get("propertyId");
    const status = searchParams.get("status") || "draft";

    const where: any = {
      userId: session.id,
      status,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    const ideas = await prisma.contentDraft.findMany({
      where,
      include: {
        property: {
          select: { siteUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      count: ideas.length,
      ideas: ideas.map((i) => ({
        id: i.id,
        title: i.title,
        slug: i.slug,
        keyword: i.focusKeyword,
        property: i.property?.siteUrl,
        status: i.status,
        createdAt: i.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}
