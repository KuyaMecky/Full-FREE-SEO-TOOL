import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = request.nextUrl.searchParams.get("propertyId");
  const where = propertyId
    ? { userId: session.id, propertyId }
    : { userId: session.id };

  const submissions = await prisma.indexSubmission.findMany({
    where,
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const propertyId =
      typeof body?.propertyId === "string" ? body.propertyId : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const note = typeof body?.note === "string" ? body.note.trim() : "";

    if (!propertyId || !url) {
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

    const submission = await prisma.indexSubmission.upsert({
      where: { propertyId_url: { propertyId, url } },
      create: {
        userId: session.id,
        propertyId,
        url,
        note,
        status: "pending",
      },
      update: {
        note: note || undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ submission });
  } catch (err) {
    console.error("Submission create failed:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
