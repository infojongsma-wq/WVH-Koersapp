import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// Quick diagnostics page — visit /api/diag in the browser to see whether
// the required environment variables and connections are present.
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
    VERCEL: process.env.VERCEL ?? null,
    VERCEL_ENV: process.env.VERCEL_ENV ?? null,
    HAS_DATABASE_URL: Boolean(process.env.DATABASE_URL),
    HAS_BLOB_READ_WRITE_TOKEN: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    BLOB_TOKEN_PREFIX:
      process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 20) ?? null,
    HAS_SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    HAS_ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  return NextResponse.json({
    ok: dbOk && env.HAS_BLOB_READ_WRITE_TOKEN,
    env,
    db: { ok: dbOk, error: dbError },
    user: user
      ? { email: user.email, role: user.role, name: user.name }
      : null,
    timestamp: new Date().toISOString(),
  });
}
