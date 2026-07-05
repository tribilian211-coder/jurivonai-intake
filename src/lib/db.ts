import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma singleton — prevents connection exhaustion on hot reload / serverless.
// One client per Node process; reused across requests.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// ─── Database concurrency hardening ──────────────────────────────────────────
// SQLite-only PRAGMAs. On PostgreSQL (Vercel/Neon), these are skipped — Postgres
// handles concurrency natively with MVCC, no PRAGMA tuning needed.
//
// SQLite: WAL mode lets readers not block writers; busy_timeout waits 5s for a
// lock instead of throwing; synchronous=NORMAL is safe with WAL and much faster.
//
// We detect SQLite by checking the DATABASE_URL scheme (file: = SQLite).
const isSQLite =
  typeof process !== "undefined" &&
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL.startsWith("file:");

const pragmaPromise = (async () => {
  if (!isSQLite) return; // skip on Postgres
  try {
    await db.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
    await db.$executeRawUnsafe("PRAGMA busy_timeout = 5000;");
    await db.$executeRawUnsafe("PRAGMA synchronous = NORMAL;");
  } catch (err) {
    console.warn("[db] pragma setup failed:", err);
  }
})();

// Helper: retry a Prisma write op on lock errors (SQLite only).
// On Postgres, this is a pass-through (no lock errors possible with MVCC).
export async function withWriteRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  await pragmaPromise;
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLockError =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2024" || err.code === "P2034");
      if (!isLockError) throw err;
      await new Promise((r) => setTimeout(r, 50 * Math.pow(3, attempt)));
    }
  }
  throw lastErr;
}
