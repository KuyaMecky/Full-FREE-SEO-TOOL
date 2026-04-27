import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runContentAutomation } from "@/lib/automation/orchestrator";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const hour = now.getUTCHours();

  // Find automations that should run now
  const automations = await prisma.contentAutomation.findMany({
    where: {
      enabled: true,
      AND: [
        {
          OR: [
            { scheduledDayOfWeek: dayOfWeek, scheduledHourUtc: hour },
            { scheduledDayOfWeek: null, scheduledHourUtc: null },
          ],
        },
        {
          OR: [
            {
              lastRunAt: {
                lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
            { lastRunAt: null },
          ],
        },
      ],
    },
  });

  const results = [];
  for (const automation of automations) {
    try {
      const result = await runContentAutomation(automation.id);
      results.push({
        automationId: automation.id,
        success: result.success,
        itemsProcessed: result.itemsProcessed,
        itemsFailed: result.itemsFailed,
      });
    } catch (e) {
      results.push({
        automationId: automation.id,
        success: false,
        error: e instanceof Error ? e.message : "Failed",
      });
    }
  }

  return NextResponse.json({
    ran: automations.length,
    results,
  });
}
