import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? undefined;

  const drafts = await prisma.contentDraft.findMany({
    where: { userId: session.id, ...(propertyId ? { propertyId } : {}) },
    select: {
      id: true,
      title: true,
      slug: true,
      focusKeyword: true,
      status: true,
      wpPostId: true,
      createdAt: true,
      updatedAt: true,
      property: { select: { siteUrl: true } },
      wpConnection: { select: { label: true, siteUrl: true } },
      cluster: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ drafts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const property = await prisma.gscProperty.findUnique({ where: { id: propertyId } });
  if (!property || property.userId !== session.id) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const draft = await prisma.contentDraft.create({
    data: {
      userId: session.id,
      propertyId,
      clusterId: typeof body?.clusterId === "string" ? body.clusterId : null,
      wpConnectionId: typeof body?.wpConnectionId === "string" ? body.wpConnectionId : null,
      title: typeof body?.title === "string" ? body.title : "Untitled",
      slug: typeof body?.slug === "string" ? body.slug : "untitled",
      metaTitle: typeof body?.metaTitle === "string" ? body.metaTitle : "",
      metaDescription: typeof body?.metaDescription === "string" ? body.metaDescription : "",
      focusKeyword: typeof body?.focusKeyword === "string" ? body.focusKeyword : "",
      content: typeof body?.content === "string" ? body.content : "",
      schemaMarkup: typeof body?.schemaMarkup === "string" ? body.schemaMarkup : null,
      internalLinks: JSON.stringify(body?.internalLinks ?? []),
      imageSuggestions: JSON.stringify(body?.imageSuggestions ?? []),
      gscSignals: JSON.stringify(body?.gscSignals ?? {}),
      status: "draft",
    },
  });

  return NextResponse.json({ draft });
}
