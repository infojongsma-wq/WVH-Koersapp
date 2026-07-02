import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, isWhitelisted } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  if (!(await isWhitelisted(email))) {
    // Same generic reply as success so e-mail addresses aren't revealed.
    return NextResponse.json({
      ok: true,
      message:
        "Als dit adres bekend is bij de club, kun je zo inloggen. Geen knop? Vraag de beheerder om je e-mailadres toe te voegen.",
    });
  }

  // PoC: no real e-mail sending yet. The login link is returned directly and
  // shown as a button. The whitelist is the access gate; real e-mail
  // verification arrives when we hook up an e-mail provider.
  const loginUrl = await createMagicLink(email);

  return NextResponse.json({
    ok: true,
    message: "Inloglink aangemaakt — klik op de knop hieronder.",
    loginUrl,
  });
}
