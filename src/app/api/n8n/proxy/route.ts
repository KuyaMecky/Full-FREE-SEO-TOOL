import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const N8N_URL = process.env.N8N_URL || "http://localhost:5678";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/n8n/proxy", "");
    const queryString = url.search;

    const response = await fetch(`${N8N_URL}/api${path}${queryString}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("n8n proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from n8n" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/n8n/proxy", "");
    const body = await request.json();

    const response = await fetch(`${N8N_URL}/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("n8n proxy error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with n8n" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/n8n/proxy", "");
    const body = await request.json();

    const response = await fetch(`${N8N_URL}/api${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("n8n proxy error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with n8n" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace("/api/n8n/proxy", "");

    const response = await fetch(`${N8N_URL}/api${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("n8n proxy error:", error);
    return NextResponse.json(
      { error: "Failed to communicate with n8n" },
      { status: 500 }
    );
  }
}
