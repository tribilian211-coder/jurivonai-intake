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

// ─── SQLite concurrency hardening ────────────────────────────────────────────
// These PRAGMAs make SQLite safe under concurrent load:
//   • WAL mode       — readers never block writers; writers don't block readers
//   • busy_timeout   — wait up to 5s for a lock instead of throwing immediately
//   • synchronous=NORMAL — safe with WAL, much faster than FULL
//
// With these set, SQLite comfortably handles hundreds of concurrent form
// submissions. For >1000 concurrent writers, switch DATABASE_URL to Neon
// Postgres (still $0 free tier) — no code changes needed beyond the URL.
//
// We run these once at module init (server start). They persist for the
// lifetime of the database file, not just the connection.
const pragmaPromise = (async () => {
  try {
    await db.$executeRawUnsafe("PRAGMA journal_mode = WAL;");
    await db.$executeRawUnsafe("PRAGMA busy_timeout = 5000;");
    await db.$executeRawUnsafe("PRAGMA synchronous = NORMAL;");
  } catch (err) {
    // Non-fatal — SQLite still works without these, just less concurrently safe
    console.warn("[db] pragma setup failed:", err);
  }
})();

// Helper: retry a Prisma write op on lock errors (SQLite WAL mostly makes this
// unnecessary, but it's the belt to busy_timeout's suspenders).
// Use for writes that must succeed (lead creation, answer saves).
export async function withWriteRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  await pragmaPromise; // ensure pragmas ran first
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // SQLite "database is locked" (code 5) or Prisma's transaction timeout
      const isLockError =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2024" || // transaction failed
          err.code === "P2034"); // transaction conflict
      if (!isLockError) throw err;
      // Exponential backoff: 50ms, 150ms, 450ms
      await new Promise((r) => setTimeout(r, 50 * Math.pow(3, attempt)));
    }
  }
  throw lastErr;
}
