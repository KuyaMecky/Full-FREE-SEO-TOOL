import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getValidAccessToken } from "@/lib/gsc/tokens";
import { listGa4Properties, getGa4Overview, getGa4TopPages } from "@/lib/ga4/client";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId"); // e.g. "properties/123456789"
  const action = searchParams.get("action") ?? "properties";

  try {
    const token = await getValidAccessToken(session.id);

    if (action === "properties") {
      const properties = await listGa4Properties(token);
      return NextResponse.json({ properties });
    }

    if (action === "overview" && propertyId) {
      const start = searchParams.get("start") ?? "28daysAgo";
      const end = searchParams.get("end") ?? "today";
      const data = await getGa4Overview(token, propertyId, start, end);
      return NextResponse.json(data);
    }

    if (action === "top-pages" && propertyId) {
      const pages = await getGa4TopPages(token, propertyId);
      return NextResponse.json({ pages });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    if (msg.includes("NO_GOOGLE_ACCOUNT")) return NextResponse.json({ error: "Google account not connected" }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
