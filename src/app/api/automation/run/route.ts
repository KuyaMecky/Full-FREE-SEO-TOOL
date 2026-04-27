import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runContentAutomation } from "@/lib/automation/orchestrator";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const automationId = body.automationId;

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
    const result = await runContentAutomation(automationId);
    return NextResponse.json({ result });
  } catch (err) {
    console.error("Automation run failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Run failed" },
      { status: 500 }
    );
  }
}
