import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getAhrefsConfigStatus() {
  const session = await getSession();
  if (!session?.id) {
    return { configured: false };
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: { ahrefsApiKey: true },
    });

    const configured = !!settings?.ahrefsApiKey;
    return {
      configured,
      source: configured ? "db" : null,
    };
  } catch (error) {
    console.error("Failed to get Ahrefs config:", error);
    return { configured: false };
  }
}

export async function getAhrefsApiKey(): Promise<string | null> {
  const session = await getSession();
  if (!session?.id) {
    return null;
  }

  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.id },
      select: { ahrefsApiKey: true },
    });

    return settings?.ahrefsApiKey || null;
  } catch (error) {
    console.error("Failed to get Ahrefs API key:", error);
    return null;
  }
}

export async function saveAhrefsApiKey(apiKey: string) {
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
        ahrefsApiKey: apiKey,
      },
      update: {
        ahrefsApiKey: apiKey,
      },
    });

    return { success: true, configured: true };
  } catch (error) {
    console.error("Failed to save Ahrefs API key:", error);
    throw error;
  }
}

export async function clearAhrefsApiKey() {
  const session = await getSession();
  if (!session?.id) {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.userSettings.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        ahrefsApiKey: null,
      },
      update: {
        ahrefsApiKey: null,
      },
    });

    return { success: true, configured: false };
  } catch (error) {
    console.error("Failed to clear Ahrefs API key:", error);
    throw error;
  }
}
