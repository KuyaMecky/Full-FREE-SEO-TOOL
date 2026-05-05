import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { propertyId, keyword, suggestions } = body;

    if (!propertyId || !keyword || !suggestions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const property = await prisma.gscProperty.findFirst({
      where: { id: propertyId, userId: session.id },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const ideas = [];
    for (const suggestion of suggestions) {
      const idea = await prisma.contentDraft.create({
        data: {
          userId: session.id,
          propertyId: propertyId,
          title: suggestion.title,
          slug: suggestion.title.toLowerCase().replace(/\s+/g, "-"),
          metaTitle: suggestion.title,
          metaDescription: suggestion.description,
          focusKeyword: keyword,
          content: `${suggestion.description}\n\n${suggestion.reasoning}`,
          status: "draft",
        },
      });
      ideas.push(idea);
    }

    return NextResponse.json({ success: true, ideosCreated: ideas.length });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: "Failed to export ideas" },
      { status: 500 }
    );
  }
}
