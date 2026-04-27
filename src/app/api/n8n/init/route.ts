import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Check if n8n is running
    const healthCheck = await fetch(`${N8N_URL}/api/health`).catch(() => null);

    if (!healthCheck?.ok) {
      return NextResponse.json(
        { error: "n8n is not running. Please start n8n service." },
        { status: 503 }
      );
    }

    // Create default audit webhook if it doesn't exist
    try {
      const webhooksRes = await fetch(`${N8N_URL}/api/webhooks`);
      const webhooks = await webhooksRes.json();

      const auditWebhookExists = webhooks.some(
        (w: any) => w.path === "audit-event"
      );

      if (!auditWebhookExists) {
        await fetch(`${N8N_URL}/api/webhooks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "audit-event",
            method: "POST",
            isActive: true,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to create default webhook:", error);
      // Continue anyway, webhook creation is optional
    }

    return NextResponse.json({
      success: true,
      message: "n8n initialized successfully",
      n8nUrl: N8N_URL,
    });
  } catch (error) {
    console.error("n8n init error:", error);
    return NextResponse.json(
      { error: "Failed to initialize n8n" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const healthCheck = await fetch(`${N8N_URL}/api/health`).catch(() => null);

    if (!healthCheck?.ok) {
      return NextResponse.json(
        {
          running: false,
          message: "n8n service is not available",
          n8nUrl: N8N_URL,
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      running: true,
      message: "n8n is running",
      n8nUrl: N8N_URL,
    });
  } catch (error) {
    return NextResponse.json(
      { running: false, error: "Failed to check n8n status" },
      { status: 500 }
    );
  }
}
