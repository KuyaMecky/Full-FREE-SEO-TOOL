import crypto from "crypto";
import bcrypt from "bcryptjs";

const PREFIX = "seo_live_";
const KEY_LENGTH = 32;
const BCRYPT_COST = 10;

export function generateApiKey(): { fullKey: string; prefix: string } {
  const randomBytes = crypto.randomBytes(KEY_LENGTH).toString("hex");
  const fullKey = `${PREFIX}${randomBytes}`;
  const prefix = fullKey.slice(0, 16);
  return { fullKey, prefix };
}

export async function hashApiKey(fullKey: string): Promise<string> {
  return bcrypt.hash(fullKey, BCRYPT_COST);
}

export async function verifyApiKey(fullKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(fullKey, hash);
}

export function extractPrefix(fullKey: string): string {
  return fullKey.slice(0, 16);
}
