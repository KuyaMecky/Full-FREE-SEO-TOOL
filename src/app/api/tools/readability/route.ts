import { NextRequest, NextResponse } from "next/server";
import { scoreReadability } from "@/lib/readability/scorer";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const content = typeof body?.content === "string" ? body.content : "";
  const focusKeyword = typeof body?.focusKeyword === "string" ? body.focusKeyword : "";

  if (!content.trim()) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const result = scoreReadability(content, focusKeyword);
  return NextResponse.json(result);
}
