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

  const goingAll = ride.participations.filter((p) => p.status === "GOING");
  const goingMain = goingAll.slice(0, ride.maxParticipants);
  const waitlist = goingAll.slice(ride.maxParticipants);
  const interested = ride.participations.filter((p) => p.status === "INTERESTED");
  const notGoing = ride.participations.filter((p) => p.status === "NOT_GOING");

  const myParticipation = ride.participations.find((p) => p.userId === user.id);
  const isFull = goingMain.length >= ride.maxParticipants;
  const seatsLeft = Math.max(0, ride.maxParticipants - goingMain.length);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10 space-y-5">
      <Link href="/" className="text-sm text-ink-muted hover:text-ink inline-flex items-center gap-1">
        <span aria-hidden>←</span> Terug naar overzicht
      </Link>

      {/* Header card */}
      <div className="card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <LevelBadge level={ride.level} />
          <CategoryBadge category={ride.category} />
          {ride.coffeeStop && <span className="chip">☕ Koffiestop</span>}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
          {ride.title}
        </h1>
        <p className="text-ink-muted capitalize">
          {formatDateNL(ride.datetime)} · vertrek {formatTimeNL(ride.datetime)}
        </p>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Afstand" value={`${ride.distanceKm} km`} />
          <Stat label="Gem. snelheid" value={`${ride.avgSpeedKmh} km/u`} />
          <Stat label="Wegkapitein" value={ride.captainName || "—"} />
          <Stat label="Koffiestop" value={ride.coffeeStop ? "Ja" : "Nee"} />
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
          <div className="mt-6 pt-6 border-t border-cream-200">
            <h3 className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-2">
              Omschrijving
            </h3>
            <p className="whitespace-pre-wrap text-ink leading-relaxed">
              {ride.description}
            </p>
          </div>
        )}
        {ride.notes && (
          <div className="mt-4 pt-4 border-t border-cream-200">
            <h3 className="text-xs uppercase tracking-wide font-semibold text-ink-muted mb-2">
              Opmerkingen
            </h3>
            <p className="whitespace-pre-wrap text-ink leading-relaxed">
              {ride.notes}
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-cream-200 text-xs text-ink-muted">
          Aangemaakt door {ride.createdBy.name ?? ride.createdBy.email}
        </div>
      </div>

      {/* Map + GPX */}
      {(routeCoords || ride.gpxFilename) && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">Route</h2>
            {ride.gpxFilename && (
              <a
                href={`/api/rides/${ride.id}/gpx`}
                className="btn-outline"
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

      {/* Participants */}
      <div className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold mb-1">
          Deelnemers{" "}
          <span className="font-normal text-ink-muted text-base">
            {goingMain.length}/{ride.maxParticipants}
            {waitlist.length > 0 && ` · ${waitlist.length} wachtlijst`}
          </span>
        </h2>
        {seatsLeft > 0 && (
          <p className="text-xs text-ink-muted mb-4">
            Nog {seatsLeft} plek{seatsLeft === 1 ? "" : "ken"} vrij
          </p>
        )}
        {goingMain.length === 0 && (
          <p className="text-ink-muted text-sm italic mb-3">Nog geen aanmeldingen.</p>
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
            color="text-ink-muted"
            items={notGoing.map((p) => p.user)}
            muted
          />
        )}
      </div>

      {/* Comments */}
      <div className="card p-5 md:p-6">
        <h2 className="font-display text-xl font-bold mb-4">
          Opmerkingen{" "}
          <span className="font-normal text-ink-muted text-base">
            ({ride.comments.length})
          </span>
        </h2>
        <div className="space-y-4 mb-5">
          {ride.comments.length === 0 && (
            <p className="text-ink-muted text-sm italic">Nog geen reacties.</p>
          )}
          {ride.comments.map((c) => (
            <div
              key={c.id}
              className="border-l-2 border-wvh-yellow pl-3 py-1"
            >
              <div className="text-xs text-ink-muted">
                <strong className="text-ink">
                  {c.user.name ?? c.user.email}
                </strong>{" "}
                · {formatDateNL(c.createdAt)} {formatTimeNL(c.createdAt)}
              </div>
              <p className="text-sm whitespace-pre-wrap text-ink mt-0.5">{c.body}</p>
            </div>
          ))}
        </div>
        <CommentForm rideId={ride.id} />
      </div>
    </div>
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
      <div className="text-[11px] uppercase tracking-wide text-ink-muted font-semibold">
        {label}
      </div>
      <div className="font-medium text-ink mt-0.5">{value}</div>
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
    <div className="mb-4">
      <h3 className={`text-xs font-semibold uppercase tracking-wide ${color} mb-1.5`}>
        {icon} {title} ({items.length})
      </h3>
      <ul className={`text-sm space-y-0.5 ${muted ? "text-ink-muted" : "text-ink"}`}>
        {items.map((u, i) => (
          <li key={i}>
            {u.name ?? u.email}
            {u.level && (
              <span className="text-xs text-ink-muted ml-1">· {u.level}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
