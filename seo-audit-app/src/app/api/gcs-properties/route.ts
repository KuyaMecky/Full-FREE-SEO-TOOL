import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const properties = await prisma.gscProperty.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        siteUrl: true,
        permissionLevel: true,
        addedAt: true,
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json(properties);
  } catch (error) {
    console.error("Failed to fetch GCS properties:", error);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
