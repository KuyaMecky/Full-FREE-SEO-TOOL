import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, setAuthCookie } from "@/lib/auth";
import axios from "axios";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || "";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    const authUrl = new URL("https://github.com/login/oauth/authorize");
    authUrl.searchParams.set("client_id", GITHUB_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GITHUB_REDIRECT_URI);
    authUrl.searchParams.set("scope", "user:email");
    authUrl.searchParams.set("state", Math.random().toString(36).slice(2));
    return NextResponse.redirect(authUrl);
  }

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
    }

    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = userResponse.data;
    const email = githubUser.email || `${githubUser.login}@github.local`;
    const name = githubUser.name || githubUser.login;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          oauthProvider: "github",
          oauthId: String(githubUser.id),
        },
      });
    } else if (!user.oauthProvider) {
      user = await prisma.user.update({
        where: { email },
        data: {
          oauthProvider: "github",
          oauthId: String(githubUser.id),
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
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }
}
