import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fetchWeatherForRide, geocodeLocation } from "@/lib/weather";
import {
  DEFAULT_START_COORDS,
  DEFAULT_START_LOCATION,
  MAX_PARTICIPANTS,
} from "@/lib/constants";
// Upload + geocode + weather can exceed the default 10s.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const level = sp.get("level");
  const scope = sp.get("scope") ?? "upcoming";

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (level) where.level = level;
  if (scope === "upcoming") where.datetime = { gte: new Date() };
  else if (scope === "past") where.datetime = { lt: new Date() };

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { datetime: scope === "past" ? "desc" : "asc" },
    include: {
      _count: { select: { participations: true } },
      participations: { select: { status: true } },
      createdBy: { select: { name: true, email: true } },
    },
    take: 200,
  });

  const shaped = rides.map((r) => {
    const going = r.participations.filter((p) => p.status === "GOING").length;
    const interested = r.participations.filter((p) => p.status === "INTERESTED").length;
    return {
      id: r.id,
      datetime: r.datetime,
      title: r.title,
      category: r.category,
      level: r.level,
      distanceKm: r.distanceKm,
      avgSpeedKmh: r.avgSpeedKmh,
      captainName: r.captainName,
      coffeeStop: r.coffeeStop,
      startLocation: r.startLocation,
      windDirection: r.windDirection,
      windSpeedKmh: r.windSpeedKmh,
      maxParticipants: r.maxParticipants,
      goingCount: Math.min(going, r.maxParticipants),
      waitlistCount: Math.max(0, going - r.maxParticipants),
      interestedCount: interested,
      createdBy: r.createdBy.name ?? r.createdBy.email,
    };
  });

  return NextResponse.json({ rides: shaped });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });

  const form = await req.formData();
  const get = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  };

  const title = get("title").trim();
  const datetimeStr = get("datetime");
  const category = get("category");
  const level = get("level");
  const distanceKm = Number(get("distanceKm"));
  const avgSpeedKmh = Number(get("avgSpeedKmh"));
  const captainName = get("captainName").trim();
  const coffeeStop = get("coffeeStop") === "on" || get("coffeeStop") === "true";
  const description = get("description").trim() || null;
  const notes = get("notes").trim() || null;
  const startLocation = get("startLocation").trim() || DEFAULT_START_LOCATION;

  if (!title || !datetimeStr || !category || !level) {
    return NextResponse.json({ error: "Vul alle verplichte velden in" }, { status: 400 });
  }
  const datetime = new Date(datetimeStr);
  if (Number.isNaN(datetime.getTime())) {
    return NextResponse.json({ error: "Ongeldige datum" }, { status: 400 });
  }
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return NextResponse.json({ error: "Ongeldig aantal kilometers" }, { status: 400 });
  }
  if (!Number.isFinite(avgSpeedKmh) || avgSpeedKmh <= 0) {
    return NextResponse.json({ error: "Ongeldige gemiddelde snelheid" }, { status: 400 });
  }

  // GPX file: stored as text in the database — no external storage needed.
  let gpxContent: string | null = null;
  let gpxOriginalName: string | null = null;
  const gpxFile = form.get("gpx");
  if (gpxFile && typeof gpxFile !== "string" && gpxFile.size > 0) {
    if (gpxFile.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "GPX-bestand is te groot (max 2MB)" },
        { status: 400 }
      );
    }
    gpxContent = await gpxFile.text();
    if (!gpxContent.includes("<gpx")) {
      return NextResponse.json(
        { error: "Dit lijkt geen geldig GPX-bestand" },
        { status: 400 }
      );
    }
    gpxOriginalName = gpxFile.name;
  }

  // Start coordinates: default club location, or geocode a custom one.
  let coords = DEFAULT_START_COORDS;
  if (startLocation !== DEFAULT_START_LOCATION) {
    const g = await geocodeLocation(startLocation).catch(() => null);
    if (g) coords = g;
  }

  // Weather is best-effort; the ride saves fine without it.
  const weather = await fetchWeatherForRide({
    lat: coords.lat,
    lon: coords.lon,
    datetime,
  }).catch(() => null);

  const ride = await prisma.ride.create({
    data: {
      title,
      datetime,
      category,
      level,
      distanceKm,
      avgSpeedKmh,
      captainName: captainName || user.name || user.email,
      coffeeStop,
      description,
      notes,
      startLocation,
      startLat: coords.lat,
      startLon: coords.lon,
      gpxOriginalName,
      maxParticipants: MAX_PARTICIPANTS,
      createdById: user.id,
      weatherFetchedAt: weather ? new Date() : null,
      weatherSummary: weather?.summary,
      weatherTempC: weather?.tempC,
      windDirection: weather?.windDirection,
      windSpeedKmh: weather?.windSpeedKmh,
      ...(gpxContent && gpxOriginalName
        ? {
            gpxFile: {
              create: { filename: gpxOriginalName, content: gpxContent },
            },
          }
        : {}),
    },
  });

  return NextResponse.json({ id: ride.id });
}
