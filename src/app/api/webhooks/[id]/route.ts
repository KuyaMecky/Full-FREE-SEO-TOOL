import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { triggerWebhook } from "@/lib/webhooks/trigger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook || webhook.userId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook || webhook.userId !== session.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, url, event, active, secret } = body;

    const updated = await prisma.webhook.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(url && { url }),
        ...(event && { event }),
        ...(active !== undefined && { active }),
        ...(secret && { secret }),
      },
    });

    return NextResponse.json({ webhook: updated });
  } catch (error) {
    console.error("Failed to update webhook:", error);
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 });
  }
}
