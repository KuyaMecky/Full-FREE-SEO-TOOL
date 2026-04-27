import { prisma } from "@/lib/db";
import crypto from "crypto";

export type WebhookEvent = "audit_complete" | "findings_generated" | "report_generated";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

export async function triggerWebhook(
  userId: string,
  event: WebhookEvent,
  data: any
) {
  try {
    // Find all active webhooks for this user and event
    const webhooks = await prisma.webhook.findMany({
      where: {
        userId,
        event,
        active: true,
      },
    });

    console.log(`Found ${webhooks.length} webhooks for event ${event}`);

    // Fire each webhook
    for (const webhook of webhooks) {
      fireWebhookAsync(webhook, event, data).catch((error) => {
        console.error(`Webhook ${webhook.id} failed:`, error);
      });
    }
  } catch (error) {
    console.error("Failed to trigger webhooks:", error);
  }
}

async function fireWebhookAsync(
  webhook: any,
  event: WebhookEvent,
  data: any
) {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const body = JSON.stringify(payload);

  // Generate HMAC signature if secret is provided
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": event,
    "X-Webhook-Timestamp": payload.timestamp,
  };

  if (webhook.secret) {
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  // Add custom headers if provided
  if (webhook.headers) {
    try {
      const customHeaders = JSON.parse(webhook.headers);
      Object.assign(headers, customHeaders);
    } catch (e) {
      console.error("Failed to parse custom headers:", e);
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update webhook success
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastFiredAt: new Date(),
        lastError: null,
        failCount: 0,
      },
    });

    console.log(`Webhook ${webhook.id} fired successfully`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`Webhook ${webhook.id} failed:`, errorMessage);

    // Update webhook failure
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastError: errorMessage,
        failCount: { increment: 1 },
        // Disable after 10 failures
        active: (webhook.failCount || 0) < 10,
      },
    });
  }
}
