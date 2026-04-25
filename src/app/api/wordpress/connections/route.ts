import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { testConnection } from "@/lib/wordpress/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await prisma.wordPressConnection.findMany({
    where: { userId: session.id },
    select: {
      id: true,
      label: true,
      siteUrl: true,
      username: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ connections });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const label = typeof body?.label === "string" ? body.label.trim() : "My WordPress Site";
  const siteUrl = typeof body?.siteUrl === "string" ? body.siteUrl.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const appPassword = typeof body?.appPassword === "string" ? body.appPassword.trim() : "";

  if (!siteUrl || !username || !appPassword) {
    return NextResponse.json({ error: "siteUrl, username and appPassword are required" }, { status: 400 });
  }

  const result = await testConnection(siteUrl, username, appPassword);
  if (!result.ok) {
    return NextResponse.json({ error: `Connection test failed: ${result.error}` }, { status: 400 });
  }

  const conn = await prisma.wordPressConnection.create({
    data: { userId: session.id, label, siteUrl, username, appPassword },
    select: { id: true, label: true, siteUrl: true, username: true, createdAt: true },
  });

  return NextResponse.json({ connection: conn, displayName: result.displayName });
}
