import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createPost, updatePost } from "@/lib/wordpress/client";

// Add to vercel.json: { "path": "/api/cron/publish-scheduled", "schedule": "* * * * *" }
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.contentDraft.findMany({
    where: {
      scheduledAt: { lte: now },
      status: { in: ["draft", "review", "ready"] },
      wpConnectionId: { not: null },
      content: { not: "" },
    },
    include: { wpConnection: true },
    take: 10,
  });

  const results = [];
  for (const draft of due) {
    if (!draft.wpConnection) continue;
    const { siteUrl, username, appPassword } = draft.wpConnection;
    try {
      let wpPost;
      if (draft.wpPostId) {
        wpPost = await updatePost(siteUrl, username, appPassword, draft.wpPostId, {
          title: draft.title, content: draft.content, slug: draft.slug, status: "publish",
          metaTitle: draft.metaTitle, metaDescription: draft.metaDescription, focusKeyword: draft.focusKeyword,
        });
      } else {
        wpPost = await createPost(siteUrl, username, appPassword, {
          title: draft.title, content: draft.content, slug: draft.slug, status: "publish",
          metaTitle: draft.metaTitle, metaDescription: draft.metaDescription, focusKeyword: draft.focusKeyword,
        });
      }
      await prisma.contentDraft.update({
        where: { id: draft.id },
        data: { status: "published", wpPostId: wpPost.id, scheduledAt: null },
      });
      results.push({ id: draft.id, ok: true, wpPostId: wpPost.id });
    } catch (e) {
      results.push({ id: draft.id, ok: false, error: e instanceof Error ? e.message : "Failed" });
    }
  }

  return NextResponse.json({ published: results.filter(r => r.ok).length, results });
}
