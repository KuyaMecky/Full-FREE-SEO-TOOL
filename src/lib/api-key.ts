import crypto from "crypto";
import { prisma } from "./db";

const API_KEY_PREFIX = "seo_";
const API_KEY_LENGTH = 32;

export function generateApiKey(): { key: string; prefix: string } {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH).toString("hex");
  const prefix = `${API_KEY_PREFIX}${randomBytes.slice(0, 8)}`;
  const key = `${prefix}_${randomBytes.slice(8)}`;
  return { key, prefix };
}

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(
  key: string
): Promise<{ userId: string; keyId: string } | null> {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: { userId: true, id: true, revokedAt: true },
  });

  if (!apiKey || apiKey.revokedAt) {
    return null;
  }

  await prisma.apiKey.update({
    where: { keyHash },
    data: { lastUsedAt: new Date() },
  });

  return { userId: apiKey.userId, keyId: apiKey.id };
}

export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; keyId: string }> {
  const { key, prefix } = generateApiKey();
  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      prefix,
      keyHash,
    },
    select: { id: true },
  });

  return { key, keyId: apiKey.id };
}

export async function revokeApiKey(keyId: string, userId: string) {
  return prisma.apiKey.update({
    where: { id: keyId },
    data: { revokedAt: new Date() },
  });
}

export async function listApiKeys(userId: string) {
  return prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
