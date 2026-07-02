import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Diagnostics — open /api/diag in the browser to check deployment health.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser().catch(() => null);

  let dbOk = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const env = {
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    COMMIT: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    HAS_DATABASE_URL: Boolean(process.env.DATABASE_URL),
    HAS_BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    HAS_SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    HAS_ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  return NextResponse.json({
    ok: dbOk && env.HAS_BLOB_READ_WRITE_TOKEN,
    env,
    db: { ok: dbOk, error: dbError },
    user: user ? { email: user.email, role: user.role, name: user.name } : null,
    timestamp: new Date().toISOString(),
  });
}
