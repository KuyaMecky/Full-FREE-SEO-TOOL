import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const properties = await prisma.gscProperty.findMany({
    where: { userId: session.id },
    orderBy: { addedAt: "desc" },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: {
          totalImpressions: true,
          totalClicks: true,
          avgCtr: true,
          avgPosition: true,
          fetchedAt: true,
          byDate: true,
        },
      },
    },
  });

  const result = properties.map((p: typeof properties[number]) => {
    const snap = p.snapshots[0];
    return {
      id: p.id,
      siteUrl: p.siteUrl,
      permissionLevel: p.permissionLevel,
      addedAt: p.addedAt,
      latestSnapshot: snap
        ? {
            totalImpressions: snap.totalImpressions,
            totalClicks: snap.totalClicks,
            avgCtr: snap.avgCtr,
            avgPosition: snap.avgPosition,
            fetchedAt: snap.fetchedAt,
            byDate: JSON.parse(snap.byDate || "[]") as Array<{
              date: string;
              impressions: number;
              clicks: number;
              ctr: number;
              position: number;
            }>,
          }
        : null,
    };
  });

  return NextResponse.json({ properties: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { siteUrl } = body as { siteUrl?: string };

    if (!siteUrl) {
      return NextResponse.json(
        { error: "siteUrl is required" },
        { status: 400 }
      );
    }

    const account = await prisma.googleAccount.findUnique({
      where: { userId: session.id },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Connect a Google account first" },
        { status: 400 }
      );
    }

    const property = await prisma.gscProperty.upsert({
      where: {
        googleAccountId_siteUrl: {
          googleAccountId: account.id,
          siteUrl,
        },
      },
      create: {
        userId: session.id,
        googleAccountId: account.id,
        siteUrl,
        permissionLevel: "",
      },
      update: {},
    });

    return NextResponse.json({ property });
  } catch (err) {
    console.error("Failed to add property:", err);
    return NextResponse.json(
      { error: "Failed to add property" },
      { status: 500 }
    );
  }
}
