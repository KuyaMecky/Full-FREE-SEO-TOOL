import { prisma } from "@/lib/db";

const SETTING_KEYS = {
  clientId: "google_oauth_client_id",
  clientSecret: "google_oauth_client_secret",
  redirectUri: "google_oauth_redirect_uri",
} as const;

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  source: "db" | "env" | "mixed";
}

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.settings.findUnique({ where: { key } });
  return row?.value || null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

async function deleteSetting(key: string): Promise<void> {
  await prisma.settings
    .delete({ where: { key } })
    .catch(() => {
      // nothing to delete
    });
}

export function getDefaultRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/api/google/callback`;
}

export async function getGoogleOAuthConfig(): Promise<GoogleOAuthConfig | null> {
  const [dbClientId, dbClientSecret, dbRedirect] = await Promise.all([
    readSetting(SETTING_KEYS.clientId),
    readSetting(SETTING_KEYS.clientSecret),
    readSetting(SETTING_KEYS.redirectUri),
  ]);

  const clientId = dbClientId || process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = dbClientSecret || process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri =
    dbRedirect ||
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    getDefaultRedirectUri();

  if (!clientId || !clientSecret) {
    return null;
  }

  const allFromDb = Boolean(dbClientId && dbClientSecret);
  const allFromEnv = Boolean(
    !dbClientId && !dbClientSecret && process.env.GOOGLE_CLIENT_ID
  );
  const source: GoogleOAuthConfig["source"] = allFromDb
    ? "db"
    : allFromEnv
      ? "env"
      : "mixed";

  return { clientId, clientSecret, redirectUri, source };
}

export async function saveGoogleOAuthConfig(input: {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
}): Promise<void> {
  await Promise.all([
    writeSetting(SETTING_KEYS.clientId, input.clientId.trim()),
    writeSetting(SETTING_KEYS.clientSecret, input.clientSecret.trim()),
    input.redirectUri
      ? writeSetting(SETTING_KEYS.redirectUri, input.redirectUri.trim())
      : Promise.resolve(),
  ]);
}

export async function clearGoogleOAuthConfig(): Promise<void> {
  await Promise.all([
    deleteSetting(SETTING_KEYS.clientId),
    deleteSetting(SETTING_KEYS.clientSecret),
    deleteSetting(SETTING_KEYS.redirectUri),
  ]);
}

export interface GoogleConfigStatus {
  configured: boolean;
  source: "db" | "env" | "mixed" | null;
  redirectUri: string;
  // Only masked preview — never return the full secret
  clientIdPreview: string | null;
  clientSecretMasked: boolean;
}

export async function getGoogleConfigStatus(): Promise<GoogleConfigStatus> {
  const cfg = await getGoogleOAuthConfig();
  if (!cfg) {
    return {
      configured: false,
      source: null,
      redirectUri: getDefaultRedirectUri(),
      clientIdPreview: null,
      clientSecretMasked: false,
    };
  }
  return {
    configured: true,
    source: cfg.source,
    redirectUri: cfg.redirectUri,
    clientIdPreview:
      cfg.clientId.length > 12
        ? `${cfg.clientId.slice(0, 8)}…${cfg.clientId.slice(-4)}`
        : cfg.clientId,
    clientSecretMasked: true,
  };
}
