import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { saveAIConfig } from "@/lib/ai/config";

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(appUrl("/login"));
  }

  const code = request.nextUrl.searchParams.get("code");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      appUrl(
        `/settings/integrations/ai?error=${encodeURIComponent(errorParam)}`
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      appUrl("/settings/integrations/ai?error=missing_code")
    );
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get("openrouter-pkce-verifier")?.value;
  cookieStore.delete("openrouter-pkce-verifier");

  if (!verifier) {
    return NextResponse.redirect(
      appUrl("/settings/integrations/ai?error=pkce_state_missing")
    );
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        code_verifier: verifier,
        code_challenge_method: "S256",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("OpenRouter PKCE exchange failed:", res.status, text);
      return NextResponse.redirect(
        appUrl("/settings/integrations/ai?error=exchange_failed")
      );
    }

    const data = (await res.json()) as { key?: string; user_id?: string };
    if (!data.key) {
      return NextResponse.redirect(
        appUrl("/settings/integrations/ai?error=no_key_returned")
      );
    }

    await saveAIConfig({ provider: "openrouter", apiKey: data.key });

    return NextResponse.redirect(
      appUrl("/settings/integrations/ai?connected=openrouter")
    );
  } catch (err) {
    console.error("OpenRouter callback failed:", err);
    return NextResponse.redirect(
      appUrl("/settings/integrations/ai?error=oauth_failed")
    );
  }
}
