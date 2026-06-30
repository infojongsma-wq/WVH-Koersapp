import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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

  const filePath = path.join(process.cwd(), "public", "uploads", ride.gpxFilename);
  try {
    const buf = await readFile(filePath);
    const filename = ride.gpxOriginalName ?? ride.gpxFilename;
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/gpx+xml",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Bestand niet gevonden" }, { status: 404 });
  }
}
