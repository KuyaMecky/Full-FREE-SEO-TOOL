import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findFirst({ where: { ownerId: session.id } });
  if (!team) return NextResponse.json({ error: "You must create a team first" }, { status: 400 });

  const body = await request.json();
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === "leader" ? "leader" : "member";

  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  // Check if already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: existingUser.id } },
    });
    if (alreadyMember) return NextResponse.json({ error: "User is already a team member" }, { status: 400 });
  }

  // Upsert invite (resend if pending)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await prisma.teamInvite.upsert({
    where: { token: `${team.id}:${email}`.replace(/[^a-zA-Z0-9:]/g, "") },
    create: {
      teamId: team.id,
      email,
      role,
      expiresAt,
      token: `${team.id}-${email}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, ""),
    },
    update: { status: "pending", role, expiresAt },
  });

  // Auto-accept if user already exists in the system
  if (existingUser) {
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: existingUser.id, role },
    });
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });
    return NextResponse.json({ invite, autoAccepted: true, user: { name: existingUser.name, email: existingUser.email } });
  }

  return NextResponse.json({ invite, autoAccepted: false });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("id") ?? "";

  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: true },
  });
  if (!invite || invite.team.ownerId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.teamInvite.delete({ where: { id: inviteId } });
  return NextResponse.json({ ok: true });
}
