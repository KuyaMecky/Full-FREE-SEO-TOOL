import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getPagespeedConfigStatus,
  savePagespeedApiKey,
  clearPagespeedApiKey,
} from "@/lib/pagespeed/config";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const status = await getPagespeedConfigStatus();
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const apiKey =
      typeof body?.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "apiKey is required" },
        { status: 400 }
      );
    }
    await savePagespeedApiKey(apiKey);
    const status = await getPagespeedConfigStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("Failed to save PSI key:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await clearPagespeedApiKey();
  const status = await getPagespeedConfigStatus();
  return NextResponse.json(status);
}
