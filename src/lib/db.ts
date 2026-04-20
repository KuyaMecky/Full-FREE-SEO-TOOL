import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrisma() {
  // Hosted deploys (Vercel etc.) set TURSO_DATABASE_URL — use libSQL over HTTP.
  // Local dev keeps using better-sqlite3 against dev.db.
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl && tursoUrl !== "undefined") {
    const libsql = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter });
  }

  const url = process.env.DATABASE_URL || "file:./dev.db";
  const path = url.replace(/^file:/, "");
  const adapter = new PrismaBetterSqlite3({ url: `file:${path}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
