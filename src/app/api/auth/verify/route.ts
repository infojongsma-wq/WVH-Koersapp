import { NextRequest, NextResponse } from "next/server";
import {
  consumeMagicLink,
  createSession,
  getOrCreateUser,
  isWhitelisted,
  setSessionCookie,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }
  const result = await consumeMagicLink(token);
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(result.reason)}`, req.url)
    );
  }
  if (!(await isWhitelisted(result.email))) {
    return NextResponse.redirect(
      new URL("/login?error=Adres+niet+op+whitelist", req.url)
    );
  }
  const user = await getOrCreateUser(result.email);
  const session = await createSession(user.id);
  await setSessionCookie(session.token, session.expiresAt);

  // Eerste keer? Stuur naar profielpagina om naam/niveau in te vullen.
  const needsProfile = !user.name || !user.level;
  return NextResponse.redirect(new URL(needsProfile ? "/profile" : "/", req.url));
}
