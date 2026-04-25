import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const assignment = await prisma.propertyAssignment.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwnerOrLeader =
    assignment.team.ownerId === session.id ||
    assignment.assignedById === session.id ||
    assignment.assignedToId === session.id;

  if (!isOwnerOrLeader) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (typeof body?.title === "string") data.title = body.title;
  if (typeof body?.description === "string") data.description = body.description;
  if (["low", "medium", "high", "critical"].includes(body?.priority)) data.priority = body.priority;
  if (["open", "in_progress", "done", "blocked"].includes(body?.status)) data.status = body.status;
  if (body?.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const updated = await prisma.propertyAssignment.update({
    where: { id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
      property: { select: { siteUrl: true } },
    },
  });

  return NextResponse.json({ assignment: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const assignment = await prisma.propertyAssignment.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (assignment.team.ownerId !== session.id && assignment.assignedById !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.propertyAssignment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
