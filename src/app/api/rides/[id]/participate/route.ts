import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ALLOWED = new Set(["GOING", "INTERESTED", "NOT_GOING"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status ?? "");
  if (!ALLOWED.has(status))
    return NextResponse.json({ error: "Ongeldige status" }, { status: 400 });

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return NextResponse.json({ error: "Rit niet gevonden" }, { status: 404 });

  const existing = await prisma.participation.findUnique({
    where: { rideId_userId: { rideId: id, userId: user.id } },
  });

  if (existing) {
    await prisma.participation.update({
      where: { id: existing.id },
      data: { status },
    });
  } else {
    await prisma.participation.create({
      data: { rideId: id, userId: user.id, status },
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { id } = await ctx.params;
  await prisma.participation.deleteMany({
    where: { rideId: id, userId: user.id },
  });
  return NextResponse.json({ ok: true });
}
