import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isMailConfigured, verifyMail } from "@/lib/mail";

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
    HAS_SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    HAS_ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
    SMTP_HOST: process.env.SMTP_HOST ?? null,
    SMTP_PORT: process.env.SMTP_PORT ?? null,
    SMTP_USER: process.env.SMTP_USER ?? null,
    MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS ?? null,
    NODE_ENV: process.env.NODE_ENV ?? null,
  };

  // Test the SMTP credentials without sending a mail — surfaces the exact
  // reason (bad login, unverified sender, account not activated, ...).
  const smtp = isMailConfigured()
    ? await verifyMail()
    : { ok: false, error: "SMTP niet geconfigureerd" };

  return NextResponse.json({
    ok: dbOk && smtp.ok,
    env,
    db: { ok: dbOk, error: dbError },
    smtp,
    user: user ? { email: user.email, role: user.role, name: user.name } : null,
    timestamp: new Date().toISOString(),
  });
}
