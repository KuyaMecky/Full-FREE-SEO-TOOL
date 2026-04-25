import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeArticle } from "@/lib/ai/write";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.contentDraft.findUnique({
    where: { id },
    include: {
      property: {
        include: { snapshots: { orderBy: { fetchedAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!draft || draft.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const outline: string[] = Array.isArray(body?.outline) ? body.outline : [];
  const intent: string = typeof body?.intent === "string" ? body.intent : "informational";
  const estimatedWordCount: number = typeof body?.estimatedWordCount === "number" ? body.estimatedWordCount : 1200;
  const internalLinkTargets: string[] = Array.isArray(body?.internalLinkTargets) ? body.internalLinkTargets : [];

  const snap = draft.property.snapshots[0];
  let gscQueries: Array<{ query: string; impressions: number; position: number }> = [];
  if (snap) {
    try {
      const raw = JSON.parse(snap.byQuery || "[]");
      gscQueries = raw.slice(0, 15);
    } catch { /* ignore */ }
  }

  const domain = draft.property.siteUrl
    .replace(/^sc-domain:/, "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  const result = await writeArticle({
    title: draft.title,
    targetKeyword: draft.focusKeyword,
    outline,
    intent,
    estimatedWordCount,
    domain,
    internalLinkTargets,
    gscQueries,
  });

  const updated = await prisma.contentDraft.update({
    where: { id },
    data: {
      content: result.content,
      metaTitle: result.metaTitle,
      metaDescription: result.metaDescription,
      slug: result.slug,
      schemaMarkup: result.schemaMarkup,
      internalLinks: JSON.stringify(result.internalLinks),
      imageSuggestions: JSON.stringify(result.imageSuggestions),
    },
  });

  return NextResponse.json({ draft: updated, result });
}
