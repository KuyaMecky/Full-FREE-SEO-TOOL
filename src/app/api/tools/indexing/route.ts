import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { inspectUrl } from "@/lib/gsc/client";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const propertyId = typeof body?.propertyId === "string" ? body.propertyId : "";
    const inspectionUrl =
      typeof body?.url === "string" ? body.url.trim() : "";

    if (!propertyId || !inspectionUrl) {
      return NextResponse.json(
        { error: "propertyId and url are required" },
        { status: 400 }
      );
    }

    const property = await prisma.gscProperty.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.userId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accessToken = await getValidAccessToken(session.id);
    const result = await inspectUrl(accessToken, property.siteUrl, inspectionUrl);

    return NextResponse.json({ result });
  } catch (err) {
    console.error("URL inspection failed:", err);
    const message = err instanceof Error ? err.message : "Inspection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
