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
    } catch (err) {
      console.error("[mail] send failed:", err);
      return NextResponse.json(
        { error: "Versturen van de inloglink is mislukt. Probeer het later opnieuw." },
        { status: 500 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: "Gelukt! We hebben je een inloglink gemaild. Check je inbox (en je spam-map).",
    });
  }

  // Fallback (no SMTP configured yet): return the link so the app stays usable.
  return NextResponse.json({
    ok: true,
    message: "Inloglink aangemaakt — klik op de knop hieronder.",
    loginUrl: relativeUrl,
  });
}
