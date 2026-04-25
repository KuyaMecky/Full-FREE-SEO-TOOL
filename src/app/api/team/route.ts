import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findFirst({
    where: {
      OR: [
        { ownerId: session.id },
        { members: { some: { userId: session.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      invites: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json({ team });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.team.findFirst({ where: { ownerId: session.id } });
  if (existing) return NextResponse.json({ error: "You already own a team" }, { status: 400 });

  const body = await request.json();
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "My Team";

  const team = await prisma.team.create({
    data: { name, ownerId: session.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
      invites: { where: { status: "pending" } },
    },
  });

  return NextResponse.json({ team });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findFirst({ where: { ownerId: session.id } });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : team.name;

  const updated = await prisma.team.update({ where: { id: team.id }, data: { name } });
  return NextResponse.json({ team: updated });
}
