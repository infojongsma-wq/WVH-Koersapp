import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE = "wvh_session";
const MAGIC_LINK_TTL_MIN = 30;
const SESSION_TTL_DAYS = 30;

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export async function createMagicLink(email: string) {
  const normalized = email.trim().toLowerCase();
  const token = randomToken();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MIN * 60 * 1000);
  await prisma.magicLinkToken.create({
    data: { token, email: normalized, expiresAt },
  });
  // Return a relative path so it works on any host (localhost, Codespaces, prod).
  return `/api/auth/verify?token=${token}`;
}

export async function consumeMagicLink(token: string) {
  const entry = await prisma.magicLinkToken.findUnique({ where: { token } });
  if (!entry) return { ok: false as const, reason: "Onbekende link" };
  if (entry.usedAt) return { ok: false as const, reason: "Link is al gebruikt" };
  if (entry.expiresAt < new Date())
    return { ok: false as const, reason: "Link is verlopen — vraag een nieuwe aan" };

  await prisma.magicLinkToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return { ok: true as const, email: entry.email };
}

export async function isWhitelisted(email: string) {
  const e = email.trim().toLowerCase();
  const hit = await prisma.whitelistEntry.findUnique({ where: { email: e } });
  return Boolean(hit);
}

export async function getOrCreateUser(email: string) {
  const normalized = email.trim().toLowerCase();
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  let user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalized,
        role: adminEmails.includes(normalized) ? "ADMIN" : "MEMBER",
      },
    });
  } else if (adminEmails.includes(normalized) && user.role !== "ADMIN") {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    });
  }
  return user;
}

export async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 3600 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    return session.user;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
