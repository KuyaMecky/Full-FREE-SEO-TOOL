import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPost, updatePost } from "@/lib/wordpress/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = await prisma.contentDraft.findUnique({
    where: { id },
    include: { wpConnection: true },
  });

  if (!draft || draft.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!draft.wpConnection) {
    return NextResponse.json({ error: "No WordPress connection linked to this draft" }, { status: 400 });
  }
  if (!draft.content) {
    return NextResponse.json({ error: "Draft has no content. Generate the article first." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const publishStatus: "draft" | "publish" =
    body?.publishStatus === "publish" ? "publish" : "draft";

  const { siteUrl, username, appPassword } = draft.wpConnection;

  let wpPost;
  if (draft.wpPostId) {
    wpPost = await updatePost(siteUrl, username, appPassword, draft.wpPostId, {
      title: draft.title,
      content: draft.content,
      slug: draft.slug,
      status: publishStatus,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      focusKeyword: draft.focusKeyword,
    });
  } else {
    wpPost = await createPost(siteUrl, username, appPassword, {
      title: draft.title,
      content: draft.content,
      slug: draft.slug,
      status: publishStatus,
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      focusKeyword: draft.focusKeyword,
    });
  }

  const updated = await prisma.contentDraft.update({
    where: { id },
    data: {
      wpPostId: wpPost.id,
      status: publishStatus === "publish" ? "published" : "draft",
    },
  });

  return NextResponse.json({ draft: updated, wpPost });
}
