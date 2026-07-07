import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, isWhitelisted } from "@/lib/auth";
import { isMailConfigured, sendMagicLinkEmail } from "@/lib/mail";

function getBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
}

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
        "Als dit adres bekend is bij de club, ontvang je zo een inloglink. Geen mail? Vraag de beheerder om je e-mailadres toe te voegen.",
    });
  }

  const relativeUrl = await createMagicLink(email);
  const fullUrl = getBaseUrl(req) + relativeUrl;

  if (isMailConfigured()) {
    try {
      await sendMagicLinkEmail(email, fullUrl);
      return NextResponse.json({
        ok: true,
        message: "Gelukt! We hebben je een inloglink gemaild. Check je inbox (en je spam-map).",
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("[mail] send failed:", reason);
      // Don't lock anyone out: fall back to the on-screen link and show why
      // the e-mail failed so the mail setup can be fixed.
      return NextResponse.json({
        ok: true,
        message: `De inlogmail kon niet verstuurd worden (reden: ${reason}). Gebruik voorlopig de knop hieronder om in te loggen.`,
        loginUrl: relativeUrl,
      });
    }
  }

  // Fallback (no SMTP configured yet): return the link so the app stays usable.
  return NextResponse.json({
    ok: true,
    message: "Inloglink aangemaakt — klik op de knop hieronder.",
    loginUrl: relativeUrl,
  });
}
