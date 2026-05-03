import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAvailableProviders } from "@/lib/providers/availability";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = await getAvailableProviders(session.id);
    return NextResponse.json(providers);
  } catch (error) {
    console.error("Provider status error:", error);
    return NextResponse.json({ error: "Failed to check providers" }, { status: 500 });
  }
}
