import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exchangeCodeForTokens, fetchGoogleUserinfo } from "@/lib/gsc/oauth";

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
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(
      appUrl(`/properties?error=${encodeURIComponent(errorParam)}`)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(appUrl("/properties?error=missing_code"));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google-oauth-state")?.value;
  cookieStore.delete("google-oauth-state");

  if (!expectedState || expectedState !== state) {
    return NextResponse.redirect(appUrl("/properties?error=bad_state"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const userinfo = await fetchGoogleUserinfo(tokens.access_token);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    if (!tokens.refresh_token) {
      // This can happen if the user previously authorized and Google didn't
      // return a new refresh_token. We required prompt=consent, so this is
      // unusual — fail loud instead of silently dropping it.
      return NextResponse.redirect(
        appUrl("/properties?error=no_refresh_token")
      );
    }

    await prisma.googleAccount.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        googleEmail: userinfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope ?? "",
      },
      update: {
        googleEmail: userinfo.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope ?? "",
      },
    });

    return NextResponse.redirect(appUrl("/properties/connect"));
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    return NextResponse.redirect(appUrl("/properties?error=oauth_failed"));
  }
}
