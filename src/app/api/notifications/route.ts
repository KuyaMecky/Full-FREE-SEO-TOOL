import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;

  if (id) {
    await prisma.notification.updateMany({ where: { id, userId: session.id }, data: { read: true } });
  } else {
    await prisma.notification.updateMany({ where: { userId: session.id, read: false }, data: { read: true } });
  }

  return NextResponse.json({ ok: true });
}
