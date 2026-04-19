import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchSitemapForProperty } from "@/lib/content/sitemap";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = request.nextUrl.searchParams.get("propertyId");
  if (!propertyId) {
    return NextResponse.json(
      { error: "propertyId is required" },
      { status: 400 }
    );
  }

  const property = await prisma.gscProperty.findUnique({
    where: { id: propertyId },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (property.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await fetchSitemapForProperty(property.siteUrl);
  return NextResponse.json({
    siteUrl: property.siteUrl,
    ...result,
  });
}
