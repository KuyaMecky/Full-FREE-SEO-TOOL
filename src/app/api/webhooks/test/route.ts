import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { webhookId } = body;

    if (!webhookId) {
      return NextResponse.json({ error: "webhookId required" }, { status: 400 });
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook || webhook.userId !== session.id) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Send test payload
    const testPayload = {
      event: webhook.event,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: "This is a test webhook from SEO Audit Pro",
        domain: "example.com",
        overallScore: 85,
        findingsCount: 5,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": webhook.event,
        "X-Webhook-Test": "true",
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: response.status,
          error: response.statusText,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      message: "Test webhook sent successfully",
    });
  } catch (error) {
    console.error("Failed to test webhook:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send test webhook",
      },
      { status: 500 }
    );
  }
}
