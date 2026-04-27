import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        name: true,
        url: true,
        event: true,
        active: true,
        lastFiredAt: true,
        lastError: true,
        failCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Failed to fetch webhooks:", error);
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { name, url, event, secret } = body;

    if (!name || !url || !event) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        userId: session.id,
        name,
        url,
        event,
        secret: secret || null,
        active: true,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
