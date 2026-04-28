import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, apiKey } = body;

    // Generate API key if not provided
    if (!apiKey && email && password) {
      // This would be for internal key generation
      // For now, return error
      return NextResponse.json(
        { error: "Use the dashboard to generate API keys" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
