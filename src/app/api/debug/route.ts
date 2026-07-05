import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// TEMPORARY debug endpoint — exposes the actual database error.
// DELETE THIS FILE before going to production.
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.substring(0, 30) + "..."
      : "NOT SET",
    databaseUrlHasSslMode: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.includes("sslmode=require")
      : false,
    databaseUrlIsPooled: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.includes("-pooler")
      : false,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
  };

  // Test 1: Can we instantiate the Prisma client at all?
  try {
    diagnostics.prismaClientCreated = true;
  } catch (err) {
    diagnostics.prismaClientCreated = false;
    diagnostics.prismaClientError = String(err);
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Test 2: Can we connect and run a simple query?
  try {
    const result = await db.$queryRaw`SELECT 1 as test`;
    diagnostics.connectionTest = "SUCCESS";
    diagnostics.queryResult = result;
  } catch (err) {
    diagnostics.connectionTest = "FAILED";
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      diagnostics.errorCode = err.code;
      diagnostics.errorMessage = err.message;
    } else if (err instanceof Prisma.PrismaClientInitializationError) {
      diagnostics.errorCode = "INIT_" + err.errorCode;
      diagnostics.errorMessage = err.message;
    } else {
      diagnostics.errorCode = "UNKNOWN";
      diagnostics.errorMessage = err instanceof Error ? err.message : String(err);
    }
    return NextResponse.json(diagnostics, { status: 500 });
  }

  // Test 3: Does the Response table exist?
  try {
    const count = await db.response.count();
    diagnostics.tableExists = true;
    diagnostics.rowCount = count;
  } catch (err) {
    diagnostics.tableExists = false;
    diagnostics.tableError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
