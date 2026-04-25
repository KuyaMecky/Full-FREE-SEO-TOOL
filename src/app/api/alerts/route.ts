import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rules = await prisma.alertRule.findMany({ where: { userId: session.id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ rules });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : null;
  const metric = typeof body?.metric === "string" ? body.metric : null;
  const operator = typeof body?.operator === "string" ? body.operator : null;
  const threshold = typeof body?.threshold === "number" ? body.threshold : null;
  const propertyId = typeof body?.propertyId === "string" ? body.propertyId : null;

  if (!name || !metric || !operator || threshold == null) {
    return NextResponse.json({ error: "name, metric, operator and threshold are required" }, { status: 400 });
  }

  const rule = await prisma.alertRule.create({
    data: { userId: session.id, propertyId, name, metric, operator, threshold },
  });
  return NextResponse.json({ rule });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  const rule = await prisma.alertRule.findUnique({ where: { id } });
  if (!rule || rule.userId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.alertRule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const rule = await prisma.alertRule.findUnique({ where: { id } });
  if (!rule || rule.userId !== session.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.alertRule.update({
    where: { id },
    data: { enabled: typeof body?.enabled === "boolean" ? body.enabled : rule.enabled },
  });
  return NextResponse.json({ rule: updated });
}
