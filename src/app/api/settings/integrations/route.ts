import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: {
        aiProvider: true,
        aiModel: true,
        ahrefsApiKey: true,
        pagespeedApiKey: true,
      },
    });

    const googleAccount = await prisma.googleAccount.findUnique({
      where: { userId: session.id },
      select: { googleEmail: true },
    });

    return NextResponse.json({
      google: !!googleAccount,
      googleEmail: googleAccount?.googleEmail,
      aiProvider: settings?.aiProvider,
      aiModel: settings?.aiModel,
      ahrefsApiKey: settings?.ahrefsApiKey ? '***' : null,
      pagespeedApiKey: settings?.pagespeedApiKey ? '***' : null,
    });
  } catch (error) {
    console.error("Failed to get integrations:", error);
    return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ahrefsApiKey, pagespeedApiKey, aiProvider, aiModel } = body;

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        ahrefsApiKey: ahrefsApiKey || null,
        pagespeedApiKey: pagespeedApiKey || null,
        aiProvider,
        aiModel,
      },
      update: {
        ...(ahrefsApiKey !== undefined && { ahrefsApiKey: ahrefsApiKey || null }),
        ...(pagespeedApiKey !== undefined && { pagespeedApiKey: pagespeedApiKey || null }),
        ...(aiProvider && { aiProvider }),
        ...(aiModel && { aiModel }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Integrations updated",
    });
  } catch (error) {
    console.error("Failed to update integrations:", error);
    return NextResponse.json({ error: "Failed to update integrations" }, { status: 500 });
  }
}
