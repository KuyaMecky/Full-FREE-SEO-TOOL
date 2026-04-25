import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.id } });

  return NextResponse.json({
    settings: settings
      ? { ...settings, aiApiKey: settings.aiApiKey ? "••••••••" : null }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (typeof body?.aiProvider === "string") data.aiProvider = body.aiProvider || null;
  if (typeof body?.aiApiKey === "string" && !body.aiApiKey.startsWith("••")) data.aiApiKey = body.aiApiKey || null;
  if (typeof body?.aiModel === "string") data.aiModel = body.aiModel || null;
  if (typeof body?.emailAlerts === "boolean") data.emailAlerts = body.emailAlerts;
  if (typeof body?.alertEmail === "string") data.alertEmail = body.alertEmail || null;
  if (typeof body?.rankDropThreshold === "number") data.rankDropThreshold = body.rankDropThreshold;

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.id },
    create: { userId: session.id, ...data },
    update: data,
  });

  return NextResponse.json({ settings: { ...settings, aiApiKey: settings.aiApiKey ? "••••••••" : null } });
}
