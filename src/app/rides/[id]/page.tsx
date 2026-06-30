import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { readFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LevelBadge } from "@/components/LevelBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { formatDateNL, formatTimeNL } from "@/lib/format";
import { parseGpx } from "@/lib/gpx";
import ParticipationButtons from "@/components/ParticipationButtons";
import CommentForm from "@/components/CommentForm";
import MapPreview from "@/components/MapPreviewLoader";

export const dynamic = "force-dynamic";

export default async function RideDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      participations: {
        include: { user: { select: { name: true, email: true, level: true } } },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ride) notFound();

  // GPX parsing (only if file exists)
  let routeCoords: [number, number][] | undefined;
  if (ride.gpxFilename) {
    try {
      const xml = await readFile(
        path.join(process.cwd(), "public", "uploads", ride.gpxFilename),
        "utf8"
      );
      const parsed = parseGpx(xml);
      if (parsed) routeCoords = parsed.coordinates;
    } catch {
      // ignore
    }
  }

  // Sort participations into groups + waitlist
  const goingAll = ride.participations.filter((p) => p.status === "GOING");
  const goingMain = goingAll.slice(0, ride.maxParticipants);
  const waitlist = goingAll.slice(ride.maxParticipants);
  const interested = ride.participations.filter((p) => p.status === "INTERESTED");
  const notGoing = ride.participations.filter((p) => p.status === "NOT_GOING");

  const myParticipation = ride.participations.find((p) => p.userId === user.id);
  const isFull = goingMain.length >= ride.maxParticipants;
  const seatsLeft = Math.max(0, ride.maxParticipants - goingMain.length);

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
      <Link href="/" className="text-sm text-zinc-500 hover:text-wvh">
        ← Terug naar overzicht
      </Link>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <LevelBadge level={ride.level} />
          <CategoryBadge category={ride.category} />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{ride.title}</h1>
        <p className="text-zinc-600 capitalize">
          {formatDateNL(ride.datetime)} · vertrek {formatTimeNL(ride.datetime)}
        </p>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Afstand" value={`${ride.distanceKm} km`} />
          <Stat label="Gem. snelheid" value={`${ride.avgSpeedKmh} km/u`} />
          <Stat label="Wegkapitein" value={ride.captainName || "—"} />
          <Stat label="Koffiestop" value={ride.coffeeStop ? "Ja ☕" : "Nee"} />
          <Stat label="Start" value={ride.startLocation} className="col-span-2" />
          {ride.windDirection && (
            <Stat
              label="Verwachting wind"
              value={`${ride.windDirection} · ${Math.round(ride.windSpeedKmh ?? 0)} km/u`}
            />
          )}
          {ride.weatherSummary && (
            <Stat
              label="Verwachting weer"
              value={`${ride.weatherSummary}${
                ride.weatherTempC != null ? ` · ${Math.round(ride.weatherTempC)}°C` : ""
              }`}
            />
          )}
        </div>

        {ride.description && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-zinc-500 mb-1">Omschrijving</h3>
            <p className="whitespace-pre-wrap text-zinc-800">{ride.description}</p>
          </div>
        )}
        {ride.notes && (
          <div className="mt-3 pt-3 border-t">
            <h3 className="text-sm font-semibold text-zinc-500 mb-1">Opmerkingen</h3>
            <p className="whitespace-pre-wrap text-zinc-800">{ride.notes}</p>
          </div>
        )}

        <div className="mt-3 pt-3 border-t text-xs text-zinc-500">
          Aangemaakt door {ride.createdBy.name ?? ride.createdBy.email}
        </div>
      </div>

      {(routeCoords || ride.gpxFilename) && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Route</h2>
            {ride.gpxFilename && (
              <a
                href={`/api/rides/${ride.id}/gpx`}
                className="text-sm text-wvh hover:underline"
              >
                ⬇ Download .gpx
              </a>
            )}
          </div>
          <MapPreview
            coordinates={routeCoords}
            startLat={ride.startLat}
            startLon={ride.startLon}
          />
        </div>
      )}

      <ParticipationButtons
        rideId={ride.id}
        initial={(myParticipation?.status ?? null) as "GOING" | "INTERESTED" | "NOT_GOING" | null}
        isFull={isFull}
      />

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-3">
          Deelnemers ({goingMain.length}/{ride.maxParticipants}
          {waitlist.length > 0 && ` · ${waitlist.length} wachtlijst`})
        </h2>
        {seatsLeft > 0 && (
          <p className="text-xs text-zinc-500 mb-2">
            Nog {seatsLeft} plek{seatsLeft === 1 ? "" : "ken"} vrij
          </p>
        )}
        {goingMain.length === 0 && (
          <p className="text-zinc-400 text-sm italic mb-3">Nog geen aanmeldingen.</p>
        )}
        <ParticipantList
          title="Rijdt mee"
          icon="✓"
          color="text-green-700"
          items={goingMain.map((p) => p.user)}
        />
        {waitlist.length > 0 && (
          <ParticipantList
            title="Wachtlijst"
            icon="⏳"
            color="text-amber-700"
            items={waitlist.map((p) => p.user)}
          />
        )}
        {interested.length > 0 && (
          <ParticipantList
            title="Geïnteresseerd"
            icon="🤔"
            color="text-amber-700"
            items={interested.map((p) => p.user)}
          />
        )}
        {notGoing.length > 0 && (
          <ParticipantList
            title="Niet mee"
            icon="—"
            color="text-zinc-500"
            items={notGoing.map((p) => p.user)}
            muted
          />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-3">Opmerkingen ({ride.comments.length})</h2>
        <div className="space-y-3 mb-4">
          {ride.comments.length === 0 && (
            <p className="text-zinc-400 text-sm italic">Nog geen reacties.</p>
          )}
          {ride.comments.map((c) => (
            <div key={c.id} className="border-l-2 border-wvh/30 pl-3">
              <div className="text-xs text-zinc-500">
                <strong className="text-zinc-700">
                  {c.user.name ?? c.user.email}
                </strong>{" "}
                · {formatDateNL(c.createdAt)} {formatTimeNL(c.createdAt)}
              </div>
              <p className="text-sm whitespace-pre-wrap text-zinc-800">{c.body}</p>
            </div>
          ))}
        </div>
        <CommentForm rideId={ride.id} />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function ParticipantList({
  title,
  icon,
  color,
  items,
  muted,
}: {
  title: string;
  icon: string;
  color: string;
  items: { name: string | null; email: string; level: string | null }[];
  muted?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <h3 className={`text-xs font-semibold ${color} mb-1`}>
        {icon} {title} ({items.length})
      </h3>
      <ul className={`text-sm ${muted ? "text-zinc-400" : "text-zinc-800"}`}>
        {items.map((u, i) => (
          <li key={i}>
            {u.name ?? u.email}
            {u.level && <span className="text-xs text-zinc-400 ml-1">· {u.level}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
