import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LevelBadge } from "@/components/LevelBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
import { formatDateTimeNL } from "@/lib/format";
import { CATEGORIES, LEVELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; level?: string; tab?: string };

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const isHistory = sp.tab === "history";

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (sp.category) where.category = sp.category;
  if (sp.level) where.level = sp.level;
  where.datetime = isHistory ? { lt: new Date() } : { gte: new Date() };

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { datetime: isHistory ? "desc" : "asc" },
    include: {
      participations: { select: { status: true } },
      createdBy: { select: { name: true, email: true } },
    },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-6">
        Ritten
      </h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-cream-200 mb-6">
        <TabLink
          href={`/?${new URLSearchParams({ ...(sp.category && { category: sp.category }), ...(sp.level && { level: sp.level }) }).toString()}`}
          active={!isHistory}
        >
          Aankomende ritten
        </TabLink>
        <TabLink
          href={`/?${new URLSearchParams({ tab: "history", ...(sp.category && { category: sp.category }), ...(sp.level && { level: sp.level }) }).toString()}`}
          active={isHistory}
        >
          Ritten historie
        </TabLink>
      </div>

      {/* Action row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <Link href="/rides/new" className="btn-primary">
          <span className="text-lg leading-none">+</span> Rit toevoegen
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-muted mr-1">Filter:</span>
          <FilterChip
            href={buildHref(sp, { category: undefined })}
            active={!sp.category}
            label="Alle soorten"
          />
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              href={buildHref(sp, { category: c.value })}
              active={sp.category === c.value}
              label={`${c.emoji} ${c.label}`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs text-ink-muted mr-1">Niveau:</span>
        <FilterChip
          href={buildHref(sp, { level: undefined })}
          active={!sp.level}
          label="Alle niveaus"
        />
        {LEVELS.map((l) => (
          <FilterChip
            key={l.value}
            href={buildHref(sp, { level: l.value })}
            active={sp.level === l.value}
            label={l.label}
          />
        ))}
      </div>

      {rides.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-ink-muted mb-5">
            {isHistory
              ? "Geen ritten in de historie."
              : "Nog geen ritten gepland. Maak de eerste aan."}
          </p>
          {!isHistory && (
            <Link href="/rides/new" className="btn-primary">
              + Eerste rit toevoegen
            </Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-6 items-center px-5 py-3 border-b border-cream-200 text-xs uppercase tracking-wide text-ink-muted font-semibold">
            <span>Titel &amp; details</span>
            <span className="text-right">Deelnemers</span>
            <span className="text-right">Wind</span>
            <span className="text-right">Wanneer</span>
          </div>
          <ul className="divide-y divide-cream-200">
            {rides.map((r) => {
              const going = r.participations.filter((p) => p.status === "GOING").length;
              const interested = r.participations.filter((p) => p.status === "INTERESTED").length;
              const seatsTaken = Math.min(going, r.maxParticipants);
              const waitlist = Math.max(0, going - r.maxParticipants);
              const seatsLeft = Math.max(0, r.maxParticipants - going);
              return (
                <li key={r.id}>
                  <Link
                    href={`/rides/${r.id}`}
                    className="grid md:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-4 md:gap-6 items-center px-5 py-4 hover:bg-cream-50 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <LevelBadge level={r.level} />
                        <CategoryBadge category={r.category} />
                        {r.coffeeStop && <span className="chip">☕ Koffiestop</span>}
                      </div>
                      <h2 className="font-semibold text-ink text-base md:text-lg truncate">
                        {r.title}
                      </h2>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted mt-1">
                        <span>{r.distanceKm} km</span>
                        <span>{r.avgSpeedKmh} km/u gem.</span>
                        {r.captainName && <span>🎩 {r.captainName}</span>}
                      </div>
                    </div>

                    <div className="md:text-right shrink-0">
                      <div className="text-2xl font-bold tabular-nums leading-none">
                        <span className={seatsLeft === 0 ? "text-red-600" : "text-ink"}>
                          {seatsTaken}
                        </span>
                        <span className="text-ink-muted text-sm">/{r.maxParticipants}</span>
                      </div>
                      <div className="text-[11px] text-ink-muted mt-1">
                        {seatsLeft > 0
                          ? `${seatsLeft} vrij`
                          : waitlist > 0
                          ? `vol · ${waitlist} wachtlijst`
                          : "vol"}
                        {interested > 0 && ` · 🤔 ${interested}`}
                      </div>
                    </div>

                    <div className="md:text-right shrink-0 text-xs text-ink-muted">
                      {r.windDirection ? (
                        <span>
                          💨 {r.windDirection}{" "}
                          <span className="tabular-nums">
                            {Math.round(r.windSpeedKmh ?? 0)}
                          </span>{" "}
                          km/u
                        </span>
                      ) : (
                        <span className="opacity-40">—</span>
                      )}
                    </div>

                    <div className="md:text-right shrink-0 text-sm text-ink-muted whitespace-nowrap">
                      {formatDateTimeNL(r.datetime)}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`tab ${active ? "tab-active" : ""}`}>
      {children}
    </Link>
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
      className={`rounded-pill px-3 py-1 text-xs font-medium border transition ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-white text-ink border-cream-200 hover:bg-cream-50"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>
) {
  const next: Record<string, string> = {};
  const merged = { ...current, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v) next[k] = v;
  }
  const qs = new URLSearchParams(next).toString();
  return qs ? `/?${qs}` : "/";
}
