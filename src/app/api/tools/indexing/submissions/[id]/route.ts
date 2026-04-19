import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sub = await prisma.indexSubmission.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data: { status?: string; note?: string; submittedAt?: Date } = {};
    if (
      body?.status &&
      ["pending", "requested", "indexed", "not_indexed", "error"].includes(
        body.status
      )
    ) {
      data.status = body.status;
      if (body.status === "requested") data.submittedAt = new Date();
    }
    if (typeof body?.note === "string") data.note = body.note;

    const updated = await prisma.indexSubmission.update({
      where: { id },
      data,
    });
    return NextResponse.json({ submission: updated });
  } catch (err) {
    console.error("Update failed:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sub = await prisma.indexSubmission.findUnique({ where: { id } });
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.indexSubmission.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
