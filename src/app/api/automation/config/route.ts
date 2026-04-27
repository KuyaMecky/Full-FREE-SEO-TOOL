import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const automation = await prisma.contentAutomation.findUnique({
    where: { propertyId },
    include: { property: true, wpConnection: true },
  });

  if (!automation || automation.userId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ automation });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const propertyId = body.propertyId;

  if (!propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }

  const property = await prisma.gscProperty.findUnique({
    where: { id: propertyId },
  });

  if (!property || property.userId !== session.id) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  // Check if automation already exists
  let automation = await prisma.contentAutomation.findUnique({
    where: { propertyId },
  });

  if (automation) {
    // Update existing
    automation = await prisma.contentAutomation.update({
      where: { propertyId },
      data: {
        enabled: body.enabled ?? automation.enabled,
        autoGenerateIdeas: body.autoGenerateIdeas ?? automation.autoGenerateIdeas,
        autoDraftIdeas: body.autoDraftIdeas ?? automation.autoDraftIdeas,
        autoWriteContent: body.autoWriteContent ?? automation.autoWriteContent,
        autoSchedulePublish: body.autoSchedulePublish ?? automation.autoSchedulePublish,
        maxDraftsPerRun: body.maxDraftsPerRun ?? automation.maxDraftsPerRun,
        businessType: body.businessType ?? automation.businessType,
        seedTopics: JSON.stringify(body.seedTopics || JSON.parse(automation.seedTopics)),
        wpConnectionId: body.wpConnectionId ?? automation.wpConnectionId,
        scheduleAfterDays: body.scheduleAfterDays ?? automation.scheduleAfterDays,
        scheduledDayOfWeek: body.scheduledDayOfWeek ?? automation.scheduledDayOfWeek,
        scheduledHourUtc: body.scheduledHourUtc ?? automation.scheduledHourUtc,
      },
      include: { property: true, wpConnection: true },
    });
  } else {
    // Create new
    automation = await prisma.contentAutomation.create({
      data: {
        userId: session.id,
        propertyId,
        enabled: body.enabled ?? true,
        autoGenerateIdeas: body.autoGenerateIdeas ?? true,
        autoDraftIdeas: body.autoDraftIdeas ?? true,
        autoWriteContent: body.autoWriteContent ?? true,
        autoSchedulePublish: body.autoSchedulePublish ?? false,
        maxDraftsPerRun: body.maxDraftsPerRun ?? 5,
        businessType: body.businessType ?? "",
        seedTopics: JSON.stringify(body.seedTopics ?? []),
        wpConnectionId: body.wpConnectionId ?? null,
        scheduleAfterDays: body.scheduleAfterDays ?? 7,
        scheduledDayOfWeek: body.scheduledDayOfWeek ?? null,
        scheduledHourUtc: body.scheduledHourUtc ?? null,
      },
      include: { property: true, wpConnection: true },
    });
  }

  return NextResponse.json({ automation });
}
