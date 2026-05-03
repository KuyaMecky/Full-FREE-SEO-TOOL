import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAhrefsKeywordData } from "@/lib/ahrefs/keywords";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keywords } = await request.json();
    if (!keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ error: "keywords array required" }, { status: 400 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: { ahrefsApiKey: true },
    });

    if (!settings?.ahrefsApiKey) {
      return NextResponse.json({ error: "Ahrefs API key not configured" }, { status: 400 });
    }

    const data = await getAhrefsKeywordData(settings.ahrefsApiKey, keywords);
    return NextResponse.json({ keywords: data });
  } catch (error) {
    console.error("Failed to fetch keyword data:", error);
    return NextResponse.json({ error: "Failed to fetch keyword data" }, { status: 500 });
  }
}
