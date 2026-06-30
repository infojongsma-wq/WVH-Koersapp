import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LevelBadge } from "@/components/LevelBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { formatDateTimeNL } from "@/lib/format";
import { CATEGORIES, LEVELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; level?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const where: Record<string, unknown> = {
    status: "PUBLISHED",
    datetime: { gte: new Date() },
  };
  if (sp.category) where.category = sp.category;
  if (sp.level) where.level = sp.level;

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { datetime: "asc" },
    include: {
      participations: { select: { status: true } },
      createdBy: { select: { name: true, email: true } },
    },
    take: 100,
  });

  const filtered = sp.category || sp.level;

  return (
    <main className="max-w-5xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">Aankomende ritten</h1>
        <Link
          href="/rides/new"
          className="bg-wvh hover:bg-wvh-dark text-white font-semibold px-4 py-2 rounded-lg text-sm md:text-base"
        >
          + Rit toevoegen
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-zinc-500 mr-1">Filter:</span>
          <FilterChip
            href={buildHref({ ...sp, category: undefined })}
            active={!sp.category}
            label="Alle soorten"
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              href={buildHref({ ...sp, category: c.value })}
              active={sp.category === c.value}
              label={`${c.emoji} ${c.label}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center mt-2 pt-2 border-t">
          <span className="text-xs text-zinc-500 mr-1">Niveau:</span>
          <FilterChip
            href={buildHref({ ...sp, level: undefined })}
            active={!sp.level}
            label="Alle niveaus"
          />
          {LEVELS.map((l) => (
            <FilterChip
              key={l.value}
              href={buildHref({ ...sp, level: l.value })}
              active={sp.level === l.value}
              label={l.label}
            />
          ))}
        </div>
      </div>

      {rides.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-zinc-500 mb-4">
            {filtered
              ? "Geen ritten gevonden met deze filters."
              : "Nog geen ritten gepland. Maak de eerste aan!"}
          </p>
          {!filtered && (
            <Link
              href="/rides/new"
              className="inline-block bg-wvh text-white px-5 py-2 rounded-lg"
            >
              + Eerste rit toevoegen
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((r) => {
            const going = r.participations.filter((p) => p.status === "GOING").length;
            const interested = r.participations.filter((p) => p.status === "INTERESTED").length;
            const seatsTaken = Math.min(going, r.maxParticipants);
            const waitlist = Math.max(0, going - r.maxParticipants);
            const seatsLeft = Math.max(0, r.maxParticipants - going);
            return (
              <Link
                key={r.id}
                href={`/rides/${r.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition p-4 border border-transparent hover:border-wvh/20"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <LevelBadge level={r.level} />
                      <CategoryBadge category={r.category} />
                      <span className="text-xs text-zinc-500">
                        {formatDateTimeNL(r.datetime)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-900 truncate">
                      {r.title}
                    </h2>
                    <p className="text-sm text-zinc-600">
                      {r.distanceKm} km · {r.avgSpeedKmh} km/u
                      {r.captainName && <> · 🎩 {r.captainName}</>}
                      {r.coffeeStop && <> · ☕ koffiestop</>}
                      {r.windDirection && (
                        <> · 💨 {r.windDirection} {Math.round(r.windSpeedKmh ?? 0)} km/u</>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <div className="text-2xl font-bold tabular-nums">
                      <span className={seatsLeft === 0 ? "text-red-600" : "text-wvh"}>
                        {seatsTaken}
                      </span>
                      <span className="text-zinc-400 text-sm">/{r.maxParticipants}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {seatsLeft > 0
                        ? `${seatsLeft} plek${seatsLeft === 1 ? "" : "ken"} vrij`
                        : waitlist > 0
                        ? `vol · ${waitlist} wachtlijst`
                        : "vol"}
                    </div>
                    {interested > 0 && (
                      <div className="text-xs text-zinc-400 mt-1">
                        🤔 {interested} geïnteresseerd
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        active
          ? "bg-wvh text-white border-wvh"
          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (entries.length === 0) return "/";
  const qs = new URLSearchParams(entries as [string, string][]).toString();
  return `/?${qs}`;
}
