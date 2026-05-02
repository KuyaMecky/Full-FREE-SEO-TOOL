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
      select: { id: true },
    });

    // Don't expose the actual API key, just whether it's set
    if (!settings) {
      return { configured: false };
    }

    // Check if API key exists by trying to fetch it from env or user record
    // For now, we'll store it in user settings later
    return { configured: false };
  } catch (error) {
    console.error("Failed to get Ahrefs config:", error);
    return { configured: false };
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
    // Store in environment or database
    // For now, we'll use the environment variable
    // In production, you'd want to encrypt and store this securely
    process.env.AHREFS_API_KEY = apiKey;

    // Optionally, update user settings to mark that Ahrefs is configured
    await prisma.userSettings.upsert({
      where: { userId: session.id },
      update: {},
      create: { userId: session.id },
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
    delete process.env.AHREFS_API_KEY;
    return { success: true, configured: false };
  } catch (error) {
    console.error("Failed to clear Ahrefs API key:", error);
    throw error;
  }
}
