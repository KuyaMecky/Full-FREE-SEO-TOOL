import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getGoogleConfigStatus,
  saveGoogleOAuthConfig,
  clearGoogleOAuthConfig,
} from "@/lib/gsc/config";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getGoogleConfigStatus();
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientId, clientSecret, redirectUri } = body as {
      clientId?: string;
      clientSecret?: string;
      redirectUri?: string;
    };

    if (
      !clientId ||
      !clientSecret ||
      typeof clientId !== "string" ||
      typeof clientSecret !== "string"
    ) {
      return NextResponse.json(
        { error: "clientId and clientSecret are required" },
        { status: 400 }
      );
    }

    await saveGoogleOAuthConfig({
      clientId,
      clientSecret,
      redirectUri: typeof redirectUri === "string" ? redirectUri : undefined,
    });

    const status = await getGoogleConfigStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("Failed to save Google OAuth config:", err);
    return NextResponse.json(
      { error: "Failed to save config" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await clearGoogleOAuthConfig();
  const status = await getGoogleConfigStatus();
  return NextResponse.json(status);
}
