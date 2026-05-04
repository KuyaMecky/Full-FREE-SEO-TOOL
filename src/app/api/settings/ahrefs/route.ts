import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getAhrefsConfigStatus,
  saveAhrefsApiKey,
  clearAhrefsApiKey,
} from "@/lib/ahrefs/config";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getAhrefsConfigStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Failed to get Ahrefs config:", error);
    return NextResponse.json(
      { error: "Failed to get config" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "apiKey is required" },
        { status: 400 }
      );
    }

    await saveAhrefsApiKey(apiKey);
    const status = await getAhrefsConfigStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("Failed to save Ahrefs API key:", err);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await clearAhrefsApiKey();
    const status = await getAhrefsConfigStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("Failed to clear Ahrefs API key:", err);
    return NextResponse.json(
      { error: "Failed to clear config" },
      { status: 500 }
    );
  }
}
