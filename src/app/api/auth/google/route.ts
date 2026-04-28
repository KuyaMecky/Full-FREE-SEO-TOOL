import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, setAuthCookie } from "@/lib/auth";
import axios from "axios";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");

  if (!code) {
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    return NextResponse.redirect(authUrl);
  }

  try {
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }
    );

    const { id_token } = tokenResponse.data;

    if (!id_token) {
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }

    const userResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v1/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
      }
    );

    const googleUser = userResponse.data;
    const email = googleUser.email;
    const name = googleUser.name;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          oauthProvider: "google",
          oauthId: googleUser.id,
        },
      });
    } else if (!user.oauthProvider) {
      user = await prisma.user.update({
        where: { email },
        data: {
          oauthProvider: "google",
          oauthId: googleUser.id,
        },
      });
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    await setAuthCookie(token);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
