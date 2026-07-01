import { NextRequest, NextResponse } from "next/server";
import { createMagicLink, isWhitelisted } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  if (!(await isWhitelisted(email))) {
    // Stil falen om e-mailadressen niet te onthullen
    return NextResponse.json({
      ok: true,
      message:
        "Als dit adres bekend is bij de club, ontvang je zo een inloglink. Vraag de beheerder als je geen mail krijgt.",
    });
  }

  const relativeUrl = await createMagicLink(email);
  // Build a full URL based on the current request so it's clickable from the same origin.
  const fullUrl = new URL(relativeUrl, req.url).toString();
  // In PoC: log naar server console + ook terugsturen op de dev pagina (/dev/magic-links)
  console.log(`\n=== MAGIC LINK voor ${email} ===\n${fullUrl}\n================================\n`);

  return NextResponse.json({
    ok: true,
    message: "Inloglink aangemaakt. Bekijk /dev/magic-links of de server-console.",
  });
}
