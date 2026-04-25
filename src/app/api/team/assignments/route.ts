import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId") ?? undefined;

  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { ownerId: session.id },
        { members: { some: { userId: session.id } } },
      ],
    },
  });

  if (!team) return NextResponse.json({ assignments: [] });

  const assignments = await prisma.propertyAssignment.findMany({
    where: { teamId: team.id, ...(propertyId ? { propertyId } : {}) },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
      property: { select: { siteUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assignments });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { ownerId: session.id },
        { members: { some: { userId: session.id, role: "leader" } } },
      ],
    },
  });

  if (!team) {
    return NextResponse.json({ error: "Only team owners or leaders can assign tasks" }, { status: 403 });
  }

  const body = await request.json();
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;
  const assignedToId = typeof body?.assignedToId === "string" ? body.assignedToId : null;
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : null;
  const description = typeof body?.description === "string" ? body.description : "";
  const priority = ["low", "medium", "high", "critical"].includes(body?.priority) ? body.priority : "medium";
  const dueDate = body?.dueDate ? new Date(body.dueDate) : null;

  if (!propertyId || !assignedToId || !title) {
    return NextResponse.json({ error: "propertyId, assignedToId and title are required" }, { status: 400 });
  }

  // Verify property belongs to this team's owner
  const property = await prisma.gscProperty.findUnique({ where: { id: propertyId } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  // Verify assignee is a team member
  const isMember = await prisma.teamMember.findFirst({
    where: { teamId: team.id, userId: assignedToId },
  });
  if (!isMember && assignedToId !== team.ownerId) {
    return NextResponse.json({ error: "Assignee is not a team member" }, { status: 400 });
  }

  const assignment = await prisma.propertyAssignment.create({
    data: {
      teamId: team.id,
      propertyId,
      assignedToId,
      assignedById: session.id,
      title,
      description,
      priority,
      dueDate,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      assignedBy: { select: { id: true, name: true, email: true } },
      property: { select: { siteUrl: true } },
    },
  });

  return NextResponse.json({ assignment });
}
