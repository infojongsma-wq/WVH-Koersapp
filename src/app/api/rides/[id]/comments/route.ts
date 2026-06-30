import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Leeg" }, { status: 400 });
  if (text.length > 2000)
    return NextResponse.json({ error: "Te lang (max 2000 tekens)" }, { status: 400 });

  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride) return NextResponse.json({ error: "Rit niet gevonden" }, { status: 404 });

  await prisma.comment.create({
    data: { rideId: id, userId: user.id, body: text },
  });
  return NextResponse.json({ ok: true });
}
