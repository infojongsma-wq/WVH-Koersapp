import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED_STATUSES = new Set(["PUBLISHED", "HIDDEN", "CANCELLED"]);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  if (user.role !== "ADMIN")
    return NextResponse.json({ error: "Geen admin" }, { status: 403 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!ALLOWED_STATUSES.has(status))
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });
  await prisma.ride.update({ where: { id }, data: { status } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  if (user.role !== "ADMIN")
    return NextResponse.json({ error: "Geen admin" }, { status: 403 });
  const { id } = await ctx.params;
  await prisma.ride.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
