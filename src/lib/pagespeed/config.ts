import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getPagespeedConfigStatus() {
  const session = await getSession();
  if (!session?.id) {
    return { configured: false };
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: { pagespeedApiKey: true },
    });

    const configured = !!settings?.pagespeedApiKey;
    return {
      configured,
      source: configured ? "db" : null,
      keyPreview: configured ? "***" : null,
    };
  } catch (error) {
    console.error("Failed to get PageSpeed config:", error);
    return { configured: false };
  }
}

export async function getPagespeedApiKey(): Promise<string | null> {
  const session = await getSession();
  if (!session?.id) {
    return null;
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: { pagespeedApiKey: true },
    });

    return settings?.pagespeedApiKey || null;
  } catch (error) {
    console.error("Failed to get PageSpeed API key:", error);
    return null;
  }
}

export async function savePagespeedApiKey(apiKey: string) {
  const session = await getSession();
  if (!session?.id) {
    throw new Error("Unauthorized");
  }

  if (!apiKey || typeof apiKey !== "string") {
    throw new Error("Invalid API key");
  }

  try {
    await prisma.userSettings.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        pagespeedApiKey: apiKey,
      },
      update: {
        pagespeedApiKey: apiKey,
      },
    });

    return { success: true, configured: true };
  } catch (error) {
    console.error("Failed to save PageSpeed API key:", error);
    throw error;
  }
}

export async function clearPagespeedApiKey() {
  const session = await getSession();
  if (!session?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.userSettings.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        pagespeedApiKey: null,
      },
      update: {
        pagespeedApiKey: null,
      },
    });

    return { success: true, configured: false };
  } catch (error) {
    console.error("Failed to clear PageSpeed API key:", error);
    throw error;
  }
}
