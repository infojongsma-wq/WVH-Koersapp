import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function adminOr401() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Niet ingelogd" }, { status: 401 }) };
  if (user.role !== "ADMIN")
    return { error: NextResponse.json({ error: "Geen admin" }, { status: 403 }) };
  return { user };
}

export async function POST(req: NextRequest) {
  const auth = await adminOr401();
  if ("error" in auth) return auth.error;
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const note = String(body.note ?? "").trim() || null;
  if (!email || !email.includes("@"))
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  await prisma.whitelistEntry.upsert({
    where: { email },
    create: { email, note, addedBy: auth.user.id },
    update: { note },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await adminOr401();
  if ("error" in auth) return auth.error;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ontbreekt" }, { status: 400 });
  await prisma.whitelistEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
