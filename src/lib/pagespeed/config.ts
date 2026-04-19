import { prisma } from "@/lib/db";

const KEY = "pagespeed_api_key";

async function readSetting(): Promise<string | null> {
  const row = await prisma.settings.findUnique({ where: { key: KEY } });
  return row?.value || null;
}

export async function getPagespeedApiKey(): Promise<string | undefined> {
  const db = await readSetting();
  const env = process.env.PAGESPEED_API_KEY;
  return db || env || undefined;
}

export interface PagespeedConfigStatus {
  configured: boolean;
  source: "db" | "env" | null;
  keyPreview: string | null;
}

function preview(key: string): string {
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export async function getPagespeedConfigStatus(): Promise<PagespeedConfigStatus> {
  const db = await readSetting();
  if (db) return { configured: true, source: "db", keyPreview: preview(db) };
  const env = process.env.PAGESPEED_API_KEY;
  if (env) return { configured: true, source: "env", keyPreview: preview(env) };
  return { configured: false, source: null, keyPreview: null };
}

export async function savePagespeedApiKey(key: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key: KEY },
    create: { key: KEY, value: key.trim() },
    update: { value: key.trim() },
  });
}

export async function clearPagespeedApiKey(): Promise<void> {
  await prisma.settings.delete({ where: { key: KEY } }).catch(() => undefined);
}
