import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { testConnection } from "@/lib/wordpress/client";

async function getOwned(id: string, userId: string) {
  const conn = await prisma.wordPressConnection.findUnique({ where: { id } });
  if (!conn || conn.userId !== userId) return null;
  return conn;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conn = await getOwned(id, session.id);
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.wordPressConnection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conn = await getOwned(id, session.id);
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await testConnection(conn.siteUrl, conn.username, conn.appPassword);
  return NextResponse.json(result);
}
