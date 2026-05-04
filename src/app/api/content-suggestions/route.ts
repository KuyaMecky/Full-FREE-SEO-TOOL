import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildContentPlan } from "@/lib/content-suggestions/generator";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keyword, position, searchVolume = 0, hasContent = false } = await request.json();

    if (!keyword || !position) {
      return NextResponse.json(
        { error: "keyword and position required" },
        { status: 400 }
      );
    }

    // Generate content suggestions
    const plan = buildContentPlan(keyword, position, searchVolume, [], hasContent);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to generate content suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keyword = request.nextUrl.searchParams.get("keyword");
    const position = request.nextUrl.searchParams.get("position");
    const searchVolume = request.nextUrl.searchParams.get("searchVolume") || "0";
    const hasContent = request.nextUrl.searchParams.get("hasContent") === "true";

    if (!keyword || !position) {
      return NextResponse.json(
        { error: "keyword and position required" },
        { status: 400 }
      );
    }

    const plan = buildContentPlan(
      keyword,
      parseInt(position),
      parseInt(searchVolume),
      [],
      hasContent
    );

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Failed to fetch content suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
