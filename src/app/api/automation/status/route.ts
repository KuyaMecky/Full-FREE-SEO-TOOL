import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAutomationStatus } from "@/lib/automation/orchestrator";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const automationId = searchParams.get("automationId");

  if (!automationId) {
    return NextResponse.json({ error: "automationId required" }, { status: 400 });
  }

  const automation = await prisma.contentAutomation.findUnique({
    where: { id: automationId },
  });

  if (!automation || automation.userId !== session.id) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  }

  try {
    const status = await getAutomationStatus(automationId);
    return NextResponse.json(status);
  } catch (err) {
    console.error("Status fetch failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch status" },
      { status: 500 }
    );
  }
}
