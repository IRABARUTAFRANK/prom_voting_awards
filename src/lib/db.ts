import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  sqliteTuned?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** SQLite WAL + busy timeout — better concurrent reads under nginx/PM2. */
export async function tuneSqliteForConcurrency() {
  if (globalForPrisma.sqliteTuned) return;
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("file:")) return;
  try {
    await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 10000");
    await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL");
    await prisma.$queryRawUnsafe("PRAGMA cache_size = -64000");
    globalForPrisma.sqliteTuned = true;
  } catch {
    /* ignore if DB not ready */
  }
}

export async function getSettings() {
  await tuneSqliteForConcurrency();
  return prisma.systemSettings.upsert({
    where: { id: 1 },
    create: { id: 1, minApprovedVoters: 1 },
    update: {},
  });
}
