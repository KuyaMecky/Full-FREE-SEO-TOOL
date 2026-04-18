import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  AI_PROVIDERS,
  AIProvider,
  DEFAULT_MODELS,
  getAIConfigStatus,
  saveAIConfig,
  clearAIProviderKey,
} from "@/lib/ai/config";

function isProvider(v: unknown): v is AIProvider {
  return typeof v === "string" && (AI_PROVIDERS as string[]).includes(v);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getAIConfigStatus();
  return NextResponse.json({ ...status, defaultModels: DEFAULT_MODELS });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { provider, apiKey, model } = body as {
      provider?: unknown;
      apiKey?: unknown;
      model?: unknown;
    };

    if (!isProvider(provider)) {
      return NextResponse.json(
        { error: "provider must be anthropic, openai, or gemini" },
        { status: 400 }
      );
    }

    await saveAIConfig({
      provider,
      apiKey: typeof apiKey === "string" ? apiKey : undefined,
      model: typeof model === "string" ? model : undefined,
    });

    const status = await getAIConfigStatus();
    return NextResponse.json({ ...status, defaultModels: DEFAULT_MODELS });
  } catch (err) {
    console.error("Failed to save AI config:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = request.nextUrl.searchParams.get("provider");
  if (!isProvider(provider)) {
    return NextResponse.json({ error: "provider required" }, { status: 400 });
  }

  await clearAIProviderKey(provider);
  const status = await getAIConfigStatus();
  return NextResponse.json({ ...status, defaultModels: DEFAULT_MODELS });
}
