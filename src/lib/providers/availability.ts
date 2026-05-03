import { prisma } from "@/lib/db";

export type AvailableProviders = {
  google: boolean;
  ahrefs: boolean;
  pagespeed: boolean;
};

export async function getAvailableProviders(userId: string): Promise<AvailableProviders> {
  try {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    const googleAccount = await prisma.googleAccount.findUnique({
      where: { userId },
    });

    return {
      google: !!googleAccount?.accessToken,
      ahrefs: !!settings?.ahrefsApiKey,
      pagespeed: !!settings?.pagespeedApiKey,
    };
  } catch (error) {
    console.error("Failed to check provider availability:", error);
    return {
      google: false,
      ahrefs: false,
      pagespeed: false,
    };
  }
}

export function hasAnyProvider(providers: AvailableProviders): boolean {
  return providers.google || providers.ahrefs || providers.pagespeed;
}

export function hasAllProviders(providers: AvailableProviders): boolean {
  return providers.google && providers.ahrefs && providers.pagespeed;
}

export function getProviderStatus(providers: AvailableProviders): string {
  const enabled = Object.entries(providers)
    .filter(([_, available]) => available)
    .map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

  if (enabled.length === 0) return "No providers configured";
  return `Connected: ${enabled.join(", ")}`;
}
