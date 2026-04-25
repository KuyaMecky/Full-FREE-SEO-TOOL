import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getOwned(id: string, userId: string) {
  const draft = await prisma.contentDraft.findUnique({ where: { id } });
  if (!draft || draft.userId !== userId) return null;
  return draft;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.contentDraft.findUnique({
    where: { id },
    include: {
      property: { select: { siteUrl: true } },
      wpConnection: { select: { id: true, label: true, siteUrl: true } },
      cluster: { select: { id: true, name: true, pillarTopic: true } },
    },
  });

  if (!draft || draft.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwned(id, session.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body?.title === "string") data.title = body.title;
  if (typeof body?.slug === "string") data.slug = body.slug;
  if (typeof body?.metaTitle === "string") data.metaTitle = body.metaTitle;
  if (typeof body?.metaDescription === "string") data.metaDescription = body.metaDescription;
  if (typeof body?.focusKeyword === "string") data.focusKeyword = body.focusKeyword;
  if (typeof body?.content === "string") data.content = body.content;
  if (typeof body?.schemaMarkup === "string") data.schemaMarkup = body.schemaMarkup;
  if (body?.internalLinks !== undefined) data.internalLinks = JSON.stringify(body.internalLinks);
  if (body?.imageSuggestions !== undefined) data.imageSuggestions = JSON.stringify(body.imageSuggestions);
  if (typeof body?.wpConnectionId === "string") data.wpConnectionId = body.wpConnectionId;
  if (typeof body?.clusterId === "string") data.clusterId = body.clusterId;
  if (typeof body?.status === "string") data.status = body.status;

  const draft = await prisma.contentDraft.update({ where: { id }, data });
  return NextResponse.json({ draft });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getOwned(id, session.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contentDraft.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
