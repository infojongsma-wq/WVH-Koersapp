import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { streamGpxToResponse } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { id } = await ctx.params;
  const ride = await prisma.ride.findUnique({ where: { id } });
  if (!ride || !ride.gpxFilename)
    return NextResponse.json({ error: "Geen GPX" }, { status: 404 });

  const res = await streamGpxToResponse(ride.gpxFilename);
  if (!res) return NextResponse.json({ error: "Bestand niet gevonden" }, { status: 404 });

  // Add filename hint for local downloads (Vercel Blob redirects handle their own).
  if (!ride.gpxFilename.startsWith("http")) {
    const filename = ride.gpxOriginalName ?? ride.gpxFilename;
    res.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  }
  return res;
}
