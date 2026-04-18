import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSnapshot } from "@/lib/gsc/snapshot";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.gscProperty.findUnique({ where: { id } });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (property.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const snapshot = await createSnapshot(id);
    return NextResponse.json({ snapshot });
  } catch (err) {
    console.error("Snapshot refresh failed:", err);
    const message =
      err instanceof Error ? err.message : "Snapshot refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
