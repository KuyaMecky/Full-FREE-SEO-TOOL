import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug.replace(/\.md$/, "");
    const filePath = join(process.cwd(), "docs", `${slug}.md`);

    const content = readFileSync(filePath, "utf-8");

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Documentation file not found" },
      { status: 404 }
    );
  }
}
