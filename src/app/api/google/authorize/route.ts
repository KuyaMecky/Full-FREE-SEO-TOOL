import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/gsc/oauth";
import { getGoogleOAuthConfig } from "@/lib/gsc/config";

function appUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}${path}`;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(appUrl("/login"));
  }

  const cfg = await getGoogleOAuthConfig();
  if (!cfg) {
    return NextResponse.redirect(
      appUrl("/properties?error=google_not_configured")
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("google-oauth-state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  try {
    const authUrl = await buildAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.error("Google authorize failed:", err);
    return NextResponse.redirect(appUrl("/properties?error=oauth_setup_failed"));
  }
}
