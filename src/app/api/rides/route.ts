import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fetchWeatherForRide, geocodeLocation } from "@/lib/weather";
import { DEFAULT_START_COORDS, DEFAULT_START_LOCATION, MAX_PARTICIPANTS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const level = sp.get("level");
  const scope = sp.get("scope") ?? "upcoming"; // "upcoming" | "all" | "past"

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

  // Coords for weather: use default if location is default, else geocode
  let coords = DEFAULT_START_COORDS;
  if (startLocation !== DEFAULT_START_LOCATION) {
    const g = await geocodeLocation(startLocation);
    if (g) coords = g;
  }

  // GPX upload
  let gpxFilename: string | null = null;
  let gpxOriginalName: string | null = null;
  const gpxFile = form.get("gpx");
  if (gpxFile && typeof gpxFile !== "string" && gpxFile.size > 0) {
    const safeBase = gpxFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}_${randomBytes(4).toString("hex")}_${safeBase}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const buf = Buffer.from(await gpxFile.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buf);
    gpxFilename = filename;
    gpxOriginalName = gpxFile.name;
  }

  // Weather
  const weather = await fetchWeatherForRide({
    lat: coords.lat,
    lon: coords.lon,
    datetime,
  });

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
      gpxFilename,
      gpxOriginalName,
      maxParticipants: MAX_PARTICIPANTS,
      createdById: user.id,
      weatherFetchedAt: weather ? new Date() : null,
      weatherSummary: weather?.summary,
      weatherTempC: weather?.tempC,
      windDirection: weather?.windDirection,
      windSpeedKmh: weather?.windSpeedKmh,
    },
  });

  return NextResponse.json({ id: ride.id });
}
