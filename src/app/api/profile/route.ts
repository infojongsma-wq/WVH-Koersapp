import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const VALID_LEVELS = new Set(["A", "AB", "B", "C", "D", "VROUWEN"]);

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const level = String(body.level ?? "").trim();
  if (!name) return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
  if (level && !VALID_LEVELS.has(level))
    return NextResponse.json({ error: "Ongeldig niveau" }, { status: 400 });

  await prisma.user.update({
    where: { id: user.id },
    data: { name, level: level || null },
  });
  return NextResponse.json({ ok: true });
}
