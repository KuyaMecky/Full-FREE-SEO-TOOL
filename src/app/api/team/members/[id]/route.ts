import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const member = await prisma.teamMember.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.team.ownerId !== session.id && member.userId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const role = body?.role === "leader" ? "leader" : "member";

  const member = await prisma.teamMember.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (member.team.ownerId !== session.id) {
    return NextResponse.json({ error: "Only the team owner can change roles" }, { status: 403 });
  }

  const updated = await prisma.teamMember.update({ where: { id }, data: { role } });
  return NextResponse.json({ member: updated });
}
