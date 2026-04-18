import { prisma } from "@/lib/db";
import { refreshAccessToken } from "./oauth";

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh if within 5 min of expiry

export async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.googleAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error("NO_GOOGLE_ACCOUNT");
  }

  const now = Date.now();
  const expiresAtMs = account.tokenExpiresAt.getTime();

  if (expiresAtMs - now > REFRESH_BUFFER_MS) {
    return account.accessToken;
  }

  const fresh = await refreshAccessToken(account.refreshToken);
  const newExpiresAt = new Date(Date.now() + fresh.expires_in * 1000);

  await prisma.googleAccount.update({
    where: { id: account.id },
    data: {
      accessToken: fresh.access_token,
      tokenExpiresAt: newExpiresAt,
      // Google only returns a new refresh_token on first consent; keep old one if missing
      refreshToken: fresh.refresh_token ?? account.refreshToken,
      scope: fresh.scope ?? account.scope,
    },
  });

  return fresh.access_token;
}
