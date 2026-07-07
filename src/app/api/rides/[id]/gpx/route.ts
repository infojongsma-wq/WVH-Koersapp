import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isRemoteRef, readGpxContent } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  const { id } = await ctx.params;
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: { gpxFile: true },
  });
  if (!ride) return NextResponse.json({ error: "Rit niet gevonden" }, { status: 404 });

  // New style: GPX content lives in the database.
  if (ride.gpxFile) {
    return new NextResponse(ride.gpxFile.content, {
      headers: {
        "Content-Type": "application/gpx+xml",
        "Content-Disposition": `attachment; filename="${ride.gpxFile.filename}"`,
      },
    });
  }

  // Legacy: gpxFilename referencing an external URL or local upload.
  if (ride.gpxFilename) {
    if (isRemoteRef(ride.gpxFilename)) {
      return NextResponse.redirect(ride.gpxFilename, 302);
    }
    const content = await readGpxContent(ride.gpxFilename);
    if (content) {
      return new NextResponse(content, {
        headers: {
          "Content-Type": "application/gpx+xml",
          "Content-Disposition": `attachment; filename="${
            ride.gpxOriginalName ?? "route.gpx"
          }"`,
        },
      });
    }
  }

  return NextResponse.json({ error: "Geen GPX" }, { status: 404 });
}
